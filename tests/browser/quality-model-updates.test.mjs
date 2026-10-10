import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond, deferred} from './helpers/center-fixture.mjs';

const oldId = 'FC-' + 'a'.repeat(64);
const fixtureEntry = `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import Quality from './QualityWorkspace.jsx';import Cad from './production-cad/ProductionCadWorkspace.jsx';
function Host(){const [view,setView]=useState(new URL(location.href).searchParams.get('view')||'quality');
return <><button onClick={()=>setView('cad')}>打开建模</button><button onClick={()=>setView('quality')}>打开质检</button>{view==='cad'?<Cad/>:<Quality/>}</>}
createRoot(document.getElementById('root')).render(<Host/>);`;

function model(runId, length, createdAt=1) {
  return {run_id:runId,status:'completed',part_name:'法兰轴套',part_number:'04898',prompt:'轴套设计',created_at:createdAt,
    spec:{units:'mm',operations:[{type:'box',mode:'add',length,width:20,height:10,position:[0,0,0]}]},
    validation:{valid:true,step_roundtrip:true,solid_count:1,bounds_mm:[length,20,10]},
    artifacts:['stl','step'].map(format=>({format,name:`model.${format}`,url:`/api/cad/freecad/runs/${runId}/artifacts/model.${format}`}))};
}
const basis = record => ({...record,parameters:[{key:'operations.0.length',name:'主体 · 长度',expected:String(record.spec.operations[0].length),unit:'mm',kind:'number'}]});
const batch = (body, record) => ({design_run_id:body.design_run_id,request_id:body.request_id,batch_id:'SIM-BATCH-'+body.request_id,
  simulation:true,synthetic:true,status:'partial',basis:basis(record),samples:[],issues:[],
  counts:{total:10,qualified:record.run_id===oldId?7:9,unqualified:record.run_id===oldId?2:0,determinate:9,pending:1,review:0},
  rates:{qualified:record.run_id===oldId?77.78:100,defect:record.run_id===oldId?22.22:0,coverage:90}});

async function setup({oldDetectionGate, newDetectionGate, modelGate, runningModel=false}={}) {
  const fixture=await virtualFixture(fixtureEntry),context=await fixture.browser.newContext();
  const records=new Map([[oldId,model(oldId,40)]]),saved=new Map(),posts=[],errors=[];
  await context.addInitScript(({oldId})=>{
    if(location.protocol!=='http:')return;
    if(!sessionStorage.getItem('freecad.active-run')){
      sessionStorage.setItem('freecad.active-run',JSON.stringify({run_id:oldId,prompt:'旧设计',command_id:'saved'}));
      sessionStorage.setItem('freecad.design-versions',JSON.stringify([{run_id:oldId,status:'completed',created_at:1}]));
    }
  },{oldId});
  context.on('page',page=>{page.setDefaultTimeout(6000);page.on('pageerror',error=>errors.push(error.message));});
  await context.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/api/team/me')return respond(route,{user:{user_id:'U-1',role:'technician'}});
    if(path==='/api/cad/freecad/status')return respond(route,{connected:true,part_identity_supported:true,tools:[{name:'execute_code'}]});
    if(path==='/api/cad/freecad/runs'&&req.method()==='POST'){
      const body=req.postDataJSON(),runId='FC-'+createHash('sha256').update(body.command_id).digest('hex');
      const record=model(runId,80,2);records.set(runId,record);
      if(runningModel)records.set(runId,{...record,status:'running',validation:null,artifacts:[]});
      if(modelGate)await modelGate.promise;
      return respond(route,records.get(runId),202);
    }
    if(path.includes('/artifacts/')){
      const stl=Buffer.alloc(84);return route.fulfill({contentType:'model/stl',body:stl});
    }
    if(path.startsWith('/api/cad/freecad/runs/'))return respond(route,records.get(path.split('/').at(-1))||{detail:'未找到'},records.has(path.split('/').at(-1))?200:404);
    if(path.endsWith('/simulation/capabilities'))return respond(route,{enabled:true});
    if(path.endsWith('/simulation/designs'))return respond(route,{items:[]});
    if(path.includes('/simulation/designs/')){
      const runId=path.split('/').at(-1);return respond(route,{basis:basis(records.get(runId)),latest:[...saved.values()].find(value=>value.design_run_id===runId)||null});
    }
    if(path.endsWith('/simulation/detect')){
      const body=req.postDataJSON();posts.push(body);
      if(body.design_run_id===oldId&&oldDetectionGate)await oldDetectionGate.promise;
      if(body.design_run_id!==oldId&&newDetectionGate)await newDetectionGate.promise;
      if(!saved.has(body.request_id))saved.set(body.request_id,batch(body,records.get(body.design_run_id)));
      return respond(route,saved.get(body.request_id));
    }
    if(path.includes('/simulation/requests/'))return saved.has(path.split('/').at(-1))?respond(route,saved.get(path.split('/').at(-1))):respond(route,{detail:'未找到'},404);
    return respond(route,{items:[]});
  });
  const page=await context.newPage();await page.goto(fixture.base+'/?view=quality');
  await page.getByText('04898',{exact:true}).waitFor();
  return {fixture,context,page,posts,records,errors};
}

