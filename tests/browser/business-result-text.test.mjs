import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';
import {actor,diagnosis,longFaultSummary,order,plan,sample,snapshot} from './helpers/business-result-data.mjs';

async function pageFor(t,view,options={}){
  const {currentOrder=order,...fixtureOptions}=options;
  const fixture=await centerFixture({actor,snapshot,sample,...fixtureOptions});t.after(()=>fixture.close());
  const page=await fixture.browser.newPage(),errors=[],writes=[];page.setDefaultTimeout(3000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/drawings/**',route=>route.abort());
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(!['GET','HEAD'].includes(req.method())){writes.push(path);return route.abort();}
    if(path==='/api/workorders')return respond(route,{items:[currentOrder]});
    if(path==='/api/maintenance/plans')return respond(route,{items:[{...plan,maintenance_plan:plan}],history:{status:'ready'},deleted_plan_ids:[]});
    return respond(route,{items:[],deleted_plan_ids:[]});
  });
  await page.goto(`${fixture.base}/?view=${view}`);
  return {page,errors,writes};
}

test('智能诊断分开结论、原因、建议与依据，段落和操作序号保持完整',async t=>{
  const {page,errors,writes}=await pageFor(t,'diagnosis');
  const summary=page.locator('.diagnosis-summary');await summary.waitFor();
  assert.equal(await summary.locator('p').count(),2);
  const cause=page.getByRole('region',{name:'根因分析'});
  assert.equal(await cause.locator('ol > li').count(),2);
  const advice=page.getByRole('region',{name:'处置建议'});
  assert.deepEqual(await advice.locator('dt').allTextContents(),['处置原则','现场检查','恢复条件']);
  const evidence=page.getByRole('region',{name:'诊断依据'});
  assert.equal(await evidence.locator('li').count(),3);
  assert.match(await evidence.innerText(),/0.42 MPa.*0.60–0.80 MPa/s);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('维修方案区分前置检查、安全、执行步骤和验收，步骤没有双重编号',async t=>{
  const {page,errors,writes}=await pageFor(t,'maintenance');
  const panel=page.locator('.maintenance-plan-panel[aria-label="维修方案"]');await panel.waitFor();
  for(const name of ['维修前检查','安全要求','维修步骤','工具清单','备件清单','维修后验收']){
    assert.equal(await panel.getByRole('region',{name,exact:true}).count(),1);
  }
  const steps=panel.getByRole('region',{name:'维修步骤',exact:true});
  assert.equal(await steps.locator('ol > li').count(),3);
  assert.equal(await steps.locator('li ol, li ul').count(),0);
  assert.match(await panel.innerText(),/高风险/);assert.doesNotMatch(await panel.innerText(),/critical|##|\*\*/);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('工单字段对齐，故障描述不重复前缀，保存反馈以正文展示并保留原输入',async t=>{
  const {page,errors,writes}=await pageFor(t,'workorder');
  const panel=page.locator('.maintenance-sheet');await panel.waitFor();
  assert.deepEqual(await panel.locator('.fault-meta-list dt').allTextContents(),['故障部件','料号','所属系统','位置']);
  assert.doesNotMatch(await panel.innerText(),/故障表现：\s*故障表现：/);
  const saved=panel.getByRole('region',{name:'已保存处理记录'});
  assert.equal(await saved.locator('ol > li').count(),2);
  assert.match(await saved.innerText(),/复测结果.*压力反馈已恢复/s);
  assert.equal(await page.locator('#repair-feedback').inputValue(),order.repair_feedback.feedback);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('正文包装和加粗字段完整渲染，返回的 HTML 仅显示为文字',async t=>{
  const literal='<img src=x onerror="window.__resultInjected=true">';
  const latest={...diagnosis,summary:{answer:`${literal}\n\n检查结果：保持停机。`},
    recommendation:'**处置原则：**保持停机\n**恢复条件：**复测通过'};
  const data={...snapshot,diagnosis:{...snapshot.diagnosis,latest,latest_by_device:{[sample.device_id]:latest}}};
  const {page,errors,writes}=await pageFor(t,'diagnosis',{snapshot:data});
  const summary=page.locator('.diagnosis-summary');await summary.waitFor();
  assert.match(await summary.innerText(),/检查结果：保持停机/);
  assert.ok((await summary.innerText()).includes(literal));
  assert.equal(await summary.locator('img').count(),0);
  assert.equal(await page.evaluate(()=>window.__resultInjected),undefined);
  const advice=page.getByRole('region',{name:'处置建议'});
  assert.deepEqual(await advice.locator('dt').allTextContents(),['处置原则','恢复条件']);
  assert.deepEqual(await advice.locator('dd').allTextContents(),['保持停机','复测通过']);
  assert.doesNotMatch(await advice.innerText(),/\*\*/);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('图纸归属故障定位区域，工单字段和执行步骤分区呈现',async t=>{
  const {page,errors,writes}=await pageFor(t,'workorder');
  const sheet=page.locator('.maintenance-sheet');await sheet.waitFor();
  assert.equal(await sheet.locator('.fault-summary-card .workorder-bigscreen-grid .repair-visual-panel').count(),1,'图纸应在故障描述与定位区域内');
  assert.equal(await page.locator('.repair-visual-panel').count(),1,'定位图纸只挂载一次');
  assert.deepEqual(await page.locator('.workorder-identity dt').allTextContents(),['工单编号','设备编号','负责人','故障事件','报警代码']);
  assert.ok((await page.locator('.workorder-identity').innerText()).includes('700010'));
  const tasks=page.getByRole('region',{name:'工单任务范围'});
  assert.equal(await tasks.getByRole('region',{name:'本工单处理步骤',exact:true}).locator('ol > li').count(),3);
  assert.doesNotMatch(await tasks.innerText(),/\*\*|##/);
  assert.equal(await tasks.locator('li ol, li ul').count(),0);
  assert.equal(await page.locator('.workorder-queue-identity').count(),1);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('实际长篇故障返回只用简短标题，长短摘要均保留原记录完整压力读数',async t=>{
  for(const summary of [longFaultSummary,'液压压力异常']){
  const latest={...diagnosis,summary,fault:summary};
  const currentOrder={...order,title:longFaultSummary,diagnosis_context:{summary:longFaultSummary},diagnosis_snapshot:latest};
  const data={...snapshot,diagnosis:{...snapshot.diagnosis,latest,latest_by_device:{[sample.device_id]:latest}}};
  const {page,errors,writes}=await pageFor(t,'workorder',{currentOrder,snapshot:data});
  const heading=page.locator('.workorder-titlebar h1');await heading.waitFor();
  const title=await heading.innerText();
  assert.ok(title.length<=80,'详情标题不能承载整段诊断');
  assert.doesNotMatch(title,/697|历史趋势|设备 TRAK/);
  assert.match(title,/液压压力未达到/);
  const analysis=page.getByRole('region',{name:'工单故障分析'});
  assert.ok((await analysis.locator('.result-prose').innerText()).includes(longFaultSummary));
  assert.ok((await analysis.locator('.result-prose').innerText()).includes(summary));
  assert.equal(await page.locator('.fault-summary-card .repair-visual-panel').count(),1);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  }
});

test('故障跟进工单只展示自己的处理步骤，不用原方案拆修步骤替代',async t=>{
  const currentOrder={...order,dispatch_mode:'fault_followup',steps:['1. **安全停机**：记录现场压力。','2. 核对压力反馈。'],
    maintenance_plan_snapshot:{...plan,repair_steps:['拆修步骤尚待工程资料核实']}};
  const {page,errors,writes}=await pageFor(t,'workorder',{currentOrder});
  const tasks=page.getByRole('region',{name:'工单任务范围'});await tasks.waitFor();
  assert.match(await tasks.innerText(),/VERIFY-PLAN/);
  assert.match(await tasks.innerText(),/安全停机.*核对压力反馈/s);
  assert.doesNotMatch(await tasks.innerText(),/拆修步骤尚待工程资料核实/);
  assert.equal(await tasks.locator('ol > li').count(),2);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('需要重校验的工单不会把原方案步骤呈现为可执行要求',async t=>{
  const currentOrder={...order,execution_review:{required:true,findings:['待核实模板']},
    maintenance_plan_snapshot:{...plan,repair_steps:['尚未校验的旧拆修步骤']}};
  const {page,errors,writes}=await pageFor(t,'workorder',{currentOrder});
  await page.locator('.maintenance-sheet').waitFor();
  assert.equal(await page.getByRole('region',{name:'方案执行复核'}).count(),1);
  assert.doesNotMatch(await page.locator('.workorder-detail-page').innerText(),/尚未校验的旧拆修步骤/);
  assert.equal(await page.getByRole('button',{name:'重新生成并校验方案',exact:true}).count(),1);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});

test('重排详情后仍保留工单自己的设备名称、型号和报警代码',async t=>{
  const currentOrder={...order,device_name:'车削中心 A',device_model:'TC820LTYsi'};
  const {page,errors,writes}=await pageFor(t,'workorder',{currentOrder});
  const identity=page.locator('.workorder-identity');await identity.waitFor();
  const fields=await identity.locator('div').evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.querySelector('dt').textContent,row.querySelector('dd').textContent])));
  assert.equal(fields['设备名称'],'车削中心 A');
  assert.equal(fields['设备型号'],'TC820LTYsi');
  assert.equal(fields['报警代码'],'700010');
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
});
