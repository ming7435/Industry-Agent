import {reportFieldLabels, reportValueLabels} from './reportFields.mjs';
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

export function buildReportArticle(report = {}) {
  if (typeof report.article_text === 'string' && report.article_text.trim()) return report.article_text.trim();
  const source = mapping(report.sections);
  const records = name => Array.isArray(source[name]?.records) ? source[name].records : [source[name] || {}];
  const orders = records('workorder'), diagnoses = records('diagnosis'), plans = records('maintenance_plan');
  const cycle = mapping(source.lifecycle);
  const clip = (value, limit) => {
    const chars = [...String(value || '').replace(/\s+/g, ' ').trim().replace(/[。；，]+$/, '')];
    return chars.length <= limit ? chars.join('') : chars.slice(0, limit - 1).join('') + '…';
  };
  const concise = buildConciseReportSections(report);
  const diagnosis = diagnoses.map(textOf).filter(Boolean).join('；') || concise.find(s => s.title === '智能诊断')?.body;
  const plan = plans.flatMap(p => listOf(p, ['repair_steps', 'steps', 'checks'])).join('、') || concise.find(s => s.title === '维修方案')?.body;
  const device = orders[0]?.device_id || diagnoses[0]?.device_id || '相关设备';
  const first = `本次报告汇总${clip(device, 40)}的故障处理过程。智能诊断记录显示，${clip(diagnosis || '诊断结论未记录', 65)}。` + (plan && plan !== '维修方案未记录' ? `维修方案建议${clip(plan, 45)}。` : '当前未记录维修方案。');
  const feedback = [...new Set([...orders.map(o => textOf(o.repair_feedback)), ...records('repair_feedback').map(textOf)].filter(Boolean))].join('；');
  const people = [...new Set(orders.map(o => textOf(o.assignee_name)).filter(Boolean))].join('、');
  let second = (people ? `维修任务由${clip(people, 24)}处理，` : '工单处理过程中，') + (feedback ? `处理说明记录为“${clip(feedback, 40)}”。` : '实际处理说明尚未记录。');
  const stamp = new Date(cycle.restarted_at);
  if (cycle.restarted_at && Number.isFinite(stamp.getTime())) second += `整线于${stamp.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}恢复运行。`;
  else second += '当前尚无整线复机记录。';
  if (cycle.restart_method === 'manual_confirmation' || records('repair_verification').some(r => r.phase === 'manual_confirmation') || orders.some(o => o.repair_verification?.phase === 'manual_confirmation')) second += '此次采用人工确认流程，未进行自动恢复核验。';
  const lesson = concise.find(s => s.title === '经验总结')?.body || '经验总结尚未生成';
  const third = `关于本次处理的知识沉淀，${clip(lesson, 45)}。后续应结合现场情况补充实际操作与检测数据，为同类故障处理提供参考。`;
  return [first, second, third].join('\n\n');
}

