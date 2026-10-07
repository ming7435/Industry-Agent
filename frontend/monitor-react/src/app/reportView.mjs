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

function mapping(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const statusLabels = {
  open: "待处理", pending: "待处理", in_progress: "处理中", awaiting_verification: "待验证",
  completed: "已完成", closed: "已关闭", rejected: "已拒绝", timeout: "已超时",
  verified: "已验证", failed: "验证失败", cancelled: "已取消",
};

function firstText(values, format = textOf) {
  for (const value of values) {
    const text = format(value);
    if (text) return text;
  }
  return "";
}

function verificationText(value) {
  const verification = mapping(value);
  const parts = [textOf(value)];
  if (typeof verification.passed === "boolean") parts.push(verification.passed ? "复核通过" : "复核未通过");
  if (typeof verification.status === "string" && verification.status.trim()) {
    const status = verification.status.trim();
    parts.push(statusLabels[status] || `状态：${status}`);
  }
  if (verification.phase === "prestart") parts.push("开机前验证");
  if (verification.phase === "poststart") parts.push("开机后验证");
  return parts.filter(Boolean).join("；");
}

export function reportCompleteness(report = {}) {
  const source = mapping(report);
  const values = Array.isArray(source.validation_findings) ? source.validation_findings : [source.validation_findings];
  const findings = values.map(textOf).filter(Boolean);
  const status = typeof source.status === "string" ? source.status.trim().toLowerCase() : "";
  if (status === "incomplete" || findings.length) return { label: "资料不完整", tone: "warning", findings };
  if (status === "completed") return { label: "内容完整", tone: "normal", findings };
  if (status === "error") return { label: "生成失败", tone: "error", findings };
  const label = status === "in_progress" ? "生成中" : statusLabels[status] || (status ? `状态：${status}` : "待确认");
  return { label, tone: "normal", findings };
}

export function reportQualityLabel(quality = {}) {
  const reinspection = quality.reinspection || {};
  if (['released', 'closed'].includes(quality.status) && reinspection.passed === true && reinspection.reinspection_check_id) {
    return `${quality.passed === true ? '初检通过' : '初检未通过'}；复检通过，${quality.status === 'closed' ? '已关闭' : '已放行'}`;
  }
  if (['review', 'pending', 'not_tested', 'insufficient_data'].includes(quality.result || quality.status)) return '未检测或数据不足';
  if (typeof quality.passed === 'boolean') return quality.passed ? '已通过' : '未通过';
  return '待确认';
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

  const rawWorkorder = source.workorder || source.work_order || {};
  const workorder = { ...mapping(rawWorkorder), ...mapping(mapping(rawWorkorder).workorder) };
  const workorderParts = [textOf(workorder) || textOf(rawWorkorder)];
  if (typeof workorder.workorder_id === "string" && workorder.workorder_id.trim()) workorderParts.push(`工单编号：${workorder.workorder_id.trim()}`);
  if (typeof workorder.status === "string" && workorder.status.trim()) {
    const status = workorder.status.trim();
    workorderParts.push(`状态：${statusLabels[status] || status}`);
  }
  const assignee = textOf(workorder.assignee_name) || textOf(workorder.assignee);
  if (assignee) workorderParts.push(`负责人：${assignee}`);
  const workorderBody = workorderParts.filter(Boolean).join("\n");
  if (workorderBody) result.push({ title: "工单安排", body: workorderBody });
  const workorderSteps = listOf(workorder, ["steps", "repair_steps"]);
  if (workorderSteps.length) result.push({ title: "工单步骤", items: workorderSteps });

  const feedbackBody = firstText([source.repair_feedback, workorder.repair_feedback, mapping(rawWorkorder).repair_feedback, source.repair_result]);
  if (feedbackBody) result.push({ title: "维修反馈", body: feedbackBody });
  const verificationBody = firstText([source.repair_verification, workorder.repair_verification, mapping(rawWorkorder).repair_verification], verificationText);
  if (verificationBody) result.push({ title: "维修复核", body: verificationBody });

  const quality = source.quality || source.quality_result || {};
  const qualityParts = [];
  if (typeof quality.passed === "boolean" || quality.result || quality.status) qualityParts.push(reportQualityLabel(quality));
  qualityParts.push(...listOf(quality, ["findings", "defects"]));
  if (qualityParts.length) result.push({ title: "质量结果", body: qualityParts.join("；") });
  return result;
}
