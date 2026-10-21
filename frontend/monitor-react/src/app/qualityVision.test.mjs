import test from 'node:test';
import assert from 'node:assert/strict';
import * as vision from './qualityVision.mjs';

const image = 'data:image/png;base64,aGVsbG8=';
const expected = { algorithm: 'patchcore', model_id: 'PC-1', filename: 'part.png', part_id: 'FC-1', threshold: 1 };
const valid = { ...expected, inspection_id: 'VIS-1', created_at: '2026-10-19T04:00:00Z', status: 'clear', score: 0.2,
  defects: [], image: { width: 100, height: 80 }, annotated_image: image, heatmap_image: image,
  steps: [{ name: '特征距离', status: 'completed', detail: '完成距离计算' }] };

test('a ready memory bank still needs one inspection image, not normal training samples', () => {
  const state = { userId: 'operator', checked: true, loading: false, available: true,
    model: { model_id: 'patchcore-gear' }, inputImage: null, parametersValid: true,
    busy: '', referenceBlocked: false };
  assert.match(vision.visionDetectionBlocker(state), /待检测图片/);
  assert.equal(vision.visionDetectionBlocker({ ...state, inputImage: { name: 'gear.png' } }), null);
  assert.match(vision.visionDetectionBlocker({ ...state, inputImage: { name: 'gear.png' }, referenceBlocked: true }), /不能关联生产实物/);
});

test('automatic folder status and result must identify the gear model and local source', () => {
  const status = { enabled: true, running: true, input_dir: 'L:\\gear-inbox\\incoming',
    pending_count: 0, processed_count: 1, failed_count: 0, last_error: '',
    latest: { inspection_id: 'VI-' + 'a'.repeat(32), filename: 'gear.png', status: 'clear',
      score: 0.2, threshold: 1, created_at: '2026-10-21T04:00:00Z' } };
  assert.equal(vision.verifiedAutoVisionStatus(status), status);
  assert.throws(() => vision.verifiedAutoVisionStatus({ ...status, processed_count: -1 }), /自动检测/);
  const result = { ...valid, model_id: 'patchcore-gear', filename: 'gear.png', part_id: '',
    image_source: 'local_inbox' };
  assert.equal(vision.verifiedAutoVisionResult(result), result);
  assert.throws(() => vision.verifiedAutoVisionResult({ ...result, image_source: 'upload' }), /自动检测/);
});

test('YOLO defaults use validated model recommendations while legacy models remain usable', () => {
  const model = { algorithm: 'yolo', model_id: 'yolo-default', name: 'Synthetic YOLO' };
  assert.deepEqual(vision.yoloModelParameters(model), { confidence: '0.25', iou: '0.45' });
  assert.deepEqual(vision.yoloModelParameters({ ...model, recommended_confidence: .4, recommended_iou: .6,
    calibration_scope: 'synthetic_calibration_only' }), { confidence: '0.4', iou: '0.6' });
  for (const key of ['recommended_confidence', 'recommended_iou']) {
    for (const value of [0, -1, NaN, Infinity, 1.1, '0.4', null]) {
      assert.throws(() => vision.yoloModelParameters({ ...model, [key]: value }), /模型/);
    }
  }
});

test('validated vision evidence preserves the real response and accepts YOLO confidence boxes', () => {
  assert.equal(vision.verifiedVisionResult(valid, expected), valid);
  const yolo = { ...valid, algorithm: 'yolo', model_id: 'yolo-default', threshold: 0.25, status: 'defect', score: 0.9,
    defects: [{ label: 'scratch', confidence: 0.9, bbox: [2, 3, 40, 60] }] };
  assert.equal(vision.verifiedVisionResult(yolo, { ...expected, algorithm: 'yolo', model_id: 'yolo-default', confidence: 0.25 }), yolo);
});

test('wrong algorithm model filename or linked part cannot be displayed as the current inspection', () => {
  for (const patch of [{ algorithm: 'yolo' }, { model_id: 'PC-other' }, { filename: 'other.png' }, { part_id: 'FC-other' }]) {
    assert.throws(() => vision.verifiedVisionResult({ ...valid, ...patch }, expected), /结果/);
  }
  assert.throws(() => vision.verifiedVisionResult(valid, { ...expected, part_id: undefined }), /结果/);
});

