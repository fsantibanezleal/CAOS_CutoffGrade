"""The compact per-case TRACE = the web-replay artifact. Part of CONTRACT 2: its shape is mirrored by
frontend/src/lib/contract.types.ts, so a drift fails the web build. Built deterministically from the committed Lane
outputs (case-results.json, produced by the SAME TS engine the browser runs) + the learned-model metrics
(cg-learned.json, when present). Carries the deposit + economics SPEC so the browser can re-optimize LIVE, the
grade-tonnage curve, Lane's six cut-offs, the optimal DECLINING trajectory + NPV + life + cashflow schedule, the
best-constant baseline it beats, the sensitivity sweep, and the learned-model metrics."""
from __future__ import annotations

from typing import Any

TRACE_SCHEMA = "cutoffgrade.trace/v1"


def _learned_block(learned: dict | None) -> dict:
    if not learned:
        return {"status": "pending-training", "surrogate": None, "ood": None}
    return {
        "status": "trained",
        "surrogate": learned.get("surrogate"),
        "ood": learned.get("ood"),
    }


def build_trace(case: Any, *, case_result: dict, learned: dict | None) -> dict:
    return {
        "schema": TRACE_SCHEMA,
        "case_id": case.id,
        "name": case.name,
        "category": case.category,
        "real_or_synthetic": case.real_or_synthetic,
        "expected_band": case.expected_band,
        "deposit": case_result.get("deposit"),
        "econ": case_result.get("econ"),
        "break_even": case_result.get("breakEven"),
        "grade_tonnage": case_result.get("gradeTonnage"),
        "cutoffs": case_result.get("cutoffs"),
        "optimal": case_result.get("optimal"),
        "constant": case_result.get("constant"),
        "binding": case_result.get("binding"),
        "npv_uplift_pct": case_result.get("npvUpliftPct"),
        "sensitivity": case_result.get("sensitivity"),
        "learned": _learned_block(learned),
    }
