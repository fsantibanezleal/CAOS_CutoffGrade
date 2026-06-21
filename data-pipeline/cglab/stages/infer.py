"""Stage 4 — infer (heavy lane): optimize every case through the SAME TS engine the browser runs (frontend/src/lane/,
via tsx) — the exact Lane optimizer — and bake the deterministic per-case outputs (grade-tonnage curve, the six
cut-offs, the optimal trajectory + NPV + life, the constant baseline, the sensitivity) to data/derived/case-results.json.
Delegates to cglab/science/bake_cases.mjs."""
