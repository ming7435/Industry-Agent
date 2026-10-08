import test from 'node:test';
import assert from 'node:assert/strict';
import {buildComparisonPayload, comparisonStatusLabel} from './cadQuality.mjs';

const runId = `FC-${'a'.repeat(64)}`;
const design = {run_id: runId, design_digest: 'a'.repeat(64), parameters: [
  {key:'op_1_diameter', nominal:30, unit:'mm', exact:false},
  {key:'op_1_length', nominal:50, unit:'mm', exact:false},
]};

test('manual values and explicit tolerances submit only actual observations', () => {
  const result = buildComparisonPayload(design, 'PART-01', {
    op_1_diameter: {actual: '30.01', tolerance: '0.02'},
    op_1_length: {actual: '50', tolerance: '0.1'},
  });
  assert.deepEqual(result, {
    run_id: runId, design_digest: 'a'.repeat(64), part_id: 'PART-01',
    measurements: {op_1_diameter:{actual:30.01, tolerance:0.02},op_1_length:{actual:50,tolerance:0.1}},
  });
});

test('blank values remain missing instead of being replaced with nominal zero', () => {
  const result = buildComparisonPayload(design, 'PART-01', {
    op_1_diameter: {actual:'',tolerance:'0.2'},
  });
  assert.deepEqual(result.measurements, {});
});

test('invalid, negative, and nonfinite entries are refused', () => {
  for (const bad of [{actual:'not-a-number',tolerance:'0.1'}, {actual:'30', tolerance:'-1'}, {actual:'Infinity',tolerance:'0.1'}]) {
    assert.throws(() => buildComparisonPayload(design, 'PART-01', {op_1_diameter:bad}), /输入|公差|数字/);
  }
});

test('unknown parameter key and stale invalid CAD version are refused', () => {
  assert.throws(() => buildComparisonPayload(design, 'PART-01', {spoof:{actual:'0',tolerance:'0'}}), /未知/);
  assert.throws(() => buildComparisonPayload({...design,run_id:'other'}, 'PART-01', {}), /编号/);
});

test('integer count only supports exact matching', () => {
  const gear = {...design, parameters: [{key:'op_1_teeth',nominal:24,exact:true,unit:'个'}]};
  assert.throws(() => buildComparisonPayload(gear,'PART-01',{op_1_teeth:{actual:'24',tolerance:'1'}}), /整数|公差/);
  assert.deepEqual(buildComparisonPayload(gear,'PART-01',{op_1_teeth:{actual:'24',tolerance:'0'}}).measurements.op_1_teeth,{actual:24,tolerance:0});
});

test('status messaging differentiates inconsistent and incomplete', () => {
  assert.equal(comparisonStatusLabel('consistent'), '参数一致');
  assert.equal(comparisonStatusLabel('inconsistent'), '参数不一致');
  assert.equal(comparisonStatusLabel('insufficient_data'), '数据不足');
});
