import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAgentInvocations, runEventMatches} from './traceLog.mjs';

test('技能步骤和重复工具调用归属同一次 Agent，失败和 false 返回不丢失', () => {
  const base = {task_id:'Q-1',trace_id:'T-1',agent_run_id:'A-1',agent:'quality'};
  const events = [
    {...base,type:'agent',event:'agent_started',input:{part_id:'P-1'}},
    {...base,type:'agent_step',name:'inspect_dimensions',event:'step_completed',skill:'part_quality_inspection_skill',step:'inspect_dimensions',output:{passed:false}},
    {...base,type:'tool',event:'tool_completed',tool_name:'inspect_part_dimensions',tool_call_id:'C-1',output:false},
    {...base,type:'tool',event:'tool_error',tool_name:'inspect_part_dimensions',tool_call_id:'C-2',error:'离线'},
    {...base,type:'agent',event:'agent_completed',output:{passed:false}},
  ];
  const [invocation] = buildAgentInvocations(events);
  assert.equal(invocation.skill_steps.length,1);
  assert.equal(invocation.skill_steps[0].skill,'part_quality_inspection_skill');
  assert.equal(invocation.tool_calls.length,2);
  assert.equal(invocation.tool_calls[0].output,false);
  assert.equal(invocation.tool_calls[1].status,'异常');
  assert.equal(runEventMatches({run_type:'quality',trace_ids:['T-1']},{type:'agent',agent:'report',trace_id:'T-1'}),true);
});

test('同一次 Agent loop 重复步骤分别绑定自己的输入', () => {
  const base={type:'agent_step',agent:'quality',agent_run_id:'RUN-LOOP',name:'inspect',step:'inspect'};
  const [invocation]=buildAgentInvocations([
    {type:'agent',agent:'quality',agent_run_id:'RUN-LOOP',event:'agent_started'},
    {...base,step_run_id:'S1',event:'step_started',input:{revision:1}},
    {...base,step_run_id:'S1',event:'step_completed',output:{passed:false}},
    {...base,step_run_id:'S2',event:'step_started',input:{revision:2}},
    {...base,step_run_id:'S2',event:'step_completed',output:{passed:true}},
    {type:'agent',agent:'quality',agent_run_id:'RUN-LOOP',event:'agent_completed'},
  ]);
  assert.deepEqual(invocation.skill_steps.map(step=>step.input),[{revision:1},{revision:2}]);
});
test('故障报告读取质量记录仍属于故障，不从执行明细丢失', () => {
  assert.equal(runEventMatches({run_type:'fault',trace_id:'T'}, {trace_id:'T',agent:'report',tool_name:'get_quality_record'}), true);
});
