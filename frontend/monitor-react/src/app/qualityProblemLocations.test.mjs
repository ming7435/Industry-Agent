import test from 'node:test';
import assert from 'node:assert/strict';
import * as simulation from './qualitySimulation.mjs';

const trace = {
  traceability_source: 'simulation_profile', measurement_device_id: 'RENISHAW-EQUATOR300-001',
  production_device_id: 'TRAK-TC820LTYSI-001', production_device_name: 'TRAK 车床',
  line_id: 'SIM-LINE-A', line_name: '模拟 A 线', root_cause_status: 'unconfirmed',
};
const dimension = {
  key: 'operations.2.diameter', name: '孔2 · 直径', kind: 'number', unit: 'mm',
  expected: '8', actual: '8.02', difference: '0.02', status: 'unqualified', part_id: 'SIM-PART-2',
};
const batch = (changes = {}) => ({
  simulation: true, synthetic: true, status: 'partial', traceability: trace,
  station: { measurement_device_id: 'RENISHAW-EQUATOR300-001' },
  basis: { parameters: [{ key: 'operations.0.length', name: '主体 · 长度', expected: '100', kind: 'number', unit: 'mm' }] },
  issues: [dimension], samples: [], counts: { pending: 0 }, ...changes,
});
const locate = value => simulation.possibleProblemLocations?.(value);

test('size deviation links its actual production machine to tooling checks without confirming a fault', () => {
  const locations = locate(batch());
  assert.equal(locations?.length, 1);
  assert.equal(locations[0].device_id, 'TRAK-TC820LTYSI-001');
  assert.equal(locations[0].device_name, 'TRAK 车床');
  assert.equal(locations[0].line_name, '模拟 A 线');
  assert.equal(locations[0].category, 'size');
  assert.equal(locations[0].status, 'unconfirmed');
  assert.match(locations[0].location, /刀具.*刀补.*加工程序/);
  assert.equal(locations[0].evidence[0].key, 'operations.2.diameter');
  assert.equal(locations[0].evidence[0].actual, '8.02');
  assert.match(locations[0].recommendations.join(' '), /复测/);
});

test('position deviation targets fixture and coordinates rather than the measuring instrument', () => {
  const locations = locate(batch({ issues: [{ ...dimension, key: 'operations.1.position.0', name: '孔1 · X位置', expected: '0', actual: '-0.03', difference: '-0.03' }] }));
  assert.equal(locations?.[0]?.category, 'position');
  assert.equal(locations[0].device_id, 'TRAK-TC820LTYSI-001');
  assert.match(locations[0].location, /定位夹具.*坐标零点/);
  assert.equal(locations[0].evidence[0].expected, '0');
});

test('direction and feature-count deviations receive distinct process checks', () => {
  const locations = locate(batch({ issues: [
    { ...dimension, key: 'operations.1.axis', name: '孔1 · 轴向', kind: 'choice', unit: '—', expected: 'z', actual: 'x', difference: null },
    { ...dimension, key: 'hole_count', name: '圆孔数量', kind: 'count', unit: '个', expected: '4', actual: '3', difference: '-1', part_id: 'SIM-PART-3' },
  ] }));
  assert.deepEqual(locations?.map(p => p.category), ['direction', 'process']);
  assert.match(locations[0].location, /加工方向/);
  assert.match(locations[1].location, /工序.*孔槽/);
});

test('only missing parameter observations identify a possible acquisition location, never a confirmed probe fault', () => {
  const locations = locate(batch({ issues: [], samples: [
    { part_id: 'SIM-PART-9', simulation: true, synthetic: true, observations: {} },
  ], counts: { pending: 1 } }));
  assert.equal(locations?.length, 1);
  assert.equal(locations[0].category, 'acquisition');
  assert.equal(locations[0].device_id, 'RENISHAW-EQUATOR300-001');
  assert.notEqual(locations[0].device_id, 'TRAK-TC820LTYSI-001');
  assert.match(locations[0].location, /数据采集/);
  assert.equal(locations[0].evidence[0].actual, null);
  assert.equal(locations[0].evidence[0].part_id, 'SIM-PART-9');
  assert.equal(locations[0].status, 'unconfirmed');
  assert.doesNotMatch(locations[0].reason, /探针故障|机器故障已确认/);
});

test('pending totals alone cannot invent an acquisition diagnosis and zero measurements are present', () => {
  assert.deepEqual(locate(batch({ issues: [], samples: [], counts: { pending: 1 } })), []);
  assert.deepEqual(locate(batch({ issues: [], samples: [
    { part_id: 'SIM-PART-9', simulation: true, synthetic: true, observations: { 'operations.0.length': { value: 0, unit: 'mm' } } },
  ] })), []);
});

test('unknown production associations remain unknown instead of inventing the known factory machine', () => {
  const locations = locate(batch({ traceability: { measurement_device_id: 'RENISHAW-EQUATOR300-001', traceability_source: 'unknown' } }));
  assert.equal(locations?.[0]?.device_id, null);
  assert.equal(locations[0].device_name, '未知机器');
  assert.equal(locations[0].line_name, '未知产线');
  assert.match(locations[0].reason, /无法定位具体机器/);
});

test('unverified trace fields and conflicting measurement identities do not become device claims', () => {
  const production = locate(batch({ traceability: { ...trace, traceability_source: 'unknown' } }));
  assert.equal(production?.[0]?.device_id, null);
  const acquisition = locate(batch({ issues: [], station: { measurement_device_id: 'OTHER-METER' }, samples: [
    { part_id: 'SIM-PART-9', simulation: true, synthetic: true, observations: {} },
  ] }));
  assert.equal(acquisition?.[0]?.device_id, null);
  assert.equal(acquisition[0].device_name, '未知测量设备');
});

test('related deviations group under one location with unique sample evidence, without changing the saved batch', () => {
  const input = batch({ issues: [dimension, { ...dimension }, { ...dimension, part_id: 'SIM-PART-3', actual: '8.04', difference: '0.04' }] });
  const original = structuredClone(input);
  const locations = locate(input);
  assert.equal(locations?.length, 1);
  assert.equal(locations[0].evidence.length, 2);
  assert.equal(locations[0].sample_count, 2);
  assert.deepEqual(input, original);
});

test('no result, clean samples, untrusted results and review records never manufacture suspicious machines', () => {
  for (const input of [null, batch({ issues: [] }), batch({ simulation: false }), batch({ synthetic: false }), batch({ status: 'review' })]) {
    assert.deepEqual(locate(input), []);
  }
});

test('unknown parameter types provide a generic review point instead of an invented tooling diagnosis', () => {
  const locations = locate(batch({ issues: [{ ...dimension, key: 'unknown.field', name: '未知参数' }] }));
  assert.equal(locations?.[0]?.category, 'review');
  assert.match(locations[0].location, /参数.*核对/);
  assert.doesNotMatch(locations[0].location, /刀具|刀补/);
});

test('uncovered design inputs are not mistaken for a missing measurement or acquisition fault', () => {
  assert.deepEqual(locate(batch({issues:[],basis:{parameters:[{key:'operations.3.radius',expected:'1',unit:'mm',comparable:false}]},
    samples:[{part_id:'SIM-PART-1',simulation:true,synthetic:true,observations:{}}]})),[]);
});

test('verified finished bounding dimension deviations have tooling checks, not an unknown parameter fallback', () => {
  assert.equal(locate(batch({issues:[{...dimension,key:'model.bounds_mm.2'}]}))[0].category,'size');
});
