"""Pipeline smoke + determinism: a case regenerates deterministically (same seed -> identical trace), run_all writes
the flat index covering every category."""
import json

from cglab import pipeline, registry


def test_case_deterministic_same_seed():
    a = pipeline.precompute("K-MILL", seed=7)
    b = pipeline.precompute("K-MILL", seed=7)
    assert a["artifact"]["bytes"] == b["artifact"]["bytes"]
    trace = json.loads((pipeline.DERIVED / a["artifact"]["path"]).read_text(encoding="utf-8"))
    assert trace["category"].startswith("capacity regime")
    assert len(trace["grade_tonnage"]) >= 5
    assert len(trace["optimal"]["schedule"]) >= 1


def test_run_all_writes_index():
    entries = pipeline.run_all(seed=42)
    assert len(entries) == len(registry.list_cases()) == 10
    idx = json.loads((pipeline.MANIFESTS / "index.json").read_text(encoding="utf-8"))
    assert idx["n_cases"] == len(entries)
    assert idx["schema"].startswith("cutoffgrade.index/")
    cats = {e["category"] for e in idx["cases"]}
    assert cats == set(registry.list_categories())
