import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = resolve(root, '.runtime/verification/workorder-simple-completion-20261007/revalidation-regression');
const actor = { user_id: 'U-OWNER', username: '维修人员甲', role: 'technician' };
const sample = { device_id: 'D-1', alarm_code: '700006', status: 'alarm' };
const review = { required: true, findings: ['刀塔故障错误引用安全门模板'] };
const baseOrder = { workorder_id: 'WO-EXISTING', device_id: 'D-1', alarm_code: '',
  assignee: actor.user_id, assignee_name: actor.username, status: 'in_progress', accepted_by: actor.user_id,
  diagnosis_snapshot: { device_id: 'D-1', raw: { alarm_code: '700006' } },
  execution_review: review, maintenance_plan_snapshot: { plan_id: 'PLAN-OLD', plan_kind: 'repair', repair_target: '安全门' } };
const repairedOrder = { ...baseOrder, execution_review: { required: false, findings: [] },
  maintenance_plan_snapshot: { plan_id: 'PLAN-NEW', plan_kind: 'repair', repair_target: '刀塔', repair_steps: ['按已校验方案检查刀塔'] } };
const observations = [];
let fixture;
before(async () => { fixture = await centerFixture({ actor, sample, snapshot: { devices: [] } }); });
after(async () => {
  await fixture?.close(); await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'frontend-revalidation-observations.json'), JSON.stringify({ api_mocked: true, real_business_writes: 0, observations }, null, 2));
});
const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const initialButton = page => page.getByRole('button', { name: '重新生成并校验方案', exact: true });
const reviewPanel = page => page.getByRole('region', { name: '方案执行复核', exact: true });

async function pageFor({ currentFixture = fixture, order = baseOrder, ordersHandler, revalidateHandler, fullApp = false } = {}) {
  const context = await currentFixture.browser.newContext();
  const page = await context.newPage(); page.setDefaultTimeout(2500); await page.clock.install();
  const posts = [], unexpectedWrites = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (request.method() === 'POST' && path === `/api/workorders/${order.workorder_id}/revalidate-plan`) {
      const body = request.postDataJSON(); posts.push({ path, body });
      return revalidateHandler?.(route, body, posts.length) ?? respond(route, {});
    }
    if (!['GET', 'HEAD'].includes(request.method())) {
      unexpectedWrites.push({ path, method: request.method() }); return route.abort();
    }
    if (path === '/api/workorders') return ordersHandler?.(route) ?? respond(route, { items: [order] });
    if (fullApp && path === '/api/monitor/snapshot') return respond(route, { device_id: sample.device_id,
      devices: [{ device_id: sample.device_id, name: '隔离设备', current_sample: sample }] });
    return respond(route, { items: [] });
  });
  try {
    await page.goto(`${currentFixture.base}/?view=workorder`); await page.locator('.workorder-titlebar').waitFor();
  } catch (error) {
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(resolve(evidenceDir, 'frontend-revalidation-navigation-diagnostic.json'), JSON.stringify({
      body: (await page.locator('body').innerText()).slice(0, 2200), errors,
    }, null, 2));
    await context.close(); throw error;
  }
  return { context, page, posts, unexpectedWrites, errors };
}
const applied = body => ({ status: 'applied', request_id: body.request_id, workorder: repairedOrder,
  maintenance_plan: repairedOrder.maintenance_plan_snapshot, validation_findings: [], message: '新方案已校验并应用到原工单' });
const blocked = body => ({ status: 'blocked', request_id: body.request_id, workorder: baseOrder,
  maintenance_plan: { plan_id: 'PLAN-CANDIDATE', validation_findings: ['缺少刀塔部件工程依据'] },
  validation_findings: ['缺少刀塔部件工程依据'], message: '候选方案尚不能应用' });
