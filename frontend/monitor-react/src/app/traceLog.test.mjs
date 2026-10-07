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
