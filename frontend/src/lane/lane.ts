// Lane's characteristic cut-off grades. UNITS: tonnages in Mt, capacities in Mt/yr (mine/mill) and M-units/yr
// (market), price/refining in $/unit product, mining/processing in $/t (≡ $M/Mt), fixed + opportunity cost in $M/yr,
// F (present value of the remaining operation) in $M. The margin per unit grade per tonne ore is y·(p−k).
//
// The opportunity cost of capacity is the term that makes the cut-off decline over the life: τ = f + F·δ. When the mill
// or the market binds, occupying that scarce capacity for a year costs τ, so the cut-off is raised above break-even by
// τ spread over the binding capacity. As the reserve depletes, F → 0, τ → f, and the cut-off falls to break-even.

import type { Deposit, Economics, LaneCutoffs } from './types.ts';
import { avgGradeAbove, invertDecreasing, invertIncreasing, lnParams, metalAbove, oreFraction } from './gradetonnage.ts';

const median3 = (a: number, b: number, c: number): number => a + b + c - Math.min(a, b, c) - Math.max(a, b, c);

/** The break-even cut-off: a block is ore iff g·y·(p−k) − h ≥ 0 (mining cost is sunk, the block is mined regardless). */
export function breakEven(econ: Economics): number {
  const margin = econ.recovery * (econ.price - econ.refiningCost);
  return margin > 0 ? econ.processingCost / margin : Infinity;
}

/** All six Lane cut-offs + the effective optimum, given F (= the present value of the remaining operation, $M). */
export function laneCutoffs(econ: Economics, deposit: Deposit, F: number): LaneCutoffs {
  const { price: p, refiningCost: k, processingCost: h, recovery: y, fixedCostYr: f,
    mineCapacity: M, millCapacity: H, marketCapacity: K, discountRate: delta } = econ;
  const margin = y * (p - k);
  const tau = f + F * delta; // $M/yr opportunity cost of a year of the binding capacity
  const cv = deposit.gradeCv;
  const Mg = deposit.gradeMean;
  const gMax = cv < 1e-4 ? Mg * 1.2 : Math.exp(lnParams(Mg, cv).mu + 4 * lnParams(Mg, cv).sigma);

  // limiting cut-offs
  const gMine = margin > 0 ? h / margin : Infinity;
  const gMill = margin > 0 ? (h + tau / H) / margin : Infinity;
  const denomK = y * ((p - k) - tau / K);
  const gMarket = denomK > 0 ? h / denomK : Infinity;

  // balancing cut-offs (equalise the binding-stage throughput times)
  const gMineMill = M > 0 ? invertDecreasing((g) => oreFraction(g, Mg, cv), Math.min(1, H / M), gMax) : 0;
  const gMillMarket = invertIncreasing((g) => avgGradeAbove(g, Mg, cv), K / (H * y), gMax);
  const gMineMarket = invertDecreasing((g) => metalAbove(g, Mg, cv), K / (M * y), gMax);

  // Dagdelen's median construction per pair, then the binding pair gives the effective optimum.
  const Gmh = median3(gMine, gMill, gMineMill);
  const Ghk = median3(gMill, gMarket, gMillMarket);
  const Gmk = median3(gMine, gMarket, gMineMarket);

  // the effective optimum is the largest of the pairwise optima that is actually feasible, equivalently the binding
  // constraint is the one demanding the highest cut-off (a higher cut-off relieves whichever stage is tightest).
  const candidates: Array<{ g: number; binding: string }> = [
    { g: Gmh, binding: 'mine↔mill' }, { g: Ghk, binding: 'mill↔market' }, { g: Gmk, binding: 'mine↔market' },
  ];
  candidates.sort((a, b) => a.g - b.g);
  const eff = candidates[1]; // the median pairwise optimum (Lane/Dagdelen): not the loosest, not the tightest
  return {
    gMine, gMill, gMarket, gMineMill, gMillMarket, gMineMarket,
    binding: eff.binding, effective: eff.g,
  };
}
