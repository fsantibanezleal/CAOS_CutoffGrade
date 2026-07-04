// The learned-model feature contract, the SOURCE-OF-TRUTH order MUST match data-pipeline/cglab/model/learned.py
// (the surrogate trains on this exact vector). Used by lib/ort.ts to build the standardized input for onnxruntime-web.
export const FEATURES = [
  'grade_mean', 'grade_cv', 'log_tonnage', 'price', 'processing_cost', 'refining_cost',
  'fixed_cost_yr', 'recovery', 'mine_capacity', 'mill_capacity', 'market_capacity', 'discount_rate',
] as const;
