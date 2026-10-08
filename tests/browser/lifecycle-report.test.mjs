import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond} from './helpers/center-fixture.mjs';

test('报告中心无需输入来源，复机汇总自动出现，背景同步保留当前报告', async () => {
  const fixture = await centerFixture();
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  let items = [];
  try {
    await page.route('**/api/**', route => respond(route, {items}));
    await page.goto(`${fixture.base}/?view=report`);
    assert.equal(await page.getByText('来源类型', {exact: true}).count(), 0);
    assert.equal(await page.getByText('来源编号', {exact: true}).count(), 0);
    items = [{report_id: 'RPT-CYCLE-A', cycle_id: 'CYCLE-A', title: '故障处理汇总报告 A', status: 'incomplete',
      validation_findings: ['未关联质检记录'], sections: {lifecycle: {started_at: '2026-10-08T01:00:00Z',
        restarted_at: '2026-10-08T01:05:00Z', device_ids: ['M1'], event_ids: ['E1']},
      diagnosis: {records: [{fault: '液压不足', device_id: 'M1'}]}, maintenance_plan: {records: [{repair_steps: ['检查压力']}]},
      workorder: {records: [{workorder_id: 'WO-A', status: 'closed', repair_feedback: {feedback: '检查完成'}}]},
      quality: {status: 'not_tested', records: []}}}];
    await page.getByRole('heading', {name: '故障处理汇总报告 A', exact: true}).waitFor({timeout: 3500});
    for (const title of ['停机到复机', '智能诊断', '维修方案', '工单执行与检查', '质检结果']) {
      assert.equal(await page.locator('.report-display-section').getByRole('heading', {name: title, exact: true}).count(), 1);
    }
    assert.match(await page.locator('.report-panel').innerText(), /检查完成/);
    items = [{report_id: 'RPT-CYCLE-B', title: '故障处理汇总报告 B', sections: {}}, ...items];
    await page.locator('.report-list-select').filter({hasText: '故障处理汇总报告 B'}).waitFor({timeout: 3500});
    assert.equal(await page.locator('.report-panel').getByRole('heading', {name: '故障处理汇总报告 A'}).count(), 1);
  } finally {await context.close(); await fixture.close();}
});
