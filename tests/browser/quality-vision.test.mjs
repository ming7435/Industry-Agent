import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const image = 'data:image/png;base64,' + png;
const file = name => ({ name, mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
const model = { model_id: 'PC-normal', algorithm: 'patchcore', name: '正常轴套', sample_count: 2, memory_size: 20, suggested_threshold: 1 };
const preset = { ...model, model_id: 'patchcore-demo', name: 'PatchCore 合成纹理演示', read_only: true, demo: true,
  description: '用合成纹理展示异常定位流程，不适用于真实产品质量判定。', source_url: 'https://example.org/patchcore', classes: ['anomaly'] };
const gearPreset = { ...model, sample_count: 2068, model_id: 'patchcore-gear', name: '齿轮正常记忆库', read_only: true,
  description: '基于 2068 张正常齿轮图像建立的 PatchCore 正常记忆库。' };
const yolo = { model_id: 'yolo-default', algorithm: 'yolo', name: 'YOLO11n 合成缺陷检测（研究验证）', read_only: true, demo: false,
  description: '用于合成划痕和低对比度缺陷验证。', source_url: 'https://github.com/ultralytics/assets/releases/tag/v8.3.0',
  classes: ['synthetic_scratch', 'synthetic_low_contrast'] };
const result = (body, inspectionId) => ({ inspection_id: inspectionId, algorithm: body.algorithm, model_id: body.model_id,
  image_source: body.image_source || 'upload', ...(body.quality_part_id ? {quality_part_id: body.quality_part_id} : {}),
  image_sha256: 'a'.repeat(64), image_digest_format: 'rgb-pixels-with-size-v1',
  created_at: '2026-10-19T04:00:00Z', part_id: body.part_id || '', filename: body.filename, status: 'defect', score: body.algorithm === 'patchcore' ? 1.5 : 0.91,
  threshold: body.algorithm === 'patchcore' ? body.threshold : body.confidence, image: { width: 100, height: 80 },
  parameters: { threshold: body.algorithm === 'patchcore' ? body.threshold : body.confidence, confidence: body.confidence ?? .25, iou: body.iou ?? .45 },
  defects: [{ label: body.algorithm === 'patchcore' ? 'anomaly' : 'scratch', confidence: body.algorithm === 'patchcore' ? null : 0.91, bbox: [2, 3, 40, 60] }],
  annotated_image: image, ...(body.algorithm === 'patchcore' ? { heatmap_image: image } : {}),
  steps: [{ name: '特征提取', status: 'completed', detail: '完成图像推理' }] });

async function setup({ models = [gearPreset, yolo], gate, patchcoreFailure = false, pipelineCase = 'known_defect', pipelineTamper = false, detailsOpen = false, patchcoreReady = true, legacyReceipt = null, yoloReady = true, partSegReady = true, modelWarnings = [], dataset = null } = {}) {
  const fixture = await centerFixture({ withStyles: true }), page = await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const posts = [], gets = [], errors = [];
  let nextInspection = 0;
  const nextId = () => 'VI-' + (++nextInspection).toString(16).padStart(32, '0');
  if (legacyReceipt) await page.addInitScript(receipt => { sessionStorage.setItem('quality-sequential:U-vision', JSON.stringify(receipt)); }, legacyReceipt);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/team/me') return respond(route, { user: { user_id: 'U-vision', role: 'technician' } });
    if (path === '/api/quality/vision/capabilities') return respond(route, {
      algorithms: [{ id: 'patchcore', name: 'PatchCore', available: patchcoreReady, can_train: true, reason: patchcoreReady ? '' : 'PatchCore 模型不可用' },
        { id: 'yolo', name: 'YOLO', available: yoloReady, can_train: false, reason: yoloReady ? '' : '尚未配置缺陷检测权重' }],
      models, model_warnings: modelWarnings, dataset,
      part_segmentation: { available: partSegReady, model_id: 'part-seg-v1', classes: ['endface', 'toothface'],
        reason: partSegReady ? '' : '工件分割权重未安装' },
      limits: { max_image_bytes: 4194304, max_training_images: 24 },
    });
    if (path.startsWith('/api/quality/vision/dataset/samples/')) return respond(route, {
      sample_id: 'endface123', filename: 'endface123.png', image, defect_labels: ['darkspot'],
    });
    if (path === '/api/quality/vision/pipeline/detect') {
      const body = route.request().postDataJSON(); posts.push({ path, body });
      if (gate) await gate.promise;
      if (patchcoreFailure) return respond(route, { detail: 'PatchCore 模型不可用' }, 503);
      const pc = result({ ...body, algorithm: 'patchcore', model_id: body.patchcore_model_id }, nextId());
      if (pipelineCase === 'clear') Object.assign(pc, { status: 'clear', score: .1, defects: [] });
      const yoloRecord = ['known_defect', 'unknown_anomaly'].includes(pipelineCase)
        ? result({ ...body, algorithm: 'yolo', model_id: 'yolo-default' }, nextId()) : null;
      if (pipelineCase === 'unknown_anomaly') Object.assign(yoloRecord, { status: 'clear', score: 0, defects: [] });
      const localized = pipelineCase === 'known_defect' ? yoloRecord : pc;
      const value = { ...pc, algorithm: 'patchcore_yolo_pipeline', pipeline_version: 1, inspection_id: nextId(),
        patchcore: pc, yolo: yoloRecord, classification: pipelineCase,
        yolo_state: yoloRecord ? 'completed' : pipelineCase === 'clear' ? 'skipped' : 'failed',
        localization_error: pipelineCase === 'localization_failed' ? { status_code: 503, detail: 'YOLO 模型不可用' } : null,
        inspection_ids: [pc.inspection_id, ...(yoloRecord ? [yoloRecord.inspection_id] : [])],
        defects: localized.defects, annotated_image: localized.annotated_image,
      };
      if (pipelineTamper) value.status = 'clear';
      value.quality_assessment = {version:1,agent:'quality',mode:'evidence_rules',source_id:value.inspection_id,
        scope:body.image_source === 'public_gear_reference' ? 'reference_image' : 'image_only',status:'review',
        checks:{vision:value.status,dimensions:'not_tested'},execution:'not_executed',release_allowed:false,uncovered_count:0,
        cause_summary:[{category:'workpiece',label:'工件外观',status:'模型检出异常',evidence:'仅依据图片'}],
        issues:pipelineCase === 'clear' ? [] : [{category:pipelineCase === 'known_defect' ? 'surface_damage' : 'visual_unknown',
          category_label:pipelineCase === 'known_defect' ? '划伤' : '视觉异常待定位',location:pipelineCase === 'known_defect' ? '图片区域 [1, 2, 10, 12] px' : '位置待确认',
          evidence:'模型检测结果',cause_categories:['workpiece'],cause_status:'unconfirmed',
          disposition:{code:pipelineCase === 'known_defect' ? 'rework_review' : 'hold_review',label:pipelineCase === 'known_defect' ? '返工评估' : '隔离待复核',basis:'确认缺陷后制定处置',requires_confirmation:true}}]};
      return respond(route, value);
    }
    if (path.startsWith('/api/quality/vision/inspections/')) {
      gets.push(path);
      return respond(route, { detail: 'Legacy sequential history must not be restored automatically' }, 404);
    }
    if (route.request().method() === 'POST') { posts.push({ path, body: route.request().postDataJSON() }); return respond(route, { detail: 'unexpected mutation' }, 500); }
    if (path === '/api/quality/vision/auto/status') return respond(route, { enabled: false, running: false });
    return respond(route, { items: [], devices: [], runs: [], enabled: true });
  });
  await page.goto(fixture.base + '/?view=quality');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === '刷新模型状态' && !b.disabled));
  if (detailsOpen) {
    await page.locator('.vision-tuning > summary').click();
    await page.locator('.vision-model-disclosure > summary').click();
    if (dataset) await page.locator('.vision-sample-library > summary').click();
  }
  return { fixture, page, posts, gets, errors };
}

