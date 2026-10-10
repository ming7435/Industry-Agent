import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const skill = { agent: 'diagnosis', agent_label: '智能诊断', name: 'alarm_diagnosis_skill',
  title: '报警诊断', version: '1.0', goal: '核对故障证据', internal_loop: true,
  loop_description: '诊断循环：根据证据决定补查工具，再校验结论。',
  revision: 'a'.repeat(64), document: '# 报警诊断\n\n不能编造证据。',
  tools: ['get_device_logs'], steps: ['collect_evidence'], stop_conditions: [] };

async function setup({ role = 'supervisor', conflict = false, delayedRead = null } = {}) {
  const fixture = await centerFixture({ fullApp: true });
  const page = await fixture.browser.newPage();
  page.setDefaultTimeout(4000);
  const writes = [], errors = [];
  const actor = role ? { user_id: 'U-EXPERT', username: '专家', role } : null;
  let current = { ...skill };
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/api/team/me') return respond(route, { user: actor }, actor ? 200 : 401);
    if (path === '/api/team/logout') return respond(route, {});
    if (path === '/api/expert/skills') return respond(route, { items: [current], can_edit: ['supervisor', 'technician'].includes(role) });
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
  return { fixture, page, writes, errors };
}

test('左侧专家中心打开循环技能，监督账号保存真实 Markdown 更新', async () => {
  const { fixture, page, writes, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByRole('button', { name: '专家中心', exact: true }).waitFor();
    await page.getByRole('heading', { name: '专家中心', exact: true }).waitFor();
    await page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true }).waitFor();
    await page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true }).fill('# 报警诊断\n\n先核对当前设备，再补查缺失证据。');
    await page.getByRole('textbox', { name: '版本号', exact: true }).fill('1.1');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('补充设备核对');
    await page.getByRole('button', { name: '保存更新', exact: true }).click();
    await page.getByText('更新已保存，下次任务加载时生效。', { exact: true }).waitFor();
    assert.equal(writes.length, 1);
    assert.deepEqual(Object.keys(writes[0]).sort(), ['expected_revision', 'version', 'goal', 'document', 'reason'].sort());
    assert.equal(writes[0].expected_revision, 'a'.repeat(64));
    assert.match(writes[0].document, /先核对当前设备/);
    await page.reload();
    await page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true }).waitFor();
    assert.match(await page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true }).inputValue(), /先核对当前设备/);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('未获编辑权限的账号只读，不能编辑或保存技能', async () => {
  const { fixture, page, writes, errors } = await setup({ role: 'viewer' });
  try {
    await page.goto(fixture.base + '/?view=expert');
    await page.getByText('当前账号只读；请使用有效维修小组账号更新技能。', { exact: true }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true }).isEditable(), false);
    assert.equal(await page.getByRole('button', { name: '保存更新', exact: true }).count(), 0);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('项目现有维修人员账号可以直接更新技能', async () => {
  const { fixture, page, writes } = await setup({ role: 'technician' });
  try {
    await page.goto(fixture.base + '/?view=expert');
    const document = page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true });
    await document.waitFor(); assert.equal(await document.isEditable(), true);
    await document.fill('# 维修人员经验\n\n先核对报警与现场数据。');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('补充现场经验');
    await page.getByRole('button', { name: '保存更新', exact: true }).click();
    await page.getByText('更新已保存，下次任务加载时生效。', { exact: true }).waitFor();
    assert.equal(writes.length, 1);
  } finally { await fixture.close(); }
});

test('版本冲突保留草稿，刷新只取新基线不自动覆盖正文', async () => {
  const { fixture, page, writes } = await setup({ conflict: true });
  try {
    await page.goto(fixture.base + '/?view=expert');
    const document = page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true });
    await document.waitFor(); await document.fill('# 我的现场经验\n\n检查接线。');
    await page.getByRole('textbox', { name: '修改说明', exact: true }).fill('补充');
    await page.getByRole('button', { name: '保存更新', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '技能已被其它修改更新' }).waitFor();
    assert.match(await document.inputValue(), /我的现场经验/);
    assert.equal(writes.length, 1);
    await page.getByRole('button', { name: '刷新技能', exact: true }).click();
    await page.getByText('已刷新当前版本；你的未保存草稿已保留，请核对后保存。', { exact: true }).waitFor();
    assert.match(await document.inputValue(), /我的现场经验/);
    await page.getByRole('textbox', { name: '最新已保存正文（只读）', exact: true }).waitFor();
    assert.match(await page.getByRole('textbox', { name: '最新已保存正文（只读）', exact: true }).inputValue(), /其他专家新版/);
    assert.equal(await page.getByRole('button', { name: '保存更新', exact: true }).isDisabled(), true);
    await document.fill('# 合并的现场经验\n\n检查接线并增加振动复核。');
    await page.getByRole('button', { name: '确认已核对，采用新基线', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: '技能目标', exact: true }).inputValue(), '新版设备证据目标');
    await page.getByRole('button', { name: '保存更新', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '技能已被其它修改更新' }).waitFor();
    assert.equal(writes[1].expected_revision, 'b'.repeat(64));
    assert.equal(writes[1].goal, '新版设备证据目标');
    assert.equal(writes[1].version, '1.2');
    assert.match(writes[1].document, /检查接线并增加振动复核/);
  } finally { await fixture.close(); }
});

test('切换左侧中心后返回，当前身份的未保存草稿不丢失', async () => {
  const { fixture, page, writes, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=expert');
    const document = page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true });
    await document.waitFor(); await document.fill('# 不要丢失的现场草稿\n\n核对设备。');
    await page.getByRole('button', { name: '知识问答', exact: true }).click();
    await page.getByRole('button', { name: '专家中心', exact: true }).click();
    await document.waitFor();
    assert.match(await document.inputValue(), /不要丢失的现场草稿/);
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
    assert.equal(await page.getByRole('textbox', { name: '技能正文（Markdown）', exact: true }).count(), 0);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { delayedRead.release.resolve(); await fixture.close(); }
});
