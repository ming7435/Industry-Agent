import test from "node:test";
import assert from "node:assert/strict";

const workspace = await import("./maintenanceWorkspace.mjs").catch(error => error.code === "ERR_MODULE_NOT_FOUND" ? {} : Promise.reject(error));

test('关联工单的现行步骤与状态优先于同编号的旧方案快照', () => {
  const plan = {plan_id:'P1',device_id:'M1',event_id:'E1',repair_steps:['旧步骤'],workorder_ready:true,
    dispatch:{status:'dispatched',assignee:'U1',workorder_id:'W1'}};
  const records = workspace.buildMaintenanceWorkspaceRecords({items:[plan], orders:[{workorder_id:'W1',device_id:'M1',event_id:'E1',plan_id:'P1',
    status:'completed',assignee:'U1',assignee_name:'维修甲',maintenance_plan_snapshot:{...plan,repair_steps:['工单的现行步骤']}}]});
  assert.equal(records.length,1);
  assert.deepEqual(records[0].repair_steps,['工单的现行步骤']);
  assert.equal(records[0].dispatch.workorder_status,'completed');
});

test('工单更新方案后旧版本不能继续被选作当前方案，也不混入同设备其他事件', () => {
  const old = {plan_id:'P1',device_id:'M1',event_id:'E1',repair_steps:['旧方案']};
  const other = {...old,event_id:'E2'};
  const records = workspace.buildMaintenanceWorkspaceRecords({items:[old,other],orders:[{workorder_id:'W1',device_id:'M1',event_id:'E1',plan_id:'P2',
    status:'in_progress',assignee:'U1',plan_revisions:[{previous_plan_id:'P1',plan_id:'P2'}],maintenance_plan_snapshot:{...old,plan_id:'P2',repair_steps:['现行方案']}}]});
  assert.deepEqual(records.map(record=>[record.plan_id,record.event_id]).sort(),[['P1','E2'],['P2','E1']]);
});

test('删除工单后旧监控和方案接口不能让关联方案重新出现在列表', () => {
  const plan = {plan_id:'P1',device_id:'M1',event_id:'E1'};
  assert.deepEqual(workspace.buildMaintenanceWorkspaceRecords({items:[plan],snapshot:{diagnosis:{pipeline:{event:{device_id:'M1',event_id:'E1'},maintenance_plan:plan}}},
    orders:[{workorder_id:'W1',device_id:'M1',event_id:'E1',plan_id:'P1',deleted_at:'2026-10-07T14:00:00Z',maintenance_plan_snapshot:plan}]}),[]);
});

test('删除更换过方案的工单也隐藏关联的旧版本', () => {
  const records = workspace.buildMaintenanceWorkspaceRecords({items:[{plan_id:'P1',device_id:'M1',event_id:'E1'}],
    orders:[{workorder_id:'W1',device_id:'M1',event_id:'E1',plan_id:'P2',deleted_at:'2026-10-07T14:00:00Z',
      plan_revisions:[{previous_plan_id:'P1',plan_id:'P2'}],maintenance_plan_snapshot:{plan_id:'P2'}}]});
  assert.deepEqual(records,[]);
});

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

test("已就绪方案明确等待对应负责人员登录并优先显示服务端原因", () => {
  const status = workspace.maintenanceDispatchView({ device_id: "M-1", workorder_ready: true, validation_findings: [],
    dispatch: { allowed: false, status: "waiting_for_personnel", reason: "等待 M-1 对应维修人员登录" } });
  assert.equal(status.label, "等待负责人员登录");
  assert.equal(status.reason, "等待 M-1 对应维修人员登录");
  assert.equal(status.ready, "是");
  assert.equal(status.assigneeName, "");
});

