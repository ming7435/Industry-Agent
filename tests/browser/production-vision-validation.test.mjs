import test from 'node:test';
import assert from 'node:assert/strict';
import { virtualFixture } from './helpers/virtual-fixture.mjs';
import { respond, deferred } from './helpers/center-fixture.mjs';

const hex = value => value.repeat(64);
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const actor = { user_id: 'U1', role: 'technician' };
const entry = `import React from 'react';
import { createRoot } from 'react-dom/client';
import Panel from './ProductionVisionValidation.jsx';
import { getTeamSession, setTeamSessionActor } from '../teamSession.mjs';
setTeamSessionActor(${JSON.stringify(actor)});
createRoot(document.getElementById('root')).render(<Panel auth={getTeamSession()} checked={true}/>);`;

function productionJob(suffix, batch) {
  const job = {
    job_id: 'SIM-JOB-' + hex(suffix), part_id: 'SIM-PART-' + hex(suffix), actor_id: actor.user_id,
    design_run_id: 'FC-' + hex('c'), design_digest: hex('d'), program_digest: hex('e'),
    batch_id: batch, status: 'completed', sync_status: 'confirmed', revision: 4, progress: 1,
    source: 'factory-simulation', simulation_only: true, created_at: 1792382400,
    material: '模拟钢材', setup: { stock_diameter_mm: 24 },
  };
  job.output = {
    job_id: job.job_id, part_id: job.part_id, design_run_id: job.design_run_id,
    design_digest: job.design_digest, program_digest: job.program_digest, output_digest: hex(suffix),
    source: 'factory-simulation', synthetic: true, simulation_only: true, units: 'mm',
    dimensions: { diameter_mm: 20, length_mm: 10 },
  };
  return job;
}

const first = productionJob('a', 'BATCH-FIRST'), second = productionJob('b', 'BATCH-SECOND');

function validationRecord(job, requestId = '22222222-2222-4222-8222-222222222222') {
  const source = {
    job_id: job.job_id, part_id: job.part_id, design_run_id: job.design_run_id, design_digest: job.design_digest,
    program_digest: job.program_digest, batch_id: job.batch_id, actor_id: job.actor_id,
    output_digest: job.output.output_digest, source: 'factory-simulation', synthetic: true, simulation_only: true,
  };
  const scenarios = ['normal', 'obvious_scratch', 'low_contrast'].map((scenario, index) => {
    const imageDigest = hex(String(index + 1));
    const results = ['patchcore', 'yolo'].map(algorithm => {
      const detected = scenario !== 'normal' && (algorithm === 'patchcore' || scenario === 'obvious_scratch');
      const score = detected ? algorithm === 'patchcore' ? 1.5 : 0.9 : algorithm === 'patchcore' ? 0.5 : 0;
      const threshold = algorithm === 'patchcore' ? 1 : 0.25;
      const model = { model_id: algorithm === 'patchcore' ? 'patchcore-demo' : 'yolo-default', algorithm,
        name: algorithm === 'patchcore' ? '保存的 PatchCore 模型' : '保存的 YOLO 模型', read_only: true,
        ...(algorithm === 'patchcore' ? { sample_count: 2, memory_size: 20, suggested_threshold: 1 } : {}),
      };
      return {
        inspection_id: 'VIS-' + algorithm + '-' + scenario + '-' + job.job_id.slice(-1),
        created_at: '2026-10-19T04:00:00Z', algorithm, model_id: model.model_id, model,
        model_sha256: hex(algorithm === 'patchcore' ? '6' : '7'), part_id: job.part_id,
        filename: scenario + '.png', image_sha256: imageDigest, image_digest_format: 'rgb-pixels-v1',
        parameters: { threshold: algorithm === 'patchcore' ? 1 : null, confidence: 0.25, iou: 0.45 },
        status: detected ? 'defect' : 'clear', score, threshold, image: { width: 1, height: 1 },
        defects: detected ? [{ label: algorithm === 'patchcore' ? 'anomaly' : 'scratches',
          confidence: algorithm === 'patchcore' ? null : score, bbox: [0, 0, 1, 1] }] : [],
        annotated_image: image, ...(algorithm === 'patchcore' ? { heatmap_image: image } : {}),
        steps: [{ name: '图像推理', status: 'completed', detail: '使用保存模型完成推理' }],
        source_context: { source, scenario },
      };
    });
    return { scenario, label: scenario === 'normal' ? 'normal' : 'defect',
      input_image: image, mask_image: image, image_sha256: imageDigest, results };
  });
  return {
    run_id: 'PV-' + job.job_id.slice(-32), request_id: requestId, status: 'completed', created_at: '2026-10-19T04:00:00Z',
    source, generator: { scope: 'synthetic_pipeline_only', version: 'production-texture-v1' },
    parameter_inspection: { ...source, check_id: 'CHECK-' + job.job_id.slice(-8), status: 'pass', items: [] },
    scenarios, metrics: { patchcore: { tp: 2, fn: 0, tn: 1, fp: 0 }, yolo: { tp: 1, fn: 1, tn: 1, fp: 0 } },
  };
}

