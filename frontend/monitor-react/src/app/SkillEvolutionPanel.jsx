import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import ExpertDocument from './ExpertDocument.jsx';
import './skillEvolution.css';

const labels = {queued:'等待生成',generating:'正在生成修改稿',awaiting_confirmation:'等待人工确认',
  confirmed:'已确认，等待验证',verification_starting:'正在启动验证',verifying:'正在验证',
  published:'已发布',generation_failed:'修改稿未生成',verification_failed:'验证未通过',
  stale:'版本已变化',outcome_unknown:'结果待核对',rejected:'已拒绝'};

export default function SkillEvolutionPanel({ actor, skill, machines = [] }) {
  const [items,setItems]=useState([]), [detail,setDetail]=useState(null), [worker,setWorker]=useState(null);
  const [error,setError]=useState(''), [reviewed,setReviewed]=useState(false), [busy,setBusy]=useState(false);
  const [device,setDevice]=useState(''), [scenario,setScenario]=useState('');
  const [expected,setExpected]=useState('使用本次修改稿完成诊断、方案和工单；维修确认后恢复模拟产线并保存报告，不能编造证据或跳过门禁。');
  const selected=useRef(''), sequence=useRef(0), refresh=useRef(null), busyRef=useRef(false), action=useRef(null);
  const machine=machines.find(m=>m.device_id===device);
  const technician=actor?.role==='technician';

  useEffect(()=>{
    if(!device && machines.length) {
      setDevice(machines[0].device_id); setScenario(machines[0].scenarios[0]?.scenario_id || '');
    }
  },[machines,device]);

  useEffect(()=>{
    if(!actor?.user_id || !skill) return undefined;
    const controller=new AbortController();
    let timer;
    selected.current=''; setDetail(null);setReviewed(false);setItems([]);setError('');
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
        } else setDetail(null);
        setError('');
      } catch(e) {if(e.name!=='AbortError' && id===sequence.current) setError(e.message);}
    };
    refresh.current=load;
    const loop=async()=>{await load();if(!controller.signal.aborted) timer=setTimeout(loop,3000);};
    loop();
    return ()=>{controller.abort();action.current?.abort();clearTimeout(timer);++sequence.current;refresh.current=null;};
  },[actor?.user_id,skill?.agent,skill?.name]);

  useEffect(()=>{setReviewed(false);},[detail?.candidate_hash]);

  const submit=async kind=>{
    if(!detail || busyRef.current) return;
    const controller=new AbortController();action.current=controller;
    busyRef.current=true;setBusy(true);setError('');++sequence.current;
    try {
      const body={candidate_hash:detail.candidate_hash};
      if(kind==='confirm') body.machine={device_id:device,scenario_id:scenario,expected};
      const value=await request(`/api/expert/evolution/${encodeURIComponent(detail.proposal_id)}/${kind}`,
        {method:'POST',body:JSON.stringify(body),signal:controller.signal});
      if(controller.signal.aborted) return;
      setDetail(previous=>({...previous,...value}));setReviewed(false);
    } catch(e) {if(e.name!=='AbortError') setError(e.message);}
    finally {
      busyRef.current=false;
      if(!controller.signal.aborted) {setBusy(false);}
    }
  };

  return <section className="expert-card skill-evolution" aria-label="自动优化修改稿">
    <div className="expert-section-title"><h2>自动优化修改稿</h2>
      <span>{worker?.enabled ? '自动收集已开启' : '后台状态待确认'}</span></div>
    <p>系统根据运行问题生成修改稿。先由维修人员确认，再进行模拟机器验证；通过后系统发布，失败保留旧版。</p>
    {worker?.message && <p className="skill-evolution-note">{worker.message}</p>}
    {error && <p role="alert" className="expert-alert">{error}</p>}
    {!items.length && !error && <p>当前技能暂无自动修改稿。有可追踪的执行问题时，系统会自动收集。</p>}
    {items.length>1 && <div className="skill-evolution-list">{items.map(item=>
      <button key={item.proposal_id} type="button" disabled={busy} aria-pressed={item.proposal_id===detail?.proposal_id}
        onClick={()=>{selected.current=item.proposal_id;setReviewed(false);refresh.current?.();}}>
        {labels[item.status] || '状态待核对'} · {item.created_at?.slice(0,10)}
      </button>)}</div>}
    {detail && <div className="skill-evolution-detail">
      <h3>{labels[detail.status] || '状态待核对'}</h3>
      <p>{detail.message}</p>
      {detail.draft && <>
        <h4>修改理由</h4><p>{detail.draft.reason}</p>
        <h4>系统追加的判断建议</h4><ul>{detail.draft.rules.map((rule,index)=><li key={index}>{rule}</li>)}</ul>
        <p>候选版本：{detail.draft.version} · 原工具权限和已有规则保持不变。</p>
        <p>来源运行：<a href={`/?view=logs&trace_id=${encodeURIComponent(detail.source?.trace_id || '')}`}>{detail.source?.trace_id}</a></p>
        <details><summary>查看完整修改稿（只读）</summary>
          <ExpertDocument value={detail.draft.document} label="完整自动修改稿" readOnly />
        </details>
      </>}
      {detail.status==='awaiting_confirmation' && detail.draft && (technician ? <>
        <p className="skill-evolution-note">模拟验证会触发所选虚拟故障并暂停模拟产线；测试工单的维修确认仍按现有流程处理。</p>
        <label>验证设备<select value={device} disabled={busy} onChange={e=>{
          setDevice(e.target.value);setScenario(machines.find(m=>m.device_id===e.target.value)?.scenarios[0]?.scenario_id || '');setReviewed(false);
        }}><option value="">请选择本人负责的模拟设备</option>
          {machines.map(m=><option key={m.device_id} value={m.device_id}>{m.name}</option>)}
        </select></label>
        <label>验证故障<select value={scenario} disabled={busy} onChange={e=>{setScenario(e.target.value);setReviewed(false);}}>
          <option value="">请选择故障场景</option>{machine?.scenarios.map(s=><option key={s.scenario_id} value={s.scenario_id}>{s.name}</option>)}
        </select></label>
        <label>预期结果<textarea value={expected} disabled={busy} maxLength={2000} rows={3}
          onChange={e=>{setExpected(e.target.value);setReviewed(false);}} /></label>
        <label className="expert-review"><input type="checkbox" checked={reviewed} disabled={busy}
          onChange={e=>setReviewed(e.target.checked)} /> 我已核对这份自动修改稿，确认可以进入验证</label>
        <div className="skill-evolution-actions">
          <button type="button" disabled={busy || !reviewed || !scenario || !device || !expected.trim()}
            onClick={()=>submit('confirm')}>{busy ? '正在提交…' : '确认修改稿并开始验证'}</button>
          <button type="button" disabled={busy} onClick={()=>submit('reject')}>拒绝此修改稿</button>
        </div>
      </> : <p>当前身份只查看；请由负责模拟设备的维修人员确认修改稿。</p>)}
      {detail.test_id && <p>验证记录：{detail.test_id}。测试工单可在工单系统处理。</p>}
      {detail.status==='published' && <p>新版已生效，可刷新上方技能内容查看；旧版备份和发布审计已保留。</p>}
    </div>}
  </section>;
}
