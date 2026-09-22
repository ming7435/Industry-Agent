const DEFAULT_CHECKS = [
  "确认设备处于安全停机状态",
  "复核报警码、实时状态和异常趋势",
];

const DEFAULT_STEPS = [
  "执行断电挂牌并确认设备完全停止",
  "根据报警现象检查相关部件",
  "修复后复测异常指标并确认设备恢复",
];

const DEFAULT_SAFETY = [
  "确认设备停机并执行断电挂牌",
  "佩戴护目镜和防护手套",
  "确认主轴完全停止后再接触设备",
];

const DEFAULT_RECOVERY = [
  "确认原报警已清除",
  "确认设备恢复运行/待机且无新增报警",
  "记录维修过程和复测数据",
];

function asText(value) {
  return String(value ?? "").trim();
}

function readableText(value) {
  return asText(value)
    .replace(/\bbarfeed_ready_signal\b/gi, "送料机就绪信号")
    .replace(/\bbarfeed\b/gi, "送料机")
    .replace(/\bCNC\b/gi, "数控系统")
    .replace(/\bI\s*\/\s*O\b/gi, "输入输出")
    .replace(/\bLOTO\s*断电挂牌\b/gi, "断电挂牌")
    .replace(/\s*\bLOTO\b\s*/gi, "")
    .replace(/\bCAD\s*\/\s*BOM\b/gi, "设备图纸和备件清单")
    .replace(/\bPLC\b/gi, "控制器")
    .replace(/\bRMS\b/gi, "有效值")
    .replace(/\s*running\s*\/\s*idle\s*/gi, "运行/待机")
    .replace(/\brunning\b/gi, "运行")
    .replace(/\bidle\b/gi, "待机")
    .replace(/\bunknown\b/gi, "未知")
    .replace(/^(综合判断|初步判断|判断结论)\s*[:：]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function conciseJudgment(value) {
  const text = readableText(value);
  if (!text) return "";
  return text.split(/(?<=[。！？])\s*/u).slice(0, 2).join("").trim();
}

function listOf(value) {
  const values = Array.isArray(value) ? value : asText(value).split(/[；;\n。]+/u);
  return values
    .map(readableText)
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

function firstText(...values) {
  for (const value of values) {
    const text = readableText(value);
    if (text) return text;
  }
  return "";
}

function diagnosisCause(latest, plan) {
  const planDiagnosis = plan?.diagnosis && typeof plan.diagnosis === "object" ? plan.diagnosis : {};
  return conciseJudgment(firstText(
    latest?.cause,
    latest?.diagnosis,
    planDiagnosis.cause,
    planDiagnosis.summary,
  ));
}

export function buildTechnicianSummary({ latest = {}, plan = {}, sample = {} } = {}) {
  const alarmCode = firstText(latest.alarm_code, latest.alarm_definition?.alarm_code, sample.alarm_code);
  const alarmLabel = firstText(
    latest.alarm_label,
    latest.alarm_definition?.name,
    sample.alarm_label,
    alarmCode,
  );
  const symptom = alarmLabel
    ? `${alarmLabel}${alarmCode && alarmCode !== alarmLabel ? `（报警 ${alarmCode}）` : ""}`
    : firstText(latest.summary, sample.status_label, sample.status) || "暂未发现明确故障现象";

  const rawJudgment = diagnosisCause(latest, plan);
  const confidence = Number(latest.confidence);
  const uncertain = !rawJudgment
    || /待确认|无法确认|未知原因|unknown/i.test(rawJudgment)
    || (Number.isFinite(confidence) && confidence < 0.7);
  const uncertainty = uncertain ? "暂不能确认唯一原因，需要现场检查" : "";
  const judgment = uncertain ? uncertainty : rawJudgment;

  const recommendation = listOf(latest.recommendation);
  const checks = listOf(plan.pre_checks).length
    ? listOf(plan.pre_checks)
    : recommendation.length
      ? recommendation
      : DEFAULT_CHECKS;
  const steps = listOf(plan.repair_steps).length ? listOf(plan.repair_steps) : DEFAULT_STEPS;
  const safety = listOf(plan.safety || plan.safety_requirements).length
    ? listOf(plan.safety || plan.safety_requirements)
    : DEFAULT_SAFETY;
  const recovery = listOf(plan.post_checks).length ? listOf(plan.post_checks) : DEFAULT_RECOVERY;
  const planTarget = plan.target_part && typeof plan.target_part === "object"
    ? firstText(plan.target_part.name, plan.target_part.part_name, plan.target_part.part_no)
    : "";

  return {
    symptom,
    judgment,
    uncertainty,
    target: firstText(plan.repair_target, planTarget, latest.fault, latest.alarm_label) || "待现场确认",
    checks,
    steps,
    safety,
    recovery,
    tools: listOf(plan.tools || plan.required_tools),
    parts: listOf(plan.parts || plan.required_parts),
    estimatedTime: firstText(plan.estimated_time, plan.estimated_duration),
  };
}
