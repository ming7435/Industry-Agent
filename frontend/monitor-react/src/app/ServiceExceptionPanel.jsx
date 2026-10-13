import React, {useEffect, useRef, useState} from 'react';
import {getTeamSession} from '../teamSession.mjs';
import './serviceExceptions.css';

const stages={router:'任务路由',runtime:'任务处理',diagnosis:'智能诊断',knowledge:'知识检索',
  maintenance:'维修方案',workorder:'工单服务',quality:'零件质检',report:'报告生成',memory:'经验总结',cad:'生产建模'};
const ownViews={knowledge:'rag',quality:'quality',cad:'cad',production:'cad',maintenance:'maintenance',
  workorder:'workorder',diagnosis:'diagnosis',report:'report',memory:'logs',router:'logs',runtime:'logs'};

function applies(item,view){
  if(['logs','report'].includes(view))return true;
  if(item.subject_type==='device_fault')return ['diagnosis','maintenance','workorder'].includes(view)||ownViews[item.failed_agent]===view;
  return ownViews[item.subject_type]===view;
}

// 独立记录服务不依赖原失败阶段；处理回执只代表人工接管，不改变设备/工单验收状态。
export default function ServiceExceptionPanel({request,actor,view}){
  const [items,setItems]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const [feedback,setFeedback]=useState({}),[busy,setBusy]=useState(''),[uncertain,setUncertain]=useState({});
  const [reports,setReports]=useState({}),[pdfReady,setPdfReady]=useState({});
  const mounted=useRef(true),inFlight=useRef(null),operation=useRef(''),controllers=useRef(new Set());
  const version=useRef(getTeamSession().version);
  const current=()=>mounted.current&&version.current===getTeamSession().version;

  async function read(path,options={}){
    const controller=new AbortController();controllers.current.add(controller);
    try{return await request(path,{...options,signal:controller.signal});}
    finally{controllers.current.delete(controller);}
  }

  function load(){
    if(inFlight.current)return inFlight.current;
    if(current())setLoading(true);
    const promise=(async()=>{
      try{
        const body=await read('/api/runtime/service-exceptions');
        const next=(Array.isArray(body.items)?body.items:[]).filter(item=>/^EXC-[A-F0-9]{24}$/.test(item?.case_id||''));
        if(current()){
          setItems(next);setError(body.storage_warning||'');
          setUncertain(old=>Object.fromEntries(Object.entries(old).filter(([id])=>!next.some(item=>item.case_id===id&&item.status==='handled'))));
        }
        return next;
      }catch(failure){if(current()&&failure.name!=='AbortError')setError(failure.message||'异常核查记录暂不可读取，原失败任务保留');return null;}
      finally{if(current())setLoading(false);}
    })();
    inFlight.current=promise;promise.finally(()=>{if(inFlight.current===promise)inFlight.current=null;});return promise;
  }

  useEffect(()=>{
    mounted.current=true;let stopped=false,timer;
    async function poll(){await load();if(!stopped)timer=setTimeout(poll,10000);}
    poll();
    return()=>{stopped=true;mounted.current=false;clearTimeout(timer);for(const controller of controllers.current)controller.abort();};
  },[]);

  async function save(item){
    const text=feedback[item.case_id]||'';
    if(operation.current||uncertain[item.case_id]||!text.trim()||actor.role!=='technician')return;
    operation.current=item.case_id;setBusy(item.case_id);setError('');
    try{
      const body=await read(`/api/runtime/service-exceptions/${item.case_id}/feedback`,{
        method:'POST',body:JSON.stringify({request_id:crypto.randomUUID(),feedback:text})});
      if(!body.success||body.case?.case_id!==item.case_id||body.case.status!=='handled')throw new Error('人工反馈保存回执未确认');
      if(current())setItems(rows=>rows.map(row=>row.case_id===item.case_id?body.case:row));
    }catch(failure){
      if(!current())return;
      // 写响应丢失时只读核对；绝不重发原业务或从失败步骤继续。
      const next=await load(),saved=next?.find(row=>row.case_id===item.case_id);
      if(current()&&saved?.status!=='handled'){
        const unknown=!failure.status||failure.status>=500;
        if(unknown)setUncertain(old=>({...old,[item.case_id]:true}));
        setError(unknown?'人工反馈保存结果待核对，请刷新记录；不会重复提交。':failure.message);
      }
    }finally{operation.current='';if(current())setBusy('');}
  }

  async function artifact(item,pdf=false){
    if(operation.current)return;
    operation.current=item.case_id;setBusy(item.case_id);setError('');
    try{
      if(pdf){
        if(item.status!=='handled')return;
        const result=await read(`/api/reports/${item.report_id}/pdf`,{method:'POST',body:JSON.stringify({})});
        if(result.success!==true)throw new Error('PDF 文件生成回执未确认');
        if(current())setPdfReady(old=>({...old,[item.case_id]:true}));
      }else{
        const result=await read(`/api/runtime/service-exceptions/${item.case_id}/report`);
        if(result.report?.report_id!==item.report_id||result.report.scope!=='service_exception_record')throw new Error('异常报告身份不一致');
        if(current())setReports(old=>({...old,[item.case_id]:result.report}));
      }
    }catch(failure){if(current()&&failure.name!=='AbortError')setError(failure.message||'异常报告暂不可用，核查记录仍保留');}
    finally{operation.current='';if(current())setBusy('');}
  }

  const visible=items.filter(item=>applies(item,view));
  if(!actor||(!visible.length&&!error))return null;
  return <section className="panel module-panel service-exception-panel" aria-label="异常核查待办">
    <div className="panel-heading"><div><span className="eyebrow">服务异常 · 人工接管</span><h2>异常核查待办</h2></div>
      <button type="button" className="button" onClick={load} disabled={loading}>刷新异常记录</button></div>
    <p>业务服务失败时保留故障和异常原因，关联人工核查与处理报告。不是正常维修工单，不授权拆修、设备启停或质检放行。</p>
    {error&&<div className="workspace-notice" role="alert">{error}</div>}
    <div className="service-exception-list">{visible.map(item=>{
      const handled=item.status==='handled',pdfUrl=`/api/reports/${item.report_id}/pdf`;
      return <article className="service-exception-item" key={item.case_id}>
        <div className="service-exception-heading"><h3>{item.fault_summary}</h3><span className={`severity-pill ${handled?'normal':'warning'}`}>{handled?'已人工接管':'等待人工核查'}</span></div>
        {item.device_id&&<p>{item.device_name||item.device_id} · {item.device_id}{item.alarm_code?` · 报警 ${item.alarm_code}`:''}</p>}
        {item.part_id&&<p>零件编号：{item.part_id}</p>}
        <p>异常阶段：{stages[item.failed_agent]||'业务处理'} · {item.failure_reason}</p>
        <p className="service-exception-cause">{item.service_error}</p>
        <p className="service-exception-identity">原任务：{item.task_id} · 核查编号：{item.case_id}{item.workorder_id?` · 关联工单：${item.workorder_id}`:''}</p>
        {item.requires_reconcile&&<p className="workspace-notice">原操作结果未知，需核对实际回执；人工接管不意味着原操作成功。</p>}
        {handled?<p>人工反馈：{item.feedback}</p>:actor.role==='technician'?<div className="service-exception-feedback">
          <label htmlFor={`feedback-${item.case_id}`}>实际处理反馈</label>
          <textarea id={`feedback-${item.case_id}`} maxLength={4000} value={feedback[item.case_id]||''} disabled={Boolean(busy)||Boolean(uncertain[item.case_id])}
            placeholder="记录实际核查、联系负责人或交接结果，不代表已完成维修。" onChange={event=>setFeedback(old=>({...old,[item.case_id]:event.target.value}))}/>
          {uncertain[item.case_id]&&<p role="status">保存结果待核对，请刷新记录，不重复提交。</p>}
          <button type="button" className="button button-primary" disabled={Boolean(busy)||Boolean(uncertain[item.case_id])||!(feedback[item.case_id]||'').trim()} onClick={()=>save(item)}>保存人工处理反馈</button>
        </div>:<p>监督人仅查看和催办，由相关维修人员填写处理反馈。</p>}
        <div className="service-exception-actions"><button type="button" className="button" disabled={Boolean(busy)} onClick={()=>artifact(item)}>查看异常处理报告</button>
          <button type="button" className="button" disabled={!handled||Boolean(busy)} onClick={()=>artifact(item,true)}>生成异常 PDF</button>
          {pdfReady[item.case_id]&&<><a className="button" href={pdfUrl} target="_blank" rel="noreferrer">打开异常 PDF</a><a className="button" href={`${pdfUrl}?download=1`} download>下载异常 PDF</a></>}
        </div>
        {reports[item.case_id]&&<div className="service-exception-report" aria-label="异常处理报告正文"><h4>{reports[item.case_id].title}</h4><p>{reports[item.case_id].article_text||reports[item.case_id].summary}</p></div>}
      </article>;
    })}</div>
  </section>;
}
