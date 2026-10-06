import test from "node:test";
import assert from "node:assert/strict";

const view = await import("./qualityWorkspace.mjs").catch(error => error.code === "ERR_MODULE_NOT_FOUND" ? {} : Promise.reject(error));

test("数据不足和未检测不能显示不合格", () => {
  assert.equal(typeof view.qualityOutcome, "function");
  for (const status of ["review", "not_tested", "insufficient_data"]) {
    const result = view.qualityOutcome({ status, qualified: false, passed: false });
    assert.notEqual(result.tone, "fault");
    assert.doesNotMatch(result.label, /不合格/);
  }
});

test("有明确失败证据和合格结果才分别显示FAIL和PASS", () => {
  assert.equal(typeof view.qualityOutcome, "function");
  assert.deepEqual(view.qualityOutcome({ status: "fail", passed: false }), { label: "不合格", tone: "fault" });
  assert.deepEqual(view.qualityOutcome({ status: "pass", passed: true }), { label: "合格", tone: "normal" });
  assert.equal(view.qualityOutcome({ qualified: false }).label, "待确认");
  assert.notEqual(view.qualityOutcome({ status: "pass", passed: true, synthetic: true }).label, "合格");
});

test("未知状态不默认为合格，显式失败覆盖矛盾的qualified标志", () => {
  assert.equal(typeof view.qualityOutcome, "function");
  assert.notEqual(view.qualityOutcome({ status: "unexpected", qualified: true }).label, "合格");
  assert.equal(view.qualityOutcome({ status: "failed", qualified: true }).label, "不合格");
});

test("经验检索失败不阻断质检历史和整改任务", async () => {
  assert.equal(typeof view.loadQualityResources, "function");
  const result = await view.loadQualityResources(async path => {
    if (path === "/api/experience/search") throw new Error("经验接口不可用");
    if (path.startsWith("/api/v1/quality/checks?")) return { items: [{ quality_check_id: "QC-1" }] };
    if (path === "/api/v1/closure-tasks") return { items: [{ closure_task_id: "T-1", quality_check_id: "QC-1" }] };
    throw new Error("意外路径");
  }, "P/1", "M-1");
  assert.equal(result.history[0].quality_check_id, "QC-1");
  assert.equal(result.tasks[0].closure_task_id, "T-1");
  assert.deepEqual(result.experiences, []);
  assert.match(result.errors.join("；"), /经验接口不可用/);
});

test("空零件编号不能查询全库历史", async () => {
  assert.equal(typeof view.loadQualityResources, "function");
  const paths = [];
  await view.loadQualityResources(async path => { paths.push(path); return { items: [] }; }, "", "M-1");
  assert.equal(paths.some(path => path.includes("quality/checks")), false);
});

test("持久化五项检测明细按真实状态展示", () => {
  assert.equal(typeof view.qualityChecks, "function");
  const checks = view.qualityChecks({ quality_validation: { dimensions: { status: "pass", passed: true }, appearance: { status: "not_tested", passed: false } } });
  assert.equal(checks[0].name, "尺寸检测");
  assert.equal(view.qualityOutcome(checks[1]).label, "未检测");
});

test("复检只引用新的服务端质检记录，不生成用户声明的PASS证据", async () => {
  assert.equal(typeof view.runQualityAction, "function");
  let outbound;
  await view.runQualityAction(async (path, options) => { outbound = { path, body: JSON.parse(options.body) }; return { success: true }; }, "reinspect", { checkId: "QC/OLD", reinspectionCheckId: "QC-NEW" });
  assert.equal(outbound.path, "/api/v1/quality/checks/QC%2FOLD/reinspect");
  assert.deepEqual(outbound.body, { passed: true, reinspection_check_id: "QC-NEW" });
});

test("缺少新记录或自引用复检不能发请求", async () => {
  assert.equal(typeof view.runQualityAction, "function");
  let count = 0;
  const request = async () => { count++; return {}; };
  for (const reinspectionCheckId of ["", "QC-1"]) {
    await assert.rejects(() => view.runQualityAction(request, "reinspect", { checkId: "QC-1", reinspectionCheckId }), /新.*记录/);
  }
  assert.equal(count, 0);
});

test("整改完成调用对应任务，放行拒绝必须向页面抛出", async () => {
  assert.equal(typeof view.runQualityAction, "function");
  const calls = [];
  await view.runQualityAction(async (path, options) => { calls.push({ path, options }); return { success: true }; }, "complete_task", { taskId: "T/1", note: "已整改并测量" });
  assert.match(calls[0].path, /^\/api\/v1\/closure-tasks\/T%2F1\/complete\?note=/);
  await assert.rejects(() => view.runQualityAction(async () => ({ success: false, error: "整改未完成" }), "release", { checkId: "QC-1" }), /整改未完成/);
});

test("open只是闭环状态，历史仍能区分未检测和数据不足", () => {
  assert.equal(typeof view.qualityHistoryStatusLabel, "function");
  assert.equal(view.qualityHistoryStatusLabel({ status: "open", result: "not_tested" }), "未检测");
  assert.equal(view.qualityHistoryStatusLabel({ status: "open", result: "review" }), "数据不足，待补充");
  assert.equal(view.qualityHistoryStatusLabel({ status: "released", result: "passed" }), "已放行");
});

test("本地扁平QC和远程包装QC都能立即更新选中结果", () => {
  assert.equal(typeof view.qualityFromAction, "function");
  const record = { quality_check_id: "QC-1", status: "released" };
  assert.deepEqual(view.qualityFromAction(record), record);
  assert.deepEqual(view.qualityFromAction({ success: true, quality_check: record }), record);
  assert.equal(view.qualityFromAction({ success: true, closure_task: {} }), null);
});

test("扁平整改任务不能替换五项质检结果", () => {
  const task = { closure_task_id: "CT-1", quality_check_id: "QC-1", status: "completed", title: "更换传感器" };
  assert.equal(view.qualityFromAction(task), null);
  assert.equal(view.qualityFromAction({ success: true, closure_task: task }), null);
});
