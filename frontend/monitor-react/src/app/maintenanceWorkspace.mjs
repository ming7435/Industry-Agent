const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = value => String(value ?? "").trim();

export async function loadMaintenanceWorkspace(request, actor = null) {
  const [plans, orders] = await Promise.allSettled([
    request("/api/maintenance/plans"),
    actor?.user_id ? request("/api/workorders") : Promise.resolve({ items: [] }),
  ]);
  return {
    items: plans.status === "fulfilled" && Array.isArray(plans.value?.items) ? plans.value.items : [],
    orders: orders.status === "fulfilled" && Array.isArray(orders.value?.items) ? orders.value.items : [],
    planError: plans.status === "rejected" ? plans.reason.message : "",
    orderError: orders.status === "rejected" ? orders.reason.message : "",
    history: plans.status === "fulfilled" ? object(plans.value?.history) : {},
    deletedPlanIds: plans.status === "fulfilled" && Array.isArray(plans.value?.deleted_plan_ids) ? plans.value.deleted_plan_ids : [],
  };
}

export function buildMaintenanceWorkspaceRecords({ snapshot = {}, items = [], orders = [], deletedPlanIds = [] } = {}) {
  const records = new Map();
  const deleted = new Set(deletedPlanIds);
  function add(plan, context = {}) {
    if (!Object.keys(object(plan)).length) return;
    const diagnosis = Object.keys(object(context.diagnosis)).length ? context.diagnosis : object(plan.diagnosis);
    const event = object(context.event);
    const deviceId = text(context.device_id || event.device_id || diagnosis.device_id || plan.device_id);
    const planId = text(plan.plan_id);
    if (deleted.has(planId)) return;
    const recordId = `${deviceId}:${planId || text(context.event_id || event.event_id || context.trace_id) || "unindexed"}`;
    records.set(recordId, {
      ...object(records.get(recordId)), ...plan, diagnosis,
      device_id: deviceId,
      alarm_code: text(context.alarm_code || event.alarm_code || diagnosis.alarm_code || diagnosis.raw?.alarm_code || plan.alarm_code),
      event_id: text(context.event_id || event.event_id || plan.event_id),
      created_at: text(context.created_at || diagnosis.created_at || event.timestamp || plan.created_at),
      stop_reason: text(context.stop_reason || plan.stop_reason),
      trace_id: text(context.trace_id || plan.trace_id),
      recordId,
    });
  }
  // 只接受真实保存的方案；没有方案快照的工单不能凭空生成方案。
  for (const order of orders) {
    const source = object(order.workorder || order);
    add(source.maintenance_plan_snapshot || source.maintenance_plan, { ...source, diagnosis: object(source.diagnosis_snapshot || source.diagnosis_context) });
  }
  const diagnosis = object(snapshot.diagnosis);
  for (const pipeline of [...Object.values(object(diagnosis.pipeline_by_device)), diagnosis.pipeline]) {
    if (pipeline) add(pipeline.maintenance_plan, pipeline);
  }
  for (const plan of items) add(plan, plan);
  return [...records.values()].sort((left, right) => (Date.parse(right.created_at) || 0) - (Date.parse(left.created_at) || 0));
}

export function deleteMaintenancePlans(request, planIds) {
  return request("/api/maintenance/plans/delete", { method: "POST", body: JSON.stringify({ plan_ids: [...new Set(planIds)] }) });
}

export function retryMaintenancePlan(request, planId, requestId) {
  return request(`/api/maintenance/plans/${encodeURIComponent(planId)}/retry`, {method:'POST',body:JSON.stringify({request_id:requestId})});
}

export function maintenanceDispatchView(record = {}, { hasOrder = false } = {}) {
  const findings = Array.isArray(record.validation_findings) ? record.validation_findings.map(text).filter(Boolean) : [];
  const allowed = record.dispatch?.allowed;
  const blocked = allowed === false || record.workorder_ready === false || findings.length > 0;
  const reason = text(record.dispatch?.reason) || (record.workorder_ready === false ? "维修方案尚未达到工单就绪条件" : "");
  return {
    label: hasOrder ? "已关联工单" : blocked ? "暂不能自动派发"
      : allowed === true ? "方案就绪，等待系统派发"
      : record.workorder_ready === true ? "方案已就绪，派发条件以系统校验为准" : "派发条件待校验",
    reason: [...new Set([reason, ...findings].filter(Boolean))].join("；"),
    findings,
    stopReason: text(record.stop_reason),
    ready: record.workorder_ready === true ? "是" : record.workorder_ready === false ? "否" : "待校验",
  };
}

export function maintenanceHistoryNotice(history = {}) {
  if (history.status === "failed") return text(history.error) || "历史方案读取失败，原始记录仍保留";
  if (history.status !== "loading") return "";
  return `正在后台读取历史方案（${history.loaded_records || 0} / ${history.total_records || 0} 条事件）；最新已读方案先显示，完整执行日志不重复加载。`;
}
