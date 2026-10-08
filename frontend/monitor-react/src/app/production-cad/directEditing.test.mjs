import test from 'node:test';
import assert from 'node:assert/strict';
const direct = await import('./directEditing.mjs').catch((error) => { if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error; });
const box = { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [5,6,7] }] };
const available = () => assert.equal(typeof direct.directDimensions, 'function', '需要来自真实规格的图上尺寸，不是底部表单跳转');

test('图上尺寸绑定实际规格字段和CAD坐标，移动原点后不按画布包围盒猜尺寸', () => {
  available();
  const measures = direct.directDimensions(box, 'operations.0');
  const length = measures.find((item) => item.id === 'operations.0.length');
  assert.equal(length.value, 40);
  assert.equal(length.b[0] - length.a[0], 40);
  assert.deepEqual(length.delta, [1,0,0]);
  const height = measures.find((item) => item.id === 'operations.0.height');
  assert.equal(height.b[2] - height.a[2], 10);
  assert.deepEqual(height.delta, [0,0,1]);
  assert.equal(box.operations[0].length, 40);
});

test('孔的直径端点和位置手柄归属选中孔，不修改另一个孔或主体', () => {
  available();
  const spec = { ...box, operations: [...box.operations, { type: 'cylinder', mode: 'cut', diameter: 8, length: 10, axis: 'z', position: [15,16,7] }] };
  const measures = direct.directDimensions(spec, 'operations.1');
  const diameter = measures.find((item) => item.id === 'operations.1.diameter');
  assert.equal(diameter.b[0] - diameter.a[0], 8);
  assert.deepEqual(diameter.delta, [0.5,0,0]);
  assert.deepEqual(measures.find((item) => item.id === 'operations.1.position.0').delta, [1,0,0]);
  assert.ok(measures.every((item) => item.id.startsWith('operations.1.')));
});

test('按当前相机投影换算拖动毫米数，垂直拖动不意外修改横向尺寸', () => {
  available();
  const projected = direct.projectDirectDimensions(direct.directDimensions(box, 'operations.0'), (p) => ({ x: p[0]*2+100, y: p[2]*-3+300, z: 0 }), 800, 500);
  const length = projected.find((item) => item.id === 'operations.0.length');
  assert.deepEqual(length.unitPixels, [2,0]);
  assert.equal(direct.dragDimensionValue(length, 20, 0), 50);
  assert.equal(direct.dragDimensionValue(length, 0, 100), 40);
  const height = projected.find((item) => item.id === 'operations.0.height');
  assert.equal(direct.dragDimensionValue(height, 0, -30), 20);
});

test('背后或退化投影不能生成可拖动手柄，非法尺寸不能由拖动放行', () => {
  available();
  const measures = direct.directDimensions(box, 'operations.0');
  assert.deepEqual(direct.projectDirectDimensions(measures, () => ({ x: 50, y: 50, z: 2 }), 800, 500), []);
  const length = direct.projectDirectDimensions(measures, (p) => ({ x: p[0]*2, y: p[2]*2, z: 0 }), 800, 500).find((item) => item.id === 'operations.0.length');
  assert.throws(() => direct.dragDimensionValue(length, -100, 0));
  assert.throws(() => direct.dragDimensionValue({ ...length, unitPixels: [0,0] }, 10, 0));
});

test('未建立准确坐标映射的运动装配和建筑不伪造图上几何尺寸', () => {
  available();
  assert.deepEqual(direct.directDimensions({ units: 'mm', parts: [{ name: '臂', operations: box.operations }], assembly: { motion: {} } }, 'parts.0.operations.0'), []);
  assert.deepEqual(direct.directDimensions({ units: 'mm', bim: { walls: [] } }, 'bim.walls.0'), []);
});

test('尺寸端点避开底部确认栏，保留真实端点引线和相机毫米换算', () => {
  available();
  const item = direct.projectDirectDimensions(direct.directDimensions(box, 'operations.0'), (p) => ({ x: p[0]*2+100, y: p[1]*2+410, z: 0 }), 800, 500).find((value) => value.id === 'operations.0.length');
  assert.ok(item.b[1] <= 380, '手柄不能藏在底部工具栏后');
  assert.ok(item.anchorB[1] > item.b[1], '保留连接实体原位置的引线');
  assert.deepEqual(item.unitPixels, [2,0]);
});

test('齿轮朝向为X时，齿宽手柄沿真实轴向而非固定Z轴', () => {
  const spec = { units: 'mm', operations: [{ type: 'gear', mode: 'add', module: 2, teeth: 20, width: 10, bore_diameter: 8, pressure_angle: 20, axis: 'x', position: [5,6,7] }] };
  const measures = direct.directDimensions(spec, 'operations.0');
  const width = measures.find((item) => item.id === 'operations.0.width');
  assert.deepEqual(width.delta, [1,0,0]);
  assert.equal(width.b[0] - width.a[0], 10);
  assert.equal(width.a[0], 5);
  assert.equal(width.a[2], width.b[2]);
});
