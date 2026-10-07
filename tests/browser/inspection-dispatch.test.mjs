import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

let fixture;
const actor = { user_id: 'U-TECH', username: '当前维修人员', role: 'technician', primary_device_id: 'M-1', enabled: 1 };
const sample = { device_id: 'M-1', alarm_code: 'A-1', status: 'alarm' };
const inspection = { plan_id: 'PLAN-CHECK', event_id: 'EVT-1', device_id: 'M-1', alarm_code: 'A-1',
  plan_kind: 'inspection', inspection_required: true, inspection_reason: '需核查报警信号并记录现场读数',
  maintenance_required: false, cad_required: false, workorder_ready: true, validation_findings: [],
  repair_steps: ['核查报警信号并记录读数，不拆卸部件'], tools: [], parts: [], safety: [], evidence: [],
  dispatch: { allowed: false, status: 'waiting_for_personnel', reason: '等待 M-1 对应负责人员登录' } };
before(async () => { fixture = await centerFixture({ actor, sample, snapshot: { devices: [] } }); });
after(async () => { await fixture?.close(); });

async function pageFor(plans, orders = []) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const mutations = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) { mutations.push({ method: request.method(), path: url.pathname }); return route.abort(); }
    if (url.pathname === '/api/maintenance/plans') return respond(route, { items: plans, history: { status: 'ready' }, deleted_plan_ids: [] });
    if (url.pathname === '/api/workorders') return respond(route, { items: orders });
    return respond(route, {});
  });
  return { context, page, mutations, errors };
}

