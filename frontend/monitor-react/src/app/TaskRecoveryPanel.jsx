import React, {useEffect, useRef, useState} from 'react';
import {createRecoveryCommands, recoveryLabel} from './taskRecovery.mjs';
import './taskRecovery.css';
import {getTeamSession, subscribeTeamSession} from '../teamSession.mjs';

const agents = {router:'任务路由',diagnosis:'诊断',knowledge:'知识检索',cad:'CAD / 生产',maintenance:'维修方案',
  workorder:'工单',quality:'质检',report:'报告',memory:'经验总结',runtime:'任务编排'};
const states = {failed:'执行失败',blocked:'等待处理',timeout:'执行超时',outcome_unknown:'结果待核对',
  interrupted:'执行中断',running:'正在恢复',resuming:'正在恢复',completed:'恢复完成',waiting_for_personnel:'等待负责人'};
const steps={fault_analysis:'故障诊断',diagnosis_review:'诊断复核',document_search:'文档检索',
  historical_case_search:'历史案例检索',drawing_search:'图纸检索',repair_planning:'维修方案生成',
  repair_plan:'维修方案生成',maintenance_replan:'维修方案复核',workorder_create:'工单创建与派发',
  create_workorder:'工单创建与派发',workorder_update:'工单处理',workorder_query:'工单查询',
  case_reporting:'报告生成',experience_learning:'经验总结与入库',experience_retrieval:'经验检索',
  quality_inspection:'质量检测',virtual_prepare:'生产准备',virtual_submit:'生产任务提交',
  virtual_start:'启动模拟加工',virtual_sync:'生产状态同步',virtual_inspect:'模拟产出检测'};

export default function TaskRecoveryPanel({request, active, onRecovered}) {
  const [items,setItems] = useState([]), [error,setError] = useState(''), [receipt,setReceipt] = useState(null);
  const [busy,setBusy] = useState('');
  const busyRef=useRef(''), commands=useRef(null), mounted=useRef(true);
  const sessionVersion=useRef(getTeamSession().version), activeRef=useRef(active);
  activeRef.current=active;
  if (!commands.current) commands.current=createRecoveryCommands(request);

  async function load() {
    const version=sessionVersion.current;
    try {
      const body=await request('/api/runtime/recovery');
      const next=Array.isArray(body.items)?body.items.filter(item=>item?.recovery_id&&item?.task_id):[];
      if(mounted.current&&version===sessionVersion.current){setItems(next);setError('');}
      return next;
    } catch(failure) {if(mounted.current&&version===sessionVersion.current)setError(failure.message||'恢复记录暂不可读取');return null;}
  }
  useEffect(()=>subscribeTeamSession(value=>{
    if(value.version===sessionVersion.current)return;
    sessionVersion.current=value.version;
    setItems([]);setReceipt(null);setError('');
    commands.current=createRecoveryCommands(request);
    if(activeRef.current)load();
  }),[]);
  useEffect(()=>{
    mounted.current=true;
    if(!active)return ()=>{mounted.current=false;};
    let stopped=false,timer;
    async function poll(){await load();if(!stopped)timer=setTimeout(poll,10000);}
    poll();
    return ()=>{stopped=true;mounted.current=false;clearTimeout(timer);};
  },[active]);

  async function resume(item) {
    if(busyRef.current||!item.can_resume)return;
    busyRef.current=item.recovery_id;setBusy(item.recovery_id);setError('');
    const version=sessionVersion.current;
    try {
      const result=await commands.current.resume(item.recovery_id);
      if(mounted.current&&version===sessionVersion.current)setReceipt(result);
      await load();
      if(version===sessionVersion.current)await onRecovered?.();
    } catch(failure) {
      const current=await load();
      const saved=current?.find(row=>row.recovery_id===item.recovery_id);
      if(mounted.current&&version===sessionVersion.current){
        if(saved?.status==='completed'){setReceipt(saved);await onRecovered?.();}
        else setError(failure.message||'恢复回执尚未确认，请刷新原任务状态');
      }
    } finally {busyRef.current='';if(mounted.current)setBusy('');}
  }
  const visible=items.filter(item=>!['running','completed'].includes(item.status)||item.attempts>0&&item.status==='running'||item.recovery_id===receipt?.recovery_id);
  return <section className="panel module-panel logs-panel task-recovery-panel" aria-label="失败任务恢复">
    <div className="panel-heading"><div><span className="eyebrow">Task Recovery</span><h2>失败任务恢复</h2></div>
      <button className="button" type="button" onClick={load} disabled={Boolean(busy)}>刷新恢复状态</button></div>
    <p>从保存的失败步骤继续，已完成结果保留。工单和生产操作先核对原任务，结果未确认时保持暂停。</p>
    {error&&<div className="workspace-notice" role="alert">{error}</div>}
    {receipt&&<div className="workspace-notice" role="status">{receipt.status==='completed'?'任务已恢复完成，已完成步骤没有重新执行。':`恢复暂停：${receipt.error||'请先处理失败原因，再继续原任务。'}`}</div>}
    {visible.length?<div className="task-recovery-list">{visible.map(item=><article className="task-recovery-item" key={item.recovery_id}>
      <div><strong>{agents[item.failed_agent]||item.failed_agent||'任务'} · {states[item.status]||item.status}</strong>
        <p>{item.error||'请核对当前执行状态。'}</p>
        <p>失败步骤：{steps[item.failed_step]||item.failed_step||'见执行明细'} · 恢复次数：{item.attempts||0}</p>
        <p>已完成：{item.completed_steps?.length?item.completed_steps.map(step=>agents[step.agent]||step.step||'步骤').join('、'):'暂无已完成步骤'}</p>
        <small>{item.task_id}</small></div>
      <button className="button button-primary" type="button" disabled={Boolean(busy)||!item.can_resume} onClick={()=>resume(item)}>
        {busy===item.recovery_id?'正在恢复…':recoveryLabel(item)}</button>
    </article>)}</div>:<div className="empty-state">暂无可恢复的失败任务。历史记录缺少可靠断点时，请根据执行明细处理原任务。</div>}
  </section>;
}
