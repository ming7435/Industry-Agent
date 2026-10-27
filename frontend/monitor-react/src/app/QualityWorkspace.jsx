import React, {useEffect,useRef,useState} from 'react';
import {request} from './apiRequest.mjs';
import {getTeamSession,setTeamSessionActor,subscribeTeamSession} from '../teamSession.mjs';
import {teamRequest} from '../teamApi.mjs';
import QualityVisionWorkspace from './QualityVisionWorkspace.jsx';
import JointQualityPanel from './JointQualityPanel.jsx';
import QualityIcon from './QualityIcon.jsx';
import {measurementTemplate,parseMeasurementCsv,verifiedMeasuredBatch} from './measuredQuality.mjs';
import './qualityPart.css';
import './qualityWorkbench.css';
import './qualityRedesign.css';

const prefix='/api/quality/vision/batches';
const statusLabel={qualified:'通过',unqualified:'不通过',pending:'待检测'};

export default function QualityWorkspace() {
  const [auth,setAuth]=useState(getTeamSession),[checked,setChecked]=useState(false);
  const [panel,setPanel]=useState(()=>new URLSearchParams(location.search).get('quality_panel')==='dimensions'?'dimensions':'vision');
  const [catalog,setCatalog]=useState([]),[selected,setSelected]=useState(''),[loaded,setLoaded]=useState(null);
  const [sample,setSample]=useState(''),[jointRevision,setJointRevision]=useState(0),[refresh,setRefresh]=useState(0);
  const [file,setFile]=useState(null),[planComplete,setPlanComplete]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const operation=useRef(null),generation=useRef(0),selection=useRef('');
  const userId=auth.actor?.user_id;
  const authKey=JSON.stringify([auth.version,userId]);
  const context=useRef(authKey);context.current=authKey;
  selection.current=selected;
  const batch=loaded?.authKey===authKey&&loaded.value.request_id===selected?loaded.value:null;
  const selectedPart=batch?.samples.find(row=>row.part_id===sample);
  const jointTarget=selectedPart?{scope:'measured_batch',request_id:batch.request_id,batch_id:batch.batch_id,design_run_id:batch.design_run_id,sample_id:sample,serial_number:selectedPart.serial_number}:null;
  const part=batch?{run_id:batch.design_run_id,name:batch.part_name||batch.batch_id,number:batch.design_run_id}:null;
  useEffect(()=>{
    let active=true;const unsubscribe=subscribeTeamSession(value=>{if(active)setAuth(value);});
    teamRequest('me').then(value=>{if(active)setTeamSessionActor(value.user);}).catch(()=>{}).finally(()=>{if(active)setChecked(true);});
    return()=>{active=false;unsubscribe();};
  },[]);
  useEffect(()=>{
    generation.current++;operation.current?.abort();operation.current=null;
    setCatalog([]);setSelected('');setLoaded(null);setSample('');setFile(null);setBusy(false);setError('');setPlanComplete(false);
  },[authKey]);
  useEffect(()=>{
    if(!checked||!userId)return;
    const abort=new AbortController();
    request(prefix,{signal:abort.signal}).then(value=>{
      if(abort.signal.aborted)return;
      if(!Array.isArray(value.items)||value.items.some(item=>!/^MB-[a-f0-9]{32}$/.test(item.request_id)||!item.batch_id))throw new Error('实测批次列表无效');
      setCatalog(value.items);setSelected(previous=>value.items.some(item=>item.request_id===previous)?previous:value.items[0]?.request_id||'');
    }).catch(e=>{if(!abort.signal.aborted&&!e.sessionChanged)setError(e.message);});
    return()=>abort.abort();
  },[authKey,checked,refresh]);
  useEffect(()=>{
    setSample('');setLoaded(null);
    if(!selected||!userId)return;
    const abort=new AbortController();
    request(prefix+'/'+encodeURIComponent(selected),{signal:abort.signal}).then(value=>{
      if(!abort.signal.aborted&&selection.current===selected)setLoaded({authKey,value:verifiedMeasuredBatch(value)});
    }).catch(e=>{if(!abort.signal.aborted&&!e.sessionChanged)setError(e.message);});
    return()=>abort.abort();
  },[selected,authKey]);
  useEffect(()=>()=>{generation.current++;operation.current?.abort();},[]);
  function selectPanel(value) {
    setPanel(value);const url=new URL(location.href);url.searchParams.set('quality_panel',value);history.replaceState(history.state,'',url);
  }
  async function importMeasurements() {
    if(!file||!userId||operation.current)return;
    const abort=new AbortController(),epoch=++generation.current,key=authKey;
    operation.current=abort;setBusy(true);setError('');
    try {
      if(file.size>4*1024*1024)throw new Error('测量文件不能超过 4 MB');
      const text=await file.text();
      if(generation.current!==epoch||context.current!==key)return;
      const values=parseMeasurementCsv(text,file.name,planComplete);
      const value=verifiedMeasuredBatch(await request(prefix,{method:'POST',body:JSON.stringify(values),signal:abort.signal}));
      if(generation.current!==epoch||context.current!==key)return;
      setSelected(value.request_id);setLoaded({authKey:key,value});setSample('');setJointRevision(n=>n+1);
      setRefresh(n=>n+1);setError('');
    }catch(e){if(generation.current===epoch&&context.current===key&&!abort.signal.aborted&&!e.sessionChanged)setError(e.message);}
    finally{if(generation.current===epoch&&context.current===key){setBusy(false);operation.current=null;}}
  }
  function template() {
    const url=URL.createObjectURL(new Blob([measurementTemplate],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='批次实测记录_空白模板.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const panels=[['vision','视觉检测','上传实拍图片，定位缺陷'],['dimensions','尺寸检测','导入实测记录，按验收范围判断']];
  return <section className="workspace-view active quality-workspace" aria-label="质检系统">
    <header className="module-hero quality-heading"><div><span className="quality-kicker">质量管理 / 批次质检</span><h1>质量检测<span className="quality-title-marker" aria-hidden="true">工作台</span></h1><p>按零件编号关联实测尺寸与视觉图片，汇总本批合格率、不合格类型与处理方式。</p></div>
      <div className="quality-current-part"><QualityIcon name="box" size={22}/><div><span>当前批次</span><strong>{batch?.batch_id||'等待实测记录'}</strong></div></div></header>
    <div className="quality-batch-toolbar"><label htmlFor="measured-batch">检测批次</label><select id="measured-batch" value={selected} disabled={!userId||busy||!catalog.length} onChange={e=>{setSelected(e.target.value);setError('');}}>
      {!catalog.length&&<option value="">{!checked?'正在读取…':'暂无实测批次'}</option>}{catalog.map(row=><option value={row.request_id} key={row.request_id}>{row.batch_id} · {row.part_name||row.design_run_id}</option>)}</select>
      <button className="button" disabled={!userId||busy} onClick={()=>setRefresh(n=>n+1)}>刷新批次</button><button className="button" onClick={()=>selectPanel('dimensions')}>导入实测记录</button></div>
    {error&&<p className="quality-import-error" role="alert">{error}</p>}
    {!userId&&checked&&<p className="quality-standard-note">请先通过顶部“注册 / 登录”登录账号，再保存实测记录和图片检测结果。</p>}
    <JointQualityPanel auth={auth} batch={batch} sampleId={selectedPart?.part_id||''} onSampleChange={setSample} revision={jointRevision}
      onOpenVision={()=>selectPanel('vision')} onOpenDimensions={()=>selectPanel('dimensions')}>
      <div className="quality-tabs" role="tablist" aria-label="质检工作区">{panels.map(([id,title,description],index)=><button key={id} type="button" role="tab" id={'quality-tab-'+id} aria-label={title} aria-controls={'quality-panel-'+id} aria-selected={panel===id} tabIndex={panel===id?0:-1} onClick={()=>selectPanel(id)} onKeyDown={e=>{
        const next=e.key==='ArrowRight'?(index+1)%2:e.key==='ArrowLeft'?(index+1)%2:e.key==='Home'?0:e.key==='End'?1:-1;
        if(next>=0){e.preventDefault();selectPanel(panels[next][0]);document.getElementById('quality-tab-'+panels[next][0]).focus();}
      }}><span><QualityIcon name={id==='vision'?'camera':'ruler'} size={18}/></span><div><strong>{title}</strong><small>{description}</small></div></button>)}</div>
      <div role="tabpanel" id="quality-panel-dimensions" aria-labelledby="quality-tab-dimensions" hidden={panel!=='dimensions'}>
        <section className="quality-measurement-import" aria-labelledby="measurement-heading"><header><div><h2 id="measurement-heading">批次尺寸检测</h2><p>读取实际测量记录，逐项核对图纸或检验标准中的验收上下限。</p></div><QualityIcon name="ruler"/></header>
          <label className="quality-measurement-file">尺寸测量记录（CSV）<input key={authKey} aria-label="尺寸测量记录（CSV）" type="file" accept=".csv,text/csv" disabled={!userId||busy} onChange={e=>{setFile(e.target.files[0]||null);setPlanComplete(false);setError('');}}/></label>
          <div className="quality-import-guide"><button className="button" onClick={template}>下载空白模板</button><p>每行填写一件零件的一个检验项目。实测值为空的项目保持待检测；同一项目的验收范围须一致。</p></div>
          <label className="quality-plan-check"><input type="checkbox" checked={planComplete} disabled={!file||busy} onChange={e=>setPlanComplete(e.target.checked)}/>本文件已包含该图纸版本全部必检尺寸项目和本批全部零件编号</label>
          <p className="quality-small-note">未确认检验清单完整时，已超差项仍记为不合格，其余零件保持待判定。</p>
          <button className="button primary" disabled={!file||!userId||busy} onClick={importMeasurements}>{busy?'正在核验实测记录…':'核验并保存本批尺寸'}</button>
          <details className="quality-secondary-details"><summary>记录格式与复检</summary><p>使用 UTF-8 CSV。下限与上限填写允许的实际值，单边公差可只填一侧；测量时间示例格式：2026-10-26T08:30:00+08:00。填写实际图纸版本与标准来源。</p><p>同一文件重复导入不会增加零件数。复检后导入本批完整记录，更新后的尺寸记录需要重新关联视觉图片。</p></details>
        </section>
        {batch&&<section className="quality-measurement-result" aria-labelledby="measured-result-heading"><header><h2 id="measured-result-heading">尺寸核验记录</h2><span>{batch.samples.length} 件 · {batch.basis.parameters.length} 项 / 件</span></header>
          <p>图纸版本：{batch.design_run_id} · 标准：{batch.standard_reference}</p><p>记录：{batch.measurement_reference} · 测量时间：{batch.measured_at}</p>
          {!batch.plan_complete&&<p className="quality-import-error">尚未确认检验清单完整，不能判定整件尺寸通过。</p>}
          {selectedPart?<><h3>零件 {selectedPart.serial_number}</h3><div className="joint-table"><table><thead><tr><th>问题位置 / 检验项目</th><th>验收范围</th><th>实测值</th><th>结果</th></tr></thead><tbody>{selectedPart.comparison.items.map(row=><tr key={row.key}><td>{row.name}</td><td>{row.lower??'无下限'} ～ {row.upper??'无上限'} {row.unit}</td><td>{row.actual??'未测量'} {row.actual!=null?row.actual_unit:''}</td><td>{statusLabel[row.status]}{row.reason&&<small>{row.reason}</small>}</td></tr>)}</tbody></table></div></>:<p>在上方选择零件编号，查看逐项测量值、超差位置与缺测项。</p>}
        </section>}
      </div>
      <div role="tabpanel" id="quality-panel-vision" aria-labelledby="quality-tab-vision" hidden={panel!=='vision'}>
        <QualityVisionWorkspace auth={auth} checked={checked} part={part} jointTarget={jointTarget} requireBatchSample={Boolean(batch)} showReferenceTools={false} onInspection={()=>setJointRevision(n=>n+1)}/>
      </div>
    </JointQualityPanel>
  </section>;
}
