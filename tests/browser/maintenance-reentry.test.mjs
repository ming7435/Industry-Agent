import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { deferred, respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = resolve(root, '.runtime/verification/maintenance-reentry-20261007');
const actorA = { user_id: 'U-A', username: '人员甲', role: 'technician' };
const actorB = { user_id: 'U-B', username: '人员乙', role: 'technician' };
const makePlan = (id, fault = id) => ({ plan_id: id, device_id: 'D-1', alarm_code: 'A-1', event_id: `EVT-${id}`,
  diagnosis: { fault }, workorder_ready: false, validation_findings: ['缺少实际维修工程依据'],
  repair_steps: ['保留真实方案'], tools: [], parts: [], safety: [], evidence: [], created_at: '2026-10-07T00:00:00Z' });
const publicPlans = [makePlan('PLAN-PUBLIC-1'), makePlan('PLAN-PUBLIC-2')];
const privateOrder = (actor, id) => ({ workorder_id: `WO-${id}`, device_id: 'D-1', alarm_code: 'A-1',
  assignee: actor.user_id, assignee_name: actor.username, status: 'in_progress', plan_id: id,
  maintenance_plan_snapshot: makePlan(id, `${actor.username}的工单快照方案`) });
const planBody = { items: publicPlans, history: { status: 'ready' }, deleted_plan_ids: [] };
const observations = [];
let fixture, sourceHash;

before(async () => {
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright-core');
  const appSource = await readFile(resolve(root, 'frontend/monitor-react/src/app/App.jsx'), 'utf8');
  sourceHash = createHash('sha256').update(appSource).digest('hex');
  // Actual App navigation/lifecycle is exercised. The actor boundary supplies fixture
  // identities without logging in or claiming they are server credentials.
  const compiled = await build({
    stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'), contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {App} from './App.jsx'; createRoot(document.getElementById('root')).render(React.createElement(App));` },
    plugins: [{ name: 'maintenance-reentry-readonly-fixture', setup(builder) {
      builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async () => ({ contents: appSource, loader: 'jsx' }));
      builder.onLoad({ filter: /[\\/]TeamAccess\.jsx$/ }, async () => ({ loader: 'jsx', contents: `import React,{useEffect} from 'react'; export default function FixtureActor({onActor}) { useEffect(()=>{const update=e=>onActor(e.detail);onActor(window.__fixtureActor);window.addEventListener('fixture-actor',update);return()=>window.removeEventListener('fixture-actor',update)},[onActor]);return null;}` }));
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
  await fixture?.close();
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'frontend-reentry-observations.json'), JSON.stringify({
    app_sha256: sourceHash, actual_components: ['App', 'MaintenancePlanWorkspace'], api_mocked: true,
    actor_is_fixture_only: true, observations,
  }, null, 2));
});

async function pageFor(handle, { monitorHandler, snapshot } = {}) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  await page.addInitScript(actor => { window.__fixtureActor = actor; }, actorA);
  await page.clock.install();
  const reads = [], writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (!['GET', 'HEAD'].includes(route.request().method())) { writes.push({ path, method: route.request().method() }); return route.abort(); }
    reads.push(path);
    if (path === '/api/monitor/snapshot' && monitorHandler) return monitorHandler(route);
    if (path === '/api/monitor/snapshot') return respond(route, snapshot || { device_id: 'D-1', devices: [{
      device_id: 'D-1', name: '隔离设备', current_sample: { device_id: 'D-1', alarm_code: 'A-1', status: 'alarm' },
    }], diagnosis: {} });
    if (path === '/api/maintenance/plans' || path === '/api/workorders') return handle(route, path);
    return respond(route, {});
  });
  return { context, page, reads, writes, errors };
}

const queue = page => page.locator('.maintenance-plan-queue');
const changeActor = (page, actor) => page.evaluate(value => window.dispatchEvent(new CustomEvent('fixture-actor', { detail: value })), actor);
const privateVisible = async (page, id) => (await queue(page).innerText()).includes(id);

