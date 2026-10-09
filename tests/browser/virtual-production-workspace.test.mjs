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
