import test from 'node:test';
import assert from 'node:assert/strict';
import {readWorkspace,peekWorkspaceRead,invalidateWorkspaceReads,startWorkspacePrefetch} from './workspaceReads.mjs';
import {setTeamSessionActor} from '../teamSession.mjs';
import {publishMaintenanceChange} from './maintenanceChanges.mjs';

test('预读与页面读取共用请求，离开一个页面不取消其他使用者的读取',async()=>{
  invalidateWorkspaceReads();
  const original=globalThis.fetch;
  let finish,reads=0;
  globalThis.fetch=async()=>{reads++;return new Promise(resolve=>{finish=resolve;});};
  try {
    const warm=readWorkspace('/api/runs?limit=5000');
    const controller=new AbortController();
    const page=readWorkspace('/api/runs?limit=5000',{signal:controller.signal});
    controller.abort();
    await assert.rejects(page,{name:'AbortError'});
    finish(new Response(JSON.stringify({runs:[{run_id:'fault:ONE'}]})));
    await warm;
    assert.equal(reads,1);
    assert.equal(peekWorkspaceRead('/api/runs?limit=5000').runs[0].run_id,'fault:ONE');
  } finally {globalThis.fetch=original;invalidateWorkspaceReads();}
});

test('换账号清除预读内容，旧账号的晚返回不能进入新缓存',async()=>{
  setTeamSessionActor({user_id:'A',role:'technician'},{force:true});
  const original=globalThis.fetch;
  let finish;
  globalThis.fetch=async()=>new Promise(resolve=>{finish=resolve;});
  try {
    const old=readWorkspace('/api/runs?limit=5000');
    setTeamSessionActor({user_id:'B',role:'technician'},{force:true});
    finish(new Response(JSON.stringify({runs:[{run_id:'production_simulation:PRIVATE-A'}]})));
    await assert.rejects(old,{name:'AbortError'});
    assert.equal(peekWorkspaceRead('/api/runs?limit=5000'),null);
    globalThis.fetch=async()=>new Response(JSON.stringify({runs:[{run_id:'fault:B'}]}));
    await readWorkspace('/api/runs?limit=5000');
    assert.equal(peekWorkspaceRead('/api/runs?limit=5000').runs[0].run_id,'fault:B');
    publishMaintenanceChange({user_id:'B'},{deleted_workorder_ids:['WO-REMOVED']});
    assert.equal(peekWorkspaceRead('/api/runs?limit=5000'),null);
  } finally {globalThis.fetch=original;invalidateWorkspaceReads();}
});

test('工单目录与预读正文版本不一致时不缓存旧正文，下一次读取得到最新任务',async()=>{
  invalidateWorkspaceReads();
  const original=globalThis.fetch;
  let reads=0;
  globalThis.fetch=async()=>new Response(JSON.stringify({workorder:{workorder_id:'WO-VERSION',_revision:++reads,updated_at:`v${reads}`}}));
  const revision=JSON.stringify(['WO-VERSION',2,'v2','line1']);
  try {
    await assert.rejects(readWorkspace('/api/workorders/WO-VERSION',{revision}),/工单版本已变化/);
    assert.equal(peekWorkspaceRead('/api/workorders/WO-VERSION'),null);
    const current=await readWorkspace('/api/workorders/WO-VERSION',{revision});
    assert.equal(current.workorder._revision,2);
  } finally {globalThis.fetch=original;invalidateWorkspaceReads();}
});

test('后台持续更新小目录，版本未变化不重复下载正文，版本变化后更新正文',async()=>{
  setTeamSessionActor({user_id:'U-IDLE',role:'technician'},{force:true});
  const original={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
  const originalNow=Date.now;let clock=Date.now();Date.now=()=>clock;
  let scheduled,heartbeat,stop,revision=1;
  const reads=new Map();
  globalThis.setTimeout=callback=>{scheduled=callback;return 1;};
  globalThis.clearTimeout=()=>{};
  globalThis.setInterval=(callback,delay)=>{assert.equal(delay,30000);heartbeat=callback;return 2;};
  globalThis.clearInterval=()=>{};
  globalThis.fetch=async path=>{
    reads.set(path,(reads.get(path)||0)+1);
    const order={workorder_id:'WO-IDLE',_revision:revision,updated_at:`v${revision}`};
    const body=path==='/api/workorders?summary=true'?{items:[{...order,_summary_record:true}]}:
      path==='/api/workorders/WO-IDLE'?{workorder:order}:
      path==='/api/team/line'?{state:'stopped',generation:1,updated_at:'line1'}:
      path==='/api/runs?limit=5000'?{runs:[{run_id:'fault:IDLE',trace_id:'T-IDLE',trace_ids:['T-IDLE'],event_count:revision,status:'completed'}]}:
      path.startsWith('/api/trace?')?{trace:[]}:{items:[]};
    return new Response(JSON.stringify(body));
  };
  const settle=async()=>{for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));};
  try {
    stop=startWorkspacePrefetch();scheduled();await settle();
    assert.equal(reads.get('/api/workorders/WO-IDLE'),1);
    clock+=30000;heartbeat();scheduled();await settle();
    assert.equal(reads.get('/api/workorders?summary=true'),2);
    assert.equal(reads.get('/api/workorders/WO-IDLE'),1);
    assert.equal(reads.get('/api/trace?trace_id=T-IDLE&limit=5000'),1);
    revision=2;clock+=30000;heartbeat();scheduled();await settle();
    assert.equal(reads.get('/api/workorders/WO-IDLE'),2);
    assert.equal(reads.get('/api/trace?trace_id=T-IDLE&limit=5000'),2);
  } finally {stop?.();Object.assign(globalThis,original);Date.now=originalNow;invalidateWorkspaceReads();}
});
