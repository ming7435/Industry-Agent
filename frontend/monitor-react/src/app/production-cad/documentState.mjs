export const createDocumentState=actorId=>({actorId,documentId:'',generation:0,head:null,snapshot:null,selectedObjectId:'',pending:null,error:''});
export const documentToken=state=>({actorId:state.actorId,documentId:state.documentId,generation:state.generation});
export const currentDocumentToken=(state,token)=>state.actorId===token.actorId&&state.documentId===token.documentId&&state.generation===token.generation;
export const selectDocument=(state,documentId)=>({...createDocumentState(state.actorId),documentId,generation:state.generation+1});
export const documentPollDelay=visible=>visible?2000:null;
export function applyDocumentSnapshot(state,snapshot,token) {
  if(!currentDocumentToken(state,token)||snapshot?.document_id!==state.documentId||!Number.isInteger(snapshot.revision)||snapshot.revision<(state.snapshot?.revision??-1)) return state;
  return {...state,snapshot,selectedObjectId:snapshot.objects.some(o=>o.object_id===state.selectedObjectId)?state.selectedObjectId:''};
}
const pendingKey=(actorId,documentId)=>`freecad.pending.v1:${actorId}:${documentId}`;
export function readPendingCommand(storage,actorId,documentId) {
  try { const value=JSON.parse(storage?.getItem(pendingKey(actorId,documentId))||'null');
    return value?.actorId===actorId&&value.document_id===documentId&&/^CMD-[\w-]+$/.test(value.command_id)?value:null;
  } catch { return null; }
}
export function beginDocumentCommand(state,command,storage,kind='edit') {
  if(state.pending) throw new Error('上一命令尚未完成，请先核对状态');
  if(command.document_id!==state.documentId||!/^CMD-[\w-]+$/.test(command.command_id)) throw new Error('命令身份无效');
  const pending={...command,actorId:state.actorId,kind};
  try { if(!storage) throw new Error(); storage.setItem(pendingKey(state.actorId,state.documentId),JSON.stringify(pending)); }
  catch { throw new Error('无法保存本次命令身份，未提交。请允许会话存储后重试'); }
  return {...state,pending,error:''};
}
export function reconcileDocumentCommand(state,record,storage) {
  if(!state.pending||record?.command_id!==state.pending.command_id) return state;
  if(!['completed','failed','rejected'].includes(record.state)) return {...state,pending:{...state.pending,state:record.state}};
  try { storage?.removeItem(pendingKey(state.actorId,state.documentId)); } catch { /* The server remains authoritative. */ }
  return {...state,pending:null,error:record.state==='completed'?'':record.error?.message||record.error||'命令未执行成功'};
}
