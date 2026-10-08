import { cleanDisplayText, cleanEvidenceText, parseEmbeddedJson } from "./textFormatting.mjs";
import { currentIncident, matchesIncident } from './incidentIdentity.mjs';

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
  const evidence = Array.isArray(latest.evidence) ? latest.evidence.map(cleanEvidenceText).filter(Boolean) : [];
  const embedded = [latest.summary, latest.diagnosis, latest.fault]
    .map(parseEmbeddedJson)
    .find(Boolean) || {};
  const summary = cleanDisplayText(embedded.summary || latest.summary || latest.fault || latest.diagnosis);
  const cause = cleanDisplayText(embedded.diagnosis || latest.cause || latest.diagnosis);
  // 模型有时会在顶层字段保存通用的生命周期值（例如“诊断完成”），而有用的建议位于结构化 JSON 中。
  // 优先使用结构化操作文本。
  const recommendation = cleanDisplayText(embedded.recommendation || latest.recommendation);
  const nextAction = cleanDisplayText(latest.next_action || embedded.next_action);
  const pipeline = isCurrent ? getLatestPipeline(snapshot, sample) : {};
  const status = isCurrent ? String(latest.status || diagnosis.status || "waiting") : "waiting";
  const evidenceInsufficient = latest.evidence_status === "insufficient";
  const reviewRequired = latest.requires_human_review === true || status === "fallback";
  const labels = { completed: "诊断已返回", waiting: "等待诊断", running: "正在诊断", recovering: "正在回查结果",
    blocked: "诊断待核实", failed: "诊断调用失败", unknown: "结果待确认", idle: "等待异常事件", fallback: "诊断待核实" };
  const resultReturned = ["completed", "fallback"].includes(status);
  const statusLabel = resultReturned && evidenceInsufficient ? "诊断证据不足，待核实"
    : resultReturned && reviewRequired ? "诊断待核实"
    : Object.hasOwn(labels, status) ? labels[status] : "诊断状态待确认";
  // 诊断结果与整个流程各自保留状态；重试耗尽不能证明诊断本身缺少证据。
  const workflowStatus = [pipeline.status, pipeline.runtime_result?.status].includes("blocked") ? "blocked"
    : String(pipeline.status || pipeline.runtime_result?.status || latest.workflow_status || "");
  const stopReason = String(pipeline.stop_reason || pipeline.runtime_result?.stop_reason || "");
  const workflowReason = workflowStatus === "blocked"
    ? stopReason === "replan_limit_exceeded" ? "后续流程重试达到上限，未完成自动派工。请查看日志中的具体阻塞原因。"
      : stopReason === "knowledge_evidence_gate" ? "维修依据检索未通过，后续流程已停止。请查看日志中的检索与校验结果。"
      : "后续流程被门禁拦截。请查看日志中的具体阻塞原因。"
    : ["running", "recovering"].includes(workflowStatus) ? "后续流程仍在处理；维修方案与工单状态以实际执行结果为准。"
    : workflowStatus === "unknown" ? "后续流程结果尚未确认，请查看日志并对账。"
    : workflowStatus === "failed" ? "后续流程执行失败，请查看日志中的具体原因。"
    : workflowStatus && !["completed", "waiting", "idle"].includes(workflowStatus) ? "后续流程状态待确认，请查看日志并对账。" : "";
  const diagnosisHint = resultReturned && evidenceInsufficient ? "诊断证据不足，请补充依据后核实。"
    : resultReturned && reviewRequired ? "诊断结果需要人工核实，尚不能作为已确认的故障结论。"
    : status === "recovering" ? "正在只读回查已提交的任务；不会重复运行 Agent 或重复派工。"
    : status === "unknown" ? "后台执行结果尚未确认，请先对账；不要重复提交同一故障。"
    : !Object.hasOwn(labels, status) ? "诊断状态尚未确认，请查看日志中的实际执行结果。" : "";
  const statusHint = [diagnosisHint, workflowReason].filter(Boolean).join(" ");
  return {
    deviceId: String(current?.device_id || snapshot?.device_id || latest.device_id || ""),
    status,
    statusLabel,
    statusHint,
    workflowStatus,
    workflowReason,
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
