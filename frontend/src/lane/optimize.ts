// The NPV optimizer. Two routines, both built on an EXACT year-by-year life simulator (correct by construction):
//   1. optimalConstantCutoff — the single cut-off that maximises NPV (a 1-D grid search). The verifiable baseline.
//   2. laneTrajectory — Lane's iterative DECLINING cut-off (high-grading): each year's cut-off uses the opportunity
//      cost F·δ of the remaining operation; as the reserve depletes F → 0 and the cut-off falls to break-even. The
//      reported policy is the better of the converged trajectory and the best constant cut-off (Lane is ≥ constant).
//
// Assumption (standard Lane): the remaining inventory always has the SAME grade distribution (uniform mixing), so the
// grade-tonnage curve is stationary as the deposit depletes.

import type { Deposit, Economics, LifeResult, SchedulePoint } from './types.ts';
import { avgGradeAbove, lnParams, oreFraction } from './gradetonnage.ts';
import { breakEven, laneCutoffs } from './lane.ts';

const MAX_YEARS = 250;

function gMaxOf(deposit: Deposit): number {
  const { gradeMean: Mg, gradeCv: cv } = deposit;
  return cv < 1e-4 ? Mg * 1.2 : Math.exp(lnParams(Mg, cv).mu + 4 * lnParams(Mg, cv).sigma);
}

/** Simulate the whole life under a per-year cut-off policy. Stops when the inventory is gone or a year is value-negative. */
export function simulateLife(cutoffFn: (year: number, remainingMt: number) => number, econ: Economics, deposit: Deposit): LifeResult {
  const { price: p, refiningCost: k, processingCost: h, recovery: y, miningCost: m, fixedCostYr: f,
    mineCapacity: M, millCapacity: H, marketCapacity: K, discountRate: delta } = econ;
  const { gradeMean: Mg, gradeCv: cv } = deposit;
  let R = deposit.tonnageMt;
  let npv = 0;
  let oreWtCutoff = 0;
  let oreWtGrade = 0;
  let oreTot = 0;
  const schedule: SchedulePoint[] = [];

  for (let year = 0; year < MAX_YEARS && R > 1e-9; year++) {
    const g = Math.max(0, cutoffFn(year, R));
    const phi = oreFraction(g, Mg, cv);
    const gbar = avgGradeAbove(g, Mg, cv);
    if (phi <= 1e-9) break; // cut-off above everything → no ore

    // total inventory processed this year (Mt), limited by the binding stage
    const limMine = M;
    const limMill = H / phi;
    const product1 = phi * gbar * y; // M-units product per Mt inventory
    const limMarket = product1 > 0 ? K / product1 : Infinity;
    const Q = Math.min(limMine, limMill, limMarket, R);
    const binding = Q >= R - 1e-12 ? 'reserve'
      : Q === limMine ? 'mine' : Q === limMill ? 'mill' : 'market';

    const ore = Q * phi;
    const cashflow = ore * gbar * y * (p - k) - ore * h - Q * m - f; // $M
    // OPERATING CONVENTION (diverges from textbook Lane): close the mine the first year a cashflow turns
    // value-negative, rather than running to reserve exhaustion at F→0. This shortens the reported mine life and
    // never reports value-negative years. Documented in docs/frameworks/01_economics.md + the Methodology Lane tab.
    if (cashflow <= 0 && year > 0) break; // continuing is value-negative → close the mine

    npv += cashflow / Math.pow(1 + delta, year);
    R -= Q;
    schedule.push({ year, cutoff: g, oreGrade: gbar, oreMt: ore, minedMt: Q, cashflow, binding, remainingMt: Math.max(0, R) });
    oreWtCutoff += g * ore;
    oreWtGrade += gbar * ore;
    oreTot += ore;
  }
  return {
    schedule,
    npv,
    lifeYears: schedule.length,
    meanCutoff: oreTot > 0 ? oreWtCutoff / oreTot : 0,
    meanGrade: oreTot > 0 ? oreWtGrade / oreTot : 0,
  };
}

