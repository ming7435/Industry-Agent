import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = resolve(root, '.runtime/verification/team-session-expiry-20261007');
const actorA = { user_id: 'U-A', username: '维修甲', role: 'technician', primary_device_id: 'D-1' };
const actorB = { user_id: 'U-B', username: '维修乙', role: 'technician', primary_device_id: 'D-1' };
const sample = { device_id: 'D-1', alarm_code: '700006', status: 'alarm' };
const orderFor = actor => ({ workorder_id: `WO-${actor.user_id}`, device_id: 'D-1', status: 'in_progress',
  assignee: actor.user_id, assignee_name: actor.username, alarm_code: '', accepted_by: actor.user_id,
  diagnosis_snapshot: { device_id: 'D-1', raw: { alarm_code: '700006' } },
  execution_review: { required: true, findings: ['刀塔故障错误套用安全门模板'] },
  maintenance_plan_snapshot: { plan_id: 'PLAN-OLD', plan_kind: 'repair' } });
const observations = [];
let fixture, sourceHash;
before(async () => {
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
  const app = await readFile(resolve(root, 'frontend/monitor-react/src/app/App.jsx'), 'utf8');
  sourceHash = createHash('sha256').update(app).digest('hex');
  const compiled = await build({
    stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'), contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {App} from './App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));` },
    bundle: true, write: false, format: 'iife', platform: 'browser', loader: { '.css': 'empty', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' },
  });
  const server = createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': request.url === '/component.js' ? 'application/javascript' : 'text/html;charset=utf-8' });
    response.end(request.url === '/component.js' ? compiled.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script>');
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
  fixture = { browser, base: `http://127.0.0.1:${server.address().port}`, close: async () => {
    await browser.close(); server.closeAllConnections(); await new Promise(done => server.close(done));
  } };
});
after(async () => {
  await fixture?.close(); await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'frontend-session-observations.json'), JSON.stringify({
    app_sha256: sourceHash, real_components: ['App', 'TeamAccess', 'SupervisorQueue', 'WorkorderView'],
    mocked_api: true, real_business_writes: 0, no_real_cookies_or_tokens: true, observations,
  }, null, 2));
});
const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const header = page => page.locator('.team-access summary');
async function pageFor({ initialActor = actorA, handler } = {}) {
  const context = await fixture.browser.newContext(), page = await context.newPage();
  page.setDefaultTimeout(3000); await page.clock.install();
  let serverActor = initialActor;
  const reads = [], mockWrites = [], unexpectedWrites = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (request.method() === 'GET') reads.push(path);
    else if (request.method() === 'POST' && ['/api/team/register', '/api/team/login', '/api/team/logout', `/api/workorders/${orderFor(actorA).workorder_id}/action`].includes(path)) mockWrites.push({ path, body: request.postDataJSON() });
    else if (!['GET', 'HEAD'].includes(request.method())) { unexpectedWrites.push({ path, method: request.method() }); return route.abort(); }
    if (handler) {
      const outcome = handler(route, path, serverActor);
      if (outcome !== undefined) return outcome;
    }
    if (path === '/api/team/me') return respond(route, { user: serverActor });
    if (path === '/api/team/devices') return respond(route, { items: [{ device_id: 'D-1', name: '隔离设备' }] });
    if (path === '/api/team/line') return respond(route, { state: 'stopped' });
    if (path === '/api/team/register') return respond(route, { user: actorB }, 201);
    if (path === '/api/team/login') { serverActor = actorB; return respond(route, { user: serverActor }); }
    if (path === '/api/team/logout') { serverActor = null; return respond(route, { success: true }); }
    if (path === '/api/monitor/snapshot') return respond(route, { device_id: 'D-1', devices: [{ device_id: 'D-1', name: '隔离设备', current_sample: sample }] });
    if (path === '/api/workorders') return respond(route, { items: serverActor ? [orderFor(serverActor)] : [] });
    if (path === '/api/team/workorders') return respond(route, { items: serverActor ? [orderFor(serverActor)] : [] });
    if (path === '/api/team/reminders') return respond(route, { items: serverActor ? [{ reminder_id: `REM-${serverActor.user_id}`, workorder_id: orderFor(serverActor).workorder_id, text: '私有催办记录', read: false }] : [] });
    return respond(route, { items: [] });
  });
  await page.goto(`${fixture.base}/?view=workorder`);
  return { context, page, reads, mockWrites, unexpectedWrites, errors,
    setActor: value => { serverActor = value; },
    openLogin: async () => { if (await page.locator('.team-access').getAttribute('open') === null) await header(page).click(); },
  };
}
async function loginAsB(view) {
  await view.openLogin();
  await view.page.getByLabel('用户名', { exact: true }).fill(actorB.username);
  await view.page.getByLabel('密码', { exact: true }).fill('isolated-test-password');
  await view.page.getByRole('button', { name: '登录', exact: true }).click();
  await view.page.getByRole('button', { name: new RegExp(orderFor(actorB).workorder_id) }).waitFor();
}

