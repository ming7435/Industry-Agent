import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

const actor = {user_id: 'U-OWNER', username: '维修人员', role: 'technician'};
const initial = {workorder_id: 'WO-MANUAL', device_id: 'D-1', status: 'in_progress', assignee: actor.user_id,
  title: '刀塔故障维修', accepted_by: actor.user_id, alarm_code: '700006',
  maintenance_plan_snapshot: {plan_kind: 'repair', repair_steps: ['处理刀塔异常']}};
let fixture;
before(async () => { fixture = await centerFixture({actor, sample: {device_id: 'D-1'}}); });
after(async () => { await fixture?.close(); });

test('填写完成后直接启动，刷新页面仍显示人工确认启动成功', async () => {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  let current = structuredClone(initial);
  const writes = [];
  try {
    await page.route('**/drawings/**', route => route.abort());
    await page.route('**/api/**', route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      if (path === '/api/workorders/WO-MANUAL/action') {
        writes.push(request.postDataJSON());
        current = {...current, status: 'completed', repair_feedback: request.postDataJSON().repair_feedback,
          repair_verification: {phase: 'manual_confirmation', confirmed: true, automatic_verification: false},
          machine_control: {state: 'running', restart_method: 'manual_confirmation'}};
        return respond(route, {workorder: current, machine_control: current.machine_control});
      }
      if (path === '/api/workorders') return respond(route, {items: [current]});
      return respond(route, {items: []});
    });
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByLabel('处理说明', {exact: true}).fill('完成');
    await page.getByRole('button', {name: '确认维修完成并申请复机', exact: true}).click();
    const completed = page.getByRole('button', {name: '维修已完成，设备已启动', exact: true});
    await completed.waitFor();
    assert.equal(await completed.isDisabled(), true);
    assert.match(await page.locator('.machine-control-result').innerText(), /人工确认，整线设备已启动/);
    assert.deepEqual(writes, [{action: 'mark_repair_completed', status: 'completed', repair_feedback: {feedback: '完成'}}]);
    await page.reload();
    await completed.waitFor();
    assert.equal(await completed.isDisabled(), true);
    assert.match(await page.locator('.machine-control-result').innerText(), /再次异常，系统会重新报警/);
    assert.equal(writes.length, 1);
  } finally { await context.close(); }
});
