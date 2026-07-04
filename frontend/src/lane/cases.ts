// The canonical case set, shared by the offline bake (data-pipeline/cglab/science/bake_cases.mjs) and the SPA. Cases
// are grouped by CATEGORY (capacity regime / economic scenario / deposit type / oracle control). The App shows ONE
// selected case; Experiments/Benchmark show cross-case summaries. All deposits are SYNTHETIC; C-UNIFORM and C-BREAKEVEN
// are the closed-form ORACLES. Economics are illustrative (a porphyry-copper-like base case), labelled synthetic.

import type { Deposit, Economics } from './types.ts';

export interface CGCase {
  id: string;
  name: string;
  category: string;
  deposit: Deposit;
  econ: Economics;
  expectedBand: string;
  validationAnchor: string;
  realOrSynthetic: string;
}

export const CAT_CAPACITY = 'capacity regime (the binding stage)';
export const CAT_SCENARIO = 'economic scenario (price/cost regime)';
export const CAT_DEPOSIT = 'deposit type (grade variability)';
export const CAT_ORACLE = 'oracle control (closed-form check)';

// a porphyry-copper-like base case. grade = Cu fraction (0.008 = 0.8%); price/cost per tonne of contained metal.
// tonnages Mt; mine/mill capacities Mt/yr; market capacity in M-(t metal)/yr.
const baseEcon: Economics = {
  price: 9000,            // $/t Cu
  miningCost: 2.5,        // $/t mined
  processingCost: 9.0,    // $/t ore
  refiningCost: 900,      // $/t Cu (smelting/refining/marketing)
  fixedCostYr: 60,        // $M/yr
  recovery: 0.88,
  mineCapacity: 45,       // Mt/yr total material
  millCapacity: 18,       // Mt/yr ore
  marketCapacity: 0.30,   // Mt Cu/yr
  discountRate: 0.10,
};
const baseDeposit: Deposit = { id: 'base', gradeMean: 0.0075, gradeCv: 0.6, tonnageMt: 400 };

const econ = (o: Partial<Economics> = {}): Economics => ({ ...baseEcon, ...o });
const dep = (id: string, o: Partial<Deposit> = {}): Deposit => ({ ...baseDeposit, id, ...o });

export const CASES: CGCase[] = [
  // ---- capacity regime ----
  { id: 'K-MILL', name: 'Mill-limited (the classic)', category: CAT_CAPACITY,
    deposit: dep('K-MILL'), econ: econ({ millCapacity: 15, mineCapacity: 60, marketCapacity: 0.6 }),
    realOrSynthetic: 'synthetic', expectedBand: 'the mill binds → the cut-off is raised above break-even by f+F·δ; high-grading pays',
    validationAnchor: 'mean cut-off > break-even; the cut-off declines over the life' },
  { id: 'K-MINE', name: 'Mine-limited', category: CAT_CAPACITY,
    deposit: dep('K-MINE'), econ: econ({ mineCapacity: 14, millCapacity: 30, marketCapacity: 0.6 }),
    realOrSynthetic: 'synthetic', expectedBand: 'mining binds → mill time is free → the cut-off sits near break-even',
    validationAnchor: 'mean cut-off ≈ break-even (within a band)' },
  { id: 'K-MARKET', name: 'Market-limited', category: CAT_CAPACITY,
    deposit: dep('K-MARKET'), econ: econ({ marketCapacity: 0.16, millCapacity: 30, mineCapacity: 60 }),
    realOrSynthetic: 'synthetic', expectedBand: 'the market binds → the cut-off is raised to lift the average grade',
    validationAnchor: 'mean cut-off > break-even; market is the binding stage early' },
  // ---- economic scenario ----
  { id: 'S-BASE', name: 'Base case', category: CAT_SCENARIO,
    deposit: dep('S-BASE'), econ: econ(), realOrSynthetic: 'synthetic',
    expectedBand: 'the reference economics', validationAnchor: 'NPV > 0; a sensible 15–30 yr life' },
  { id: 'S-HIGHPRICE', name: 'High price (+40%)', category: CAT_SCENARIO,
    deposit: dep('S-HIGHPRICE'), econ: econ({ price: 12600 }), realOrSynthetic: 'synthetic',
    expectedBand: 'higher price → lower break-even → more is ore → higher NPV', validationAnchor: 'NPV(high price) > NPV(base)' },
  { id: 'S-LOWPRICE', name: 'Low price (−30%)', category: CAT_SCENARIO,
    deposit: dep('S-LOWPRICE'), econ: econ({ price: 6300 }), realOrSynthetic: 'synthetic',
    expectedBand: 'lower price → higher break-even → less is ore → lower NPV', validationAnchor: 'NPV(low price) < NPV(base)' },
  // ---- deposit type ----
  { id: 'D-HIVAR', name: 'High-variability deposit (CV 1.0)', category: CAT_DEPOSIT,
    deposit: dep('D-HIVAR', { gradeCv: 1.0 }), econ: econ(), realOrSynthetic: 'synthetic',
    expectedBand: 'a fat grade tail → high-grading earns a lot → a strong declining cut-off', validationAnchor: 'NPV(Lane) ≥ NPV(constant)' },
  { id: 'D-LOWVAR', name: 'Low-variability deposit (CV 0.2)', category: CAT_DEPOSIT,
    deposit: dep('D-LOWVAR', { gradeCv: 0.2 }), econ: econ(), realOrSynthetic: 'synthetic',
    expectedBand: 'a tight grade band → the cut-off barely matters → little high-grading uplift', validationAnchor: 'NPV(Lane) ≈ NPV(constant)' },
  // ---- oracle controls ----
  { id: 'C-UNIFORM', name: 'Oracle, single-grade deposit', category: CAT_ORACLE,
    deposit: dep('C-UNIFORM', { gradeCv: 0.00001, gradeMean: 0.0075 }), econ: econ(), realOrSynthetic: 'analytic control',
    expectedBand: 'CV→0: all-or-nothing. The mean grade is above break-even → everything is ore; NPV is closed-form',
    validationAnchor: 'ore fraction is 1 below the grade and 0 above; NPV matches the closed form' },
  { id: 'C-BREAKEVEN', name: 'Oracle, no time cost (break-even)', category: CAT_ORACLE,
    deposit: dep('C-BREAKEVEN'), econ: econ({ fixedCostYr: 0, discountRate: 0, mineCapacity: 10, millCapacity: 40, marketCapacity: 1.0 }),
    realOrSynthetic: 'analytic control',
    expectedBand: 'f=0, δ=0, mine-limited → no opportunity cost → the optimal cut-off = the break-even h/((p−k)·y)',
    validationAnchor: 'optimalConstantCutoff ≈ break-even (within tolerance)' },
];

export const caseById = (id: string): CGCase => CASES.find((c) => c.id === id) ?? CASES[0];