/** The constant cut-off that maximises NPV: a coarse grid, then a golden-section refinement around the best grid point
 * so the argmax is accurate regardless of the grid resolution (the C-BREAKEVEN oracle needs this precision). */
export function optimalConstantCutoff(econ: Economics, deposit: Deposit, nGrid = 120): { cutoff: number; result: LifeResult } {
  const gMax = gMaxOf(deposit);
  const npvAt = (g: number): number => simulateLife(() => g, econ, deposit).npv;
  let bestG = 0;
  let bestNpv = npvAt(0);
  const step = gMax / nGrid;
  for (let i = 1; i <= nGrid; i++) {
    const g = step * i;
    const v = npvAt(g);
    if (v > bestNpv) { bestNpv = v; bestG = g; }
  }
  // golden-section refine in [bestG−step, bestG+step]
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = Math.max(0, bestG - step);
  let b = bestG + step;
  let c = b - phi * (b - a);
  let d = a + phi * (b - a);
  let fc = npvAt(c);
  let fd = npvAt(d);
  for (let i = 0; i < 30 && b - a > 1e-7 * gMax; i++) {
    if (fc > fd) { b = d; d = c; fd = fc; c = b - phi * (b - a); fc = npvAt(c); }
    else { a = c; c = d; fc = fd; d = a + phi * (b - a); fd = npvAt(d); }
  }
  const g = (a + b) / 2;
  const refined = npvAt(g);
  const cutoff = refined >= bestNpv ? g : bestG;
  return { cutoff, result: simulateLife(() => cutoff, econ, deposit) };
}

/** Backward F-profile: F[t] = Σ_{s≥t} C_s/(1+δ)^(s−t) = the value of the operation from the start of year t. */
function backwardF(schedule: SchedulePoint[], delta: number): number[] {
  const F = new Array(schedule.length + 1).fill(0);
  for (let t = schedule.length - 1; t >= 0; t--) {
    F[t] = schedule[t].cashflow + F[t + 1] / (1 + delta);
  }
  return F;
}

/** Lane's iterative declining cut-off (high-grading). Returns the better of the converged trajectory and the best
 * constant cut-off (so the reported NPV is always ≥ the constant optimum). */
export function laneTrajectory(econ: Economics, deposit: Deposit): LifeResult & { trajectory: number[] } {
  const be = breakEven(econ);
  const gMax = gMaxOf(deposit);
  // OPERATING CONVENTION (diverges from textbook Lane): clamp the cut-off to [break-even, gMax]. Strict Lane lets
  // the cut-off fall below break-even in the final years (marginal material → stockpile/blend); clamping at
  // break-even slightly raises the reported NPV vs strict Lane. Documented in docs/frameworks/01_economics.md.
  const clamp = (g: number): number => Math.min(gMax, Math.max(be, g));

  // seed with the constant optimum
  const seed = optimalConstantCutoff(econ, deposit);
  let Fprofile = backwardF(seed.result.schedule, econ.discountRate);
  let bestLife: LifeResult = seed.result;
  let bestTraj: number[] = seed.result.schedule.map((s) => s.cutoff);

  for (let iter = 0; iter < 40; iter++) {
    const traj: number[] = [];
    const life = simulateLife((year) => {
      const Fhere = Fprofile[year] ?? 0; // value of the remaining operation from this year on
      const g = clamp(laneCutoffs(econ, deposit, Fhere).effective);
      traj[year] = g;
      return g;
    }, econ, deposit);
    Fprofile = backwardF(life.schedule, econ.discountRate);
    if (life.npv > bestLife.npv) { bestLife = life; bestTraj = traj.slice(0, life.schedule.length); }
    // convergence: the trajectory stabilised
    if (iter > 2 && Math.abs(life.npv - bestLife.npv) < 1e-6 * Math.max(1, Math.abs(bestLife.npv))) break;
  }
  return { ...bestLife, trajectory: bestTraj };
}
