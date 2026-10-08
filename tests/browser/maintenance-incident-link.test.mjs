import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {centerFixture,respond} from './helpers/center-fixture.mjs';
const actor={user_id:'U',role:'technician'};
const sample={device_id:'D',alarm_code:'700010',status:'alarm'};
const diagnosis={...sample,event_id:'E-NEW',event_revision:2,status:'completed',fault:'当前液压故障',created_at:'2026-10-07T21:01:00+08:00',workflow_status:'running'};
const snapshot={device_id:'D',devices:[{device_id:'D',name:'正确设备型号 MODEL-A'}],diagnosis:{latest:diagnosis,latest_by_device:{D:diagnosis}}};
const current={...sample,plan_id:'P-NEW',event_id:'E-NEW',event_revision:2,device_name:'正确设备型号 MODEL-A',
  event_timestamp:'2026-10-07T13:00:00',created_at:'2026-10-07T13:02:00Z',diagnosis_created_at:diagnosis.created_at,
  diagnosis,repair_steps:['处理当前液压故障'],workorder_ready:false,validation_findings:['缺少真实备件依据']};
const old={...current,plan_id:'P-OLD',event_id:'E-OLD',event_revision:1,created_at:'2026-10-07T13:04:00Z',diagnosis:{...diagnosis,event_id:'E-OLD',fault:'上次液压故障'}};
const order={...sample,workorder_id:'W-OLD',plan_id:old.plan_id,event_id:'E-OLD',status:'in_progress',assignee:'U',
  title:'上次液压故障',created_at:'2026-10-07T12:03:00Z',updated_at:'2026-10-07T13:05:00Z',maintenance_plan_snapshot:old,diagnosis_snapshot:old.diagnosis};
