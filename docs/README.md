# CutoffGrade Studio, documentation

The navigable wiki for CutoffGrade Studio: **Lane's economic cut-off grade**, the optimal cut-off that maximises NPV
(a grade-tonnage curve + price, costs and the three stage capacities → the declining cut-off trajectory + NPV + life),
with the whole optimization running live in the browser. Instantiated on the CAOS product-repo archetype (ADR-0057).

- **[Architecture](architecture.md)**, the archetype, the lanes, the gate, the two data contracts, determinism, deploy.
- **[Frameworks](frameworks.md)**, the Lane economics, the viz stack, the learned models (torch → ONNX).
- **[Cases](cases.md)**, the 10 cases by category + their validation anchors.
- **[Guides](guides.md)**, instantiate, run the precompute/retrain lane, bring your own deposit.

## One-paragraph orientation

The optimization engine is the **TypeScript code** in [`frontend/src/lane/`](../frontend/src/lane/): the lognormal
grade-tonnage curve, Lane's six characteristic cut-offs (three limiting + three balancing, with the f+F·δ
opportunity-cost term), an exact year-by-year NPV life simulator, and the iterative declining cut-off trajectory
(high-grading). It runs *live in the browser* (the App re-optimizes on every price / cost / capacity / δ change) **and**
in the offline Node bake (no Python re-port). The Python package [`cglab`](../data-pipeline/cglab/) is the two data
contracts + the staged pipeline + the lane gate; its default lane is numpy-light, and a `--retrain` lane re-bakes the
cases and trains the **cut-off/NPV surrogate** + the **scenario OOD-AE** (torch → ONNX). The `.onnx` run live via
onnxruntime-web.
