import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { centerFixture, deferred, respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = resolve(root, '.runtime/verification/workorder-simple-completion-20261007');
const actor = { user_id: 'U-OWNER', username: '维修人员甲', role: 'technician' };
const sample = { device_id: 'D-1', alarm_code: '700006', status: 'alarm' };
const order = {
  workorder_id: 'WO-SIMPLE', device_id: sample.device_id, alarm_code: '',
  title: '刀塔故障维修', status: 'in_progress', assignee: actor.user_id,
  assignee_name: actor.username, accepted_by: actor.user_id,
  diagnosis_snapshot: { device_id: sample.device_id, raw: { alarm_code: sample.alarm_code } },
  execution_review: { required: false, findings: [] },
  maintenance_plan_snapshot: { plan_id: 'PLAN-SIMPLE', plan_kind: 'repair', repair_steps: ['核查刀塔并记录复测结果'] },
};
const feedback = '已按方案处理刀塔异常，现场复测结果已记录。';
const observations = [];
let fixture, supervisorFixture, sourceHash;

before(async () => {
  sourceHash = createHash('sha256').update(await readFile(resolve(root, 'frontend/monitor-react/src/app/App.jsx'))).digest('hex');
  fixture = await centerFixture({ actor, sample, snapshot: { devices: [] } });
  supervisorFixture = await centerFixture({ actor: { user_id: 'U-SUP', username: '监督人', role: 'supervisor' }, sample, snapshot: { devices: [] } });
});
after(async () => {
  await fixture?.close(); await supervisorFixture?.close();
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'frontend-simple-completion-observations.json'), JSON.stringify({
    app_sha256: sourceHash, actual_component: 'WorkorderView', api_mocked: true, real_business_writes: 0, observations,
  }, null, 2));
});

const completeButton = page => page.getByRole('button', { name: '确认维修完成并申请复机', exact: true });
const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
async function pageFor({ currentFixture = fixture, currentOrder = order, actionHandler, lineStatus } = {}) {
  const context = await currentFixture.browser.newContext(), page = await context.newPage();
  page.setDefaultTimeout(2500); await page.clock.install();
  const posts = [], unexpectedWrites = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (request.method() === 'POST' && path === `/api/workorders/${order.workorder_id}/action`) {
      const body = request.postDataJSON(); posts.push(body);
      return actionHandler?.(route, body) ?? respond(route, { workorder: { ...currentOrder, status: 'completed',
        repair_feedback: body.repair_feedback, repair_verification: { phase: 'prestart', passed: false } } });
    }
    if (!['GET', 'HEAD'].includes(request.method())) {
      unexpectedWrites.push({ path, method: request.method() }); return route.abort();
    }
    if (path === '/api/workorders') return respond(route, { items: [currentOrder] });
    if (path === '/api/team/line' && lineStatus) return respond(route, lineStatus);
    return respond(route, { items: [] });
  });
  await page.goto(`${currentFixture.base}/?view=workorder`);
  await page.locator('.workorder-titlebar').waitFor();
  return { context, page, posts, unexpectedWrites, errors };
}
function assertClean(result) {
  assert.deepEqual(result.unexpectedWrites, []);
  assert.deepEqual(result.errors, []);
}
function assertActualFeedbackOnly(posts) {
  assert.deepEqual(posts, [{ action: 'mark_repair_completed', status: 'completed', repair_feedback: { feedback } }]);
}

test('本人有效维修单填写处理说明后直接一击申请复机，只发送实际反馈', async () => {
  const result = await pageFor();
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(`  ${feedback}  `);
    assert.equal(await completeButton(result.page).isDisabled(), false, '实际处理说明已填写，应可直接提交，无需额外勾选');
    assert.equal(await result.page.locator('.maintenance-sheet').getByRole('checkbox').count(), 0);
    await completeButton(result.page).click();
    await result.page.getByRole('button', { name: '再次确认并申请复机', exact: true }).waitFor();
    assertActualFeedbackOnly(result.posts); assertClean(result);
    observations.push({ case: 'direct_completion', posts: result.posts, checkbox_count: 0, errors: result.errors });
  } finally { await result.context.close(); }
});