test('离开再返回维修方案保留已读列表和选中方案，后台刷新不闪空', async () => {
  let planReads = 0, holdRefresh = false, pendingRefresh;
  const refreshStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, path) => {
    if (path === '/api/workorders') return respond(route, { items: [] });
    planReads++;
    if (!holdRefresh) return respond(route, planBody);
    pendingRefresh = route; refreshStarted.resolve();
    // Hold all subsequent refreshes so cached rendering cannot depend on their speed.
  });
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.locator('.maintenance-plan-list-row').nth(1).waitFor();
    await page.locator('.maintenance-plan-list-row').nth(1).locator('.workorder-queue-item').click();
    assert.ok((await page.locator('.maintenance-plan-list-row.is-selected').innerText()).includes('PLAN-PUBLIC-2'));
    holdRefresh = true;
    await page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name: '智能诊断', exact: true }).click();
    await page.locator('.maintenance-workspace').waitFor({ state: 'detached' });
    const inactivePlanReads = planReads;
    const inactiveOrderReads = reads.filter(path => path === '/api/workorders').length;
    await page.clock.runFor(10000);
    assert.equal(planReads, inactivePlanReads, '隐藏方案页应暂停后台方案轮询');
    assert.equal(reads.filter(path => path === '/api/workorders').length, inactiveOrderReads, '隐藏方案页应暂停后台工单轮询');
    await page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name: '维修方案', exact: true }).click();
    await page.locator('.maintenance-workspace').waitFor();
    const rowCount = await page.locator('.maintenance-plan-list-row').count();
    const selected = await page.locator('.maintenance-plan-list-row.is-selected').allTextContents();
    const loadingEmpty = (await queue(page).innerText()).includes('正在读取已有维修方案');
    const observation = { case: 'reentry', plan_reads: planReads, row_count_while_refresh_pending: rowCount,
      selected, loading_empty: loadingEmpty, inactive_polling_paused: true, reads, writes, errors };
    observations.push(observation);
    assert.equal(rowCount, 2, '返回页面不应在后台刷新期间清空已读方案');
    assert.ok(selected.join('').includes('PLAN-PUBLIC-2'), '重进应保留已选择方案');
    assert.equal(loadingEmpty, false);
    await refreshStarted.promise;
    await respond(pendingRefresh, { error: '隔离刷新失败' }, 503);
    await page.getByRole('status').filter({ hasText: '隔离刷新失败' }).first().waitFor();
    observation.rows_after_refresh_failure = await page.locator('.maintenance-plan-list-row').count();
    observation.selected_after_refresh_failure = await page.locator('.maintenance-plan-list-row.is-selected').innerText();
    assert.equal(observation.rows_after_refresh_failure, 2, '刷新失败也必须保留已读列表');
    assert.ok(observation.selected_after_refresh_failure.includes('PLAN-PUBLIC-2'));
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('方案列表请求完成后立即可看，不等待当前账号工单请求', async () => {
  const orderStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, path) => {
    if (path === '/api/maintenance/plans') return respond(route, planBody);
    orderStarted.resolve(); // The order response remains pending for the whole assertion.
  });
  try {
    const plansReturned = page.waitForResponse(response => new URL(response.url()).pathname === '/api/maintenance/plans');
    await page.goto(`${fixture.base}/?view=maintenance`);
    await plansReturned; await orderStarted.promise;
    const displayed = await page.locator('.maintenance-plan-list-row').first().waitFor().then(() => true, () => false);
    observations.push({ case: 'plans_without_slow_orders', plans_returned: true, orders_pending: true,
      plans_displayed: displayed, reads, writes, errors });
    assert.equal(displayed, true, '已返回的方案不得被尚未返回的私有工单挡住');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('账号或角色切换清除旧私有工单方案，公共方案保持可看', async () => {
  const results = [];
  for (const nextActor of [actorB, { ...actorA, role: 'supervisor' }]) {
    let orderReads = 0;
    const nextOrderStarted = deferred();
    const { context, page, reads, writes, errors } = await pageFor((route, path) => {
      if (path === '/api/maintenance/plans') return respond(route, planBody);
      if (++orderReads === 1) return respond(route, { items: [privateOrder(actorA, 'PLAN-PRIVATE-A')] });
      nextOrderStarted.resolve();
    });
    try {
      await page.goto(`${fixture.base}/?view=maintenance`);
      await page.getByRole('button', { name: /PLAN-PRIVATE-A/ }).waitFor();
      await changeActor(page, nextActor); await nextOrderStarted.promise;
      const publicDisplayed = await page.getByRole('button', { name: /PLAN-PUBLIC-1/ }).waitFor().then(() => true, () => false);
      const oldPrivateVisible = await privateVisible(page, 'PLAN-PRIVATE-A');
      observations.push({ case: 'actor_switch', next_actor: { user_id: nextActor.user_id, role: nextActor.role },
        public_displayed_while_orders_pending: publicDisplayed, old_private_visible: oldPrivateVisible, reads, writes, errors });
      results.push({ publicDisplayed, oldPrivateVisible });
      assert.deepEqual(writes, []); assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  assert.ok(results.every(result => !result.oldPrivateVisible), '切换身份后不得显示旧身份工单快照');
  assert.ok(results.every(result => result.publicDisplayed), '身份切换不能让已校验的公共方案重新闪空');
});

test('旧账号工单晚回包不能污染新账号方案关联', async () => {
  let orderReads = 0, oldRoute;
  const oldStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, path) => {
    if (path === '/api/maintenance/plans') return respond(route, planBody);
    if (++orderReads === 1) { oldRoute = route; oldStarted.resolve(); return; }
    return respond(route, { items: [privateOrder(actorB, 'PLAN-PRIVATE-B')] });
  });
  try {
    await page.goto(`${fixture.base}/?view=maintenance`); await oldStarted.promise;
    await changeActor(page, actorB);
    await page.getByRole('button', { name: /PLAN-PRIVATE-B/ }).waitFor();
    await respond(oldRoute, { items: [privateOrder(actorA, 'PLAN-PRIVATE-A')] });
    // A queued animation frame observes React after the old request promise settles.
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    const oldPrivateVisible = await privateVisible(page, 'PLAN-PRIVATE-A');
    const newPrivateVisible = await privateVisible(page, 'PLAN-PRIVATE-B');
    observations.push({ case: 'late_old_actor_response', old_private_visible: oldPrivateVisible,
      new_private_visible: newPrivateVisible, reads, writes, errors });
    assert.equal(oldPrivateVisible, false); assert.equal(newPrivateVisible, true);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('monitor快照仍挂起时已返回的方案独立可看，不因null快照崩溃', async () => {
  const monitorStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, path) => {
    return respond(route, path === '/api/maintenance/plans' ? planBody : { items: [] });
  }, { monitorHandler: () => { monitorStarted.resolve(); } });
  try {
    await page.goto(`${fixture.base}/?view=maintenance`); await monitorStarted.promise;
    const displayed = await page.locator('.maintenance-plan-list-row').first().waitFor().then(() => true, () => false);
    observations.push({ case: 'plans_before_monitor', monitor_pending: true, plans_displayed: displayed, reads, writes, errors });
    assert.equal(displayed, true, '方案独立加载不能依赖monitor快照先返回');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('慢工单不阻塞下一轮方案轮询，后台轮询不显示刷新中或重复并发工单', async () => {
  let planReads = 0, orderReads = 0, holdPlans = false, pollRoute;
  const orderStarted = deferred(), pollStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, path) => {
    if (path === '/api/workorders') { orderReads++; orderStarted.resolve(); return; }
    planReads++;
    if (!holdPlans) return respond(route, planBody);
    pollRoute = route; pollStarted.resolve();
  });
  try {
    await page.goto(`${fixture.base}/?view=maintenance`); await orderStarted.promise;
    await page.locator('.maintenance-plan-list-row').nth(1).waitFor();
    const baselinePlanReads = planReads;
    holdPlans = true;
    await page.clock.runFor(5000); await pollStarted.promise;
    assert.equal(planReads, baselinePlanReads + 1, '工单挂起时下一轮仍应请求方案');
    assert.equal(orderReads, 1, '工单请求挂起时不得并发重复请求');
    assert.equal(await page.getByRole('button', { name: '刷新中…', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: '刷新方案', exact: true }).isEnabled(), true);
    assert.equal(await page.locator('.maintenance-plan-list-row').count(), 2);
    await respond(pollRoute, { ...planBody, items: [...publicPlans, makePlan('PLAN-POLL-NEW')] });
    await page.getByRole('button', { name: /PLAN-POLL-NEW/ }).waitFor();
    observations.push({ case: 'slow_orders_independent_poll', baseline_plan_reads: baselinePlanReads,
      plan_reads: planReads, order_reads: orderReads, new_plan_displayed: true, background_loading_button: false, reads, writes, errors });
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('已读删除标记跨页面保留，monitor与工单旧快照不能复活已删除方案', async () => {
  const deletedPlan = makePlan('PLAN-DELETED');
  const snapshot = { device_id: 'D-1', devices: [{ device_id: 'D-1', current_sample: { device_id: 'D-1', alarm_code: 'A-1', status: 'alarm' } }],
    diagnosis: { pipeline: { event: { device_id: 'D-1', alarm_code: 'A-1', event_id: deletedPlan.event_id }, maintenance_plan: deletedPlan } } };
  let holdPlans = false, refreshRoute;
  const refreshStarted = deferred();
  const { context, page, reads, writes, errors } = await pageFor((route, path) => {
    if (path === '/api/workorders') return respond(route, { items: [privateOrder(actorA, 'PLAN-DELETED')] });
    if (!holdPlans) return respond(route, { ...planBody, deleted_plan_ids: ['PLAN-DELETED'] });
    refreshRoute = route; refreshStarted.resolve();
  }, { snapshot });
  try {
    const ordersReturned = page.waitForResponse(response => new URL(response.url()).pathname === '/api/workorders');
    await page.goto(`${fixture.base}/?view=maintenance`); await ordersReturned;
    await page.locator('.maintenance-plan-list-row').nth(1).waitFor();
    assert.equal(await privateVisible(page, 'PLAN-DELETED'), false);
    holdPlans = true;
    await page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name: '智能诊断', exact: true }).click();
    await page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name: '维修方案', exact: true }).click();
    await refreshStarted.promise;
    assert.equal(await page.locator('.maintenance-plan-list-row').count(), 2);
    assert.equal(await privateVisible(page, 'PLAN-DELETED'), false, '缓存展示时也必须保留删除集合');
    // A later read may omit an old tombstone; retained deletion knowledge must
    // still exclude that plan from old monitor/order snapshots.
    await respond(refreshRoute, { ...planBody, items: [makePlan('PLAN-PUBLIC-1', '公共计划刷新已返回'), publicPlans[1]], deleted_plan_ids: [] });
    await page.getByRole('button', { name: /公共计划刷新已返回/ }).waitFor();
    const deletedVisible = await privateVisible(page, 'PLAN-DELETED');
    observations.push({ case: 'tombstone_reentry', deleted_plan_visible: deletedVisible,
      row_count_after_reentry: await page.locator('.maintenance-plan-list-row').count(), reads, writes, errors });
    assert.equal(deletedVisible, false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
