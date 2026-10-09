import {localizeIncidentText} from './incidentIdentity.mjs';

function textOf(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  for (const key of ["summary", "conclusion", "diagnosis", "fault", "feedback", "result", "content", "description", "title", "instruction"]) {
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
  if (verification.phase === "manual_confirmation") parts.push("维修人员人工确认后直接启动");
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
  if (Array.isArray(quality.records)) {
    if (!quality.records.length) return '未关联质检';
    const labels = quality.records.map(record => reportQualityLabel(record));
    if (labels.some(label => ['未检测或数据不足', '待确认'].includes(label))) return '有未完成质检';
    if (typeof quality.passed === 'boolean') return quality.passed ? '已通过' : '未通过';
    return labels.join('；');
  }
  const reinspection = quality.reinspection || {};
  if (['released', 'closed'].includes(quality.status) && reinspection.passed === true && reinspection.reinspection_check_id) {
    return `${quality.passed === true ? '初检通过' : '初检未通过'}；复检通过，${quality.status === 'closed' ? '已关闭' : '已放行'}`;
  }
  if (['review', 'pending', 'not_tested', 'insufficient_data'].includes(quality.result || quality.status)) return '未检测或数据不足';
  if (typeof quality.passed === 'boolean') return quality.passed ? '已通过' : '未通过';
  if (quality.result === 'passed') return '已通过';
  if (['failed', 'minor_issue', 'major_issue', 'high_risk'].includes(quality.result)) return '未通过';
  return '待确认';
}

export function buildReportDisplaySections(sections) {
  const source = sections && typeof sections === "object" ? sections : {};
  if (source.lifecycle) return lifecycleSections(source);
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

function lifecycleSections(source) {
  const cycle = source.lifecycle;
  const time = value => {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).format(date) : '未记录';
  };
  const records = name => Array.isArray(source[name]?.records) ? source[name].records : [];
  const eventTime = record => {
    if (record.event_timestamp) return record.event_timestamp;
    // Monitor 以 UTC 样本时间生成事件编号；它比诊断开始时间更早。
    const match = /^EVT-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-\d{3}-\d+$/.exec(record.event_id || '');
    return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z` : '';
  };
  const timeline = [`故障停机开始：${time(cycle.started_at)}`, `停机确认：${time(cycle.stopped_at)}`,
    `${cycle.restart_method === 'manual_confirmation' ? '人工确认复机' : '复机核验通过'}：${time(cycle.restarted_at)}`];
  if (Number.isFinite(cycle.duration_seconds)) timeline.push(`停机处理时长：${cycle.duration_seconds} 秒`);
  timeline.push(`整线设备：${(cycle.device_ids || []).join('、') || '未记录'}`, `故障事件：${(cycle.event_ids || []).join('、') || '未记录'}`);
  const diagnosis = records('diagnosis').map(record => [record.device_id, record.event_id,
    localizeIncidentText(textOf(record), {event_timestamp: eventTime(record), diagnosis: {...record, triggered_at: record.triggered_at || record.raw?.triggered_at}}),
    ...(record.created_at || record.raw?.created_at ? [`诊断完成：${time(record.created_at || record.raw.created_at)}`] : []),
  ].filter(Boolean).join(' · '));
  const plans = records('maintenance_plan').map(record => [record.plan_id,
    ...(record.created_at ? [`方案生成：${time(record.created_at)}`] : []), textOf(record),
    ...listOf(record, ['repair_steps', 'steps', 'checks'])].filter(Boolean).join('\n'));
  const orders = records('workorder').map(order => {
    const check = order.inspection_verification || order.repair_verification || {};
    return [`${order.workorder_id} · ${order.device_id || ''} · ${statusLabels[order.status] || order.status || '未记录状态'}`,
      `负责人：${order.assignee_name || order.assignee || '未记录'}`,
      `处理说明：${textOf(order.repair_feedback) || '未记录'}`,
      ...(typeof check.passed === 'boolean' ? [check.phase === 'inspection'
        ? (check.passed ? '检查通过' : '检查未通过') : verificationText(check)] : []),
      ...(order.created_at ? [`工单创建：${time(order.created_at)}`] : []),
      ...(check.verified_at || check.checked_at ? [`检查时间：${time(check.verified_at || check.checked_at)}`] : []),
    ].filter(Boolean).join('\n');
  });
  const qualities = records('quality').map(record => [record.quality_check_id, record.device_id,
    reportQualityLabel(record), ...listOf(record, ['findings', 'defects']),
    ...(record.created_at ? [`检测时间：${time(record.created_at)}`] : [])].filter(Boolean).join(' · '));
  return [
    {title: '停机到复机', body: timeline.join('\n')},
    {title: '智能诊断', body: diagnosis.join('\n\n') || '未关联智能诊断记录'},
    {title: '维修方案', body: plans.join('\n\n') || '未关联维修方案记录'},
    {title: '工单执行与检查', body: orders.join('\n\n') || '未关联工单记录'},
    {title: '质检结果', body: qualities.join('\n\n') || '未关联质检记录'},
  ].map(section => ({...section, lines: section.body.split('\n').filter(Boolean)}));
}
