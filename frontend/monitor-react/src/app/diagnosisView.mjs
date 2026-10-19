import { cleanDisplayText, cleanEvidenceText, parseEmbeddedJson, normalizeResultText } from "./textFormatting.mjs";
import { currentIncident, incidentIdentity, matchesIncident } from './incidentIdentity.mjs';
import { businessText } from './businessText.mjs';

function resolveCurrentSample(snapshot, sample) {
  return sample
    || snapshot?.latest_results?.[snapshot?.device_id]?.current_sample
    || snapshot?.devices?.find((device) => device.device_id === snapshot?.device_id)?.current_sample
    || ((!snapshot?.device_id || snapshot?.latest_result?.current_sample?.device_id === snapshot.device_id) ? snapshot?.latest_result?.current_sample : null)
    || {};
}

function currentDeviceId(snapshot, sample) {
  const current = resolveCurrentSample(snapshot, sample);
  return String(current?.device_id || snapshot?.device_id || "").trim();
}

export function getLatestDiagnosis(snapshot, sample) {
  const deviceId = currentDeviceId(snapshot, sample);
  const byDevice = snapshot?.diagnosis?.latest_by_device;
  return (deviceId && byDevice && typeof byDevice[deviceId] === "object" ? byDevice[deviceId] : null)
    || snapshot?.diagnosis?.latest
    || {};
}

export function getLatestPipeline(snapshot, sample) {
  const deviceId = currentDeviceId(snapshot, sample);
  const byDevice = snapshot?.diagnosis?.pipeline_by_device;
  return (deviceId && byDevice && typeof byDevice[deviceId] === "object" ? byDevice[deviceId] : null)
    || snapshot?.diagnosis?.pipeline
    || {};
}

// This is a read-only history projection, never an authorization to dispatch an old fault.
function faultKey(event) {
  return JSON.stringify([event.tenant_id, event.project_id, event.device_id,
    event.event_id, event.event_revision || '1']);
}

export function buildDiagnosisTaskView(snapshot, sample, selectedKey = '') {
  const diagnosis = snapshot?.diagnosis || {};
  const deviceId = currentDeviceId(snapshot, sample);
  const current = incidentIdentity(getLatestDiagnosis(snapshot, sample));
  const pipelines = new Map();
  for (const pipeline of [...Object.values(diagnosis.pipeline_by_event || {}),
    ...Object.values(diagnosis.pipeline_by_device || {}), diagnosis.pipeline]) {
    if (!pipeline?.event) continue;
    const identity = incidentIdentity({event:pipeline.event});
    if (identity.device_id && identity.event_id && !pipelines.has(faultKey(identity))) {
      pipelines.set(faultKey(identity), pipeline);
    }
  }
  const tasks = new Map();
  for (const row of [...Object.values(diagnosis.by_event || {}), ...(diagnosis.history || []),
    getLatestDiagnosis(snapshot, sample)]) {
    const event = incidentIdentity(row);
    if (!deviceId || event.device_id !== deviceId || !event.event_id) continue;
    if (current.tenant_id && event.tenant_id !== current.tenant_id) continue;
    if (current.project_id && event.project_id !== current.project_id) continue;
    event.event_revision ||= '1';
    const key = faultKey(event);
    if (tasks.has(key)) continue;
    const pipeline = pipelines.get(key) || {};
    const plan = pipeline.maintenance_plan || {};
    const order = pipeline.workorder?.workorder || pipeline.workorder || {};
    const planEvent = incidentIdentity(plan);
    const planMatches = planEvent.device_id === event.device_id
      && ['event_id','event_revision','tenant_id','project_id'].every(field => !planEvent[field] || planEvent[field] === event[field]);
    const planId = planMatches ? String(plan.plan_id || '') : '';
    const workorderId = planId && order.plan_id === planId
      && (!order.device_id || order.device_id === event.device_id) ? String(order.workorder_id || '') : '';
    tasks.set(key, {key, event, diagnosis:row, pipeline, planId, workorderId,
      label:`报警 ${event.alarm_code || '未编号'} · ${event.event_id.slice(-12)}（修订 ${event.event_revision}）`});
  }
  const selectedTask = tasks.get(selectedKey) || null;
  // Isolate the explicitly selected event from live triggers. The normal live view keeps
  // its original stale-result guards; visiting history neither changes it nor runs an Agent.
  const view = selectedTask ? buildDiagnosisView({device_id:deviceId, diagnosis:{
    latest:selectedTask.diagnosis, pipeline:selectedTask.pipeline,
  }}, selectedTask.event) : buildDiagnosisView(snapshot, sample);
  return {tasks:[...tasks.values()], selectedTask, view};
}

export function diagnosisMatchesCurrent(snapshot, sample, latest = snapshot?.diagnosis?.latest || {}) {
  const current = resolveCurrentSample(snapshot, sample);
  const currentAlarm = String(current?.alarm_code || "").trim();
  const latestAlarm = String(latest?.alarm_code || "").trim();
  const currentDevice = String(current?.device_id || snapshot?.device_id || "").trim();
  const latestDevice = String(latest?.device_id || "").trim();
  if (currentDevice && latestDevice && currentDevice !== latestDevice) return false;
  // 没有实时报警时，表示没有需要区分的新事件；在监控报告新报警前保留最后一次完成的结果。
  if (!currentAlarm) return true;
  if (!latestAlarm || currentAlarm !== latestAlarm) return false;
  const incident = currentIncident(snapshot, current);
  return incident.event_id ? matchesIncident(latest,incident) : !currentDevice || !latestDevice || currentDevice === latestDevice;
}

