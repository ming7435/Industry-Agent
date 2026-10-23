import { pipelineMessages } from './VisionPipelineResult.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import { qualityDecision, combinedStatus, qualityRate, verifiedCombinedPart, verifiedCombinedReport } from './combinedQuality.mjs';
import './combinedQuality.css';

const prefix = '/api/quality/vision/combined/parts';
const blankReview = () => ({ kind: 'parameters', decision: 'pending', all_required_checked: false,
  evidence_reference: '', notes: '', inspection_id: '' });

export default function CombinedQualityWorkspace({ auth, checked, onSelectionChange, latestInspection }) {
  const [scope, setScope] = useState('validation'), [batch, setBatch] = useState('');
  const [report, setReport] = useState(null), [selected, setSelected] = useState('');
  const [registration, setRegistration] = useState({ batch_id: '', serial_number: '', design_version: '' });
  const [review, setReview] = useState(blankReview);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [refresh, setRefresh] = useState(0);
  const [uncertain, setUncertain] = useState(null);
  const generation = useRef(0), posting = useRef(false), scopeRef = useRef(''), reportContext = useRef('');
  const userId = auth.actor?.user_id;
  const context = JSON.stringify([auth.version, userId, scope, batch]);
  scopeRef.current = context;
  const currentReport = report?.scope === scope && report.batch_id === batch ? report : null;
  const part = currentReport?.items.find(p => p.quality_part_id === selected) || null;
  const summary = currentReport?.summary;

  useEffect(() => {
    setReport(null); setSelected(''); setRegistration({ batch_id: '', serial_number: '', design_version: '' });
    setReview(blankReview()); setUncertain(null); setError(''); setNotice('');
  }, [auth.version]);
  useEffect(() => { onSelectionChange(part); }, [part, onSelectionChange]);
  useEffect(() => {
    if (latestInspection?.quality_part_id) setRefresh(v => v + 1);
  }, [latestInspection?.inspection_id]);
  useEffect(() => { setReview(blankReview()); setNotice(''); }, [selected, scope, batch]);
  useEffect(() => {
    const abort = new AbortController(), current = ++generation.current;
    if (reportContext.current !== context) { setReport(null); reportContext.current = context; }
    setError(''); setLoading(false);
    if (!checked || !userId) return () => abort.abort();
    setLoading(true);
    request(prefix + '?scope=' + scope + '&batch_id=' + encodeURIComponent(batch), { signal: abort.signal })
      .then(value => {
        if (abort.signal.aborted || current !== generation.current) return;
        const saved = verifiedCombinedReport(value, scope, batch);
        setReport(saved); setSelected(previous => saved.items.some(p => p.quality_part_id === previous) ? previous : saved.items[0]?.quality_part_id || '');
      })
      .catch(e => { if (!abort.signal.aborted && current === generation.current && !e.sessionChanged) setError(e.message); })
      .finally(() => { if (!abort.signal.aborted && current === generation.current) setLoading(false); });
    return () => abort.abort();
  }, [checked, userId, context, refresh]);

  async function save(path, body) {
    if (posting.current) return;
    const current = scopeRef.current;
    posting.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const value = verifiedCombinedPart(await request(path, { method: 'POST', body: JSON.stringify(body) }));
      if (scopeRef.current !== current) return;
      if (value.scope !== scope || (body.serial_number && (value.serial_number !== body.serial_number
        || value.batch_id !== body.batch_id || value.design_version !== body.design_version))
        || (body.kind && value.quality_part_id !== selected)) throw new Error('保存结果与本次零件不一致，请刷新核对。');
      setSelected(value.quality_part_id); setUncertain(null);
      setRefresh(v => v + 1); setNotice('已保存；综合判定和合格率按最新记录更新。');
    } catch (e) {
      if (scopeRef.current !== current || e.sessionChanged) return;
      setError(e.message);
      if (!e.status || e.status >= 500) setUncertain({ path, body });
      else setUncertain(null);
    } finally { posting.current = false; setBusy(false); }
  }

  const locked = !checked || !userId || loading || busy;
  const updateReview = (key, value) => { setReview(v => ({ ...v, [key]: value })); setUncertain(null); };
  const useInspection = () => {
    setReview(v => ({ ...v, kind: 'visual', decision: 'pending', all_required_checked: false,
      inspection_id: latestInspection.inspection_id, evidence_reference: latestInspection.inspection_id,
      notes: latestInspection.algorithm === 'patchcore_yolo_pipeline' ? pipelineMessages[latestInspection.classification] + ' 请填写人工复核依据。' : latestInspection.algorithm === 'patchcore_yolo'
        ? `联合检测：PatchCore ${latestInspection.patchcore.status === 'defect' ? '异常' : '未检出'}；YOLO11 ${latestInspection.yolo.status === 'defect' ? '检出缺陷' : '未检出'}。请填写人工复核依据。` : '' }));
  };
  return <section className="quality-vision combined-quality" aria-labelledby="combined-quality-heading">
    <header className="vision-heading"><div><h2 id="combined-quality-heading">综合判定与合格率</h2>
      <p>按实物编号统计。参数和外观均确认通过才合格，任一项确认不通过则不合格，其余待复检。</p></div></header>
    <div className="vision-controls">
      <label>统计范围<select aria-label="综合统计范围" value={scope} disabled={busy || !!uncertain} onChange={e => { setScope(e.target.value); setBatch(''); setSelected(''); }}>
        <option value="validation">流程验证（不计生产合格率）</option><option value="production">生产复核（人工确认）</option>
      </select></label>
      <label>统计批次<select aria-label="综合统计批次" value={batch} disabled={locked || !!uncertain} onChange={e => { setBatch(e.target.value); setSelected(''); }}>
        <option value="">全部已登记批次</option>{report?.batches.map(b => <option key={b} value={b}>{b}</option>)}
      </select></label>
    </div>
    <p className="vision-note">{scope === 'validation'
      ? '当前展示流程验证合格率，与生产统计隔离。模拟参数、测试齿轮图片仅用于验证。'
      : '当前展示人工复核综合合格率。请登记真实生产实物，依据测量报告及完整外观复核填写；现有模拟参数不作为生产测量依据。'}</p>
    <dl className="vision-metrics" data-testid="combined-quality-metrics">
      <div><dt>{scope === 'validation' ? '流程验证合格率' : '综合合格率（人工复核）'}</dt><dd>{qualityRate(summary?.rate_percent)}</dd><small>{summary ? summary.qualified + ' / ' + summary.determinate + ' 件可判定' : '暂无可核对统计'}</small></div>
      <div><dt>待复检件数</dt><dd>{summary?.pending ?? '—'}</dd><small>已登记 {summary?.total ?? '—'} 件 · 不合格 {summary?.unqualified ?? '—'} 件</small></div>
      <div><dt>整件判定覆盖率</dt><dd>{qualityRate(summary?.coverage_percent)}</dd><small>合格率＝合格件数 ÷（合格＋不合格件数）</small></div>
    </dl>
    <p className="vision-note">仅统计当前账号已登记实物。待复检不计入合格率分母；没有可判定零件时显示“—”。重复登记及复检按同一实物最新结果计一次。此处记录综合复核，不执行产品放行。</p>
    {!userId && checked && <p className="vision-note">请先登录维修小组账号，再登记和复核。</p>}
    <details className="vision-explanation combined-register"><summary>登记本批次实物（未检测先计为待复检）</summary>
      <form onSubmit={e => { e.preventDefault(); save(prefix, { scope, ...Object.fromEntries(Object.entries(registration).map(([k, v]) => [k, v.trim()])) }); }}>
        <fieldset disabled={locked || !!uncertain}><div className="combined-registration">
          <label>批次编号<input aria-label="综合登记批次编号" required maxLength={100} value={registration.batch_id} onChange={e => setRegistration(v => ({ ...v, batch_id: e.target.value }))} /></label>
          <label>实物唯一编号<input aria-label="综合登记实物编号" required maxLength={100} value={registration.serial_number} onChange={e => setRegistration(v => ({ ...v, serial_number: e.target.value }))} /></label>
          <label>设计版本<input aria-label="综合登记设计版本" required maxLength={100} value={registration.design_version} onChange={e => setRegistration(v => ({ ...v, design_version: e.target.value }))} /></label>
        </div><button type="submit" className="button">登记零件</button></fieldset>
      </form>
    </details>
    <label>当前复核实物<select aria-label="当前复核实物" value={selected} disabled={locked || !!uncertain} onChange={e => setSelected(e.target.value)}>
      {!report?.items.length && <option value="">暂无已登记实物</option>}
      {report?.items.map(p => <option key={p.quality_part_id} value={p.quality_part_id}>{p.serial_number} · {p.batch_id} · {p.design_version} · {combinedStatus[p.status]}</option>)}
    </select></label>
    {part && <div className="combined-review">
      <p className="vision-note">参数：{qualityDecision[part.parameters.decision]} · 外观：{qualityDecision[part.visual.decision]} · 综合：<strong>{combinedStatus[part.status]}</strong></p>
      <form onSubmit={e => { e.preventDefault(); save(prefix + '/' + part.quality_part_id + '/reviews',
        { ...review, request_id: crypto.randomUUID(), expected_revision: part.revision }); }}>
        <fieldset disabled={locked || !!uncertain}>
          <div className="vision-controls">
            <label>复核项目<select aria-label="综合复核项目" value={review.kind} onChange={e => { setReview({ ...blankReview(), kind: e.target.value }); }}>
              <option value="parameters">零件参数</option><option value="visual">视觉外观</option></select></label>
            <label>确认结果<select aria-label="综合确认结果" value={review.decision} onChange={e => updateReview('decision', e.target.value)}>
              {Object.entries(qualityDecision).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>
          <label>报告／复核依据<input aria-label="综合复核依据" maxLength={500} required={review.decision !== 'pending'} value={review.evidence_reference} onChange={e => updateReview('evidence_reference', e.target.value)} placeholder={review.kind === 'parameters' ? '测量报告编号及对应实物、设计版本' : '外观复核记录编号（包含必检视角）'} /></label>
          <label>复核说明<textarea aria-label="综合复核说明" required maxLength={2000} value={review.notes} onChange={e => updateReview('notes', e.target.value)} placeholder="填写检查标准、检查范围与结论；填写人工确认依据。" /></label>
          <label className="combined-check"><input type="checkbox" checked={review.all_required_checked} onChange={e => updateReview('all_required_checked', e.target.checked)} />已完成本项目全部必检内容并核对实物、批次和设计版本</label>
          {review.inspection_id && <p className="vision-note">附加视觉证据：{review.inspection_id}（模型结论不会自动改成人工通过）</p>}
          <div className="combined-actions">
            <button type="submit" className="button primary" disabled={review.decision === 'pass' && !review.all_required_checked}>保存本项复核</button>
            {latestInspection?.quality_part_id === selected && !latestInspection.sequential_pending && <button className="button" type="button" onClick={useInspection}>引用本次视觉检测</button>}
          </div>
        </fieldset>
      </form>
      {!!part.history?.length && <details className="vision-steps"><summary>查看复核记录</summary><ul>{part.history.map((r, i) => <li key={r.request_id || i}>{r.kind === 'parameters' ? '零件参数' : '视觉外观'} · {qualityDecision[r.decision]} · {r.evidence_reference || '待补充依据'} · {r.notes} · {r.reviewed_at}</li>)}</ul></details>}
    </div>}
    <div className="combined-actions"><button type="button" className="button" disabled={busy || !userId} onClick={() => setRefresh(v => v + 1)}>刷新综合统计</button>
      {uncertain && <button type="button" className="button" disabled={busy} onClick={() => save(uncertain.path, uncertain.body)}>按原请求核对／重试保存</button>}</div>
    {uncertain && <p className="vision-note">上次保存结果待确认，按原请求重试不会重复计件；请先核对再修改。</p>}
    {error && <p role="alert" className="vision-error">{error}</p>}
    {notice && <p role="status" className="vision-notice">{notice}</p>}
    {loading && <p role="status" className="vision-note">正在读取综合统计…</p>}
  </section>;
}
