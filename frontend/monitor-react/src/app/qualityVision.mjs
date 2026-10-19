export const VISION_LIMITS = { max_image_bytes: 4 * 1024 * 1024, max_training_images: 24 };
export const DEFAULT_PATCHCORE_PREPROCESSING = { input_size: 224, resize_mode: 'stretch', contrast: 'none', blur_sigma: 4 };
export const CALIBRATION_POLICIES = { recall_priority: '召回优先', balanced: '平衡', zero_fp: '校准集零误报' };
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
  if (selected.length > VISION_LIMITS.max_training_images) throw new Error('正常与缺陷校准图片合计最多 24 张。');
  selected.forEach(file => validateVisionFiles([file], limits));
  return selected;
}

export function validateCalibrationPayload(normalImages, defectImages) {
  if (normalImages.length < 2 || defectImages.length < 1) throw new Error('阈值校准至少需要 2 张正常图片和 1 张已知缺陷图片。');
  if (normalImages.length + defectImages.length > VISION_LIMITS.max_training_images) throw new Error('正常与缺陷校准图片合计最多 24 张。');
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
