#!/usr/bin/env python3
"""Generate a minimal golden fixture for the selected PyPortfolioOpt public APIs.

Output shape (minimal):
{
  "datasets": {"stock_prices": "...", ...},
  "tests": [
    {
      "id": "api::pypfopt.expected_returns.returns_from_prices",
      "api": "returns_from_prices",
      "symbol": "pypfopt.expected_returns.returns_from_prices",
      "datasets": ["stock_prices"],
      "tolerance": {"atol": 1e-8, "rtol": 1e-6},
      "expected": ...
    }
  ]
}
"""

from __future__ import annotations

import argparse
import importlib
import json
import random
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Sequence

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DEFAULT_BASELINE_ROOT = ROOT / "references" / "PyPortfolioOpt-main"
DEFAULT_OUTPUT = ROOT / "golden-PyPortfolioOpt" / "golden.json"

DEFAULT_TOLERANCE = {"atol": 1e-8, "rtol": 1e-6}
SOLVER_SENSITIVE_TOLERANCE = {"atol": 1e-4, "rtol": 1e-3}
INVARIANT_TOLERANCE = {"atol": 0.0, "rtol": 0.0}

DATASET_FILES = {
    "stock_prices": "tests/resources/stock_prices.csv",
    "spy_prices": "tests/resources/spy_prices.csv",
    "cov_matrix": "tests/resources/cov_matrix.csv",
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


@dataclass(frozen=True)
class ApiSpec:
    api: str
    symbol: str
    module: str
    datasets: Sequence[str]
    tolerance: Dict[str, float]
    fn: Callable[[], Any]
    case_id: str | None = None
    params: Dict[str, Any] | None = None

"""
Custom prior generation for black-litterman tests
returns: DataFrame of asset returns
mu: Series of expected returns (optional, only for momentum_positive) see mean_historical_return or ema_historical_return
prior_method: Method to generate the prior ("equal_weighted", "risk_parity", "inverse_variance", "momentum_positive", "blend_eq_inv_vol")
prior_blend_alpha: Blending factor for "blend_eq_inv_vol" method
"""
def get_prior(returns, mu=None, prior_method="equal_weighted", prior_blend_alpha=0.5):

    if prior_method == "risk_parity":
        vol = returns.std()
        vol = vol.replace(0, vol[vol > 0].min() if (vol > 0).any() else 1e-6)
        inv_vol = 1 / vol
        return inv_vol / inv_vol.sum()

    elif prior_method == "inverse_variance":
        var = returns.var()
        var = var.replace(0, var[var > 0].min() if (var > 0).any() else 1e-6)
        inv_var = 1 / var
        return inv_var / inv_var.sum()

    elif prior_method == "momentum_positive":

        if mu is None:
            raise ValueError("Per il metodo 'momentum_positive', è necessario fornire 'mu'.")

        mu_pos = mu.clip(lower=0.0)
        if mu_pos.sum() <= 0:
            return pd.Series(1.0 / len(returns.columns), index=returns.columns)
        else:
            return mu_pos / mu_pos.sum()

    elif prior_method == "blend_eq_inv_vol":
        vol = returns.std()
        vol = vol.replace(0, vol[vol > 0].min() if (vol > 0).any() else 1e-6)
        inv_vol = 1 / vol
        inv_vol = inv_vol / inv_vol.sum()
        alpha = prior_blend_alpha
        alpha = min(max(alpha, 0.0), 1.0)
        eq = pd.Series(1.0 / len(returns.columns), index=returns.columns)
        return alpha * eq + (1 - alpha) * inv_vol

    elif prior_method == "equal_weighted":
        n = len(returns.columns)
        return pd.Series(1.0/n, index=returns.columns)
    
    else:
        raise ValueError(f"Metodo prior non supportato: {prior_method}")

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--baseline-root",
        default=str(DEFAULT_BASELINE_ROOT),
        help="Path to PyPortfolioOpt baseline root",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Output JSON file",
    )
    parser.add_argument(
        "--modules",
        nargs="*",
        default=["all"],
        help="Optional module filter (space/comma separated)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=1337,
        help="Deterministic seed",
    )
    parser.add_argument(
        "--fail-on-missing",
        action="store_true",
        help="Fail if any PUBLIC_API entry is missing in generated tests",
    )
    return parser.parse_args()


