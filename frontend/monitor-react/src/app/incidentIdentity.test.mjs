import test from 'node:test';
import assert from 'node:assert/strict';
import { currentIncident, matchesIncident, linkedPlanOrder, recordTimes, formatRecordTime, localizeIncidentText } from './incidentIdentity.mjs';
import { buildMaintenanceWorkspaceRecords } from './maintenanceWorkspace.mjs';

test('同设备同报警的再次故障不能关联上次方案或工单，修订与租户也要一致', () => {
  const incident = {device_id:'D-1',alarm_code:'700010',event_id:'E-NEW',event_revision:2,tenant_id:'T'};
  assert.equal(matchesIncident({...incident,event_id:'E-OLD'},incident),false);
  assert.equal(matchesIncident({...incident,event_revision:1},incident),false);
  assert.equal(matchesIncident({...incident,tenant_id:'OTHER'},incident),false);
  assert.equal(matchesIncident({...incident},incident),true);
  assert.equal(matchesIncident({device_id:'D-1',alarm_code:'700010'},incident),false);
  assert.equal(matchesIncident({device_id:'D-1',alarm_code:'700010'},{device_id:'D-1',alarm_code:'700010'}),true);
});

test('当前事件来自当前设备诊断或触发，不从最后采样的其他设备取报警', () => {
  const snapshot = {device_id:'D-1',latest_result:{current_sample:{device_id:'D-2',alarm_code:'OTHER'}},
    latest_results:{'D-1':{current_sample:{device_id:'D-1',alarm_code:'700010'}}},
    diagnosis:{latest_by_device:{'D-1':{device_id:'D-1',alarm_code:'700010',event_id:'E-NEW',event_revision:2}}}};
  assert.equal(currentIncident(snapshot).event_id,'E-NEW');
  assert.equal(currentIncident(snapshot).alarm_code,'700010');
  assert.equal(currentIncident(snapshot,{device_id:'D-1',alarm_code:'700006'}).event_id,'');
});

test('方案关联工单要求设备与事件一致，不能只匹配方案编号', () => {
  const plan={device_id:'D-1',event_id:'E-1',plan_id:'P-1'};
  assert.equal(linkedPlanOrder(plan,{...plan,workorder_id:'W-1'}),true);
  assert.equal(linkedPlanOrder(plan,{...plan,device_id:'D-2'}),false);
  assert.equal(linkedPlanOrder(plan,{...plan,event_id:'E-2'}),false);
});

test('方案时间不使用工单创建或更新时刻，无方案时刻的历史记录保留未知', () => {
  const plan={plan_id:'P',created_at:'2026-10-07T13:02:00Z',diagnosis:{raw:{created_at:'2026-10-07T21:01:00+08:00',event_timestamp:'2026-10-07T13:00:00'}}};
  const [record]=buildMaintenanceWorkspaceRecords({orders:[{device_id:'D',event_id:'E',created_at:'2026-10-07T13:03:00Z',updated_at:'2026-10-07T15:00:00Z',maintenance_plan_snapshot:plan}]});
  assert.equal(record.created_at,plan.created_at);
  assert.equal(recordTimes(record).event,'2026-10-07T13:00:00Z');
  assert.equal(recordTimes(record).plan,plan.created_at);
  assert.equal(recordTimes({maintenance_plan_snapshot:{},created_at:'2026-10-07T13:03:00Z'}).plan,'');
  assert.equal(formatRecordTime('2026-10-07T13:00:00'),'2026/10/07 21:00:00');
  assert.equal(formatRecordTime('2026-10-07T21:00:00+08:00'),'2026/10/07 21:00:00');
});

test('稀疏接口副本不擦掉方案事件，同编号但不同事件的方案不能合并', () => {
  const records=buildMaintenanceWorkspaceRecords({snapshot:{diagnosis:{pipeline:{event:{device_id:'D',event_id:'E-1'},maintenance_plan:{plan_id:'P'}}}},items:[{device_id:'D',plan_id:'P'},{device_id:'D',plan_id:'P',event_id:'E-2'}]});
  assert.equal(records.length,2);
  assert.deepEqual(records.map(x=>x.event_id).sort(),['E-1','E-2']);
});

test('历史正文的已知报警UTC时间显示北京时间，其他无依据的正文时刻不改写', () => {
  const original='设备于 2026-10-07 08:09:44 报警；复测 2026-10-07 18:50:59。';
  const record={diagnosis_snapshot:{raw:{triggered_at:'2026-10-07T08:09:44.107'}}};
  assert.equal(localizeIncidentText(original,record),'设备于 2026-10-07 16:09:44（北京时间） 报警；复测 2026-10-07 18:50:59。');
  assert.equal(localizeIncidentText(original,{}),original);
});
