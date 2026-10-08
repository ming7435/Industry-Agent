import test from 'node:test';
import assert from 'node:assert/strict';
import * as cad from './freecad.mjs';

const id = `FC-${'b'.repeat(64)}`;
const artifact = (name) => ({ name, format: name.split('.').at(-1).toLowerCase(), url: `/api/cad/freecad/runs/${id}/artifacts/${name}` });
const models = ['model.stl', 'model.step', 'model.FCStd'].map(artifact);
const completed = { run_id: id, status: 'completed', validation: { valid: true, solid_count: 1, step_roundtrip: true }, artifacts: models };
const names = (run) => cad.freeCadArtifacts(run).map((item) => item.name);

test('工程图和钣金展开的两个SVG同时保留，按文件名消除重复', () => {
  const run = { ...completed, validation: { ...completed.validation, drawing: { verified: true }, sheet_metal: { verified: true } },
    artifacts: [...models, ...['drawing.svg', 'drawing.pdf', 'unfold.svg', 'unfold.dxf', 'unfold.svg'].map(artifact)] };
  assert.deepEqual(names(run), ['model.stl', 'model.step', 'model.FCStd', 'drawing.svg', 'drawing.pdf', 'unfold.svg', 'unfold.dxf']);
});

test('缺少对应工作台证据时不能展示二维产物', () => {
  const run = { ...completed, artifacts: [...models, ...['drawing.svg', 'drawing.pdf', 'unfold.svg', 'unfold.dxf'].map(artifact)] };
  assert.deepEqual(names(run), ['model.stl', 'model.step', 'model.FCStd']);
  run.validation = { ...run.validation, drawing: { verified: true }, sheet_metal: { verified: false } };
  assert.deepEqual(names(run), ['model.stl', 'model.step', 'model.FCStd', 'drawing.svg', 'drawing.pdf']);
});

test('扩展产物拒绝其他运行、任意路径、查询参数及格式冒充', () => {
  const correct = artifact('drawing.svg');
  const invalid = [
    { ...correct, url: correct.url.replace(id, `FC-${'c'.repeat(64)}`) },
    { ...correct, url: `${correct.url}?download=1` },
    { ...correct, url: `https://example.test${correct.url}` },
    { ...artifact('../drawing.svg') }, { ...artifact('Drawing.svg') },
    { ...correct, format: 'stl' },
  ];
  assert.deepEqual(names({ ...completed, validation: { ...completed.validation, drawing: { verified: true } }, artifacts: invalid }), []);
});

const assemblyProof = { valid: true, model_kind: 'assembly', solid_count: 2, component_count: 2,
  step_roundtrip: true, interference_checked: true,
  components: [{ name: 'Base', solid_count: 1, volume_mm3: 8000 }, { name: 'Arm', solid_count: 1, volume_mm3: 2000 }],
  assembly: { verified: true, solver_status: 0, motion_frames: 24 } };

test('真实装配运动需要求解成功和有效帧数，旧静态装配继续可用', () => {
  const run = { ...completed, validation: assemblyProof, artifacts: [...models, artifact('motion.json')] };
  assert.deepEqual(names(run), ['model.stl', 'model.step', 'model.FCStd', 'motion.json']);
  for (const assembly of [undefined, { verified: false, solver_status: 0, motion_frames: 24 },
    { verified: true, solver_status: 1, motion_frames: 24 }, { verified: true, solver_status: 0, motion_frames: 1 },
    { verified: true, solver_status: 0, motion_frames: '24' }]) {
    assert.deepEqual(names({ ...run, validation: { ...assemblyProof, assembly } }), ['model.stl', 'model.step', 'model.FCStd']);
  }
});

const bimProof = { valid: true, model_kind: 'bim', solid_count: 2, component_count: 2, step_roundtrip: true,
  components: [{ name: 'Wall', solid_count: 1, volume_mm3: 1200000 }, { name: 'Slab', solid_count: 1, volume_mm3: 4800000 }],
  bim: { verified: true, walls: 1, slabs: 1, openings: 1, opening_volume_removed: 378000 } };

test('完整BIM多实体证据允许下载，不要求建筑通过机械装配干涉检查', () => {
  assert.deepEqual(names({ ...completed, validation: bimProof }), ['model.stl', 'model.step', 'model.FCStd']);
});

test('BIM缺少实体归属、开口或对象数量证据时拒绝展示', () => {
  for (const change of [{ step_roundtrip: false }, { component_count: 1 }, { components: [] },
    { bim: { ...bimProof.bim, verified: false } }, { bim: { ...bimProof.bim, walls: 3 } },
    { bim: { ...bimProof.bim, opening_volume_removed: 0 } }, { bim: { verified: true } }]) {
    assert.deepEqual(names({ ...completed, validation: { ...bimProof, ...change } }), []);
  }
});

test('未完成或无有效实体的图纸不能冒充建模结果', () => {
  for (const change of [{ status: 'failed' }, { validation: { valid: true, solid_count: 0, drawing: { verified: true } } }]) {
    assert.deepEqual(names({ ...completed, artifacts: [artifact('drawing.svg')], ...change }), []);
  }
});

test('工作台示例提供明确尺寸、展开K因子、剖面与真实关节运动参数', () => {
  const samples = cad.freeCadWorkbenchExamples;
  assert.ok(samples, '缺少可编辑的工作台示例');
  assert.deepEqual(samples.drawing.spec.drawing, { projection: 'third_angle', scale: 1, section: null });
  assert.deepEqual(samples.section.spec.drawing.section, { origin: [30, 20, 10], normal: [0, 1, 0] });
  assert.deepEqual(samples.sheetmetal.spec.sheet_metal, { width: 80, base_length: 60, flange_length: 30, thickness: 2, bend_radius: 3, bend_angle: 90, k_factor: 0.4 });
  const motion = samples.motion.spec;
  assert.equal(motion.parts.length, 2);
  assert.equal(motion.assembly.joints[0].type, 'revolute');
  assert.equal(motion.assembly.motion.start, 0);
  assert.equal(motion.assembly.motion.end, 90);
  assert.equal(motion.assembly.motion.frames, 25);
  assert.equal(samples.bim.spec.bim.walls.length, 1);
  assert.equal(samples.bim.spec.bim.slabs.length, 1);
  assert.equal(samples.bim.spec.bim.openings.length, 1);
  assert.equal(samples.bim.spec.drawing.scale, 0.02);
});
