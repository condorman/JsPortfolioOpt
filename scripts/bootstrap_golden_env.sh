#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="${1:-$ROOT_DIR/.venv_golden}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Python interpreter not found: $PYTHON_BIN" >&2
  exit 1
fi

PYTHON_VERSION="$("$PYTHON_BIN" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
if [[ "$PYTHON_VERSION" == "3.13" ]]; then
  echo "Warning: Python 3.13 can introduce upstream incompatibilities in PyPortfolioOpt tests." >&2
  echo "Recommendation: use Python 3.9-3.12 for a more stable golden baseline." >&2
fi

"$PYTHON_BIN" -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install -U pip
"$VENV_DIR/bin/pip" install -r "$ROOT_DIR/references/PyPortfolioOpt-main/requirements.txt" pytest ecos "scikit-base<0.14.0" scikit-learn "pandas<3"

echo "Golden environment ready: $VENV_DIR"
echo "Run with: PYTHONPATH=$ROOT_DIR/references/PyPortfolioOpt-main $VENV_DIR/bin/python $ROOT_DIR/generate_golden.py --include-skipif"
