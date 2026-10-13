import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import ExpertDocument from './ExpertDocument.jsx';
import ExpertTrialDetails from './ExpertTrialDetails.jsx';
import SkillEvolutionPanel from './SkillEvolutionPanel.jsx';
import SkillNorthStarPanel from './SkillNorthStarPanel.jsx';
import SkillTaskSample, {taskSampleFor,taskPayload} from './SkillTaskSample.jsx';
import './expert.css';

const endpoint = skill => `/api/expert/skills/${encodeURIComponent(skill.agent)}/${encodeURIComponent(skill.name)}`;
const identity = skill => skill ? `${skill.agent}/${skill.name}` : '';
const fields = skill => ({ version: skill.version, goal: skill.goal, document: skill.document, reason: '' });
const draftReason = (baseline, draft) => {
  const excerpt = value => value.replace(/\s+/g, ' ').trim().slice(0, 150);
  const changes = [];
  if (draft.goal !== baseline.goal) changes.push(`调整技能目标：${excerpt(draft.goal)}`);
  if (draft.document !== baseline.document) changes.push(`更新技能正文，当前内容摘要：${excerpt(draft.document)}`);
  return changes.length ? `系统生成：${changes.join('；')}。以上为草稿变更摘要，实际效果待测试核对。` : '';
};
const modifiedTime = (value, empty = '暂无修改记录') => {
  const date = new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value);
  if (!value || Number.isNaN(date.getTime())) return empty;
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date).replace(/\//g, '-');
};
const sampleFor = skill => skill.optimization?.mode && skill.optimization.mode !== 'machine_flow' ? taskSampleFor(skill) : ({
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
  const [all, setAll] = useState(true);
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
  const [proposal, setProposal] = useState(null);
  const [approvedDraft, setApprovedDraft] = useState(false);
  const [receiptRefresh,setReceiptRefresh] = useState(0);
  const [northStar,setNorthStar] = useState(null);
  const metricsOwner=[actor?.user_id,actor?.role,current?.agent,current?.name,current?.revision].join(':');
  const manualMode = useRef(false);
  const sequence = useRef(0);
  const action = useRef(null);
  const editable = ['technician', 'supervisor'].includes(actor?.role) && current?.can_edit === true;
  const dirty = Boolean(current && draft && ['version', 'goal', 'document'].some(key => current[key] !== draft[key]));
  const documentError = draft && (!draft.document.trim() ? '请填写技能正文。' : draft.document.length > 24000 ? '技能正文最多填写 24000 个字符，请适当精简。' : '');
  const receiptKey = `expert-machine-test:${actor?.user_id || ''}`;
  const machine = machines.find(item => item.device_id === sample?.device_id);
  const taskMode = ['knowledge_flow','cad_spec_flow','review_flow'].includes(current?.optimization?.mode);
  const autoRunning = ['confirmed', 'verification_starting', 'verifying', 'publishing'].includes(proposal?.status);
  const autoFrozen = Boolean(proposal && proposal.status !== 'awaiting_confirmation');
  const locked = busy || loading || activeTrial(trial) || autoRunning;

  useEffect(() => {
    if (!actor?.user_id || !current || taskMode) return undefined;
    const controller = new AbortController();
    request('/api/expert/machines', { signal: controller.signal }).then(value => setMachines(value.items || []))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [actor?.user_id,current?.agent,current?.name,taskMode]);

  useEffect(() => {
    if (!sample || taskMode || sample.device_id || !machines.length) return;
    setSample(previous => ({ ...previous, device_id: machines[0].device_id, scenario_id: machines[0].scenarios[0]?.scenario_id || '' }));
  }, [machines, sample?.device_id,taskMode]);

  useEffect(() => {
    if (!trial?.test_id || !activeTrial(trial)) return undefined;
    const controller = new AbortController();
    setTesting(true);
    (async () => {
      while (!controller.signal.aborted) {
        await pause(controller.signal, 1500);
        try {
          const readSequence = sequence.current;
          const value = await request(`/api/expert/tests/${encodeURIComponent(trial.test_id)}`, { signal: controller.signal });
          if (controller.signal.aborted || readSequence !== sequence.current) continue;
          setTrial(previous => previous?.test_id === trial.test_id ? { ...value, baseline_changed: previous.baseline_changed } : previous);
          if (value.status === 'failed') setError(value.message || '全流程测试未完成。');
          else if (!trial.baseline_changed) setError('');
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
    if (!proposal?.test_id || proposal.confirmed_by !== actor?.user_id || trial?.test_id === proposal.test_id) return undefined;
    const controller = new AbortController();
    const id = sequence.current;
    request(`/api/expert/tests/${encodeURIComponent(proposal.test_id)}`, {signal:controller.signal}).then(value => {
      if (!controller.signal.aborted && id === sequence.current) setTrial(value);
    }).catch(e => { if (e.name !== 'AbortError' && id === sequence.current) setError(e.message); });
    return () => controller.abort();
  }, [proposal?.test_id, proposal?.confirmed_by, actor?.user_id, trial?.test_id, receiptRefresh]);

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
    setProposal(null); setApprovedDraft(false); manualMode.current=false;
    setNorthStar(null);
    if (!selected || !actor?.user_id) return undefined;
    const controller = new AbortController(); action.current = controller;
    setLoading(true);
    request(endpoint(selected), { signal: controller.signal }).then(value => {
      if (id !== sequence.current) return;
      setCurrent(value); setDraft(fields(value));
      setSample(sampleFor(value));
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(receiptKey) || 'null'); } catch {}
      if (saved && identity(saved.skill) === identity(value)) {
        const baselineChanged = saved.revision !== value.revision;
        if (!baselineChanged) { setDraft(saved.draft); setSample(saved.machine); }
        request(`/api/expert/tests/${encodeURIComponent(saved.test_id)}`, { signal: controller.signal }).then(result => {
          if (id === sequence.current) setTrial({ ...result, baseline_changed: baselineChanged });
        }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
      }
    }).catch(e => { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (id === sequence.current) setLoading(false); });
    return () => { ++sequence.current; controller.abort(); action.current?.abort(); };
  }, [identity(selected), actor?.user_id]);

  function mayDiscard() {
    return !dirty || window.confirm('当前技能有未保存修改，确定离开并放弃草稿吗？');
  }

  function adoptAutomatic(value, force=false) {
    if (!current || actor?.role !== 'technician' || value.agent !== current.agent || value.name !== current.name) return;
    if (proposal?.proposal_id === value.proposal_id) {
      if (Number(value.revision) < Number(proposal.revision)) return;
      if (['rejected','stale','verification_failed'].includes(value.status) && !activeTrial(trial)) {
        setProposal(null);setApprovedDraft(false);setDraft(fields(current));setTrial(null);
      } else setProposal(value);
      return;
    }
    if (!value.draft || value.base_revision !== current.revision ||
        !['awaiting_confirmation','confirmed','verification_starting','verifying','awaiting_publication'].includes(value.status) ||
        (value.confirmed_by && value.confirmed_by !== actor.user_id)) return;
    if (force ? !mayDiscard() : dirty || trial || manualMode.current) return;
    const generated=value.draft;
    setProposal(value);setApprovedDraft(false);setReviewed(false);setTrial(null);manualMode.current=false;
    setDraft({version:generated.version,goal:generated.goal,document:generated.document,reason:generated.reason});
    setSample(value.machine?.task ? taskSampleFor(current,value.machine.task) : value.machine || {...sampleFor(current),
      ...(!taskMode ? {device_id:sample?.device_id || '',scenario_id:sample?.scenario_id || ''} : {}),
      expected:generated.expected_result || '按追加规则补查证据、明确不确定项，保留原审批、安全和验收门禁。'});
    setMessage('自动修改稿已填入正文、修改说明和预期结果；审核及测试后仍须人工发布。');
  }

  async function refresh() {
    if (!selected || locked) return;
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setLoading(true); setError(''); setMessage('');
    if (!proposal) setTrial(null);
    else setReceiptRefresh(value=>value+1);
    setReviewed(false);
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
      setMessage(dirty ? '已刷新技能内容；你的未保存草稿已保留，请核对后保存。' : '已读取最新技能内容。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); }
    finally { if (id === sequence.current) setLoading(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (!editable || busy || loading || remote || documentError || trial?.baseline_changed || trial?.status !== 'completed' || !reviewed ||
        (proposal && proposal.status !== 'awaiting_publication')) return;
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setBusy(true); setError(''); setMessage('');
    try {
      let value;
      if (proposal) {
        const result = await request(`/api/expert/evolution/${encodeURIComponent(proposal.proposal_id)}/publish`,
          {method:'POST',signal:controller.signal,body:JSON.stringify({candidate_hash:proposal.candidate_hash})});
        if (result.status !== 'published') {
          if (id === sequence.current) {setProposal(previous=>({...previous,...result}));setMessage(result.message || '发布结果待核对，未重新写入。');}
          return;
        }
        value = await request(endpoint(current), {signal:controller.signal});
      } else value = await request(endpoint(current), { method: 'POST', signal: controller.signal,
        body: JSON.stringify({ expected_revision: current.revision, ...draft, test_id: trial.test_id, human_confirmed: true }) });
      if (id !== sequence.current) return;
      setCurrent(value); setDraft(fields(value));
      setTrial(null); setReviewed(false);
      setProposal(null);setApprovedDraft(false);manualMode.current=true;
      sessionStorage.removeItem(receiptKey);
      setItems(previous => previous.map(item => identity(item) === identity(value) ? value : item));
      setMessage(value.warning || '已发布到系统，新说明用于后续任务。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') {
      setError(e.message);
      if (!proposal) setTrial(null);
      else setReceiptRefresh(value=>value+1);
      setReviewed(false);
    } }
    finally { if (id === sequence.current) setBusy(false); }
  }

  const change = key => event => {
    manualMode.current=true;
    const value = event.target.value;
    setDraft(previous => {
      const next = { ...previous, [key]: value };
      return { ...next, reason: draftReason(current, next) };
    });
    setTrial(null); setReviewed(false);
  };
  const changeSample = key => event => {
    if (!proposal) manualMode.current=true;
    const value = event.target.value;
    setSample(previous => ({ ...previous, [key]: value, ...(key === 'device_id' ? {
      scenario_id: machines.find(item => item.device_id === value)?.scenarios[0]?.scenario_id || '' } : {}) }));
    setTrial(null); setReviewed(false);
    setApprovedDraft(false);
  };
  async function testDraft(event) {
    if (!editable || locked || remote || (proposal && (!approvedDraft || autoFrozen)) || !event.currentTarget.form.reportValidity()) return;
    if (documentError) { setError(documentError); return; }
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setBusy(true); setTesting(true); setTrial(null); setReviewed(false); setError(''); setMessage('');
    try {
      if (proposal) {
        const value = await request(`/api/expert/evolution/${encodeURIComponent(proposal.proposal_id)}/confirm`,
          {method:'POST',signal:controller.signal,body:JSON.stringify({candidate_hash:proposal.candidate_hash,
            ...(taskMode ? {task:taskPayload(sample)} : {machine:sample})})});
        if (id === sequence.current) setProposal(previous=>({...previous,...value}));
        return;
      }
      const testedDraft = { ...draft, reason: draft.reason ||
        '系统生成：本次未修改技能目标及正文，仅对当前技能进行全流程测试，实际效果待测试核对。' };
      setDraft(testedDraft);
      const value = await request(endpoint(current) + (taskMode ? '/task-test' : '/machine-test'), { method: 'POST', signal: controller.signal,
        body: JSON.stringify({ expected_revision: current.revision, ...testedDraft,
          ...(taskMode ? {task:taskPayload(sample)} : {machine:sample}) }) });
      if (id !== sequence.current) return;
      setTrial(value);
      sessionStorage.setItem(receiptKey, JSON.stringify({ skill: current, revision: current.revision, draft: testedDraft, machine: sample, test_id: value.test_id }));
      if (value.status === 'failed') setError(value.message || '全流程测试未完成。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); }
    finally { if (id === sequence.current) { setBusy(false); setTesting(false); } }
  }
  async function finishTrial(workorderId) {
    if (!feedback.trim() || busy) return;
    ++sequence.current;
    setBusy(true); setError('');
    try {
      const result = await request(`/api/expert/tests/${encodeURIComponent(trial.test_id)}/finish`, { method: 'POST',
        body: JSON.stringify({ workorder_id: workorderId, feedback: feedback.trim() }) });
      ++sequence.current;
      setTrial(result);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function adoptBaseline() {
    if (!remote) return;
    // 本地没修改的字段采用远端新版，修改过的字段必须由专家对照后保留/合并。
    setDraft(previous => {
      const next = { ...previous, ...Object.fromEntries(['version', 'goal', 'document'].map(key =>
        [key, previous[key] === current[key] ? remote[key] : previous[key]])) };
      return { ...next, reason: draftReason(remote, next) };
    });
    setCurrent(remote); setRemote(null);
    setTrial(null); setReviewed(false);
    setMessage('已采用新基线，尚未保存；请核对合并后的草稿。');
  }
  return <section className="expert-workspace" aria-label="专家中心">
    <header className="expert-heading"><span>知识资产</span><h1>专家中心</h1>
      <p>查看和维护智能体使用的技能说明，修改后测试并发布。</p></header>
    {!actor ? <section className="expert-card"><p>请先登录维修小组账号。</p></section> : <>
      <section className="expert-card" aria-label="技能目录">
        <div className="expert-section-title"><h2>选择技能</h2><label><input type="checkbox" checked={all} disabled={locked}
          onChange={event => { if (mayDiscard()) setAll(event.target.checked); }} /> 显示其它智能体技能</label></div>
        <p>按技能名称和作用选择。诊断使用模拟机器闭环，检索和建模使用各自的任务样例；人工核对结果后再发布。</p>
        <div className="expert-catalog">{items.map(skill => <button type="button" key={identity(skill)} disabled={locked}
          className={identity(skill) === identity(selected) ? 'is-selected' : ''} aria-pressed={identity(skill) === identity(selected)}
          onClick={() => { if (identity(skill) !== identity(selected) && mayDiscard()) setSelected(skill); }}>
          <strong>{skill.title}</strong><span>{skill.agent_label}</span>
          <span className="expert-skill-identity">Skill 标识：<code>{skill.name}</code></span>
          {skill.optimization && <span>{skill.optimization.enabled ? '支持自动优化候选' : '固定流程说明'}</span>}
          <p className="expert-skill-purpose">技能作用：{skill.goal || '暂无作用说明，请在技能目标中补充。'}</p>
          <span>上次修改：<time dateTime={skill.last_modified_at}>{modifiedTime(skill.last_modified_at)}</time></span>
        </button>)}</div>
        {!items.length && !error && <p role="status">正在读取技能目录，或当前范围没有技能。</p>}
      </section>
      {loading && <p role="status">正在读取当前技能…</p>}
      {error && <p className="expert-alert" role="alert">{error}</p>}
      {message && <p className="expert-message" role="status">{message}</p>}
      {current && <SkillEvolutionPanel key={actor.user_id + '/' + identity(current)} actor={actor} skill={current} onMetrics={setNorthStar}
        onCandidate={adoptAutomatic} onAdopt={value=>adoptAutomatic(value,true)} loadedRecord={proposal} canAdopt={!locked} />}
      {current && draft && <section className="expert-card" aria-label="技能编辑">
        <div className="expert-section-title"><h2>{current.title}</h2><button type="button" onClick={refresh} disabled={locked}>刷新技能</button></div>
        <dl className="expert-skill-info" aria-label="技能信息">
          <div><dt>技能名称</dt><dd>{current.title}</dd></div>
          <div><dt>Skill 标识</dt><dd><code>{current.name}</code></dd></div>
          <div><dt>技能作用</dt><dd>{current.goal || '暂无作用说明，请在技能目标中补充。'}</dd></div>
          <div><dt>所属智能体</dt><dd>{current.agent_label}</dd></div>
        </dl>
        <p>上次修改：<time dateTime={current.last_modified_at}>{modifiedTime(current.last_modified_at)}</time></p>
        {current.optimization && <p>{current.optimization.description}</p>}
        {!editable && <p>当前账号只读；请使用有效维修小组账号更新技能。</p>}
        {remote && <section className="expert-comparison" aria-label="新版对照">
          <h3>其它专家已保存的内容</h3>
          <p>上次修改：<time dateTime={remote.last_modified_at}>{modifiedTime(remote.last_modified_at)}</time> · 目标：{remote.goal}</p>
          <ExpertDocument value={remote.document} label="最新已保存正文（只读）" readOnly />
          <p>请将必要的新内容合并到下面的草稿。核对完成前不能保存，避免覆盖他人的更新。</p>
          <button type="button" onClick={adoptBaseline}>确认已核对，采用新基线</button>
        </section>}
        <form onSubmit={save}>
          {proposal && <p>这是系统自动生成的待审核稿，并未替换线上技能。修改说明包含触发原因，预期结果用于核对实际测试。</p>}
          <label>技能目标<input value={draft.goal} onChange={change('goal')} readOnly={!editable || Boolean(proposal)} disabled={locked} required maxLength={300} /></label>
          <ExpertDocument value={draft.document} label="技能正文" readOnly={!editable || Boolean(proposal)} disabled={locked}
            onChange={document => {
              manualMode.current=true;
              setDraft(previous => {
                const next = { ...previous, document };
                return { ...next, reason: draftReason(current, next) };
              });
              setTrial(null); setReviewed(false);
            }} />
          {documentError && <p className="expert-alert" role="alert">{documentError}</p>}
          {editable && <><div className="expert-change-note">
            <label htmlFor="expert-change-reason">修改说明</label>
            <textarea id="expert-change-reason" className="expert-change-reason" value={draft.reason} readOnly rows={4}
              aria-describedby="expert-change-reason-help" placeholder="等待系统生成修改稿后自动填写，无需手动输入。" />
            <p id="expert-change-reason-help">{proposal
              ? '由技能优化系统生成，包含触发原因和具体改动；无需手动填写。'
              : draft.reason
                ? '系统根据当前草稿自动整理修改说明。请核对正文及预期结果，测试后再发布。'
                : '尚未回填自动修改稿。系统生成后会自动填写；人工调整正文或目标时，也会自动整理变更摘要。'}</p>
          </div>
            {sample && <section className="expert-trial" aria-label={taskMode ? '技能任务验证' : '模拟机器全流程测试'}>
              <h3>{taskMode ? '技能任务验证' : '模拟机器全流程测试'}</h3>
              {taskMode ? <SkillTaskSample skill={current} sample={sample} change={changeSample} disabled={locked || autoFrozen}/> : <>
              <p>使用监控中心现有模拟机器。触发故障后按正常规则暂停整线、诊断并派工；维修确认后复机并保存汇总报告。</p>
              <label>测试设备<select value={sample.device_id} onChange={changeSample('device_id')} disabled={locked || autoFrozen} required>
                <option value="">请选择本人负责的设备</option>
                {machines.map(item => <option key={item.device_id} value={item.device_id}>{item.name}</option>)}</select></label>
              <label>模拟故障<select value={sample.scenario_id} onChange={changeSample('scenario_id')} disabled={locked || autoFrozen} required>
                <option value="">请选择故障场景</option>
                {machine?.scenarios.map(item => <option key={item.scenario_id} value={item.scenario_id}>{item.name} · 报警 {item.alarm_code}</option>)}</select></label></>}
              <label htmlFor="expert-expected-result">预期结果</label><textarea id="expert-expected-result" value={sample.expected}
                onChange={changeSample('expected')} disabled={locked || autoFrozen} required maxLength={2000} rows={3} />
              {proposal?.status === 'awaiting_confirmation' && <label className="expert-review"><input type="checkbox"
                checked={approvedDraft} disabled={locked} onChange={event=>setApprovedDraft(event.target.checked)} /> 我已审核自动修改稿及预期结果，允许开始测试</label>}
              <button type="button" onClick={testDraft} disabled={locked || Boolean(remote) || (!taskMode && !sample.scenario_id) ||
                (Boolean(proposal) && (!approvedDraft || autoFrozen))}>{testing ? '测试进行中…' : '测试修改'}</button>
              {trial && <section className="expert-machine-progress" aria-label="全流程进度">
                <p role="status">{trial.message}</p>
                <ol>{trial.progress?.map(item => <li key={item.label} className={item.completed ? 'is-completed' : ''}>{item.label}：{item.completed ? '已完成' : '等待完成'}</li>)}</ol>
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
                {taskMode ? <><h4>本次任务结果</h4><pre>{JSON.stringify(trial.result,null,2)}</pre>
                  {trial.assessment && <p>{trial.assessment.accepted ? '领域验收通过' : '领域验收未通过'}，仍需人工核对预期。</p>}</>
                  : <ExpertTrialDetails trial={trial} actor={actor} formatTime={value => modifiedTime(value, '暂无记录')} />}
              </section>}
              {trial?.status === 'completed' && <section className="expert-test-result" aria-label="试运行结果">
                <h3>试运行结果</h3><p>{trial.scope}</p>
                <h4>预期结果</h4><ExpertDocument value={trial.sample?.expected || sample?.expected} label="预期结果" readOnly />
                <label className="expert-review"><input type="checkbox" checked={reviewed} disabled={busy || loading || trial.baseline_changed}
                  onChange={event => setReviewed(event.target.checked)} /> 我已核对测试结果，确认符合预期</label>
              </section>}
            </section>}
            <p>{taskMode ? '所选候选正文实际参与决策、结果通过领域验证后，才能核对发布；这不代表生产或实体内核验收。'
              : '整线复机、报告保存且所选技能实际执行后，才能核对发布。'}草稿修改后需要重新测试。</p>
            <button className="expert-save" type="submit" disabled={busy || loading || Boolean(remote) || Boolean(documentError) || trial?.baseline_changed || trial?.status !== 'completed' || !reviewed ||
              (Boolean(proposal) && proposal.status !== 'awaiting_publication')}>
              {busy && !testing ? '正在发布…' : '发布到系统'}</button></>}
        </form>
        <SkillNorthStarPanel snapshot={northStar?.owner === metricsOwner ? northStar : null} />
        <details><summary>查看受保护的执行规则（只读）</summary>
          <p>工具白名单：{current.tools.join('、') || '未声明工具'}</p>
          <p>执行步骤：{current.steps.join(' → ') || '由智能体既有流程控制'}</p>
          {!!current.stop_conditions.length && <p>停止条件：{current.stop_conditions.join('；')}</p>}
          <p>工具权限和执行步骤由系统控制，编辑说明不会改变这些设置。</p>
        </details>
      </section>}
    </>}
  </section>;
}
