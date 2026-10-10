import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

const actor = { user_id: 'U-OPERATOR-TEST', username: '维修人员甲', role: 'technician' };
const sample = { device_id: 'D-OPERATOR-TEST', alarm_code: '700015', status: 'alarm' };
const internalDetails = [
  '历史趋势：barfeed_ready_signal falling，最新值=0.0',
  'Monitor 已提供实时快照', '停止原因：validator_pass', 'EXP-B39D8CB379',
  'three_equipment_fault_code_catalog.pdf', 'multi_device_repair_sop.pdf',
  'CAD/BOM 工程证据校验未通过：insufficient_engineering_data',
];
const diagnosis = { ...sample, event_id: 'E-OPERATOR-TEST', status: 'completed', confidence: 0.92,
  summary: '送料机就绪信号异常', cause: '送料机未就绪，需要现场确认',
  recommendation: '检查棒料余量及送料机状态', evidence: internalDetails };
const plan = { ...sample, event_id: diagnosis.event_id, plan_id: 'PLAN-OPERATOR-TEST', plan_kind: 'repair',
  diagnosis, repair_steps: ['检查棒料余量', '记录现场处理结果'], tools: ['检查手电'],
  safety: ['检查前确认设备已停止'], evidence: [...internalDetails, ...internalDetails],
  workorder_ready: false, validation_findings: internalDetails,
  stop_reason: 'replan_limit_exceeded', dispatch: { allowed: false, reason: internalDetails.join('；') } };
const order = { ...sample, event_id: diagnosis.event_id, workorder_id: 'WO-OPERATOR-TEST', plan_id: plan.plan_id,
  assignee: actor.user_id, assignee_name: actor.username, status: 'in_progress', accepted_by: actor.user_id,
  title: '送料机故障处理', diagnosis_snapshot: diagnosis, maintenance_plan_snapshot: plan,
  dispatch_mode: 'fault_followup', steps: ['记录送料机实际状态'], dispatch_findings: internalDetails,
  execution_review: { required: true, findings: internalDetails } };
let fixture;
before(async () => { fixture = await centerFixture({ actor, sample, snapshot: { devices: [], device_id: sample.device_id,
  diagnosis: { latest: diagnosis, pipeline: { status: 'blocked', stop_reason: plan.stop_reason } } } }); });
after(async () => { await fixture?.close(); });

async function pageFor(t, view, currentPlan = plan) {
  const context = await fixture.browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage(); page.setDefaultTimeout(3000);
  const writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') { writes.push(path); return route.abort(); }
    if (path === '/api/maintenance/plans') return respond(route, { items: [currentPlan], deleted_plan_ids: [], history: { status: 'ready' } });
    if (path === '/api/workorders') return respond(route, { items: view === 'workorder' ? [order] : [] });
    if (path === '/api/reports') return respond(route, { items: [{ report_id: 'R-OPERATOR-TEST',
      title: '设备故障处理报告', status: 'incomplete', validation_findings: internalDetails,
      article_text: '本次送料机故障由维修人员现场处理。设备状态及后续运行情况已记录。' }] });
    if (path === '/api/runs') return respond(route, { runs: [{ run_id: 'fault:E-OPERATOR-TEST', run_type: 'fault',
      label: '送料机故障闭环', status: 'completed', trace_id: 'TRACE-OPERATOR-TEST',
      trace_ids: ['TRACE-OPERATOR-TEST'], task_ids: ['TASK-OPERATOR-TEST'], event_count: 1, phases: [] }] });
    if (path === '/api/trace') return respond(route, { trace: [{ type: 'agent', event: 'agent_completed', name: 'maintenance',
      agent: 'maintenance', agent_run_id: 'AGENT-OPERATOR-TEST', trace_id: 'TRACE-OPERATOR-TEST',
      task_id: 'TASK-OPERATOR-TEST', output: { evidence: internalDetails, stop_reason: 'validator_pass' } }] });
    return respond(route, { items: [] });
  });
  await page.goto(`${fixture.base}/?view=${view}`);
  return { page, writes, errors };
}

