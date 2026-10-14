import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

test('进入工作台后预读三个页面目录，首次切页直接显示已读目录且不读取整份工单',async()=>{
  const fixture=await centerFixture({fullApp:true});
  const context=await fixture.browser.newContext(),page=await context.newPage();
  const reads=[],writes=[],errors=[];
  const directoryReads=new Map();let hold=false;
  page.on('pageerror',error=>errors.push(error.message));
  const actor={user_id:'U-WARM',role:'technician',username:'预读验证'};
  try {
    await page.route('**/api/**',route=>{
      const request=route.request(),url=new URL(request.url());
      if(request.method()!=='GET'){writes.push(url.pathname);return route.abort();}
      reads.push(url.pathname+url.search);
      if(['/api/maintenance/plans','/api/runs','/api/trace','/api/workorders/WO-WARM'].includes(url.pathname)
        ||url.pathname==='/api/workorders'&&url.searchParams.get('summary')==='true'){
        const count=(directoryReads.get(url.pathname)||0)+1;directoryReads.set(url.pathname,count);
        if(hold&&count>1)return;
      }
      if(url.pathname==='/api/team/me')return respond(route,{user:actor});
      if(url.pathname==='/api/team/line')return respond(route,{state:'stopped',generation:1,updated_at:'unchanged'});
      if(url.pathname==='/api/maintenance/plans')return respond(route,{items:[{plan_id:'PLAN-WARM',device_id:'D-WARM',event_id:'EV-WARM',repair_target:'预读维修方案',created_at:'2026-10-13T01:00:00Z'}],deleted_plan_ids:[],history:{status:'ready'}});
      if(url.pathname==='/api/runs')return respond(route,{runs:[{run_id:'fault:WARM',label:'预读运行记录',run_type:'fault',status:'completed',trace_id:'TRACE-WARM',trace_ids:['TRACE-WARM'],event_count:2,error_count:0}]});
      if(url.pathname==='/api/trace')return respond(route,{trace:[
        {trace_record_id:'WARM-START',trace_id:'TRACE-WARM',task_id:'TASK-WARM',agent_run_id:'A-WARM',agent:'diagnosis',type:'agent',event:'agent_started',timestamp:'2026-10-13T01:00:00Z'},
        {trace_record_id:'WARM-END',trace_id:'TRACE-WARM',task_id:'TASK-WARM',agent_run_id:'A-WARM',agent:'diagnosis',type:'agent',event:'agent_completed',output:{summary:'预读诊断结论'},timestamp:'2026-10-13T01:00:01Z'}]});
      if(url.pathname==='/api/workorders')return respond(route,{summary:true,items:[{_summary_record:true,workorder_id:'WO-WARM',device_id:'D-WARM',assignee:actor.user_id,status:'in_progress',title:'预读工单',updated_at:'v1'}]});
      if(url.pathname==='/api/workorders/WO-WARM')return respond(route,{workorder_id:'WO-WARM',device_id:'D-WARM',assignee:actor.user_id,status:'in_progress',updated_at:'v1'});
      return respond(route,{items:[],devices:[],runner:{}});
    });
    await page.goto(fixture.base);
    await page.waitForFunction(()=>performance.getEntriesByType('resource').some(item=>new URL(item.name).pathname==='/api/maintenance/plans')
      &&performance.getEntriesByType('resource').some(item=>new URL(item.name).pathname==='/api/runs')
      &&performance.getEntriesByType('resource').some(item=>new URL(item.name).pathname==='/api/workorders')
      &&performance.getEntriesByType('resource').some(item=>new URL(item.name).pathname==='/api/workorders/WO-WARM')
      &&performance.getEntriesByType('resource').some(item=>new URL(item.name).pathname==='/api/trace'),null,{timeout:6000});
    assert.ok(reads.includes('/api/workorders?summary=true'));
    assert.ok(!reads.includes('/api/workorders'),'不得预读整份工单');
    hold=true;
    for(const [name,selector] of [['维修方案','.maintenance-plan-queue .workorder-queue-item'],['工单系统','.workorder-page .workorder-queue-item'],['日志系统','.logs-run-card']]){
      await page.getByRole('navigation',{name:'功能导航'}).getByRole('button',{name,exact:true}).click();
      await page.locator(selector).first().waitFor({timeout:1000});
      if(name==='工单系统')await page.locator('.workorder-titlebar').waitFor({timeout:1000});
      if(name==='日志系统')await page.locator('.agent-invocations').getByText(/预读诊断结论/).waitFor({timeout:1000});
    }
    assert.deepEqual(writes,[]);
    assert.deepEqual(errors,[]);
  } catch(error) {
    error.message+='; '+JSON.stringify({reads,errors});throw error;
  } finally {await context.close();await fixture.close();}
});
