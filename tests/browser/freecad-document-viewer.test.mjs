import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));let server,browser,base;
const snapshot={document_id:'DOC-a',revision:1,objects:[{object_id:'OBJ-a',visible:true,geometry:{mesh:'OBJ-a.stl'}}],artifacts:[{name:'OBJ-a.stl'}]};
before(async()=>{
  const {build}=await import(pathToFileURL(resolve(root,'frontend/monitor-react/node_modules/esbuild/lib/main.js'))),{chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
  const compiled=await build({stdin:{loader:'jsx',resolveDir:resolve(root,'frontend/monitor-react/src/app/production-cad'),contents:`import React from 'react';import{createRoot}from'react-dom/client';import Viewer from './DocumentViewer.jsx';function App(){const[snapshot,setSnapshot]=React.useState(${JSON.stringify(snapshot)}),[selected,setSelected]=React.useState('');window.changeSnapshot=setSnapshot;return <><Viewer snapshot={snapshot} selectedObjectId={selected} onSelect={setSelected}/><p id="selection">{selected}</p></>};createRoot(document.getElementById('root')).render(<App/>);`},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}});
  server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html;charset=utf-8');res.end(req.url==='/app.js'?compiled.outputFiles[0].text:'<meta charset="utf-8"><style>.cad-document-viewport{height:400px;width:600px}</style><div id="root"></div><script src="/app.js"></script>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
const vertices=[[0,0,0],[40,0,0],[40,20,0],[0,20,0],[0,0,10],[40,0,10],[40,20,10],[0,20,10]];
const stl='solid box\n'+[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].map(face=>'facet normal 0 0 1\nouter loop\n'+face.map(i=>'vertex '+vertices[i].join(' ')).join('\n')+'\nendloop\nendfacet').join('\n')+'\nendsolid box';
test('real WebGL viewer loads per-object artifact, picks UUID and supports camera modes',async()=>{
  const page=await browser.newPage();page.setDefaultTimeout(7000);try {
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/artifacts/**',r=>r.fulfill({contentType:'model/stl',body:stl}));await page.goto(base);
    await page.getByText('已加载 1 个几何对象',{exact:false}).waitFor();
    await page.getByRole('button',{name:'正交视图',exact:true}).click();await page.getByRole('button',{name:'顶视图',exact:true}).click();await page.getByRole('button',{name:'适应视图',exact:true}).click();
    const box=await page.getByRole('img',{name:'FreeCAD 文档三维视图',exact:true}).boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.locator('#selection').filter({hasText:'OBJ-a'}).waitFor();
    await page.getByRole('button',{name:'透视视图',exact:true}).click();assert.deepEqual(errors,[]);
    await page.evaluate(()=>document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await page.getByText('WebGL 上下文已丢失',{exact:false}).waitFor();
  }finally{await page.close();}
});
test('new revision replaces the scene and corrupt mesh yields a visible error',async()=>{
  const page=await browser.newPage();try {
    await page.route('**/artifacts/**',r=>r.fulfill({contentType:'model/stl',body:new URL(r.request().url()).pathname.includes('/snapshots/2/')?'invalid':stl}));await page.goto(base);await page.getByText('已加载 1 个几何对象',{exact:false}).waitFor();
    await page.evaluate(s=>window.changeSnapshot({...s,revision:2}),snapshot);await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/STL|网格/);
  }finally{await page.close();}
});
