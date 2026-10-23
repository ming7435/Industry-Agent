export const VISION_LIMITS = { max_image_bytes: 4 * 1024 * 1024, max_training_images: 100, max_calibration_images: 24 };
export const DEFAULT_PATCHCORE_PREPROCESSING = { input_size: 224, resize_mode: 'stretch', contrast: 'none', blur_sigma: 4 };
export const GEAR_PATCHCORE_PREPROCESSING = { input_size: 448, resize_mode: 'letterbox', contrast: 'none', blur_sigma: 2 };
export const CALIBRATION_POLICIES = { recall_priority: '召回优先', balanced: '平衡', zero_fp: '校准集零误报' };

export function visionDetectionBlocker({ userId, checked, loading, available, model, inputImage,
  parametersValid, busy, referenceBlocked }) {
  if (!userId) return '请先登录，再运行缺陷检测。';
  if (!checked || loading) return '正在检查检测服务，请稍候。';
  if (!available || !model) return '已有检测记忆库暂不可用，请刷新模型状态或联系维护人员。';
  if (referenceBlocked) return '测试图片不能关联生产实物；请切换到流程验证或上传该实物图片。';
  if (!inputImage) return '请上传 1 张待检测图片，系统会使用已有记忆库自动检测。';
  if (!parametersValid) return '请填写有效的检测阈值。';
  if (busy) return '正在处理图片或运行检测，请稍候。';
  return null;
}
const supportedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const imageData = value => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
const text = value => typeof value === 'string' && !!value.trim();
const finite = value => typeof value === 'number' && Number.isFinite(value);

function verifiedModelMetadata(value) {
  const invalid = () => { throw new Error('视觉模型信息返回无效，请刷新模型状态后核对。'); };
  if (!text(value?.model_id) || !['patchcore', 'yolo'].includes(value.algorithm) || !text(value.name)
    || (value.description !== undefined && typeof value.description !== 'string')
    || (value.read_only !== undefined && typeof value.read_only !== 'boolean')
    || (value.demo !== undefined && typeof value.demo !== 'boolean')
    || (value.classes !== undefined && (!Array.isArray(value.classes) || value.classes.some(item => !text(item))))
    || (value.pipeline_version !== undefined && (!Number.isInteger(value.pipeline_version) || value.pipeline_version < 1))) invalid();
  for (const key of ['recommended_confidence', 'recommended_iou']) {
    if (value[key] !== undefined && (!finite(value[key]) || value[key] <= 0 || value[key] > 1)) invalid();
  }
  if (value.calibration_scope !== undefined && typeof value.calibration_scope !== 'string') invalid();
  if (value.algorithm === 'yolo' && value.input_size !== undefined && ![320, 640].includes(value.input_size)) invalid();
  if (value.source_url !== undefined) {
    if (typeof value.source_url !== 'string') invalid();
    if (value.source_url) {
      let source;
      try { source = new URL(value.source_url); } catch { invalid(); }
      if (source.protocol !== 'https:' || source.username || source.password) invalid();
    }
  }
  return value;
}

export function verifiedVisionModel(value) {
  return value?.algorithm === 'patchcore' ? verifiedPatchcoreModel(value) : verifiedModelMetadata(value);
}

export function yoloModelParameters(model) {
  if (model) verifiedVisionModel(model);
  return { confidence: String(model?.recommended_confidence ?? 0.25), iou: String(model?.recommended_iou ?? 0.45) };
}