async function setup({ queryJob = second.job_id, onLatest, onCapabilities, pending, jobs = [first, second] } = {}) {
  const fixture = await virtualFixture(entry), page = await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const posts = [], reads = [], errors = [], saved = new Map();
  page.on('pageerror', error => errors.push(error.message));
  if (pending) await page.addInitScript(value => {
    sessionStorage.setItem(`quality.production-vision.pending:U1:${value.job_id}`, JSON.stringify(value));
  }, pending);
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    reads.push({ path, method: request.method() });
    if (path === '/api/team/me') return respond(route, { user: actor });
    if (path === '/api/quality/vision/capabilities') {
      return onCapabilities ? onCapabilities(route) : respond(route, { data_mode: 'synthetic' });
    }
    if (path === '/api/production/virtual/jobs') return respond(route, { items: jobs, next_cursor: null });
    if (path.startsWith('/api/production/virtual/jobs/')) {
      const job = jobs.find(value => path.endsWith(value.job_id));
      return respond(route, job || { detail: '未找到生产任务' }, job ? 200 : 404);
    }
    if (path === '/api/quality/vision/production/verify') {
      const body = request.postDataJSON();
      posts.push(body);
      return respond(route, { detail: '双模型合成验证已停用' }, 410);
    }
    const latest = path.match(/^\/api\/quality\/vision\/production\/jobs\/(.+)\/latest$/);
    if (latest) {
      if (onLatest) return onLatest({ route, jobId: latest[1], saved });
      return respond(route, { run: saved.get(latest[1]) || null });
    }
    return respond(route, { detail: '测试未配置该接口：' + path }, 404);
  });
  await page.goto(fixture.base + '/?view=quality&production_job_id=' + encodeURIComponent(queryJob));
  const panel = page.getByRole('region', { name: '生产产出视觉流程验证', exact: true });
  return { fixture, page, panel, posts, reads, errors, saved };
}

