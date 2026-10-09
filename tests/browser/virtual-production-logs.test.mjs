import test from 'node:test';import assert from 'node:assert/strict';import {centerFixture,respond} from './helpers/center-fixture.mjs';
test('production logs show only persisted preparation machining and inspection phases',async()=>{
  const fixture=await centerFixture(),page=await fixture.browser.newPage(),writes=[];
  await page.route('**/api/**',route=>{const req=route.request(),path=new URL(req.url()).pathname;if(req.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/runs')return respond(route,{runs:[{run_id:'production_simulation:SIM-JOB-'+ 'a'.repeat(64),run_type:'production_simulation',label:'模拟生产',status:'running',device_id:'TRAK-TC820LTYSI-001',trace_id:'SIM-JOB-'+ 'a'.repeat(64),event_count:3,
      phases:[{id:'preparation',label:'生产准备',status:'completed'},{id:'production',label:'模拟加工',status:'completed'},{id:'quality',label:'模拟检测',status:'pending'}]}]});
    return respond(route,{trace:[],items:[],devices:[]});});
  try{await page.goto(fixture.base+'/?view=logs');await page.locator('.logs-run-card').waitFor();
    assert.match(await page.locator('.logs-run-card').textContent(),/生产准备.*已完成.*模拟加工.*已完成.*模拟检测.*待执行/);
    await page.getByText('生产运行',{exact:true}).waitFor();assert.equal(writes.length,0);
  }finally{await fixture.close();}
});
test('logout immediately removes cached private production rows',async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();page.setDefaultTimeout(5000);let loggedIn=true;
  await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;
    if(path==='/api/team/me')return respond(route,loggedIn?{user:{user_id:'U1',username:'生产验证',role:'technician'}}:{},loggedIn?200:401);
    if(path==='/api/team/logout'){loggedIn=false;return respond(route,{success:true});}
    if(path==='/api/runs')return respond(route,{runs:loggedIn?[{run_id:'production_simulation:SIM-JOB-'+ 'a'.repeat(64),run_type:'production_simulation',label:'模拟生产',status:'running',trace_id:'SIM-JOB-'+ 'a'.repeat(64),phases:[]}]:[]});
    return respond(route,{trace:[],items:[],devices:[],runner:{}});});
  try{await page.goto(fixture.base+'/?view=logs');await page.locator('.logs-run-card').waitFor();
    await page.locator('.team-access > summary').click();await page.getByRole('button',{name:'退出登录',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.logs-run-card'),null,{timeout:1000});
  }finally{await fixture.close();}
});