test('空白不能提交，填写后清空或改为纯空白均恢复不可提交', async () => {
  const result = await pageFor();
  try {
    const field = result.page.getByLabel('处理说明', { exact: true });
    assert.equal(await completeButton(result.page).isDisabled(), true);
    await field.fill(' \n\t '); assert.equal(await completeButton(result.page).isDisabled(), true);
    await field.fill(feedback); assert.equal(await completeButton(result.page).isDisabled(), false);
    await field.fill(''); assert.equal(await completeButton(result.page).isDisabled(), true);
    await field.fill(feedback); assert.equal(await completeButton(result.page).isDisabled(), false);
    await field.fill(' \n '); assert.equal(await completeButton(result.page).isDisabled(), true);
    await completeButton(result.page).evaluate(button => button.click()); await frame(result.page);
    assert.deepEqual(result.posts, []); assertClean(result);
    observations.push({ case: 'empty_and_cleared', posts: result.posts, errors: result.errors });
  } finally { await result.context.close(); }
});

test('旧模板要求复核仍展示审计，但本人可直接提交实际维修说明申请现场核验', async () => {
  const currentOrder = { ...order, execution_review: { required: true, findings: ['刀塔故障错误引用安全门模板'] } };
  const result = await pageFor({ currentOrder });
  try {
    const panel = result.page.getByRole('region', { name: '方案执行复核', exact: true });
    await panel.waitFor(); assert.ok((await panel.innerText()).includes(currentOrder.execution_review.findings[0]));
    assert.equal(await result.page.getByRole('button', { name: '重新生成并校验方案', exact: true }).count(), 1);
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    assert.equal(await completeButton(result.page).isDisabled(), false, '旧方案审计不能阻止本人提交真实结果；实际复机仍由服务端核验');
    assert.equal(await result.page.locator('.maintenance-sheet').getByRole('checkbox').count(), 0);
    await completeButton(result.page).click();
    await result.page.getByRole('button', { name: '再次确认并申请复机', exact: true }).waitFor();
    assertActualFeedbackOnly(result.posts); assertClean(result);
    assert.ok((await panel.innerText()).includes(currentOrder.execution_review.findings[0]));
    observations.push({ case: 'review_audit_manual_completion', posts: result.posts, old_findings_retained: true, errors: result.errors });
  } finally { await result.context.close(); }
});

test('维修申请在途禁用按钮，重复点击不能新增写请求', async () => {
  const pending = deferred(), started = deferred();
  const result = await pageFor({ actionHandler: async (route, body) => {
    started.resolve(); await pending.promise;
    return respond(route, { workorder: { ...order, status: 'completed', repair_feedback: body.repair_feedback } });
  } });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    assert.equal(await completeButton(result.page).isDisabled(), false);
    await completeButton(result.page).click(); await started.promise; await frame(result.page);
    assert.equal(await completeButton(result.page).isDisabled(), true);
    await completeButton(result.page).evaluate(button => { button.click(); button.click(); });
    await frame(result.page); assertActualFeedbackOnly(result.posts);
    pending.resolve();
    await result.page.getByRole('button', { name: '再次确认并申请复机', exact: true }).waitFor();
    assertClean(result); observations.push({ case: 'pending_double_click', request_count: result.posts.length, errors: result.errors });
  } finally { pending.resolve(); await result.context.close(); }
});

test('监督人只读，不能填写或提交维修申请', async () => {
  const result = await pageFor({ currentFixture: supervisorFixture });
  try {
    assert.equal(await result.page.getByLabel('处理说明', { exact: true }).isDisabled(), true);
    assert.equal(await completeButton(result.page).isDisabled(), true);
    await completeButton(result.page).evaluate(button => button.click()); await frame(result.page);
    assert.deepEqual(result.posts, []); assertClean(result);
    observations.push({ case: 'supervisor_readonly', posts: result.posts, errors: result.errors });
  } finally { await result.context.close(); }
});

