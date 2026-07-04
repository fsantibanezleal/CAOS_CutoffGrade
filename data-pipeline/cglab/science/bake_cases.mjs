// Bake the per-case Lane cut-off optimization through the SAME TypeScript engine the browser runs, and write
// data/derived/case-results.json, the committed, deterministic per-case outputs the LIGHT Python pipeline reshapes
// into per-case replay traces + manifests (CONTRACT 2). No Python re-port of the economics engine. The exact Lane
// optimizer is baked here (it needs no training); the learned surrogate/AE metrics are added by --retrain once trained.
// Run (from frontend/ so tsx resolves):  node --import tsx ../data-pipeline/cglab/science/bake_cases.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES } from '../../../frontend/src/lane/cases.ts';
import { analyze } from '../../../frontend/src/lane/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const DERIVED = resolve(HERE, '../../../data/derived');
mkdirSync(DERIVED, { recursive: true });

const cases = {};
for (const c of CASES) {
  const a = analyze(c.econ, c.deposit);
  cases[c.id] = {
    name: c.name,
    category: c.category,
    realOrSynthetic: c.realOrSynthetic,
    expectedBand: c.expectedBand,
    validationAnchor: c.validationAnchor,
    deposit: a.deposit,
    econ: a.econ,
    breakEven: a.breakEven,
    gradeTonnage: a.gradeTonnage,
    cutoffs: a.cutoffs,
    optimal: a.optimal,
    constant: a.constant,
    binding: a.binding,
    npvUpliftPct: a.npvUpliftPct,
    sensitivity: a.sensitivity,
  };
}

const out = { schema: 'cutoffgrade.case-results/v1', nCases: CASES.length, cases };
writeFileSync(resolve(DERIVED, 'case-results.json'), JSON.stringify(out), 'utf-8');
console.log(`baked ${CASES.length} cases -> ${resolve(DERIVED, 'case-results.json')}`);
