import React, {useEffect, useRef, useState} from 'react';
import {recoveryLabel} from './taskRecovery.mjs';
import './taskRecovery.css';
import {getTeamSession, subscribeTeamSession} from '../teamSession.mjs';

const agents = {router:'任务路由',diagnosis:'诊断',knowledge:'知识检索',cad:'CAD / 生产',maintenance:'维修方案',
  workorder:'工单',quality:'质检',report:'报告',memory:'经验总结',runtime:'任务编排'};
const states = {failed:'执行失败',blocked:'等待处理',timeout:'执行超时',outcome_unknown:'结果待核对',
  interrupted:'执行中断',running:'执行中',resuming:'历史处理中',completed:'历史任务已完成',waiting_for_personnel:'等待负责人'};
const steps={fault_analysis:'故障诊断',diagnosis_review:'诊断复核',document_search:'文档检索',
  historical_case_search:'历史案例检索',drawing_search:'图纸检索',repair_planning:'维修方案生成',
  repair_plan:'维修方案生成',maintenance_replan:'维修方案复核',workorder_create:'工单创建与派发',
  create_workorder:'工单创建与派发',workorder_update:'工单处理',workorder_query:'工单查询',
  case_reporting:'报告生成',experience_learning:'经验总结与入库',experience_retrieval:'经验检索',
  assess_diagnosis:'诊断依据校验',query_alarm_definition:'报警定义检索',
  quality_inspection:'质量检测',virtual_prepare:'生产准备',virtual_submit:'生产任务提交',
  virtual_start:'启动模拟加工',virtual_sync:'生产状态同步',virtual_inspect:'模拟产出检测'};

export default function TaskRecoveryPanel({request, active}) {
  const [items,setItems] = useState([]), [error,setError] = useState(''), [loading,setLoading] = useState(false);
  const inFlight=useRef(null), mounted=useRef(true);
  const sessionVersion=useRef(getTeamSession().version), activeRef=useRef(active);
  activeRef.current=active;

  async function load() {
    if(!activeRef.current||!getTeamSession().actor||inFlight.current)return;
    const controller=new AbortController();inFlight.current=controller;
    const version=sessionVersion.current;
    setLoading(true);
    try {
      const body=await request('/api/runtime/recovery',{signal:controller.signal});
      const next=Array.isArray(body.items)?body.items.filter(item=>item?.recovery_id&&item?.task_id):[];
      if(mounted.current&&!controller.signal.aborted&&version===sessionVersion.current){setItems(next);setError(body.storage_warning||'');}
    } catch(failure) {if(mounted.current&&!controller.signal.aborted&&version===sessionVersion.current)setError(failure.message||'失败记录暂不可读取');}
    finally{if(inFlight.current===controller){inFlight.current=null;if(mounted.current)setLoading(false);}}
  }
  useEffect(()=>subscribeTeamSession(value=>{
    if(value.version===sessionVersion.current)return;
    sessionVersion.current=value.version;
    inFlight.current?.abort();inFlight.current=null;
    setItems([]);setError('');setLoading(false);
    if(activeRef.current&&value.actor)load();
  }),[]);
  useEffect(()=>{
    mounted.current=true;
    if(!active)return ()=>{mounted.current=false;};
    let stopped=false,timer;
    async function poll(){await load();if(!stopped)timer=setTimeout(poll,10000);}
    poll();
    return ()=>{stopped=true;mounted.current=false;clearTimeout(timer);inFlight.current?.abort();inFlight.current=null;};
  },[active]);
  if(!getTeamSession().actor)return null;
  const visible=items.filter(item=>!['running','completed'].includes(item.status));
  const reasons={domain_validation_failed:'业务结果校验未通过',replan_limit_exceeded:'已达到重规划次数限制'};
  return <section className="panel module-panel logs-panel task-recovery-panel" aria-label="失败任务记录">
    <div className="panel-heading"><div><span className="eyebrow">Failed Tasks</span><h2>失败任务记录</h2></div>
      <button className="button" type="button" onClick={load} disabled={loading}>刷新失败记录</button></div>
    <p>仅保留失败原因和已完成步骤，不继续执行原任务；原操作结果未知时仍需核对。</p>
    {error&&<div className="workspace-notice" role="alert">{error}</div>}
    {visible.length?<div className="task-recovery-list">{visible.map(item=><article className="task-recovery-item" key={item.recovery_id}>
      <div><strong>{agents[item.failed_agent]||item.failed_agent||'任务'} · {states[item.status]||item.status}</strong>
        <p>{reasons[item.error]||item.error||'请核对当前执行状态。'}</p>
        <p>失败步骤：{steps[item.failed_step]||item.failed_step||'见执行明细'} · {recoveryLabel(item)}</p>
        <p>已完成：{item.completed_steps?.length?item.completed_steps.map(step=>agents[step.agent]||step.step||'步骤').join('、'):'暂无已完成步骤'}</p>
        <small>{item.task_id}</small></div>
    </article>)}</div>:<div className="empty-state">暂无失败任务记录。</div>}
  </section>;
}
