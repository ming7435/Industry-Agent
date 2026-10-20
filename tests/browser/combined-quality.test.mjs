import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { centerFixture, respond } from './helpers/center-fixture.mjs';
import { combinedVerdict } from '../../frontend/monitor-react/src/app/combinedQuality.mjs';

const prefix = '/api/quality/vision/combined/parts';
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const image = 'data:image/png;base64,' + png;
async function setup({ loseReviewReply = false } = {}) {
  const fixture = await centerFixture({ withStyles: true });
  const page = await fixture.browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(7000);
  const rows = [], posts = [], errors = [], requests = new Map();
  let lost = false;
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname;
    if (path === '/api/team/me') return respond(route, { user: { user_id: 'U-combined', role: 'technician' } });
    if (path === prefix && req.method() === 'GET') {
      const scope = url.searchParams.get('scope'), batch = url.searchParams.get('batch_id') || '';
      const scoped = rows.filter(r => r.scope === scope), items = scoped.filter(r => !batch || r.batch_id === batch).map(r => ({ ...r, status: combinedVerdict(r) }));
      const summary = { total: items.length, qualified: 0, unqualified: 0, pending: 0 };
      for (const item of items) summary[item.status]++;
      summary.determinate = summary.qualified + summary.unqualified;
      summary.rate_percent = summary.determinate ? +(100 * summary.qualified / summary.determinate).toFixed(2) : null;
      summary.coverage_percent = summary.total ? +(100 * summary.determinate / summary.total).toFixed(2) : null;
      return respond(route, { scope, batch_id: batch, batches: [...new Set(scoped.map(r => r.batch_id))], items, summary });
    }
    if (path === prefix && req.method() === 'POST') {
      const body = req.postDataJSON(); posts.push({ path, body });
      let row = rows.find(r => r.scope === body.scope && r.batch_id === body.batch_id && r.serial_number === body.serial_number);
      if (!row) {
        row = { ...body, quality_part_id: 'CQ-' + (rows.length + 1).toString(16).padStart(32, '0'), revision: 0,
          parameters: { decision: 'pending' }, visual: { decision: 'pending' }, history: [] };
        rows.push(row);
      }
      return respond(route, { ...row, status: combinedVerdict(row) });
    }
    if (path.startsWith(prefix + '/') && path.endsWith('/reviews')) {
      const body = req.postDataJSON(); posts.push({ path, body });
      const row = rows.find(r => path.includes(r.quality_part_id));
      if (!requests.has(body.request_id)) {
        if (row.revision !== body.expected_revision) return respond(route, { detail: '记录已更新，请刷新' }, 409);
        row[body.kind] = { ...body }; row.history.push(body); row.revision++;
        requests.set(body.request_id, body);
      }
      if (loseReviewReply && !lost) { lost = true; return route.abort('failed'); }
      return respond(route, { ...row, status: combinedVerdict(row) });
    }
    if (path === '/api/quality/vision/capabilities') return respond(route, {
      data_mode: 'gear', algorithms: [{ id: 'patchcore', available: false }, { id: 'yolo', available: true }],
      models: [{ model_id: 'yolo-default', algorithm: 'yolo', name: '齿轮 YOLO11', classes: ['darkspot'], recommended_confidence: .075, recommended_iou: .45 }],
    });
    if (path === '/api/quality/vision/detect') {
      const body = req.postDataJSON(); posts.push({ path, body });
      const row = rows.find(r => r.quality_part_id === body.quality_part_id);
      if (row) {
        row.revision++;
        if (row.visual.decision === 'pass') row.visual = { decision: 'pending' };
      }
      return respond(route, { inspection_id: 'VI-' + posts.length.toString(16).padStart(32, '0'), algorithm: 'yolo', model_id: body.model_id,
        quality_part_id: body.quality_part_id, image_source: body.image_source, part_id: body.part_id || '',
        created_at: new Date().toISOString(), filename: body.filename, status: 'clear', score: 0, threshold: body.confidence,
        image: { width: 1, height: 1 }, annotated_image: image, defects: [],
        steps: [{ name: '图像推理', status: 'completed', detail: '浏览器交互测试桩，不代表实际模型精度' }] });
    }
    return respond(route, { items: [], devices: [], runs: [], enabled: true });
  });
  await page.goto(fixture.base + '/?view=quality');
  await page.getByRole('heading', { name: '综合判定与合格率', exact: true }).waitFor();
  await page.getByTestId('combined-quality-metrics').locator('dd').nth(1).getByText('0', { exact: true }).waitFor();
  return { fixture, page, rows, posts, errors };
}

