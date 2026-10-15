import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond, openLogSections} from './helpers/center-fixture.mjs';

const failed={recovery_id:'REC-original',task_id:'TASK-original',trace_id:'TRACE-original',kind:'runtime',
  status:'failed',failed_agent:'maintenance',failed_step:'assess_diagnosis',error:'domain_validation_failed',attempts:1,can_resume:true,
  completed_steps:[{agent:'diagnosis'},{agent:'knowledge'}]};

for(const [name,item] of [
  ['删除失败任务面板后不读取允许续跑的历史列表',{...failed}],
  ['公开日志仍展示失败原因且不执行业务',{...failed}],
  ['生产结果未知的历史列表也不再单独展示',{...failed,kind:'production',failed_agent:'cad',failed_step:'virtual_start',status:'outcome_unknown',requires_reconcile:true}],
])test(name,async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage(),writes=[],errors=[],reads=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    reads.push(path);
    if(req.method()!=='GET'){writes.push(path);return route.abort('failed');}
    if(path==='/api/team/me')return respond(route,{user:{user_id:'owner',username:'失败记录验证',role:'technician'}});
    if(path==='/api/runtime/recovery')return respond(route,{items:[item]});
    if(path==='/api/runs')return respond(route,{runs:[{run_id:'fault:TRACE-original',run_type:'fault',
      label:'故障处理日志',status:'error',trace_ids:['TRACE-original'],event_count:1,error_count:1} ]});
    if(path==='/api/trace')return respond(route,{trace:[{trace_id:'TRACE-original',task_id:'TASK-original',
      type:'agent',agent:'maintenance',agent_run_id:'AGENT-original',event:'agent_error',name:'maintenance',
      error:'维修方案服务 HTTP 503',timestamp:'2026-10-14T00:00:01Z'}]});
    return respond(route,{runs:[],trace:[],items:[],devices:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    await openLogSections(page);
    await page.locator('.logs-list .log-event').waitFor();
    await page.waitForFunction(()=>document.querySelector('.team-access > summary')?.textContent.includes('失败记录验证'));
    assert.equal(await page.getByRole('region',{name:'失败任务记录'}).count(),0);
    assert.equal(await page.getByRole('button',{name:'刷新失败记录',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'从失败步骤继续',exact:true}).count(),0);
    assert.match(await page.locator('.logs-list').innerText(),/维修方案服务 HTTP 503/);
    assert.deepEqual(reads.filter(path=>path==='/api/runtime/recovery'),[]);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('登录及退出后均不展示或请求失败任务列表',async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage(),reads=[];let loggedIn=true;
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    reads.push(path);
    if(path==='/api/team/me')return respond(route,loggedIn?{user:{user_id:'owner',username:'恢复验证',role:'technician'}}:{},loggedIn?200:401);
    if(path==='/api/team/logout'){loggedIn=false;return respond(route,{success:true});}
    if(path==='/api/runtime/recovery')return respond(route,{items:loggedIn?[failed]:[]},loggedIn?200:401);
    return respond(route,{runs:[],trace:[],items:[],devices:[],runner:{}});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    await page.waitForFunction(()=>document.querySelector('.team-access > summary')?.textContent.includes('恢复验证'));
    assert.equal(await page.getByRole('region',{name:'失败任务记录'}).count(),0);
    await page.locator('.team-access > summary').click();await page.getByRole('button',{name:'退出登录',exact:true}).click();
    await page.getByRole('button',{name:'登录',exact:true}).waitFor();
    assert.equal(await page.getByRole('region',{name:'失败任务记录'}).count(),0);
    assert.deepEqual(reads.filter(path=>path==='/api/runtime/recovery'),[]);
  }finally{await fixture.close();}
});