async function generate(page) {
  await page.getByRole('button',{name:'新建设计',exact:true}).click();
  await page.getByLabel('零件名称',{exact:true}).fill('法兰轴套');
  await page.getByLabel('描述零件、尺寸和设计要求').fill('修改长度为80mm');
  await page.getByRole('button',{name:'生成 3D 模型',exact:true}).click();
  await page.getByRole('region',{name:'当前零件标识',exact:true}).waitFor();
}

test('a completed model in another tab refreshes standards and starts a separate new-version batch',async()=>{
  const {fixture,context,page,posts,errors}=await setup();
  try{
    await page.getByRole('button',{name:'开始检测',exact:true}).click();await page.getByText('77.78%',{exact:true}).waitFor();
    const cad=await context.newPage();await cad.goto(fixture.base+'/?view=cad');await generate(cad);
    await page.getByText('100.00%',{exact:true}).waitFor();
    const selected=await page.getByRole('combobox',{name:'零件名称',exact:true}).inputValue();
    assert.notEqual(selected,oldId);assert.equal(posts.at(-1).design_run_id,selected);
    await page.locator('.quality-standard-summary summary').click();
    assert.match(await page.locator('.quality-standard-summary').textContent(),/长度：80 mm/);
    assert.equal(await page.getByText('77.78%',{exact:true}).count(),0);
    assert.match(await page.getByRole('combobox',{name:'零件名称',exact:true}).textContent(),/版本 2/);
    await page.reload();await page.getByText('100.00%',{exact:true}).waitFor();
    assert.equal(posts.length,2);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('a newly generated model is detected when returning from modeling in the same page',async()=>{
  const {fixture,page,posts}=await setup();
  try{
    await page.getByRole('button',{name:'打开建模',exact:true}).click();await generate(page);
    await page.getByRole('button',{name:'打开质检',exact:true}).click();await page.getByText('100.00%',{exact:true}).waitFor();
    assert.equal(posts.length,1);assert.notEqual(posts[0].design_run_id,oldId);
  }finally{await fixture.close();}
});

test('new-version results cannot be overwritten by an older detection response arriving late',async()=>{
  const gate=deferred(),{fixture,context,page,posts}=await setup({oldDetectionGate:gate});
  try{
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    const cad=await context.newPage();await cad.goto(fixture.base+'/?view=cad');await generate(cad);
    await page.getByText('100.00%',{exact:true}).waitFor();gate.resolve();
    await page.waitForFunction(()=>!document.querySelector('.quality-detection-actions .primary').disabled);
    assert.equal(await page.getByText('77.78%',{exact:true}).count(),0);
    assert.notEqual(await page.getByRole('combobox',{name:'零件名称',exact:true}).inputValue(),oldId);
    assert.equal(posts.length,2);
  }finally{gate.resolve();await fixture.close();}
});

test('unsubmitted model drafts do not replace quality standards or create a new detection',async()=>{
  const {fixture,context,page,posts}=await setup();
  try{
    await page.getByRole('button',{name:'开始检测',exact:true}).click();await page.getByText('77.78%',{exact:true}).waitFor();
    const cad=await context.newPage();await cad.goto(fixture.base+'/?view=cad');
    await cad.getByRole('button',{name:'新建设计',exact:true}).click();await cad.getByLabel('零件名称',{exact:true}).fill('尚未提交的新零件');
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    assert.equal(await page.getByRole('combobox',{name:'零件名称',exact:true}).inputValue(),oldId);
    assert.equal(posts.length,1);assert.equal(await page.getByText('77.78%',{exact:true}).count(),1);
  }finally{await fixture.close();}
});

test('quality opened before modeling finishes follows its completion even after the CAD page unmounts',async()=>{
  const {fixture,page,records,posts}=await setup({runningModel:true});
  try{
    await page.getByRole('button',{name:'打开建模',exact:true}).click();await generate(page);
    await page.getByText('FreeCAD 正在建模',{exact:true}).waitFor();
    const newId=[...records.keys()].find(id=>id!==oldId);
    const read=page.waitForResponse(response=>response.url().endsWith('/api/cad/freecad/runs/'+newId));
    await page.getByRole('button',{name:'打开质检',exact:true}).click();await read;
    assert.equal(posts.length,0);
    records.set(newId,model(newId,80,2));
    await page.getByText('100.00%',{exact:true}).waitFor();
    assert.equal(posts.length,1);assert.equal(posts[0].design_run_id,newId);
  }finally{await fixture.close();}
});

test('a model finishing between leaving CAD and the first quality read still replaces the old standards',async()=>{
  const {fixture,page,records,posts}=await setup({runningModel:true});
  try{
    await page.getByRole('button',{name:'打开建模',exact:true}).click();await generate(page);
    await page.getByText('FreeCAD 正在建模',{exact:true}).waitFor();
    const newId=[...records.keys()].find(id=>id!==oldId);
    records.set(newId,model(newId,80,2));
    await page.getByRole('button',{name:'打开质检',exact:true}).click();
    await page.getByText('100.00%',{exact:true}).waitFor();
    assert.equal(posts.length,1);assert.equal(posts[0].design_run_id,newId);
    assert.equal(await page.getByRole('combobox',{name:'零件名称',exact:true}).inputValue(),newId);
  }finally{await fixture.close();}
});

test('a temporarily unavailable new run is followed until its saved model becomes visible',async()=>{
  const {fixture,page,records,posts}=await setup({runningModel:true});
  try{
    await page.getByRole('button',{name:'打开建模',exact:true}).click();await generate(page);
    await page.getByText('FreeCAD 正在建模',{exact:true}).waitFor();
    const newId=[...records.keys()].find(id=>id!==oldId);
    records.delete(newId);
    const read=page.waitForResponse(response=>response.url().endsWith('/api/cad/freecad/runs/'+newId)&&response.status()===404);
    await page.getByRole('button',{name:'打开质检',exact:true}).click();await read;
    assert.equal(posts.length,0);
    records.set(newId,model(newId,80,2));
    await page.getByText('100.00%',{exact:true}).waitFor();
    assert.equal(posts.length,1);assert.equal(posts[0].design_run_id,newId);
  }finally{await fixture.close();}
});

test('two quality tabs use the same automatic request for one completed revision',async()=>{
  const gate=deferred(),{fixture,context,page,posts}=await setup({newDetectionGate:gate});
  try{
    const cad=await context.newPage();await cad.goto(fixture.base+'/?view=cad');await generate(cad);
    await page.getByRole('button',{name:'正在模拟检测…',exact:true}).waitFor();
    const other=await context.newPage();await other.goto(fixture.base+'/?view=quality');
    await other.getByRole('button',{name:'正在模拟检测…',exact:true}).waitFor();
    assert.equal(posts.length,2);assert.equal(new Set(posts.map(row=>row.request_id)).size,1);
    assert.equal(new Set(posts.map(row=>row.design_run_id)).size,1);
    gate.resolve();await page.getByText('100.00%',{exact:true}).waitFor();await other.getByText('100.00%',{exact:true}).waitFor();
  }finally{gate.resolve();await fixture.close();}
});
