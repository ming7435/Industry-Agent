import React,{useEffect,useRef,useState} from 'react';
import {getTeamSession,setTeamSessionActor,subscribeTeamSession} from '../teamSession.mjs';
import {teamRequest} from '../teamApi.mjs';
import {productionRequest,validateProductionJob,formatProductionStatus} from './production-cad/virtualProduction.mjs';
import {readProductionJobs,validateProductionInspection,formatProductionRate,inspectionStatus,qualitySelectionIdentity} from './productionQuality.mjs';
import './productionQuality.css';

export default function ProductionQualityWorkspace(){
  const [auth,setAuth]=useState(getTeamSession),[checked,setChecked]=useState(false),[jobs,setJobs]=useState([]),[selected,setSelected]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[rateError,setRateError]=useState('');
  const [summary,setSummary]=useState(null),[result,setResult]=useState(null),[unknown,setUnknown]=useState(false);
  const epoch=useRef(0),loadEpoch=useRef(0),posting=useRef(false),job=jobs.find(item=>item.job_id===selected),userId=auth.actor?.user_id;
  const identity=qualitySelectionIdentity(userId,job?.design_run_id,job?.batch_id,job?.part_id);
  const expected=job?{job_id:job.job_id,part_id:job.part_id,design_run_id:job.design_run_id,design_digest:job.design_digest,
    output_digest:job.output?.output_digest,actor_id:job.actor_id,batch_id:job.batch_id}:{};
  useEffect(()=>{let active=true;const unsubscribe=subscribeTeamSession(value=>{if(active)setAuth(value);});
    teamRequest('me').then(value=>{if(active)setTeamSessionActor(value.user);}).catch(()=>{}).finally(()=>{if(active)setChecked(true);});
    return()=>{active=false;unsubscribe();};},[]);
  useEffect(()=>{
    const version=++loadEpoch.current,abort=new AbortController();epoch.current++;posting.current=false;setJobs([]);setSelected('');setResult(null);setSummary(null);setBusy(false);setError('');setUnknown(false);setLoading(true);
    if(!checked||!userId){setLoading(false);return()=>abort.abort();}
    readProductionJobs({signal:abort.signal}).then(values=>{if(!abort.signal.aborted&&loadEpoch.current===version){
      setJobs(values);setSelected(values.find(item=>item.output)?.job_id||values[0]?.job_id||'');
    }}).catch(failure=>{if(!abort.signal.aborted&&loadEpoch.current===version)setError(failure.message);}).finally(()=>{if(!abort.signal.aborted&&loadEpoch.current===version)setLoading(false);});
    return()=>{abort.abort();loadEpoch.current++;epoch.current++;};
  },[checked,auth.version]);
  useEffect(()=>{
    const version=++epoch.current,abort=new AbortController();setResult(null);setSummary(null);setRateError('');setUnknown(false);
    if(!job)return()=>abort.abort();
    if(job.inspection&&job.output){try{setResult(validateProductionInspection(job.inspection,expected));}catch(failure){setError(failure.message);}}
    loadSummary(job,{signal:abort.signal}).then(value=>{if(!abort.signal.aborted&&epoch.current===version)setSummary(value);})
      .catch(failure=>{if(!abort.signal.aborted&&epoch.current===version)setRateError(failure.message);});
    return()=>abort.abort();
  },[identity]);
  async function loadSummary(target,options={}){
    const value=await productionRequest('/quality?'+new URLSearchParams({design_run_id:target.design_run_id,batch_id:target.batch_id,owner_job_id:target.job_id}),options);
    if(value.source!=='factory-simulation'||value.simulation_only!==true||value.actor_id!==target.actor_id
      ||value.design_run_id!==target.design_run_id||value.batch_id!==target.batch_id||!value.rates||!value.counts)throw new Error('统计范围与当前生产任务不一致。');
    return value;
  }
  async function inspect(reconcile=false){
    if(posting.current||!job||!userId)return;posting.current=true;setBusy(true);setError('');
    const version=epoch.current,target=job,fixed={...expected};
    try{
      let value;
      if(reconcile){const saved=validateProductionJob(await productionRequest('/jobs/'+target.job_id),{job_id:target.job_id,actor_id:target.actor_id,design_run_id:target.design_run_id});value=saved.inspection;
        if(!value)throw new Error('尚无已保存检测记录，请核对后再决定是否重新检测。');
      }else{
        try{value=await productionRequest(`/parts/${target.part_id}/inspect`,{method:'POST',body:JSON.stringify({output_digest:target.output.output_digest})});}
        catch(failure){if(epoch.current!==version)throw failure;setUnknown(true);
          const saved=validateProductionJob(await productionRequest('/jobs/'+target.job_id),{job_id:target.job_id,actor_id:target.actor_id,design_run_id:target.design_run_id});
          if(!saved.inspection)throw failure;value=saved.inspection;}
      }
      if(epoch.current!==version)return;
      setResult(validateProductionInspection(value,fixed));setUnknown(false);
      try{const stats=await loadSummary(target);if(epoch.current===version){setSummary(stats);setRateError('');}}
      catch(failure){if(epoch.current===version){setSummary(null);setRateError(failure.message);}}
    }catch(failure){if(epoch.current===version&&failure.name!=='AbortError')setError(failure.message);}
    finally{if(epoch.current===version){posting.current=false;setBusy(false);}}
  }
  const designs=[...new Set(jobs.map(item=>item.design_run_id))],batches=job?[...new Set(jobs.filter(item=>item.design_run_id===job.design_run_id).map(item=>JSON.stringify([item.actor_id,item.batch_id])))]:[];
  const ready=job?.status==='completed'&&job.sync_status==='confirmed'&&Boolean(job.output);
  if(!checked)return <section className="pq-workspace"><h1>工厂产出检测</h1><p>正在核验登录状态…</p></section>;
  if(!userId)return <section className="pq-workspace"><h1>工厂产出检测</h1><p>请先登录账号后查看工厂产出。</p></section>;
  return <section className="pq-workspace" aria-label="工厂产出检测"><header><h1>工厂产出检测</h1><p>比较原始建模参数与加工区模拟产出；结果用于仿真一致性验证。</p></header>
    {error&&<p role="alert">{error}</p>}
    <div className="pq-selectors"><label>设计版本<select aria-label="生产设计版本" value={job?.design_run_id||''} disabled={busy||loading} onChange={e=>setSelected(jobs.find(item=>item.design_run_id===e.target.value)?.job_id||'')}>
      {!designs.length&&<option value="">暂无生产任务</option>}{designs.map(id=><option key={id} value={id}>{jobs.find(item=>item.design_run_id===id)?.part_name||'未命名零件'} · {jobs.find(item=>item.design_run_id===id)?.part_number||''} · {id}</option>)}</select></label>
      <label>生产批次<select aria-label="生产批次" disabled={busy||!job} value={job?JSON.stringify([job.actor_id,job.batch_id]):''} onChange={e=>{const [owner,batch]=JSON.parse(e.target.value);setSelected(jobs.find(item=>item.design_run_id===job.design_run_id&&item.actor_id===owner&&item.batch_id===batch).job_id);}}>
      {!job&&<option value="">暂无批次</option>}{batches.map(key=>{const [owner,batch]=JSON.parse(key);return <option key={key} value={key}>{batch} · {owner}</option>;})}</select></label>
      <label>加工产出<select aria-label="加工产出" value={selected} disabled={busy||!job} onChange={e=>setSelected(e.target.value)}>
      {!job&&<option value="">暂无产出</option>}{jobs.filter(item=>item.design_run_id===job?.design_run_id&&item.batch_id===job.batch_id&&item.actor_id===job.actor_id).map(item=><option key={item.job_id} value={item.job_id}>{item.part_id} · {formatProductionStatus(item)}</option>)}</select></label></div>
    {job&&<p>{job.part_name||'未命名零件'} · {job.part_number} · <strong>{formatProductionStatus(job)}</strong></p>}
    <div className="pq-actions"><button disabled={busy||loading||!ready||unknown} onClick={()=>inspect()}>{busy?'正在检测…':'开始检测'}</button>{unknown&&<button disabled={busy} onClick={()=>inspect(true)}>核对原检测记录</button>}</div>
    {!ready&&job&&<p>生产完成且产出保存后可开始检测。</p>}
    <section aria-label="加工检测结果"><h2>{result?inspectionStatus[result.status]:'待检测'}</h2>
      {result&&<div className="pq-comparison">{result.items.map(item=><article key={item.key}><h3>{item.name}</h3><dl>
        <div><dt>原始建模值</dt><dd>{item.expected} {item.unit}</dd></div><div><dt>工厂模拟值</dt><dd>{item.actual??'缺测'} {item.actual!==null&&item.unit}</dd></div><div><dt>偏差</dt><dd>{item.difference??'—'} {item.difference!==null&&item.unit}</dd></div></dl><p>{inspectionStatus[item.status]}</p></article>)}</div>}
    </section><section><h2>所选版本、批次与生产人员统计</h2>{rateError&&<p role="alert">统计暂不可用：{rateError}</p>}
      <dl className="pq-rates"><div><dt>参数一致率</dt><dd>{formatProductionRate(summary?.rates.consistent)}</dd></div><div><dt>参数不一致率</dt><dd>{formatProductionRate(summary?.rates.inconsistent)}</dd></div><div><dt>检测覆盖率</dt><dd>{formatProductionRate(summary?.rates.coverage)}</dd></div></dl>
      {summary&&<p>已保存产出 {summary.counts.total} 件，已判定 {summary.counts.determinate} 件，待检测 {summary.counts.pending} 件，缺测 {summary.counts.insufficient_data} 件，待复核 {summary.counts.review} 件。</p>}
    </section><p className="pq-note">来源：模拟工厂。比较采用精确尺寸一致性规则，仿真精度字段不作为制造公差。</p>
  </section>;
}
