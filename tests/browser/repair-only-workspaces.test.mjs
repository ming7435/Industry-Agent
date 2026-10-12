import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond} from './helpers/center-fixture.mjs';

const sample = {device_id:'D-MONITOR',alarm_code:'700044',status:'alarm'};
const diagnosis = {...sample,event_id:'E-MONITOR',status:'completed',confidence:.826,
  evidence_status:'ready',maintenance_required:false,disposition:'monitor_only',summary:'主轴驱动优化中，继续监测'};
const snapshot = {device_id:sample.device_id,diagnosis:{latest:diagnosis,latest_by_device:{[sample.device_id]:diagnosis}}};

for (const view of ['maintenance','workorder']) {
  test(`${view} 对无需维修的诊断说明不生成方案和工单`,async()=>{
    const fixture = await centerFixture({actor:{user_id:'U',role:'technician'},sample,snapshot});
    const page = await fixture.browser.newPage();
    const writes=[];
    try {
      await page.route('**/api/**',route=>{
        const request=route.request(),path=new URL(request.url()).pathname;
        if(request.method()!=='GET') {writes.push(path);return route.abort();}
        if(path==='/api/maintenance/plans')return respond(route,{items:[],history:{status:'ready'},deleted_plan_ids:[]});
        if(path==='/api/workorders')return respond(route,{items:[]});
        return respond(route,{});
      });
      await page.goto(`${fixture.base}/?view=${view}`);
      await page.getByText(/当前报警 700044.*无需维修.*不生成维修方案和工单/).waitFor({timeout:4000});
      assert.deepEqual(writes,[]);
      assert.equal(await page.getByText(/尚无本次故障对应的维修方案|系统正在核对本次方案/).count(),0);
    }finally{await fixture.close();}
  });
}
