// Opt-in smoke against the isolated document stack from freecad_document_stack.py.
// Never use the user's business database or existing login sessions for this test.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
if(process.env.RUN_FREECAD_SPEC_TASKS_LIVE!=='1')throw new Error('Set RUN_FREECAD_SPEC_TASKS_LIVE=1 for the local native/API/browser smoke');
const base=process.env.CAD_LIVE_URL||'http://127.0.0.1:18001';
const target=new URL(base);
assert.ok(['127.0.0.1','localhost'].includes(target.hostname)&&target.port==='18001'&&!target.username&&!target.password,'Use only the isolated local document stack on port 18001');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--enable-unsafe-swiftshader']});
const proof={built_app:true,mcp_worker:true,paid_ai_called:false,existing_documents_modified:false,checks:[]};
const artifactDir=resolve('.runtime/spec-tasks-live-'+randomUUID());mkdirSync(artifactDir,{recursive:true});
try{
  const context=await browser.newContext({viewport:{width:1680,height:1100}}),client=context.request;
  const credentials={username:'cad-smoke-'+randomBytes(6).toString('hex'),password:randomBytes(20).toString('base64url')};
  let response=await client.post(base+'/api/team/register',{data:{...credentials,role:'technician',primary_device_id:'RENISHAW-EQUATOR300-001'}});
  assert.ok(response.ok(),'Separate test account registration: HTTP '+response.status());
  response=await client.post(base+'/api/team/login',{data:credentials});assert.ok(response.ok(),'Test login: HTTP '+response.status());
  const actor=(await response.json()).user.user_id;
  const post=async(path,data)=>{const response=await client.post(base+path,{data,headers:{Origin:base}});assert.equal(response.status(),202,'Local CAD write: HTTP '+response.status());return response.json();};
  const read=async(path)=>{const response=await client.get(base+path);assert.ok(response.ok(),'Local CAD read: HTTP '+response.status());return response.json();};
  const waitCommand=async(doc,cid)=>{
    const deadline=Date.now()+100000;
    while(Date.now()<deadline){
      const record=await read(`/api/cad/freecad/documents/${doc}/commands/${cid}`);
      if(['completed','failed','outcome_unknown'].includes(record.state)){assert.equal(record.state,'completed',record.error_code||'native command not completed');return record;}
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    throw new Error('Native result unconfirmed; the operation will not be replayed');
  };
  const page=await context.newPage();page.setDefaultTimeout(100000);const errors=[],controlWrites=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(req.method()==='POST'&&/factory|workorders|production\/jobs/.test(new URL(req.url()).pathname))controlWrites.push(new URL(req.url()).pathname);});
  for(const task of ['hole','fillet','chamfer','drawing','gear','loft','sheetmetal']){
    const head=await post('/api/cad/freecad/documents',{request_id:randomUUID(),part_name:'功能验证-'+task,part_number:''}),doc=head.document_id;
    const cid='CMD-'+randomUUID();
    await post(`/api/cad/freecad/documents/${doc}/commands`,{command_id:cid,document_id:doc,expected_revision:0,command_type:'create_primitive',parameters:{primitive_type:'box',length:80,width:60,height:20}});
    await waitCommand(doc,cid);
    await page.goto(base+'/?view=cad');
    await page.evaluate(({actor,doc})=>sessionStorage.setItem(`freecad.active-document:${actor}`,doc),{actor,doc});
    await page.reload();
    await page.getByText('高级功能',{exact:true}).click();
    await page.getByRole('button',{name:'打开专业文档编辑器',exact:true}).click();
    const workspace=page.getByRole('region',{name:'个人 FreeCAD 文档'});
    await workspace.getByText('工作修订 1',{exact:false}).waitFor();
    await workspace.getByText('规格与工作台建模',{exact:true}).click();
    const panel=workspace.getByRole('region',{name:'规格建模任务'});
    await panel.getByLabel('建模任务').selectOption(task);await panel.getByRole('button',{name:'读取任务参数'}).click();
    if(task==='hole')await panel.getByLabel(/特征 1 · 通孔 · 直径/).fill('8');
    assert.equal((await read(`/api/cad/freecad/documents/${doc}`)).revision,1,'Preparing a task must not execute it');
    await panel.getByLabel('我确认按以上参数重建当前文档（生成新修订）').check();
    const sent=page.waitForRequest(req=>req.method()==='POST'&&new URL(req.url()).pathname===`/api/cad/freecad/documents/${doc}/commands`);
    await panel.getByRole('button',{name:'通过 MCP 执行规格任务'}).click();
    const body=(await sent).postDataJSON();assert.equal(body.command_type,'replace_from_spec');assert.equal(body.expected_revision,1);
    await waitCommand(doc,body.command_id);await workspace.getByText('工作修订 2',{exact:false}).waitFor();
    const snapshot=await read(`/api/cad/freecad/documents/${doc}/snapshots/2`);
    assert.equal(snapshot.validation.valid,true);assert.equal(snapshot.validation.step_roundtrip,true);assert.equal(snapshot.validation.solid_count,1);
    assert.ok(snapshot.objects.length>0);await workspace.locator('canvas').waitFor();
    if(task==='hole')assert.ok(Math.abs(snapshot.validation.volume_mm3-(96000-Math.PI*16*20))<0.0001,'Native hole removes the specified volume');
    if(['fillet','chamfer'].includes(task))assert.ok(snapshot.validation.volume_mm3<96000,'Native edge operation changes geometry');
    if(task==='drawing'){assert.ok(snapshot.objects.some(o=>o.type_id==='TechDraw::DrawPage'));assert.ok(snapshot.artifacts.some(a=>a.name==='drawing.svg'));assert.ok(snapshot.artifacts.some(a=>a.name==='drawing.pdf'));}
    if(task==='sheetmetal')assert.ok(snapshot.artifacts.some(a=>a.name==='unfold.dxf'));
    assert.equal((await read(`/api/cad/freecad/documents/${doc}/snapshots/1`)).validation.volume_mm3,96000,'Original revision remains unchanged');
    proof.checks.push({task,document_id:doc,revision:2,volume_mm3:snapshot.validation.volume_mm3,step_roundtrip:true,artifacts:snapshot.artifacts.filter(a=>['model.FCStd','model.step','model.stl','drawing.svg','drawing.pdf','unfold.svg','unfold.dxf'].includes(a.name)).map(a=>({name:a.name,sha256:a.sha256}))});
    await page.screenshot({path:resolve(artifactDir,task+'.png'),fullPage:true});
    console.log(JSON.stringify({task,passed:true,volume_mm3:snapshot.validation.volume_mm3}));
  }
  assert.deepEqual(controlWrites,[]);assert.deepEqual(errors,[]);
  proof.passed=true;writeFileSync(resolve(artifactDir,'proof.json'),JSON.stringify(proof,null,2));
  console.log(JSON.stringify({passed:true,checks:proof.checks.length,proof_directory:artifactDir}));
}finally{await browser.close();}