def parse_modules(raw_tokens: Sequence[str]) -> List[str]:
    known = {
        "expected_returns",
        "risk_models",
        "objective_functions",
        "discrete_allocation",
        "black_litterman",
        "cla",
        "hrp",
        "base_optimizer",
        "efficient_frontier",
        "efficient_semivariance",
        "efficient_cvar",
        "efficient_cdar",
    }

    tokens: List[str] = []
    for item in raw_tokens:
        for token in item.split(","):
            norm = token.strip().lower()
            if norm:
                tokens.append(norm)

    if not tokens or "all" in tokens:
        return sorted(known)

    unknown = sorted(set(tokens) - known)
    if unknown:
        raise SystemExit(f"Unknown module(s): {', '.join(unknown)}")
    return sorted(set(tokens))


def path_is_under(child: Path, parent: Path) -> bool:
    try:
        child.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def force_baseline_imports(baseline_root: Path):
    if not baseline_root.exists():
        raise SystemExit(f"Baseline root does not exist: {baseline_root}")

    sys.path.insert(0, str(baseline_root.resolve()))
    if "pypfopt" in sys.modules:
        del sys.modules["pypfopt"]

    pypfopt = importlib.import_module("pypfopt")
    pypfopt_file = Path(pypfopt.__file__).resolve()
    if not path_is_under(pypfopt_file, baseline_root):
        raise SystemExit(
            "Baseline guardrail failed: imported pypfopt from "
            f"{pypfopt_file}, expected under {baseline_root.resolve()}"
        )
    return pypfopt


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
        if np.issubdtype(type(value), np.floating):
            return sanitize_float(float(value))
        if np.issubdtype(type(value), np.datetime64):
            return pd.Timestamp(value).isoformat()
        return value.item()

    if isinstance(value, float):
        return sanitize_float(value)

    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat()

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

    if isinstance(value, (list, tuple, np.ndarray)):
        return [canonicalize(v) for v in list(value)]

    if isinstance(value, dict):
        out: Dict[str, Any] = {}
        for key in sorted(value.keys(), key=lambda k: str(k)):
            out[str(key)] = canonicalize(value[key])
        return out

    return value


def build_dataset_refs(baseline_root: Path) -> Dict[str, Any]:
    refs: Dict[str, str] = {}
    for name, rel in DATASET_FILES.items():
        abs_path = baseline_root / rel
        if not abs_path.exists():
            raise SystemExit(f"Missing dataset file: {abs_path}")
        refs[name] = str(abs_path.resolve())
    return refs


def patch_cla_numpy2_compat() -> None:
    """Patch CLA scalar conversions for NumPy 2 behavior."""

    cla_module = importlib.import_module("pypfopt.cla")

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
        if c == 0:
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

    cla_module.CLA._compute_w = _compute_w_numpy2_compat
    cla_module.CLA._compute_lambda = _compute_lambda_numpy2_compat


