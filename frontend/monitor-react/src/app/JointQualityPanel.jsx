import React,{useEffect,useState} from 'react';
import {request} from './apiRequest.mjs';
import {jointStatus,checkStatus,verifiedJointReport} from './jointQuality.mjs';
import QualityIcon from './QualityIcon.jsx';

export default function JointQualityPanel({auth,batch,sampleId,onSampleChange,onOpenVision,onOpenDimensions,revision,children}) {
  const [state,setState]=useState(null),[refresh,setRefresh]=useState(0);
  const key=JSON.stringify([auth.version,auth.actor?.user_id,batch?.request_id,revision,refresh]);
  useEffect(()=>{
    const abort=new AbortController();
    if(!auth.actor?.user_id || !batch?.request_id || batch.status==='review') return ()=>abort.abort();
    request('/api/quality/vision/joint/'+encodeURIComponent(batch.request_id),{signal:abort.signal})
      .then(value=>{if(!abort.signal.aborted)setState({key,value:verifiedJointReport(value,batch)});})
      .catch(error=>{if(!abort.signal.aborted&&!error.sessionChanged)setState({key,error:error.message});});
    return ()=>abort.abort();
  },[key]);
  const current=state?.key===key?state:null,report=current?.value,c=report?.counts;
  const selected=report?.items.find(row=>row.sample_id===sampleId),selectedIndex=report?.items.findIndex(row=>row.sample_id===sampleId);
  const maxType=Math.max(1,...(report?.types||[]).map(row=>row.sample_count));
  return <section className="joint-quality" aria-label="联合质检结果">
    <div className="joint-overview">
      <header><div className="joint-overview-label"><QualityIcon name="shield"/><h2>本批质量概览</h2><span className="quality-mode-badge">批次联合质检</span></div>
        <div className="joint-overview-actions"><span>{c?`共 ${c.total} 件 · 已判定 ${c.determinate} 件`:'等待尺寸批次'}</span><button className="button" type="button" disabled={!batch||!auth.actor?.user_id} onClick={()=>setRefresh(n=>n+1)}>刷新联合结果</button></div></header>
      <dl className="joint-metrics">
        <div className="joint-metric-rate"><dt>联合合格率 <QualityIcon name="shield" size={18}/></dt><dd>{typeof report?.qualified_rate==='number'?report.qualified_rate.toFixed(2)+'%':'—'}</dd><small>合格 / 已判定 {c?.qualified??'—'} / {c?.determinate??'—'} 件</small></div>
        <div className="joint-metric-pass"><dt>合格 <QualityIcon name="check" size={18}/></dt><dd>{c?.qualified??'—'}<span>件</span></dd><small>尺寸与视觉均通过</small></div>
        <div className="joint-metric-fail"><dt>不合格 <QualityIcon name="alert" size={18}/></dt><dd>{c?.unqualified??'—'}<span>件</span></dd><small>任一项已发现不合格</small></div>
        <div className="joint-metric-pending"><dt>待判定 <QualityIcon name="clock" size={18}/></dt><dd>{c?.pending??'—'}<span>件</span></dd><small>缺项样本，不计入合格率分母</small></div>
      </dl>
      {current?.error&&<p className="joint-notice" role="alert">{current.error}</p>}
      {batch&&!current&&batch.status!=='review'&&<p className="joint-notice" role="status">正在核对两项检测记录…</p>}
      {batch?.status==='review'&&<p className="joint-notice">尺寸记录待复核，暂不能生成联合结论。</p>}
    </div>
    <div className="joint-selection">
      <span className="joint-selection-icon"><QualityIcon name="box"/></span>
      <label htmlFor="joint-sample">本次视觉图片对应的样本<small>按同一件样本关联尺寸与视觉结果</small></label>
      <select id="joint-sample" aria-label="本次视觉图片对应的样本" value={sampleId} disabled={!report} onChange={event=>onSampleChange(event.target.value)}>
        <option value="">{report?'请选择本次图片对应的零件编号':'先导入实测记录，再选择零件'}</option>
        {report?.items.map(row=><option key={row.sample_id} value={row.sample_id}>{row.serial_number} · {jointStatus[row.status]}</option>)}
      </select>
      {report?<button className="button" type="button" disabled={!selected} onClick={onOpenVision}>为此样本做视觉检测 <QualityIcon name="arrow" size={16}/></button>
        :<button className="button" type="button" onClick={onOpenDimensions}>前往尺寸检测 <QualityIcon name="arrow" size={16}/></button>}
    </div>
    <div className="quality-desk-grid">
      <div className="quality-desk-main">{children}</div>
      <aside className="joint-sidebar" aria-label="联合判定与处置">
        <section className="joint-decision-panel">
          <header><span className="joint-panel-icon"><QualityIcon name="shield"/></span><div><h2>判定与处置</h2><p>每一件，都有明确去向</p></div></header>
          {selected?<article className={'joint-selected '+selected.status} aria-label="所选样本联合处理">
            <div className="joint-selected-title"><span className={'joint-status '+selected.status}><QualityIcon name={selected.status==='qualified'?'check':selected.status==='unqualified'?'alert':'clock'} size={16}/>{jointStatus[selected.status]}</span><span>样本 {selectedIndex+1}</span></div>
            <p className="joint-serial" title={selected.sample_id}>零件编号 · {selected.serial_number}</p>
            <div className="joint-checks"><span><QualityIcon name="ruler" size={16}/>尺寸<strong data-state={selected.dimensions}>{checkStatus[selected.dimensions]}</strong></span><span><QualityIcon name="camera" size={16}/>视觉<strong data-state={selected.visual}>{checkStatus[selected.visual]}</strong></span></div>
            {selected.dimensions_incomplete&&<p className="joint-small-note">部分尺寸项仍需补检</p>}
            <div className="joint-handling"><span>处理方式</span><strong>{selected.handling}</strong><small>处置方向已生成 · 尚未执行</small></div>
            {selected.evidence_error&&<p className="joint-notice" role="alert">{selected.evidence_error}</p>}
            {selected.issues.length>0&&<details className="joint-issue-details"><summary>查看问题位置与依据 <span>{selected.issues.length} 项</span></summary><ul>{selected.issues.map((issue,index)=><li key={index}>
              <b>{issue.label}</b><span>{issue.location}</span><strong>{issue.action_label}</strong><small>{issue.evidence}</small></li>)}</ul></details>}
          </article>:<div className="joint-decision-empty"><span><QualityIcon name="box" size={30}/></span><h3>{report?'选择一件样本':'等待检测结果'}</h3><p>{report?'在上方选择样本，查看它的尺寸、视觉结果与处理方式。':'完成尺寸检测，关联对应图片后，这里将生成逐件联合结论。'}</p></div>}
        </section>
        <section className="joint-types"><header><h3>不合格类型</h3><span>涉及样本</span></header>
          {report?.types.length?<ul>{report.types.map(row=><li key={row.key}><div><strong>{row.label}</strong><span>{row.sample_count} 件</span></div><span className="joint-type-track" aria-hidden="true"><i style={{width:`${100*row.sample_count/maxType}%`}}/></span></li>)}</ul>:<p className="joint-types-empty">{report?'当前未发现已确认的不合格项':'检测完成后显示类型分布'}</p>}
          <p className="joint-small-note">同一件可包含多种不合格类型</p>
        </section>
        <details className="joint-rules"><summary>判定与处理规则</summary><p>合格 → 保存记录，进入下一工序或入库。</p><p>不合格 → 隔离，按缺陷处理后复检。</p><p>待判定 → 暂缓流转，补齐检测。</p><p>同一样本只计一件，复检更新该件结果。</p></details>
      </aside>
    </div>
    {report&&<details className="joint-batch-records"><summary><QualityIcon name="box" size={18}/><strong>逐件判定（{c.total} 件）</strong><span>尺寸 · 视觉 · 处理方式</span></summary><div className="joint-table"><table><thead><tr><th>样本</th><th>尺寸</th><th>视觉</th><th>联合结果</th><th>处理方式</th></tr></thead><tbody>
      {report.items.map(row=><tr key={row.sample_id}><td><button type="button" onClick={()=>onSampleChange(row.sample_id)} title={row.sample_id}>{row.serial_number}</button></td><td>{checkStatus[row.dimensions]}</td><td>{checkStatus[row.visual]}</td><td><span className={'joint-status '+row.status}>{jointStatus[row.status]}</span></td><td>{row.handling}</td></tr>)}
    </tbody></table></div><p className="joint-small-note">批次：{batch.batch_id}</p></details>}
    <footer className="joint-scope"><QualityIcon name="shield" size={16}/><span>按本批检验清单与逐件图片判定。合格率 = 合格件数 / 已判定件数；待判定不计入分母。流转、返工与报废尚未执行。</span></footer>
  </section>;
}
