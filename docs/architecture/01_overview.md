# Architecture — overview

CutoffGrade Studio is an instance of the **CAOS product-repo archetype** ([ADR-0057]): an offline-pipeline-heavy,
backend-optional product that deploys as a static, deterministic-replay viewer. The base is **frozen** (instantiated,
never re-litigated); per-product rework lives only in the **core** — the optimization engine, the visualisations, the
cases, content.

The distinctive thing about CutoffGrade is that the **optimization is the live lane**: the grade-tonnage curve + Lane's
cut-offs + the NPV optimizer are TypeScript that run in the browser, and the cut-off/NPV surrogate runs via
onnxruntime-web — so the App re-optimizes as you drag the price, costs, capacities or discount rate.

## The lanes (and what runs where)

| Lane | Where | Deps | Notes |
|---|---|---|---|
| **Live (client-side)** | `frontend/src/lane/` (grade-tonnage + Lane cut-offs + NPV optimizer) + onnxruntime-web (the surrogate) | web npm | the interactive core; re-optimizes on every control change |
| **Offline (precompute)** | `cglab/science/` — Node bake of the SAME TS engine + torch training | `data-pipeline/requirements-precompute.txt` | bakes `case-results.json` + the ONNX |
| **Replay (light)** | `cglab.pipeline` (numpy) | `data-pipeline/requirements.txt` | reshapes the committed bake → per-case traces + manifests |
| **API (backend)** | `app/` (FastAPI) | `requirements-api.txt` | DORMANT; activate only on an ADR-0002 trigger |

A measured **[gate](03_the-gate.md)** records the live-vs-replay verdict per case (at teaching scale every case is LIVE).

## The flow

`deposit + economics (a case or yours)` → **[CONTRACT 1](08_data-contracts.md)** (`io/contract.py`) → the TS Lane
engine (bake) → `case-results.json` → **[CONTRACT 2](08_data-contracts.md)** (`core/manifest.py` + `core/trace.py`, the
compact per-case trace) → `data/derived/` (committed) → the `frontend/` App replays it **and** re-optimizes it live.

## Frozen base vs rework

- **Frozen:** the folder layout, the two contracts, the staged pipeline names, the gate, the manifest/trace, the
  two-venv split, the cases-by-category mechanism, CI guards.
- **Rework (the only per-product surface):** the optimization engine (`frontend/src/lane/` + the stage bodies), the
  `frontend/` visualisations, and the cases + content.

## What CutoffGrade is and is NOT

- **Is:** Lane's economic cut-off grade implemented exactly — the grade-tonnage curve, the six characteristic cut-offs,
  the exact NPV life simulator and the declining high-grading trajectory, with an honest surrogate-vs-exact comparison
  and an out-of-envelope flag.
- **Is NOT:** a strategic mine planner (no phase sequencing, no pushbacks, no multi-element blending or geological
  uncertainty). The deposits + economics are synthetic; the surrogate is measured against the exact optimizer.

[ADR-0057]: ../../../conventions/architecture/0-archetype/ADR-0057-product-repo-archetype.md
