import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond} from './helpers/center-fixture.mjs';

async function setup({delayedCapabilities=false}={}){
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from './production-cad/ProductionCadWorkspace.jsx';createRoot(document.getElementById('root')).render(<Workspace/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);const posts=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));let release;
  const capabilities={enabled:true,version_fingerprint:'test-version',items:[{capability_id:'create_primitive',module:'Part',installed:true,web_adapter:true,manual_verified:true,ai_verified:false}]};
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()==='POST'){posts.push({path,...req.postDataJSON()});return respond(route,{status:'needs_input',questions:['请补充尺寸']},202);}
    if(path.endsWith('/capabilities'))return delayedCapabilities?new Promise(done=>{release=()=>respond(route,capabilities).then(done);}):respond(route,capabilities);
    if(path.endsWith('/status'))return respond(route,{connected:true,tools:[{name:'execute_code'}]});
    if(path==='/api/team/me')return respond(route,{user:{user_id:'USER-simple'}});
    if(path.endsWith('/catalog'))return respond(route,{commands:[],workbenches:[],command_count:0,current:true});
    return respond(route,{items:[],next_cursor:''});
  });
  await page.goto(fixture.base);
  return {fixture,page,posts,errors,release:()=>release()};
}

test('default entry is a single simple modelling form even when native document editing is available',async()=>{
  const {fixture,page,posts}=await setup();
  try{
    await page.getByLabel('描述零件、尺寸和设计要求').waitFor();
    await page.getByRole('button',{name:'生成 3D 模型',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'原生文档编辑',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'中文与规格生成',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'通过 MCP 读取工作台'}).count(),0);
    assert.equal(await page.getByLabel('结构化参数（JSON，优先于文字描述）').isVisible(),false);
    assert.equal(await page.getByText('高级功能',{exact:true}).isVisible(),true);
    assert.equal(posts.length,0);
  }finally{await fixture.close();}
});
test('late capability discovery does not change screens or erase a requirement being typed',async()=>{
  const {fixture,page,posts,release}=await setup({delayedCapabilities:true});
  try{
    const requirement=page.getByLabel('描述零件、尺寸和设计要求');await requirement.fill('长80mm、宽60mm、厚20mm的底板');
    await release();await page.getByText('高级功能',{exact:true}).click();
    await page.getByRole('button',{name:'打开专业文档编辑器',exact:true}).waitFor();
    assert.equal(await requirement.inputValue(),'长80mm、宽60mm、厚20mm的底板');assert.equal(posts.length,0);
  }finally{await fixture.close();}
});
test('quick part choices fill an editable draft without running MCP or hiding template parameters',async()=>{
  const {fixture,page,posts}=await setup();
  try{
    const quick=page.getByRole('group',{name:'常用零件'});
    await quick.getByRole('button',{name:'圆柱',exact:true}).click();
    assert.equal(await page.getByLabel('零件名称',{exact:true}).inputValue(),'圆柱');
    assert.match(await page.getByLabel('描述零件、尺寸和设计要求').inputValue(),/直径20mm.*长30mm/);assert.equal(posts.length,0);
    await quick.getByRole('button',{name:'安装底板',exact:true}).click();
    assert.equal(await page.getByLabel('主体 · 长方体 · 长度',{exact:true}).inputValue(),'100');
    assert.equal(await page.getByRole('button',{name:'生成 3D 模型',exact:true}).isDisabled(),true);
    assert.equal(posts.length,0);
  }finally{await fixture.close();}
});
test('professional editor remains reachable explicitly and returning restores the simple draft',async()=>{
  const {fixture,page,posts,errors}=await setup();
  try{
    await page.getByLabel('描述零件、尺寸和设计要求').fill('直径24mm的球体');
    await page.getByText('高级功能',{exact:true}).click();
    const identityRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/team/me');
    await page.getByRole('button',{name:'打开专业文档编辑器',exact:true}).click();
    assert.equal((await identityRead).method(),'GET','Opening the editor must only read the authenticated identity');
    await page.getByRole('region',{name:'个人 FreeCAD 文档'}).waitFor();await page.getByLabel('新文档零件名称').waitFor();
    await page.getByRole('button',{name:'返回简单建模',exact:true}).click();
    assert.equal(await page.getByLabel('描述零件、尺寸和设计要求').inputValue(),'直径24mm的球体');
    assert.equal(await page.getByRole('button',{name:'生成 3D 模型',exact:true}).isVisible(),true);
    assert.equal(posts.length,0);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
