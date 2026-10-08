import test from 'node:test';
import assert from 'node:assert/strict';
import { freeCadArtifacts, readFreeCadSession, saveFreeCadSession } from './freecad.mjs';

const id = `FC-${'a'.repeat(64)}`;
const artifacts = ['stl','step','fcstd'].map((format) => ({ name: `model.${format}`, format, url: `/api/cad/freecad/runs/${id}/artifacts/model.${format}` }));
const assembly = { run_id: id, status: 'completed', artifacts, validation: { valid: true, units: 'mm',
  solid_count: 2, model_kind: 'assembly', component_count: 2, step_roundtrip: true,
  interference_checked: true, components: [{ name: '底座', solid_count: 1, volume_mm3: 24000 }, { name: '球', solid_count: 1, volume_mm3: 4188.79 }] } };

test('经过 STEP 回读和干涉检查的两零件装配可以展示并下载', () => {
  assert.equal(freeCadArtifacts(assembly).length, 3);
});

test('普通零件不能以多实体冒充成功装配，装配缺证据也不能提供下载', () => {
  for (const change of [{ model_kind: 'part' }, { component_count: 3 }, { step_roundtrip: false },
    { interference_checked: false }, { components: [] }, { solid_count: true }, { solid_count: 1 }]) {
    assert.equal(freeCadArtifacts({ ...assembly, validation: { ...assembly.validation, ...change } }).length, 0);
  }
});

test('刷新会话保留尚未提交的完整结构化参数，不会只保留文字', () => {
  let value;
  const storage = { setItem: (_, text) => { value = text; }, getItem: () => value };
  const draft = '{"units":"mm","parts":[]}';
  saveFreeCadSession(storage, { prompt: '原任务', command_id: 'old', run_id: id, draft_prompt: '装配草稿', draft_spec: draft });
  const saved = readFreeCadSession(storage);
  assert.equal(saved.draft_spec, draft);
  assert.equal(saved.prompt, '原任务');
});