function assertOnlyScopedPosts(posts, unexpectedWrites, errors) {
  for (const post of posts) {
    assert.equal(post.path, '/api/workorders/WO-EXISTING/revalidate-plan');
    assert.deepEqual(Object.keys(post.body), ['request_id']);
    assert.match(post.body.request_id, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
  }
  assert.deepEqual(unexpectedWrites, []); assert.deepEqual(errors, []);
}

test('同一已派单应用新方案，保留负责人和未提交记录并允许实际执行后直接申请核验', async () => {
  let current = { ...baseOrder, execution_review: { required: false, findings: [] } };
  const { context, page, posts, unexpectedWrites, errors } = await pageFor({
    ordersHandler: route => respond(route, { items: [current] }), revalidateHandler: (route, body) => respond(route, applied(body)),
  });
  try {
    await page.getByLabel('处理说明', { exact: true }).fill('尚未提交的现场刀塔记录');
    assert.equal(await page.locator('.maintenance-sheet').getByRole('checkbox').count(), 0);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    current = baseOrder; await page.clock.runFor(5000); await initialButton(page).waitFor();
    assert.equal(await page.getByLabel('处理说明', { exact: true }).inputValue(), '尚未提交的现场刀塔记录');
    await initialButton(page).click();
    await page.getByRole('status').filter({ hasText: '仍需实际执行' }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(await page.locator('.workorder-queue-item').count(), 1);
    const title = await page.locator('.workorder-titlebar').innerText();
    assert.ok(title.includes(baseOrder.workorder_id)); assert.ok(title.includes(actor.username));
    assert.equal(await page.getByLabel('处理说明', { exact: true }).inputValue(), '尚未提交的现场刀塔记录');
    assert.equal(await page.locator('.maintenance-sheet').getByRole('checkbox').count(), 0);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    assert.equal(await initialButton(page).count(), 0);
    assertOnlyScopedPosts(posts, unexpectedWrites, errors);
    observations.push({ case: 'applied_same_order', posts, owner_retained: true, draft_retained: true, direct_manual_confirmation_available: true, unexpectedWrites, errors });
  } finally { await context.close(); }
});

test('候选方案被阻止时原工单与复核审计保留，挂起请求不可重复点击', async () => {
  let pendingRoute, pendingBody;
  const { context, page, posts, unexpectedWrites, errors } = await pageFor({ revalidateHandler: (route, body) => { pendingRoute = route; pendingBody = body; return new Promise(() => {}); } });
  try {
    await page.getByLabel('处理说明', { exact: true }).fill('保留原始现场证据');
    await initialButton(page).click(); await frame(page);
    assert.equal(await initialButton(page).isDisabled(), true); assert.equal(posts.length, 1);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), true);
    await respond(pendingRoute, blocked(pendingBody));
    await reviewPanel(page).getByText('缺少刀塔部件工程依据', { exact: true }).waitFor();
    assert.ok((await reviewPanel(page).innerText()).includes(review.findings[0]));
    assert.equal(await page.locator('.maintenance-sheet').getByRole('checkbox').count(), 0);
    assert.equal(await page.getByLabel('处理说明', { exact: true }).inputValue(), '保留原始现场证据');
    assert.equal(await page.locator('.workorder-queue-item').count(), 1);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    assertOnlyScopedPosts(posts, unexpectedWrites, errors);
    observations.push({ case: 'blocked_retains_old_order', posts, findings_visible: true, old_review_retained: true, unexpectedWrites, errors });
  } finally { await context.close(); }
});

test('503未知结果和在途409仅以原请求编号显式核对，不盲目新生成', async () => {
  const { context, page, posts, unexpectedWrites, errors } = await pageFor({ revalidateHandler: (route, body, count) => {
    if (count === 1) return respond(route, { detail: '返回结果暂不可用' }, 503);
    if (count === 2) return respond(route, { detail: { message: '相同请求仍在执行', execution_started: true } }, 409);
    return respond(route, applied(body));
  } });
  try {
    await initialButton(page).click();
    const verify = page.getByRole('button', { name: '核对方案更新结果', exact: true });
    await verify.waitFor(); assert.equal(await initialButton(page).count(), 0);
    await page.clock.runFor(10000); assert.equal(posts.length, 1);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), true);
    await verify.click(); await page.getByText(/相同请求仍在执行/).first().waitFor();
    await verify.click(); await page.getByRole('status').filter({ hasText: '仍需实际执行' }).waitFor();
    assert.equal(posts.length, 3); assert.ok(posts.every(post => post.body.request_id === posts[0].body.request_id));
    assertOnlyScopedPosts(posts, unexpectedWrites, errors);
    observations.push({ case: 'unknown_same_request', posts, no_automatic_resubmission: true, unexpectedWrites, errors });
  } finally { await context.close(); }
});

test('确定未启动的预检查拒绝允许下一次使用新请求编号，blocked也结束旧命令', async () => {
  const { context, page, posts, unexpectedWrites, errors } = await pageFor({ revalidateHandler: (route, body, count) =>
    count === 1 ? respond(route, { detail: { message: '当前现场数据尚未就绪', execution_started: false } }, 409) : respond(route, blocked(body)) });
  try {
    await initialButton(page).click(); await page.getByText(/当前现场数据尚未就绪/).first().waitFor();
    await initialButton(page).click(); await reviewPanel(page).getByText('缺少刀塔部件工程依据', { exact: true }).waitFor();
    await initialButton(page).click(); await frame(page);
    assert.equal(posts.length, 3);
    assert.equal(new Set(posts.map(post => post.body.request_id)).size, 3);
    assertOnlyScopedPosts(posts, unexpectedWrites, errors);
    observations.push({ case: 'known_not_started_new_request', posts, unexpectedWrites, errors });
  } finally { await context.close(); }
});

