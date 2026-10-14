import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeTraceResponse,
  normalizeRunResponse,
  runEventMatches,
  traceEventSummary,
  traceDetailSections,
  buildAgentInvocations,
} from "./traceLog.mjs";

test("normalizes lifecycle run records and keeps quality as an independent type", () => {
  const runs = normalizeRunResponse({
    runs: [{ run_id: "fault:EVT-1", run_type: "fault", phases: [{ id: "monitor", status: "completed" }] },
      { run_id: "quality:TASK-2", run_type: "quality", phases: [{ id: "quality", status: "completed" }] }],
  });
  assert.equal(runs.length, 2);
  assert.equal(runs[1].run_type, "quality");
  assert.equal(runEventMatches(runs[1], { agent: "quality", event: "agent_completed" }), true);
  assert.equal(runEventMatches(runs[1], { agent: "diagnosis", event: "agent_completed" }), false);
  assert.equal(runEventMatches(runs[0], { agent: "quality", event: "agent_completed" }), false);
});

test("normalizes trace API records without dropping detailed execution fields", () => {
  const records = normalizeTraceResponse({
    trace: [{
      timestamp: "2026-09-27T08:00:00Z",
      type: "tool",
      event: "tool_called",
      tool_name: "search_knowledge",
      arguments: { query: "主轴温度", limit: 5 },
      output: { total: 2, items: [{ title: "SOP" }] },
      context: { device_id: "TRAK-TC820LTYSI-001" },
      task_id: "TASK-1",
      trace_id: "TRACE-1",
    }],
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].tool_name, "search_knowledge");
  assert.deepEqual(records[0].arguments, { query: "主轴温度", limit: 5 });
  assert.deepEqual(records[0].output, { total: 2, items: [{ title: "SOP" }] });
  assert.deepEqual(records[0].context, { device_id: "TRAK-TC820LTYSI-001" });
});

test("summarizes tool and agent events with a readable operation label", () => {
  assert.deepEqual(traceEventSummary({
    type: "tool",
    event: "tool_called",
    tool_name: "query_cad",
    mcp_server: "cad",
    execution_time: 0.125,
  }), {
    label: "工具调用",
    operation: "query_cad",
    status: "已完成",
    server: "cad",
    duration: "125 ms",
  });
});

for (const [type, startEvent, endEvent, idKey, name] of [
  ['agent', 'agent_started', 'agent_completed', 'agent_run_id', 'diagnosis'],
  ['tool', 'tool_started', 'tool_completed', 'tool_call_id', 'search_knowledge'],
  ['agent_step', 'step_started', 'step_completed', 'step_run_id', 'retrieve'],
  ['node', 'node_started', 'node_completed', 'node_run_id', 'diagnosis'],
  ['a2a', 'a2a_started', 'a2a_completed', 'call_id', 'router->diagnosis'],
  ['loop', 'loop_start', 'loop_stop', 'loop_id', 'runtime'],
  ['planner', 'planner_start', 'planner_end', 'plan_id', 'runtime_planner'],
  ['execution', 'execution_start', 'execution_end', 'execution_id', 'execution'],
]) test(`已结束的 ${type} 开始事件显示该次调用终态，原始事件保持不变`, () => {
  const start={type,event:startEvent,name,agent:type==='loop'?'runtime':'diagnosis',node:name,
    trace_id:'TRACE-DONE',task_id:'TASK-DONE',timestamp:'2026-10-14T00:00:00Z',
    context:{[idKey]:'CALL-DONE'}};
  const end={...start,event:endEvent,timestamp:'2026-10-14T00:00:02Z',output:{success:true},state_change:{status:'completed'}};
  const original=JSON.stringify(start);
  assert.equal(traceEventSummary(start,[end,start]).status,'已完成');
  assert.equal(JSON.stringify(start),original);
});

test('不能用同一任务中另一调用或另一 Trace 的结束事件关闭当前调用',()=>{
  const start={type:'tool',event:'tool_started',tool_name:'query_cad',trace_id:'TRACE-A',
    task_id:'TASK-SHARED',context:{tool_call_id:'CALL-2'},timestamp:'2026-10-14T00:00:02Z'};
  const records=[start,
    {...start,event:'tool_completed',context:{tool_call_id:'CALL-1'},timestamp:'2026-10-14T00:00:03Z'},
    {...start,event:'tool_completed',trace_id:'TRACE-B',timestamp:'2026-10-14T00:00:04Z'}];
  assert.equal(traceEventSummary(start,records).status,'执行中');
});

