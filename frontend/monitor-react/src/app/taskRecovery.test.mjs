import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryLabel, createRecoveryCommands } from './taskRecovery.mjs';

test('unknown write offers reconciliation and completed task cannot resume', () => {
  assert.equal(recoveryLabel({can_resume:true,requires_reconcile:true}), '核对结果并继续');
  assert.equal(recoveryLabel({can_resume:true,requires_reconcile:false}), '从失败步骤继续');
  assert.equal(recoveryLabel({can_resume:false,status:'completed'}), '已完成');
});

test('lost recovery response retains request identity and a confirmed failure allows a new attempt', async () => {
  const calls=[];
  let fail=true;
  const commands=createRecoveryCommands(async (url, options)=>{
    calls.push(JSON.parse(options.body));
    if(fail) throw new Error('response lost');
    return {status:'blocked'};
  }, ()=>String(calls.length+1));
  await assert.rejects(commands.resume('REC-1'));
  fail=false;
  await commands.resume('REC-1');
  assert.equal(calls[0].request_id,calls[1].request_id);
  await commands.resume('REC-1');
  assert.notEqual(calls[1].request_id,calls[2].request_id);
});