export function validateVisionFiles(files, limits = {}, training = false) {
  const selected = Array.from(files || []);
  const maxBytes = Math.min(limits.max_image_bytes || VISION_LIMITS.max_image_bytes, VISION_LIMITS.max_image_bytes);
  const maxCount = training ? Math.min(limits.max_training_images || VISION_LIMITS.max_training_images, VISION_LIMITS.max_training_images) : 1;
  if (selected.length < (training ? 2 : 1)) throw new Error(training ? '建立记忆库至少需要 2 张正常样本。' : '请选择一张待检测图片。');
  if (selected.length > maxCount) throw new Error(`一次最多选择 ${maxCount} 张图片。`);
  for (const file of selected) {
    if (!supportedTypes.has(file.type)) throw new Error(`${file.name}：仅支持 PNG、JPEG、WebP 图片。`);
    if (!finite(file.size) || file.size <= 0 || file.size > maxBytes) throw new Error(`${file.name}：图片不能为空，且单张不能超过 ${(maxBytes / 1024 / 1024).toFixed(1)} MB。`);
  }
  return selected;
}

export function verifiedPatchcoreModel(value) {
  verifiedModelMetadata(value);
  if (!text(value?.model_id) || value.algorithm !== 'patchcore' || !text(value.name)
    || !Number.isInteger(value.sample_count) || value.sample_count < 2
    || !Number.isInteger(value.memory_size) || value.memory_size < 1
    || !finite(value.suggested_threshold) || value.suggested_threshold <= 0) throw new Error('记忆库模型返回无效，请刷新模型状态后核对。');
  if (value.preprocessing !== undefined) verifiedPatchcorePreprocessing(value.preprocessing);
  return value;
}

export function verifiedPatchcorePreprocessing(value) {
  if (!value || ![224, 448].includes(value.input_size) || !['stretch', 'letterbox'].includes(value.resize_mode)
    || !['none', 'clahe'].includes(value.contrast) || !finite(value.blur_sigma) || value.blur_sigma < 0 || value.blur_sigma > 8) {
    throw new Error('图像预处理配置无效，请检查分辨率、缩放方式、对比度及平滑强度。');
  }
  return value;
}

export function validateCalibrationFiles(files, group, limits = {}) {
  const selected = Array.from(files || []), minimum = group === 'normal' ? 2 : 1;
  if (selected.length < minimum) throw new Error(`阈值校准至少需要 ${minimum} 张${group === 'normal' ? '正常' : '缺陷'}图片。`);
  if (selected.length > VISION_LIMITS.max_calibration_images) throw new Error('正常与缺陷校准图片合计最多 24 张。');
  selected.forEach(file => validateVisionFiles([file], limits));
  return selected;
}

export function validateCalibrationPayload(normalImages, defectImages) {
  if (normalImages.length < 2 || defectImages.length < 1) throw new Error('阈值校准至少需要 2 张正常图片和 1 张已知缺陷图片。');
  if (normalImages.length + defectImages.length > VISION_LIMITS.max_calibration_images) throw new Error('正常与缺陷校准图片合计最多 24 张。');
  if ([...normalImages, ...defectImages].reduce((total, image) => total + image.length, 0) > 40 * 1024 * 1024 - 1024) {
    throw new Error('校准图片编码后的总量不能超过 40 MB，请减少样本数量或压缩图片。');
  }
}