let fixture,appFixture;
before(async()=>{
  fixture=await centerFixture({actor,sample,snapshot});
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const {build}=await import(pathToFileURL(resolve(root,'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  // 编译真实 App 到内存，保留登录读取、导航、轮询和默认工单选择，不修改生产构建。
  const compiled=await build({stdin:{resolveDir:resolve(root,'frontend/monitor-react/src/app'),
    contents:"import React from 'react';import{createRoot}from'react-dom/client';import{App}from'./App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));"},
    bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty','.png':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}});
  const server=createServer((request,response)=>{
    response.writeHead(200,{'Content-Type':request.url==='/app.js'?'application/javascript':'text/html;charset=utf-8'});
    response.end(request.url==='/app.js'?compiled.outputFiles[0].text:'<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  appFixture={base:`http://127.0.0.1:${server.address().port}`,close:async()=>{server.closeAllConnections();await new Promise(done=>server.close(done));}};
});
after(async()=>{await fixture?.close();await appFixture?.close();});
async function pageFor({plans=[old,current],orders=[],url='?view=maintenance'}={}){
  const context=await fixture.browser.newContext(),page=await context.newPage(),writes=[];
  page.setDefaultTimeout(3000);
  await page.route('**/drawings/**',route=>route.abort());
  await page.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/maintenance/plans')return respond(route,{items:plans,history:{status:'ready'},deleted_plan_ids:[]});
    if(path==='/api/workorders')return respond(route,{items:orders});
    return respond(route,{});
  });
  await page.goto(fixture.base+'/'+url);
  await page.locator('.workorder-queue').waitFor();
  return {context,page,writes};
}
test('当前方案按本次事件选择，历史更新较晚的同报警方案不会抢占',async()=>{
  const {context,page,writes}=await pageFor();
  try{
    const selected=page.locator('.maintenance-plan-list-row.is-selected');
    await selected.waitFor();assert.ok((await selected.innerText()).includes('P-NEW'));
    const timeline=page.getByRole('region',{name:'故障与处理时间'});
    await timeline.waitFor();const text=await timeline.innerText();
    assert.ok(text.includes('报警发生：2026/10/07 21:00:00'));
    assert.ok(text.includes('方案生成：2026/10/07 21:02:00'));
    assert.ok((await selected.innerText()).includes('MODEL-A'));
    assert.deepEqual(writes,[]);
  }finally{await context.close();}
});
test('诊断已完成但后续仍在处理时显示方案生成进度，旧同报警方案标为历史',async()=>{
  const {context,page,writes}=await pageFor({plans:[old]});
  try{
    await page.getByText(/诊断已完成，维修方案正在生成或校验/).waitFor();
    await page.getByText(/历史 \/ 其他设备方案.*E-OLD/).waitFor();
    assert.deepEqual(writes,[]);
  }finally{await context.close();}
});
test('后续仍在运行时已生成方案直接显示，不能再次提交重复派工',async()=>{
  const {context,page,writes}=await pageFor({plans:[{...current,status:'running',dispatch:{allowed:false,status:'running'}}]});
  try{
    await page.getByText('方案已生成，系统正在完成后续校验与派发，无需重复提交。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'重新校验并自动派工',exact:true}).count(),0);
    assert.ok((await page.locator('.maintenance-plan-list-row.is-selected').innerText()).includes('P-NEW'));
    assert.deepEqual(writes,[]);
  }finally{await context.close();}
});
test('工单列表不能自动选上一次同报警工单，可主动选择历史记录',async()=>{
  const {context,page,writes}=await pageFor({orders:[order],url:'?view=workorder'});
  try{
    await page.getByText(/当前账号尚无报警 700010/).waitFor();
    assert.equal(await page.locator('.workorder-titlebar').count(),0);
    await page.locator('.workorder-queue-item').click();
    const title=page.locator('.workorder-titlebar');await title.waitFor();
    assert.ok((await title.innerText()).includes('上次液压故障'));
    assert.ok(!(await title.innerText()).includes('当前液压故障'));
    assert.ok((await page.getByRole('region',{name:'故障与处理时间'}).innerText()).includes('工单创建：2026/10/07 20:03:00'));
    assert.deepEqual(writes,[]);
  }finally{await context.close();}
});

test('真实App将旧触发修订1与新方案工单修订3关联，自动显示本人新工单且无错误空单提示',async()=>{
  const context=await fixture.browser.newContext(),page=await context.newPage();
  page.setDefaultTimeout(5000);
  await page.clock.install();
  const user={...actor,username:'隔离维修人员',primary_device_id:sample.device_id,responsible_device_ids:[sample.device_id]};
  const event={...sample,event_id:'E-REGENERATED',event_revision:1,tenant_id:'T',project_id:'P'};
  const latestDiagnosis={...diagnosis,...event,status:'completed',workflow_status:'',fault:'原液压故障诊断'};
  const regeneratedDiagnosis={device_id:sample.device_id,fault:'液压压力未达到',raw:{...event,event_revision:3,confidence:.95}};
  const regeneratedPlan={...current,...event,plan_id:'P-REGENERATED-R3',event_revision:3,
    created_at:'2026-10-08T02:00:00Z',diagnosis:regeneratedDiagnosis,workorder_ready:true,validation_findings:[],
    dispatch:{allowed:true,status:'dispatched',workorder_id:'W-REGENERATED-R3',assignee:user.user_id,assignee_name:user.username}};
  // 与真实Backend相同：顶层不提供revision且alarm_code为空，身份从保存的诊断raw读取。
  const authorizedOrder={device_id:sample.device_id,event_id:event.event_id,alarm_code:'',
    workorder_id:'W-REGENERATED-R3',plan_id:regeneratedPlan.plan_id,title:'液压故障重新校验任务',
    status:'in_progress',assignee:user.user_id,assignee_name:user.username,created_at:'2026-10-08T02:01:00Z',
    diagnosis_snapshot:regeneratedDiagnosis,maintenance_plan_snapshot:regeneratedPlan};
  const staleSnapshot={device_id:sample.device_id,devices:[{device_id:sample.device_id,name:'隔离设备',current_sample:sample}],
    latest_results:{[sample.device_id]:{current_sample:sample}},trigger_history:[{abnormal_event:event}],
    diagnosis:{latest:latestDiagnosis,latest_by_device:{[sample.device_id]:latestDiagnosis},
      pipeline_by_device:{[sample.device_id]:{event,diagnosis:latestDiagnosis,status:'blocked'}}}};
  const originalSnapshot=structuredClone(staleSnapshot),writes=[],errors=[],reads=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===appFixture.base?route.continue():route.abort());
  await page.route('**/drawings/**',route=>route.abort());
  await page.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    reads.push(path);
    if(path==='/api/team/me')return respond(route,{user});
    if(path==='/api/team/devices')return respond(route,{items:staleSnapshot.devices});
    if(path==='/api/team/line')return respond(route,{state:'stopped'});
    if(path==='/api/monitor/snapshot')return respond(route,staleSnapshot);
    if(path==='/api/maintenance/plans')return respond(route,{items:[regeneratedPlan],history:{status:'ready'},deleted_plan_ids:[]});
    if(path==='/api/workorders')return respond(route,{items:[{workorder:authorizedOrder}]});
    return respond(route,{items:[]});
  });
  const navigate=name=>page.getByRole('navigation',{name:'功能导航'}).getByRole('button',{name,exact:true}).click();
  try{
    await page.goto(appFixture.base+'/?view=maintenance');
    await page.getByRole('heading',{name:'已派发工单',exact:true}).waitFor();
    await page.getByText(/当前设备方案.*E-REGENERATED.*已关联工单 W-REGENERATED-R3/).waitFor();
    assert.ok((await page.locator('.maintenance-plan-list-row.is-selected').innerText()).includes(regeneratedPlan.plan_id));
    assert.equal(await page.getByText(/尚无本次故障对应的维修方案/).count(),0);

    // 从导航进入，不带workorder_id，验证默认选择而非显式链接选中。
    await navigate('工单系统');
    await page.locator('.workorder-titlebar').waitFor();
    assert.equal(new URL(page.url()).searchParams.has('workorder_id'),false);
    assert.ok((await page.locator('.workorder-titlebar').innerText()).includes(authorizedOrder.workorder_id));
    assert.ok((await page.locator('.workorder-titlebar').innerText()).includes(user.username));
    assert.ok((await page.getByRole('button',{name:/W-REGENERATED-R3/}).getAttribute('class')).includes('is-selected'));
    assert.equal(await page.getByText(/当前账号尚无报警 700010 对应的可见工单/).count(),0);
    assert.equal(await page.getByRole('heading',{name:'当前没有待处理工单',exact:true}).count(),0);

    await page.clock.runFor(5100);
    await page.locator('.workorder-titlebar').waitFor();
    assert.equal(await page.getByText(/当前账号尚无报警 700010 对应的可见工单/).count(),0);
    await navigate('维修方案');
    await page.getByText(/当前设备方案.*E-REGENERATED.*已关联工单 W-REGENERATED-R3/).waitFor();
    assert.deepEqual(staleSnapshot,originalSnapshot);
    assert.ok(reads.includes('/api/team/me')&&reads.includes('/api/monitor/snapshot'));
    assert.deepEqual(writes,[]);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
