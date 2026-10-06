const ACTIVE_ALARM_STATUSES = new Set(["alarm", "fault", "warning"]);

function firstAlarmCode(value = {}) {
  const direct = String(value?.alarm_code || value?.error_code || "").trim();
  if (direct) return direct;
  const values = Array.isArray(value?.alarm_codes) ? value.alarm_codes : [];
  return String(values.find((item) => String(item || "").trim()) || "").trim();
}

/** 只提供检索范围，不允许客户端指定内部 Agent 能力。 */
export function buildKnowledgeContext(sample = {}, snapshot = {}) {
  const deviceId = String(sample?.device_id || snapshot?.device_id || "").trim();
  const device = (snapshot?.devices || []).find((item) => String(item?.device_id || "").trim() === deviceId) || {};
  const candidates = [
    sample,
    snapshot?.latest_result?.current_sample,
    device,
    device?.current_sample,
    device?.latest_result?.current_sample,
  ];
  const active = candidates.find((item) => {
    const status = String(item?.status || "").trim().toLowerCase();
    return ACTIVE_ALARM_STATUSES.has(status) && firstAlarmCode(item);
  });
  const alarmCode = firstAlarmCode(active);
  const activeDeviceId = String(active?.device_id || deviceId).trim();
  if (!activeDeviceId || !alarmCode) {
    return { alarm_active: false };
  }
  return {
    alarm_active: true,
    device_id: activeDeviceId,
    alarm_code: alarmCode,
    alarm_label: String(active?.alarm_label || active?.alarm_description || "").trim(),
    alarm_status: String(active?.status || "").trim().toLowerCase(),
  };
}
