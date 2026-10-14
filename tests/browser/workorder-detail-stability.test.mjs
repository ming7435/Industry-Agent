import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,deferred,respond} from './helpers/center-fixture.mjs';

const actor={user_id:'U-A',username:'维修员甲',role:'technician'};
const order={workorder_id:'WO-STABLE',device_id:'D-MOCK',assignee:'U-A',status:'completed',
  alarm_code:'700009',event_id:'EVT-OLD',_revision:1,updated_at:'order-v1',title:'历史维修任务',
  steps:['保留实际维修内容'],maintenance_plan_snapshot:{plan_id:'PLAN-OLD'}};
const frame=page=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
// 与 Backend 的真实队列投影一致，不把验收和控制结果塞进摘要夹具。
const summary=value=>Object.fromEntries(Object.entries({...value,_summary_record:true})
  .filter(([key])=>['workorder_id','device_id','assignee','status','alarm_code','event_id','_revision','updated_at','title','_summary_record'].includes(key)));

for(const fullApp of [false,true])test((fullApp?'含预读的完整应用':'工单页面')+'在产线时间持续更新时只读取一次慢详情',async()=>{
  const fixture=await centerFixture({actor,fullApp}),page=await fixture.browser.newPage();
  const release=deferred(),started=deferred(),details=[],writes=[],errors=[];let lineReads=0;
  await page.clock.install();
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/team/me')return respond(route,{user:actor});
    if(path==='/api/team/line')return respond(route,{state:'stopped',generation:1,updated_at:++lineReads});
    if(path==='/api/workorders')return respond(route,{items:[summary(order)]});
    if(path==='/api/workorders/WO-STABLE'){
      details.push(path);started.resolve();await release.promise;return respond(route,{workorder:order});
    }
    return respond(route,{items:[],runs:[],devices:[],runner:{}});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');
    await page.getByRole('button',{name:/WO-STABLE/}).waitFor();await started.promise;
    for(let i=0;i<5;i++){await page.clock.runFor(1000);await frame(page);}
    assert.ok(lineReads>=3,'需要实际跨过多轮产线状态读取');
    assert.equal(details.length,1,'产线时间不能不断取消并重新发起详情读取');
    release.resolve();await page.locator('.workorder-titlebar').waitFor({timeout:2000});
    for(let i=0;i<3;i++){await page.clock.runFor(1000);await frame(page);}
    assert.equal(details.length,1,'已读取内容不得随产线观察时间重新加载');
    assert.match(await page.locator('.workorder-detail-page').innerText(),/保留实际维修内容/);
    assert.equal(await page.getByRole('status').filter({hasText:'正在加载任务详情'}).count(),0);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {release.resolve();await fixture.close();}
});

test('真实工单修订变化才更新正文，旧修订晚返回不能覆盖新正文',async()=>{
  const fixture=await centerFixture({actor}),page=await fixture.browser.newPage();
  const release=deferred(),started=deferred(),details=[],writes=[];let revision=1;
  await page.clock.install();
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    const value={...order,_revision:revision,updated_at:'order-v'+revision,steps:[revision===1?'旧修订内容':'新修订内容']};
    if(path==='/api/workorders')return respond(route,{items:[{...value,_summary_record:true}]});
    if(path==='/api/workorders/WO-STABLE'){
      details.push(revision);
      if(revision===1){started.resolve();await release.promise;}
      return respond(route,{workorder:value});
    }
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');await started.promise;
    revision=2;await page.clock.runFor(1200);await frame(page);
    await page.locator('.workorder-detail-page').getByText('新修订内容',{exact:true}).waitFor({timeout:2000});
    release.resolve();await frame(page);
    assert.doesNotMatch(await page.locator('.workorder-detail-page').innerText(),/旧修订内容/);
    assert.deepEqual(details,[1,2]);assert.deepEqual(writes,[]);
  } finally {release.resolve();await fixture.close();}
});

