import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
let browser,server,base;
before(async()=>{
  const {build}=await import(pathToFileURL(resolve(root,'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
  const result=await build({stdin:{loader:'jsx',resolveDir:resolve(root,'frontend/monitor-react/src/app/production-cad'),contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Workspace from './DocumentWorkspace.jsx';createRoot(document.getElementById('root')).render(<Workspace actorId="USER-a" initialDocumentId="DOC-a"/>);`},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"development"'}});
  server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html;charset=utf-8');res.end(req.url==='/app.js'?result.outputFiles[0].text:'<meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();if(server) await new Promise(r=>server.close(r));});
const object=(id,label,type='Part::Box')=>({object_id:id,name:id,label,type_id:type,visible:true,parent_ids:[],dependency_ids:[],geometry:{},read_only_reason:type==='Part::Box'?'':'受规格约束，尺寸只读',editable_commands:type==='Part::Box'?['set_label','set_visibility','set_primitive_dimensions','set_placement']:['set_label','set_visibility'],properties:[{name:'length',value:40,unit:'mm',editable:type==='Part::Box'},{name:'width',value:20,unit:'mm',editable:type==='Part::Box'},{name:'height',value:10,unit:'mm',editable:type==='Part::Box'}]});
async function setup({unknown=false,delayedRefresh=false}={}) {
  const context=await browser.newContext({viewport:{width:1000,height:1000}}),page=await context.newPage();page.setDefaultTimeout(7000);
  let head={document_id:'DOC-a',owner_user_id:'USER-a',part_name:'安装底板',part_number:'00123',revision:1,published_version:null,published_revision:null};
  let snapshot={document_id:'DOC-a',revision:1,objects:[object('OBJ-a','孔'),object('OBJ-b','孔'),object('OBJ-read','齿轮','PartDesign::Feature')],product_root_ids:['OBJ-a','OBJ-b','OBJ-read'],artifacts:[]};
  const posts=[],commands=new Map(),errors=[],reads={snapshots:[]};page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;let value={},status=200;
    if(req.method()==='POST') {
      const body=req.postDataJSON();posts.push({path,...body});
      if(path.endsWith('/proposals')) value={status:'ready',requires_confirmation:true,command:{command_id:'CMD-proposal',document_id:'DOC-a',expected_revision:head.revision,command_type:'set_primitive_dimensions',parameters:{object_id:'OBJ-b',dimensions:{length:65}}}};
      else if(path.endsWith('/commands')) {
        if(!unknown) {head={...head,revision:head.revision+1};snapshot={...snapshot,revision:head.revision,objects:snapshot.objects.map(o=>o.object_id===body.parameters.object_id?{...o,...(body.command_type==='set_label'?{label:body.parameters.label}:{}),properties:o.properties.map(p=>({...p,value:body.parameters.dimensions?.[p.name]??p.value}))}:o)};}
        value={command_id:body.command_id,state:unknown?'outcome_unknown':'completed',result:{revision:head.revision}};commands.set(body.command_id,value);
      } else if(path.endsWith('/documents')) {head={...head,document_id:'DOC-new',part_name:body.part_name,revision:0};snapshot={...snapshot,document_id:'DOC-new',revision:0,objects:[],product_root_ids:[]};value=head;}
    } else if(path.endsWith('/documents')) value={items:[head],next_cursor:''};
    else if(path.includes('/commands/')) value=commands.get(path.split('/').at(-1))||{command_id:path.split('/').at(-1),state:'outcome_unknown'};
    else if(path.includes('/snapshots/')) {
      reads.snapshots.push(Number(path.split('/').at(-1)));
      value=snapshot;
      if(delayedRefresh&&posts.some(p=>p.path.endsWith('/commands'))) {
        setTimeout(()=>page.evaluate(()=>window.dispatchEvent(new Event('focus'))).catch(()=>{}),10);
        return new Promise(resolve=>setTimeout(()=>resolve(route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)})),60));
      }
    }
    else if(path.endsWith('/designs')) value={items:[],next_cursor:''};
    else value=head;
    return route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  });
  await page.goto(base);return {context,page,posts,errors,reads,advance:()=>{
    head={...head,revision:head.revision+1};
    snapshot={...snapshot,revision:head.revision,objects:snapshot.objects.map(o=>o.object_id==='OBJ-b'?{...o,label:'新版孔'}:o)};
  }};
}
test('duplicate labels select UUID; native changes persist after reload; complex dimensions stay read-only',async()=>{
  const {context,page,posts,errors}=await setup();try {
    await page.getByRole('treeitem',{name:/孔.*OBJ-b/}).click();
    await page.getByLabel('长度（mm）',{exact:true}).fill('60');await page.getByRole('button',{name:'应用尺寸',exact:true}).click();
    await page.getByText('工作修订 2',{exact:false}).waitFor();assert.equal(posts[0].parameters.object_id,'OBJ-b');
    await page.reload();await page.getByRole('treeitem',{name:/孔.*OBJ-b/}).click();assert.equal(await page.getByLabel('长度（mm）',{exact:true}).inputValue(),'60');
    await page.getByLabel('对象标签',{exact:true}).fill('孔标签已改');await page.getByRole('button',{name:'应用标签',exact:true}).click();await page.getByRole('treeitem',{name:/孔标签已改/}).waitFor();
    await page.getByRole('treeitem',{name:/齿轮/}).click();await page.getByText('受规格约束，尺寸只读',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'应用尺寸',exact:true}).count(),0);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});
test('AI proposals never execute until confirmation; unknown outcome blocks another write',async()=>{
  const {context,page,posts}=await setup({unknown:true});try {
    await page.getByLabel('中文建模或修改需求').fill('将孔的长度改为65mm');await page.getByRole('button',{name:'生成修改提案',exact:true}).click();
    await page.getByRole('button',{name:'确认并执行提案',exact:true}).waitFor();assert.equal(posts.filter(p=>p.path.endsWith('/commands')).length,0);
    await page.getByRole('button',{name:'确认并执行提案',exact:true}).click();await page.getByText('结果待核对，不会自动重执行',{exact:false}).waitFor();
    assert.equal(await page.getByRole('button',{name:'保存发布版本',exact:true}).isDisabled(),true);assert.equal(posts.filter(p=>p.path.endsWith('/commands')).length,1);
  } finally {await context.close();}
});
test('creating an owned document preserves leading-zero number and does not generate geometry implicitly',async()=>{
  const {context,page,posts}=await setup();try {
    await page.getByText('新建文档 / 复制历史设计',{exact:true}).click();
    await page.getByLabel('新文档零件名称').fill('新零件');await page.getByLabel('新文档零件编号').fill('00456');await page.getByRole('button',{name:'创建个人文档',exact:true}).click();
    await page.getByText('空文档，请添加形体或确认中文建模提案',{exact:false}).waitFor();assert.equal(posts.at(-1).part_number,'00456');assert.equal(posts.length,1);
  } finally {await context.close();}
});
test('focus refresh cannot repeatedly abort an in-flight native snapshot or leave completed edits busy',async()=>{
  const {context,page}=await setup({delayedRefresh:true});try {
    await page.getByRole('treeitem',{name:/孔.*OBJ-b/}).click();
    await page.getByLabel('长度（mm）',{exact:true}).fill('62');
    await page.getByRole('button',{name:'应用尺寸',exact:true}).click();
    await page.getByText('工作修订 2',{exact:false}).waitFor();
    assert.equal(await page.getByLabel('长度（mm）',{exact:true}).inputValue(),'62');
    assert.equal(await page.getByRole('button',{name:'保存发布版本',exact:true}).isDisabled(),false);
  } finally {await context.close();}
});

test('unchanged revisions keep their loaded snapshot across repeated head refreshes',async()=>{
  const {context,page,reads}=await setup();try {
    await page.getByRole('treeitem',{name:/孔.*OBJ-b/}).waitFor();
    const isHead=req=>req.method()==='GET'&&new URL(req.url()).pathname.endsWith('/documents/DOC-a');
    for(let index=0;index<2;index++) {
      const next=page.waitForRequest(isHead);
      await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
      await next;
    }
    assert.deepEqual(reads.snapshots,[1],'Polling downloaded the unchanged document geometry again');
  } finally {await context.close();}
});

test('a new server revision loads the matching snapshot and updates visible geometry metadata',async()=>{
  const {context,page,reads,advance}=await setup();try {
    await page.getByRole('treeitem',{name:/孔.*OBJ-b/}).waitFor();advance();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.getByRole('treeitem',{name:/新版孔.*OBJ-b/}).waitFor();
    assert.deepEqual(reads.snapshots,[1,2]);
  } finally {await context.close();}
});
