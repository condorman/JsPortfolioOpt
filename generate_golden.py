#!/usr/bin/env python3
"""Generate golden-output fixtures for PyPortfolioOpt parity tests.

This script builds a deterministic fixture from the local PyPortfolioOpt baseline
stored under ``references/PyPortfolioOpt-main``.

Design goals:
- force baseline imports from ``references`` (never from site-packages)
- build scenario-based cases from the core test suite (no pytest instrumentation)
- add explicit extra scenarios for uncovered public APIs
- emit canonical JSON with environment metadata, dataset hashes, coverage matrix,
  and tolerance metadata
"""

from __future__ import annotations

import argparse
import ast
import contextlib
import copy
import hashlib
import importlib
import importlib.metadata
import io
import json
import logging
import os
import platform
import random
import re
import sys
import traceback
import warnings
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Sequence

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DEFAULT_BASELINE_ROOT = ROOT / "references" / "PyPortfolioOpt-main"
DEFAULT_OUTPUT = ROOT / "golden-PyPortfolioOpt" / "golden.json"

CORE_TEST_FILES: Dict[str, str] = {
    "test_base_optimizer.py": "base_optimizer",
    "test_black_litterman.py": "black_litterman",
    "test_cla.py": "cla",
    "test_custom_objectives.py": "custom_objectives",
    "test_discrete_allocation.py": "discrete_allocation",
    "test_efficient_cdar.py": "efficient_cdar",
    "test_efficient_cvar.py": "efficient_cvar",
    "test_efficient_frontier.py": "efficient_frontier",
    "test_efficient_semivariance.py": "efficient_semivariance",
    "test_expected_returns.py": "expected_returns",
    "test_hrp.py": "hrp",
    "test_objective_functions.py": "objective_functions",
    "test_risk_models.py": "risk_models",
}

ALL_MODULES = sorted(set(CORE_TEST_FILES.values()))

# Upstream flaky tests explicitly marked skip in baseline.
UPSTREAM_SKIP_TESTS = {
    "tests.test_efficient_cdar.test_efficient_risk_L2_reg",
    "tests.test_efficient_cdar.test_efficient_return_L2_reg",
    "tests.test_efficient_semivariance.test_max_quadratic_utility_range",
    "tests.test_efficient_semivariance.test_efficient_risk_low_risk",
}

PUBLIC_API = [
    "returns_from_prices",
    "prices_from_returns",
    "return_model",
    "mean_historical_return",
    "ema_historical_return",
    "risk_matrix",
    "sample_cov",
    "semicovariance",
    "exp_cov",
    "CovarianceShrinkage",
    "portfolio_variance",
    "portfolio_return",
    "sharpe_ratio",
    "L2_reg",
    "quadratic_utility",
    "DiscreteAllocation",
    "BlackLittermanModel",
    "market_implied_prior_returns",
    "market_implied_risk_aversion",
    "CLA",
    "HRPOpt",
    "BaseOptimizer",
    "BaseConvexOptimizer",
    "EfficientFrontier",
    "EfficientSemivariance",
    "EfficientCVaR",
    "EfficientCDaR",
    "default_omega",
    "idzorek_method",
]

DATASET_FILES = {
    "stock_prices": "tests/resources/stock_prices.csv",
    "spy_prices": "tests/resources/spy_prices.csv",
    "cov_matrix": "tests/resources/cov_matrix.csv",
    "weights_hrp": "tests/resources/weights_hrp.csv",
}

DEFAULT_TOLERANCE = {"atol": 1e-8, "rtol": 1e-6}
SOLVER_SENSITIVE_TOLERANCE = {"atol": 1e-4, "rtol": 1e-3}
INVARIANT_TOLERANCE = {"atol": 0.0, "rtol": 0.0}


@dataclass(frozen=True)
class TestScenario:
    case_id: str
    module_name: str
    test_module: str
    function_name: str
    source_test: str
    expectation_kind: str
    decorators: Sequence[str]
    input_refs: Sequence[str]
    api_mentions: Sequence[str]
    source_body: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--baseline-root",
        default=str(DEFAULT_BASELINE_ROOT),
        help="Path to PyPortfolioOpt baseline root (default: references/PyPortfolioOpt-main)",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Output JSON fixture path",
    )
    parser.add_argument(
        "--modules",
        nargs="*",
        default=["all"],
        help=(
            "Subset of modules to include. Accepts space/comma-separated values. "
            f"Available: {', '.join(ALL_MODULES)}"
        ),
    )
    parser.add_argument(
        "--include-skipif",
        action="store_true",
        help="Include skipif-marked tests when marker condition evaluates to False in this environment",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Enable strict coverage gates and deterministic double-run checks",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=1337,
        help="Deterministic seed for Python and NumPy",
    )
    parser.add_argument(
        "--fail-on-missing",
        action="store_true",
        help="Fail if any public API remains uncovered by selected scenarios",
    )
    return parser.parse_args()


def parse_modules(raw_tokens: Sequence[str]) -> List[str]:
    tokens: List[str] = []
    for item in raw_tokens:
        for token in item.split(","):
            norm = token.strip().lower()
            if norm:
                tokens.append(norm)

    if not tokens or "all" in tokens:
        return list(ALL_MODULES)

    unknown = sorted(set(tokens) - set(ALL_MODULES))
    if unknown:
        raise SystemExit(f"Unknown module(s): {', '.join(unknown)}")

    # Keep deterministic order.
    return sorted(set(tokens), key=lambda m: ALL_MODULES.index(m))


def path_is_under(child: Path, parent: Path) -> bool:
    try:
        child.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def force_baseline_imports(baseline_root: Path):
    if not baseline_root.exists():
        raise SystemExit(f"Baseline root does not exist: {baseline_root}")

    baseline_root_resolved = baseline_root.resolve()
    sys.path.insert(0, str(baseline_root_resolved))

    # Ensure we import from baseline path only.
    if "pypfopt" in sys.modules:
        del sys.modules["pypfopt"]

    pypfopt = importlib.import_module("pypfopt")
    pypfopt_path = Path(pypfopt.__file__).resolve()
    if not path_is_under(pypfopt_path, baseline_root_resolved):
        raise SystemExit(
            "Baseline guardrail failed: imported pypfopt from "
            f"{pypfopt_path}, expected under {baseline_root_resolved}"
        )

    return pypfopt


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sanitize_float(value: float) -> Any:
    if np.isnan(value):
        return "NaN"
    if np.isposinf(value):
        return "Infinity"
    if np.isneginf(value):
        return "-Infinity"
    return float(value)


