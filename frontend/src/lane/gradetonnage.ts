// The grade-tonnage curve, the deposit as a lognormal distribution of in-situ grade. For a cut-off g_c we need the
// ore fraction (proportion at or above g_c) and the average ore grade (mean grade above g_c). Both are analytic for a
// lognormal, so the oracles are exact. cv → 0 degenerates to a single-grade deposit (handled explicitly).

import type { GTPoint } from './types.ts';

/** Error function (Abramowitz & Stegun 7.1.26), |error| < 1.5e-7. */
export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/** Standard normal CDF. */
export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Lognormal parameters (μ, σ of ln g) from the mean grade M and the coefficient of variation cv. */
export function lnParams(M: number, cv: number): { mu: number; sigma: number } {
  const s2 = Math.log(1 + cv * cv);
  return { mu: Math.log(M) - s2 / 2, sigma: Math.sqrt(s2) };
}

const UNIFORM_CV = 1e-4; // below this the deposit is treated as a single grade M

/** Fraction of the inventory with grade ≥ g_c (the ore fraction). */
export function oreFraction(gc: number, M: number, cv: number): number {
  if (gc <= 0) return 1;
  if (cv < UNIFORM_CV) return gc <= M ? 1 : 0;
  const { mu, sigma } = lnParams(M, cv);
  return normCdf((mu - Math.log(gc)) / sigma);
}

/** Mean grade of the ore (E[g | g ≥ g_c]). For a lognormal: M·Φ(d2+σ)/Φ(d2), d2 = (μ−ln g_c)/σ. */
export function avgGradeAbove(gc: number, M: number, cv: number): number {
  if (gc <= 0) return M;
  if (cv < UNIFORM_CV) return M; // single grade
  const { mu, sigma } = lnParams(M, cv);
  const d2 = (mu - Math.log(gc)) / sigma;
  const fr = normCdf(d2);
  if (fr <= 1e-9) return gc; // essentially no ore above; guard
  return (M * normCdf(d2 + sigma)) / fr;
}

/** "Metal above cut-off" per unit inventory = oreFraction · avgGrade (the recoverable grade·tonnes, normalised). */
export function metalAbove(gc: number, M: number, cv: number): number {
  return oreFraction(gc, M, cv) * avgGradeAbove(gc, M, cv);
}

/** The grade-tonnage curve, nPts cut-offs from 0 to ~the 99th percentile. */
export function gradeTonnageCurve(M: number, cv: number, nPts = 40): GTPoint[] {
  const gMax = cv < UNIFORM_CV ? M * 1.2 : Math.exp(lnParams(M, cv).mu + 3 * lnParams(M, cv).sigma);
  const pts: GTPoint[] = [];
  for (let i = 0; i < nPts; i++) {
    const gc = (gMax * i) / (nPts - 1);
    pts.push({ cutoff: gc, oreFraction: oreFraction(gc, M, cv), avgGrade: avgGradeAbove(gc, M, cv) });
  }
  return pts;
}

/** Invert a monotone-decreasing f(g) = target on [0, gMax] by bisection (used for the balancing cut-offs). */
export function invertDecreasing(f: (g: number) => number, target: number, gMax: number): number {
  let lo = 0;
  let hi = gMax;
  if (f(lo) <= target) return 0; // even cut-off 0 is below target → no positive cut-off needed
  if (f(hi) >= target) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Invert a monotone-increasing f(g) = target on [0, gMax] by bisection. */
export function invertIncreasing(f: (g: number) => number, target: number, gMax: number): number {
  let lo = 0;
  let hi = gMax;
  if (f(lo) >= target) return 0;
  if (f(hi) <= target) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
