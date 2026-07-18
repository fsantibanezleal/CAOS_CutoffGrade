// Per-case analysis, ties the engine together into one result the offline bake (data-pipeline/cglab/science/
// bake_cases.mjs) and the SPA both consume: the grade-tonnage curve, Lane's six cut-offs, the optimal declining
// trajectory + NPV + life + cashflow schedule, the best-constant baseline it beats, and a sensitivity sweep. Pure +
// deterministic.

import type { Deposit, Economics, GTPoint, LaneCutoffs, SchedulePoint } from './types.ts';
import { gradeTonnageCurve } from './gradetonnage.ts';
import { breakEven, laneCutoffs } from './lane.ts';
import { laneTrajectory, optimalConstantCutoff } from './optimize.ts';

export interface SensitivityRow {
  param: string;
  lo: number; base: number; hi: number;      // the parameter value at −/0/+
  npvLo: number; npvBase: number; npvHi: number;
  cutLo: number; cutBase: number; cutHi: number; // the optimal initial cut-off
}

export interface Analysis {
  deposit: Deposit;
  econ: Economics;
  breakEven: number;
  gradeTonnage: GTPoint[];
  cutoffs: LaneCutoffs;          // at the start-of-life opportunity cost
  optimal: {
    npv: number; lifeYears: number; meanCutoff: number; meanGrade: number;
    schedule: SchedulePoint[];   // decimated to ≤ 40 points
    trajectory: number[];
  };
  constant: { cutoff: number; npv: number };
  binding: string;
  npvUpliftPct: number;          // the high-grading uplift of the Lane policy over the best constant
  sensitivity: SensitivityRow[];
}

function decimate<T>(arr: T[], maxN: number): T[] {
  if (arr.length <= maxN) return arr;
  const step = Math.ceil(arr.length / maxN);
  return arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
}

const r = (x: number, n = 4): number => Math.round(x * 10 ** n) / 10 ** n;

/** Run one (deposit, economics) through the whole Lane optimization. */
export function analyze(econ: Economics, deposit: Deposit): Analysis {
  const be = breakEven(econ);
  const gradeTonnage = decimate(gradeTonnageCurve(deposit.gradeMean, deposit.gradeCv, 48), 26);
  const lane = laneTrajectory(econ, deposit);
  const constant = optimalConstantCutoff(econ, deposit);
  // the start-of-life opportunity cost uses F ≈ the operation's NPV
  const cutoffs = laneCutoffs(econ, deposit, lane.npv);
  const npvUpliftPct = constant.result.npv > 0 ? (100 * (lane.npv - constant.result.npv)) / constant.result.npv : 0;

  // sensitivity: ±relative shocks to the headline economics
  const sweep = (param: string, mut: (f: number) => Economics, deltas: [number, number]): SensitivityRow => {
    const base = lane;
    const lo = laneTrajectory(mut(1 + deltas[0]), deposit);
    const hi = laneTrajectory(mut(1 + deltas[1]), deposit);
    const first = (s: SchedulePoint[]): number => (s.length ? s[0].cutoff : 0);
    return {
      param,
      lo: deltas[0], base: 0, hi: deltas[1],
      npvLo: r(lo.npv, 1), npvBase: r(base.npv, 1), npvHi: r(hi.npv, 1),
      cutLo: r(first(lo.schedule)), cutBase: r(first(base.schedule)), cutHi: r(first(hi.schedule)),
    };
  };
  const sensitivity: SensitivityRow[] = [
    sweep('price', (f) => ({ ...econ, price: econ.price * f }), [-0.3, 0.4]),
    sweep('processingCost', (f) => ({ ...econ, processingCost: econ.processingCost * f }), [-0.3, 0.5]),
    sweep('millCapacity', (f) => ({ ...econ, millCapacity: econ.millCapacity * f }), [-0.3, 0.3]),
    sweep('discountRate', (f) => ({ ...econ, discountRate: econ.discountRate * f }), [-0.5, 0.5]),
  ];

  return {
    deposit, econ, breakEven: r(be, 6),
    gradeTonnage: gradeTonnage.map((p) => ({ cutoff: r(p.cutoff, 6), oreFraction: r(p.oreFraction), avgGrade: r(p.avgGrade, 6) })),
    cutoffs,
    optimal: {
      npv: r(lane.npv, 1), lifeYears: lane.lifeYears, meanCutoff: r(lane.meanCutoff, 6), meanGrade: r(lane.meanGrade, 6),
      schedule: decimate(lane.schedule, 40),
      trajectory: lane.trajectory.map((g) => r(g, 6)),
    },
    constant: { cutoff: r(constant.cutoff, 6), npv: r(constant.result.npv, 1) },
    binding: cutoffs.binding,
    npvUpliftPct: r(npvUpliftPct, 2),
    sensitivity,
  };
}
