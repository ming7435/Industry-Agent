import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, deferred, respond} from './helpers/center-fixture.mjs';

const actor={user_id:'U-1',username:'维修员甲',role:'technician',responsible_device_ids:['M-1']};
const caseId='EXC-1234567890ABCDEF12345678', reportId='EXR-1234567890ABCDEF12345678';
const baseCase={case_id:caseId,report_id:reportId,task_id:'TASK-FAIL-1',trace_id:'TRACE-FAIL-1',
  subject_type:'device_fault',device_id:'M-1',device_name:'数控车床',alarm_code:'700006',
  fault_summary:'刀塔旋转超时',failed_agent:'maintenance',failed_step:'repair_planning',
  service_error:'maintenance-service HTTP 503',failure_reason:'业务结果校验未通过',
  status:'awaiting_manual',original_status:'failed',control_allowed:false,feedback:'',actor_id:'U-1'};

async function setup({view='workorder',items=[baseCase],role='technician',pdfFailure=false}={}){
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();
  const state={items:structuredClone(items),writes:[],errors:[],logged:true,caseRead:deferred()};
  page.on('pageerror',error=>state.errors.push(error.message));
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()!=='GET')state.writes.push({path,body:req.postDataJSON()});
    if(path==='/api/team/me')return respond(route,state.logged?{user:{...actor,role}}:{},state.logged?200:401);
    if(path==='/api/team/logout'){state.logged=false;return respond(route,{success:true});}
    if(path==='/api/runtime/service-exceptions'){state.caseRead.resolve();return respond(route,{items:state.logged?state.items:[]},state.logged?200:401);}
    if(path===`/api/runtime/service-exceptions/${caseId}/feedback`){
      if(state.feedbackEntered){state.feedbackEntered.resolve();await state.feedbackRelease.promise;}
      state.items=state.items.map(item=>({...item,status:'handled',feedback:req.postDataJSON().feedback,handled_by:'U-1',request_id:req.postDataJSON().request_id}));
      if(state.loseFeedback)return route.abort('failed');
      return respond(route,{success:true,case:state.items[0],status:'handled'});
    }
    if(path===`/api/runtime/service-exceptions/${caseId}/report`)return respond(route,{success:true,report:{report_id:reportId,scope:'service_exception_record',
      title:'服务异常处理报告',article_text:'刀塔旋转超时；maintenance-service HTTP 503；已交接负责人。本报告不代表维修完成、设备恢复或质检合格。'}});
    if(path===`/api/reports/${reportId}/pdf`)return respond(route,pdfFailure?{detail:'PDF 文件服务暂不可用'}:{success:true,open_url:'https://not-trusted.example/artifact'},pdfFailure?503:200);
    if(path==='/api/reports')return respond(route,{detail:'报告存储暂不可用'},502);
    return respond(route,{runs:[],items:[],devices:[],trace:[],runner:{},line:{},workorders:[],plans:[]});
  });
  await page.goto(fixture.base+'/?view='+view);
  return {fixture,page,state};
}

test('维修方案失败仍在工单中心关联故障，双击反馈只保存一次，不创建工单或续跑',async()=>{
  const {fixture,page,state}=await setup();
  state.feedbackEntered=deferred();state.feedbackRelease=deferred();
  try{
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByText('刀塔旋转超时',{exact:true}).waitFor({timeout:3000});
    assert.match(await panel.innerText(),/maintenance-service HTTP 503/);
    assert.match(await panel.innerText(),/TASK-FAIL-1/);
    assert.match(await panel.innerText(),/不是正常维修工单/);
    await panel.getByLabel('实际处理反馈').fill('已交接负责人员，设备故障等待现场核查');
    const button=panel.getByRole('button',{name:'保存人工处理反馈',exact:true});
    await button.evaluate(el=>{el.click();el.click();});await state.feedbackEntered.promise;
    assert.equal(state.writes.length,1);state.feedbackRelease.resolve();
    await panel.getByText('已人工接管',{exact:true}).waitFor();
    assert.deepEqual(state.writes.map(w=>w.path),[`/api/runtime/service-exceptions/${caseId}/feedback`]);
    assert.deepEqual(Object.keys(state.writes[0].body).sort(),['feedback','request_id']);
    assert.deepEqual(state.errors,[]);
  }finally{state.feedbackRelease.resolve();await fixture.close();}
});

