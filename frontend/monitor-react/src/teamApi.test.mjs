import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationPayload } from './teamApi.mjs';
import { buildRepairCompletionPayload } from './workorderSheet.mjs';

test('registration identity includes machine only for technician', () => {
  assert.deepEqual(registrationPayload('a', 'password', 'supervisor', 'M1'), {username: 'a', password: 'password', role: 'supervisor', primary_device_id: ''});
  assert.equal(registrationPayload('b', 'password', 'technician', 'M1').primary_device_id, 'M1');
});

test('completion never manufactures actor, timestamp or verification', () => {
  const result = buildRepairCompletionPayload({feedback: '已更换', operator: 'fake', maintenanceConfirmedBy: 'fake', deviceId: 'M1', recoverySample: {status: 'running'}});
  assert.deepEqual(result, {action: 'mark_repair_completed', repair_feedback: {feedback: '已更换'}});
});