test('YOLO status and maximum confidence must agree with the defect boxes and threshold', () => {
  const target = { ...expected, algorithm: 'yolo', model_id: 'yolo-default', confidence: 0.25 };
  const clear = { ...valid, ...target, threshold: 0.25, score: 0 };
  assert.equal(vision.verifiedVisionResult(clear, target), clear);
  for (const patch of [
    { score: 0.9 },
    { status: 'defect', score: 0.1, defects: [{ label: 'scratch', confidence: 0.9, bbox: [2, 3, 40, 60] }] },
    { status: 'defect', score: 0.8, defects: [{ label: 'scratch', confidence: 0.9, bbox: [2, 3, 40, 60] }] },
  ]) assert.throws(() => vision.verifiedVisionResult({ ...clear, ...patch }, target), /结果/);
});

test('combined evidence must match selected physical part and image provenance', () => {
  const target = { ...expected, quality_part_id: 'CQ-' + 'a'.repeat(32), image_source: 'upload' };
  const evidence = { ...valid, quality_part_id: target.quality_part_id, image_source: 'upload' };
  assert.equal(vision.verifiedVisionResult(evidence, target), evidence);
  for (const patch of [{ quality_part_id: 'CQ-' + 'b'.repeat(32) }, { image_source: 'public_gear_reference' }]) {
    assert.throws(() => vision.verifiedVisionResult({ ...evidence, ...patch }, target), /结果/);
  }
});

function sequentialStages(pcDefect = false, yoloDefect = false) {
  const common = { ...valid, image_source: 'upload', image_sha256: 'a'.repeat(64),
    image_digest_format: 'rgb-pixels-with-size-v1', quality_part_id: 'CQ-' + 'd'.repeat(32),
    quality_identity: { scope: 'validation', batch_id: 'B-1', serial_number: 'G-1', design_version: 'v1' },
    source_context: { source: { job_id: 'JOB-1', views: ['front', 'back'] } } };
  const patchcore = { ...common, inspection_id: 'VI-' + 'a'.repeat(32),
    parameters: { threshold: 1, confidence: .25, iou: .45 }, status: pcDefect ? 'defect' : 'clear',
    score: pcDefect ? 1.5 : .2,
    defects: pcDefect ? [{ label: 'anomaly', confidence: null, bbox: [2, 3, 40, 60] }] : [] };
  const yolo = { ...common, algorithm: 'yolo', model_id: 'YOLO-11', threshold: .25,
    inspection_id: 'VI-' + 'b'.repeat(32), heatmap_image: undefined,
    parameters: { threshold: .25, confidence: .25, iou: .45 }, status: yoloDefect ? 'defect' : 'clear',
    score: yoloDefect ? .9 : 0,
    defects: yoloDefect ? [{ label: 'darkspot', confidence: .9, bbox: [2, 3, 40, 60] }] : [] };
  return [patchcore, yolo];
}

function sequentialRecord(pcDefect = false, yoloDefect = false) {
  const [patchcore, yolo] = sequentialStages(pcDefect, yoloDefect);
  const classification = yoloDefect ? 'known_defect' : pcDefect ? 'unknown_anomaly' : 'clear';
  return {
    algorithm: 'patchcore_yolo', inspection_id: 'VI-' + 'c'.repeat(32), created_at: '2026-10-19T04:01:00Z',
    status: classification === 'clear' ? 'clear' : 'defect', classification,
    patchcore, yolo, inspection_ids: [patchcore.inspection_id, yolo.inspection_id],
    image: patchcore.image, filename: patchcore.filename, part_id: patchcore.part_id,
    image_sha256: patchcore.image_sha256, image_digest_format: patchcore.image_digest_format,
    image_source: patchcore.image_source, source_context: patchcore.source_context,
    quality_part_id: patchcore.quality_part_id, quality_identity: patchcore.quality_identity,
  };
}

for (const [pcDefect, yoloDefect, classification] of [
  [false, false, 'clear'], [false, true, 'known_defect'],
  [true, false, 'unknown_anomaly'], [true, true, 'known_defect'],
]) test(`sequential fusion and restored evidence preserve ${pcDefect}/${yoloDefect} truth-table outcome`, () => {
  const [patchcore, yolo] = sequentialStages(pcDefect, yoloDefect);
  assert.deepEqual(vision.sequentialVisionResult(patchcore, yolo), {
    status: classification === 'clear' ? 'clear' : 'defect', classification, patchcore, yolo,
    inspection_ids: [patchcore.inspection_id, yolo.inspection_id],
  });
  const record = sequentialRecord(pcDefect, yoloDefect);
  assert.equal(vision.verifiedSequentialVisionResult(record), record);
  assert.equal(vision.verifiedSequentialVisionResult(record, {
    patchcore_inspection_id: patchcore.inspection_id, yolo_inspection_id: yolo.inspection_id,
  }), record);
});

