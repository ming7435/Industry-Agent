import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond} from './helpers/center-fixture.mjs';

test('多故障页面切换独立诊断与工单链接，不提交模型或派工请求', async t => {
  const event = (id, alarm) => ({tenant_id:'T', device_id:'D-MULTI', event_id:id,
    event_revision:1, alarm_code:alarm});
  const first = event('FAULT-FIRST', '700004'), second = event('FAULT-SECOND', '700010');
  const diagnosis = (row, summary) => ({...row, status:'completed', summary, confidence:.95});
  const d1 = diagnosis(first, '安全门互锁故障'), d2 = diagnosis(second, '液压压力故障');
  const pipeline = (row, id) => ({event:row, status:'completed',
    maintenance_plan:{device_id:row.device_id, plan_id:'P-'+id},
    workorder:{device_id:row.device_id, plan_id:'P-'+id, workorder_id:'W-'+id}});
  const fixture = await centerFixture({sample:{device_id:'D-MULTI', alarm_code:'700010'},
    snapshot:{device_id:'D-MULTI', trigger_history:[{abnormal_event:second}], diagnosis:{
      latest:d2, latest_by_device:{'D-MULTI':d2}, by_event:{first:d1, second:d2},
      pipeline_by_device:{'D-MULTI':pipeline(second, 'SECOND')},
      pipeline_by_event:{first:pipeline(first, 'FIRST'), second:pipeline(second, 'SECOND')},
    }}});
  t.after(() => fixture.close());
  const page = await fixture.browser.newPage(), writes = [], errors = [];
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === fixture.base ? route.continue() : route.abort());
  await page.route('**/api/**', route => {
    if (route.request().method() !== 'GET') {writes.push(route.request().url()); return route.abort();}
    return respond(route, {});
  });
  await page.goto(`${fixture.base}/?view=diagnosis`);
  const summary = page.getByRole('region', {name:'诊断结论'});
  await summary.getByText('液压压力故障', {exact:true}).waitFor();
  const selector = page.getByLabel('查看故障任务');
  const options = await selector.locator('option').evaluateAll(rows => rows.map(row => ({label:row.label, value:row.value})));
  await selector.selectOption(options.find(row => row.label.includes('FAULT-FIRST')).value);
  await summary.getByText('安全门互锁故障', {exact:true}).waitFor();
  assert.match(await page.getByRole('region', {name:'故障任务选择'}).innerText(), /P-FIRST/);
  assert.equal(await page.getByRole('link', {name:'W-FIRST', exact:true}).getAttribute('href'), '?view=workorder&workorder_id=W-FIRST');
  assert.equal(await page.getByRole('link', {name:'W-SECOND', exact:true}).count(), 0);
  await selector.selectOption('');
  await summary.getByText('液压压力故障', {exact:true}).waitFor();
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
});
