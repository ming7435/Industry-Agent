import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import { readProductionJobs } from './production-cad/virtualProduction.mjs';
import { eligibleProductionJobs, verifiedProductionValidation, productionValidationPendingKey, scenarioNames, parameterStatus } from './productionVisionValidation.mjs';
import './qualityVision.css';
import './productionVisionValidation.css';

const prefix = '/api/quality/vision/production';
const algorithmName = { patchcore: 'PatchCore', yolo: 'YOLO' };
const verdict = value => value === 'defect' ? '检出缺陷' : '未检出缺陷';
const savedTime = value => typeof value === 'number' ? new Date(value * (value < 1e12 ? 1000 : 1)).toLocaleString() : value;
function storedPending(key, value) {
  try { if (value === undefined) return JSON.parse(sessionStorage.getItem(key) || 'null');
    if (value) sessionStorage.setItem(key, JSON.stringify(value)); else sessionStorage.removeItem(key);
  } catch { /* The same-page pending request remains available without browser storage. */ }
  return null;
}

function ValidationEvidence({ record }) {
  const check = record.parameter_inspection, scenarios = record.scenarios || [], complete = record.status === 'completed';
  return <>
    {!complete && <p className="vision-note">以下为已保存的部分证据；尚未完成的场景或算法不计为通过，不能据此认定流程验证完成。</p>}
    {check && <><div className="vision-table-scroll"><table aria-label="模拟产出参数比对"><thead><tr><th>生产参数</th><th>设计值</th><th>模拟产出值</th><th>结果</th></tr></thead>
      <tbody>{check.items.map(item => <tr key={item.key}><td>{item.name || item.key}</td><td>{item.expected} {item.unit}</td><td>{item.actual ?? '缺失'} {item.unit}</td><td>{parameterStatus[item.status] || item.status}</td></tr>)}</tbody></table></div>
    <p className="vision-note">参数比对：{parameterStatus[check.status]} · 检测编号 {check.check_id}。只比较模拟加工参数，不能代表实物尺寸合格。</p></>}
    {!!scenarios.length && <div className="vision-table-scroll"><table aria-label="合成场景双算法结果" data-testid="production-validation-comparison"><thead><tr><th>合成场景</th><th>已知标签</th><th>PatchCore 判定 / 原始距离</th><th>YOLO 判定 / 最高置信度</th></tr></thead>
      <tbody>{scenarios.map(scene => <tr key={scene.scenario}><th>{scenarioNames[scene.scenario]}</th><td>{scene.label === 'normal' ? '正常' : '缺陷'}</td>{['patchcore', 'yolo'].map(algorithm => {
        const result = scene.results.find(item => item.algorithm === algorithm);
        if (!result) return <td key={algorithm}>尚未完成</td>;
        return <td key={algorithm}>{verdict(result.status)} · {result.score.toFixed(4)}<br/><small>阈值 {result.threshold} · {(scene.label === 'defect') === (result.status === 'defect') ? '图像标签一致，定位需核对' : scene.label === 'defect' ? '缺陷图未报警' : '误报此正常场景'}</small></td>;
      })}</tr>)}</tbody></table></div>}
    {complete && <><div className="production-vision-counts">{['patchcore', 'yolo'].map(algorithm => <p className="vision-note" key={algorithm}><strong>{algorithmName[algorithm]}</strong>：缺陷图报警 {record.metrics[algorithm].tp} / 2 · 缺陷图未报警 {record.metrics[algorithm].fn} / 2 · 正常识别 {record.metrics[algorithm].tn} / 1 · 正常误报 {record.metrics[algorithm].fp} / 1</p>)}</div>
    <p className="vision-note">上述计数仅描述本次 3 张合成图片，不是产线良率、实物质量结论或模型精度评估。图像报警不证明框住了真实缺陷，请对照已知缺陷掩膜核对位置。</p></>}
    <div data-testid="production-localization">{record.localization_metrics ? <><p className="vision-note">定位核验：预测框与已知缺陷包围框 IoU ≥ 0.5，一对一匹配。</p>{['patchcore', 'yolo'].map(algorithm => {
      const counts = record.localization_metrics[algorithm];
      return <p className="vision-note" key={algorithm}>{algorithmName[algorithm]}：定位命中 {counts.tp} / {counts.ground_truth_count} · 定位漏检 {counts.fn} · 多余框 {counts.fp}</p>;
    })}</> : <p className="vision-note">定位未评估（历史记录）。</p>}</div>
    {scenarios.map(scene => <details className="vision-steps production-vision-scene" key={scene.scenario} data-testid={`production-scenario-${scene.scenario}`}>
      <summary>{scenarioNames[scene.scenario]}：查看原图、标注与模型证据</summary>
      <div className="vision-images"><figure><img src={scene.input_image} alt={`${scenarioNames[scene.scenario]}合成原图`}/><figcaption>合成输入 · 已知标签：{scene.label === 'normal' ? '正常' : '缺陷'}</figcaption></figure>
        <figure><img src={scene.mask_image} alt={`${scenarioNames[scene.scenario]}已知缺陷掩膜`}/><figcaption>生成器保存的已知缺陷区域</figcaption></figure>
        {scene.results.map(result => <React.Fragment key={result.algorithm}><figure><img src={result.annotated_image} alt={`${scenarioNames[scene.scenario]} ${algorithmName[result.algorithm]}检测标注`}/><figcaption>{algorithmName[result.algorithm]} · {verdict(result.status)}</figcaption></figure>
          {result.heatmap_image && <figure><img src={result.heatmap_image} alt={`${scenarioNames[scene.scenario]} PatchCore异常热力图`}/><figcaption>PatchCore 异常距离热力图</figcaption></figure>}</React.Fragment>)}</div>
      <p className="vision-note">同图像素摘要：{scene.image_sha256}</p>
      {scene.results.map(result => <div className="production-vision-model" key={result.algorithm}><strong>{algorithmName[result.algorithm]} · {result.model.name || result.model_id}</strong>
        <p className="vision-note">检测编号 {result.inspection_id} · 模型 {result.model_id} · 原始分数 {result.score} · 阈值 {result.threshold}</p>
        <p className="vision-note">模型权重摘要：{result.model_sha256}{result.memory_bank_sha256 ? ` · 记忆库摘要：${result.memory_bank_sha256}` : ''}</p>
        <p className="vision-note">保存的检测参数：{JSON.stringify(result.parameters)}</p>
        <p className="vision-note">检测区域：{result.defects.length ? result.defects.map(defect => `${defect.label} [${defect.bbox.join(', ')}]${defect.confidence == null ? '' : ` 置信度 ${defect.confidence}`}`).join('；') : '无'}</p>
      </div>)}
    </details>)}
  </>;
}

