const ACTIVE_ALARM_STATUSES = new Set(["alarm", "fault", "warning"]);

/** Build a device scope only when the selected machine has an active alarm. */
export function buildKnowledgeContext(sample = {}, snapshot = {}) {
  const deviceId = String(sample?.device_id || snapshot?.device_id || "").trim();
  const alarmCode = String(sample?.alarm_code || "").trim();
  const status = String(sample?.status || "").trim().toLowerCase();
  if (!deviceId || !alarmCode || !ACTIVE_ALARM_STATUSES.has(status)) {
    return { alarm_active: false };
  }
  return {
    alarm_active: true,
    device_id: deviceId,
    alarm_code: alarmCode,
    alarm_label: String(sample?.alarm_label || sample?.alarm_description || "").trim(),
    alarm_status: status,
  };
}
