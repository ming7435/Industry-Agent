import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import ExpertDocument from './ExpertDocument.jsx';
import './expert.css';

const endpoint = skill => `/api/expert/skills/${encodeURIComponent(skill.agent)}/${encodeURIComponent(skill.name)}`;
const identity = skill => skill ? `${skill.agent}/${skill.name}` : '';
const fields = skill => ({ version: skill.version, goal: skill.goal, document: skill.document, reason: '' });
const sampleFor = skill => ({
  device_id: '', scenario_id: '',
  expected: '监控发现故障并暂停整线，使用本次草稿完成诊断、生成方案和工单；维修确认后整线复机并生成汇总报告。',
});
const activeTrial = trial => ['awaiting_fault', 'running', 'awaiting_repair', 'awaiting_report'].includes(trial?.status);
const pause = (signal, milliseconds) => new Promise((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('已取消', 'AbortError')); };
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, milliseconds);
  if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
});

export default function ExpertWorkspace({ actor }) {
  const [items, setItems] = useState([]);
  const [all, setAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const [current, setCurrent] = useState(null);
  const [draft, setDraft] = useState(null);
  const [remote, setRemote] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sample, setSample] = useState(null);
  const [trial, setTrial] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [machines, setMachines] = useState([]);
  const [feedback, setFeedback] = useState('');
  const sequence = useRef(0);
  const action = useRef(null);
  const editable = ['technician', 'supervisor'].includes(actor?.role) && current?.can_edit === true;
  const dirty = Boolean(current && draft && ['version', 'goal', 'document'].some(key => current[key] !== draft[key]));
  const documentError = draft && (!draft.document.trim() ? '请填写技能正文。' : draft.document.length > 24000 ? '技能正文最多填写 24000 个字符，请适当精简。' : '');
  const receiptKey = `expert-machine-test:${actor?.user_id || ''}`;
  const machine = machines.find(item => item.device_id === sample?.device_id);
  const locked = busy || loading || activeTrial(trial);

  useEffect(() => {
    if (!actor?.user_id) return undefined;
    const controller = new AbortController();
    request('/api/expert/machines', { signal: controller.signal }).then(value => setMachines(value.items || []))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [actor?.user_id]);

  useEffect(() => {
    if (!sample || sample.device_id || !machines.length) return;
    setSample(previous => ({ ...previous, device_id: machines[0].device_id, scenario_id: machines[0].scenarios[0]?.scenario_id || '' }));
  }, [machines, sample?.device_id]);

  useEffect(() => {
    if (!trial?.test_id || !activeTrial(trial)) return undefined;
    const controller = new AbortController();
    setTesting(true);
    (async () => {
      while (!controller.signal.aborted) {
        await pause(controller.signal, 1500);
        try {
          const value = await request(`/api/expert/tests/${encodeURIComponent(trial.test_id)}`, { signal: controller.signal });
          setTrial(value);
          if (value.status === 'failed') setError(value.message || '全流程测试未完成。');
          if (!activeTrial(value)) { setTesting(false); break; }
        } catch(e) {
          if (e.name === 'AbortError' || e.status === 401 || e.status === 403 || e.status === 404) throw e;
          setError('测试状态暂不可读取，请等待连接恢复；不会重新触发故障。');
        }
      }
    })().catch(e => { if (e.name !== 'AbortError') { setError(e.message); setTesting(false); } });
    return () => controller.abort();
  }, [trial?.test_id, activeTrial(trial)]);

  useEffect(() => {
    if (!actor?.user_id) return undefined;
    const controller = new AbortController();
    setError('');
    request(`/api/expert/skills?loop_only=${!all}`, { signal: controller.signal }).then(value => {
      setItems(value.items || []);
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(receiptKey) || 'null'); } catch {}
      setSelected(previous => (value.items || []).find(item => identity(item) === identity(previous || saved?.skill)) || value.items?.[0] || null);
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [actor?.user_id, all]);

  useEffect(() => {
    const id = ++sequence.current;
    action.current?.abort();
    setCurrent(null); setDraft(null); setRemote(null); setError(''); setMessage(''); setBusy(false);
    setTrial(null); setReviewed(false); setTesting(false); setSample(null);
    if (!selected || !actor?.user_id) return undefined;
    const controller = new AbortController(); action.current = controller;
    setLoading(true);
    request(endpoint(selected), { signal: controller.signal }).then(value => {
      if (id !== sequence.current) return;
      setCurrent(value); setDraft(fields(value));
      setSample(sampleFor(value));
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(receiptKey) || 'null'); } catch {}
      if (saved && identity(saved.skill) === identity(value) && saved.revision === value.revision) {
        setDraft(saved.draft); setSample(saved.machine);
        request(`/api/expert/tests/${encodeURIComponent(saved.test_id)}`, { signal: controller.signal }).then(result => {
          if (id === sequence.current) setTrial(result);
        }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
      }
    }).catch(e => { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (id === sequence.current) setLoading(false); });
    return () => { ++sequence.current; controller.abort(); action.current?.abort(); };
  }, [identity(selected), actor?.user_id]);

  function mayDiscard() {
    return !dirty || window.confirm('当前技能有未保存修改，确定离开并放弃草稿吗？');
  }

  async function refresh() {
    if (!selected || locked) return;
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setLoading(true); setError(''); setMessage('');
    setTrial(null); setReviewed(false);
    try {
      const value = await request(endpoint(selected), { signal: controller.signal });
      if (id !== sequence.current) return;
      if (dirty && value.revision !== current.revision) {
        // 保持旧基线，先展示其它专家保存的内容；核对前不能直接覆盖。
        setRemote(value);
      } else {
        setCurrent(value);
        if (!dirty) setDraft(fields(value));
        setRemote(null);
      }
      setMessage(dirty ? '已刷新当前版本；你的未保存草稿已保留，请核对后保存。' : '已读取最新技能版本。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); }
    finally { if (id === sequence.current) setLoading(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (!editable || busy || loading || remote || documentError || trial?.status !== 'completed' || !reviewed) return;
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setBusy(true); setError(''); setMessage('');
    try {
      const value = await request(endpoint(current), { method: 'POST', signal: controller.signal,
        body: JSON.stringify({ expected_revision: current.revision, ...draft, test_id: trial.test_id, human_confirmed: true }) });
      if (id !== sequence.current) return;
      setCurrent(value); setDraft(fields(value));
      setTrial(null); setReviewed(false);
      sessionStorage.removeItem(receiptKey);
      setItems(previous => previous.map(item => identity(item) === identity(value) ? value : item));
      setMessage(value.warning || '已发布到系统，新说明用于后续任务。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') {
      setError(e.message); setTrial(null); setReviewed(false);
    } }
    finally { if (id === sequence.current) setBusy(false); }
  }

  const change = key => event => {
    setDraft(previous => ({ ...previous, [key]: event.target.value }));
    setTrial(null); setReviewed(false);
  };
  const changeSample = key => event => {
    const value = event.target.value;
    setSample(previous => ({ ...previous, [key]: value, ...(key === 'device_id' ? {
      scenario_id: machines.find(item => item.device_id === value)?.scenarios[0]?.scenario_id || '' } : {}) }));
    setTrial(null); setReviewed(false);
  };
  async function testDraft(event) {
    if (!editable || locked || remote || !event.currentTarget.form.reportValidity()) return;
    if (documentError) { setError(documentError); return; }
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setBusy(true); setTesting(true); setTrial(null); setReviewed(false); setError(''); setMessage('');
    try {
      const value = await request(endpoint(current) + '/machine-test', { method: 'POST', signal: controller.signal,
        body: JSON.stringify({ expected_revision: current.revision, ...draft, machine: sample }) });
      if (id !== sequence.current) return;
      setTrial(value);
      sessionStorage.setItem(receiptKey, JSON.stringify({ skill: current, revision: current.revision, draft, machine: sample, test_id: value.test_id }));
      if (value.status === 'failed') setError(value.message || '全流程测试未完成。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); }
    finally { if (id === sequence.current) { setBusy(false); setTesting(false); } }
  }
  async function finishTrial(workorderId) {
    if (!feedback.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const result = await request(`/api/expert/tests/${encodeURIComponent(trial.test_id)}/finish`, { method: 'POST',
        body: JSON.stringify({ workorder_id: workorderId, feedback: feedback.trim() }) });
      setTrial(result);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function adoptBaseline() {
    if (!remote) return;
    // 本地没修改的字段采用远端新版，修改过的字段必须由专家对照后保留/合并。
    setDraft(previous => ({ ...previous, ...Object.fromEntries(['version', 'goal', 'document'].map(key =>
      [key, previous[key] === current[key] ? remote[key] : previous[key]])) }));
    setCurrent(remote); setRemote(null);
    setTrial(null); setReviewed(false);
    setMessage('已采用新基线，尚未保存；请核对合并后的草稿。');
  }
  return <section className="expert-workspace" aria-label="专家中心">
    <header className="expert-heading"><span>知识资产</span><h1>专家中心</h1>
      <p>维护智能体使用的技能说明，优先更新循环诊断、知识检索和 CAD 技能。</p></header>
    {!actor ? <section className="expert-card"><p>请先登录维修小组账号。</p></section> : <>
      <section className="expert-card" aria-label="技能目录">
        <div className="expert-section-title"><h2>选择技能</h2><label><input type="checkbox" checked={all} disabled={locked}
          onChange={event => { if (mayDiscard()) setAll(event.target.checked); }} /> 显示其它智能体技能</label></div>
        <p>修改后用监控中心模拟机器测试完整流程，人工核对结果后再发布。</p>
        <div className="expert-catalog">{items.map(skill => <button type="button" key={identity(skill)} disabled={locked}
          className={identity(skill) === identity(selected) ? 'is-selected' : ''} aria-pressed={identity(skill) === identity(selected)}
          onClick={() => { if (identity(skill) !== identity(selected) && mayDiscard()) setSelected(skill); }}>
          <strong>{skill.title}</strong><span>{skill.agent_label} · 版本 {skill.version}{skill.internal_loop ? ' · 内部循环' : ''}</span>
        </button>)}</div>
        {!items.length && !error && <p role="status">正在读取技能目录，或当前范围没有技能。</p>}
      </section>
      {loading && <p role="status">正在读取当前技能…</p>}
      {error && <p className="expert-alert" role="alert">{error}</p>}
      {message && <p className="expert-message" role="status">{message}</p>}
      {current && draft && <section className="expert-card" aria-label="技能编辑">
        <div className="expert-section-title"><h2>{current.title}</h2><button type="button" onClick={refresh} disabled={locked}>刷新技能</button></div>
        <p>{current.loop_description}</p>
        {!editable && <p>当前账号只读；请使用有效维修小组账号更新技能。</p>}
        {remote && <section className="expert-comparison" aria-label="新版对照">
          <h3>其它专家已保存的新版</h3>
          <p>版本：{remote.version} · 目标：{remote.goal}</p>
          <ExpertDocument value={remote.document} label="最新已保存正文（只读）" readOnly />
          <p>请将必要的新内容合并到下面的草稿。核对完成前不能保存，避免覆盖他人的更新。</p>
          <button type="button" onClick={adoptBaseline}>确认已核对，采用新基线</button>
        </section>}
        <form onSubmit={save}>
          <label>版本号<input value={draft.version} onChange={change('version')} readOnly={!editable} disabled={locked}
            required maxLength={48} pattern="[0-9]+(\.[0-9]+){1,3}" /></label>
          <label>技能目标<input value={draft.goal} onChange={change('goal')} readOnly={!editable} disabled={locked} required maxLength={300} /></label>
          <ExpertDocument value={draft.document} label="技能正文" readOnly={!editable} disabled={locked}
            onChange={document => { setDraft(previous => ({ ...previous, document })); setTrial(null); setReviewed(false); }} />
          {documentError && <p className="expert-alert" role="alert">{documentError}</p>}
          {editable && <><label>修改说明<input value={draft.reason} onChange={change('reason')} disabled={locked}
            required maxLength={500} placeholder="说明补充了哪些判断、取证或处理经验" /></label>
            {sample && <section className="expert-trial" aria-label="模拟机器全流程测试">
              <h3>模拟机器全流程测试</h3>
              <p>使用监控中心现有模拟机器。触发故障后按正常规则暂停整线、诊断并派工；维修确认后复机并保存汇总报告。</p>
              <label>测试设备<select value={sample.device_id} onChange={changeSample('device_id')} disabled={locked} required>
                <option value="">请选择本人负责的设备</option>
                {machines.map(item => <option key={item.device_id} value={item.device_id}>{item.name}</option>)}</select></label>
              <label>模拟故障<select value={sample.scenario_id} onChange={changeSample('scenario_id')} disabled={locked} required>
                <option value="">请选择故障场景</option>
                {machine?.scenarios.map(item => <option key={item.scenario_id} value={item.scenario_id}>{item.name} · 报警 {item.alarm_code}</option>)}</select></label>
              <label>预期结果<textarea value={sample.expected} onChange={changeSample('expected')} disabled={locked} required maxLength={2000} rows={3} /></label>
              <button type="button" onClick={testDraft} disabled={locked || Boolean(remote) || !sample.scenario_id}>{testing ? '测试进行中…' : '测试修改'}</button>
              {trial && <section className="expert-machine-progress" aria-label="全流程进度">
                <p role="status">{trial.message}</p>
                <ol>{trial.progress?.map(item => <li key={item.label}>{item.label}：{item.completed ? '已完成' : '等待完成'}</li>)}</ol>
                {trial.workorders?.map(order => <p key={order.workorder_id}>测试工单：
                  <a href={`/?view=workorder&workorder_id=${encodeURIComponent(order.workorder_id)}`}>{order.workorder_id}</a>
                  {order.status === 'completed' || order.status === 'closed' ? ' · 已完成' : ' · 待维修确认'}</p>)}
                {trial.status === 'awaiting_repair' && trial.workorders?.some(order => order.assignee === actor.user_id && !['completed', 'closed'].includes(order.status)) && <>
                  <label>处理说明<textarea value={feedback} onChange={event => setFeedback(event.target.value)} disabled={busy} rows={3}
                    maxLength={6000} placeholder="填写本次模拟维修的处理结果" /></label>
                  {trial.workorders.filter(order => order.assignee === actor.user_id && !['completed', 'closed'].includes(order.status)).map(order =>
                    <button key={order.workorder_id} type="button" disabled={busy || !feedback.trim()} onClick={() => finishTrial(order.workorder_id)}>
                      {busy ? '正在确认…' : '确认维修完成并复机'}</button>)}</>}
                {trial.report_id && <p>汇总报告：{trial.report_id} · <a href="/?view=report">查看报告中心</a></p>}
              </section>}
              {trial?.status === 'completed' && <section className="expert-test-result" aria-label="试运行结果">
                <h3>试运行结果</h3><p>{trial.scope}</p>
                {[['故障概述', trial.result?.summary], ['诊断判断', trial.result?.diagnosis],
                  ['处理建议', trial.result?.recommendation], ['预期结果', trial.sample?.expected]].map(([title, value]) =>
                  <section key={title}><h4>{title}</h4><ExpertDocument value={value} label={title} readOnly /></section>)}
                <label className="expert-review"><input type="checkbox" checked={reviewed} disabled={busy || loading}
                  onChange={event => setReviewed(event.target.checked)} /> 我已核对测试结果，确认符合预期</label>
              </section>}
            </section>}
            <p>整线复机、报告保存且所选技能实际执行后，才能核对发布。草稿修改后需要重新测试。</p>
            <button className="expert-save" type="submit" disabled={busy || loading || Boolean(remote) || Boolean(documentError) || trial?.status !== 'completed' || !reviewed}>
              {busy && !testing ? '正在发布…' : '发布到系统'}</button></>}
        </form>
        <details><summary>查看受保护的执行规则（只读）</summary>
          <p>工具白名单：{current.tools.join('、') || '未声明工具'}</p>
          <p>执行步骤：{current.steps.join(' → ') || '由智能体既有流程控制'}</p>
          {!!current.stop_conditions.length && <p>停止条件：{current.stop_conditions.join('；')}</p>}
          <p>知识检索和工程查询的循环仍按代码中的受控流程执行，编辑说明不会重写该流程。</p>
        </details>
      </section>}
    </>}
  </section>;
}
