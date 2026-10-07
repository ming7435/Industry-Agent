import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { deferred, respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = resolve(root, '.runtime/verification/logs-reentry-20261007');
const run = (id, eventCount = 3) => ({ run_id: `fault:${id}`, label: `审查运行 ${id}`, run_type: 'fault',
  status: 'completed', trace_id: `TRACE-${id}`, trace_ids: [`TRACE-${id}`], task_ids: [`TASK-${id}`],
  event_count: eventCount, ended_at: '2026-10-07T00:00:02Z', phases: [] });
const events = (id, version = 'v1') => {
  const owner = { trace_id: `TRACE-${id}`, task_id: `TASK-${id}`, agent: 'memory', agent_run_id: `MEMORY-${id}` };
  return [
    { ...owner, trace_record_id: `REC-${id}-START`, event_id: `${id}-start`, type: 'agent', event: 'agent_started', name: 'memory', input: { query: `Input-${id}` }, timestamp: '2026-10-07T00:00:00Z' },
    { ...owner, trace_record_id: `REC-${id}-TOOL`, event_id: `${id}-tool`, type: 'tool', event: 'tool_completed', name: 'read_memory', tool_name: 'read_memory',
      output: { summary: `Tool-${id}-${version}` }, timestamp: '2026-10-07T00:00:01Z' },
    { ...owner, trace_record_id: `REC-${id}-END`, event_id: `${id}-end`, type: 'agent', event: 'agent_completed', name: 'memory',
      output: { summary: `Result-${id}-${version}` }, timestamp: '2026-10-07T00:00:02Z' },
  ];
};
const observations = [];
let fixture, sourceHash;

before(async () => {
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright-core');
  const appSource = await readFile(resolve(root, 'frontend/monitor-react/src/app/App.jsx'), 'utf8');
  sourceHash = createHash('sha256').update(appSource).digest('hex');
  const compiled = await build({
    stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'), contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {App} from './App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));` },
    plugins: [{ name: 'logs-reentry-readonly-fixture', setup(builder) {
      builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async () => ({ contents: appSource, loader: 'jsx' }));
      builder.onLoad({ filter: /[\\/]TeamAccess\.jsx$/ }, async () => ({ loader: 'jsx', contents: 'export default function FixtureActor(){return null;}' }));
    } }],
    bundle: true, write: false, format: 'iife', platform: 'browser', loader: { '.css': 'empty', '.png': 'dataurl' },
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': req.url === '/component.js' ? 'application/javascript' : 'text/html;charset=utf-8' });
    res.end(req.url === '/component.js' ? compiled.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script>');
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) });
  fixture = { browser, base: `http://127.0.0.1:${server.address().port}`, close: async () => {
    await browser.close(); await new Promise(done => server.close(done));
  } };
});

after(async () => {
  await fixture?.close(); await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'frontend-logs-observations.json'), JSON.stringify({
    app_sha256: sourceHash, actual_components: ['App', 'LogsWorkspace'], api_mocked: true, observations,
  }, null, 2));
});

const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const logsText = page => page.locator('.logs-workspace').innerText();
const navigate = (page, name) => page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name, exact: true }).click();
const rawDetail = page => page.locator('.logs-list .log-event').filter({ has: page.locator('h3', { hasText: /^read_memory$/ }) })
  .locator('.log-detail').filter({ has: page.locator('summary', { hasText: /^完整事件$/ }) }).first();
const chooseRun = (page, id) => page.getByLabel('按运行记录筛选', { exact: true }).selectOption(`fault:${id}`);
const resultVisible = (page, id, version = 'v1') => page.locator('.agent-invocations').getByText(new RegExp(`Result-${id}-${version}`)).waitFor();

async function pageFor(handle) {
  const context = await fixture.browser.newContext(), page = await context.newPage();
  page.setDefaultTimeout(3000); await page.clock.install();
  const reads = [], writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    if (!['GET', 'HEAD'].includes(route.request().method())) { writes.push({ path: url.pathname, method: route.request().method() }); return route.abort(); }
    reads.push(url.pathname === '/api/trace' ? `${url.pathname}:${url.searchParams.get('trace_id')}` : url.pathname);
    if (url.pathname === '/api/monitor/snapshot') return respond(route, { devices: [], diagnosis: {} });
    if (url.pathname === '/api/runs' || url.pathname === '/api/trace') return handle(route, url);
    return respond(route, {});
  });
  return { context, page, reads, writes, errors };
}

