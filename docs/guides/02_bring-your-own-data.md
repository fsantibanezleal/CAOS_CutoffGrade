# Guide — bring your own deposit

The product is **applicable to NEW data**, not just the baked cases — that is what makes it a tool. The door is
**CONTRACT 1** (`data-pipeline/cglab/io/contract.py`), and it lives in the **offline pipeline**. Be clear about
what does NOT exist today: there is **no in-app upload**, no Pyodide lane (the live lane is the TypeScript engine,
see `frontend/copy-data.mjs`), and no ready-made CSV-to-pipeline CLI. Ingesting a tabulated empirical grade-tonnage
curve is roadmap — the engine currently models the deposit as a 2-parameter lognormal.

1. Express your deposit + economics as one record of the documented schema (see
   [`data/README.md`](../../data/README.md); a passing sample is committed at `data/examples/deposits.csv`):
   `deposit_id, grade_mean[, grade_cv], tonnage_mt, price, mining_cost, processing_cost, refining_cost,
   fixed_cost_yr, recovery, mine_capacity, mill_capacity, market_capacity, discount_rate`.
2. Validate it with CONTRACT 1 from the pipeline venv: `cglab.io.contract.validate_records([row])` (or
   `validate_deposit(row)` for a single dict). Each row is **rejected** with a reason if it violates the
   schema/ranges (missing column, non-numeric, NaN/Inf, out-of-range), **flagged** if plausible-but-extreme
   (`price − refining_cost ≤ 0`, `mill_capacity ≥ mine_capacity`, `discount_rate > 30%`, `grade_cv > 2`),
   **accepted** otherwise. Nothing is silently coerced.
3. To see your deposit in the product, register it as a case: add the deck to
   `data-pipeline/cglab/cases/lane_cases.py` AND its mirror `frontend/src/lane/cases.ts` (a test keeps the two
   tables in lock-step), then re-bake: `npm run bake` in `frontend/` (re-runs the TS engine over every registered
   case) and `scripts/precompute.{sh,ps1} all` (rebuilds the traces + manifests the SPA replays; add `--retrain`
   to also retrain the learned models, torch).

If your data legitimately doesn't fit, extend CONTRACT 1 (and its tests) **deliberately** — never loosen it just
to make bad data pass.
