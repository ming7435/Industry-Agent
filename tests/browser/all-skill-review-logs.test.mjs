import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond,openLogSections} from './helpers/center-fixture.mjs';

test('发布后的技能核查展示在所属 Agent 中，保留真实业务结果且不执行业务写入',async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();
  const writes=[],errors=[];
  const owner={agent:'workorder',agent_run_id:'WO-RUN',trace_id:'TRACE-REVIEW',task_id:'TASK-REVIEW',
    context:{event_id:'E-REVIEW',device_id:'M1'}};
  const records=[
    {...owner,type:'agent',event:'agent_started',timestamp:'2026-10-13T01:00:00Z',input:{device_id:'M1'}},
    {...owner,type:'agent',event:'agent_completed',timestamp:'2026-10-13T01:00:01Z',output:{workorder_id:'WO-1',status:'assigned'}},
    {...owner,type:'skill_review',event:'skill_review_completed',timestamp:'2026-10-13T01:00:02Z',
      skill:'auto_assignment',skill_fingerprint:'a'.repeat(64),status:'completed',
      output:{highlights:[{path:'/output/status',value:'assigned'}],missing:['/input/feedback']}},
  ];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(!['GET','HEAD'].includes(req.method())) {writes.push(path);return route.abort();}
    if(path==='/api/runs') return respond(route,{runs:[{run_id:'fault:E-REVIEW',run_type:'fault',
      device_id:'M1',label:'故障闭环',status:'completed',trace_ids:['TRACE-REVIEW'],event_count:3,phases:[]}]});
    if(path==='/api/trace') return respond(route,{records});
    if(path==='/api/monitor/snapshot') return respond(route,{devices:[],diagnosis:{}});
    return respond(route,{});
  });
  try {
    await page.goto(fixture.base+'/?view=logs');
    await openLogSections(page);
    const review=page.getByRole('region',{name:'技能执行核查',exact:true});
    await review.waitFor({timeout:6000});
    await review.locator('summary').click();
    assert.match(await review.innerText(),/auto_assignment.*已核查/s);
    assert.match(await review.innerText(),/\/input\/feedback/);
    assert.match(await review.innerText(),/不改变本次业务结果/);
    assert.match(await page.locator('.agent-invocation-card').innerText(),/WO-1/);
    assert.deepEqual(writes,[]);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});
