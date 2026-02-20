# JsPortfolioOpt

JavaScript parity layer for PyPortfolioOpt.
Reference docs: https://pyportfolioopt.readthedocs.io/en/latest/index.html

## Current project layout

- Python reference library is loaded from the local venv install: `.venv_golden/lib/python3.9/site-packages/pypfopt`
- Golden/parity datasets are in `./data`:
  - `data/stock_prices.csv`
  - `data/spy_prices.csv`
  - `data/cov_matrix.csv`
- Generated fixture path: `golden-PyPortfolioOpt/golden.json`
- JS parity test entrypoint: `golden.test.js`

## Python setup (golden generation)

```bash
python3 -m venv .venv_golden
source .venv_golden/bin/activate
pip install -U pip
pip install -r requirements.in
```

`requirements.in` currently contains only:

```txt
PyPortfolioOpt
```

## Generate golden fixture

Default run:

```bash
.venv_golden/bin/python generate_golden.py
```

This generates `golden-PyPortfolioOpt/golden.json`.

CLI options currently supported:

- `--baseline-root` (default: `.venv_golden/lib/python3.9/site-packages`)
- `--data-root` (default: `data`)
- `--output` (default: `golden-PyPortfolioOpt/golden.json`)
- `--modules` (default: `all`)
- `--seed` (default: `1337`)
- `--fail-on-missing`

Accepted module names for `--modules`:

- `expected_returns`
- `risk_models`
- `objective_functions`
- `discrete_allocation`
- `black_litterman`
- `cla`
- `hrp`
- `base_optimizer`
- `efficient_frontier`
- `efficient_semivariance`
- `efficient_cvar`
- `efficient_cdar`

Example:

```bash
.venv_golden/bin/python generate_golden.py --modules expected_returns,risk_models --fail-on-missing
```

## JS setup and parity test

```bash
npm install
npm test -- golden.test.js
```

## JS module layout

- `src/expected_returns.js`
- `src/risk_models.js`
- `src/objective_functions.js`
- `src/efficient_frontier/*`
- `src/cla.js`
- `src/black_litterman.js`
- `src/hierarchical_portfolio.js`
- `src/discrete_allocation.js`
- `src/custom.js` (JS-only extensions, not part of PyPortfolioOpt)
- `src/index.js`