export function buildDiagnosisView(snapshot, sample) {
  const diagnosis = snapshot?.diagnosis || {};
  const candidate = getLatestDiagnosis(snapshot, sample);
  const current = resolveCurrentSample(snapshot, sample);
  const currentAlarm = String(current?.alarm_code || "").trim();
  const isCurrent = diagnosisMatchesCurrent(snapshot, sample, candidate);
  const latest = isCurrent ? candidate : {};
  const evidence = Array.isArray(latest.evidence) ? latest.evidence.map(cleanEvidenceText).map(businessText).filter(Boolean) : [];
  const embedded = [latest.summary, latest.diagnosis, latest.fault]
    .map(parseEmbeddedJson)
    .find(Boolean) || {};
  const summary = normalizeResultText(embedded.summary || latest.summary || latest.fault || latest.diagnosis);
  const cause = normalizeResultText(embedded.diagnosis || latest.cause || latest.diagnosis);
  // 模型有时会在顶层字段保存通用的生命周期值（例如“诊断完成”），而有用的建议位于结构化 JSON 中。
  // 优先使用结构化操作文本。
  const recommendation = normalizeResultText(embedded.recommendation || latest.recommendation);
  const nextAction = normalizeResultText(latest.next_action || embedded.next_action);
  const pipeline = isCurrent ? getLatestPipeline(snapshot, sample) : {};
  const status = isCurrent ? String(latest.status || diagnosis.status || "waiting") : "waiting";
  const evidenceInsufficient = latest.evidence_status === "insufficient";
  const reviewRequired = latest.requires_human_review === true || status === "fallback";
  const labels = { completed: "诊断已返回", waiting: "等待诊断", queued: "排队等待诊断", running: "正在诊断", recovering: "正在回查结果",
    blocked: "诊断待核实", failed: "诊断调用失败", unknown: "结果待确认", idle: "等待异常事件", fallback: "诊断待核实" };
  const resultReturned = ["completed", "fallback"].includes(status);
  const treatment = {...(latest.raw || {}), ...latest};
  const noRepairRequired = resultReturned && !reviewRequired && !evidenceInsufficient
    && (treatment.maintenance_required === false
      || ['no_action', 'monitor_only', 'operator_check'].includes(treatment.disposition));
  const statusLabel = resultReturned && evidenceInsufficient ? "诊断待核实"
    : resultReturned && reviewRequired ? "诊断待核实"
    : Object.hasOwn(labels, status) ? labels[status] : "诊断状态待确认";
  // 诊断结果与整个流程各自保留状态；重试耗尽不能证明诊断本身缺少证据。
  const workflowStatus = [pipeline.status, pipeline.runtime_result?.status].includes("blocked") ? "blocked"
    : String(pipeline.status || pipeline.runtime_result?.status || latest.workflow_status || "");
  const stopReason = String(pipeline.stop_reason || pipeline.runtime_result?.stop_reason || "");
  const workflowReason = noRepairRequired
    ? `诊断判定无需维修，${treatment.disposition === 'operator_check' ? '按诊断建议进行现场核查' : treatment.disposition === 'no_action' ? '暂无需进一步处理' : '继续监测'}，不生成维修方案和工单。`
    : workflowStatus === "blocked"
    ? "未完成自动派工，请联系维修人员确认方案和设备负责人。"
    : ["running", "recovering"].includes(workflowStatus) ? "后续流程仍在处理；维修方案与工单状态以实际执行结果为准。"
    : workflowStatus === "unknown" ? "后续处理结果尚未确认，请稍后查看工单状态。"
    : workflowStatus === "failed" ? "后续处理执行失败，请联系维修人员处理。"
    : workflowStatus && !["completed", "waiting", "idle"].includes(workflowStatus) ? "后续处理状态待确认，请稍后查看工单状态。" : "";
  const diagnosisHint = resultReturned && evidenceInsufficient ? "当前故障信息尚不完整，请由维修人员现场核实。"
    : resultReturned && reviewRequired ? "诊断结果需要人工核实，尚不能作为已确认的故障结论。"
    : status === "recovering" ? "正在获取诊断结果，请稍候。"
    : status === "unknown" ? "诊断结果尚未确认，请稍后查看。"
    : !Object.hasOwn(labels, status) ? "诊断状态尚未确认，请联系维修人员处理。" : "";
  const statusHint = [diagnosisHint, workflowReason].filter(Boolean).join(" ");
  return {
    deviceId: String(current?.device_id || snapshot?.device_id || latest.device_id || ""),
    status,
    statusLabel,
    statusHint,
    workflowStatus,
    workflowReason,
    noRepairRequired,
    stopReason,
    error: cleanDisplayText(latest.error),
    summary: isCurrent ? (summary || "等待诊断结果") : (currentAlarm ? `正在等待报警 ${currentAlarm} 的诊断结果` : "等待诊断结果"),
    cause,
    confidence: latest.confidence == null ? null : Number(latest.confidence),
    evidence,
    recommendation,
    nextAction,
    isCurrent,
    currentAlarm,
  };
}
