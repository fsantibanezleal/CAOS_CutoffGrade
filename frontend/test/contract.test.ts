// CONTRACT 2 (frontend side) — the baked case-results.json must conform to the TS mirror and carry the invariants the
// App relies on. Run with: node --import tsx --test test/contract.test.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { CaseResultsFile } from '../src/lib/contract.types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const data: CaseResultsFile = JSON.parse(
  readFileSync(resolve(HERE, '../../data/derived/case-results.json'), 'utf-8'),
);

const IDS = ['K-MILL', 'K-MINE', 'K-MARKET', 'S-BASE', 'S-HIGHPRICE', 'S-LOWPRICE', 'D-HIVAR', 'D-LOWVAR', 'C-UNIFORM', 'C-BREAKEVEN'];

test('case-results.json has the expected schema + all 10 cases', () => {
  assert.equal(data.schema, 'cutoffgrade.case-results/v1');
  assert.equal(data.nCases, 10);
  for (const id of IDS) assert.ok(data.cases[id], `missing case ${id}`);
});

test('the grade-tonnage curve is monotone (ore fraction down, avg grade up)', () => {
  for (const [id, c] of Object.entries(data.cases)) {
    const gt = c.gradeTonnage;
    for (let i = 1; i < gt.length; i++) {
      assert.ok(gt[i].oreFraction <= gt[i - 1].oreFraction + 1e-6, `${id}: ore fraction non-increasing`);
      assert.ok(gt[i].avgGrade >= gt[i - 1].avgGrade - 1e-9, `${id}: avg grade non-decreasing`);
    }
  }
});

test('every case has a finite NPV + an ordered cashflow schedule', () => {
  for (const [id, c] of Object.entries(data.cases)) {
    assert.ok(Number.isFinite(c.optimal.npv), `${id}: finite NPV`);
    assert.ok(c.optimal.lifeYears >= 1, `${id}: a positive life`);
    assert.ok(c.npvUpliftPct >= -1e-6, `${id}: Lane NPV >= constant (uplift >= 0)`);
  }
});

test('NPV is monotone in price (high > base > low)', () => {
  assert.ok(data.cases['S-HIGHPRICE'].optimal.npv > data.cases['S-BASE'].optimal.npv, 'high > base');
  assert.ok(data.cases['S-BASE'].optimal.npv > data.cases['S-LOWPRICE'].optimal.npv, 'base > low');
});

test('the C-BREAKEVEN oracle: the optimal constant cut-off equals the break-even', () => {
  const c = data.cases['C-BREAKEVEN'];
  assert.ok(Math.abs(c.constant.cutoff - c.breakEven) / c.breakEven < 0.06, `constant ${c.constant.cutoff} ~ break-even ${c.breakEven}`);
});

test('the mill-limited case high-grades (mean cut-off above break-even)', () => {
  const c = data.cases['K-MILL'];
  assert.ok(c.optimal.meanCutoff > c.breakEven, `mean cut-off ${c.optimal.meanCutoff} > break-even ${c.breakEven}`);
});
