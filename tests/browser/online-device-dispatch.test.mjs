import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

let fixture;
const actor = { user_id: 'U-VIEWER', username: '当前查看人', role: 'technician', primary_device_id: 'M-OTHER', enabled: 1 };
const sample = { device_id: 'M-1', alarm_code: 'A-1', status: 'alarm' };
const basePlan = { plan_id: 'PLAN-1', event_id: 'EVT-1', device_id: 'M-1', alarm_code: 'A-1', workorder_ready: true,
  validation_findings: [], repair_steps: ['读取维修步骤'], tools: [], parts: [], safety: [], evidence: [], created_at: '2026-10-07T00:00:00Z' };
const waiting = { ...basePlan, dispatch: { allowed: false, status: 'waiting_for_personnel', reason: '等待 M-1 对应维修人员登录' } };
const assigned = { ...basePlan, dispatch: { allowed: true, status: 'dispatched', assignee: 'U-ASSIGNED', assignee_name: '维修人员甲', device_id: 'M-1', reason: '按有效登录与负责设备匹配' } };
before(async () => { fixture = await centerFixture({ actor, sample, snapshot: { device_id: 'M-1', devices: [], diagnosis: { pipeline_by_device: { 'M-1': { event: { device_id: 'M-1', alarm_code: 'A-1', event_id: 'EVT-1' }, maintenance_plan: waiting } } } } }); });
after(async () => { await fixture?.close(); });

async function pageFor(plan, orders = []) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const mutations = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    if (!['GET', 'HEAD'].includes(route.request().method())) { mutations.push({ method: route.request().method(), path: url.pathname }); return route.abort(); }
    if (url.pathname === '/api/maintenance/plans') return respond(route, { items: [plan], history: { status: 'ready' }, deleted_plan_ids: [] });
    if (url.pathname === '/api/workorders') return respond(route, { items: orders });
    return respond(route, {});
  });
  return { context, page, mutations, errors };
}

test('维修方案列表与详情明确等待对应设备人员登录，当前查看人不会成为负责人', async () => {
  const { context, page, mutations, errors } = await pageFor(waiting);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.getByText('等待负责人员登录', { exact: true }).first().waitFor();
    assert.ok((await page.locator('.maintenance-plan-queue').innerText()).includes(waiting.dispatch.reason));
    assert.ok((await page.locator('[aria-label="自动派发条件"]').innerText()).includes(waiting.dispatch.reason));
    assert.equal(await page.getByText('当前查看人', { exact: true }).count(), 0);
    assert.equal(await page.getByText('已自动派单', { exact: true }).count(), 0);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('真实已派单方案显示服务端负责人姓名及对应设备', async () => {
  const { context, page, mutations, errors } = await pageFor(assigned);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.getByText('已自动派单', { exact: true }).first().waitFor();
    const text = await page.locator('[aria-label="自动派发条件"]').innerText();
    assert.ok(text.includes('维修负责人：维修人员甲'));
    assert.ok(text.includes('对应设备：M-1'));
    assert.ok(text.includes(assigned.dispatch.reason));
    assert.ok(!text.includes('当前查看人'));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('方案自动轮询从人员等待变为真实已派单且不发送派单写请求', async () => {
  const { context, page, mutations, errors } = await pageFor(waiting);
  let current = waiting, reads = 0;
  try {
    await page.clock.install();
    await page.route('**/api/maintenance/plans', route => { reads++; return respond(route, { items: [current], history: { status: 'ready' }, deleted_plan_ids: [] }); });
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.getByText('等待负责人员登录', { exact: true }).first().waitFor();
    current = assigned;
    await page.clock.runFor(5000);
    await page.getByText('已自动派单', { exact: true }).first().waitFor();
    assert.equal(reads, 2);
    assert.ok((await page.locator('[aria-label="自动派发条件"]').innerText()).includes('维修负责人：维修人员甲'));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('工单空队列沿用人员等待原因', async () => {
  const { context, page, mutations, errors } = await pageFor(waiting);
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByText('等待负责人员登录', { exact: true }).first().waitFor();
    assert.ok((await page.locator('[aria-label="自动派发条件"]').innerText()).includes(waiting.dispatch.reason));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('真实工单标题和执行表显示服务端负责人姓名', async () => {
  const orders = [{ workorder_id: 'WO-1', device_id: 'M-1', alarm_code: 'A-1', assignee: 'U-ASSIGNED', assignee_name: '维修人员甲', status: 'open', title: '真实维修工单', steps: ['维修步骤'] }];
  const { context, page, mutations, errors } = await pageFor(assigned, orders);
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByRole('button', { name: /WO-1/ }).click();
    const title = await page.locator('.workorder-titlebar').innerText();
    assert.ok(title.includes('维修人员甲'));
    assert.ok(!title.includes('U-ASSIGNED'));
    assert.ok((await page.locator('.basic-grid').innerText()).includes('维修负责人'));
    assert.ok((await page.locator('.basic-grid').innerText()).includes('维修人员甲'));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('对应人员的等待状态不会遮盖资料门禁或明确审批要求', async () => {
  for (const plan of [
    { ...waiting, workorder_ready: false, validation_findings: ['缺少真实维修依据'], dispatch: { ...waiting.dispatch, reason: '维修依据未通过' } },
    { ...basePlan, dispatch: { allowed: false, status: 'waiting_approval', reason: '显式要求人工审批' } },
  ]) {
    const { context, page, mutations, errors } = await pageFor(plan);
    try {
      await page.goto(`${fixture.base}/?view=maintenance`);
      await page.locator('.maintenance-plan-list-row').waitFor();
      const text = await page.locator('[aria-label="自动派发条件"]').innerText();
      assert.ok(text.includes(plan.dispatch.reason));
      assert.ok(!text.includes('等待负责人员登录'));
      assert.ok(!text.includes('已自动派单'));
      assert.ok(text.includes(plan.workorder_ready ? '等待审批后派发' : '暂不能自动派发'));
      assert.deepEqual(mutations, []);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
