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
  // No live alarm means there is no newer incident to disambiguate. Keep the
  // last completed result visible until the monitor reports a new alarm.
  if (!currentAlarm) return true;
  if (!latestAlarm || currentAlarm !== latestAlarm) return false;
  const currentDevice = String(current?.device_id || snapshot?.device_id || "").trim();
  const latestDevice = String(latest?.device_id || "").trim();
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
  // The model sometimes stores a generic lifecycle value (for example
  // “诊断完成”) in the top-level field while the useful recommendation is
  // inside the structured JSON block. Prefer the structured action text.
  const recommendation = cleanDisplayText(embedded.recommendation || latest.recommendation);
  const nextAction = cleanDisplayText(latest.next_action || embedded.next_action);
  return {
    deviceId: String(current?.device_id || snapshot?.device_id || latest.device_id || ""),
    status: isCurrent ? String(latest.status || diagnosis.status || "waiting") : "waiting",
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
