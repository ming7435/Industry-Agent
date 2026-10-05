import test from "node:test";
import assert from "node:assert/strict";
import * as cad from "./productionCad.mjs";
const { buildCadPayload, cadFileUrl, cadRequest, canConfirmCad, cadStatus, validateCadUpload } = cad;

test("未完成任务不能确认，状态不伪造为生产成功", () => {
  assert.equal(canConfirmCad({ status: "modeling", digest: "abc", geometry: { valid: true } }), false);
  assert.equal(canConfirmCad({ status: "ready", digest: "abc", geometry: { valid: true, step_roundtrip_valid: true } }), true);
  assert.equal(cadStatus("needs_input"), "待补充信息");
  assert.equal(cadStatus("failed"), "建模失败");
});

test("下载链接只接受 CAD 成果接口并正确设置下载参数", () => {
  assert.equal(cadFileUrl("/api/cad/designs/CAD-0123456789ABCDEF0123/artifacts/step", true), "/api/cad/designs/CAD-0123456789ABCDEF0123/artifacts/step?download=1");
  assert.throws(() => cadFileUrl("https://outside.example/file"));
  assert.throws(() => cadFileUrl("javascript:alert(1)"));
});

test("上传必须限制大小、类型与路径", () => {
  assert.equal(validateCadUpload({ name: "销轴.step", size: 100 }), "");
  assert.match(validateCadUpload({ name: "part.exe", size: 100 }), /格式/);
  assert.match(validateCadUpload({ name: "../part.step", size: 100 }), /文件名/);
  assert.match(validateCadUpload({ name: "part.pdf", size: 9 * 1024 * 1024 }), /8 MB/);
});

test("参数输入完整解析，空参数保留自然语言入口", () => {
  const form = { name: "销轴", prompt: "直径30mm", material: "C45", parameters: "", technicalRequirements: "" };
  assert.deepEqual(buildCadPayload(form), { name: "销轴", prompt: "直径30mm", material: "C45", technical_requirements: "", spec: null });
  const value = buildCadPayload({ ...form, parameters: '{"units":"mm","operations":[{"type":"cylinder","diameter":30,"length":50}]}' });
  assert.equal(value.spec.operations[0].length, 50);
  assert.throws(() => buildCadPayload({ ...form, parameters: "not JSON" }), /JSON/);
});

test("命令身份也放在请求体中，不依赖监控代理转发自定义头", async () => {
  const previous = globalThis.fetch;
  let received;
  globalThis.fetch = async (_, options) => { received = JSON.parse(options.body); return { ok: true, json: async () => ({ design_id: "test" }) }; };
  try {
    await cadRequest("/api/cad/designs", { method: "POST", body: { name: "销轴" }, key: "command-one" });
    assert.equal(received.command_id, "command-one");
  } finally { globalThis.fetch = previous; }
});

test("响应未知时原请求复用命令身份，改变参数或明确新任务才换身份", () => {
  assert.equal(typeof cad.createCadCommandState, "function");
  let number = 0;
  const state = cad.createCadCommandState(() => `command-${++number}`);
  const path = "/api/cad/designs", payload = { spec: { units: "mm", operations: [{ length: 30 }] } };
  assert.equal(state.keyFor(path, payload), state.keyFor(path, payload));
  const original = state.keyFor(path, payload);
  assert.notEqual(state.keyFor(path, { spec: { units: "mm", operations: [{ length: 40 }] } }), original);
  const current = state.keyFor(path, payload); state.reset();
  assert.notEqual(state.keyFor(path, payload), current);
});

test("工艺字段必须显式填写，不能将空值和布尔值转为零", () => {
  const form = { stock_diameter_mm: "34", stock_length_mm: "70", grip_length_mm: "20", clearance_mm: "2", pass_depth_mm: "1", spindle_rpm: "1200", feed_mm_per_rev: "0.1", tolerance_mm: "0.02", tool_id: "1", drill_tool_id: "2", drill_diameter_mm: "10" };
  const value = cad.buildManufacturingPayload(form, "d".repeat(64));
  assert.equal(value.spindle_rpm, 1200);
  assert.equal(value.device_id, "TRAK-TC820LTYSI-001");
  assert.throws(() => cad.buildManufacturingPayload({ ...form, spindle_rpm: "" }, "d".repeat(64)));
  assert.throws(() => cad.buildManufacturingPayload({ ...form, feed_mm_per_rev: true }, "d".repeat(64)));
});

test("只有已准备且人工确认的虚拟加工包才允许发送，文件链接禁止越权路径", () => {
  const record = { status: "prepared", digest: "d".repeat(64), program: { simulation_only: true, simulation: { passed: true } } };
  assert.equal(cad.canDispatchManufacturing(record, false), false);
  assert.equal(cad.canDispatchManufacturing(record, true), true);
  assert.equal(cad.canDispatchManufacturing({ ...record, status: "uncertain" }, true), false);
  assert.throws(() => cad.manufacturingFileUrl("CAD-0123456789ABCDEF0123", "../../outside", "nc"));
  assert.equal(cad.manufacturingFileUrl("CAD-0123456789ABCDEF0123", "CAM-0123456789ABCDEF0123", "nc", true), "/api/cad/designs/CAD-0123456789ABCDEF0123/manufacturing/CAM-0123456789ABCDEF0123/files/nc?download=1");
});

test("超时经只读对账恢复后，新人工确认不能复用旧的已提交身份", () => {
  assert.equal(cad.shouldRenewManufacturingConfirmation("uncertain", "received"), true);
  assert.equal(cad.shouldRenewManufacturingConfirmation("uncertain", "paused"), true);
  assert.equal(cad.shouldRenewManufacturingConfirmation("submitting", "interrupted"), true);
  assert.equal(cad.shouldRenewManufacturingConfirmation("uncertain", "uncertain"), false);
  assert.equal(cad.shouldRenewManufacturingConfirmation("running", "running"), false);
});

test("工厂轮询返回的新状态同时更新加工包列表，其他任务保持独立", () => {
  const items = [{ program_id: "one", status: "prepared" }, { program_id: "two", status: "running" }];
  const next = { program_id: "one", status: "completed", job: { progress: 1 } };
  assert.deepEqual(cad.mergeManufacturingProgress(items, next), [next, items[1]]);
  assert.equal(items[0].status, "prepared");
});
