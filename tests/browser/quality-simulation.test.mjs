import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const id = 'FC-' + 'a'.repeat(56) + '00016973';
const secondId = 'FC-' + 'b'.repeat(56) + '00000009';
const run = { run_id: id, status: 'completed', part_name: '安装底板', part_number: '92531',
  validation: { valid: true, step_roundtrip: true, solid_count: 1 }, spec: { units: 'mm', operations: [] } };
const basis = { ...run, parameters: [{ key: 'operations.0.length', name: '主体 · 长度', expected: '100', unit: 'mm', kind: 'number' }], digest: 'verified' };
const batch = (requestId, runId=id) => ({ batch_id: 'SIM-BATCH-'+requestId, request_id: requestId, design_run_id: runId,
  quality_assessment: {version:1,agent:'quality',mode:'evidence_rules',source_id:'SIM-BATCH-'+requestId,scope:'simulation',status:'review',
    execution:'not_executed',release_allowed:false,checks:{dimensions:'partial',vision:'not_tested'},uncovered_count:0,
    cause_summary:[{category:'equipment_parameters',label:'设备参数',status:'待确认',evidence:'缺少加工参数证据'},
      {category:'drawing',label:'图纸／设计',status:'待确认',evidence:'缺少图纸错误证据'}],
    issues:[{category:'dimension',category_label:'尺寸／设计参数偏差',location:'主体 · 长度',part_id:'SIM-PART-7',
      evidence:'设计值 100 mm · 模拟测量 100.1 mm',cause_status:'unconfirmed',cause_categories:['equipment_parameters','drawing','measurement'],
      disposition:{code:'remeasure',label:'复测后判定',basis:'缺少公差及根因证据',requires_confirmation:true}},
      {category:'acquisition',category_label:'测量数据缺失',location:'主体 · 长度',part_id:'SIM-PART-9',evidence:'缺少测量记录',
      cause_status:'unconfirmed',cause_categories:['measurement'],disposition:{code:'complete_measurement',label:'补测后复检',basis:'补齐测量数据',requires_confirmation:true}}]},
  simulation: true, synthetic: true, status: 'partial', counts: { total: 10, determinate: 9, qualified: 7, unqualified: 2, pending: 1, review: 0 },
  rates: { qualified: 77.78, defect: 22.22, coverage: 90 },
  basis: { ...basis, run_id: runId }, station: { measurement_device_id: 'RENISHAW-EQUATOR300-001' },
  traceability: { traceability_source: 'simulation_profile', measurement_device_id: 'RENISHAW-EQUATOR300-001', production_device_id: 'TRAK-TC820LTYSI-001', production_device_name: 'TRAK 车床', line_id: 'SIM-LINE-A', line_name: '模拟 A 线', root_cause_status: 'unconfirmed' },
  samples: Array.from({length:10}, (_,i)=>({part_id:'SIM-PART-'+i,simulation:true,synthetic:true,observations:i===9?{}:{'operations.0.length':{value:i===7?'100.1':i===8?'100.2':'100',unit:'mm'}}})),
  issues: [7,8].map(i=>({ key: 'operations.0.length', name: '主体 · 长度', expected: '100', actual: i===7?'100.1':'100.2', difference: i===7?'0.1':'0.2', unit: 'mm', kind: 'number', status: 'unqualified', part_id: 'SIM-PART-'+i })),
  recommendations: ['核对刀具磨损和刀补设置；由授权人员确认后再调整。'] });

