import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { deferred, respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = resolve(root, '.runtime/verification/workorder-loading-20261007');
const actorA = { user_id: 'U-A', username: '维修人员甲', role: 'technician' };
const actorB = { user_id: 'U-B', username: '维修人员乙', role: 'technician' };
const orderFor = (actor, id, alarm = '700006') => ({ workorder_id: id, device_id: 'D-1', alarm_code: '', event_id:`EVT-${alarm}`,
  status: 'in_progress', assignee: actor.user_id, assignee_name: actor.username, title: '现场故障核查',
  diagnosis_snapshot: { device_id: 'D-1', raw: { device_id: 'D-1', alarm_code: alarm } },
  maintenance_plan_snapshot: { plan_id: 'PLAN-1', plan_kind: 'inspection' } });
const monitorFor = alarm => ({ device_id: 'D-1', devices: [{ device_id: 'D-1', name: '隔离设备',
  current_sample: { device_id: 'D-1', alarm_code: alarm, status: 'alarm' } }], diagnosis: { pipeline_by_device: {
    'D-1': { event: { device_id: 'D-1', alarm_code: alarm, event_id: `EVT-${alarm}` }, maintenance_plan: {
      plan_id: 'PLAN-1', device_id: 'D-1', alarm_code: alarm, workorder_ready: true,
      validation_findings: [], dispatch: { allowed: true }, repair_steps: ['记录现场证据'],
    } },
  } } });
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
    plugins: [{ name: 'workorder-loading-readonly-fixture', setup(builder) {
      builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async () => ({ contents: appSource, loader: 'jsx' }));
      // Real App identity remounts are preserved; fixture actors are not credentials.
      builder.onLoad({ filter: /[\\/]TeamAccess\.jsx$/ }, async () => ({ loader: 'jsx', contents: `import React,{useEffect} from 'react';export default function FixtureActor({onActor}){useEffect(()=>{const update=e=>onActor(e.detail);window.addEventListener('fixture-actor',update);return()=>window.removeEventListener('fixture-actor',update)},[onActor]);return null;}` }));
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
  await writeFile(resolve(evidenceDir, 'frontend-loading-observations.json'), JSON.stringify({
    app_sha256: sourceHash, actual_components: ['App', 'WorkorderView'], api_mocked: true,
    actor_is_fixture_only: true, observations,
  }, null, 2));
});

const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const changeActor = (page, actor) => page.evaluate(value => window.dispatchEvent(new CustomEvent('fixture-actor', { detail: value })), actor);
const queue = page => page.locator('.workorder-page [aria-label="工单队列"]');
const pageText = page => page.locator('.workorder-page').innerText();

test('自动派发后的新任务在一秒轮询内出现，无需手动刷新', async () => {
  let items = [];
  const { context, page, openAs, writes, errors } = await pageFor(route => respond(route, { items }));
  try {
    await openAs();
    await page.getByText('暂无可见工单', { exact: false }).waitFor();
    items = [orderFor(actorA, 'WO-AUTO-NEW')];
    await page.clock.runFor(1200);
    await page.getByRole('button', { name: /WO-AUTO-NEW/ }).waitFor();
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('工程资料待核实的故障任务自动出现并显示原方案引用与任务范围', async () => {
  let items=[];
  const {context,page,openAs,writes,errors}=await pageFor(route=>respond(route,{items}));
  try {
    await openAs();
    await page.getByText('暂无可见工单',{exact:false}).waitFor();
    items=[{...orderFor(actorA,'WO-FOLLOWUP'),source:'saved-plan-dispatch',plan_id:'P-ORIGINAL',
      dispatch_mode:'fault_followup',steps:['安全停机后记录送料状态'],
      dispatch_findings:['CAD/BOM 工程证据校验未通过：未解析到工程部件'],
      maintenance_plan_snapshot:{plan_id:'P-ORIGINAL',repair_steps:['原方案步骤'],required_parts:['TRAK']}}];
    await page.clock.runFor(1200);
    await page.getByRole('button',{name:/WO-FOLLOWUP/}).waitFor();
    const task=page.getByRole('region',{name:'工单任务范围'});
    await task.waitFor();
    assert.match(await task.innerText(),/P-ORIGINAL/);
    assert.match(await task.innerText(),/安全停机后记录送料状态/);
    assert.match(await task.innerText(),/CAD\/BOM/);
    assert.equal(await page.getByText('系统自动派发',{exact:true}).count(),1);
    assert.deepEqual(writes,[]); assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('工单页面重进保留列表和选择，后台慢请求不要求再次刷新', async () => {
  let hold = false;
  const { context, page, openAs, writes, errors } = await pageFor(route => {
    if (!hold) return respond(route, { items: [orderFor(actorA, 'WO-CACHED')] });
  });
  try {
    await openAs();
    await page.getByRole('button', { name: /WO-CACHED/ }).click();
    hold = true;
    const nav = page.getByRole('navigation', { name: '功能导航' });
    await nav.getByRole('button', { name: '智能诊断', exact: true }).click();
    await nav.getByRole('button', { name: '工单系统', exact: true }).click();
    assert.ok((await queue(page).innerText()).includes('WO-CACHED'));
    assert.equal((await queue(page).innerText()).includes('正在读取'), false);
    assert.ok((await page.locator('.workorder-titlebar').innerText()).includes('WO-CACHED'));
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

async function pageFor(handleOrders) {
  const context = await fixture.browser.newContext(), page = await context.newPage();
  page.setDefaultTimeout(3000); await page.clock.install();
  let currentMonitor = monitorFor('700006');
  const firstOrdersStarted = deferred();
  const reads = [], writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.fulfill({ contentType: 'text/html', body: '<p>隔离图纸占位</p>' }));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (!['GET', 'HEAD'].includes(route.request().method())) { writes.push({ path, method: route.request().method() }); return route.abort(); }
    reads.push(path);
    if (path === '/api/monitor/snapshot') return respond(route, currentMonitor);
    if (path === '/api/workorders') { firstOrdersStarted.resolve(); return handleOrders(route); }
    return respond(route, { items: [] });
  });
  return { context, page, reads, writes, errors,
    setAlarm: code => { currentMonitor = monitorFor(code); },
    openAs: async (actor = actorA) => {
      const monitorReturned = page.waitForResponse(response => new URL(response.url()).pathname === '/api/monitor/snapshot');
      await page.goto(`${fixture.base}/?view=workorder`); await monitorReturned; await frame(page);
      // Finish the monitor initial render before logging the fixture actor in, so
      // a second initial request cannot be mistaken for a poll concurrency bug.
      await changeActor(page, actor); await firstOrdersStarted.promise; await frame(page);
    },
  };
}

test('首次工单请求未结束时不把加载中误报为当前账号无工单', async () => {
  const { context, page, openAs, reads, writes, errors } = await pageFor(() => {});
  try {
    await openAs();
    const text = await pageText(page);
    observations.push({ case: 'pending_first_read', queue: await queue(page).innerText(),
      false_empty: text.includes('暂无可见工单'), false_incident_absent: text.includes('当前账号尚无报警'),
      monitor_plan_ready_visible: text.includes('方案就绪，等待系统派发'), reads, writes, errors });
    assert.equal(text.includes('暂无可见工单'), false, '请求还没返回时不能判定无工单');
    assert.equal(text.includes('当前账号尚无报警'), false, '当前报警可见性尚未核对');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('401读取失败明确显示会话错误，不用无工单业务空态替代', async () => {
  const { context, page, openAs, reads, writes, errors } = await pageFor(route => respond(route, { detail: '维修会话已失效，请重新登录' }, 401));
  try {
    await openAs(); await page.getByRole('alert').filter({ hasText: '维修会话已失效' }).waitFor();
    const text = await pageText(page);
    observations.push({ case: 'unauthorized_first_read', queue: await queue(page).innerText(), error_visible: true,
      false_empty: text.includes('暂无可见工单'), false_incident_absent: text.includes('当前账号尚无报警'), reads, writes, errors });
    assert.equal(text.includes('暂无可见工单'), false, '拒绝读取不代表业务中没有工单');
    assert.equal(text.includes('当前账号尚无报警'), false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('慢工单请求跨过轮询周期时不能并发重复读取', async () => {
  let orderReads = 0;
  const { context, page, openAs, reads, writes, errors } = await pageFor(() => { orderReads++; });
  try {
    await openAs(); assert.equal(orderReads, 1);
    await page.clock.runFor(10000);
    observations.push({ case: 'pending_poll_overlap', pending_order_reads_after_10s: orderReads, reads, writes, errors });
    assert.equal(orderReads, 1, '同一加载上下文只应有一个挂起的列表请求');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('切换现场报警后旧列表晚回包不能清空已读取的新现场工单', async () => {
  let orderReads = 0, oldRoute;
  const newOrder = orderFor(actorA, 'WO-CURRENT', '700007');
  const { context, page, openAs, setAlarm, reads, writes, errors } = await pageFor(route => {
    if (++orderReads === 1) { oldRoute = route; return; }
    return respond(route, { items: [newOrder] });
  });
  try {
    await openAs(); setAlarm('700007'); await page.clock.runFor(1000);
    await page.getByRole('button', { name: /WO-CURRENT/ }).waitFor(); await page.locator('.workorder-titlebar').waitFor();
    await respond(oldRoute, { items: [] }); await frame(page);
    const newOrderVisible = (await queue(page).innerText()).includes('WO-CURRENT');
    observations.push({ case: 'late_old_incident_list', new_order_visible_after_old_empty: newOrderVisible,
      queue: await queue(page).innerText(), reads, writes, errors });
    assert.equal(newOrderVisible, true, '旧报警上下文回包不得把新现场工单清成0条');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('不同账号或同账号角色变化按App身份重挂载，旧回包不清空新作用域工单', async () => {
  for (const nextActor of [actorB, { ...actorA, role: 'supervisor' }]) {
    let orderReads = 0, oldRoute;
    const { context, page, openAs, reads, writes, errors } = await pageFor(route => {
      if (++orderReads === 1) { oldRoute = route; return; }
      return respond(route, { items: [orderFor(nextActor, 'WO-NEXT-SCOPE')] });
    });
    try {
      await openAs(); await changeActor(page, nextActor);
      await page.getByRole('button', { name: /WO-NEXT-SCOPE/ }).waitFor();
      await respond(oldRoute, { items: [] }); await frame(page);
      const newOrderVisible = (await queue(page).innerText()).includes('WO-NEXT-SCOPE');
      observations.push({ case: 'late_old_actor_list', next_actor: { user_id: nextActor.user_id, role: nextActor.role },
        new_actor_order_visible: newOrderVisible, reads, writes, errors });
      assert.equal(newOrderVisible, true);
      assert.deepEqual(writes, []); assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});

test('授权列表成功返回items为空后才显示真实业务空态', async () => {
  const { context, page, openAs, reads, writes, errors } = await pageFor(route => respond(route, { items: [] }));
  try {
    const ordersReturned = page.waitForResponse(response => new URL(response.url()).pathname === '/api/workorders');
    await openAs(); await ordersReturned; await frame(page);
    const text = await pageText(page);
    observations.push({ case: 'confirmed_empty_success', authorized_success: true,
      confirmed_empty: text.includes('暂无可见工单'), reads, writes, errors });
    assert.equal(text.includes('暂无可见工单'), true);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('已读取的私人工单在401或403授权失效后立即清除，不再显示旧详情', async () => {
  for (const status of [401, 403]) {
    let failed = false;
    const order = orderFor(actorA, 'WO-PRIVATE-READ');
    const message = status === 401 ? '维修会话已失效，请重新登录' : '当前账号不再有权读取此工单';
    const { context, page, openAs, reads, writes, errors } = await pageFor(route =>
      respond(route, failed ? { detail: message } : { items: [order] }, failed ? status : 200));
    try {
      await openAs(); await page.locator('.workorder-titlebar').waitFor();
      assert.ok((await queue(page).innerText()).includes(order.workorder_id));
      failed = true; await page.clock.runFor(5000);
      await page.getByRole('alert').filter({ hasText: message }).waitFor();
      const text = await pageText(page);
      const oldOrderVisible = text.includes(order.workorder_id);
      observations.push({ case: 'authorization_lost_after_success', status, old_order_visible: oldOrderVisible,
        detail_visible: await page.locator('.workorder-titlebar').count() > 0, error_visible: true,
        false_empty: text.includes('暂无可见工单'), reads, writes, errors });
      assert.equal(oldOrderVisible, false, '失效会话不能继续显示旧私人工单');
      assert.equal(await page.locator('.workorder-titlebar').count(), 0);
      assert.equal(text.includes('暂无可见工单'), false, '授权失效不代表业务无工单');
      assert.equal(text.includes('当前账号尚无报警'), false);
      assert.deepEqual(writes, []); assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});

test('已有授权工单的临时503刷新失败保留内容并明确提示失败', async () => {
  let failed = false;
  const order = orderFor(actorA, 'WO-KNOWN-503');
  const message = '工单读取服务暂时不可用，请稍后重试';
  const { context, page, openAs, reads, writes, errors } = await pageFor(route =>
    respond(route, failed ? { detail: message } : { items: [order] }, failed ? 503 : 200));
  try {
    await openAs(); await page.locator('.workorder-titlebar').waitFor();
    failed = true; await page.clock.runFor(5000);
    await page.locator('.workorder-page .inline-error').filter({ hasText: message }).waitFor();
    const text = await pageText(page);
    const knownOrderVisible = (await queue(page).innerText()).includes(order.workorder_id);
    const detailVisible = (await page.locator('.workorder-titlebar').innerText()).includes(order.workorder_id);
    observations.push({ case: 'temporary_failure_after_success', status: 503,
      known_order_visible: knownOrderVisible, detail_visible: detailVisible, error_visible: true, reads, writes, errors });
    assert.equal(knownOrderVisible, true); assert.equal(detailVisible, true);
    assert.equal(text.includes('暂无可见工单'), false);
    assert.equal(text.includes('当前账号尚无报警'), false);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