export function verifiedCalibrationModel(value, modelId, policy) {
  verifiedPatchcoreModel(value);
  const invalid = () => { throw new Error('阈值校准结果无效或与当前模型、策略不一致，请重新校准。'); };
  const calibration = value.calibration;
  const syntheticDemo = value.model_id === 'patchcore-demo' && value.read_only === true && value.demo === true
    && value.threshold_method === 'independent_labeled_synthetic_calibration' && calibration?.scope === 'synthetic_calibration_only';
  if (value.model_id !== modelId || value.calibration_required !== false || (!syntheticDemo && value.threshold_method !== 'independent_labeled_calibration')
    || !calibration || calibration.policy !== policy || !Object.hasOwn(CALIBRATION_POLICIES, policy)
    || !Number.isInteger(calibration.normal_count) || calibration.normal_count < 2
    || !Number.isInteger(calibration.defect_count) || calibration.defect_count < 1
    || !text(calibration.created_at) || !Number.isFinite(Date.parse(calibration.created_at))) invalid();
  for (const key of Object.keys(CALIBRATION_POLICIES)) {
    const strategy = calibration.strategies?.[key], metrics = strategy?.metrics;
    if (!finite(strategy?.threshold) || strategy.threshold <= 0 || !metrics
      || ['tp', 'fn', 'tn', 'fp'].some(name => !Number.isInteger(metrics[name]) || metrics[name] < 0)
      || metrics.tp + metrics.fn !== calibration.defect_count || metrics.tn + metrics.fp !== calibration.normal_count
      || !finite(metrics.fnr) || Math.abs(metrics.fnr - metrics.fn / calibration.defect_count) > 1e-9
      || !finite(metrics.fpr) || Math.abs(metrics.fpr - metrics.fp / calibration.normal_count) > 1e-9
      || (key === 'zero_fp' && metrics.fp !== 0)) invalid();
  }
  if (value.suggested_threshold !== calibration.strategies[policy].threshold) invalid();
  return value;
}

export function validateTrainingPayload(images) {
  if (images.reduce((total, image) => total + image.length, 0) > 40 * 1024 * 1024 - 1024) {
    throw new Error('训练图片编码后的总量不能超过 40 MB，请减少样本数量或压缩图片。');
  }
}

export function verifiedVisionResult(value, expected) {
  const invalid = () => { throw new Error('视觉检测结果不完整或与当前图片、算法、模型不一致，请重新检测。'); };
  if (!value || !['patchcore', 'yolo'].includes(value.algorithm) || value.algorithm !== expected.algorithm
    || value.model_id !== expected.model_id || value.filename !== expected.filename
    || (value.part_id || '') !== (expected.part_id || '') || !text(value.inspection_id)
    || !text(value.created_at) || !Number.isFinite(Date.parse(value.created_at))
    || !['defect', 'clear'].includes(value.status) || !finite(value.score) || value.score < 0
    || !finite(value.threshold) || value.threshold <= 0 || !Array.isArray(value.defects)
    || !Number.isInteger(value.image?.width) || value.image.width < 1
    || !Number.isInteger(value.image?.height) || value.image.height < 1 || !imageData(value.annotated_image)
    || !Array.isArray(value.steps) || !value.steps.length
    || value.steps.some(step => !text(step?.name) || step.status !== 'completed' || !text(step.detail))) invalid();
  if (value.algorithm === 'patchcore') {
    if (!imageData(value.heatmap_image) || value.threshold !== expected.threshold
      || (value.status === 'clear') !== (value.score < value.threshold)) invalid();
  } else if (value.score > 1 || value.threshold !== expected.confidence
    || (value.status === 'clear') !== (value.score < value.threshold)) invalid();
  if ((value.status === 'clear') !== (value.defects.length === 0)) invalid();
  if (expected.quality_part_id && value.quality_part_id !== expected.quality_part_id) invalid();
  if (expected.image_source && value.image_source !== expected.image_source) invalid();
  for (const defect of value.defects) {
    const box = defect?.bbox;
    if (!text(defect?.label) || !Array.isArray(box) || box.length !== 4 || !box.every(finite)
      || box[0] < 0 || box[1] < 0 || box[0] >= box[2] || box[1] >= box[3]
      || box[2] > value.image.width || box[3] > value.image.height
      || (value.algorithm === 'yolo' ? !finite(defect.confidence) || defect.confidence < expected.confidence || defect.confidence > 1 : defect.confidence !== null)) invalid();
  }
  if (value.algorithm === 'yolo' && value.score !== Math.max(0, ...value.defects.map(defect => defect.confidence))) invalid();
  return value;
}

