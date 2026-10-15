import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

const common={skill_used:true,baseline_unchanged:true,dependencies_unchanged:true};
const cases=[
  {agent:'diagnosis',name:'alarm_diagnosis_skill',mode:'machine_flow',title:'报警诊断',
    criteria:{diagnosis:true,maintenance:true,workorder:true,report:true,...common},
    result:{confidence:0},checks:['诊断结果','维修方案','工单闭环','报告保存'],metric:'诊断置信度'},
  {agent:'knowledge',name:'manual_search_skill',mode:'knowledge_flow',title:'手册检索',
    criteria:{retrieval:true,evidence:true,query_relevance:true,expected_result:true,...common},
    result:{status:'insufficient_evidence',documents:[],calls:[{tool:'search_manual'}],confidence:0,
      confidence_details:{query_coverage:0,source_coverage:0}},checks:['查询相关性','预期结果'],metric:'返回资料'},
  {agent:'cad',name:'production_modeling_skill',mode:'cad_spec_flow',title:'CAD 规格解析',
    criteria:{specification:true,missing_dimensions:true,expected_result:true,...common},
    result:{status:'needs_input',questions:['请提供零件尺寸']},checks:['规格解析','缺失尺寸检查'],metric:'待补参数'},
  {agent:'router',name:'intent_routing_skill',mode:'review_flow',title:'路由核查',
    criteria:{evidence_scope:true,expected_result:true,readonly:true,...common},
    result:{highlights:[{path:'/output/status',value:'待核实'}],missing:['/input/feedback']},
    checks:['证据归属','只读边界'],metric:'关注事实'},
];

async function setup(entry=cases[0], assessmentOverride=undefined) {
  const fixture=await centerFixture({fullApp:true,withStyles:true}),page=await fixture.browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(5000);
  const errors=[],writes=[];
  const makeSkill=selected=>({...selected,agent_label:selected.title,optimization:{mode:selected.mode,enabled:true},
    update_quota:{scope:'skill',agent:selected.agent,name:selected.name,limit:3,used:0,remaining:3,complete:true,enforced:true},
    version:'1.0',revision:'a'.repeat(64),goal:'核对证据并完成验证',document:'# 技能\n\n核对真实资料。',
    tools:[],steps:[],stop_conditions:[],can_edit:true});
  const skill=makeSkill(entry),skills=[skill,...cases.filter(item=>item.name!==entry.name).map(makeSkill)];
  const receipt={test_id:'f'.repeat(32),mode:entry.mode,status:'completed',result:entry.result,
    created_at:'2026-10-14T02:00:00Z',sample:{expected:'核对真实资料'},
    assessment:assessmentOverride===undefined ? {schema:1,accepted:true,basis:entry.mode+'_receipt',
      criteria:entry.criteria,completed_at:'2026-10-14T02:00:03Z'} : assessmentOverride};
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()!=='GET') writes.push({path,body:req.postDataJSON()});
    if(path==='/api/team/me') return respond(route,{user:{user_id:'U-1',role:'technician',username:'维修员'}});
    if(path==='/api/expert/skills') return respond(route,{items:new URL(req.url()).searchParams.get('loop_only')==='true'
      ? skills.filter(item=>['diagnosis','knowledge','cad'].includes(item.agent)) : skills});
    if(path==='/api/expert/machines') return respond(route,{items:[{device_id:'D-1',name:'测试车床',scenarios:[{scenario_id:'fault',name:'刀塔异常',alarm_code:'700006'}]}]});
    if(path.endsWith('/machine-test') || path.endsWith('/task-test') || path.startsWith('/api/expert/tests/')) return respond(route,receipt);
    if(path.startsWith('/api/expert/skills/')) return respond(route,skills.find(item=>path.endsWith(`/${item.agent}/${item.name}`)) || skill);
    if(path==='/api/expert/skill-loop') return respond(route,{north_star:{kind:'skill_north_star',schema:1,
      gate_pass_rate:{value:75,numerator:3,denominator:4},weekly_gain:{value:null},
      drift_recall:{value:null},rollback_rate:{value:0,numerator:0,denominator:2}},health:null});
    return respond(route,{items:[],devices:[],runs:[],runner:{}});
  });
  return {fixture,page,errors,writes,updateReceipt:values=>Object.assign(receipt,values)};
}

