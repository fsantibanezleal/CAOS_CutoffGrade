"""Stage 5 — evaluate (the TEST stage, heavy lane): the held-out metrics of the two learned models against their
baselines — the surrogate NPV + cut-off error vs the EXACT Lane optimizer, and the OOD autoencoder AUC separating
in-distribution from out-of-envelope scenarios. Metrics land in cg-learned.json; invoked by pipeline.retrain."""