test('sequential fusion requires valid distinct persisted inspection IDs and pixel digests on both stages', () => {
  const stages = sequentialStages();
  for (const index of [0, 1]) {
    for (const patch of [
      { inspection_id: undefined }, { inspection_id: 'VIS-legacy' }, { inspection_id: 'VI-' + 'x'.repeat(32) },
      { inspection_id: stages[1 - index].inspection_id },
      { image_sha256: undefined }, { image_sha256: null }, { image_sha256: '' },
      { image_sha256: 'a'.repeat(63) }, { image_sha256: 'g'.repeat(64) },
      { image_digest_format: undefined }, { image_digest_format: 'file-bytes-v1' },
    ]) {
      const candidate = [...stages];
      candidate[index] = { ...candidate[index], ...patch };
      assert.throws(() => vision.sequentialVisionResult(...candidate), /联合检测结果/);
    }
  }
  assert.throws(() => vision.sequentialVisionResult(...stages.map(stage => ({ ...stage, image_sha256: 'same-invalid-hash' }))), /联合检测结果/);
  assert.equal(vision.verifiedVisionResult(valid, expected), valid, 'legacy single-model evidence stays compatible');
});

test('sequential fusion rejects unrelated image, physical part, identity and source context', () => {
  const [patchcore, yolo] = sequentialStages();
  for (const patch of [
    { filename: 'other.png' }, { part_id: 'other-part' }, { quality_part_id: 'CQ-' + 'e'.repeat(32) },
    { quality_identity: { ...yolo.quality_identity, serial_number: 'G-2' } },
    { quality_identity: undefined }, { source_context: { source: { job_id: 'JOB-2', views: ['front', 'back'] } } },
    { source_context: { source: { job_id: 'JOB-1', views: ['back', 'front'] } } }, { source_context: undefined },
    { image_source: 'public_gear_reference' }, { image: { width: 101, height: 80 } },
    { image_sha256: 'b'.repeat(64) },
  ]) assert.throws(() => vision.sequentialVisionResult(patchcore, { ...yolo, ...patch }), /同一张图片/);
  assert.doesNotThrow(() => vision.sequentialVisionResult(patchcore, {
    ...yolo,
    quality_identity: { design_version: 'v1', serial_number: 'G-1', batch_id: 'B-1', scope: 'validation' },
    source_context: { source: { views: ['front', 'back'], job_id: 'JOB-1' } },
  }), 'object key ordering has no effect on identity equality');
});

test('sequential stages reject incomplete output, status contradictions and parameters that disagree with inference', () => {
  const stages = sequentialStages();
  for (const index of [0, 1]) {
    for (const patch of [
      { model_id: undefined }, { filename: undefined }, { status: 'incomplete' },
      { status: 'defect' }, { annotated_image: undefined }, { created_at: 'not-a-date' },
      { parameters: undefined }, { parameters: { threshold: 2, confidence: .8 } },
      { steps: [] }, { image: { width: 0, height: 80 } },
    ]) {
      const candidate = [...stages];
      candidate[index] = { ...candidate[index], ...patch };
      assert.throws(() => vision.sequentialVisionResult(...candidate), /联合检测结果/);
    }
  }
  assert.throws(() => vision.sequentialVisionResult({ ...stages[0], heatmap_image: undefined }, stages[1]), /联合检测结果/);
  const [patchcore, yolo] = sequentialStages(true, true);
  assert.throws(() => vision.sequentialVisionResult(patchcore, { ...yolo, score: .8 }), /联合检测结果/);
});

