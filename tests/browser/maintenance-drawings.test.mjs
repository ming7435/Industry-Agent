import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

let fixture;
before(async () => { fixture = await centerFixture(); });
after(async () => { await fixture?.close(); });

const reference = (deviceId, name, url, sourceKind) => ({ drawing_id: name, drawing_name: name, device_id: deviceId,
  drawing_url: url, model_url: url, source_kind: sourceKind, evidence_scope: 'device_reference', engineering_status: 'reference_only' });
const plan = (deviceId, changes = {}) => ({ plan_id: `PLAN-${deviceId}`, device_id: deviceId, event_id: `EV-${deviceId}`,
  workorder_ready: false, validation_findings: ['已找到设备图纸，缺少目标部件 BOM、尺寸和材料'],
  repair_steps: ['等待工程资料补齐'], dispatch: { allowed: false, reason: '缺少目标部件工程信息' }, ...changes });

async function pageFor(items) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const mutations = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/api/**', route => {
    const request = route.request();
    if (!['GET', 'HEAD'].includes(request.method())) { mutations.push(request.method()); return route.abort(); }
    if (new URL(request.url()).pathname === '/api/maintenance/plans') return respond(route, { items, history: { status: 'ready' }, deleted_plan_ids: [] });
    return respond(route, { items: [] });
  });
  // 检查入口实际导航，图纸内容用隔离静态页，避免执行原HTML脚本和大模型。
  await context.route('**/drawings/*.html', route => route.fulfill({ contentType: 'text/html;charset=utf-8', body: '<title>本地图纸</title><p>只读图纸</p>' }));
  return { context, page, mutations, errors };
}

test('未就绪且没有工单的方案能打开设备图纸，保留真实资料缺项与派发阻塞', async () => {
  const deviceId = 'TRAK-TC820LTYSI-001';
  const drawing = reference(deviceId, 'TC820si 设备图纸', '/drawings/TC820si.html', 'original_edrawings');
  const { context, page, mutations, errors } = await pageFor([plan(deviceId, { available_drawings: [drawing] })]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    const link = page.getByRole('link', { name: /TC820si 设备图纸/ });
    await link.waitFor();
    assert.equal(await link.getAttribute('href'), drawing.drawing_url);
    assert.ok((await page.locator('[aria-label="设备图纸参考"]').innerText()).includes('设备图纸'));
    const status = await page.locator('[aria-label="自动派发条件"]').innerText();
    assert.ok(status.includes('暂不能自动派发') && status.includes('工单就绪：否'));
    assert.ok(status.includes('BOM、尺寸和材料'));
    assert.equal(await page.getByText('已自动派单', { exact: true }).count(), 0);
    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.equal(new URL(popup.url()).pathname, drawing.drawing_url);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('选择其他设备方案时只显示对应设备图纸与参考模型，嵌套新方案资料也可查看', async () => {
  const equator = reference('RENISHAW-EQUATOR300-001', 'Equator300 防碰撞尺寸', '/drawings/Equator300.html', 'reference_model');
  const qls = reference('LNS-QL-SERVO-80-S2-001', 'QLS80S2 设备图纸', '/drawings/QLS80S2.html', 'reference_model');
  const { context, page, mutations, errors } = await pageFor([
    plan(equator.device_id, { available_drawings: [equator] }),
    plan(qls.device_id, { engineering_context: { reference_drawings: [qls] } }),
  ]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.getByRole('link', { name: /Equator300 防碰撞尺寸/ }).waitFor();
    assert.ok((await page.locator('[aria-label="设备图纸参考"]').innerText()).includes('设备图纸与参考模型'));
    await page.locator('.workorder-queue-item').filter({ hasText: `PLAN-${qls.device_id}` }).click();
    const link = page.getByRole('link', { name: /QLS80S2 设备图纸/ });
    await link.waitFor();
    assert.equal(await link.getAttribute('href'), qls.drawing_url);
    assert.equal(await page.getByRole('link', { name: /Equator300 防碰撞尺寸/ }).count(), 0);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('没有服务端参考图纸的方案不根据设备名称虚构图纸入口', async () => {
  const { context, page, mutations, errors } = await pageFor([plan('TRAK-TC820LTYSI-001')]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    await page.locator('.maintenance-plan-list-row').waitFor();
    assert.equal(await page.locator('a[href^="/drawings/"]').count(), 0);
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('Maintenance真实engineering_context.available_drawings可在未就绪方案打开并优先去重', async () => {
  const drawing = reference('RENISHAW-EQUATOR300-001', '后端当前 Equator300 图纸', '/drawings/Equator300.html', 'reference_model');
  const { context, page, mutations, errors } = await pageFor([plan(drawing.device_id, { engineering_context: {
    available_drawings: [drawing], reference_drawings: [{ ...drawing, drawing_name: '旧兼容图纸名称' }],
  } })]);
  try {
    await page.goto(`${fixture.base}/?view=maintenance`);
    const link = page.getByRole('link', { name: /后端当前 Equator300 图纸/ });
    await link.waitFor();
    assert.equal(await link.getAttribute('href'), drawing.drawing_url);
    assert.equal(await page.locator('a[href="/drawings/Equator300.html"]').count(), 1);
    assert.equal(await page.getByRole('link', { name: /旧兼容图纸名称/ }).count(), 0);
    assert.ok((await page.locator('[aria-label="自动派发条件"]').innerText()).includes('工单就绪：否'));
    assert.deepEqual(mutations, []);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
