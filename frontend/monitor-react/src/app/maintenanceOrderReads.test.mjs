import test from 'node:test';
import assert from 'node:assert/strict';
import {loadMaintenanceOrders} from './maintenanceWorkspace.mjs';
import {setTeamSessionActor} from '../teamSession.mjs';

test('维修方案首次保留完整工单，后续只读小目录并按变更工单更新正文',async()=>{
  const actor={user_id:'U-MAINT-READ',role:'technician'};
  setTeamSessionActor(actor,{force:true});
  const reads=[];
  let revision=1;
  const order=()=>({workorder_id:'WO-READ',assignee:actor.user_id,device_id:'D-READ',_revision:revision,updated_at:`v${revision}`,plan_id:'PLAN-READ',status:'in_progress',maintenance_plan_snapshot:{plan_id:'PLAN-READ',repair_steps:[`现场步骤${revision}`]}});
  const request=async path=>{
    reads.push(path);
    if(path==='/api/workorders?summary=true'){
      const {maintenance_plan_snapshot,...item}=order();
      return {summary:true,items:[{...item,_summary_record:true}]};
    }
    if(path==='/api/workorders')return {items:[order()]};
    if(path==='/api/workorders/WO-READ')return {workorder:order()};
    throw new Error(path);
  };
  const first=await loadMaintenanceOrders(request,actor);
  assert.deepEqual(first[0].maintenance_plan_snapshot.repair_steps,['现场步骤1']);
  await loadMaintenanceOrders(request,actor);
  revision=2;
  const changed=await loadMaintenanceOrders(request,actor);
  assert.deepEqual(changed[0].maintenance_plan_snapshot.repair_steps,['现场步骤2']);
  assert.deepEqual(reads,['/api/workorders?summary=true','/api/workorders','/api/workorders?summary=true','/api/workorders?summary=true','/api/workorders/WO-READ']);
});
