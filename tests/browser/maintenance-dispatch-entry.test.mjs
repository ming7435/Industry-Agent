import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond, deferred} from './helpers/center-fixture.mjs';

const actor={user_id:'U-TECH',username:'维修人员甲',role:'technician'};
const sample={device_id:'M1',alarm_code:'700006',status:'alarm'};
const plan={plan_id:'PLAN-1',event_id:'EVENT-1',device_id:'M1',alarm_code:'700006',plan_kind:'repair',
  diagnosis:{device_id:'M1',fault:'刀塔旋转超时'},repair_steps:['检查刀塔'],workorder_ready:true};
const assigned={workorder_id:'WO-LINKED',plan_id:plan.plan_id,device_id:'M1',event_id:plan.event_id,
  alarm_code:'700006',title:'刀塔维修',status:'in_progress',assignee:actor.user_id,assignee_name:actor.username,
  maintenance_plan_snapshot:plan};
let fixture;
before(async()=>{fixture=await centerFixture({actor,sample,snapshot:{devices:[]}});});
after(async()=>{await fixture?.close();});

async function pageFor({plans=[plan],orders=[assigned],ordersHandler,retryHandler,url='?view=maintenance'}={}){
  const context=await fixture.browser.newContext(),page=await context.newPage();
  page.setDefaultTimeout(3000);
  const posts=[],unexpected=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/drawings/**',route=>route.abort());
  await page.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()==='POST'&&path==='/api/maintenance/plans/PLAN-1/retry'){
      posts.push(request.postDataJSON());
      return retryHandler?.(route)??respond(route,{status:'already_dispatched',workorder:assigned});
    }
    if(request.method()!=='GET'){unexpected.push(path);return route.abort();}
    if(path==='/api/maintenance/plans')return respond(route,{items:plans,history:{status:'ready'},deleted_plan_ids:[]});
    if(path==='/api/workorders')return ordersHandler?.(route)??respond(route,{items:orders});
    return respond(route,{});
  });
  await page.goto(fixture.base+'/'+url);
  await page.locator(url.includes('view=maintenance')?'.maintenance-plan-list-row':'.workorder-titlebar').waitFor();
  return {context,page,posts,unexpected,errors};
}

test('已派方案显示负责人及可用的原工单入口，不显示无法使用的重复派工按钮',async()=>{
  const {context,page,posts,unexpected,errors}=await pageFor();
  try{
    const entry=page.getByRole('region',{name:'方案工单处理',exact:true});
    await entry.waitFor();
    assert.ok((await entry.innerText()).includes(assigned.workorder_id));
    assert.ok((await entry.innerText()).includes(actor.username));
    assert.equal(await page.getByRole('button',{name:'重新校验并自动派工',exact:true}).count(),0);
    const button=entry.getByRole('button',{name:'进入工单处理',exact:true});
    assert.equal(await button.isEnabled(),true);
    await button.click();
    const url=new URL(page.url());
    assert.equal(url.searchParams.get('view'),'workorder');
    assert.equal(url.searchParams.get('workorder_id'),assigned.workorder_id);
    assert.deepEqual(posts,[]);assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('已有未分配open工单允许重新校验续派，仅提交稳定命令编号',async()=>{
  const unassigned={...assigned,status:'open',assignee:'',assignee_name:''};
  const {context,page,posts,unexpected,errors}=await pageFor({orders:[unassigned]});
  try{
    const button=page.getByRole('button',{name:'重新校验并自动派工',exact:true});
    assert.equal(await button.isEnabled(),true);
    await button.click();
    await page.getByRole('status').filter({hasText:assigned.workorder_id}).first().waitFor();
    assert.equal(posts.length,1);assert.deepEqual(Object.keys(posts[0]),['request_id']);
    assert.match(posts[0].request_id,/^[\da-f-]{36}$/i);
    assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('历史方案缺故障事件时说明原因，不留下没有解释的灰色派工按钮',async()=>{
  const {context,page,posts}=await pageFor({plans:[{...plan,event_id:''}],orders:[]});
  try{
    await page.getByText('此历史方案缺少故障事件，请到监控中心重新诊断当前设备。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'重新校验并自动派工',exact:true}).count(),0);
    assert.deepEqual(posts,[]);
  }finally{await context.close();}
});

test('关联工单尚未读出时等待核对，不能提前允许重复派工',async()=>{
  const wait=deferred();
  const {context,page,posts}=await pageFor({ordersHandler:async route=>{await wait.promise;return respond(route,{items:[assigned]});}});
  try{
    await page.getByText('正在核对关联工单，请稍候…',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'重新校验并自动派工',exact:true}).count(),0);
    wait.resolve();
    await page.getByRole('button',{name:'进入工单处理',exact:true}).waitFor();
    assert.deepEqual(posts,[]);
  }finally{wait.resolve();await context.close();}
});

test('从所选方案进入时打开指定可见工单，不被当前设备报警选中另一工单',async()=>{
  const historical={...assigned,workorder_id:'WO-HISTORICAL',device_id:'M2',alarm_code:'OLD',title:'历史维修'};
  const {context,page,posts,unexpected}=await pageFor({orders:[assigned,historical],url:'?view=workorder&workorder_id=WO-HISTORICAL'});
  try{
    assert.ok((await page.locator('.workorder-titlebar').innerText()).includes(historical.workorder_id));
    assert.deepEqual(posts,[]);assert.deepEqual(unexpected,[]);
  }finally{await context.close();}
});

test('已有派发记录但当前账号不可见时说明负责人，不允许重复派工',async()=>{
  const {context,page,posts,unexpected}=await pageFor({plans:[{...plan,dispatch:{status:'dispatched',
    workorder_id:'WO-OTHER',assignee:'U-OTHER',assignee_name:'维修人员乙'}}],orders:[]});
  try{
    const entry=page.getByRole('region',{name:'方案工单处理',exact:true});
    await entry.getByText(/当前账号未读取到此工单/).waitFor();
    assert.ok((await entry.innerText()).includes('WO-OTHER'));
    assert.ok((await entry.innerText()).includes('维修人员乙'));
    assert.equal(await entry.getByRole('button',{name:'进入工单处理',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'重新校验并自动派工',exact:true}).count(),0);
    assert.deepEqual(posts,[]);assert.deepEqual(unexpected,[]);
  }finally{await context.close();}
});

test('工单读取失败时提示重试，不把读取失败当成没有派单',async()=>{
  let recovered=false;
  const {context,page,posts}=await pageFor({ordersHandler:route=>respond(route,
    recovered?{items:[assigned]}:{detail:'关联工单服务暂不可用'},recovered?200:503)});
  try{
    const entry=page.getByRole('region',{name:'方案工单处理',exact:true});
    await entry.getByText('关联工单读取失败，请重试读取后再派工。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'重新校验并自动派工',exact:true}).count(),0);
    recovered=true;await entry.getByRole('button',{name:'重试读取工单',exact:true}).click();
    await entry.getByRole('button',{name:'进入工单处理',exact:true}).waitFor();
    assert.deepEqual(posts,[]);
  }finally{await context.close();}
});