test('维修完成已落库但复机控制未启用，显示已完成及明确复机结果，轮询后保留', async () => {
  const currentOrder = structuredClone(order);
  const result = await pageFor({ currentOrder, actionHandler: (route, body) => {
    Object.assign(currentOrder, { status: 'completed', repair_feedback: body.repair_feedback,
      repair_verification: { phase: 'prestart', passed: true } });
    return respond(route, { workorder: currentOrder, machine_control: { state: 'blocked', reason: '自动复机控制未启用', workorder_ids: ['WO-OLDER-1', 'WO-OLDER-2'] } });
  } });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    await completeButton(result.page).click();
    await result.page.getByText('维修已完成，复机申请未通过：自动复机控制未启用', { exact: true }).waitFor();
    assert.equal(await result.page.locator('.workorder-status-badge').innerText(), '已完成');
    assert.equal(await result.page.locator('.machine-control-blockers').innerText(), '需先处理的故障工单：WO-OLDER-1、WO-OLDER-2');
    await result.page.clock.runFor(5100); await frame(result.page);
    assert.equal(await result.page.locator('.workorder-status-badge').innerText(), '已完成');
    assert.match(await result.page.locator('.machine-control-result').innerText(), /维修已完成，复机申请未通过/);
    assertActualFeedbackOnly(result.posts); assertClean(result);
  } finally { await result.context.close(); }
});

test('设备报警未解除则明确提示维修确认未通过，不虚报完成，轮询后保留原因', async () => {
  const result = await pageFor({ actionHandler: route => respond(route, {
    workorder: order, machine_control: { state: 'blocked', reason: '报警尚未解除', checks: { alarms_clear: false } },
  }) });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    await completeButton(result.page).click();
    await result.page.getByText('维修确认未通过：报警尚未解除', { exact: true }).waitFor();
    await result.page.clock.runFor(5100); await frame(result.page);
    assert.equal(await result.page.locator('.workorder-status-badge').innerText(), '处理中');
    assert.match(await result.page.locator('.machine-control-result').innerText(), /维修确认未通过：报警尚未解除/);
    assertActualFeedbackOnly(result.posts); assertClean(result);
  } finally { await result.context.close(); }
});

test('没有关联工单的旧故障显示设备报警与事件，不提示用户寻找不存在的工单', async () => {
  const result = await pageFor({ actionHandler: route => respond(route, {
    workorder: { ...order, status: 'completed', repair_verification: { phase: 'prestart', passed: true } },
    machine_control: { state: 'blocked', reason: '仍有历史故障没有关联工单，需要确认处理结果并核验设备',
      workorder_ids: [], fault_blockers: [{ event_id: 'EVT-OLDER', device_id: 'D-1', alarm_code: '700015',
        kind: 'missing_workorder', workorder_ids: [] }] },
  }) });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    await completeButton(result.page).click();
    const details = result.page.getByRole('region', { name: '复机阻挡记录', exact: true });
    await details.waitFor();
    assert.match(await details.innerText(), /D-1.*700015/);
    assert.match(await details.innerText(), /EVT-OLDER/);
    assert.match(await details.innerText(), /没有关联工单/);
    assert.equal(await result.page.locator('.machine-control-blockers').count(), 0);
    assertActualFeedbackOnly(result.posts); assertClean(result);
  } finally { await result.context.close(); }
});

