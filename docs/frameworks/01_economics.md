# Framework, the Lane economics

The science. CutoffGrade implements Lane's economic definition of ore exactly
([`frontend/src/lane/`](../../frontend/src/lane/)).

## 1. The grade-tonnage curve (`gradetonnage.ts`)

The deposit is a lognormal distribution of grade with mean `M` and coefficient of variation `cv`. For a cut-off `g_c`
the **ore fraction** φ and the **average ore grade** ḡ are analytic:

- φ(g_c) = Φ((μ − ln g_c)/σ)
- ḡ(g_c) = M · Φ((μ − ln g_c)/σ + σ) / Φ((μ − ln g_c)/σ)

with σ² = ln(1+cv²) and μ = ln M − σ²/2. As cv → 0 the deposit is single-grade (all-or-nothing). The break-even
cut-off, process iff the block pays its own processing cost, is `g_be = h/(y·(p−k))` ([Lane 1964](#refs)).

## 2. Lane's six cut-offs (`lane.ts`)

The opportunity cost of a year of the binding capacity is `τ = f + F·δ` (F = the NPV of the remaining operation). The
three **limiting** cut-offs balance the marginal block against the binding stage:

- mine-limiting: `g_m = h/(y(p−k))` (the break-even; mill time is free)
- mill-limiting: `g_h = (h + τ/H)/(y(p−k))`
- market-limiting: `g_k = h/(y((p−k) − τ/K))`

plus three **balancing** cut-offs (mine-mill, mill-market, mine-market) that equalise the stage throughput times; the
**Dagdelen median** construction ([Dagdelen 1992](#refs)) picks the effective optimum.

## 3. The NPV fixed-point optimization (`optimize.ts`)

Because F appears in the cut-off AND the cut-off sets the cashflows that set F, the optimum is a **fixed point** solved
over the mine life by an exact year-by-year simulator: NPV = Σ C_t/(1+δ)^t with C_t = ore·ḡ·y(p−k) − ore·h − Q·m − f,
and the year's throughput Q is limited by the binding stage (`min(M, H/φ, K/(φ·ḡ·y), R)`). The result is the
**declining** optimal cut-off trajectory, higher early (high-grading while the remaining reserve is most valuable),
falling to break-even as the reserve depletes ([Lane 1988](#refs), [Asad & Topal 2011](#refs)). The best CONSTANT
cut-off (a 1-D search refined by golden-section) is the verifiable baseline the declining policy is ≥.

## 4. Two operating conventions that diverge from textbook Lane (honest qualifier)

The engine makes two explicit modelling choices that depart from strict Lane; both are visible in the code
(`optimize.ts`) and stated in the in-app Methodology "Operating conventions" callout, because they change the reported
life and NPV and should not be presented as pure Lane:

1. **Mine closure at the first value-negative year** (`optimize.ts`, the `cashflow <= 0` break). Textbook Lane runs the
   operation to **reserve exhaustion** (life ends as `F → 0`); this engine instead **closes the mine the first year a
   cashflow turns ≤ 0**. Effect: it **shortens the reported mine life** and never reports value-negative years. This is
   a going-concern operating rule, not Lane's life definition.
2. **Cut-off clamped to `[break-even, gMax]`** (`optimize.ts`, the `clamp`). Strict Lane lets the optimal cut-off fall
   **below break-even** in the final years (marginal material is stockpiled/blended rather than treated as waste);
   this engine **clamps at break-even**. Effect: it **slightly raises the reported NPV** versus strict Lane, because the
   sub-break-even tail is excluded.

Neither changes the six-cut-off formulas or the fixed-point logic, they bound the *trajectory tail*. The stockpiling
extension (Lane 1988, ch. on stockpiles) is the principled way to handle sub-break-even material and is on the roadmap;
until then, the clamp is the honest, conservative simplification.

<a id="refs"></a>
**References:** Lane 1964 · Lane 1988 (The Economic Definition of Ore) · Dagdelen 1992 · Asad & Topal 2011 · Hall 2014 ·
Rendu 2014. Full list in `frontend/src/data/citations.ts` + the in-app Methodology page.
