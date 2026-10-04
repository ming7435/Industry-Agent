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
