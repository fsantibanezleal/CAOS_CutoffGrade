# Cases + categories

Each case (`data-pipeline/cglab/cases/lane_cases.py`, mirrored in `frontend/src/lane/cases.ts`) declares a **category**,
its deposit + economics, an **expected band** (what a domain reader should see), a **validation anchor** (a property the
result must satisfy, checked in `frontend/test/{lane,contract}.test.ts`), and a real|synthetic flag. The **App shows
one selected case**; **Experiments/Benchmark show cross-case summaries** (never mixed into the App). All deposits are
synthetic (a porphyry-copper-like base case); `C-UNIFORM` and `C-BREAKEVEN` are the closed-form oracle controls.

## The 10-case matrix

| id | category | varies | validation anchor |
|---|---|---|---|
| `K-MILL` | capacity regime | mill binds (mill < mine, ample market) | mean cut-off > break-even; the cut-off declines over the life |
| `K-MINE` | capacity regime | mining binds | mean cut-off ≈ break-even (mill time is free) |
| `K-MARKET` | capacity regime | the market binds | mean cut-off > break-even (raise the average grade) |
| `S-BASE` | economic scenario | the reference economics | NPV > 0; a sensible 15–30 yr life |
| `S-HIGHPRICE` | economic scenario | price +40% | NPV(high price) > NPV(base) |
| `S-LOWPRICE` | economic scenario | price −30% | NPV(low price) < NPV(base) |
| `D-HIVAR` | deposit type | grade CV 1.0 (fat tail) | NPV(Lane) ≥ NPV(constant); a strong declining cut-off |
| `D-LOWVAR` | deposit type | grade CV 0.2 (tight) | NPV(Lane) ≈ NPV(constant); little high-grading uplift |
| `C-UNIFORM` | oracle control | single grade (CV→0) | **closed-form**: ore fraction 1 below the grade, 0 above |
| `C-BREAKEVEN` | oracle control | f=0, δ=0, mine-limited | **closed-form**: the optimal cut-off = the break-even h/((p−k)·y) |

The capacity cases vary which stage binds; the scenario cases vary the economics; the deposit cases vary the grade
variability (when high-grading earns its keep); the controls are the exactness anchors (their answer is computable by
hand, so any regression in the optimizer is caught immediately).
