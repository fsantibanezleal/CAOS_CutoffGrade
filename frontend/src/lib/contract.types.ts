// CONTRACT 2 mirror (frontend side). MUST stay in lock-step with the Python schemas in
// data-pipeline/cglab/core/{trace.py, manifest.py} + the bake (cglab/science/bake_cases.mjs). A drift here makes
// `tsc` fail -> the contract is enforced at BUILD time (the web cannot ship reading a shape the pipeline does not
// produce).

// ---------- engine value objects (camelCase, the analyze() output) ----------

export interface DepositRec { id: string; gradeMean: number; gradeCv: number; tonnageMt: number; }
export interface EconRec {
  price: number; miningCost: number; processingCost: number; refiningCost: number; fixedCostYr: number;
  recovery: number; mineCapacity: number; millCapacity: number; marketCapacity: number; discountRate: number;
}
export interface GTPointRec { cutoff: number; oreFraction: number; avgGrade: number; }
export interface LaneCutoffsRec {
  gMine: number; gMill: number; gMarket: number;
  gMineMill: number; gMillMarket: number; gMineMarket: number;
  binding: string; effective: number;
}
export interface SchedulePointRec {
  year: number; cutoff: number; oreGrade: number; oreMt: number; minedMt: number;
  cashflow: number; binding: string; remainingMt: number;
}
export interface OptimalRec {
  npv: number; lifeYears: number; meanCutoff: number; meanGrade: number;
  schedule: SchedulePointRec[]; trajectory: number[];
}
export interface ConstantRec { cutoff: number; npv: number; }
export interface SensitivityRec {
  param: string; lo: number; base: number; hi: number;
  npvLo: number; npvBase: number; npvHi: number; cutLo: number; cutBase: number; cutHi: number;
}
export interface LearnedMetrics {
  status: 'trained' | 'pending-training';
  surrogate: { npv_err: number; cutoff_err: number; nEval: number } | null;
  ood: { auc: number; nEval: number } | null;
}

// ---------- the baked case-results.json (cutoffgrade.case-results/v1) ----------

export interface CaseResult {
  name: string;
  category: string;
  realOrSynthetic: string;
  expectedBand: string;
  validationAnchor: string;
  deposit: DepositRec;
  econ: EconRec;
  breakEven: number;
  gradeTonnage: GTPointRec[];
  cutoffs: LaneCutoffsRec;
  optimal: OptimalRec;
  constant: ConstantRec;
  binding: string;
  npvUpliftPct: number;
  sensitivity: SensitivityRec[];
}

export interface CaseResultsFile {
  schema: string; // "cutoffgrade.case-results/v1"
  nCases: number;
  cases: Record<string, CaseResult>;
}

// ---------- per-case replay trace (cutoffgrade.trace/v1) ----------

export interface CaseTrace {
  schema: string; // "cutoffgrade.trace/v1"
  case_id: string;
  name: string;
  category: string;
  real_or_synthetic: string;
  expected_band: string;
  deposit: DepositRec;
  econ: EconRec;
  break_even: number;
  grade_tonnage: GTPointRec[];
  cutoffs: LaneCutoffsRec;
  optimal: OptimalRec;
  constant: ConstantRec;
  binding: string;
  npv_uplift_pct: number;
  sensitivity: SensitivityRec[];
  learned: LearnedMetrics;
}

// ---------- manifest (cutoffgrade.manifest/v2) + index ----------

export interface ArtifactRef { path: string; format: string; trace_schema: string; bytes: number; }
export interface GateVerdict {
  lane: string; client_side: boolean; runtimes: string[]; trace_bytes: number;
  run_ms_budget: number; trace_bytes_budget: number; reasons: string[];
}
export interface SharedArtifacts {
  models: Array<{ id: string; file: string; opset: number; kind: string }>;
  learned_metrics: string;
  case_results: string;
}
export interface CaseManifest {
  schema: string; // "cutoffgrade.manifest/v2"
  case_id: string;
  name: string;
  category: string;
  real_or_synthetic: string;
  expected_band: string;
  validation_anchor: string;
  engine: { package: string; version: string; model: string };
  seed: number;
  shared: SharedArtifacts;
  artifact: ArtifactRef;
  lane: 'live' | 'precompute';
  gate: GateVerdict;
  flags: Array<Record<string, unknown>>;
  metrics: Record<string, number>;
  honesty: string;
}
export interface CaseIndexEntry { case_id: string; category: string; manifest_path: string; }
export interface CaseIndex {
  schema: string; // "cutoffgrade.index/v1"
  engine_version: string;
  n_cases: number;
  cases: CaseIndexEntry[];
}
