"""The offline pipeline orchestrator + CLI (ADR-0057). Per case it applies CONTRACT 1, builds the compact per-case
trace from the committed Lane outputs (case-results.json) + the learned-model metrics (cg-learned.json, when present),
runs the lane gate, and writes the manifest + a flat index (CONTRACT 2). The committed case-results.json IS the TS
engine's real output (baked by the SAME engine the browser runs), so the DEFAULT path is light (numpy/stdlib, no
torch/node) and deterministic. `--retrain` regenerates the artifacts (re-bake the cases + train the learned models
torch -> ONNX) - see cglab/science/.

    python -m cglab.pipeline                 # rebuild all replay traces + manifests from committed artifacts
    python -m cglab.pipeline S-BASE          # one case
    python -m cglab.pipeline all --retrain   # re-bake case-results + train the learned models, then rebuild
"""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from . import registry
from .cases.lane_cases import descriptor_row
from .core.manifest import build_index
from .io.contract import validate_records
from .io.formats import read_json, write_json
from .stages import export

REPO_ROOT = Path(__file__).resolve().parents[2]
DERIVED = REPO_ROOT / "data" / "derived"
MANIFESTS = DERIVED / "manifests"
SCIENCE = Path(__file__).resolve().parent / "science"


def _load_artifacts() -> tuple[dict, dict | None]:
    cr = DERIVED / "case-results.json"
    if not cr.exists():
        raise SystemExit(
            f"missing committed artifact {cr}. case-results.json is baked by the TS engine "
            f"(science/bake_cases.mjs) - run `python -m cglab.pipeline all --retrain` (or `npm run bake` in frontend/)."
        )
    learned_path = DERIVED / "cg-learned.json"
    learned = read_json(learned_path) if learned_path.exists() else None  # learned models optional until trained
    return read_json(cr), learned


def _contract_flags() -> list[dict]:
    """Apply CONTRACT 1 to the cases' deposit+economics descriptors - proves the ingestion gate, carries the flags."""
    return validate_records([descriptor_row(c) for c in registry.list_cases()]).flagged


def precompute(case_id: str, seed: int = 42,
               artifacts: tuple[dict, dict | None] | None = None, flags: list[dict] | None = None) -> dict:
    case = registry.get_case(case_id)
    case_results, learned = artifacts if artifacts is not None else _load_artifacts()
    return export.build_replay(
        case, derived_dir=str(DERIVED), manifests_dir=str(MANIFESTS),
        case_results=case_results, learned=learned,
        contract_flags=(flags if flags is not None else _contract_flags()), seed=seed,
    )


def _node(*args: str) -> None:
    # run from frontend/ so the bare `tsx` loader + onnxruntime-web resolve from frontend/node_modules; the .mjs
    # scripts compute every I/O path relative to their own file (import.meta.url), so cwd does not affect outputs.
    subprocess.run(["node", "--import", "tsx", *args], check=True, cwd=str(REPO_ROOT / "frontend"))


def retrain(seed: int = 42) -> None:
    """HEAVY lane (two-language): re-bake the optimization (the SAME TS engine) and train the learned models
    (torch -> ONNX). The science is preserved verbatim in cglab/science/."""
    print("[retrain] bake case-results (TS Lane optimizer over the cases) ...", flush=True)
    _node(str(SCIENCE / "bake_cases.mjs"))
    train = SCIENCE / "train_lane.py"
    if train.exists():
        print("[retrain] generate the learned-model training data (the SAME TS engine) ...", flush=True)
        _node(str(SCIENCE / "gen_train.mjs"))
        print("[retrain] torch train the learned models (cut-off surrogate + scenario OOD-AE) -> ONNX ...", flush=True)
        vp = REPO_ROOT / ".venv-precompute" / "Scripts" / "python.exe"
        py = str(vp) if vp.exists() else "python"
        subprocess.run([py, str(train)], check=True, cwd=str(REPO_ROOT))
        print("[retrain] eval the trained surrogate downstream (vs the exact optimizer) ...", flush=True)
        _node(str(SCIENCE / "eval_lane.mjs"))  # assembles the final data/derived/cg-learned.json
    else:
        print("[retrain] (science/train_lane.py absent - learned models pending; traces record learned=pending)",
              flush=True)
    print(f"[retrain] artifacts -> {DERIVED}", flush=True)


def run_all(seed: int = 42) -> list[dict]:
    artifacts = _load_artifacts()
    flags = _contract_flags()
    entries = []
    for c in registry.list_cases():
        precompute(c.id, seed=seed, artifacts=artifacts, flags=flags)
        entries.append({"case_id": c.id, "category": c.category, "manifest_path": f"manifests/{c.id}.json"})
    write_json(MANIFESTS / "index.json", build_index(entries))
    return entries


def main() -> None:
    ap = argparse.ArgumentParser(prog="cglab.pipeline")
    ap.add_argument("case", nargs="?", default="all", help="a case id, or 'all'")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--retrain", action="store_true",
                    help="re-bake case-results (TS engine) + train the learned models (torch) before rebuilding")
    args = ap.parse_args()
    if args.retrain:
        retrain(args.seed)
    if args.case == "all":
        entries = run_all(args.seed)
        print(f"precomputed {len(entries)} cases -> {DERIVED}")
        for e in entries:
            print(f"  {e['case_id']:12s} [{e['category']}]")
        print(f"index -> {MANIFESTS / 'index.json'}")
    else:
        m = precompute(args.case, args.seed)
        print(f"precomputed {args.case}: lane={m['lane']} bytes={m['artifact']['bytes']} "
              f"metrics={m['metrics']} -> {DERIVED / m['artifact']['path']}")


if __name__ == "__main__":
    main()