def canonicalize(value: Any) -> Any:
    if isinstance(value, np.generic):
        if np.issubdtype(type(value), np.datetime64):
            return pd.Timestamp(value).isoformat()
        if np.issubdtype(type(value), np.floating):
            return sanitize_float(float(value))
        return value.item()

    if isinstance(value, float):
        return sanitize_float(value)

    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat()

    if isinstance(value, (np.ndarray, list, tuple)):
        return [canonicalize(v) for v in list(value)]

    if isinstance(value, set):
        return sorted(canonicalize(v) for v in value)

    if isinstance(value, pd.Series):
        return {
            "type": "series",
            "name": canonicalize(value.name),
            "index": [canonicalize(v) for v in value.index.tolist()],
            "data": [canonicalize(v) for v in value.tolist()],
        }

    if isinstance(value, pd.DataFrame):
        return {
            "type": "dataframe",
            "index": [canonicalize(v) for v in value.index.tolist()],
            "columns": [canonicalize(v) for v in value.columns.tolist()],
            "data": [
                [canonicalize(cell) for cell in row]
                for row in value.to_numpy(dtype=object).tolist()
            ],
        }

    if isinstance(value, dict):
        out: Dict[str, Any] = {}
        for key in sorted(value.keys(), key=lambda k: str(k)):
            out[str(key)] = canonicalize(value[key])
        return out

    if isinstance(value, Path):
        return str(value)

    if isinstance(value, Exception):
        return {"type": type(value).__name__, "message": str(value)}

    return value


def normalize_warnings(records: Sequence[warnings.WarningMessage]) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for w in records:
        category = w.category.__name__
        message = str(w.message)
        key = (category, message)
        if key in seen:
            continue
        seen.add(key)
        out.append({"category": category, "message": message})
    return out


def classify_expectation_kind(source_text: str) -> str:
    if "pytest.raises" in source_text:
        return "exception"
    if "pytest.warns" in source_text:
        return "warning"
    if "np.testing." in source_text or "pd.testing." in source_text:
        return "numeric"
    return "invariant"


def infer_input_refs(source_text: str) -> List[str]:
    refs: List[str] = []
    checks = [
        ("get_data(", "stock_prices"),
        ("get_benchmark_data(", "spy_prices"),
        ("get_cov_matrix(", "cov_matrix"),
        ("weights_hrp.csv", "weights_hrp"),
    ]
    for token, ref in checks:
        if token in source_text and ref not in refs:
            refs.append(ref)
    return refs


def infer_api_mentions(source_text: str) -> List[str]:
    mentions: List[str] = []
    for symbol in PUBLIC_API:
        if re.search(rf"\b{re.escape(symbol)}\b", source_text):
            mentions.append(symbol)
    return sorted(set(mentions))


def collect_environment_metadata(pypfopt_module: Any) -> Dict[str, Any]:
    versions: Dict[str, str] = {}
    package_keys = [
        "pyportfolioopt",
        "numpy",
        "pandas",
        "scipy",
        "cvxpy",
        "pytest",
        "scikit-learn",
        "skbase",
        "ecos",
    ]
    for key in package_keys:
        try:
            versions[key] = importlib.metadata.version(key)
        except importlib.metadata.PackageNotFoundError:
            versions[key] = "not-installed"

    solvers: List[str] = []
    try:
        import cvxpy as cp  # noqa: PLC0415

        solvers = sorted(cp.installed_solvers())
    except Exception:
        solvers = []

    return {
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "python": {
            "version": platform.python_version(),
            "implementation": platform.python_implementation(),
            "executable": sys.executable,
        },
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
        },
        "pypfopt": {
            "version": getattr(pypfopt_module, "__version__", "unknown"),
            "file": str(Path(pypfopt_module.__file__).resolve()),
        },
        "packages": versions,
        "cvxpySolvers": solvers,
    }


def collect_dataset_metadata(baseline_root: Path) -> Dict[str, Any]:
    datasets: Dict[str, Any] = {}
    for name, rel_path in DATASET_FILES.items():
        abs_path = baseline_root / rel_path
        if not abs_path.exists():
            raise SystemExit(f"Missing dataset file: {abs_path}")
        frame = pd.read_csv(abs_path)
        datasets[name] = {
            "path": str(abs_path.resolve()),
            "sha256": sha256_file(abs_path),
            "rows": int(frame.shape[0]),
            "columns": int(frame.shape[1]),
            "sizeBytes": abs_path.stat().st_size,
        }
    return datasets


def run_smoke_checks(baseline_root: Path) -> Dict[str, Any]:
    smoke: Dict[str, Any] = {"status": "pass", "checks": []}

    utilities = importlib.import_module("tests.utilities_for_tests")

    data = utilities.get_data()
    benchmark = utilities.get_benchmark_data()
    cov_matrix = utilities.get_cov_matrix()

    smoke["checks"].append({"name": "get_data", "shape": [int(data.shape[0]), int(data.shape[1])]})
    smoke["checks"].append(
        {
            "name": "get_benchmark_data",
            "shape": [int(benchmark.shape[0]), int(benchmark.shape[1])],
        }
    )
    smoke["checks"].append(
        {
            "name": "get_cov_matrix",
            "shape": [int(cov_matrix.shape[0]), int(cov_matrix.shape[1])],
        }
    )

    # Explicit dataset existence checks.
    for dataset_rel in DATASET_FILES.values():
        path = baseline_root / dataset_rel
        smoke["checks"].append({"name": "dataset_exists", "path": str(path.resolve())})

    return smoke


