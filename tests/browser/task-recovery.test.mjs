import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, deferred, respond} from './helpers/center-fixture.mjs';

const failed={recovery_id:'REC-original',task_id:'TASK-original',trace_id:'TRACE-original',kind:'runtime',
  status:'failed',failed_agent:'cad',failed_step:'drawing_search',error:'连接中断',attempts:0,can_resume:true,
  completed_steps:[{agent:'diagnosis'},{agent:'knowledge'}]};

test('日志系统从原失败步骤恢复，双击只发送一次，恢复后刷新原运行',async()=>{
  const fixture=await centerFixture(),page=await fixture.browser.newPage(),entered=deferred(),release=deferred();
  let item={...failed},posts=[],runReads=0;const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/api/runtime/recovery')return respond(route,{items:[item]});
    if(path==='/api/runtime/recovery/REC-original/resume'){
      posts.push(req.postDataJSON());entered.resolve();await release.promise;
      item={...item,status:'completed',can_resume:false,attempts:1};return respond(route,item);
    }
    if(path==='/api/runs'){runReads++;return respond(route,{runs:[]});}
    return respond(route,{trace:[],items:[],devices:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    const panel=page.getByRole('region',{name:'失败任务恢复'}),button=panel.getByRole('button',{name:'从失败步骤继续'});
    await button.waitFor();assert.match(await panel.innerText(),/已完成：诊断、知识检索/);
    const before=runReads;await button.evaluate(el=>{el.click();el.click();});await entered.promise;
    assert.equal(posts.length,1);assert.deepEqual(Object.keys(posts[0]),['request_id']);
    const refreshed=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/runs');
    release.resolve();await panel.getByText('任务已恢复完成，已完成步骤没有重新执行。',{exact:true}).waitFor();
    await refreshed;
    assert.ok(runReads>before);assert.equal(await panel.getByRole('button',{name:'已完成',exact:true}).isDisabled(),true);
    assert.deepEqual(errors,[]);
  }finally{release.resolve();await fixture.close();}
});

test('恢复响应丢失后核对原任务回执，不再次执行',async()=>{
  const fixture=await centerFixture(),page=await fixture.browser.newPage();let item={...failed},posts=0;
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/api/runtime/recovery')return respond(route,{items:[item]});
    if(req.method()==='POST'){
      posts++;item={...item,status:'completed',can_resume:false,attempts:1};return route.abort('failed');
    }
    return respond(route,{runs:[],trace:[],items:[],devices:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    await page.getByRole('button',{name:'从失败步骤继续'}).click();
    await page.getByText('任务已恢复完成，已完成步骤没有重新执行。',{exact:true}).waitFor();
    assert.equal(posts,1);
  }finally{await fixture.close();}
});

test('结果未知的生产动作只显示原任务核对入口，未核对时保持暂停',async()=>{
  const fixture=await centerFixture(),page=await fixture.browser.newPage();let posts=0;
  const item={...failed,kind:'production',failed_agent:'cad',failed_step:'virtual_start',status:'outcome_unknown',requires_reconcile:true};
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/api/runtime/recovery')return respond(route,{items:[item]});
    if(req.method()==='POST'){posts++;return respond(route,{...item,status:'blocked',attempts:1,error:'原生产动作结果仍未确认'});}
    return respond(route,{runs:[],trace:[],items:[],devices:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');await page.getByRole('button',{name:'核对结果并继续'}).click();
    await page.getByText('恢复暂停：原生产动作结果仍未确认',{exact:true}).waitFor();assert.equal(posts,1);
  }finally{await fixture.close();}
});

test('退出登录立即清除缓存的失败任务恢复记录',async()=>{
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
