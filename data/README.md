# data/ — the data contract + layout

This folder is governed by the **two data contracts** of ADR-0057.

## Layout

| Path | What | Git |
|---|---|---|
| `raw/` | private/large local inputs (here: the surrogate train/eval scenario dumps) | **git-ignored** (never committed) |
| `examples/` | `deposits.csv` — a tiny standard-format sample that PASSES Contract 1 (clone-verify) | committed |
| `derived/<case>/` | the compact, standard-format artifacts the web replays | committed |
| `derived/manifests/` | per-case `<case>.json` (Contract 2) + the flat `index.json` inventory | committed |
| `demo/`, `artifacts/`, `samples/` | empty archetype placeholders (`.gitkeep` only) | committed |

## CONTRACT 1 — ingestion (raw → pipeline) — the *bring-your-own-deposit* gate

Defined in `data-pipeline/cglab/io/contract.py` (`validate_records` / `validate_deposit`). A deposit + economics
record is **accepted** iff it satisfies the schema; **rejected** with a reason otherwise (never silently coerced);
plausible-but-extreme records are **flagged** (accepted; the flag travels into the manifest). This gate runs in the
**offline pipeline** — there is no in-app upload.

Schema (one record per scenario):

| Column | Unit | Rule | Notes |
|---|---|---|---|
| `deposit_id` | — | non-empty | identifier |
| `grade_mean` | grade fraction | > 0 | lognormal deposit mean grade |
| `grade_cv` | — | ≥ 0 (optional, default 0.6) | grade coefficient of variation; > 2.0 → **flag** |
| `tonnage_mt` | Mt | > 0 | total in-situ tonnage |
| `price` | $/unit metal | > 0 | `price − refining_cost ≤ 0` → **flag** (nothing is ever ore) |
| `mining_cost` | $/t mined | ≥ 0 | |
| `processing_cost` | $/t ore | ≥ 0 | |
| `refining_cost` | $/unit metal | ≥ 0 | |
| `fixed_cost_yr` | $M/yr | ≥ 0 | |
| `recovery` | fraction | in (0, 1] | |
| `mine_capacity` | Mt/yr | > 0 | `mill_capacity ≥ mine_capacity` → **flag** (the mill can never bind) |
| `mill_capacity` | Mt/yr | > 0 | |
| `market_capacity` | metal units/yr | > 0 | |
| `discount_rate` | fraction/yr | in [0, 1) | > 0.30 → **flag** (unusually high) |

**Outlier policy:** missing/empty column → reject · non-numeric → reject · NaN/Inf → reject · out-of-range → reject ·
plausible-but-extreme → **flag** (accepted; recorded in the manifest).

## CONTRACT 2 — artifact (pipeline → web)

Each pipeline run writes a compact trace (`derived/<case>/trace.json`, schema `cutoffgrade.trace/v1`) and a manifest
(`derived/manifests/<case>.json`, schema `cutoffgrade.manifest/v2`) recording params, seed, engine+version, the
artifact byte size, the measured **lane/gate** verdict, Contract-1 flags, and the evaluation metrics.
`frontend/src/lib/contract.types.ts` mirrors these schemas so any drift fails the web build. The web loads these
committed artifacts (the learned-model metrics + the replay traces) **and** recomputes live in the browser by design —
the TypeScript Lane engine in `frontend/src/lane/` is the same code that baked them.

## Provenance / license

All committed case data is **synthetic** (10 parameter sets over a porphyry-copper-like base deck, solved by the
product's own TS Lane engine), stated in the UI and the manifests. No external or real dataset is redistributed here.
If a real grade-tonnage artifact is ever added, this section must document its source, license and redistribution
terms (public derived artifacts only; raw/private sources stay in the vault per ADR-0055).
