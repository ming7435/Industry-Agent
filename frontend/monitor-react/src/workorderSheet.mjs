import { cleanDisplayText, parseEmbeddedJson } from "./app/textFormatting.mjs";

function text(value) {
  return String(value ?? "").trim();
}

const DEVICE_DISPLAY_NAMES = {
  "TRAK-TC820LTYSI-001": "TRAK TC820LTYsi 车削中心",
  "LNS-QL-SERVO-80-S2-001": "LNS QL Servo 80 S2 棒料送料机",
  "ELITE-CS612-ROBOT-001": "ELITE ROBOTS CS612 六轴协作机器人",
  "RENISHAW-EQUATOR300-001": "Renishaw Equator 300 比对仪",
};

function deviceIdOf(order = {}, context = {}) {
  return text(order.device_id || order.machine_id || context.device_id || context.sample?.device_id);
}

export function getDeviceDisplayName(deviceId, context = {}) {
  const id = text(deviceId);
  const devices = Array.isArray(context?.snapshot?.devices)
    ? context.snapshot.devices
    : Array.isArray(context?.devices) ? context.devices : [];
  const live = devices.find((item) => text(item?.device_id || item?.id) === id);
  return text(
    context?.device_name
      || context?.machine_name
      || live?.name
      || live?.display_name
      || DEVICE_DISPLAY_NAMES[id]
      || id
      || "设备",
  );
}

function faultText(order = {}, context = {}) {
  const diagnosis = order.diagnosis_context && typeof order.diagnosis_context === "object"
    ? order.diagnosis_context
    : {};
  const sample = context.sample && typeof context.sample === "object" ? context.sample : {};
  const raw = [
    context.fault,
    context.summary,
    diagnosis.fault,
    diagnosis.summary,
    diagnosis.diagnosis,
    order.alarm_label,
    sample.alarm_label,
    order.alarm_code || sample.alarm_code ? `报警 ${order.alarm_code || sample.alarm_code}` : "",
  ].map(text).find((value) => value && !/[{}]/.test(value));
  if (raw) return raw.replace(/^设备维修[:：]\s*/i, "");
  return "";
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

function isExecutableStep(value) {
  const normalized = text(value);
  const lowered = normalized.toLowerCase();
  const blockedMarkers = [
    "本地ocr识别结果",
    "内容类型:",
    "evidence.",
    "steps.action",
    "steps.safety",
    "positioningerror",
    "encoderlost",
    "报警字典",
  ];
  return normalized.length <= 120 && !blockedMarkers.some((marker) => lowered.includes(marker));
}

function list(value, { executableOnly = false } = {}) {
  const values = Array.isArray(value) ? value : text(value).split(/[；;\n。]+/u);
  return values
    .map(readable)
    .filter(Boolean)
    .filter((item) => !executableOnly || isExecutableStep(item))
    .filter((item, index, items) => items.indexOf(item) === index);
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
    steps: list(sourcePlan.repair_steps || sourcePlan.steps, { executableOnly: true }),
    tools: list(sourcePlan.tools || sourcePlan.required_tools),
    parts: list(sourcePlan.parts || sourcePlan.required_parts),
    safety: list(sourcePlan.safety || sourcePlan.safety_requirements),
    preChecks: list(sourcePlan.pre_checks, { executableOnly: true }),
    postChecks: list(sourcePlan.post_checks, { executableOnly: true }),
    evidence: evidenceList(sourcePlan.evidence || sourcePlan.memory_evidence),
    riskLevel: text(sourcePlan.risk_level || sourcePlan.riskLevel),
    estimatedTime: text(sourcePlan.estimated_time || sourcePlan.estimatedTime || sourcePlan.estimated_duration),
    source,
  };
}

export function getWorkorderDisplayTitle(order = {}, target = {}, context = {}) {
  const candidateTitle = cleanDisplayText(order.title);
  const targetName = text(target.part_name) && !["待确认故障部件", "待补充"].includes(text(target.part_name))
    ? text(target.part_name)
    : "设备";
  const deviceId = deviceIdOf(order, context);
  const deviceName = getDeviceDisplayName(deviceId, context);
  const hasMachineName = Boolean(
    text(context?.device_name || context?.machine_name)
      || (Array.isArray(context?.snapshot?.devices) && context.snapshot.devices.some((item) => text(item?.device_id || item?.id) === deviceId && text(item?.name || item?.display_name)))
      || DEVICE_DISPLAY_NAMES[deviceId],
  );
  const fault = faultText(order, context);
  const genericTitle = !candidateTitle
    || candidateTitle.length > 80
    || /[\n#{}]/.test(candidateTitle)
    || /^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(candidateTitle)
    || candidateTitle === `${targetName}维修`
    || candidateTitle === "设备维修工单"
    || candidateTitle === "主轴电机组件维修";
  if (deviceId && hasMachineName && genericTitle) {
    return `${deviceName} · ${fault || `${targetName}维修`}`;
  }
  return candidateTitle
    && candidateTitle.length <= 80
    && !/[\n#{}]/.test(candidateTitle)
    && !/^(?:分析过程|基于|我已|让我|事件分析|诊断分析|设备维修[:：])/i.test(candidateTitle)
    ? candidateTitle
    : `${targetName}维修`;
}

export function buildRepairCompletionPayload({ feedback = "" } = {}) {
  const normalizedFeedback = text(feedback);
  return {
    action: "mark_repair_completed",
    repair_feedback: {
      feedback: normalizedFeedback,
    },
  };
}

export function buildWorkorderSheet({ order = {}, target = {}, plan = {}, diagnosis = {}, context = {} } = {}) {
  const diagnosisContext = order.diagnosis_context && typeof order.diagnosis_context === "object"
    ? order.diagnosis_context
    : {};
  const title = getWorkorderDisplayTitle(order, target, { ...context, fault: diagnosis.fault || diagnosis.summary });
  return {
    title: title || "设备维修工单",
    workorderId: text(order.workorder_id),
    deviceId: text(order.device_id),
    assignee: text(order.assignee_name || order.assignee) || "待派工",
    status: text(order.status) || "open",
    accepted: Boolean(order.accepted_by),
    verificationPhase: text(order.repair_verification?.phase),
    machineControl: order.machine_control && typeof order.machine_control === "object" ? order.machine_control : null,
    recoverySample: context.recoverySample && typeof context.recoverySample === "object" ? context.recoverySample : {},
    partName: text(target.part_name) || "待确认故障部件",
    partNo: text(target.part_no) || "待补充",
    system: text(target.system) || "待确认",
    location: text(target.location) || "待现场确认",
    faultSymptom: text(target.symptom) || text(target.description) || text(diagnosis.fault) || text(diagnosisContext.diagnosis) || text(order.title) || "设备异常",
    autoDispatched: ["", "agent", "auto", "monitor"].includes(text(order.source).toLowerCase())
      || Boolean(diagnosisContext.summary || order.drawing_context?.model_url),
  };
}
