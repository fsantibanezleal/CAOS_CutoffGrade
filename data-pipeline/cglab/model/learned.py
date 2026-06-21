"""Feature contracts for the two learned models (the SINGLE SOURCE OF TRUTH shared by the offline trainer
science/train_lane.py and the in-browser inference). Both are honest, value-adding ML measured against the EXACT Lane
optimizer — NOT bolted-on. Trained OFFLINE (torch -> ONNX), run LIVE (onnxruntime-web).

1. cutoff-surrogate — an MLP regressor. Input: the standardized deposit + economic features -> output: the optimal
   initial cut-off, the NPV and the life. A fast surrogate for the iterative Lane fixed-point optimizer, so the App
   sliders + a Monte-Carlo price simulation are instant. Benchmarked by the NPV + cut-off error vs the EXACT optimizer
   on held-out scenarios (the exact optimizer is the authority).

2. scenario-ood — an economic-scenario autoencoder. Input: the same standardized feature vector -> output:
   reconstruction; a high MSE = a scenario OUTSIDE the training envelope (the surrogate is extrapolating). Benchmarked
   by OOD AUC on synthetic out-of-envelope scenarios. It flags; it does not fix.
"""
from __future__ import annotations

FEATURES = (
    "grade_mean", "grade_cv", "log_tonnage", "price", "processing_cost", "refining_cost",
    "fixed_cost_yr", "recovery", "mine_capacity", "mill_capacity", "market_capacity", "discount_rate",
)
N_FEATURES = len(FEATURES)

SURROGATE_INPUT_NAME = "x"
SURROGATE_OUTPUT_NAME = "y"
SURROGATE_OUTPUTS = ("cutoff", "npv", "life")

OOD_INPUT_NAME = "x"
OOD_OUTPUT_NAME = "xr"
