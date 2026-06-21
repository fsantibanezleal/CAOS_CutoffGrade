"""CONTRACT 2 — artifact (pipeline -> web). The manifest is the authoritative, versioned record of a baked case: its
category, the engine + version, the shared learned-model ONNX, the compact per-case trace pointer + byte size, the
lane/gate verdict, the CONTRACT-1 flags, and the case metrics. The web loads ONLY manifests + traces + the shared
artifacts; frontend/src/lib/contract.types.ts mirrors this schema so a drift fails the build. The committed
case-results.json (baked by the SAME TS engine the browser runs) IS the real output of the offline lane; the learned
surrogate is honest — measured against the EXACT Lane optimizer, never a fabricated win."""
from __future__ import annotations

from typing import Any

from .. import __version__
from .trace import TRACE_SCHEMA

MANIFEST_SCHEMA = "cutoffgrade.manifest/v2"
INDEX_SCHEMA = "cutoffgrade.index/v1"

ENGINE_NOTE = ("Lane's economic cut-off grade: a lognormal grade-tonnage curve + the three limiting + three balancing "
               "cut-offs (with the f + F*delta opportunity-cost term) + an exact year-by-year NPV life simulator + the "
               "iterative DECLINING high-grading trajectory. The same TS engine runs live in the browser and in the "
               "offline bake. The cut-off/NPV surrogate (torch->ONNX) runs live via onnxruntime-web; the EXACT "
               "optimizer is the baseline + the authority.")
HONESTY = ("The deposits + economics are SYNTHETIC (a porphyry-copper-like base case), stated openly; C-UNIFORM and "
           "C-BREAKEVEN are closed-form controls. The cut-off surrogate is measured against the EXACT Lane optimizer "
           "(NPV + cut-off error); the OOD autoencoder flags scenarios outside the training envelope. Reported "
           "whichever way the numbers land. No fabricated win.")


def shared_artifacts() -> dict:
    return {
        "models": [
            {"id": "cutoff-surrogate", "file": "cutoff-surrogate.onnx", "opset": 17, "kind": "cut-off/NPV surrogate MLP"},
            {"id": "scenario-ood", "file": "scenario-ood.onnx", "opset": 17, "kind": "economic-scenario OOD autoencoder"},
        ],
        "learned_metrics": "cg-learned.json",
        "case_results": "case-results.json",
    }


def build_case_manifest(*, case: Any, seed: int, artifact_rel: str, trace_bytes: int,
                        gate: dict, flags: list[dict], metrics: dict) -> dict:
    return {
        "schema": MANIFEST_SCHEMA,
        "case_id": case.id,
        "name": case.name,
        "category": case.category,
        "real_or_synthetic": case.real_or_synthetic,
        "expected_band": case.expected_band,
        "validation_anchor": case.validation_anchor,
        "engine": {"package": "cglab", "version": __version__, "model": ENGINE_NOTE},
        "seed": seed,
        "shared": shared_artifacts(),
        "artifact": {"path": artifact_rel, "format": "json", "trace_schema": TRACE_SCHEMA, "bytes": trace_bytes},
        "lane": gate["lane"],
        "gate": gate,
        "flags": flags,
        "metrics": metrics,
        "honesty": HONESTY,
    }


def build_index(entries: list[dict]) -> dict:
    return {
        "schema": INDEX_SCHEMA,
        "engine_version": __version__,
        "n_cases": len(entries),
        "cases": sorted(entries, key=lambda e: e["case_id"]),
    }
