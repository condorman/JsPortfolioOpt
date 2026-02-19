#!/usr/bin/env python3
"""
Generate golden-output fixtures for PyPortfolioOpt parity tests.
"""

from __future__ import annotations
import os
import pypfopt

ROOT = os.path.abspath(os.path.dirname(__file__))
FIXTURE_DIR = os.path.join(ROOT, "golden-PyPortfolioOpt")
FIXTURE_PATH = os.path.join(FIXTURE_DIR, "golden.json")
