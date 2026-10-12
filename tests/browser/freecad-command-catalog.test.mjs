import test from 'node:test';import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond} from './helpers/center-fixture.mjs';
test('full native catalog retains large command sets, searches all workbenches, and does not execute merely selecting a command',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Catalog from './production-cad/CommandCatalog.jsx';createRoot(document.getElementById('root')).render(<Catalog actorId="USER-a" onPrimitive={kind=>document.querySelector('#result').textContent=kind}/>);document.body.insertAdjacentHTML('beforeend','<output id="result"></output>');`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(7000);const posts=[];
  const commands=Array.from({length:800},(_,i)=>({id:'Part_Test'+i,label:'命令'+i,workbench_id:'PartWorkbench',execution:'not_adapted',action:null,disabled_reason:'尚未适配'}));
  commands.push({id:'Part_Box',label:'长方体',workbench_id:'PartWorkbench',execution:'adapted',action:{type:'create_primitive',primitive_type:'box'}});
  commands.push({id:'Sketcher_NewSketch',label:'新建草图',workbench_id:'SketcherWorkbench',execution:'not_adapted',action:null,disabled_reason:'尚未适配'});
  const catalog={current:true,commands,command_count:802,workbenches:[{id:'PartWorkbench',label:'Part',installed:true,command_count:801},{id:'SketcherWorkbench',label:'Sketcher',installed:true,command_count:1},{id:'RobotWorkbench',label:'Robot',installed:true,command_count:0}]};
  await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;if(route.request().method()==='POST'){posts.push(route.request().postDataJSON());return respond(route,{job_id:'JOB-catalog',state:'accepted'},202);}if(path.includes('/jobs/'))return respond(route,{job_id:'JOB-catalog',state:'completed'});return respond(route,catalog);});
  try{
    await page.goto(fixture.base);await page.getByText('完整命令目录',{exact:false}).click();
    await page.getByLabel('搜索全部 FreeCAD 命令').fill('Test799');await page.getByRole('button',{name:/命令799/}).click();
    assert.equal(posts.length,0);
    await page.getByLabel('搜索全部 FreeCAD 命令').fill('长方体');await page.getByRole('button',{name:/长方体 · Part_Box/}).click();
    await page.getByRole('button',{name:'配置此操作'}).click();assert.equal(await page.locator('#result').textContent(),'box');assert.equal(posts.length,0);
    await page.getByLabel('FreeCAD 工作台').selectOption('SketcherWorkbench');await page.getByLabel('搜索全部 FreeCAD 命令').fill('');
    await page.getByRole('button',{name:/新建草图 · Sketcher_NewSketch/}).click();assert.equal(await page.getByRole('button',{name:'配置此操作'}).count(),0);
    await page.getByRole('button',{name:'通过 MCP 读取工作台'}).click();await page.getByText('MCP 目录读取完成',{exact:false}).waitFor();
    assert.equal(posts.length,1);assert.equal(posts[0].workbench_id,'SketcherWorkbench');assert.ok(posts[0].request_id);assert.equal(Object.hasOwn(posts[0],'code'),false);
    assert.equal(await page.getByRole('option',{name:/Robot/}).count(),1);
  }finally{await fixture.close();}
});
test('command-family groups remain filterable without trying to activate a nonexistent native workbench',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Catalog from './production-cad/CommandCatalog.jsx';createRoot(document.getElementById('root')).render(<Catalog actorId="USER-a"/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);const posts=[];
  await page.route('**/api/**',route=>{if(route.request().method()==='POST'){posts.push(route.request().postDataJSON());return respond(route,{job_id:'JOB-general',state:'accepted'},202);}if(route.request().url().includes('/jobs/'))return respond(route,{state:'completed'});return respond(route,{commands:[{id:'Std_Copy',label:'复制',workbench_id:'GeneralWorkbench',action:null}],command_count:1,current:true,workbenches:[{id:'GeneralWorkbench',label:'通用命令',installed:false,command_count:1}]});});
  try{await page.goto(fixture.base);await page.getByLabel('FreeCAD 工作台').selectOption('GeneralWorkbench');await page.getByRole('button',{name:'通过 MCP 读取工作台'}).click();await page.getByText('MCP 目录读取完成').waitFor();assert.equal(posts[0].workbench_id,'');}finally{await fixture.close();}
});
test('a delayed initial catalog response cannot overwrite a fresh discovery result',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Catalog from './production-cad/CommandCatalog.jsx';createRoot(document.getElementById('root')).render(<Catalog actorId="USER-a"/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);let reads=0,release;
  await page.route('**/api/**',route=>{const req=route.request(),path=new URL(req.url()).pathname;if(req.method()==='POST')return respond(route,{job_id:'JOB-fresh',state:'accepted'},202);if(path.includes('/jobs/'))return respond(route,{state:'completed'});reads++;if(reads===1)return new Promise(resolve=>{release=()=>respond(route,{commands:[],command_count:0,workbenches:[],current:false}).then(resolve);});return respond(route,{commands:[{id:'Part_Box',label:'Cube'}],command_count:1,workbenches:[],current:true});});
  try{
    await page.goto(fixture.base);await page.getByRole('button',{name:'通过 MCP 读取工作台'}).click();await page.getByText('MCP 目录读取完成').waitFor();
    await page.getByText('FreeCAD MCP · 1 条已发现命令',{exact:true}).waitFor();await release();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await page.getByText('FreeCAD MCP · 1 条已发现命令',{exact:true}).count(),1);
  }finally{await fixture.close();}
});
test('unknown discovery can be queried to completion without submitting another native job',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Catalog from './production-cad/CommandCatalog.jsx';createRoot(document.getElementById('root')).render(<Catalog actorId="USER-a"/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);let posts=0,queries=0;
  await page.route('**/api/**',route=>{const req=route.request(),path=new URL(req.url()).pathname;if(req.method()==='POST'){posts++;return respond(route,{job_id:'JOB-original',state:'accepted'},202);}if(path.includes('/jobs/')){queries++;return respond(route,{job_id:'JOB-original',state:queries===1?'outcome_unknown':'completed'});}return respond(route,{commands:[],workbenches:[],current:true,command_count:0});});
  try{
    await page.goto(fixture.base);await page.getByRole('button',{name:'通过 MCP 读取工作台'}).click();
    await page.getByText('发现结果待核对，不会重新执行').waitFor();
    await page.getByRole('button',{name:'查回发现任务'}).click();
    await page.getByText('MCP 目录读取完成').waitFor();assert.equal(posts,1);assert.equal(queries,2);
    assert.equal(await page.getByRole('button',{name:'通过 MCP 读取工作台'}).isDisabled(),false);
  }finally{await fixture.close();}
});
test('catalog can be discovered without an open model, but cannot open a model operation before one exists',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Catalog from './production-cad/CommandCatalog.jsx';createRoot(document.getElementById('root')).render(<Catalog actorId="USER-a" canConfigure={false}/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);
  await page.route('**/api/**',route=>respond(route,{commands:[{id:'Part_Box',label:'Cube',execution:'adapted',action:{type:'create_primitive',primitive_type:'box'}}],command_count:1,workbenches:[],current:true}));
  try{await page.goto(fixture.base);await page.getByText('完整命令目录 · 搜索与参数入口').click();await page.getByRole('button',{name:/Cube · Part_Box/}).click();assert.equal(await page.getByRole('button',{name:'通过 MCP 读取工作台'}).isDisabled(),false);assert.equal(await page.getByRole('button',{name:'配置此操作'}).isDisabled(),true);}finally{await fixture.close();}
});
test('a selected adapted command loses its action immediately when the discovered runtime becomes stale',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Catalog from './production-cad/CommandCatalog.jsx';createRoot(document.getElementById('root')).render(<Catalog actorId="USER-a"/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);let read=0;
  await page.route('**/api/**',route=>{
    if(route.request().method()==='POST')return respond(route,{job_id:'JOB-update',state:'accepted'},202);
    if(route.request().url().includes('/jobs/'))return respond(route,{state:'completed'});
    read++;return respond(route,{current:read===1,commands:[{id:'Part_Box',label:'Cube',execution:read===1?'adapted':'discovery_stale',action:read===1?{type:'create_primitive',primitive_type:'box'}:null,disabled_reason:'目录待更新'}],command_count:1,workbenches:[]});
  });
  try{
    await page.goto(fixture.base);await page.getByText('完整命令目录 · 搜索与参数入口').click();await page.getByRole('button',{name:/Cube · Part_Box/}).click();assert.equal(await page.getByRole('button',{name:'配置此操作'}).count(),1);
    await page.getByRole('button',{name:'通过 MCP 读取工作台'}).click();await page.getByText('MCP 目录读取完成').waitFor();
    assert.equal(await page.getByRole('button',{name:'配置此操作'}).count(),0);
  }finally{await fixture.close();}
});
