import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

let fixture;
const actor = { user_id: 'U-LMY', username: 'lmy', role: 'technician' };
const sample = { device_id: 'D-1', alarm_code: '700006', status: 'alarm' };
const review = { required: true, findings: ['刀塔旋转超时报警使用了门互锁模板', '维修步骤未对应当前刀塔故障'] };
const order = { workorder_id: 'WO-REVIEW', device_id: 'D-1', alarm_code: '700006', plan_id: 'PLAN-REVIEW',
  status: 'in_progress', assignee: actor.user_id, assignee_name: 'lmy', accepted_by: actor.user_id,
  title: '刀塔故障维修', execution_review: review, maintenance_plan_snapshot: { plan_id: 'PLAN-REVIEW', plan_kind: 'repair' } };
const plan = { plan_id: 'PLAN-REVIEW', device_id: 'D-1', alarm_code: '700006', workorder_ready: true,
  repair_steps: ['旧模板步骤'], validation_findings: [], execution_review: review,
  dispatch: { status: 'dispatched', allowed: false, workorder_id: order.workorder_id, assignee: actor.user_id,
    assignee_name: 'lmy', device_id: 'D-1', reason: '旧方案不可直接执行，需重新校验' } };
before(async () => { fixture = await centerFixture({ actor, sample, snapshot: { devices: [] } }); });
after(async () => { await fixture?.close(); });

async function pageFor(currentOrder = order, includeOrder = true) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    if (!['GET', 'HEAD'].includes(route.request().method())) { writes.push(route.request().method()); return route.abort(); }
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/maintenance/plans') return respond(route, { items: [plan], history: { status: 'ready' }, deleted_plan_ids: [] });
    if (path === '/api/workorders') return respond(route, { items: includeOrder ? [currentOrder] : [] });
    return respond(route, {});
  });
  return { context, page, writes, errors };
}

test('已派单事实与方案需重新校验同时显示，关联工单不隐藏原因', async () => {
  for (const hasOrder of [false, true]) {
    const { context, page, writes, errors } = await pageFor(order, hasOrder);
    try {
      await page.goto(`${fixture.base}/?view=maintenance`);
      await page.locator('.maintenance-plan-list-row').waitFor();
      const status = await page.locator('[aria-label="自动派发条件"]').innerText();
      assert.ok(status.includes(hasOrder ? '已关联工单' : '已自动派单'));
      assert.ok(status.includes('方案需重新校验'));
      assert.ok(status.includes('lmy'));
      assert.ok(status.includes(plan.dispatch.reason));
      for (const finding of review.findings) {
        assert.ok(status.includes(finding));
        assert.ok((await page.locator('.maintenance-plan-queue').innerText()).includes(finding));
      }
      assert.deepEqual(writes, []);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});

test('需复核维修单保留审计与记录入口，填写实际结果后可申请服务端核验', async () => {
  const { context, page, writes, errors } = await pageFor();
  const submitted = [];
  try {
    await page.route('**/api/workorders/WO-REVIEW/action', route => {
      submitted.push(route.request().postDataJSON());
      return respond(route, { workorder: { ...order, repair_feedback: route.request().postDataJSON().repair_feedback } });
    });
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.locator('.workorder-titlebar').waitFor();
    const detail = await page.locator('.workorder-detail-page').innerText();
    assert.ok(detail.includes('方案需重新校验'));
    for (const finding of review.findings) assert.ok(detail.includes(finding));
    assert.equal(await page.getByRole('checkbox').count(), 0);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), true);
    await page.getByLabel('处理说明', { exact: true }).fill('已记录现场刀塔报警；等待重新校验方案。');
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    await page.getByRole('button', { name: '提交处理记录', exact: true }).click();
    await page.getByRole('status').filter({ hasText: '处理记录已保存' }).waitFor();
    assert.deepEqual(submitted, [{ action: 'submit_feedback', status: 'in_progress', repair_feedback: {
      feedback: '已记录现场刀塔报警；等待重新校验方案。' } }]);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('旧完成记录无可信维修确认时不能直接关闭，但可提交实际结果重新申请核验', async () => {
  const { context, page, writes, errors } = await pageFor({ ...order, status: 'completed',
    maintenance_confirmed_by: actor.user_id, execution_review: { ...review, human_confirmed: false },
    repair_verification: { phase: 'poststart', passed: true } });
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.locator('.workorder-titlebar').waitFor();
    assert.equal(await page.getByRole('button', { name: '关闭工单并生成总结', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: '再次确认并申请复机', exact: true }).isDisabled(), true);
    await page.getByLabel('处理说明', { exact: true }).fill('已按现场核查结果处理，请重新读回设备恢复数据。');
    assert.equal(await page.getByRole('button', { name: '再次确认并申请复机', exact: true }).isDisabled(), false);
    assert.equal(await page.getByRole('button', { name: '关闭工单并生成总结', exact: true }).isDisabled(), true);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('服务端可信维修确认与运行复核通过后可关闭，原方案问题仍保留为审计', async () => {
  const { context, page, writes, errors } = await pageFor({ ...order, status: 'completed',
    maintenance_confirmed_by: actor.user_id, execution_review: { ...review, human_confirmed: true },
    repair_verification: { phase: 'poststart', passed: true } });
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.locator('.workorder-titlebar').waitFor();
    const panel = page.getByRole('region', { name: '方案执行复核', exact: true });
    assert.ok((await panel.innerText()).includes(review.findings[0]));
    assert.equal(await page.getByRole('button', { name: '关闭工单并生成总结', exact: true }).isDisabled(), false);
    await page.getByLabel('处理说明', { exact: true }).fill('已有真实确认和运行复核，不再重复申请。');
    assert.equal(await page.getByRole('button', { name: '再次确认并申请复机', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('checkbox').count(), 0);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('保存记录回包省略execution_review展示字段时不能抹掉已知复核审计', async () => {
  const { context, page, writes, errors } = await pageFor();
  try {
    await page.route('**/api/workorders/WO-REVIEW/action', route => {
      const { execution_review, ...storedOrder } = order;
      assert.equal(route.request().postDataJSON().action, 'submit_feedback');
      return respond(route, { workorder: { ...storedOrder, repair_feedback: route.request().postDataJSON().repair_feedback } });
    });
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.locator('.workorder-titlebar').waitFor();
    await page.getByLabel('处理说明', { exact: true }).fill('已记录现场异常，等待重校验。');
    await page.getByRole('button', { name: '提交处理记录', exact: true }).click();
    await page.getByRole('status').filter({ hasText: '处理记录已保存' }).waitFor();
    assert.ok((await page.locator('.workorder-detail-page').innerText()).includes('方案需重新校验'));
    assert.equal(await page.getByRole('checkbox').count(), 0);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('服务端明确解除复核后恢复正常维修操作', async () => {
  const { context, page, writes, errors } = await pageFor();
  try {
    await page.route('**/api/workorders/WO-REVIEW/action', route => respond(route, { workorder: {
      ...order, execution_review: { required: false, findings: [] }, repair_feedback: route.request().postDataJSON().repair_feedback,
    } }));
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.locator('.workorder-titlebar').waitFor();
    await page.getByLabel('处理说明', { exact: true }).fill('服务端已完成方案重新校验。');
    await page.getByRole('button', { name: '提交处理记录', exact: true }).click();
    await page.getByRole('button', { name: '提交处理记录', exact: true }).waitFor({ state: 'detached' });
    assert.equal((await page.locator('.workorder-detail-page').innerText()).includes('方案需重新校验'), false);
    assert.equal(await page.getByRole('checkbox').count(), 0);
    assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isDisabled(), false);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