export default function ProductionVisionValidation({ auth, checked }) {
  const [dataMode, setDataMode] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setDataMode('');
    if (checked && auth.actor?.user_id) request('/api/quality/vision/capabilities', { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setDataMode(value?.data_mode || 'synthetic'); })
      .catch(() => {});
    return () => controller.abort();
  }, [checked, auth.version, auth.actor?.user_id]);
  const [jobs, setJobs] = useState([]), [selected, setSelected] = useState(''), [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false), [reading, setReading] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [pending, setPending] = useState(null), [refresh, setRefresh] = useState(0), [catalogRefresh, setCatalogRefresh] = useState(0);
  const post = useRef(null), generation = useRef(0), pendingRef = useRef(null), scopeRef = useRef('');
  const userId = auth.actor?.user_id, job = jobs.find(value => value.job_id === selected);
  const scope = JSON.stringify([auth.version, userId, selected]); scopeRef.current = scope;
  const key = productionValidationPendingKey(userId, selected);
  pendingRef.current = pending;

  useEffect(() => {
    const abort = new AbortController();
    setJobs([]); setSelected(''); setRecord(null); setPending(null); setError('');
    if (!checked || !userId) { setLoading(false); return () => abort.abort(); }
    setLoading(true);
    readProductionJobs({ signal: abort.signal }).then(values => {
      if (abort.signal.aborted) return;
      const available = eligibleProductionJobs(values).filter(value => auth.actor?.role !== 'technician' || value.actor_id === userId);
      const requested = new URLSearchParams(window.location.search).get('production_job_id');
      setJobs(available);
      setSelected(requested && available.some(value => value.job_id === requested) ? requested : available[0]?.job_id || '');
      if (requested && !available.some(value => value.job_id === requested)) setError('链接中的生产任务尚未完成、待复核或当前账号不可读取。请选择已确认产出。');
    }).catch(failure => { if (!abort.signal.aborted && !failure.sessionChanged) setError(failure.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [checked, userId, auth.version, catalogRefresh]);

  useEffect(() => {
    const current = ++generation.current, abort = new AbortController(); let timer;
    post.current?.abort(); post.current = null; setBusy(false); setRecord(null); setReading(false);
    let original = storedPending(key) || pendingRef.current;
    if (original?.job_id !== selected || typeof original?.request_id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(original.request_id)) original = null;
    setPending(original);
    if (!checked || !userId || !job || loading) return () => abort.abort();
    const valid = () => !abort.signal.aborted && generation.current === current && scopeRef.current === scope;
    const read = async () => {
      if (!valid()) return; setReading(true);
      try {
        const value = await request(`${prefix}/jobs/${job.job_id}/latest`, { signal: abort.signal });
        if (!valid()) return;
        if (!value || !Object.hasOwn(value, 'run')) throw new Error('已保存的验证结果目录不完整，请重新回载。');
        const saved = value.run ? verifiedProductionValidation(value.run, job, original?.request_id) : null;
        setRecord(saved); setError('');
        if (saved && saved.status !== 'running') { original = null; setPending(null); storedPending(key, null); }
        if (saved?.status === 'running') {
          original = { job_id: job.job_id, request_id: saved.request_id }; setPending(original); storedPending(key, original);
          timer = window.setTimeout(read, 2500);
        }
      } catch (failure) { if (valid() && !failure.sessionChanged) { setRecord(null); setError(failure.message); } }
      finally { if (valid()) setReading(false); }
    };
    read();
    return () => { abort.abort(); clearTimeout(timer); post.current?.abort(); post.current = null; generation.current++; };
  }, [scope, checked, loading, refresh]);

  async function verify() {
    if (!job || !userId || loading || reading || post.current || record?.status === 'running') return;
    const original = pending || { job_id: job.job_id, request_id: crypto.randomUUID() };
    const current = generation.current, context = scope, abort = new AbortController();
    const valid = () => !abort.signal.aborted && generation.current === current && scopeRef.current === context;
    post.current = abort; setBusy(true); setError(''); setPending(original); storedPending(key, original);
    try {
      const value = await request(prefix + '/verify', { method: 'POST', body: JSON.stringify(original), signal: abort.signal });
      if (!valid()) return;
      const saved = verifiedProductionValidation(value, job, original.request_id);
      setRecord(saved);
      if (saved.status !== 'running') { setPending(null); storedPending(key, null); }
      else setRefresh(value => value + 1);
    } catch (failure) {
      if (!valid() || failure.sessionChanged) return;
      setError(failure.message);
      if (failure.status && failure.status < 500 && failure.detail?.outcome_unknown !== true) { setPending(null); storedPending(key, null); }
    } finally { if (valid()) { post.current = null; setBusy(false); } }
  }

  function choose(value) {
    generation.current++; post.current?.abort(); post.current = null;
    setBusy(false); setRecord(null); setPending(null); setError(''); setSelected(value);
    const url = new URL(window.location.href); url.searchParams.set('production_job_id', value); window.history.replaceState(null, '', url);
  }

  if (dataMode === 'gear') return <section className="quality-vision production-vision" aria-labelledby="production-vision-heading">
    <h2 id="production-vision-heading">齿轮质检</h2><p className="vision-note">外观检测已切换为真实塑料齿轮数据。请在下方选择齿轮测试图片或上传实拍图片进行检测；设计参数与模拟产出参数单独比对。</p>
  </section>;
  return <section className="quality-vision production-vision" aria-labelledby="production-vision-heading">
    <header className="vision-heading"><div><p className="vision-eyebrow">PRODUCTION FLOW VALIDATION</p><h2 id="production-vision-heading">生产产出视觉流程验证</h2>
      <p>已完成模拟生产 → 保存产出与设计批次 → 生成测试图 → PatchCore + YOLO → 保存并回载结果。</p></div><span className="vision-badge">合成流程验证</span></header>
    <p className="vision-note vision-model-warning">3 种合成纹理测试场景，关联同一模拟产出；不是该零件实拍或 CAD 渲染，不代表真实产线精度。</p>
    {!checked ? <p className="vision-note">正在核验登录状态…</p> : !userId ? <p className="vision-note">登录后可读取已保存的生产产出和验证结果。</p> : <>
      <div className="production-vision-controls"><label>视觉验证生产任务<select aria-label="视觉验证生产任务" value={selected} disabled={loading || !jobs.length} onChange={event => choose(event.target.value)}>
        {!jobs.length && <option value="">{loading ? '正在读取生产产出…' : '暂无已确认的模拟产出'}</option>}
        {jobs.map(value => <option key={value.job_id} value={value.job_id}>{value.batch_id} · {value.part_name || '未命名零件'} · {value.part_number || value.part_id} · {value.job_id.slice(-8)}</option>)}
      </select></label><button type="button" className="button" disabled={loading || busy} onClick={() => setCatalogRefresh(value => value + 1)}>刷新生产产出</button></div>
      {!loading && !jobs.length && <p className="vision-note">尚无已完成且确认的生产产出。请先在生产建模中完成模拟生产，再验证视觉流程。</p>}
      {job && <><dl className="production-vision-source"><div><dt>零件名称 / 编号</dt><dd>{job.part_name || '未命名零件'} / {job.part_number || '—'}</dd></div><div><dt>生产批次</dt><dd>{job.batch_id}</dd></div><div><dt>产出工件</dt><dd>{job.part_id}</dd></div><div><dt>生产任务</dt><dd>{job.job_id}</dd></div><div><dt>设计版本</dt><dd>{job.design_run_id}</dd></div></dl>
        <details className="vision-steps"><summary>生产追溯摘要</summary><p className="vision-note">生产人员：{job.actor_id} · 工厂任务：{job.factory_job_id || '—'}</p><p className="vision-note">设计摘要：{job.design_digest}</p><p className="vision-note">程序摘要：{job.program_digest}</p><p className="vision-note">产出摘要：{job.output.output_digest}</p></details>
        <div className="vision-run"><button className="button primary" type="button" disabled={loading || reading || busy || record?.status === 'running'} onClick={verify}>{busy ? '正在验证产线视觉流程…' : pending ? '按原请求重试验证' : '验证产线视觉流程（合成）'}</button>
          <button className="button" type="button" disabled={busy || reading} onClick={() => setRefresh(value => value + 1)}>回载已保存结果</button></div>
        {pending && <p className="vision-note" role="status">{busy || record?.status === 'running' ? '验证执行中，正在保存结果。' : '原请求结果待确认；回载或重试将保留同一请求编号。'}请求：{pending.request_id}</p>}
        {reading && <p className="vision-note" role="status">正在回载已保存结果…</p>}
        {record && <div className="vision-output" data-testid="production-validation-record"><h3>{record.status === 'completed' ? '合成流程验证已保存' : record.status === 'failed' ? '合成流程验证未完成' : '合成流程验证执行中'}</h3>
          <p className="vision-note">验证编号：{record.run_id} · {savedTime(record.created_at)}</p>
          {record.error && <p className="vision-error">{typeof record.error === 'string' ? record.error : record.error.message || record.error.code || '执行失败，请检查模型与服务配置。'}</p>}
          {(record.parameter_inspection || record.scenarios?.length > 0) && <>{record.generator && <p className="vision-note">生成器 {record.generator.version} · 种子 {record.generator.seed} · 保存参数与模型证据如下。</p>}<ValidationEvidence record={record}/></>}
        </div>}
        {!record && !reading && !pending && <p className="vision-note">当前产出尚无已保存的视觉流程验证结果。</p>}
      </>}
    </>}
    {error && <p className="vision-error" role="alert">{error}</p>}
  </section>;
}
