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
    items = [{report_id: 'RPT-CYCLE-A', cycle_id: 'CYCLE-A', report_type: 'full_case_report', title: '故障处理汇总报告 A', status: 'completed',
      article_title: '设备故障诊断与维修处理报告', article_subtitle: '设备：M1   报警：700010（液压压力不足）',
      article_outline: [{title: '一、故障概况与诊断分析', paragraph_indexes: [0, 1]},
        {title: '二、维修方案与工单处理', paragraph_indexes: [2, 3]},
        {title: '三、复机结果', paragraph_indexes: [4]}, {title: '四、经验总结', paragraph_indexes: [5]}],
      article_text: ['设备M1因液压不足停机，智能诊断后，维修方案建议检查压力。本报告汇总从停机到恢复运行的处理过程。',
        '智能诊断结合报警定义、设备日志和历史趋势进行分析。'.repeat(8),
        '维修方案建议进行安全隔离、检查相关部件并复测指标，实际执行情况以工单反馈为依据。'.repeat(4),
        '工单中记录检查完成，具体操作和复测数据应结合现场情况补充。',
        '维修人员人工确认后整线复机，未进行自动恢复核验，运行过程中应关注是否再次出现同类报警。',
        '本次处理经验已保存，可供后续同类故障检索参考，报告与工单中的诊断及方案记录保持关联。'].join('\n\n'),
      concise_sections: [{title: '停机到复机', body: '设备M1停机后复机'}, {title: '智能诊断', body: '液压不足'},
        {title: '维修方案', body: '检查压力'}, {title: '工单执行与检查', body: '检查完成'}, {title: '经验总结', body: '经验已保存'}],
      validation_findings: [], sections: {lifecycle: {started_at: '2026-10-08T01:00:00Z',
        restarted_at: '2026-10-08T01:05:00Z', device_ids: ['M1'], event_ids: ['E1']},
      diagnosis: {records: [{fault: '液压不足', device_id: 'M1', model: 'UNUSED-MODEL', raw: {UNUSED_PARAMETER: true}}]}, maintenance_plan: {records: [{repair_steps: ['检查压力']}]},
      workorder: {records: [{workorder_id: 'WO-A', status: 'closed', repair_feedback: {feedback: '检查完成'}}]},
      quality: {status: 'not_tested', records: []}}}];
    await page.getByRole('heading', {name: '设备故障诊断与维修处理报告', exact: true}).waitFor({timeout: 3500});
    assert.equal(await page.locator('.report-article p').count(), 6);
    assert.equal(await page.locator('.report-display-section').count(), 0);
    assert.equal(await page.locator('.report-article').getByRole('heading').count(), 4);
    assert.match(await page.locator('.report-subtitle').innerText(), /M1.*700010/);
    assert.match(await page.locator('.report-panel').innerText(), /检查完成/);
    assert.doesNotMatch(await page.locator('.report-panel').innerText(), /UNUSED/);
    assert.ok([...(await page.locator('.report-article').innerText()).replace(/\s/g, '')].length > 500);
    assert.equal(await page.locator('.report-panel').getByRole('link', {name: '下载完整数据'}).count(), 0);
    assert.equal(await page.locator('.report-workspace').getByText('质检结果', {exact: true}).count(), 0);
    assert.equal(await page.locator('.report-workspace .module-grid').count(), 0);
    items = [{report_id: 'RPT-CYCLE-B', title: '故障处理汇总报告 B', sections: {}}, ...items];
    await page.locator('.report-list-select').filter({hasText: '故障处理汇总报告 B'}).waitFor({timeout: 3500});
    assert.equal(await page.locator('.report-panel').getByRole('heading', {name: '设备故障诊断与维修处理报告'}).count(), 1);
    items = [{report_id: 'RPT-QC', report_type: 'quality_report', title: '产品质检报告', status: 'completed',
      sections: {quality: {result: 'failed', passed: false, findings: ['尺寸超差']}}}, ...items];
    await page.locator('.report-list-select').filter({hasText: '产品质检报告'}).click({timeout: 3500});
    await page.locator('.report-panel').getByRole('heading', {name: '产品质检报告', exact: true}).waitFor();
    assert.match(await page.locator('.report-panel').innerText(), /未通过.*尺寸超差/);
    assert.equal(await page.locator('.report-workspace').getByText('质检结果', {exact: true}).count(), 1);
  } finally {await context.close(); await fixture.close();}
});