test("真实派单状态显示服务端负责人及故障设备，已关联状态仍优先", () => {
  const record = { device_id: "M-1", workorder_ready: true, validation_findings: [],
    dispatch: { allowed: true, status: "dispatched", reason: "按有效登录与负责设备匹配", assignee: "U-1", assignee_name: "维修人员甲", device_id: "M-1" } };
  const status = workspace.maintenanceDispatchView(record);
  assert.equal(status.label, "已自动派单");
  assert.equal(status.assigneeName, "维修人员甲");
  assert.equal(status.assignmentDeviceId, "M-1");
  assert.equal(status.reason, "按有效登录与负责设备匹配");
  assert.equal(workspace.maintenanceDispatchView(record, { hasOrder: true }).label, "已关联工单");
});

test("人员等待状态不得遮盖资料门禁或显示未真实派单的候选姓名", () => {
  const status = workspace.maintenanceDispatchView({ workorder_ready: false, validation_findings: ["缺少维修依据"],
    dispatch: { allowed: false, status: "waiting_for_personnel", reason: "维修依据未通过", assignee: "U-1", assignee_name: "候选人员" } });
  assert.equal(status.label, "暂不能自动派发");
  assert.equal(status.reason, "维修依据未通过；缺少维修依据");
  assert.equal(status.assigneeName, "");
  assert.equal(status.assignmentDeviceId, "");
});

test("没有真实负责人或拒绝派发时不能仅凭状态声称已自动派单", () => {
  const empty = workspace.maintenanceDispatchView({ workorder_ready: true,
    dispatch: { allowed: true, status: "dispatched" } });
  assert.equal(empty.label, "方案就绪，等待系统派发");
  const denied = workspace.maintenanceDispatchView({ workorder_ready: true,
    dispatch: { allowed: false, status: "dispatched", assignee: "U-1", assignee_name: "旧负责人" } });
  assert.equal(denied.label, "暂不能自动派发");
  assert.equal(denied.assigneeName, "");
});

test("方案被阻止时明确显示具体资料缺项，而不是只说尚未就绪", () => {
  const status = workspace.maintenanceDispatchView({ workorder_ready: false,
    dispatch: { allowed: false, reason: "维修方案尚未达到工单就绪条件" },
    validation_findings: ["涉及拆装或部件操作但缺少 CAD/BOM 依据", "所需备件库存缺失或不可用：LUB-REAL"] });
  assert.match(status.reason, /CAD\/BOM/);
  assert.match(status.reason, /LUB-REAL/);
});

test("严重故障明确显示等待审批，已有工单仍显示真实关联状态", () => {
  const record = { workorder_ready: true, status: "waiting_approval", stop_reason: "approval_required",
    dispatch: { allowed: false, status: "waiting_approval", reason: "高风险工单等待审批" } };
  assert.equal(workspace.maintenanceDispatchView(record).label, "等待审批后派发");
  assert.match(workspace.maintenanceDispatchView(record).reason, /审批/);
  assert.equal(workspace.maintenanceDispatchView(record, { hasOrder: true }).label, "已关联工单");
});

