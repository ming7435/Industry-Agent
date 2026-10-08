const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';

function diagnosisOf(record) {
  const source = object(record);
  let diagnosis = object(source.diagnosis_snapshot || source.diagnosis_context || source.diagnosis || source.maintenance_plan_snapshot?.diagnosis || source.maintenance_plan?.diagnosis || source);
  let merged = {...diagnosis};
  for (let depth = 0; depth < 6 && Object.keys(object(diagnosis.raw)).length; depth++) {
    diagnosis = object(diagnosis.raw);
    if (merged.device_id && diagnosis.device_id && merged.device_id !== diagnosis.device_id) break;
    merged = {...diagnosis, ...merged};
  }
  return merged;
}

export function incidentIdentity(record = {}) {
  const source = object(record), event = object(source.event);
  const nested = diagnosisOf(source);
  const diagnosis = source.device_id && nested.device_id && source.device_id !== nested.device_id ? {} : nested;
  const field = key => text(source[key] || event[key] || diagnosis[key]);
  return Object.fromEntries(['device_id','alarm_code','event_id','event_revision','tenant_id','project_id'].map(key => [key,field(key)]));
}

export function currentIncident(snapshot = {}, sample, records = []) {
  snapshot = object(snapshot);
  const deviceId = text(sample?.device_id || snapshot.device_id);
  const current = sample || snapshot.latest_results?.[deviceId]?.current_sample
    || snapshot.devices?.find(device => device.device_id === deviceId)?.current_sample
    || (snapshot.latest_result?.current_sample?.device_id === deviceId ? snapshot.latest_result.current_sample : {}) || {};
  const alarm = text(current.alarm_code);
  const diagnosis = snapshot.diagnosis?.latest_by_device?.[deviceId] || snapshot.diagnosis?.latest || {};
  const candidates = [current, ...(snapshot.trigger_history || []).map(trigger => trigger.abnormal_event || trigger), diagnosis,
    snapshot.diagnosis?.pipeline_by_device?.[deviceId]?.event, snapshot.diagnosis?.pipeline?.event];
  const event = candidates.map(incidentIdentity).find(candidate => candidate.event_id && candidate.device_id === deviceId
    && (!alarm || candidate.alarm_code === alarm)) || {};
  const incident = {...event, device_id:deviceId, alarm_code:alarm || text(event.alarm_code), event_id:text(event.event_id)};
  if (!incident.event_id) return incident;
  const revision = value => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : 0;
  let latestRevision = revision(incident.event_revision);
  // 原触发确定故障身份；已保存的同事件新修订可以补充当前版本，不改写原触发。
  for (const record of [...candidates, ...(Array.isArray(records) ? records : [])]) {
    if (record?.deleted_at) continue;
    const candidate = incidentIdentity(record);
    if (!['device_id','alarm_code','event_id','tenant_id','project_id'].every(key => text(candidate[key]) === text(incident[key]))) continue;
    const candidateRevision = revision(candidate.event_revision);
    if (candidateRevision > latestRevision) {
      latestRevision = candidateRevision;
      incident.event_revision = candidate.event_revision;
    }
  }
  return incident;
}

export function matchesIncident(record, incident) {
  const left = incidentIdentity(record), right = incidentIdentity(incident);
  if (!right.device_id || left.device_id !== right.device_id) return false;
  if (right.alarm_code && left.alarm_code !== right.alarm_code) return false;
  if (right.event_id && left.event_id !== right.event_id) return false;
  for (const key of ['event_revision','tenant_id','project_id']) {
    if (right[key] && left[key] && left[key] !== right[key]) return false;
  }
  return true;
}

export function linkedPlanOrder(plan, order) {
  if (!plan?.plan_id || text(order.plan_id || order.maintenance_plan_snapshot?.plan_id) !== text(plan.plan_id)) return false;
  const left = incidentIdentity(plan), right = incidentIdentity(order);
  if (!left.device_id || left.device_id !== right.device_id) return false;
  return ['event_id','event_revision','tenant_id','project_id'].every(key => !left[key] || !right[key] || left[key] === right[key]);
}

// Historical Monitor timestamps came from UTC epoch values with their offset removed.
export function utcTimestamp(value) {
  const stamp = text(value);
  return /^\d{4}-\d\d-\d\d[T ]\d\d:\d\d(?::\d\d(?:\.\d+)?)?$/.test(stamp) ? `${stamp.replace(' ','T')}Z` : stamp;
}

export function recordTimes(record = {}) {
  const isOrder = Boolean(record.workorder_id || record.maintenance_plan_snapshot || record.diagnosis_snapshot);
  const plan = isOrder ? object(record.maintenance_plan_snapshot || record.maintenance_plan) : record;
  const diagnosis = diagnosisOf({diagnosis:object(isOrder ? record.diagnosis_snapshot || record.diagnosis_context || plan.diagnosis : record.diagnosis)});
  return {
    event:utcTimestamp(record.event_timestamp || record.event?.timestamp || diagnosis.event_timestamp || diagnosis.triggered_at),
    diagnosis:utcTimestamp(record.diagnosis_created_at || diagnosis.created_at),
    plan:utcTimestamp(record.plan_created_at || plan.created_at),
    order:isOrder ? utcTimestamp(record.created_at) : '',
    updated:isOrder ? utcTimestamp(record.updated_at) : '',
  };
}

export function formatRecordTime(value) {
  const date = new Date(utcTimestamp(value));
  if (!value || Number.isNaN(date.getTime())) return '未记录';
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export function localizeIncidentText(value, record) {
  const original = String(value || ''), stamp = recordTimes(record).event;
  const date = new Date(stamp);
  if (!stamp || Number.isNaN(date.getTime())) return original;
  const utc = date.toISOString().slice(0,19);
  const local = formatRecordTime(stamp).replaceAll('/','-') + '（北京时间）';
  return original.replaceAll(utc.replace('T',' '),local).replaceAll(utc,local);
}