test('后台启动后核验更新到达时自动移除旧拒绝提示，无需刷新网页', async () => {
  const currentOrder = structuredClone(order);
  const lineStatus = {state:'stopped'};
  const result = await pageFor({ currentOrder, lineStatus, actionHandler: route => {
    Object.assign(currentOrder, { status: 'completed', repair_verification: { phase: 'prestart', passed: true } });
    return respond(route, { workorder: currentOrder, machine_control: { state: 'blocked', reason: '还有未确认完成的故障工单' } });
  } });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    await completeButton(result.page).click();
    await result.page.getByText('维修已完成，复机申请未通过：还有未确认完成的故障工单', { exact: true }).waitFor();
    Object.assign(currentOrder, { repair_verification: { phase: 'poststart', passed: true } });
    lineStatus.state = 'running';
    await result.page.clock.runFor(2100); await frame(result.page);
    assert.equal(await result.page.locator('.machine-control-result.is-error').count(), 0);
    assert.equal(await result.page.locator('.machine-control-result.is-ok').count(), 1);
    assert.equal(await result.page.getByRole('button', { name: '关闭工单并生成总结', exact: true }).count(), 1);
    assertActualFeedbackOnly(result.posts); assertClean(result);
  } finally { await result.context.close(); }
});

test('仅工单列表返回权威复机结果就能替换旧提示，无需整线请求成功或再次提交', async () => {
  const currentOrder = structuredClone(order);
  const result = await pageFor({ currentOrder, actionHandler: route => {
    Object.assign(currentOrder, { status: 'completed', repair_verification: { phase: 'prestart', passed: true } });
    return respond(route, { workorder: currentOrder,
      machine_control: { state: 'blocked', reason: '还有未确认完成的故障工单' } });
  } });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    await completeButton(result.page).click();
    await result.page.getByText('维修已完成，复机申请未通过：还有未确认完成的故障工单', { exact: true }).waitFor();
    Object.assign(currentOrder, { status: 'closed', repair_verification: { phase: 'poststart', passed: true },
      machine_control: { state: 'running', source: 'persisted_line_restart', generation: 20, cycle_id: 'CYCLE-VERIFIED' } });
    await result.page.clock.runFor(2100); await frame(result.page);
    assert.equal(await result.page.locator('.machine-control-result.is-error').count(), 0);
    assert.equal(await result.page.locator('.machine-control-result.is-ok').count(), 1);
    assert.equal(await result.page.locator('.workorder-status-badge').innerText(), '已关闭');
    assertActualFeedbackOnly(result.posts); assertClean(result);
  } finally { await result.context.close(); }
});

test('仅返回控制拒绝而没有工单记录时，不静默成功，轮询后仍显示失败原因', async () => {
  const result = await pageFor({ actionHandler: route => respond(route, {
    machine_control: { state: 'blocked', reason: '虚拟控制模式未启用' },
  }) });
  try {
    await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
    await completeButton(result.page).click();
    await result.page.locator('.maintenance-sheet .inline-error').filter({ hasText: '虚拟控制模式未启用' }).waitFor();
    await result.page.clock.runFor(5100); await frame(result.page);
    assert.equal(await result.page.locator('.workorder-status-badge').innerText(), '处理中');
    assert.match(await result.page.locator('.maintenance-sheet .inline-error').innerText(), /虚拟控制模式未启用/);
    assertActualFeedbackOnly(result.posts); assertClean(result);
  } finally { await result.context.close(); }
});

for (const changed of [{ workorder_id: 'WO-OTHER' }, { device_id: 'D-OTHER' }, { assignee: 'U-OTHER' }]) {
  test(`工单动作回包身份不匹配时保留原单并提示未确认：${Object.keys(changed)[0]}`, async () => {
    const result = await pageFor({ actionHandler: route => respond(route, { workorder: { ...order, ...changed, status: 'completed' } }) });
    try {
      await result.page.getByLabel('处理说明', { exact: true }).fill(feedback);
      await completeButton(result.page).click();
      await result.page.locator('.maintenance-sheet .inline-error').filter({ hasText: '工单操作结果未确认' }).waitFor();
      assert.equal(await result.page.locator('.workorder-status-badge').innerText(), '处理中');
      assertActualFeedbackOnly(result.posts); assertClean(result);
    } finally { await result.context.close(); }
  });
}
