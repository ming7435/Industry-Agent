import test from 'node:test';
import assert from 'node:assert/strict';
import { freeCadArtifacts, freeCadDisplayNumber, validFreeCadPartNumber, readFreeCadSession, saveFreeCadSession } from './freecad.mjs';

const id = `FC-${'a'.repeat(64)}`;
const artifacts = ['stl','step','fcstd'].map((format) => ({ name: `model.${format}`, format, url: `/api/cad/freecad/runs/${id}/artifacts/model.${format}` }));
const assembly = { run_id: id, status: 'completed', artifacts, validation: { valid: true, units: 'mm',
  solid_count: 2, model_kind: 'assembly', component_count: 2, step_roundtrip: true,
  interference_checked: true, components: [{ name: '底座', solid_count: 1, volume_mm3: 24000 }, { name: '球', solid_count: 1, volume_mm3: 4188.79 }] } };

test('新零件编号必须恰好五位数字，保留前导零', () => {
  for (const number of ['00123', '00000', '99999']) assert.equal(validFreeCadPartNumber(number), true);
  for (const number of ['', '1234', '123456', '12a45', '１２３４５', '12345\n', 12345, null]) {
    assert.equal(validFreeCadPartNumber(number), false);
  }
  assert.equal(freeCadDisplayNumber({ run_id: id, part_number: '00123' }), '00123');
});

test('历史设计显示五位短号，不改写原编号或完整运行标识', () => {
  const legacy = { run_id: id, part_number: 'PIN-001' };
  assert.equal(freeCadDisplayNumber(legacy), '11530');
  assert.equal(freeCadDisplayNumber({ run_id: `FC-${'0'.repeat(64)}` }), '00000');
  assert.equal(freeCadDisplayNumber({ run_id: 'invalid' }), '');
  assert.deepEqual(legacy, { run_id: id, part_number: 'PIN-001' });
});

test('显示短号相同的设计仍以完整运行标识获取各自产物', () => {
  const anotherId = `FC-${'b'.repeat(56)}${'a'.repeat(8)}`;
  const original = { ...assembly, part_number: '' };
  const another = { ...original, run_id: anotherId, artifacts: artifacts.map((item) => ({ ...item,
    url: item.url.replace(id, anotherId) })) };
  assert.equal(freeCadDisplayNumber(original), freeCadDisplayNumber(another));
  assert.notEqual(freeCadArtifacts(original)[0].url, freeCadArtifacts(another)[0].url);
  assert.equal(another.run_id, anotherId);
});

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

test('当前模型的零件标识与下一零件草稿分开恢复', () => {
  let value;
  const storage = { setItem: (_, text) => { value = text; }, getItem: () => value };
  saveFreeCadSession(storage, { prompt: '原任务', command_id: 'old', run_id: id,
    part_name: '销轴', part_number: 'PIN-001', draft_part_name: '底板', draft_part_number: 'PLATE-002' });
  const saved = readFreeCadSession(storage);
  assert.equal(saved.part_name, '销轴');
  assert.equal(saved.part_number, 'PIN-001');
  assert.equal(saved.draft_part_name, '底板');
  assert.equal(saved.draft_part_number, 'PLATE-002');
});
