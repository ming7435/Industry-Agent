import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import { VISION_LIMITS, DEFAULT_PATCHCORE_PREPROCESSING, CALIBRATION_POLICIES, validateVisionFiles, validateTrainingPayload,
  validateCalibrationFiles, validateCalibrationPayload, verifiedPatchcorePreprocessing, verifiedPatchcoreModel, verifiedVisionModel, verifiedCalibrationModel, verifiedVisionResult, sequentialVisionResult, verifiedSequentialVisionResult, yoloModelParameters } from './qualityVision.mjs';
import './qualityVision.css';

const prefix = '/api/quality/vision';
const accept = 'image/png,image/jpeg,image/webp';
const cascadeStorageKey = userId => `quality-sequential:${userId}`;
const inspectionIdPattern = /^VI-[a-f0-9]{32}$/;
const stepNames = { preprocess: '图像预处理', extract_features: '提取局部特征', nearest_neighbors: '最近邻检索', localize: '定位异常区域', detect: '模型推理', filter: '筛选与去重', annotate: '标注缺陷位置' };
const flows = {
  patchcore: {
    training: ['采集同一产品、同一机位的正常样本', '预训练骨干提取局部特征', 'Coreset 采样压缩正常特征', '保存正常样本记忆库'],
    inference: ['上传待检测图片', '提取局部特征并检索最近邻', '计算异常距离与热力图', '阈值判断并定位异常区域'],
  },
  yolo: {
    training: ['采集并标注缺陷类别与边界框', '离线训练及验证 YOLO 模型', '配置专用缺陷检测权重', '刷新状态，检查权重是否可用'],
    inference: ['上传待检测图片', 'YOLO 权重前向推理', '置信度筛选与 NMS 去重', '输出缺陷类别、置信度和边界框'],
  },
};

function readImage(file, signal) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const stop = () => reader.abort();
    const clean = () => signal.removeEventListener('abort', stop);
    reader.onload = () => { clean(); typeof reader.result === 'string' ? resolve({ name: file.name, data: reader.result }) : reject(new Error(`${file.name}：图片读取失败，请重新选择。`)); };
    reader.onerror = () => { clean(); reject(new Error(`${file.name}：图片读取失败，请重新选择。`)); };
    reader.onabort = () => { clean(); reject(new DOMException('图片读取已取消', 'AbortError')); };
    signal.addEventListener('abort', stop, { once: true });
    if (signal.aborted) { clean(); reject(new DOMException('图片读取已取消', 'AbortError')); return; }
    reader.readAsDataURL(file);
  });
}

