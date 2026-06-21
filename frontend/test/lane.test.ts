// Engine correctness — run with: node --import tsx --test test/lane.test.ts
//
// The science is pinned against closed forms + Lane's theory: the lognormal grade-tonnage curve is monotone; the
// single-grade oracle is all-or-nothing; the no-time-cost oracle's optimal cut-off equals the break-even; NPV is
// monotone in price; Lane's declining policy is ≥ the best constant cut-off; and the mill-limited cut-off declines
// over the life (high-grading). Everything is deterministic.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  avgGradeAbove, breakEven, laneTrajectory, normCdf, optimalConstantCutoff, oreFraction, simulateLife,
} from '../src/lane/index.ts';
import { caseById } from '../src/lane/cases.ts';

test('normCdf is a valid CDF', () => {
  assert.ok(Math.abs(normCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(normCdf(1.959964) - 0.975) < 1e-3);
  assert.ok(normCdf(-3) < normCdf(0) && normCdf(0) < normCdf(3));
});

test('grade-tonnage curve is monotone (lognormal)', () => {
  const M = 0.0075;
  const cv = 0.6;
  assert.equal(oreFraction(0, M, cv), 1);
  // ore fraction decreases with the cut-off; avg ore grade increases and is ≥ the mean
  let prevFrac = 1;
  let prevGrade = 0;
  for (let i = 1; i <= 10; i++) {
    const gc = (M * 2 * i) / 10;
    const fr = oreFraction(gc, M, cv);
    const gb = avgGradeAbove(gc, M, cv);
    assert.ok(fr <= prevFrac + 1e-9, 'ore fraction non-increasing');
    assert.ok(gb >= prevGrade - 1e-9, 'avg ore grade non-decreasing');
    assert.ok(gb >= gc - 1e-9, 'avg ore grade ≥ the cut-off');
    prevFrac = fr;
    prevGrade = gb;
  }
});

test('C-UNIFORM oracle — single-grade deposit is all-or-nothing', () => {
  const M = 0.0075;
  const cv = 0.00001;
  assert.equal(oreFraction(M * 0.9, M, cv), 1, 'cut-off below the grade → all ore');
  assert.equal(oreFraction(M * 1.1, M, cv), 0, 'cut-off above the grade → no ore');
  // the optimizer should treat (essentially) the whole deposit as ore (mean grade is above break-even)
  const c = caseById('C-UNIFORM');
  const be = breakEven(c.econ);
  assert.ok(M > be, 'sanity: the uniform grade is above break-even');
  const best = optimalConstantCutoff(c.econ, c.deposit);
  assert.ok(best.cutoff < M, 'optimal cut-off is below the single grade → everything is ore');
  assert.ok(best.result.npv > 0, 'positive NPV');
});

test('C-BREAKEVEN oracle — no time cost ⇒ optimal cut-off = break-even', () => {
  const c = caseById('C-BREAKEVEN');
  const be = breakEven(c.econ);
  const best = optimalConstantCutoff(c.econ, c.deposit, 400);
  // with f=0, δ=0 and mining the binding constraint, the NPV-optimal cut-off is the break-even
  assert.ok(Math.abs(best.cutoff - be) / be < 0.06, `optimal ${best.cutoff} ≈ break-even ${be}`);
});

test('NPV is monotone increasing in price', () => {
  const lo = caseById('S-LOWPRICE');
  const base = caseById('S-BASE');
  const hi = caseById('S-HIGHPRICE');
  const npvLo = optimalConstantCutoff(lo.econ, lo.deposit).result.npv;
  const npvBase = optimalConstantCutoff(base.econ, base.deposit).result.npv;
  const npvHi = optimalConstantCutoff(hi.econ, hi.deposit).result.npv;
  assert.ok(npvLo < npvBase, `NPV(low ${npvLo.toFixed(0)}) < NPV(base ${npvBase.toFixed(0)})`);
  assert.ok(npvBase < npvHi, `NPV(base ${npvBase.toFixed(0)}) < NPV(high ${npvHi.toFixed(0)})`);
});

test("Lane's declining policy is ≥ the best constant cut-off", () => {
  for (const id of ['K-MILL', 'D-HIVAR', 'S-BASE']) {
    const c = caseById(id);
    const constNpv = optimalConstantCutoff(c.econ, c.deposit).result.npv;
    const lane = laneTrajectory(c.econ, c.deposit);
    assert.ok(lane.npv >= constNpv - 1e-6 * Math.max(1, Math.abs(constNpv)), `${id}: Lane ${lane.npv.toFixed(1)} ≥ constant ${constNpv.toFixed(1)}`);
  }
});

test('mill-limited cut-off declines over the life (high-grading)', () => {
  const c = caseById('K-MILL');
  const lane = laneTrajectory(c.econ, c.deposit);
  assert.ok(lane.trajectory.length >= 3, 'a multi-year life');
  const first = lane.trajectory[0];
  const last = lane.trajectory[lane.trajectory.length - 1];
  assert.ok(first >= last - 1e-9, `cut-off declines: first ${first} ≥ last ${last}`);
  assert.ok(lane.meanCutoff > breakEven(c.econ), 'the mean cut-off is above break-even');
});

test('the simulator is deterministic', () => {
  const c = caseById('S-BASE');
  const a = simulateLife(() => 0.006, c.econ, c.deposit);
  const b = simulateLife(() => 0.006, c.econ, c.deposit);
  assert.equal(a.npv, b.npv);
  assert.equal(a.lifeYears, b.lifeYears);
});