async function setup({ gate, failure, loggedIn=true, pendingWithCadError=false, savedWithCadError=false, resultOverrides={}, runOverrides={}, basisOverrides={} }={}) {
  const fixture = await centerFixture({withStyles:true});
  const page = await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [], posts = [];
  const savedBatch = (requestId, runId=id) => {
    const original=batch(requestId,runId), combined={...original,...resultOverrides};
    if(resultOverrides.quality_assessment) combined.quality_assessment={...original.quality_assessment,...resultOverrides.quality_assessment};
    return combined;
  };
  let saved = pendingWithCadError || savedWithCadError ? savedBatch('unconfirmed-click') : null;
  await page.addInitScript(({id,secondId,pendingWithCadError}) => {
    sessionStorage.setItem('freecad.active-run', JSON.stringify({ run_id: id, prompt: '底板', command_id: 'saved' }));
    sessionStorage.setItem('freecad.design-versions', JSON.stringify([{ run_id: id, status: 'completed' }, { run_id: secondId, status: 'completed' }]));
    if (pendingWithCadError) sessionStorage.setItem(`quality.simulation.pending:U-1:${id}`,JSON.stringify({design_run_id:id,request_id:'unconfirmed-click'}));
  }, {id,secondId,pendingWithCadError});
  page.on('pageerror', e=>errors.push(e.message));
  await page.route('**/api/**', async route => {
    const req=route.request(), path=new URL(req.url()).pathname;
    if (path==='/api/team/me') return respond(route, loggedIn ? {user:{user_id:'U-1',role:'technician'}} : {detail:'请先登录'}, loggedIn?200:401);
    if (/^\/api\/cad\/(?:freecad|text-to-cad)\/runs\//.test(path)) {
      if (savedWithCadError) return respond(route,{detail:'Redis 暂不可用'},503);
      const current=path.split('/').at(-1);
      return respond(route, {...run,...runOverrides,run_id:current,part_name:current===id?'安装底板':'销轴',part_number:current===id?'92531':'00009'});
    }
    if (path.endsWith('/simulation/capabilities')) return respond(route,{enabled:true,device_id:'RENISHAW-EQUATOR300-001',sample_count:10});
    if (path.endsWith('/simulation/designs')) return respond(route,{items:savedWithCadError?[{run_id:id,part_name:'安装底板',part_number:'92531'}]:[]});
    if (path.includes('/simulation/designs/')) return pendingWithCadError ? respond(route,{detail:'Redis 暂不可用'},503)
      : respond(route,{basis:savedWithCadError?null:{...basis,...basisOverrides,run_id:path.split('/').at(-1)},latest:saved?.design_run_id===path.split('/').at(-1)?saved:null,...(savedWithCadError?{standard_error:'Redis 暂不可用，展示已保存批次'}:{})});
    if (path.endsWith('/simulation/detect')) {
      const body=req.postDataJSON(); posts.push(body);
      if (gate) await gate.promise;
      if (failure) return respond(route,{detail:typeof failure==='object'?failure:{message:'比对仪离线，未生成检测样本',execution_started:false}},typeof failure==='object'?409:503);
      saved=savedBatch(body.request_id,body.design_run_id); return respond(route,saved);
    }
    if (path.includes('/simulation/requests/')) return saved ? respond(route,saved) : respond(route,{detail:'尚未查到'},404);
    return respond(route,{items:[],devices:[],runs:[]});
  });
  return {fixture,page,posts,errors};
}

test('actual start click displays saved rates deviations machine line and reloads results',async()=>{
  const {fixture,page,posts,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    const start=page.getByRole('button',{name:'开始检测',exact:true});
    await start.click();
    const results=page.getByRole('region',{name:'检测结果',exact:true});
    await results.getByText('77.78%',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['77.78%','22.22%','90.00%']);
    assert.match(await results.textContent(),/100\.1/);
    assert.match(await results.textContent(),/TRAK-TC820LTYSI-001/);
    assert.doesNotMatch(await results.textContent(),/模拟 A 线/);
    assert.match(await results.textContent(),/复测后判定/);
    assert.doesNotMatch(await results.textContent(),/对应核查与解决建议|可能的问题机器／位置/);
    assert.deepEqual(Object.keys(posts[0]).sort(),['design_run_id','request_id']);
    assert.equal(posts[0].design_run_id,id);
    await page.reload();
    await results.getByText('77.78%',{exact:true}).waitFor();
    assert.equal(posts.length,1);
    await page.getByRole('combobox',{name:'零件名称',exact:true}).selectOption(secondId);
    await page.getByText('00009',{exact:true}).waitFor();
    await results.getByText('待检测',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.equal(await results.locator('.quality-location-card').count(),0);
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('freecad.active-run')).run_id),id);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('in-flight detection locks name selection and does not send duplicate clicks',async()=>{
  const gate=deferred(); const {fixture,page,posts}=await setup({gate});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const working=page.getByRole('button',{name:'正在模拟检测…',exact:true});
    await working.waitFor();
    assert.equal(await working.isDisabled(),true);
    assert.equal(await page.getByRole('combobox',{name:'零件名称',exact:true}).isDisabled(),true);
    gate.resolve(); await page.getByText('77.78%',{exact:true}).waitFor();
    assert.equal(posts.length,1);
  } finally {gate.resolve();await fixture.close();}
});

