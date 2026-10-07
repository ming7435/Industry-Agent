import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, deferred, respond } from './helpers/center-fixture.mjs';

let fixture;
before(async () => { fixture = await centerFixture(); });
after(async () => { await fixture?.close(); });

const run = id => ({ run_id: `fault:${id}`, label: `Audit Run ${id}`, run_type: 'fault', status: 'running', trace_id: `TRACE-${id}`, trace_ids: [`TRACE-${id}`], task_ids: [`TASK-${id}`], event_count: 1, phases: [] });
const agent = id => ({ type: 'agent', event: 'agent_completed', name: `AuditAgent${id}`, agent: `AuditAgent${id}`, agent_run_id: `AGENT-${id}`, trace_id: `TRACE-${id}`, task_id: `TASK-${id}`, output: { summary: `Result-${id}` } });

test('Memory 检索的完整生命周期和负责人明细在日志页可见', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const identity = { trace_id: 'TRACE-MEMORY', task_id: 'TASK-MEMORY' };
  const owner = { ...identity, agent: 'memory', agent_run_id: 'MEMORY-1' };
  const records = [
    { ...identity, type: 'a2a', event: 'a2a_started', name: 'router->memory' },
    { ...owner, type: 'agent', event: 'agent_started', name: 'memory' },
    ...['initialize', 'load_skill', 'validate_search', 'fallback'].flatMap(name => ['step_started', 'step_completed'].map(event => ({ ...owner, type: 'agent_step', event, name, skill: 'experience_retrieval' }))),
    { ...owner, type: 'agent', event: 'agent_completed', name: 'memory', output: { success: false, error: 'validation_failed' } },
    { ...identity, type: 'a2a', event: 'a2a_completed', name: 'router->memory' },
  ];
  const memory = { ...identity, run_id: 'rag:TRACE-MEMORY', run_type: 'rag', status: 'error', label: 'RAG 问答', trace_ids: [identity.trace_id], task_ids: [identity.task_id], event_count: 12, phases: [{ id: 'rag', label: 'RAG 问答', status: 'error' }] };
  try {
    await page.route('**/api/**', route => respond(route, new URL(route.request().url()).pathname === '/api/runs' ? { runs: [memory] } : { trace: records }));
    await page.goto(`${fixture.base}/?view=logs`);
    await page.getByRole('heading', { level: 4, name: 'memory', exact: true }).waitFor();
    assert.equal(await page.locator('.logs-stat-grid .module-card').filter({ hasText: '事件总数' }).locator('strong').innerText(), '12');
    assert.equal(await page.locator('.logs-run-card.is-selected .logs-run-status').innerText(), '异常');
    assert.ok((await page.locator('.agent-invocation-meta').innerText()).includes('MEMORY-1'));
  } finally { await context.close(); }
});

test('日志详情晚返回不能覆盖已切换的运行记录', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const requested = deferred();
  let held;
  try {
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/runs') return respond(route, { runs: [run('A'), run('B')] });
      if (url.searchParams.get('trace_id') === 'TRACE-A') { held = route; requested.resolve(); return; }
      return respond(route, { trace: url.searchParams.get('trace_id') === 'TRACE-B' ? [agent('B')] : [] });
    });
    await page.goto(`${fixture.base}/?view=logs`);
    await requested.promise;
    await page.getByRole('button', { name: /Audit Run B/ }).click();
    await page.getByRole('heading', { level: 4, name: 'AuditAgentB' }).waitFor();
    await respond(held, { trace: [agent('A')] });
    await page.waitForLoadState('networkidle');
    assert.deepEqual(await page.locator('.agent-invocation-head h4').allTextContents(), ['AuditAgentB']);
    assert.ok((await page.locator('.logs-run-card.is-selected').innerText()).includes('Audit Run B'));
  } finally { await context.close(); }
});

test('慢日志轮询只保留一个在途索引请求且不读取全库正文摘要', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const requested = deferred();
  const pending = [];
  const globalTraces = [];
  try {
    await page.clock.install();
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/runs') { pending.push(route); requested.resolve(); return; }
      if (url.pathname === '/api/trace' && !url.searchParams.get('trace_id')) globalTraces.push(url.href);
      return respond(route, { trace: [] });
    });
    await page.goto(`${fixture.base}/?view=logs`);
    await requested.promise;
    await page.clock.runFor(11000);
    assert.equal(pending.length, 1);
    await respond(pending[0], { runs: [] });
    await page.waitForLoadState('networkidle');
    assert.deepEqual(globalTraces, []);
  } finally { await context.close(); }
});

