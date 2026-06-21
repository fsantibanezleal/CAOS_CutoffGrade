# The precompute pipeline (two-language)

CutoffGrade's offline lane is **two-language** (like FragmentIQ / CoreLog / PitForge): the heavy science is the SAME
TypeScript engine the browser runs, driven from Node via `tsx`; Python only orchestrates + reshapes. This avoids ever
re-implementing the economics in Python.

## The named stages (`cglab/stages/`)

| Stage | What (heavy lane) |
|---|---|
| `preprocess` | validate the cases' deposit + economics through CONTRACT 1 |
| `feature_extraction` | assemble the learned-model training data: random scenarios SOLVED by the exact optimizer → labels (`science/gen_train.mjs`) |
| `train` | fit the cut-off/NPV surrogate + the scenario OOD-AE → ONNX (`science/train_lane.py`, torch) |
| `infer` | optimize every case through the SAME TS engine (`science/bake_cases.mjs`) → `case-results.json` |
| `evaluate` | the surrogate's downstream NPV/cut-off error vs the exact optimizer (`science/eval_lane.mjs`) + the OOD AUC |
| `export` | build the compact per-case trace + manifest (CONTRACT 2) — the LIGHT, numpy-only step |

## The two lanes of `cglab.pipeline`

```bash
python -m cglab.pipeline all              # LIGHT (numpy): reshape the committed case-results.json -> traces + manifests
python -m cglab.pipeline all --retrain    # HEAVY: bake -> gen_train -> train_lane -> eval_lane, then reshape
```

The **default is light**: the committed `data/derived/case-results.json` + `cg-learned.json` + the two `.onnx` ARE the
heavy lane's real outputs, so CI, the contract checks and the replay never need torch or Node. `--retrain` regenerates
them (it needs the `.venv-precompute` with torch + Node `tsx`).

```
bake_cases.mjs ──► data/derived/case-results.json            (per-case optimization, baked by the TS engine)
gen_train.mjs  ──► data/raw/{lane-train,lane-eval}.json      (git-ignored training scenarios)
train_lane.py  ──► data/derived/{cutoff-surrogate.onnx, scenario-ood.onnx} + data/raw/learned-partial.json
eval_lane.mjs  ──► data/derived/cg-learned.json              (surrogate downstream NPV err, measured via ORT in Node)
pipeline.export──► data/derived/<case>/trace.json + manifests/<case>.json + index.json   (CONTRACT 2)
```

Determinism: the light pipeline is a pure function of the committed artifacts — re-running it is byte-identical.
