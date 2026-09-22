function text(value) {
  return String(value ?? "").trim();
}

function readable(value) {
  return text(value)
    .replace(/\bLOTO\s*断电挂牌\b/gi, "断电挂牌")
    .replace(/\s*\bLOTO\b\s*/gi, "")
    .replace(/\brunning\b/gi, "运行")
    .replace(/\bidle\b/gi, "待机")
    .trim();
}

function list(value) {
  const values = Array.isArray(value) ? value : text(value).split(/[；;\n。]+/u);
  return values.map(readable).filter(Boolean).filter((item, index, items) => items.indexOf(item) === index);
}

export function buildWorkorderSheet({ order = {}, target = {}, plan = {}, diagnosis = {} } = {}) {
  const diagnosisContext = order.diagnosis_context && typeof order.diagnosis_context === "object"
    ? order.diagnosis_context
    : {};
  const steps = list(order.steps).length
    ? list(order.steps)
    : list(plan.repair_steps).length
      ? list(plan.repair_steps)
      : ["确认设备停机并执行断电挂牌", "检查故障部件和相关连接", "修复后复测并确认报警清除"];
  return {
    title: text(order.title) || "设备维修工单",
    workorderId: text(order.workorder_id),
    deviceId: text(order.device_id),
    assignee: text(order.assignee) || "维修一组",
    status: text(order.status) || "open",
    partName: text(target.part_name) || "待确认故障部件",
    partNo: text(target.part_no) || "待补充",
    system: text(target.system) || "待确认",
    location: text(target.location) || "待现场确认",
    faultSymptom: text(target.symptom) || text(target.description) || text(diagnosis.fault) || text(diagnosisContext.diagnosis) || text(order.title) || "设备异常",
    steps,
    tools: list(plan.tools || plan.required_tools),
    parts: list(plan.parts || plan.required_parts),
    safety: list(plan.safety || plan.safety_requirements),
    autoDispatched: ["", "agent", "auto", "monitor"].includes(text(order.source).toLowerCase())
      || Boolean(diagnosisContext.summary || order.drawing_context?.model_url),
  };
}
