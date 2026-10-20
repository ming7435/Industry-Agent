import { validateProductionJob } from './production-cad/virtualProduction.mjs';
import { verifiedVisionResult } from './qualityVision.mjs';

const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const text = value => typeof value === 'string' && !!value.trim();
const image = value => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
export const scenarioNames = { normal: '正常纹理', obvious_scratch: '明显划痕', low_contrast: '低对比度缺陷' };
export const parameterStatus = { pass: '模拟参数一致', fail: '模拟参数不一致', insufficient_data: '参数资料不足', review: '参数待复核' };
export const productionValidationPendingKey = (actor, job) => `quality.production-vision.pending:${actor}:${job}`;

export function verifiedLocalization(scenarios, totals) {
  const invalid = () => { throw new Error('保存的定位统计与检测框不一致，请核对。'); };
  if (totals === undefined && scenarios.every(scene => scene.localization === undefined)) return;
  const keys = ['tp', 'fn', 'fp', 'ground_truth_count'];
  const sums = Object.fromEntries(['patchcore', 'yolo'].map(key => [key, Object.fromEntries(keys.map(k => [k, 0]))]));
  const header = value => value?.method === 'label_agnostic_bbox_iou' && value.iou_threshold === .5;
  if (!header(totals)) invalid();
  for (const scene of scenarios) {
    const spatial = scene.localization;
    if (!header(spatial) || !Array.isArray(spatial.ground_truth_boxes)
      || spatial.ground_truth_boxes.length !== (scene.label === 'normal' ? 0 : 1)
      || Object.keys(spatial.results || {}).length !== scene.results.length) invalid();
    for (const result of scene.results) {
      const counts = spatial.results[result.algorithm];
      if (!counts || keys.some(key => !Number.isInteger(counts[key]) || counts[key] < 0)
        || counts.ground_truth_count !== spatial.ground_truth_boxes.length
        || counts.tp + counts.fn !== counts.ground_truth_count || counts.tp + counts.fp !== result.defects.length) invalid();
      for (const key of keys) sums[result.algorithm][key] += counts[key];
    }
  }
  for (const algorithm of Object.keys(sums)) {
    if (keys.some(key => totals[algorithm]?.[key] !== sums[algorithm][key])) invalid();
  }
}

export function eligibleProductionJobs(values) {
  return values.filter(value => {
    try { validateProductionJob(value); return value.status === 'completed' && value.sync_status === 'confirmed' && !!value.output; }
    catch { return false; }
  }).sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
}

export function verifiedProductionValidation(value, job, requestId) {
  const invalid = message => { throw new Error(message || '生产视觉验证结果不完整，请回载已保存结果核对。'); };
  if (!value || !/^PV-[a-f0-9]{32}$/.test(value.run_id || '') || !text(value.request_id)
    || !['completed', 'failed', 'running'].includes(value.status)
    || !(typeof value.created_at === 'number' ? Number.isFinite(value.created_at) : Number.isFinite(Date.parse(value.created_at)))) invalid();
  if (requestId && value.request_id !== requestId) invalid('保存结果与原请求编号不一致，请按原请求重试验证。');
  const source = value.source;
  const identity = { job_id: job.job_id, part_id: job.part_id, design_run_id: job.design_run_id, design_digest: job.design_digest,
    program_digest: job.program_digest, batch_id: job.batch_id, actor_id: job.actor_id, output_digest: job.output?.output_digest };
  if (!source || source.simulation_only !== true || source.synthetic !== true
    || Object.entries(identity).some(([key, expected]) => !text(expected) || source[key] !== expected)) invalid('生产视觉结果的追溯身份与所选产出不一致，请重新核对生产任务。');
  const complete = value.status === 'completed', scenarios = value.scenarios ?? [];
  if ((complete || value.generator) && (value.generator?.scope !== 'synthetic_pipeline_only' || !text(value.generator.version))) invalid();
  const check = value.parameter_inspection;
  if (complete && !check) invalid();
  if (check && (!text(check.check_id) || !Object.hasOwn(parameterStatus, check.status) || !Array.isArray(check.items)
    || ['job_id', 'part_id', 'design_run_id', 'design_digest', 'batch_id', 'output_digest'].some(key => check[key] !== identity[key]))) invalid('参数检测结果与生产产出身份不一致，请核对。');
  if (!Array.isArray(scenarios) || (complete ? scenarios.length !== 3 : scenarios.length > 3)
    || new Set(scenarios.map(item => item?.scenario)).size !== scenarios.length) invalid();
  if (scenarios.length && (value.generator?.scope !== 'synthetic_pipeline_only' || !text(value.generator.version))) invalid();
  const metrics = { patchcore: { tp: 0, fn: 0, tn: 0, fp: 0 }, yolo: { tp: 0, fn: 0, tn: 0, fp: 0 } };
  for (const scenario of scenarios) {
    if (!Object.hasOwn(scenarioNames, scenario?.scenario) || scenario.label !== (scenario.scenario === 'normal' ? 'normal' : 'defect')
      || !image(scenario.input_image) || !image(scenario.mask_image) || !hex(scenario.image_sha256)
      || !Array.isArray(scenario.results) || (complete ? scenario.results.length !== 2 : scenario.results.length > 2)
      || new Set(scenario.results.map(result => result?.algorithm)).size !== scenario.results.length) invalid();
    for (const result of scenario.results) {
      if (!['patchcore', 'yolo'].includes(result?.algorithm) || result.part_id !== job.part_id || result.image_sha256 !== scenario.image_sha256
        || !hex(result.model_sha256) || result.model?.model_id !== result.model_id || result.model?.algorithm !== result.algorithm || !result.parameters) invalid('图像摘要、检测模型或工件身份不一致，不能展示为同图验证结果。');
      verifiedVisionResult(result, { algorithm: result.algorithm, model_id: result.model_id, filename: result.filename,
        part_id: job.part_id, threshold: result.parameters.threshold, confidence: result.parameters.confidence });
      const key = scenario.label === 'defect' ? result.status === 'defect' ? 'tp' : 'fn' : result.status === 'clear' ? 'tn' : 'fp';
      metrics[result.algorithm][key]++;
    }
  }
  if ((complete || value.metrics || scenarios.length) && Object.entries(metrics).some(([algorithm, counts]) => Object.entries(counts).some(([key, count]) => value.metrics?.[algorithm]?.[key] !== count))) invalid('保存的合成场景统计与逐图结果不一致，请核对。');
  verifiedLocalization(scenarios, value.localization_metrics);
  return value;
}