test('工具异常终态保留异常，不能因所属 Agent 完成而显示成功',()=>{
  const start={type:'tool',event:'tool_started',tool_name:'query_cad',trace_id:'TRACE-A',
    agent:'cad',agent_run_id:'AGENT-1',tool_call_id:'CALL-1',timestamp:'2026-10-14T00:00:00Z'};
  const records=[start,{...start,event:'tool_error',error:'HTTP 503',timestamp:'2026-10-14T00:00:01Z'},
    {...start,type:'agent',event:'agent_completed',timestamp:'2026-10-14T00:00:02Z'}];
  assert.equal(traceEventSummary(start,records).status,'异常');
});

for (const [kind,terminal,expected] of [
  ['a2a',{type:'a2a',event:'a2a_completed',name:'router->knowledge',request_id:'REQ-1',success:false,status:'failed'},'异常'],
  ['step',{type:'agent_step',event:'step_completed',name:'retrieve',step_run_id:'STEP-1',success:false},'异常'],
  ['execution',{type:'execution',event:'execution_end',name:'execution',state_change:{execution_id:'EXEC-1',status:'CANCELLED'}},'已停止'],
]) test(`${kind} 顶层失败或取消回执不能显示成功`,()=>{
  const end={...terminal,trace_id:'TRACE-FAIL',timestamp:'2026-10-14T00:00:01Z'};
  const start={...end,event:kind==='execution'?'execution_start':kind==='step'?'step_started':'a2a_started',
    timestamp:'2026-10-14T00:00:00Z'};
  delete start.success;delete start.status;
  if(kind==='execution')start.state_change={execution_id:'EXEC-1',status:'RUNNING'};
  assert.equal(traceEventSummary(start,[start,end]).status,expected);
  assert.equal(traceEventSummary(end,[start,end]).status,expected);
});

for (const kind of ['a2a','execution']) test(`${kind} 按实际回执中的稳定编号匹配交错调用`,()=>{
  const base={type:kind,name:kind==='a2a'?'router->knowledge':'execution',agent:'runtime',trace_id:'TRACE-PARALLEL'};
  const identity=id=>kind==='a2a'?{request_id:id,message_id:'MSG-'+id}:{state_change:{execution_id:id}};
  const startA={...base,...identity('CALL-A'),event:kind==='a2a'?'a2a_started':'execution_start',timestamp:'2026-10-14T00:00:00Z'};
  const startB={...base,...identity('CALL-B'),event:kind==='a2a'?'a2a_started':'execution_start',timestamp:'2026-10-14T00:00:01Z'};
  const endA={...startA,event:kind==='a2a'?'a2a_completed':'execution_end',timestamp:'2026-10-14T00:00:02Z',success:true};
  const records=[startA,startB,endA];
  assert.equal(traceEventSummary(startA,records).status,'已完成');
  assert.equal(traceEventSummary(startB,records).status,'执行中');
});

test('所属 Agent 已结束但步骤结束回执缺失时显示待核对，不伪造完成',()=>{
  const start={type:'agent_step',event:'step_started',name:'retrieve',trace_id:'TRACE-A',
    agent:'knowledge',agent_run_id:'AGENT-1',step_run_id:'STEP-1',timestamp:'2026-10-14T00:00:00Z'};
  assert.equal(traceEventSummary(start,[start,{...start,type:'agent',event:'agent_completed',
    timestamp:'2026-10-14T00:00:02Z'}]).status,'状态待核对');
});

test('历史 Runtime 的停止不能关闭之后新开始的调用',()=>{
  const start={type:'tool',event:'tool_started',name:'query_cad',trace_id:'TRACE-A',
    tool_call_id:'CALL-NEW',timestamp:'2026-10-14T00:00:03Z'};
  const stop={type:'loop',event:'loop_stop',agent:'runtime',node:'runtime',trace_id:'TRACE-A',
    state_change:{status:'completed'},timestamp:'2026-10-14T00:00:02Z'};
  assert.equal(traceEventSummary(start,[stop,start]).status,'执行中');
});

