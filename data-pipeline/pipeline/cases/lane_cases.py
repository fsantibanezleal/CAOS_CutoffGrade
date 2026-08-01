"""CutoffGrade cases spanning CATEGORIES (the cut-off-grade problem-type taxonomy). The App shows ONE selected case;
Experiments/Benchmark show cross-case summaries by category. The cases mirror the SPA's src/lane/cases.ts (the deposit
+ economics values are kept in lock-step; a test cross-checks them against the baked case-results.json). All deposits
are SYNTHETIC (a porphyry-copper-like base case); C-UNIFORM and C-BREAKEVEN are the closed-form ORACLE controls."""
from __future__ import annotations

from dataclasses import dataclass, field

CAT_CAPACITY = "capacity regime (the binding stage)"
CAT_SCENARIO = "economic scenario (price/cost regime)"
CAT_DEPOSIT = "deposit type (grade variability)"
CAT_ORACLE = "oracle control (closed-form check)"

# the base case (a porphyry-copper-like deposit + economics), identical to src/lane/cases.ts
_BASE_ECON = {
    "price": 9000.0, "mining_cost": 2.5, "processing_cost": 9.0, "refining_cost": 900.0,
    "fixed_cost_yr": 60.0, "recovery": 0.88, "mine_capacity": 45.0, "mill_capacity": 18.0,
    "market_capacity": 0.30, "discount_rate": 0.10,
}
_BASE_DEPOSIT = {"grade_mean": 0.0075, "grade_cv": 0.6, "tonnage_mt": 400.0}


@dataclass(frozen=True)
class Case:
    id: str                     # matches src/lane/cases.ts
    name: str
    category: str
    deposit: dict = field(default_factory=dict)
    econ: dict = field(default_factory=dict)
    expected_band: str = ""
    validation_anchor: str = ""
    real_or_synthetic: str = "synthetic"


def _c(cid, name, category, *, deposit=None, econ=None, anchor, band, kind="synthetic") -> Case:
    return Case(cid, name, category, {**_BASE_DEPOSIT, **(deposit or {})}, {**_BASE_ECON, **(econ or {})},
                band, anchor, kind)


CASES: list[Case] = [
    _c("K-MILL", "Mill-limited (the classic)", CAT_CAPACITY,
       econ={"mill_capacity": 15.0, "mine_capacity": 60.0, "market_capacity": 0.6},
       band="the mill binds -> the cut-off is raised above break-even by f+F.delta; high-grading pays",
       anchor="mean cut-off > break-even; the cut-off declines over the life"),
    _c("K-MINE", "Mine-limited", CAT_CAPACITY,
       econ={"mine_capacity": 14.0, "mill_capacity": 30.0, "market_capacity": 0.6},
       band="mining binds -> mill time is free -> the cut-off sits near break-even",
       anchor="mean cut-off ~ break-even (within a band)"),
    _c("K-MARKET", "Market-limited", CAT_CAPACITY,
       econ={"market_capacity": 0.16, "mill_capacity": 30.0, "mine_capacity": 60.0},
       band="the market binds -> the cut-off is raised to lift the average grade",
       anchor="mean cut-off > break-even; market is the binding stage early"),
    _c("S-BASE", "Base case", CAT_SCENARIO,
       band="the reference economics", anchor="NPV > 0; a sensible 15-30 yr life"),
    _c("S-HIGHPRICE", "High price (+40%)", CAT_SCENARIO, econ={"price": 12600.0},
       band="higher price -> lower break-even -> more is ore -> higher NPV", anchor="NPV(high price) > NPV(base)"),
    _c("S-LOWPRICE", "Low price (-30%)", CAT_SCENARIO, econ={"price": 6300.0},
       band="lower price -> higher break-even -> less is ore -> lower NPV", anchor="NPV(low price) < NPV(base)"),
    _c("D-HIVAR", "High-variability deposit (CV 1.0)", CAT_DEPOSIT, deposit={"grade_cv": 1.0},
       band="a fat grade tail -> high-grading earns a lot -> a strong declining cut-off", anchor="NPV(Lane) >= NPV(constant)"),
    _c("D-LOWVAR", "Low-variability deposit (CV 0.2)", CAT_DEPOSIT, deposit={"grade_cv": 0.2},
       band="a tight grade band -> the cut-off barely matters -> little high-grading uplift", anchor="NPV(Lane) ~ NPV(constant)"),
    _c("C-UNIFORM", "Oracle - single-grade deposit", CAT_ORACLE, deposit={"grade_cv": 0.00001, "grade_mean": 0.0075},
       band="CV->0: all-or-nothing. The mean grade is above break-even -> everything is ore; NPV is closed-form",
       anchor="ore fraction is 1 below the grade and 0 above; NPV matches the closed form", kind="analytic control"),
    _c("C-BREAKEVEN", "Oracle - no time cost (break-even)", CAT_ORACLE,
       econ={"fixed_cost_yr": 0.0, "discount_rate": 0.0, "mine_capacity": 10.0, "mill_capacity": 40.0, "market_capacity": 1.0},
       band="f=0, delta=0, mine-limited -> no opportunity cost -> the optimal cut-off = the break-even h/((p-k).y)",
       anchor="optimalConstantCutoff ~ break-even (within tolerance)", kind="analytic control"),
]


def descriptor_row(c: Case) -> dict:
    """The CONTRACT-1 deposit+economics row for a case (used by the pipeline's contract check)."""
    return {"deposit_id": c.id, **c.deposit, **c.econ}
