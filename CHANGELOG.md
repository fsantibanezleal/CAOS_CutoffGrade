# Changelog

All notable changes to CutoffGrade Studio. Format: `X.XX.XXX` (display) — see `cglab.__version__`. Keep `0.x` while on
synthetic data. Tag every release.

## [0.06.000] — 2026-06-21

### Added
- **The 6-page SPA** on `@fasl-work/caos-app-shell` (App · Introduction · Methodology · Implementation · Experiments ·
  Benchmark). The App re-optimizes live on every control (case selector + price / cost / capacity / discount-rate
  sliders): the grade-tonnage curve (break-even + optimal-cut-off lines), the declining cut-off trajectory, the
  cashflow + cumulative-NPV, the six Lane cut-offs + binding panel, the sensitivity, Lane-vs-constant. 5 bilingual doc
  pages with KaTeX + the 6 sourced Lane references.
- **The two learned models** (torch → ONNX, run live via onnxruntime-web): a **cut-off/NPV surrogate** (NPV error 6.8%
  downstream vs the exact optimizer) and a **scenario OOD autoencoder** (AUC 0.999). The `--retrain` heavy lane:
  `science/{gen_train.mjs, train_lane.py, eval_lane.mjs}` + `requirements-precompute.txt`.
- **The in-app ⓘ Architecture modal** (ADR-0058): 5 themed SVGs + `architecture.ts`.
- **The docs/ wiki** (ADR-0056): architecture (01–08), frameworks (the Lane economics · viz · torch→ONNX), the 10
  cases, guides.
- Root files: README, STRUCTURE, LICENSE, LICENSES, ATTRIBUTION.

## [0.03.000] — 2026-06-21

### Added
- The Python core: the two data contracts (deposit+economics ingestion + artifact), the 10 cases-by-category, the
  numpy-light staged pipeline, the two-language bake (Node runs the SAME TS Lane engine), the live/precompute gate.

## [0.02.000] — 2026-06-21

### Added
- The Lane science core (`frontend/src/lane/`): the lognormal grade-tonnage curve, the six Lane cut-offs, the exact NPV
  life simulator, the optimal-constant + the declining high-grading trajectory. 8/8 oracle tests.

## [0.01.000] — 2026-06-21

### Added
- Initial instantiation from the CAOS product-repo template (ADR-0057): the `cglab` package, identity (CNAME, vite
  base, titles), the `examplelab → cglab` rename across imports + `.yml`/`.sh`/`.ps1` + the schema prefix.
