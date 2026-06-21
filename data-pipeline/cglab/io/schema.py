"""Typed objects passed between pipeline stages — the inter-stage contract. Plain dataclasses (no heavy deps)."""
from __future__ import annotations

from dataclasses import dataclass

# the case CATEGORIES (mirrors frontend/src/lane/cases.ts)
CATEGORIES = (
    "capacity regime (the binding stage)",
    "economic scenario (price/cost regime)",
    "deposit type (grade variability)",
    "oracle control (closed-form check)",
)


@dataclass(frozen=True)
class DepositDescriptor:
    """One validated deposit + economics descriptor (CONTRACT 1 output). The deposit is a lognormal grade distribution;
    the economics are the price, the four costs, the recovery, the three stage capacities and the discount rate. For the
    synthetic cases the optimization is regenerated from this descriptor by the TypeScript engine (frontend/src/lane/)."""

    deposit_id: str
    grade_mean: float
    grade_cv: float
    tonnage_mt: float
    price: float
    mining_cost: float
    processing_cost: float
    refining_cost: float
    fixed_cost_yr: float
    recovery: float
    mine_capacity: float
    mill_capacity: float
    market_capacity: float
    discount_rate: float
    flags: tuple[str, ...] = ()
