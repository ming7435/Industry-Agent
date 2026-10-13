import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';

const phases = {planned:'列入周计划',reserved:'额度已预留，结果待回查',not_generated:'未生成稿件',
  queued:'等待生成',generating:'生成修改稿中',awaiting_confirmation:'等待人工审核',confirmed:'已审核，等待测试',
  verification_starting:'启动已确认测试',verifying:'测试中',awaiting_publication:'等待人工发布',publishing:'人工发布中',
  observing:'观察发布后运行',generation_failed:'生成未完成',verification_failed:'测试未通过',
  rejected:'人工已拒绝',stale:'原技能版本已变化',outcome_unknown:'结果需要核对'};

export default function SkillLoopSummary({ actor, skill, onMetrics }) {
  const [snapshot,setSnapshot]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const sequence=useRef(0),action=useRef(null),busyRef=useRef(false);
  const metricsCallback=useRef(onMetrics);
  metricsCallback.current=onMetrics;
  const owner=[actor?.user_id,actor?.role,skill?.agent,skill?.name,skill?.revision].join(':');
  const value=snapshot?.owner===owner ? snapshot.value : null;
  useEffect(()=>{
    const controller=new AbortController();
    let timer;
    setSnapshot(null);setError('');setBusy(false);busyRef.current=false;
    if(!actor?.user_id || !skill) return undefined;
    const load=async()=>{
      const id=++sequence.current;
      try {
        const result=await request(`/api/expert/skill-loop?agent=${encodeURIComponent(skill.agent)}&name=${encodeURIComponent(skill.name)}`,
          {signal:controller.signal});
        if(controller.signal.aborted || id!==sequence.current) return;
        metricsCallback.current?.({owner,value:result.north_star || null});
        setSnapshot(previous=>({owner,value:{...result,control:previous?.owner===owner &&
          Number(previous.value.control?.revision)>Number(result.control?.revision) ? previous.value.control : result.control}}));
        setError('');
      } catch(e) {if(!controller.signal.aborted && id===sequence.current) {
        setError(e.message);metricsCallback.current?.({owner,value:null,error:e.message});
      }}
      if(!controller.signal.aborted) timer=setTimeout(load,15000);
    };
    load();
    return ()=>{controller.abort();action.current?.abort();clearTimeout(timer);++sequence.current;};
  },[owner,actor?.role]);

  const control=async()=>{
    if(!value || busyRef.current || actor?.role!=='technician') return;
    const controller=new AbortController();action.current=controller;
    busyRef.current=true;setBusy(true);setError('');
    try {
      const result=await request('/api/expert/skill-loop/control',{method:'POST',body:JSON.stringify({paused:!value.control?.paused}),
        signal:controller.signal});
      if(controller.signal.aborted) return;
      setSnapshot(previous=>previous?.owner===owner &&
        Number(result.revision)>=Number(previous.value.control?.revision || 0)
        ? {owner,value:{...previous.value,control:result}} : previous);
    } catch(e) {if(!controller.signal.aborted) setError(e.message);}
    finally {if(!controller.signal.aborted){busyRef.current=false;setBusy(false);}}
  };

  return <section className="skill-loop-summary" aria-label="技能优化循环">
    <h2>技能优化循环</h2>
    <p>根据历史运行优化技能，不是业务任务的执行循环。修改稿必须经人工审核、测试和最终发布才能生效。</p>
    {error && <p role="alert" className="expert-alert">{error}</p>}
    {!value?.health && <p>尚未形成可信窗口统计；旧日志缺少技能执行归属，不能用于自动优化。</p>}
    {value?.health && ['previous','current'].map(key=>{
      const window=value.health[key];
      return <div key={key} className="skill-loop-window">
        <h3>{key==='previous' ? '上周完整窗口' : '本周运行观察'}</h3>
        <p>{window.complete ? '窗口数据已读取完整' : '数据不完整，不能作为优化依据'}{window.message ? `：${window.message}` : ''}</p>
        {!window.items?.length && <p>此窗口没有可归属的技能执行记录。</p>}
        {window.items?.map(row=><div key={`${row.version}:${row.fingerprint}`}>
          <p>版本 {row.version==='unknown' ? '未知' : row.version} · 记录 {row.calls} 次</p>
          <p>校验通过 {row.verdicts.pass} · 业务失败 {row.verdicts.fail} · 证据不足/降级 {row.verdicts.degraded} · 未知 {row.verdicts.unknown} · 基础设施异常 {row.verdicts.infrastructure_error}</p>
          <p>声明步骤覆盖：{row.coverage?.executed ?? 0}/{row.coverage?.declared ?? 0}（不是所有业务场景覆盖）</p>
        </div>)}
      </div>;
    })}
    <h3>本周优化计划</h3>
    {value?.plan ? <>
      <p>全系统额度：已占用 {value.plan.used} 份，每周最多 {value.plan.limit} 份。生成失败或超时不返还已占额度。</p>
      {value.plan.blocked_reason && <p>{value.plan.blocked_reason}</p>}
      {!value.plan.selected?.length && <p>当前技能未列入本周计划。没有合格证据时不会凑满候选。</p>}
      {value.plan.selected?.map(item=><div key={`${item.agent}:${item.name}`}>
        <p>{item.name} · {phases[item.phase] || '阶段待核对'}</p><p>{item.reason}</p>
      </div>)}
    </> : <p>尚无完整窗口计划；不根据截断日志调用模型生成修改稿。</p>}
    <p>对照实验未完成，因果收益未评估：{value?.evaluation?.message || '没有独立同基线对照，不能声称效果已改善。'}</p>
    <p>{value?.control?.paused ? '新建议收集已暂停' : '新建议按后台计划收集'}。暂停只影响技能优化，不控制机器，也不取消已经人工启动的测试。</p>
    {actor?.role==='technician' && value && <button type="button" disabled={busy} onClick={control}>
      {value.control?.paused ? '恢复技能优化' : '暂停技能优化'}</button>}
  </section>;
}