test('检查方案列表与详情明确现场检查范围，人员等待不误显示无需处理', async () => {
  const { context, page, mutations, errors } = await pageFor([inspection]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.locator('.maintenance-plan-list-row').waitFor();
    assert.ok((await page.locator('.maintenance-plan-queue').innerText()).includes('现场检查'));
    const panel = page.locator('.maintenance-plan-panel').filter({ has: page.getByRole('heading', { name: '检查方案', exact: true }) });
    await panel.waitFor();
    const text = await panel.innerText();
    assert.ok(text.includes('核查与记录'));
    assert.ok(text.includes('具体维修另建方案'));
    assert.ok(text.includes(inspection.inspection_reason));
    assert.equal(await panel.getByRole('heading', { name: '检查步骤', exact: true }).count(), 1);
    const status = await page.locator('[aria-label="自动派发条件"]').innerText();
    assert.ok(status.includes('等待负责人员登录'));
    assert.ok(status.includes(inspection.dispatch.reason));
    assert.ok(!text.includes('无需维修'));
    assert.equal(await page.getByText('已自动派单', { exact: true }).count(), 0);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('未就绪旧方案保留原资料失败，只有重新校验入口可请求派工', async () => {
  const old = { ...inspection, workorder_ready: false, validation_findings: ['旧方案缺少目标部件工程资料'],
    dispatch: { allowed: false, reason: '旧方案须重新校验后生成检查方案' }, stop_reason: 'validation_failed' };
  const { context, page, mutations, errors } = await pageFor([old]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.locator('.maintenance-plan-list-row').waitFor();
    const status = await page.locator('[aria-label="自动派发条件"]').innerText();
    assert.ok(status.includes('暂不能自动派发'));
    assert.ok(status.includes('工单就绪：否'));
    assert.ok(status.includes(old.dispatch.reason));
    assert.ok(status.includes(old.validation_findings[0]));
    assert.ok(status.includes(old.stop_reason));
    assert.equal(await page.getByRole('button', { name: '重新校验并自动派工', exact: true }).count(), 1);
    assert.equal(await page.getByText('已自动派单', { exact: true }).count(), 0);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('已派检查工单按保存的方案快照显示类型和真实负责人', async () => {
  const order = { workorder_id: 'WO-CHECK', device_id: 'M-1', alarm_code: 'A-1', assignee: 'U-ASSIGNED',
    assignee_name: '设备负责人员甲', status: 'open', title: '核查报警信号', source: 'agent',
    maintenance_plan_snapshot: inspection, steps: inspection.repair_steps };
  const { context, page, mutations, errors } = await pageFor([inspection], [order]);
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    const item = page.getByRole('button', { name: /WO-CHECK/ });
    await item.waitFor();
    assert.ok((await item.innerText()).includes('现场检查'));
    await item.click();
    const sheet = page.locator('.maintenance-sheet');
    assert.equal(await sheet.getByRole('heading', { name: '检查工单', exact: true }).count(), 1);
    assert.ok((await sheet.innerText()).includes('核查与记录'));
    assert.ok((await sheet.innerText()).includes('具体维修另建方案'));
    assert.equal(await sheet.getByRole('checkbox').count(), 0);
    assert.equal(await sheet.getByRole('button', { name: /复机|关闭工单/ }).count(), 0);
    assert.equal(await sheet.getByRole('button', { name: '确认接单', exact: true }).count(), 1);
    assert.equal(await sheet.getByRole('button', { name: '提交检查记录', exact: true }).count(), 1);
    assert.ok((await page.locator('.workorder-titlebar').innerText()).includes('设备负责人员甲'));
    assert.ok((await sheet.locator('.basic-grid').innerText()).includes('设备负责人员甲'));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('检查单提交真实核查记录使用submit_feedback且保留工单状态，不申请维修复机', async () => {
  const order = { workorder_id: 'WO-CHECK-RECORD', device_id: 'M-1', alarm_code: 'A-1', assignee: 'U-TECH',
    assignee_name: '设备负责人员甲', status: 'in_progress', accepted_by: 'U-TECH', title: '核查报警信号',
    source: 'agent', maintenance_plan_snapshot: inspection, steps: inspection.repair_steps };
  const { context, page, mutations, errors } = await pageFor([inspection], [order]);
  const writes = [];
  try {
    await page.route('**/api/workorders/WO-CHECK-RECORD/action', route => {
      writes.push({ method: route.request().method(), body: route.request().postDataJSON() });
      return respond(route, { workorder: { ...order, repair_feedback: route.request().postDataJSON().repair_feedback } });
    });
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByRole('button', { name: /WO-CHECK-RECORD/ }).click();
    await page.getByLabel('处理说明', { exact: true }).fill('已核查接线与报警信号，记录压力读数；未拆卸部件。');
    await page.getByRole('button', { name: '提交检查记录', exact: true }).click();
    await page.getByRole('status').filter({ hasText: '检查记录已保存' }).waitFor();
    assert.deepEqual(writes, [{ method: 'POST', body: { action: 'submit_feedback', status: 'in_progress',
      repair_feedback: { feedback: '已核查接线与报警信号，记录压力读数；未拆卸部件。' } } }]);
    assert.equal(await page.getByRole('button', { name: /复机|关闭工单/ }).count(), 0);
    assert.equal(await page.locator('.maintenance-sheet .sheet-status').innerText(), '处理中');
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('旧维修工单保留原维修确认与复机动作', async () => {
  const order = { workorder_id: 'WO-REPAIR', device_id: 'M-1', alarm_code: 'A-1', assignee: 'U-TECH',
    assignee_name: '维修人员甲', status: 'open', title: '设备维修', source: 'agent', steps: ['更换故障部件'] };
  const { context, page, mutations, errors } = await pageFor([], [order]);
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByRole('button', { name: /WO-REPAIR/ }).click();
    const sheet = page.locator('.maintenance-sheet');
    assert.equal(await sheet.getByRole('heading', { name: '维修工单', exact: true }).count(), 1);
    assert.equal(await sheet.getByRole('checkbox').count(), 1);
    assert.equal(await sheet.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).count(), 1);
    assert.equal(await sheet.getByRole('button', { name: '提交检查记录', exact: true }).count(), 0);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('没有明确检查类型的旧维修记录仍显示设备维修与原就绪失败', async () => {
  const legacy = { ...inspection, plan_id: 'PLAN-OLD', plan_kind: undefined, inspection_required: undefined,
    inspection_reason: undefined, maintenance_required: false, workorder_ready: false,
    validation_findings: ['缺少维修 BOM'], dispatch: { allowed: false, reason: '维修方案校验未通过' } };
  const { context, page, mutations, errors } = await pageFor([legacy]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.locator('.maintenance-plan-list-row').waitFor();
    assert.ok((await page.locator('.maintenance-plan-queue').innerText()).includes('设备维修'));
    assert.equal(await page.getByRole('heading', { name: '检查方案', exact: true }).count(), 0);
    assert.equal(await page.getByRole('heading', { name: '维修步骤', exact: true }).count(), 1);
    assert.ok((await page.locator('[aria-label="自动派发条件"]').innerText()).includes('缺少维修 BOM'));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