test('机器测试首轮失败后仍读取晚到工单，恢复进度和计时，不重复启动测试',async()=>{
  const {fixture,page,writes,errors,updateReceipt}=await setup();
  const partial={schema:1,accepted:false,basis:'machine_flow_receipt',completed_at:'2026-10-14T02:00:03Z',
    criteria:{...cases[0].criteria,workorder:false,report:false}};
  updateReceipt({status:'failed',event_id:'EVT-LATE-ORDER',assessment:partial,
    progress:[{label:'诊断',completed:true},{label:'方案',completed:true},{label:'工单',completed:false}],
    workorders:[],message:'首轮尚未同步关联工单'});
  try {
    await page.clock.install({time:new Date('2026-10-14T02:01:00Z')});
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('button',{name:'测试修改',exact:true}).click();
    const panel=page.getByRole('region',{name:'本次测试指标',exact:true});
    await panel.getByText('验收未通过',{exact:true}).waitFor();
    updateReceipt({status:'awaiting_repair',message:'已同步关联工单，请维修人员确认完成',
      workorders:[{workorder_id:'WO-LATE',assignee:'U-1',status:'in_progress'}],
      progress:[{label:'诊断',completed:true},{label:'方案',completed:true},{label:'工单',completed:true}]});
    await page.clock.fastForward(16000);
    await page.getByRole('button',{name:'确认维修完成并复机',exact:true}).waitFor();
    await panel.getByText('等待维修确认',{exact:true}).waitFor();
    assert.equal(await panel.getByText('验收未通过',{exact:true}).count(),0);
    assert.match(await panel.getByRole('article',{name:'流程进度',exact:true}).innerText(),/3 \/ 3/);
    const elapsed=await panel.getByRole('article',{name:'测试用时',exact:true}).innerText();
    assert.match(elapsed,/1 分/,'等待维修时应继续计时，不冻结在旧失败回执的 3 秒');
    await page.clock.fastForward(3000);
    assert.notEqual(await panel.getByRole('article',{name:'测试用时',exact:true}).innerText(),elapsed);
    assert.equal(await page.getByRole('button',{name:'发布到系统',exact:true}).isDisabled(),true);
    assert.equal(writes.length,1,'只允许原来的一次测试启动，不自动重试或确认维修');
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('专家中心默认显示测试，页签切换保留草稿且不发起业务写入',async()=>{
  const {fixture,page,errors,writes}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    const testTab=page.getByRole('tab',{name:'测试与结果',exact:true});
    await testTab.waitFor();
    assert.equal(await testTab.getAttribute('aria-selected'),'true');
    assert.equal(await page.getByRole('textbox',{name:'技能正文',exact:true}).count(),0);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox',{name:'技能目标',exact:true}).fill('保留人工草稿');
    await page.getByRole('tab',{name:'运行效果',exact:true}).click();
    await page.getByRole('region',{name:'北极星指标',exact:true}).getByText('75%',{exact:true}).waitFor();
    await testTab.click();
    assert.equal(await page.getByRole('region',{name:'本次测试指标',exact:true}).getByText('尚未测试',{exact:true}).count(),1);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    assert.equal(await page.getByRole('textbox',{name:'技能目标',exact:true}).inputValue(),'保留人工草稿');
    const search=page.getByRole('searchbox',{name:'查找技能',exact:true});
    await search.fill('不存在的技能');
    await page.getByText('没有匹配的技能，请调整搜索或筛选。',{exact:true}).waitFor();
    await search.fill('报警');
    assert.equal(await page.getByRole('region',{name:'技能目录',exact:true}).getByRole('button').count(),1);
    await page.getByRole('tab',{name:'技能内容',exact:true}).focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await testTab.getAttribute('aria-selected'),'true');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.getByRole('button',{name:'测试修改',exact:true}).isVisible(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile layout must not overflow');
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

for(const entry of cases) test(`${entry.mode} 展示真实指标和验收项，零值不视为缺失`,async()=>{
  const {fixture,page,errors}=await setup(entry);
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('button',{name:'测试修改',exact:true}).click();
    const panel=page.getByRole('region',{name:'本次测试指标',exact:true});
    await panel.getByText('验收通过',{exact:true}).waitFor();
    for(const label of entry.checks) assert.equal(await panel.getByText(label,{exact:true}).count(),1);
    const metric=panel.getByRole('article',{name:entry.metric,exact:true});
    await metric.waitFor();
    if(entry.mode==='machine_flow') assert.match(await metric.innerText(),/0%/);
    if(entry.mode==='knowledge_flow') assert.match(await metric.innerText(),/0/);
    assert.equal(await page.getByRole('checkbox',{name:'我已核对测试结果，确认符合预期',exact:true}).isEnabled(),true);
    if(process.env.EXPERT_LAYOUT_CAPTURE_DIR) {
      await mkdir(process.env.EXPERT_LAYOUT_CAPTURE_DIR,{recursive:true});
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:join(process.env.EXPERT_LAYOUT_CAPTURE_DIR,`${entry.mode}.png`),fullPage:true});
      if(entry.mode==='knowledge_flow') {
        await page.getByRole('tab',{name:'运行效果',exact:true}).click();
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:join(process.env.EXPERT_LAYOUT_CAPTURE_DIR,'skill-summary.png'),fullPage:true});
        await page.setViewportSize({width:390,height:844});
        await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:join(process.env.EXPERT_LAYOUT_CAPTURE_DIR,'mobile.png'),fullPage:true});
      }
    }
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('折叠配置中的必填错误会展开并聚焦，不能无提示地阻止测试',async()=>{
  const {fixture,page,writes,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    const expected=page.getByRole('textbox',{name:'预期结果',exact:true});
    await expected.fill('');
    await page.getByText('测试配置与预期',{exact:true}).click();
    await page.getByRole('button',{name:'测试修改',exact:true}).click();
    assert.equal(await expected.isVisible(),true);
    assert.equal(await expected.evaluate(element=>element===document.activeElement),true);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('缩小技能范围后清除失效的智能体筛选',async()=>{
  const {fixture,page,writes}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    const filter=page.getByRole('combobox',{name:'所属智能体',exact:true});
    await filter.selectOption('router');
    const catalog=page.getByRole('region',{name:'技能目录',exact:true});
    assert.equal(await catalog.getByRole('button').count(),1);
    await page.getByRole('checkbox',{name:'显示其它智能体技能',exact:true}).uncheck();
    await catalog.getByRole('button').filter({hasText:'报警诊断'}).waitFor();
    assert.equal(await filter.inputValue(),'');
    assert.equal(await catalog.getByRole('button').count(),3);
    assert.deepEqual(writes,[]);
  } finally {await fixture.close();}
});

for(const assessment of [null,{schema:1,accepted:false,basis:'machine_flow_receipt',criteria:{...cases[0].criteria,report:false}}])
test(`已完成但验收${assessment ? '失败' : '缺失'}不能确认发布`,async()=>{
  const {fixture,page,writes}=await setup(cases[0],assessment);
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('button',{name:'测试修改',exact:true}).click();
    await page.getByRole('region',{name:'本次测试指标',exact:true})
      .getByText(assessment ? '验收未通过' : '回执待核实',{exact:true}).waitFor();
    const checkbox=page.getByRole('checkbox',{name:'我已核对测试结果，确认符合预期',exact:true});
    assert.equal(await checkbox.isDisabled(),true);
    assert.equal(await page.getByRole('button',{name:'发布到系统',exact:true}).isDisabled(),true);
    assert.equal(writes.length,1);
  } finally {await fixture.close();}
});
