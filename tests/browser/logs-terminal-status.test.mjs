import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

test('日志原始开始事件在对应调用结束后不再显示执行中，缺回执步骤保持待核对',async()=>{
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();
  const writes=[],errors=[];
  const owner={trace_id:'TRACE-DONE',task_id:'TASK-DONE',agent:'knowledge',agent_run_id:'AGENT-DONE'};
  const records=[
    {...owner,type:'agent',event:'agent_started',name:'knowledge',timestamp:'2026-10-14T00:00:00Z'},
    {...owner,type:'tool',event:'tool_started',name:'search_manual',tool_name:'search_manual',
      context:{tool_call_id:'CALL-DONE'},arguments:{query:'主轴'},timestamp:'2026-10-14T00:00:01Z'},
    {...owner,type:'tool',event:'tool_completed',name:'search_manual',tool_name:'search_manual',
      context:{tool_call_id:'CALL-DONE'},output:{total:2},timestamp:'2026-10-14T00:00:02Z'},
    {...owner,type:'agent_step',event:'step_started',name:'missing_receipt',step_run_id:'STEP-MISSING',timestamp:'2026-10-14T00:00:03Z'},
    {...owner,type:'agent',event:'agent_completed',name:'knowledge',output:{status:'completed'},timestamp:'2026-10-14T00:00:04Z'},
  ];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){writes.push(path);return route.abort();}
    if(path==='/api/runs')return respond(route,{runs:[{run_id:'rag:TRACE-DONE',run_type:'rag',label:'RAG 问答',
      status:'completed',trace_ids:['TRACE-DONE'],event_count:5,phases:[{id:'rag',label:'RAG 问答',status:'completed'}]}]});
    if(path==='/api/trace')return respond(route,{trace:records});
    return respond(route,{items:[],devices:[],user:null});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    await page.locator('.logs-list .log-event').nth(4).waitFor();
    assert.equal(await page.locator('.logs-list .log-event-running').count(),0);
    const missing=page.locator('.logs-list .log-event').filter({has:page.locator('h3',{hasText:'missing_receipt'})});
    assert.equal(await missing.locator('.log-event-status').innerText(),'状态待核对');
    const started=page.locator('.logs-list .log-event').filter({hasText:'事件：tool_started'});
    assert.equal(await started.locator('.log-event-status').innerText(),'已完成');
    assert.match(await page.locator('.agent-invocations').innerText(),/search_manual/);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
