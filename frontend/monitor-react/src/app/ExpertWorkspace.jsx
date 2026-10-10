import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import './expert.css';

const endpoint = skill => `/api/expert/skills/${encodeURIComponent(skill.agent)}/${encodeURIComponent(skill.name)}`;
const identity = skill => skill ? `${skill.agent}/${skill.name}` : '';
const fields = skill => ({ version: skill.version, goal: skill.goal, document: skill.document, reason: '' });

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
  const sequence = useRef(0);
  const action = useRef(null);
  const editable = ['technician', 'supervisor'].includes(actor?.role) && current?.can_edit === true;
  const dirty = Boolean(current && draft && ['version', 'goal', 'document'].some(key => current[key] !== draft[key]));

  useEffect(() => {
    if (!actor?.user_id) return undefined;
    const controller = new AbortController();
    setError('');
    request(`/api/expert/skills?loop_only=${!all}`, { signal: controller.signal }).then(value => {
      setItems(value.items || []);
      setSelected(previous => (value.items || []).find(item => identity(item) === identity(previous)) || value.items?.[0] || null);
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [actor?.user_id, all]);

  useEffect(() => {
    const id = ++sequence.current;
    action.current?.abort();
    setCurrent(null); setDraft(null); setRemote(null); setError(''); setMessage(''); setBusy(false);
    if (!selected || !actor?.user_id) return undefined;
    const controller = new AbortController(); action.current = controller;
    setLoading(true);
    request(endpoint(selected), { signal: controller.signal }).then(value => {
      if (id !== sequence.current) return;
      setCurrent(value); setDraft(fields(value));
    }).catch(e => { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (id === sequence.current) setLoading(false); });
    return () => { ++sequence.current; controller.abort(); action.current?.abort(); };
  }, [identity(selected), actor?.user_id]);

  function mayDiscard() {
    return !dirty || window.confirm('当前技能有未保存修改，确定离开并放弃草稿吗？');
  }

  async function refresh() {
    if (!selected || busy || loading) return;
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setLoading(true); setError(''); setMessage('');
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
    if (!editable || busy || loading || remote) return;
    const id = ++sequence.current;
    action.current?.abort();
    const controller = new AbortController(); action.current = controller;
    setBusy(true); setError(''); setMessage('');
    try {
      const value = await request(endpoint(current), { method: 'POST', signal: controller.signal,
        body: JSON.stringify({ expected_revision: current.revision, ...draft }) });
      if (id !== sequence.current) return;
      setCurrent(value); setDraft(fields(value));
      setItems(previous => previous.map(item => identity(item) === identity(value) ? value : item));
      setMessage(value.warning || '更新已保存，下次任务加载时生效。');
    } catch(e) { if (id === sequence.current && e.name !== 'AbortError') setError(e.message); }
    finally { if (id === sequence.current) setBusy(false); }
  }

  const change = key => event => setDraft(previous => ({ ...previous, [key]: event.target.value }));
  function adoptBaseline() {
    if (!remote) return;
    // 本地没修改的字段采用远端新版，修改过的字段必须由专家对照后保留/合并。
    setDraft(previous => ({ ...previous, ...Object.fromEntries(['version', 'goal', 'document'].map(key =>
      [key, previous[key] === current[key] ? remote[key] : previous[key]])) }));
    setCurrent(remote); setRemote(null);
    setMessage('已采用新基线，尚未保存；请核对合并后的草稿。');
  }
  return <section className="expert-workspace" aria-label="专家中心">
    <header className="expert-heading"><span>知识资产</span><h1>专家中心</h1>
      <p>维护智能体使用的技能说明，优先更新循环诊断、知识检索和 CAD 技能。</p></header>
    {!actor ? <section className="expert-card"><p>请先登录维修小组账号。</p></section> : <>
      <section className="expert-card" aria-label="技能目录">
        <div className="expert-section-title"><h2>选择技能</h2><label><input type="checkbox" checked={all} disabled={busy || loading}
          onChange={event => { if (mayDiscard()) setAll(event.target.checked); }} /> 显示其它智能体技能</label></div>
        <p>默认显示有内部循环的智能体。保存说明不会改变工具权限、节点、审批或业务门禁。</p>
        <div className="expert-catalog">{items.map(skill => <button type="button" key={identity(skill)} disabled={busy}
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
        <div className="expert-section-title"><h2>{current.title}</h2><button type="button" onClick={refresh} disabled={busy || loading}>刷新技能</button></div>
        <p>{current.loop_description}</p>
        {!editable && <p>当前账号只读；请使用有效维修小组账号更新技能。</p>}
        {remote && <section className="expert-comparison" aria-label="新版对照">
          <h3>其它专家已保存的新版</h3>
          <p>版本：{remote.version} · 目标：{remote.goal}</p>
          <label>最新已保存正文（只读）<textarea readOnly value={remote.document} rows={10} /></label>
          <p>请将必要的新内容合并到下面的草稿。核对完成前不能保存，避免覆盖他人的更新。</p>
          <button type="button" onClick={adoptBaseline}>确认已核对，采用新基线</button>
        </section>}
        <form onSubmit={save}>
          <label>版本号<input value={draft.version} onChange={change('version')} readOnly={!editable} disabled={busy || loading}
            required maxLength={48} pattern="[0-9]+(\.[0-9]+){1,3}" /></label>
          <label>技能目标<input value={draft.goal} onChange={change('goal')} readOnly={!editable} disabled={busy || loading} required maxLength={300} /></label>
          <label>技能正文（Markdown）<textarea value={draft.document} onChange={change('document')} readOnly={!editable}
            disabled={busy || loading} required maxLength={24000} rows={20} spellCheck={false} /></label>
          {editable && <><label>修改说明<input value={draft.reason} onChange={change('reason')} disabled={busy || loading}
            required maxLength={500} placeholder="说明补充了哪些判断、取证或处理经验" /></label>
            <p>保存前请核对内容与版本。旧版会自动备份；新说明用于后续任务，已有任务不会重新执行。</p>
            <button className="expert-save" type="submit" disabled={busy || loading || Boolean(remote)}>{busy ? '正在保存…' : '保存更新'}</button></>}
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
