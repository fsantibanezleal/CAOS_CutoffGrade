# Framework, the visualisation stack

CutoffGrade uses one renderer per data type (per the CAOS interactive-visualisation rubric), all interactive and
theme-aware.

| Renderer | Where | What it draws |
|---|---|---|
| **µPlot** (`viz/GTChart.tsx`) | the App's Grade-tonnage tab | the ore fraction (%) + the average ore grade (%) vs the cut-off, dual-axis, with the break-even (amber) and the optimal cut-off (red) drawn as vertical reference lines; hover reads the values. |
| **µPlot** (`viz/TrajChart.tsx`) | the trajectory tab | the optimal DECLINING cut-off + the ore grade over the mine life, the high-grading visual. |
| **µPlot** (`viz/CashChart.tsx`) | the cashflow tab | the annual cashflow ($M) + the cumulative discounted value (the NPV build-up). |
| **`@fasl-work/caos-app-shell`** | the whole app | the shared header/nav/theme/language chrome + the doc-kit (Tabs, Callout, Equation/KaTeX, Cite, ReferenceList) + the ⓘ **Architecture modal** (ADR-0058). This is what makes every Faena app a visual sibling. |

Every panel **reacts to the case selector** + the live optimization (the price / cost / capacity / discount-rate
sliders re-run `analyze()`); aggregate/cross-case views (NPV-vs-price, cut-off-vs-binding-stage, surrogate-vs-exact)
live in **Benchmark/Experiments**, never in the App (per the design rule). The chrome + the chart axes follow the theme
tokens.
