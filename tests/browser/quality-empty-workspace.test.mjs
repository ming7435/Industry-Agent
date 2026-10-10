import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

const runId = 'FC-' + 'a'.repeat(64);
const completed = { run_id: runId, status: 'completed', prompt: '直径30mm的圆柱',
  part_name: '生产销轴', part_number: '00321', validation: { valid: true, solid_count: 1 },
  spec: { units: 'mm', operations: [{ type: 'cylinder', mode: 'add', diameter: 30, length: 50 }] },
  artifacts: [], calls: [], answer: '建模完成' };
const savedSession = { run_id: runId, prompt: '直径30mm的圆柱', command_id: 'existing-command',
  part_name: '会话旧名称', part_number: 'OLD-001',
  draft_part_name: '未提交新零件', draft_part_number: 'DRAFT-999' };

async function setup({ session = null, record = completed, recordStatus = 200, versions = [], records = {}, ...options } = {}) {
  const fixture = await centerFixture(options);
  const page = await fixture.browser.newPage();
  const qualityRequests = [], writes = [], errors = [], designReads = [];
  page.setDefaultTimeout(5000);
  await page.addInitScript(({ session, versions }) => {
    if (sessionStorage.getItem('quality.fixture-seeded')) return;
    sessionStorage.setItem('quality.fixture-seeded', '1');
    if (session) sessionStorage.setItem('freecad.active-run', JSON.stringify(session));
    sessionStorage.setItem('freecad.design-versions', JSON.stringify(versions));
  }, { session, versions });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (/\/quality(?:\/|$)|\/closure-tasks(?:\/|$)/.test(path)) qualityRequests.push(path);
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(path);
    if (path.startsWith('/api/cad/freecad/runs/')) {
      designReads.push(path);
      const id = path.split('/').at(-1);
      if (Object.hasOwn(records, id)) return records[id] === null
        ? respond(route, { detail: '运行记录不存在' }, 404) : respond(route, records[id]);
      return respond(route, record, recordStatus);
    }
    if (path.endsWith('/team/me')) return respond(route, {}, 401);
    return respond(route, { items: [{ quality_check_id: 'QC-OLD', result: 'failed' }], devices: [], runs: [],
      runner: { last_error: options.fullApp ? 'Factory unavailable' : '' } });
  });
  return { fixture, page, qualityRequests, writes, errors, designReads };
}

function identity(page, label) {
  if (label === '零件名称') return page.getByRole('combobox', { name: label, exact: true }).locator('option:checked');
  return page.getByRole('region', { name: '检测零件', exact: true })
    .locator('div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');
}

