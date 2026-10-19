import React,{useEffect,useState} from 'react';
import DesignParameterEditor from './DesignParameterEditor.jsx';
import {beginSpecTask,specCommand,specTasks} from './documentSpec.mjs';

export default function DocumentSpecTasks({snapshot,pending,onSubmit,request}){
  const [task,setTask]=useState('edit'),[draft,setDraft]=useState(null),[prepared,setPrepared]=useState(null),[error,setError]=useState(''),[valid,setValid]=useState(true),[confirmed,setConfirmed]=useState(false),[epoch,setEpoch]=useState(0);
  const stale=!!prepared&&(prepared.document_id!==snapshot?.document_id||prepared.revision!==snapshot?.revision);
  function prepare(id=task){
    if(pending||!snapshot)return;
    setTask(id);setConfirmed(false);setError('');setValid(true);
    try{setDraft(beginSpecTask(snapshot,id));setPrepared({document_id:snapshot.document_id,revision:snapshot.revision});setEpoch(x=>x+1);}
    catch(failure){setError(failure.message);setDraft(null);setPrepared(null);}
  }
  useEffect(()=>{if(request?.id)prepare(request.id);},[request?.epoch]);
  useEffect(()=>{setConfirmed(false);},[snapshot?.document_id,snapshot?.revision]);
  function change(spec){setDraft(spec);setConfirmed(false);setError('');}
  function execute(){
    if(pending||!draft||!valid||!confirmed||stale)return;
    try{const command=specCommand(prepared,draft,snapshot);setConfirmed(false);onSubmit(command);}
    catch(failure){setError(failure.message);}
  }
  return <section className="cad-spec-tasks" aria-label="规格建模任务">
    <label>建模任务<select value={task} disabled={pending} onChange={e=>{setTask(e.target.value);setDraft(null);setPrepared(null);setConfirmed(false);setError('');}}>{specTasks.map(item=><option key={item.id} value={item.id}>{item.label}{item.current?' · 当前模型':' · 新规格'}</option>)}</select></label>
    <button type="button" disabled={pending||!snapshot} onClick={()=>prepare()}>读取任务参数</button>
    <p>这些任务通过 Text-to-CAD 执行。重建会替换当前工作文档中的对象并生成新修订，历史修订和已发布版本保留。</p>
    {error&&<p role="alert">{error}</p>}{stale&&<p role="alert">工作修订已更新，请重新读取参数并确认。</p>}
    {draft&&<><p>草稿来源：工作修订 {prepared.revision} · {specTasks.find(item=>item.id===task)?.label}</p>
      <DesignParameterEditor key={epoch} spec={draft} onChange={change} disabled={pending||stale} onValidityChange={setValid} idPrefix="document-spec" openAllInitially/>
      <details><summary>核对完整规格（只读）</summary><pre>{JSON.stringify(draft,null,2)}</pre></details>
      <label className="cad-confirm"><input type="checkbox" checked={confirmed} disabled={pending||stale||!valid} onChange={e=>setConfirmed(e.target.checked)}/>我确认按以上参数重建当前文档（生成新修订）</label>
      <button type="button" disabled={pending||stale||!valid||!confirmed} onClick={execute}>执行建模任务</button>
    </>}
  </section>;
}
