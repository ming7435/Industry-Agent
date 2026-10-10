import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

const runId='FC-'+'a'.repeat(64);
const record={run_id:runId,status:'completed',part_name:'法兰轴套',part_number:'04898',created_at:1,
  validation:{valid:true,step_roundtrip:true,solid_count:1},
  spec:{units:'mm',operations:[{type:'cylinder',mode:'add',diameter:20,length:10}]}};
const basis={...record,digest:'verified',parameters:[{key:'operations.0.length',name:'主体 · 长度',expected:'10',unit:'mm',kind:'number'}]};
const savedBatch={batch_id:'SIM-BATCH-existing',request_id:'existing-request',design_run_id:runId,
  simulation:true,synthetic:true,status:'partial',basis,station:{measurement_device_id:'RENISHAW-EQUATOR300-001'},
  counts:{total:10,qualified:9,unqualified:0,determinate:9,pending:1,review:0},rates:{qualified:100,defect:0,coverage:90},
  samples:[],issues:[],recommendations:[]};

async function setup({loggedIn=false,hasModel=true,cadUnavailable=false}={}) {
  const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();
  const reads=[],writes=[],errors=[];
  page.setDefaultTimeout(5000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({runId,hasModel})=>{
    if(hasModel){
      sessionStorage.setItem('freecad.active-run',JSON.stringify({run_id:runId,part_name:'会话旧名',part_number:'04898',draft_part_name:'未提交草稿'}));
      sessionStorage.setItem('freecad.design-versions',JSON.stringify([{run_id:runId,status:'completed',created_at:1,part_name:'会话旧名'}]));
    }
    sessionStorage.setItem('production.virtual.pending:U1:archived','saved-factory-record');
  },{runId,hasModel});
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    reads.push(path);
    if(!['GET','HEAD'].includes(req.method()))writes.push(path);
    if(path==='/api/team/me')return respond(route,loggedIn?{user:{user_id:'U1',role:'technician'}}:{detail:'请先登录'},loggedIn?200:401);
    if(path==='/api/cad/freecad/runs/'+runId)return cadUnavailable?respond(route,{detail:'建模记录暂不可用'},503):respond(route,record);
    if(path==='/api/quality/simulation/capabilities')return respond(route,{enabled:true,device_id:'RENISHAW-EQUATOR300-001',sample_count:10});
    if(path==='/api/quality/simulation/designs')return respond(route,{items:[]});
    if(path==='/api/quality/simulation/designs/'+runId)return respond(route,{basis,latest:savedBatch});
    return respond(route,{items:[],devices:[],runs:[],runner:{last_error:''}});
  });
  await page.goto(fixture.base+'/?view=quality&design_run_id=FC-old');
  return {fixture,page,reads,writes,errors};
}

function noFactoryOrSwitches(page) {
  return Promise.all([
    page.getByRole('navigation',{name:'质检来源',exact:true}).count(),
    page.getByRole('heading',{name:'工厂产出检测',exact:true}).count(),
    page.getByRole('button',{name:'工厂产出检测',exact:true}).count(),
    page.getByRole('button',{name:'比对仪数值演示',exact:true}).count(),
    page.getByRole('combobox',{name:'生产设计版本',exact:true}).count(),
  ]);
}

test('quality sidebar retains part detection rather than factory output, across reentry and reload',async()=>{
  const {fixture,page,reads,writes,errors}=await setup();
  try {
    const entry=page.getByRole('button',{name:'质检系统',exact:true});await entry.waitFor();
    await page.waitForFunction(()=>document.querySelector('.quality-workspace,.pq-workspace'));
    assert.equal(await page.getByRole('region',{name:'质检系统',exact:true}).count(),1);
    await page.getByRole('heading',{name:'质量检测',exact:true}).waitFor();
    await page.getByText('04898',{exact:true}).waitFor();
    const selector=page.getByRole('combobox',{name:'零件名称',exact:true});
    assert.equal(await selector.locator('option:checked').textContent(),'法兰轴套');
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.deepEqual(await noFactoryOrSwitches(page),[0,0,0,0,0]);
    await page.getByRole('button',{name:'日志系统',exact:true}).click();
    await page.getByRole('heading',{name:'日志系统',exact:true}).waitFor();await entry.click();
    await page.getByText('04898',{exact:true}).waitFor();await page.reload();await page.getByText('04898',{exact:true}).waitFor();
    assert.equal(await selector.locator('option:checked').textContent(),'法兰轴套');
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('freecad.active-run')).draft_part_name),'未提交草稿');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('production.virtual.pending:U1:archived')),'saved-factory-record');
    assert.equal(reads.some(path=>path.includes('/production/virtual/')||path.includes('/quality/simulation/')),false);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('restored quality entry reads the original saved inspection without mutating either history',async()=>{
  const {fixture,page,reads,writes,errors}=await setup({loggedIn:true});
  try {
    const results=page.getByRole('region',{name:'检测结果',exact:true});
    await results.getByText('100.00%',{exact:true}).waitFor();
    assert.deepEqual(await results.locator('.quality-rate-fields dd').allTextContents(),['100.00%','0.00%','90.00%']);
    assert.match(await results.textContent(),/SIM-BATCH-existing/);
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),false);
    assert.deepEqual(await noFactoryOrSwitches(page),[0,0,0,0,0]);
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('freecad.design-versions'))[0].run_id),runId);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('production.virtual.pending:U1:archived')),'saved-factory-record');
    assert.equal(reads.some(path=>path.includes('/production/virtual/')),false);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('quality without a completed model stays empty rather than returning to factory output',async()=>{
  const {fixture,page,reads,writes,errors}=await setup({hasModel:false});
  try {
    await page.getByRole('heading',{name:'质量检测',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('#quality-part-name option')?.textContent==='暂无已完成零件');
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.deepEqual(await noFactoryOrSwitches(page),[0,0,0,0,0]);
    assert.equal(reads.some(path=>path.includes('/production/virtual/')||path.includes('/cad/')),false);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('unavailable model does not substitute factory output or clear stored CAD references',async()=>{
  const {fixture,page,reads,writes,errors}=await setup({cadUnavailable:true});
  try {
    await page.getByRole('heading',{name:'质量检测',exact:true}).waitFor();
    await page.getByText('建模记录暂不可用',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'开始检测',exact:true}).isDisabled(),true);
    assert.deepEqual(await page.locator('.quality-rate-fields dd').allTextContents(),['—','—','—']);
    assert.deepEqual(await noFactoryOrSwitches(page),[0,0,0,0,0]);
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('freecad.active-run')).run_id),runId);
    assert.equal(reads.some(path=>path.includes('/production/virtual/')),false);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});
