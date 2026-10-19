import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiagnosisTaskView } from './diagnosisView.mjs';
import { buildMaintenanceWorkspaceRecords } from './maintenanceWorkspace.mjs';

function fixture() {
  const event = (id, device = 'M1', revision = 1) => ({tenant_id:'T', device_id:device,
    event_id:id, event_revision:revision, alarm_code:'700015'});
  const first = event('E1'), second = event('E2'), other = event('E3', 'M2');
  const diagnosis = row => ({...row, status:'completed', summary:`${row.event_id} 的诊断`});
  const pipeline = row => ({event:row, diagnosis:diagnosis(row), status:'completed',
    maintenance_plan:{device_id:row.device_id, plan_id:`P-${row.event_id}`},
    workorder:{device_id:row.device_id, plan_id:`P-${row.event_id}`, workorder_id:`W-${row.event_id}`}});
  return {device_id:'M1', trigger_history:[{abnormal_event:second}], diagnosis:{
    latest:diagnosis(second), latest_by_device:{M1:diagnosis(second)},
    pipeline_by_device:{M1:pipeline(second)},
    by_event:{first:diagnosis(first), second:diagnosis(second), other:diagnosis(other)},
    pipeline_by_event:{first:pipeline(first), second:pipeline(second), other:pipeline(other)},
  }};
}

test('同设备的每个故障可以独立查看，默认仍跟随当前故障', () => {
  const snapshot = fixture(), before = structuredClone(snapshot);
  const live = buildDiagnosisTaskView(snapshot, {device_id:'M1',alarm_code:'700015'});
  assert.equal(live.view.summary, 'E2 的诊断');
  assert.equal(live.tasks.length, 2);
  const task = live.tasks.find(row => row.event.event_id === 'E1');
  const selected = buildDiagnosisTaskView(snapshot, {device_id:'M1',alarm_code:'700015'}, task.key);
  assert.equal(selected.view.summary, 'E1 的诊断');
  assert.equal(selected.selectedTask.planId, 'P-E1');
  assert.equal(selected.selectedTask.workorderId, 'W-E1');
  assert.deepEqual(snapshot, before);
});

test('切换设备后不能沿用上台设备选中的历史故障', () => {
  const snapshot = fixture();
  const previous = buildDiagnosisTaskView(snapshot, {device_id:'M1'}).tasks[0].key;
  const selected = buildDiagnosisTaskView(snapshot, {device_id:'M2',alarm_code:'700015'}, previous);
  assert.equal(selected.selectedTask, null);
  assert.equal(selected.tasks.length, 1);
  assert.equal(selected.tasks[0].event.device_id, 'M2');
  assert.doesNotMatch(selected.view.summary, /E1|E2/);
});

test('事件相同但修订或租户不同，不能借用另一个版本的方案和工单', () => {
  const snapshot = fixture();
  const first = snapshot.diagnosis.by_event.first;
  snapshot.diagnosis.by_event.revised = {...first, event_revision:2, summary:'新修订'};
  snapshot.diagnosis.pipeline_by_event.first.event.event_revision = 2;
  snapshot.diagnosis.pipeline_by_event.second.event.tenant_id = 'OTHER';
  const tasks = buildDiagnosisTaskView(snapshot, {device_id:'M1'}).tasks;
  assert.equal(tasks.find(row => row.event.event_id === 'E1' && row.event.event_revision === '1').planId, '');
  assert.equal(tasks.find(row => row.event.event_id === 'E2').workorderId, '');
  assert.equal(tasks.find(row => row.event.event_revision === '2').planId, 'P-E1');
});

test('较早故障的方案阶段完成后也进入维修列表，不只展示设备最新故障', () => {
  const snapshot = fixture(), before = structuredClone(snapshot);
  const records = buildMaintenanceWorkspaceRecords({snapshot});
  assert.deepEqual(new Set(records.map(row => row.plan_id)), new Set(['P-E1', 'P-E2', 'P-E3']));
  assert.equal(records.find(row => row.plan_id === 'P-E1').event_id, 'E1');
  assert.equal(records.find(row => row.plan_id === 'P-E3').device_id, 'M2');
  assert.deepEqual(snapshot, before);
});

test('兼容旧精简响应中的方案诊断归属，但拒绝同设备其他事件的方案', () => {
  const snapshot = fixture();
  const firstPlan = snapshot.diagnosis.pipeline_by_event.first.maintenance_plan;
  delete firstPlan.device_id;
  firstPlan.diagnosis = snapshot.diagnosis.by_event.first;
  let task = buildDiagnosisTaskView(snapshot, {device_id:'M1'}).tasks.find(row => row.event.event_id === 'E1');
  assert.equal(task.planId, 'P-E1');
  firstPlan.diagnosis = snapshot.diagnosis.by_event.second;
  task = buildDiagnosisTaskView(snapshot, {device_id:'M1'}).tasks.find(row => row.event.event_id === 'E1');
  assert.equal(task.planId, '');
  assert.equal(task.workorderId, '');
});