test('任务详情归属其他设备时不展示错误设备的维修内容',async()=>{
  const fixture=await centerFixture({actor}),page=await fixture.browser.newPage(),writes=[];
  await page.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/workorders')return respond(route,{items:[{...order,_summary_record:true}]});
    if(path==='/api/workorders/WO-STABLE')return respond(route,{workorder:{...order,device_id:'OTHER-DEVICE',steps:['其他设备机密内容']}});
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');
    await page.getByRole('button',{name:/WO-STABLE/}).waitFor();
    await page.getByRole('status').filter({hasText:'任务详情暂不可用'}).waitFor({timeout:2000});
    assert.doesNotMatch(await page.locator('.workorder-page').innerText(),/其他设备机密内容/);
    assert.equal(await page.locator('.workorder-titlebar').count(),0);
    assert.deepEqual(writes,[]);
  } finally {await fixture.close();}
});

for(const starting of ['stopped','running'])test(`真实摘要不含复机结果时，${starting}状态变化在后台更新权威结果且保留正文`,async()=>{
  const fixture=await centerFixture({actor}),page=await fixture.browser.newPage();
  const hold=deferred(),details=[],writes=[];let state=starting,generation=1,lineReads=0;
  const result=()=>({...order,repair_verification:{phase:'poststart',passed:true},
    machine_control:state==='running'?{state:'running',source:'persisted_line_restart',generation,cycle_id:'CYCLE-'+generation}
      :{state:'blocked',reason:'还有未确认完成的故障工单'}});
  await page.clock.install();
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/team/line')return respond(route,{state,generation,updated_at:++lineReads});
    if(path==='/api/workorders')return respond(route,{summary:true,items:[summary(order)]});
    if(path==='/api/workorders/WO-STABLE'){
      const value=result();details.push(state);
      if(details.length===2)await hold.promise;
      return respond(route,{workorder:value});
    }
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');await page.locator('.workorder-titlebar').waitFor();
    await page.locator(`.machine-control-result.${starting==='running'?'is-ok':'is-error'}`).waitFor();
    const refreshRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/workorders/WO-STABLE',{timeout:2500});
    state=starting==='running'?'stopped':'running';generation++;
    await page.clock.runFor(1200);await refreshRead;
    for(let i=0;i<4;i++){await page.clock.runFor(1000);await frame(page);}
    assert.equal(details.length,2,'真实产线状态只触发一次后台核对，观察时间不取消核对');
    assert.ok(await page.locator('.workorder-titlebar').isVisible(),'核对复机状态时不得清空已读正文');
    assert.match(await page.locator('.workorder-detail-page').innerText(),/保留实际维修内容/);
    assert.equal(await page.getByRole('status').filter({hasText:'正在加载任务详情'}).count(),0);
    hold.resolve();
    await page.locator(`.machine-control-result.${state==='running'?'is-ok':'is-error'}`).waitFor({timeout:2000});
    await page.clock.runFor(2200);await frame(page);
    assert.equal(details.length,2);assert.deepEqual(writes,[]);
  } finally {hold.resolve();await fixture.close();}
});

test('正文和后台核对期间的新产线状态不打断慢读取，旧复机成功结果不能覆盖最新故障',async()=>{
  const fixture=await centerFixture({actor}),page=await fixture.browser.newPage();
  const holds=[deferred(),deferred()],details=[],writes=[];let state='stopped',generation=1;
  await page.clock.install();
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/team/line')return respond(route,{state,generation});
    if(path==='/api/workorders')return respond(route,{summary:true,items:[summary(order)]});
    if(path==='/api/workorders/WO-STABLE'){
      const control=state==='running'?{state:'running',source:'persisted_line_restart',generation}
        :{state:'blocked',reason:'最新故障尚未确认'};
      const index=details.length;details.push(generation);
      if(holds[index])await holds[index].promise;
      return respond(route,{workorder:{...order,repair_verification:{phase:'poststart',passed:true},machine_control:control}});
    }
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');
    await page.getByRole('button',{name:/WO-STABLE/}).waitFor();
    await page.clock.runFor(1200);await frame(page);
    for(let i=0;i<3;i++){generation++;await page.clock.runFor(1200);await frame(page);}
    assert.equal(details.length,1,'产线变化不得打断尚未返回的正文');
    const refreshRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/workorders/WO-STABLE',{timeout:2500});
    state='running';generation++;await page.clock.runFor(1200);await frame(page);
    holds[0].resolve();await refreshRead;
    await page.locator('.workorder-titlebar').waitFor();
    state='stopped';generation++;await page.clock.runFor(1200);await frame(page);
    assert.equal(details.length,2,'后台核对也不因新状态中断并重发');
    const finalRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/workorders/WO-STABLE',{timeout:2500});
    holds[1].resolve();await finalRead;
    await page.locator('.machine-control-result').getByText(/最新故障尚未确认/).waitFor();
    assert.equal(await page.locator('.machine-control-result.is-ok').count(),0);
    assert.equal(details.length,3);assert.deepEqual(writes,[]);
  } finally {holds.forEach(hold=>hold.resolve());await fixture.close();}
});

