import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWorkorderSheet} from './workorderSheet.mjs';

test('故障任务保留派发事实、任务范围和待核实项，原方案仍保持原样', () => {
  const order={workorder_id:'W1',source:'saved-plan-dispatch',dispatch_mode:'fault_followup',
    steps:['安全停机后记录送料信号'],dispatch_findings:['备件库存缺失'],
    maintenance_plan_snapshot:{plan_id:'P1',repair_steps:['原方案步骤'],required_parts:['TRAK']}};
  const before=structuredClone(order);
  const sheet=buildWorkorderSheet({order});
  assert.equal(sheet.autoDispatched,true);
  assert.equal(sheet.dispatchMode,'fault_followup');
  assert.deepEqual(sheet.taskSteps,order.steps);
  assert.deepEqual(sheet.dispatchFindings,order.dispatch_findings);
  assert.deepEqual(order,before);
});
