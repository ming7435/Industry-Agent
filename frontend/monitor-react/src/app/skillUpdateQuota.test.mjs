import test from 'node:test';
import assert from 'node:assert/strict';
import {skillUpdateQuota,canPublishWithQuota} from './skillUpdateQuota.mjs';

const skill={agent:'diagnosis',name:'alarm_diagnosis_skill'};
const snapshot=records=>({value:{...skill,rollback_rate:{status:'not_applicable',observed_publications:records.length,records}}});

test('版本更新计一次，重复保存不计次数，旧接口只能提供未生效的预览',()=>{
  const value=skillUpdateQuota(skill,snapshot([
    {edit_id:'A',old_version:'1.0',new_version:'1.0',counted:false},
    {edit_id:'B',old_version:'1.0',new_version:'1.0',counted:false},
    {edit_id:'C',old_version:'1.0',new_version:'1.1',counted:false},
  ]));
  assert.equal(value.used,1);assert.equal(value.remaining,2);assert.equal(value.enforced,false);
});

test('另一技能的次数不能用于当前技能，截断的发布列表不能猜测剩余额度',()=>{
  assert.equal(skillUpdateQuota({...skill,name:'other'},snapshot([])),null);
  const partial=snapshot([]);partial.value.rollback_rate.observed_publications=30;
  assert.equal(skillUpdateQuota(skill,partial),null);
});

test('优先采用服务器当前周额度，跨周归零后不沿用旧详情的次数',()=>{
  const quota={scope:'skill',...skill,limit:3,used:0,remaining:3,complete:true,enforced:true};
  const value=skillUpdateQuota({...skill,update_quota:{...quota,used:3,remaining:0}},
    {value:{...skill,update_quota:quota}});
  assert.equal(value.used,0);assert.equal(value.remaining,3);assert.equal(value.enforced,true);
});

test('缺少完整的服务器限额确认时不能发布，旧服务的预览不能放行',()=>{
  const quota={scope:'skill',...skill,limit:3,used:1,remaining:2,complete:true,enforced:true};
  assert.equal(canPublishWithQuota(quota),true);
  for(const value of [null,{...quota,enforced:false},{...quota,enforced:undefined},
    {...quota,complete:false},{...quota,remaining:null},{...quota,remaining:-1},
    {...quota,remaining:0},{...quota,used:3},{...quota,limit:30}]) {
    assert.equal(canPublishWithQuota(value),false);
  }
  assert.equal(canPublishWithQuota(skillUpdateQuota(skill,snapshot([]))),false);
});