export function verifiedAutoVisionStatus(value) {
  const invalid = () => { throw new Error('自动检测状态返回无效，请刷新页面。'); };
  if (value?.enabled === false && value.running === false) return value;
  if (value?.enabled !== true || typeof value.running !== 'boolean' || !text(value.input_dir)
    || ['pending_count', 'processed_count', 'failed_count'].some(key => !Number.isInteger(value[key]) || value[key] < 0)
    || typeof value.last_error !== 'string') invalid();
  if (value.latest !== null) {
    const latest = value.latest;
    if (!/^VI-[a-f0-9]{32}$/.test(latest?.inspection_id || '') || !text(latest.filename)
      || !['clear', 'defect'].includes(latest.status) || !finite(latest.score) || latest.score < 0
      || !finite(latest.threshold) || latest.threshold <= 0 || !text(latest.created_at)
      || !Number.isFinite(Date.parse(latest.created_at))) invalid();
  }
  return value;
}

export function verifiedAutoVisionResult(value) {
  if (value?.algorithm === 'patchcore_yolo_pipeline') {
    if (value.patchcore?.model_id !== 'patchcore-gear' || value.image_source !== 'local_inbox'
      || value.part_id || value.quality_part_id) throw new Error('自动检测结果来源或模型无效，请刷新页面。');
    return verifiedPipelineVisionResult(value, { ...value.parameters, patchcore_model_id: 'patchcore-gear',
      filename: value.filename, part_id: '', image_source: 'local_inbox' });
  }
  if (value?.model_id !== 'patchcore-gear' || value.image_source !== 'local_inbox'
    || (value.part_id || '') !== '' || value.quality_part_id) throw new Error('自动检测结果来源或模型无效，请刷新页面。');
  return verifiedVisionResult(value, { algorithm: 'patchcore', model_id: 'patchcore-gear',
    filename: value.filename, part_id: '', threshold: value.threshold, image_source: 'local_inbox' });
}

const inspectionId = value => typeof value === 'string' && /^VI-[a-f0-9]{32}$/.test(value);
const pixelDigest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const sequentialIdentityFields = ['filename', 'part_id', 'quality_part_id', 'quality_identity',
  'image_sha256', 'image_digest_format', 'image_source', 'source_context'];
const invalidSequentialResult = () => { throw new Error('顺序联合检测结果不完整或两阶段并非同一张图片，请重新检测。'); };

// Provenance objects may arrive with a different JSON key order after persistence.
function sameJsonValue(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object'
    || Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length
    && keys.every(key => Object.hasOwn(right, key) && sameJsonValue(left[key], right[key]));
}

function sameSequentialImage(left, right) {
  return sequentialIdentityFields.every(key => sameJsonValue(left[key], right[key]))
    && left.image?.width === right.image?.width && left.image?.height === right.image?.height;
}

export function sequentialVisionResult(patchcore, yolo) {
  if (patchcore?.algorithm !== 'patchcore' || yolo?.algorithm !== 'yolo') invalidSequentialResult();
  for (const stage of [patchcore, yolo]) {
    if (!inspectionId(stage.inspection_id) || !pixelDigest(stage.image_sha256)
      || stage.image_digest_format !== 'rgb-pixels-with-size-v1'
      || !text(stage.model_id) || !text(stage.filename) || typeof stage.part_id !== 'string'
      || !text(stage.image_source) || !stage.parameters || stage.parameters.threshold !== stage.threshold
      || (stage.algorithm === 'yolo' && (!finite(stage.parameters.confidence)
        || stage.parameters.confidence <= 0 || stage.parameters.confidence > 1))) invalidSequentialResult();
    try {
      verifiedVisionResult(stage, {
        algorithm: stage.algorithm, model_id: stage.model_id, filename: stage.filename, part_id: stage.part_id,
        quality_part_id: stage.quality_part_id, image_source: stage.image_source,
        threshold: stage.parameters.threshold, confidence: stage.parameters.confidence,
      });
    } catch { invalidSequentialResult(); }
  }
  if (patchcore.inspection_id === yolo.inspection_id || !sameSequentialImage(patchcore, yolo)) invalidSequentialResult();
  const classification = yolo.status === 'defect' ? 'known_defect'
    : patchcore.status === 'defect' ? 'unknown_anomaly' : 'clear';
  return { status: classification === 'clear' ? 'clear' : 'defect', classification,
    patchcore, yolo, inspection_ids: [patchcore.inspection_id, yolo.inspection_id] };
}

