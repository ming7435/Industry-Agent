import { incidentIdentity, recordTimes, localizeIncidentText, linkedPlanOrder } from './incidentIdentity.mjs';
import { deletedMaintenancePlanIds, rememberDeletedMaintenancePlans } from './maintenanceChanges.mjs';

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = value => String(value ?? "").trim();

export async function loadMaintenancePlans(request, options = {}) {
  const plans = await request("/api/maintenance/plans", options);
  rememberDeletedMaintenancePlans(plans?.deleted_plan_ids || []);
  return {
    items: Array.isArray(plans?.items) ? plans.items : [],
    history: object(plans?.history),
    deletedPlanIds: Array.isArray(plans?.deleted_plan_ids) ? plans.deleted_plan_ids : [],
  };
}

export async function loadMaintenanceOrders(request, actor = null, options = {}) {
  if (!actor?.user_id) return [];
  const orders = await request("/api/workorders?include_deleted=true", options);
  rememberDeletedMaintenancePlans(orders?.deleted_plan_ids || []);
  return Array.isArray(orders?.items) ? orders.items : [];
}

export async function loadMaintenanceWorkspace(request, actor = null) {
  const [plans, orders] = await Promise.allSettled([
    loadMaintenancePlans(request),
    loadMaintenanceOrders(request, actor),
  ]);
  return {
    items: plans.status === "fulfilled" ? plans.value.items : [],
    orders: orders.status === "fulfilled" ? orders.value : [],
    planError: plans.status === "rejected" ? plans.reason.message : "",
    orderError: orders.status === "rejected" ? orders.reason.message : "",
    history: plans.status === "fulfilled" ? plans.value.history : {},
    deletedPlanIds: plans.status === "fulfilled" ? plans.value.deletedPlanIds : [],
  };
}

