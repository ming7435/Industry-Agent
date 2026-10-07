import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

let fixture;
const deviceId = 'TRAK-TC820LTYSI-001';
const actor = { user_id: 'USER-08d72c23ddbf4bc0b4fa8100f5e3e2f7', username: 'lmy', role: 'technician' };
const sample = { device_id: deviceId, alarm_code: '700006', status: 'alarm' };
// Real persisted shape: top-level alarm_code is empty; DiagnosisView retained it in raw.
const order = { workorder_id: 'WO-B1BAE75E20', device_id: deviceId, plan_id: 'PLAN-8B8045570B',
  event_id: 'EVT-20261007-080944-107-003', alarm_code: '', status: 'in_progress', assignee: actor.user_id,
  assignee_name: 'lmy', title: '刀塔旋转超时故障核查', diagnosis_context: { summary: '刀塔旋转超时' },
  diagnosis_snapshot: { device_id: deviceId, fault: '刀塔旋转超时', raw: { device_id: deviceId, alarm_code: '700006' } },
  maintenance_plan_snapshot: { plan_id: 'PLAN-8B8045570B' } };
before(async () => { fixture = await centerFixture({ actor, sample, snapshot: { devices: [],
  diagnosis: { latest_by_device: { [deviceId]: { ...sample, status: 'completed', summary: '当前刀塔诊断' } } } } }); });
after(async () => { await fixture?.close(); });

async function pageFor(items) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drawings/**', route => route.fulfill({ contentType: 'text/html', body: '<p>隔离图纸占位</p>' }));
  await page.route('**/api/**', route => {
    if (!['GET', 'HEAD'].includes(route.request().method())) { writes.push(route.request().method()); return route.abort(); }
    if (new URL(route.request().url()).pathname === '/api/workorders') return respond(route, { items });
    return respond(route, {});
  });
  return { context, page, writes, errors };
}

test('真实空报警工单自动选中当前现场任务，不误提示尚无可见工单', async () => {
  assert.equal(order.alarm_code, '');
  const { context, page, writes, errors } = await pageFor([{ workorder: order }]);
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByRole('button', { name: /WO-B1BAE75E20/ }).waitFor();
    await page.locator('.workorder-titlebar').waitFor();
    const title = await page.locator('.workorder-titlebar').innerText();
    assert.ok(title.includes('WO-B1BAE75E20'));
    assert.ok(title.includes('lmy'));
    assert.equal(await page.getByRole('heading', { name: '当前没有待处理工单', exact: true }).count(), 0);
    assert.equal(await page.getByText(/当前账号尚无报警 700006 对应的可见工单/).count(), 0);
    assert.ok((await page.getByRole('button', { name: /WO-B1BAE75E20/ }).getAttribute('class')).includes('is-selected'));
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('相同报警文字来自其他设备快照时不自动选为当前工单，保留手动查看', async () => {
  const unrelated = { ...order, workorder_id: 'WO-HISTORY', diagnosis_snapshot: { device_id: 'D-OTHER',
    raw: { device_id: 'D-OTHER', alarm_code: '700006' } } };
  const { context, page, writes, errors } = await pageFor([unrelated]);
  try {
    await page.goto(`${fixture.base}/?view=workorder`);
    const item = page.getByRole('button', { name: /WO-HISTORY/ });
    await item.waitFor();
    assert.equal(await page.locator('.workorder-titlebar').count(), 0);
    assert.equal(await page.getByRole('heading', { name: '当前没有待处理工单', exact: true }).count(), 1);
    await item.click();
    await page.locator('.workorder-titlebar').waitFor();
    assert.ok((await page.locator('.workorder-titlebar').innerText()).includes('WO-HISTORY'));
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
