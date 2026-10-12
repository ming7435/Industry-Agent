import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
const base=process.env.CAD_LIVE_URL,actor=process.env.CAD_LIVE_ACTOR,doc=process.env.CAD_LIVE_DOCUMENT;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--enable-unsafe-swiftshader']});
let page,workspace;const events=[];
try {
  const context=await browser.newContext({viewport:{width:1600,height:1050}});
  await context.addCookies([{name:'maintenance_session',value:process.env.CAD_LIVE_COOKIE,url:base,httpOnly:true}]);
  await context.addInitScript(({actor,doc})=>sessionStorage.setItem(`freecad.active-document:${actor}`,doc),{actor,doc});
  page=await context.newPage();page.setDefaultTimeout(45000);
  page.on('pageerror',error=>events.push({error:error.message}));
  page.on('requestfailed',request=>{if(request.url().includes('/documents/'))events.push({failed:new URL(request.url()).pathname,error:request.failure()?.errorText});});
  page.on('response',async response=>{
    const path=new URL(response.url()).pathname;
    if(path.startsWith('/api/cad/freecad/documents/')&&!path.includes('/artifacts/')) {
      try {const body=await response.json();events.push({path,status:response.status(),revision:body.revision,state:body.state,command_id:body.command_id,active:body.active_command_id,detail:body.detail});}catch{}
    }
  });
  await page.goto(base+'/?view=cad');
  await page.getByText('高级功能',{exact:true}).click();
  await page.getByRole('button',{name:'打开专业文档编辑器',exact:true}).click();
  workspace=page.getByRole('region',{name:'个人 FreeCAD 文档'});
  await workspace.getByRole('treeitem').first().click();
  // Controlled native checkbox updates only after the asynchronous GUI command completes.
  const initialVisible=await workspace.getByLabel('显示对象').isChecked();
  await workspace.getByLabel('显示对象').click();
  await workspace.getByText('工作修订 2',{exact:false}).waitFor();
  assert.equal(await workspace.getByLabel('显示对象').isChecked(),!initialVisible);
  await workspace.getByRole('treeitem').first().click();
  await workspace.getByLabel('底径（mm）',{exact:true}).fill('42');
  await workspace.getByRole('button',{name:'应用尺寸',exact:true}).click();
  await workspace.getByText('工作修订 3',{exact:false}).waitFor();
  await workspace.getByRole('treeitem').first().click();
  await workspace.getByLabel('对象标签',{exact:true}).fill('浏览器原生圆锥');
  await workspace.getByRole('button',{name:'应用标签',exact:true}).click();
  await workspace.getByRole('treeitem',{name:/浏览器原生圆锥/}).waitFor();
  await workspace.getByLabel('中文建模或修改需求').fill('将浏览器原生圆锥的底径改为44mm');
  await workspace.getByRole('button',{name:'生成修改提案',exact:true}).click();
  await workspace.getByRole('button',{name:'确认并执行提案',exact:true}).waitFor();
  assert.match(await workspace.textContent(),/工作修订 4/);
  await workspace.getByRole('button',{name:'确认并执行提案',exact:true}).click();
  await workspace.getByText('工作修订 5',{exact:false}).waitFor();
  await workspace.getByRole('button',{name:'保存发布版本',exact:true}).click();
  await workspace.getByText('已发布版本 1',{exact:false}).waitFor();
  await page.reload();
  await page.getByText('高级功能',{exact:true}).click();
  await page.getByRole('button',{name:'打开专业文档编辑器',exact:true}).click();
  await workspace.getByRole('treeitem',{name:/浏览器原生圆锥/}).click();
  assert.equal(await workspace.getByLabel('底径（mm）',{exact:true}).inputValue(),'44');
  if(!initialVisible) await workspace.locator('canvas').waitFor();
  assert.equal(await workspace.getByRole('alert').count(),0);
  console.log(JSON.stringify({passed:true,built_app:true,manual_edit:true,proposal_confirmed:true,reloaded:true,published:true,paid_ai_called:false}));
} catch(error) {
  console.error(JSON.stringify({workspace:workspace?(await workspace.innerText()).slice(-3500):'',events:events.slice(-15)}));throw error;
} finally {await browser.close();}
