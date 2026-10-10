import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

test('日志直接展示当前故障的经验总结正文，重进无需生成或刷新', async () => {
  const fixture = await centerFixture({ fullApp: true });
  const page = await fixture.browser.newPage();
  const writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const experience = { experience_id: 'EXP-SUM-1', source_workorder: 'WO-1', source_event_id: 'E1',
    validation_status: 'manual_confirmed', automatic_verification: false, rag_saved: false,
    title: '维修经验总结 · M1 · 报警 700006',
    content: '故障与诊断：刀塔旋转超时\n实际处理说明：完成\n处理结果：人工确认后整线启动成功，未进行自动恢复核验。' };
  const records = ['agent_started', 'agent_completed'].map((event, index) => ({ type: 'agent',
    name: 'memory', agent: 'memory', agent_run_id: 'MEM-1', trace_id: 'T-SUM', event,
    context: { event_id: 'E1', device_id: 'M1' }, timestamp: `2026-10-09T00:00:0${index}Z`,
    ...(index ? { output: { action: 'summarize', success: true, experience } } : { input: { action: 'summarize' } }) }));
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (!['GET', 'HEAD'].includes(request.method())) { writes.push(path); return route.abort(); }
    if (path === '/api/runs') return respond(route, { runs: [{ run_id: 'fault:E1', run_type: 'fault', device_id: 'M1',
      alarm_code: '700006', label: '故障闭环', status: 'completed', trace_ids: ['T-SUM'], event_count: 2,
      phases: [{ id: 'experience', label: '经验总结', status: 'completed' }] }] });
    if (path === '/api/trace') return respond(route, { records });
    if (path === '/api/monitor/snapshot') return respond(route, { devices: [], diagnosis: {} });
    return respond(route, {});
  });
  try {
    await page.goto(`${fixture.base}/?view=logs`);
    const summary = page.getByRole('region', { name: '故障经验总结', exact: true });
    await summary.waitFor({ timeout: 4000 });
    assert.match(await summary.innerText(), /实际处理说明：完成/);
    assert.match(await summary.innerText(), /人工确认/);
    assert.match(await summary.innerText(), /WO-1/);
    assert.equal(await summary.locator('.formatted-text p').count(), 3);
    assert.equal(await page.locator('.logs-run-card').count(), 1);
    await page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name: '报告中心', exact: true }).click();
    await page.getByRole('navigation', { name: '功能导航' }).getByRole('button', { name: '日志系统', exact: true }).click();
    await summary.waitFor();
    assert.match(await summary.innerText(), /实际处理说明：完成/);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});