test('历史恢复开始记录没有结束回执但后续 Runtime 已停止时不再显示执行中',()=>{
  const start={type:'runtime',event:'recovery_started',name:'task_recovery',agent:'runtime',
    trace_id:'TRACE-RECOVERY',task_id:'TASK-RECOVERY',timestamp:'2026-10-14T00:00:00Z'};
  const stop={...start,type:'loop',event:'loop_stop',name:'runtime',node:'runtime',
    state_change:{status:'blocked'},timestamp:'2026-10-14T00:00:02Z'};
  assert.equal(traceEventSummary(start,[start,stop]).status,'状态待核对');
});

test('同名无调用编号的顺序重试不能继承上一调用的完成状态',()=>{
  const start={type:'tool',event:'tool_started',name:'query_cad',trace_id:'TRACE-A',
    timestamp:'2026-10-14T00:00:00Z'};
  const end={...start,event:'tool_completed',timestamp:'2026-10-14T00:00:01Z'};
  const retry={...start,timestamp:'2026-10-14T00:00:02Z'};
  assert.equal(traceEventSummary(retry,[retry,end,start]).status,'执行中');
  assert.equal(traceEventSummary(start,[retry,end,start]).status,'已完成');
});

test('工具调用编号只在上下文中时输入和结束回执仍合并为同一次调用',()=>{
  const owner={agent:'knowledge',agent_run_id:'AGENT-K',trace_id:'TRACE-K',task_id:'TASK-K'};
  const records=[{...owner,type:'agent',event:'agent_started',timestamp:'2026-10-14T00:00:00Z'},
    {...owner,type:'tool',event:'tool_started',tool_name:'search_manual',arguments:{query:'主轴'},
      context:{tool_call_id:'CALL-K'},timestamp:'2026-10-14T00:00:01Z'},
    {...owner,type:'tool',event:'tool_completed',tool_name:'search_manual',output:{total:2},
      context:{tool_call_id:'CALL-K'},timestamp:'2026-10-14T00:00:02Z'},
    {...owner,type:'agent',event:'agent_completed',timestamp:'2026-10-14T00:00:03Z'}];
  const invocation=buildAgentInvocations(records)[0];
  assert.equal(invocation.tool_calls.length,1);
  assert.equal(invocation.tool_calls[0].status,'已完成');
  assert.deepEqual(invocation.tool_calls[0].input,{query:'主轴'});
  assert.deepEqual(invocation.tool_calls[0].output,{total:2});
});

test("extracts operation, tool input, context, return body, and full event sections", () => {
  const sections = traceDetailSections({
    type: "tool",
    event: "tool_called",
    name: "search_knowledge",
    arguments: { query: "报警 700001" },
    output: { total: 1 },
    context: { device_id: "TRAK-001", alarm_code: "700001" },
    task_id: "TASK-1",
  });

  assert.deepEqual(sections.map((item) => item.key), ["operation", "tool", "context", "return", "raw"]);
  assert.match(sections.find((item) => item.key === "tool").value, /报警 700001/);
  assert.match(sections.find((item) => item.key === "return").value, /total/);
});