test('注册只提供维修人员，必须选择机器后才能注册并登录', async () => {
  const view = await pageFor({ initialActor: null });
  try {
    await view.openLogin();
    await view.page.getByRole('button', { name: '注册新账号', exact: true }).click();
    assert.equal(await view.page.getByLabel('身份', { exact: true }).count(), 0);
    assert.equal(await view.page.locator('.team-access-body').getByRole('combobox').count(), 1);
    assert.equal((await view.page.locator('.team-access-body').innerText()).includes('监督'), false);
    await view.page.getByLabel('用户名', { exact: true }).fill(actorB.username);
    await view.page.getByLabel('密码', { exact: true }).fill('isolated-test-password');
    await view.page.getByRole('button', { name: '注册并登录', exact: true }).click();
    await frame(view.page);
    assert.equal(view.mockWrites.length, 0);
    await view.page.getByLabel(/^主要负责机器/).selectOption('D-1');
    await view.page.getByRole('button', { name: '注册并登录', exact: true }).click();
    await view.page.getByRole('button', { name: '退出登录', exact: true }).waitFor();
    assert.deepEqual(view.mockWrites.map(write => write.path), ['/api/team/register', '/api/team/login']);
    assert.deepEqual(view.mockWrites[0].body, { username: actorB.username, password: 'isolated-test-password', role: 'technician', primary_device_id: 'D-1' });
    assert.ok((await header(view.page).innerText()).includes('维修人员'));
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
    observations.push({ case: 'technician_only_registration', machine_required: true, registration_role: view.mockWrites[0].body.role, unexpectedWrites: view.unexpectedWrites });
  } finally { await view.context.close(); }
});

