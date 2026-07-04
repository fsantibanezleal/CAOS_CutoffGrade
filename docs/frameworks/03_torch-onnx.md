# Framework, the learned models (torch → ONNX → onnxruntime-web)

Two honest learned models, trained offline and run live. The EXACT Lane optimizer is always the authority; these are a
fast surrogate of it + an out-of-envelope flag.

## Training (`science/train_lane.py`, torch, `.venv-precompute`)

| Model | Architecture | Trained on | Scored against | Export |
|---|---|---|---|---|
| `cutoff-surrogate` | MLP 12 → 64 → 64 → 3, standardisation folded into the export | random scenarios SOLVED by the EXACT optimizer (`gen_train.mjs`) | the EXACT optimizer, DOWNSTREAM (`eval_lane.mjs`) | `cutoff-surrogate.onnx` (x → [cut-off, NPV, life]) |
| `scenario-ood` | autoencoder 12 → 8 → 3 → 8 → 12 | in-distribution feature vectors | reconstruction MSE separates out-of-envelope | `scenario-ood.onnx` (x → xr) |

`gen_train.mjs` runs the SAME TS engine the browser runs, so the surrogate trains on exactly the optimizer the App uses.
The standardisation (mean/std of the features AND the targets) is folded into the export wrapper, so the ONNX takes RAW
features and returns RAW [cut-off, NPV, life].

## The honest downstream eval (`eval_lane.mjs`)

The surrogate predicts a cut-off; `eval_lane.mjs` runs THAT cut-off as a constant policy through the EXACT simulator
(onnxruntime-web in Node) and compares the NPV to the exact optimum, the honest **downstream** skill, in the engine's
own language. (Raw regression error would flatter the model; the downstream NPV error is what matters.)

## Inference (`frontend/src/lib/ort.ts`, onnxruntime-web)

WASM execution provider, single-threaded; the npm package and the CDN `wasmPaths` are pinned to the same version (1.27).
The loader is **graceful**, if the model is absent the App uses the EXACT optimizer (cheap, runs live) + shows the
honest "pending training" state. Runs are serialised per session (not re-entrant).

## Honesty

Held-out numbers (see [model evaluation](../architecture/06_model-evaluation.md)): surrogate **NPV error 6.8%** /
cut-off error 10.9% (downstream); scenario OOD-AE **AUC 0.999**. The exact optimizer is the authority; the surrogate is
a fast approximation used today for the single-scenario What-if comparison in the App (mass Monte-Carlo / batch sweeps
are the roadmap stochastic tier). No fabricated win.