test("groups one Agent invocation with explicit input, context, tools, and output", () => {
  const invocations = buildAgentInvocations([
    {
      timestamp: "2026-09-27T08:00:00Z",
      type: "agent",
      event: "agent_started",
      agent: "diagnosis",
      agent_run_id: "AGENT-RUN-1",
      task_id: "TASK-1",
      trace_id: "TRACE-1",
      input: { device_id: "TRAK-001", alarm_code: "700001" },
      context: { device_id: "TRAK-001", alarm_code: "700001", phase: "diagnosis" },
    },
    {
      timestamp: "2026-09-27T08:00:01Z",
      type: "tool",
      event: "tool_called",
      agent: "diagnosis",
      agent_run_id: "AGENT-RUN-1",
      task_id: "TASK-1",
      trace_id: "TRACE-1",
      tool_name: "search_knowledge",
      arguments: { query: "报警 700001" },
      output: { total: 1, items: [{ title: "SOP" }] },
      context: { phase: "diagnosis", source: "knowledge" },
    },
    {
      timestamp: "2026-09-27T08:00:01Z",
      type: "runtime",
      event: "observation_added",
      tool_name: "search_knowledge",
      state_change: { observation: { total: 1 } },
      context: { agent: "diagnosis", agent_run_id: "AGENT-RUN-1", trace_id: "TRACE-1", task_id: "TASK-1", phase: "diagnosis" },
    },
    {
      timestamp: "2026-09-27T08:00:02Z",
      type: "agent",
      event: "agent_completed",
      agent: "diagnosis",
      agent_run_id: "AGENT-RUN-1",
      task_id: "TASK-1",
      trace_id: "TRACE-1",
      output: { diagnosis: "冷却回路异常" },
      context: { phase: "diagnosis", evidence_count: 1 },
      elapsed_ms: 2000,
    },
  ]);

  assert.equal(invocations.length, 1);
  assert.equal(invocations[0].agent, "diagnosis");
  assert.equal(invocations[0].agent_run_id, "AGENT-RUN-1");
  assert.deepEqual(invocations[0].input, { device_id: "TRAK-001", alarm_code: "700001" });
  assert.deepEqual(invocations[0].output, { diagnosis: "冷却回路异常" });
  assert.equal(invocations[0].status, "已完成");
  assert.equal(invocations[0].tool_calls.length, 1);
  assert.equal(invocations[0].tool_calls[0].tool_name, "search_knowledge");
  assert.deepEqual(invocations[0].tool_calls[0].input, { query: "报警 700001" });
  assert.deepEqual(invocations[0].tool_calls[0].output, { total: 1, items: [{ title: "SOP" }] });
  assert.equal(invocations[0].context.phase, "diagnosis");
});

test("keeps repeated calls of the same Agent as separate numbered invocations", () => {
  const records = [1, 2].flatMap((number) => [
    { timestamp: `2026-09-27T08:0${number}:00Z`, type: "agent", event: "agent_started", agent: "workorder", agent_run_id: `AGENT-RUN-${number}`, task_id: "TASK-1", trace_id: "TRACE-1", input: { attempt: number } },
    { timestamp: `2026-09-27T08:0${number}:01Z`, type: "agent", event: "agent_completed", agent: "workorder", agent_run_id: `AGENT-RUN-${number}`, task_id: "TASK-1", trace_id: "TRACE-1", output: { workorder_id: `WO-${number}` } },
  ]);
  const invocations = buildAgentInvocations(records);
  assert.deepEqual(invocations.map((item) => item.invocation_no), [1, 2]);
  assert.deepEqual(invocations.map((item) => item.output.workorder_id), ["WO-1", "WO-2"]);
});

test("marks an incomplete Agent invocation as running and an errored one as abnormal", () => {
  const invocations = buildAgentInvocations([
    { timestamp: "2026-09-27T08:00:00Z", type: "agent", event: "agent_started", agent: "monitor", agent_run_id: "RUN-A", trace_id: "TRACE-A", input: { device_id: "A" } },
    { timestamp: "2026-09-27T08:00:02Z", type: "agent", event: "agent_error", agent: "diagnosis", agent_run_id: "RUN-B", trace_id: "TRACE-B", error: "模型不可用" },
  ]);
  assert.equal(invocations[0].status, "执行中");
  assert.equal(invocations[1].status, "异常");
  assert.equal(invocations[1].error, "模型不可用");
});

