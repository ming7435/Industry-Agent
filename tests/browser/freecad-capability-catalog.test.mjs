import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond} from './helpers/center-fixture.mjs';
test('production page exposes verified adapters and explicitly unadapted installed workbenches',async()=>{
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from './production-cad/ProductionCadWorkspace.jsx';createRoot(document.getElementById('root')).render(<Workspace/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/capabilities'))return respond(route,{enabled:true,items:[
      {capability_id:'create_primitive',module:'Part',installed:true,web_adapter:true,manual_verified:true,ai_verified:false},
      {capability_id:'workbench:FEM',module:'FEM',installed:true,web_adapter:false,manual_verified:false,ai_verified:false,disabled_reason:'此工作台尚未完成网页命令适配'}]});
    if(path==='/api/team/me')return respond(route,{user:{user_id:'USER-a'}});
    return respond(route,{items:[],next_cursor:''});
  });
  try {
    await page.goto(fixture.base);await page.getByText('高级功能',{exact:true}).click();await page.getByText('FreeCAD 功能与接入状态',{exact:true}).click();
    await page.getByText('FEM',{exact:true}).waitFor();
    assert.match(await page.getByRole('region',{name:'FreeCAD 能力目录'}).textContent(),/已验证可用/);
    assert.match(await page.getByRole('region',{name:'FreeCAD 能力目录'}).textContent(),/待接入/);
    assert.equal(await page.getByRole('button',{name:'运行 FEM'}).count(),0);
  }finally{await fixture.close();}
});
