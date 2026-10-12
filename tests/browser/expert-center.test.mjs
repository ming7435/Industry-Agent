import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const skill = { agent: 'diagnosis', agent_label: '智能诊断', name: 'alarm_diagnosis_skill',
  title: '报警诊断', version: '1.0', goal: '核对故障证据', internal_loop: true,
  loop_description: '诊断循环：根据证据决定补查工具，再校验结论。',
  revision: 'a'.repeat(64), document: '# 报警诊断\n\n不能编造证据。',
  tools: ['get_device_logs'], steps: ['collect_evidence'], stop_conditions: [] };

async function setup({ role = 'technician', conflict = false, delayedRead = null, testFailure = false, delayedTrial = null,
  machineFlow = false, document = skill.document, result = { summary: '样例刀塔旋转超时', diagnosis: '需核对就位反馈', recommendation: '检查分度机构' } } = {}) {
  const fixture = await centerFixture({ fullApp: true });
  const page = await fixture.browser.newPage();
  page.setDefaultTimeout(8000);
  const writes = [], trials = [], errors = [], completions = [];
  let flowStage = 'awaiting_repair';
  const actor = role ? { user_id: 'U-EXPERT', username: '专家', role } : null;
  let current = { ...skill, document };
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/api/team/me') return respond(route, { user: actor }, actor ? 200 : 401);
    if (path === '/api/team/logout') return respond(route, {});
    if (path === '/api/expert/skills') return respond(route, { items: [current], can_edit: ['supervisor', 'technician'].includes(role) });
    if (path === '/api/expert/machines') return respond(route, { items: [{ device_id: 'D-1', name: '测试车床',
      scenarios: [{ scenario_id: 'turret', name: '刀塔旋转超时', alarm_code: '700006' }] }] });
    const trialResult = () => ({ test_id: 'c'.repeat(32), status: testFailure ? 'failed' : machineFlow ? flowStage : 'completed', mode: 'machine_flow',
      scope: '现有模拟机器全流程。', sample: { expected: trials.at(-1)?.machine.expected },
      result: testFailure ? null : result,
      workorders: machineFlow ? [{ workorder_id: 'WO-MACHINE-NEW', assignee: 'U-EXPERT', status: flowStage === 'awaiting_repair' ? 'in_progress' : 'completed' }] : [],
      progress: machineFlow ? [{ label: '智能诊断', completed: true }, { label: '整线复机', completed: flowStage !== 'awaiting_repair' },
        { label: '汇总报告', completed: flowStage === 'completed' }] : [],
      report_id: machineFlow && flowStage === 'completed' ? 'R-MACHINE-NEW' : '',
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
      if (req.method() === 'GET' && delayedRead) {
        delayedRead.started.resolve();
        return delayedRead.release.promise.then(() => respond(route, { ...current, can_edit: true })).catch(() => {});
      }
      if (req.method() === 'POST') {
        const body = req.postDataJSON(); writes.push(body);
        if (conflict) {
          current = { ...current, document: '# 其他专家新版\n\n增加了振动复核。', goal: '新版设备证据目标', version: '1.2', revision: 'b'.repeat(64) };
          return respond(route, { detail: '技能已被其它修改更新，请先刷新' }, 409);
        }
        current = { ...current, ...body, revision: 'b'.repeat(64) };
      }
      return respond(route, { ...current, can_edit: ['supervisor', 'technician'].includes(role) });
    }
    if (req.method() !== 'GET') throw new Error('意外业务写入：' + path);
    return respond(route, { items: [], devices: [], runs: [], state: 'unknown', runner: {} });
  });
  return { fixture, page, writes, trials, errors, completions, finishReport: () => { flowStage = 'completed'; } };
}

async function testAndReview(page) {
  await page.getByRole('button', { name: '测试修改', exact: true }).click();
  await page.getByRole('heading', { name: '试运行结果', exact: true }).waitFor();
  await page.getByRole('checkbox', { name: '我已核对测试结果，确认符合预期', exact: true }).check();
}

