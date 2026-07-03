# CutoffGrade Studio — Lane's optimal cut-off grade

[![CI](https://img.shields.io/github/actions/workflow/status/fsantibanezleal/CAOS_CutoffGrade/ci.yml?branch=main&label=CI)](https://github.com/fsantibanezleal/CAOS_CutoffGrade/actions)
[![License](https://img.shields.io/github/license/fsantibanezleal/CAOS_CutoffGrade)](LICENSE)
[![Version](https://img.shields.io/github/v/tag/fsantibanezleal/CAOS_CutoffGrade?label=version&sort=semver)](https://github.com/fsantibanezleal/CAOS_CutoffGrade/tags)
[![Live demo](https://img.shields.io/badge/demo-live-2ea44f)](https://cutoffgrade.fasl-work.com)

[![CI](https://github.com/fsantibanezleal/CAOS_CutoffGrade/actions/workflows/ci.yml/badge.svg)](https://github.com/fsantibanezleal/CAOS_CutoffGrade/actions)
**Live:** https://cutoffgrade.fasl-work.com

CutoffGrade Studio answers *"what is the most valuable cut-off grade?"* — the boundary that splits rock into ore
(milled) vs waste, chosen to maximise **NPV**, not just immediate profit. Feed a grade-tonnage curve + price, costs and
the three stage capacities (mine / mill / market) and get the optimal **declining cut-off trajectory** (Lane's
high-grading), the NPV, the mine life and the cashflow profile — recomputed **live in your browser** on every slider.

A CAOS/Faena mining web-app instantiated on the **product-repo archetype** ([ADR-0057](docs/architecture/01_overview.md)),
with the in-app ⓘ **Architecture modal** ([ADR-0058](docs/frameworks/02_viz.md)).

## What it does

- **The grade-tonnage curve** — a lognormal deposit gives the ore fraction φ(g) and the average ore grade ḡ(g) above any
  cut-off (analytic), and the break-even cut-off `h/(y(p−k))`.
- **Lane's six cut-offs** — three limiting (mine / mill / market, with the `f + F·δ` opportunity-cost term) + three
  balancing + the Dagdelen median effective optimum.
- **The NPV fixed-point optimization** — an exact year-by-year life simulator solves the fixed point (F couples the
  cut-off and the cashflows), giving the **declining** optimal cut-off trajectory, the NPV, the life and the cashflows.
- **cut-off/NPV surrogate (learned)** — an MLP that predicts [cut-off, NPV, life] for instant Monte-Carlo / sweeps,
  trained offline (torch → ONNX), run **live** (onnxruntime-web), measured downstream vs the exact optimizer.
- **scenario OOD-AE (learned)** — flags economic scenarios outside the training envelope.
- **Bring your own deposit** — CONTRACT 1 validates `{grade_mean, grade_cv, tonnage, price, the costs, recovery, the 3
  capacities, discount_rate}`.

## Honesty

The deposits + economics are **synthetic** (a porphyry-copper-like base case), stated openly. The exact Lane optimizer
is the authority and runs live by default; the surrogate is measured DOWNSTREAM (its predicted cut-off run through the
exact simulator): **NPV error 6.8%** / cut-off error 10.9% on held-out scenarios; the scenario OOD-AE scores **AUC
0.999**. `C-UNIFORM`/`C-BREAKEVEN` are closed-form analytic controls (the break-even oracle: the optimal cut-off equals
`h/((p−k)·y)` when there is no time cost). No fabricated wins.

## Quickstart

```bash
# light lane (numpy only) — rebuild the replay artifacts + run the checks
python -m venv .venv-pipeline && .venv-pipeline/Scripts/pip install -r data-pipeline/requirements.txt -r requirements-dev.txt -e .
.venv-pipeline/Scripts/python -m cglab.pipeline all      # 10 cases -> traces + manifests
.venv-pipeline/Scripts/python scripts/check_artifacts.py # CONTRACT 2 OK

# the SPA (the Lane optimizer + the surrogate run live in the browser)
cd frontend && npm ci && npm run dev                     # http://localhost:5173
npm test                                                 # lane 8 + contract 6

# heavy lane (local only) — re-bake + train the learned models (torch -> ONNX)
python -m venv .venv-precompute && .venv-precompute/Scripts/pip install -r data-pipeline/requirements-precompute.txt
.venv-pipeline/Scripts/python -m cglab.pipeline all --retrain
```

## Layout

See [STRUCTURE.md](STRUCTURE.md) and the wiki in [docs/](docs/README.md). The optimization engine is the TypeScript code
in [`frontend/src/lane/`](frontend/src/lane/) (it runs in the browser **and** in the offline Node bake — no Python
re-port); `data-pipeline/cglab/` is the two contracts + the staged pipeline + the lane gate.

## License

MIT — see [LICENSE](LICENSE). Third-party components in [LICENSES.md](LICENSES.md); attributions in
[ATTRIBUTION.md](ATTRIBUTION.md).
