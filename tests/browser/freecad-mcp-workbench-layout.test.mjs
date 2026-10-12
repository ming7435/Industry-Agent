import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'node:http';import {fileURLToPath,pathToFileURL} from 'node:url';import {resolve} from 'node:path';import {mkdirSync} from 'node:fs';
const root=fileURLToPath(new URL('../../',import.meta.url));
test('white MCP workspace keeps tree and properties left, real 3D center, tasks right, with no embedded desktop frame',async()=>{
  const {build}=await import(pathToFileURL(resolve(root,'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
  const bundle=await build({stdin:{loader:'jsx',resolveDir:resolve(root,'frontend/monitor-react/src/app/production-cad'),contents:`import React from 'react';import{createRoot}from'react-dom/client';import './productionCad.css';import Workspace from './DocumentWorkspace.jsx';createRoot(document.getElementById('root')).render(<Workspace actorId="USER-layout" initialDocumentId="DOC-layout"/>);`},bundle:true,write:false,outfile:'app.js',format:'iife',define:{'process.env.NODE_ENV':'"production"'}});
  const js=bundle.outputFiles.find(f=>f.path.endsWith('.js')).text,css=bundle.outputFiles.find(f=>f.path.endsWith('.css')).text;
  const server=createServer((req,res)=>{const kind=req.url==='/app.js'?'text/javascript':req.url==='/app.css'?'text/css':'text/html;charset=utf-8';res.setHeader('Content-Type',kind);res.end(req.url==='/app.js'?js:req.url==='/app.css'?css:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>');});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1520,height:1100}});page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const object={object_id:'OBJ-layout',name:'Box',label:'安装底板',type_id:'Part::Box',visible:true,geometry:{mesh:'OBJ-layout.stl'},parent_ids:[],dependency_ids:[],editable_commands:['set_label','set_primitive_dimensions','set_placement','set_visibility'],properties:[{name:'length',value:40,editable:true},{name:'width',value:20,editable:true},{name:'height',value:10,editable:true}]};
  const head={document_id:'DOC-layout',owner_user_id:'USER-layout',part_name:'安装底板',part_number:'00123',revision:1,published_revision:1,published_version:1};
  const snapshot={document_id:'DOC-layout',revision:1,objects:[object],product_root_ids:['OBJ-layout'],artifacts:[{name:'OBJ-layout.stl'}]};
  const vertices=[[0,0,0],[40,0,0],[40,20,0],[0,20,0],[0,0,10],[40,0,10],[40,20,10],[0,20,10]];
  const stl='solid box\n'+[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].map(face=>'facet normal 0 0 1\nouter loop\n'+face.map(i=>'vertex '+vertices[i].join(' ')).join('\n')+'\nendloop\nendfacet').join('\n')+'\nendsolid box';
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;let body=head;
    if(path.endsWith('.stl'))return route.fulfill({contentType:'model/stl',body:stl});
    if(path.endsWith('/documents'))body={items:[head],next_cursor:''};
    else if(path.endsWith('/catalog'))body={commands:[],command_count:0,current:true,workbenches:[{id:'PartWorkbench',label:'Part',installed:true,command_count:0},{id:'SketcherWorkbench',label:'Sketcher',installed:true,command_count:0}]};
    else if(path.includes('/snapshots/'))body=snapshot;
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  });
  try{
    await page.goto(base);await page.getByText('已加载 1 个几何对象',{exact:false}).waitFor();await page.getByRole('treeitem',{name:/安装底板/}).click();
    const left=await page.locator('.cad-document-combo').boundingBox(),center=await page.locator('.cad-document-stage').boundingBox(),right=await page.getByRole('complementary',{name:'建模任务'}).boundingBox();
    assert.ok(left.x<center.x&&center.x<right.x);assert.ok(left.x+left.width<=center.x+2);assert.ok(center.x+center.width<=right.x+2);
    assert.equal(await page.locator('iframe').count(),0);
    assert.equal(await page.locator('.cad-mcp-workbench').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
    await page.getByRole('menuitem',{name:'文件',exact:true}).click();await page.getByRole('menuitem',{name:'新建 / 复制文档'}).click();assert.equal(await page.getByLabel('新文档零件名称').isVisible(),true);
    await page.getByLabel('新文档零件名称').press('Escape');
    mkdirSync(resolve(root,'.runtime/catalog-ui-evidence'),{recursive:true});await page.screenshot({path:resolve(root,'.runtime/catalog-ui-evidence/desktop.png'),fullPage:true});
    await page.setViewportSize({width:560,height:1000});await page.screenshot({path:resolve(root,'.runtime/catalog-ui-evidence/mobile.png'),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(done=>server.close(done));}
});
