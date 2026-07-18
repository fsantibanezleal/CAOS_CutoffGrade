# Determinism + the trace

**A run is a pure function of `(params, seed)`.** The TS Lane engine is analytic + deterministic (no global RNG; the
training-data sampler in `gen_train.mjs` uses a seeded mulberry32). Same inputs ⇒ byte-identical artifact (asserted in
`tests/test_pipeline_smoke.py` and proven by re-running `python -m cglab.pipeline all`). This is what makes the
committed artifact a trustworthy source-of-truth the SPA merely replays (ADR-0052 / ADR-0054).

**The trace** (`core/trace.py`, schema `cutoffgrade.trace/v1`) is the compact per-case replay artifact. Per case it
carries the deposit + economics spec (so the browser can re-optimize live), the grade-tonnage curve, the six Lane
cut-offs, the optimal declining cut-off trajectory + NPV + life + the annual cashflow schedule, the best-constant
baseline it beats, the sensitivity sweep, and the learned-model metrics (`status: trained | pending-training`). Its
shape is mirrored by `frontend/src/lib/contract.types.ts` (Contract 2) so a drift fails `tsc`. The gate's raw wall-clock
is used for the live/replay decision but **never stored** (it would dirty git on re-run).
