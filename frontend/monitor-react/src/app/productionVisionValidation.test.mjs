import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleProductionJobs, verifiedProductionValidation, verifiedLocalization } from './productionVisionValidation.mjs';

const hex = value => value.repeat(64);
test('localization keeps legacy records readable but rejects inconsistent spatial counts', () => {
  verifiedLocalization([], undefined);
  const header = { method: 'label_agnostic_bbox_iou', iou_threshold: .5 };
  const counts = { tp: 0, fn: 1, fp: 1, ground_truth_count: 1 };
  const scene = { label: 'defect', results: [{ algorithm: 'yolo', defects: [{ bbox: [0, 0, 5, 5] }] }],
    localization: { ...header, ground_truth_boxes: [[20, 20, 30, 30]], results: { yolo: counts } } };
  const totals = { ...header, yolo: counts, patchcore: { tp: 0, fn: 0, fp: 0, ground_truth_count: 0 } };
  verifiedLocalization([scene], totals);
  assert.throws(() => verifiedLocalization([scene], { ...totals, yolo: { ...counts, tp: 1 } }), /定位/);
  assert.throws(() => verifiedLocalization([{ ...scene, localization: undefined }], totals), /定位/);
});
const job = { job_id: 'SIM-JOB-' + hex('a'), part_id: 'SIM-PART-' + hex('a'), design_run_id: 'FC-' + hex('b'),
  design_digest: hex('c'), program_digest: hex('d'), actor_id: 'U1', batch_id: 'B1', revision: 1,
  source: 'factory-simulation', simulation_only: true, status: 'completed', sync_status: 'confirmed', progress: 1 };
job.output = { ...job, output_digest: hex('e'), synthetic: true, units: 'mm' };
const run = () => ({ run_id: 'PV-' + 'f'.repeat(32), request_id: 'request-1', status: 'running', created_at: '2026-10-19T08:00:00Z',
  source: { ...job, output_digest: job.output.output_digest, synthetic: true } });

test('production selection only offers confirmed completed output identities', () => {
  assert.deepEqual(eligibleProductionJobs([job, { ...job, status: 'running' }, { ...job, sync_status: 'review' },
    { ...job, output: { ...job.output, part_id: 'SIM-PART-' + hex('9') } }]), [job]);
});

test('saved validation rejects a different output or actor instead of displaying its history', () => {
  assert.equal(verifiedProductionValidation(run(), job).status, 'running');
  for (const field of ['job_id', 'part_id', 'design_run_id', 'design_digest', 'program_digest', 'batch_id', 'actor_id', 'output_digest']) {
    const value = run(); value.source[field] += 'wrong';
    assert.throws(() => verifiedProductionValidation(value, job), /追溯|身份/);
  }
});

test('incomplete completed result is rejected and request reconciliation checks original id', () => {
  assert.throws(() => verifiedProductionValidation({ ...run(), status: 'completed' }, job), /结果/);
  assert.throws(() => verifiedProductionValidation(run(), job, 'another-request'), /请求/);
});