export function buildMaintenanceWorkspaceRecords({ snapshot = {}, items = [], orders = [], deletedPlanIds = [] } = {}) {
  const records = new Map();
  const deleted = new Set([...deletedMaintenancePlanIds(), ...deletedPlanIds]);
  const orderItems = orders.map(order => object(order.workorder || order));
  for (const order of orderItems) {
    if (order.deleted_at) {
      const relatedIds = [order.plan_id, order.maintenance_plan_snapshot?.plan_id,
        ...(order.plan_revisions || []).flatMap(revision => [revision.previous_plan_id, revision.plan_id])];
      for (const id of relatedIds) if (id) deleted.add(id);
    }
  }
  function add(plan, context = {}) {
    if (!Object.keys(object(plan)).length) return;
    const diagnosis = Object.keys(object(context.diagnosis)).length ? context.diagnosis : object(plan.diagnosis);
    const event = object(context.event);
    const deviceId = text(context.device_id || event.device_id || diagnosis.device_id || plan.device_id);
    const planId = text(plan.plan_id);
    if (deleted.has(planId)) return;
    const identity = incidentIdentity({...plan, ...context, diagnosis, device_id:deviceId});
    // Sparse legacy copies may enrich a known plan, but must never merge distinct incidents.
    const compatible = [...records.values()].filter(record => record.device_id === deviceId && record.plan_id === planId
      && (!identity.event_id || !record.event_id || record.event_id === identity.event_id)
      && (!identity.event_revision || !record.event_revision || String(record.event_revision) === identity.event_revision)
      && (!identity.tenant_id || !record.tenant_id || record.tenant_id === identity.tenant_id)
      && (!identity.project_id || !record.project_id || record.project_id === identity.project_id));
    const recordId = compatible.length === 1 ? compatible[0].recordId
      : JSON.stringify([deviceId, planId || text(context.trace_id) || 'unindexed', identity.event_id, identity.event_revision,identity.tenant_id,identity.project_id]);
    const previous = object(records.get(recordId));
    const times = recordTimes({...plan, diagnosis, event, event_timestamp:context.event_timestamp,
      diagnosis_created_at:context.diagnosis_created_at, plan_created_at:context.plan_created_at});
    const record = {
      ...previous, ...plan, diagnosis:Object.keys(object(diagnosis)).length ? diagnosis : previous.diagnosis,
      device_id: deviceId,
      alarm_code: identity.alarm_code || previous.alarm_code || '',
      event_id: identity.event_id || previous.event_id || '',
      event_revision: identity.event_revision || previous.event_revision || '',
      tenant_id: identity.tenant_id || previous.tenant_id || '', project_id:identity.project_id || previous.project_id || '',
      device_name:text(event.device_name || plan.device_name || context.device_name || previous.device_name),
      device_model:text(event.device_model || plan.device_model || context.device_model || previous.device_model),
      created_at: times.plan || previous.created_at || '',
      plan_created_at:times.plan || previous.plan_created_at || '',
      diagnosis_created_at:times.diagnosis || previous.diagnosis_created_at || '',
      event_timestamp:times.event || previous.event_timestamp || '',
      stop_reason: text(context.stop_reason || plan.stop_reason || previous.stop_reason),
      trace_id: text(context.trace_id || plan.trace_id || previous.trace_id),
      recordId,
    };
    if (record.diagnosis) record.diagnosis = {...record.diagnosis,
      ...Object.fromEntries(['fault','summary','cause','diagnosis'].filter(key => typeof record.diagnosis[key] === 'string').map(key => [key,localizeIncidentText(record.diagnosis[key],record)]))};
    records.set(recordId,record);
  }
  const diagnosis = object(object(snapshot).diagnosis);
  for (const pipeline of [...Object.values(object(diagnosis.pipeline_by_device)), diagnosis.pipeline]) {
    if (pipeline) add(pipeline.maintenance_plan, pipeline);
  }
  for (const plan of items) add(plan, plan);
  // The assigned order owns its current plan snapshot and execution status.
  // A historical pipeline cannot overwrite a replacement or restore a deletion.
  for (const source of orderItems) {
    if (source.deleted_at) continue;
    for (const revision of source.plan_revisions || []) {
      const previousId = revision.previous_plan_id;
      for (const [id, record] of records) {
        if (previousId && linkedPlanOrder(record, {...source, plan_id:previousId})) records.delete(id);
      }
    }
    add(source.maintenance_plan_snapshot || source.maintenance_plan, { ...source, diagnosis: object(source.diagnosis_snapshot || source.diagnosis_context) });
    for (const record of records.values()) {
      if (!linkedPlanOrder(record, source)) continue;
      record.dispatch = {...record.dispatch, status:source.assignee ? 'dispatched' : record.dispatch?.status,
        workorder_id:source.workorder_id, workorder_status:source.status, assignee:source.assignee || '',
        assignee_name:source.assignee_name || '', device_id:source.device_id};
      if (source.execution_review) record.execution_review = source.execution_review;
    }
  }
  const timestamp = record => Date.parse(record.created_at || record.diagnosis_created_at || record.event_timestamp) || 0;
  return [...records.values()].sort((left, right) => timestamp(right) - timestamp(left));
}

export function deleteMaintenancePlans(request, planIds) {
  return request("/api/maintenance/plans/delete", { method: "POST", body: JSON.stringify({ plan_ids: [...new Set(planIds)] }) });
}

export function retryMaintenancePlan(request, planId, requestId) {
  return request(`/api/maintenance/plans/${encodeURIComponent(planId)}/retry`, {method:'POST',body:JSON.stringify({request_id:requestId})});
}

export function executionReviewView(record = {}) {
  const review = object(object(record).execution_review);
  const required = review.required === true;
  return {
    required,
    humanConfirmed: review.human_confirmed === true,
    label: required ? "方案需重新校验" : "",
    findings: required && Array.isArray(review.findings) ? review.findings.filter(item => typeof item === "string").map(text).filter(Boolean) : [],
  };
}

