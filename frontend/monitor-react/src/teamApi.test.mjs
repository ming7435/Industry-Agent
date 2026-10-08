import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationPayload } from './teamApi.mjs';
import { buildRepairCompletionPayload } from './workorderSheet.mjs';

test('registration always binds a technician to the chosen machine', () => {
  assert.deepEqual(registrationPayload(' 维修甲 ', 'password', 'M1'), {username: '维修甲', password: 'password', role: 'technician', primary_device_id: 'M1'});
});

test('completion never manufactures actor, timestamp or verification', () => {
  const result = buildRepairCompletionPayload({feedback: '已更换', operator: 'fake', maintenanceConfirmedBy: 'fake', deviceId: 'M1', recoverySample: {status: 'running'}});
  assert.deepEqual(result, {action: 'mark_repair_completed', repair_feedback: {feedback: '已更换'}});
});
