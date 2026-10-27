import test from 'node:test';
import assert from 'node:assert/strict';
import {csvRows,parseMeasurementCsv,measurementTemplate,verifiedMeasuredBatch} from '../frontend/monitor-react/src/app/measuredQuality.mjs';
import {verifiedJointReport} from '../frontend/monitor-react/src/app/jointQuality.mjs';
import {measuredBatch,pendingJoint,measuredCsv} from './browser/helpers/measured-batch-fixture.mjs';

test('empty template contains no generated measured values',()=>{
  assert.equal(csvRows(measurementTemplate).length,1);
  assert.throws(()=>parseMeasurementCsv(measurementTemplate,'empty.csv'),/没有测量记录/);
});
test('CSV preserves zero and missing readings and separates physical identities',()=>{
  const text=measuredCsv+measuredCsv.split('\n')[1].replace('GEAR-001','GEAR-002').replace('20.00','');
  const body=parseMeasurementCsv(text,'measurements.csv',false);
  assert.equal(body.samples.length,2);assert.equal(body.samples[1].measurements['轴孔直径'].value,null);
  assert.equal(body.plan_complete,false);assert.equal(body.measurement_reference,'measurements.csv');
  assert.equal(parseMeasurementCsv(measuredCsv.replace('20.00','0'),'m.csv').samples[0].measurements['轴孔直径'].value,'0');
});
test('quoted CSV and BOM parse without destroying standard references',()=>{
  const value=parseMeasurementCsv('\uFEFF'+measuredCsv.replace('QA fixture standard','"Drawing, section ""A"""'),'m.csv');
  assert.equal(value.standard_reference,'Drawing, section "A"');
  assert.deepEqual(csvRows('a,b\r\n"two\nlines","quote""inside"'),[['a','b'],['two\nlines','quote"inside']]);
});
test('ambiguous repeated measurements or mixed batches cannot enter counts',()=>{
  assert.throws(()=>parseMeasurementCsv(measuredCsv+measuredCsv.split('\n')[1],'m.csv'),/重复/);
  assert.throws(()=>parseMeasurementCsv(measuredCsv+measuredCsv.split('\n')[1].replace('B-QA','B-OTHER'),'m.csv'),/同一批次/);
  assert.throws(()=>parseMeasurementCsv(measuredCsv+measuredCsv.split('\n')[1].replace('GEAR-001','GEAR-002').replace('19.98','19.97'),'m.csv'),/验收范围/);
  assert.throws(()=>csvRows('a,"broken'),/未闭合/);
});
test('synthetic or forged summary cannot be displayed as an actual batch result',()=>{
  assert.equal(verifiedMeasuredBatch(measuredBatch),measuredBatch);
  assert.throws(()=>verifiedMeasuredBatch({...measuredBatch,synthetic:true}));
  assert.equal(verifiedJointReport(pendingJoint,measuredBatch),pendingJoint);
  assert.throws(()=>verifiedJointReport({...pendingJoint,scope:'simulation_validation'},measuredBatch));
  assert.throws(()=>verifiedJointReport({...pendingJoint,qualified_rate:100},measuredBatch));
  assert.throws(()=>verifiedJointReport({...pendingJoint,request_id:'old'},measuredBatch));
});