export function buildConciseReportSections(report = {}) {
  const source = mapping(report.sections);
  const records = name => Array.isArray(source[name]?.records) ? source[name].records : [source[name] || {}];
  const diagnoses = records('diagnosis'), plans = records('maintenance_plan'), orders = records('workorder');
  const cycle = source.lifecycle || {};
  const fallback = [
    {title: '停机到复机', body: [orders[0]?.device_id || diagnoses[0]?.device_id,
      cycle.restarted_at ? `${cycle.restart_method === 'manual_confirmation' ? '人工确认复机' : '复机'}：${new Date(cycle.restarted_at).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}` : '尚无复机记录'].filter(Boolean).join('；')},
    {title: '智能诊断', body: diagnoses.map(textOf).filter(Boolean).join('；') || '诊断结论未记录'},
    {title: '维修方案', body: plans.flatMap(plan => listOf(plan, ['repair_steps', 'steps', 'checks'])).join('；') || '维修方案未记录'},
    {title: '工单执行与检查', body: orders.map(order => textOf(order.repair_feedback)).filter(Boolean).join('；') || '处理说明未记录'},
    {title: '经验总结', body: records('experience').some(item => item.experience_id) ? '经验已保存，可供后续检索参考。' : '经验总结尚未生成。'},
  ];
  const selected = Array.isArray(report.concise_sections) && report.concise_sections.length ? report.concise_sections : fallback;
  const selectedSections = selected.slice(0, 5).map(section => ({...section, title: String(section.title || '').slice(0, 20)}));
  let remaining = 500 - selectedSections.reduce((count, section) => count + [...section.title].length, 0);
  return selectedSections.map(section => {
    const title = section.title;
    const budget = Math.max(0, Math.min(remaining, 135));
    const chars = [...String(section.body || '')];
    const body = !budget ? '' : chars.length <= budget ? chars.join('') : chars.slice(0, budget - 1).join('') + '…';
    remaining -= [...body].length;
    return {title, body};
  });
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
  if (verification.phase === 'inspection' && typeof verification.passed === 'boolean') parts.push(verification.passed ? '检查通过' : '检查未通过');
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

export function buildReportDisplaySections(sections, reportType = '') {
  let source = sections && typeof sections === "object" ? sections : {};
  if (reportType === 'quality_report') source = {quality: source.quality || source.quality_result || {}};
  else if (reportType) {
    const {quality, quality_result, ...faultSections} = source;
    source = faultSections;
  }
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
  if (Array.isArray(cycle.devices)) for (const device of cycle.devices) {
    timeline.push(`设备启动回执：${device.device_id} · ${reportValueLabels[device.state] || device.state || '未记录'} · ${reportValueLabels[device.returned_state] || device.returned_state || '未记录返回状态'}`);
  }
  const skipped = new Set(['_revision','idempotency_key','idempotency_fingerprint','learning_idempotency_key',
    'feedback_digest','plan_snapshot_digest','diagnosis_snapshot_digest']);
  const label = key => reportFieldLabels[key] || key.replaceAll('_', ' ');
  const valueText = (value, key) => typeof value === 'boolean' ? (value ? '是' : '否')
    : key.endsWith('_at') ? time(value) : reportValueLabels[value] || statusLabels[value] || String(value);
  const linesOf = (value, prefix = '') => {
    if (value === null || value === undefined || value === '' || (typeof value === 'object' && !Object.keys(value).length)) return [];
    if (Array.isArray(value)) return value.flatMap((item,index) => linesOf(item, `${prefix || '记录'} ${index + 1}`));
    if (typeof value === 'object') return [prefix, ...Object.entries(value).flatMap(([key,item]) => {
      if (skipped.has(key)) return [];
      if (typeof item === 'object') return linesOf(item, label(key));
      return item === null || item === undefined || item === '' ? [] : [`${label(key)}：${valueText(item,key)}`];
    })].filter(Boolean);
    return [`${prefix ? prefix + '：' : ''}${String(value)}`];
  };
  const details = (name, omit = []) => records(name).map((record,index) => {
    const copy = Object.fromEntries(Object.entries(record).filter(([key]) => !omit.includes(key)));
    if (name === 'diagnosis') for (const key of ['summary','fault','diagnosis']) {
      if (typeof copy[key] === 'string') copy[key] = localizeIncidentText(copy[key],
        {event_timestamp: eventTime(record), diagnosis: {...record, triggered_at: record.triggered_at || record.raw?.triggered_at}});
    }
    const check = name === 'workorder' ? record.inspection_verification || record.repair_verification : null;
    return [ ...linesOf(copy, `记录 ${index + 1}`), ...(check ? [verificationText(check)] : []) ].filter(Boolean).join('\n');
  }).join('\n\n');
  const result = [
    {title: '停机到复机', body: timeline.join('\n')},
    {title: '智能诊断', body: details('diagnosis', ['tool_calls','active_skill','active_skills','cached']) || '未关联智能诊断记录'},
    {title: '维修方案', body: details('maintenance_plan', ['diagnosis','workorder_draft']) || '未关联维修方案记录'},
    {title: '工单执行与检查', body: details('workorder', ['diagnosis_snapshot','maintenance_plan_snapshot','diagnosis_context']) || '未关联工单记录'},
  ];
  for (const [name,title] of [['repair_feedback','实际处理说明'],['repair_verification','维修确认与检查记录'],
      ['experience','经验总结与知识沉淀'],['references','来源与追溯依据']]) {
    const body = details(name);
    if (body) result.push({title,body});
  }
  return result.map(section => ({...section, lines: section.body.split('\n').filter(Boolean)}));
}
