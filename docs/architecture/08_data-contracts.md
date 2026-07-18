# The two data contracts

## Contract 1, ingestion (`io/contract.py`)

The *bring-your-own-deposit* gate. A record is **accepted** iff it passes; ill-formed records are **rejected** with a
reason (never silently coerced); plausible-but-extreme records are **flagged** (accepted; the flag travels into the
manifest). Documented in `data/README.md`.

| column | unit / range | on violation |
|---|---|---|
| `deposit_id` | non-empty | reject (missing) |
| `grade_mean`, `tonnage_mt`, `price`, `mine_capacity`, `mill_capacity`, `market_capacity` | > 0 | reject |
| `mining_cost`, `processing_cost`, `refining_cost`, `fixed_cost_yr`, `grade_cv` | >= 0 | reject |
| `recovery` | in (0, 1] | reject |
| `discount_rate` | in [0, 1) | reject |
| `price - refining_cost` | net margin | flag if <= 0 (nothing is ever ore) |
| `mill_capacity` vs `mine_capacity` | mill < mine | flag if mill >= mine (the mill can never bind) |
| `discount_rate`, `grade_cv` | extreme | flag if > 0.30 / > 2.0 |

Committed sample that must pass: `data/examples/deposits.csv` (a CI test asserts it).

## Contract 2, artifact (`core/{trace,manifest}.py`)

The pipeline → web contract. The web loads only manifests + traces + the shared artifacts.

- **`cutoffgrade.trace/v1`** (per case): the deposit + economics spec, the break-even + the grade-tonnage curve, the six
  Lane cut-offs, the optimal declining cut-off trajectory + NPV + life + cashflow schedule, the best-constant baseline,
  the sensitivity sweep, and the learned-model metrics (`status: trained | pending-training`).
- **`cutoffgrade.manifest/v2`** (per case): category, the engine + version, the **shared artifacts** (the two ONNX +
  `cg-learned.json` + `case-results.json`), the trace pointer + byte size, the lane/gate verdict, the Contract-1 flags,
  the metrics, and an honesty note.
- **`cutoffgrade.index/v1`**: the flat inventory of all 10 cases.

A TS mirror, `frontend/src/lib/contract.types.ts`, declares these shapes so a drift **fails `tsc`**.
`scripts/check_artifacts.py` enforces manifest ↔ artifact consistency (existence, byte size, lane == gate verdict).