test('监督人或非负责人维修人员没有重新生成入口', async () => {
  for (const otherActor of [{ ...actor, role: 'supervisor' }, { ...actor, user_id: 'U-OTHER' }]) {
    const otherFixture = await centerFixture({ actor: otherActor, sample, snapshot: { devices: [] } });
    const { context, page, posts, unexpectedWrites, errors } = await pageFor({ currentFixture: otherFixture });
    try {
      await reviewPanel(page).waitFor(); assert.equal(await initialButton(page).count(), 0);
      assert.equal(posts.length, 0); assertOnlyScopedPosts(posts, unexpectedWrites, errors);
      observations.push({ case: 'no_revalidation_for_other_actor', role: otherActor.role, is_owner: otherActor.user_id === actor.user_id, posts, unexpectedWrites, errors });
    } finally { await context.close(); await otherFixture.close(); }
  }
});

test('旧轮询晚回包不能覆盖已应用的新方案和重新校验结果', async () => {
  let orderReads = 0, lateRoute;
  const { context, page, posts, unexpectedWrites, errors } = await pageFor({
    ordersHandler: route => { if (++orderReads === 1) return respond(route, { items: [baseOrder] }); lateRoute = route; return new Promise(() => {}); },
    revalidateHandler: (route, body) => respond(route, applied(body)),
  });
  try {
    const poll = page.waitForRequest(request => new URL(request.url()).pathname === '/api/workorders');
    await page.clock.runFor(5100); await poll; await frame(page); assert.equal(orderReads, 2);
    await initialButton(page).click(); await page.getByRole('status').filter({ hasText: '仍需实际执行' }).waitFor();
    await respond(lateRoute, { items: [baseOrder] }); await frame(page);
    assert.equal(await initialButton(page).count(), 0);
    assert.equal(await page.locator('.maintenance-sheet').getByRole('checkbox').count(), 0);
    assert.equal((await page.locator('.workorder-detail-page').innerText()).includes(review.findings[0]), false);
    assertOnlyScopedPosts(posts, unexpectedWrites, errors);
    observations.push({ case: 'late_old_list_ignored', posts, new_review_retained: true, unexpectedWrites, errors });
  } finally { await context.close(); }
});

test('真实App离开再进入工单后仍以未知结果的原请求编号核对', async () => {
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const compiled = await build({
    stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'), contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {App} from './App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));` },
    plugins: [{ name: 'revalidation-navigation-actor-fixture', setup(builder) {
      builder.onLoad({ filter: /[\\/]TeamAccess\.jsx$/ }, () => ({ loader: 'jsx', contents: `import React,{useEffect} from 'react';export default function Actor({onActor}){useEffect(()=>{onActor(${JSON.stringify(actor)})},[]);return null;}` }));
    } }],
    bundle: true, write: false, format: 'iife', platform: 'browser', loader: { '.css': 'empty', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' },
  });
  const server = createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': request.url === '/component.js' ? 'application/javascript' : 'text/html;charset=utf-8' });
    response.end(request.url === '/component.js' ? compiled.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script>');
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const appFixture = { browser: fixture.browser, base: `http://127.0.0.1:${server.address().port}` };
  let current;
  try {
    current = await pageFor({ currentFixture: appFixture, fullApp: true,
      revalidateHandler: (route, body, count) => count === 1 ? respond(route, { detail: '隔离未知返回结果' }, 503) : respond(route, applied(body)) });
    const { page, posts, unexpectedWrites, errors } = current;
    await initialButton(page).click();
    await page.getByRole('button', { name: '核对方案更新结果', exact: true }).waitFor();
    const nav = page.getByRole('navigation', { name: '功能导航' });
    await nav.getByRole('button', { name: '智能诊断', exact: true }).click();
    assert.equal(await page.locator('.workorder-page').count(), 0);
    await nav.getByRole('button', { name: '工单系统', exact: true }).click();
    const verify = page.getByRole('button', { name: '核对方案更新结果', exact: true });
    await verify.waitFor(); assert.equal(posts.length, 1); assert.equal(await initialButton(page).count(), 0);
    await verify.click(); await page.getByRole('status').filter({ hasText: '仍需实际执行' }).waitFor();
    assert.equal(posts.length, 2); assert.equal(posts[1].body.request_id, posts[0].body.request_id);
    assertOnlyScopedPosts(posts, unexpectedWrites, errors);
    observations.push({ case: 'unknown_survives_actual_app_navigation', posts, actor_is_fixture_not_credential: true, unexpectedWrites, errors });
  } finally { await current?.context.close(); server.closeAllConnections(); await new Promise(done => server.close(done)); }
});
