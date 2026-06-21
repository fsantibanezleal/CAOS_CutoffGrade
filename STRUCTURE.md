# CutoffGrade Studio — repository structure

Instantiated from the CAOS product-repo archetype ([ADR-0057](docs/architecture/01_overview.md)). The **frozen base**
(layout, the two contracts, the staged pipeline, the lane gate, the manifest/trace, CI guards) is never re-litigated;
the **per-product surface** is the optimization engine + the visualisations + the cases + content.

```
CAOS_CutoffGrade/
├─ README.md · CHANGELOG.md · STRUCTURE.md · LICENSE · LICENSES.md · ATTRIBUTION.md
├─ pyproject.toml · .env.example · .gitignore · .gitattributes
├─ requirements*.txt · data-pipeline/requirements*.txt (incl. requirements-precompute.txt: torch+onnx)
├─ scripts/            setup · precompute · smoke · dev (.sh + .ps1)
├─ data-pipeline/
│  └─ cglab/                          # the two contracts + the staged pipeline (the Lane engine itself is TS, below)
│     ├─ __init__.py (version) · pipeline.py (orchestrator+CLI, numpy-light + --retrain) · registry.py
│     ├─ io/     contract.py (CONTRACT 1: deposit + economics) · schema.py · formats.py
│     ├─ core/   gate.py (live/precompute gate) · trace.py + manifest.py (CONTRACT 2) · rng.py
│     ├─ model/  learned.py (the 2 models' feature contracts — the SOURCE OF TRUTH the SPA reproduces)
│     ├─ stages/ preprocess · feature_extraction · train · infer · evaluate · export (thin over the science)
│     ├─ science/  bake_cases.mjs · gen_train.mjs · eval_lane.mjs (Node+tsx, the SAME TS engine) · train_lane.py (torch → ONNX)
│     └─ live.py  (dormant — the live lane is TypeScript, not Pyodide)
├─ data/
│  ├─ examples/  deposits.csv (a tiny committed CONTRACT-1 sample)
│  ├─ derived/   case-results.json + per-case <case>/trace.json + manifests/ + cutoff-surrogate.onnx + scenario-ood.onnx + cg-learned.json  (committed)
│  └─ raw/       (git-ignored — regenerable training scenarios)
├─ frontend/
│  ├─ src/lane/   THE ENGINE: gradetonnage · lane · optimize · analyze · cases · learned · types · index
│  ├─ src/pages/  Tool (App) · Introduction · Methodology · Implementation · Experiments · Benchmark
│  ├─ src/viz/    GTChart · TrajChart · CashChart · UPlotChart (uPlot)
│  ├─ src/lib/    contract.types.ts (CONTRACT 2 mirror) · artifacts.ts · ort.ts (the surrogate)
│  ├─ public/svg/tech/  the 5 themed Architecture-modal SVGs (ADR-0058)
│  ├─ src/architecture.ts  the ⓘ Architecture modal config (ADR-0058)
│  ├─ test/       lane.test.ts (oracles) · contract.test.ts   (node:test + tsx)
│  └─ copy-data.mjs · vite.config.ts · package.json
├─ app/           (dormant FastAPI — activate only on an ADR-0002 trigger)
├─ docs/          the navigable wiki (architecture · frameworks · cases · guides)
└─ .github/workflows/  ci.yml (python + frontend) · deploy-pages.yml
```

## The lanes

| Lane | Where | Deps |
|---|---|---|
| **Live (client)** | `frontend/src/lane/` (grade-tonnage + Lane cut-offs + NPV optimizer) + onnxruntime-web (the surrogate) | web npm |
| **Offline (precompute)** | `cglab/science/` (Node bake of the TS engine + torch training) | `requirements-precompute.txt` |
| **Replay (light)** | `cglab.pipeline` reshapes the committed bake → traces/manifests | `data-pipeline/requirements.txt` (numpy) |
| **API** | `app/` | dormant |
