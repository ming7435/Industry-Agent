import test from 'node:test';
import assert from 'node:assert/strict';

// 缺失编辑器时报告行为缺失；实现后始终调用真实参数转换函数。
const editor = await import('./designEditor.mjs').catch((error) => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const box = { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 60, width: 40, height: 20, position: [0, 0, 0] }],
  drawing: { projection: 'third_angle', scale: 1, section: null } };
const available = () => assert.equal(typeof editor.designParameterGroups, 'function', '必须能从真实设计读取可编辑参数');

test('设计表单读取尺寸与位置，不要求用户理解JSON字段', () => {
  available();
  const groups = editor.designParameterGroups(box);
  const base = groups.find((group) => group.id === 'operations.0');
  assert.equal(base.label, '主体 · 长方体');
  assert.deepEqual(base.fields.slice(0, 3).map((field) => [field.label, field.value]), [['长度', 60], ['宽度', 40], ['高度', 20]]);
  assert.equal(base.fields.find((field) => field.id === 'operations.0.position.0').label, '位置 X');
});

test('修改长度生成独立新规格，不修改原模型或其他图纸参数', () => {
  available();
  const edited = editor.updateDesignParameter(box, 'operations.0.length', '80');
  assert.equal(edited.operations[0].length, 80);
  assert.equal(box.operations[0].length, 60);
  assert.deepEqual(edited.drawing, { projection: 'third_angle', scale: 1, section: null });
});

test('空值、非数、非法范围与伪造字段不能变成可提交尺寸', () => {
  available();
  for (const value of ['', 'NaN', 'Infinity', '-1', '10001']) assert.throws(() => editor.updateDesignParameter(box, 'operations.0.length', value));
  assert.throws(() => editor.updateDesignParameter(box, '__proto__.polluted', '1'));
  assert.throws(() => editor.updateDesignParameter(box, 'operations.0.type', 'thread'));
  assert.equal({}.polluted, undefined);
});

test('增加通孔位于主体中心，保留图纸并提供真实切除操作', () => {
  available();
  const edited = editor.addDesignFeature(box, 'hole');
  assert.deepEqual(edited.operations[1], { type: 'cylinder', mode: 'cut', diameter: 6, length: 20, axis: 'z', position: [30, 20, 0] });
  assert.equal(box.operations.length, 1);
  assert.deepEqual(edited.drawing, box.drawing);
});

test('增加孔先于已有倒角执行，删除特征不能删除主体', () => {
  available();
  const rounded = { ...box, operations: [...box.operations, { type: 'chamfer', distance: 1, edges: 'all' }] };
  const edited = editor.addDesignFeature(rounded, 'hole');
  assert.deepEqual(edited.operations.map((op) => op.type), ['box', 'cylinder', 'chamfer']);
  assert.equal(editor.removeDesignFeature(edited, 'operations.1').operations.length, 2);
  assert.throws(() => editor.removeDesignFeature(edited, 'operations.0'));
});

test('装配零件编辑保持名称与关节关系，不能默认改另一个零件', () => {
  available();
  const assembly = { units: 'mm', parts: [{ name: '基座', operations: box.operations }, { name: '臂', operations: box.operations }],
    assembly: { grounded: '基座', joints: [], motion: { joint: '转轴', start: 0, end: 90, duration: 2, frames: 25 } } };
  const edited = editor.updateDesignParameter(assembly, 'parts.1.operations.0.length', '75');
  assert.equal(edited.parts[0].operations[0].length, 60);
  assert.equal(edited.parts[1].operations[0].length, 75);
  assert.deepEqual(edited.assembly, assembly.assembly);
  assert.throws(() => editor.addDesignFeature(assembly, 'hole'));
});

test('钣金、建筑、剖面与运动保留结构并有中文参数编辑入口', () => {
  available();
  const sheet = { units: 'mm', sheet_metal: { width: 80, base_length: 60, flange_length: 30, thickness: 2, bend_radius: 3, bend_angle: 90, k_factor: 0.4 } };
  assert.equal(editor.updateDesignParameter(sheet, 'sheet_metal.width', '100').sheet_metal.width, 100);
  assert.throws(() => editor.updateDesignParameter(sheet, 'sheet_metal.k_factor', '1.1'));
  const building = { units: 'mm', bim: { walls: [{ name: '墙', start: [0,0,0], end: [6000,0,0], height: 3000, thickness: 200 }], slabs: [], openings: [] } };
  assert.equal(editor.updateDesignParameter(building, 'bim.walls.0.height', '2800').bim.walls[0].height, 2800);
  assert.throws(() => editor.addDesignFeature(building, 'hole'));
});

test('专业零件模板包含实际组合特征与工程图，而非一个基础形体', () => {
  available();
  const flange = editor.designTemplates.flange.spec;
  assert.equal(flange.operations.length, 7);
  assert.equal(flange.operations.filter((op) => op.mode === 'cut').length, 5);
  assert.deepEqual(flange.drawing, { projection: 'third_angle', scale: 1, section: null });
  assert.equal(editor.designTemplates.plate.spec.operations.filter((op) => op.mode === 'cut').length, 5);
});

test('已有中心通孔的法兰再加孔不能默认叠到原孔中，提案位置仍可人工修改', () => {
  available();
  const edited = editor.addDesignFeature(editor.designTemplates.flange.spec, 'hole');
  assert.deepEqual(edited.operations.at(-1).position, [17.5,17.5,0]);
  assert.equal(edited.operations.at(-1).diameter, 6);
  assert.equal(editor.updateDesignParameter(edited, 'operations.7.position.0', '18').operations[7].position[0], 18);
});

test('版本记录只接受当前固定运行标识，重复记录不会重复显示', () => {
  available();
  const id = `FC-${'a'.repeat(64)}`;
  const history = editor.appendDesignVersion([], { run_id: id, prompt: '法兰', status: 'completed', spec: box });
  assert.equal(history.length, 1);
  assert.equal(editor.appendDesignVersion(history, { run_id: id, prompt: '法兰', status: 'completed', spec: box }).length, 1);
  assert.equal(editor.appendDesignVersion(history, { run_id: '../fake', status: 'completed' }).length, 1);
  assert.equal(history[0].spec.operations[0].length, 60);
});

test('不同设计版本保留自己的零件名称和编号，旧返回不覆盖已有标识', () => {
  const id = `FC-${'a'.repeat(64)}`, next = `FC-${'b'.repeat(64)}`;
  let history = editor.appendDesignVersion([], { run_id: id, status: 'completed', part_name: '销轴', part_number: 'PIN-001' });
  history = editor.appendDesignVersion(history, { run_id: next, status: 'completed', part_name: '底板', part_number: 'PLATE-002' });
  history = editor.appendDesignVersion(history, { run_id: id, status: 'completed', prompt: '回查销轴' });
  assert.equal(history[0].part_name, '销轴');
  assert.equal(history[0].part_number, 'PIN-001');
  assert.equal(history[1].part_name, '底板');
  assert.equal(history[1].part_number, 'PLATE-002');
});
