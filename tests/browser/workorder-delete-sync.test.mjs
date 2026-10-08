import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {respond} from './helpers/center-fixture.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const actor={user_id:'U1',username:'隔离维修人员',role:'technician',primary_device_id:'M1'};
const plan={plan_id:'P1',device_id:'M1',event_id:'E1',alarm_code:'700006',repair_target:'刀塔旋转超时',
  repair_steps:['原步骤'],workorder_ready:true,diagnosis:{device_id:'M1',fault:'刀塔旋转超时',alarm_code:'700006'}};
const initial={workorder_id:'W1',device_id:'M1',event_id:'E1',alarm_code:'700006',plan_id:'P1',title:'刀塔维修',
  status:'in_progress',assignee:'U1',assignee_name:actor.username,maintenance_plan_snapshot:plan,diagnosis_snapshot:plan.diagnosis};
let fixture;
before(async()=>{
  const {build}=await import(pathToFileURL(resolve(root,'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
  const productionBundle=process.env.MONITOR_TEST_PRODUCTION_BUNDLE==='1';
  const compiled=productionBundle?null:await build({stdin:{resolveDir:resolve(root,'frontend/monitor-react/src/app'),contents:"import React from 'react';import{createRoot}from'react-dom/client';import{App}from'./App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));"},
    bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty','.png':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}});
  const server=createServer(async(req,res)=>{
    if(productionBundle){
      const path=new URL(req.url,'http://isolated-test').pathname;
      const asset=/^\/assets\/[\w.-]+$/.test(path);
      try{
        const body=await readFile(resolve(root,'frontend/monitor',asset?path.slice(1):'index.html'));
        const mime=path.endsWith('.js')?'application/javascript':path.endsWith('.css')?'text/css':path.endsWith('.png')?'image/png':'text/html;charset=utf-8';
        res.writeHead(200,{'Content-Type':mime});res.end(body);
      }catch{res.writeHead(404);res.end();}
      return;
    }
    res.writeHead(200,{'Content-Type':req.url==='/component.js'?'application/javascript':'text/html;charset=utf-8'});
    res.end(req.url==='/component.js'?compiled.outputFiles[0].text:'<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script>');
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
  fixture={browser,base:`http://127.0.0.1:${server.address().port}`,close:async()=>{await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));}};
});
after(async()=>{await fixture?.close();});
const frame=page=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
const nav=(page,name)=>page.getByRole('navigation',{name:'功能导航'}).getByRole('button',{name,exact:true});
async function open({legacyHidden=false,legacyUrl=false}={}){
  const context=await fixture.browser.newContext(),page=await context.newPage();page.setDefaultTimeout(3000);await page.clock.install();
  let order={...structuredClone(initial),...(legacyHidden?{deleted_at:'2026-09-28T14:00:00Z'}:{})},deleted=false,holdPlans=false,holdOrders=false,heldOrder;
  const writes=[],reads=[],errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
  await page.route('**/drawings/**',route=>route.abort());
  await page.route('**/api/**',route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname;
    if(req.method()==='DELETE'&&path==='/api/workorders/W1'){writes.push(path);deleted=true;order=null;return respond(route,{deleted:true,workorder_id:'W1',deleted_plan_ids:['P1'],mode:'permanent-delete'});}
    if(req.method()==='POST'&&path==='/api/workorders/W1/action'){writes.push(path);order={...order,status:'completed'};return respond(route,{workorder:order,machine_control:{state:'blocked',reason:'自动复机控制未启用'}});}
    if(req.method()!=='GET'){writes.push('UNEXPECTED:'+path);return route.abort();}
    reads.push(url.pathname+url.search);
    if(path==='/api/team/me')return respond(route,{user:actor});
    if(path==='/api/team/devices'||path==='/api/team/reminders')return respond(route,{items:[]});
    if(path==='/api/team/line')return respond(route,{state:'stopped'});
    if(path==='/api/monitor/snapshot')return respond(route,{device_id:'M1',devices:[{device_id:'M1',name:'隔离设备',current_sample:{device_id:'M1',alarm_code:'700006',status:'alarm'}}],diagnosis:{pipeline:{event:{device_id:'M1',event_id:'E1',alarm_code:'700006'},maintenance_plan:plan}}});
    if(path==='/api/maintenance/plans'){if(holdPlans)return;return respond(route,{items:deleted?[]:[plan],deleted_plan_ids:deleted?['P1']:[],history:{status:'ready'}});}
    if(path==='/api/workorders'){if(holdOrders){heldOrder=route;return;}return respond(route,{items:deleted||(legacyHidden&&!url.searchParams.has('include_deleted'))?[]:[order],deleted_plan_ids:deleted?['P1']:[]});}
    return respond(route,{items:[]});
  });
  await page.goto(fixture.base+'/?view=maintenance'+(legacyUrl?'&include_deleted=true':''),{waitUntil:'domcontentloaded'});await page.locator('.maintenance-plan-list-row').waitFor();
  return {context,page,writes,reads,errors,setHoldPlans:v=>{holdPlans=v;},setHoldOrders:v=>{holdOrders=v;},getHeldOrder:()=>heldOrder};
}

test('处理中工单可以删除，返回维修方案时立即移除关联方案，旧轮询回包不复活工单',async()=>{
  const view=await open();
  try{
    await nav(view.page,'工单系统').click();await view.page.locator('.workorder-titlebar').waitFor();
    view.setHoldOrders(true);await view.page.clock.runFor(5100);await frame(view.page);
    assert.ok(view.getHeldOrder());
    const button=view.page.getByRole('button',{name:'删除工单',exact:true});assert.equal(await button.isEnabled(),true);
    await button.click();await view.page.locator('.workorder-titlebar').waitFor({state:'detached'});
    await respond(view.getHeldOrder(),{items:[initial]});await frame(view.page);
    assert.equal(await view.page.locator('.workorder-titlebar').count(),0);
    assert.ok(!(await view.page.locator('.workorder-page').innerText()).includes('W1'));
    view.setHoldPlans(true);await nav(view.page,'维修方案').click();await frame(view.page);
    assert.equal(await view.page.locator('.maintenance-plan-list-row').count(),0);
    assert.equal(await view.page.getByRole('button',{name:'进入工单处理',exact:true}).count(),0);
    assert.deepEqual(view.writes,['/api/workorders/W1']);assert.deepEqual(view.errors,[]);
  }finally{await view.context.close();}
});

test('维修结果提交后，缓存的维修方案立即显示工单完成状态，无须刷新页面',async()=>{
  const view=await open();
  try{
    await nav(view.page,'工单系统').click();await view.page.locator('.workorder-titlebar').waitFor();
    await view.page.getByLabel('处理说明',{exact:true}).fill('已完成实际维修与复测');
    await view.page.getByRole('button',{name:'确认维修完成并申请复机',exact:true}).click();
    await view.page.locator('.workorder-titlebar').getByText('已完成',{exact:true}).waitFor();
    await view.page.getByText('维修已完成，复机申请未通过：自动复机控制未启用',{exact:true}).waitFor();
    await view.page.clock.runFor(5100);await frame(view.page);
    assert.equal(await view.page.locator('.workorder-status-badge').innerText(),'已完成');
    assert.match(await view.page.locator('.machine-control-result').innerText(),/维修已完成，复机申请未通过/);
    view.setHoldPlans(true);view.setHoldOrders(true);await nav(view.page,'维修方案').click();await frame(view.page);
    const entry=view.page.getByRole('region',{name:'方案工单处理',exact:true});
    assert.ok((await entry.innerText()).includes('已完成'));
    assert.ok(!(await entry.innerText()).includes('处理中'));
    assert.deepEqual(view.writes,['/api/workorders/W1/action']);assert.deepEqual(view.errors,[]);
  }finally{await view.context.close();}
});

test('真正删除后刷新工单仍为空，不提供已删除记录入口',async()=>{
  const view=await open();
  try{
    await nav(view.page,'工单系统').click();await view.page.locator('.workorder-titlebar').waitFor();
    await view.page.getByRole('button',{name:'删除工单',exact:true}).click();
    await view.page.locator('.workorder-titlebar').waitFor({state:'detached'});
    assert.equal(await view.page.getByLabel('查看旧版隐藏记录',{exact:true}).count(),0);
    await view.page.getByRole('button',{name:'刷新工单',exact:true}).click();
    await frame(view.page);await view.page.clock.runFor(5100);await frame(view.page);
    assert.equal(await view.page.locator('.workorder-titlebar').count(),0);
    await nav(view.page,'维修方案').click();await frame(view.page);
    assert.equal(await view.page.locator('.maintenance-plan-list-row').count(),0);
    assert.deepEqual(view.writes,['/api/workorders/W1']);assert.deepEqual(view.errors,[]);
  }finally{await view.context.close();}
});

test('旧网址参数不能恢复隐藏记录，维修方案和工单都只请求当前工单',async()=>{
  const view=await open({legacyHidden:true,legacyUrl:true});
  try{
    await nav(view.page,'工单系统').click();
    assert.equal(await view.page.getByLabel('查看旧版隐藏记录',{exact:true}).count(),0);
    await view.page.clock.runFor(5100);await frame(view.page);
    assert.equal(await view.page.locator('.workorder-titlebar').count(),0);
    assert.ok(view.reads.some(path=>path.startsWith('/api/workorders')));
    assert.ok(view.reads.filter(path=>path.startsWith('/api/workorders')).every(path=>path==='/api/workorders'));
    assert.deepEqual(view.writes,[]);assert.deepEqual(view.errors,[]);
  }finally{await view.context.close();}
});
