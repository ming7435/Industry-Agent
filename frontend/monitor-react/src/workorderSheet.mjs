import { cleanDisplayText, parseEmbeddedJson } from "./app/textFormatting.mjs";

function text(value) {
  return String(value ?? "").trim();
}

function readable(value) {
  const raw = value && typeof value === "object"
    ? value.content ?? value.body ?? value.text ?? value.title ?? value.name ?? value.description ?? ""
    : value;
  const normalized = cleanDisplayText(text(raw)
    .replace(/\bLOTO\s*断电挂牌\b/gi, "断电挂牌")
    .replace(/\s*\bLOTO\b\s*/gi, "")
    .replace(/\brunning\b/gi, "运行")
    .replace(/\bidle\b/gi, "待机"));
  if (!normalized) return "";
  if (/^\[(?:table|cad_drawing)\b/i.test(normalized)) return "";
  if (/^(?:文档|页码|内容类型|本地OCR识别结果|表格行\d+)\s*[:：]/i.test(normalized)) return "";
  if (/表格行\d+\s*[:：]/i.test(normalized)) return "";
  return normalized;
}

function list(value) {
  const values = Array.isArray(value) ? value : text(value).split(/[；;\n。]+/u);
  return values.map(readable).filter(Boolean).filter((item, index, items) => items.indexOf(item) === index);
}

function evidenceList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object") return item;
      const content = readable(item);
      return content ? { type: "note", content } : null;
    })
    .filter(Boolean);
}

function normalizeDiagnosis(value) {
  const source = value && typeof value === "object" ? value : { fault: value };
  const embedded = [source.summary, source.fault, source.diagnosis]
    .map(parseEmbeddedJson)
    .find(Boolean) || {};
  const summary = cleanDisplayText(embedded.summary || source.summary || source.fault || source.diagnosis);
  const cause = cleanDisplayText(embedded.diagnosis || source.cause || source.diagnosis);
  return {
    ...source,
    fault: summary,
    summary,
    cause,
    diagnosis: cause,
    recommendation: cleanDisplayText(embedded.recommendation || source.recommendation),
    nextAction: cleanDisplayText(source.next_action || embedded.next_action),
    severity: cleanDisplayText(source.severity || embedded.severity),
  };
}

export function buildMaintenancePlanView({ order = {}, plan = {}, diagnosis = {} } = {}) {
  const explicitPlan = plan && typeof plan === "object" && (
    plan.plan_id || plan.repair_steps?.length || plan.tools?.length || plan.required_tools?.length
  ) ? plan : null;
  const snapshot = order.maintenance_plan_snapshot && typeof order.maintenance_plan_snapshot === "object"
    ? order.maintenance_plan_snapshot
    : order.maintenance_plan && typeof order.maintenance_plan === "object"
      ? order.maintenance_plan
      : {};
  const sourcePlan = explicitPlan || snapshot;
  const source = explicitPlan ? "maintenance-plan" : Object.keys(snapshot).length ? "legacy-workorder-snapshot" : "unavailable";
  const sourceDiagnosis = sourcePlan.diagnosis && typeof sourcePlan.diagnosis === "object"
    ? sourcePlan.diagnosis
    : order.diagnosis_snapshot && typeof order.diagnosis_snapshot === "object"
      ? order.diagnosis_snapshot
      : diagnosis;
  return {
    planId: text(sourcePlan.plan_id),
    diagnosis: normalizeDiagnosis(sourceDiagnosis),
    steps: list(sourcePlan.repair_steps || sourcePlan.steps),
    tools: list(sourcePlan.tools || sourcePlan.required_tools),
    parts: list(sourcePlan.parts || sourcePlan.required_parts),
    safety: list(sourcePlan.safety || sourcePlan.safety_requirements),
    preChecks: list(sourcePlan.pre_checks),
    postChecks: list(sourcePlan.post_checks),
    evidence: evidenceList(sourcePlan.evidence || sourcePlan.memory_evidence),
    riskLevel: text(sourcePlan.risk_level || sourcePlan.riskLevel),
    estimatedTime: text(sourcePlan.estimated_time || sourcePlan.estimatedTime || sourcePlan.estimated_duration),
    source,
  };
}

export function getWorkorderDisplayTitle(order = {}, target = {}) {
  const candidateTitle = cleanDisplayText(order.title);
  const targetName = text(target.part_name) && !["待确认故障部件", "待补充"].includes(text(target.part_name))
    ? text(target.part_name)
    : "设备";
  return candidateTitle
    && candidateTitle.length <= 80
    && !/[\n#{}]/.test(candidateTitle)
    && !/^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(candidateTitle)
    ? candidateTitle
    : `${targetName}维修`;
}

export function buildRepairCompletionPayload({ feedback = "", operator = "", deviceId = "" } = {}) {
  const normalizedFeedback = text(feedback);
  const normalizedOperator = text(operator);
  return {
    action: "mark_repair_completed",
    repair_feedback: {
      feedback: normalizedFeedback,
      operator: normalizedOperator,
    },
    repair_verification: {
      passed: true,
      status: "verified",
      device_id: text(deviceId),
      operator: normalizedOperator,
      verified_at: new Date().toISOString(),
    },
  };
}

export function buildWorkorderSheet({ order = {}, target = {}, plan = {}, diagnosis = {} } = {}) {
  const diagnosisContext = order.diagnosis_context && typeof order.diagnosis_context === "object"
    ? order.diagnosis_context
    : {};
  const title = getWorkorderDisplayTitle(order, target);
  return {
    title: title || "设备维修工单",
    workorderId: text(order.workorder_id),
    deviceId: text(order.device_id),
    assignee: text(order.assignee) || "维修一组",
    status: text(order.status) || "open",
    machineControl: order.machine_control && typeof order.machine_control === "object" ? order.machine_control : null,
    partName: text(target.part_name) || "待确认故障部件",
    partNo: text(target.part_no) || "待补充",
    system: text(target.system) || "待确认",
    location: text(target.location) || "待现场确认",
    faultSymptom: text(target.symptom) || text(target.description) || text(diagnosis.fault) || text(diagnosisContext.diagnosis) || text(order.title) || "设备异常",
    autoDispatched: ["", "agent", "auto", "monitor"].includes(text(order.source).toLowerCase())
      || Boolean(diagnosisContext.summary || order.drawing_context?.model_url),
  };
}
