# Frameworks

The research-chosen methods + libraries CutoffGrade actually uses (each one is used by the code, not aspirational).

- [01 — the Lane economics](frameworks/01_economics.md) — the grade-tonnage curve, the limiting + balancing cut-offs,
  the NPV fixed-point optimization.
- [02 — the visualisation stack](frameworks/02_viz.md) — the grade-tonnage / trajectory / cashflow charts (µPlot) and
  the shared `@fasl-work/caos-app-shell` (+ the ⓘ Architecture modal).
- [03 — the learned models](frameworks/03_torch-onnx.md) — the cut-off/NPV surrogate + the scenario OOD-AE,
  torch → ONNX → onnxruntime-web.
