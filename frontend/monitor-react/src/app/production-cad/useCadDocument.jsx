import {useEffect,useRef,useState} from 'react';
import {applyDocumentSnapshot,beginDocumentCommand,createDocumentState,currentDocumentToken,documentPollDelay,documentToken,readPendingCommand,reconcileDocumentCommand,selectDocument} from './documentState.mjs';
import {notifyPublishedDocument} from './completedDesigns.mjs';

const sessionStorage=()=>{try{return window.sessionStorage;}catch{return null;}};
export default function useCadDocument({actorId,documentId,api}) {
  const [value,setValue]=useState(()=>selectDocument(createDocumentState(actorId),documentId));
  const state=useRef(value), identity=useRef(''), refreshRef=useRef(()=>{}), writing=useRef(false);
  const key=`${actorId}:${documentId}`;
  // Invalidate synchronously on render: old responses cannot win before the effect cleanup.
  if(identity.current!==key) {identity.current=key;state.current=selectDocument({...createDocumentState(actorId),generation:state.current.generation},documentId);}
  const update=next=>{state.current=typeof next==='function'?next(state.current):next;setValue(state.current);};
  useEffect(()=>{
    const token=documentToken(state.current), storage=sessionStorage(); let disposed=false,timer,abort,inFlight=false,refreshQueued=false;
    update({...state.current,pending:readPendingCommand(storage,actorId,documentId)});
    const valid=()=>!disposed&&identity.current===key&&currentDocumentToken(state.current,token);
    const read=async()=>{
      clearTimeout(timer);abort?.abort();
      if(!actorId||!documentId||document.visibilityState==='hidden') return;
      const controller=new AbortController();abort=controller;
      try {
        const head=await api.head(documentId,{signal:controller.signal});
        if(!valid()||controller.signal.aborted) return;
        if(head.revision<(state.current.snapshot?.revision??-1)) {timer=setTimeout(refresh,2000);return;}
        const cached=state.current.snapshot;
        const snapshot=cached?.document_id===documentId&&cached.revision===head.revision
          ?cached:await api.snapshot(documentId,head.revision,{signal:controller.signal});
        if(!valid()||controller.signal.aborted) return;
        update({...applyDocumentSnapshot(state.current,snapshot,token),head,error:''});
        const pending=state.current.pending||(head.active_command_id?{command_id:head.active_command_id,document_id:documentId,actorId,kind:'edit'}:null);
        if(pending) {
          if(!state.current.pending) update({...state.current,pending});
          try {
            const record=await api.command(documentId,pending.command_id,{signal:controller.signal});
            if(!valid()||controller.signal.aborted) return;
            const next=reconcileDocumentCommand(state.current,record,storage); update(next);
            if(!next.pending&&record.state==='completed') {
              if(pending.kind==='publish') notifyPublishedDocument({actorId,documentId});
              timer=setTimeout(refresh,0);return;
            }
          } catch(error) {if(error.status!==404) throw error; /* A response-lost command stays query-only, never auto-replayed. */}
        }
      } catch(error) {if(valid()&&!controller.signal.aborted&&error.name!=='AbortError') update({...state.current,error:error.message,...(error.status===401?{head:null,snapshot:null}:{})});}
      if(valid()) {const delay=documentPollDelay(document.visibilityState!=='hidden');if(delay!==null) timer=setTimeout(refresh,delay);}
    };
    async function refresh() {
      if(disposed)return;
      if(inFlight){refreshQueued=true;return;}
      inFlight=true;
      try {await read();}
      finally {
        inFlight=false;
        if(refreshQueued&&!disposed&&document.visibilityState!=='hidden') {
          refreshQueued=false;clearTimeout(timer);timer=setTimeout(refresh,0);
        }
      }
    }
    refreshRef.current=refresh;
    const visible=()=>{clearTimeout(timer);if(document.visibilityState!=='hidden') refresh();else abort?.abort();};
    window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);refresh();
    return()=>{disposed=true;clearTimeout(timer);abort?.abort();window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);};
  },[actorId,documentId,api,key]);
  const send=async(command,kind='edit')=>{
    if(writing.current) return;
    const current=state.current, token=documentToken(current);
    if(!actorId||!documentId||!current.head) return;
    try {
      writing.current=true;
      const envelope={...command,command_id:command.command_id||`CMD-${crypto.randomUUID()}`,document_id:documentId,expected_revision:command.expected_revision??current.head.revision};
      update(beginDocumentCommand(current,envelope,sessionStorage(),kind));
      const body=kind==='publish'?{command_id:envelope.command_id,expected_revision:envelope.expected_revision}:envelope;
      const record=await api[kind==='publish'?'publish':'submit'](documentId,body);
      if(identity.current!==key||!currentDocumentToken(state.current,token)) return;
      update(reconcileDocumentCommand(state.current,record,sessionStorage()));
      if(kind==='publish'&&record.state==='completed') notifyPublishedDocument({actorId,documentId});
    } catch(error) {
      if(identity.current===key&&currentDocumentToken(state.current,token)&&error.name!=='AbortError') {
        if(error.status&&error.status<500) update(reconcileDocumentCommand(state.current,{command_id:state.current.pending?.command_id,state:'rejected',error:error.message},sessionStorage()));
        else update({...state.current,error:error.message});
      }
    } finally {writing.current=false;if(identity.current===key) refreshRef.current();}
  };
  const displayed=value.actorId===actorId&&value.documentId===documentId?value:state.current;
  return {...displayed,submit:command=>send(command),publish:()=>send({},'publish'),refresh:()=>refreshRef.current(),
    selectObject:objectId=>update({...state.current,selectedObjectId:state.current.snapshot?.objects.some(o=>o.object_id===objectId)?objectId:''})};
}
