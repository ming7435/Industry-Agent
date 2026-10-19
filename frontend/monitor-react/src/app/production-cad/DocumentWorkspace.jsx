import React,{useEffect,useRef,useState} from 'react';
import {createDocumentApi} from './documentApi.mjs';
import useCadDocument from './useCadDocument.jsx';
import DocumentTree from './DocumentTree.jsx';
import DocumentProperties,{dimensionLabels} from './DocumentProperties.jsx';
import DocumentViewer from './DocumentViewer.jsx';
import CommandCatalog from './CommandCatalog.jsx';
import DocumentSpecTasks from './DocumentSpecTasks.jsx';
import WorkbenchMenuBar from './WorkbenchMenuBar.jsx';
import './cadWorkbench.css';
import {getTeamSession,setTeamSessionActor,subscribeTeamSession} from '../../teamSession.mjs';
import {teamRequest} from '../../teamApi.mjs';

const defaultApi=createDocumentApi();
const storage=()=>{try{return window.sessionStorage;}catch{return null;}};
const activeKey=actorId=>`freecad.active-document:${actorId}`;
const defaults={box:{length:40,width:20,height:10},cylinder:{diameter:20,length:30},sphere:{diameter:20},cone:{bottom_diameter:30,top_diameter:0,height:40}};
function PrimitiveForm({disabled,onSubmit,initialKind='box'}) {
  const [kind,setKind]=useState(initialKind),[dimensions,setDimensions]=useState(defaults[initialKind]);
  const valid=Object.entries(dimensions).every(([k,v])=>String(v).trim()&&Number.isFinite(Number(v))&&Number(v)<=10000&&Number(v)>=(k==='top_diameter'?0:Number.MIN_VALUE))&&(kind!=='cone'||Number(dimensions.bottom_diameter)>Number(dimensions.top_diameter));
  return <form className="cad-primitive-form" onSubmit={e=>{e.preventDefault();if(valid)onSubmit({command_type:'create_primitive',parameters:{primitive_type:kind,...Object.fromEntries(Object.entries(dimensions).map(([k,v])=>[k,Number(v)]))}});}}><label>基础形体<select disabled={disabled} value={kind} onChange={e=>{setKind(e.target.value);setDimensions(defaults[e.target.value]);}}>{[['box','长方体'],['cylinder','圆柱'],['sphere','球体'],['cone','圆锥 / 圆台']].map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label>
    {Object.entries(dimensions).map(([key,value])=><label key={key}>新形体{dimensionLabels[key]}（mm）<input type="number" step="any" value={value} disabled={disabled} onChange={e=>setDimensions({...dimensions,[key]:e.target.value})}/></label>)}<button disabled={disabled||!valid}>添加形体</button></form>;
}
export default function DocumentWorkspace({api=defaultApi,actorId:providedActor,initialDocumentId=''}) {
  const [session,setSession]=useState(getTeamSession),actorId=providedActor??session.actor?.user_id??'';
  const [documentId,setDocumentId]=useState(initialDocumentId),[documents,setDocuments]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[epoch,setEpoch]=useState(0);
  const [name,setName]=useState(''),[number,setNumber]=useState(''),[source,setSource]=useState(''),[prompt,setPrompt]=useState(''),[proposal,setProposal]=useState(null);
  const generation=useRef(0),createRequest=useRef(null);
  const newPanel=useRef(null),primitivePanel=useRef(null),proposalPanel=useRef(null),[primitive,setPrimitive]=useState('box'),[primitiveEpoch,setPrimitiveEpoch]=useState(0);
  const specPanel=useRef(null),[specRequest,setSpecRequest]=useState(null);
  const reveal=ref=>{if(ref.current){if(ref.current.tagName==='DETAILS')ref.current.open=true;ref.current.scrollIntoView({block:'nearest'});ref.current.querySelector('input,textarea,select')?.focus();}};
  const choosePrimitive=kind=>{setPrimitive(kind);setPrimitiveEpoch(x=>x+1);reveal(primitivePanel);};
  const chooseSpec=id=>{setSpecRequest(value=>({id,epoch:(value?.epoch||0)+1}));reveal(specPanel);};
  const cad=useCadDocument({actorId,documentId,api}),blocked=busy||!!cad.pending||!!cad.head?.active_command_id;
  const selected=cad.snapshot?.objects.find(o=>o.object_id===cad.selectedObjectId);
  useEffect(()=>{if(providedActor!==undefined)return;const unsub=subscribeTeamSession(setSession),abort=new AbortController();teamRequest('me').then(value=>{if(!abort.signal.aborted)setTeamSessionActor(value.user);}).catch(()=>{});return()=>{abort.abort();unsub();};},[providedActor]);
  useEffect(()=>{generation.current++;setDocuments([]);setProposal(null);setError('');setBusy(false);createRequest.current=null;setDocumentId(initialDocumentId||storage()?.getItem(activeKey(actorId))||'');},[actorId,initialDocumentId]);
  useEffect(()=>{
    if(!actorId)return;const current=++generation.current,abort=new AbortController();let timer;
    const refresh=async()=>{clearTimeout(timer);if(document.visibilityState==='hidden')return;try {const all=[];let cursor='';do{const page=await api.documents({signal:abort.signal,cursor});all.push(...page.items);cursor=page.next_cursor;}while(cursor&&!abort.signal.aborted);if(abort.signal.aborted||current!==generation.current)return;setDocuments(all);setDocumentId(value=>value||all[0]?.document_id||'');}catch(failure){if(!abort.signal.aborted&&current===generation.current&&failure.name!=='AbortError')setError(failure.message);}if(!abort.signal.aborted)timer=setTimeout(refresh,2000);};
    const visible=()=>{clearTimeout(timer);if(document.visibilityState!=='hidden')refresh();};refresh();window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);
    return()=>{abort.abort();clearTimeout(timer);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);};
  },[api,actorId,epoch]);
  useEffect(()=>{if(actorId&&documentId)try{storage()?.setItem(activeKey(actorId),documentId);}catch{}setProposal(null);},[actorId,documentId,cad.head?.revision]);
  async function create(event) {
    event.preventDefault();if(busy||!actorId)return;const current=generation.current;
    const body={part_name:name.trim(),part_number:number,...(source.trim()?{source_run_id:source.trim()}:{})};
    if(!createRequest.current||JSON.stringify(createRequest.current.body)!==JSON.stringify(body))createRequest.current={body,request_id:crypto.randomUUID()};
    try {setBusy(true);setError('');const head=await api.create({...body,request_id:createRequest.current.request_id});if(current!==generation.current)return;createRequest.current=null;setDocumentId(head.document_id);setEpoch(v=>v+1);}catch(failure){if(current===generation.current)setError(failure.message);}finally{if(current===generation.current)setBusy(false);}
  }
  async function propose(event) {
    event.preventDefault();if(blocked||!cad.head)return;const current=generation.current,id=documentId,revision=cad.head.revision;
    try {setBusy(true);setProposal(null);setError('');const result=await api.propose(id,{prompt,expected_revision:revision});if(current===generation.current)setProposal(result);}catch(failure){if(current===generation.current)setError(failure.message);}finally{if(current===generation.current)setBusy(false);}
  }
  const proposalCurrent=proposal?.command?.document_id===documentId&&proposal?.command?.expected_revision===cad.head?.revision;
  return <section className="cad-document-workspace production-cad cad-mcp-workbench" aria-label="个人 Text-to-CAD 文档">
    <WorkbenchMenuBar onNew={()=>reveal(newPanel)} onSave={cad.publish} onRefresh={cad.refresh} onProperties={()=>document.querySelector('.cad-document-properties')?.scrollIntoView({block:'nearest'})} onProposal={()=>reveal(proposalPanel)} onSpec={chooseSpec} canSpec={!blocked&&!!cad.snapshot} canSave={!blocked&&!!cad.snapshot?.product_root_ids?.length}/>
    <CommandCatalog actorId={actorId} blocked={blocked} canConfigure={!!cad.snapshot} onPrimitive={choosePrimitive} onSpec={chooseSpec}/>
    <header className="cad-card-heading"><div><h2>Text-to-CAD 生产建模</h2><p>网页操作界面 · 建模命令由 Text-to-CAD 执行 · 发布版本作为检测标准</p></div></header>
    {!actorId?<p role="alert">请先登录账号，再创建或打开个人文档。</p>:<>
    {(error||cad.error)&&<p role="alert" className="cad-alert">{error||cad.error}</p>}
    <details className="cad-card" open={!documentId} ref={newPanel}><summary>新建文档 / 复制历史设计</summary><form onSubmit={create}><label>新文档零件名称<input required maxLength={128} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><label>新文档零件编号<input pattern="[0-9]{5}" maxLength={5} value={number} disabled={busy||!!source.trim()} onChange={e=>setNumber(e.target.value)} placeholder={source.trim()?'复制时继承来源设计短号':'留空自动生成五位编号'}/></label><label>复制来源完整设计编号（选填）<input value={source} disabled={busy} onChange={e=>setSource(e.target.value)} placeholder="FC-…，原文件保持不变"/></label><button disabled={busy||!name.trim()}>创建个人文档</button></form></details>
    <label>个人文档<select value={documentId} onChange={e=>setDocumentId(e.target.value)} disabled={busy}><option value="">选择文档</option>{documents.map(d=><option key={d.document_id} value={d.document_id}>{d.part_name}（{d.part_number}）</option>)}{documentId&&!documents.some(d=>d.document_id===documentId)&&<option value={documentId}>{documentId}</option>}</select></label>
    {cad.head&&<><section className="cad-card-heading"><h3>{cad.head.part_name} · {cad.head.part_number}</h3><p>工作修订 {cad.head.revision} · 已发布版本 {cad.head.published_version??'无'}{cad.head.published_revision!==cad.head.revision?' · 存在未发布修改':''}</p></section>
    {(cad.pending||cad.head.active_command_id)&&<p role="status">{cad.pending?.state==='outcome_unknown'?'结果待核对，不会自动重执行':'原生任务执行中，请稍候'} <button onClick={cad.refresh}>查回状态</button></p>}
    <div className="cad-document-layout"><div className="cad-document-combo"><DocumentTree snapshot={cad.snapshot} selectedObjectId={cad.selectedObjectId} onSelect={cad.selectObject}/><DocumentProperties key={`${documentId}:${selected?.object_id}:${cad.snapshot?.revision}`} object={selected} pending={blocked} onSubmit={cad.submit}/></div><div className="cad-document-stage"><DocumentViewer key={actorId+documentId} snapshot={cad.snapshot} selectedObjectId={cad.selectedObjectId} onSelect={cad.selectObject}/><div className="cad-document-tab">{cad.head.part_name}{cad.head.published_revision!==cad.head.revision?' *':''}</div></div><aside className="cad-document-tasks" aria-label="建模任务"><h3>任务</h3>
    <details className="cad-card" open={!cad.snapshot?.objects.length||primitiveEpoch>0} ref={primitivePanel}><summary>添加基础形体</summary><PrimitiveForm key={primitiveEpoch} initialKind={primitive} disabled={blocked} onSubmit={cad.submit}/></details>
    <details className="cad-card" ref={specPanel}><summary>规格与工作台建模</summary><DocumentSpecTasks key={`${actorId}:${documentId}`} snapshot={cad.snapshot} pending={blocked} onSubmit={cad.submit} request={specRequest}/></details>
    <section className="cad-card" ref={proposalPanel}><form onSubmit={propose}><label>中文建模或修改需求<textarea rows={3} maxLength={4000} value={prompt} disabled={blocked} onChange={e=>{setPrompt(e.target.value);setProposal(null);}} placeholder="例如：创建直径20mm的球体；将底板的长度改为65mm"/></label><button disabled={blocked||!prompt.trim()}>生成修改提案</button></form>
      {proposal?.status==='needs_input'&&<p>{proposal.questions?.join('；')||'请补充完整尺寸'}</p>}
      {proposalCurrent&&<div aria-label="待确认修改"><p>旧值：{JSON.stringify(cad.snapshot.objects.find(o=>o.object_id===proposal.command.parameters.object_id)?.properties||[])}</p><p>新提案：{proposal.command.command_type}</p><pre>{JSON.stringify(proposal.command.parameters,null,2)}</pre><button disabled={blocked} onClick={()=>{const command=proposal.command;setProposal(null);cad.submit(command);}}>确认并执行提案</button></div>}
    </section></aside></div><div className="cad-actions"><button className="cad-primary" disabled={blocked||!cad.snapshot?.product_root_ids?.length} onClick={cad.publish}>保存发布版本</button><button onClick={cad.refresh}>刷新文档</button></div>
    <div className="cad-actions">{(cad.snapshot?.artifacts||[]).filter(a=>['model.py','model.json','model.FCStd','model.step','model.stl','drawing.svg','drawing.pdf','unfold.svg','unfold.dxf','motion.json'].includes(a.name)).map(a=><a key={a.name} href={`/api/cad/text-to-cad/documents/${encodeURIComponent(documentId)}/snapshots/${cad.snapshot.revision}/artifacts/${a.name}`} download>下载 {a.name}</a>)}</div>
    </>}
    </>}
  </section>;
}
