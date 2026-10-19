import test from 'node:test';
import assert from 'node:assert/strict';
import {freeCadArtifacts, freeCadRequest} from './freecad.mjs';
import {createDocumentApi} from './documentApi.mjs';
import {validateMotionUrl} from './motion.mjs';

const runId = `FC-${'a'.repeat(64)}`;
const run = {run_id: runId, status: 'completed', validation: {valid: true, solid_count: 1, step_roundtrip: true}};
const artifact = (name, format, prefix = 'text-to-cad') => ({name, format, url: `/api/cad/${prefix}/runs/${runId}/artifacts/${name}`});

test('text-to-cad exposes validated Python source beside STEP and STL', () => {
  const artifacts = [artifact('model.py', 'py'), artifact('model.step', 'step'), artifact('model.stl', 'stl')];
  assert.deepEqual(freeCadArtifacts({...run, artifacts}), artifacts);
  assert.deepEqual(freeCadArtifacts({...run, validation: {...run.validation, step_roundtrip: false}, artifacts}), []);
});

test('legacy files remain readable while unrelated source paths are rejected', () => {
  const legacy = artifact('model.FCStd', 'fcstd', 'freecad');
  const source = artifact('model.py', 'py');
  assert.deepEqual(freeCadArtifacts({...run, artifacts: [legacy]}), [legacy]);
  for (const invalid of [{...source, url: source.url + '?x=1'}, {...source, format: 'fcstd'},
    {...source, url: source.url.replace(runId, `FC-${'b'.repeat(64)}`)}]) {
    assert.deepEqual(freeCadArtifacts({...run, artifacts: [invalid]}), []);
  }
});

test('modeling and document requests use the canonical text-to-cad route', async () => {
  const requests = [];
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {requests.push(url); return {ok: true, json: async () => ({connected: true})};};
  try {await freeCadRequest('/status');} finally {globalThis.fetch = oldFetch;}
  const api = createDocumentApi(async (url) => {requests.push(url);return {items: []};});
  await api.documents();
  assert.deepEqual(requests, ['/api/cad/text-to-cad/status', '/api/cad/text-to-cad/documents?limit=50&cursor=']);
});

test('assembly playback accepts only the same canonical model run', () => {
  const motion = artifact('motion.json', 'json').url;
  const model = artifact('model.stl', 'stl').url;
  assert.equal(validateMotionUrl(motion, model), motion);
  assert.throws(() => validateMotionUrl(motion.replace(runId, `FC-${'b'.repeat(64)}`), model));
});
