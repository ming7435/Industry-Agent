import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualFixture} from './helpers/virtual-fixture.mjs';
import {respond} from './helpers/center-fixture.mjs';

async function workspace(){
  const fixture=await virtualFixture(`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from './production-cad/DocumentWorkspace.jsx';createRoot(document.getElementById('root')).render(<Workspace actorId="USER-spec" initialDocumentId="DOC-spec"/>);`);
  const page=await fixture.browser.newPage();page.setDefaultTimeout(5000);
  let revision=4,length=40,unknown=false;
  const posts=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  const head=()=>({document_id:'DOC-spec',owner_user_id:'USER-spec',part_name:'底板',part_number:'00123',revision,published_version:1,published_revision:4});
  const snapshot=()=>({document_id:'DOC-spec',revision,product_root_ids:['OBJ-spec'],source_spec:null,artifacts:[],objects:[{object_id:'OBJ-spec',name:'Base',label:'底板',type_id:'Part::Box',visible:true,parent_ids:[],dependency_ids:[],geometry:{},editable_commands:['set_primitive_dimensions','set_placement'],properties:[{name:'length',value:length,editable:true},{name:'width',value:20,editable:true},{name:'height',value:10,editable:true},{name:'position',value:[0,0,0]},{name:'rotation',value:{axis:[0,0,1],angle:0}}]}]});
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()==='POST'){const body=req.postDataJSON();posts.push({path,...body});if(!unknown)revision++;return respond(route,{command_id:body.command_id,state:unknown?'outcome_unknown':'completed'},202);}
    if(path.endsWith('/documents'))return respond(route,{items:[head()],next_cursor:''});
    if(path.endsWith('/catalog'))return respond(route,{commands:[{id:'Part_Fillet',label:'圆角',workbench_id:'PartWorkbench',execution:'adapted',action:{type:'prepare_spec_task',task_id:'fillet'}}],command_count:1,workbenches:[],current:true});
    if(path.includes('/commands/'))return respond(route,{command_id:path.split('/').at(-1),state:unknown?'outcome_unknown':'completed'});
    if(path.includes('/snapshots/'))return respond(route,snapshot());
    return respond(route,head());
  });
  await page.goto(fixture.base);await page.getByText('工作修订 4',{exact:false}).waitFor();
  return {fixture,page,posts,errors,advance:()=>{revision++;length=70;},makeUnknown:()=>{unknown=true;}};
}

test('native-workspace hole form uses current dimensions and sends one confirmed MCP spec command',async()=>{
  const {fixture,page,posts,errors}=await workspace();
  try{
    await page.getByRole('menuitem',{name:'零件',exact:true}).click();await page.getByRole('menuitem',{name:'添加通孔',exact:true}).click();
    await page.getByRole('region',{name:'规格建模任务'}).getByLabel(/主体 · 长方体 · 长度/).waitFor();
    const panel=page.getByRole('region',{name:'规格建模任务'});
    await panel.getByLabel(/特征 1 · 通孔 · 直径/).fill('8');
    assert.equal(await panel.getByRole('button',{name:'通过 MCP 执行规格任务'}).isDisabled(),true);assert.equal(posts.length,0);
    await panel.getByLabel('我确认按以上参数重建当前文档（生成新修订）').check();
    await panel.getByRole('button',{name:'通过 MCP 执行规格任务'}).click();
    await page.getByText('工作修订 5',{exact:false}).waitFor();
    assert.equal(posts.length,1);assert.equal(posts[0].command_type,'replace_from_spec');assert.equal(posts[0].expected_revision,4);assert.equal(posts[0].document_id,'DOC-spec');
    assert.deepEqual(posts[0].parameters.spec.operations[1],{type:'cylinder',mode:'cut',diameter:8,length:10,axis:'z',position:[20,10,0]});
    assert.equal(Object.hasOwn(posts[0].parameters,'code'),false);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
test('new working revisions cannot silently rebase an already-confirmed task draft',async()=>{
  const {fixture,page,posts,advance}=await workspace();
  try{
    await page.getByText('规格与工作台建模',{exact:true}).click();
    const panel=page.getByRole('region',{name:'规格建模任务'});
    await panel.getByLabel('建模任务').selectOption('chamfer');await panel.getByRole('button',{name:'读取任务参数'}).click();
    await panel.getByLabel('我确认按以上参数重建当前文档（生成新修订）').check();advance();
    await page.getByRole('button',{name:'刷新文档',exact:true}).click();await page.getByText('工作修订 5',{exact:false}).waitFor();
    await panel.getByText('工作修订已更新，请重新读取参数并确认。',{exact:true}).waitFor();
    assert.equal(await panel.getByRole('button',{name:'通过 MCP 执行规格任务'}).isDisabled(),true);assert.equal(posts.length,0);
    await panel.getByRole('button',{name:'读取任务参数'}).click();
    assert.equal(await panel.getByLabel(/主体 · 长方体 · 长度/).inputValue(),'70');
    assert.equal(await panel.getByLabel('我确认按以上参数重建当前文档（生成新修订）').isChecked(),false);
  }finally{await fixture.close();}
});
test('a catalog fillet opens the controlled parameter form and never executes the raw native command',async()=>{
  const {fixture,page,posts}=await workspace();
  try{
    await page.getByText('完整命令目录 · 搜索与参数入口',{exact:true}).click();await page.getByRole('button',{name:/圆角 · Part_Fillet/}).click();
    await page.getByRole('button',{name:'配置此操作',exact:true}).click();
    const panel=page.getByRole('region',{name:'规格建模任务'});
    await panel.getByLabel(/圆角半径/).waitFor();assert.equal(posts.length,0);assert.equal(await panel.getByLabel('建模任务').inputValue(),'fillet');
    await panel.getByLabel('建模任务').selectOption('sheetmetal');await panel.getByRole('button',{name:'读取任务参数'}).click();
    await panel.getByLabel(/钣金尺寸 · 厚度/).fill('3');assert.equal(posts.length,0);
  }finally{await fixture.close();}
});
test('unknown task outcome remains query-only and disables subsequent spec writes',async()=>{
  const {fixture,page,posts,makeUnknown}=await workspace();
  try{
    await page.getByText('规格与工作台建模',{exact:true}).click();const panel=page.getByRole('region',{name:'规格建模任务'});
    await panel.getByLabel('建模任务').selectOption('drawing');await panel.getByRole('button',{name:'读取任务参数'}).click();
    await panel.getByLabel('我确认按以上参数重建当前文档（生成新修订）').check();makeUnknown();
    await panel.getByRole('button',{name:'通过 MCP 执行规格任务'}).click();await page.getByText('结果待核对，不会自动重执行',{exact:false}).waitFor();
    assert.equal(await panel.getByRole('button',{name:'通过 MCP 执行规格任务'}).isDisabled(),true);
    await page.getByRole('button',{name:'刷新文档',exact:true}).click();assert.equal(posts.length,1);
  }finally{await fixture.close();}
});
