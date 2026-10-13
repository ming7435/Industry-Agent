import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond} from './helpers/center-fixture.mjs';

const failed={recovery_id:'REC-original',task_id:'TASK-original',trace_id:'TRACE-original',kind:'runtime',
  status:'failed',failed_agent:'maintenance',failed_step:'assess_diagnosis',error:'domain_validation_failed',attempts:1,can_resume:true,
  completed_steps:[{agent:'diagnosis'},{agent:'knowledge'}]};

for(const [name,item,refresh] of [
  ['旧响应允许续跑时仍只保留失败记录',{...failed},false],
  ['刷新失败记录不重新执行任务',{...failed},true],
  ['生产操作结果未知时只显示待核对记录',{...failed,kind:'production',failed_agent:'cad',failed_step:'virtual_start',status:'outcome_unknown',requires_reconcile:true},true],
])test(name,async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage(),writes=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()!=='GET'){writes.push(path);return route.abort('failed');}
    if(path==='/api/team/me')return respond(route,{user:{user_id:'owner',username:'失败记录验证',role:'technician'}});
    if(path==='/api/runtime/recovery')return respond(route,{items:[item]});
    return respond(route,{runs:[],trace:[],items:[],devices:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    const panel=page.getByRole('region',{name:'失败任务记录'});
    await panel.locator('.task-recovery-item').waitFor();
    assert.match(await panel.innerText(),/TASK-original/);
    assert.match(await panel.innerText(),/已完成：诊断、知识检索/);
    assert.equal(await panel.getByRole('button',{name:/继续|恢复|执行/}).count(),0);
    if(refresh){
      const refreshed=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/runtime/recovery');
      await panel.getByRole('button',{name:'刷新失败记录',exact:true}).click();await refreshed;
    }
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('退出登录立即清除缓存的失败任务记录',async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();let loggedIn=true;
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/team/me')return respond(route,loggedIn?{user:{user_id:'owner',username:'恢复验证',role:'technician'}}:{},loggedIn?200:401);
    if(path==='/api/team/logout'){loggedIn=false;return respond(route,{success:true});}
    if(path==='/api/runtime/recovery')return respond(route,{items:loggedIn?[failed]:[]},loggedIn?200:401);
    return respond(route,{runs:[],trace:[],items:[],devices:[],runner:{}});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');await page.locator('.task-recovery-item').waitFor();
    await page.locator('.team-access > summary').click();await page.getByRole('button',{name:'退出登录',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.task-recovery-item'),null,{timeout:1000});
  }finally{await fixture.close();}
});
