import test from 'node:test';
import assert from 'node:assert/strict';
import { createMotionClock, getMachineMotionState, getWorkshopMotionState } from './workshopMotion.mjs';

const now = Date.parse('2026-10-08T08:00:00+08:00');
const machine = (id, sample = {}, status = 'normal') => ({
  id, live: true, result: { status },
  sample: { status: 'running', control_state: 'running', timestamp: new Date(now).toISOString(), ...sample },
});
const devices = () => ['lathe', 'feeder', 'robot', 'inspection'].map(id => machine(id));
const state = (options = {}) => getWorkshopMotionState({ machines: devices(), line: { state: 'running' }, runner: { enabled: true, running: true }, now, ...options });

function panelRestart() {
  const line = { state: 'stopped', updated_at: (now - 60000) / 1000,
    devices: Object.fromEntries(devices().map(({ id }) => [id,
      { state: 'verified', action: 'emergency_stop', snapshot: { device_id: id, status: 'emergency_stop' } }])) };
  const machines = devices().map(item => machine(item.id, { device_id: item.id, alarm_code: null,
    control_reason: 'operator panel start', control_updated_at: now - 30000 }));
  return { line, machines };
}

test('fresh panel starts after an old verified stop restore only the device visualization', () => {
  const input = panelRestart(), before = structuredClone(input);
  const motion = state(input);
  assert.equal(motion.running, true);
  assert.equal(motion.validUntil, now + 10000);
  assert.equal(motion.auditPending, true);
  assert.match(motion.reason, /待对账/);
  assert.deepEqual(input, before, 'Visualization must not change the line ledger or device controls');
});

test('a later line stop or incomplete panel-start evidence never resumes visualization', () => {
  const cases = [
    input => { input.line.updated_at = (now - 30000) / 1000; },
    input => { delete input.line.updated_at; },
    input => { input.line.updated_at = (now + 1000) / 1000; },
    input => { delete input.line.devices; },
    input => { input.machines.pop(); },
    input => { input.machines[0].id = input.machines[1].id; },
    input => { input.machines[0].sample.device_id = 'another-device'; },
    input => { delete input.machines[0].sample.control_state; },
    input => { delete input.machines[0].sample.control_updated_at; },
    input => { input.machines[0].sample.control_updated_at = now + 1000; },
    input => { input.machines[0].sample.control_reason = 'repair verified'; },
    input => { input.machines[0].sample.alarm_code = 'ACTIVE-ALARM'; },
    input => { input.machines[0].result.status = 'alarm'; },
    input => { input.machines[0].result.status = 'fault'; },
    input => { input.machines[0].live = false; },
    input => { input.machines[0].sample.status = 'emergency_stop'; },
    input => { input.machines[0].sample.timestamp = new Date(now - 15000).toISOString(); },
    input => { input.line.devices.lathe.state = 'unconfirmed'; },
    input => { input.line.devices.lathe.snapshot.device_id = 'wrong-device'; },
  ];
  for (const [index, change] of cases.entries()) {
    const input = panelRestart(); change(input);
    assert.equal(state(input).running, false, `Incomplete or superseded evidence case ${index}`);
  }
  for (const status of ['starting', 'stopping', 'failed', 'unreconciled', 'unavailable']) {
    const input = panelRestart(); input.line.state = status;
    assert.equal(state(input).running, false, status);
  }
  assert.equal(state({ ...panelRestart(), unavailable: true }).running, false);
  assert.equal(state({ ...panelRestart(), runner: { enabled: false } }).running, false);
});

test('all four devices run only with current running samples', () => {
  assert.equal(state().running, true);
  assert.equal(state().validUntil, now + 10000);
  assert.equal(state({ line: { state: 'unknown' } }).running, true);
  assert.equal(state({ machines: [] }).running, false);
  assert.equal(state({ machines: [...devices(), { id: 'visual', visualOnly: true }] }).running, true);
  assert.equal(state({ machines: [...devices(), { id: 'missing', live: false }] }).running, false);
});

test('a stop from any device freezes the entire line, including inconsistent control/status fields', () => {
  for (let index = 0; index < 4; index++) {
    for (const stop of ['stopped', 'paused', 'emergency_stop', 'e_stop', 'stopping']) {
      for (const field of ['status', 'control_state']) {
        const machines = devices();
        machines[index] = machine(machines[index].id, { [field]: stop });
        assert.equal(state({ machines }).running, false, `${index}:${field}:${stop}`);
        assert.equal(getMachineMotionState(machines[index]), 'stopped');
      }
    }
  }
});

test('fault pauses all movement, while warning alone does not stop a running line', () => {
  assert.equal(state({ machines: [machine('fault', {}, 'fault')] }).running, false);
  assert.equal(state({ machines: [machine('warning', {}, 'warning')] }).running, true);
});

test('repair completion does not resume before line restart verification', () => {
  for (const status of ['stopping', 'stopped', 'starting', 'failed', 'stop_failed', 'unavailable']) {
    assert.equal(state({ line: { state: status } }).running, false, status);
  }
  assert.equal(state({ line: null }).running, false);
  assert.equal(state({ line: { state: 'running' }, machines: [machine('not-yet-started', { status: 'stopped' })] }).running, false);
});

test('monitoring paused, failed, missing and stale data never keep playing previous running state', () => {
  assert.equal(state({ runner: { enabled: false, running: true } }).running, false);
  assert.equal(state({ runner: { enabled: true, running: false } }).running, false);
  assert.equal(state({ runner: { last_error: 'offline' } }).running, false);
  assert.equal(state({ unavailable: true }).running, false);
  assert.equal(state({ machines: [machine('stale', { timestamp: new Date(now - 15000).toISOString() })] }).running, false);
  assert.equal(state({ machines: [machine('missing-time', { timestamp: null })] }).running, false);
  assert.equal(state({ machines: [machine('unknown', { status: 'unknown', control_state: 'running' })] }).running, false);
});

test('motion clock freezes every paused frame and resumes without catching up wall time', () => {
  const clock = createMotionClock();
  assert.deepEqual(clock.tick(1000, true), { time: 0, delta: 0 });
  assert.deepEqual(clock.tick(1020, true), { time: 0.02, delta: 0.02 });
  assert.deepEqual(clock.tick(1040, false), { time: 0.02, delta: 0 });
  assert.deepEqual(clock.tick(30000, false), { time: 0.02, delta: 0 });
  assert.deepEqual(clock.tick(31000, true), { time: 0.02, delta: 0 });
  assert.deepEqual(clock.tick(31020, true), { time: 0.04, delta: 0.02 });
  assert.ok(clock.tick(90000, true).delta <= 0.1, 'background tab return must not jump through a cycle');
});