test('正常报告存储失败不阻塞异常报告，PDF成功后才能打开下载',async()=>{
  const {fixture,page,state}=await setup({view:'report',items:[{...baseCase,status:'handled',feedback:'已交接负责人'}]});
  try{
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByRole('button',{name:'查看异常处理报告',exact:true}).click({timeout:3000});
    await panel.getByText(/本报告不代表维修完成/).waitFor();
    assert.equal(await panel.getByRole('link',{name:'打开异常 PDF',exact:true}).count(),0);
    await panel.getByRole('button',{name:'生成异常 PDF',exact:true}).click();
    const link=panel.getByRole('link',{name:'打开异常 PDF',exact:true});await link.waitFor();
    assert.equal(await link.getAttribute('href'),`/api/reports/${reportId}/pdf`);
    assert.equal(await panel.getByRole('link',{name:'下载异常 PDF',exact:true}).getAttribute('href'),`/api/reports/${reportId}/pdf?download=1`);
    assert.match(await page.getByRole('region',{name:'报告中心',exact:true}).innerText(),/报告存储暂不可用/);
    assert.deepEqual(state.errors,[]);
  }finally{await fixture.close();}
});

test('独立问答与质检失败不伪装成工单故障，只在对应中心展示',async()=>{
  const {fixture,page,state}=await setup({items:[{...baseCase,subject_type:'knowledge',failed_agent:'knowledge',device_id:'',fault_summary:'问答服务未完成'},
    {...baseCase,case_id:'EXC-ABCDEF1234567890ABCDEF12',subject_type:'quality',failed_agent:'quality',device_id:'',fault_summary:'检测数据不足'}]});
  try{
    await state.caseRead.promise;
    assert.equal(await page.getByRole('region',{name:'异常核查待办'}).count(),0);
    await page.getByRole('button',{name:'知识问答',exact:true}).click();
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByText('问答服务未完成',{exact:true}).waitFor();
    assert.equal(await panel.getByText('检测数据不足',{exact:true}).count(),0);
    assert.deepEqual(state.writes,[]);
  }finally{await fixture.close();}
});

test('监督人只查看异常核查记录，不能填写处理反馈',async()=>{
  const {fixture,page,state}=await setup({role:'supervisor'});
  try{
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByText('刀塔旋转超时',{exact:true}).waitFor({timeout:3000});
    assert.equal(await panel.getByRole('textbox').count(),0);
    assert.equal(await panel.getByRole('button',{name:'保存人工处理反馈'}).count(),0);
    assert.deepEqual(state.writes,[]);
  }finally{await fixture.close();}
});

test('人工反馈响应丢失后只读核对已保存记录，不重发写入',async()=>{
  const {fixture,page,state}=await setup();state.loseFeedback=true;
  try{
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByLabel('实际处理反馈').fill('已交接负责人，未确认设备恢复',{timeout:3000});
    await panel.getByRole('button',{name:'保存人工处理反馈',exact:true}).click();
    await panel.getByText('已人工接管',{exact:true}).waitFor();
    assert.equal(state.writes.length,1);
    assert.equal(state.items[0].original_status,'failed');
  }finally{await fixture.close();}
});

test('PDF失败不能出现虚假下载链接或清除故障记录',async()=>{
  const {fixture,page,state}=await setup({view:'report',items:[{...baseCase,status:'handled',feedback:'人工核查待办已交接'}],pdfFailure:true});
  try{
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByRole('button',{name:'生成异常 PDF',exact:true}).click({timeout:3000});
    await panel.getByText(/PDF 文件服务暂不可用/).waitFor();
    assert.equal(await panel.getByRole('link',{name:/异常 PDF/}).count(),0);
    assert.match(await panel.innerText(),/刀塔旋转超时/);
    assert.deepEqual(state.errors,[]);
  }finally{await fixture.close();}
});

test('退出登录清除异常记录，迟到反馈不能恢复私有数据',async()=>{
  const {fixture,page,state}=await setup();state.feedbackEntered=deferred();state.feedbackRelease=deferred();
  try{
    const panel=page.getByRole('region',{name:'异常核查待办'});
    await panel.getByLabel('实际处理反馈').fill('私有接管记录',{timeout:3000});
    await panel.getByRole('button',{name:'保存人工处理反馈',exact:true}).click();await state.feedbackEntered.promise;
    await page.locator('.team-access > summary').click();await page.getByRole('button',{name:'退出登录',exact:true}).click();
    state.feedbackRelease.resolve();
    await page.waitForFunction(()=>!document.querySelector('.service-exception-panel'),null,{timeout:1000});
    assert.equal(await page.getByText('私有接管记录',{exact:true}).count(),0);
  }finally{state.feedbackRelease.resolve();await fixture.close();}
});
