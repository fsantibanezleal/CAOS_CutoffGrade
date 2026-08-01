# data-pipeline/, the offline pipeline (`pipeline`)

`pipeline` is CutoffGrade's offline package: the two data contracts + the staged pipeline + the lane gate + the
learned-model lane. NOTE: the Lane engine itself is **TypeScript** (`frontend/src/lane/`), shared by the browser
and the offline bake, `pipeline` validates and orchestrates, it does not re-implement the engine. Its own venv:
**`.venv-pipeline`** (numpy-light default; torch retrain lane per `requirements-precompute.txt`).

## Layout (the package lives directly under `data-pipeline/`)
- `pipeline/pipeline.py`, orchestrator + CLI (`python data-pipeline/run.py [all|<case>] [--seed N] [--retrain]`)
- `pipeline/registry.py`, cases grouped by CATEGORY · `pipeline/live.py`, dormant archetype residue (the live lane is TypeScript, not Pyodide)
- `pipeline/io/`, `contract.py` (**CONTRACT 1**) · `formats.py` (standard readers/writers) · `schema.py` (types)
- `pipeline/core/`, `rng.py` (seeded determinism) · `trace.py` · `manifest.py` (**CONTRACT 2**) · `gate.py`
- `pipeline/model/`, the learned-model feature contracts + torch definitions (`learned.py`)
- `pipeline/stages/`, `preprocess → feature_extraction → train → infer → evaluate → export`
- `pipeline/cases/`, documented cases

Setup + run: `scripts/setup.{sh,ps1}` then `scripts/precompute.{sh,ps1}`. See
[../docs/architecture/05_precompute-pipeline.md](../docs/architecture/05_precompute-pipeline.md).
