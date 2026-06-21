"""Stage 3 — train (OFFLINE, heavy lane): fit the two learned models — the cut-off/NPV surrogate (MLP) and the
scenario OOD autoencoder — and export them to ONNX. Deterministic (seeded). Delegates to cglab/science/train_lane.py
(torch); writes cutoff-surrogate.onnx, scenario-ood.onnx and the metrics cg-learned.json to data/derived/."""
