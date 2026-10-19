import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const skill = { agent: 'diagnosis', agent_label: '智能诊断', name: 'alarm_diagnosis_skill',
  title: '报警诊断', version: '1.0', goal: '核对故障证据', internal_loop: true,
  last_modified_at: '2026-10-12T00:10:00+00:00',
  loop_description: '诊断循环：根据证据决定补查工具，再校验结论。',
  revision: 'a'.repeat(64), document: '# 报警诊断\n\n不能编造证据。',
  tools: ['get_device_logs'], steps: ['collect_evidence'], stop_conditions: [] };

async function setup({ role = 'technician', conflict = false, delayedRead = null, testFailure = false, delayedTrial = null,
  machineFlow = false, extraSkills = [], updateQuota, version = skill.version, document = skill.document, result = { summary: '样例刀塔旋转超时', diagnosis: '需核对就位反馈', recommendation: '检查分度机构' } } = {}) {
  const fixture = await centerFixture({ fullApp: true });
  const page = await fixture.browser.newPage();
  page.setDefaultTimeout(8000);
  const writes = [], trials = [], errors = [], completions = [];
  let flowStage = 'awaiting_repair';
  const actor = role ? { user_id: 'U-EXPERT', username: '专家', role } : null;
  let current = { ...skill, version, document, update_quota:updateQuota===null ? null :
    {scope:'skill',agent:skill.agent,name:skill.name,limit:3,used:0,remaining:3,complete:true,enforced:true,...updateQuota} };
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/api/team/me') return respond(route, { user: actor }, actor ? 200 : 401);
    if (path === '/api/team/logout') return respond(route, {});
    if (path === '/api/expert/skills') return respond(route, { items: [current, ...extraSkills], can_edit: ['supervisor', 'technician'].includes(role) });
    if (path === '/api/expert/machines') return respond(route, { items: [{ device_id: 'D-1', name: '测试车床',
      scenarios: [{ scenario_id: 'turret', name: '刀塔旋转超时', alarm_code: '700006' }] }] });
    const trialResult = () => ({ test_id: 'c'.repeat(32), status: testFailure ? 'failed' : machineFlow ? flowStage : 'completed', mode: 'machine_flow',
      assessment: !testFailure && (!machineFlow || flowStage==='completed') ? {schema:1,accepted:true,basis:'machine_flow_receipt',
        criteria:{diagnosis:true,maintenance:true,workorder:true,report:true,skill_used:true,baseline_unchanged:true,dependencies_unchanged:true}} : null,
      created_at: '2026-10-12T02:00:00+00:00', machine: {device_id: 'D-1', name: '测试车床', alarm_code: '700006'},
      scope: '现有模拟机器全流程。', sample: { expected: trials.at(-1)?.machine.expected },
      result: testFailure ? null : result,
      workorders: machineFlow ? [{ workorder_id: 'WO-MACHINE-NEW', assignee: 'U-EXPERT', status: flowStage === 'awaiting_repair' ? 'in_progress' : 'completed' }] : [],
      progress: machineFlow ? [{ label: '智能诊断', completed: true }, { label: '整线复机', completed: flowStage !== 'awaiting_repair' },
        { label: '汇总报告', completed: flowStage === 'completed' }] : [],
      report_id: machineFlow && flowStage === 'completed' ? 'R-MACHINE-NEW' : '',
      details: machineFlow ? {diagnosis: {...result, confidence: .91},
        maintenance_plan: {plan_id: 'PLAN-MACHINE-NEW', summary: '检查刀塔反馈线路', steps: ['检查接线', '复测就位信号']},
        workorders: [{workorder_id: 'WO-MACHINE-NEW', assignee: 'U-EXPERT', status: flowStage === 'awaiting_repair' ? 'in_progress' : 'completed',
          feedback: flowStage === 'awaiting_repair' ? '' : '模拟检修完成，刀塔就位反馈恢复', completed_at: flowStage === 'awaiting_repair' ? '' : '2026-10-12T02:05:00+00:00'}],
        restart: {completed: flowStage !== 'awaiting_repair', restarted_at: '2026-10-12T02:06:00+00:00', devices: [{device_id:'D-1',name:'测试车床',status:flowStage === 'awaiting_repair' ? 'stopped' : 'running'}]},
        report: flowStage === 'completed' ? {report_id:'R-MACHINE-NEW',title:'故障处理汇总报告',article:'本次刀塔故障处理完成，反馈线路复测正常，设备已恢复运行。'} : {},
        pending_reasons: flowStage === 'completed' ? [] : ['等待关联工单确认及报告保存。']} : undefined,
      message: testFailure ? '模型服务暂不可用，测试未完成。' : machineFlow && flowStage === 'awaiting_repair' ? '已生成测试工单，请维修人员确认完成' : '试运行完成' });
    if (path.endsWith('/machine-test') && req.method() === 'POST') {
      trials.push(req.postDataJSON());
      if (delayedTrial) {
        delayedTrial.started.resolve();
        return delayedTrial.release.promise.then(() => respond(route, trialResult())).catch(() => {});
      }
      return respond(route, { test_id: 'c'.repeat(32), status: 'running' });
    }
    if (path.startsWith('/api/expert/tests/') && path.endsWith('/finish')) {
      completions.push(req.postDataJSON()); flowStage = 'awaiting_report'; return respond(route, trialResult());
    }
    if (path.startsWith('/api/expert/tests/')) return respond(route, trialResult());
    if (path.startsWith('/api/expert/skills/')) {
      const additional = extraSkills.find(item => path === `/api/expert/skills/${item.agent}/${item.name}`);
      if (additional && req.method() === 'GET') return respond(route, { ...additional, can_edit: ['supervisor', 'technician'].includes(role) });
      if (req.method() === 'GET' && delayedRead) {
        delayedRead.started.resolve();
        return delayedRead.release.promise.then(() => respond(route, { ...current, can_edit: true })).catch(() => {});
      }
      if (req.method() === 'POST') {
        const body = req.postDataJSON(); writes.push(body);
        if (conflict) {
          current = { ...current, document: '# 其他专家新版\n\n增加了振动复核。', goal: '新版设备证据目标', version: '1.2', revision: 'b'.repeat(64), last_modified_at: '2026-10-12T01:20:00+00:00' };
          return respond(route, { detail: '技能已被其它修改更新，请先刷新' }, 409);
        }
        current = { ...current, ...body, revision: 'b'.repeat(64), last_modified_at: '2026-10-12T02:30:00+00:00' };
        if(current.update_quota) current.update_quota={...current.update_quota,
          used:current.update_quota.used+1,remaining:Math.max(0,current.update_quota.remaining-1)};
      }
      return respond(route, { ...current, can_edit: ['supervisor', 'technician'].includes(role) });
    }
    if (req.method() !== 'GET') throw new Error('意外业务写入：' + path);
    return respond(route, { items: [], devices: [], runs: [], state: 'unknown', runner: {} });
  });
  return { fixture, page, writes, trials, errors, completions, finishReport: () => { flowStage = 'completed'; } };
}

