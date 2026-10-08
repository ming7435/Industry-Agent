import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const legacyActor = { user_id: 'U-SCOPE', username: '范围维修人员', role: 'technician', primary_device_id: 'M1' };
const devices = [{ device_id: 'M1', name: '车床' }, { device_id: 'M2', name: '送料机' }, { device_id: 'M3', name: '机械臂' }];
const order = (id = 'WO-ORIGINAL') => ({ workorder_id: id, device_id: 'M1', title: id,
  assignee: legacyActor.user_id, assignee_name: legacyActor.username, status: 'in_progress' });
let fixture;
before(async () => {
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
  const compiled = await build({ stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'),
    contents: "import React from 'react';import{createRoot}from'react-dom/client';import{App}from'./App.jsx';import{getTeamSession,invalidateTeamSession}from'../teamSession.mjs';window.__scopeSession=()=>getTeamSession();window.__expireScopeSession=()=>invalidateTeamSession(getTeamSession().version);createRoot(document.getElementById('root')).render(React.createElement(App));" },
    bundle: true, write: false, format: 'iife', platform: 'browser', loader: { '.css': 'empty', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' } });
  const server = createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': request.url === '/app.js' ? 'application/javascript' : 'text/html;charset=utf-8' });
    response.end(request.url === '/app.js' ? compiled.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
  fixture = { browser, base: `http://127.0.0.1:${server.address().port}`, close: async () => {
    await browser.close(); server.closeAllConnections(); await new Promise(done => server.close(done));
  } };
});
after(async () => { await fixture?.close(); });
const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const picker = page => page.getByRole('group', { name: '负责设备（可多选）', exact: true });
const currentScope = page => page.getByRole('list', { name: '当前负责设备', exact: true });
async function open({ initialActor = legacyActor, changeStatus = 200 } = {}) {
  const context = await fixture.browser.newContext(), page = await context.newPage(); page.setDefaultTimeout(3000);
  await page.clock.install();
  let actor = initialActor, status = changeStatus, holdOrders = false, heldOrder, holdSave = false, heldSave;
  const writes = [], unexpected = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.abort());
  await page.route('**/api/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (req.method() === 'POST' && ['/api/team/register', '/api/team/login', '/api/team/logout', '/api/team/responsibilities'].includes(path)) writes.push({ path, body: req.postDataJSON() });
    else if (req.method() !== 'GET') { unexpected.push(path); return route.abort(); }
    if (path === '/api/team/me') return respond(route, { user: actor });
    if (path === '/api/team/devices') return respond(route, { items: devices });
    if (path === '/api/team/line') return respond(route, { state: 'unknown' });
    if (path === '/api/monitor/snapshot') return respond(route, { runner: { enabled: true }, devices: [], diagnosis: {} });
    if (path === '/api/team/register') {
      const body = req.postDataJSON();
      actor = { ...legacyActor, username: body.username, primary_device_id: body.primary_device_id, responsible_device_ids: body.responsible_device_ids };
      return respond(route, { user: actor }, 201);
    }
    if (path === '/api/team/login') return respond(route, { user: actor });
    if (path === '/api/team/logout') { actor = null; return respond(route, { success: true }); }
    if (path === '/api/team/responsibilities') {
      if (holdSave) { heldSave = route; return; }
      if (status !== 200) return respond(route, { detail: status === 401 ? '会话已失效'
        : status === 409 ? '设备 M1 仍有未完成工单，请先完成任务再移除负责设备' : '负责设备保存失败，请稍后重试' }, status);
      actor = { ...actor, responsible_device_ids: req.postDataJSON().responsible_device_ids, primary_device_id: req.postDataJSON().responsible_device_ids[0] };
      return respond(route, { user: actor });
    }
    if (path === '/api/workorders') {
      if (holdOrders) { heldOrder = route; return; }
      return respond(route, { items: actor ? [order(actor.responsible_device_ids?.length > 1 ? 'WO-NEW-SCOPE' : 'WO-ORIGINAL')] : [] });
    }
    return respond(route, { items: [], history: { status: 'ready' } });
  });
  await page.goto(fixture.base + '/?view=workorder');
  await page.locator('.team-access summary').click();
  return { page, context, writes, unexpected, errors,
    setStatus: value => { status = value; }, holdOrders: value => { holdOrders = value; }, heldOrder: () => heldOrder,
    holdSave: value => { holdSave = value; }, heldSave: () => heldSave,
  };
}

test('维修人员注册可以选择多台设备，并提交完整负责范围及首台兼容字段', async () => {
  const view = await open({ initialActor: null });
  try {
    await view.page.getByRole('button', { name: '注册新账号', exact: true }).click();
    await view.page.getByLabel('用户名', { exact: true }).fill('多设备维修员');
    await view.page.getByLabel('密码', { exact: true }).fill('isolated-password');
    const submit = view.page.getByRole('button', { name: '注册并登录', exact: true });
    assert.equal(await submit.isDisabled(), true);
    await picker(view.page).getByRole('checkbox', { name: /送料机/ }).check();
    await picker(view.page).getByRole('checkbox', { name: /车床/ }).check();
    await submit.click();
    await currentScope(view.page).waitFor();
    assert.deepEqual(view.writes.map(item => item.path), ['/api/team/register', '/api/team/login']);
    assert.deepEqual(view.writes[0].body, { username: '多设备维修员', password: 'isolated-password', role: 'technician', primary_device_id: 'M2', responsible_device_ids: ['M2', 'M1'] });
    assert.match(await currentScope(view.page).innerText(), /M1/); assert.match(await currentScope(view.page).innerText(), /M2/);
    assert.deepEqual(view.unexpected, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('旧账号编辑时预填原设备，保存多设备范围后立即更新身份且旧范围工单回包不能覆盖', async () => {
  const view = await open();
  try {
    await view.page.locator('.workorder-titlebar').waitFor();
    assert.match(await currentScope(view.page).innerText(), /M1/);
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    assert.equal(await picker(view.page).getByRole('checkbox', { name: /车床/ }).isChecked(), true);
    await picker(view.page).getByRole('checkbox', { name: /送料机/ }).check();
    view.holdOrders(true); await view.page.clock.runFor(5100); await frame(view.page);
    assert.ok(view.heldOrder());
    const version = await view.page.evaluate(() => window.__scopeSession().version);
    await view.page.getByRole('button', { name: '保存负责设备', exact: true }).click();
    await view.page.getByText('负责设备已更新', { exact: true }).waitFor();
    assert.ok(await view.page.evaluate(old => window.__scopeSession().version > old, version));
    assert.deepEqual(view.writes, [{ path: '/api/team/responsibilities', body: { responsible_device_ids: ['M1', 'M2'] } }]);
    assert.match(await currentScope(view.page).innerText(), /M2/);
    view.holdOrders(false); await respond(view.heldOrder(), { items: [order('WO-STALE-SCOPE')] }); await frame(view.page);
    assert.doesNotMatch(await view.page.locator('body').innerText(), /WO-STALE-SCOPE/);
    await view.page.clock.runFor(5100); await frame(view.page);
    await view.page.locator('.workorder-titlebar').filter({ hasText: 'WO-NEW-SCOPE' }).waitFor();
    assert.deepEqual(view.unexpected, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('空范围不能保存，取消恢复原选择，保存失败保留原范围与待提交选择', async () => {
  const view = await open({ changeStatus: 503 });
  try {
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    await picker(view.page).getByRole('checkbox', { name: /车床/ }).uncheck();
    assert.equal(await view.page.getByRole('button', { name: '保存负责设备', exact: true }).isDisabled(), true);
    await view.page.getByRole('button', { name: '取消修改', exact: true }).click();
    assert.equal(view.writes.length, 0);
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    assert.equal(await picker(view.page).getByRole('checkbox', { name: /车床/ }).isChecked(), true);
    await picker(view.page).getByRole('checkbox', { name: /送料机/ }).check();
    await view.page.getByRole('button', { name: '保存负责设备', exact: true }).click();
    await view.page.getByRole('alert').filter({ hasText: '负责设备保存失败' }).waitFor();
    assert.doesNotMatch(await currentScope(view.page).innerText(), /M2/);
    assert.equal(await picker(view.page).getByRole('checkbox', { name: /送料机/ }).isChecked(), true);
    view.setStatus(200); await view.page.getByRole('button', { name: '保存负责设备', exact: true }).click();
    await view.page.getByText('负责设备已更新', { exact: true }).waitFor();
    assert.match(await currentScope(view.page).innerText(), /M2/);
    assert.deepEqual(view.unexpected, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('修改范围接口401统一退出并清除旧私有工单', async () => {
  const view = await open({ changeStatus: 401 });
  try {
    await view.page.locator('.workorder-titlebar').waitFor();
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    await picker(view.page).getByRole('checkbox', { name: /送料机/ }).check();
    await view.page.getByRole('button', { name: '保存负责设备', exact: true }).click(); await frame(view.page);
    assert.match(await view.page.locator('.team-access summary').innerText(), /注册 \/ 登录/);
    assert.doesNotMatch(await view.page.locator('body').innerText(), /WO-ORIGINAL/);
    assert.equal(await currentScope(view.page).count(), 0);
    assert.deepEqual(view.unexpected, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('未完成工单阻止移除设备时显示409原因并保留原范围，取消丢弃未保存选择', async () => {
  const view = await open({ changeStatus: 409 });
  try {
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    await picker(view.page).getByRole('checkbox', { name: /送料机/ }).check();
    await picker(view.page).getByRole('checkbox', { name: /车床/ }).uncheck();
    await view.page.getByRole('button', { name: '保存负责设备', exact: true }).click();
    await view.page.getByRole('alert').filter({ hasText: '仍有未完成工单' }).waitFor();
    assert.match(await currentScope(view.page).innerText(), /M1/);
    assert.doesNotMatch(await currentScope(view.page).innerText(), /M2/);
    assert.equal(await picker(view.page).getByRole('checkbox', { name: /送料机/ }).isChecked(), true);
    assert.equal(await view.page.getByText('负责设备已更新', { exact: true }).count(), 0);
    await view.page.getByRole('button', { name: '取消修改', exact: true }).click();
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    assert.equal(await picker(view.page).getByRole('checkbox', { name: /车床/ }).isChecked(), true);
    assert.equal(await picker(view.page).getByRole('checkbox', { name: /送料机/ }).isChecked(), false);
    assert.deepEqual(view.writes, [{ path: '/api/team/responsibilities', body: { responsible_device_ids: ['M2'] } }]);
    assert.deepEqual(view.unexpected, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('范围保存旧响应不能恢复已经失效的账号', async () => {
  const view = await open();
  try {
    view.holdSave(true);
    await view.page.getByRole('button', { name: '修改负责设备', exact: true }).click();
    await picker(view.page).getByRole('checkbox', { name: /送料机/ }).check();
    await view.page.getByRole('button', { name: '保存负责设备', exact: true }).click(); await frame(view.page);
    assert.ok(view.heldSave());
    await view.page.evaluate(() => window.__expireScopeSession()); await frame(view.page);
    await respond(view.heldSave(), { user: { ...legacyActor, responsible_device_ids: ['M1', 'M2'] } }); await frame(view.page);
    assert.match(await view.page.locator('.team-access summary').innerText(), /注册 \/ 登录/);
    assert.equal(await currentScope(view.page).count(), 0);
    assert.deepEqual(view.unexpected, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});
