import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

async function diagnosisPage(t, changes = {}) {
  const sample = { device_id: 'D-ISOLATED-DIAGNOSIS', alarm_code: '700010' };
  const diagnosis = { ...sample, event_id: 'E-ISOLATED-DIAGNOSIS', event_revision: 1,
    status: 'completed', confidence: 0.92, evidence_status: 'ready', requires_human_review: false,
    summary: '液压压力异常诊断已完成', evidence: ['隔离测试报警定义'], ...changes };
  const fixture = await centerFixture({ sample, snapshot: { device_id: sample.device_id, diagnosis: {
    latest_by_device: { [sample.device_id]: diagnosis },
    pipeline_by_device: { [sample.device_id]: { event: diagnosis, diagnosis,
      status: 'blocked', stop_reason: 'replan_limit_exceeded' } },
  } } });
  t.after(() => fixture.close());
  const page = await fixture.browser.newPage(), writes = [], errors = [];
  page.setDefaultTimeout(3000);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === fixture.base ? route.continue() : route.abort());
  await page.route('**/api/**', route => {
    if (route.request().method() !== 'GET') { writes.push(route.request().url()); return route.abort(); }
    return respond(route, {});
  });
  await page.goto(`${fixture.base}/?view=diagnosis`);
  await page.getByRole('region', { name: '智能诊断' }).waitFor();
  return { page, writes, errors };
}

test('真实诊断页面保留92%已返回诊断，后续重试耗尽不误标证据不足', async t => {
  const { page, writes, errors } = await diagnosisPage(t);
  const body = await page.locator('body').innerText();
  assert.match(body, /诊断已返回/);
  assert.match(body, /92%/);
  assert.match(body, /后续流程重试达到上限/);
  assert.match(body, /未完成自动派工/);
  assert.doesNotMatch(body, /证据不足/);
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
});

test('真实诊断页面尊重人工核实标记，不以高置信度或完成状态覆盖', async t => {
  const { page, writes, errors } = await diagnosisPage(t, { requires_human_review: true });
  const body = await page.locator('body').innerText();
  assert.match(body, /诊断待核实/);
  assert.match(body, /人工核实/);
  assert.match(body, /92%/);
  assert.doesNotMatch(body, /诊断已返回/);
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
});
