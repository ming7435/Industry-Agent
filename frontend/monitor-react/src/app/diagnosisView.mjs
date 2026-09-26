import { cleanDisplayText, cleanEvidenceText } from "./textFormatting.mjs";

export function buildDiagnosisView(snapshot) {
  const diagnosis = snapshot?.diagnosis || {};
  const latest = diagnosis.latest || {};
  const evidence = Array.isArray(latest.evidence) ? latest.evidence.map(cleanEvidenceText).filter(Boolean) : [];
  return {
    deviceId: String(snapshot?.device_id || latest.device_id || ""),
    status: String(latest.status || diagnosis.status || "waiting"),
    summary: cleanDisplayText(latest.summary || latest.diagnosis || latest.fault) || "等待诊断结果",
    confidence: latest.confidence == null ? null : Number(latest.confidence),
    evidence,
    recommendation: cleanDisplayText(latest.recommendation),
  };
}