test('日志重进保留运行选择筛选明细和展开状态，同版本索引不重取正文', async () => {
  let holdIndex = false, heldIndex;
  const resumed = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') {
      if (holdIndex) { heldIndex = route; resumed.resolve(); return; }
      return respond(route, { runs: [run('A'), run('B')] });
    }
    return respond(route, { trace: events(url.searchParams.get('trace_id').slice(6)) });
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await resultVisible(page, 'A');
    await chooseRun(page, 'B'); await resultVisible(page, 'B');
    await page.getByRole('button', { name: '工具', exact: true }).click();
    await rawDetail(page).locator('summary').click();
    assert.equal(await rawDetail(page).getAttribute('open') !== null, true);
    const detailReadsBefore = reads.filter(path => path === '/api/trace:TRACE-B').length;
    holdIndex = true;
    await navigate(page, '智能诊断'); await page.locator('.logs-workspace').waitFor({ state: 'hidden' });
    await navigate(page, '日志系统'); await page.locator('.logs-workspace').waitFor();
    const selected = await page.getByLabel('按运行记录筛选', { exact: true }).inputValue();
    const filter = await page.locator('.logs-filter-button.is-active').allTextContents();
    const detailShown = (await logsText(page)).includes('Result-B-v1');
    const expanded = await rawDetail(page).count() > 0 && await rawDetail(page).getAttribute('open') !== null;
    observations.push({ case: 'reentry', selected, filter, detail_shown_while_index_pending: detailShown, expanded, reads, writes, errors });
    assert.equal(selected, 'fault:B'); assert.deepEqual(filter, ['工具']);
    assert.equal(detailShown, true); assert.equal(expanded, true);
    // A fresh cache may wait until the next background cycle before rereading.
    await page.clock.runFor(5000); await resumed.promise;
    await respond(heldIndex, { runs: [run('A'), run('B')] }); await frame(page);
    assert.equal(reads.filter(path => path === '/api/trace:TRACE-B').length, detailReadsBefore, '相同运行版本不得重读完整正文');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('后台索引刷新不显示刷新中，旧明细保留且新运行记录自动出现', async () => {
  let indexReads = 0, heldIndex;
  const polled = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') {
      if (++indexReads === 1) return respond(route, { runs: [run('A')] });
      heldIndex = route; polled.resolve(); return;
    }
    return respond(route, { trace: events('A') });
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await resultVisible(page, 'A');
    await page.clock.runFor(5000); await polled.promise;
    const busyButton = await page.getByRole('button', { name: '刷新中…', exact: true }).count() > 0;
    const oldDetailVisible = (await logsText(page)).includes('Result-A-v1');
    await respond(heldIndex, { runs: [run('A'), run('C')] });
    await page.getByRole('button', { name: /审查运行 C/ }).waitFor();
    observations.push({ case: 'background_index', background_busy_button: busyButton, old_detail_visible: oldDetailVisible,
      new_run_displayed: true, reads, writes, errors });
    assert.equal(busyButton, false); assert.equal(oldDetailVisible, true);
    assert.equal(reads.filter(path => path === '/api/trace:TRACE-A').length, 1);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('同运行版本增加时明细挂起或503保留已读正文及展开状态', async () => {
  let indexReads = 0, traceReads = 0, heldDetail;
  const detailStarted = deferred();
  const updatedEvents = events('A', 'v2');
  updatedEvents.splice(2, 0, { trace_record_id: 'REC-A-NEW-TOOL', trace_id: 'TRACE-A', task_id: 'TASK-A', agent: 'memory',
    agent_run_id: 'MEMORY-A', type: 'tool', event: 'tool_completed', tool_name: 'verify_memory', name: 'verify_memory',
    output: { checked: true }, timestamp: '2026-10-07T00:00:01.500Z' });
  updatedEvents.push({ trace_record_id: 'REC-A-RUNTIME-END', trace_id: 'TRACE-A', task_id: 'TASK-A', type: 'runtime',
    event: 'runtime_completed', name: 'runtime', output: { status: 'completed' }, timestamp: '2026-10-07T00:00:03Z' });
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') return respond(route, { runs: [run('A', ++indexReads === 1 ? 3 : indexReads === 2 ? 4 : 5)] });
    if (++traceReads === 1) return respond(route, { trace: events('A') });
    if (traceReads > 2) return respond(route, { trace: updatedEvents });
    heldDetail = route; detailStarted.resolve();
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await resultVisible(page, 'A');
    await page.getByRole('button', { name: '工具', exact: true }).click(); await rawDetail(page).locator('summary').click();
    await page.clock.runFor(5000); await detailStarted.promise;
    const pendingPreserved = (await logsText(page)).includes('Result-A-v1');
    const pendingExpanded = await rawDetail(page).count() > 0 && await rawDetail(page).getAttribute('open') !== null;
    await respond(heldDetail, { detail: '隔离明细读取失败' }, 503);
    await page.getByRole('status').filter({ hasText: '隔离明细读取失败' }).waitFor();
    const failedPreserved = (await logsText(page)).includes('Result-A-v1');
    const failedExpanded = await rawDetail(page).count() > 0 && await rawDetail(page).getAttribute('open') !== null;
    const observation = { case: 'same_run_detail_refresh', pending_preserved: pendingPreserved, pending_expanded: pendingExpanded,
      failed_preserved: failedPreserved, failed_expanded: failedExpanded, error_visible: true, reads, writes, errors };
    observations.push(observation);
    assert.equal(pendingPreserved, true); assert.equal(pendingExpanded, true);
    assert.equal(failedPreserved, true); assert.equal(failedExpanded, true);
    await page.clock.runFor(5000); await resultVisible(page, 'A', 'v2');
    observation.successful_update_preserves_expanded = await rawDetail(page).getAttribute('open') !== null;
    observation.new_tool_displayed = (await logsText(page)).includes('verify_memory');
    assert.equal(observation.successful_update_preserves_expanded, true, '新事件插入不能重建旧事件并折叠已展开正文');
    assert.equal(observation.new_tool_displayed, true);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('离开日志页暂停轮询且晚返回索引和明细不改已读缓存', async () => {
  let indexReads = 0, traceReads = 0, heldIndex, heldDetail;
  const lateIndexStarted = deferred(), lateDetailStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') {
      indexReads++;
      if (indexReads < 3) return respond(route, { runs: [run('A', indexReads === 1 ? 3 : 4)] });
      heldIndex = route; lateIndexStarted.resolve(); return;
    }
    if (++traceReads === 1) return respond(route, { trace: events('A') });
    heldDetail = route; lateDetailStarted.resolve();
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await resultVisible(page, 'A');
    await page.clock.runFor(5000); await lateDetailStarted.promise;
    await page.clock.runFor(5000); await lateIndexStarted.promise;
    await navigate(page, '智能诊断'); await page.locator('.logs-workspace').waitFor({ state: 'hidden' });
    const inactiveReads = { index: indexReads, trace: traceReads };
    await respond(heldIndex, { runs: [{ ...run('A', 5), label: 'STALE-INDEX' }] });
    await respond(heldDetail, { trace: events('A', 'late') });
    await page.clock.runFor(10000);
    assert.equal(indexReads, inactiveReads.index); assert.equal(traceReads, inactiveReads.trace);
    await navigate(page, '日志系统'); await page.locator('.logs-workspace').waitFor();
    const text = await logsText(page);
    const retained = text.includes('Result-A-v1'), staleIndex = text.includes('STALE-INDEX'), staleDetail = text.includes('Result-A-late');
    observations.push({ case: 'inactive_late_responses', inactive_polling_paused: true, retained_original: retained,
      stale_index_visible: staleIndex, stale_detail_visible: staleDetail, reads, writes, errors });
    assert.equal(retained, true); assert.equal(staleIndex, false); assert.equal(staleDetail, false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('不同运行切换后旧运行明细晚回包不串入新选择', async () => {
  let heldDetail;
  const oldStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') return respond(route, { runs: [run('A'), run('B')] });
    if (url.searchParams.get('trace_id') === 'TRACE-A') { heldDetail = route; oldStarted.resolve(); return; }
    return respond(route, { trace: events('B') });
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await oldStarted.promise;
    await chooseRun(page, 'B'); await resultVisible(page, 'B');
    await respond(heldDetail, { trace: events('A', 'late') }); await frame(page);
    const text = await logsText(page);
    const selected = await page.getByLabel('按运行记录筛选', { exact: true }).inputValue();
    observations.push({ case: 'different_run_late_detail', selected, current_detail_visible: text.includes('Result-B-v1'),
      old_detail_visible: text.includes('Result-A-late'), reads, writes, errors });
    assert.equal(selected, 'fault:B'); assert.equal(text.includes('Result-B-v1'), true); assert.equal(text.includes('Result-A-late'), false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('手动刷新能强制更新当前明细，即使运行事件数量未变化', async () => {
  let traceReads = 0;
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') return respond(route, { runs: [run('A')] });
    return respond(route, { trace: events('A', ++traceReads === 1 ? 'v1' : 'v2') });
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await resultVisible(page, 'A');
    await page.getByRole('button', { name: '刷新运行记录', exact: true }).click();
    const updated = await resultVisible(page, 'A', 'v2').then(() => true, () => false);
    observations.push({ case: 'manual_refresh_same_count', event_count: 3, detail_reads: traceReads,
      updated_detail_visible: updated, reads, writes, errors });
    assert.equal(updated, true); assert.equal(traceReads, 2);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('事件数量未变但最新事件时间改变时自动更新当前正文', async () => {
  let indexReads = 0, traceReads = 0;
  const { context, page, reads, writes, errors } = await pageFor((route, url) => {
    if (url.pathname === '/api/runs') return respond(route, { runs: [{ ...run('A'),
      ended_at: ++indexReads === 1 ? '2026-10-07T00:00:02Z' : '2026-10-07T00:00:03Z' }] });
    return respond(route, { trace: events('A', ++traceReads === 1 ? 'v1' : 'v2') });
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`); await resultVisible(page, 'A');
    await page.clock.runFor(5000);
    const updated = await resultVisible(page, 'A', 'v2').then(() => true, () => false);
    observations.push({ case: 'same_count_new_ended_at', event_count: 3, detail_reads: traceReads,
      updated_detail_visible: updated, reads, writes, errors });
    assert.equal(updated, true); assert.equal(traceReads, 2);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