def build_api_specs(selected_modules: Sequence[str]) -> List[ApiSpec]:
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
    bl_view_confidences = np.array([0.55, 0.70, 0.90])

    def black_litterman_payload(
        *,
        tau: float,
        risk_free_rate: float,
        omega: str | None = None,
        view_confidences: Sequence[float] | None = None,
    ) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {
            "pi": prior,
            "absolute_views": absolute_views,
            "tau": tau,
        }
        if omega is not None:
            kwargs["omega"] = omega
        if view_confidences is not None:
            kwargs["view_confidences"] = np.array(view_confidences, dtype=float)

        make_model = lambda: BlackLittermanModel(cov, **kwargs)
        bl_returns = make_model().bl_returns()
        bl_cov = make_model().bl_cov()
        bl_weights = make_model().bl_weights(delta)
        perf_model = make_model()
        perf_model.bl_weights(delta)
        perf = perf_model.portfolio_performance(risk_free_rate=risk_free_rate)
        return {
            "bl_returns": bl_returns,
            "bl_cov": bl_cov,
            "bl_weights": bl_weights,
            "portfolio_performance": perf,
        }

    specs = [
        ApiSpec(
            api="returns_from_prices",
            symbol="pypfopt.expected_returns.returns_from_prices",
            module="expected_returns",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: expected_returns.returns_from_prices(df_clean),
        ),
        ApiSpec(
            api="prices_from_returns",
            symbol="pypfopt.expected_returns.prices_from_returns",
            module="expected_returns",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: expected_returns.prices_from_returns(returns_df.copy()),
        ),
        ApiSpec(
            api="return_model",
            symbol="pypfopt.expected_returns.return_model",
            module="expected_returns",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: expected_returns.return_model(df_clean, method="mean_historical_return"),
        ),
        ApiSpec(
            api="mean_historical_return",
            symbol="pypfopt.expected_returns.mean_historical_return",
            module="expected_returns",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: expected_returns.mean_historical_return(df_clean),
        ),
        ApiSpec(
            api="ema_historical_return",
            symbol="pypfopt.expected_returns.ema_historical_return",
            module="expected_returns",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: expected_returns.ema_historical_return(df_clean),
        ),
        ApiSpec(
            api="risk_matrix",
            symbol="pypfopt.risk_models.risk_matrix",
            module="risk_models",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: risk_models.risk_matrix(df_clean, method="sample_cov"),
        ),
        ApiSpec(
            api="sample_cov",
            symbol="pypfopt.risk_models.sample_cov",
            module="risk_models",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: risk_models.sample_cov(df_clean),
        ),
        ApiSpec(
            api="semicovariance",
            symbol="pypfopt.risk_models.semicovariance",
            module="risk_models",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: risk_models.semicovariance(df_clean),
        ),
        ApiSpec(
            api="exp_cov",
            symbol="pypfopt.risk_models.exp_cov",
            module="risk_models",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: risk_models.exp_cov(df_clean, span=180),
        ),
        ApiSpec(
            api="CovarianceShrinkage",
            symbol="pypfopt.risk_models.CovarianceShrinkage",
            module="risk_models",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "sample": CovarianceShrinkage(df_clean).S,
                "shrunk_covariance": CovarianceShrinkage(df_clean).shrunk_covariance(),
                "ledoit_wolf": CovarianceShrinkage(df_clean).ledoit_wolf(),
                "oracle_approximating": CovarianceShrinkage(df_clean).oracle_approximating(),
            },
        ),
        ApiSpec(
            api="portfolio_variance",
            symbol="pypfopt.objective_functions.portfolio_variance",
            module="objective_functions",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: objective_functions.portfolio_variance(equal_w, cov),
        ),
        ApiSpec(
            api="portfolio_return",
            symbol="pypfopt.objective_functions.portfolio_return",
            module="objective_functions",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: objective_functions.portfolio_return(equal_w, mu, negative=False),
        ),
        ApiSpec(
            api="sharpe_ratio",
            symbol="pypfopt.objective_functions.sharpe_ratio",
            module="objective_functions",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: objective_functions.sharpe_ratio(
                equal_w, mu, cov, risk_free_rate=0.02, negative=False
            ),
        ),
        ApiSpec(
            api="L2_reg",
            symbol="pypfopt.objective_functions.L2_reg",
            module="objective_functions",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: objective_functions.L2_reg(equal_w, gamma=2),
        ),
        ApiSpec(
            api="quadratic_utility",
            symbol="pypfopt.objective_functions.quadratic_utility",
            module="objective_functions",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: objective_functions.quadratic_utility(
                equal_w, mu, cov, risk_aversion=1.5, negative=False
            ),
        ),
        ApiSpec(
            api="DiscreteAllocation",
            symbol="pypfopt.discrete_allocation.DiscreteAllocation",
            module="discrete_allocation",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "greedy": DiscreteAllocation(
                    equal_w_dict, latest_prices, total_portfolio_value=10000
                ).greedy_portfolio(reinvest=False),
                "lp": DiscreteAllocation(
                    equal_w_dict, latest_prices, total_portfolio_value=10000
                ).lp_portfolio(reinvest=False),
            },
        ),
        ApiSpec(
            api="BlackLittermanModel",
            symbol="pypfopt.black_litterman.BlackLittermanModel",
            module="black_litterman",
            datasets=["stock_prices", "spy_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: black_litterman_payload(tau=0.05, risk_free_rate=0.02),
            params={"tau": 0.05, "risk_free_rate": 0.02},
        ),
        ApiSpec(
            api="BlackLittermanModel",
            symbol="pypfopt.black_litterman.BlackLittermanModel",
            module="black_litterman",
            datasets=["stock_prices", "spy_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: black_litterman_payload(tau=0.01, risk_free_rate=0.0),
            case_id="api::pypfopt.black_litterman.BlackLittermanModel::tau_0_01_rfr_0_00",
            params={"tau": 0.01, "risk_free_rate": 0.0},
        ),
        ApiSpec(
            api="BlackLittermanModel",
            symbol="pypfopt.black_litterman.BlackLittermanModel",
            module="black_litterman",
            datasets=["stock_prices", "spy_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: black_litterman_payload(tau=0.10, risk_free_rate=0.01),
            case_id="api::pypfopt.black_litterman.BlackLittermanModel::tau_0_10_rfr_0_01",
            params={"tau": 0.1, "risk_free_rate": 0.01},
        ),
        ApiSpec(
            api="BlackLittermanModel",
            symbol="pypfopt.black_litterman.BlackLittermanModel",
            module="black_litterman",
            datasets=["stock_prices", "spy_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: black_litterman_payload(
                tau=0.05,
                risk_free_rate=0.02,
                omega="idzorek",
                view_confidences=bl_view_confidences,
            ),
            case_id="api::pypfopt.black_litterman.BlackLittermanModel::omega_idzorek_conf_tau_0_05_rfr_0_02",
            params={
                "tau": 0.05,
                "risk_free_rate": 0.02,
                "omega": "idzorek",
                "view_confidences": [0.55, 0.7, 0.9],
            },
        ),
        ApiSpec(
            api="market_implied_prior_returns",
            symbol="pypfopt.black_litterman.market_implied_prior_returns",
            module="black_litterman",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: market_implied_prior_returns(market_caps, 1.0, cov, risk_free_rate=0.02),
            params={"risk_free_rate": 0.02},
        ),
        ApiSpec(
            api="market_implied_prior_returns",
            symbol="pypfopt.black_litterman.market_implied_prior_returns",
            module="black_litterman",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: market_implied_prior_returns(market_caps, 1.0, cov, risk_free_rate=0.0),
            case_id="api::pypfopt.black_litterman.market_implied_prior_returns::rfr_0_00",
            params={"risk_free_rate": 0.0},
        ),
        ApiSpec(
            api="market_implied_prior_returns",
            symbol="pypfopt.black_litterman.market_implied_prior_returns",
            module="black_litterman",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: market_implied_prior_returns(market_caps, 1.0, cov, risk_free_rate=0.01),
            case_id="api::pypfopt.black_litterman.market_implied_prior_returns::rfr_0_01",
            params={"risk_free_rate": 0.01},
        ),
        ApiSpec(
            api="market_implied_risk_aversion",
            symbol="pypfopt.black_litterman.market_implied_risk_aversion",
            module="black_litterman",
            datasets=["spy_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: market_implied_risk_aversion(benchmark_prices, risk_free_rate=0.02),
            params={"risk_free_rate": 0.02},
        ),
        ApiSpec(
            api="market_implied_risk_aversion",
            symbol="pypfopt.black_litterman.market_implied_risk_aversion",
            module="black_litterman",
            datasets=["spy_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: market_implied_risk_aversion(benchmark_prices, risk_free_rate=0.0),
            case_id="api::pypfopt.black_litterman.market_implied_risk_aversion::rfr_0_00",
            params={"risk_free_rate": 0.0},
        ),
        ApiSpec(
            api="market_implied_risk_aversion",
            symbol="pypfopt.black_litterman.market_implied_risk_aversion",
            module="black_litterman",
            datasets=["spy_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: market_implied_risk_aversion(benchmark_prices, risk_free_rate=0.01),
            case_id="api::pypfopt.black_litterman.market_implied_risk_aversion::rfr_0_01",
            params={"risk_free_rate": 0.01},
        ),
        ApiSpec(
            api="CLA",
            symbol="pypfopt.cla.CLA",
            module="cla",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "max_sharpe": CLA(mu, cov).max_sharpe(),
                "min_volatility": CLA(mu, cov).min_volatility(),
                "portfolio_performance": (
                    lambda cla=CLA(mu, cov): (cla.max_sharpe(), cla.portfolio_performance())[1]
                )(),
            },
        ),
        ApiSpec(
            api="HRPOpt",
            symbol="pypfopt.hierarchical_portfolio.HRPOpt",
            module="hrp",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "optimize": HRPOpt(returns_df).optimize(),
                "portfolio_performance": (
                    lambda hrp=HRPOpt(returns_df): (hrp.optimize(), hrp.portfolio_performance())[1]
                )(),
            },
        ),
        ApiSpec(
            api="BaseOptimizer",
            symbol="pypfopt.base_optimizer.BaseOptimizer",
            module="base_optimizer",
            datasets=["stock_prices"],
            tolerance=INVARIANT_TOLERANCE,
            fn=lambda: (
                lambda bo=base_optimizer.BaseOptimizer(n_assets, tickers): {
                    "set_weights": bo.set_weights(equal_w_dict),
                    "clean_weights": bo.clean_weights(),
                }
            )(),
        ),
        ApiSpec(
            api="BaseConvexOptimizer",
            symbol="pypfopt.base_optimizer.BaseConvexOptimizer",
            module="base_optimizer",
            datasets=["stock_prices"],
            tolerance=INVARIANT_TOLERANCE,
            fn=lambda: (
                lambda bco=base_optimizer.BaseConvexOptimizer(n_assets, tickers), gamma=cp.Parameter(
                    name="gamma", value=1.0, nonneg=True
                ): (
                    bco.add_constraint(lambda w: cp.sum(w) <= (gamma + 10)),
                    bco.update_parameter_value("gamma", 2.5),
                    {
                        "gamma_defined": bco.is_parameter_defined("gamma"),
                        "gamma_value": float(gamma.value),
                        "clone_constraints": len(bco.deepcopy()._constraints),
                    },
                )[-1]
            )(),
        ),
        ApiSpec(
            api="EfficientFrontier",
            symbol="pypfopt.efficient_frontier.EfficientFrontier",
            module="efficient_frontier",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "min_volatility": EfficientFrontier(mu, cov).min_volatility(),
                "max_sharpe": EfficientFrontier(mu, cov).max_sharpe(risk_free_rate=0.02),
                "max_quadratic_utility": EfficientFrontier(mu, cov).max_quadratic_utility(
                    risk_aversion=1.0
                ),
                "efficient_return": EfficientFrontier(mu, cov).efficient_return(
                    target_return=float(np.percentile(mu, 40))
                ),
                "efficient_risk": EfficientFrontier(mu, cov).efficient_risk(target_volatility=0.30),
                "portfolio_performance": (
                    lambda ef=EfficientFrontier(mu, cov): (
                        ef.min_volatility(),
                        ef.portfolio_performance(risk_free_rate=0.02),
                    )[1]
                )(),
            },
        ),
        ApiSpec(
            api="EfficientSemivariance",
            symbol="pypfopt.efficient_frontier.EfficientSemivariance",
            module="efficient_semivariance",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "min_semivariance": EfficientSemivariance(mu, returns_df).min_semivariance(),
                "efficient_return": EfficientSemivariance(mu, returns_df).efficient_return(
                    target_return=float(np.percentile(mu, 30))
                ),
                "efficient_risk": EfficientSemivariance(mu, returns_df).efficient_risk(
                    target_semideviation=0.35
                ),
                "portfolio_performance": (
                    lambda es=EfficientSemivariance(mu, returns_df): (
                        es.min_semivariance(),
                        es.portfolio_performance(risk_free_rate=0.02),
                    )[1]
                )(),
            },
        ),
        ApiSpec(
            api="EfficientCVaR",
            symbol="pypfopt.efficient_frontier.EfficientCVaR",
            module="efficient_cvar",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "min_cvar": EfficientCVaR(mu, returns_df).min_cvar(),
                "efficient_return": EfficientCVaR(mu, returns_df).efficient_return(
                    target_return=float(np.percentile(mu, 30))
                ),
                "efficient_risk": EfficientCVaR(mu, returns_df).efficient_risk(target_cvar=0.08),
                "portfolio_performance": (
                    lambda ec=EfficientCVaR(mu, returns_df): (ec.min_cvar(), ec.portfolio_performance())[1]
                )(),
            },
        ),
        ApiSpec(
            api="EfficientCDaR",
            symbol="pypfopt.efficient_frontier.EfficientCDaR",
            module="efficient_cdar",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: {
                "min_cdar": EfficientCDaR(mu, returns_df).min_cdar(),
                "efficient_return": EfficientCDaR(mu, returns_df).efficient_return(
                    target_return=float(np.percentile(mu, 30))
                ),
                "efficient_risk": EfficientCDaR(mu, returns_df).efficient_risk(target_cdar=0.10),
                "portfolio_performance": (
                    lambda ed=EfficientCDaR(mu, returns_df): (ed.min_cdar(), ed.portfolio_performance())[1]
                )(),
            },
        ),
        ApiSpec(
            api="default_omega",
            symbol="pypfopt.black_litterman.BlackLittermanModel.default_omega",
            module="black_litterman",
            datasets=["stock_prices"],
            tolerance=DEFAULT_TOLERANCE,
            fn=lambda: BlackLittermanModel.default_omega(cov.values, p_small, tau=0.05),
        ),
        ApiSpec(
            api="idzorek_method",
            symbol="pypfopt.black_litterman.BlackLittermanModel.idzorek_method",
            module="black_litterman",
            datasets=["stock_prices"],
            tolerance=SOLVER_SENSITIVE_TOLERANCE,
            fn=lambda: BlackLittermanModel.idzorek_method(
                confidences_small,
                cov.values,
                pi_small,
                q_small,
                p_small,
                tau=0.05,
                risk_aversion=1,
            ),
        ),
    ]

    selected = set(selected_modules)
    return [spec for spec in specs if spec.module in selected]


