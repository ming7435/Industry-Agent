import {request} from './apiRequest.mjs';
import {getTeamSession,subscribeTeamSession} from '../teamSession.mjs';
import {rememberDeletedMaintenancePlans,subscribeMaintenanceChanges} from './maintenanceChanges.mjs';
import {normalizeRunResponse} from './traceLog.mjs';

const paths=['/api/maintenance/plans','/api/runs?limit=5000','/api/workorders?summary=true'];
const detailPath=path=>/^\/api\/workorders\/[^/?]+$/.test(path);
const tracePath=path=>path.startsWith('/api/trace?');
const actorScope=()=>JSON.stringify([getTeamSession().actor?.user_id||'',getTeamSession().actor?.role||'']);
const entries=new Map();
let epoch=getTeamSession().version;
const aborted=()=>new DOMException('读取已取消','AbortError');
export const workspaceRunVersion=run=>JSON.stringify([run?.run_id||'',run?.trace_ids,run?.trace_id,run?.event_count,run?.ended_at,run?.status,run?.error_count]);
export const workspaceRunTraceIds=run=>(Array.isArray(run?.trace_ids)&&run.trace_ids.length?run.trace_ids:[run?.trace_id]).filter(value=>value&&!String(value).startsWith('event-'));
// 正文只跟随工单修订；产线观察时间不是工单业务版本。
export const workorderDetailVersion=order=>JSON.stringify([order?.workorder_id,order?._revision,order?.updated_at]);

export function invalidateWorkspaceReads() {
  for(const entry of entries.values())entry.controller?.abort();
  entries.clear();
}
subscribeTeamSession(session=>{
  if(session.version===epoch)return;
  epoch=session.version;invalidateWorkspaceReads();
});
subscribeMaintenanceChanges(invalidateWorkspaceReads);

export function peekWorkspaceRead(path,{scope=actorScope(),revision}={}) {
  const entry=entries.get(path);
  if(path.startsWith('/api/workorders')&&entry?.scope!==scope)return null;
  if(revision!==undefined&&entry?.revision!==revision)return null;
  return entry?.loadedAt&&Date.now()-entry.loadedAt<60000 ? entry.value : null;
}

function consume(promise,signal) {
  if(!signal)return promise;
  if(signal.aborted)return Promise.reject(aborted());
  return new Promise((resolve,reject)=>{
    const cancel=()=>reject(aborted());
    signal.addEventListener('abort',cancel,{once:true});
    promise.then(value=>signal.aborted?reject(aborted()):resolve(value),reject)
      .finally(()=>signal.removeEventListener('abort',cancel));
  });
}

export function readWorkspace(path,{signal,freshFor=0,force=false,scope=actorScope(),revision,...options}={}) {
  if(!paths.includes(path)&&path!=='/api/team/line'&&!detailPath(path)&&!tracePath(path)||(options.method&&options.method!=='GET'))return request(path,{...options,signal});
  if(signal?.aborted)return Promise.reject(aborted());
  let previous=entries.get(path);
  if(previous&&(previous.scope!==scope||(revision!==undefined&&previous.revision!==revision))){
    previous.controller?.abort();entries.delete(path);previous=null;
  }
  if(previous?.promise)return consume(previous.promise,signal);
  if(!force&&previous?.loadedAt&&Date.now()-previous.loadedAt<freshFor)return consume(Promise.resolve(previous.value),signal);
  const version=getTeamSession().version;
  const entry={value:previous?.value,loadedAt:previous?.loadedAt,scope,revision,controller:new AbortController()};
  entries.set(path,entry);
  entry.promise=request(path,{...options,signal:entry.controller.signal}).then(value=>{
    if(entries.get(path)!==entry||version!==getTeamSession().version)throw aborted();
    if(detailPath(path)&&revision!==undefined){
      const [id,number,updated]=JSON.parse(revision);
      const workorder=value?.workorder||value;
      if(workorder?.workorder_id&&workorder.workorder_id!==id
        || number!==null&&number!==undefined&&workorder?._revision!==undefined&&String(workorder._revision)!==String(number)
        || updated!==null&&updated!==undefined&&workorder?.updated_at!==undefined&&workorder.updated_at!==updated){
        entries.delete(path);
        throw new Error('工单版本已变化，正在重新读取任务详情');
      }
    }
    rememberDeletedMaintenancePlans(value?.deleted_plan_ids||[]);
    entry.value=value;entry.loadedAt=Date.now();return value;
  }).finally(()=>{if(entries.get(path)===entry)entry.promise=null;});
  const details=[...entries.keys()].filter(detailPath);
  for(const old of details.slice(0,-3)){entries.get(old)?.controller.abort();entries.delete(old);}
  const traces=[...entries.keys()].filter(tracePath);
  for(const old of traces.slice(0,-3)){entries.get(old)?.controller.abort();entries.delete(old);}
  return consume(entry.promise,signal);
}

function readVerifiedBody(path,revision) {
  const entry=entries.get(path);
  // Only a fresh, authorized directory/version read can renew an immutable body.
  if(entry?.value&&entry.revision===revision&&entry.scope===actorScope()){
    entry.loadedAt=Date.now();return Promise.resolve(entry.value);
  }
  return readWorkspace(path,{freshFor:5000,revision});
}

export function startWorkspacePrefetch({chooseOrder}={}) {
  let timer,stopped=false,version=-1;
  const schedule=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(stopped)return;
      const owner=getTeamSession().version;
      const selected=getTeamSession().actor ? paths : paths.slice(0,2);
      const reads=selected.map(path=>readWorkspace(path,{freshFor:5000}));
      Promise.allSettled(reads);
      reads[1].then(body=>{
        if(stopped||owner!==getTeamSession().version)return;
        const run=normalizeRunResponse(body)[0],ids=workspaceRunTraceIds(run);
        if(!run||ids.length>3)return;
        return Promise.allSettled(ids.map(id=>readVerifiedBody(`/api/trace?trace_id=${encodeURIComponent(id)}&limit=5000`,workspaceRunVersion(run))));
      }).catch(()=>{});
      if(reads[2])reads[2].then(async body=>{
        if(stopped||owner!==getTeamSession().version)return;
        const items=body?.items||[];
        const id=chooseOrder?.(items)||items.find(item=>!['closed','completed'].includes(item.status))?.workorder_id||items[0]?.workorder_id;
        const item=items.find(item=>item.workorder_id===id);
        if(!item)return;
        if(stopped||owner!==getTeamSession().version)return;
        await readVerifiedBody(`/api/workorders/${encodeURIComponent(id)}`,workorderDetailVersion(item));
      }).catch(()=>{});
    },350);
  };
  const sessionSubscription=subscribeTeamSession(session=>{
    if(session.version===version)return;
    version=session.version;schedule();
  });
  const changesSubscription=subscribeMaintenanceChanges(schedule);
  const heartbeat=setInterval(schedule,30000);
  return()=>{stopped=true;clearTimeout(timer);clearInterval(heartbeat);sessionSubscription();changesSubscription();};
}
