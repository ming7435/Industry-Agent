import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import { freeCadRequest } from './production-cad/freecad.mjs';
import { readQualityCandidates, verifiedQualityPart } from './qualityParts.mjs';
import { getTeamSession, setTeamSessionActor, subscribeTeamSession } from '../teamSession.mjs';
import { teamRequest } from '../teamApi.mjs';
import { detectSimulation, formatSimulationRate, pendingSimulationKey, simulationResult, possibleProblemLocations } from './qualitySimulation.mjs';
import './qualityPart.css';

const prefix = '/api/quality/simulation';
const statusLabel = { qualified: '模拟一致性合格', unqualified: '模拟一致性不合格', partial: '存在不一致／待判定样本', review: '待复核' };
const displayLineName = name => name === '模拟 A 线' ? 'A 线' : name || '未知产线';

function ProblemLocations({ result }) {
  const locations = possibleProblemLocations(result);
  return <section className="quality-location-panel" aria-labelledby="quality-location-heading">
    <h3 id="quality-location-heading">可能的问题机器／位置</h3>
    {locations.length ? <>
      <p className="quality-standard-note">根据本批次异常参数推测排查方向，不代表设备故障已确认；不自动调整或控制设备。</p>
      <ul className="quality-location-list">{locations.map(item => <li className="quality-location-card" data-location-category={item.category} key={item.category}>
        <header><h4>{item.location}</h4><span className="quality-location-status">可能原因，待核实</span></header>
        <dl className="quality-location-fields">
          <div><dt>可能的问题机器</dt><dd>{item.device_name} · {item.device_id || '未知编号'}</dd></div>
          <div><dt>关联产线</dt><dd>{displayLineName(item.line_name)}</dd></div>
        </dl>
        <p className="quality-problem-note">异常依据：{item.reason}</p>
        <p className="quality-standard-note">涉及 {item.sample_count} 件样本：</p>
        <ul className="quality-location-evidence">{item.evidence.map(row => <li key={`${row.part_id}:${row.key}`}>
          {row.part_id} · {row.name || row.key}：{row.actual == null ? '缺少测量记录' : `设计值 ${row.expected} ${row.unit === '—' ? '' : row.unit}，模拟测量值 ${row.actual} ${row.unit === '—' ? '' : row.unit}`}
        </li>)}</ul>
        <p className="quality-problem-note">对应解决建议：</p>
        <ol className="quality-location-advice">{item.recommendations.map(step => <li key={step}>{step}</li>)}</ol>
      </li>)}</ul>
    </> : <p className="quality-problem-note">{!result ? '尚无检测结果，不能推测问题机器／位置。'
      : result.status === 'qualified' ? '未发现可用于定位的异常，不推测问题机器。'
        : result.status === 'review' ? '结果待复核，暂不推测问题机器／位置。'
          : '异常或缺测明细不足，暂不能推测问题机器／位置。'}</p>}
  </section>;
}

