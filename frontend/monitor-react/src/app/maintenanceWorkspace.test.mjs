import test from "node:test";
import assert from "node:assert/strict";

const workspace = await import("./maintenanceWorkspace.mjs").catch(error => error.code === "ERR_MODULE_NOT_FOUND" ? {} : Promise.reject(error));

test("已删除方案不从工单快照、监控或历史接口重新出现", () => {
  const plan = { plan_id: "PLAN-DELETED", device_id: "M-1" };
  const records = workspace.buildMaintenanceWorkspaceRecords({ items: [plan],
    orders: [{ maintenance_plan_snapshot: plan }], snapshot: { diagnosis: { pipeline: { maintenance_plan: plan } } },
    deletedPlanIds: ["PLAN-DELETED"] });
  assert.deepEqual(records, []);
});

test("历史接口保留删除标记，批量删除请求明确携带方案编号", async () => {
  const result = await workspace.loadMaintenanceWorkspace(async () => ({ items: [], deleted_plan_ids: ["PLAN-DELETED"] }));
  assert.deepEqual(result.deletedPlanIds, ["PLAN-DELETED"]);
  assert.equal(typeof workspace.deleteMaintenancePlans, "function");
  const response = await workspace.deleteMaintenancePlans(async (path, options) => {
    assert.equal(path, "/api/maintenance/plans/delete");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { plan_ids: ["PLAN-1", "PLAN-2"] });
    return { deleted_plan_ids: ["PLAN-1", "PLAN-2"] };
  }, ["PLAN-1", "PLAN-2"]);
  assert.deepEqual(response.deleted_plan_ids, ["PLAN-1", "PLAN-2"]);
});

test("plan loading preserves readable plans when personal workorders are unauthorized", async () => {
  assert.equal(typeof workspace.loadMaintenanceWorkspace, "function", "Independent plan loading is missing");
  const result = await workspace.loadMaintenanceWorkspace(async path => {
    if (path === "/api/maintenance/plans") return { items: [{ plan_id: "PLAN-1", workorder_ready: false }], count: 1 };
    if (path === "/api/workorders") throw new Error("维修会话已失效，请重新登录");
    throw new Error(`Unexpected route: ${path}`);
  }, { user_id: "U-1" });
  assert.deepEqual(result.items, [{ plan_id: "PLAN-1", workorder_ready: false }]);
  assert.equal(result.planError, "");
  assert.equal(result.orderError, "维修会话已失效，请重新登录");
});

test("plan loading without personal identity never requests the private workorder list", async () => {
  assert.equal(typeof workspace.loadMaintenanceWorkspace, "function", "Independent plan loading is missing");
  const result = await workspace.loadMaintenanceWorkspace(async path => {
    assert.equal(path, "/api/maintenance/plans");
    return { items: [{ plan_id: "PLAN-PUBLIC" }], count: 1 };
  });
  assert.equal(result.items[0].plan_id, "PLAN-PUBLIC");
  assert.deepEqual(result.orders, []);
  assert.equal(result.orderError, "");
});

test("plan collection retains pipeline evidence and deduplicates an API copy by real plan identity", () => {
  assert.equal(typeof workspace.buildMaintenanceWorkspaceRecords, "function", "Independent plan collection is missing");
  const records = workspace.buildMaintenanceWorkspaceRecords({
    snapshot: { diagnosis: { pipeline_by_device: { "M-1": {
      event: { device_id: "M-1", alarm_code: "A-1", event_id: "EVT-1" }, stop_reason: "replan_limit_exceeded",
      maintenance_plan: { plan_id: "PLAN-1", evidence: [{ content: "压力不足" }], workorder_ready: false },
    } } } },
    items: [{ plan_id: "PLAN-1", device_id: "M-1", alarm_code: "A-1", stop_reason: "replan_limit_exceeded",
      evidence: [{ content: "压力不足" }], workorder_ready: false, dispatch: { allowed: false, reason: "缺少工程依据" } }],
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].plan_id, "PLAN-1");
  assert.deepEqual(records[0].evidence, [{ content: "压力不足" }]);
  assert.equal(records[0].dispatch.reason, "缺少工程依据");
});

test("plan readiness never claims dispatch when validation or confidence remains blocked", () => {
  assert.equal(typeof workspace.maintenanceDispatchView, "function", "Dispatch status display is missing");
  const status = workspace.maintenanceDispatchView({ workorder_ready: true, validation_findings: [],
    dispatch: { allowed: false, reason: "诊断置信度 0.45 低于自动派单门槛 0.80" }, stop_reason: "policy_blocked" });
  assert.equal(status.label, "暂不能自动派发");
  assert.equal(status.reason, "诊断置信度 0.45 低于自动派单门槛 0.80");
  assert.equal(status.stopReason, "policy_blocked");
});

test("ready plans remain waiting for system dispatch until an authorized linked order exists", () => {
  assert.equal(typeof workspace.maintenanceDispatchView, "function", "Dispatch status display is missing");
  assert.equal(workspace.maintenanceDispatchView({ workorder_ready: true, dispatch: { allowed: true, reason: "校验通过" } }).label, "方案就绪，等待系统派发");
  assert.equal(workspace.maintenanceDispatchView({ workorder_ready: true }, { hasOrder: true }).label, "已关联工单");
});

test("plan collection prioritizes a newer saved event over an old snapshot of the same alarm", () => {
  const records = workspace.buildMaintenanceWorkspaceRecords({
    snapshot: { diagnosis: { pipeline: { event: { device_id: "M-1", alarm_code: "A-1", timestamp: "2026-10-04T12:00:00Z" }, maintenance_plan: { plan_id: "PLAN-OLD" } } } },
    items: [{ plan_id: "PLAN-NEW", device_id: "M-1", alarm_code: "A-1", created_at: "2026-10-05T12:00:00Z" }],
  });
  assert.deepEqual(records.map(record => record.plan_id), ["PLAN-NEW", "PLAN-OLD"]);
});

test("历史后台读取状态保留到页面数据，不把加载中显示为不存在方案", async () => {
  const history = { status: "loading", loaded_records: 2, total_records: 79, error: "" };
  const result = await workspace.loadMaintenanceWorkspace(async () => ({ items: [{ plan_id: "PLAN-LATEST" }], history }));
  assert.deepEqual(result.history, history);
  assert.equal(typeof workspace.maintenanceHistoryNotice, "function");
  assert.match(workspace.maintenanceHistoryNotice(history), /2.*79/);
  assert.match(workspace.maintenanceHistoryNotice(history), /读取|加载/);
  assert.equal(workspace.maintenanceHistoryNotice({ status: "ready" }), "");
  assert.match(workspace.maintenanceHistoryNotice({ status: "failed", error: "事件存储不可用" }), /事件存储不可用/);
});