test('saved spatial evidence distinguishes a missed defect from an alarm at the wrong position', async () => {
  const record = validationRecord(second), header = { method: 'label_agnostic_bbox_iou', iou_threshold: .5 };
  record.localization_metrics = { ...header, patchcore: { tp: 2, fn: 0, fp: 0, ground_truth_count: 2 }, yolo: { tp: 0, fn: 2, fp: 1, ground_truth_count: 2 } };
  for (const scene of record.scenarios) {
    const normal = scene.label === 'normal';
    scene.localization = { ...header, ground_truth_boxes: normal ? [] : [[0,0,1,1]], results: {} };
    for (const result of scene.results) {
      const tp = result.algorithm === 'patchcore' && !normal ? 1 : 0;
      scene.localization.results[result.algorithm] = { tp, fn: (normal ? 0 : 1) - tp, fp: result.defects.length - tp, ground_truth_count: normal ? 0 : 1 };
    }
  }
  const { fixture, panel, errors } = await setup({ onLatest: ({ route }) => respond(route, { run: record }) });
  try {
    await panel.getByTestId('production-localization').getByText('YOLO：定位命中 0 / 2 · 定位漏检 2 · 多余框 1', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('production URL selects the matching completed output without starting verification', async () => {
  const { fixture, panel, posts, reads, errors } = await setup();
  try {
    const selected = panel.getByRole('combobox', { name: '视觉验证生产任务', exact: true });
    await selected.waitFor();
    assert.equal(await selected.inputValue(), second.job_id);
    await panel.getByRole('button', { name: '回载已保存结果', exact: true }).waitFor();
    assert.equal(await panel.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0);
    await panel.getByText('双模型合成验证已停用，仅提供历史记录查看。', { exact: true }).waitFor();
    assert.equal(posts.length, 0);
    assert.ok(reads.some(value => value.path.endsWith('/jobs/' + second.job_id + '/latest')));
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('saved historical results reload both algorithms as read-only evidence without any POST', async () => {
  const { fixture, page, panel, posts, reads, errors } = await setup({
    onLatest: ({ route }) => respond(route, { run: validationRecord(second) }),
  });
  try {
    const record = panel.getByTestId('production-validation-record');
    await record.getByText(validationRecord(second).run_id, { exact: false }).waitFor();
    assert.equal(posts.length, 0);
    assert.equal(await panel.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0);
    const comparison = panel.getByTestId('production-validation-comparison');
    assert.match(await comparison.textContent(), /PatchCore/);
    assert.match(await comparison.textContent(), /YOLO/);
    for (const scenario of ['normal', 'obvious_scratch', 'low_contrast']) {
      assert.equal(await panel.getByTestId('production-scenario-' + scenario).count(), 1);
    }
    const latestReads = () => reads.filter(value => value.path.endsWith('/jobs/' + second.job_id + '/latest')).length;
    const beforeReload = latestReads();
    await page.reload();
    await panel.getByTestId('production-validation-record').getByText(validationRecord(second).run_id, { exact: false }).waitFor();
    assert.ok(latestReads() > beforeReload);
    assert.equal(posts.length, 0);
    await panel.getByRole('button', { name: '回载已保存结果', exact: true }).click();
    await panel.getByTestId('production-validation-record').getByText(validationRecord(second).run_id, { exact: false }).waitFor();
    assert.equal(posts.length, 0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('late history response cannot overwrite a newly selected production task', async () => {
  const gate = deferred(), delivered = deferred(), started = deferred();
  const firstResult = validationRecord(first), secondResult = validationRecord(second);
  const { fixture, page, panel, posts, errors } = await setup({ queryJob: first.job_id,
    onLatest: async ({ route, jobId }) => {
      if (jobId === second.job_id) return respond(route, { run: secondResult });
      started.resolve();
      await gate.promise;
      try { await respond(route, { run: firstResult }); }
      finally { delivered.resolve(); }
    },
  });
  try {
    await started.promise;
    await panel.getByRole('combobox', { name: '视觉验证生产任务', exact: true }).selectOption(second.job_id);
    await panel.getByTestId('production-validation-record').getByText(secondResult.run_id, { exact: false }).waitFor();
    gate.resolve();
    await delivered.promise;
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    assert.equal(await panel.getByRole('combobox', { name: '视觉验证生产任务', exact: true }).inputValue(), second.job_id);
    const displayed = await panel.getByTestId('production-validation-record').textContent();
    assert.ok(displayed.includes(secondResult.run_id));
    assert.ok(!displayed.includes(firstResult.run_id));
    assert.equal(posts.length, 0);
    assert.equal(await panel.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0);
    assert.deepEqual(errors, []);
  } finally { gate.resolve(); await fixture.close(); }
});

test('old pending verification receipts cannot offer a retry or hide newer saved history', async () => {
  const pending = { job_id: second.job_id, request_id: '11111111-1111-4111-8111-111111111111' };
  const { fixture, page, panel, posts, errors } = await setup({
    pending,
    onLatest: ({ route }) => respond(route, { run: validationRecord(second) }),
  });
  try {
    await panel.getByTestId('production-validation-record').waitFor();
    assert.equal(await panel.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0);
    await page.reload();
    await panel.getByTestId('production-validation-record').waitFor();
    assert.equal(await panel.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0);
    assert.equal(await panel.getByRole('alert').count(), 0);
    assert.equal(posts.length, 0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('saved results with a mismatched source or image digest cannot appear as validated evidence', async () => {
  for (const field of ['source', 'image_digest']) {
    const invalid = validationRecord(second);
    if (field === 'source') invalid.source.output_digest = hex('9');
    else invalid.scenarios[1].results[1].image_sha256 = hex('9');
    const { fixture, panel, posts, errors } = await setup({
      onLatest: ({ route }) => respond(route, { run: invalid }),
    });
    try {
      await panel.getByRole('alert').filter({ hasText: /追溯|身份|摘要|不一致/ }).waitFor();
      assert.equal(await panel.getByTestId('production-validation-record').count(), 0, field);
      assert.equal(await panel.getByTestId('production-validation-comparison').count(), 0, field);
      assert.equal(posts.length, 0);
      assert.deepEqual(errors, []);
    } finally { await fixture.close(); }
  }
});

test('historical running records poll with GET and accept a newer latest record without retrying', async () => {
  const originalId = '11111111-1111-4111-8111-111111111111';
  const original = { ...validationRecord(second, originalId), status: 'running',
    parameter_inspection: null, scenarios: [],
    metrics: { patchcore: { tp: 0, fn: 0, tn: 0, fp: 0 }, yolo: { tp: 0, fn: 0, tn: 0, fp: 0 } } };
  const newer = { ...validationRecord(second), run_id: 'PV-' + '9'.repeat(32) };
  let latestReads = 0;
  const { fixture, panel, posts, errors } = await setup({
    onLatest: ({ route }) => respond(route, { run: ++latestReads === 1 ? original : newer }),
  });
  try {
    await panel.getByText('合成流程验证执行中', { exact: true }).waitFor();
    assert.equal(await panel.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0);
    await panel.getByTestId('production-validation-record').getByText(newer.run_id, { exact: false }).waitFor();
    assert.ok(latestReads >= 2);
    await panel.getByText('合成流程验证已保存', { exact: true }).waitFor();
    assert.equal(posts.length, 0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('unresolved, failed, and gear capabilities never reveal a dual-model run action', async () => {
  for (const mode of ['pending', 'failed', 'gear']) {
    const gate = deferred(), arrived = deferred();
    const { fixture, page, panel, posts, errors } = await setup({
      onCapabilities: async route => {
        arrived.resolve();
        if (mode === 'pending') { await gate.promise; return respond(route, { data_mode: 'synthetic' }); }
        return respond(route, mode === 'gear' ? { data_mode: 'gear' } : { detail: '能力读取失败' }, mode === 'gear' ? 200 : 503);
      },
    });
    try {
      await arrived.promise;
      if (mode === 'gear') await page.getByRole('region', { name: '齿轮质检', exact: true }).waitFor();
      else await panel.getByRole('button', { name: '回载已保存结果', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: /验证产线视觉流程|重试验证/ }).count(), 0, mode);
      gate.resolve();
      assert.equal(posts.length, 0, mode);
      assert.deepEqual(errors, [], mode);
    } finally { gate.resolve(); await fixture.close(); }
  }
});

test('failed validation restores saved parameter and partial image evidence with the missing algorithm marked unfinished', async () => {
  const partial = validationRecord(second);
  partial.status = 'failed';
  partial.error = '视觉验证未完成，已完成的部分结果已保留';
  partial.scenarios = [{ ...partial.scenarios[0], results: [partial.scenarios[0].results[0]] }];
  partial.metrics = { patchcore: { tp: 0, fn: 0, tn: 1, fp: 0 }, yolo: { tp: 0, fn: 0, tn: 0, fp: 0 } };
  const { fixture, panel, posts, errors } = await setup({ onLatest: ({ route }) => respond(route, { run: partial }) });
  try {
    await panel.getByText('合成流程验证未完成', { exact: true }).waitFor();
    await panel.getByText('参数比对：', { exact: false }).waitFor();
    assert.ok((await panel.textContent()).includes(partial.parameter_inspection.check_id));
    const scene = panel.getByTestId('production-scenario-normal');
    await scene.locator('summary').click();
    assert.equal(await scene.getByAltText('正常纹理合成原图', { exact: true }).isVisible(), true);
    assert.equal(await scene.getByAltText('正常纹理 PatchCore检测标注', { exact: true }).isVisible(), true);
    assert.equal(await scene.getByAltText('正常纹理 YOLO检测标注', { exact: true }).count(), 0);
    assert.match(await panel.getByTestId('production-validation-comparison').textContent(), /尚未完成/);
    assert.equal(await panel.getByText('合成流程验证已保存', { exact: true }).count(), 0);
    assert.equal(posts.length, 0);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});
