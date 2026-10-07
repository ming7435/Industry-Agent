import { cleanDisplayText, cleanEvidenceText, parseEmbeddedJson } from "./textFormatting.mjs";

function resolveCurrentSample(snapshot, sample) {
  return sample
    || snapshot?.latest_result?.current_sample
    || snapshot?.devices?.find((device) => device.device_id === snapshot?.device_id)?.current_sample
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
  return !currentDevice || !latestDevice || currentDevice === latestDevice;
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
  let status = isCurrent ? String(latest.status || diagnosis.status || "waiting") : "waiting";
  const blocked = status === "completed" && (pipeline.status === "blocked" || pipeline.runtime_result?.status === "blocked");
  if (blocked) status = "blocked";
  const stopReason = String(pipeline.stop_reason || pipeline.runtime_result?.stop_reason || "");
  const evidenceBlocked = blocked && ["replan_limit_exceeded", "knowledge_evidence_gate"].includes(stopReason);
  const statusHint = evidenceBlocked ? "诊断已返回，但证据不足，未自动派工。请补充报警定义或现场检测数据后核实。"
    : blocked ? "诊断已返回，但后续流程被门禁拦截。请查看日志中的具体阻塞原因。"
    : status === "recovering" ? "正在只读回查已提交的任务；不会重复运行 Agent 或重复派工。"
    : status === "unknown" ? "后台执行结果尚未确认，请先对账；不要重复提交同一故障。"
    : ["completed", "fallback"].includes(status) && ["running", "recovering"].includes(latest.workflow_status)
      ? "诊断已返回，后续流程仍在处理；维修方案与工单状态以实际执行结果为准。"
    : latest.workflow_status === "unknown" ? "诊断已返回，后续流程结果尚未确认，请查看日志并对账。" : "";
  return {
    deviceId: String(current?.device_id || snapshot?.device_id || latest.device_id || ""),
    status,
    statusHint,
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
