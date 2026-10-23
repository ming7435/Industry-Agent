import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import AutoVisionInbox from './AutoVisionInbox.jsx';
import VisionPipelineResult from './VisionPipelineResult.jsx';
import { VISION_LIMITS, DEFAULT_PATCHCORE_PREPROCESSING, CALIBRATION_POLICIES, validateVisionFiles,
  verifiedVisionModel, verifiedCalibrationModel, verifiedPipelineVisionResult, yoloModelParameters, visionDetectionBlocker } from './qualityVision.mjs';
import './qualityVision.css';

const prefix = '/api/quality/vision';
const accept = 'image/png,image/jpeg,image/webp';
const memoryId = 'patchcore-gear';
const yoloId = 'yolo-default';

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

function preprocessingLabel(value) {
  const config = value || DEFAULT_PATCHCORE_PREPROCESSING;
  return `${config.input_size} × ${config.input_size} · ${config.resize_mode === 'letterbox' ? '等比缩放与边缘补齐' : '拉伸缩放'} · ${config.contrast === 'clahe' ? 'CLAHE 局部对比度增强' : '保留原始对比度'} · 高斯 σ = ${config.blur_sigma}`;
}

function ModelDetails({ model }) {
  if (!model) return null;
  return <div className="vision-model-details">
    <div className="vision-model-title"><strong>{model.name}</strong>{model.demo && <span className="vision-model-tag">演示模型</span>}</div>
    {model.description && <p className="vision-note">{model.description}</p>}
    {model.source_url && <p className="vision-note"><a href={model.source_url} target="_blank" rel="noopener noreferrer">模型来源</a></p>}
    {!!model.classes?.length && <div className="vision-model-classes" data-testid="model-classes"><span>覆盖类别</span><ul>{model.classes.map((label, index) => <li key={`${index}-${label}`}>{label}</li>)}</ul></div>}
    <p className="vision-note">当前模型：{model.name}{model.sample_count != null ? ` · ${model.sample_count} 张正常样本` : ''}{model.memory_size != null ? ` · ${model.memory_size} 个记忆特征` : ''}</p>
    {model.algorithm === 'patchcore' && <p className="vision-note" data-testid="saved-preprocessing">已保存配置：{preprocessingLabel(model.preprocessing)}{!model.preprocessing ? '（旧版默认配置）' : ''}</p>}
    {model.algorithm === 'yolo' && <p className="vision-note">固定推理输入：{model.input_size || 640} × {model.input_size || 640}，保留原始对比度。</p>}
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
  const [capabilities, setCapabilities] = useState(null), [loading, setLoading] = useState(false), [refresh, setRefresh] = useState(0);
  const [inputImage, setInputImage] = useState(null), [datasetSampleId, setDatasetSampleId] = useState('');
  const [threshold, setThreshold] = useState(''), [confidence, setConfidence] = useState('0.25'), [iou, setIou] = useState('0.45');
  const [savedResult, setSavedResult] = useState(null), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const operation = useRef(null), revision = useRef(0), context = useRef(''), loadedDefaults = useRef({});
  const userId = auth.actor?.user_id, partId = part?.run_id || '';
  const contextKey = JSON.stringify([auth.version, userId, partId, qualityPart?.quality_part_id, threshold, confidence, iou]);
  context.current = contextKey;
  const result = savedResult?.context === contextKey ? savedResult.value : null;
  const model = capabilities?.models?.find(item => item.algorithm === 'patchcore' && item.model_id === memoryId);
  const yoloModel = capabilities?.models?.find(item => item.algorithm === 'yolo' && item.model_id === yoloId);
  const memoryReady = capabilities?.algorithms?.some(item => item.id === 'patchcore' && item.available === true) && !!model;
  const yoloReady = capabilities?.algorithms?.some(item => item.id === 'yolo' && item.available === true) && !!yoloModel;
  const limits = capabilities?.limits || VISION_LIMITS;
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const parametersValid = positive(threshold) && positive(confidence) && Number(confidence) <= 1 && positive(iou) && Number(iou) <= 1;
  const referenceBlocked = qualityPart?.scope === 'production' && inputImage?.source === 'public_gear_reference';
  const detectBlocker = visionDetectionBlocker({ userId, checked, loading, available: memoryReady,
    model, inputImage, parametersValid, busy, referenceBlocked });
  const canDetect = detectBlocker === null;

  function invalidate(keepNotice = false) {
    revision.current++;
    operation.current?.controller.abort(); operation.current = null;
    setBusy(''); setSavedResult(null); setError(''); if (!keepNotice) setNotice('');
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
    invalidate(); setCapabilities(null); setInputImage(null); setThreshold(''); setConfidence('0.25'); setIou('0.45');
    loadedDefaults.current = {};
  }, [auth.version]);

  useEffect(() => {
    const controller = new AbortController();
    if (!checked || !userId) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    request(prefix + '/capabilities', { signal: controller.signal }).then(value => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(value?.algorithms) || !Array.isArray(value?.models)
        || (value.model_warnings !== undefined && (!Array.isArray(value.model_warnings) || value.model_warnings.some(item => typeof item !== 'string')))) throw new Error('视觉检测能力返回无效，请刷新模型状态。');
      const fixedModels = value.models.filter(item => (item.algorithm === 'patchcore' && item.model_id === memoryId)
        || (item.algorithm === 'yolo' && item.model_id === yoloId));
      for (const item of fixedModels) {
        verifiedVisionModel(item);
        if (item.algorithm === 'patchcore' && item.calibration) verifiedCalibrationModel(item, item.model_id, item.calibration.policy);
      }
      if (value.dataset && (!Array.isArray(value.dataset.samples) || value.dataset.samples.length > 24
        || value.dataset.samples.some(row => !/^[A-Za-z0-9_-]{1,100}$/.test(row?.sample_id || '') || typeof row.filename !== 'string'
          || !Array.isArray(row.defect_labels)))) throw new Error('齿轮测试数据清单无效。');
      setCapabilities({ ...value, models: fixedModels });
      setDatasetSampleId(previous => value.dataset?.samples.some(row => row.sample_id === previous) ? previous : value.dataset?.samples[0]?.sample_id || '');
      const pc = fixedModels.find(item => item.model_id === memoryId), yolo = fixedModels.find(item => item.model_id === yoloId);
      // Reuse saved defaults on first load or a changed deployment, preserving manual edits on an ordinary refresh.
      const pcKey = JSON.stringify([pc?.suggested_threshold, pc?.preprocessing, pc?.calibration?.created_at]);
      const yoloKey = JSON.stringify([yolo?.recommended_confidence, yolo?.recommended_iou, yolo?.name]);
      if (loadedDefaults.current.pc !== pcKey) setThreshold(pc ? String(pc.suggested_threshold) : '');
      if (loadedDefaults.current.yolo !== yoloKey) {
        const parameters = yoloModelParameters(yolo);
        setConfidence(parameters.confidence); setIou(parameters.iou);
      }
      loadedDefaults.current = { pc: pcKey, yolo: yoloKey };
    }).catch(failure => { if (!controller.signal.aborted && !failure.sessionChanged) { setCapabilities(null); setError(failure.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [checked, userId, auth.version, refresh]);

  async function selectFiles(event) {
    const files = Array.from(event.target.files || []);
    invalidate(); setInputImage(null);
    if (!files.length) return;
    let selected;
    try { selected = validateVisionFiles(files, limits, false); }
    catch (failure) { event.target.value = ''; setError(failure.message); return; }
    const current = begin('read-image');
    try {
      const image = await readImage(selected[0], current.controller.signal);
      if (currentOperation(current)) setInputImage(image);
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
      setNotice('已加载齿轮独立测试图片，点击运行缺陷检测查看结果。');
    } catch (failure) { if (currentOperation(current) && !failure.sessionChanged) setError(failure.message); }
    finally { finish(current); }
  }

  async function detect() {
    if (!canDetect || operation.current) return;
    invalidate(); const current = begin('detect');
    const body = { patchcore_model_id: memoryId, image: inputImage.data, filename: inputImage.name,
      ...(partId && inputImage.source !== 'public_gear_reference' ? { part_id: partId } : {}),
      image_source: inputImage.source === 'public_gear_reference' ? 'public_gear_reference' : 'upload',
      ...(qualityPart ? { quality_part_id: qualityPart.quality_part_id } : {}),
      threshold: Number(threshold), confidence: Number(confidence), iou: Number(iou) };
    try {
      const value = verifiedPipelineVisionResult(await request(prefix + '/pipeline/detect', {
        method: 'POST', signal: current.controller.signal, body: JSON.stringify(body) }), body);
      if (currentOperation(current)) onInspection?.(value);
      if (currentOperation(current)) setSavedResult({ context: current.context, value });
    } catch (failure) { if (currentOperation(current) && failure.name !== 'AbortError') setError(failure.message); }
    finally { finish(current); }
  }

  return <section className="quality-vision vision-workbench" aria-labelledby="quality-vision-heading" data-vision-busy={busy || undefined}>
    <header className="vision-heading"><div><p className="vision-eyebrow">IMAGE INSPECTION</p><h2 id="quality-vision-heading">视觉缺陷检测</h2>
      <p>上传待检图片，使用已有 PatchCore 记忆库判断异常，再由 YOLO 定位缺陷位置与类别。</p></div>
      <span className="vision-badge">PatchCore → YOLO</span></header>
    <div className="vision-main-grid">
      <aside className="vision-setup" aria-label="检测设置">
        <div className="vision-section-label"><span>01</span> 检测设置</div>
        <div className="vision-pipeline-model" data-testid="fixed-memory"><strong>第一步 · PatchCore 异常判断</strong>
          <p>{model?.name || '齿轮正常记忆库'}</p>
          <p className="vision-note">{loading ? '正在加载已有记忆库…' : memoryReady ? `已加载 · ${model.sample_count} 张正常样本 · 使用已保存阈值` : '已有记忆库暂不可用，请刷新状态或联系维护人员。'}</p></div>
        <div className="vision-pipeline-model" data-testid="fixed-yolo"><strong>第二步 · YOLO 缺陷定位</strong>
          <p>{yoloModel?.name || 'YOLO 缺陷检测模型'}</p><p className="vision-note">{loading ? '正在检查模型…' : yoloReady ? '模型就绪 · 异常时自动运行' : '模型暂不可用，异常图将保留为待复核。'}</p></div>
        <div className="vision-readiness"><button type="button" className="button" disabled={!userId || loading || !!busy} onClick={() => { invalidate(); setRefresh(value => value + 1); }}>刷新模型状态</button></div>
        {capabilities?.model_warnings?.map((warning, index) => <p className="vision-note vision-model-warning" key={index}>{warning}</p>)}
        {!userId && checked && <p className="vision-note">请先通过顶部“注册 / 登录”登录维修小组账号，再上传待检测图片。</p>}
        <div className="vision-query"><div><label>待检测图片<input key={`query-${auth.version}`} type="file" accept={accept} aria-label="待检测图片" disabled={!userId || loading} onChange={selectFiles} /></label>
          <p className="vision-note">PNG / JPEG / WebP，单张不超过 4 MB。{part ? `关联零件：${part.name}（${part.number}）` : '可直接上传图片检测。'}</p></div></div>
        {inputImage?.source === 'public_gear_reference' && <p className="vision-note">当前为测试数据集图片，不代表所选 CAD 零件的实拍。</p>}
        <div className="vision-run"><span className="vision-note">{busy === 'read-image' ? '正在读取待检测图片…' : busy === 'detect' ? '正在串联检测：PatchCore 判断 → 异常时 YOLO 定位…' : inputImage ? `待检测：${inputImage.name}` : '等待上传待检测图片'}</span>
          <button className="button primary" type="button" disabled={!canDetect} title={detectBlocker || undefined} onClick={detect}>{busy === 'detect' ? '正在检测视觉缺陷…' : '运行缺陷检测'}</button></div>
        {detectBlocker && !loading && <p className="vision-note vision-run-hint" role="status">{detectBlocker}</p>}
        {error && <p className="vision-error" role="alert">{error}</p>}{notice && <p className="vision-notice" role="status">{notice}</p>}
        <details className="vision-tuning"><summary>检测参数 <span>{threshold ? `阈值 ${Number(threshold).toFixed(4)}` : '等待加载'}</span></summary>
          <div className="vision-parameters">
            <label>异常距离阈值<input type="number" aria-label="异常距离阈值" min="0.000001" step="0.05" value={threshold} onChange={event => { invalidate(); setThreshold(event.target.value); }} /></label>
            <label>置信度阈值<input type="number" aria-label="置信度阈值" min="0.01" max="1" step="0.05" value={confidence} onChange={event => { invalidate(); setConfidence(event.target.value); }} /></label>
            <label>NMS IoU 阈值<input type="number" aria-label="NMS IoU 阈值" min="0.01" max="1" step="0.05" value={iou} onChange={event => { invalidate(); setIou(event.target.value); }} /></label>
          </div><p className="vision-note">已自动加载记忆库阈值及 YOLO 建议参数，可直接检测。异常距离不是概率。</p>
        </details>
        {capabilities?.dataset && <details className="vision-sample-library" data-testid="gear-dataset"><summary>使用齿轮测试图片</summary>
          <p className="vision-note">独立测试图片仅用于检测核验。</p>
          <label>齿轮测试图片<select aria-label="齿轮测试图片" value={datasetSampleId} onChange={event => { invalidate(); setDatasetSampleId(event.target.value); }}>
            {capabilities.dataset.samples.map(row => <option key={row.sample_id} value={row.sample_id}>{row.filename} · {row.defect_labels.join(' / ') || '无缺陷标注'}</option>)}
          </select></label><button className="button" type="button" disabled={!userId || !!busy || !capabilities.dataset.samples.length} onClick={loadGearSample}>加载齿轮测试图片</button>
        </details>}
        <details className="vision-model-disclosure"><summary>模型信息与适用范围</summary><ModelDetails model={model} /><ModelDetails model={yoloModel} /></details>
      </aside>
      <section className="vision-output vision-result-stage" aria-labelledby="vision-output-heading">
        {referenceBlocked && <p className="vision-error">测试齿轮图片只能用于流程验证。请切换至流程验证实物，或上传当前生产实物的图片。</p>}
        <p className="vision-note">{qualityPart ? '本次视觉检测关联实物：' + qualityPart.serial_number + ' · 批次 ' + qualityPart.batch_id + ' · 设计版本 ' + qualityPart.design_version
          : '未选择综合复核实物，本次视觉结果单独保存，不计入综合合格率。'}</p>
        <header><h3 id="vision-output-heading">视觉检测结果</h3><span className={`vision-status ${result?.status || ''}`}>{result ? result.status === 'clear' ? '本图未检出异常' : result.classification === 'known_defect' ? '已定位视觉缺陷' : '异常待复核' : '等待串联检测'}</span></header>
        <p className="vision-note">结论仅针对本次图片；未检出异常不代表整件质量合格。尺寸结果在“尺寸比对”查看。</p>
        <VisionPipelineResult result={result} busy={busy === 'detect'} />
        {!inputImage && <div className="vision-empty-state"><svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="7" y="8" width="34" height="32" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="17" cy="18" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="m8 33 10-9 7 6 6-5 10 8" stroke="currentColor" strokeWidth="1.5"/></svg><h4>上传图片，开始视觉检测</h4><p>已有记忆库和缺陷模型会自动完成两阶段检测。</p><span>PNG / JPEG / WebP · 单张不超过 4 MB</span></div>}
        {inputImage && <div className="vision-images"><figure><img src={inputImage.data} alt="待检测原图" /><figcaption>原图 · {inputImage.name}</figcaption></figure>
          {result && <figure><img src={result.annotated_image} alt="缺陷定位结果" /><figcaption>{result.classification === 'known_defect' ? 'YOLO 缺陷定位' : 'PatchCore 异常区域'} · {result.image.width} × {result.image.height}</figcaption></figure>}
          {result?.heatmap_image && <figure><img src={result.heatmap_image} alt="PatchCore 异常热力图" /><figcaption>异常距离热力图</figcaption></figure>}</div>}
        {result?.yolo?.defects.length > 0 && <div className="vision-table-scroll"><table><thead><tr><th>缺陷类别</th><th>置信度</th><th>位置 [x1, y1, x2, y2]</th></tr></thead><tbody>{result.yolo.defects.map((d, i) => <tr key={i}><td>{d.label}</td><td>{(d.confidence * 100).toFixed(1)}%</td><td>{d.bbox.map(v => Number(v.toFixed(1))).join(', ')}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
    <div className="vision-secondary">
      {model?.calibration && <details className="vision-advanced"><summary>记忆库校准记录<span>已保存 · 只读</span></summary>
        <CalibrationSummary calibration={model.calibration} threshold={threshold} synthetic={model.threshold_method === 'independent_labeled_synthetic_calibration'} />
      </details>}
      {model && <AutoVisionInbox checked={checked} userId={userId} />}
    </div>
  </section>;
}