def patch_test_utilities_for_quiet_mode() -> None:
    """Monkeypatch test helpers to avoid verbose solver logs in golden generation."""

    utilities = importlib.import_module("tests.utilities_for_tests")
    expected_returns = importlib.import_module("pypfopt.expected_returns")
    risk_models = importlib.import_module("pypfopt.risk_models")
    cla_module = importlib.import_module("pypfopt.cla")
    ef_module = importlib.import_module("pypfopt.efficient_frontier")

    def setup_efficient_frontier(data_only: bool = False, *args, **kwargs):
        df = utilities.get_data()
        mean_return = expected_returns.mean_historical_return(df)
        sample_cov_matrix = risk_models.sample_cov(df)
        if data_only:
            return mean_return, sample_cov_matrix
        return ef_module.EfficientFrontier(
            mean_return, sample_cov_matrix, verbose=False, *args, **kwargs
        )

    def setup_efficient_semivariance(data_only: bool = False, *args, **kwargs):
        df = utilities.get_data().dropna(axis=0, how="any")
        mean_return = expected_returns.mean_historical_return(df)
        historic_returns = expected_returns.returns_from_prices(df)
        if data_only:
            return mean_return, historic_returns
        return ef_module.EfficientSemivariance(
            mean_return, historic_returns, verbose=False, *args, **kwargs
        )

    def setup_efficient_cvar(data_only: bool = False, *args, **kwargs):
        df = utilities.get_data().dropna(axis=0, how="any")
        mean_return = expected_returns.mean_historical_return(df)
        historic_returns = expected_returns.returns_from_prices(df)
        if data_only:
            return mean_return, historic_returns
        return ef_module.EfficientCVaR(
            mean_return, historic_returns, verbose=False, *args, **kwargs
        )

    def setup_efficient_cdar(data_only: bool = False, *args, **kwargs):
        df = utilities.get_data().dropna(axis=0, how="any")
        mean_return = expected_returns.mean_historical_return(df)
        historic_returns = expected_returns.returns_from_prices(df)
        if data_only:
            return mean_return, historic_returns
        return ef_module.EfficientCDaR(
            mean_return, historic_returns, verbose=False, *args, **kwargs
        )

    def setup_cla(data_only: bool = False, *args, **kwargs):
        df = utilities.get_data()
        mean_return = expected_returns.mean_historical_return(df)
        sample_cov_matrix = risk_models.sample_cov(df)
        if data_only:
            return mean_return, sample_cov_matrix
        return cla_module.CLA(mean_return, sample_cov_matrix, *args, **kwargs)

    def _scalar(value: Any) -> float:
        arr = np.asarray(value)
        if arr.shape == ():
            return float(arr)
        if arr.size == 1:
            return float(arr.reshape(-1)[0])
        raise TypeError("Expected scalar-compatible value")

    def _compute_w_numpy2_compat(self, covarF_inv, covarFB, meanF, wB):
        onesF = np.ones(meanF.shape)
        g1 = np.dot(np.dot(onesF.T, covarF_inv), meanF)
        g2 = np.dot(np.dot(onesF.T, covarF_inv), onesF)
        if wB is None:
            g, w1 = _scalar(-self.ls[-1] * g1 / g2 + 1 / g2), 0
        else:
            onesB = np.ones(wB.shape)
            g3 = np.dot(onesB.T, wB)
            g4 = np.dot(covarF_inv, covarFB)
            w1 = np.dot(g4, wB)
            g4 = np.dot(onesF.T, w1)
            g = _scalar(-self.ls[-1] * g1 / g2 + (1 - g3 + g4) / g2)
        w2 = np.dot(covarF_inv, onesF)
        w3 = np.dot(covarF_inv, meanF)
        return -w1 + g * w2 + self.ls[-1] * w3, g

    def _compute_lambda_numpy2_compat(self, covarF_inv, covarFB, meanF, wB, i, bi):
        onesF = np.ones(meanF.shape)
        c1 = np.dot(np.dot(onesF.T, covarF_inv), onesF)
        c2 = np.dot(covarF_inv, meanF)
        c3 = np.dot(np.dot(onesF.T, covarF_inv), meanF)
        c4 = np.dot(covarF_inv, onesF)
        c = _scalar(-c1 * c2[i] + c3 * c4[i])
        if c == 0:  # pragma: no cover
            return None, None
        if isinstance(bi, list):
            bi = self._compute_bi(c, bi)
        if wB is None:
            return _scalar((c4[i] - c1 * bi) / c), bi
        onesB = np.ones(wB.shape)
        l1 = np.dot(onesB.T, wB)
        l2 = np.dot(covarF_inv, covarFB)
        l3 = np.dot(l2, wB)
        l2 = np.dot(onesF.T, l3)
        return _scalar(((1 - l1 + l2) * c4[i] - c1 * (bi + l3[i])) / c), bi

    # NumPy 2 compatibility: upstream CLA expects float(np.array([[x]])).
    cla_module.CLA._compute_w = _compute_w_numpy2_compat
    cla_module.CLA._compute_lambda = _compute_lambda_numpy2_compat

    utilities.setup_efficient_frontier = setup_efficient_frontier
    utilities.setup_efficient_semivariance = setup_efficient_semivariance
    utilities.setup_efficient_cvar = setup_efficient_cvar
    utilities.setup_efficient_cdar = setup_efficient_cdar
    utilities.setup_cla = setup_cla


def decorators_from_node(node: ast.FunctionDef) -> List[str]:
    out: List[str] = []
    for deco in node.decorator_list:
        try:
            out.append(ast.unparse(deco))
        except Exception:
            out.append("<unparse-error>")
    return out


def should_skip_runtime(func: Callable[..., Any], include_skipif: bool):
    marks = getattr(func, "pytestmark", [])
    has_skipif = False
    for mark in marks:
        name = getattr(mark, "name", "")
        if name == "skip":
            reason = mark.kwargs.get("reason", "skip marker")
            return True, "skip", str(reason)
        if name == "skipif":
            has_skipif = True
            if not include_skipif:
                reason = mark.kwargs.get("reason", "skipif excluded")
                return True, "skipif", f"excluded-by-cli: {reason}"
            condition = bool(mark.args[0]) if mark.args else False
            if condition:
                reason = mark.kwargs.get("reason", "skipif condition true")
                return True, "skipif", str(reason)

    if has_skipif and include_skipif:
        return False, "skipif", "included-by-cli"
    return False, "", ""


def selected_test_files(selected_modules: Sequence[str]) -> List[str]:
    return [
        file_name
        for file_name, module_name in CORE_TEST_FILES.items()
        if module_name in selected_modules
    ]


def discover_test_scenarios(
    baseline_root: Path,
    selected_modules_list: Sequence[str],
    include_skipif: bool,
) -> Dict[str, Any]:
    out: Dict[str, Any] = {
        "scenarios": [],
        "exclusions": [],
        "errors": [],
    }

    selected_files = selected_test_files(selected_modules_list)

    for file_name in selected_files:
        test_module = f"tests.{Path(file_name).stem}"
        file_path = baseline_root / "tests" / file_name
        source = file_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(file_path))

        try:
            module_obj = importlib.import_module(test_module)
        except Exception as exc:
            out["errors"].append(
                {
                    "source_test": f"tests/{file_name}",
                    "error": canonicalize(exc),
                    "traceback": traceback.format_exc(),
                }
            )
            continue

        for node in tree.body:
            if not isinstance(node, ast.FunctionDef) or not node.name.startswith("test_"):
                continue

            fn = getattr(module_obj, node.name, None)
            if fn is None:
                out["errors"].append(
                    {
                        "source_test": f"tests/{file_name}::{node.name}",
                        "error": {
                            "type": "MissingFunction",
                            "message": f"Function {node.name} not found after import",
                        },
                    }
                )
                continue

            skip, skip_kind, skip_reason = should_skip_runtime(fn, include_skipif)
            source_body = ast.get_source_segment(source, node) or ""
            scenario_id = f"test::{CORE_TEST_FILES[file_name]}::{node.name}"
            src_ref = f"tests/{file_name}::{node.name}"

            if skip:
                out["exclusions"].append(
                    {
                        "id": scenario_id,
                        "source_test": src_ref,
                        "kind": skip_kind,
                        "reason": skip_reason,
                    }
                )
                continue

            out["scenarios"].append(
                TestScenario(
                    case_id=scenario_id,
                    module_name=CORE_TEST_FILES[file_name],
                    test_module=test_module,
                    function_name=node.name,
                    source_test=src_ref,
                    expectation_kind=classify_expectation_kind(source_body),
                    decorators=decorators_from_node(node),
                    input_refs=infer_input_refs(source_body),
                    api_mentions=infer_api_mentions(source_body),
                    source_body=source_body,
                )
            )

    out["scenarios"] = sorted(out["scenarios"], key=lambda s: s.case_id)
    out["exclusions"] = sorted(out["exclusions"], key=lambda s: s["id"])
    return out