test('专家正文直接展示文章格式，未编辑的正文测试时保持原文', async () => {
  const source = '# 报警诊断\n\n## 检查方法\n\n先核对 **设备** 和 `alarm_code`。\n\n- [检查说明](L:/industry_agent/check.py)\n- 再核对现场反馈。';
  const { fixture, page, trials, errors } = await setup({ document: source });
  try {
    await page.goto(fixture.base + '/?view=expert');
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor();
    assert.equal(await editor.getByRole('heading', { name: '报警诊断', level: 1 }).count(), 1);
    assert.equal(await editor.getByRole('heading', { name: '检查方法', level: 2 }).count(), 1);
    assert.equal(await editor.getByRole('listitem').count(), 2);
    assert.doesNotMatch(await editor.innerText(), /#|\*\*|`|\[检查说明\]/);
    assert.equal(await page.getByText('技能正文（Markdown）', { exact: true }).count(), 0);
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('核对现有说明');
    await testAndReview(page);
    assert.equal(trials[0].document, source);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('普通文章编辑保留标题、引用、表格及示例内容，发布的内容与测试一致', async () => {
  const source = '# 报警诊断\n\n先核对 **设备** 和 `alarm_code`。\n\n- [检查说明](L:/industry_agent/check.py)\n\n| 项目 | 状态 |\n| --- | --- |\n| 就位信号 | 0 |\n\n```json\n{"signal":0}\n\n\n{"expected":1}\n```\n\n保留现场记录。';
  const { fixture, page, trials, writes, errors } = await setup({ document: source });
  try {
    await page.goto(fixture.base + '/?view=expert');
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor();
    await editor.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element.querySelector('p')); range.collapse(false);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      element.focus();
    });
    await page.keyboard.insertText('人工补充反馈检查。');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('增加反馈检查');
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
    await page.reload(); await editor.waitFor();
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
    const editor = page.getByRole('textbox', { name: '技能正文', exact: true });
    await editor.waitFor(); await editor.fill('人工维修经验');
    await page.getByRole('toolbar', { name: '正文排版' }).getByRole('button', { name: '标题', exact: true }).click();
    assert.equal(await editor.getByRole('heading', { name: '人工维修经验', level: 1 }).count(), 1);
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('调整标题');
    await testAndReview(page);
    assert.match(trials[0].document, /^# 人工维修经验/);
    await editor.fill('');
    await page.getByRole('alert').filter({ hasText: '请填写技能正文' }).waitFor();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    assert.equal(trials.length, 1);
    await editor.fill('长'.repeat(24001));
    await page.getByRole('alert').filter({ hasText: '最多填写 24000 个字符' }).first().waitFor();
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    assert.equal(trials.length, 1);
    assert.equal(await page.getByRole('button', { name: '发布到系统', exact: true }).isDisabled(), true);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('试运行建议以正常段落显示，粘贴正文不会执行 HTML', async () => {
  const { fixture, page, errors } = await setup({ result: { summary: '**刀塔超时**', diagnosis: '需核对 `alarm_code`', recommendation: '## 检查方法\n\n- 核对分度机构\n- 确认反馈' } });
  try {
    await page.goto(fixture.base + '/?view=expert');
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
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('核对排版');
    await testAndReview(page);
    const recommendation = page.getByRole('article', { name: '处理建议', exact: true });
    assert.equal(await recommendation.getByRole('heading', { name: '检查方法', level: 2 }).count(), 1);
    assert.equal(await recommendation.getByRole('listitem').count(), 2);
    assert.doesNotMatch(await recommendation.innerText(), /##|^- /m);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('左侧专家中心打开循环技能，账号编辑普通正文并测试发布', async () => {
  const { fixture, page, writes, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('button', { name: '专家中心', exact: true }).waitFor();
    await page.getByRole('heading', { name: '专家中心', exact: true }).waitFor();
    await page.getByRole('textbox', { name: '技能正文', exact: true }).waitFor();
    await page.getByRole('textbox', { name: '技能正文', exact: true }).fill('报警诊断\n\n先核对当前设备，再补查缺失证据。');
    await page.getByRole('textbox', { name: '版本号', exact: true }).fill('1.1');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('补充设备核对');
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByText('已发布到系统，新说明用于后续任务。', { exact: true }).waitFor();
    assert.equal(writes.length, 1);
    assert.deepEqual(Object.keys(writes[0]).sort(), ['expected_revision', 'version', 'goal', 'document', 'reason', 'test_id', 'human_confirmed'].sort());
    assert.equal(writes[0].human_confirmed, true);
    assert.equal(writes[0].test_id, 'c'.repeat(32));
    assert.equal(writes[0].expected_revision, 'a'.repeat(64));
    assert.match(writes[0].document, /先核对当前设备/);
    await page.reload();
    await page.getByRole('textbox', { name: '技能正文', exact: true }).waitFor();
    assert.match(await page.getByRole('textbox', { name: '技能正文', exact: true }).innerText(), /先核对当前设备/);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('未获编辑权限的账号只读，不能编辑或保存技能', async () => {
  const { fixture, page, writes, errors } = await setup({ role: 'viewer' });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByText('当前账号只读；请使用有效维修小组账号更新技能。', { exact: true }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: '技能正文', exact: true }).isEditable(), false);
    assert.equal(await page.getByRole('button', { name: '发布到系统', exact: true }).count(), 0);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('项目现有维修人员账号可以直接更新技能', async () => {
  const { fixture, page, writes } = await setup({ role: 'technician' });
  try {
    await page.goto(fixture.base + '/?view=expert');
    const document = page.getByRole('textbox', { name: '技能正文', exact: true });
    await document.waitFor(); assert.equal(await document.isEditable(), true);
    await document.fill('维修人员经验\n\n先核对报警与现场数据。');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('补充现场经验');
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
    const document = page.getByRole('textbox', { name: '技能正文', exact: true });
    await document.waitFor(); await document.fill('我的现场经验\n\n检查接线。');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('补充');
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '技能已被其它修改更新' }).waitFor();
    assert.match(await document.innerText(), /我的现场经验/);
    assert.equal(writes.length, 1);
    await page.getByRole('button', { name: '刷新技能', exact: true }).click();
    await page.getByText('已刷新当前版本；你的未保存草稿已保留，请核对后保存。', { exact: true }).waitFor();
    assert.match(await document.innerText(), /我的现场经验/);
    await page.getByRole('article', { name: '最新已保存正文（只读）', exact: true }).waitFor();
    assert.match(await page.getByRole('article', { name: '最新已保存正文（只读）', exact: true }).innerText(), /其他专家新版/);
    assert.equal(await page.getByRole('button', { name: '发布到系统', exact: true }).isDisabled(), true);
    await document.fill('合并的现场经验\n\n检查接线并增加振动复核。');
    await page.getByRole('button', { name: '确认已核对，采用新基线', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: '技能目标', exact: true }).inputValue(), '新版设备证据目标');
    await testAndReview(page);
    await page.getByRole('button', { name: '发布到系统', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '技能已被其它修改更新' }).waitFor();
    assert.equal(writes[1].expected_revision, 'b'.repeat(64));
    assert.equal(writes[1].goal, '新版设备证据目标');
    assert.equal(writes[1].version, '1.2');
    assert.match(writes[1].document, /检查接线并增加振动复核/);
  } finally { await fixture.close(); }
});

test('测试结果必须人工核对，修改草稿或样例后立即要求重新测试', async () => {
  const { fixture, page, writes, trials } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    const publish = page.getByRole('button', { name: '发布到系统', exact: true });
    await publish.waitFor(); assert.equal(await publish.isDisabled(), true);
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('验证新说明');
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    await page.getByRole('heading', { name: '试运行结果', exact: true }).waitFor();
    assert.equal(await publish.isDisabled(), true);
    await page.getByRole('checkbox', { name: '我已核对测试结果，确认符合预期', exact: true }).check();
    assert.equal(await publish.isDisabled(), false);
    await page.getByRole('textbox', { name: '技能正文', exact: true }).fill('新的未经测试内容');
    assert.equal(await publish.isDisabled(), true);
    assert.equal(await page.getByRole('heading', { name: '试运行结果', exact: true }).count(), 0);
    await testAndReview(page);
    await page.getByRole('textbox', { name: '预期结果', exact: true }).fill('另一个故障的预期结果');
    assert.equal(await publish.isDisabled(), true);
    assert.equal(trials.length, 2); assert.deepEqual(writes, []);
  } finally { await fixture.close(); }
});

test('测试失败不允许发布；退出后迟到的测试结果不能恢复旧账号页面', async () => {
  const failed = await setup({ testFailure: true });
  try {
    await failed.page.goto(failed.fixture.base + '/?view=expert');
    await failed.page.getByRole('textbox', { name: '修改说明', exact: true }).fill('验证失败');
    await failed.page.getByRole('button', { name: '测试修改', exact: true }).click();
    await failed.page.getByRole('alert').filter({ hasText: '测试未完成' }).waitFor();
    assert.equal(await failed.page.getByRole('button', { name: '发布到系统', exact: true }).isDisabled(), true);
    assert.deepEqual(failed.writes, []);
  } finally { await failed.fixture.close(); }
  const delayedTrial = { started: deferred(), release: deferred() };
  const { fixture, page, writes } = await setup({ delayedTrial });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('延迟测试');
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
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('使用模拟机器核对全流程');
    await page.getByRole('button', { name: '测试修改', exact: true }).click();
    await page.getByRole('link', { name: 'WO-MACHINE-NEW', exact: true }).waitFor();
    const publish = page.getByRole('button', { name: '发布到系统', exact: true });
    assert.equal(await publish.isDisabled(), true);
    assert.equal(await page.getByRole('textbox', { name: '版本号', exact: true }).isDisabled(), true);
    assert.equal(trials[0].machine.device_id, 'D-1');
    assert.equal(trials[0].machine.scenario_id, 'turret');
    assert.equal('sample' in trials[0], false);
    await page.reload();
    await page.getByRole('link', { name: 'WO-MACHINE-NEW', exact: true }).waitFor();
    assert.equal(trials.length, 1);
    await page.getByRole('textbox', { name: '处理说明', exact: true }).fill('模拟检修完成，刀塔就位反馈恢复');
    await page.getByRole('button', { name: '确认维修完成并复机', exact: true }).click();
    await page.getByText('整线复机：已完成', { exact: true }).waitFor();
    assert.equal(await publish.isDisabled(), true);
    assert.deepEqual(completions, [{ workorder_id: 'WO-MACHINE-NEW', feedback: '模拟检修完成，刀塔就位反馈恢复' }]);
    finishReport();
    await page.getByRole('heading', { name: '试运行结果', exact: true }).waitFor();
    await page.getByRole('checkbox', { name: '我已核对测试结果，确认符合预期', exact: true }).check();
    assert.equal(await publish.isDisabled(), false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});