export default function QualityWorkspace() {
  const [auth, setAuth] = useState(getTeamSession);
  const [checked, setChecked] = useState(false);
  const [parts, setParts] = useState([]), [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true), [reading, setReading] = useState(false);
  const [capability, setCapability] = useState(null), [basis, setBasis] = useState(null), [result, setResult] = useState(null);
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [pending, setPending] = useState(null);
  const revision = useRef(0), posting = useRef(false);
  const userId = auth.actor?.user_id;

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeTeamSession(value => { if (active) setAuth(value); });
    teamRequest('me').then(value => { if (active) setTeamSessionActor(value.user); })
      .catch(() => {}).finally(() => { if (active) setChecked(true); });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!checked) return;
    const abort = new AbortController();
    revision.current++; posting.current = false;
    setLoading(true); setCapability(null); setBasis(null); setResult(null); setPending(null); setBusy(false); setMessage('');
    let source;
    try { source = readQualityCandidates(window.sessionStorage); }
    catch { source = { currentRunId: '', candidates: [] }; }
    let readFailure = '';
    const cad = Promise.all(source.candidates.map(candidate => freeCadRequest(`/runs/${candidate.run_id}`, { signal: abort.signal })
      .then(record => verifiedQualityPart(record, candidate)).catch(error => { if (error.status >= 500) readFailure = error.message; return null; })));
    const catalog = userId ? request(prefix + '/designs', { signal: abort.signal }).then(value => value.items || []).catch(error => { readFailure = error.message; return []; }) : Promise.resolve([]);
    if (userId) request(prefix + '/capabilities', { signal: abort.signal }).then(value => {
      if (!abort.signal.aborted) { setCapability(value); if (!value.enabled) setMessage(value.reason || '模拟检测未启用'); }
    }).catch(error => { if (!abort.signal.aborted) setMessage(error.message); });
    Promise.all([cad, catalog]).then(([values, saved]) => {
      if (abort.signal.aborted) return;
      const available = values.filter(Boolean), ids = new Set(available.map(p => p.run_id));
      for (const item of saved) if (!ids.has(item.run_id)) {
        const part = verifiedQualityPart({ ...item, status: 'completed', validation: { valid: true, solid_count: 1 } }, item);
        if (part) { available.push(part); ids.add(item.run_id); }
      }
      setParts(available);
      setSelected(available.some(p => p.run_id === source.currentRunId) ? source.currentRunId : available[0]?.run_id || '');
      setLoading(false);
      if (readFailure) setMessage(readFailure);
    });
    return () => { abort.abort(); revision.current++; };
  }, [checked, auth.version]);

  useEffect(() => {
    const generation = ++revision.current, abort = new AbortController();
    setBasis(null); setResult(null); setPending(null); setMessage('');
    if (loading || !selected || !userId) { setReading(false); return () => abort.abort(); }
    setReading(true);
    let savedRequest;
    try { savedRequest = JSON.parse(sessionStorage.getItem(pendingSimulationKey(userId, selected)) || 'null'); } catch { /* unavailable storage */ }
    if (savedRequest?.design_run_id !== selected || !/^[A-Za-z0-9_-]{1,128}$/.test(savedRequest?.request_id || '')) savedRequest = null;
    if (savedRequest) setPending(savedRequest);
    const readBasis = request(prefix + '/designs/' + selected, { signal: abort.signal }).then(value => {
      if (abort.signal.aborted || generation !== revision.current) return;
      if (!savedRequest && value.latest) setResult(simulationResult(value.latest, selected));
      if (value.standard_error) {
        setMessage(`建模标准暂不可用：${value.standard_error}。当前仅展示已保存的模拟批次，不能发起新检测。`);
        return;
      }
      if (value.basis?.run_id !== selected || !Array.isArray(value.basis?.parameters) || !value.basis.parameters.length) throw new Error('建模标准返回无效');
      setBasis(value.basis);
    }).catch(error => { if (!abort.signal.aborted && generation === revision.current) setMessage(error.message); });
    const readPending = savedRequest ? request(prefix + '/requests/' + savedRequest.request_id, { signal: abort.signal }).then(value => {
      if (abort.signal.aborted || generation !== revision.current) return;
      setResult(simulationResult(value, selected, savedRequest.request_id)); setPending(null);
      try { sessionStorage.removeItem(pendingSimulationKey(userId, selected)); } catch { /* no storage */ }
    }).catch(() => {
      if (!abort.signal.aborted && generation === revision.current) setMessage('上次提交结果待确认，请先核对或按原请求重试。');
    }) : Promise.resolve();
    Promise.all([readBasis, readPending])
      .finally(() => { if (!abort.signal.aborted && generation === revision.current) setReading(false); });
    return () => { abort.abort(); revision.current++; };
  }, [selected, loading, auth.version]);

  async function detect() {
    if (posting.current || !basis || !userId || capability?.enabled !== true) return;
    const generation = revision.current, retrying = !!pending, body = pending || { design_run_id: selected, request_id: crypto.randomUUID() };
    const storageKey = pendingSimulationKey(userId, selected);
    posting.current = true; setBusy(true); setMessage(''); setResult(null); setPending(body);
    try { sessionStorage.setItem(storageKey, JSON.stringify(body)); } catch { /* current-page reconciliation remains available */ }
    try {
      const saved = await detectSimulation(request, body);
      if (generation !== revision.current) return;
      setResult(saved); setPending(null);
      try { sessionStorage.removeItem(storageKey); } catch { /* no storage */ }
    } catch (error) {
      if (generation !== revision.current) return;
      setMessage(error.message);
      if (!retrying && !error.outcomeUnknown && !error.sessionChanged) {
        setPending(null); try { sessionStorage.removeItem(storageKey); } catch { /* no storage */ }
      }
    } finally { if (generation === revision.current) { posting.current = false; setBusy(false); } }
  }

  async function reconcile() {
    if (!pending || posting.current) return;
    const generation = revision.current;
    posting.current = true; setBusy(true);
    try {
      const saved = simulationResult(await request(prefix + '/requests/' + pending.request_id), selected, pending.request_id);
      if (generation !== revision.current) return;
      setResult(saved); setPending(null); setMessage('');
      try { sessionStorage.removeItem(pendingSimulationKey(userId, selected)); } catch { /* no storage */ }
    } catch (error) { if (generation === revision.current) setMessage(error.message + '；结果仍待确认，不会自动新建一批。'); }
    finally { if (generation === revision.current) { posting.current = false; setBusy(false); } }
  }

  const part = parts.find(p => p.run_id === selected), counts = result?.counts || {}, trace = result?.traceability || {};
  const pendingParameters = (result?.basis?.parameters || []).filter(p => p.comparable === false);
  return <section className="workspace-view active quality-workspace" aria-label="质检系统">
    <header className="module-hero quality-heading"><h1>质量检测</h1></header>
    <section className="quality-part-panel" aria-labelledby="quality-part-heading">
      <h2 id="quality-part-heading">检测零件</h2>
      <dl className="quality-part-fields">
        <div><dt><label htmlFor="quality-part-name">零件名称</label></dt><dd><select id="quality-part-name" value={selected}
          disabled={loading || busy || !!pending || !parts.length} onChange={e => {
            revision.current++; setBasis(null); setResult(null); setMessage(''); setSelected(e.target.value);
          }}>
          {!parts.length && <option value="">{loading ? '正在读取零件…' : '暂无已完成零件'}</option>}
          {parts.map(item => <option key={item.run_id} value={item.run_id}>{parts.filter(other => other.name === item.name).length > 1
            ? `${item.name}（${item.number} · ${item.version ? `版本 ${item.version}` : item.run_id.slice(3, 11)}）` : item.name}</option>)}
        </select></dd></div><div><dt>零件编号</dt><dd>{part?.number || '—'}</dd></div>
      </dl>
      <p className="quality-standard-note">模拟比对仪：RENISHAW-EQUATOR300-001 · 标准来自生产建模已保存版本</p>
      {basis && <details className="quality-standard-summary"><summary>建模标准参数（{basis.parameters.length} 项，只读）</summary>
        <ul>{basis.parameters.map(p => <li key={p.key}>{p.name}：{p.expected} {p.unit}
          {p.comparable === false ? ' · 待判定' : p.comparable === true ? ' · 可比对' : ''}</li>)}</ul></details>}
      {!basis && part?.spec && <details className="quality-standard-summary"><summary>生产建模参数（只读）</summary>
        <pre className="quality-model-spec">{JSON.stringify(part.spec, null, 2)}</pre></details>}
      {!userId && checked && <p className="quality-standard-note">请先通过顶部“注册 / 登录”登录维修小组账号，再开始模拟检测。</p>}
      <div className="quality-detection-actions">
        {pending && !busy && <button className="button" type="button" onClick={reconcile}>核对结果</button>}
        <button className="button primary" type="button" disabled={loading || reading || !basis || !userId || capability?.enabled !== true || busy}
          onClick={detect}>{busy ? '正在模拟检测…' : pending ? '按原请求重试' : '开始检测'}</button>
      </div>
    </section>
    <section className="quality-result-panel" aria-labelledby="quality-result-heading">
      <header className="quality-result-header"><h2 id="quality-result-heading">检测结果</h2><span className="quality-result-status">{busy ? '正在模拟检测' : pending ? '结果待确认' : statusLabel[result?.status] || '待检测'}</span></header>
      <p className="quality-result-message" role="status">{busy ? '正在读取模拟工位并比对建模参数，保存本次检测结果…' : message || result?.message
        || (loading || reading ? '正在读取零件和建模标准…' : !part ? '请先选择生产建模中的已完成零件。'
          : result ? `模拟检测已保存：共 ${counts.total || 0} 件，${counts.determinate || 0} 件可判定，${counts.pending || 0} 件待判定。`
            : '点击开始检测，自动生成并比对 10 件模拟测量样本。')}</p>
      {capability && !capability.enabled && <p className="quality-standard-note">{capability.reason || '模拟检测未启用'}</p>}
      <dl className="quality-rate-fields">
        <div><dt>模拟合格率（良品率／优良率）</dt><dd>{formatSimulationRate(result?.rates?.qualified)}</dd>{result && <small>{counts.qualified ?? '—'} / {counts.determinate ?? '—'} 件</small>}</div>
        <div><dt>模拟不良率</dt><dd>{formatSimulationRate(result?.rates?.defect)}</dd>{result && <small>{counts.unqualified ?? '—'} / {counts.determinate ?? '—'} 件</small>}</div>
        <div><dt>模拟检测覆盖率</dt><dd>{formatSimulationRate(result?.rates?.coverage)}</dd>{result && <small>{counts.determinate ?? '—'} / {counts.total ?? '—'} 件</small>}</div>
      </dl>
      {result?.batch_id && <p className="quality-batch-id">本次批次：{result.batch_id}</p>}
      {pendingParameters.length > 0 && <section aria-labelledby="quality-pending-heading">
        <h3 id="quality-pending-heading">待判定项目</h3>
        <p className="quality-problem-note">部分成品特征尚未覆盖完整比对，已保留设计参数。整件保持待判定，不计入合格率分母。</p>
        <details className="quality-standard-summary"><summary>查看 {pendingParameters.length} 项待判定参数</summary>
          <ul>{pendingParameters.map(p => <li key={p.key}>{p.name}：{p.expected} {p.unit} · {p.reason || '尚未覆盖完整成品特征比对'}</li>)}</ul>
        </details>
      </section>}
      {result?.issues?.length ? <>
        <h3>问题项（模拟设计不一致）</h3>
        <p className="quality-problem-note">模拟生产关联：{trace.production_device_name || '未知机器'} · {trace.production_device_id || '未知编号'} · {displayLineName(trace.line_name)}。根因尚未确认，关联不等于机器已发生故障。</p>
        <ul className="quality-issue-list">{result.issues.map((issue, index) => <li key={`${issue.part_id}:${issue.key}:${index}`}><strong>{issue.name}</strong>
          <p>设计值 {issue.expected} {issue.unit} · 模拟测量值 {issue.actual} {issue.unit} · 差值 {issue.difference ?? '—'} {issue.unit}</p>
          <small>样本：{issue.part_id}</small></li>)}</ul>
        <h3>对应核查与解决建议</h3><ol className="quality-recommendations">{(result.recommendations || []).map(item => <li key={item}>{item}</li>)}</ol>
      </> : <p className="quality-problem-note">{result && result.status !== 'review'
        ? counts.determinate > 0 ? '本次已完成样本未发现设计参数不一致。' : '已比对项目未发现不一致；仍有待判定项目，不能判定整件合格。'
        : '问题项：尚无可核实的检测结果。'}</p>}
      <ProblemLocations result={result} />
    </section>
  </section>;
}
