"""HEAVY lane (local-only) — train CutoffGrade's two learned models and export them to ONNX. Run inside the
.venv-precompute (torch) AFTER gen_train.mjs has written data/raw/{lane-train,lane-eval}.json:

    python data-pipeline/cglab/science/train_lane.py

1. cutoff-surrogate — an MLP regressor (12 standardized deposit+economic features -> [optimal cut-off, NPV, life]).
   A fast surrogate for the iterative Lane fixed-point optimizer (instant Monte-Carlo / batch sweeps). Its DOWNSTREAM
   skill (using the predicted cut-off in the EXACT simulator, vs the exact optimum) is measured by eval_lane.mjs (the
   engine is TypeScript, so the honest end-to-end comparison runs in the engine's own language). The standardisation is
   folded into the export wrapper, so the ONNX takes RAW features and returns RAW outputs.
2. scenario-ood — a small autoencoder over the standardized feature vector; the reconstruction MSE separates
   in-distribution scenarios from out-of-envelope ones (an honest "the surrogate is extrapolating" flag). The AUC is
   reported here.

Outputs: data/derived/{cutoff-surrogate.onnx, scenario-ood.onnx} + data/raw/learned-partial.json (eval_lane.mjs
assembles the final data/derived/cg-learned.json). Deterministic (seeded).
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
from torch import nn

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data" / "raw"
DERIVED = ROOT / "data" / "derived"
DERIVED.mkdir(parents=True, exist_ok=True)
torch.manual_seed(0)
rng = np.random.default_rng(0)


def _auc(label: np.ndarray, score: np.ndarray) -> float:
    """ROC AUC via the rank statistic (no sklearn). label 1 = positive (OOD)."""
    order = np.argsort(score)
    ranks = np.empty_like(order, dtype=np.float64)
    ranks[order] = np.arange(1, len(score) + 1)
    n_pos = float((label > 0.5).sum())
    n_neg = float(len(label) - n_pos)
    if n_pos == 0 or n_neg == 0:
        return 0.5
    return float((ranks[label > 0.5].sum() - n_pos * (n_pos + 1) / 2) / (n_pos * n_neg))


# ----------------------------------------------------------------------------------------------------------------
# the cut-off / NPV / life surrogate
# ----------------------------------------------------------------------------------------------------------------
class Surrogate(nn.Module):
    def __init__(self, n_in: int, n_out: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_in, 64), nn.ReLU(), nn.Linear(64, 64), nn.ReLU(), nn.Linear(64, n_out),
        )

    def forward(self, x):
        return self.net(x)


def train_surrogate(X: np.ndarray, Y: np.ndarray):
    n = len(X)
    idx = rng.permutation(n)
    cut = int(n * 0.85)
    tr, _te = idx[:cut], idx[cut:]
    mu_x = X.mean(0, keepdims=True)
    sd_x = X.std(0, keepdims=True) + 1e-9
    # the cut-off + NPV span orders of magnitude; standardise the targets for stable training
    mu_y = Y.mean(0, keepdims=True)
    sd_y = Y.std(0, keepdims=True) + 1e-9
    Xs = (X - mu_x) / sd_x
    Ys = (Y - mu_y) / sd_y

    net = Surrogate(X.shape[1], Y.shape[1])
    opt = torch.optim.Adam(net.parameters(), lr=2e-3)
    Xt = torch.from_numpy(Xs[tr].astype(np.float32))
    Yt = torch.from_numpy(Ys[tr].astype(np.float32))
    bs = 128
    for _ in range(120):  # epochs
        perm = torch.randperm(len(tr))
        for b in range(0, len(tr), bs):
            sel = perm[b:b + bs]
            opt.zero_grad()
            loss = nn.functional.mse_loss(net(Xt[sel]), Yt[sel])
            loss.backward()
            opt.step()
    net.eval()

    # export wrapper: RAW features -> standardise -> net -> inverse-standardise -> RAW [cut-off, NPV, life]
    class SurrogateExport(nn.Module):
        def __init__(self, core: Surrogate) -> None:
            super().__init__()
            self.core = core
            self.register_buffer("mu_x", torch.from_numpy(mu_x.astype(np.float32)))
            self.register_buffer("sd_x", torch.from_numpy(sd_x.astype(np.float32)))
            self.register_buffer("mu_y", torch.from_numpy(mu_y.astype(np.float32)))
            self.register_buffer("sd_y", torch.from_numpy(sd_y.astype(np.float32)))

        def forward(self, x):
            return self.core((x - self.mu_x) / self.sd_x) * self.sd_y + self.mu_y

    return SurrogateExport(net), (mu_x, sd_x)


# ----------------------------------------------------------------------------------------------------------------
# the scenario OOD autoencoder
# ----------------------------------------------------------------------------------------------------------------
class OODAE(nn.Module):
    def __init__(self, n_in: int) -> None:
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(n_in, 8), nn.ReLU(), nn.Linear(8, 3), nn.ReLU())
        self.dec = nn.Sequential(nn.Linear(3, 8), nn.ReLU(), nn.Linear(8, n_in))

    def forward(self, x):
        return self.dec(self.enc(x))


def train_ood(X: np.ndarray, mu_x: np.ndarray, sd_x: np.ndarray, in_eval: np.ndarray, ood: np.ndarray) -> dict:
    Xs = (X - mu_x) / sd_x
    net = OODAE(X.shape[1])
    opt = torch.optim.Adam(net.parameters(), lr=2e-3)
    Xt = torch.from_numpy(Xs.astype(np.float32))
    bs = 128
    for _ in range(150):
        perm = torch.randperm(len(Xt))
        for b in range(0, len(Xt), bs):
            sel = perm[b:b + bs]
            opt.zero_grad()
            loss = nn.functional.mse_loss(net(Xt[sel]), Xt[sel])
            loss.backward()
            opt.step()
    net.eval()

    def mse(arr: np.ndarray) -> np.ndarray:
        s = (arr - mu_x) / sd_x
        with torch.no_grad():
            t = torch.from_numpy(s.astype(np.float32))
            r = net(t)
            return ((r - t) ** 2).mean(dim=1).numpy()

    in_scores = mse(in_eval)
    ood_scores = mse(ood)
    labels = np.concatenate([np.zeros(len(in_scores)), np.ones(len(ood_scores))])
    scores = np.concatenate([in_scores, ood_scores])
    auc = _auc(labels, scores)
    # the in-distribution 95th-percentile reconstruction MSE — the App flags a scenario as off-envelope when its
    # (ONNX-computed) anomaly score exceeds this. Derived from held-out in-dist data, not hand-picked.
    thr = float(np.quantile(in_scores, 0.95))
    print(f"OOD scores: in-dist p50={np.median(in_scores):.3f} p95={thr:.3f} | ood p50={np.median(ood_scores):.3f}")

    # export wrapper: RAW features -> standardise -> AE -> the standardized-space reconstruction MSE (the anomaly score
    # itself, [batch, 1]). Computing it INSIDE the ONNX means the browser reads an interpretable, correctly-scaled score
    # directly (the SAME quantity used for the AUC above) — no client-side scaler needed.
    class AEExport(nn.Module):
        def __init__(self, core: OODAE) -> None:
            super().__init__()
            self.core = core
            self.register_buffer("mu_x", torch.from_numpy(mu_x.astype(np.float32)))
            self.register_buffer("sd_x", torch.from_numpy(sd_x.astype(np.float32)))

        def forward(self, x):
            xs = (x - self.mu_x) / self.sd_x
            r = self.core(xs)
            return ((r - xs) ** 2).mean(dim=1, keepdim=True)

    return {"model": AEExport(net), "auc": round(auc, 4), "nEval": int(len(scores)), "thr": round(thr, 4)}


def _strip_metadata(path: Path) -> None:
    """Remove any machine-specific provenance an ONNX exporter may bake in (node metadata_props / doc_strings can carry
    absolute source paths) — keeps the committed ONNX clean (base-integrity guard) and reproducible across machines."""
    import onnx
    m = onnx.load(str(path))
    m.doc_string = ""
    m.graph.doc_string = ""
    for node in m.graph.node:
        del node.metadata_props[:]
        node.doc_string = ""
    onnx.save(m, str(path))


def export_onnx(model: nn.Module, n_in: int, in_name: str, out_name: str, path: Path) -> None:
    model.eval()
    dummy = torch.zeros(1, n_in)
    torch.onnx.export(model, dummy, str(path), input_names=[in_name], output_names=[out_name],
                      dynamic_axes={in_name: {0: "batch"}, out_name: {0: "batch"}}, opset_version=17)
    _strip_metadata(path)


def main() -> None:
    d = json.loads((RAW / "lane-train.json").read_text())
    X = np.asarray(d["x"], dtype=np.float64)
    Y = np.asarray(d["y"], dtype=np.float64)
    ev = json.loads((RAW / "lane-eval.json").read_text())
    in_eval = np.asarray([s["feat"] for s in ev["inDist"]], dtype=np.float64)
    ood = np.asarray(ev["ood"], dtype=np.float64)
    n_in = X.shape[1]

    surrogate, (mu_x, sd_x) = train_surrogate(X, Y)
    ae = train_ood(X, mu_x, sd_x, in_eval, ood)

    export_onnx(surrogate, n_in, "x", "y", DERIVED / "cutoff-surrogate.onnx")
    export_onnx(ae["model"], n_in, "x", "xr", DERIVED / "scenario-ood.onnx")

    partial = {
        "ood": {"auc": ae["auc"], "nEval": ae["nEval"], "thr": ae["thr"]},
        "honesty": ("Synthetic deposits + economics across a porphyry-copper-like envelope; the labels ARE the EXACT "
                    "Lane optimizer's outputs. The surrogate's DOWNSTREAM skill (its predicted cut-off run through the "
                    "exact simulator, vs the exact optimum NPV) is measured by eval_lane.mjs. The OOD autoencoder flags "
                    "scenarios outside the training envelope. Reported whichever way the numbers land; the exact "
                    "optimizer is the authority. No fabricated win."),
    }
    (RAW / "learned-partial.json").write_text(json.dumps(partial, indent=2))
    print("scenario-ood AUC:", ae["auc"], "(nEval", ae["nEval"], ")")
    print(f"wrote cutoff-surrogate.onnx + scenario-ood.onnx + learned-partial.json -> {DERIVED} / {RAW}")


if __name__ == "__main__":
    main()
