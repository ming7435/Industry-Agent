import React,{useEffect,useRef,useState} from 'react';
import {getTeamSession,setTeamSessionActor,subscribeTeamSession} from '../../teamSession.mjs';
import {teamRequest} from '../../teamApi.mjs';
import {productionRequest,validateProductionJob,formatProductionStatus,productionPendingKey,virtualDesignSupport,readProductionJobs,mergeProductionJob,upsertProductionJob} from './virtualProduction.mjs';
import './virtualProduction.css';

const fields=[['stock_diameter_mm','毛坯直径（mm）'],['stock_length_mm','毛坯长度（mm）'],['grip_length_mm','夹持长度（mm）'],
  ['clearance_mm','退让距离（mm）'],['pass_depth_mm','径向切深（mm）'],['spindle_rpm','转速（rpm）'],
  ['feed_mm_per_rev','每转进给（mm/rev）'],['tool_id','车刀编号'],['tolerance_mm','仿真精度字段（mm）']];
function preset(run){
  const base=run?.spec?.operations?.[0],hole=run?.spec?.operations?.[1];
  return {device_id:'TRAK-TC820LTYSI-001',postprocessor:'virtual-trak-turning-v1',stock_diameter_mm:Number(base?.diameter||20)+4,
    stock_length_mm:Number(base?.length||10)+10,grip_length_mm:5,clearance_mm:2,pass_depth_mm:2,spindle_rpm:1000,
    feed_mm_per_rev:.2,tool_id:1,tolerance_mm:.01,...(hole?{drill_tool_id:2,drill_diameter_mm:hole.diameter}:{})};
}
const sameSetup=(a,b)=>JSON.stringify(Object.entries(a||{}).sort().map(([k,v])=>[k,k==='device_id'||k==='postprocessor'?v:Number(v)]))===JSON.stringify(Object.entries(b||{}).sort().map(([k,v])=>[k,k==='device_id'||k==='postprocessor'?v:Number(v)]));
function pendingStorage(key,value){try{if(value)sessionStorage.setItem(key,JSON.stringify(value));else sessionStorage.removeItem(key);}catch{}}

