"""CONTRACT 1, ingestion (raw deposit + economics -> pipeline). The *bring-your-own-deposit* gate.

* ``validate_records`` validates DEPOSIT+ECONOMICS rows (one per scenario). This is what the pipeline runs over the
  case set; it proves the gate and carries flags into the manifest.
* ``validate_deposit`` validates a single dropped descriptor (a dict), the same policy.

A record is ACCEPTED iff it passes; ill-formed records are REJECTED with a reason (never silently coerced);
plausible-but-extreme records are FLAGGED (accepted; the flag travels into the manifest). Documented in data/README.md.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .schema import DepositDescriptor

REQUIRED_COLUMNS: tuple[str, ...] = (
    "deposit_id", "grade_mean", "tonnage_mt", "price", "mining_cost", "processing_cost",
    "refining_cost", "fixed_cost_yr", "recovery", "mine_capacity", "mill_capacity",
    "market_capacity", "discount_rate",
)
_POSITIVE = ("grade_mean", "tonnage_mt", "price", "mine_capacity", "mill_capacity", "market_capacity")
_NONNEG = ("mining_cost", "processing_cost", "refining_cost", "fixed_cost_yr", "grade_cv")
DISCOUNT_FLAG_HI = 0.30   # > 30%/yr is unusually high
CV_FLAG_HI = 2.0          # extreme grade variability


@dataclass
class ContractReport:
    accepted: list
    rejected: list[dict[str, Any]]
    flagged: list[dict[str, Any]]

    @property
    def ok(self) -> bool:
        return len(self.accepted) > 0

    def summary(self) -> str:
        return f"{len(self.accepted)} accepted, {len(self.rejected)} rejected, {len(self.flagged)} flagged"


def validate_records(raw_rows: list[dict[str, Any]]) -> ContractReport:
    """Apply CONTRACT 1 to raw deposit+economics rows (e.g. from a CSV). Pure; deterministic; no I/O."""
    accepted: list[DepositDescriptor] = []
    rejected: list[dict[str, Any]] = []
    flagged: list[dict[str, Any]] = []

    for i, row in enumerate(raw_rows):
        did = str(row.get("deposit_id", f"row{i}"))
        missing = [c for c in REQUIRED_COLUMNS if c not in row or row[c] in (None, "")]
        if missing:
            rejected.append({"row": i, "deposit_id": did, "reason": f"missing/empty columns: {missing}"})
            continue
        try:
            v = {c: float(row[c]) for c in REQUIRED_COLUMNS if c != "deposit_id"}
            v["grade_cv"] = float(row.get("grade_cv", 0.6))
        except (TypeError, ValueError):
            rejected.append({"row": i, "deposit_id": did, "reason": "non-numeric economic field"})
            continue

        bad: list[str] = []
        for c in _POSITIVE:
            if not (v[c] > 0) or math.isnan(v[c]) or math.isinf(v[c]):
                bad.append(f"{c}={v[c]:g} must be > 0")
        for c in _NONNEG:
            if v[c] < 0 or math.isnan(v[c]) or math.isinf(v[c]):
                bad.append(f"{c}={v[c]:g} must be >= 0")
        if not (0 < v["recovery"] <= 1):
            bad.append(f"recovery={v['recovery']:g} not in (0,1]")
        if not (0 <= v["discount_rate"] < 1):
            bad.append(f"discount_rate={v['discount_rate']:g} not in [0,1)")
        if bad:
            rejected.append({"row": i, "deposit_id": did, "reason": "; ".join(bad)})
            continue

        rec_flags: list[str] = []
        if v["price"] - v["refining_cost"] <= 0:
            rec_flags.append("net margin price - refining_cost <= 0: nothing is ever ore (no economic cut-off)")
        if v["mill_capacity"] >= v["mine_capacity"]:
            rec_flags.append("mill_capacity >= mine_capacity: the mill can never bind (all mined ore fits)")
        if v["discount_rate"] > DISCOUNT_FLAG_HI:
            rec_flags.append(f"discount_rate {v['discount_rate']:.0%} is unusually high (> {DISCOUNT_FLAG_HI:.0%})")
        if v["grade_cv"] > CV_FLAG_HI:
            rec_flags.append(f"grade_cv {v['grade_cv']:g} is extreme (> {CV_FLAG_HI})")
        if rec_flags:
            flagged.append({"deposit_id": did, "flags": rec_flags})

        accepted.append(DepositDescriptor(
            deposit_id=did, grade_mean=v["grade_mean"], grade_cv=v["grade_cv"], tonnage_mt=v["tonnage_mt"],
            price=v["price"], mining_cost=v["mining_cost"], processing_cost=v["processing_cost"],
            refining_cost=v["refining_cost"], fixed_cost_yr=v["fixed_cost_yr"], recovery=v["recovery"],
            mine_capacity=v["mine_capacity"], mill_capacity=v["mill_capacity"], market_capacity=v["market_capacity"],
            discount_rate=v["discount_rate"], flags=tuple(rec_flags)))
    return ContractReport(accepted=accepted, rejected=rejected, flagged=flagged)


def validate_deposit(meta: dict[str, Any]) -> ContractReport:
    """Apply CONTRACT 1 to a single dropped deposit+economics descriptor."""
    return validate_records([meta])
