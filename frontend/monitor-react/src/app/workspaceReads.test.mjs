import test from 'node:test';
import assert from 'node:assert/strict';
import {readWorkspace,peekWorkspaceRead,invalidateWorkspaceReads} from './workspaceReads.mjs';
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