async function register(page, serial) {
  const details = page.locator('.combined-register');
  if (await details.getAttribute('open') === null) await details.locator('summary').click();
  await page.getByLabel('综合登记批次编号').fill('GEAR-B-1');
  await page.getByLabel('综合登记实物编号').fill(serial);
  await page.getByLabel('综合登记设计版本').fill('GEAR-V-1');
  await page.getByRole('button', { name: '登记零件', exact: true }).click();
  await page.getByLabel('当前复核实物').locator('option').filter({ hasText: serial }).waitFor({ state: 'attached' });
  await page.getByRole('button', { name: '保存本项复核', exact: true }).waitFor();
}
async function review(page, kind, decision) {
  await page.getByLabel('综合复核项目').selectOption(kind);
  await page.getByLabel('综合确认结果').selectOption(decision);
  await page.getByLabel('综合复核依据').fill('REPORT-GEAR-1-' + kind);
  await page.getByLabel('综合复核说明').fill('流程验证：核对实物及全部必检内容');
  const check = page.getByRole('checkbox', { name: '已完成本项目全部必检内容并核对实物、批次和设计版本' });
  await check.setChecked(decision === 'pass');
  await page.getByRole('button', { name: '保存本项复核', exact: true }).click();
}

test('register inspect two channels count physical parts and reload with validation separate', async () => {
  const { fixture, page, rows, posts, errors } = await setup();
  try {
    const metrics = page.getByTestId('combined-quality-metrics');
    assert.deepEqual(await metrics.locator('dd').allTextContents(), ['—', '0', '—']);
    for (const serial of ['GEAR-001', 'GEAR-002', 'GEAR-003']) await register(page, serial);
    await page.getByLabel('当前复核实物').selectOption(rows[0].quality_part_id);
    await page.getByLabel('待检测图片', { exact: true }).setInputFiles({ name: 'gear.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByRole('button', { name: '引用本次视觉检测', exact: true }).waitFor();
    assert.equal(posts.find(p => p.path.endsWith('/detect')).body.quality_part_id, rows[0].quality_part_id);
    assert.deepEqual(await metrics.locator('dd').allTextContents(), ['—', '3', '0.00%']);
    await page.getByRole('button', { name: '引用本次视觉检测', exact: true }).click();
    assert.equal(await page.getByLabel('综合确认结果').inputValue(), 'pending');
    await review(page, 'visual', 'pass');
    await page.getByText('参数：待复检 · 外观：确认通过', { exact: false }).waitFor();
    await review(page, 'parameters', 'pass');
    await metrics.getByText('100.00%', { exact: true }).waitFor();
    await page.getByLabel('当前复核实物').selectOption(rows[1].quality_part_id);
    await review(page, 'visual', 'fail');
    await metrics.getByText('50.00%', { exact: true }).waitFor();
    assert.deepEqual(await metrics.locator('dd').allTextContents(), ['50.00%', '1', '66.67%']);
    await register(page, 'GEAR-001'); // Repeat registration remains one physical part.
    assert.equal(rows.length, 3);
    await page.reload();
    await metrics.getByText('50.00%', { exact: true }).waitFor();
    await mkdir('output/combined-quality', { recursive: true });
    await page.locator('.combined-quality').screenshot({ path: 'output/combined-quality/desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.locator('.combined-quality').screenshot({ path: 'output/combined-quality/mobile.png' });
    await page.getByLabel('综合统计范围').selectOption('production');
    await page.getByText('综合合格率（人工复核）', { exact: true }).waitFor();
    await page.getByLabel('当前复核实物').getByText('暂无已登记实物').waitFor({ state: 'attached' });
    assert.deepEqual(await metrics.locator('dd').allTextContents(), ['—', '0', '—']);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('lost review response is retried with same request and does not repeat a check', async () => {
  const { fixture, page, rows, posts, errors } = await setup({ loseReviewReply: true });
  try {
    await register(page, 'GEAR-001');
    await review(page, 'visual', 'fail');
    await page.getByRole('button', { name: '按原请求核对／重试保存', exact: true }).click();
    await page.getByTestId('combined-quality-metrics').getByText('0.00%', { exact: true }).waitFor();
    const reviews = posts.filter(p => p.path.endsWith('/reviews'));
    assert.equal(reviews.length, 2);
    assert.deepEqual(reviews[0].body, reviews[1].body);
    assert.equal(rows[0].history.length, 1);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('another visual inspection removes a stale pass from rates until human review', async () => {
  const { fixture, page, errors } = await setup();
  try {
    await register(page, 'GEAR-RECHECK');
    await review(page, 'parameters', 'pass');
    await page.getByText('参数：确认通过 · 外观：待复检', { exact: false }).waitFor();
    await review(page, 'visual', 'pass');
    const metrics = page.getByTestId('combined-quality-metrics');
    await metrics.locator('dd').first().getByText('100.00%', { exact: true }).waitFor();
    await page.getByLabel('待检测图片', { exact: true }).setInputFiles({ name: 'new-view.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('参数：确认通过 · 外观：待复检', { exact: false }).waitFor();
    assert.deepEqual(await metrics.locator('dd').allTextContents(), ['—', '1', '0.00%']);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});