function Flow({ title, items }) {
  return <div className="vision-flow"><h4>{title}</h4><ol>{items.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></div>;
}

function PatchcoreExplanation() {
  return <details className="vision-explanation"><summary>了解记忆库采样、热力图和阈值判定</summary>
    <ol><li><strong>提取正常局部特征：</strong>冻结预训练 ResNet18，提取 layer2 / layer3，经过局部平均池化与尺度对齐，拼接成每个位置 384 维的特征。中间层保留表面纹理和局部结构。</li>
      <li><strong>核心集采样：</strong>固定随机种子，将特征投影到 64 维用于选择样本。先选择距均值最远的特征，再反复选择“到已选集合的最近距离最大”的特征，覆盖不同正常外观。记忆库保存原始 384 维特征，采样比例 10%，上限 1,024 个。</li>
      <li><strong>生成热力图：</strong>计算待测每个位置到记忆库的最近欧氏距离，按特征网格还原，插值放大并做高斯平滑；等比缩放时去除补边，再映射回原图坐标。距离越大表示越偏离正常样本，热力颜色仅用于显示。</li>
      <li><strong>判定缺陷：</strong>图像分数为最终距离图的最大值；分数大于或等于阈值时判为异常。阈值分割后的连通区域用于定位。降低阈值通常减少漏检，也可能增加正常图片误报。</li></ol>
    <p className="vision-note">建库使用正常图片；阈值校准使用独立正常图片和已知缺陷图片；最终测试图片另行保留。校准集指标不能替代独立测试结果。</p>
  </details>;
}

function preprocessingLabel(value) {
  const config = value || DEFAULT_PATCHCORE_PREPROCESSING;
  return `${config.input_size} × ${config.input_size} · ${config.resize_mode === 'letterbox' ? '等比缩放与边缘补齐' : '拉伸缩放'} · ${config.contrast === 'clahe' ? 'CLAHE 局部对比度增强' : '保留原始对比度'} · 高斯 σ = ${config.blur_sigma}`;
}

function ModelDetails({ model }) {
  if (!model) return null;
  return <div className="vision-model-details">
    <div className="vision-model-title"><strong>{model.name}</strong>{model.demo && <span className="vision-model-tag">演示模型</span>}{model.read_only && <span className="vision-model-tag">只读预置</span>}</div>
    {model.description && <p className="vision-note">{model.description}</p>}
    {model.source_url && <p className="vision-note"><a href={model.source_url} target="_blank" rel="noopener noreferrer">模型来源</a></p>}
    {!!model.classes?.length && <div className="vision-model-classes" data-testid="model-classes"><span>覆盖类别</span><ul>{model.classes.map((label, index) => <li key={`${index}-${label}`}>{label}</li>)}</ul></div>}
    <p className="vision-note">当前模型：{model.model_id}{model.sample_count != null ? ` · ${model.sample_count} 张正常样本` : ''}{model.memory_size != null ? ` · ${model.memory_size} 个记忆特征` : ''}</p>
    {model.algorithm === 'patchcore' && <p className="vision-note" data-testid="saved-preprocessing">已保存配置：{preprocessingLabel(model.preprocessing)}{!model.preprocessing ? '（旧版默认配置）' : ''}</p>}
    {model.algorithm === 'yolo' && <p className="vision-note">固定推理输入：{model.input_size || 640} × {model.input_size || 640}，保留原始对比度。</p>}
    {model.algorithm === 'patchcore' && model.read_only && <p className="vision-note vision-readonly-note" data-testid="readonly-model-note">此预置模型为只读，不能校准。请上传自己的正常图片建立记忆库，再使用独立正常和缺陷图片校准阈值。</p>}
  </div>;
}

function CalibrationSummary({ calibration, threshold, synthetic = false }) {
  const selected = calibration?.strategies?.[calibration.policy], metrics = selected?.metrics;
  if (!metrics) return null;
  const sampleKind = synthetic ? '合成校准集' : '校准集';
  return <div className="vision-calibration-summary">
    {synthetic && <p className="vision-note vision-model-warning" data-testid="synthetic-calibration-note">以下阈值和指标仅来自独立合成图片，不代表真实产品或生产现场的检测效果。</p>}
    <p className="vision-note">{synthetic ? '合成图片阈值策略' : '已保存阈值策略'}：{CALIBRATION_POLICIES[calibration.policy]} · {calibration.normal_count} 张正常图片 / {calibration.defect_count} 张缺陷图片</p>
    <dl className="vision-metrics"><div><dt>{sampleKind}漏检率</dt><dd>{(metrics.fnr * 100).toFixed(1)}%</dd><small>漏检 {metrics.fn} / 缺陷 {calibration.defect_count}</small></div>
      <div><dt>{sampleKind}误检率</dt><dd>{(metrics.fpr * 100).toFixed(1)}%</dd><small>误报 {metrics.fp} / 正常 {calibration.normal_count}</small></div>
      <div><dt>校准阈值</dt><dd>{selected.threshold.toFixed(4)}</dd></div></dl>
    <p className="vision-note">这些数值仅反映本次校准图片；“校准集零误报”不保证新图片零误报。请在独立测试集上核验后用于生产。</p>
    {Number(threshold) !== selected.threshold && <p className="vision-note">当前检测阈值已手动修改为 {threshold || '空值'}；以上校准指标对应保存阈值 {selected.threshold}，不代表当前阈值的表现。</p>}
  </div>;
}

export default function QualityVisionWorkspace({ auth, checked, part, qualityPart, onInspection }) {
  const [algorithm, setAlgorithm] = useState('patchcore');
  const [capabilities, setCapabilities] = useState(null), [loading, setLoading] = useState(false), [refresh, setRefresh] = useState(0);
  const [modelId, setModelId] = useState(''), [modelName, setModelName] = useState('正常样本记忆库');
  const [samples, setSamples] = useState([]), [inputImage, setInputImage] = useState(null);
  const [datasetSampleId, setDatasetSampleId] = useState('');
  const [preprocessing, setPreprocessing] = useState({ ...DEFAULT_PATCHCORE_PREPROCESSING });
  const [calibrationNormal, setCalibrationNormal] = useState([]), [calibrationDefect, setCalibrationDefect] = useState([]), [calibrationPolicy, setCalibrationPolicy] = useState('recall_priority');
  const [threshold, setThreshold] = useState('1'), [confidence, setConfidence] = useState('0.25'), [iou, setIou] = useState('0.45');
  const [savedResult, setSavedResult] = useState(null), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [cascadePatchcoreId, setCascadePatchcoreId] = useState(''), [cascadeYoloId, setCascadeYoloId] = useState('');
  const [savedCascadeResult, setSavedCascadeResult] = useState(null);
  const [restoredCascade, setRestoredCascade] = useState(null), [pendingFusion, setPendingFusion] = useState(null);
  const [cascadeHistoryError, setCascadeHistoryError] = useState('');
  const operation = useRef(null), revision = useRef(0), context = useRef('');
  const selectedModelId = useRef(modelId); selectedModelId.current = modelId;
  const selectedAlgorithm = useRef(algorithm); selectedAlgorithm.current = algorithm;
  const modelSelections = useRef({});
  const userId = auth.actor?.user_id, partId = part?.run_id || '';
  const contextKey = JSON.stringify([auth.version, userId, partId, qualityPart?.quality_part_id, algorithm, modelId,
    threshold, confidence, iou, calibrationPolicy, cascadePatchcoreId, cascadeYoloId]);
  context.current = contextKey;
  const result = savedResult?.context === contextKey ? savedResult.value : null;
  const currentCascade = savedCascadeResult?.context === contextKey ? savedCascadeResult.value : null;
  const cascadeResult = currentCascade || (!inputImage && !busy && !pendingFusion
    && (restoredCascade?.quality_part_id || '') === (qualityPart?.quality_part_id || '') ? restoredCascade : null);
  const available = capabilities?.algorithms?.find(item => item.id === algorithm);
  const models = (capabilities?.models || []).filter(item => item.algorithm === algorithm);
  const model = models.find(item => item.model_id === modelId);
  const patchcoreModels = (capabilities?.models || []).filter(item => item.algorithm === 'patchcore');
  const yoloModels = (capabilities?.models || []).filter(item => item.algorithm === 'yolo');
  const cascadePatchcore = patchcoreModels.find(item => item.model_id === cascadePatchcoreId);
  const cascadeYolo = yoloModels.find(item => item.model_id === cascadeYoloId);
  if (model) modelSelections.current[algorithm] = { model_id: modelId, threshold, confidence, iou };
  const limits = capabilities?.limits || VISION_LIMITS;
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const parametersValid = algorithm === 'patchcore' ? positive(threshold) : positive(confidence) && Number(confidence) <= 1 && positive(iou) && Number(iou) <= 1;
  let trainingConfig = null;
  try { if (preprocessing.blur_sigma !== '') trainingConfig = verifiedPatchcorePreprocessing({ ...preprocessing, blur_sigma: Number(preprocessing.blur_sigma) }); } catch { /* The editable form can be temporarily incomplete. */ }
  const referenceBlocked = qualityPart?.scope === 'production' && inputImage?.source === 'public_gear_reference';
  const canDetect = !!userId && checked && !loading && available?.available === true && !!model && !!inputImage && parametersValid && !busy && !referenceBlocked;
  const patchcoreAvailable = capabilities?.algorithms?.find(item => item.id === 'patchcore')?.available === true;
  const yoloAvailable = capabilities?.algorithms?.find(item => item.id === 'yolo')?.available === true;
  const canCascade = !!userId && checked && !loading && patchcoreAvailable && yoloAvailable
    && !!cascadePatchcore && !!cascadeYolo && positive(cascadePatchcore.suggested_threshold)
    && !!inputImage && !busy && !referenceBlocked;
  const canCalibrate = !!userId && checked && !loading && algorithm === 'patchcore' && available?.available === true && !!model && !model.read_only && calibrationNormal.length >= 2 && calibrationDefect.length >= 1 && !busy;

  function invalidate(keepNotice = false) {
    revision.current++;
    operation.current?.controller.abort(); operation.current = null;
    setBusy(''); setSavedResult(null); setSavedCascadeResult(null); setError(''); if (!keepNotice) setNotice('');
  }
  function begin(kind) {
    const current = { generation: revision.current, context: context.current, controller: new AbortController(), kind };
    operation.current = current; setBusy(kind); setError(''); setNotice('');
    return current;
  }
  const currentOperation = current => operation.current === current && current.generation === revision.current && current.context === context.current && !current.controller.signal.aborted;
  function finish(current) { if (currentOperation(current)) { operation.current = null; setBusy(''); } }

  useEffect(() => { invalidate(true); }, [contextKey]);
  useEffect(() => () => { revision.current++; operation.current?.controller.abort(); }, []);

  useEffect(() => {
    invalidate(); setCapabilities(null); setSamples([]); setInputImage(null); setModelId(''); setCascadePatchcoreId(''); setCascadeYoloId(''); setThreshold('1'); setConfidence('0.25'); setIou('0.45'); setCalibrationNormal([]); setCalibrationDefect([]);
    modelSelections.current = {};
  }, [auth.version]);

  useEffect(() => {
    const controller = new AbortController();
    setRestoredCascade(null); setPendingFusion(null); setCascadeHistoryError('');
    if (!checked || !userId) return () => controller.abort();
    let receipt;
    try { receipt = JSON.parse(sessionStorage.getItem(cascadeStorageKey(userId)) || 'null'); } catch { /* History is optional. */ }
    if (inspectionIdPattern.test(receipt?.patchcore_inspection_id || '')
      && inspectionIdPattern.test(receipt?.yolo_inspection_id || '')) setPendingFusion(receipt);
    else if (inspectionIdPattern.test(receipt?.inspection_id || '')) {
      request(prefix + '/inspections/' + receipt.inspection_id, { signal: controller.signal }).then(value => {
        const saved = verifiedSequentialVisionResult(value);
        if (saved.inspection_id !== receipt.inspection_id) throw new Error('已保存联合检测编号不一致。');
        if (!controller.signal.aborted) setRestoredCascade(saved);
      }).catch(failure => { if (!controller.signal.aborted && !failure.sessionChanged) setCascadeHistoryError('上次联合记录暂未恢复：' + failure.message); });
    }
    return () => controller.abort();
  }, [checked, userId, auth.version]);

  useEffect(() => { setCalibrationNormal([]); setCalibrationDefect([]); }, [modelId]);

  useEffect(() => {
    const controller = new AbortController();
    if (!checked || !userId) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    request(prefix + '/capabilities', { signal: controller.signal }).then(value => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(value?.algorithms) || !Array.isArray(value?.models)
        || (value.model_warnings !== undefined && (!Array.isArray(value.model_warnings) || value.model_warnings.some(item => typeof item !== 'string')))) throw new Error('视觉检测能力返回无效，请刷新模型状态。');
      for (const item of value.models) {
        verifiedVisionModel(item);
        if (item.algorithm === 'patchcore' && item.calibration) verifiedCalibrationModel(item, item.model_id, item.calibration.policy);
      }
      if (value.dataset && (!Array.isArray(value.dataset.samples) || value.dataset.samples.length > 24
        || value.dataset.samples.some(row => !/^[A-Za-z0-9_-]{1,100}$/.test(row?.sample_id || '') || typeof row.filename !== 'string'
          || !Array.isArray(row.defect_labels)))) throw new Error('齿轮测试数据清单无效。');
      setCapabilities(value);
      setCascadePatchcoreId(previous => value.models.some(item => item.algorithm === 'patchcore' && item.model_id === previous)
        ? previous : value.models.find(item => item.algorithm === 'patchcore')?.model_id || '');
      setCascadeYoloId(previous => value.models.some(item => item.algorithm === 'yolo' && item.model_id === previous)
        ? previous : value.models.find(item => item.algorithm === 'yolo')?.model_id || '');
      setDatasetSampleId(previous => value.dataset?.samples.some(row => row.sample_id === previous) ? previous : value.dataset?.samples[0]?.sample_id || '');
      const readyModels = value.models.filter(item => value.algorithms.some(entry => entry.id === item.algorithm && entry.available === true));
      if (!readyModels.some(item => item.algorithm === selectedAlgorithm.current && item.model_id === selectedModelId.current)) {
        const next = readyModels.find(item => item.algorithm === selectedAlgorithm.current) || readyModels[0]
          || value.models.find(item => item.algorithm === selectedAlgorithm.current);
        if (next) setAlgorithm(next.algorithm);
        setModelId(next?.model_id || '');
        if (next?.algorithm === 'patchcore') setThreshold(String(next.suggested_threshold));
        if (next?.algorithm === 'yolo') applyYoloParameters(next);
      }
    }).catch(failure => { if (!controller.signal.aborted && !failure.sessionChanged) { setCapabilities(null); setError(failure.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [checked, userId, auth.version, refresh]);

  async function selectFiles(event, training) {
    const files = Array.from(event.target.files || []);
    invalidate(); training ? setSamples([]) : setInputImage(null);
    if (!files.length) return;
    let selected;
    try { selected = validateVisionFiles(files, limits, training); }
    catch (failure) { event.target.value = ''; setError(failure.message); return; }
    const current = begin(training ? 'read-training' : 'read-image');
    try {
      const images = await Promise.all(selected.map(file => readImage(file, current.controller.signal)));
      if (training) validateTrainingPayload(images.map(item => item.data));
      if (!currentOperation(current)) return;
      training ? setSamples(images) : setInputImage(images[0]);
    } catch (failure) { if (currentOperation(current) && failure.name !== 'AbortError') setError(failure.message); }
    finally { finish(current); }
  }

  async function loadGearSample() {
    const dataset = capabilities?.dataset, id = datasetSampleId || dataset?.samples?.[0]?.sample_id;
    if (!id || operation.current || !userId) return;
    invalidate(); const current = begin('read-gear');
    try {
      const sample = await request(prefix + '/dataset/samples/' + encodeURIComponent(id), { signal: current.controller.signal });
      const expected = dataset.samples.find(row => row.sample_id === id);
      if (sample?.sample_id !== id || sample.filename !== expected?.filename
        || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(sample.image || '')) throw new Error('齿轮测试图片返回无效。');
      if (!currentOperation(current)) return;
      setInputImage({ name: sample.filename, data: sample.image, source: 'public_gear_reference' });
      setNotice('已加载真实齿轮独立测试图片；点击运行缺陷检测查看模型结果。');
    } catch (failure) { if (currentOperation(current) && !failure.sessionChanged) setError(failure.message); }
    finally { finish(current); }
  }

  async function train() {
    if (operation.current || !userId || available?.can_train !== true || samples.length < 2 || !modelName.trim() || !trainingConfig) return;
    invalidate(); const current = begin('train');
    try {
      const value = verifiedPatchcoreModel(await request(prefix + '/patchcore/train', {
        method: 'POST', signal: current.controller.signal,
        body: JSON.stringify({ name: modelName.trim(), images: samples.map(item => item.data), coreset_ratio: 0.1, preprocessing: trainingConfig }),
      }));
      if (!currentOperation(current)) return;
      finish(current);
      setCapabilities(previous => ({ ...previous, models: [...(previous?.models || []).filter(item => item.model_id !== value.model_id), value] }));
      setModelId(value.model_id); setThreshold(String(value.suggested_threshold));
      setCascadePatchcoreId(value.model_id);
      // The model changes the inspection context; show confirmation after that effect.
      setNotice(`记忆库已建立：${value.name} · ${value.sample_count} 张正常样本 · ${value.memory_size} 个特征。`);
    } catch (failure) { if (currentOperation(current) && failure.name !== 'AbortError') setError(failure.message); }
    finally { finish(current); }
  }

  async function selectCalibrationFiles(event, group) {
    const files = Array.from(event.target.files || []), setImages = group === 'normal' ? setCalibrationNormal : setCalibrationDefect;
    invalidate(); setImages([]);
    if (!files.length) return;
    let selected;
    try {
      selected = validateCalibrationFiles(files, group, limits);
      const others = group === 'normal' ? calibrationDefect : calibrationNormal;
      if (selected.length + others.length > 24) throw new Error('正常与缺陷校准图片合计最多 24 张。');
    } catch (failure) { event.target.value = ''; setError(failure.message); return; }
    const current = begin(`read-calibration-${group}`);
    try {
      const images = await Promise.all(selected.map(file => readImage(file, current.controller.signal)));
      if (!currentOperation(current)) return;
      const normals = group === 'normal' ? images : calibrationNormal, defects = group === 'defect' ? images : calibrationDefect;
      if (normals.length >= 2 && defects.length >= 1) validateCalibrationPayload(normals.map(item => item.data), defects.map(item => item.data));
      setImages(images);
    } catch (failure) { if (currentOperation(current) && failure.name !== 'AbortError') setError(failure.message); }
    finally { finish(current); }
  }

  async function calibrate() {
    if (!canCalibrate || operation.current) return;
    invalidate(); const current = begin('calibrate');
    try {
      const normalImages = calibrationNormal.map(item => item.data), defectImages = calibrationDefect.map(item => item.data);
      validateCalibrationPayload(normalImages, defectImages);
      const value = verifiedCalibrationModel(await request(prefix + '/patchcore/calibrate', {
        method: 'POST', signal: current.controller.signal,
        body: JSON.stringify({ model_id: modelId, normal_images: normalImages, defect_images: defectImages, policy: calibrationPolicy }),
      }), modelId, calibrationPolicy);
      if (!currentOperation(current)) return;
      finish(current);
      setCapabilities(previous => ({ ...previous, models: (previous?.models || []).map(item => item.model_id === value.model_id ? value : item) }));
      setThreshold(String(value.suggested_threshold));
      setNotice(`阈值已校准：${CALIBRATION_POLICIES[calibrationPolicy]} · ${value.suggested_threshold.toFixed(4)}。请使用独立测试图片验证。`);
    } catch (failure) { if (currentOperation(current) && failure.name !== 'AbortError') setError(failure.message); }
    finally { finish(current); }
  }

  async function detect() {
    if (!canDetect || operation.current) return;
    invalidate(); const current = begin('detect');
    const body = { algorithm, model_id: modelId, image: inputImage.data,
      filename: inputImage.name, ...(partId && inputImage.source !== 'public_gear_reference' ? { part_id: partId } : {}),
      image_source: inputImage.source === 'public_gear_reference' ? 'public_gear_reference' : 'upload',
      ...(qualityPart ? { quality_part_id: qualityPart.quality_part_id } : {}),
      ...(algorithm === 'patchcore' ? { threshold: Number(threshold) } : {}), confidence: Number(confidence), iou: Number(iou) };
    try {
      const value = verifiedVisionResult(await request(prefix + '/detect', { method: 'POST', signal: current.controller.signal, body: JSON.stringify(body) }), body);
      if (currentOperation(current)) onInspection?.(value);
      if (currentOperation(current)) setSavedResult({ context: current.context, value });
    } catch (failure) { if (currentOperation(current) && failure.name !== 'AbortError') setError(failure.message); }
    finally { finish(current); }
  }

  async function detectCascade() {
    if (!canCascade || operation.current) return;
    invalidate(); const current = begin('cascade');
    const imageSource = inputImage.source === 'public_gear_reference' ? 'public_gear_reference' : 'upload';
    const common = { image: inputImage.data, filename: inputImage.name, image_source: imageSource,
      ...(partId && imageSource !== 'public_gear_reference' ? { part_id: partId } : {}),
      ...(qualityPart ? { quality_part_id: qualityPart.quality_part_id } : {}) };
    const patchcoreBody = { ...common, algorithm: 'patchcore', model_id: cascadePatchcore.model_id,
      threshold: Number(cascadePatchcore.suggested_threshold), confidence: 0.25, iou: 0.45 };
    const yoloParameters = yoloModelParameters(cascadeYolo);
    const yoloBody = { ...common, algorithm: 'yolo', model_id: cascadeYolo.model_id,
      confidence: Number(yoloParameters.confidence), iou: Number(yoloParameters.iou) };
    let patchcoreResult;
    try {
      patchcoreResult = verifiedVisionResult(await request(prefix + '/detect', {
        method: 'POST', signal: current.controller.signal, body: JSON.stringify(patchcoreBody),
      }), patchcoreBody);
      if (!currentOperation(current)) return;
      setSavedCascadeResult({ context: current.context, value: { status: 'incomplete', classification: 'incomplete', patchcore: patchcoreResult, yolo: null } });
      onInspection?.({ ...patchcoreResult, sequential_pending: true });
      const yoloResult = verifiedVisionResult(await request(prefix + '/detect', {
        method: 'POST', signal: current.controller.signal, body: JSON.stringify(yoloBody),
      }), yoloBody);
      if (!currentOperation(current)) return;
      sequentialVisionResult(patchcoreResult, yoloResult);
      onInspection?.({ ...yoloResult, sequential_pending: true });
      const pair = { patchcore_inspection_id: patchcoreResult.inspection_id, yolo_inspection_id: yoloResult.inspection_id };
      setPendingFusion(pair);
      try { sessionStorage.setItem(cascadeStorageKey(userId), JSON.stringify(pair)); } catch { /* Current-page retry remains available. */ }
      setSavedCascadeResult({ context: current.context, value: { status: 'incomplete', classification: 'incomplete', patchcore: patchcoreResult, yolo: yoloResult } });
      await saveCascade(pair, current);
    } catch (failure) {
      if (currentOperation(current) && failure.name !== 'AbortError') setError(patchcoreResult
        ? `PatchCore 已完成，但 YOLO 未完成：${failure.message}`
        : `PatchCore 未完成，已停止后续 YOLO：${failure.message}`);
    } finally { finish(current); }
  }

  async function saveCascade(pair, current) {
    try {
      const value = verifiedSequentialVisionResult(await request(prefix + '/sequential/fuse', {
        method: 'POST', signal: current.controller.signal, body: JSON.stringify(pair),
      }), pair);
      if (!currentOperation(current)) return;
      setPendingFusion(null); setRestoredCascade(null);
      setSavedCascadeResult({ context: current.context, value });
      try { sessionStorage.setItem(cascadeStorageKey(userId), JSON.stringify({ inspection_id: value.inspection_id })); } catch { /* Evidence remains saved on the server. */ }
      onInspection?.(value);
    } catch (failure) {
      if (currentOperation(current) && failure.name !== 'AbortError') setError('两阶段已完成，联合记录尚未确认保存：' + failure.message + '。可重试保存，无需重新推理。');
    }
  }

  async function retryCascadeSave() {
    if (!pendingFusion || operation.current || !userId) return;
    const current = begin('cascade-save');
    try { await saveCascade(pendingFusion, current); } finally { finish(current); }
  }

  function chooseModel(value) {
    invalidate(); setModelId(value);
    const next = models.find(item => item.model_id === value);
    if (positive(next?.suggested_threshold)) setThreshold(String(next.suggested_threshold));
    if (next?.algorithm === 'yolo') applyYoloParameters(next);
  }

  function applyYoloParameters(next) {
    const parameters = yoloModelParameters(next);
    setConfidence(parameters.confidence); setIou(parameters.iou);
  }

  function chooseAlgorithm(value) {
    invalidate(); setAlgorithm(value);
    const previous = modelSelections.current[value], candidates = (capabilities?.models || []).filter(item => item.algorithm === value);
    const next = candidates.find(item => item.model_id === previous?.model_id) || candidates[0];
    setModelId(next?.model_id || '');
    if (next?.algorithm === 'patchcore') setThreshold(next.model_id === previous?.model_id ? previous.threshold : String(next.suggested_threshold));
    if (next?.algorithm === 'yolo') {
      if (next.model_id === previous?.model_id) { setConfidence(previous.confidence); setIou(previous.iou); }
      else applyYoloParameters(next);
    }
  }

  return <section className="quality-vision" aria-labelledby="quality-vision-heading" data-vision-busy={busy || undefined}>
    <header className="vision-heading"><div><p className="vision-eyebrow">IMAGE INSPECTION</p><h2 id="quality-vision-heading">视觉缺陷检测</h2>
      <p>上传产品实拍图片，用 PatchCore 定位未知异常，或用 YOLO 识别已训练的缺陷类别。</p></div>
      <span className="vision-badge">独立视觉结果</span></header>
    <div className="vision-controls">
      <label>视觉检测算法<select aria-label="视觉检测算法" value={algorithm} onChange={event => chooseAlgorithm(event.target.value)}>
        <option value="patchcore">PatchCore · 无监督异常检测</option><option value="yolo">YOLO · 缺陷目标检测</option>
      </select></label>
      <div className="vision-readiness"><span className={`vision-status ${available?.available === true && !!model ? 'ready' : ''}`}>
        {loading ? '正在检查模型状态…' : available?.available === true && model ? algorithm === 'patchcore' ? '特征提取模型就绪' : 'YOLO 缺陷权重就绪' : algorithm === 'patchcore' && available?.can_train === true ? '可建立正常样本记忆库' : '模型尚未就绪'}</span>
        <button type="button" className="button" disabled={!userId || loading || !!busy} onClick={() => { invalidate(); setRefresh(value => value + 1); }}>刷新模型状态</button></div>
    </div>
    {available?.reason && <p className="vision-note">{available.reason}</p>}
    {capabilities?.model_warnings?.map((warning, index) => <p className="vision-note vision-model-warning" key={index}>{warning}</p>)}
    {!userId && checked && <p className="vision-note">请先通过顶部“注册 / 登录”登录维修小组账号，再上传样本和检测图片。</p>}
    <label className="vision-model-label">{algorithm === 'patchcore' ? '检测记忆库' : '检测模型'}<select aria-label={algorithm === 'patchcore' ? '检测记忆库' : '检测模型'} value={modelId} disabled={loading || !models.length} onChange={event => chooseModel(event.target.value)}>
      {!models.length && <option value="">{algorithm === 'patchcore' ? '请先建立正常样本记忆库' : '暂无可用缺陷模型，请配置权重后刷新'}</option>}{models.map(item => <option key={item.model_id} value={item.model_id}>{item.name}</option>)}</select></label>
    <ModelDetails model={model} />
    {capabilities?.dataset && <div className="vision-training" data-testid="gear-dataset">
      <h3>{capabilities.dataset.name}</h3>
      <p className="vision-note">真实塑料齿轮研究数据，独立测试图片仅用于检测核验。{capabilities.dataset.normal_count === 0 && '当前没有已确认正常齿轮测试图，不能据此统计正常图误报率。'}</p>
      <label>齿轮测试图片<select aria-label="齿轮测试图片" value={datasetSampleId || capabilities.dataset.samples[0]?.sample_id || ''} onChange={event => { invalidate(); setDatasetSampleId(event.target.value); }}>
        {capabilities.dataset.samples.map(row => <option key={row.sample_id} value={row.sample_id}>{row.filename} · {row.defect_labels.join(' / ') || '无缺陷标注'}</option>)}
      </select></label>
      <button className="button" type="button" disabled={!userId || !!busy || !capabilities.dataset.samples.length} onClick={loadGearSample}>加载齿轮测试图片</button>
    </div>}
    <div className="vision-flows"><Flow title={algorithm === 'patchcore' ? '正常样本建库流程' : '缺陷模型训练流程（离线）'} items={flows[algorithm].training} />
      <Flow title="图像检测流程" items={flows[algorithm].inference} /></div>
    {algorithm === 'patchcore' && <PatchcoreExplanation />}
    {algorithm === 'patchcore' ? <div className="vision-training">
      <h3>正常样本记忆库</h3><p className="vision-note">仅使用同一产品、同一机位和光照条件下的正常样本，无需缺陷标注。至少 2 张，最多 {limits.max_training_images || 24} 张；每张不超过 4 MB，整批编码后不超过 40 MB。</p>
      <div className="vision-training-fields"><label>记忆库名称<input aria-label="记忆库名称" maxLength={100} value={modelName} onChange={event => { if (busy === 'train') invalidate(); setModelName(event.target.value); }} /></label>
        <label>正常训练样本<input key={`training-${auth.version}`} type="file" accept={accept} multiple aria-label="正常训练样本" disabled={!userId || loading} onChange={event => selectFiles(event, true)} /></label></div>
      <div className="vision-preprocessing-fields">
        <label>特征提取分辨率<select aria-label="特征提取分辨率" value={preprocessing.input_size} onChange={event => { invalidate(); setPreprocessing(previous => ({ ...previous, input_size: Number(event.target.value) })); }}><option value="224">224 × 224</option><option value="448">448 × 448</option></select></label>
        <label>缩放方式<select aria-label="缩放方式" value={preprocessing.resize_mode} onChange={event => { invalidate(); setPreprocessing(previous => ({ ...previous, resize_mode: event.target.value })); }}><option value="stretch">拉伸至正方形</option><option value="letterbox">等比缩放与边缘补齐</option></select></label>
        <label>对比度处理<select aria-label="对比度处理" value={preprocessing.contrast} onChange={event => { invalidate(); setPreprocessing(previous => ({ ...previous, contrast: event.target.value })); }}><option value="none">保留原始对比度</option><option value="clahe">CLAHE · 局部对比度增强</option></select></label>
        <label>热力图平滑 σ<input aria-label="热力图平滑 σ" type="number" min="0" max="8" step="0.5" value={preprocessing.blur_sigma} onChange={event => { invalidate(); setPreprocessing(previous => ({ ...previous, blur_sigma: event.target.value })); }} /></label>
      </div>
      <p className="vision-note">以上配置用于新建记忆库，并固定用于后续推理。更改配置后需重新建库和校准阈值；提高分辨率或增强对比度的效果须通过独立测试确认。</p>
      <div className="vision-training-footer"><p className="vision-note">{busy === 'read-training' ? '正在读取正常样本…' : samples.length ? `已读取 ${samples.length} 张正常样本：${samples.map(item => item.name).join('、')}` : '尚未选择正常样本'}</p>
        <button type="button" className="button" disabled={!userId || available?.can_train !== true || samples.length < 2 || !modelName.trim() || !trainingConfig || !!busy} onClick={train}>{busy === 'train' ? '正在提取特征并建库…' : '建立正常样本记忆库'}</button></div>
      {model && !model.read_only && <details className="vision-calibration"><summary>使用独立图片校准阈值</summary>
        <p className="vision-note">上传未参与建库的已知正常图片和已知缺陷图片。至少 2 张正常图片、1 张缺陷图片，合计最多 24 张，编码后不超过 40 MB。请另留测试集，服务端会检查校准图片与建库样本是否重复。</p>
        <div className="vision-training-fields"><label>正常校准图片<input key={`calibration-normal-${auth.version}-${modelId}`} type="file" multiple accept={accept} aria-label="正常校准图片" disabled={!userId || loading} onChange={event => selectCalibrationFiles(event, 'normal')} /><span>已读取 {calibrationNormal.length} 张</span></label>
          <label>缺陷校准图片<input key={`calibration-defect-${auth.version}-${modelId}`} type="file" multiple accept={accept} aria-label="缺陷校准图片" disabled={!userId || loading} onChange={event => selectCalibrationFiles(event, 'defect')} /><span>已读取 {calibrationDefect.length} 张</span></label></div>
        <div className="vision-calibration-actions"><label>阈值策略<select aria-label="阈值策略" value={calibrationPolicy} onChange={event => { invalidate(); setCalibrationPolicy(event.target.value); }}>{Object.entries(CALIBRATION_POLICIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button type="button" className="button" disabled={!canCalibrate} onClick={calibrate}>{busy === 'calibrate' ? '正在计算独立样本分数…' : '校准并应用阈值'}</button></div>
        <p className="vision-note">召回优先：漏检率权重为误检率的 5 倍；平衡：两者等权；校准集零误报：先确保这些正常图片没有误报，再尽量减少漏检。</p>
      </details>}
      {model?.calibration && <CalibrationSummary calibration={model.calibration} threshold={threshold} synthetic={model.threshold_method === 'independent_labeled_synthetic_calibration'} />}
    </div> : <p className="vision-note vision-yolo-note">YOLO 仅识别所选模型覆盖的缺陷类别。请使用与训练数据相近的产品、机位和光照，并用本产线独立样本验证效果后用于质量判定。</p>}
    <div className="vision-query">
      <div><label>待检测图片<input key={`query-${auth.version}`} type="file" accept={accept} aria-label="待检测图片" disabled={!userId || loading} onChange={event => selectFiles(event, false)} /></label>
        <p className="vision-note">PNG / JPEG / WebP，单张不超过 4 MB。{part ? `关联零件：${part.name}（${part.number}）` : '可直接检测图片，无需先选择 CAD 零件。'}</p></div>
      <div className="vision-parameters">{algorithm === 'patchcore' ? <label>异常距离阈值<input type="number" aria-label="异常距离阈值" min="0.000001" step="0.05" value={threshold} onChange={event => { invalidate(); setThreshold(event.target.value); }} /></label> : <>
        <label>置信度阈值<input type="number" aria-label="置信度阈值" min="0.01" max="1" step="0.05" value={confidence} onChange={event => { invalidate(); setConfidence(event.target.value); }} /></label>
        <label>NMS IoU 阈值<input type="number" aria-label="NMS IoU 阈值" min="0.01" max="1" step="0.05" value={iou} onChange={event => { invalidate(); setIou(event.target.value); }} /></label></>}</div>
    </div>
    {inputImage?.source === 'public_gear_reference' && <p className="vision-note">当前是公开数据集的参考齿轮图片，不代表所选 CAD 零件的实拍，不关联当前工件身份。</p>}
    <section className="vision-cascade" aria-labelledby="vision-cascade-heading">
      <h3 id="vision-cascade-heading">PatchCore → YOLO11 顺序联合检测</h3>
      <p className="vision-note">第一阶段用正常记忆库判断是否偏离正常分布；第一阶段成功后，同一张图片始终继续运行 YOLO11，识别已知缺陷类别。任一模型检出异常，联合结论即为异常。</p>
      <div className="vision-controls">
        <label>第一阶段 · 正常记忆库<select aria-label="联合检测PatchCore记忆库" value={cascadePatchcoreId} disabled={loading || !!busy || !patchcoreModels.length} onChange={event => { invalidate(); setCascadePatchcoreId(event.target.value); }}>
          {!patchcoreModels.length && <option value="">请先使用正常齿轮图片建立记忆库</option>}
          {patchcoreModels.map(item => <option key={item.model_id} value={item.model_id}>{item.name}</option>)}</select></label>
        <label>第二阶段 · 缺陷模型<select aria-label="联合检测YOLO模型" value={cascadeYoloId} disabled={loading || !!busy || !yoloModels.length} onChange={event => { invalidate(); setCascadeYoloId(event.target.value); }}>
          {!yoloModels.length && <option value="">暂无可用YOLO缺陷模型</option>}
          {yoloModels.map(item => <option key={item.model_id} value={item.model_id}>{item.name}</option>)}</select></label>
      </div>
      <p className="vision-note">PatchCore 使用记忆库保存阈值 {cascadePatchcore?.suggested_threshold ?? '—'}；YOLO 使用模型建议置信度 {cascadeYolo ? yoloModelParameters(cascadeYolo).confidence : '—'}、NMS IoU {cascadeYolo ? yoloModelParameters(cascadeYolo).iou : '—'}。</p>
      {!cascadePatchcore && <p className="vision-note vision-model-warning">当前缺少正常齿轮 PatchCore 记忆库。上传真实合格齿轮图片建库后，联合检测才可运行。</p>}
      {pendingFusion && <p className="vision-note">两阶段检测已保存，联合记录待确认。<button className="button" type="button" disabled={!!busy || !userId} onClick={retryCascadeSave}>重试保存联合结果</button></p>}
      {cascadeHistoryError && <p className="vision-error" role="alert">{cascadeHistoryError}</p>}
      <div className="vision-run"><span className="vision-note">{busy === 'cascade' ? '正在执行 PatchCore；完成后继续 YOLO11…' : inputImage ? `联合检测图片：${inputImage.name}` : '请先选择待检测图片'}</span>
        <button className="button primary" type="button" disabled={!canCascade || !!pendingFusion} onClick={detectCascade}>{busy === 'cascade' ? '正在顺序检测…' : '运行 PatchCore → YOLO11'}</button></div>
    </section>
    {algorithm === 'patchcore' && <p className="vision-note">异常分数为原始特征距离，数值越高越异常，不是概率。建议阈值需结合独立正常样本和已知缺陷验证，才能用于生产判定。</p>}
    {algorithm === 'yolo' && model && <p className="vision-note">模型建议：置信度 {yoloModelParameters(model).confidence} · NMS IoU {yoloModelParameters(model).iou}。{model.calibration_scope === 'synthetic_calibration_only' && '建议参数来自独立合成校准集，真实产线需重新校准。'} <button type="button" className="button" disabled={!!busy} onClick={() => { invalidate(); applyYoloParameters(model); }}>应用模型建议参数</button></p>}
    <div className="vision-run"><span className="vision-note">{busy === 'read-image' ? '正在读取待检测图片…' : busy === 'detect' ? '正在对上传图片运行模型推理…' : inputImage ? `待检测：${inputImage.name}` : '等待上传待检测图片'}</span>
      <button className="button primary" type="button" disabled={!canDetect} onClick={detect}>{busy === 'detect' ? '正在检测视觉缺陷…' : '运行缺陷检测'}</button></div>
    {error && <p className="vision-error" role="alert">{error}</p>}{notice && <p className="vision-notice" role="status">{notice}</p>}
    {cascadeResult && <section className="vision-output vision-cascade-output" aria-labelledby="vision-cascade-output-heading">
      <header><h3 id="vision-cascade-output-heading">顺序联合检测结果</h3><span className={`vision-status ${cascadeResult.status === 'defect' ? 'defect' : cascadeResult.status === 'clear' ? 'clear' : ''}`}>
        {cascadeResult.classification === 'known_defect' ? '已知缺陷'
          : cascadeResult.classification === 'unknown_anomaly' ? '未知异常，待复检'
            : cascadeResult.classification === 'clear' ? '两阶段均未检出异常' : cascadeResult.yolo ? '等待联合记录确认' : 'PatchCore完成，YOLO未完成'}</span></header>
      {cascadeResult === restoredCascade && <p className="vision-note">已恢复上次保存的联合记录 · {cascadeResult.filename} · {cascadeResult.created_at}</p>}
      <p className="vision-note">{cascadeResult.classification === 'known_defect' ? 'YOLO11已定位已训练的缺陷类别，联合判定为异常。'
        : cascadeResult.classification === 'unknown_anomaly' ? 'PatchCore发现偏离正常分布，但YOLO11未识别已知类别；保留热力图并进入人工复检。'
          : cascadeResult.classification === 'clear' ? 'PatchCore与YOLO11均未检出异常；该结论只覆盖当前图片和已验证的模型范围。'
            : cascadeResult.yolo ? '两阶段证据已保存，联合结论需等待服务器确认。' : '第一阶段证据已保存；第二阶段没有形成完整结果，不能给出联合结论。'}</p>
      <div className="vision-images">
        {cascadeResult.patchcore?.heatmap_image && <figure><img src={cascadeResult.patchcore.heatmap_image} alt="联合检测PatchCore热力图" /><figcaption>第一阶段 · PatchCore异常热力图</figcaption></figure>}
        {cascadeResult.yolo?.annotated_image && <figure><img src={cascadeResult.yolo.annotated_image} alt="联合检测YOLO定位图" /><figcaption>第二阶段 · YOLO11缺陷定位</figcaption></figure>}
      </div>
      <dl className="vision-metrics">
        <div><dt>PatchCore结论</dt><dd>{cascadeResult.patchcore.status === 'defect' ? '异常' : '正常'}</dd><small>分数 {cascadeResult.patchcore.score.toFixed(4)} / 阈值 {cascadeResult.patchcore.threshold}</small></div>
        <div><dt>YOLO11结论</dt><dd>{cascadeResult.yolo ? cascadeResult.yolo.status === 'defect' ? '缺陷' : '未检出' : '未完成'}</dd><small>{cascadeResult.yolo ? `${cascadeResult.yolo.defects.length} 个区域` : '无完整结果'}</small></div>
        <div><dt>联合判定</dt><dd>{cascadeResult.status === 'defect' ? '异常' : cascadeResult.status === 'clear' ? '未检出' : '待确认'}</dd><small>任一模型检出即为异常</small></div>
      </dl>
      <p className="vision-note">检测编号：PatchCore {cascadeResult.patchcore.inspection_id} · YOLO11 {cascadeResult.yolo?.inspection_id || '未生成'}</p>
      {cascadeResult.inspection_id && <p className="vision-note">联合记录：{cascadeResult.inspection_id} · 已保存两阶段证据
        {cascadeResult === restoredCascade && qualityPart?.latest_inspection_id === cascadeResult.inspection_id
          && <button type="button" className="button" onClick={() => onInspection?.(cascadeResult)}>用于本次综合复核</button>}</p>}
    </section>}
    <section className="vision-output" aria-labelledby="vision-output-heading">
      {referenceBlocked && <p className="vision-error">公开齿轮测试图片只能用于流程验证。请在综合统计中切换至流程验证并选择验证实物，或上传当前生产实物的图片。</p>}
      <p className="vision-note">{qualityPart ? '本次视觉检测关联实物：' + qualityPart.serial_number + ' · 批次 ' + qualityPart.batch_id + ' · 设计版本 ' + qualityPart.design_version
        : '未选择综合复核实物，本次视觉结果单独保存，不计入综合合格率。'}</p>
      <header><h3 id="vision-output-heading">视觉检测结果</h3><span className={`vision-status ${result?.status || ''}`}>{result ? result.status === 'defect' ? '检出视觉缺陷' : '未检出视觉缺陷' : '等待单模型检测'}</span></header>
      <p className="vision-note">结论仅针对本次图片和模型覆盖的视觉特征；未检出视觉缺陷不代表整件质量合格。下方模拟参数比对单独展示。</p>
      {inputImage && <div className="vision-images"><figure><img src={inputImage.data} alt="待检测原图" /><figcaption>原图 · {inputImage.name}</figcaption></figure>
        {result && <figure><img src={result.annotated_image} alt="缺陷定位结果" /><figcaption>定位结果 · {result.image.width} × {result.image.height}</figcaption></figure>}
        {result?.heatmap_image && <figure><img src={result.heatmap_image} alt="PatchCore 异常热力图" /><figcaption>异常距离热力图</figcaption></figure>}</div>}
      {result && <>
        <dl className="vision-metrics"><div><dt>缺陷区域数</dt><dd>{result.defects.length}</dd></div><div><dt>{algorithm === 'patchcore' ? '最大异常距离' : '最高缺陷置信度'}</dt><dd>{algorithm === 'patchcore' ? result.score.toFixed(4) : `${(result.score * 100).toFixed(1)}%`}</dd></div><div><dt>判定阈值</dt><dd>{result.threshold}</dd></div></dl>
        <p className="vision-note">检测编号：{result.inspection_id} · 模型：{result.model_id} · {result.created_at}</p>
        {!!result.defects.length && <div className="vision-table-scroll"><table><thead><tr><th>区域</th><th>缺陷类别</th><th>置信度</th><th>边界框 [x1, y1, x2, y2]</th></tr></thead><tbody>{result.defects.map((defect, index) => <tr key={index}><td>{index + 1}</td><td>{defect.label}</td><td>{defect.confidence == null ? '—（异常距离判定）' : `${(defect.confidence * 100).toFixed(1)}%`}</td><td>{defect.bbox.map(value => Number(value.toFixed(1))).join(', ')}</td></tr>)}</tbody></table></div>}
        <details className="vision-steps"><summary>本次推理过程（{result.steps.length} 步）</summary><ol>{result.steps.map((step, index) => <li key={index}><strong>{stepNames[step.name] || step.name}</strong> · 已完成<p>{step.detail}</p></li>)}</ol></details>
      </>}
    </section>
  </section>;
}
