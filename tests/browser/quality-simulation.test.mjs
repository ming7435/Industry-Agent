import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const id = 'FC-' + 'a'.repeat(56) + '00016973';
const secondId = 'FC-' + 'b'.repeat(56) + '00000009';
const run = { run_id: id, status: 'completed', part_name: '安装底板', part_number: '92531',
  validation: { valid: true, step_roundtrip: true, solid_count: 1 }, spec: { units: 'mm', operations: [] } };
const basis = { ...run, parameters: [{ key: 'operations.0.length', name: '主体 · 长度', expected: '100', unit: 'mm', kind: 'number' }], digest: 'verified' };
const batch = (requestId, runId=id) => ({ batch_id: 'SIM-BATCH-'+requestId, request_id: requestId, design_run_id: runId,
  simulation: true, synthetic: true, status: 'partial', counts: { total: 10, determinate: 9, qualified: 7, unqualified: 2, pending: 1, review: 0 },
  rates: { qualified: 77.78, defect: 22.22, coverage: 90 },
  basis: { ...basis, run_id: runId }, station: { measurement_device_id: 'RENISHAW-EQUATOR300-001' },
  traceability: { traceability_source: 'simulation_profile', measurement_device_id: 'RENISHAW-EQUATOR300-001', production_device_id: 'TRAK-TC820LTYSI-001', production_device_name: 'TRAK 车床', line_id: 'SIM-LINE-A', line_name: '模拟 A 线', root_cause_status: 'unconfirmed' },
  samples: Array.from({length:10}, (_,i)=>({part_id:'SIM-PART-'+i,simulation:true,synthetic:true,observations:i===9?{}:{'operations.0.length':{value:i===7?'100.1':i===8?'100.2':'100',unit:'mm'}}})),
  issues: [7,8].map(i=>({ key: 'operations.0.length', name: '主体 · 长度', expected: '100', actual: i===7?'100.1':'100.2', difference: i===7?'0.1':'0.2', unit: 'mm', kind: 'number', status: 'unqualified', part_id: 'SIM-PART-'+i })),
  recommendations: ['核对刀具磨损和刀补设置；由授权人员确认后再调整。'] });

async function setup({ gate, failure, loggedIn=true, pendingWithCadError=false, savedWithCadError=false, resultOverrides={}, runOverrides={}, basisOverrides={} }={}) {
  const fixture = await centerFixture();
  const page = await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [], posts = [];
  let saved = pendingWithCadError || savedWithCadError ? {...batch('unconfirmed-click'),...resultOverrides} : null;
  await page.addInitScript(({id,secondId,pendingWithCadError}) => {
    sessionStorage.setItem('freecad.active-run', JSON.stringify({ run_id: id, prompt: '底板', command_id: 'saved' }));
    sessionStorage.setItem('freecad.design-versions', JSON.stringify([{ run_id: id, status: 'completed' }, { run_id: secondId, status: 'completed' }]));
    if (pendingWithCadError) sessionStorage.setItem(`quality.simulation.pending:U-1:${id}`,JSON.stringify({design_run_id:id,request_id:'unconfirmed-click'}));
  }, {id,secondId,pendingWithCadError});
  page.on('pageerror', e=>errors.push(e.message));
  await page.route('**/api/**', async route => {
    const req=route.request(), path=new URL(req.url()).pathname;
    if (path==='/api/team/me') return respond(route, loggedIn ? {user:{user_id:'U-1',role:'technician'}} : {detail:'请先登录'}, loggedIn?200:401);
    if (path.startsWith('/api/cad/freecad/runs/')) {
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
      if (failure) return respond(route,{detail:{message:'比对仪离线，未生成检测样本',execution_started:false}},503);
      saved={...batch(body.request_id,body.design_run_id),...resultOverrides}; return respond(route,saved);
    }
    if (path.includes('/simulation/requests/')) return saved ? respond(route,saved) : respond(route,{detail:'尚未查到'},404);
    return respond(route,{items:[],devices:[],runs:[]});
  });
  return {fixture,page,posts,errors};
}

test('actual start click displays saved rates deviations machine line and reloads results',async()=>{
  const {fixture,page,posts,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=quality');
    const start=page.getByRole('button',{name:'开始检测',exact:true});
    await start.click();
    const results=page.getByRole('region',{name:'检测结果',exact:true});
    await results.getByText('77.78%',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['77.78%','22.22%','90.00%']);
    assert.match(await results.textContent(),/100\.1/);
    assert.match(await results.textContent(),/TRAK-TC820LTYSI-001/);
    assert.deepEqual(await results.locator('.quality-location-fields div:last-child dd').allTextContents(),['A 线','A 线']);
    assert.doesNotMatch(await results.textContent(),/模拟 A 线/);
    assert.match(await results.textContent(),/刀具磨损/);
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
    await page.goto(fixture.base+'/?view=quality');
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
    await page.goto(fixture.base+'/?view=quality');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByText('比对仪离线，未生成检测样本',{exact:false}).waitFor();
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.equal(posts.length,1);
  } finally {await fixture.close();}
});

