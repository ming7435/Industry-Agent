import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSimulation, formatSimulationRate, pendingSimulationKey } from './qualitySimulation.mjs';
import { request } from './apiRequest.mjs';
import { getTeamSession, setTeamSessionActor } from '../teamSession.mjs';

const id = 'FC-' + 'a'.repeat(64);
const result = { simulation: true, synthetic: true, design_run_id: id, request_id: 'click-1', batch_id: 'SIM-BATCH-1',
  rates: { qualified: 77.78, defect: 22.22, coverage: 90 }, counts: { total: 10, determinate: 9, qualified: 7, unqualified: 2, pending: 1 } };

test('detect sends only full design ID and request ID and adopts the saved batch', async () => {
  const calls = [];
  const api = async (path, options) => { calls.push([path, options]); return result; };
  assert.equal(await detectSimulation(api, { design_run_id: id, request_id: 'click-1' }), result);
  assert.deepEqual(calls, [['/api/quality/simulation/detect', { method: 'POST', body: JSON.stringify({ design_run_id: id, request_id: 'click-1' }) }]]);
});

test('unknown write reconciles by GET without automatically sending a second POST', async () => {
  const calls = [];
  const api = async (path) => { calls.push(path); if (calls.length === 1) throw new TypeError('lost response'); return result; };
  assert.equal(await detectSimulation(api, { design_run_id: id, request_id: 'click-1' }), result);
  assert.deepEqual(calls, ['/api/quality/simulation/detect', '/api/quality/simulation/requests/click-1']);
});

test('not found reconciliation leaves result unknown instead of claiming cancellation', async () => {
  let count = 0;
  const api = async () => { count++; throw Object.assign(new Error(count === 1 ? 'network lost' : 'not found'), count === 2 ? { status: 404 } : {}); };
  await assert.rejects(detectSimulation(api, { design_run_id: id, request_id: 'click-1' }), error => error.outcomeUnknown === true);
  assert.equal(count, 2);
});

test('a definite pre-execution rejection is not blindly retried or reconciled', async () => {
  let count = 0;
  const api = async () => { count++; throw Object.assign(new Error('factory offline'), { status: 503, detail: { execution_started: false } }); };
  await assert.rejects(detectSimulation(api, { design_run_id: id, request_id: 'click-1' }), /factory offline/);
  assert.equal(count, 1);
});

test('wrong design or real-looking results cannot be displayed as this simulated batch', async () => {
  for (const invalid of [{ ...result, design_run_id: 'FC-'+'b'.repeat(64) }, { ...result, simulation: false }, { ...result, rates: { ...result.rates, qualified: NaN } }]) {
    await assert.rejects(detectSimulation(async () => invalid, { design_run_id: id, request_id: 'click-1' }));
  }
});

test('rates preserve zero and missing and pending keys isolate users and full versions', () => {
  assert.equal(formatSimulationRate(null), '—');
  assert.equal(formatSimulationRate(0), '0.00%');
  assert.equal(formatSimulationRate(77.78), '77.78%');
  assert.notEqual(pendingSimulationKey('U1', id), pendingSimulationKey('U2', id));
  assert.notEqual(pendingSimulationKey('U1', id), pendingSimulationKey('U1', 'FC-'+'b'.repeat(64)));
});

test('delayed simulation results from the previous login cannot reach the current actor', async () => {
  const originalFetch = globalThis.fetch;
  try {
    setTeamSessionActor({user_id:'U1',role:'technician'},{force:true});
    let release;
    globalThis.fetch = () => new Promise(done => { release = done; });
    const inflight = request('/api/quality/simulation/detect', {method:'POST'});
    setTeamSessionActor({user_id:'U2',role:'technician'},{force:true});
    release({status:200,ok:true,json:async()=>result});
    await assert.rejects(inflight, error=>error.sessionChanged===true);
    assert.equal(getTeamSession().actor.user_id,'U2');
  } finally { globalThis.fetch=originalFetch;setTeamSessionActor(null,{force:true}); }
});
