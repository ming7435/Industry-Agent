import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const image = 'data:image/png;base64,' + png;
const file = name => ({ name, mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
const model = { model_id: 'PC-normal', algorithm: 'patchcore', name: '正常轴套', sample_count: 2, memory_size: 20, suggested_threshold: 1 };
const preset = { ...model, model_id: 'patchcore-demo', name: 'PatchCore 合成纹理演示', read_only: true, demo: true,
  description: '用合成纹理展示异常定位流程，不适用于真实产品质量判定。', source_url: 'https://example.org/patchcore', classes: ['anomaly'] };
const gearPreset = { ...model, model_id: 'patchcore-gear', name: '齿轮正常记忆库', read_only: true,
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

const calibrated = body => {
  const normal_count = body.normal_images.length, defect_count = body.defect_images.length;
  const metrics = (fn, fp) => ({ tp: defect_count - fn, fn, tn: normal_count - fp, fp, fnr: fn / defect_count, fpr: fp / normal_count });
  const strategies = { recall_priority: { threshold: 0.75, metrics: metrics(0, 1) }, balanced: { threshold: 1.1, metrics: metrics(0, 0) }, zero_fp: { threshold: 1.2, metrics: metrics(1, 0) } };
  return { ...model, model_id: body.model_id, suggested_threshold: strategies[body.policy].threshold, calibration_required: false, threshold_method: 'independent_labeled_calibration',
    calibration: { policy: body.policy, normal_count, defect_count, created_at: '2026-10-19T04:00:00Z', strategies } };
};

async function setup({ models = [model], gate, calibrationGate, malformed = false, malformedCalibration = false, patchcoreFailure = false,
  patchcoreReady = true, legacyReceipt = null, yoloReady = true, modelWarnings = [], dataset = null } = {}) {
  const fixture = await centerFixture({ withStyles: true }), page = await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const posts = [], gets = [], errors = [];
  let trainedModel, nextInspection = 0;
  const nextId = () => 'VI-' + (++nextInspection).toString(16).padStart(32, '0');
  if (legacyReceipt) await page.addInitScript(receipt => { sessionStorage.setItem('quality-sequential:U-vision', JSON.stringify(receipt)); }, legacyReceipt);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/team/me') return respond(route, { user: { user_id: 'U-vision', role: 'technician' } });
    if (path === '/api/quality/vision/capabilities') return respond(route, {
      algorithms: [{ id: 'patchcore', name: 'PatchCore', available: patchcoreReady, can_train: true, reason: patchcoreReady ? '' : 'PatchCore 模型不可用' },
        { id: 'yolo', name: 'YOLO', available: yoloReady, can_train: false, reason: yoloReady ? '' : '尚未配置缺陷检测权重' }],
      models, model_warnings: modelWarnings, dataset, limits: { max_image_bytes: 4194304, max_training_images: 24 },
    });
    if (path.startsWith('/api/quality/vision/dataset/samples/')) return respond(route, {
      sample_id: 'endface123', filename: 'endface123.png', image, defect_labels: ['darkspot'],
    });
    if (path === '/api/quality/vision/patchcore/train') { const body = route.request().postDataJSON(); posts.push({ path, body }); trainedModel = { ...model, preprocessing: body.preprocessing, pipeline_version: 2 }; return respond(route, trainedModel); }
    if (path === '/api/quality/vision/patchcore/calibrate') {
      const body = route.request().postDataJSON(); posts.push({ path, body });
      if (calibrationGate) await calibrationGate.promise;
      const value = { ...(trainedModel || models.find(item => item.model_id === body.model_id)), ...calibrated(body) };
      if (malformedCalibration) value.calibration.normal_count = 99;
      return respond(route, value);
    }
    if (path === '/api/quality/vision/detect') {
      const body = route.request().postDataJSON(); posts.push({ path, body });
      if (gate) await gate.promise;
      if (patchcoreFailure && body.algorithm === 'patchcore') return respond(route, { detail: 'PatchCore 模型不可用' }, 503);
      const value = result(body, nextId());
      if (malformed) Object.assign(value, { status: 'clear', defects: [], annotated_image: '' });
      return respond(route, value);
    }
    if (path === '/api/quality/vision/sequential/fuse') {
      posts.push({ path, body: route.request().postDataJSON() });
      return respond(route, { detail: 'Unexpected sequential request in independent mode' }, 409);
    }
    if (path.startsWith('/api/quality/vision/inspections/')) {
      gets.push(path);
      return respond(route, { detail: 'Legacy sequential history must not be restored automatically' }, 404);
    }
    return respond(route, { items: [], devices: [], runs: [], enabled: true });
  });
  await page.goto(fixture.base + '/?view=quality');
  return { fixture, page, posts, gets, errors };
}

test('two models expose only independent selection and never a sequential entry or output', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [model, yolo] });
  try {
    await page.getByLabel('检测记忆库', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '运行 PatchCore → YOLO11', exact: true }).count(), 0);
    assert.equal(await page.getByRole('region', { name: '顺序联合检测结果', exact: true }).count(), 0);
    assert.equal(await page.getByLabel('联合检测PatchCore记忆库', { exact: true }).count(), 0);
    assert.equal(await page.getByLabel('联合检测YOLO模型', { exact: true }).count(), 0);
    assert.deepEqual(posts, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('independent PatchCore and YOLO selections each run only their selected model', async () => {
  const recommended = { ...yolo, recommended_confidence: .4, recommended_iou: .55 };
  const { fixture, page, posts, errors } = await setup({ models: [model, recommended] });
  try {
    const output = page.getByRole('region', { name: '视觉检测结果', exact: true });
    await page.getByLabel('待检测图片').setInputFiles(file('independent-gear.png'));
    await page.getByLabel('视觉检测算法').selectOption('patchcore');
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await output.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].path, '/api/quality/vision/detect');
    assert.equal(posts[0].body.algorithm, 'patchcore');
    assert.equal(posts[0].body.model_id, model.model_id);
    assert.equal(posts[0].body.threshold, model.suggested_threshold);
    assert.equal(await output.getByAltText('PatchCore 异常热力图').count(), 1);
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    assert.equal(await output.getByText('检出视觉缺陷', { exact: true }).count(), 0);
    assert.equal(await output.getByAltText('PatchCore 异常热力图').count(), 0);
    assert.equal(posts.length, 1, 'changing selection must not automatically run inference');
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await output.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts.length, 2);
    assert.equal(posts[1].path, '/api/quality/vision/detect');
    assert.equal(posts[1].body.algorithm, 'yolo');
    assert.equal(posts[1].body.model_id, recommended.model_id);
    assert.equal(posts[1].body.confidence, .4);
    assert.equal(posts[1].body.iou, .55);
    assert.equal(await output.getByAltText('PatchCore 异常热力图').count(), 0);
    assert.equal(await output.getByAltText('缺陷定位结果').count(), 1);
    await page.getByLabel('视觉检测算法').selectOption('patchcore');
    assert.equal(await output.getByText('检出视觉缺陷', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

for (const selected of ['patchcore', 'yolo']) test(`unavailable other model does not block independent ${selected} detection`, async () => {
  const { fixture, page, posts, errors } = await setup({ models: [model, yolo], patchcoreReady: selected === 'patchcore', yoloReady: selected === 'yolo' });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('gear.png'));
    await page.getByLabel('视觉检测算法').selectOption(selected);
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.deepEqual(posts.map(item => [item.path, item.body.algorithm]), [['/api/quality/vision/detect', selected]]);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

for (const receipt of [
  { patchcore_inspection_id: 'VI-' + 'a'.repeat(32), yolo_inspection_id: 'VI-' + 'b'.repeat(32) },
  { inspection_id: 'VI-' + 'c'.repeat(32) },
]) test(`legacy sequential ${receipt.inspection_id ? 'saved' : 'pending'} receipt neither restores nor blocks independent detection`, async () => {
  const { fixture, page, posts, gets, errors } = await setup({ models: [model, yolo], legacyReceipt: receipt });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('current-gear.png'));
    await page.getByText('待检测：current-gear.png', { exact: true }).waitFor();
    const run = page.getByRole('button', { name: '运行缺陷检测', exact: true });
    assert.equal(await run.isEnabled(), true);
    assert.equal(await page.getByRole('button', { name: '重试保存联合结果', exact: true }).count(), 0);
    assert.equal(await page.getByRole('region', { name: '顺序联合检测结果', exact: true }).count(), 0);
    await run.click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.deepEqual(posts.map(item => item.path), ['/api/quality/vision/detect']);
    assert.deepEqual(gets, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('PatchCore failure does not invoke YOLO automatically and explicit YOLO selection remains usable', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [model, yolo], patchcoreFailure: true });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('gear.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByRole('alert').getByText('PatchCore 模型不可用', { exact: false }).waitFor();
    assert.deepEqual(posts.map(item => item.body.algorithm), ['patchcore']);
    assert.equal(await page.getByText('检出视觉缺陷', { exact: true }).count(), 0);
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    assert.equal(posts.length, 1);
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.deepEqual(posts.map(item => item.body.algorithm), ['patchcore', 'yolo']);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('read-only PatchCore preset can detect and personal models retain calibration', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [preset, model] });
  try {
    await page.getByText(preset.description, { exact: true }).waitFor();
    assert.equal(await page.getByLabel('检测记忆库', { exact: true }).inputValue(), 'patchcore-demo');
    assert.match(await page.getByTestId('readonly-model-note').textContent(), /只读.*正常图片.*校准/);
    assert.equal(await page.getByRole('button', { name: '校准并应用阈值', exact: true }).count(), 0);
    await page.getByLabel('待检测图片').setInputFiles(file('synthetic.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.model_id, 'patchcore-demo');
    await page.getByLabel('检测记忆库', { exact: true }).selectOption('PC-normal');
    assert.equal(await page.getByText('使用独立图片校准阈值', { exact: true }).count(), 1);
    assert.equal(await page.getByTestId('readonly-model-note').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('gear memory still lets a user create a personal normal-image bank', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [gearPreset] });
  try {
    await page.getByText(gearPreset.description, { exact: true }).waitFor();
    assert.equal(await page.getByLabel('检测记忆库', { exact: true }).inputValue(), gearPreset.model_id);
    await page.getByText('新建自己的正常样本记忆库（可选）', { exact: true }).click();
    await page.getByLabel('正常训练样本').setInputFiles([file('own-normal-a.png'), file('own-normal-b.png')]);
    await page.getByRole('button', { name: '建立正常样本记忆库', exact: true }).click();
    await page.getByText('记忆库已建立', { exact: false }).waitFor();
    assert.equal(posts[0].path, '/api/quality/vision/patchcore/train');
    assert.equal(await page.getByLabel('检测记忆库', { exact: true }).inputValue(), model.model_id);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('preset synthetic calibration is explicitly labeled and does not block loading other models', async () => {
  const saved = calibrated({ model_id: preset.model_id, policy: 'balanced', normal_images: [image, image], defect_images: [image] });
  const synthetic = { ...saved, ...preset, suggested_threshold: saved.suggested_threshold, threshold_method: 'independent_labeled_synthetic_calibration',
    calibration: { ...saved.calibration, scope: 'synthetic_calibration_only' } };
  const { fixture, page, errors } = await setup({ models: [synthetic, yolo] });
  try {
    await page.getByText('合成校准集漏检率', { exact: true }).waitFor();
    assert.match(await page.getByTestId('synthetic-calibration-note').textContent(), /合成.*不代表真实/);
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1.1');
    assert.equal(await page.getByRole('button', { name: '校准并应用阈值', exact: true }).count(), 0);
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    await page.getByText(yolo.description, { exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('available YOLO catalog model is selected by default with its source and covered classes', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [yolo] });
  try {
    await page.getByText(yolo.description, { exact: true }).waitFor();
    assert.equal(await page.getByLabel('视觉检测算法', { exact: true }).inputValue(), 'yolo');
    assert.equal(await page.getByLabel('检测模型', { exact: true }).inputValue(), 'yolo-default');
    const source = page.getByRole('link', { name: '模型来源', exact: true });
    assert.equal(await source.getAttribute('href'), yolo.source_url);
    for (const label of yolo.classes) assert.equal(await page.getByTestId('model-classes').getByText(label, { exact: true }).count(), 1);
    await page.getByLabel('待检测图片').setInputFiles(file('steel.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.algorithm, 'yolo');
    assert.equal(posts[0].body.model_id, 'yolo-default');
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('YOLO recommended settings are applied, edits survive algorithm switching, and reset reaches inference', async () => {
  const recommended = { ...yolo, recommended_confidence: .4, recommended_iou: .55, calibration_scope: 'synthetic_calibration_only' };
  const { fixture, page, posts, errors } = await setup({ models: [model, recommended] });
  try {
    await page.getByLabel('检测记忆库', { exact: true }).selectOption(model.model_id);
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    assert.equal(await page.getByLabel('置信度阈值', { exact: true }).inputValue(), '0.4');
    assert.equal(await page.getByLabel('NMS IoU 阈值', { exact: true }).inputValue(), '0.55');
    await page.getByLabel('置信度阈值', { exact: true }).fill('0.65');
    await page.getByLabel('视觉检测算法').selectOption('patchcore');
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    assert.equal(await page.getByLabel('置信度阈值', { exact: true }).inputValue(), '0.65');
    await page.getByRole('button', { name: '应用模型建议参数', exact: true }).click();
    await page.getByLabel('待检测图片').setInputFiles(file('synthetic-low-contrast.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.confidence, .4);
    assert.equal(posts[0].body.iou, .55);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('held-out real gear example loads into ordinary detection without sending ground truth', async () => {
  const dataset = { name: '真实塑料齿轮研究子集', normal_count: 0, samples: [
    { sample_id: 'endface123', filename: 'endface123.png', defect_labels: ['darkspot'] },
  ] };
  const { fixture, page, posts, errors } = await setup({ models: [yolo], dataset });
  try {
    await page.getByRole('button', { name: '加载齿轮测试图片', exact: true }).click();
    await page.getByText('已加载真实齿轮独立测试图片', { exact: false }).waitFor();
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts[0].body.filename, 'endface123.png');
    assert.equal(posts[0].body.image, image);
    assert.equal(posts[0].body.ground_truth, undefined);
    assert.equal(posts[0].body.defect_labels, undefined);
    assert.equal(posts[0].body.part_id, undefined);
    assert.match(await page.getByText('当前是公开数据集的参考齿轮图片', { exact: false }).textContent(), /不关联当前工件身份/);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('YOLO engine without catalog weights cannot detect until a refresh loads a model', async () => {
  const models = [], { fixture, page, posts } = await setup({ models });
  try {
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    await page.getByLabel('待检测图片').setInputFiles(file('steel.png'));
    assert.equal(await page.getByRole('button', { name: '运行缺陷检测', exact: true }).isDisabled(), true);
    assert.equal(await page.getByText('YOLO 缺陷权重就绪', { exact: true }).count(), 0);
    models.push(yolo);
    await page.getByRole('button', { name: '刷新模型状态', exact: true }).click();
    await page.getByText(yolo.description, { exact: true }).waitFor();
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.model_id, 'yolo-default');
  } finally { await fixture.close(); }
});

test('catalog warnings are visible without blocking personal model training', async () => {
  const { fixture, page } = await setup({ models: [], modelWarnings: ['预置模型不可用，请上传正常图片建立自己的模型。'] });
  try {
    await page.getByText('预置模型不可用，请上传正常图片建立自己的模型。', { exact: true }).waitFor();
    await page.getByText('新建自己的正常样本记忆库（可选）', { exact: true }).click();
    await page.getByLabel('正常训练样本').setInputFiles([file('normal-a.png'), file('normal-b.png')]);
    await page.getByText(/已读取 2 张正常样本/).waitFor();
    assert.equal(await page.getByRole('button', { name: '建立正常样本记忆库', exact: true }).isEnabled(), true);
  } finally { await fixture.close(); }
});

test('normal samples build PatchCore memory and inspect uploaded pixels without a CAD selection', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [] });
  try {
    const panel = page.getByRole('region', { name: '视觉缺陷检测', exact: true });
    await panel.getByText('新建自己的正常样本记忆库（可选）', { exact: true }).click();
    await panel.getByLabel('正常训练样本').setInputFiles([file('normal-a.png'), file('normal-b.png')]);
    await panel.getByLabel('记忆库名称').fill('正常轴套');
    await panel.getByRole('button', { name: '建立正常样本记忆库', exact: true }).click();
    await panel.getByText('记忆库已建立', { exact: false }).waitFor();
    await panel.getByLabel('待检测图片').setInputFiles(file('query.png'));
    await panel.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    const output = panel.getByRole('region', { name: '视觉检测结果', exact: true });
    await output.getByText('检出视觉缺陷', { exact: true }).waitFor();
    assert.equal(await output.getByAltText('缺陷定位结果').count(), 1);
    assert.equal(await output.getByAltText('PatchCore 异常热力图').count(), 1);
    assert.match(await output.textContent(), /anomaly/);
    assert.equal(posts[0].body.images.length, 2);
    assert.equal(posts[1].body.image, image);
    assert.equal(posts[1].body.model_id, 'PC-normal');
    assert.equal(posts[1].body.part_id, undefined);
    assert.equal(posts[1].body.threshold, 1);
    assert.deepEqual(errors, []);
    if (process.env.QUALITY_VISION_SCREENSHOT) await panel.screenshot({ path: process.env.QUALITY_VISION_SCREENSHOT });
  } finally { await fixture.close(); }
});

test('training saves preprocessing and independent calibration applies a checked threshold', async () => {
  const { fixture, page, posts, errors } = await setup({ models: [] });
  try {
    await page.getByText('新建自己的正常样本记忆库（可选）', { exact: true }).click();
    await page.getByLabel('特征提取分辨率').selectOption('448');
    await page.getByLabel('缩放方式', { exact: true }).selectOption('letterbox');
    await page.getByLabel('对比度处理').selectOption('clahe');
    await page.getByLabel('热力图平滑 σ').fill('2');
    await page.getByLabel('正常训练样本').setInputFiles([file('train-a.png'), file('train-b.png')]);
    await page.getByRole('button', { name: '建立正常样本记忆库', exact: true }).click();
    await page.getByText('记忆库已建立', { exact: false }).waitFor();
    assert.deepEqual(posts[0].body.preprocessing, { input_size: 448, resize_mode: 'letterbox', contrast: 'clahe', blur_sigma: 2 });
    assert.match(await page.getByTestId('saved-preprocessing').textContent(), /448.*等比.*CLAHE.*2/);
    await page.getByLabel('待检测图片').setInputFiles(file('before-calibration.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByText('检出视觉缺陷', { exact: true }).waitFor();
    await page.getByText('使用独立图片校准阈值', { exact: true }).click();
    await page.getByLabel('正常校准图片').setInputFiles([file('normal-a.png'), file('normal-b.png')]);
    await page.getByLabel('缺陷校准图片').setInputFiles(file('defect.png'));
    await page.getByLabel('阈值策略').selectOption('balanced');
    await page.getByRole('button', { name: '校准并应用阈值', exact: true }).click();
    await page.getByText('阈值已校准', { exact: false }).waitFor();
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1.1');
    assert.equal(posts[2].body.policy, 'balanced');
    assert.equal(posts[2].body.normal_images.length, 2);
    assert.equal(posts[2].body.defect_images.length, 1);
    assert.equal(await page.getByText('校准集漏检率', { exact: true }).count(), 1);
    assert.equal(await page.getByText('校准集误检率', { exact: true }).count(), 1);
    assert.equal(await page.getByText('漏检 0 / 缺陷 1', { exact: true }).count(), 1);
    assert.match(await page.getByTestId('saved-preprocessing').textContent(), /448.*等比.*CLAHE.*2/);
    assert.equal(await page.getByText('检出视觉缺陷', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    if (process.env.QUALITY_CALIBRATION_SCREENSHOT) await page.getByRole('region', { name: '视觉缺陷检测', exact: true }).screenshot({ path: process.env.QUALITY_CALIBRATION_SCREENSHOT });
  } finally { await fixture.close(); }
});

test('initial model loads saved threshold and refresh preserves a manual value with a scope note', async () => {
  const saved = calibrated({ model_id: model.model_id, policy: 'balanced', normal_images: [image, image], defect_images: [image] });
  const { fixture, page, errors } = await setup({ models: [saved] });
  try {
    await page.getByText('已保存阈值策略', { exact: false }).waitFor();
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1.1');
    await page.getByLabel('异常距离阈值').fill('1.8');
    await page.getByText('当前检测阈值已手动修改为 1.8', { exact: false }).waitFor();
    await page.getByRole('button', { name: '刷新模型状态', exact: true }).click();
    await page.getByText('特征提取模型就绪', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1.8');
    assert.match(await page.getByText('当前检测阈值已手动修改为 1.8', { exact: false }).textContent(), /保存阈值 1.1/);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('late calibration cannot replace another model policy or input image context', async () => {
  for (const change of ['model', 'policy', 'image']) {
    const calibrationGate = deferred(), { fixture, page } = await setup({ calibrationGate, models: [model, { ...model, model_id: 'PC-next', name: '另一记忆库', suggested_threshold: 2 }] });
    try {
      await page.getByText('新建自己的正常样本记忆库（可选）', { exact: true }).click();
      await page.getByText('使用独立图片校准阈值', { exact: true }).click();
      await page.getByLabel('正常校准图片').setInputFiles([file('normal-a.png'), file('normal-b.png')]);
      await page.getByLabel('缺陷校准图片').setInputFiles(file('defect.png'));
      await page.getByRole('button', { name: '校准并应用阈值', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-vision-busy="calibrate"]'));
      if (change === 'model') await page.getByLabel('检测记忆库', { exact: true }).selectOption('PC-next');
      else if (change === 'policy') await page.getByLabel('阈值策略').selectOption('zero_fp');
      else await page.getByLabel('待检测图片').setInputFiles(file('new-input.png'));
      calibrationGate.resolve();
      await page.waitForFunction(() => !document.querySelector('[data-vision-busy="calibrate"]'));
      assert.equal(await page.getByLabel('异常距离阈值').inputValue(), change === 'model' ? '2' : '1');
      assert.equal(await page.getByText('阈值已校准', { exact: false }).count(), 0);
      assert.equal(await page.getByText('校准集漏检率', { exact: true }).count(), 0);
    } finally { calibrationGate.resolve(); await fixture.close(); }
  }
});

test('contradictory calibration counts cannot change the active threshold', async () => {
  const { fixture, page } = await setup({ malformedCalibration: true });
  try {
    await page.getByText('新建自己的正常样本记忆库（可选）', { exact: true }).click();
    await page.getByText('使用独立图片校准阈值', { exact: true }).click();
    await page.getByLabel('正常校准图片').setInputFiles([file('normal-a.png'), file('normal-b.png')]);
    await page.getByLabel('缺陷校准图片').setInputFiles(file('defect.png'));
    await page.getByRole('button', { name: '校准并应用阈值', exact: true }).click();
    await page.getByRole('alert').getByText('阈值校准结果无效', { exact: false }).waitFor();
    assert.equal(await page.getByLabel('异常距离阈值').inputValue(), '1');
    assert.equal(await page.getByText('阈值已校准', { exact: false }).count(), 0);
  } finally { await fixture.close(); }
});

test('missing model or YOLO weights cannot produce a successful detection', async () => {
  const { fixture, page, posts } = await setup({ models: [], yoloReady: false });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('query.png'));
    assert.equal(await page.getByRole('button', { name: '运行缺陷检测', exact: true }).isDisabled(), true);
    await page.getByLabel('视觉检测算法').selectOption('yolo');
    await page.getByText('尚未配置缺陷检测权重', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: '运行缺陷检测', exact: true }).isDisabled(), true);
    assert.equal(await page.getByText('未检出视觉缺陷', { exact: true }).count(), 0);
    assert.deepEqual(posts, []);
  } finally { await fixture.close(); }
});

test('changing algorithm or image discards a late detection result', async () => {
  for (const change of ['algorithm', 'image']) {
    const gate = deferred(), { fixture, page, posts } = await setup({ gate });
    try {
      await page.getByLabel('待检测图片').setInputFiles(file('query.png'));
      await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-vision-busy="detect"]'));
      if (change === 'algorithm') await page.getByLabel('视觉检测算法').selectOption('yolo');
      else await page.getByLabel('待检测图片').setInputFiles(file('replacement.png'));
      gate.resolve();
      await page.getByRole('button', { name: '运行缺陷检测', exact: true }).waitFor();
      assert.equal(await page.getByText('检出视觉缺陷', { exact: true }).count(), 0);
      assert.equal(await page.getByAltText('缺陷定位结果').count(), 0);
      assert.equal(posts.length, 1);
    } finally { gate.resolve(); await fixture.close(); }
  }
});

test('malformed clear result is shown as an error instead of a successful inspection', async () => {
  const { fixture, page } = await setup({ malformed: true });
  try {
    await page.getByLabel('待检测图片').setInputFiles(file('query.png'));
    await page.getByRole('button', { name: '运行缺陷检测', exact: true }).click();
    await page.getByRole('alert').getByText('视觉检测结果不完整', { exact: false }).waitFor();
    assert.equal(await page.getByText('未检出视觉缺陷', { exact: true }).count(), 0);
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
