import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import { readFreeCadSession, validFreeCadRun } from './production-cad/freecad.mjs';
import { buildComparisonPayload, comparisonStatusLabel } from './cadQuality.mjs';
import './cadQuality.css';

function recentCadRun() {
  try { return readFreeCadSession(window.sessionStorage)?.run_id || ''; }
  catch { return ''; }
}

function displayNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(8)).toString() : '—';
}

export default function CadQualityWorkspace() {
  const [runId, setRunId] = useState(recentCadRun);
  const [partId, setPartId] = useState('');
  const [design, setDesign] = useState(null);
  const [entries, setEntries] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const readEpoch = useRef(0);
  const activeRun = useRef(runId.trim());
  const activePart = useRef(partId.trim());
  activeRun.current = runId.trim();
  activePart.current = partId.trim();
  const validDesign = design?.run_id === runId.trim() ? design : null;

  async function loadDesign(identifier = runId) {
    const target = identifier.trim();
    if (!validFreeCadRun(target)) { setError('请输入 FreeCAD 建模成功后生成的完整 FC- 运行编号'); return; }
    const version = ++readEpoch.current;
    setBusy('read'); setError(''); setResult(null); setDesign(null); setEntries({});
    try {
      const record = await request('/api/quality/cad/designs/' + encodeURIComponent(target));
      if (version !== readEpoch.current || activeRun.current !== target) return;
      if (record.run_id !== target || !Array.isArray(record.parameters)) throw new Error('服务器未返回完整的 CAD 设计基准');
      setDesign(record);
    } catch (failure) {
      if (version === readEpoch.current && activeRun.current === target) setError(failure.message);
    } finally {
      if (version === readEpoch.current) setBusy('');
    }
  }

  useEffect(() => {
    if (validFreeCadRun(activeRun.current)) loadDesign(activeRun.current);
    return () => { readEpoch.current++; };
  }, []);

  function changeRun(value) {
    ++readEpoch.current;
    setRunId(value); setDesign(null); setEntries({}); setResult(null); setError(''); setBusy('');
  }

  function updateValue(key, field, value) {
    setEntries((previous) => ({ ...previous, [key]: { ...(previous[key] || {}), [field]: value } }));
    setResult(null);
  }

  async function compare() {
    if (!validDesign || busy) return;
    let payload;
    try {
      const prepared = Object.fromEntries(validDesign.parameters.filter(row => row.exact).map(row => [row.key, {
        ...(entries[row.key] || {}), tolerance: '0',
      }]));
      payload = buildComparisonPayload(validDesign, partId, { ...entries, ...prepared });
    } catch (failure) { setError(failure.message); return; }
    const version = ++readEpoch.current;
    const selectedRun = validDesign.run_id, selectedPart = partId.trim();
    setBusy('compare'); setError(''); setResult(null);
    try {
      const output = await request('/api/quality/cad/compare', {
        method: 'POST', body: JSON.stringify(payload),
      });
      if (version === readEpoch.current && selectedRun === activeRun.current && selectedPart === activePart.current) setResult(output);
    } catch (failure) {
      if (version === readEpoch.current && selectedRun === activeRun.current && selectedPart === activePart.current) setError(failure.message);
    } finally {
      if (version === readEpoch.current) setBusy('');
    }
  }

  const shownRows = result?.items || validDesign?.parameters || [];
  const statusClass = result?.status === 'consistent' ? 'match' : result?.status === 'inconsistent' ? 'mismatch' : 'incomplete';
  return (
    <section className="workspace-view active module-board cad-qms" aria-label="生产零件与 CAD 参数一致性检测">
      <header className="module-hero"><span className="eyebrow">QMS · CAD PARAMETER CHECK</span>
        <h1>生产零件参数一致性检测</h1>
        <p>人工录入生产后零件的实测尺寸，与 FreeCAD 建模保存的设计参数逐项比较。</p>
      </header>

      <section className="panel module-panel cad-qms-setup">
        <div className="panel-heading"><div><span className="eyebrow">01 · 选择比较基准</span><h2>绑定 CAD 建模版本与生产零件</h2></div></div>
        <div className="cad-qms-fields">
          <label>FreeCAD 运行编号
            <input className="select-input" value={runId} onChange={event => changeRun(event.target.value)}
              placeholder="FC-...，默认带入最近一次建模" spellCheck="false" />
          </label>
          <label>生产零件编号
            <input className="select-input" value={partId} onChange={event => { setPartId(event.target.value); setResult(null); }}
              placeholder="例如 PART-001" spellCheck="false" />
          </label>
        </div>
        <div className="action-row"><button className="button" type="button" disabled={busy === 'read' || !validFreeCadRun(runId.trim())} onClick={() => loadDesign()}>
          {busy === 'read' ? '读取中…' : '读取建模参数'}
        </button></div>
        {validDesign ? <div className="cad-qms-source" role="status"><span>已读取已完成并校验的 FreeCAD 模型</span><strong>{validDesign.parameters.length} 个待比对数值参数</strong><small>设计摘要：{validDesign.design_digest.slice(0, 16)}…</small></div>
          : <p className="cad-qms-help">请先在「生产前零件建模」中生成并校验模型。原始运行记录保留约 24 小时，过期需重新取得可信设计基准。</p>}
        {error && <div className="inline-error" role="alert">{error}</div>}
      </section>

      <section className="panel module-panel cad-qms-measurements">
        <div className="panel-heading"><div><span className="eyebrow">02 · 人工实测</span><h2>设计参数与实际尺寸对比</h2></div></div>
        {validDesign ? <>
          <p className="cad-qms-help">逐项录入实际测量值和本次采用的允许偏差。默认不假定任何合格公差；公差由检验人员填写并留痕。齿数等计数参数必须完全相等。</p>
          <div className="cad-qms-table-scroll"><table className="cad-qms-table"><thead><tr><th scope="col">设计参数</th><th scope="col">设计值</th><th scope="col">实测值</th><th scope="col">允许偏差 ±</th><th scope="col">偏差 / 判断</th></tr></thead>
            <tbody>{shownRows.map(row => {
              const entry = entries[row.key] || {};
              const judgement = row.matched === null ? '缺少数据' : row.matched === false ? '超出公差' : row.matched === true ? '一致' : '待检测';
              return <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td>{displayNumber(row.nominal)} <small>{row.unit}</small></td>
                <td><label className="cad-qms-sr-only" htmlFor={'actual-' + row.key}>{row.label} 实测值</label><input id={'actual-' + row.key} type="number" step={row.exact ? '1' : 'any'} className="select-input" value={entry.actual ?? ''} onChange={event => updateValue(row.key, 'actual', event.target.value)} placeholder="录入实测" /></td>
                <td><label className="cad-qms-sr-only" htmlFor={'tolerance-' + row.key}>{row.label} 允许偏差</label><input id={'tolerance-' + row.key} type="number" min="0" step="any" className="select-input" disabled={row.exact} value={row.exact ? '0' : entry.tolerance ?? ''} onChange={event => updateValue(row.key, 'tolerance', event.target.value)} placeholder="需填写" /></td>
                <td className={row.matched === false ? 'cad-qms-bad' : row.matched === true ? 'cad-qms-good' : ''}>{row.delta == null ? '—' : displayNumber(row.delta) + ' ' + row.unit}<small>{judgement}</small></td>
              </tr>;
            })}</tbody></table></div>
          <div className="cad-qms-actions"><button className="button primary" type="button" disabled={Boolean(busy) || !partId.trim()} onClick={compare}>
            {busy === 'compare' ? '正在比对…' : '执行参数一致性检测'}
          </button><span>未填写完整时返回「数据不足」，不会被判定为一致。</span></div>
        </> : <div className="empty-state">读取有效的 FreeCAD 建模参数后，在这里填写生产零件的实际测量数据。</div>}
      </section>

      <section className="panel module-panel cad-qms-result" aria-live="polite">
        <div className="panel-heading"><div><span className="eyebrow">03 · 比对结论</span><h2>参数一致性结果</h2></div></div>
        {result ? <div className={'cad-qms-summary ' + statusClass}>
          <strong>{comparisonStatusLabel(result.status)}</strong>
          <p>共 {result.total} 项 · 符合 {result.matched} 项 · 超差 {result.mismatched} 项 · 缺少 {result.missing?.length || 0} 项</p>
          <p>生产零件 {result.part_id} · FreeCAD 基准 {result.run_id}</p>
          <p>测量来源：人工录入 · 公差来源：人工填写 · {result.persisted ? '实测对照已保存至 QMS' : '数据不完整，本次未保存'}</p>
          <small>{result.message}</small>
        </div> : <div className="empty-state">尚无检测结果。录入实际尺寸后执行对比。</div>}
      </section>
    </section>
  );
}
