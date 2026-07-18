# Model evaluation

CutoffGrade has two kinds of "model": the **exact optimizer** (Lane's deterministic fixed-point, checked against
closed-form oracles) and **two learned models** (a surrogate + an OOD autoencoder, measured against the exact optimizer).

## The exact optimizer, oracles, not faith

- **C-BREAKEVEN**, with f=0, δ=0 and mining the binding constraint, there is no opportunity cost, so the NPV-optimal
  cut-off must equal the closed-form break-even `h/((p−k)·y)` (checked to tolerance in `frontend/test/lane.test.ts`).
- **C-UNIFORM**, a single-grade deposit (cv→0) is all-or-nothing: the ore fraction is 1 below the grade and 0 above.
- **Lane ≥ constant**, the declining high-grading policy's NPV is always ≥ the best constant cut-off (a special case).
- **Monotonicity**, NPV is monotone increasing in price; the mill-limited cut-off declines over the life.

## The learned models, held-out, vs the exact optimizer

Both are trained offline (`science/train_lane.py`, torch) and reported next to the exact optimizer. The metrics live in
`data/derived/cg-learned.json` and show in the App's Learned-models tab + Benchmark.

| Model | Task | Baseline | Held-out metric (this build) |
|---|---|---|---|
| `cutoff-surrogate` | 12 features → [cut-off, NPV, life] | the exact Lane optimizer | **NPV err 6.8%** · cut-off err 10.9% (downstream, on 400 held-out) |
| `scenario-ood` | features → reconstruction (MSE = OOD score) | reconstruction MSE (separates in-envelope vs out-of-envelope) | **AUC 0.999** |

**Honesty.** The surrogate's NPV error is measured downstream (`eval_lane.mjs`): its predicted cut-off is run as a
constant policy through the exact simulator, and the NPV is compared to the exact optimum. ~7% NPV error reflects that
the NPV surface is fairly flat near the optimum (so a ~11% cut-off error costs only ~7% NPV), an honest property, not a
fabricated win. The exact optimizer is the authority and runs live by default; the surrogate earns its place on speed:
today the single-scenario What-if comparison in the App (mass Monte-Carlo / batch sweeps are the roadmap stochastic
tier). The OOD AUC (0.999) is high because the out-of-envelope scenarios are pushed well off the
training manifold; we say so.
