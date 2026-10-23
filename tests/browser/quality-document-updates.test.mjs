import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond} from './helpers/center-fixture.mjs';
const first='FC-'+'a'.repeat(64),second='FC-'+'b'.repeat(64),third='FC-'+'c'.repeat(64);
const record=(run_id,version,diameter)=>({run_id,document_id:'DOC-a',revision:version,version,published_at:version,status:'completed',part_name:'球体',part_number:'00123',spec:null,validation:{valid:true,solid_count:1,step_roundtrip:true},standard_parameters:{run_id,document_id:'DOC-a',revision:version,parameters:[{key:'OBJ-a.diameter',name:'直径',expected:diameter,unit:'mm',kind:'number',comparable:true}]}});
test('published-only refresh follows new standards without detecting; a deliberate history selection stays fixed',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Quality from './QualityWorkspace.jsx';createRoot(document.getElementById('root')).render(<Quality/>);`),page=await fixture.browser.newPage();page.setDefaultTimeout(8000);
  const records=[record(first,1,20)],posts=[],saved=new Map();let detectionGate=null,releaseDetection;
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/team/me')return respond(route,{user:{user_id:'USER-a',role:'technician'}});
    if(['/api/cad/freecad/designs','/api/cad/text-to-cad/designs'].includes(path))return respond(route,{items:records,next_cursor:'',directory_version:records.length});
    if(path.endsWith('/simulation/capabilities'))return respond(route,{enabled:true});
    if(path.endsWith('/simulation/designs'))return respond(route,{items:[]});
    if(path.includes('/simulation/designs/')) {const id=path.split('/').at(-1),run=records.find(r=>r.run_id===id);return respond(route,{basis:{...run,parameters:run.standard_parameters.parameters},latest:saved.get(id)||null});}
    if(path.endsWith('/simulation/detect')) {const body=route.request().postDataJSON();posts.push(body);const run=records.find(r=>r.run_id===body.design_run_id),result={design_run_id:run.run_id,request_id:body.request_id,batch_id:'SIM-BATCH-a',simulation:true,synthetic:true,status:'qualified',basis:{...run,parameters:run.standard_parameters.parameters},samples:[],issues:[],counts:{total:10,determinate:10,qualified:10,unqualified:0,pending:0,review:0},rates:{qualified:100,defect:0,coverage:100}};saved.set(run.run_id,result);return detectionGate?detectionGate.then(()=>respond(route,result)):respond(route,result);}
    return respond(route,{items:[]});
  });
  try {
    await page.goto(fixture.base+'/?quality_panel=dimensions');await page.getByText('00123',{exact:true}).waitFor();assert.equal(posts.length,0);
    records.push(record(second,2,30));await page.evaluate(()=>window.dispatchEvent(new CustomEvent('freecad:completed-design',{detail:{published:true}})));
    await page.waitForFunction(id=>document.querySelector('#quality-part-name')?.value===id,second);assert.equal(posts.length,0);
    await page.getByRole('button',{name:'开始检测',exact:true}).click();await page.getByText('100.00%',{exact:true}).first().waitFor();assert.equal(posts.length,1);assert.equal(posts[0].design_run_id,second);
    await page.getByRole('combobox',{name:'零件名称',exact:true}).selectOption(first);await page.getByText('待检测',{exact:true}).waitFor();
    records.push(record(third,3,40));await page.evaluate(()=>window.dispatchEvent(new CustomEvent('freecad:completed-design',{detail:{published:true}})));
    await page.getByRole('combobox',{name:'零件名称',exact:true}).getByRole('option',{name:/版本 3/}).waitFor({state:'attached'});
    assert.equal(await page.getByRole('combobox',{name:'零件名称',exact:true}).inputValue(),first);assert.equal(posts.length,1);
    // Legacy catalog refresh must not replace a deliberate native history selection.
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await new Promise(resolve=>setTimeout(resolve,300));
    assert.equal(await page.getByRole('combobox',{name:'零件名称',exact:true}).inputValue(),first);
    detectionGate=new Promise(resolve=>{releaseDetection=resolve;});
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByRole('button',{name:'正在模拟检测…',exact:true}).waitFor();
    await page.evaluate(id=>{localStorage.setItem('freecad.completed-designs.v1',JSON.stringify([{run_id:id,status:'completed',created_at:100}]));window.dispatchEvent(new CustomEvent('freecad:completed-design'));},first);
    await new Promise(resolve=>setTimeout(resolve,200));releaseDetection();detectionGate=null;
    await page.getByText('100.00%',{exact:true}).first().waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),false);
    await page.getByLabel('跟随最新发布版本').check();await page.waitForFunction(id=>document.querySelector('#quality-part-name')?.value===id,third);assert.equal(posts.length,2);
    await page.getByRole('button',{name:'开始检测',exact:true}).waitFor();
    await page.evaluate(id=>{localStorage.setItem('freecad.completed-designs.v1',JSON.stringify([{run_id:id,status:'completed',created_at:101}]));window.dispatchEvent(new CustomEvent('freecad:completed-design'));},second);
    await new Promise(resolve=>setTimeout(resolve,400));
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),false);
  }finally{await fixture.close();}
});
