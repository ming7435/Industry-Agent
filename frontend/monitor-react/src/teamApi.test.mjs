import test from 'node:test';
import assert from 'node:assert/strict';
import * as teamApi from './teamApi.mjs';
const { registrationPayload } = teamApi;
import { buildRepairCompletionPayload } from './workorderSheet.mjs';

test('registration always binds a technician to the chosen machine', () => {
  assert.deepEqual(registrationPayload(' 维修甲 ', 'password', 'M1'), {username: '维修甲', password: 'password', role: 'technician', primary_device_id: 'M1', responsible_device_ids: ['M1']});
});

test('registration sends every selected machine and retains the first primary identity', () => {
  assert.deepEqual(registrationPayload(' 维修甲 ', 'password', ['M2', ' M1 ', 'M2']),
    {username: '维修甲', password: 'password', role: 'technician', primary_device_id: 'M2', responsible_device_ids: ['M2', 'M1']});
});

test('scope changes contain only normalized selected device IDs and cannot select another actor', () => {
  assert.equal(typeof teamApi.responsibilityPayload, 'function');
  assert.deepEqual(teamApi.responsibilityPayload([' M1 ', 'M2', 'M1']), {responsible_device_ids: ['M1', 'M2']});
  assert.throws(() => teamApi.responsibilityPayload([]), /至少选择一台/);
  assert.throws(() => registrationPayload('维修甲', 'password', []), /至少选择一台/);
});

test('legacy accounts use their primary device only when the new field is absent', () => {
  assert.equal(typeof teamApi.responsibleDeviceIds, 'function');
  assert.deepEqual(teamApi.responsibleDeviceIds({primary_device_id: 'M1'}), ['M1']);
  assert.deepEqual(teamApi.responsibleDeviceIds({primary_device_id: 'M1', responsible_device_ids: ['M2', 'M3']}), ['M2', 'M3']);
  assert.deepEqual(teamApi.responsibleDeviceIds({primary_device_id: 'M1', responsible_device_ids: []}), []);
});

test('completion never manufactures actor, timestamp or verification', () => {
  const result = buildRepairCompletionPayload({feedback: '已更换', operator: 'fake', maintenanceConfirmedBy: 'fake', deviceId: 'M1', recoverySample: {status: 'running'}});
  assert.deepEqual(result, {action: 'mark_repair_completed', repair_feedback: {feedback: '已更换'}});
});