test('offline meter yields the actual reason and no invented rates',async()=>{
  const {fixture,page,posts}=await setup({failure:true});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByText('比对仪离线，未生成检测样本',{exact:false}).waitFor();
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.equal(posts.length,1);
  } finally {await fixture.close();}
});

for (const [state,label,reason] of [
  ['stopped','已停止','操作员暂停检测工位'],
  ['emergency_stop','急停','保留待处理旧故障；未提交维修完成回执'],
  ['stopped','已停止',null],
]) test(`stopped meter explains ${state} (${reason?'with reason':'without reason'}) and links to workorders`,async()=>{
  const failure={code:'simulation_station_not_running',message:'模拟比对仪未运行，未生成测量样本',execution_started:false,
    station:{device_id:'RENISHAW-EQUATOR300-001',device_status:state,monitor_status:state,control_state:state,control_reason:reason}};
  const {fixture,page,posts,errors}=await setup({failure});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const recovery=page.getByRole('region',{name:'检测工位未就绪',exact:true});
    await recovery.waitFor();
    assert.match(await recovery.textContent(),new RegExp(label));
    assert.match(await recovery.textContent(),new RegExp(reason || '工位未提供停机原因'));
    assert.match(await recovery.textContent(),/如有待处理工单/);
    assert.match(await recovery.textContent(),/没有关联工单时/);
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isEnabled(),true);
    assert.equal(await page.getByRole('button',{name:'按原请求重试',exact:true}).count(),0);
    assert.equal(posts.length,1);
    const link=recovery.getByRole('link',{name:'前往工单系统核查／申请复机',exact:true});
    await Promise.all([page.waitForURL('**/?view=workorder'),link.click()]);
    assert.equal(new URL(page.url()).searchParams.get('view'),'workorder');
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('not logged in still shows selected part but cannot run a simulation',async()=>{
  const {fixture,page,posts}=await setup({loggedIn:false});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions'); await page.getByText('92531',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.match(await page.locator('.quality-workspace').textContent(),/登录/);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('unknown submission is reconciled independently when CAD source fails after reload',async()=>{
  const {fixture,page,posts}=await setup({pendingWithCadError:true});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByText('77.78%',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.match(await page.locator('.quality-workspace').textContent(),/Redis/);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('successful saved batch remains readable when CAD fails without any pending request',async()=>{
  const {fixture,page,posts}=await setup({savedWithCadError:true});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByText('77.78%',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.match(await page.locator('.quality-workspace').textContent(),/Redis/);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('dimension tab keeps its classifications separate from visual detection',async()=>{
  const {fixture,page,posts,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const locations=page.getByRole('region',{name:'尺寸问题分类与处置',exact:true});
    await locations.waitFor();
    const size=locations.locator('[data-issue-category="dimension"]');
    await size.waitFor();
    assert.match(await size.textContent(),/主体 · 长度.*100\.1/s);
    assert.match(await size.textContent(),/设备参数.*图纸.*根因待确认/s);
    assert.match(await size.textContent(),/复测后判定/);
    const acquisition=locations.locator('[data-issue-category="acquisition"]');
    assert.match(await acquisition.textContent(),/缺少测量记录.*SIM-PART-9/s);
    assert.match(await acquisition.textContent(),/补测后复检/);
    assert.equal(await page.getByRole('heading',{name:'视觉缺陷检测',exact:true}).isVisible(),false);
    assert.equal(await page.getByLabel('待检测图片').isVisible(),false);
    assert.equal(await page.getByRole('tabpanel').count(),1);
    await page.getByRole('tab',{name:'视觉检测',exact:true}).click();
    assert.equal(await page.getByLabel('待检测图片').isVisible(),true);
    assert.equal(await locations.isVisible(),false);
    await page.getByRole('tab',{name:'尺寸检测',exact:true}).click();
    assert.equal(await size.isVisible(),true);
    assert.equal(posts.length,1);
    assert.doesNotMatch(await page.locator('.quality-workspace').textContent(),/对应核查与解决建议|可能的问题机器／位置/);
    await page.reload(); await size.waitFor();
    assert.equal(await locations.locator('.quality-classification-card').count(),2);
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['77.78%','22.22%','90.00%']);
    assert.equal(posts.length,1);
    await mkdir('output/quality-classification-20261026',{recursive:true});
    await page.addStyleTag({path:'frontend/monitor-react/src/styles.css'});
    await page.addStyleTag({content:await readFile(new URL('../../frontend/monitor-react/src/app/qualityPart.css',import.meta.url),'utf8')});
    await page.addStyleTag({path:'frontend/monitor-react/src/app/qualityAssessment.css'});
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('.quality-workspace').screenshot({path:'output/quality-classification-20261026/dimensions-desktop.png'});
    await page.setViewportSize({width:390,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.locator('.quality-workspace').screenshot({path:'output/quality-classification-20261026/dimensions-mobile.png'});
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('legacy records without a server classification do not invent machine causes',async()=>{
  const {fixture,page}=await setup({resultOverrides:{quality_assessment:null,traceability:{traceability_source:'unknown'}}});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions'); await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const classification=page.getByRole('region',{name:'尺寸问题分类与处置',exact:true});
    await classification.waitFor();
    assert.match(await classification.textContent(),/没有匹配的 Agent 分类/);
    assert.equal(await classification.locator('.quality-classification-card').count(),0);
    assert.doesNotMatch(await classification.textContent(),/质检 Agent 已接入|TRAK-TC820LTYSI-001/);
  } finally {await fixture.close();}
});

test('without classified anomalies the page does not label any machine as faulty',async()=>{
  const {fixture,page}=await setup({resultOverrides:{status:'qualified',issues:[],
    quality_assessment:{status:'clear',issues:[]},
    counts:{total:10,determinate:10,qualified:10,unqualified:0,pending:0,review:0},rates:{qualified:100,defect:0,coverage:100},
    samples:Array.from({length:10},(_,i)=>({part_id:'SIM-PART-'+i,simulation:true,synthetic:true,observations:{'operations.0.length':{value:'100',unit:'mm'}}}))}});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions'); await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByText('0.00%',{exact:true}).waitFor();
    const locations=page.getByRole('region',{name:'尺寸问题分类与处置',exact:true});
    assert.equal(await locations.locator('.quality-classification-card').count(),0);
    assert.match(await locations.textContent(),/未检出可分类异常/);
    assert.doesNotMatch(await locations.textContent(),/TRAK-TC820LTYSI-001/);
  } finally {await fixture.close();}
});

test('a classification belonging to another batch is not shown as this batch decision',async()=>{
  const {fixture,page}=await setup({resultOverrides:{quality_assessment:{source_id:'SIM-BATCH-other'}}});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const panel=page.getByRole('region',{name:'尺寸问题分类与处置',exact:true});await panel.waitFor();
    assert.equal(await panel.locator('.quality-classification-card').count(),0);
    assert.match(await panel.textContent(),/没有匹配的 Agent 分类/);
  }finally{await fixture.close();}
});

test('completed multi-body production models remain selectable and display uncovered parameters as pending',async()=>{
  const parameters = [
    {key:'model.bounds_mm.2',name:'成品外形 · Z尺寸',expected:'42',unit:'mm',kind:'number',comparable:true},
    {key:'operations.3.radius',name:'特征 · 4 · 圆角／半径',expected:'1',unit:'mm',kind:'number',comparable:false,reason:'尚未覆盖完整成品特征比对'},
  ];
  const {fixture,page,posts,errors}=await setup({runOverrides:{validation:{valid:true,step_roundtrip:true,solid_count:2},
    spec:{units:'mm',parts:[{name:'底座',operations:[{type:'box',length:70}]},{name:'轴套',operations:[{type:'cylinder',diameter:32}]}]}},
    basisOverrides:{parameters},resultOverrides:{basis:{...basis,parameters},
      counts:{total:10,determinate:0,qualified:0,unqualified:0,pending:10,review:0},rates:{qualified:null,defect:null,coverage:0},
      samples:[{part_id:'SIM-PART-1',simulation:true,synthetic:true,observations:{'model.bounds_mm.2':{value:'42.1',unit:'mm'}}}],
      issues:[{key:'model.bounds_mm.2',name:'成品外形 · Z尺寸',expected:'42',actual:'42.1',difference:'0.1',unit:'mm',status:'unqualified',part_id:'SIM-PART-1'}]}});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByText('92531',{exact:true}).waitFor();
    const start=page.getByRole('button',{name:'开始检测',exact:true});
    await page.locator('.quality-standard-summary summary').click();
    assert.match(await page.locator('.quality-standard-summary').textContent(),/圆角.*1 mm.*待判定/s);
    assert.equal(await start.isDisabled(),false);
    await start.click();
    const results=page.getByRole('region',{name:'检测结果',exact:true});
    await results.getByText('0.00%',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['—','—','0.00%']);
    assert.match(await results.textContent(),/共 10 件，0 件可判定，10 件待判定/);
    const pending=results.getByRole('region',{name:'待判定项目',exact:true});
    assert.match(await pending.textContent(),/圆角.*1 mm.*尚未覆盖/s);
    assert.doesNotMatch(await results.getByRole('region',{name:'尺寸问题分类与处置',exact:true}).textContent(),/圆角／半径.*补测后复检/s);
    await page.getByRole('combobox',{name:'零件名称',exact:true}).selectOption(secondId);
    await results.getByText('待检测',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.equal(await pending.count(),0);
    assert.equal(posts.length,1); assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('read-only production parameters remain visible for complex shapes before login',async()=>{
  const {fixture,page,posts}=await setup({loggedIn:false,runOverrides:{
    spec:{units:'mm',operations:[{type:'gear',module:2,teeth:20,width:10,pressure_angle:20}]}}});
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByText('92531',{exact:true}).waitFor();
    await page.locator('.quality-standard-summary summary').click();
    assert.match(await page.locator('.quality-standard-summary').textContent(),/gear.*module.*2.*teeth.*20/s);
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('partially covered designs display item rates while keeping whole parts pending',async()=>{
  const parameters=[
    {key:'model.bounds_mm.2',name:'成品外形 · Z尺寸',expected:'42',unit:'mm',kind:'number',comparable:true},
    {key:'operations.3.radius',name:'圆角／半径',expected:'1',unit:'mm',kind:'number',comparable:false},
  ];
  const {fixture,page}=await setup({basisOverrides:{parameters},resultOverrides:{
    basis:{...basis,parameters},counts:{total:3,determinate:0,qualified:0,unqualified:0,pending:3,review:0},
    rates:{qualified:null,defect:null,coverage:0},
    samples:[{part_id:'1',simulation:true,synthetic:true,observations:{'model.bounds_mm.2':{value:'42',unit:'mm'}}},
      {part_id:'2',simulation:true,synthetic:true,observations:{'model.bounds_mm.2':{value:'42.1',unit:'mm'}}},
      {part_id:'3',simulation:true,synthetic:true,observations:{}}],
    item_summary:{counts:{total:6,qualified:1,unqualified:1,pending:4,review:0,determinate:2},rates:{qualified:50,defect:50,coverage:33.33}},
    issues:[{part_id:'2',key:'model.bounds_mm.2',name:'成品外形 · Z尺寸',expected:'42',actual:'42.1',difference:'.1',unit:'mm',kind:'number',status:'unqualified'}],
  }});
  try{
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const results=page.getByRole('region',{name:'检测结果',exact:true});await results.getByText('33.33%',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['50.00%','50.00%','33.33%']);
    assert.deepEqual(await results.locator('.quality-rate-fields dt').allTextContents(),['已检测项通过率','已检测项不通过率','参数检测覆盖率']);
    assert.match(await results.textContent(),/0 件可判定，3 件待判定/);
    assert.match(await results.textContent(),/不是整件合格率/);
    assert.match(await results.getByRole('region',{name:'待判定项目'}).textContent(),/圆角／半径/);
  }finally{await fixture.close();}
});