export function maintenanceDispatchView(record = {}, { hasOrder = false } = {}) {
  const findings = Array.isArray(record.validation_findings) ? record.validation_findings.map(text).filter(Boolean) : [];
  const dispatch = object(record.dispatch);
  const review = executionReviewView(record);
  const allowed = dispatch.allowed;
  const businessBlocked = record.workorder_ready === false || findings.length > 0;
  const blocked = allowed === false || businessBlocked;
  const waitingApproval = dispatch.status === "waiting_approval" && record.workorder_ready === true && findings.length === 0;
  const waitingPersonnel = dispatch.status === "waiting_for_personnel" && record.workorder_ready === true && findings.length === 0;
  const processing = record.status === 'running' || dispatch.status === 'running';
  const dispatched = dispatch.status === "dispatched" && Boolean(text(dispatch.assignee))
    && ((allowed === true && !businessBlocked) || (review.required && Boolean(text(dispatch.workorder_id))));
  const reason = text(dispatch.reason) || (record.workorder_ready === false ? "维修方案尚未达到工单就绪条件" : "");
  return {
    label: hasOrder ? "已关联工单" : processing ? '方案已生成，后续处理中' : waitingApproval ? "等待审批后派发"
      : waitingPersonnel ? "等待负责人员登录" : dispatched ? "已自动派单" : blocked ? "暂不能自动派发"
      : allowed === true ? "方案就绪，等待系统派发"
      : record.workorder_ready === true ? "方案已就绪，派发条件以系统校验为准" : "派发条件待校验",
    reason: [...new Set([reason, ...findings, ...review.findings].filter(Boolean))].join("；"),
    findings,
    reviewRequired: review.required,
    reviewLabel: review.label,
    reviewFindings: review.findings,
    stopReason: text(record.stop_reason),
    ready: record.workorder_ready === true ? "是" : record.workorder_ready === false ? "否" : "待校验",
    assigneeName: dispatched ? text(dispatch.assignee_name || dispatch.assignee) : "",
    assignmentDeviceId: dispatched ? text(dispatch.device_id || record.device_id) : "",
  };
}

export function maintenanceWorkType(record = {}) {
  const source = object(record);
  const snapshot = object(source.maintenance_plan_snapshot || source.maintenance_plan);
  const planKind = text(source.plan_kind || snapshot.plan_kind);
  const inspection = planKind === "inspection" || (!planKind && (source.inspection_required === true || snapshot.inspection_required === true));
  return {
    kind: inspection ? "inspection" : "repair",
    inspection,
    label: inspection ? "现场检查" : "设备维修",
    description: inspection ? "仅核查与记录；具体维修另建方案。" : "",
    reason: inspection ? text(source.inspection_reason || snapshot.inspection_reason) : "",
  };
}

export function inspectionWorkorderView(record = {}) {
  const inspection = maintenanceWorkType(record).inspection;
  const verification = object(record.repair_verification);
  const completed = inspection && record.status === "closed";
  return {
    completed,
    statusLabel: completed ? "检查已完成" : "",
    findings: inspection && verification.source === "inspection" && Array.isArray(verification.validation_findings)
      ? verification.validation_findings.map(text).filter(Boolean) : [],
  };
}

export function maintenanceHistoryNotice(history = {}) {
  if (history.status === "failed") return text(history.error) || "历史方案读取失败，原始记录仍保留";
  if (history.status !== "loading") return "";
  return `正在后台读取历史方案（${history.loaded_records || 0} / ${history.total_records || 0} 条事件）；最新已读方案先显示，完整执行日志不重复加载。`;
}

export function maintenanceReferenceDrawings(record = {}) {
  const source = object(record);
  const context = object(source.engineering_context);
  const entries = [
    ...(Array.isArray(source.available_drawings) ? source.available_drawings : []),
    ...(Array.isArray(context.available_drawings) ? context.available_drawings : []),
    ...(Array.isArray(context.reference_drawings) ? context.reference_drawings : []),
  ];
  const localUrls = new Set(["/drawings/TC820si.html", "/drawings/Equator300.html", "/drawings/QLS80S2.html"]);
  const deviceId = text(source.device_id);
  const seen = new Set();
  return entries.flatMap(entry => {
    const drawing = object(entry);
    const url = text(drawing.drawing_url || drawing.model_url);
    const drawingDevice = text(drawing.device_id);
    if (!localUrls.has(url) || (deviceId && drawingDevice && deviceId !== drawingDevice) || seen.has(url)) return [];
    seen.add(url);
    const sourceKind = text(drawing.source_kind);
    const label = sourceKind === "original_edrawings" ? "设备图纸"
      : sourceKind === "reference_model" ? "设备图纸与参考模型" : "设备参考资料";
    return [{
      id: text(drawing.drawing_id) || url,
      name: text(drawing.drawing_name) || label,
      url, label, sourceKind, deviceId: drawingDevice || deviceId,
      evidenceScope: text(drawing.evidence_scope) || "device_reference",
      engineeringStatus: text(drawing.engineering_status) || "reference_only",
    }];
  });
}