test('工单提交401使顶部统一登录失效，并卸载旧私人工单和催办内容', async () => {
  const view = await pageFor({ handler: (route, path) => path.endsWith('/action') ? respond(route, { detail: '请先登录维修小组账号' }, 401) : undefined });
  try {
    await view.page.locator('.workorder-titlebar').waitFor();
    await view.page.getByLabel('处理说明', { exact: true }).fill('隔离现场核查记录');
    await view.page.getByRole('button', { name: '提交处理记录', exact: true }).click(); await frame(view.page);
    const text = await view.page.locator('body').innerText();
    observations.push({ case: 'action_401_invalidates', header: await header(view.page).innerText(), old_order_visible: text.includes(orderFor(actorA).workorder_id), errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.ok((await header(view.page).innerText()).includes('注册 / 登录'));
    assert.equal(text.includes(orderFor(actorA).workorder_id), false);
    assert.equal(text.includes('私有催办记录'), false);
    assert.equal(await view.page.locator('.workorder-detail-page').count(), 0);
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});

test('催办列表401也统一失效，不能让顶部假登录与旧工单并存', async () => {
  let expired = false;
  const view = await pageFor({ handler: (route, path) => expired && path === '/api/team/reminders'
    ? respond(route, { detail: '维修会话已过期' }, 401) : undefined });
  try {
    await view.page.locator('.workorder-titlebar').waitFor();
    expired = true; await view.page.clock.runFor(5100); await frame(view.page);
    observations.push({ case: 'team_read_401_invalidates', header: await header(view.page).innerText(), errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.ok((await header(view.page).innerText()).includes('注册 / 登录'));
    assert.equal((await view.page.locator('body').innerText()).includes(orderFor(actorA).workorder_id), false);
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});

test('临时503保留有效登录和已读工单内容', async () => {
  let failed = false;
  const view = await pageFor({ handler: (route, path) => failed && path === '/api/workorders'
    ? respond(route, { detail: '工单读取暂不可用' }, 503) : undefined });
  try {
    await view.page.locator('.workorder-titlebar').waitFor();
    failed = true; await view.page.clock.runFor(5100);
    await view.page.locator('.workorder-page .inline-error').filter({ hasText: '工单读取暂不可用' }).waitFor();
    assert.ok((await header(view.page).innerText()).includes(actorA.username));
    assert.ok((await view.page.locator('.workorder-titlebar').innerText()).includes(orderFor(actorA).workorder_id));
    observations.push({ case: '503_retains_session_and_private_content', header: await header(view.page).innerText(), errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});

test('失效后重新登录自动重读工单与催办，恢复真实执行复核入口', async () => {
  let expired = false;
  const view = await pageFor({ handler: (route, path) => expired && path === '/api/workorders'
    ? respond(route, { detail: '请先登录维修小组账号' }, 401) : undefined });
  try {
    await view.page.locator('.workorder-titlebar').waitFor(); expired = true;
    await view.page.clock.runFor(5100); await frame(view.page);
    assert.ok((await header(view.page).innerText()).includes('注册 / 登录'));
    const readsBeforeLogin = view.reads.filter(path => path === '/api/workorders').length;
    expired = false; await loginAsB(view);
    await view.page.getByRole('button', { name: '重新生成并校验方案', exact: true }).waitFor();
    assert.ok((await header(view.page).innerText()).includes(actorB.username));
    assert.equal((await view.page.locator('body').innerText()).includes(orderFor(actorA).workorder_id), false);
    assert.ok(view.reads.filter(path => path === '/api/workorders').length > readsBeforeLogin);
    assert.ok((await view.page.locator('body').innerText()).includes(orderFor(actorB).workorder_id));
    observations.push({ case: 'relogin_refreshes_original_views', mocked_login_posts: view.mockWrites.filter(item => item.path === '/api/team/login').length, errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});

test('旧账号工单401晚回包不能使新登录账号失效', async () => {
  let heldRoute, hold = false;
  const view = await pageFor({ handler: (route, path, currentActor) => {
    if (hold && currentActor?.user_id === actorA.user_id && path === '/api/workorders') {
      heldRoute = route; return new Promise(() => {});
    }
  } });
  try {
    await view.page.locator('.workorder-titlebar').waitFor(); hold = true;
    const requestStarted = view.page.waitForRequest(request => new URL(request.url()).pathname === '/api/workorders');
    await view.page.clock.runFor(5100); await requestStarted; await frame(view.page);
    await view.openLogin(); await view.page.getByRole('button', { name: '退出登录', exact: true }).click();
    await view.page.getByRole('button', { name: '登录', exact: true }).waitFor(); await loginAsB(view);
    await respond(heldRoute, { detail: '旧账号会话已失效' }, 401); await frame(view.page);
    assert.ok((await header(view.page).innerText()).includes(actorB.username));
    assert.ok((await view.page.locator('.workorder-titlebar').innerText()).includes(orderFor(actorB).workorder_id));
    observations.push({ case: 'stale_401_cannot_clear_new_session', header: await header(view.page).innerText(), errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});

test('初始team/me的旧200晚回包不能覆盖登录后的新账号', async () => {
  let meRoute;
  const view = await pageFor({ initialActor: null, handler: (route, path) => {
    if (path === '/api/team/me') { meRoute = route; return new Promise(() => {}); }
  } });
  try {
    await header(view.page).waitFor(); await loginAsB(view);
    await respond(meRoute, { user: actorA }); await frame(view.page);
    observations.push({ case: 'stale_me_200_cannot_restore_old_actor', header: await header(view.page).innerText(), errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.ok((await header(view.page).innerText()).includes(actorB.username));
    assert.equal((await header(view.page).innerText()).includes(actorA.username), false);
    assert.ok((await view.page.locator('.workorder-titlebar').innerText()).includes(orderFor(actorB).workorder_id));
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});

test('显式登录开始后抵达的旧me401不能丢弃已成功的login200', async () => {
  let meRoute, loginRoute;
  const view = await pageFor({ initialActor: null, handler: (route, path) => {
    if (path === '/api/team/me') { meRoute = route; return new Promise(() => {}); }
    if (path === '/api/team/login') { loginRoute = route; return new Promise(() => {}); }
  } });
  try {
    await header(view.page).waitFor(); await view.openLogin();
    await view.page.getByLabel('用户名', { exact: true }).fill(actorB.username);
    await view.page.getByLabel('密码', { exact: true }).fill('isolated-test-password');
    const loginStarted = view.page.waitForRequest(request => new URL(request.url()).pathname === '/api/team/login');
    await view.page.getByRole('button', { name: '登录', exact: true }).click(); await loginStarted; await frame(view.page);
    await respond(meRoute, { detail: '初始旧会话已过期' }, 401); await frame(view.page);
    view.setActor(actorB); await respond(loginRoute, { user: actorB });
    await view.page.getByRole('button', { name: new RegExp(orderFor(actorB).workorder_id) }).waitFor();
    assert.ok((await header(view.page).innerText()).includes(actorB.username));
    observations.push({ case: 'login_start_protects_against_old_me_401', header: await header(view.page).innerText(), errors: view.errors, unexpectedWrites: view.unexpectedWrites });
    assert.deepEqual(view.errors, []); assert.deepEqual(view.unexpectedWrites, []);
  } finally { await view.context.close(); }
});
