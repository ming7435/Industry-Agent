import test from 'node:test';
import assert from 'node:assert/strict';
import { combinedVerdict, qualityRate, verifiedCombinedReport } from './combinedQuality.mjs';

const part = (id, a, b) => ({ quality_part_id: 'CQ-' + id.repeat(32), scope: 'validation', batch_id: 'B-1',
  serial_number: id, design_version: 'V-1', revision: 2, parameters: { decision: a }, visual: { decision: b },
  status: a === 'fail' || b === 'fail' ? 'unqualified' : a === 'pass' && b === 'pass' ? 'qualified' : 'pending' });
const report = () => ({ scope: 'validation', batch_id: '', batches: ['B-1'],
  items: [part('a', 'pass', 'pass'), part('b', 'pending', 'fail'), part('c', 'pass', 'pending')],
  summary: { total: 3, qualified: 1, unqualified: 1, pending: 1, determinate: 2, rate_percent: 50, coverage_percent: 66.67 } });

test('part decisions distinguish failure missing and two complete confirmations', () => {
  for (const a of ['pass', 'fail', 'pending']) for (const b of ['pass', 'fail', 'pending']) {
    assert.equal(combinedVerdict(part('a', a, b)), part('a', a, b).status);
  }
  assert.equal(qualityRate(null), '—'); assert.equal(qualityRate(0), '0.00%');
});
test('rate evidence rejects image counts averages duplicates and wrong scope', () => {
  assert.equal(verifiedCombinedReport(report(), 'validation', '').summary.rate_percent, 50);
  for (const change of [
    v => v.summary.rate_percent = 33.33,
    v => v.summary.pending = 0,
    v => v.items.push(v.items[0]),
    v => v.items[0].status = 'pending',
    v => v.items[0].scope = 'production',
    v => v.summary.coverage_percent = 100,
  ]) {
    const v = report(); change(v); assert.throws(() => verifiedCombinedReport(v, 'validation', ''));
  }
  assert.throws(() => verifiedCombinedReport(report(), 'validation', 'B-2'));
});
