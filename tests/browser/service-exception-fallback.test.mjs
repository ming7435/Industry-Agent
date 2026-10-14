import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond} from './helpers/center-fixture.mjs';

const actor={user_id:'U-1',username:'维修员甲',role:'technician',responsible_device_ids:['M-1']};
const exception={case_id:'EXC-1234567890ABCDEF12345678',report_id:'EXR-1234567890ABCDEF12345678',
  task_id:'TASK-FAIL-1',trace_id:'TRACE-FAIL-1',subject_type:'device_fault',
  device_id:'M-1',device_name:'数控车床',alarm_code:'700006',fault_summary:'刀塔旋转超时',
  failed_agent:'maintenance',failed_step:'repair_planning',service_error:'maintenance-service HTTP 503',
  failure_reason:'业务结果校验未通过',status:'awaiting_manual',original_status:'failed',control_allowed:false,
  feedback:'',actor_id:'U-1'};
const failed={recovery_id:'REC-original',task_id:'TASK-FAIL-1',trace_id:'TRACE-FAIL-1',kind:'runtime',
  status:'failed',failed_agent:'maintenance',failed_step:'repair_planning',error:'维修方案服务 HTTP 503',
  attempts:1,can_resume:false,completed_steps:[{agent:'diagnosis'},{agent:'knowledge'}]};

async function setup(view){
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();
  const state={requests:[],writes:[],errors:[]};
  page.on('pageerror',error=>state.errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    state.requests.push(path);
    if(req.method()!=='GET'){state.writes.push(path);return route.abort('failed');}
    if(path==='/api/team/me')return respond(route,{user:actor});
    if(path==='/api/runtime/service-exceptions')return respond(route,{items:[exception]});
    if(path==='/api/runtime/recovery')return respond(route,{items:[failed],readonly:true});
    return respond(route,{runs:[],items:[],devices:[],trace:[],runner:{},line:{},workorders:[],plans:[]});
  });
  await page.goto(fixture.base+'/?view='+view);
  await page.waitForFunction(()=>document.querySelector('.team-access > summary')?.textContent.includes('维修员甲'));
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  return {fixture,page,state};
}

for(const [view,label] of [['diagnosis','智能诊断'],['maintenance','维修方案'],['workorder','工单系统'],
  ['rag','知识问答'],['quality','质检中心'],['cad','生产建模'],['report','报告中心'],['logs','日志系统']]){
  test(label+'不重复展示异常核查卡片或轮询额外异常接口',async()=>{
    const {fixture,page,state}=await setup(view);
    try{
      assert.equal(await page.getByRole('region',{name:'异常核查待办'}).count(),0);
      assert.equal(await page.getByLabel('实际处理反馈',{exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:'保存人工处理反馈',exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:'生成异常 PDF',exact:true}).count(),0);
      assert.deepEqual(state.requests.filter(path=>path.startsWith('/api/runtime/service-exceptions')),[]);
      assert.deepEqual(state.writes,[]);assert.deepEqual(state.errors,[]);
    }finally{await fixture.close();}
  });
}

test('移除失败任务面板后日志页不读取失败列表或异常待办接口',async()=>{
  const {fixture,page,state}=await setup('logs');
  try{
    assert.equal(await page.getByRole('region',{name:'失败任务记录'}).count(),0);
    assert.equal(await page.getByRole('button',{name:'刷新失败记录',exact:true}).count(),0);
    assert.deepEqual(state.requests.filter(path=>path==='/api/runtime/recovery'),[]);
    assert.deepEqual(state.writes,[]);assert.deepEqual(state.errors,[]);
    assert.equal(await page.getByRole('region',{name:'异常核查待办'}).count(),0);
  }finally{await fixture.close();}
});