test('not logged in still shows selected part but cannot run a simulation',async()=>{
  const {fixture,page,posts}=await setup({loggedIn:false});
  try {
    await page.goto(fixture.base+'/?view=quality'); await page.getByText('92531',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.match(await page.locator('.quality-workspace').textContent(),/登录/);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('unknown submission is reconciled independently when CAD source fails after reload',async()=>{
  const {fixture,page,posts}=await setup({pendingWithCadError:true});
  try {
    await page.goto(fixture.base+'/?view=quality');
    await page.getByText('77.78%',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.match(await page.locator('.quality-workspace').textContent(),/Redis/);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('successful saved batch remains readable when CAD fails without any pending request',async()=>{
  const {fixture,page,posts}=await setup({savedWithCadError:true});
  try {
    await page.goto(fixture.base+'/?view=quality');
    await page.getByText('77.78%',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.match(await page.locator('.quality-workspace').textContent(),/Redis/);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});

test('possible machine locations connect deviations and missing records to different devices and survive reload',async()=>{
  const {fixture,page,posts,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=quality');
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const locations=page.getByRole('region',{name:'可能的问题机器／位置',exact:true});
    await locations.waitFor();
    const size=locations.locator('[data-location-category="size"]');
    await size.waitFor();
    assert.match(await size.textContent(),/TRAK 车床.*TRAK-TC820LTYSI-001/s);
    assert.match(await size.textContent(),/刀具.*刀补.*加工程序/s);
    assert.match(await size.textContent(),/主体 · 长度.*100\.1/s);
    assert.match(await size.textContent(),/可能原因，待核实/);
    const acquisition=locations.locator('[data-location-category="acquisition"]');
    assert.match(await acquisition.textContent(),/RENISHAW-EQUATOR300-001/);
    assert.match(await acquisition.textContent(),/SIM-PART-9.*缺少测量记录/s);
    assert.doesNotMatch(await acquisition.textContent(),/TRAK-TC820LTYSI-001/);
    await page.reload(); await size.waitFor();
    assert.equal(await locations.locator('.quality-location-card').count(),2);
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['77.78%','22.22%','90.00%']);
    assert.equal(posts.length,1);
    await page.addStyleTag({content:await readFile(new URL('../../frontend/monitor-react/src/app/qualityPart.css',import.meta.url),'utf8')});
    await page.setViewportSize({width:390,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('unknown production trace displays unknown machine without guessing a factory machine',async()=>{
  const {fixture,page}=await setup({resultOverrides:{traceability:{traceability_source:'unknown',measurement_device_id:'RENISHAW-EQUATOR300-001',root_cause_status:'unconfirmed'}}});
  try {
    await page.goto(fixture.base+'/?view=quality'); await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const size=page.getByRole('region',{name:'可能的问题机器／位置',exact:true}).locator('[data-location-category="size"]');
    await size.waitFor();
    assert.match(await size.textContent(),/未知机器.*未知编号/s);
    assert.match(await size.textContent(),/未知产线/);
    assert.doesNotMatch(await size.textContent(),/TRAK-TC820LTYSI-001/);
    assert.match(await size.textContent(),/无法定位具体机器/);
  } finally {await fixture.close();}
});

test('without mismatches or missing records the page does not label any machine as suspicious',async()=>{
  const {fixture,page}=await setup({resultOverrides:{status:'qualified',issues:[],
    counts:{total:10,determinate:10,qualified:10,unqualified:0,pending:0,review:0},rates:{qualified:100,defect:0,coverage:100},
    samples:Array.from({length:10},(_,i)=>({part_id:'SIM-PART-'+i,simulation:true,synthetic:true,observations:{'operations.0.length':{value:'100',unit:'mm'}}}))}});
  try {
    await page.goto(fixture.base+'/?view=quality'); await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByText('0.00%',{exact:true}).waitFor();
    const locations=page.getByRole('region',{name:'可能的问题机器／位置',exact:true});
    assert.equal(await locations.locator('.quality-location-card').count(),0);
    assert.match(await locations.textContent(),/未发现可用于定位的异常/);
    assert.doesNotMatch(await locations.textContent(),/TRAK-TC820LTYSI-001/);
  } finally {await fixture.close();}
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
    await page.goto(fixture.base+'/?view=quality');
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
    assert.doesNotMatch(await results.getByRole('region',{name:'可能的问题机器／位置',exact:true}).textContent(),/圆角／半径|缺少测量记录/);
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
    await page.goto(fixture.base+'/?view=quality');
    await page.getByText('92531',{exact:true}).waitFor();
    await page.locator('.quality-standard-summary summary').click();
    assert.match(await page.locator('.quality-standard-summary').textContent(),/gear.*module.*2.*teeth.*20/s);
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.deepEqual(posts,[]);
  } finally {await fixture.close();}
});