export function verifiedSequentialVisionResult(value, expected) {
  if (value?.algorithm !== 'patchcore_yolo' || !inspectionId(value.inspection_id)
    || !text(value.created_at) || !Number.isFinite(Date.parse(value.created_at))) invalidSequentialResult();
  const computed = sequentialVisionResult(value.patchcore, value.yolo);
  if (computed.inspection_ids.includes(value.inspection_id)
    || value.status !== computed.status || value.classification !== computed.classification
    || !sameJsonValue(value.inspection_ids, computed.inspection_ids)
    || !sameSequentialImage(value, value.patchcore)
    || (expected !== undefined && (!expected
      || expected.patchcore_inspection_id !== computed.inspection_ids[0]
      || expected.yolo_inspection_id !== computed.inspection_ids[1]))) invalidSequentialResult();
  return value;
}

export function verifiedPipelineVisionResult(value, expected) {
  const invalid = () => { throw new Error('串联检测结果不完整、顺序错误或图片不一致，请重新检测。'); };
  if (value?.algorithm !== 'patchcore_yolo_pipeline' || value.pipeline_version !== 1
    || !inspectionId(value.inspection_id) || !Number.isFinite(Date.parse(value.created_at))) invalid();
  const pc = verifiedVisionResult(value.patchcore, { ...expected, algorithm: 'patchcore', model_id: expected.patchcore_model_id });
  if (!inspectionId(pc.inspection_id) || !pixelDigest(pc.image_sha256)
    || pc.image_digest_format !== 'rgb-pixels-with-size-v1' || !sameSequentialImage(value, pc)
    || value.status !== pc.status || value.score !== pc.score || value.threshold !== pc.threshold
    || !sameJsonValue(value.parameters, { threshold: expected.threshold, confidence: expected.confidence, iou: expected.iou })) invalid();
  let classification = 'clear', localized = pc;
  const ids = [pc.inspection_id];
  if (pc.status === 'clear') {
    if (value.yolo_state !== 'skipped' || value.yolo !== null || value.localization_error !== null) invalid();
  } else if (value.yolo_state === 'completed') {
    const yolo = verifiedVisionResult(value.yolo, { ...expected, algorithm: 'yolo', model_id: 'yolo-default' });
    if (!sameSequentialImage(pc, yolo) || !inspectionId(yolo.inspection_id)
      || yolo.inspection_id === pc.inspection_id || Date.parse(yolo.created_at) < Date.parse(pc.created_at)
      || yolo.parameters?.confidence !== expected.confidence || yolo.parameters?.iou !== expected.iou
      || value.localization_error !== null) invalid();
    ids.push(yolo.inspection_id);
    classification = yolo.status === 'defect' ? 'known_defect' : 'unknown_anomaly';
    if (yolo.status === 'defect') localized = yolo;
  } else if (value.yolo_state === 'failed') {
    if (value.yolo !== null || !text(value.localization_error?.detail)
      || !Number.isInteger(value.localization_error?.status_code) || value.localization_error.status_code < 400) invalid();
    classification = 'localization_failed';
  } else invalid();
  if (value.classification !== classification || !sameJsonValue(value.inspection_ids, ids)
    || ids.includes(value.inspection_id) || Date.parse(value.created_at) < Date.parse((value.yolo || pc).created_at)
    || !sameJsonValue(value.defects, localized.defects) || value.annotated_image !== localized.annotated_image
    || value.heatmap_image !== pc.heatmap_image) invalid();
  return value;
}
