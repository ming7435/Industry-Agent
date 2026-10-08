import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
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
let fixture;
before(async()=>{fixture=await centerFixture({actor,sample,snapshot});});
after(async()=>{await fixture?.close();});
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
