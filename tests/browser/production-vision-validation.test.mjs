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

async function setup({ queryJob = second.job_id, onVerify, onLatest, jobs = [first, second] } = {}) {
  const fixture = await virtualFixture(entry), page = await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const posts = [], reads = [], errors = [], saved = new Map();
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    reads.push({ path, method: request.method() });
    if (path === '/api/team/me') return respond(route, { user: actor });
    if (path === '/api/production/virtual/jobs') return respond(route, { items: jobs, next_cursor: null });
    if (path.startsWith('/api/production/virtual/jobs/')) {
      const job = jobs.find(value => path.endsWith(value.job_id));
      return respond(route, job || { detail: '未找到生产任务' }, job ? 200 : 404);
    }
    if (path === '/api/quality/vision/production/verify') {
      const body = request.postDataJSON();
      posts.push(body);
      if (onVerify) return onVerify({ route, body, posts, saved });
      return respond(route, { detail: '测试未配置验证结果' }, 500);
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
    await panel.getByRole('button', { name: '验证产线视觉流程（合成）', exact: true }).waitFor();
    assert.equal(posts.length, 0);
    assert.ok(reads.some(value => value.path.endsWith('/jobs/' + second.job_id + '/latest')));
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('one explicit verification persists both algorithms and reload restores it without another POST', async () => {
  const { fixture, page, panel, posts, reads, errors } = await setup({
    onVerify: async ({ route, body, saved }) => {
      const record = validationRecord(second, body.request_id);
      saved.set(body.job_id, record);
      return respond(route, record);
    },
  });
  try {
    await panel.getByRole('button', { name: '验证产线视觉流程（合成）', exact: true }).click();
    const record = panel.getByTestId('production-validation-record');
    await record.getByText(validationRecord(second).run_id, { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].job_id, second.job_id);
    assert.match(posts[0].request_id, /^[a-f0-9-]{36}$/i);
    assert.deepEqual(Object.keys(posts[0]).sort(), ['job_id', 'request_id']);
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
    assert.equal(posts.length, 1);
    await panel.getByRole('button', { name: '回载已保存结果', exact: true }).click();
    await panel.getByTestId('production-validation-record').getByText(validationRecord(second).run_id, { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('late verification response cannot overwrite a newly selected production task', async () => {
  const gate = deferred(), delivered = deferred(), started = deferred();
  const firstResult = validationRecord(first), secondResult = validationRecord(second);
  const { fixture, page, panel, posts, errors } = await setup({ queryJob: first.job_id,
    onLatest: ({ route, jobId }) => respond(route, { run: jobId === second.job_id ? secondResult : null }),
    onVerify: async ({ route, body }) => {
      started.resolve();
      await gate.promise;
      try { await respond(route, { ...firstResult, request_id: body.request_id }); }
      finally { delivered.resolve(); }
    },
  });
  try {
    await panel.getByRole('button', { name: '验证产线视觉流程（合成）', exact: true }).click();
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
    assert.equal(posts.length, 1);
    assert.equal(posts[0].job_id, first.job_id);
    assert.deepEqual(errors, []);
  } finally { gate.resolve(); await fixture.close(); }
});

test('ambiguous POST survives reload and retries the original request until its terminal result', async () => {
  const { fixture, page, panel, posts, errors } = await setup({
    onVerify: ({ route, body, posts, saved }) => {
      if (posts.length === 1) return route.abort('failed');
      const record = validationRecord(second, body.request_id);
      saved.set(body.job_id, record);
      return respond(route, record);
    },
  });
  try {
    await panel.getByRole('button', { name: '验证产线视觉流程（合成）', exact: true }).click();
    await panel.getByRole('button', { name: '按原请求重试验证', exact: true }).waitFor();
    const originalRequest = posts[0].request_id;
    assert.equal(posts.length, 1);
    await page.reload();
    await panel.getByRole('button', { name: '按原请求重试验证', exact: true }).waitFor();
    assert.equal(posts.length, 1);
    await panel.getByRole('button', { name: '按原请求重试验证', exact: true }).click();
    await panel.getByTestId('production-validation-record').waitFor();
    assert.equal(posts.length, 2);
    assert.equal(posts[1].request_id, originalRequest);
    assert.equal(posts[1].job_id, posts[0].job_id);
    const nextResponse = page.waitForResponse(response => response.url().endsWith('/api/quality/vision/production/verify'));
    await panel.getByRole('button', { name: '验证产线视觉流程（合成）', exact: true }).click();
    await nextResponse;
    assert.equal(posts.length, 3);
    assert.notEqual(posts[2].request_id, originalRequest);
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

test('a newer latest run cannot prevent retrying the original running request', async () => {
  const originalId = '11111111-1111-4111-8111-111111111111';
  const original = { ...validationRecord(second, originalId), status: 'running',
    parameter_inspection: null, scenarios: [],
    metrics: { patchcore: { tp: 0, fn: 0, tn: 0, fp: 0 }, yolo: { tp: 0, fn: 0, tn: 0, fp: 0 } } };
  const newer = { ...validationRecord(second), run_id: 'PV-' + '9'.repeat(32) };
  let latestReads = 0;
  const { fixture, panel, posts, errors } = await setup({
    onLatest: ({ route }) => respond(route, { run: ++latestReads === 1 ? original : newer }),
    onVerify: ({ route, body }) => respond(route, validationRecord(second, body.request_id)),
  });
  try {
    await panel.getByText('合成流程验证执行中', { exact: true }).waitFor();
    const retry = panel.getByRole('button', { name: '按原请求重试验证', exact: true });
    assert.equal(await retry.isDisabled(), true);
    // Let the running-record poll see the run created by another tab.
    await panel.getByRole('alert').filter({ hasText: /原请求|请求编号/ }).waitFor();
    assert.ok(latestReads >= 2);
    assert.equal(await retry.isEnabled(), true, 'the original request must remain reconcilable after latest points elsewhere');
    await retry.click();
    await panel.getByText('合成流程验证已保存', { exact: true }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].request_id, originalId);
    assert.equal(posts[0].job_id, second.job_id);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
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