test('persisted fusion rejects forged conclusions, IDs and missing stages', () => {
  const record = sequentialRecord(true, false);
  for (const patch of [
    { algorithm: 'yolo' }, { inspection_id: undefined }, { inspection_id: 'VIS-legacy' },
    { inspection_id: record.patchcore.inspection_id }, { inspection_id: record.yolo.inspection_id },
    { created_at: undefined }, { created_at: 'not-a-date' },
    { status: 'clear' }, { classification: 'clear' }, { classification: 'known_defect' },
    { patchcore: undefined }, { yolo: undefined }, { inspection_ids: undefined },
    { inspection_ids: [...record.inspection_ids].reverse() }, { inspection_ids: [record.inspection_ids[0]] },
    { inspection_ids: [...record.inspection_ids, record.inspection_id] },
  ]) assert.throws(() => vision.verifiedSequentialVisionResult({ ...record, ...patch }), /联合检测结果/);
});

test('persisted fusion must retain the stages image identity and current request IDs', () => {
  const record = sequentialRecord();
  for (const patch of [
    { filename: 'other.png' }, { part_id: 'FC-2' }, { image: { width: 100, height: 90 } },
    { quality_part_id: undefined }, { quality_identity: { ...record.quality_identity, serial_number: 'G-2' } },
    { source_context: undefined }, { image_source: 'public_gear_reference' },
    { image_sha256: undefined }, { image_sha256: 'b'.repeat(64) }, { image_digest_format: undefined },
  ]) assert.throws(() => vision.verifiedSequentialVisionResult({ ...record, ...patch }), /联合检测结果/);
  for (const expectedIds of [
    {}, { patchcore_inspection_id: record.patchcore.inspection_id },
    { patchcore_inspection_id: record.yolo.inspection_id, yolo_inspection_id: record.patchcore.inspection_id },
    { patchcore_inspection_id: record.inspection_id, yolo_inspection_id: record.yolo.inspection_id },
  ]) assert.throws(() => vision.verifiedSequentialVisionResult(record, expectedIds), /联合检测结果/);
});

test('missing or contradictory evidence never produces a clear inspection', () => {
  for (const patch of [
    { inspection_id: '' }, { created_at: '' }, { annotated_image: '' }, { annotated_image: 'https://example.com/result.png' },
    { heatmap_image: '' }, { image: { width: 0, height: 80 } }, { score: NaN }, { score: '0.2' }, { threshold: 2 },
    { score: 1.1 }, { defects: undefined }, { defects: [{ label: 'scratch', confidence: null, bbox: [0, 0, 20, 20] }] },
    { steps: [] }, { steps: [{ name: '推理', status: 'failed', detail: '失败' }] },
  ]) assert.throws(() => vision.verifiedVisionResult({ ...valid, ...patch }, expected), /结果/);
});

test('defect locations must be finite ordered boxes inside the original image', () => {
  const anomaly = { ...valid, status: 'defect', score: 1.4, defects: [{ label: 'anomaly', confidence: null, bbox: [1, 2, 40, 50] }] };
  assert.equal(vision.verifiedVisionResult(anomaly, expected), anomaly);
  for (const bbox of [[-1, 0, 20, 30], [0, 0, 101, 20], [10, 0, 1, 20], [0, 0, NaN, 20], [0, 0, 20]]) {
    assert.throws(() => vision.verifiedVisionResult({ ...anomaly, defects: [{ label: 'anomaly', confidence: null, bbox }] }, expected), /结果/);
  }
  assert.throws(() => vision.verifiedVisionResult({ ...anomaly, defects: [] }, expected), /结果/);
});

test('image selection rejects empty unsupported oversized files and training count boundaries', () => {
  const png = { name: 'normal.png', type: 'image/png', size: 100 };
  assert.deepEqual(vision.validateVisionFiles([png], { max_image_bytes: 100 }), [png]);
  for (const files of [[], [{ ...png, size: 0 }], [{ ...png, type: 'image/svg+xml' }], [{ ...png, size: 101 }]]) {
    assert.throws(() => vision.validateVisionFiles(files, { max_image_bytes: 100 }));
  }
  assert.throws(() => vision.validateVisionFiles([png], {}, true), /至少.*2/);
  assert.equal(vision.validateVisionFiles(Array(100).fill(png), {}, true).length, 100);
  assert.throws(() => vision.validateVisionFiles(Array(101).fill(png), {}, true), /100/);
  assert.equal(vision.validateVisionFiles([png, png], {}, true).length, 2);
});

