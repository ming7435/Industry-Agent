import test from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from './maintenanceWorkspace.mjs';

test('重新校验携带稳定命令编号，不能上传审批和方案内容', async () => {
  const calls=[];
  const request=async (url,options)=>{calls.push({url,...options});return {status:'blocked'};};
  const result=await workspace.retryMaintenancePlan(request,'PLAN-1','COMMAND-1');
  assert.equal(calls[0].url,'/api/maintenance/plans/PLAN-1/retry');
  assert.deepEqual(JSON.parse(calls[0].body),{request_id:'COMMAND-1'});
  assert.equal(result.status,'blocked');
});