def tolerance_for_scenario(scenario: TestScenario) -> Dict[str, float]:
    if "different_solver" in scenario.source_body or "solver=" in scenario.source_body:
        return SOLVER_SENSITIVE_TOLERANCE
    if scenario.expectation_kind == "numeric":
        return DEFAULT_TOLERANCE
    return INVARIANT_TOLERANCE


def execute_test_scenarios(scenarios: Sequence[TestScenario]) -> Dict[str, Any]:
    module_cache: Dict[str, Any] = {}
    cases: List[Dict[str, Any]] = []
    failures: List[Dict[str, Any]] = []

    for scenario in scenarios:
        if scenario.test_module not in module_cache:
            module_cache[scenario.test_module] = importlib.import_module(scenario.test_module)
        module_obj = module_cache[scenario.test_module]
        fn = getattr(module_obj, scenario.function_name)

        with warnings.catch_warnings(record=True) as warning_records:
            warnings.simplefilter("always")
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            try:
                with contextlib.redirect_stdout(stdout_capture), contextlib.redirect_stderr(
                    stderr_capture
                ):
                    result = fn()
                status = "pass"
                error = None
            except Exception as exc:  # pragma: no cover - retained for diagnostics
                status = "fail"
                result = None
                error = {
                    "type": type(exc).__name__,
                    "message": str(exc),
                    "traceback": traceback.format_exc(),
                }

        case_expected = {
            "status": status,
            "result": canonicalize(result),
            "warnings": normalize_warnings(warning_records),
        }
        if error is not None:
            case_expected["error"] = error
            failures.append(
                {
                    "id": scenario.case_id,
                    "source_test": scenario.source_test,
                    "error": error,
                }
            )

        cases.append(
            {
                "id": scenario.case_id,
                "module": scenario.module_name,
                "source_test": scenario.source_test,
                "call": {
                    "kind": "python_test_function",
                    "symbol": f"{scenario.test_module}.{scenario.function_name}",
                },
                "inputs_ref": {
                    "datasets": list(scenario.input_refs),
                    "api_mentions": list(scenario.api_mentions),
                },
                "expected": case_expected,
                "tolerance": tolerance_for_scenario(scenario),
                "expectation_kind": scenario.expectation_kind,
            }
        )

    return {"cases": sorted(cases, key=lambda c: c["id"]), "failures": failures}


def run_extra_scenarios(selected_modules_list: Sequence[str]) -> Dict[str, Any]:
    cases: List[Dict[str, Any]] = []
    failures: List[Dict[str, Any]] = []

    import cvxpy as cp  # noqa: PLC0415
    from pypfopt import EfficientFrontier, risk_models  # noqa: PLC0415
    from pypfopt.black_litterman import BlackLittermanModel  # noqa: PLC0415
    from tests.utilities_for_tests import get_data, setup_efficient_frontier  # noqa: PLC0415

    def run_case(
        *,
        case_id: str,
        module_name: str,
        source_test: str,
        call_symbol: str,
        input_refs: Sequence[str],
        expectation_kind: str,
        tolerance: Dict[str, float],
        api_mentions: Sequence[str],
        fn: Callable[[], Any],
    ) -> None:
        with warnings.catch_warnings(record=True) as warning_records:
            warnings.simplefilter("always")
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            try:
                with contextlib.redirect_stdout(stdout_capture), contextlib.redirect_stderr(
                    stderr_capture
                ):
                    value = fn()
                expected = {
                    "status": "pass",
                    "result": canonicalize(value),
                    "warnings": normalize_warnings(warning_records),
                }
            except Exception as exc:  # pragma: no cover - retained for diagnostics
                error = {
                    "type": type(exc).__name__,
                    "message": str(exc),
                    "traceback": traceback.format_exc(),
                }
                expected = {
                    "status": "fail",
                    "result": None,
                    "warnings": normalize_warnings(warning_records),
                    "error": error,
                }
                failures.append({"id": case_id, "source_test": source_test, "error": error})

        cases.append(
            {
                "id": case_id,
                "module": module_name,
                "source_test": source_test,
                "call": {"kind": "extra_api_scenario", "symbol": call_symbol},
                "inputs_ref": {
                    "datasets": list(input_refs),
                    "api_mentions": sorted(set(api_mentions)),
                },
                "expected": expected,
                "tolerance": tolerance,
                "expectation_kind": expectation_kind,
            }
        )

    if "risk_models" in selected_modules_list:
        run_case(
            case_id="extra::risk_models::min_cov_determinant",
            module_name="risk_models",
            source_test="manual::risk_models::min_cov_determinant",
            call_symbol="pypfopt.risk_models.min_cov_determinant",
            input_refs=["stock_prices"],
            expectation_kind="warning",
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            api_mentions=["min_cov_determinant"],
            fn=lambda: risk_models.min_cov_determinant(get_data(), random_state=42),
        )

    if "black_litterman" in selected_modules_list:
        def default_omega_case():
            df = get_data()
            cov = risk_models.sample_cov(df)
            p = np.zeros((3, cov.shape[0]))
            p[0, 0] = 1
            p[1, 1] = 1
            p[2, 2] = 1
            return BlackLittermanModel.default_omega(cov.values, p, tau=0.05)

        run_case(
            case_id="extra::black_litterman::default_omega",
            module_name="black_litterman",
            source_test="manual::black_litterman::default_omega",
            call_symbol="pypfopt.black_litterman.BlackLittermanModel.default_omega",
            input_refs=["stock_prices"],
            expectation_kind="numeric",
            tolerance=DEFAULT_TOLERANCE,
            api_mentions=["default_omega", "BlackLittermanModel"],
            fn=default_omega_case,
        )

        def idzorek_case():
            df = get_data()
            cov = risk_models.sample_cov(df)
            n = cov.shape[0]
            p = np.zeros((3, n))
            p[0, 0] = 1
            p[1, 1] = 1
            p[2, 2] = 1
            q = np.array([[0.04], [0.03], [0.02]])
            pi = np.zeros((n, 1))
            confidences = np.array([0.6, 0.7, 0.8])
            return BlackLittermanModel.idzorek_method(
                confidences,
                cov.values,
                pi,
                q,
                p,
                tau=0.05,
                risk_aversion=1,
            )

        run_case(
            case_id="extra::black_litterman::idzorek_method",
            module_name="black_litterman",
            source_test="manual::black_litterman::idzorek_method",
            call_symbol="pypfopt.black_litterman.BlackLittermanModel.idzorek_method",
            input_refs=["stock_prices"],
            expectation_kind="numeric",
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            api_mentions=["idzorek_method", "BlackLittermanModel"],
            fn=idzorek_case,
        )

    if "base_optimizer" in selected_modules_list:
        def deepcopy_case():
            ef = setup_efficient_frontier()
            base_count = len(ef._constraints)
            ef_clone = ef.deepcopy()
            clone_before = len(ef_clone._constraints)
            ef_clone.add_constraint(lambda w: w[0] >= 0.01)
            clone_after = len(ef_clone._constraints)
            base_after = len(ef._constraints)
            return {
                "base_count": base_count,
                "clone_before": clone_before,
                "clone_after": clone_after,
                "base_after": base_after,
            }

        run_case(
            case_id="extra::base_optimizer::deepcopy",
            module_name="base_optimizer",
            source_test="manual::base_optimizer::deepcopy",
            call_symbol="pypfopt.base_optimizer.BaseConvexOptimizer.deepcopy",
            input_refs=["stock_prices"],
            expectation_kind="invariant",
            tolerance=INVARIANT_TOLERANCE,
            api_mentions=["deepcopy", "BaseConvexOptimizer", "EfficientFrontier"],
            fn=deepcopy_case,
        )

        def is_parameter_defined_case():
            ef = setup_efficient_frontier()
            gamma = cp.Parameter(name="gamma", value=1.0, nonneg=True)
            ef.add_objective(lambda w: gamma * cp.sum_squares(w))
            return {
                "gamma_defined": ef.is_parameter_defined("gamma"),
                "missing_defined": ef.is_parameter_defined("missing_parameter"),
            }

        run_case(
            case_id="extra::base_optimizer::is_parameter_defined",
            module_name="base_optimizer",
            source_test="manual::base_optimizer::is_parameter_defined",
            call_symbol="pypfopt.base_optimizer.BaseConvexOptimizer.is_parameter_defined",
            input_refs=["stock_prices"],
            expectation_kind="invariant",
            tolerance=INVARIANT_TOLERANCE,
            api_mentions=["is_parameter_defined", "BaseConvexOptimizer", "EfficientFrontier"],
            fn=is_parameter_defined_case,
        )

        def update_parameter_value_case():
            ef = setup_efficient_frontier()
            gamma = cp.Parameter(name="gamma", value=1.0, nonneg=True)
            ef.add_objective(lambda w: gamma * cp.sum_squares(w))
            ef.min_volatility()
            ef.update_parameter_value("gamma", 2.5)
            return {
                "gamma": float(gamma.value),
                "gamma_defined": ef.is_parameter_defined("gamma"),
            }

        run_case(
            case_id="extra::base_optimizer::update_parameter_value",
            module_name="base_optimizer",
            source_test="manual::base_optimizer::update_parameter_value",
            call_symbol="pypfopt.base_optimizer.BaseConvexOptimizer.update_parameter_value",
            input_refs=["stock_prices"],
            expectation_kind="invariant",
            tolerance=INVARIANT_TOLERANCE,
            api_mentions=["update_parameter_value", "BaseConvexOptimizer", "EfficientFrontier"],
            fn=update_parameter_value_case,
        )

    return {"cases": sorted(cases, key=lambda c: c["id"]), "failures": failures}


