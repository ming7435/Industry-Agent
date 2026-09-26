function textOf(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  for (const key of ["summary", "conclusion", "diagnosis", "fault", "feedback", "result", "content"]) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
  }
  return "";
}

function listOf(value, keys = []) {
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean);
  if (!value || typeof value !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key].map(textOf).filter(Boolean);
  }
  return [];
}

export function buildReportDisplaySections(sections) {
  const source = sections && typeof sections === "object" ? sections : {};
  const result = [];
  const diagnosis = source.diagnosis || source.diagnosis_result || {};
  const diagnosisBody = textOf(diagnosis);
  if (diagnosisBody) result.push({ title: "诊断结论", body: diagnosisBody });

  const plan = source.maintenance_plan || source.maintenance || {};
  const steps = listOf(plan, ["repair_steps", "steps", "checks"]);
  if (steps.length) result.push({ title: "维修步骤", items: steps });
  const planBody = textOf(plan);
  if (!steps.length && planBody) result.push({ title: "维修方案", body: planBody });

  const workorder = source.workorder || source.work_order || {};
  const workorderBody = textOf(workorder);
  if (workorderBody) result.push({ title: "工单安排", body: workorderBody });

  const feedback = source.repair_feedback || source.repair_verification || source.repair_result || {};
  const feedbackBody = textOf(feedback);
  if (feedbackBody) result.push({ title: "维修反馈", body: feedbackBody });

  const quality = source.quality || source.quality_result || {};
  const qualityParts = [];
  if (typeof quality.passed === "boolean") qualityParts.push(quality.passed ? "已通过" : "未通过");
  qualityParts.push(...listOf(quality, ["findings", "defects"]));
  if (qualityParts.length) result.push({ title: "质量结果", body: qualityParts.join("；") });
  return result;
}