test('invalid model metadata cannot enable the PatchCore run button', () => {
  const model = { model_id: 'PC-1', algorithm: 'patchcore', name: '轴套', sample_count: 3, memory_size: 20, suggested_threshold: 0.8 };
  assert.equal(vision.verifiedPatchcoreModel(model), model);
  for (const patch of [{ model_id: '' }, { algorithm: 'yolo' }, { sample_count: 0 }, { memory_size: 0 }, { suggested_threshold: 0 }]) {
    assert.throws(() => vision.verifiedPatchcoreModel({ ...model, ...patch }), /模型/);
  }
});

test('preset and legacy model metadata are accepted while unsafe source links and invalid flags are rejected', () => {
  const preset = { model_id: 'patchcore-demo', algorithm: 'patchcore', name: 'PatchCore 合成纹理演示',
    sample_count: 4, memory_size: 64, suggested_threshold: 1.2, read_only: true, demo: true,
    description: '仅用于合成纹理演示。', source_url: 'https://example.org/model', classes: ['anomaly'],
    preprocessing: vision.DEFAULT_PATCHCORE_PREPROCESSING, pipeline_version: 2 };
  assert.equal(vision.verifiedPatchcoreModel(preset), preset);
  for (const patch of [
    { description: 1 }, { read_only: 'true' }, { demo: 1 }, { classes: 'anomaly' }, { classes: [''] },
    { source_url: 'javascript:alert(1)' }, { source_url: 'http://example.org/model' },
    { source_url: 'https://user:password@example.org/model' }, { source_url: '/models/demo' },
  ]) assert.throws(() => vision.verifiedPatchcoreModel({ ...preset, ...patch }), /模型/);
  assert.doesNotThrow(() => vision.verifiedPatchcoreModel({ ...preset, source_url: '', classes: [] }));
});

test('gear normal-bank metadata accepts its sample dimensions without research flags', () => {
  const model = { model_id: 'patchcore-gear', algorithm: 'patchcore', name: '齿轮正常记忆库',
    sample_count: 2068, memory_size: 1024, suggested_threshold: 1.8823, read_only: true };
  assert.equal(vision.verifiedPatchcoreModel(model), model);
  for (const patch of [{ sample_count: -1 }, { memory_size: 0 }, { suggested_threshold: NaN }]) {
    assert.throws(() => vision.verifiedPatchcoreModel({ ...model, ...patch }), /模型/);
  }
});

test('the catalog validates YOLO metadata without requiring PatchCore memory fields', () => {
  const yolo = { model_id: 'yolo-default', algorithm: 'yolo', name: 'NEU-DET 钢材缺陷模型（研究验证）',
    description: '钢材表面缺陷研究验证。', source_url: 'https://example.org/neu-det',
    classes: ['crazing', 'inclusion', 'patches', 'pitted_surface', 'rolled-in_scale', 'scratches'], read_only: true, demo: false };
  assert.equal(vision.verifiedVisionModel(yolo), yolo);
  assert.doesNotThrow(() => vision.verifiedVisionModel({ model_id: 'yolo-default', algorithm: 'yolo', name: '旧版 YOLO' }));
  for (const patch of [{ model_id: '' }, { algorithm: 'unknown' }, { source_url: 'javascript:alert(1)' }, { classes: [null] }]) {
    assert.throws(() => vision.verifiedVisionModel({ ...yolo, ...patch }), /模型/);
  }
});

test('training JSON budget rejects a large batch even when each file fits the individual limit', () => {
  assert.doesNotThrow(() => vision.validateTrainingPayload([image, image]));
  assert.throws(() => vision.validateTrainingPayload(Array(8).fill('a'.repeat(6 * 1024 * 1024))), /总.*40/);
});

test('preprocessing accepts calibrated resolutions and rejects invalid smoothing or options', () => {
  const defaults = vision.DEFAULT_PATCHCORE_PREPROCESSING;
  assert.equal(vision.verifiedPatchcorePreprocessing(defaults), defaults);
  assert.deepEqual(vision.GEAR_PATCHCORE_PREPROCESSING, { input_size: 448, resize_mode: 'letterbox', contrast: 'none', blur_sigma: 2 });
  assert.doesNotThrow(() => vision.verifiedPatchcorePreprocessing({ input_size: 448, resize_mode: 'letterbox', contrast: 'clahe', blur_sigma: 0 }));
  for (const patch of [{ input_size: 512 }, { resize_mode: 'crop' }, { contrast: 'equalize' }, { blur_sigma: -1 }, { blur_sigma: 9 }, { blur_sigma: NaN }, { blur_sigma: '4' }]) {
    assert.throws(() => vision.verifiedPatchcorePreprocessing({ ...defaults, ...patch }), /预处理配置/);
  }
});

