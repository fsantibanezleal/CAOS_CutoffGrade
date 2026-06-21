# Framework — the Lane economics

The science. CutoffGrade implements Lane's economic definition of ore exactly
([`frontend/src/lane/`](../../frontend/src/lane/)).

## 1. The grade-tonnage curve (`gradetonnage.ts`)

The deposit is a lognormal distribution of grade with mean `M` and coefficient of variation `cv`. For a cut-off `g_c`
the **ore fraction** φ and the **average ore grade** ḡ are analytic:

- φ(g_c) = Φ((μ − ln g_c)/σ)
- ḡ(g_c) = M · Φ((μ − ln g_c)/σ + σ) / Φ((μ − ln g_c)/σ)

with σ² = ln(1+cv²) and μ = ln M − σ²/2. As cv → 0 the deposit is single-grade (all-or-nothing). The break-even
cut-off — process iff the block pays its own processing cost — is `g_be = h/(y·(p−k))` ([Lane 1964](#refs)).

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
**declining** optimal cut-off trajectory — higher early (high-grading while the remaining reserve is most valuable),
falling to break-even as the reserve depletes ([Lane 1988](#refs), [Asad & Topal 2011](#refs)). The best CONSTANT
cut-off (a 1-D search refined by golden-section) is the verifiable baseline the declining policy is ≥.

<a id="refs"></a>
**References:** Lane 1964 · Lane 1988 (The Economic Definition of Ore) · Dagdelen 1992 · Asad & Topal 2011 · Hall 2014 ·
Rendu 2014. Full list in `frontend/src/data/citations.ts` + the in-app Methodology page.
