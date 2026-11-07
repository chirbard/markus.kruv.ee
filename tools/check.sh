#!/bin/bash
# Run from any directory; Homebrew provides the three standalone tools.
set -euo pipefail
cd "$(dirname "$0")/.."
biome check --error-on-warnings .
ruff check tools/seq-css.py
ruff format --check tools/seq-css.py
shellcheck tools/media/*.sh tools/check.sh