test('后台复机核对暂时失败时保留正文并说明原因，只读重试后更新结果',async()=>{
  const fixture=await centerFixture({actor}),page=await fixture.browser.newPage(),writes=[];
  let state='stopped',reads=0;
  await page.clock.install();
  await page.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/team/line')return respond(route,{state,generation:state==='running'?2:1});
    if(path==='/api/workorders')return respond(route,{summary:true,items:[summary(order)]});
    if(path==='/api/workorders/WO-STABLE'){
      if(++reads===2)return respond(route,{detail:'控制结果读取暂不可用'},503);
      return respond(route,{workorder:{...order,machine_control:state==='running'?{state:'running',source:'persisted_line_restart'}
        :{state:'blocked',reason:'故障未确认'}}});
    }
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');await page.locator('.workorder-titlebar').waitFor();
    state='running';await page.clock.runFor(1200);await frame(page);
    await page.getByRole('status').filter({hasText:'复机结果暂未更新'}).waitFor();
    assert.match(await page.locator('.workorder-detail-page').innerText(),/保留实际维修内容/);
    assert.equal(reads,2);
    await page.clock.runFor(3200);await frame(page);
    await page.locator('.machine-control-result.is-ok').waitFor();
    assert.equal(reads,3);assert.deepEqual(writes,[]);
  } finally {await fixture.close();}
});

for(const initial of [true,false])test(`${initial?'首次详情':'后台复机核对'}被无关方案变更中断后自动只读重读`,async()=>{
  const fixture=await centerFixture({actor,exposeMaintenanceChanges:true}),page=await fixture.browser.newPage();
  const hold=deferred(),writes=[];let state='stopped',reads=0;
  await page.clock.install();
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/team/line')return respond(route,{state,generation:state==='running'?2:1});
    if(path==='/api/workorders')return respond(route,{summary:true,items:[summary(order)]});
    if(path==='/api/workorders/WO-STABLE'){
      const currentRead=++reads;
      if(currentRead===(initial?1:2))await hold.promise;
      return respond(route,{workorder:{...order,machine_control:state==='running'?{state:'running',source:'persisted_line_restart'}
        :{state:'blocked',reason:'故障未确认'}}});
    }
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?view=workorder');
    await page.getByRole('button',{name:/WO-STABLE/}).waitFor();
    if(!initial){
      await page.locator('.workorder-titlebar').waitFor();
      const refreshRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/workorders/WO-STABLE',{timeout:2500});
      state='running';await page.clock.runFor(1200);await refreshRead;await frame(page);
    }else await page.clock.runFor(1200);
    assert.equal(reads,initial?1:2);
    await page.evaluate(actor=>window.publishMaintenanceChange(actor,{deleted_plan_ids:['UNRELATED-PLAN']}),actor);
    hold.resolve();await frame(page);
    await page.clock.runFor(3200);await frame(page);
    await page.locator(initial?'.workorder-titlebar':'.machine-control-result.is-ok').waitFor({timeout:2000});
    assert.equal(reads,initial?2:3,'仅共享缓存取消时，页面仍应安全重读一次');
    assert.deepEqual(writes,[]);
  } finally {hold.resolve();await fixture.close();}
});
