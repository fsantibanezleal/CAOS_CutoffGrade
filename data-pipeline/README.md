# data-pipeline/ — the offline engine (`cglab`)

Rename `cglab` → `<slug>lab` per product. The **single source of physics/algorithm truth**; `frontend/` and
`app/` consume it, never re-implement it. Its own venv: **`.venv-pipeline`** (heavy SOTA engines, local-only).

## Layout (the package lives directly under `data-pipeline/`)
- `cglab/pipeline.py` — orchestrator + CLI (`python -m cglab.pipeline [all|<case>] [--seed N]`)
- `cglab/registry.py` — cases grouped by CATEGORY · `cglab/live.py` — Pyodide live entrypoint
- `cglab/io/` — `contract.py` (**CONTRACT 1**) · `formats.py` (standard readers/writers) · `schema.py` (types)
- `cglab/core/` — `rng.py` (seeded determinism) · `trace.py` · `manifest.py` (**CONTRACT 2**) · `gate.py`
- `cglab/model/` — the shared pure-Python core (Pyodide-safe); EXAMPLE = SIR
- `cglab/stages/` — `preprocess → feature_extraction → train → infer → evaluate → export`
- `cglab/cases/` — documented cases

Setup + run: `scripts/setup.{sh,ps1}` then `scripts/precompute.{sh,ps1}`. See
[../docs/architecture/05_precompute-pipeline.md](../docs/architecture/05_precompute-pipeline.md).