test("技能只读核查归属原调用，不能替换业务输出或改写完成状态", () => {
  const owner = {agent:'workorder',agent_run_id:'WO-RUN-1',trace_id:'TRACE-1',task_id:'TASK-1'};
  const records = [
    {...owner,type:'agent',event:'agent_started',input:{device_id:'D-1'}},
    {...owner,type:'agent',event:'agent_completed',output:{status:'assigned',workorder_id:'WO-1'}},
    {...owner,type:'skill_review',event:'skill_review_completed',skill:'auto_assignment',
      status:'completed',skill_fingerprint:'a'.repeat(64),output:{highlights:[{path:'/output/status',value:'assigned'}],missing:[]}},
    {...owner,type:'skill_review',event:'skill_review_unverified',skill:'workorder_create',
      status:'not_verified',message:'核查队列已满'},
    {...owner,agent_run_id:'OTHER-RUN',type:'skill_review',event:'skill_review_completed',skill:'repair_feedback',
      output:{highlights:[],missing:[]}},
  ];
  const actual = buildAgentInvocations(records)[0];
  assert.equal(actual.status,'已完成');
  assert.deepEqual(actual.output,{status:'assigned',workorder_id:'WO-1'});
  assert.equal(actual.skill_reviews.length,2);
  assert.deepEqual(actual.skill_reviews.map(r=>r.skill),['auto_assignment','workorder_create']);
  assert.equal(actual.skill_reviews[0].skill_fingerprint,'a'.repeat(64));
  assert.equal(actual.tool_calls.length,0);
});

for (const terminal of ['agent_error',null]) test(`业务输出缺失时核查不能填充业务输出：${terminal || '执行中'}`,()=>{
  const owner={agent:'workorder',agent_run_id:'WO-PARTIAL',trace_id:'TRACE-PARTIAL',task_id:'TASK-PARTIAL'};
  const records=[{...owner,type:'agent',event:'agent_started',timestamp:'2026-10-13T01:00:00Z'}];
  if(terminal) records.push({...owner,type:'agent',event:terminal,timestamp:'2026-10-13T01:00:01Z'});
  records.push({...owner,type:'skill_review',event:'skill_review_completed',status:'completed',
    timestamp:'2026-10-13T01:00:02Z',skill:'auto_assignment',output:{highlights:[],missing:['/input/feedback']}});
  const actual=buildAgentInvocations(records)[0];
  assert.equal(actual.status,terminal ? '异常' : '执行中');
  assert.equal(actual.output,null);
  assert.equal(actual.skill_reviews.length,1);
  assert.notEqual(actual.ended_at,'2026-10-13T01:00:02Z');
});

test("matches lifecycle events through event id when task ids differ", () => {
  const run = {
    run_type: "fault",
    event_id: "EVT-1",
    event_ids: ["EVT-1"],
    trace_ids: ["TRACE-1"],
    task_ids: ["TASK-1", "TASK-2"],
  };

  assert.equal(runEventMatches(run, { trace_id: "TRACE-1", task_id: "TASK-2", event: "tool_completed" }), true);
  assert.equal(runEventMatches(run, { event_id: "EVT-1", event: "agent_completed" }), true);
  assert.equal(runEventMatches(run, { trace_id: "TRACE-OTHER", task_id: "TASK-OTHER", event: "tool_completed" }), false);
});

test("selected Memory RAG retains its real owner, A2A boundaries, and all generic skill steps", () => {
  const identity = { trace_id: "TRACE-MEMORY-API-1F2717FD5A1D", task_id: "TASK-MEMORY-API-7561F821014F" };
  const owner = { agent: "memory", agent_run_id: "MEMORY-1", ...identity };
  const run = { run_type: "rag", trace_ids: [identity.trace_id], task_ids: [identity.task_id] };
  const records = [
    { type: "a2a", event: "a2a_started", name: "router->memory", ...identity },
    { type: "agent", event: "agent_started", name: "memory", ...owner },
    ...["initialize", "load_skill", "validate_search", "fallback"].flatMap((name) => [
      { type: "agent_step", event: "step_started", name, node: name, ...owner },
      { type: "agent_step", event: "step_completed", name, node: name, ...owner },
    ]),
    { type: "agent", event: "agent_completed", name: "memory", output: { success: false }, ...owner },
    { type: "a2a", event: "a2a_completed", name: "router->memory", ...identity },
  ];

  const selected = records.filter((record) => runEventMatches(run, record));
  const invocations = buildAgentInvocations(selected);

  assert.deepEqual(selected, records);
  assert.equal(invocations.length, 1);
  assert.equal(invocations[0].agent, "memory");
  assert.equal(invocations[0].event_count, 10);
  assert.equal(invocations[0].skill_steps.length, 4);
  assert.deepEqual(invocations[0].output, { success: false });
});

