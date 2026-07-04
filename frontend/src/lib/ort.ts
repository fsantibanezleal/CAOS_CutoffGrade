// Live in-browser inference of the cut-off/NPV surrogate (onnxruntime-web). GRACEFUL: until the model is trained
// (science/train_lane.py -> cutoff-surrogate.onnx) the file is absent; the loader resolves to null and the App uses
// the EXACT Lane optimizer (which is cheap enough to run live anyway) + shows the honest "pending training" state. The
// surrogate's value is microsecond inference — today the App's single-scenario What-if comparison (mass Monte-Carlo /
// batch sweeps are the roadmap stochastic tier). WASM EP, single-threaded; the npm package +
// CDN wasmPaths are pinned to 1.27.
import * as ort from 'onnxruntime-web';
import { FEATURES, type Deposit, type Economics } from '../lane/index.ts';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/';
ort.env.wasm.numThreads = 1;

const base = () => import.meta.env.BASE_URL || '/';
const sessions: Record<string, Promise<ort.InferenceSession | null>> = {};

// ONE global serialization chain for ALL onnxruntime-web work (session creation AND inference). The WASM EP runs
// single-threaded and ships TWO models here (the cut-off surrogate + the scenario OOD autoencoder) that the App queries
// together on every control change; without a global lock their concurrent create()/run() calls race the single WASM
// runtime and throw "Session already started" / "Session mismatch". Serialising every op end-to-end removes the race.
let ortChain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = ortChain.then(fn, fn);
  ortChain = next.catch(() => {});
  return next;
}

function get(file: string): Promise<ort.InferenceSession | null> {
  return (sessions[file] ??= serial(async () => {
    try {
      const head = await fetch(`${base()}${file}`, { method: 'HEAD' });
      if (!head.ok) return null;
      return await ort.InferenceSession.create(`${base()}${file}`, { executionProviders: ['wasm'] });
    } catch {
      return null;
    }
  }));
}

export const surrogateAvailable = async () => (await get('cutoff-surrogate.onnx')) != null;

async function runSerial(_file: string, s: ort.InferenceSession, feeds: Record<string, ort.Tensor>) {
  return serial(() => s.run(feeds));
}

/** Build the standardized feature vector (the SOURCE-OF-TRUTH order in cglab/model/learned.py). */
export function featureVec(econ: Economics, deposit: Deposit): Float32Array {
  const f: Record<string, number> = {
    grade_mean: deposit.gradeMean, grade_cv: deposit.gradeCv, log_tonnage: Math.log(deposit.tonnageMt),
    price: econ.price, processing_cost: econ.processingCost, refining_cost: econ.refiningCost,
    fixed_cost_yr: econ.fixedCostYr, recovery: econ.recovery, mine_capacity: econ.mineCapacity,
    mill_capacity: econ.millCapacity, market_capacity: econ.marketCapacity, discount_rate: econ.discountRate,
  };
  return Float32Array.from(FEATURES.map((k) => f[k] ?? 0));
}

/** Surrogate forward: standardized feature vec -> [optimal_cutoff, npv, life]. null if the model isn't trained. */
export async function runSurrogate(econ: Economics, deposit: Deposit): Promise<{ cutoff: number; npv: number; life: number } | null> {
  const s = await get('cutoff-surrogate.onnx');
  if (!s) return null;
  const out = await runSerial('cutoff-surrogate.onnx', s, { x: new ort.Tensor('float32', featureVec(econ, deposit), [1, FEATURES.length]) });
  const y = out.y.data as Float32Array;
  return { cutoff: y[0], npv: y[1], life: y[2] };
}

/** OOD autoencoder: returns the standardized-space reconstruction MSE (the anomaly score, computed inside the ONNX).
 * Low (~<1) in-envelope, high for scenarios outside the trained economic envelope. null if untrained. */
export async function runOod(econ: Economics, deposit: Deposit): Promise<number | null> {
  const s = await get('scenario-ood.onnx');
  if (!s) return null;
  const out = await runSerial('scenario-ood.onnx', s, { x: new ort.Tensor('float32', featureVec(econ, deposit), [1, FEATURES.length]) });
  return (out.xr.data as Float32Array)[0];
}
