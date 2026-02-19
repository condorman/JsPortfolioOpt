# JsPortfolioOpt

JavaScript implementation of PyPortfolioOpt-like logic.
Reference docs: https://pyportfolioopt.readthedocs.io/en/latest/index.html

## Repository Goals

1. Build a deterministic golden fixture from `references/PyPortfolioOpt-main`.
2. Use the golden fixture as parity baseline for JS porting.
3. Expose Python-style API + JS-friendly aliases.

## Python Setup (Golden Generation)

```bash
python3 -m venv .venv_golden
source .venv_golden/bin/activate
pip install -U pip
pip install -r requirements.in
```

Recommended runtime for golden fidelity: Python `3.9` to `3.12`.
With Python `3.13` + newest numerical stack, some upstream tests may fail due compatibility changes.

Recommended dedicated env for golden:

```bash
./scripts/bootstrap_golden_env.sh
```

Generate the full golden fixture with strict gates:

```bash
PYTHONPATH=references/PyPortfolioOpt-main \
  .venv_golden/bin/python generate_golden.py \
  --include-skipif \
  --strict \
  --fail-on-missing
```

Quick accuracy check (coverage gate + deterministic rebuild):

```bash
PYTHONPATH=references/PyPortfolioOpt-main \
  .venv_golden/bin/python generate_golden.py \
  --include-skipif \
  --strict \
  --fail-on-missing
```

Output:

- `golden-PyPortfolioOpt/golden.json`

## Golden CLI

`generate_golden.py` supports:

- `--baseline-root`
- `--output`
- `--modules`
- `--include-skipif`
- `--strict`
- `--seed`
- `--fail-on-missing`

## JS Setup

```bash
npm install
npm test
```

## JS Module Layout

- `src/expected_returns.js`
- `src/risk_models.js`
- `src/objective_functions.js`
- `src/efficient_frontier/*`
- `src/cla.js`
- `src/black_litterman.js`
- `src/hierarchical_portfolio.js`
- `src/discrete_allocation.js`
- `src/index.js`

Note: the pure-JS backend is now partially implemented for core optimizers and utilities.
Exact solver parity with PyPortfolioOpt (especially CLA/convex edge-cases) is still in progress.
