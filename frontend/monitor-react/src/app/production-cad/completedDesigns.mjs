import {freeCadArtifacts, validFreeCadRun} from './freecad.mjs';

export const completedDesignKey = 'freecad.completed-designs.v1';
const eventName = 'freecad:completed-design';

// A notification is not a standard or a request to start inspection. Read the owned server directory.
export function notifyPublishedDocument(detail,target=globalThis.window) {
  target?.dispatchEvent(new CustomEvent(eventName,{detail:{...detail,published:true}}));
  try {target?.localStorage?.setItem('freecad.published-notification',JSON.stringify({...detail,at:Date.now(),nonce:Math.random()}));} catch { /* Same-page events still work. */ }
}

export function readCompletedDesigns(storage) {
  try {
    const entries = JSON.parse(storage?.getItem(completedDesignKey) || '[]');
    if (!Array.isArray(entries)) return [];
    const unique = new Map();
    for (const entry of entries.slice(-40)) {
      if (!validFreeCadRun(entry?.run_id) || entry.status !== 'completed' || !Number.isFinite(entry.created_at) || entry.created_at < 0) continue;
      unique.set(entry.run_id, {run_id:entry.run_id,status:'completed',created_at:entry.created_at,automatic:entry.automatic!==false});
    }
    return [...unique.values()].sort((a,b)=>a.created_at-b.created_at).slice(-20);
  } catch { return []; }
}

export function publishCompletedDesign(run, history = [], {target=globalThis.window,automatic=true} = {}) {
  const artifacts = freeCadArtifacts(run);
  if (run?.validation?.step_roundtrip !== true || !artifacts.some(item=>item.format==='stl') || !artifacts.some(item=>item.format==='step')) return;
  let storage;
  try { storage=target?.localStorage; } catch { /* Same-page updates still work when shared storage is unavailable. */ }
  const entries = new Map(readCompletedDesigns(storage).map(entry=>[entry.run_id,entry]));
  for (const entry of [...history.filter(item=>item?.run_id!==run.run_id),run]) {
    if (!validFreeCadRun(entry?.run_id) || entry.status !== 'completed') continue;
    if (entries.has(entry.run_id)) {
      if(entry.run_id===run.run_id && automatic) entries.get(entry.run_id).automatic=true;
      continue;
    }
    const created_at = Number.isFinite(entry.created_at) && entry.created_at >= 0 ? entry.created_at : entry.run_id===run.run_id ? Date.now()/1000 : 0;
    entries.set(entry.run_id,{run_id:entry.run_id,status:'completed',created_at,automatic:entry.run_id===run.run_id&&automatic});
  }
  const next=[...entries.values()].sort((a,b)=>a.created_at-b.created_at).slice(-20);
  try { const value=JSON.stringify(next); if(storage?.getItem(completedDesignKey)!==value) storage?.setItem(completedDesignKey,value); } catch { /* Storage is an index, not the modeling standard. */ }
  target?.dispatchEvent(new CustomEvent(eventName));
}

export function subscribeCompletedDesigns(listener, target = globalThis.window) {
  const storageChanged = event => { if (event.key === completedDesignKey || event.key === 'freecad.published-notification' || event.key === null) listener(); };
  const visible = () => { if (target?.document?.visibilityState==='visible') listener(); };
  target?.addEventListener(eventName,listener);
  target?.addEventListener('storage',storageChanged);
  target?.addEventListener('focus',listener);
  target?.document?.addEventListener('visibilitychange',visible);
  return () => {
    target?.removeEventListener(eventName,listener);
    target?.removeEventListener('storage',storageChanged);
    target?.removeEventListener('focus',listener);
    target?.document?.removeEventListener('visibilitychange',visible);
  };
}
