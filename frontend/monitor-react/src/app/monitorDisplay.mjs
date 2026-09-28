const STOP_STATES = new Set(["emergency_stop", "e_stop", "stopped"]);

export function isEvidenceUnavailable(sample = {}) {
  const status = String(sample?.status || sample?.control_state || "").toLowerCase();
  return (
    STOP_STATES.has(status)
    && sample?.fault_evidence?.evidence_status === "unavailable"
  );
}

export function formatMonitorHealth(sample = {}) {
  if (isEvidenceUnavailable(sample)) return "待复核";
  if (sample?.health_score === null || sample?.health_score === undefined) return "--";
  const numericValue = Number(sample.health_score);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(0)}/100` : String(sample.health_score);
}

export function monitorEvidenceReason(sample = {}) {
  if (!isEvidenceUnavailable(sample)) return "";
  const reason = String(sample.control_reason || sample.fault_evidence?.control_reason || "安全联锁已触发").trim();
  return `${reason}；停机前未采集到具体报警码或异常指标，健康度不可用`;
}