test("selected RAG Trace excludes other Traces that reuse its Task", () => {
  const run = { run_type: "rag", trace_ids: ["TRACE-SELECTED"], task_ids: ["TASK-SHARED"] };
  assert.equal(runEventMatches(run, { trace_id: "TRACE-OTHER", task_id: "TASK-SHARED", agent: "knowledge", event: "agent_completed" }), false);
  assert.equal(runEventMatches(run, { task_id: "TASK-SHARED", agent: "knowledge", event: "agent_completed" }), false);
});

test("RAG without Trace uses its Task and excludes records with a different execution identity", () => {
  const run = { run_type: "rag", task_ids: ["TASK-SELECTED"] };
  assert.equal(runEventMatches(run, { task_id: "TASK-SELECTED", agent: "memory", event: "agent_started" }), true);
  assert.equal(runEventMatches(run, { task_id: "TASK-OTHER", agent: "knowledge", event: "agent_completed" }), false);
  assert.equal(runEventMatches(run, { trace_id: "TRACE-OTHER", task_id: "TASK-SELECTED", agent: "knowledge", event: "agent_completed" }), false);
});

test("nested Knowledge calls keep a selected Memory root and child steps despite changing Task", () => {
  const run = { run_type: "rag", trace_ids: ["TRACE-NESTED"], task_ids: ["TASK-MEMORY"] };
  const records = [
    { type: "agent", event: "agent_started", agent: "memory", agent_run_id: "MEMORY-1", task_id: "TASK-MEMORY" },
    { type: "a2a", event: "a2a_started", name: "memory->knowledge", task_id: "TASK-MEMORY" },
    { type: "agent", event: "agent_started", agent: "knowledge", agent_run_id: "KNOWLEDGE-1", task_id: "TASK-KNOWLEDGE" },
    { type: "agent_step", event: "step_completed", name: "validate", agent: "knowledge", agent_run_id: "KNOWLEDGE-1", task_id: "TASK-KNOWLEDGE" },
    { type: "agent", event: "agent_completed", agent: "knowledge", agent_run_id: "KNOWLEDGE-1", task_id: "TASK-KNOWLEDGE" },
    { type: "a2a", event: "a2a_completed", name: "memory->knowledge", task_id: "TASK-MEMORY" },
  ].map((record) => ({ ...record, trace_id: "TRACE-NESTED" }));

  const selected = records.filter((record) => runEventMatches(run, record));
  const invocations = buildAgentInvocations(selected);

  assert.deepEqual(selected, records);
  assert.deepEqual(invocations.map((item) => [item.agent, item.status]), [["memory", "执行中"], ["knowledge", "已完成"]]);
  assert.equal(invocations[1].skill_steps.length, 1);
});

test("quality detail retains supporting Agents in its Trace and excludes a reused Task in another Trace", () => {
  const run = { run_type: "quality", trace_ids: ["TRACE-QUALITY"], task_ids: ["TASK-SHARED"] };
  assert.equal(runEventMatches(run, { trace_id: "TRACE-QUALITY", task_id: "TASK-CHILD", agent: "memory", event: "agent_completed" }), true);
  assert.equal(runEventMatches(run, { trace_id: "TRACE-OTHER", task_id: "TASK-SHARED", agent: "quality", event: "agent_completed" }), false);
});

test("fault detail rejects a reused Task in another Trace while retaining explicit incident membership", () => {
  const run = { run_type: "fault", trace_ids: ["TRACE-FAULT"], task_ids: ["TASK-SHARED"], event_ids: ["EVT-1"] };
  assert.equal(runEventMatches(run, { trace_id: "TRACE-FAULT", task_id: "TASK-CHILD", agent: "memory", event: "agent_completed" }), true);
  assert.equal(runEventMatches(run, { trace_id: "TRACE-OTHER", task_id: "TASK-SHARED", agent: "diagnosis", event: "agent_completed" }), false);
  assert.equal(runEventMatches(run, { trace_id: "TRACE-RETRY", event_id: "EVT-1", agent: "diagnosis", event: "agent_completed" }), true);
  assert.equal(runEventMatches(run, { trace_id: "TRACE-FAULT", agent: "quality", event: "agent_completed" }), false);
});