def build_fixture(args: argparse.Namespace) -> Dict[str, Any]:
    random.seed(args.seed)
    np.random.seed(args.seed)

    baseline_root = Path(args.baseline_root).resolve()
    output_path = Path(args.output).resolve()

    force_baseline_imports(baseline_root)
    patch_cla_numpy2_compat()

    selected_modules = parse_modules(args.modules)
    dataset_refs = build_dataset_refs(baseline_root)

    tests: List[Dict[str, Any]] = []
    generated_api_names: List[str] = []
    seen_ids: set[str] = set()

    for spec in build_api_specs(selected_modules):
        try:
            expected = canonicalize(spec.fn())
        except Exception as exc:
            raise SystemExit(
                f"Failed generating expected output for {spec.symbol}: "
                f"{type(exc).__name__}: {exc}"
            ) from exc

        case_id = spec.case_id or f"api::{spec.symbol}"
        if case_id in seen_ids:
            raise SystemExit(f"Duplicate test id generated: {case_id}")
        seen_ids.add(case_id)

        test_case = {
            "id": case_id,
            "api": spec.api,
            "symbol": spec.symbol,
            "datasets": list(spec.datasets),
            "tolerance": dict(spec.tolerance),
            "expected": expected,
        }
        if spec.params is not None:
            test_case["params"] = canonicalize(spec.params)
        tests.append(test_case)
        generated_api_names.append(spec.api)

    tests = sorted(tests, key=lambda item: item["id"])
    missing_api = sorted(set(PUBLIC_API) - set(generated_api_names))

    if args.fail_on_missing and missing_api:
        raise SystemExit("Missing API coverage: " + ", ".join(missing_api))

    fixture = {
        "datasets": dataset_refs,
        "tests": tests,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(fixture, indent=2, sort_keys=True, ensure_ascii=True), encoding="utf-8")

    print("Golden fixture generated")
    print(f"Output: {output_path}")
    print(f"Tests: {len(tests)}")
    print(f"Missing API: {len(missing_api)}")

    return fixture


def main() -> None:
    args = parse_args()
    build_fixture(args)


if __name__ == "__main__":
    main()
