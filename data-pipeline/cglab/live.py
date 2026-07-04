"""DORMANT archetype residue, NOT used by CutoffGrade Studio. This product's live lane is the TypeScript engine
(frontend/src/lane/) + onnxruntime-web; there is no Pyodide lane (see frontend/copy-data.mjs) and nothing imports
this module (it still references the template's SIR model, which no longer exists in this repo)."""
from __future__ import annotations

from . import registry
from .core.trace import build_trace
from .io.schema import SIRParams
from .model.sir import simulate


def run_trace_json(case_id: str | None = None, params: dict | None = None, seed: int = 42) -> dict:
    if params is not None:
        p = SIRParams(
            case_id=str(params.get("case_id", "live")),
            beta=float(params["beta"]), gamma=float(params["gamma"]),
            N=float(params["N"]), I0=float(params["I0"]), days=int(params.get("days", 160)),
        )
    elif case_id is not None:
        p = registry.get_case(case_id).params
    else:
        raise ValueError("run_trace_json requires either case_id or params")
    return build_trace(simulate(p))
