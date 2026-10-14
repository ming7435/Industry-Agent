import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,deferred,respond} from './helpers/center-fixture.mjs';

test('未登录日志页不请求私人失败任务接口，不因401循环打断公开运行列表',async()=>{
  const fixture=await centerFixture();
  const context=await fixture.browser.newContext(),page=await context.newPage();
  let privateReads=0;
  try {
    await page.route('**/api/**',route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/api/runtime/recovery') {
        privateReads++;
        return privateReads===1?respond(route,{detail:'需要登录'},401):undefined;
      }
      if(path==='/api/runs')return respond(route,{runs:[{run_id:'fault:PUBLIC',label:'公开故障运行',run_type:'fault',status:'completed',trace_ids:[],event_count:1}]});
      return respond(route,{items:[]});
    });
    await page.goto(`${fixture.base}/?view=logs`);
    await page.getByRole('button',{name:/公开故障运行/}).waitFor({timeout:2000});
    assert.equal(privateReads,0);
    assert.equal(await page.getByRole('button',{name:'刷新运行记录',exact:true}).count(),0);
  } finally {await context.close();await fixture.close();}
});

test('登录日志页不再读取私人失败列表，公开日志继续自动更新',async()=>{
  const fixture=await centerFixture({fullApp:true});
  const context=await fixture.browser.newContext(),page=await context.newPage();
  let privateReads=0,publicReads=0;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.clock.install();
    await page.route('**/api/**',route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/api/team/me')return respond(route,{user:{user_id:'expired-owner',role:'technician',username:'过期会话'}});
      if(path==='/api/runtime/recovery') {
        privateReads++;
        return respond(route,{detail:'会话已过期'},401);
      }
      if(path==='/api/runs') {
        publicReads++;
        return respond(route,{runs:[{run_id:'fault:PUBLIC',label:'公开故障运行',run_type:'fault',status:'completed',trace_ids:[],event_count:1}]});
      }
      return respond(route,{items:[],devices:[],runner:{}});
    });
    await page.goto(`${fixture.base}/?view=logs`);
    await page.getByRole('button',{name:/公开故障运行/}).waitFor({timeout:3000});
    assert.equal(await page.getByRole('region',{name:'失败任务记录'}).count(),0);
    await page.clock.runFor(11000);
    assert.equal(privateReads,0);
    assert.ok(publicReads>=2,'公开日志应继续轮询');
    assert.deepEqual(errors,[]);
  } finally {await context.close();await fixture.close();}
});

test('日志首次读取显示加载状态，不提前显示没有运行记录',async()=>{
  const fixture=await centerFixture();
  const context=await fixture.browser.newContext(),page=await context.newPage();
  const requested=deferred();
  let pending;
  try {
    await page.route('**/api/**',route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/api/runs') {pending=route;requested.resolve();return;}
      return respond(route,{items:[]});
    });
    await page.goto(`${fixture.base}/?view=logs`);
    await requested.promise;
    const runs=page.getByRole('region',{name:'运行记录',exact:true});
    assert.match(await runs.innerText(),/正在加载运行记录/);
    assert.doesNotMatch(await runs.innerText(),/暂无运行记录/);
    await respond(pending,{runs:[]});
    await runs.getByText(/暂无运行记录/).waitFor({timeout:2000});
  } finally {await context.close();await fixture.close();}
});