test('质检切换零件后旧检测不能覆盖当前结果和历史', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const started = deferred();
  let held;
  const a = { quality_check_id: 'QC-A', target_id: 'PART-001', part_id: 'PART-001', status: 'passed', result: 'passed', findings: ['ONLY-A'] };
  const b = { quality_check_id: 'QC-B', target_id: 'PART-B', part_id: 'PART-B', status: 'failed', result: 'failed', findings: ['ONLY-B'] };
  try {
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/quality/parts/PART-001') { held = route; started.resolve(); return; }
      if (url.pathname === '/api/v1/quality/checks') return respond(route, { items: [url.searchParams.get('target_id') === 'PART-B' ? b : a] });
      return respond(route, { items: [] });
    });
    await page.goto(`${fixture.base}/?view=quality`);
    await page.getByRole('button', { name: /QC-A/ }).waitFor();
    await page.getByRole('button', { name: '执行质量检测', exact: true }).click();
    await started.promise;
    await page.locator('#quality-part-id').fill('PART-B');
    await page.getByRole('button', { name: /QC-B/ }).waitFor();
    await page.getByRole('button', { name: /QC-B/ }).click();
    await respond(held, a);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#quality-part-id').inputValue(), 'PART-B');
    assert.equal(await page.getByRole('button', { name: /QC-A/ }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /QC-B/ }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByText('ONLY-A', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: '校验并放行', exact: true }).count(), 0);
  } finally { await context.close(); }
});

test('质检切换历史记录后旧检测不能改变当前选择', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const started = deferred();
  let held;
  const check = id => ({ quality_check_id: `QC-${id}`, target_id: 'PART-001', status: 'failed', result: 'failed', findings: [`ONLY-${id}`] });
  try {
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/quality/parts/PART-001') { held = route; started.resolve(); return; }
      if (url.pathname === '/api/v1/quality/checks') return respond(route, { items: [check('A'), check('B')] });
      return respond(route, { items: [] });
    });
    await page.goto(`${fixture.base}/?view=quality`);
    await page.getByRole('button', { name: /QC-A/ }).click();
    await page.getByRole('button', { name: '执行质量检测', exact: true }).click();
    await started.promise;
    await page.getByRole('button', { name: /QC-B/ }).click();
    await respond(held, check('NEW'));
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('button', { name: /QC-B/ }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByText('ONLY-NEW', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: '执行质量检测', exact: true }).isEnabled(), true);
  } finally { await context.close(); }
});

test('报告显示完整性和所有校验缺失原因', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  try {
    await page.route('**/api/**', route => respond(route, { items: [{ report_id: 'R-A', title: '待补充报告', summary: '已生成维修计划报告', status: 'incomplete', validation_findings: ['缺少诊断事实', '缺少维修步骤', '缺少质检证据'], sections: {} }] }));
    await page.goto(`${fixture.base}/?view=report`);
    await page.locator('.report-list-select').waitFor();
    assert.ok((await page.locator('.report-panel').innerText()).includes('资料不完整'));
    for (const finding of ['缺少诊断事实', '缺少维修步骤', '缺少质检证据']) assert.equal(await page.getByText(finding, { exact: true }).count(), 1);
  } finally { await context.close(); }
});

test('A的PDF生成完成不能给B显示就绪链接', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  let held;
  const started = deferred();
  const items = [{ report_id: 'R-A', title: '报告 A', sections: {} }, { report_id: 'R-B', title: '报告 B', sections: {} }];
  try {
    await page.route('**/api/**', route => {
      if (route.request().method() === 'POST') { held = route; started.resolve(); return; }
      return respond(route, { items });
    });
    await page.goto(`${fixture.base}/?view=report`);
    await page.locator('.report-list-select').nth(1).waitFor();
    await page.getByRole('button', { name: '生成 PDF', exact: true }).click();
    await started.promise;
    await page.locator('.report-list-select').nth(1).click();
    await respond(held, { success: true });
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('link', { name: '打开 PDF', exact: true }).count(), 0);
    await page.locator('.report-list-select').first().click();
    assert.equal(await page.getByRole('link', { name: '打开 PDF', exact: true }).getAttribute('href'), '/api/reports/R-A/pdf');
  } finally { await context.close(); }
});

test('轮询移除已生成PDF的报告时回退报告不能沿用就绪状态', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const a = { report_id: 'R-A', title: '报告 A', sections: {} };
  const b = { report_id: 'R-B', title: '报告 B', sections: {} };
  let items = [a, b];
  try {
    await page.route('**/api/**', route => respond(route, route.request().method() === 'POST' ? { success: true } : { items }));
    await page.goto(`${fixture.base}/?view=report`);
    await page.locator('.report-list-select').nth(1).waitFor();
    await page.getByRole('button', { name: '生成 PDF', exact: true }).click();
    await page.getByRole('link', { name: '打开 PDF', exact: true }).waitFor();
    items = [b];
    await page.getByRole('button', { name: '刷新报告', exact: true }).click();
    await page.locator('.report-panel h2').filter({ hasText: '报告 B' }).waitFor();
    assert.equal(await page.getByRole('link', { name: '打开 PDF', exact: true }).count(), 0);
    assert.equal(await page.locator('.report-list-item.is-selected .report-list-select').count(), 1);
  } finally { await context.close(); }
});
