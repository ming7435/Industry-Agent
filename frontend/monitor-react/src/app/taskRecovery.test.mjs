import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryLabel } from './taskRecovery.mjs';

test('failed records stay read only even when an old response permits resume', () => {
  assert.equal(recoveryLabel({can_resume:true,status:'failed'}), '等待人工处理');
  assert.equal(recoveryLabel({can_resume:false,status:'failed'}), '等待人工处理');
});

test('uncertain operations and historical completed tasks keep distinct labels', () => {
  assert.equal(recoveryLabel({requires_reconcile:true,status:'outcome_unknown'}), '原操作结果待核对');
  assert.equal(recoveryLabel({status:'completed'}), '历史任务已完成');
});
