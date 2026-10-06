import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareInspectionInput} from './inspectionInput.mjs';

test('人工录入保留真实值，不默认填通过、外观正常或猜测规格', () => {
  const {part} = prepareInspectionInput({part_no:'PIN'}, {measurements:'{"diameter_mm":10}',appearance:'{"burr":true}'});
  assert.equal(part.measurements.diameter_mm,10);
  assert.equal(part.appearance.burr,true);
  assert.deepEqual(part.specifications,{});
  assert.equal(part.passed,undefined);
});
test('输入格式错误明确指出项目', () => {
  assert.throws(()=>prepareInspectionInput({}, {measurements:'bad'}),/尺寸实测值/);
  assert.throws(()=>prepareInspectionInput({}, {appearance:'[]'}),/外观记录/);
});
