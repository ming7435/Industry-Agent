export const CORE_AGENTS = [
  { id: "router", label: "路由协调", shortLabel: "Router" },
  { id: "diagnosis", label: "智能诊断", shortLabel: "Diagnosis" },
  { id: "knowledge", label: "知识检索", shortLabel: "Knowledge" },
  { id: "cad", label: "CAD定位", shortLabel: "CAD" },
  { id: "maintenance", label: "维修决策", shortLabel: "Maintenance" },
  { id: "workorder", label: "自动派单", shortLabel: "WorkOrder" },
  { id: "quality", label: "质量协同", shortLabel: "Quality" },
  { id: "report", label: "报告生成", shortLabel: "Report" },
  { id: "memory", label: "经验沉淀", shortLabel: "Memory" },
];

function canonicalAgent(event) {
  const raw = String(event?.agent || event?.name || event?.node || "").toLowerCase();
  if (raw.includes("router") || raw === "route") return "router";
  if (raw.includes("diagnosis")) return "diagnosis";
  if (raw.includes("knowledge")) return "knowledge";
  if (raw.includes("cad")) return "cad";
  if (raw.includes("maintenance")) return "maintenance";
  if (raw.includes("workorder")) return "workorder";
  if (raw.includes("quality")) return "quality";
  if (raw.includes("report")) return "report";
  if (raw.includes("memory")) return "memory";
  return "";
}

function eventStatus(event) {
  const kind = String(event?.event || "").toLowerCase();
  if (kind.includes("error") || kind.includes("timeout") || kind.includes("fallback")) return "error";
  if (kind.includes("completed") || kind.includes("success")) return "completed";
  if (kind.includes("started") || kind.includes("running")) return "running";
  return "";
}

export function buildAgentFlow(snapshot) {
  const diagnosisState = snapshot?.diagnosis || {};
  const pipeline = diagnosisState.pipeline || {};
  const taskId = String(pipeline.task_id || "");
  const trace = Array.isArray(pipeline.trace)
    ? (taskId
      ? pipeline.trace.filter((event) => event?.task_id === taskId)
      : pipeline.trace)
    : [];
  const statuses = {};

  for (const event of trace) {
    const id = canonicalAgent(event);
    const status = eventStatus(event);
    if (id && status) statuses[id] = status;
  }

  // 只认当前 task_id 的 Trace。pipeline 中的业务字段可能来自旧任务，不能用来伪造 Agent 已完成。
  if (!statuses.diagnosis && diagnosisState.latest?.status === "completed" && trace.length === 0) {
    statuses.diagnosis = "completed";
  }
  if (diagnosisState.latest?.status === "running" && trace.length === 0) {
    statuses.diagnosis = "running";
  }

  return CORE_AGENTS.map((agent) => ({
    ...agent,
    status: statuses[agent.id] || "waiting",
  }));
}
