// Generate the learned-model training data by running the SAME TypeScript engine the browser runs, so the surrogate
// trains on EXACTLY the Lane optimizer the App uses, and is benchmarked against it. Writes to data/raw/ (git-ignored,
// regenerable). Invoked by pipeline.retrain before train_lane.py. Run (from frontend/ so tsx resolves):
//   node --import tsx ../data-pipeline/cglab/science/gen_train.mjs
//
// 1. lane-train.json: N in-envelope scenarios, each SOLVED by the exact Lane optimizer -> the (12-feature vector ->
//    [optimal initial cut-off, NPV, life]) labels for the surrogate, + the in-distribution feature vectors for the
//    OOD autoencoder.
// 2. lane-eval.json: a held-out split (in-distribution) carrying the deposit + economics + the exact cut-off/NPV, so
//    eval_lane.mjs can run the surrogate's predicted cut-off through the EXACT simulator (the honest downstream check);
//    plus out-of-envelope scenarios for the OOD AUC.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, FEATURES } from '../../../frontend/src/lane/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = resolve(HERE, '../../../data/raw');
mkdirSync(RAW, { recursive: true });

// a small seeded RNG (mulberry32), deterministic training data
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260621);
const u = (lo, hi) => lo + (hi - lo) * rnd();
const r6 = (x) => Math.round(x * 1e6) / 1e6;

// the in-distribution envelope (a porphyry-copper-like economic space)
const ENV = {
  grade_mean: [0.003, 0.015], grade_cv: [0.2, 1.1], tonnage_mt: [100, 700],
  price: [5000, 13000], mining_cost: [1.5, 4], processing_cost: [5, 16], refining_cost: [400, 1400],
  fixed_cost_yr: [20, 100], recovery: [0.78, 0.93], mine_capacity: [25, 70], mill_capacity: [8, 28],
  market_capacity: [0.12, 0.6], discount_rate: [0.04, 0.18],
};

function sampleScenario(env) {
  const v = {};
  for (const k of Object.keys(env)) v[k] = u(env[k][0], env[k][1]);
  // keep the mill below the mine (else the mill never binds, degenerate); resample if needed
  if (v.mill_capacity >= v.mine_capacity) v.mill_capacity = v.mine_capacity * u(0.3, 0.85);
  const deposit = { id: 's', gradeMean: v.grade_mean, gradeCv: v.grade_cv, tonnageMt: v.tonnage_mt };
  const econ = {
    price: v.price, miningCost: v.mining_cost, processingCost: v.processing_cost, refiningCost: v.refining_cost,
    fixedCostYr: v.fixed_cost_yr, recovery: v.recovery, mineCapacity: v.mine_capacity, millCapacity: v.mill_capacity,
    marketCapacity: v.market_capacity, discountRate: v.discount_rate,
  };
  return { v, deposit, econ };
}

// feature vector in the SOURCE-OF-TRUTH order (cglab/model/learned.py :: FEATURES)
function featureVec(v) {
  const f = {
    grade_mean: v.grade_mean, grade_cv: v.grade_cv, log_tonnage: Math.log(v.tonnage_mt), price: v.price,
    processing_cost: v.processing_cost, refining_cost: v.refining_cost, fixed_cost_yr: v.fixed_cost_yr,
    recovery: v.recovery, mine_capacity: v.mine_capacity, mill_capacity: v.mill_capacity,
    market_capacity: v.market_capacity, discount_rate: v.discount_rate,
  };
  return FEATURES.map((k) => r6(f[k]));
}

// --- 1. training set (valid mines only: positive NPV, life >= 2) ---
const X = [];
const Y = [];
let tries = 0;
while (X.length < 2600 && tries < 40000) {
  tries++;
  const { v, deposit, econ } = sampleScenario(ENV);
  const a = analyze(econ, deposit);
  const cut0 = a.optimal.schedule[0]?.cutoff ?? 0;
  if (a.optimal.npv <= 0 || a.optimal.lifeYears < 2 || cut0 <= 0) continue;
  X.push(featureVec(v));
  Y.push([r6(cut0), Math.round(a.optimal.npv * 10) / 10, a.optimal.lifeYears]);
}

// --- 2. held-out eval set (in-distribution; carries the exact cut-off/NPV + deposit+econ for the downstream check) ---
const evalIn = [];
tries = 0;
while (evalIn.length < 400 && tries < 8000) {
  tries++;
  const { v, deposit, econ } = sampleScenario(ENV);
  const a = analyze(econ, deposit);
  const cut0 = a.optimal.schedule[0]?.cutoff ?? 0;
  if (a.optimal.npv <= 0 || a.optimal.lifeYears < 2 || cut0 <= 0) continue;
  evalIn.push({ feat: featureVec(v), deposit, econ, exactCutoff: r6(cut0), exactNpv: Math.round(a.optimal.npv * 10) / 10, meanCutoff: r6(a.optimal.meanCutoff) });
}

// --- 3. OUT-of-envelope scenarios (features pushed well outside the training envelope) for the OOD AUC ---
const OUT = [];
const OUT_ENV = {
  grade_mean: [0.02, 0.05], grade_cv: [1.4, 2.5], tonnage_mt: [800, 2000],
  price: [16000, 26000], mining_cost: [5, 9], processing_cost: [20, 35], refining_cost: [1800, 3000],
  fixed_cost_yr: [140, 260], recovery: [0.5, 0.72], mine_capacity: [90, 160], mill_capacity: [35, 70],
  market_capacity: [0.8, 1.6], discount_rate: [0.25, 0.45],
};
for (let i = 0; i < 400; i++) {
  // push a RANDOM subset of features out of envelope (so each OOD point is genuinely off the manifold)
  const { v } = sampleScenario(ENV);
  const keys = Object.keys(OUT_ENV);
  const nOut = 4 + ((rnd() * 5) | 0);
  for (let j = 0; j < nOut; j++) {
    const k = keys[(rnd() * keys.length) | 0];
    v[k] = u(OUT_ENV[k][0], OUT_ENV[k][1]);
  }
  OUT.push(featureVec(v));
}

writeFileSync(resolve(RAW, 'lane-train.json'), JSON.stringify({ x: X, y: Y, features: [...FEATURES], outputs: ['cutoff', 'npv', 'life'] }));
writeFileSync(resolve(RAW, 'lane-eval.json'), JSON.stringify({ inDist: evalIn, ood: OUT }));
console.log(`gen_train: ${X.length} train scenarios (of ${tries} tries) - ${evalIn.length} held-out - ${OUT.length} OOD -> ${RAW}`);
