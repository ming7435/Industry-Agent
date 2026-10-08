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
