"""Stage 2, feature_extraction (heavy lane): assemble the learned-model training data, random deposit + economics
scenarios, each SOLVED by the EXACT Lane optimizer (the SAME TS engine, via tsx) to give the (features -> optimal
cut-off, NPV, life) labels for the surrogate + the in-distribution vectors for the OOD autoencoder
(cglab/science/gen_train.mjs). The feature contract is the SOURCE OF TRUTH in cglab/model/learned.py."""
