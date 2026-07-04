# The live lane (TypeScript)

Unlike the SIR template (whose live lane is Pyodide-Python), CutoffGrade's live lane is **TypeScript**, the
optimization engine in [`frontend/src/lane/`](../../frontend/src/lane/). The same modules run in the browser and in the
offline Node bake (via `tsx`), so there is exactly **one** implementation of the economics, no Python re-port, no drift.

## The modules

| Module | Role |
|---|---|
| `gradetonnage.ts` | the lognormal grade-tonnage curve: `oreFraction`, `avgGradeAbove`, `metalAbove`, erf/normCdf, monotone bisection inverts (cv to 0 = single grade) |
| `lane.ts` | the break-even + Lane's six cut-offs (3 limiting g_m/g_h/g_k with the f+F.delta term + 3 balancing + Dagdelen median optimum) |
| `optimize.ts` | the exact year-by-year life simulator + `optimalConstantCutoff` (grid + golden-section) + `laneTrajectory` (the iterative declining high-grading policy) |
| `analyze.ts` | one (deposit, economics) to the full result the bake + App consume (curve, cut-offs, optimal, constant, sensitivity) |
| `cases.ts` | the 10 canonical cases (shared by the App and the bake) |

The cut-off/NPV surrogate runs via **onnxruntime-web** (`frontend/src/lib/ort.ts`), WASM EP, single-threaded; the npm
package and the CDN wasmPaths are pinned to the same version (1.27). `runSurrogate` builds the standardized feature
vector (the order in `lane/learned.ts`, mirroring `cglab/model/learned.py`) and runs the ONNX in one call; runs are
serialised per session (the session is not re-entrant). If the model is absent (not yet trained) the loader resolves to
`null` and the App uses the EXACT optimizer (cheap, runs live anyway).

## Live re-optimize in the App

The App holds `(case, price/cost/capacity/delta sliders)` in state. On every change it rebuilds the economics and
re-runs `analyze()` (the exact Lane optimizer), driving the grade-tonnage chart, the declining cut-off trajectory, the
cashflow profile, the Lane cut-off panel and the sensitivity. This is the "interactive value-readout viz that reacts to
the controls", a live optimization, not a replay.