test('calibration requires both label groups and enforces one combined payload budget', () => {
  const file = { name: 'calibration.png', type: 'image/png', size: 100 };
  assert.equal(vision.validateCalibrationFiles([file, file], 'normal').length, 2);
  assert.equal(vision.validateCalibrationFiles([file], 'defect').length, 1);
  assert.throws(() => vision.validateCalibrationFiles([file], 'normal'), /2 张正常/);
  assert.throws(() => vision.validateCalibrationFiles([{ ...file, type: 'image/svg+xml' }], 'defect'), /PNG/);
  assert.doesNotThrow(() => vision.validateCalibrationPayload([image, image], [image]));
  assert.throws(() => vision.validateCalibrationPayload([image, image], []), /已知缺陷/);
  assert.throws(() => vision.validateCalibrationPayload(Array(23).fill(image), [image, image]), /合计最多 24/);
  assert.throws(() => vision.validateCalibrationPayload(Array(5).fill('a'.repeat(6 * 1024 * 1024)), Array(3).fill('a'.repeat(6 * 1024 * 1024))), /校准.*40/);
});

test('calibration validates model identity, threshold, policy and metric denominators', () => {
  const strategy = { threshold: 0.8, metrics: { tp: 3, fn: 1, tn: 4, fp: 1, fnr: 0.25, fpr: 0.2 } };
  const model = { model_id: 'PC-1', algorithm: 'patchcore', name: '轴套', sample_count: 3, memory_size: 20, suggested_threshold: 0.8,
    calibration_required: false, threshold_method: 'independent_labeled_calibration',
    calibration: { policy: 'recall_priority', normal_count: 5, defect_count: 4, created_at: '2026-10-19T04:00:00Z', strategies: {
      recall_priority: strategy, balanced: strategy, zero_fp: { threshold: 1.2, metrics: { tp: 2, fn: 2, tn: 5, fp: 0, fnr: 0.5, fpr: 0 } },
    } } };
  assert.equal(vision.verifiedCalibrationModel(model, 'PC-1', 'recall_priority'), model);
  assert.throws(() => vision.verifiedCalibrationModel(model, 'PC-other', 'recall_priority'), /校准结果/);
  assert.throws(() => vision.verifiedCalibrationModel(model, 'PC-1', 'balanced'), /校准结果/);
  assert.throws(() => vision.verifiedCalibrationModel({ ...model, suggested_threshold: 0.9 }, 'PC-1', 'recall_priority'), /校准结果/);
  for (const patch of [{ defect_count: 5 }, { normal_count: 3 }, { created_at: '' }, { strategies: { ...model.calibration.strategies, zero_fp: strategy } }]) {
    assert.throws(() => vision.verifiedCalibrationModel({ ...model, calibration: { ...model.calibration, ...patch } }, 'PC-1', 'recall_priority'), /校准结果/);
  }
});

test('synthetic calibration is accepted only for the read-only demo and retains strict metric validation', () => {
  const strategy = { threshold: 1.2, metrics: { tp: 3, fn: 0, tn: 4, fp: 0, fnr: 0, fpr: 0 } };
  const model = { model_id: 'patchcore-demo', algorithm: 'patchcore', name: '合成演示', sample_count: 12, memory_size: 941,
    read_only: true, demo: true, suggested_threshold: 1.2, calibration_required: false, threshold_method: 'independent_labeled_synthetic_calibration',
    calibration: { policy: 'recall_priority', scope: 'synthetic_calibration_only', normal_count: 4, defect_count: 3,
      created_at: '2026-10-19T06:39:07.508016+00:00', strategies: { recall_priority: strategy, balanced: strategy, zero_fp: strategy } } };
  assert.equal(vision.verifiedCalibrationModel(model, model.model_id, 'recall_priority'), model);
  for (const patch of [{ read_only: false }, { demo: false }, { model_id: 'PC-personal' },
    { calibration: { ...model.calibration, scope: 'production' } }, { calibration: { ...model.calibration, defect_count: 4 } }]) {
    const value = { ...model, ...patch };
    assert.throws(() => vision.verifiedCalibrationModel(value, value.model_id, 'recall_priority'), /校准结果/);
  }
});
