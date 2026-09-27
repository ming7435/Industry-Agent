import { cleanDisplayText, cleanEvidenceText, parseEmbeddedJson } from "./textFormatting.mjs";

export function buildDiagnosisView(snapshot) {
  const diagnosis = snapshot?.diagnosis || {};
  const latest = diagnosis.latest || {};
  const evidence = Array.isArray(latest.evidence) ? latest.evidence.map(cleanEvidenceText).filter(Boolean) : [];
  const embedded = [latest.summary, latest.diagnosis, latest.fault]
    .map(parseEmbeddedJson)
    .find(Boolean) || {};
  const summary = cleanDisplayText(embedded.summary || latest.summary || latest.fault || latest.diagnosis);
  const cause = cleanDisplayText(embedded.diagnosis || latest.cause || latest.diagnosis);
  const recommendation = cleanDisplayText(latest.recommendation || embedded.recommendation);
  const nextAction = cleanDisplayText(latest.next_action || embedded.next_action);
  return {
    deviceId: String(snapshot?.device_id || latest.device_id || ""),
    status: String(latest.status || diagnosis.status || "waiting"),
    summary: summary || "等待诊断结果",
    cause,
    confidence: latest.confidence == null ? null : Number(latest.confidence),
    evidence,
    recommendation,
    nextAction,
  };
}