test('quality workspaces keep the image and result across navigation and fit a narrow screen', async () => {
  const { fixture, page, errors } = await setup({ models: [gearPreset, yolo], detailsOpen: false });
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addStyleTag({ path: 'frontend/monitor-react/src/styles.css' });
    await page.addStyleTag({ content: 'body { padding: 28px; }' });
    assert.equal(await page.getByRole('tab', { name: '视觉检测', selected: true }).count(), 1);
    assert.equal(await page.locator('.vision-tuning').getAttribute('open'), null);
    assert.equal(await page.getByRole('heading', { name: '综合判定与合格率' }).isVisible(), false);
    const settings = await page.getByRole('complementary', { name: '检测设置' }).boundingBox();
    const results = await page.getByRole('region', { name: '视觉检测结果', exact: true }).boundingBox();
    assert.ok(settings.x + settings.width <= results.x + 1);
    await mkdir('output/quality-page-redesign', { recursive: true });
    await page.locator('.quality-workspace').screenshot({ path: 'output/quality-page-redesign/desktop.png' });
    assert.ok((await page.getByRole('button', { name: '运行缺陷检测', exact: true }).boundingBox()).y < 900);
    await page.getByLabel('待检测图片').setInputFiles(file('preserved.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('已定位视觉缺陷', { exact: true }).waitFor();
    await page.getByRole('tab', { name: '尺寸检测', exact: true }).click();
    await page.getByRole('heading', { name: '检测零件', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: '视觉缺陷检测', exact: true }).isVisible(), false);
    assert.equal(await page.getByLabel('待检测图片').isVisible(), false);
    assert.equal(await page.getByRole('tabpanel').count(), 1);
    await page.getByRole('tab', { name: '视觉检测', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: '检测零件', exact: true }).isVisible(), false);
    await page.getByText('待检测：preserved.png', { exact: true }).waitFor();
    await page.getByText('已定位视觉缺陷', { exact: true }).waitFor();
    const tab = page.getByRole('tab', { name: '视觉检测', exact: true });
    await tab.focus(); await tab.press('ArrowRight');
    assert.equal(await page.getByRole('tab', { name: '尺寸检测', selected: true }).count(), 1);
    await page.getByRole('tab', { name: '视觉检测', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addStyleTag({ content: 'body { padding: 12px; }' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.quality-workspace').screenshot({ path: 'output/quality-page-redesign/mobile.png' });
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('one fixed defect workflow uses the existing memory with no selection, segmentation or training entry', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [model, preset, gearPreset, yolo] });
  try {
    assert.equal(await page.getByLabel('视觉检测算法').count(), 0);
    assert.equal(await page.getByLabel('检测记忆库', { exact: true }).count(), 0);
    assert.equal(await page.getByLabel('正常训练样本').count(), 0);
    assert.equal(await page.getByRole('button', { name: '建立正常样本记忆库' }).count(), 0);
    assert.equal(await page.getByText('YOLO11s · 工件分割（已训练）', { exact: true }).count(), 0);
    assert.equal(await page.getByTestId('fixed-yolo').count(), 1);
    await page.getByTestId('fixed-memory').getByText('已加载 · 2068 张正常样本 · 使用已保存阈值').waitFor();
    assert.doesNotMatch(await page.locator('.quality-vision').first().textContent(), /请先建立|正常训练样本|新建自己的/);
    await page.getByLabel('待检测图片').setInputFiles(file('existing-memory.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('已定位视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].path, '/api/quality/vision/pipeline/detect');
    assert.equal(posts[0].body.patchcore_model_id, 'patchcore-gear');
    assert.equal(posts[0].body.threshold, gearPreset.suggested_threshold);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('missing fixed memory cannot fall back to a demo or personal bank and refresh loads the existing deployment', async () => {
  const models = [model, preset, yolo];
  const { fixture, page, posts } = await setup({ models });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('gear.png'));
    assert.equal(await page.getByRole('button', { name: '运行缺陷检测', exact: true }).isEnabled(), false);
    assert.doesNotMatch(await page.locator('.quality-vision').first().textContent(), /请先建立|正常训练样本/);
    assert.deepEqual(posts, []);
    models.push(gearPreset);
    await page.getByRole('button', { name: '刷新模型状态' }).click();
    await page.getByTestId('fixed-memory').getByText('已加载 · 2068 张正常样本 · 使用已保存阈值').waitFor();
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('已定位视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.patchcore_model_id, 'patchcore-gear');
  } finally { await fixture.close(); }
});

test('saved threshold and YOLO defaults load automatically and manual edits survive refresh', async () => {
  const { fixture, page, posts } = await setup({ models: [{ ...gearPreset, suggested_threshold: 1.2 }, { ...yolo, recommended_confidence: .4, recommended_iou: .55 }], detailsOpen: true });
  try {
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1.2');
    assert.equal(await page.getByLabel('置信度阈值').inputValue(), '0.4');
    assert.equal(await page.getByLabel('NMS IoU 阈值').inputValue(), '0.55');
    await page.getByLabel('异常距离阈值').fill('1.3');
    await page.getByRole('button', { name: '刷新模型状态' }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === '刷新模型状态' && !b.disabled));
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1.3');
    await page.getByLabel('待检测图片').setInputFiles(file('defaults.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('已定位视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.threshold, 1.3);
    assert.equal(posts[0].body.confidence, .4); assert.equal(posts[0].body.iou, .55);
  } finally { await fixture.close(); }
});

test('failed PatchCore and a forged clear verdict cannot produce a successful inspection', async () => {
  for (const options of [{ patchcoreFailure: true }, { pipelineTamper: true }]) {
    const { fixture, page, posts } = await setup(options);
    try {
      await page.getByLabel('待检测图片').setInputFiles(file('failure.png'));
      await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('.vision-pipeline-verdict').count(), 0);
      assert.deepEqual(posts.map(p => p.path), ['/api/quality/vision/pipeline/detect']);
    } finally { await fixture.close(); }
  }
});

test('changing the image or threshold discards a late pipeline result', async () => {
  for (const change of ['image', 'threshold']) {
    const gate = deferred();
    const { fixture, page, posts, errors } = await setup({ gate, detailsOpen: true });
    try {
      await page.getByLabel('待检测图片').setInputFiles(file('late.png'));
      await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
      await page.getByText('正在检测视觉缺陷…', { exact: true }).waitFor();
      if (change === 'image') await page.getByLabel('待检测图片').setInputFiles(file('new.png'));
      else await page.getByLabel('异常距离阈值').fill('1.3');
      gate.resolve();
      await page.getByRole('button', { name: '运行缺陷检测', exact: true }).waitFor();
      assert.equal(await page.getByAltText('缺陷定位结果').count(), 0);
      assert.equal(posts.length, 1); assert.deepEqual(errors, []);
    } finally { gate.resolve(); await fixture.close(); }
  }
});

test('held-out example enters the fixed pipeline without sending ground truth', async () => {
  const dataset = { name: '塑料齿轮测试数据', normal_count: 0, samples: [{ sample_id: 'endface123', filename: 'endface123.png', defect_labels: ['darkspot'] }] };
  const { fixture, page, posts } = await setup({ dataset, detailsOpen: true });
  try {
    await page.getByRole('button', { name: '加载齿轮测试图片' }).click();
    await page.getByText('已加载齿轮独立测试图片', { exact: false }).waitFor();
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('已定位视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.image_source, 'public_gear_reference');
    assert.equal(posts[0].body.patchcore_model_id, 'patchcore-gear');
    assert.equal(posts[0].body.ground_truth, undefined); assert.equal(posts[0].body.defect_labels, undefined);
  } finally { await fixture.close(); }
});

for (const [pipelineCase, message] of [
  ['clear', '本图未检出异常，已跳过 YOLO 定位。'],
  ['known_defect', 'PatchCore 检出异常，YOLO 已定位并识别缺陷类别。'],
  ['unknown_anomaly', 'PatchCore 检出异常，YOLO 未识别到已知缺陷；保留异常结论，待人工复核。'],
  ['localization_failed', 'PatchCore 检出异常，YOLO 定位失败；保留异常结论，待人工复核。'],
]) test('pipeline displays its gated outcome: ' + pipelineCase, async () => {
  const { fixture, page, posts, errors } = await setup({ models: [gearPreset, yolo], pipelineCase, detailsOpen: false });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('pipeline.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText(message, { exact: true }).waitFor();
    assert.deepEqual(posts.map(p => p.path), ['/api/quality/vision/pipeline/detect']);
    assert.equal(posts[0].body.patchcore_model_id, gearPreset.model_id);
    assert.equal(posts[0].body.algorithm, undefined);
    assert.equal(await page.getByAltText('PatchCore 异常热力图').count(), 1);
    const assessment = page.getByRole('region', {name:'视觉问题分类与处置',exact:true});
    assert.match(await assessment.textContent(), /质检 Agent 已接入/);
    if (pipelineCase === 'known_defect') assert.match(await assessment.textContent(), /返工评估/);
    if (['unknown_anomaly', 'localization_failed'].includes(pipelineCase)) assert.match(await assessment.textContent(), /隔离待复核/);
    if (pipelineCase === 'known_defect') {
      await page.getByRole('cell', { name: 'scratch', exact: true }).waitFor();
      await mkdir('output/quality-fixed-models', { recursive: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.addStyleTag({ path: 'frontend/monitor-react/src/styles.css' });
      await page.locator('.quality-workspace').screenshot({ path: 'output/quality-fixed-models/desktop.png' });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.locator('.quality-workspace').screenshot({ path: 'output/quality-fixed-models/mobile.png' });
    }
    await page.getByLabel('待检测图片').setInputFiles(file('new-image.png'));
    assert.equal(await page.getByText(message, { exact: true }).count(), 0);
    assert.equal(await assessment.count(),0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('file read failure is visible and does not reuse the previous image', async () => {
  const { fixture, page } = await setup();
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('first.png'));
    await page.getByAltText('待检测原图').waitFor();
    await page.evaluate(() => { FileReader.prototype.readAsDataURL = function () { queueMicrotask(() => this.onerror(new Event('error'))); }; });
    await page.getByLabel('待检测图片').setInputFiles(file('unreadable.png'));
    await page.getByRole('alert').getByText('图片读取失败', { exact: false }).waitFor();
    assert.equal(await page.getByAltText('待检测原图').count(), 0);
    assert.equal(await page.getByRole('button', { name: '运行缺陷检测', exact: true }).isDisabled(), true);
  } finally { await fixture.close(); }
});
