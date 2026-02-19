#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="${1:-$ROOT_DIR/.venv_golden}"
PYTHON_BIN="${PYTHON_BIN:-python3.13}"

"$PYTHON_BIN" -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install -U pip
"$VENV_DIR/bin/pip" install -r "$ROOT_DIR/references/PyPortfolioOpt-main/requirements.txt" pytest ecos "scikit-base<0.14.0" scikit-learn

echo "Golden environment ready: $VENV_DIR"
echo "Run with: PYTHONPATH=$ROOT_DIR/references/PyPortfolioOpt-main $VENV_DIR/bin/python $ROOT_DIR/generate_golden.py --include-skipif"
