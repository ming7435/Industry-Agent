const TOOL_EVENTS = new Set(["tool_called", "tool_completed", "tool_started", "tool_guard", "tool_error"]);

export function normalizeTraceResponse(body) {
  const records = Array.isArray(body)
    ? body
    : body?.trace || body?.items || body?.events || body?.records || [];
  return Array.isArray(records) ? records.filter((item) => item && typeof item === "object") : [];
}

export function normalizeRunResponse(body) {
  const runs = Array.isArray(body)
    ? body
    : body?.runs || body?.items || [];
  return Array.isArray(runs) ? runs.filter((item) => item && typeof item === "object") : [];
}

function qualityEvent(record) {
  const runType = record?.run_type || record?.context?.run_type;
  if (runType) return runType === 'quality';
  if ((record?.tool_name || record?.tool || record?.name) === 'get_quality_record') return false;
  const text = [
    record?.type, record?.event, record?.name, record?.node, record?.agent,
    record?.tool, record?.tool_name, record?.step,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  return /quality|inspect_quality|quality_check|part_quality|质检/.test(text);
}

function ragEvent(record) {
  const text = [
    record?.type, record?.event, record?.name, record?.node, record?.agent,
    record?.tool, record?.tool_name, record?.step,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  return /rag|knowledge|search_knowledge|knowledge_search|vector_search|document_search|retrieval|检索|知识问答/.test(text);
}

export function runEventMatches(run, record) {
  if (!run || !record) return false;
  const traceIds = Array.isArray(run.trace_ids) ? run.trace_ids : [run.trace_id];
  const taskIds = Array.isArray(run.task_ids) ? run.task_ids : [run.task_id];
  const eventIds = Array.isArray(run.event_ids) ? run.event_ids : [run.event_id];
  const sameIdentity = traceIds.filter(Boolean).includes(record.trace_id)
    || taskIds.filter(Boolean).includes(record.task_id);
  const sameEvent = eventIds.filter(Boolean).includes(record.event_id);
  if (!sameIdentity && !sameEvent && (traceIds.some(Boolean) || taskIds.some(Boolean) || eventIds.some(Boolean))) return false;
  if (run.run_type === "quality") return sameIdentity || qualityEvent(record);
  if (run.run_type === "rag") return ragEvent(record);
  if (run.run_type === "fault") return !qualityEvent(record);
  return true;
}

export function formatTraceValue(value) {
  if (value === undefined || value === null || value === "") return "暂无记录";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function eventLabel(record) {
  const event = String(record?.event || "");
  const type = String(record?.type || "");
  if (event === "tool_guard") return record.allowed === false ? "工具调用被拦截" : "工具权限校验";
  if (event === "tool_error" || record?.error) return "执行异常";
  if (TOOL_EVENTS.has(event) || type === "tool") return event === "tool_started" ? "工具开始" : "工具调用";
  if (event.includes("started") || event.endsWith("_start")) return "开始执行";
  if (event.includes("completed") || event.endsWith("_end") || event === "step_completed") return "执行完成";
  if (event.includes("error") || event.includes("failed") || event.includes("timeout")) return "执行异常";
  if (type === "agent") return "Agent执行";
  if (type === "runtime") return "运行时状态";
  if (type === "audit") return "审计记录";
  return "运行记录";
}

function eventStatus(record) {
  const event = String(record?.event || "").toLowerCase();
  if (record?.error || event.includes("error") || event.includes("failed") || event.includes("timeout") || record?.allowed === false) return "异常";
  if (event.includes("started") || event.endsWith("_start")) return "执行中";
  if (event.includes("completed") || event.endsWith("_end") || event === "tool_called" || event === "step_completed") return "已完成";
  return "已记录";
}

function durationText(record) {
  const seconds = Number(record?.execution_time);
  const milliseconds = Number(record?.elapsed_ms ?? record?.latency_ms);
  if (Number.isFinite(milliseconds) && milliseconds > 0) return `${Math.round(milliseconds)} ms`;
  if (Number.isFinite(seconds) && seconds > 0) return `${Math.round(seconds * 1000)} ms`;
  if (record?.latency !== undefined && record?.latency !== null && record.latency !== "") return `${record.latency} ms`;
  return "--";
}

export function traceEventSummary(record) {
  return {
    label: eventLabel(record),
    operation: String(record?.tool_name || record?.tool || record?.name || record?.event || "运行步骤"),
    status: eventStatus(record),
    server: String(record?.mcp_server || record?.server || ""),
    duration: durationText(record),
  };
}

function firstPresent(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record[key] !== "") return record[key];
  }
  return null;
}

export function traceDetailSections(record) {
  const summary = traceEventSummary(record);
  const operation = {
    类型: record?.type || "未知",
    事件: record?.event || "未知",
    操作: summary.operation,
    Agent: record?.agent || "",
    节点: record?.node || record?.step || "",
    状态: summary.status,
    时间: record?.timestamp || "",
    耗时: summary.duration,
    错误: record?.error || "",
  };
  const toolInput = firstPresent(record, ["arguments", "input", "tool_input", "tool_arguments", "request"]);
  const context = firstPresent(record, ["context", "runtime_context", "execution_context", "state", "trace_context"]);
  const returnBody = firstPresent(record, ["output", "result", "return_body", "response", "body", "data", "state_change"]);
  return [
    { key: "operation", title: "执行操作", value: formatTraceValue(operation) },
    { key: "tool", title: "工具调用与输入", value: formatTraceValue(toolInput) },
    { key: "context", title: "输入上下文", value: formatTraceValue(context) },
    { key: "return", title: "返回体", value: formatTraceValue(returnBody) },
    { key: "raw", title: "完整事件", value: formatTraceValue(record) },
  ];
}

export function traceIdentity(record, index = 0) {
  return String(record?.trace_id || record?.task_id || record?.agent_run_id || `event-${index}`);
}

const AGENT_LIFECYCLE_EVENTS = new Set([
  "agent_started",
  "agent_completed",
  "agent_error",
  "agent_timeout",
  "agent_failed",
]);

function isAgentLifecycle(record) {
  const event = String(record?.event || "").toLowerCase();
  return record?.type === "agent" || AGENT_LIFECYCLE_EVENTS.has(event);
}

function isToolRecord(record) {
  const event = String(record?.event || "").toLowerCase();
  if (record?.type === "runtime" || event === "observation_added" || event === "evidence_added") return false;
  return record?.type === "tool" || TOOL_EVENTS.has(event) || Boolean(record?.tool_name || record?.tool);
}

function recordContext(record) {
  const context = firstPresent(record, ["context", "runtime_context", "execution_context", "trace_context"]);
  return context && typeof context === "object" && !Array.isArray(context) ? context : {};
}

function recordAgentRunId(record) {
  return String(record?.agent_run_id || recordContext(record)?.agent_run_id || "");
}

function recordAgentName(record) {
  return String(record?.agent || record?.name || recordContext(record)?.agent || "");
}

function recordTime(record) {
  const value = Date.parse(String(record?.timestamp || ""));
  return Number.isFinite(value) ? value : null;
}

function mergeContexts(records) {
  return records.reduce((merged, record) => ({ ...merged, ...recordContext(record) }), {});
}

function eventIsError(record) {
  const event = String(record?.event || "").toLowerCase();
  return Boolean(record?.error) || event.includes("error") || event.includes("failed") || event.includes("timeout") || record?.allowed === false;
}

function eventIsComplete(record) {
  const event = String(record?.event || "").toLowerCase();
  return event === "agent_completed" || event === "tool_called" || event === "tool_completed" || event === "step_completed" || event.endsWith("_completed") || event.endsWith("_end");
}

function invocationStatus(group) {
  const lifecycle = group.filter(isAgentLifecycle);
  if (lifecycle.some(eventIsError)) return "异常";
  if (lifecycle.some((record) => String(record?.event || "").toLowerCase() === "agent_completed")) return "已完成";
  if (lifecycle.some((record) => String(record?.event || "").toLowerCase() === "agent_started")) return "执行中";
  return "已记录";
}

function nearestGroup(record, groups) {
  const runId = recordAgentRunId(record);
  if (runId) return groups.find((group) => group.agent_run_id === runId) || null;
  const traceId = String(record?.trace_id || recordContext(record)?.trace_id || "");
  const taskId = String(record?.task_id || recordContext(record)?.task_id || "");
  const agent = recordAgentName(record);
  const candidates = groups.filter((group) => {
    const sameTrace = traceId && group.trace_id && traceId === group.trace_id;
    const sameTask = taskId && group.task_id && taskId === group.task_id;
    const sameAgent = agent && group.agent && agent === group.agent;
    return sameAgent && (sameTrace || sameTask);
  });
  if (candidates.length <= 1) return candidates[0] || null;
  const timestamp = recordTime(record);
  return candidates
    .map((group) => ({ group, distance: timestamp === null || group.started_ms === null ? Number.MAX_SAFE_INTEGER : Math.abs(timestamp - group.started_ms) }))
    .sort((left, right) => left.distance - right.distance)[0]?.group || candidates[0];
}

function buildToolCalls(records) {
  const toolGroups = new Map();
  records.filter(isToolRecord).forEach((record, index) => {
    const input = firstPresent(record, ["arguments", "input", "tool_input", "tool_arguments", "request"]);
    let inputKey;
    try { inputKey = JSON.stringify(input ?? ""); } catch { inputKey = String(input ?? ""); }
    const key = String(record?.tool_call_id || record?.call_id || `${record?.tool_name || record?.tool || record?.name || "tool"}|${inputKey}`);
    const group = toolGroups.get(key) || { records: [], first_index: index };
    group.records.push(record);
    toolGroups.set(key, group);
  });
  return [...toolGroups.values()].map((toolGroup, index) => {
    const toolRecords = toolGroup.records;
    const first = toolRecords[0] || {};
    const last = toolRecords[toolRecords.length - 1] || first;
    const completed = [...toolRecords].reverse().find((record) => firstPresent(record, ["output", "result", "return_body", "response", "body", "data"]) !== null);
    return {
      call_no: index + 1,
      tool_name: String(first.tool_name || first.tool || first.name || "工具调用"),
      mcp_server: String(first.mcp_server || first.server || ""),
      status: toolRecords.some(eventIsError) ? "异常" : toolRecords.some(eventIsComplete) ? "已完成" : "执行中",
      started_at: first.timestamp || "",
      ended_at: last.timestamp || "",
      duration: durationText(last),
      input: firstPresent(toolRecords.find((record) => firstPresent(record, ["arguments", "input", "tool_input", "tool_arguments", "request"])), ["arguments", "input", "tool_input", "tool_arguments", "request"]),
      output: firstPresent(completed, ["output", "result", "return_body", "response", "body", "data"]),
      context: mergeContexts(toolRecords),
      error: toolRecords.find((record) => record?.error)?.error || "",
      event_count: toolRecords.length,
      records: toolRecords,
    };
  });
}

/**
 * 将原始 Trace 事件转换成明确的 Agent 调用记录。
 * 该逻辑与渲染刻意分离，这样即使后端返回的事件顺序略有不同，界面仍能展示输入和输出。
 */
export function buildAgentInvocations(records = []) {
  const source = Array.isArray(records) ? records.filter((record) => record && typeof record === "object") : [];
  const groups = new Map();
  source.forEach((record, index) => {
    if (!isAgentLifecycle(record)) return;
    const agent = recordAgentName(record) || "未知 Agent";
    const runId = recordAgentRunId(record);
    const fallbackKey = `${record?.trace_id || recordContext(record)?.trace_id || "trace"}|${record?.task_id || recordContext(record)?.task_id || "task"}|${agent}|${record?.attempt || recordContext(record)?.attempt || 1}`;
    const key = runId || fallbackKey;
    const group = groups.get(key) || {
      key,
      agent_run_id: runId || fallbackKey,
      agent,
      trace_id: String(record?.trace_id || recordContext(record)?.trace_id || ""),
      task_id: String(record?.task_id || recordContext(record)?.task_id || ""),
      started_ms: null,
      records: [],
      first_index: index,
    };
    group.records.push(record);
    const timestamp = recordTime(record);
    if (group.started_ms === null && timestamp !== null) group.started_ms = timestamp;
    groups.set(key, group);
  });

  const invocationGroups = [...groups.values()];
  source.forEach((record) => {
    if (isAgentLifecycle(record) || (!isToolRecord(record) && record.type !== 'agent_step')) return;
    const group = nearestGroup(record, invocationGroups);
    if (group) group.records.push(record);
  });

  const agentCounters = new Map();
  return invocationGroups
    .sort((left, right) => left.first_index - right.first_index)
    .map((group) => {
      const groupedRecords = group.records;
      const started = groupedRecords.find((record) => String(record?.event || "").toLowerCase() === "agent_started") || groupedRecords[0];
      const finished = [...groupedRecords].reverse().find((record) => ["agent_completed", "agent_error", "agent_timeout", "agent_failed"].includes(String(record?.event || "").toLowerCase())) || groupedRecords[groupedRecords.length - 1];
      const agent = group.agent || recordAgentName(started) || "未知 Agent";
      const invocationNo = (agentCounters.get(agent) || 0) + 1;
      agentCounters.set(agent, invocationNo);
      const inputRecord = groupedRecords.find((record) => isAgentLifecycle(record) && firstPresent(record, ["input", "request", "payload", "state"]))
        || groupedRecords.find((record) => firstPresent(record, ["input", "request", "arguments", "payload", "state"]));
      const outputRecord = [...groupedRecords].reverse().find((record) => isAgentLifecycle(record) && firstPresent(record, ["output", "result", "return_body", "response", "body", "data", "state_change"]))
        || [...groupedRecords].reverse().find((record) => firstPresent(record, ["output", "result", "return_body", "response", "body", "data", "state_change"]));
      const startedAt = started?.timestamp || groupedRecords[0]?.timestamp || "";
      const endedAt = finished?.timestamp || "";
      return {
        id: group.agent_run_id,
        invocation_no: invocationNo,
        agent,
        agent_run_id: group.agent_run_id,
        trace_id: group.trace_id || String(started?.trace_id || ""),
        task_id: group.task_id || String(started?.task_id || ""),
        step: String(started?.step || started?.node || recordContext(started)?.step || ""),
        status: invocationStatus(groupedRecords),
        started_at: startedAt,
        ended_at: endedAt,
        duration: durationText(finished),
        input: firstPresent(inputRecord, ["input", "request", "arguments", "payload", "state"]),
        context: mergeContexts(groupedRecords),
        output: firstPresent(outputRecord, ["output", "result", "return_body", "response", "body", "data", "state_change"]),
        error: groupedRecords.find((record) => record?.error)?.error || "",
        tool_calls: buildToolCalls(groupedRecords),
        skill_steps: groupedRecords.filter(record => record.type === 'agent_step' && record.event !== 'step_started').map(record => ({
          name: record.name, skill: record.skill || record.state_change?.skill || '',
          step: record.step || record.state_change?.step || record.name, status: eventStatus(record),
          input: groupedRecords.find(item => item.type === 'agent_step' && item.name === record.name && item.event === 'step_started' &&
            (!(record.step_run_id || record.context?.step_run_id) || (item.step_run_id || item.context?.step_run_id) === (record.step_run_id || record.context?.step_run_id)))?.input,
          output: record.output, context: recordContext(record), error: record.error || '',
        })),
        event_count: groupedRecords.length,
        records: groupedRecords,
      };
    });
}
