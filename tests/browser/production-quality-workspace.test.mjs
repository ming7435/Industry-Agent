import test from 'node:test';import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';import {respond} from './helpers/center-fixture.mjs';
const run='FC-'+'a'.repeat(64),jobId='SIM-JOB-'+'b'.repeat(64),part='SIM-PART-'+'b'.repeat(64);
const output={job_id:jobId,part_id:part,design_run_id:run,design_digest:'d'.repeat(64),program_digest:'e'.repeat(64),output_digest:'f'.repeat(64),
  source:'factory-simulation',simulation_only:true,synthetic:true,units:'mm',profile:{outer_diameter_mm:20.1,length_mm:10,inner_diameter_mm:0}};
const job={job_id:jobId,part_id:part,actor_id:'U1',design_run_id:run,design_digest:output.design_digest,program_digest:output.program_digest,
  status:'completed',sync_status:'confirmed',revision:2,source:'factory-simulation',simulation_only:true,progress:1,batch_id:'A',part_name:'轴套',part_number:'12345',output};
const check={check_id:'SIM-CHECK-'+'c'.repeat(64),job_id:jobId,part_id:part,actor_id:'U1',batch_id:'A',design_run_id:run,design_digest:output.design_digest,
  output_digest:output.output_digest,source:'factory-simulation',simulation_only:true,rule:'virtual_profile_dimensions_v1',status:'fail',
  items:[{key:'outer_diameter_mm',name:'加工区外径',expected:'20',actual:'20.1',difference:'0.1',unit:'mm',status:'fail'}]};
async function setup({loggedIn=true,running=false,lost=false}={}){
  const fixture=await virtualFixture("import React from 'react';import {createRoot} from 'react-dom/client';import Quality from './ProductionQualityWorkspace.jsx';createRoot(document.getElementById('root')).render(<Quality/>);"),page=await fixture.browser.newPage();
  page.setDefaultTimeout(5000);const posts=[],reads=[],errors=[];let inspected=false;page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname;reads.push(path);
    if(path==='/api/team/me')return respond(route,loggedIn?{user:{user_id:'U1',role:'technician'}}:{},loggedIn?200:401);
    const current=running?{...job,status:'running',progress:.5,output:null}:{...job,inspection:inspected?check:null};
    if(path.endsWith('/jobs'))return respond(route,{items:[current],next_cursor:null});
    if(path.endsWith('/quality'))return respond(route,{source:'factory-simulation',simulation_only:true,actor_id:'U1',design_run_id:run,batch_id:'A',
      counts:{total:running?0:1,pass:0,fail:inspected?1:0,pending:inspected?0:1,insufficient_data:0,review:0,determinate:inspected?1:0},rates:{consistent:inspected?0:null,inconsistent:inspected?100:null,coverage:inspected?100:0},items:[]});
    if(path.endsWith('/inspect')){posts.push({path,body:req.postDataJSON()});inspected=true;if(lost)return route.abort('failed');return respond(route,check);}
    if(path===`/api/production/virtual/jobs/${jobId}`)return respond(route,current);
    return respond(route,{detail:'Not found'},404);
  });await page.goto(fixture.base);return {fixture,page,posts,reads,errors};
}
test('factory output is inspected with its immutable design',async()=>{
  const {fixture,page,posts,reads,errors}=await setup();try{
    await page.getByRole('button',{name:'开始检测',exact:true}).click();await page.getByRole('heading',{name:'参数不一致',exact:true}).waitFor();
    assert.equal(posts[0].path,`/api/production/virtual/parts/${part}/inspect`);assert.deepEqual(posts[0].body,{output_digest:output.output_digest});
    assert.match(await page.locator('.pq-comparison').textContent(),/20\.1/);assert.match(await page.locator('.pq-comparison').textContent(),/0\.1/);
    assert.equal(reads.some(x=>x.includes('/cad/')||x.includes('/quality/simulation')),false);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
test('production quality survives missing CAD session history',async()=>{
  const {fixture,page,posts}=await setup();try{await page.locator('.pq-workspace > p').filter({hasText:'12345'}).waitFor();await page.evaluate(()=>sessionStorage.clear());await page.reload();
    await page.getByRole('button',{name:'开始检测',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),false);
    assert.doesNotMatch(await page.locator('body').textContent(),/10 件样本|十件|未提交新零件/);assert.equal(posts.length,0);
  }finally{await fixture.close();}
});
test('unfinished production cannot be inspected and has no invented rate',async()=>{
  const {fixture,page,posts}=await setup({running:true});try{await page.getByText('加工中',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);assert.equal(posts.length,0);
    assert.deepEqual(await page.locator('.pq-rates dd').allTextContents(),['—','—','0%']);
  }finally{await fixture.close();}
});
test('unknown inspection response recovers the saved inspection without repeating POST',async()=>{
  const {fixture,page,posts}=await setup({lost:true});try{await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByRole('heading',{name:'参数不一致',exact:true}).waitFor();assert.equal(posts.length,1);
  }finally{await fixture.close();}
});
test('anonymous production quality does not read another person output',async()=>{
  const {fixture,page,reads,posts}=await setup({loggedIn:false});try{await page.getByText('请先登录账号后查看工厂产出。',{exact:true}).waitFor();
    assert.equal(reads.some(x=>x.includes('/production/')),false);assert.equal(posts.length,0);
  }finally{await fixture.close();}
});
