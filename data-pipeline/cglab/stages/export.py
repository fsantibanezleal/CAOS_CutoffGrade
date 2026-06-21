"""Stage 6 — export (CONTRACT 2): build the compact per-case trace from the committed Lane outputs (case-results.json,
baked by the SAME TS engine the browser runs) + the learned-model metrics (cg-learned.json, when trained), run the lane
gate, and write the manifest. No torch/node — so the contract + replay regenerate deterministically anywhere, and CI
stays fast. The HEAVY export (baking case-results.json + training the ONNX) is done by the preserved science
(cglab/science/bake_cases.mjs + train_lane.py), invoked by pipeline.retrain."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from ..core.gate import classify_lane
from ..core.manifest import build_case_manifest
from ..core.trace import build_trace
from ..io.formats import write_json

_RUN_MS = 80.0   # a teaching-scale Lane optimization — tens of ms; deterministic gate budget
_RUNTIMES = {"ts-econ", "onnxruntime-web"}


def _case_metrics(case_result: dict, learned: dict | None) -> dict:
    opt = case_result.get("optimal", {}) or {}
    const = case_result.get("constant", {}) or {}
    m = {
        "npv": float(opt.get("npv", 0.0)),
        "life_years": float(opt.get("lifeYears", 0.0)),
        "mean_cutoff": float(opt.get("meanCutoff", 0.0)),
        "constant_npv": float(const.get("npv", 0.0)),
        "break_even": float(case_result.get("breakEven", 0.0)),
        "npv_uplift_pct": float(case_result.get("npvUpliftPct", 0.0)),
    }
    if learned:
        sg = (learned.get("surrogate") or {})
        m["surrogate_npv_err"] = float(sg.get("npv_err", 0.0))
    return m


def build_replay(case: Any, *, derived_dir: str, manifests_dir: str,
                 case_results: dict, learned: dict | None, contract_flags: list[dict], seed: int) -> dict:
    cr = case_results["cases"][case.id]
    trace = build_trace(case, case_result=cr, learned=learned)
    artifact_rel = f"{case.id}/trace.json"
    trace_bytes = write_json(Path(derived_dir) / artifact_rel, trace)
    gate = classify_lane(client_side=True, runtimes=_RUNTIMES, run_ms=_RUN_MS, trace_bytes=trace_bytes)
    manifest = build_case_manifest(
        case=case, seed=seed, artifact_rel=artifact_rel, trace_bytes=trace_bytes,
        gate=gate, flags=contract_flags, metrics=_case_metrics(cr, learned),
    )
    write_json(Path(manifests_dir) / f"{case.id}.json", manifest)
    return manifest
