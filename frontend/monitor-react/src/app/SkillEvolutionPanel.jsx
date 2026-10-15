import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import ExpertDocument from './ExpertDocument.jsx';
import './skillEvolution.css';

const labels = {queued:'等待生成',generating:'正在生成修改稿',awaiting_confirmation:'等待人工确认',
  confirmed:'已确认，等待验证',verification_starting:'正在启动验证',verifying:'正在验证',
  awaiting_publication:'测试通过，等待人工发布',publishing:'人工发布中',
  published:'已发布',generation_failed:'修改稿未生成',verification_failed:'验证未通过',
  stale:'版本已变化',outcome_unknown:'结果待核对',rejected:'已拒绝'};

export default function SkillEvolutionPanel({ actor, skill, onCandidate, onAdopt, loadedRecord, canAdopt }) {
  const [items,setItems]=useState([]), [snapshot,setDetail]=useState(null), [worker,setWorker]=useState(null);
  const [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const detail = loadedRecord?.proposal_id === snapshot?.proposal_id && Number(loadedRecord?.revision) > Number(snapshot?.revision)
    ? loadedRecord : snapshot;
  const loadedId = loadedRecord?.proposal_id;
  const selected=useRef(''), sequence=useRef(0), refresh=useRef(null), busyRef=useRef(false), action=useRef(null);
  const candidateCallback=useRef(onCandidate);
  candidateCallback.current=onCandidate;
  const technician=actor?.role==='technician';

  useEffect(()=>{
    if(!actor?.user_id || !skill) return undefined;
    const controller=new AbortController();
    let timer;
    selected.current=''; setDetail(null);setItems([]);setError('');
    const load=async()=>{
      if(busyRef.current) return;
      const id=++sequence.current;
      try {
        const value=await request(`/api/expert/evolution?agent=${encodeURIComponent(skill.agent)}&name=${encodeURIComponent(skill.name)}`,{signal:controller.signal});
        if(controller.signal.aborted || id!==sequence.current) return;
        setItems(value.items || []);setWorker(value.worker || null);
        if(!(value.items || []).some(item=>item.proposal_id===selected.current)) selected.current=value.items?.[0]?.proposal_id || '';
        const target=selected.current;
        if(target) {
          const full=await request(`/api/expert/evolution/${encodeURIComponent(target)}`,{signal:controller.signal});
          if(controller.signal.aborted || id!==sequence.current || target!==selected.current) return;
          setDetail(full);
          candidateCallback.current?.(full);
        } else setDetail(null);
        setError('');
      } catch(e) {if(e.name!=='AbortError' && id===sequence.current) setError(e.message);}
    };
    refresh.current=load;
    const loop=async()=>{await load();if(!controller.signal.aborted) timer=setTimeout(loop,3000);};
    loop();
    return ()=>{controller.abort();action.current?.abort();clearTimeout(timer);++sequence.current;refresh.current=null;};
  },[actor?.user_id,skill?.agent,skill?.name]);

  const submit=async kind=>{
    if(!detail || busyRef.current) return;
    const controller=new AbortController();action.current=controller;
    busyRef.current=true;setBusy(true);setError('');++sequence.current;
    try {
      const body={candidate_hash:detail.candidate_hash};
      const value=await request(`/api/expert/evolution/${encodeURIComponent(detail.proposal_id)}/${kind}`,
        {method:'POST',body:JSON.stringify(body),signal:controller.signal});
      if(controller.signal.aborted) return;
      setDetail(previous=>({...previous,...value}));
      candidateCallback.current?.({...detail,...value});
    } catch(e) {if(e.name!=='AbortError') setError(e.message);}
    finally {
      busyRef.current=false;
      if(!controller.signal.aborted) {setBusy(false);}
    }
  };

  return <section className="expert-card skill-evolution" aria-label="自动优化修改稿">
    <div className="expert-section-title"><h2>自动优化修改稿</h2>
      <span>{worker?.enabled ? '自动收集已开启' : '后台状态待确认'}</span></div>
    <p>独立技能优化循环每分钟更新运行观察，按上一个完整周形成计划，所有符合条件的技能依次准备修改稿，不设每周份数上限。纯连接错误、余额问题和专家测试不触发优化。</p>
    <p>系统只准备建议，不直接改正在使用的技能。修改说明与预期结果会填入下方编辑区，由人工审核、测试并点击发布到系统。</p>
    {worker?.message && <p className="skill-evolution-note">{worker.message}</p>}
    {error && <p role="alert" className="expert-alert">{error}</p>}
    {!items.length && !error && <p>当前技能暂无自动修改稿。有可追踪的执行问题时，系统会自动收集。</p>}
    {items.length>1 && <div className="skill-evolution-list">{items.map(item=>
      <button key={item.proposal_id} type="button" disabled={busy} aria-pressed={item.proposal_id===detail?.proposal_id}
        onClick={()=>{selected.current=item.proposal_id;refresh.current?.();}}>
        {labels[item.status] || '状态待核对'} · {item.created_at?.slice(0,10)}
      </button>)}</div>}
    {detail && <div className="skill-evolution-detail">
      <h3>{labels[detail.status] || '状态待核对'}</h3>
      <p>{detail.message}</p>
      {detail.draft && <>
        <h4>优化触发原因</h4><p>{detail.draft.trigger_summary || '业务运行存在校验或证据不足'}</p>
        <h4>系统追加的判断建议</h4><ul>{detail.draft.rules.map((rule,index)=><li key={index}>{rule}</li>)}</ul>
        <p>候选版本：{detail.draft.version} · 原工具权限和已有规则保持不变。</p>
        <p>来源运行：<a href={`/?view=logs&trace_id=${encodeURIComponent(detail.source?.trace_id || '')}`}>{detail.source?.trace_id}</a></p>
        <details><summary>查看自动修改稿（只读）</summary>
          <ExpertDocument value={detail.draft.document} label="完整自动修改稿" readOnly />
        </details>
      </>}
      {detail.status==='awaiting_confirmation' && detail.draft && (technician ? <>
        <p className="skill-evolution-note">{(detail.verification_mode || skill.optimization?.mode) === 'review_flow'
          ? '使用本技能的输入输出样例验证只读核查规则，不改变业务结果、执行操作或控制设备。'
          : ['knowledge_flow','cad_spec_flow'].includes(detail.verification_mode || skill.optimization?.mode)
          ? '使用本技能的隔离任务样例验证，不触发虚拟故障或设备控制。'
          : '模拟验证会触发所选虚拟故障并暂停模拟产线；测试工单的维修确认仍按现有流程处理。'}</p>
        <div className="skill-evolution-actions">
          {loadedId!==detail.proposal_id && <button type="button" disabled={busy || !canAdopt}
            onClick={()=>onAdopt?.(detail)}>载入此修改稿</button>}
          {loadedId===detail.proposal_id && <p>修改说明和预期已填好，请在下方审核并测试。</p>}
          <button type="button" disabled={busy} onClick={()=>submit('reject')}>拒绝此修改稿</button>
        </div>
      </> : <p>当前身份只查看；请由有权限的维修人员确认修改稿。</p>)}
      {detail.test_id && <p>验证记录：{detail.test_id}。请核对下方对应测试结果。</p>}
      {detail.status==='awaiting_publication' && <p>测试通过不等于生效。请在下方核对测试结果，再点击发布到系统。</p>}
      {detail.status==='published' && <p>人工已发布，新版生效；旧版备份和发布审计已保留。</p>}
    </div>}
  </section>;
}