test("审批状态不得遮盖未通过的置信度门禁", () => {
  const record = { workorder_ready: true, status: "waiting_approval", stop_reason: "approval_required",
    dispatch: { allowed: false, reason: "诊断置信度 0.45 低于自动派单门槛 0.80" } };
  assert.equal(workspace.maintenanceDispatchView(record).label, "暂不能自动派发");
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

test("未就绪方案保留已有设备图纸入口，参考资料不提升派工状态", () => {
  const record = { device_id: "TRAK-TC820LTYSI-001", workorder_ready: false,
    validation_findings: ["缺少部件 BOM / 材料"],
    available_drawings: [{ drawing_id: "TC820-LOCAL", drawing_name: "TC820si 设备图纸", device_id: "TRAK-TC820LTYSI-001",
      drawing_url: "/drawings/TC820si.html", source_kind: "original_edrawings", evidence_scope: "device_reference", engineering_status: "reference_only" }] };
  const references = workspace.maintenanceReferenceDrawings(record);
  assert.equal(references.length, 1);
  assert.equal(references[0].url, "/drawings/TC820si.html");
  assert.equal(references[0].name, "TC820si 设备图纸");
  assert.equal(references[0].label, "设备图纸");
  assert.equal(references[0].engineeringStatus, "reference_only");
  assert.equal(workspace.maintenanceDispatchView(record).ready, "否");
  assert.equal(workspace.maintenanceDispatchView(record).label, "暂不能自动派发");
});

test("新方案的嵌套参考图纸与接口入口去重，并准确描述含原图的参考模型", () => {
  const drawing = { drawing_id: "EQUATOR-LOCAL", drawing_name: "Equator300 防碰撞尺寸", device_id: "RENISHAW-EQUATOR300-001",
    model_url: "/drawings/Equator300.html", source_kind: "reference_model", evidence_scope: "device_reference", engineering_status: "reference_only" };
  const references = workspace.maintenanceReferenceDrawings({ device_id: drawing.device_id,
    available_drawings: [drawing], engineering_context: { reference_drawings: [{ ...drawing, drawing_url: drawing.model_url }] } });
  assert.equal(references.length, 1);
  assert.equal(references[0].url, "/drawings/Equator300.html");
  assert.equal(references[0].label, "设备图纸与参考模型");
  assert.equal(references[0].evidenceScope, "device_reference");
});

test("仅嵌套参考图纸可读取，其他设备及非本地图纸地址不混入当前方案", () => {
  const valid = { drawing_id: "QLS-LOCAL", drawing_name: "QLS80S2 设备图纸", device_id: "LNS-QL-SERVO-80-S2-001",
    drawing_url: "/drawings/QLS80S2.html", source_kind: "reference_model" };
  const references = workspace.maintenanceReferenceDrawings({ device_id: valid.device_id,
    engineering_context: { reference_drawings: [valid, { ...valid, device_id: "M-OTHER", drawing_url: "/drawings/TC820si.html" },
      { ...valid, drawing_url: "javascript:alert(1)" }, { ...valid, drawing_url: "https://example.invalid/unknown.html" },
      { ...valid, drawing_url: "/drawings/unconfirmed.html" }] } });
  assert.deepEqual(references.map(reference => reference.url), ["/drawings/QLS80S2.html"]);
});

test("缺失或异常参考图纸数据不按设备名称编造查看地址", () => {
  assert.deepEqual(workspace.maintenanceReferenceDrawings(), []);
  assert.deepEqual(workspace.maintenanceReferenceDrawings({ device_id: "TRAK-TC820LTYSI-001" }), []);
  assert.deepEqual(workspace.maintenanceReferenceDrawings({ available_drawings: {}, engineering_context: { reference_drawings: "invalid" } }), []);
});

test("真实Maintenance嵌套available_drawings优先于兼容旧字段，接口投影优先且去重", () => {
  const canonical = { drawing_id: "EQ-CANONICAL", drawing_name: "后端当前设备图纸", device_id: "RENISHAW-EQUATOR300-001",
    drawing_url: "/drawings/Equator300.html", source_kind: "reference_model", evidence_scope: "device_reference", engineering_status: "reference_only" };
  const record = { device_id: canonical.device_id, engineering_context: {
    available_drawings: [canonical], reference_drawings: [{ ...canonical, drawing_name: "旧兼容名称" }],
  } };
  assert.equal(workspace.maintenanceReferenceDrawings(record).length, 1);
  assert.equal(workspace.maintenanceReferenceDrawings(record)[0].name, canonical.drawing_name);
  assert.equal(workspace.maintenanceReferenceDrawings(record)[0].url, canonical.drawing_url);
  record.available_drawings = [{ ...canonical, drawing_name: "接口当前名称" }];
  assert.equal(workspace.maintenanceReferenceDrawings(record).length, 1);
  assert.equal(workspace.maintenanceReferenceDrawings(record)[0].name, "接口当前名称");
});

test("明确检查类型显示现场检查范围，不将无需维修解释为无需处理", () => {
  assert.equal(typeof workspace.maintenanceWorkType, "function");
  const view = workspace.maintenanceWorkType({ plan_kind: "inspection", inspection_required: true,
    maintenance_required: false, cad_required: false, inspection_reason: "需现场核查报警与记录读数" });
  assert.equal(view.kind, "inspection");
  assert.equal(view.label, "现场检查");
  assert.equal(view.inspection, true);
  assert.match(view.description, /核查.*记录/);
  assert.match(view.description, /具体维修.*另建方案/);
  assert.equal(view.reason, "需现场核查报警与记录读数");
});

test("工单从真实方案快照读取检查类型，兼容明确检查标记", () => {
  assert.equal(typeof workspace.maintenanceWorkType, "function");
  const view = workspace.maintenanceWorkType({ maintenance_plan_snapshot: {
    plan_kind: "inspection", inspection_required: true, inspection_reason: "现场确认电气连接" } });
  assert.equal(view.label, "现场检查");
  assert.equal(view.reason, "现场确认电气连接");
  assert.equal(workspace.maintenanceWorkType({ inspection_required: true }).kind, "inspection");
  assert.equal(workspace.maintenanceWorkType({ maintenance_plan: { plan_kind: "inspection" } }).kind, "inspection");
});

test("旧记录、维修文字与maintenance_required=false不能推断检查类型", () => {
  assert.equal(typeof workspace.maintenanceWorkType, "function");
  for (const record of [{}, { maintenance_required: false }, { repair_steps: ["检查并更换轴承"] },
    { plan_kind: "repair", inspection_required: true }, { plan_kind: "unknown" }]) {
    const view = workspace.maintenanceWorkType(record);
    assert.equal(view.kind, "repair");
    assert.equal(view.label, "设备维修");
    assert.equal(view.inspection, false);
    assert.equal(view.description, "");
  }
});

test("检查展示保留服务端原失败与未就绪，不在前端放行旧方案", () => {
  assert.equal(typeof workspace.maintenanceWorkType, "function");
  const record = { plan_kind: "inspection", inspection_required: true, maintenance_required: false,
    workorder_ready: false, validation_findings: ["旧维修方案缺少目标部件工程资料"],
    dispatch: { allowed: false, reason: "旧方案须重新校验后生成检查方案" }, stop_reason: "validation_failed" };
  const before = structuredClone(record);
  assert.equal(workspace.maintenanceWorkType(record).label, "现场检查");
  const status = workspace.maintenanceDispatchView(record);
  assert.equal(status.label, "暂不能自动派发");
  assert.equal(status.ready, "否");
  assert.match(status.reason, /旧方案须重新校验/);
  assert.match(status.reason, /缺少目标部件工程资料/);
  assert.equal(status.stopReason, "validation_failed");
  assert.deepEqual(record, before);
});

test("检查结束只依据真实closed状态，不根据记录保存成功或核验passed推断关闭", () => {
  assert.equal(typeof workspace.inspectionWorkorderView, "function");
  const pending = { status: "in_progress", maintenance_plan_snapshot: { plan_kind: "inspection" },
    repair_verification: { source: "inspection", passed: true, validation_findings: [] } };
  assert.equal(workspace.inspectionWorkorderView(pending).completed, false);
  assert.equal(workspace.inspectionWorkorderView(pending).statusLabel, "");
  assert.equal(workspace.inspectionWorkorderView({ ...pending, status: "closed" }).completed, true);
  assert.equal(workspace.inspectionWorkorderView({ ...pending, status: "closed" }).statusLabel, "检查已完成");
});

test("未通过的检查工单展示真实服务端validation_findings并保留记录状态", () => {
  assert.equal(typeof workspace.inspectionWorkorderView, "function");
  const record = { status: "in_progress", maintenance_plan_snapshot: { plan_kind: "inspection" },
    repair_verification: { source: "inspection", phase: "inspection", passed: false,
      validation_findings: ["设备仍有报警 A-1", "设备样本时间过期"] } };
  const before = structuredClone(record);
  assert.deepEqual(workspace.inspectionWorkorderView(record).findings, ["设备仍有报警 A-1", "设备样本时间过期"]);
  assert.equal(workspace.inspectionWorkorderView(record).completed, false);
  assert.deepEqual(record, before);
});

test("维修验证和异常检查验证结构不被当作检查结束依据", () => {
  assert.equal(typeof workspace.inspectionWorkorderView, "function");
  assert.deepEqual(workspace.inspectionWorkorderView({ status: "closed", repair_verification: {
    source: "device_recovery", validation_findings: ["维修验证"] } }), { completed: false, statusLabel: "", findings: [] });
  assert.deepEqual(workspace.inspectionWorkorderView({ plan_kind: "inspection", status: "in_progress",
    repair_verification: { source: "device_recovery", validation_findings: ["其他流程缺项"] } }).findings, []);
  assert.deepEqual(workspace.inspectionWorkorderView({ plan_kind: "inspection", repair_verification: {
    source: "inspection", validation_findings: "bad" } }).findings, []);
});

test("已派工但执行需复核保留真实派发事实与负责人，不把allowed=false当未派单", () => {
  const view = workspace.maintenanceDispatchView({ workorder_ready: true, validation_findings: [],
    dispatch: { status: "dispatched", allowed: false, workorder_id: "WO-REAL", assignee: "U-REAL", assignee_name: "lmy", device_id: "D-1", reason: "当前方案不可执行" },
    execution_review: { required: true, findings: ["刀塔报警使用了门互锁模板"] } });
  assert.equal(view.label, "已自动派单");
  assert.equal(view.assigneeName, "lmy");
  assert.equal(view.assignmentDeviceId, "D-1");
  assert.equal(view.reviewRequired, true);
  assert.equal(view.reviewLabel, "方案需重新校验");
  assert.deepEqual(view.reviewFindings, ["刀塔报警使用了门互锁模板"]);
  assert.match(view.reason, /当前方案不可执行/);
  assert.match(view.reason, /刀塔报警使用了门互锁模板/);
});

test("已关联工单仍保留方案执行校验原因", () => {
  const view = workspace.maintenanceDispatchView({ workorder_ready: true, dispatch: { allowed: false, reason: "旧模板不匹配" },
    execution_review: { required: true, findings: ["报警与步骤不匹配"] } }, { hasOrder: true });
  assert.equal(view.label, "已关联工单");
  assert.equal(view.reviewRequired, true);
  assert.match(view.reason, /旧模板不匹配/);
  assert.match(view.reason, /报警与步骤不匹配/);
});

test("执行复核助手仅信任明确required标记与中文字符串缺项，旧合法单不受影响", () => {
  assert.equal(typeof workspace.executionReviewView, "function");
  assert.deepEqual(workspace.executionReviewView({ execution_review: { required: true, findings: [" 报警错配 ", "", { detail: "无效类型" }] } }),
    { required: true, humanConfirmed: false, label: "方案需重新校验", findings: ["报警错配"] });
  for (const record of [{}, { execution_review: null }, { execution_review: { required: "true", findings: ["旧字段"] } }]) {
    assert.deepEqual(workspace.executionReviewView(record), { required: false, humanConfirmed: false, label: "", findings: [] });
  }
});

test("维修确认只读取服务端明确human_confirmed布尔值，不从旧完成状态或负责人推断", () => {
  assert.equal(workspace.executionReviewView({ execution_review: { required: true, human_confirmed: true } }).humanConfirmed, true);
  for (const human_confirmed of [undefined, false, "true", 1, {}]) {
    assert.equal(workspace.executionReviewView({ status: "completed", maintenance_confirmed_by: "U-OWNER",
      repair_verification: { phase: "poststart", passed: true }, execution_review: { required: true, human_confirmed } }).humanConfirmed, false);
  }
});