async function assertBusinessOnly(page) {
  const body = await page.locator('body').innerText();
  for (const item of internalDetails) assert.ok(!body.includes(item), `内部明细不应展示：${item}`);
  assert.doesNotMatch(body, /Evidence|维修证据|检查依据|诊断依据|replan_limit_exceeded/);
}

test('维修与检查方案隐藏证据和校验回执，保留真实步骤、工具及派发状态', async t => {
  for (const planKind of ['repair', 'inspection']) {
    const { page, writes, errors } = await pageFor(t, 'maintenance', { ...plan, plan_kind: planKind });
    await page.locator('.maintenance-plan-list-row').waitFor();
    await page.getByRole('heading', { name: planKind === 'repair' ? '维修步骤' : '检查步骤', exact: true }).waitFor();
    await assertBusinessOnly(page);
    const body = await page.locator('body').innerText();
    assert.match(body, /检查棒料余量/); assert.match(body, /检查手电/); assert.match(body, /检查前确认设备已停止/);
    assert.match(body, /暂不能自动派发/);
    assert.equal(await page.getByRole('button', { name: '重新校验并自动派工', exact: true }).isEnabled(), true);
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  }
});

test('智能诊断保留结论、处置建议及未派发事实，隐藏原始依据及引擎术语', async t => {
  const { page, writes, errors } = await pageFor(t, 'diagnosis');
  await page.getByRole('heading', { name: '当前判断', exact: true }).waitFor();
  await assertBusinessOnly(page);
  const body = await page.locator('body').innerText();
  assert.match(body, /送料机就绪信号异常/); assert.match(body, /检查棒料余量及送料机状态/);
  assert.match(body, /未完成自动派工/); assert.match(body, /92%/);
  assert.doesNotMatch(body, /Evaluator|Runtime|重试达到上限|门禁/);
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
});

test('工单保留处理范围及提交反馈功能，隐藏方案校验和派发明细', async t => {
  const { page, writes, errors } = await pageFor(t, 'workorder');
  await page.locator('.workorder-titlebar').waitFor();
  await assertBusinessOnly(page);
  assert.match(await page.locator('body').innerText(), /记录送料机实际状态/);
  await page.getByLabel('处理说明', { exact: true }).fill('已处理完成');
  assert.equal(await page.getByRole('button', { name: '确认维修完成并申请复机', exact: true }).isEnabled(), true);
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
});

test('方案更新未通过时只显示业务结果，不展示返回的校验明细', async t => {
  const { page, writes, errors } = await pageFor(t, 'workorder');
  await page.route('**/api/workorders/WO-OPERATOR-TEST/revalidate-plan', route => respond(route, {
    request_id: route.request().postDataJSON().request_id, status: 'blocked', workorder: order,
    message: internalDetails.join('；'), validation_findings: internalDetails,
  }));
  await page.getByRole('button', { name: '重新生成并校验方案', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '原工单与原方案保留' }).waitFor();
  await assertBusinessOnly(page);
  assert.equal(await page.getByRole('button', { name: '重新生成并校验方案', exact: true }).isEnabled(), true);
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
});

test('报告保留正文和资料不完整状态，隐藏内部校验列表', async t => {
  const { page, writes, errors } = await pageFor(t, 'report');
  await page.locator('.report-panel').waitFor();
  await assertBusinessOnly(page);
  assert.match(await page.locator('body').innerText(), /资料不完整/);
  assert.match(await page.locator('.report-article').innerText(), /本次送料机故障由维修人员现场处理/);
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
});

test('日志中心保持原有完整证据与回执，不受到业务页面隐藏规则影响', async t => {
  const { page, writes, errors } = await pageFor(t, 'logs');
  await page.getByRole('heading', { level: 4, name: 'maintenance', exact: true }).waitFor();
  const body = await page.locator('body').innerText();
  assert.match(body, /validator_pass/); assert.match(body, /EXP-B39D8CB379/);
  assert.match(body, /three_equipment_fault_code_catalog\.pdf/);
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
});
