import React,{useEffect,useRef,useState} from 'react';
import {createDocumentApi} from './documentApi.mjs';
import {catalogAction,catalogCommands} from './commandCatalog.mjs';
const defaultApi=createDocumentApi();
const store=()=>{try{return window.sessionStorage;}catch{return null;}};
const pendingKey=actor=>`freecad.catalog-pending:${actor}`;
function readPending(actor){try{const value=JSON.parse(store()?.getItem(pendingKey(actor))||'null');return value?.body?.request_id&&value.body.workbench_id!==undefined?value:null;}catch{return null;}}

export default function CommandCatalog({actorId='',onPrimitive,onSpec,blocked=false,canConfigure=true,api=defaultApi}){
  const [catalog,setCatalog]=useState(null),[workbench,setWorkbench]=useState('all'),[search,setSearch]=useState(''),[selectedId,setSelected]=useState(null),[message,setMessage]=useState(''),[pending,setPending]=useState(null),[queryEpoch,setQueryEpoch]=useState(0);
  const generation=useRef(0),sending=useRef(false),pendingRef=useRef(null),root=useRef(null),catalogRead=useRef(0);
  function remember(value){pendingRef.current=value;setPending(value);try{if(value)store()?.setItem(pendingKey(actorId),JSON.stringify(value));else store()?.removeItem(pendingKey(actorId));}catch{}}
  useEffect(()=>{
    const current=++generation.current,abort=new AbortController();
    const original=readPending(actorId);pendingRef.current=original;setPending(original);setMessage('');sending.current=false;setSelected(null);
    const read=++catalogRead.current;
    async function load(){try{const value=await api.catalog({signal:abort.signal});if(current===generation.current&&read===catalogRead.current&&!abort.signal.aborted)setCatalog(Array.isArray(value?.commands)?value:null);}catch(error){if(!abort.signal.aborted&&current===generation.current&&read===catalogRead.current)setMessage(error.message);}}
    load();
    return()=>{abort.abort();};
  },[actorId,api]);
  useEffect(()=>{
    const current=generation.current,abort=new AbortController();let timer;
    async function poll(){
      const operation=pendingRef.current;
      if(!operation?.job_id||!actorId||abort.signal.aborted)return;
      try{
        const result=await api.discovery(operation.job_id,{signal:abort.signal});
        if(abort.signal.aborted||current!==generation.current)return;
        if(result.state==='completed'){
          const read=++catalogRead.current;
          const value=await api.catalog({signal:abort.signal});
          if(abort.signal.aborted||current!==generation.current||read!==catalogRead.current)return;
          setCatalog(Array.isArray(value?.commands)?value:null);remember(null);setMessage('MCP 目录读取完成');return;
        }
        if(result.state==='failed'){remember(null);setMessage('目录读取失败；原生工作台或依赖暂不可用');return;}
        if(result.state==='outcome_unknown'){setMessage('发现结果待核对，不会重新执行');return;}
        timer=setTimeout(poll,1000);
      }catch(error){if(!abort.signal.aborted&&current===generation.current)setMessage(error.message);}
    }
    poll();
    return()=>{abort.abort();clearTimeout(timer);};
  },[actorId,api,pending?.job_id,queryEpoch]);
  async function discover(recover=false){
    if(!actorId||blocked||sending.current||(!recover&&pendingRef.current))return;
    const current=generation.current;
    const nativeWorkbench=catalog?.workbenches?.find(w=>w.id===workbench&&w.installed===true);
    const operation=recover?pendingRef.current:{body:{request_id:crypto.randomUUID(),workbench_id:nativeWorkbench?workbench:''}};
    if(!operation)return;
    sending.current=true;remember(operation);setMessage('正在提交 MCP 目录读取任务…');
    try{
      const result=await api.discover(operation.body);
      if(current!==generation.current)return;
      remember({...operation,job_id:result.job_id});setMessage('MCP 发现任务已排队；不修改零件几何');
    }catch(error){
      if(current===generation.current){setMessage(error.message);if(error.status&&error.status<500)remember(null);}
    }finally{if(current===generation.current)sending.current=false;}
  }
  const commands=catalogCommands(catalog,workbench,search),selected=catalog?.commands?.find(c=>c.id===selectedId),action=catalogAction(selected);
  return <section className="cad-command-catalog" aria-label="FreeCAD 完整功能目录" ref={root}>
    <div className="cad-workbench-selector"><label>FreeCAD 工作台<select value={workbench} disabled={!!pending} onChange={e=>{setWorkbench(e.target.value);setSelected(null);}}><option value="all">全部工作台与通用命令</option>{(catalog?.workbenches||[]).map(w=><option key={w.id} value={w.id}>{w.label}（{w.command_count} 条已发现命令）</option>)}</select></label>
      <button type="button" disabled={!actorId||blocked||!!pending} onClick={()=>discover()}>通过 MCP 读取工作台</button><span>FreeCAD MCP · {catalog?.command_count??0} 条已发现命令{catalog&&!catalog.current?' · 目录待更新':''}</span></div>
    {message&&<p role="status">{message}</p>}{pending&&!pending.job_id&&<button type="button" disabled={sending.current} onClick={()=>discover(true)}>查回原发现请求</button>}
    {pending?.job_id&&<button type="button" onClick={()=>setQueryEpoch(x=>x+1)}>查回发现任务</button>}
    <details data-cad-command-catalog><summary>完整命令目录 · 搜索与参数入口</summary><label>搜索全部 FreeCAD 命令<input value={search} maxLength={256} onChange={e=>setSearch(e.target.value)} placeholder="名称、命令编号或用途"/></label>
      <p>{catalog?.note||'尚无当前内核的完整目录。通过 MCP 读取后展示真实工作台和注册命令。'} 当前筛选 {commands.length} 条。</p>
      <div className="cad-command-explorer"><div className="cad-command-list">{commands.map(command=><button key={command.id} type="button" aria-pressed={selected?.id===command.id} onClick={()=>setSelected(command.id)}>{command.label} · {command.id}<small>{command.execution==='adapted'?'已接入 MCP':'查看接入状态'}</small></button>)}</div>
        <aside aria-label="命令接入详情">{selected?<><h3>{selected.label}</h3><code>{selected.id}</code><p>{selected.description}</p>{selected.shortcut&&<p>原生快捷键：{selected.shortcut}</p>}{action?<><p>{selected.adapter_scope||'输入参数并确认后，通过现有 MCP 文档命令执行。'}</p><button type="button" disabled={blocked||!canConfigure} onClick={()=>action.type==='create_primitive'?onPrimitive?.(action.primitive_type):onSpec?.(action.task_id)}>配置此操作</button></>:<p>{selected.disabled_reason||'尚未接通此命令的网页交互流程。'}</p>}</>:<p>选择命令查看说明、快捷键与参数接入状态。</p>}</aside>
      </div>
    </details>
  </section>;
}
