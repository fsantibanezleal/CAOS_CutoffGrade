#!/usr/bin/env bash
# Run the offline pipeline (pass-through args). E.g.:  ./scripts/precompute.sh S-BASE --seed 7
set -euo pipefail
cd "$(dirname "$0")/.."
VP=".venv-pipeline/bin/python"; [ -x "$VP" ] || VP=".venv-pipeline/Scripts/python.exe"
"$VP" -m cglab.pipeline "$@"
