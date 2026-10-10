// Explicit opt-in verification against the current loopback simulation, using real UI actions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const base=process.env.SIM_VERIFY_BASE_URL||'http://127.0.0.1:8001',factory=process.env.SIM_VERIFY_FACTORY_URL||'http://127.0.0.1:4529';
const prefix='VERIFY-SIM-20261009',output=resolve(process.env.SIM_VERIFY_OUTPUT||'.runtime/verification/simulated-production-20261009');
for(const target of [base,factory]){const value=new URL(target);assert.equal(value.protocol,'http:');assert.ok(['127.0.0.1','localhost'].includes(value.hostname));assert.equal(value.pathname,'/');}
const capabilities=await (await fetch(factory+'/api/production/capabilities')).json();
assert.equal(capabilities.simulation_only,true);assert.equal(capabilities.ready,true);assert.equal(capabilities.schema_version,'virtual-turning-v1');
if(!process.argv.includes('--execute')||process.env.ALLOW_SIMULATED_PRODUCTION_WRITE!=='1'){
  console.log(JSON.stringify({mode:'read-only',factory_ready:true,writes:0}));process.exit(0);
}
const username=process.env.SIM_VERIFY_USERNAME,password=process.env.SIM_VERIFY_PASSWORD;
assert.ok(username?.startsWith(prefix)&&password?.length>=12,'explicit verification account is required');
const devices=await (await fetch(factory+'/api/devices')).json();
assert.ok((devices.devices||devices).every(item=>item.status==='running'&&!item.alarm_code),'the current simulation line must be normal');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH||'C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1080}}),saved=[],errors=[];
await mkdir(output,{recursive:true});
try{
  if(process.argv.includes('--register')){
    const registration=await context.request.post(base+'/api/team/register',{headers:{Origin:base},data:{username,password,role:'technician',primary_device_id:'TRAK-TC820LTYSI-001',responsible_device_ids:['TRAK-TC820LTYSI-001']}});
    assert.equal(registration.status(),201,'verification registration failed: '+JSON.stringify(await registration.json()));
  }
  const login=await context.request.post(base+'/api/team/login',{headers:{Origin:base},data:{username,password}});assert.equal(login.status(),200,'verification login failed');
  const actor=(await login.json()).user;assert.equal(actor.role,'technician');
  const previous=await (await context.request.get(base+'/api/production/virtual/jobs')).json();
  assert.ok(!(previous.items||[]).some(item=>['running','paused'].includes(item.status)),'verification account already has active work');
  await context.addInitScript(prefix=>{const uuid=crypto.randomUUID.bind(crypto);crypto.randomUUID=()=>prefix+'-'+uuid();},prefix);
  for(const hole of [false,true]){
    const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/?view=cad');
    await page.locator('#freecad-part-name').fill(prefix+(hole?'-HOLE':'-CYLINDER'));await page.locator('#freecad-part-number').fill(hole?'99111':'99110');
    await page.locator('#freecad-prompt').fill('圆柱外径20毫米，长度10毫米'+(hole?'，同轴通孔直径6毫米':''));
    await page.getByText('专业设置',{exact:true}).click();
    const operations=[{type:'cylinder',mode:'add',diameter:20,length:10,axis:'z',position:[0,0,0]}];
    if(hole)operations.push({type:'cylinder',mode:'cut',diameter:6,length:14,axis:'z',position:[0,0,-2]});
    await page.locator('#freecad-spec').fill(JSON.stringify({units:'mm',operations}));await page.getByRole('checkbox',{name:'我已核对设计尺寸与参数',exact:true}).check();
    const cadResponse=page.waitForResponse(response=>response.request().method()==='POST'&&new URL(response.url()).pathname==='/api/cad/freecad/runs');
    await page.getByRole('button',{name:'生成 3D 模型',exact:true}).click();const cad=await (await cadResponse).json();assert.match(cad.run_id,/^FC-[a-f0-9]{64}$/);
    await page.getByRole('button',{name:'保存生产方案',exact:true}).waitFor({timeout:60000});
    await page.getByRole('textbox',{name:'生产批次',exact:true}).fill(prefix+(hole?'-HOLE':'-CYLINDER'));
    const planResponse=page.waitForResponse(response=>response.request().method()==='POST'&&new URL(response.url()).pathname==='/api/production/virtual/plans');
    await page.getByRole('button',{name:'保存生产方案',exact:true}).click();const response=await planResponse,job=await response.json();assert.equal(response.status(),200,JSON.stringify(job));assert.equal(job.design_run_id,cad.run_id);assert.equal(job.status,'prepared');
    await page.getByRole('button',{name:'下发模拟工厂',exact:true}).click();await page.getByText('工厂已接收',{exact:true}).waitFor();
    const received=await (await context.request.get(base+'/api/production/virtual/jobs/'+job.job_id)).json();assert.equal(received.status,'received');
    await page.getByRole('button',{name:'启动模拟生产',exact:true}).click();await page.getByText('加工中',{exact:true}).waitFor();await page.screenshot({path:resolve(output,hole?'cad-hole.png':'cad-cylinder.png')});
    await page.close();
    let completed;
    for(let attempt=0;attempt<30;attempt++){
      completed=await (await context.request.get(base+'/api/production/virtual/jobs/'+job.job_id)).json();
      if(completed.status==='completed'&&completed.output)break;
      await new Promise(done=>setTimeout(done,1000));
    }
    assert.equal(completed.status,'completed');assert.equal(completed.sync_status,'confirmed');assert.ok(completed.output);
    const quality=await context.newPage();quality.setDefaultTimeout(15000);quality.on('pageerror',error=>errors.push(error.message));
    await quality.goto(base+'/?view=quality');await quality.getByRole('combobox',{name:'生产设计版本',exact:true}).selectOption(cad.run_id);
    await quality.getByRole('combobox',{name:'加工产出',exact:true}).selectOption(job.job_id);await quality.getByRole('button',{name:'开始检测',exact:true}).click();
    await quality.getByRole('heading',{name:'参数一致',exact:true}).waitFor();
    await quality.waitForFunction(()=>{const values=[...document.querySelectorAll('.pq-rates dd')].map(x=>x.textContent);return values.join('|')==='100%|0%|100%';});
    await quality.screenshot({path:resolve(output,hole?'quality-hole.png':'quality-cylinder.png')});
    await quality.evaluate(()=>sessionStorage.clear());await quality.reload();await quality.getByRole('combobox',{name:'生产设计版本',exact:true}).selectOption(cad.run_id);
    await quality.getByRole('combobox',{name:'加工产出',exact:true}).selectOption(job.job_id);await quality.getByRole('heading',{name:'参数一致',exact:true}).waitFor();
    const checked=await (await context.request.get(base+'/api/production/virtual/jobs/'+job.job_id)).json();assert.equal(checked.inspection.status,'pass');
    saved.push({command_id:checked.command_id,job_id:job.job_id,factory_job_id:checked.factory_job_id,part_id:checked.part_id,design_run_id:cad.run_id,output_digest:checked.output.output_digest,check_id:checked.inspection.check_id,status:checked.status});
    await quality.close();
  }
  const logs=await context.newPage();await logs.goto(base+'/?view=logs');await logs.getByText('生产运行',{exact:true}).waitFor();
  const runs=(await (await context.request.get(base+'/api/runs')).json()).runs.filter(item=>item.run_type==='production_simulation'&&saved.some(job=>job.job_id===item.job_id));
  assert.equal(runs.length,2);assert.ok(runs.every(item=>item.phases.every(phase=>phase.status==='completed')));
  await logs.screenshot({path:resolve(output,'production-logs.png')});assert.deepEqual(errors,[]);
  await writeFile(resolve(output,'live-summary.json'),JSON.stringify({verified_at:new Date().toISOString(),actor_id:actor.user_id,source:'factory-simulation',simulation_only:true,jobs:saved,browser_errors:errors},null,2));
  console.log(JSON.stringify({jobs:saved.length,inspections:saved.length,closed_page_background_completion:true,refresh_restored:true,production_logs_completed:true,browser_errors:errors.length}));
}finally{
  try{
    const logout=await context.request.post(base+'/api/team/logout',{headers:{Origin:base},data:{}});
    assert.equal(logout.status(),200,'verification session cleanup failed');
  }catch(failure){process.exitCode=1;console.error('verification session cleanup failed: '+failure.message);}
  finally{await context.close();await browser.close();}
}