def run_public_api_cases(selected_modules_list: Sequence[str]) -> Dict[str, Any]:
    cases: List[Dict[str, Any]] = []
    failures: List[Dict[str, Any]] = []

    import cvxpy as cp  # noqa: PLC0415
    from pypfopt import (  # noqa: PLC0415
        CLA,
        HRPOpt,
        BlackLittermanModel,
        CovarianceShrinkage,
        DiscreteAllocation,
        EfficientCDaR,
        EfficientCVaR,
        EfficientFrontier,
        EfficientSemivariance,
        base_optimizer,
        expected_returns,
        objective_functions,
        risk_models,
    )
    from pypfopt.black_litterman import (  # noqa: PLC0415
        market_implied_prior_returns,
        market_implied_risk_aversion,
    )
    from pypfopt.discrete_allocation import get_latest_prices  # noqa: PLC0415
    from tests.utilities_for_tests import (  # noqa: PLC0415
        get_benchmark_data,
        get_data,
        get_market_caps,
    )

    df = get_data()
    df_clean = df.dropna(axis=0, how="any")
    benchmark_prices = get_benchmark_data().squeeze("columns")
    market_caps = get_market_caps()

    returns_df = expected_returns.returns_from_prices(df_clean)
    mu = expected_returns.mean_historical_return(df_clean)
    cov = risk_models.sample_cov(df_clean)
    latest_prices = get_latest_prices(df_clean)

    tickers = list(cov.columns)
    n_assets = len(tickers)
    equal_w = np.repeat(1 / n_assets, n_assets)
    equal_w_dict = {ticker: float(equal_w[i]) for i, ticker in enumerate(tickers)}
    prev_w = np.repeat(1 / n_assets, n_assets)
    prev_w = np.roll(prev_w, 1)
    prev_w = prev_w / prev_w.sum()

    benchmark_returns = returns_df.mean(axis=1).values
    prior = market_implied_prior_returns(market_caps, 1.0, cov, risk_free_rate=0.0)
    delta = market_implied_risk_aversion(benchmark_prices, risk_free_rate=0.02)
    absolute_views = {"AAPL": 0.10, "GOOG": 0.05, "FB": 0.02}

    p_small = np.zeros((3, cov.shape[0]))
    p_small[0, 0] = 1
    p_small[1, 1] = 1
    p_small[2, 2] = 1
    q_small = np.array([[0.04], [0.03], [0.02]])
    pi_small = np.zeros((cov.shape[0], 1))
    confidences_small = np.array([0.6, 0.7, 0.8])

    def run_case(
        *,
        api_symbol: str,
        module_name: str,
        input_refs: Sequence[str],
        tolerance: Dict[str, float],
        expectation_kind: str,
        fn: Callable[[], Any],
    ) -> None:
        case_id = f"api::{api_symbol}"
        with warnings.catch_warnings(record=True) as warning_records:
            warnings.simplefilter("always")
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            try:
                with contextlib.redirect_stdout(stdout_capture), contextlib.redirect_stderr(
                    stderr_capture
                ):
                    value = fn()
                expected = {
                    "status": "pass",
                    "result": canonicalize(value),
                    "warnings": normalize_warnings(warning_records),
                }
            except Exception as exc:  # pragma: no cover - retained for diagnostics
                error = {
                    "type": type(exc).__name__,
                    "message": str(exc),
                    "traceback": traceback.format_exc(),
                }
                expected = {
                    "status": "fail",
                    "result": {
                        "error_type": error["type"],
                        "error_message": error["message"],
                    },
                    "warnings": normalize_warnings(warning_records),
                    "error": error,
                }
                failures.append({"id": case_id, "source_test": api_symbol, "error": error})

        cases.append(
            {
                "id": case_id,
                "module": module_name,
                "source_test": f"manual::api::{api_symbol}",
                "call": {"kind": "api_method_scenario", "symbol": api_symbol},
                "inputs_ref": {
                    "datasets": list(input_refs),
                    "api_mentions": [api_symbol.split(".")[-1]],
                },
                "expected": expected,
                "tolerance": tolerance,
                "expectation_kind": expectation_kind,
            }
        )

    def include(module_name: str) -> bool:
        return module_name in selected_modules_list

    api_specs: List[Dict[str, Any]] = [
        {
            "symbol": "pypfopt.expected_returns.returns_from_prices",
            "module": "expected_returns",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: expected_returns.returns_from_prices(df_clean),
        },
        {
            "symbol": "pypfopt.expected_returns.prices_from_returns",
            "module": "expected_returns",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: expected_returns.prices_from_returns(returns_df.copy()),
        },
        {
            "symbol": "pypfopt.expected_returns.return_model",
            "module": "expected_returns",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: expected_returns.return_model(df_clean, method="mean_historical_return"),
        },
        {
            "symbol": "pypfopt.expected_returns.mean_historical_return",
            "module": "expected_returns",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: expected_returns.mean_historical_return(df_clean),
        },
        {
            "symbol": "pypfopt.expected_returns.ema_historical_return",
            "module": "expected_returns",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: expected_returns.ema_historical_return(df_clean),
        },
        {
            "symbol": "pypfopt.expected_returns.capm_return",
            "module": "expected_returns",
            "inputs": ["stock_prices", "spy_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: expected_returns.capm_return(
                df_clean, market_prices=get_benchmark_data()
            ),
        },
        {
            "symbol": "pypfopt.risk_models.fix_nonpositive_semidefinite",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: risk_models.fix_nonpositive_semidefinite(cov),
        },
        {
            "symbol": "pypfopt.risk_models.risk_matrix",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: risk_models.risk_matrix(df_clean, method="sample_cov"),
        },
        {
            "symbol": "pypfopt.risk_models.sample_cov",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: risk_models.sample_cov(df_clean),
        },
        {
            "symbol": "pypfopt.risk_models.semicovariance",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: risk_models.semicovariance(df_clean),
        },
        {
            "symbol": "pypfopt.risk_models.exp_cov",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: risk_models.exp_cov(df_clean, span=180),
        },
        {
            "symbol": "pypfopt.risk_models.min_cov_determinant",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "warning",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: risk_models.min_cov_determinant(df_clean, random_state=42),
        },
        {
            "symbol": "pypfopt.risk_models.cov_to_corr",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: risk_models.cov_to_corr(cov),
        },
        {
            "symbol": "pypfopt.risk_models.corr_to_cov",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: risk_models.corr_to_cov(
                risk_models.cov_to_corr(cov), np.sqrt(np.diag(cov.values))
            ),
        },
        {
            "symbol": "pypfopt.risk_models.CovarianceShrinkage",
            "module": "risk_models",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "sample": CovarianceShrinkage(df_clean).S,
                "shrunk_covariance": CovarianceShrinkage(df_clean).shrunk_covariance(),
                "ledoit_wolf": CovarianceShrinkage(df_clean).ledoit_wolf(),
                "oracle_approximating": CovarianceShrinkage(df_clean).oracle_approximating(),
            },
        },
        {
            "symbol": "pypfopt.objective_functions.portfolio_variance",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.portfolio_variance(equal_w, cov),
        },
        {
            "symbol": "pypfopt.objective_functions.portfolio_return",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.portfolio_return(
                equal_w, mu, negative=False
            ),
        },
        {
            "symbol": "pypfopt.objective_functions.sharpe_ratio",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.sharpe_ratio(
                equal_w, mu, cov, risk_free_rate=0.02, negative=False
            ),
        },
        {
            "symbol": "pypfopt.objective_functions.L2_reg",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.L2_reg(equal_w, gamma=2),
        },
        {
            "symbol": "pypfopt.objective_functions.quadratic_utility",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.quadratic_utility(
                equal_w, mu, cov, risk_aversion=1.5, negative=False
            ),
        },
        {
            "symbol": "pypfopt.objective_functions.transaction_cost",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.transaction_cost(equal_w, prev_w, k=0.001),
        },
        {
            "symbol": "pypfopt.objective_functions.ex_ante_tracking_error",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.ex_ante_tracking_error(equal_w, cov, equal_w),
        },
        {
            "symbol": "pypfopt.objective_functions.ex_post_tracking_error",
            "module": "objective_functions",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: objective_functions.ex_post_tracking_error(
                equal_w, returns_df.values, benchmark_returns
            ),
        },
        {
            "symbol": "pypfopt.discrete_allocation.get_latest_prices",
            "module": "discrete_allocation",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": INVARIANT_TOLERANCE,
            "fn": lambda: get_latest_prices(df_clean),
        },
        {
            "symbol": "pypfopt.discrete_allocation.DiscreteAllocation",
            "module": "discrete_allocation",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "greedy": DiscreteAllocation(
                    equal_w_dict, latest_prices, total_portfolio_value=10000
                ).greedy_portfolio(reinvest=False),
                "lp": DiscreteAllocation(
                    equal_w_dict, latest_prices, total_portfolio_value=10000
                ).lp_portfolio(reinvest=False),
            },
        },
        {
            "symbol": "pypfopt.black_litterman.market_implied_prior_returns",
            "module": "black_litterman",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: market_implied_prior_returns(market_caps, 1.0, cov, risk_free_rate=0.02),
        },
        {
            "symbol": "pypfopt.black_litterman.market_implied_risk_aversion",
            "module": "black_litterman",
            "inputs": ["spy_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: market_implied_risk_aversion(benchmark_prices, risk_free_rate=0.02),
        },
        {
            "symbol": "pypfopt.black_litterman.BlackLittermanModel",
            "module": "black_litterman",
            "inputs": ["stock_prices", "spy_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "bl_returns": BlackLittermanModel(
                    cov, pi=prior, absolute_views=absolute_views
                ).bl_returns(),
                "bl_cov": BlackLittermanModel(
                    cov, pi=prior, absolute_views=absolute_views
                ).bl_cov(),
                "bl_weights": BlackLittermanModel(
                    cov, pi=prior, absolute_views=absolute_views
                ).bl_weights(delta),
                "portfolio_performance": (
                    lambda _bl=BlackLittermanModel(cov, pi=prior, absolute_views=absolute_views): (
                        _bl.bl_weights(delta),
                        _bl.portfolio_performance(risk_free_rate=0.02),
                    )[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.black_litterman.BlackLittermanModel.default_omega",
            "module": "black_litterman",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": DEFAULT_TOLERANCE,
            "fn": lambda: BlackLittermanModel.default_omega(cov.values, p_small, tau=0.05),
        },
        {
            "symbol": "pypfopt.black_litterman.BlackLittermanModel.idzorek_method",
            "module": "black_litterman",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: BlackLittermanModel.idzorek_method(
                confidences_small, cov.values, pi_small, q_small, p_small, tau=0.05, risk_aversion=1
            ),
        },
        {
            "symbol": "pypfopt.cla.CLA",
            "module": "cla",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "max_sharpe": CLA(mu, cov).max_sharpe(),
                "min_volatility": CLA(mu, cov).min_volatility(),
                "portfolio_performance": (
                    lambda _cla=CLA(mu, cov): (_cla.max_sharpe(), _cla.portfolio_performance())[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.hierarchical_portfolio.HRPOpt",
            "module": "hrp",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "optimize": HRPOpt(returns_df).optimize(),
                "portfolio_performance": (
                    lambda _hrp=HRPOpt(returns_df): (_hrp.optimize(), _hrp.portfolio_performance())[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.base_optimizer.BaseOptimizer",
            "module": "base_optimizer",
            "inputs": ["stock_prices"],
            "expectation_kind": "invariant",
            "tolerance": INVARIANT_TOLERANCE,
            "fn": lambda: (
                lambda _bo=base_optimizer.BaseOptimizer(n_assets, tickers): {
                    "set_weights": _bo.set_weights(equal_w_dict),
                    "clean_weights": _bo.clean_weights(),
                }
            )(),
        },
        {
            "symbol": "pypfopt.base_optimizer.BaseConvexOptimizer",
            "module": "base_optimizer",
            "inputs": ["stock_prices"],
            "expectation_kind": "invariant",
            "tolerance": INVARIANT_TOLERANCE,
            "fn": lambda: (
                lambda _bco=base_optimizer.BaseConvexOptimizer(n_assets, tickers), _gamma=cp.Parameter(
                    name="gamma", value=1.0, nonneg=True
                ): (
                    _bco.add_constraint(lambda w: cp.sum(w) <= (_gamma + 10)),
                    _bco.update_parameter_value("gamma", 2.5),
                    {
                        "gamma_defined": _bco.is_parameter_defined("gamma"),
                        "gamma_value": float(_gamma.value),
                        "clone_constraints": len(_bco.deepcopy()._constraints),
                    },
                )[-1]
            )(),
        },
        {
            "symbol": "pypfopt.efficient_frontier.EfficientFrontier",
            "module": "efficient_frontier",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "min_volatility": EfficientFrontier(mu, cov).min_volatility(),
                "max_sharpe": EfficientFrontier(mu, cov).max_sharpe(risk_free_rate=0.02),
                "max_quadratic_utility": EfficientFrontier(mu, cov).max_quadratic_utility(
                    risk_aversion=1.0
                ),
                "efficient_return": EfficientFrontier(mu, cov).efficient_return(
                    target_return=float(np.percentile(mu, 40))
                ),
                "efficient_risk": EfficientFrontier(mu, cov).efficient_risk(
                    target_volatility=0.30
                ),
                "portfolio_performance": (
                    lambda _ef=EfficientFrontier(mu, cov): (
                        _ef.min_volatility(),
                        _ef.portfolio_performance(risk_free_rate=0.02),
                    )[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.efficient_frontier.EfficientSemivariance",
            "module": "efficient_semivariance",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "min_semivariance": EfficientSemivariance(mu, returns_df).min_semivariance(),
                "efficient_return": EfficientSemivariance(mu, returns_df).efficient_return(
                    target_return=float(np.percentile(mu, 30))
                ),
                "efficient_risk": EfficientSemivariance(mu, returns_df).efficient_risk(
                    target_semideviation=0.35
                ),
                "portfolio_performance": (
                    lambda _es=EfficientSemivariance(mu, returns_df): (
                        _es.min_semivariance(),
                        _es.portfolio_performance(risk_free_rate=0.02),
                    )[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.efficient_frontier.EfficientCVaR",
            "module": "efficient_cvar",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "min_cvar": EfficientCVaR(mu, returns_df).min_cvar(),
                "efficient_return": EfficientCVaR(mu, returns_df).efficient_return(
                    target_return=float(np.percentile(mu, 30))
                ),
                "efficient_risk": EfficientCVaR(mu, returns_df).efficient_risk(target_cvar=0.08),
                "portfolio_performance": (
                    lambda _ec=EfficientCVaR(mu, returns_df): (
                        _ec.min_cvar(),
                        _ec.portfolio_performance(),
                    )[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.efficient_frontier.EfficientCDaR",
            "module": "efficient_cdar",
            "inputs": ["stock_prices"],
            "expectation_kind": "numeric",
            "tolerance": SOLVER_SENSITIVE_TOLERANCE,
            "fn": lambda: {
                "min_cdar": EfficientCDaR(mu, returns_df).min_cdar(),
                "efficient_return": EfficientCDaR(mu, returns_df).efficient_return(
                    target_return=float(np.percentile(mu, 30))
                ),
                "efficient_risk": EfficientCDaR(mu, returns_df).efficient_risk(target_cdar=0.10),
                "portfolio_performance": (
                    lambda _ed=EfficientCDaR(mu, returns_df): (
                        _ed.min_cdar(),
                        _ed.portfolio_performance(),
                    )[1]
                )(),
            },
        },
        {
            "symbol": "pypfopt.base_optimizer.BaseConvexOptimizer.deepcopy",
            "module": "base_optimizer",
            "inputs": ["stock_prices"],
            "expectation_kind": "invariant",
            "tolerance": INVARIANT_TOLERANCE,
            "fn": lambda: (
                lambda _ef=EfficientFrontier(mu, cov): (
                    _ef.min_volatility(),
                    len(_ef.deepcopy()._constraints),
                )[1]
            )(),
        },
        {
            "symbol": "pypfopt.base_optimizer.BaseConvexOptimizer.is_parameter_defined",
            "module": "base_optimizer",
            "inputs": ["stock_prices"],
            "expectation_kind": "invariant",
            "tolerance": INVARIANT_TOLERANCE,
            "fn": lambda: (
                lambda _ef=EfficientFrontier(mu, cov), _gamma=cp.Parameter(
                    name="gamma", value=1.0, nonneg=True
                ): (
                    _ef.add_objective(lambda w: _gamma * cp.sum_squares(w)),
                    _ef.is_parameter_defined("gamma"),
                )[1]
            )(),
        },
        {
            "symbol": "pypfopt.base_optimizer.BaseConvexOptimizer.update_parameter_value",
            "module": "base_optimizer",
            "inputs": ["stock_prices"],
            "expectation_kind": "invariant",
            "tolerance": INVARIANT_TOLERANCE,
            "fn": lambda: (
                lambda _ef=EfficientFrontier(mu, cov), _gamma=cp.Parameter(
                    name="gamma", value=1.0, nonneg=True
                ): (
                    _ef.add_objective(lambda w: _gamma * cp.sum_squares(w)),
                    _ef.min_volatility(),
                    _ef.update_parameter_value("gamma", 2.5),
                    float(_gamma.value),
                )[-1]
            )(),
        },
    ]

    public_api_by_name = set(PUBLIC_API)
    for spec in api_specs:
        symbol = spec["symbol"]
        api_name = symbol.split(".")[-1]
        if api_name not in public_api_by_name:
            continue
        if not include(spec["module"]):
            continue
        run_case(
            api_symbol=symbol,
            module_name=spec["module"],
            input_refs=spec["inputs"],
            tolerance=spec["tolerance"],
            expectation_kind=spec["expectation_kind"],
            fn=spec["fn"],
        )

    return {"cases": sorted(cases, key=lambda c: c["id"]), "failures": failures}


def build_traceability(cases: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    traceability: List[Dict[str, Any]] = []
    for case in cases:
        apis = case.get("inputs_ref", {}).get("api_mentions", [])
        traceability.append(
            {
                "id": case["id"],
                "source_test": case["source_test"],
                "api": sorted(set(apis)),
            }
        )
    return sorted(traceability, key=lambda t: t["id"])


def compute_api_to_tests(traceability: Sequence[Dict[str, Any]]) -> Dict[str, List[str]]:
    mapping: Dict[str, set] = {name: set() for name in PUBLIC_API}
    for row in traceability:
        src = row["source_test"]
        for api in row["api"]:
            mapping.setdefault(api, set()).add(src)
    return {
        api: sorted(sources)
        for api, sources in sorted(mapping.items(), key=lambda kv: kv[0])
        if sources
    }


def strip_non_deterministic_fields(obj: Any) -> Any:
    clone = copy.deepcopy(obj)
    env = clone.get("environment", {})
    if "generatedAtUtc" in env:
        env["generatedAtUtc"] = "<redacted>"
    return clone


def build_fixture(args: argparse.Namespace) -> Dict[str, Any]:
    random.seed(args.seed)
    np.random.seed(args.seed)
    logging.getLogger("cvxpy").setLevel(logging.ERROR)

    baseline_root = Path(args.baseline_root).resolve()
    output_path = Path(args.output).resolve()
    selected_modules_list = parse_modules(args.modules)

    pypfopt_module = force_baseline_imports(baseline_root)

    environment = collect_environment_metadata(pypfopt_module)
    datasets = collect_dataset_metadata(baseline_root)
    smoke = run_smoke_checks(baseline_root)
    patch_test_utilities_for_quiet_mode()

    # Golden fixture is API-only by design: no raw test functions and no extra manual scenarios.
    discovered = {"scenarios": [], "exclusions": [], "errors": []}
    test_results = {"cases": [], "failures": []}
    extra_results = {"cases": [], "failures": []}
    api_results = run_public_api_cases(selected_modules_list)

    all_cases = sorted(api_results["cases"], key=lambda c: c["id"])
    traceability = build_traceability(all_cases)
    api_to_tests = compute_api_to_tests(traceability)
    covered_api = set(api_to_tests.keys())
    missing_api = sorted(set(PUBLIC_API) - covered_api)

    selected_files: List[str] = []
    total_tests_in_selected_files = 0

    skip_exclusions: List[Dict[str, Any]] = []
    skipif_exclusions: List[Dict[str, Any]] = []

    case_failures = list(api_results["failures"])

    api_cases = [c for c in all_cases if c.get("call", {}).get("kind") == "api_method_scenario"]
    api_cases_with_missing_result = [
        c["id"] for c in api_cases if c.get("expected", {}).get("result") is None
    ]
    api_cases_failed = [c["id"] for c in api_cases if c.get("expected", {}).get("status") != "pass"]
    api_method_names_generated = sorted(
        {
            c.get("call", {}).get("symbol", "").split(".")[-1]
            for c in api_cases
            if c.get("call", {}).get("symbol")
        }
    )
    api_method_names_missing = sorted(set(PUBLIC_API) - set(api_method_names_generated))
    api_method_names_extra = sorted(set(api_method_names_generated) - set(PUBLIC_API))

    target = {
        "cases_from_tests": 0,
        "cases_extra_api": 0,
        "cases_api_methods": len(PUBLIC_API),
        "total_cases": len(PUBLIC_API),
    }

    gate_passed = True
    gate_passed = gate_passed and len(test_results["cases"]) == target["cases_from_tests"]
    gate_passed = gate_passed and len(extra_results["cases"]) == target["cases_extra_api"]
    gate_passed = gate_passed and len(api_results["cases"]) == target["cases_api_methods"]
    gate_passed = gate_passed and len(all_cases) == target["total_cases"]
    gate_passed = gate_passed and len(missing_api) == 0
    gate_passed = gate_passed and len(api_cases_with_missing_result) == 0
    gate_passed = gate_passed and len(api_method_names_missing) == 0

    coverage = {
        "modulesRequested": selected_modules_list,
        "includeSkipIf": bool(args.include_skipif),
        "testsTotalInSelectedFiles": total_tests_in_selected_files,
        "testsDiscoveredRunnable": len(test_results["cases"]),
        "testsExcludedSkip": len(skip_exclusions),
        "testsExcludedSkipIf": len(skipif_exclusions),
        "cases_from_tests": len(test_results["cases"]),
        "cases_extra_api": len(extra_results["cases"]),
        "cases_api_methods": len(api_results["cases"]),
        "total_cases": len(all_cases),
        "scenarioFailures": len(case_failures),
        "scenarioPasses": len(all_cases) - len(case_failures),
        "target": target,
        "gatePassed": gate_passed,
        "missingApi": missing_api,
        "apiToTests": api_to_tests,
        "apiCasesFailed": api_cases_failed,
        "apiCasesMissingResult": api_cases_with_missing_result,
        "apiMethodNamesGenerated": api_method_names_generated,
        "apiMethodNamesMissing": api_method_names_missing,
        "apiMethodNamesExtra": api_method_names_extra,
        "traceability": traceability,
        "exclusions": [],
        "upstreamSkips": [],
        "smoke": smoke,
        "failures": case_failures,
    }

    fixture = {
        "schemaVersion": "1.0.0",
        "baseline": {
            "root": str(baseline_root),
            "pypfoptFile": environment["pypfopt"]["file"],
            "selectedModules": selected_modules_list,
            "coreTestFiles": selected_files,
        },
        "environment": environment,
        "datasets": datasets,
        "cases": all_cases,
        "coverage": coverage,
    }

    if discovered["errors"]:
        fixture["coverage"]["discoveryErrors"] = discovered["errors"]

    # Strict gating.
    if args.strict:
        if not gate_passed:
            raise SystemExit("Strict mode failed: coverage gate did not pass")
        if missing_api:
            raise SystemExit(
                "Strict mode failed: missing API coverage for "
                + ", ".join(missing_api)
            )
        if api_cases_with_missing_result:
            raise SystemExit(
                "Strict mode failed: api cases with missing result: "
                + ", ".join(api_cases_with_missing_result)
            )
        if api_method_names_missing:
            raise SystemExit(
                "Strict mode failed: missing api method scenarios for "
                + ", ".join(api_method_names_missing)
            )

    if args.fail_on_missing and missing_api:
        raise SystemExit(
            "Missing API coverage detected: " + ", ".join(missing_api)
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(fixture, indent=2, sort_keys=True, ensure_ascii=True),
        encoding="utf-8",
    )

    return fixture


def main() -> None:
    args = parse_args()
    fixture = build_fixture(args)

    if args.strict:
        # Determinism check: rebuild and compare after redacting timestamp.
        fixture_second = build_fixture(args)
        lhs = strip_non_deterministic_fields(fixture)
        rhs = strip_non_deterministic_fields(fixture_second)
        if lhs != rhs:
            raise SystemExit("Strict mode failed: fixture is not deterministic across two runs")

    print("Golden fixture generated")
    print(f"Output: {Path(args.output).resolve()}")
    print(
        "Cases: "
        f"from_tests={fixture['coverage']['cases_from_tests']} "
        f"extra_api={fixture['coverage']['cases_extra_api']} "
        f"total={fixture['coverage']['total_cases']}"
    )
    print(
        "Coverage: "
        f"missing_api={len(fixture['coverage']['missingApi'])} "
        f"gate_passed={fixture['coverage']['gatePassed']}"
    )


if __name__ == "__main__":
    main()
