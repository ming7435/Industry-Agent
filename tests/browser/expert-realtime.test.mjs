import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond,deferred} from './helpers/center-fixture.mjs';

test('专家总览自动反映执行中及完成状态，断线保留上次结果并恢复',async()=>{
  const fixture=await centerFixture({fullApp:true,withStyles:true});
  const page=await fixture.browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(5000);
  const writes=[],errors=[];
  const slow=deferred(),stalled=deferred();
  const skill={agent:'diagnosis',agent_label:'智能诊断',name:'alarm',title:'报警诊断',goal:'核对证据'};
  let reads=0,mode='failed';
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()!=='GET')writes.push(path);
    if(path==='/api/team/me')return respond(route,{user:{user_id:'U-1',role:'technician'}});
    if(path==='/api/expert/skills')return respond(route,{items:[skill]});
    if(path==='/api/expert/agents'){
      reads++;
      const selected=mode;
      if(selected==='slow')await slow.promise;
      if(selected==='timeout')await stalled.promise;
      if(selected==='offline')return respond(route,{detail:'暂时不可用'},503);
      if(selected==='unavailable')return respond(route,{available:false,items:[]});
      const running=selected==='slow' ? 1 : 0;
      const completed=selected==='completed' ? 1 : 0;
      const unconfirmed=selected==='unconfirmed' ? 1 : 0;
      const failed=selected==='unconfirmed' ? 0 : 1;
      return respond(route,{available:true,partial:selected==='partial',window_end:`2026-10-21T01:00:${String(reads).padStart(2,'0')}Z`,items:[{
        agent:'diagnosis',total:failed+running+completed+unconfirmed,failed,blocked:0,running,unconfirmed,pending:0,completed,
        completion_rate:completed ? 50 : 0,last_failure_at:'2026-10-21T00:58:00Z'}]});
    }
    return respond(route,{items:[],devices:[],runs:[],runner:{}});
  });
  try{
    await page.clock.install({time:new Date('2026-10-21T01:00:00Z')});
    await page.goto(fixture.base+'/?view=expert');
    const overview=page.getByRole('region',{name:'专家总览',exact:true});
    const card=overview.getByRole('article',{name:'智能诊断专家',exact:true});
    await card.getByText('有执行失败',{exact:true}).waitFor();
    await overview.getByText(/近实时监测中.*5 秒/).waitFor();
    assert.equal(reads,1);

    mode='slow';
    await page.clock.fastForward(5000);
    await page.waitForFunction(()=>document.querySelector('.expert-monitor-status')?.textContent.includes('更新中'));
    assert.equal(reads,2);
    assert.match(await card.innerText(),/有执行失败/,'更新期间保留上次结果');
    await page.clock.fastForward(5000);
    assert.equal(reads,2,'慢请求未完成时不应并发发起重复请求');
    slow.resolve();
    await card.getByText(/执行中 1/).first().waitFor();
    assert.match(await card.innerText(),/近 24 小时失败 1/);

    mode='completed';
    await page.clock.fastForward(5000);
    await card.getByText('50%',{exact:true}).waitFor();
    assert.match(await card.innerText(),/当前执行中 0/);

    mode='offline';
    await page.clock.fastForward(5000);
    await overview.getByText(/自动更新失败/).first().waitFor();
    assert.match(await card.innerText(),/50%/,'断线时保留上次数据');
    assert.match(await overview.innerText(),/上次更新/);
    mode='completed';
    await page.clock.fastForward(5000);
    await overview.getByText(/近实时监测中.*5 秒/).waitFor();

    const navigation=page.getByRole('navigation',{name:'功能导航'});
    await navigation.getByRole('button',{name:'智能诊断',exact:true}).click();
    const beforeLeaving=reads;
    await page.clock.fastForward(15000);
    assert.equal(reads,beforeLeaving,'离开专家中心时不应继续轮询');
    const returnResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/expert/agents');
    await navigation.getByRole('button',{name:'专家中心',exact:true}).click();
    await returnResponse;
    await overview.getByText(/近实时监测中.*5 秒/).waitFor();
    assert.equal(reads,beforeLeaving+1,'返回专家中心时应立即读取一次');

    await page.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await overview.getByText('监测已暂停',{exact:true}).waitFor();
    const beforeHidden=reads;
    await page.clock.fastForward(15000);
    assert.equal(reads,beforeHidden,'浏览器标签页隐藏时不应继续轮询');
    const visibilityResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/expert/agents');
    await page.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await visibilityResponse;
    await overview.getByText(/近实时监测中.*5 秒/).waitFor();
    assert.equal(reads,beforeHidden+1,'恢复标签页时应立即读取一次');
    mode='unconfirmed';
    await page.clock.fastForward(5000);
    await card.getByText('状态待确认',{exact:true}).waitFor();
    assert.match(await card.innerText(),/当前执行中 0 · 未确认结束 1/,'无法确认的历史调用不能冒充正在执行');
    mode='partial';
    await page.clock.fastForward(5000);
    await overview.getByText(/当前仅能读取部分运行记录/).waitFor();
    mode='unavailable';
    await page.clock.fastForward(5000);
    await overview.getByText('自动更新失败',{exact:true}).waitFor();
    assert.match(await overview.innerText(),/当前仅能读取部分运行记录/,'不可用响应不能覆盖已有样本');
    mode='timeout';
    await page.clock.fastForward(5000);
    await page.waitForFunction(()=>document.querySelector('.expert-monitor-status')?.textContent.includes('更新中'));
    await page.clock.fastForward(15000);
    await overview.getByText(/请求超时/).waitFor();
    mode='completed';
    await page.clock.fastForward(5000);
    await overview.getByText(/近实时监测中.*5 秒/).waitFor();
    assert.deepEqual(writes,[],'自动监测只能读取，不启动机器测试或业务写入');
    assert.deepEqual(errors,[]);
  }finally{slow.resolve();stalled.resolve();await fixture.close();}
});