async function testAndReview(page) {
  await page.getByRole('tab', {name:'测试与结果',exact:true}).click();
  await page.getByRole('button', { name: '测试修改', exact: true }).click();
  await page.getByRole('heading', { name: '试运行结果', exact: true }).waitFor();
  await page.getByRole('checkbox', { name: '我已核对测试结果，确认符合预期', exact: true }).check();
  await page.getByText('查看机器流程详情',{exact:true}).click();
}

async function readOnlyNote(page) {
  await page.getByRole('tab', {name:'技能内容',exact:true}).click();
  const note = page.getByRole('textbox', { name: '修改说明', exact: true });
  await note.waitFor();
  assert.equal(await note.isEditable(), false);
  await page.getByRole('tab', {name:'测试与结果',exact:true}).click();
  return note;
}

test('派工校验阻断直接展示原因，终止后后续步骤显示未开始', async () => {
  const {fixture,page,writes,completions,errors}=await setup();
  const blockers=['缺少匹配故障部件的 CAD/BOM 依据','备件库存为演示数据，不能作为正式派工依据'];
  const receipt={test_id:'c'.repeat(32),status:'failed',mode:'machine_flow',workorders:[],
    machine:{device_id:'D-1',name:'测试车床',alarm_code:'700000'},
    message:'维修方案未通过派工校验，本轮已停止，请处理下方阻断原因后重新测试',
    progress:[{label:'智能诊断',completed:true,status:'completed'},{label:'维修方案',completed:true,status:'completed'},
      {label:'工单派发',completed:false,status:'blocked'},{label:'维修确认',completed:false,status:'not_started'},
      {label:'整线复机',completed:false,status:'not_started'},{label:'汇总报告',completed:false,status:'not_started'}],
    details:{blockers,maintenance_plan:{plan_id:'PLAN-BLOCKED',workorder_ready:false,validation_findings:blockers,steps:['保持停机']}}};
  try {
    await page.route('**/api/expert/tests/*',route=>respond(route,receipt));
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('button',{name:'测试修改',exact:true}).click();
    const reasons=page.getByRole('region',{name:'本轮阻断原因',exact:true});
    await reasons.waitFor({timeout:5000});
    for(const text of blockers) assert.equal(await reasons.getByText(text,{exact:true}).count(),1);
    const progress=page.getByRole('region',{name:'全流程进度',exact:true});
    assert.match(await progress.innerText(),/工单派发：受阻/);
    assert.match(await progress.innerText(),/维修确认：未开始/);
    assert.doesNotMatch(await progress.innerText(),/等待完成/);
    assert.equal(await page.getByRole('button',{name:'发布到系统',exact:true}).isDisabled(),true);
    assert.deepEqual(writes,[]);assert.deepEqual(completions,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('每个技能本周更新三次后禁止再次发布，但仍可运行测试',async()=>{
  const {fixture,page,writes,trials,errors}=await setup({updateQuota:{used:3,remaining:0}});
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByText(/本技能本周已更新 3\/3 次.*剩余 0 次/).waitFor();
    await testAndReview(page);
    assert.equal(trials.length,1);
    assert.equal(await page.getByRole('button',{name:'发布到系统',exact:true}).isDisabled(),true);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('第三次正式发布后同步显示本技能已用三次且剩余零次',async()=>{
  const {fixture,page,writes,errors}=await setup({updateQuota:{used:2,remaining:1}});
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByText(/本技能本周已更新 2\/3 次.*剩余 1 次/).waitFor();
    await testAndReview(page);
    await page.getByRole('button',{name:'发布到系统',exact:true}).click();
    await page.getByText(/本技能本周已更新 3\/3 次.*剩余 0 次/).waitFor();
    assert.equal(writes.length,1);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

for(const updateQuota of [null,{used:1,remaining:null,complete:false},
  {used:1,remaining:2,enforced:false}]) {
  test(`次数数据${updateQuota===null ? '缺失' : updateQuota.complete===false ? '未核对' : '未启用'}时禁止发布，仍能测试`,async()=>{
    const {fixture,page,writes,trials,errors}=await setup({updateQuota});
    try {
      await page.goto(fixture.base+'/?view=expert');
      await testAndReview(page);
      assert.equal(trials.length,1);
      assert.equal(await page.getByRole('button',{name:'发布到系统',exact:true}).isDisabled(),true);
      assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
    } finally {await fixture.close();}
  });
}

test('修改说明等待系统生成且不能手填，不虚构尚未发生的修改', async () => {
  const { fixture, page, writes, trials, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const note = page.getByRole('textbox', { name: '修改说明', exact: true });
    await note.waitFor();
    assert.equal(await note.isEditable(), false);
    assert.equal(await note.inputValue(), '');
    assert.match(await note.getAttribute('placeholder'), /系统.*生成/);
    assert.deepEqual(writes, []); assert.deepEqual(trials, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('人工修改技能后系统摘要随实际改动更新，测试与发布使用同一说明', async () => {
  const { fixture, page, writes, trials, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const document = page.getByRole('textbox', { name: '技能正文', exact: true });
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const note = page.getByRole('textbox', { name: '修改说明', exact: true });
    await document.waitFor();
    const goal = page.getByRole('textbox', { name: '技能目标', exact: true });
    await goal.fill('补查刀塔证据');
    assert.match(await note.inputValue(), /调整技能目标.*补查刀塔证据/);
    await goal.fill(skill.goal);
    assert.equal(await note.inputValue(), '', '撤销目标调整后不能保留已撤销改动的说明');
    await document.fill('核对刀塔就位信号。');
    assert.equal(await note.isEditable(), false);
    assert.match(await note.inputValue(), /系统.*技能正文.*核对刀塔就位信号/s);
    await document.fill('检查主轴温度与实际负载。');
    assert.match(await note.inputValue(), /检查主轴温度与实际负载/);
    assert.doesNotMatch(await note.inputValue(), /核对刀塔就位信号|已验证|测试通过/);
    const generated = await note.inputValue();
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByText('已发布到系统，新说明用于后续任务。', { exact: true }).waitFor();
    assert.equal(trials[0].reason, generated); assert.equal(writes[0].reason, generated);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('每次正式发布递增一次版本，测试和发布使用同一个版本号', async () => {
  const {fixture,page,writes,trials,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    await testAndReview(page);
    await page.getByRole('button',{name:'发布到系统',exact:true}).click();
    await page.getByText('已发布到系统，新说明用于后续任务。',{exact:true}).waitFor();
    assert.equal(trials[0].version,'1.1');
    assert.equal(writes[0].version,trials[0].version);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox',{name:'技能目标',exact:true}).fill('核对设备反馈和报警证据');
    await testAndReview(page);
    await page.getByRole('button',{name:'发布到系统',exact:true}).click();
    await page.getByText('已发布到系统，新说明用于后续任务。',{exact:true}).waitFor();
    assert.equal(trials[1].version,'1.2');
    assert.equal(writes[1].version,trials[1].version);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('重复测试沿用同一个待发布版本，测试本身不发布或继续递增', async () => {
  const {fixture,page,writes,trials,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    await testAndReview(page);
    await testAndReview(page);
    assert.deepEqual(trials.map(row=>row.version),['1.1','1.1']);
    assert.match(await page.locator('.expert-current-summary').innerText(),/已发布版本 1\.0.*待发布版本 1\.1/);
    assert.deepEqual(writes,[]);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('手工内容编辑预览下一版，撤销全部编辑后恢复当前版本', async () => {
  const {fixture,page,writes,trials,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    const goal=page.getByRole('textbox',{name:'技能目标',exact:true});
    await goal.fill('补充反馈核查');
    assert.match(await page.locator('.expert-current-summary').innerText(),/已发布版本 1\.0.*待发布版本 1\.1/);
    await goal.fill(skill.goal);
    assert.match(await page.locator('.expert-current-summary').innerText(),/版本 1\.0.*当前已发布版本/);
    assert.deepEqual(writes,[]);assert.deepEqual(trials,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('旧会话原版本测试回执不能被静默换号后直接发布', async () => {
  const {fixture,page,writes,trials,errors}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.evaluate(saved=>sessionStorage.setItem('expert-machine-test:U-EXPERT',JSON.stringify(saved)),{
      skill,revision:skill.revision,test_id:'c'.repeat(32),
      draft:{version:'1.0',goal:skill.goal,document:skill.document+'\n补充现场检查。',reason:'旧版本测试'},
      machine:{device_id:'D-1',scenario_id:'turret',expected:'复机并保存报告'},
    });
    await page.reload();
    await page.getByRole('checkbox',{name:'我已核对测试结果，确认符合预期',exact:true}).check();
    await page.getByRole('button',{name:'发布到系统',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'当前回执使用的是旧版本号'}).waitFor({timeout:3000});
    assert.deepEqual(writes,[]);assert.deepEqual(trials,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('自动编号超过版本长度限制时保留编辑内容并提示，不崩溃或启动测试', async () => {
  const {fixture,page,writes,trials,errors}=await setup({version:'1.'+'9'.repeat(46)});
  try {
    await page.goto(fixture.base+'/?view=expert');
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    const goal=page.getByRole('textbox',{name:'技能目标',exact:true});
    await goal.fill('保留未保存的现场核查说明');
    await page.getByRole('alert').filter({hasText:'下一个技能版本号超过长度限制'}).first().waitFor({timeout:3000});
    assert.equal(await goal.inputValue(),'保留未保存的现场核查说明');
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    await page.getByRole('button',{name:'测试修改',exact:true}).click();
    assert.deepEqual(writes,[]);assert.deepEqual(trials,[]);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('技能目录与详情明确显示每个技能的名称、标识及作用，选择后不混用其它技能说明', async () => {
  const other = { ...skill, agent: 'knowledge', agent_label: '知识检索', name: 'manual_evidence_skill',
    title: '维修手册取证', goal: '检索当前设备手册并返回可核对的维修证据',
    document: '# 维修手册取证\n\n只使用当前设备资料。' };
  const { fixture, page, errors, writes } = await setup({ extraSkills: [other] });
  try {
    await page.goto(fixture.base + '/?view=expert');
    const catalog = page.getByRole('region', { name: '技能目录', exact: true });
    const diagnosis = catalog.getByRole('button').filter({ hasText: '报警诊断' });
    await diagnosis.waitFor();
    assert.equal(await diagnosis.getByText('alarm_diagnosis_skill', { exact: true }).count(), 1);
    assert.match(await diagnosis.innerText(), /技能作用：核对故障证据/);
    const knowledge = catalog.getByRole('button').filter({ hasText: '维修手册取证' });
    assert.equal(await knowledge.getByText('manual_evidence_skill', { exact: true }).count(), 1);
    assert.match(await knowledge.innerText(), /技能作用：检索当前设备手册并返回可核对的维修证据/);
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const details = page.getByLabel('技能信息', { exact: true });
    await details.waitFor();
    assert.match(await details.innerText(), /技能名称\s+报警诊断/);
    assert.match(await details.innerText(), /Skill 标识\s+alarm_diagnosis_skill/);
    assert.match(await details.innerText(), /技能作用\s+核对故障证据/);
    await knowledge.click();
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    await details.getByText('manual_evidence_skill', { exact: true }).waitFor();
    assert.match(await details.innerText(), /技能名称\s+维修手册取证/);
    assert.match(await details.innerText(), /技能作用\s+检索当前设备手册并返回可核对的维修证据/);
    assert.doesNotMatch(await details.innerText(), /alarm_diagnosis_skill|核对故障证据/);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('专家正文直接展示文章格式，未编辑的正文测试时保持原文', async () => {
  const source = '# 报警诊断\n\n## 检查方法\n\n先核对 **设备** 和 `alarm_code`。\n\n- [检查说明](L:/industry_agent/check.py)\n- 再核对现场反馈。';
  const { fixture, page, trials, errors } = await setup({ document: source });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor();
    assert.equal(await editor.getByRole('heading', { name: '报警诊断', level: 1 }).count(), 1);
    assert.equal(await editor.getByRole('heading', { name: '检查方法', level: 2 }).count(), 1);
    assert.equal(await editor.getByRole('listitem').count(), 2);
    assert.doesNotMatch(await editor.innerText(), /#|\*\*|`|\[检查说明\]/);
    assert.equal(await page.getByText('技能正文（Markdown）', { exact: true }).count(), 0);
    await readOnlyNote(page);
    await testAndReview(page);
    assert.equal(trials[0].document, source);
    assert.match(trials[0].reason, /本次未修改技能目标及正文/);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('普通文章编辑保留标题、引用、表格及示例内容，发布的内容与测试一致', async () => {
  const source = '# 报警诊断\n\n先核对 **设备** 和 `alarm_code`。\n\n- [检查说明](L:/industry_agent/check.py)\n\n| 项目 | 状态 |\n| --- | --- |\n| 就位信号 | 0 |\n\n```json\n{"signal":0}\n\n\n{"expected":1}\n```\n\n保留现场记录。';
  const { fixture, page, trials, writes, errors } = await setup({ document: source });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor();
    await editor.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element.querySelector('p')); range.collapse(false);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      element.focus();
    });
    await page.keyboard.insertText('人工补充反馈检查。');
    await readOnlyNote(page);
    await testAndReview(page);
    assert.match(trials[0].document, /# 报警诊断/);
    assert.match(trials[0].document, /\*\*设备\*\* 和 `alarm_code`/);
    assert.match(trials[0].document, /人工补充反馈检查/);
    assert.match(trials[0].document, /\[检查说明\]\(L:\/industry_agent\/check.py\)/);
    assert.match(trials[0].document, /\| 就位信号 \| 0 \|/);
    assert.match(trials[0].document, /\{"signal":0\}\n\n\n\{"expected":1\}/);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByText('已发布到系统，新说明用于后续任务。', { exact: true }).waitFor();
    assert.equal(writes[0].document, trials[0].document);
    await page.reload(); await page.getByRole('tab',{name:'技能内容',exact:true}).click(); await editor.waitFor();
    assert.equal(await editor.getByRole('heading', { name: '报警诊断', level: 1 }).count(), 1);
    assert.equal(await editor.getByRole('table').count(), 1);
    assert.doesNotMatch(await editor.innerText(), /# 报警诊断|\*\*设备|`alarm_code`|\[检查说明\]|```|\| ---/);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('使用排版按钮修改标题，空正文及过长正文不能试运行', async () => {
  const { fixture, page, trials, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor(); await editor.fill('人工维修经验');
    await page.getByRole('toolbar', { name: '正文排版' }).getByRole('button', { name: '标题', exact: true }).click();
    assert.equal(await editor.getByRole('heading', { name: '人工维修经验', level: 1 }).count(), 1);
    await readOnlyNote(page);
    await testAndReview(page);
    assert.match(trials[0].document, /^# 人工维修经验/);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await editor.fill('');
    await page.getByRole('alert').filter({ hasText: '请填写技能正文' }).waitFor();
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    assert.equal(trials.length, 1);
    await editor.fill('长'.repeat(24001));
    await page.getByRole('alert').filter({ hasText: '最多填写 24000 个字符' }).first().waitFor();
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    assert.equal(trials.length, 1);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    assert.equal(await page.getByRole('button', { name: '发布到系统', exact: true }).isDisabled(), true);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('试运行建议以正常段落显示，粘贴正文不会执行 HTML', async () => {
  const { fixture, page, errors } = await setup({ result: { summary: '**刀塔超时**', diagnosis: '需核对 `alarm_code`', recommendation: '## 检查方法\n\n- 核对分度机构\n- 确认反馈' } });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor(); await editor.fill('保留现场记录。');
    await editor.evaluate(element => {
      window.expertPasteExecuted = false;
      const clipboard = new DataTransfer();
      clipboard.setData('text/plain', '\n\n<img src=x onerror="window.expertPasteExecuted=true">');
      clipboard.setData('text/html', '<img src=x onerror="window.expertPasteExecuted=true">');
      element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
    });
    assert.equal(await editor.locator('img, script').count(), 0);
    assert.equal(await page.evaluate(() => window.expertPasteExecuted), false);
    await readOnlyNote(page);
    await testAndReview(page);
    const recommendation = page.getByRole('article', { name: '处理建议', exact: true });
    assert.equal(await recommendation.getByRole('heading', { name: '检查方法', level: 2 }).count(), 1);
    assert.equal(await recommendation.getByRole('listitem').count(), 2);
    assert.doesNotMatch(await recommendation.innerText(), /##|^- /m);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('技能内容显示修改时间与只读版本，正文仍可测试发布', async () => {
  const { fixture, page, writes, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('button', { name: '专家中心', exact: true }).waitFor();
    await page.getByRole('heading', { name: '专家中心', exact: true }).waitFor();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox', { name: '技能正文', exact: true }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: '版本号', exact: true }).count(), 0);
    assert.doesNotMatch(await page.getByRole('region', { name: '专家中心', exact: true }).innerText(), /内部循环|诊断循环/);
    assert.equal(await page.getByText('上次修改：2026-10-12 08:10:00', { exact: true }).count(), 1);
    await page.getByRole('textbox', { name: '技能正文', exact: true }).fill('报警诊断\n\n先核对当前设备，再补查缺失证据。');
    await readOnlyNote(page);
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByText('已发布到系统，新说明用于后续任务。', { exact: true }).waitFor();
    assert.equal(writes.length, 1);
    assert.deepEqual(Object.keys(writes[0]).sort(), ['expected_revision', 'version', 'goal', 'document', 'reason', 'test_id', 'human_confirmed'].sort());
    assert.equal(writes[0].human_confirmed, true);
    assert.equal(writes[0].test_id, 'c'.repeat(32));
    assert.equal(writes[0].expected_revision, 'a'.repeat(64));
    assert.equal(writes[0].version, '1.1');
    assert.match(writes[0].document, /先核对当前设备/);
    assert.equal(await page.getByText('上次修改：2026-10-12 10:30:00', { exact: true }).count(), 1);
    await page.reload();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox', { name: '技能正文', exact: true }).waitFor();
    assert.match(await page.getByRole('textbox', { name: '技能正文', exact: true }).innerText(), /先核对当前设备/);
    assert.equal(await page.getByText('上次修改：2026-10-12 10:30:00', { exact: true }).count(), 1);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('未获编辑权限的账号只读，不能编辑或保存技能', async () => {
  const { fixture, page, writes, errors } = await setup({ role: 'viewer' });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByText('当前账号只读；请使用有效维修小组账号更新技能。', { exact: true }).waitFor();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    assert.equal(await page.getByRole('textbox', { name: '技能正文', exact: true }).isEditable(), false);
    assert.equal(await page.getByRole('button', { name: '发布到系统', exact: true }).count(), 0);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('项目现有维修人员账号可以直接更新技能', async () => {
  const { fixture, page, writes } = await setup({ role: 'technician' });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const document = page.getByRole('textbox', { name: '技能正文', exact: true });
    await document.waitFor(); assert.equal(await document.isEditable(), true);
    await document.fill('维修人员经验\n\n先核对报警与现场数据。');
    await readOnlyNote(page);
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByText('已发布到系统，新说明用于后续任务。', { exact: true }).waitFor();
    assert.equal(writes.length, 1);
  } finally { await fixture.close(); }
});

test('版本冲突保留草稿，刷新只取新基线不自动覆盖正文', async () => {
  const { fixture, page, writes } = await setup({ conflict: true });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const document = page.getByRole('textbox', { name: '技能正文', exact: true });
    await document.waitFor(); await document.fill('我的现场经验\n\n检查接线。');
    await readOnlyNote(page);
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '技能已被其它修改更新' }).waitFor();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    assert.match(await document.innerText(), /我的现场经验/);
    assert.equal(writes.length, 1);
    await page.getByRole('button', { name: '刷新技能', exact: true }).click();
    await page.getByText('已刷新技能内容；你的未保存草稿已保留，请核对后保存。', { exact: true }).waitFor();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    assert.match(await document.innerText(), /我的现场经验/);
    await page.getByRole('article', { name: '最新已保存正文（只读）', exact: true }).waitFor();
    assert.match(await page.getByRole('article', { name: '最新已保存正文（只读）', exact: true }).innerText(), /其他专家新版/);
    assert.match(await page.getByRole('region', { name: '新版对照', exact: true }).innerText(), /上次修改：2026-10-12 09:20:00/);
    assert.doesNotMatch(await page.getByRole('region', { name: '新版对照', exact: true }).innerText(), /版本：/);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    assert.equal(await page.getByRole('button', { name: '发布到系统', exact: true }).isDisabled(), true);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await document.fill('合并的现场经验\n\n检查接线并增加振动复核。');
    await page.getByRole('button', { name: '确认已核对，采用新基线', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: '技能目标', exact: true }).inputValue(), '新版设备证据目标');
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '技能已被其它修改更新' }).waitFor();
    assert.equal(writes[1].expected_revision, 'b'.repeat(64));
    assert.equal(writes[1].goal, '新版设备证据目标');
    assert.equal(writes[1].version, '1.3');
    assert.match(writes[1].document, /检查接线并增加振动复核/);
  } finally { await fixture.close(); }
});

test('测试结果必须人工核对，修改草稿或样例后立即要求重新测试', async () => {
  const { fixture, page, writes, trials } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    const publish = page.getByRole('button', { name: '发布到系统', exact: true });
    await publish.waitFor(); assert.equal(await publish.isDisabled(), true);
    await readOnlyNote(page);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    await page.getByRole('heading', { name: '试运行结果', exact: true }).waitFor();
    assert.equal(await publish.isDisabled(), true);
    await page.getByRole('checkbox', { name: '我已核对测试结果，确认符合预期', exact: true }).check();
    assert.equal(await publish.isDisabled(), false);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox', { name: '技能正文', exact: true }).fill('新的未经测试内容');
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    assert.equal(await publish.isDisabled(), true);
    assert.equal(await page.getByRole('heading', { name: '试运行结果', exact: true }).count(), 0);
    await testAndReview(page);
    await page.getByText('测试配置与预期',{exact:true}).click();
    await page.getByRole('textbox', { name: '预期结果', exact: true }).fill('另一个故障的预期结果');
    assert.equal(await publish.isDisabled(), true);
    assert.equal(trials.length, 2); assert.deepEqual(writes, []);
  } finally { await fixture.close(); }
});

test('测试失败不允许发布；退出后迟到的测试结果不能恢复旧账号页面', async () => {
  const failed = await setup({ testFailure: true });
  try {
    await failed.page.goto(failed.fixture.base + '/?view=expert');
    await readOnlyNote(failed.page);
    await failed.page.getByRole('button', { name: '测试修改', exact: true }).click();
    await failed.page.getByRole('alert').filter({ hasText: '测试未完成' }).waitFor();
    assert.equal(await failed.page.getByRole('button', { name: '发布到系统', exact: true }).isDisabled(), true);
    assert.deepEqual(failed.writes, []);
  } finally { await failed.fixture.close(); }
  const delayedTrial = { started: deferred(), release: deferred() };
  const { fixture, page, writes } = await setup({ delayedTrial });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await readOnlyNote(page);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    await delayedTrial.started.promise;
    await page.locator('.team-access').evaluate(element => { element.open = true; });
    await page.getByRole('button', { name: '退出登录', exact: true }).click();
    await page.getByText('请先登录维修小组账号。', { exact: true }).waitFor();
    delayedTrial.release.resolve();
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    assert.equal(await page.getByRole('heading', { name: '试运行结果', exact: true }).count(), 0);
    assert.deepEqual(writes, []);
  } finally { delayedTrial.release.resolve(); await fixture.close(); }
});

test('切换左侧中心后返回，当前身份的未保存草稿不丢失', async () => {
  const { fixture, page, writes, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab', {name:'技能内容',exact:true}).click();
    const document = page.getByRole('textbox', { name: '技能正文', exact: true });
    await document.waitFor(); await document.fill('不要丢失的现场草稿\n\n核对设备。');
    await page.getByRole('button', { name: '知识问答', exact: true }).click();
    await page.getByRole('button', { name: '专家中心', exact: true }).click();
    await document.waitFor();
    assert.match(await document.innerText(), /不要丢失的现场草稿/);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('未登录不读取技能，左侧入口仍保留', async () => {
  const { fixture, page, writes } = await setup({ role: null });
  try {
    const reads = []; page.on('request', req => { if (req.url().includes('/api/expert/')) reads.push(req.url()); });
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('button', { name: '专家中心', exact: true }).waitFor();
    await page.getByText('请先登录维修小组账号。', { exact: true }).waitFor();
    assert.deepEqual(reads, []); assert.deepEqual(writes, []);
  } finally { await fixture.close(); }
});

test('退出账号后迟到的技能详情不能恢复旧账号编辑器', async () => {
  const delayedRead = { started: deferred(), release: deferred() };
  const { fixture, page, writes, errors } = await setup({ delayedRead });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await delayedRead.started.promise;
    await page.locator('.team-access').evaluate(element => { element.open = true; });
    await page.getByRole('button', { name: '退出登录', exact: true }).click();
    await page.getByText('请先登录维修小组账号。', { exact: true }).waitFor();
    delayedRead.release.resolve();
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    assert.equal(await page.getByRole('textbox', { name: '技能正文', exact: true }).count(), 0);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { delayedRead.release.resolve(); await fixture.close(); }
});

test('现有机器测试等待人工维修、复机和报告，重新打开页面继续同一测试', async () => {
  const { fixture, page, trials, writes, completions, finishReport, errors } = await setup({ machineFlow: true });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await readOnlyNote(page);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    await page.getByRole('link', { name: 'WO-MACHINE-NEW', exact: true }).waitFor();
    await page.getByText('查看机器流程详情',{exact:true}).click();
    const details = page.getByRole('region', {name:'测试详情',exact:true});
    await details.getByRole('heading', {name:'智能诊断结果',exact:true}).waitFor();
    assert.match(await details.innerText(), /刀塔旋转超时|就位反馈/);
    assert.match(await details.innerText(), /检查刀塔反馈线路|复测就位信号/);
    assert.match(await details.innerText(), /700006|测试车床/);
    const publish = page.getByRole('button', { name: '发布到系统', exact: true });
    assert.equal(await publish.isDisabled(), true);
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    assert.equal(await page.getByRole('textbox', { name: '技能目标', exact: true }).isDisabled(), true);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    assert.equal(trials[0].machine.device_id, 'D-1');
    assert.equal(trials[0].machine.scenario_id, 'turret');
    assert.equal('sample' in trials[0], false);
    await page.reload();
    await page.getByRole('link', { name: 'WO-MACHINE-NEW', exact: true }).waitFor();
    assert.equal(trials.length, 1);
    await page.getByRole('textbox', { name: '处理说明', exact: true }).fill('模拟检修完成，刀塔就位反馈恢复');
    await page.getByRole('button', { name: '确认维修完成并复机', exact: true }).click();
    await page.getByText('整线复机：已完成', { exact: true }).waitFor();
    await page.getByText('查看机器流程详情',{exact:true}).click();
    await details.getByText('模拟检修完成，刀塔就位反馈恢复', {exact:true}).waitFor();
    assert.equal(await publish.isDisabled(), true);
    assert.deepEqual(completions, [{ workorder_id: 'WO-MACHINE-NEW', feedback: '模拟检修完成，刀塔就位反馈恢复' }]);
    finishReport();
    await page.getByRole('heading', { name: '试运行结果', exact: true }).waitFor();
    assert.match(await details.innerText(), /本次刀塔故障处理完成，反馈线路复测正常，设备已恢复运行/);
    await page.getByRole('checkbox', { name: '我已核对测试结果，确认符合预期', exact: true }).check();
    assert.equal(await publish.isDisabled(), false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('技能正文更新后仍可查看本轮处理详情，但旧测试不能发布新正文', async () => {
  const {fixture, page, finishReport, writes} = await setup({machineFlow:true});
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox', {name:'技能正文',exact:true}).waitFor();
    await page.evaluate(saved => sessionStorage.setItem('expert-machine-test:U-EXPERT', JSON.stringify(saved)), {
      skill, revision:'0'.repeat(64), test_id:'c'.repeat(32),
      draft:{version:'1.1',goal:'旧稿目标',document:'旧稿不应覆盖最新正文',reason:'旧测试'},
      machine:{device_id:'D-1',scenario_id:'turret',expected:'复机并保存报告'},
    });
    await page.reload();
    await page.getByText('查看机器流程详情',{exact:true}).click();
    const details = page.getByRole('region', {name:'测试详情',exact:true});
    await details.getByText('技能说明已更新，本轮结果仅供查看；请用当前内容重新测试后发布。', {exact:true}).waitFor();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    assert.match(await page.getByRole('textbox', {name:'技能正文',exact:true}).innerText(), /不能编造证据/);
    await page.getByRole('tab',{name:'测试与结果',exact:true}).click();
    assert.match(await details.innerText(), /检查刀塔反馈线路/);
    finishReport();
    await page.getByRole('heading', {name:'试运行结果',exact:true}).waitFor();
    assert.equal(await page.getByRole('checkbox', {name:'我已核对测试结果，确认符合预期',exact:true}).isDisabled(), true);
    assert.equal(await page.getByRole('button', {name:'发布到系统',exact:true}).isDisabled(), true);
    assert.deepEqual(writes, []);
  } finally { await fixture.close(); }
});
