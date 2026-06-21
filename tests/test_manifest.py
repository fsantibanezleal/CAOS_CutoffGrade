"""CONTRACT 2 (artifact) tests: a manifest points to a real trace with the recorded byte size, the lane verdict is
consistent with the gate, and the schema is the CutoffGrade one. Uses the committed case-results.json (no torch/node)."""
import json

from cglab import pipeline


def test_manifest_matches_artifact_and_gate():
    m = pipeline.precompute("S-BASE", seed=7)
    artifact = pipeline.DERIVED / m["artifact"]["path"]
    assert artifact.exists() and artifact.stat().st_size == m["artifact"]["bytes"]
    assert m["schema"].startswith("cutoffgrade.manifest/")
    assert m["lane"] == m["gate"]["lane"] == "live", f"expected live, got {m['lane']} ({m['gate']['reasons']})"
    assert m["category"].startswith("economic scenario")


def test_breakeven_oracle_trace():
    m = pipeline.precompute("C-BREAKEVEN", seed=7)
    trace = json.loads((pipeline.DERIVED / m["artifact"]["path"]).read_text(encoding="utf-8"))
    # the no-time-cost oracle: the optimal constant cut-off equals the break-even within tolerance
    be = trace["break_even"]
    assert abs(trace["constant"]["cutoff"] - be) / be < 0.06
    assert trace["optimal"]["npv"] > 0


def test_price_monotone_npv():
    hi = json.loads((pipeline.DERIVED / pipeline.precompute("S-HIGHPRICE")["artifact"]["path"]).read_text(encoding="utf-8"))
    lo = json.loads((pipeline.DERIVED / pipeline.precompute("S-LOWPRICE")["artifact"]["path"]).read_text(encoding="utf-8"))
    assert hi["optimal"]["npv"] > lo["optimal"]["npv"]
