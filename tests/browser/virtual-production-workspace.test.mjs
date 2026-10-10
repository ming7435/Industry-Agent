import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond} from './helpers/center-fixture.mjs';

const id='FC-'+'a'.repeat(64), second='FC-'+'c'.repeat(64);
const run={run_id:id,status:'completed',part_name:'轴套',part_number:'12345',validation:{valid:true,step_roundtrip:true,solid_count:1},
  spec:{units:'mm',operations:[{type:'cylinder',mode:'add',diameter:20,length:10,axis:'z',position:[0,0,0]}]}};
const entry=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import Panel from './production-cad/SimulatedProductionPanel.jsx';
function Test(){const [run,setRun]=useState(${JSON.stringify(run)}),[draft,setDraft]=useState(false);window.changeVersion=()=>setRun({...run,run_id:'${second}'});
return <><button onClick={()=>setDraft(!draft)}>切换草稿状态</button><Panel run={run} draftPending={draft}/></>};createRoot(document.getElementById('root')).render(<Test/>);`;

async function setup({loggedIn=true}={}){
  const fixture=await virtualFixture(entry),page=await fixture.browser.newPage();page.setDefaultTimeout(5000);
  const posts=[],errors=[],reads=[];let saved=null;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname;reads.push(path);
    if(path==='/api/team/me')return respond(route,loggedIn?{user:{user_id:'U1',role:'technician'}}:{detail:'请先登录'},loggedIn?200:401);
    if(path.endsWith('/capabilities'))return respond(route,{enabled:true,ready:true,simulation_only:true});
    if(path.endsWith('/jobs'))return respond(route,{items:saved&&url.searchParams.get('design_run_id')===saved.design_run_id?[saved]:[],next_cursor:null});
    if(req.method()==='POST'){
      const body=req.postDataJSON();posts.push({path,body});
      if(path.endsWith('/plans'))saved={job_id:'SIM-JOB-'+'b'.repeat(64),part_id:'SIM-PART-'+'b'.repeat(64),actor_id:'U1',
        design_run_id:body.design_run_id,design_digest:'d'.repeat(64),program_digest:'e'.repeat(64),status:'prepared',sync_status:'pending',
        revision:1,source:'factory-simulation',simulation_only:true,progress:0,batch_id:body.batch_id||'A',material:body.material,created_at:Date.now(),program:{setup:body.setup},setup:body.setup};
      else saved={...saved,status:path.endsWith('/submit')?'received':path.endsWith('/start')?'running':saved.status,sync_status:'confirmed',revision:saved.revision+1};
      return respond(route,saved);
    }
    return saved?respond(route,saved):respond(route,{detail:'未找到'},404);
  });
  await page.goto(fixture.base);
  return {fixture,page,posts,errors,reads};
}

test('production is started only after the explicit action',async()=>{
  const {fixture,page,posts,errors,reads}=await setup();
  try{
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();
    await page.getByRole('button',{name:'下发模拟工厂',exact:true}).click();
    assert.equal(posts.filter(x=>x.path.endsWith('/start')).length,0);
    await page.getByRole('button',{name:'启动模拟生产',exact:true}).click();
    await page.getByText('加工中',{exact:true}).waitFor();
    assert.equal(posts.filter(x=>x.path.endsWith('/start')).length,1);
    assert.equal(posts[0].body.design_run_id,id);
    assert.equal(reads.some(path=>path.includes('4529')),false);
    assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('draft and version changes cannot dispatch the old design',async()=>{
  const {fixture,page,posts}=await setup();
  try{
    await page.getByRole('button',{name:'保存生产方案',exact:true}).waitFor();
    await page.getByRole('button',{name:'切换草稿状态'}).click();
    assert.equal(await page.getByRole('button',{name:'保存生产方案',exact:true}).isDisabled(),true);
    await page.getByRole('button',{name:'切换草稿状态'}).click();
    await page.evaluate(()=>window.changeVersion());
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();
    assert.equal(posts[0].body.design_run_id,second);
  }finally{await fixture.close();}
});

test('anonymous users cannot prepare or view saved production',async()=>{
  const {fixture,page,posts}=await setup({loggedIn:false});
  try{
    await page.getByText('请先登录账号后使用模拟生产。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'保存生产方案',exact:true}).count(),0);
    assert.equal(posts.length,0);
  }finally{await fixture.close();}
});

test('slow prepare response cannot replace a newly selected complete version',async()=>{
  const {fixture,page,posts}=await setup();
  let release;const gate=new Promise(resolve=>{release=resolve;});
  try{
    await page.route('**/api/production/virtual/plans',async route=>{
      const body=route.request().postDataJSON();posts.push({path:'/plans',body});await gate;
      await respond(route,{job_id:'SIM-JOB-'+'b'.repeat(64),part_id:'SIM-PART-'+'b'.repeat(64),actor_id:'U1',design_run_id:body.design_run_id,
        design_digest:'d'.repeat(64),program_digest:'e'.repeat(64),status:'prepared',sync_status:'pending',revision:1,source:'factory-simulation',simulation_only:true,
        progress:0,batch_id:'A',material:body.material,setup:body.setup});
    });
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.vp-actions button').textContent==='正在保存…');
    await page.evaluate(()=>window.changeVersion());release();
    await page.getByRole('button',{name:'保存生产方案',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'下发模拟工厂',exact:true}).count(),0);
    assert.equal(posts[0].body.design_run_id,id);
  }finally{release();await fixture.close();}
});

test('rejected plan with no saved command permits correction and a fresh command',async()=>{
  const {fixture,page,posts}=await setup();let rejected;
  try{
    await page.route('**/api/production/virtual/plans',async route=>{
      rejected=route.request().postDataJSON();await respond(route,{detail:{code:'invalid_stock',message:'毛坯尺寸不足'}},422);
    });
    await page.getByRole('textbox',{name:'生产批次',exact:true}).fill('correctable');
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'毛坯尺寸不足'}).waitFor();
    await page.waitForFunction(()=>document.querySelector('.vp-actions button').textContent==='保存生产方案');
    assert.equal(await page.getByRole('spinbutton',{name:'毛坯直径（mm）',exact:true}).isDisabled(),false);
    assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).some(key=>key.startsWith('production.virtual.pending:'))),false);
    await page.getByRole('spinbutton',{name:'毛坯直径（mm）',exact:true}).fill('26');
    await page.unroute('**/api/production/virtual/plans');
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();
    await page.getByText('方案已保存',{exact:true}).waitFor();
    assert.notEqual(posts[0].body.command_id,rejected.command_id);assert.equal(posts[0].body.setup.stock_diameter_mm,'26');
  }finally{await fixture.close();}
});

test('unknown prepare remains locked to its original command after a missing lookup',async()=>{
  const {fixture,page,posts}=await setup();
  try{
    await page.route('**/api/production/virtual/plans',route=>route.abort('failed'));
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();await page.getByRole('button',{name:'核对原指令',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('.vp-actions button').textContent==='保存生产方案');
    assert.equal(await page.getByRole('spinbutton',{name:'毛坯直径（mm）',exact:true}).isDisabled(),true);
    await page.reload();await page.getByRole('button',{name:'核对原指令',exact:true}).waitFor();
    assert.equal(await page.getByRole('spinbutton',{name:'毛坯直径（mm）',exact:true}).isDisabled(),true);assert.equal(posts.length,0);
  }finally{await fixture.close();}
});

test('overlapping running polls cannot replace a newer revision with old progress',async()=>{
  const {fixture,page}=await setup();let delayed,release,reads=0;
  const gate=new Promise(resolve=>{release=resolve;});
  try{
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();await page.getByRole('button',{name:'下发模拟工厂',exact:true}).click();
    await page.getByRole('button',{name:'启动模拟生产',exact:true}).click();await page.getByText('加工中',{exact:true}).waitFor();
    const current=await page.evaluate(async()=>await (await fetch('/api/production/virtual/jobs/SIM-JOB-'+'b'.repeat(64))).json());
    await page.route('**/api/production/virtual/jobs/SIM-JOB-*',async route=>{
      if(route.request().method()!=='GET')return route.fallback();reads++;
      if(reads===1){delayed=true;await gate;await respond(route,{...current,revision:current.revision+1,progress:.2});}
      else await respond(route,{...current,revision:current.revision+2,progress:.8});
    });
    await page.waitForFunction(()=>document.querySelector('progress')?.value===.8);assert.equal(delayed,true);
    const oldResponse=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith(current.job_id));release();await oldResponse;
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
    assert.equal(await page.locator('progress').getAttribute('value'),'0.8');
  }finally{release();await fixture.close();}
});

test('CAD task restoration consumes every directory page and selects the newest saved batch',async()=>{
  const {fixture,page}=await setup();const template={job_id:'SIM-JOB-'+'b'.repeat(64),part_id:'SIM-PART-'+'b'.repeat(64),actor_id:'U1',design_run_id:id,
    design_digest:'d'.repeat(64),program_digest:'e'.repeat(64),status:'prepared',sync_status:'pending',revision:1,source:'factory-simulation',simulation_only:true,progress:0,material:'模拟钢材',setup:{stock_diameter_mm:24},created_at:1};
  const first=Array.from({length:50},(_,i)=>{const suffix=(i+1).toString(16).padStart(64,'0');return {...template,job_id:'SIM-JOB-'+suffix,part_id:'SIM-PART-'+suffix,batch_id:'B'+i,created_at:i};});
  const newest={...template,batch_id:'LATEST',created_at:100};let pages=0;
  try{
    await page.route('**/api/production/virtual/jobs?*',route=>{pages++;return respond(route,new URL(route.request().url()).searchParams.get('cursor')?{items:[newest],next_cursor:null}:{items:first,next_cursor:first.at(-1).job_id});});
    await page.reload();await page.getByRole('combobox',{name:'生产任务',exact:true}).waitFor();
    assert.equal(await page.getByRole('combobox',{name:'生产任务',exact:true}).locator('option').count(),51);assert.equal(pages,2);
    await page.getByText('模拟预设工艺',{exact:true}).click();
    assert.equal(await page.getByRole('textbox',{name:'生产批次',exact:true}).inputValue(),'LATEST');
    await page.getByRole('combobox',{name:'生产任务',exact:true}).selectOption(first[0].job_id);
    assert.equal(await page.getByRole('textbox',{name:'生产批次',exact:true}).inputValue(),'B0');
  }finally{await fixture.close();}
});