export default function SimulatedProductionPanel({run,draftPending=false}){
  const [auth,setAuth]=useState(getTeamSession),[checked,setChecked]=useState(false),[cap,setCap]=useState(null);
  const [setup,setSetup]=useState(()=>preset(run)),[material,setMaterial]=useState('模拟钢材'),[batch,setBatch]=useState('');
  const [job,setJob]=useState(null),[jobs,setJobs]=useState([]),[pending,setPending]=useState(null);
  const [busy,setBusy]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const epoch=useRef(0),posting=useRef(false),runId=run?.run_id,userId=auth.actor?.user_id;
  const support=virtualDesignSupport(run),key=productionPendingKey(userId,runId);
  const expected={design_run_id:runId,...(auth.actor?.role==='technician'?{actor_id:userId}:{})};
  useEffect(()=>{
    let active=true;const unsubscribe=subscribeTeamSession(value=>{if(active)setAuth(value);});
    teamRequest('me').then(value=>{if(active)setTeamSessionActor(value.user);}).catch(()=>{}).finally(()=>{if(active)setChecked(true);});
    return()=>{active=false;unsubscribe();};
  },[]);
  useEffect(()=>{
    const version=++epoch.current,abort=new AbortController();posting.current=false;
    setSetup(preset(run));setJob(null);setJobs([]);setCap(null);setBusy('');setPending(null);setError('');setLoading(true);
    if(!checked||!userId||!runId){setLoading(false);return()=>abort.abort();}
    let old;try{old=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
    if(old?.design_run_id===runId)setPending(old);
    Promise.all([productionRequest('/capabilities',{signal:abort.signal}),readProductionJobs({signal:abort.signal},{design_run_id:runId})])
      .then(([capability,list])=>{
        if(abort.signal.aborted||epoch.current!==version)return;
        const values=list.map(value=>validateProductionJob(value,expected));
        const selected=values.sort((a,b)=>b.created_at-a.created_at)[0]||null;
        setCap(capability);setJobs(values);setJob(selected);
        if(selected){setSetup(selected.setup);setMaterial(selected.material);setBatch(selected.batch_id);}
        if(old?.command_id){productionRequest('/jobs/by-command/'+encodeURIComponent(old.command_id),{signal:abort.signal}).then(value=>{
          if(!abort.signal.aborted&&epoch.current===version){const saved=validateProductionJob(value,expected);setJob(saved);setSetup(saved.setup);setMaterial(saved.material);setBatch(saved.batch_id);setPending(null);pendingStorage(key,null);}
        }).catch(()=>{});}
      }).catch(failure=>{if(!abort.signal.aborted&&epoch.current===version)setError(failure.message);})
      .finally(()=>{if(!abort.signal.aborted&&epoch.current===version)setLoading(false);});
    return()=>{abort.abort();epoch.current++;};
  },[checked,auth.version,runId]);
  useEffect(()=>{
    if(!job||!userId||job.status==='completed'||job.sync_status==='review')return;
    const version=epoch.current,abort=new AbortController();
    const timer=setInterval(()=>productionRequest('/jobs/'+job.job_id,{signal:abort.signal}).then(value=>{
      if(!abort.signal.aborted&&epoch.current===version){
        const saved=validateProductionJob(value,{...expected,job_id:job.job_id});
        setJob(current=>current?.job_id===saved.job_id?mergeProductionJob(current,saved):current);
        setJobs(values=>upsertProductionJob(values,saved));
      }
    }).catch(failure=>{if(!abort.signal.aborted&&epoch.current===version)setError(failure.message);}),2000);
    return()=>{clearInterval(timer);abort.abort();};
  },[job?.job_id,job?.status,job?.sync_status,auth.version,runId]);
  async function act(action){
    if(posting.current||!userId||draftPending)return;
    const version=epoch.current,identity={...expected};posting.current=true;setBusy(action);setError('');
    let command=pending?.command_id;
    try{
      let value;
      if(action==='prepare'){
        command=command||crypto.randomUUID();const target={command_id:command,design_run_id:runId};setPending(target);pendingStorage(key,target);
        value=await productionRequest('/plans',{method:'POST',body:JSON.stringify({...target,setup,material,batch_id:batch})});
      }else if(action==='reconcile'&&pending){value=await productionRequest('/jobs/by-command/'+encodeURIComponent(pending.command_id));}
      else value=await productionRequest(`/jobs/${job.job_id}/${action}`,{method:'POST',body:JSON.stringify(action==='sync'?{}:{digest:job.program_digest})});
      if(epoch.current!==version)return;
      value=validateProductionJob(value,identity);setJob(current=>mergeProductionJob(current,value));setJobs(values=>upsertProductionJob(values,value));
      setPending(null);pendingStorage(key,null);
    }catch(failure){
      if(epoch.current!==version||failure.name==='AbortError')return;
      setError(failure.message);
      if(action==='prepare'&&command){
        try{const saved=validateProductionJob(await productionRequest('/jobs/by-command/'+encodeURIComponent(command)),identity);
          if(epoch.current===version){setJob(current=>mergeProductionJob(current,saved));setJobs(values=>upsertProductionJob(values,saved));setPending(null);pendingStorage(key,null);}}
        catch(lookupFailure){
          if(epoch.current===version&&lookupFailure.status===404&&[400,403,404,409,413,422].includes(failure.status)
            &&failure.detail?.outcome_unknown!==true){setPending(null);pendingStorage(key,null);}
        }
      }
    }finally{if(epoch.current===version){posting.current=false;setBusy('');}}
  }
  const changed=job&&(!sameSetup(setup,job.setup)||material.trim()!==job.material?.trim());
  const disabled=Boolean(busy)||loading||draftPending||!cap?.enabled;
  if(!checked)return <section className="vp-panel"><h3>模拟生产</h3><p>正在核验登录状态…</p></section>;
  if(!userId)return <section className="vp-panel"><h3>模拟生产</h3><p>请先登录账号后使用模拟生产。</p></section>;
  return <section className="vp-panel" aria-label="模拟生产">
    <header><h3>模拟生产</h3><span>加工区仿真 · TRAK TC820</span></header>
    <p className="vp-note">支持圆柱和单个同轴通孔。模拟加工不包含切断、取件或实物计量。</p>
    {support&&<p className="vp-message">{support}</p>}
    {draftPending&&<p className="vp-message">当前设计有未应用修改，请先生成新版本或取消修改。</p>}
    {error&&<p role="alert" className="vp-error">{error}</p>}
    <details open={!job}><summary>模拟预设工艺</summary><p className="vp-note">可编辑模拟参数；仿真精度字段不作为制造检验公差。</p>
      <div className="vp-fields"><label>材料<input value={material} disabled={Boolean(busy)||Boolean(pending)} onChange={e=>setMaterial(e.target.value)}/></label>
      <label>生产批次<input value={batch} placeholder="留空自动生成" disabled={Boolean(busy)||Boolean(pending)} onChange={e=>setBatch(e.target.value)}/></label>
      {[...fields,...(setup.drill_tool_id?[['drill_tool_id','钻头编号'],['drill_diameter_mm','钻头直径（mm）']]:[])].map(([name,label])=><label key={name}>{label}<input type="number" step="any" min="0.000001" aria-label={label} value={setup[name]} disabled={Boolean(busy)||Boolean(pending)} onChange={e=>setSetup(value=>({...value,[name]:e.target.value}))}/></label>)}</div>
    </details>
    <div className="vp-actions"><button disabled={disabled||Boolean(support)} onClick={()=>act('prepare')}>{busy==='prepare'?'正在保存…':'保存生产方案'}</button>
      {pending&&<button disabled={Boolean(busy)} onClick={()=>act('reconcile')}>核对原指令</button>}
      {job&&<><button disabled={disabled||Boolean(changed)||job.status!=='prepared'||job.sync_status==='review'} onClick={()=>act('submit')}>下发模拟工厂</button>
        <button disabled={disabled||Boolean(changed)||!['received','paused','interrupted'].includes(job.status)||job.sync_status!=='confirmed'} onClick={()=>act('start')}>{['paused','interrupted'].includes(job.status)?'继续模拟生产':'启动模拟生产'}</button>
        <button disabled={Boolean(busy)} onClick={()=>act('sync')}>核对工厂状态</button></>}
    </div>
    {changed&&<p className="vp-note">工艺已修改，请保存新方案后下发。</p>}
    {jobs.length>1&&<label>生产任务<select aria-label="生产任务" value={job?.job_id||''} disabled={Boolean(busy)} onChange={e=>{const selected=jobs.find(item=>item.job_id===e.target.value);setJob(selected);setSetup(selected.setup);setMaterial(selected.material);setBatch(selected.batch_id);}}>{jobs.map(item=><option key={item.job_id} value={item.job_id}>{item.batch_id} · {formatProductionStatus(item)}</option>)}</select></label>}
    {job&&<div className="vp-result"><strong>{formatProductionStatus(job)}</strong><p>批次 {job.batch_id} · 零件 {job.part_name||run.part_name||'未命名'} · {job.part_number||run.part_number}</p>
      <progress aria-label="模拟加工进度" max="1" value={job.progress}/><span>{Math.round(job.progress*100)}%</span>
      {job.error_code&&<p className="vp-error">{job.error_message||`任务需核对：${job.error_code}`}</p>}
      {job.output&&<p>加工区模拟产出已保存，可前往质量检测进行参数比较。</p>}
      <details><summary>任务追溯</summary><p>设计版本：{job.design_run_id}</p><p>生产任务：{job.job_id}</p><p>程序摘要：{job.program_digest}</p></details>
    </div>}
  </section>;
}