test('没有可选模型时保留检测入口和待检测结果，不显示参数表单或历史', async () => {
  const { fixture, page, qualityRequests, writes, errors, designReads } = await setup();
  try {
    await page.goto(fixture.base + '/?view=quality&design_run_id=FC-old');
    const workspace = page.getByRole('region', { name: '质检系统', exact: true });
    await page.getByRole('heading', { name: '质量检测', exact: true }).waitFor();
    await page.getByRole('heading', { name: '检测零件', exact: true }).waitFor();
    assert.equal(await identity(page, '零件名称').textContent(), '暂无已完成零件');
    assert.equal(await identity(page, '零件编号').textContent(), '—');
    assert.equal(await workspace.locator('input, form, table, a').count(), 0);
    assert.equal(await page.getByRole('region', { name: '检测零件', exact: true }).locator('dt').count(), 2);
    const start = workspace.getByRole('button', { name: '开始检测', exact: true });
    assert.equal(await start.count(), 1);
    assert.equal(await start.isDisabled(), true);
    const result = workspace.getByRole('region', { name: '检测结果', exact: true });
    assert.equal(await result.getByText('待检测', { exact: true }).count(), 1);
    assert.equal(await result.getByText('请先选择生产建模中的已完成零件。', { exact: true }).count(), 1);
    assert.deepEqual(await result.locator('.quality-rate-fields dd').allTextContents(), ['—', '—', '—']);
    assert.equal(await workspace.getByRole('combobox', { name: '零件名称', exact: true }).count(), 1);
    assert.deepEqual(designReads, []);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('从生产建模当前已完成版本读取名称编号，不使用草稿，刷新仅回查原版本', async () => {
  const { fixture, page, qualityRequests, writes, errors, designReads } = await setup({ session: savedSession });
  try {
    await page.goto(fixture.base + '/?view=quality');
    await page.getByText('00321', { exact: true }).waitFor();
    assert.equal(await identity(page, '零件名称').textContent(), '生产销轴');
    assert.equal(await identity(page, '零件编号').textContent(), '00321');
    assert.doesNotMatch(await page.locator('.quality-workspace').textContent(), /未提交新零件|DRAFT-999|OLD-001/);
    await page.reload();
    await page.getByText('00321', { exact: true }).waitFor();
    assert.deepEqual(designReads, ['/api/cad/freecad/runs/' + runId, '/api/cad/freecad/runs/' + runId]);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('旧服务缺少标识字段时，只继承该已完成版本的会话标识，不读取新草稿', async () => {
  const { part_name, part_number, ...legacy } = completed;
  const { fixture, page, writes } = await setup({ session: { ...savedSession, part_number: '00456' }, record: legacy });
  try {
    await page.goto(fixture.base + '/?view=quality');
    await page.getByText('00456', { exact: true }).waitFor();
    assert.equal(await identity(page, '零件名称').textContent(), '会话旧名称');
    assert.equal(await identity(page, '零件编号').textContent(), '00456');
    assert.doesNotMatch(await page.locator('.quality-workspace').textContent(), /未提交新零件|DRAFT-999/);
    assert.deepEqual(writes, []);
  } finally { await fixture.close(); }
});

for (const [suffix, expected] of [['00016973', '92531'], ['00000009', '00009']]) {
  test(`质量检测的零件编号自动沿用生产建模设计短号 ${expected}，查询仍使用完整运行编号`, async () => {
    const currentId = 'FC-' + 'a'.repeat(56) + suffix;
    const record = { ...completed, run_id: currentId, part_name: '安装底板', part_number: '' };
    if (expected === '00009') delete record.part_number; // 兼容旧服务缺少标识字段。
    const session = { ...savedSession, run_id: currentId, part_name: '安装底板', part_number: '' };
    const { fixture, page, writes, errors, designReads, qualityRequests } = await setup({ fullApp: true, session, record });
    try {
      await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
      assert.equal(await identity(page, '零件名称').textContent(), '安装底板');
      assert.equal(await identity(page, '零件编号').textContent(), expected);
      assert.doesNotMatch(await page.locator('.quality-workspace').textContent(), /未提交新零件|DRAFT-999/);
      await page.getByRole('button', { name: '生产建模', exact: true }).click();
      const cadIdentity = page.getByRole('region', { name: '当前零件标识', exact: true });
      await cadIdentity.getByText('安装底板', { exact: true }).waitFor();
      assert.equal(await cadIdentity.locator('strong').textContent(), expected);
      await page.getByRole('button', { name: '质检系统', exact: true }).click();
      await page.getByText(expected, { exact: true }).waitFor();
      await page.reload();
      await page.getByText(expected, { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('freecad.active-run')).run_id), currentId);
      assert.equal(designReads.length, 4);
      assert(designReads.every(path => path === '/api/cad/freecad/runs/' + currentId));
      assert.deepEqual(qualityRequests, []);
      assert.deepEqual(writes, []);
      assert.deepEqual(errors, []);
    } finally { await fixture.close(); }
  });
}

test('模型记录不存在时显示空值，不借用缓存标识，也不执行任何业务操作', async () => {
  const { fixture, page, writes, errors, designReads, qualityRequests } = await setup({
    session: savedSession, record: { detail: '运行记录不存在' }, recordStatus: 404,
  });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    assert.equal(await identity(page, '零件名称').textContent(), '暂无已完成零件');
    assert.equal(await identity(page, '零件编号').textContent(), '—');
    assert.deepEqual(designReads, ['/api/cad/freecad/runs/' + runId]);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

for (const [name, record] of [
  ['未完成模型', { ...completed, status: 'running' }],
  ['无有效实体的模型', { ...completed, validation: { valid: false, solid_count: 0 } }],
  ['返回了另一个设计版本', { ...completed, run_id: 'FC-' + 'b'.repeat(64) }],
  ['装配而非独立零件', { ...completed, spec: { units: 'mm', parts: [] } }],
]) test(name + '不能冒充当前待检测零件', async () => {
  const { fixture, page, writes, designReads } = await setup({ session: savedSession, record });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    assert.equal(await identity(page, '零件名称').textContent(), '暂无已完成零件');
    assert.equal(await identity(page, '零件编号').textContent(), '—');
    assert.deepEqual(designReads, ['/api/cad/freecad/runs/' + runId]);
    assert.deepEqual(writes, []);
  } finally { await fixture.close(); }
});

const versionEntry = (record, index) => ({ run_id: record.run_id, status: 'completed', prompt: record.prompt,
  spec: record.spec, part_name: record.part_name, part_number: record.part_number, created_at: 1000 + index });

test('名称选择自动更新对应编号，默认当前零件且不改生产建模会话', async () => {
  const plateId = 'FC-' + 'b'.repeat(56) + '00016973';
  const plate = { ...completed, run_id: plateId, part_name: '安装底板', part_number: '' };
  const { fixture, page, writes, errors, designReads, qualityRequests } = await setup({
    session: savedSession, versions: [versionEntry(completed, 0), versionEntry(plate, 1)], records: { [plateId]: plate },
  });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    const select = page.getByRole('combobox', { name: '零件名称', exact: true });
    assert.equal(await select.count(), 1);
    assert.equal(await select.inputValue(), runId);
    assert.equal(await identity(page, '零件名称').textContent(), '生产销轴');
    assert.equal(await identity(page, '零件编号').textContent(), '00321');
    assert.equal(await select.locator('option').count(), 2);
    await select.selectOption(plateId);
    assert.equal(await identity(page, '零件名称').textContent(), '安装底板');
    assert.equal(await identity(page, '零件编号').textContent(), '92531');
    await select.selectOption(runId);
    assert.equal(await identity(page, '零件编号').textContent(), '00321');
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('freecad.active-run')).run_id), runId);
    assert.doesNotMatch(await select.textContent(), /未提交新零件|DRAFT-999/);
    assert.deepEqual([...designReads].sort(), ['/api/cad/freecad/runs/' + runId, '/api/cad/freecad/runs/' + plateId].sort());
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('名称选择区分同名同短号的不同版本，以完整运行编号选中而不是名称或短号', async () => {
  const firstId = 'FC-' + 'a'.repeat(56) + '00016973', secondId = 'FC-' + 'b'.repeat(56) + '00016973';
  const first = { ...completed, run_id: firstId, part_name: '安装底板', part_number: '' };
  const second = { ...first, run_id: secondId };
  const { fixture, page } = await setup({
    session: { ...savedSession, run_id: firstId, part_name: '安装底板', part_number: '' },
    record: first, records: { [secondId]: second }, versions: [versionEntry(first, 0), versionEntry(second, 1)],
  });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    const select = page.getByRole('combobox', { name: '零件名称', exact: true });
    assert.equal(await select.count(), 1);
    const labels = await select.locator('option').allTextContents();
    assert.equal(labels.length, 2);
    assert.equal(new Set(labels).size, 2);
    assert(labels.every(label => label.includes('安装底板') && label.includes('92531')));
    await select.selectOption(secondId);
    assert.equal(await select.inputValue(), secondId);
    assert.equal(await identity(page, '零件编号').textContent(), '92531');
    await select.selectOption(firstId);
    assert.equal(await select.inputValue(), firstId);
  } finally { await fixture.close(); }
});

test('名称选择回查历史版本，过期、未完成、无效或装配不能成为可选零件', async () => {
  const records = {}, versions = [versionEntry(completed, 0)];
  for (const [letter, change] of [['b', { status: 'running' }], ['c', { validation: { valid: false, solid_count: 0 } }],
    ['d', { spec: { units: 'mm', parts: [] } }], ['e', null], ['f', { run_id: 'FC-' + '1'.repeat(64) }]]) {
    const id = 'FC-' + letter.repeat(64), cached = { ...completed, run_id: id, part_name: '不可选择' + letter };
    versions.push(versionEntry(cached, versions.length));
    records[id] = change === null ? null : { ...cached, ...change };
  }
  const { fixture, page, writes, errors } = await setup({ session: savedSession, versions, records });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    const select = page.getByRole('combobox', { name: '零件名称', exact: true });
    assert.equal(await select.count(), 1);
    assert.deepEqual(await select.locator('option').allTextContents(), ['生产销轴']);
    assert.equal(await identity(page, '零件编号').textContent(), '00321');
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('名称选择在没有当前建模会话时仍可读取已保存版本，并且没有模型时禁用', async () => {
  const { fixture, page } = await setup({ versions: [versionEntry(completed, 0)] });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    const select = page.getByRole('combobox', { name: '零件名称', exact: true });
    assert.equal(await select.count(), 1);
    assert.equal(await select.isDisabled(), false);
    assert.equal(await select.inputValue(), runId);
    assert.equal(await identity(page, '零件编号').textContent(), '00321');
    await page.evaluate(() => sessionStorage.removeItem('freecad.design-versions'));
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await select.isDisabled(), true);
    assert.equal(await identity(page, '零件编号').textContent(), '—');
  } finally { await fixture.close(); }
});

test('左侧质检入口保留，重进页面恢复待检测状态且不加载历史', async () => {
  const { fixture, page, qualityRequests, writes, errors } = await setup({ fullApp: true, session: savedSession });
  try {
    await page.goto(fixture.base + '/?view=quality');
    const entry = page.getByRole('button', { name: '质检系统', exact: true });
    await entry.waitFor();
    await page.getByText('00321', { exact: true }).waitFor();
    assert.equal(await page.locator('.quality-workspace input, .quality-workspace form').count(), 0);
    assert.equal(await page.locator('.team-access').count(), 1);
    assert.doesNotMatch(await page.locator('main').textContent(), /Factory unavailable/);
    assert.equal(await page.getByRole('button', { name: '开始检测', exact: true }).isDisabled(), true);
    const result = page.getByRole('region', { name: '检测结果', exact: true });
    assert.match(await page.locator('.quality-workspace').textContent(), /登录/);
    await page.getByRole('button', { name: '日志系统', exact: true }).click();
    await page.getByRole('heading', { name: '日志系统', exact: true }).waitFor();
    await entry.click();
    await page.getByText('00321', { exact: true }).waitFor();
    assert.equal(await identity(page, '零件名称').textContent(), '生产销轴');
    assert.equal(await result.getByText('待检测', { exact: true }).count(), 1);
    assert.doesNotMatch(await result.getByRole('status').textContent(), /暂时无法执行检测/);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('未登录时不生成模拟样本，不把设计参数当作检测结果', async () => {
  const { fixture, page, writes, errors, qualityRequests, designReads } = await setup({ session: savedSession });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    const start = page.getByRole('button', { name: '开始检测', exact: true });
    assert.equal(await start.count(), 1);
    assert.equal(await start.isDisabled(), true);
    const result = page.getByRole('region', { name: '检测结果', exact: true });
    assert.equal(await result.getByText('待检测', { exact: true }).count(), 1);
    assert.deepEqual(await result.locator('.quality-rate-fields dd').allTextContents(), ['—', '—', '—']);
    for (let attempt = 0; attempt < 2; attempt++) {
      assert.equal(await start.isDisabled(), true);
      assert.match(await page.locator('.quality-workspace').textContent(), /登录/);
      assert.equal(await result.getByText('待检测', { exact: true }).count(), 1);
      assert.deepEqual(await result.locator('.quality-rate-fields dd').allTextContents(), ['—', '—', '—']);
      assert.match(await result.textContent(), /尚无可核实的检测结果/);
      assert.doesNotMatch(await result.textContent(), /\d+(?:\.\d+)?%|检测完成|检测通过|无异常|无问题/);
    }
    assert.deepEqual(designReads, ['/api/cad/freecad/runs/' + runId]);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('切换零件清除上一个零件的检测尝试提示，刷新仍显示待检测和空比例', async () => {
  const plateId = 'FC-' + 'b'.repeat(56) + '00016973';
  const plate = { ...completed, run_id: plateId, part_name: '安装底板', part_number: '' };
  const { fixture, page, writes, errors, qualityRequests } = await setup({ session: savedSession,
    versions: [versionEntry(completed, 0), versionEntry(plate, 1)], records: { [plateId]: plate } });
  try {
    await page.goto(fixture.base + '/?view=quality', { waitUntil: 'networkidle' });
    const start = page.getByRole('button', { name: '开始检测', exact: true });
    assert.equal(await start.count(), 1);
    const result = page.getByRole('region', { name: '检测结果', exact: true });
    assert.equal(await start.isDisabled(), true);
    await page.getByRole('combobox', { name: '零件名称', exact: true }).selectOption(plateId);
    assert.equal(await identity(page, '零件编号').textContent(), '92531');
    assert.doesNotMatch(await result.getByRole('status').textContent(), /暂时无法执行检测/);
    assert.equal(await result.getByText('待检测', { exact: true }).count(), 1);
    assert.deepEqual(await result.locator('.quality-rate-fields dd').allTextContents(), ['—', '—', '—']);
    assert.equal(await start.isDisabled(), true);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await identity(page, '零件编号').textContent(), '00321');
    assert.doesNotMatch(await result.getByRole('status').textContent(), /暂时无法执行检测/);
    assert.deepEqual(await result.locator('.quality-rate-fields dd').allTextContents(), ['—', '—', '—']);
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('freecad.active-run')).run_id), runId);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});
