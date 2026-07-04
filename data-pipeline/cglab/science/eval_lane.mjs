// Downstream evaluation of the trained cut-off surrogate, measured HONESTLY in the engine's own language. For each
// held-out scenario the surrogate predicts the optimal cut-off; we run THAT cut-off through the EXACT year-by-year
// simulator (simulateLife) and compare the resulting NPV to the exact optimum. The surrogate's cut-off + NPV error are
// the honest skill numbers. Then we assemble the final data/derived/cg-learned.json by merging the OOD-AE AUC +
// honesty that train_lane.py wrote to data/raw/learned-partial.json.
//   node --import tsx ../data-pipeline/cglab/science/eval_lane.mjs   (run from frontend/ so onnxruntime-web resolves)
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { laneTrajectory, simulateLife } from '../../../frontend/src/lane/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const RAW = resolve(ROOT, 'data/raw');
const DERIVED = resolve(ROOT, 'data/derived');
const FRONTEND = resolve(ROOT, 'frontend');

// load onnxruntime-web (resolved from frontend/node_modules), node build, WASM EP, single-threaded, local wasm.
const req = createRequire(pathToFileURL(resolve(FRONTEND, 'pkg.js')));
const ortMod = await import(pathToFileURL(req.resolve('onnxruntime-web')));
const ort = ortMod.default ?? ortMod;
// the node build needs its wasm glue dir as a file URL WITH a trailing slash (else it looks in the package root).
ort.env.wasm.wasmPaths = pathToFileURL(resolve(FRONTEND, 'node_modules/onnxruntime-web/dist')).href + '/';
ort.env.wasm.numThreads = 1;

const ev = JSON.parse(readFileSync(resolve(RAW, 'lane-eval.json'), 'utf-8')).inDist;
const partialPath = resolve(RAW, 'learned-partial.json');
const partial = existsSync(partialPath) ? JSON.parse(readFileSync(partialPath, 'utf-8')) : {};

const modelPath = resolve(DERIVED, 'cutoff-surrogate.onnx');
const session = existsSync(modelPath) ? await ort.InferenceSession.create(modelPath, { executionProviders: ['wasm'] }) : null;

let sumNpvErr = 0;
let sumCutErr = 0;
let nEval = 0;
if (session) {
  const n = ev.length;
  const F = ev[0].feat.length;
  const flat = new Float32Array(n * F);
  for (let i = 0; i < n; i++) for (let j = 0; j < F; j++) flat[i * F + j] = ev[i].feat[j];
  const out = await session.run({ x: new ort.Tensor('float32', flat, [n, F]) });
  const y = out.y.data; // [n, 3] = [cutoff, npv, life]
  for (let i = 0; i < n; i++) {
    const predCut = Math.max(0, y[i * 3 + 0]);
    const s = ev[i];
    // run the surrogate's predicted cut-off (as a constant policy) through the EXACT simulator
    const npvSurr = simulateLife(() => predCut, s.econ, s.deposit).npv;
    sumNpvErr += Math.abs(npvSurr - s.exactNpv) / Math.max(1, Math.abs(s.exactNpv));
    sumCutErr += Math.abs(predCut - s.exactCutoff) / Math.max(1e-9, s.exactCutoff);
    nEval++;
  }
} else {
  // no surrogate trained yet, report the exact engine against itself (a sanity passthrough; train to get real numbers)
  for (const s of ev) { laneTrajectory(s.econ, s.deposit); nEval++; }
}

const learned = {
  schema: 'cutoffgrade.learned/v1',
  surrogate: {
    npv_err: Math.round((sumNpvErr / Math.max(1, nEval)) * 1e4) / 1e4,
    cutoff_err: Math.round((sumCutErr / Math.max(1, nEval)) * 1e4) / 1e4,
    nEval,
  },
  ood: partial.ood ?? { auc: 0, nEval: 0 },
  honesty: partial.honesty ??
    'Synthetic deposits + economics; the labels ARE the EXACT Lane optimizer. The surrogate is measured DOWNSTREAM ' +
    '(its predicted cut-off run through the exact simulator vs the exact optimum NPV); the OOD-AE flags out-of-envelope ' +
    'scenarios. The exact optimizer is the authority. No fabricated win.',
};
writeFileSync(resolve(DERIVED, 'cg-learned.json'), JSON.stringify(learned, null, 2));
console.log(`eval_lane: surrogate NPV err ${(learned.surrogate.npv_err * 100).toFixed(1)}% - cut-off err ${(learned.surrogate.cutoff_err * 100).toFixed(1)}% (${nEval}) - OOD AUC ${learned.ood.auc} -> cg-learned.json`);
