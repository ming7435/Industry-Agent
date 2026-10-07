import test from "node:test";
import assert from "node:assert/strict";
import * as cad from "./productionCad.mjs";
const realPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";

test("BuildCAD run status never presents failed or uncertain output as success", () => {
  assert.equal(cad.cadStatus("running"), "BuildCAD 正在处理");
  assert.equal(cad.cadStatus("completed"), "BuildCAD 已返回结果");
  assert.equal(cad.cadStatus("outcome_unknown"), "结果待核对");
  assert.equal(cad.cadStatus("needs_input"), "待补充需求（尚未建模）");
  assert.equal(cad.cadPending("running"), true);
  assert.equal(cad.cadPending("outcome_unknown"), false);
  assert.equal(cad.cadPending("needs_input"), false);
});

test("command identity includes prompt, operation and selected remote design", () => {
  let number = 0;
  const commands = cad.createCadCommandState(() => `command-${++number}`);
  const first = commands.keyFor("销轴");
  assert.equal(commands.keyFor("销轴"), first);
  assert.notEqual(commands.keyFor("套筒"), first);
  const second = commands.keyFor("套筒");
  commands.reset();
  assert.notEqual(commands.keyFor("套筒"), second);
  const preview = commands.keyFor("套筒", "preview", "remote-one");
  assert.equal(commands.keyFor("套筒", "preview", "remote-one"), preview);
  const save = commands.keyFor("套筒", "save", "remote-one");
  assert.notEqual(save, preview);
  assert.notEqual(commands.keyFor("套筒", "save", "remote-two"), save);
  commands.restore("套筒", "restored-command", "save", "remote-two");
  assert.equal(commands.keyFor("套筒", "save", "remote-two"), "restored-command");
  assert.notEqual(commands.keyFor("套筒", "preview", "remote-two"), "restored-command");
});

test("request carries the command identity in the JSON body and uses the current session", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    return { ok: true, json: async () => ({ run_id: "run-1", status: "running" }) };
  };
  try {
    assert.equal((await cad.cadRequest("/runs", { method: "POST", body: { prompt: "销轴", command_id: "one" } })).run_id, "run-1");
    assert.equal(calls[0].path, "/api/cad/buildcad/runs");
    assert.equal(calls[0].options.credentials, "same-origin");
    assert.deepEqual(JSON.parse(calls[0].options.body), { prompt: "销轴", command_id: "one" });
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test("network write failure is uncertain and never automatically retries", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new TypeError("connection lost"); };
  try {
    await assert.rejects(cad.cadRequest("/runs", { method: "POST", body: { prompt: "销轴", command_id: "one" } }), (error) => error.outcomeUnknown === true && /BuildCAD.*核对/.test(error.message));
    assert.equal(calls, 1);
    await assert.rejects(cad.cadRequest("/status"), (error) => !error.outcomeUnknown && /连接/.test(error.message));
  } finally { globalThis.fetch = original; }
});

test("HTTP failures preserve server errors; invalid successful JSON is never accepted as a run", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ detail: "请先连接 BuildCAD" }) });
    await assert.rejects(cad.cadRequest("/runs", { method: "POST", body: {} }), /请先连接 BuildCAD/);
    globalThis.fetch = async () => ({ ok: true, status: 202, json: async () => { throw new Error("bad json"); } });
    await assert.rejects(cad.cadRequest("/runs", { method: "POST", body: {} }), (error) => error.outcomeUnknown === true);
  } finally { globalThis.fetch = original; }
});

test("server errors after a write are uncertain, including an unreadable error response", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ detail: "上游连接中断" }) });
    await assert.rejects(cad.cadRequest("/runs", { method: "POST", body: {} }), (error) => error.outcomeUnknown === true);
    globalThis.fetch = async () => ({ ok: false, status: 504, json: async () => { throw new Error("proxy html"); } });
    await assert.rejects(cad.cadRequest("/runs", { method: "POST", body: {} }), (error) => error.outcomeUnknown === true);
  } finally { globalThis.fetch = original; }
});

test("result URLs are actual absolute web links; script, credentials, relative and control-character URLs are rejected", () => {
  assert.equal(cad.safeResultUrl("https://buildcad.ai/design/a?view=1"), "https://buildcad.ai/design/a?view=1");
  assert.equal(cad.safeResultUrl("http://example.test/design/a"), "http://example.test/design/a");
  for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///tmp/model", "/design/123", "//evil.test", "https://user:pass@example.test", "https://example.test/\nimage"]) assert.equal(cad.safeResultUrl(value), "");
});

test("only returned PNG/JPEG/WebP image blocks or HTTPS image URLs become previews", () => {
  const result = cad.buildCadResult({ answer: "已生成销轴", calls: [{ tool: "render_preview", result: { content: [
    { type: "image", mimeType: "image/png", data: realPng },
    { type: "image", mimeType: "image/svg+xml", data: "PHN2Zz4=" },
    { type: "image", mimeType: "image/jpeg", data: "not base64!" },
    { type: "image", url: "https://images.example.test/pin.webp" },
    { type: "image", url: "http://images.example.test/pin.png" },
    { type: "text", text: "设计：https://buildcad.ai/design/one" },
  ] } }] });
  assert.deepEqual(result.images.map((item) => item.src), [`data:image/png;base64,${realPng}`, "https://images.example.test/pin.webp"]);
  assert.ok(result.texts.includes("已生成销轴"));
  assert.ok(result.links.includes("https://buildcad.ai/design/one"));
  assert.equal(result.links.some((url) => url.includes("javascript:")), false);
});

test("structured MCP and JSON text links remain exact; an ID never invents a design or model URL", () => {
  const result = cad.buildCadResult({ calls: [{ tool: "save_design", result: { content: [{ type: "text", text: JSON.stringify({ design_id: "abc", design_url: "https://buildcad.ai/design/real", preview_url: "https://images.example.test/render?token=a%2Fb" }) }], structuredContent: { id: "only-id", url: "javascript:alert(1)" } } }] });
  assert.ok(result.links.includes("https://buildcad.ai/design/real"));
  assert.ok(result.images.some((item) => item.src === "https://images.example.test/render?token=a%2Fb"));
  assert.equal(result.links.some((url) => url.includes("abc") || url.includes("only-id")), false);
  assert.deepEqual(result.texts, [], "raw JSON belongs in trace details, not the answer");
});

test("empty design lists and render failures stay out of normal answer text", () => {
  const result = cad.buildCadResult({ status: "failed", answer: "[]", calls: [
    { tool: "list_designs", result: { content: [{ type: "text", text: "[]" }] } },
    { tool: "render_preview", result: { isError: true, content: [{ type: "text", text: "fetch failed" }] } },
  ] });
  assert.deepEqual(result.texts, []);
  assert.deepEqual(result.designs, []);
  assert.deepEqual(result.errors, [{ tool: "render_preview", message: "fetch failed" }]);
  assert.deepEqual(result.images, []);
});

test("remote list and get-code results become selectable designs and readable code", () => {
  const code = "from llmcad import *\n# 返回的设计代码";
  const result = cad.buildCadResult({ calls: [
    { tool: "list_designs", result: { content: [{ type: "text", text: JSON.stringify([{ id: "real-one", name: "销轴" }, { designId: "real-two", title: "支架", url: "https://buildcad.ai/design/returned" }]) }] } },
    { tool: "get_design_code", result: { content: [{ type: "text", text: JSON.stringify({ code }) }] } },
  ] });
  assert.deepEqual(result.designs, [{ id: "real-one", name: "销轴" }, { id: "real-two", name: "支架", url: "https://buildcad.ai/design/returned" }]);
  assert.equal(result.code, code);
  assert.deepEqual(result.texts, []);
  assert.deepEqual(result.links, ["https://buildcad.ai/design/returned"]);
  const plain = cad.buildCadResult({ calls: [{ tool: "get_design_code", result: { content: [{ type: "text", text: code }] } }] });
  assert.equal(plain.code, code);
  assert.deepEqual(plain.texts, []);
});

test("typed MCP image resources render only safe HTTPS image links or supported embedded images", () => {
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";
  const result = cad.buildCadResult({ calls: [{ tool: "render_preview", result: { content: [
    { type: "resource_link", uri: "https://images.example.test/preview?view=iso", mimeType: "image/png", name: "四视图" },
    { type: "resource", resource: { uri: "buildcad://preview", mimeType: "image/png", blob: png } },
    { type: "resource_link", uri: "http://images.example.test/insecure.png", mimeType: "image/png", name: "unsafe" },
    { type: "resource_link", uri: "https://images.example.test/svg.png", mimeType: "image/svg+xml", name: "unsupported" },
    { type: "resource_link", uri: "https://images.example.test/not-image.png", mimeType: "application/pdf", name: "document" },
    { type: "resource_link", uri: "https://user:password@images.example.test/credentials.png", mimeType: "image/png", name: "unsafe" },
    { type: "resource", resource: { uri: "https://images.example.test/invalid.png", mimeType: "image/png", blob: "not valid base64" } },
    { type: "resource", resource: { uri: "https://images.example.test/unsupported.png", mimeType: "image/svg+xml", blob: "PHN2Zz4=" } },
  ] } }] });
  assert.deepEqual(result.images.map((item) => item.src), ["https://images.example.test/preview?view=iso", `data:image/png;base64,${png}`]);
  assert.ok(result.links.includes("https://images.example.test/preview?view=iso"));
  assert.equal(result.links.some((url) => url.includes("password")), false);
});

test("backend-normalized design identifiers and code remain usable without text blocks", () => {
  const listed = cad.buildCadResult({ status: "completed", action: "list_designs", designs: [{ design_id: "server-real-id", name: "销轴" }], calls: [] });
  assert.deepEqual(listed.designs, [{ id: "server-real-id", name: "销轴" }]);
  const read = cad.buildCadResult({ status: "completed", action: "get_design_code", code: "from llmcad import *", calls: [] });
  assert.equal(read.code, "from llmcad import *");
});

test("saved output uses the successful save code rather than the old code read before editing", () => {
  const oldCode = "from llmcad import *\n# 旧代码";
  const newCode = "from llmcad import *\n# 本轮修改代码";
  const result = cad.buildCadResult({ status: "completed", action: "save", calls: [
    { tool: "get_design_code", arguments: { designId: "real-pin" }, result: { content: [{ type: "text", text: oldCode }] } },
    { tool: "render_preview", arguments: { code: newCode }, result: { content: [{ type: "image", mimeType: "image/png", data: realPng }] } },
    { tool: "save_design", arguments: { designId: "real-pin", code: newCode }, result: { content: [{ type: "text", text: "已保存" }] } },
  ] });
  assert.equal(result.code, newCode);
  assert.equal(result.codeSource, "saved");
});

test("a failed save retains the successfully previewed code without claiming it was saved", () => {
  const previewCode = "from llmcad import *\n# 已预览代码";
  const result = cad.buildCadResult({ status: "failed", action: "save", calls: [
    { tool: "get_design_code", result: { content: [{ type: "text", text: "from llmcad import *\n# 旧代码" }] } },
    { tool: "render_preview", arguments: { code: previewCode }, result: { content: [{ type: "image", mimeType: "image/png", data: realPng }] } },
    { tool: "save_design", arguments: { designId: "real-pin", code: "from llmcad import *\n# 未保存的新版本" }, result: { isError: true, content: [{ type: "text", text: "save failed" }] } },
  ] });
  assert.equal(result.code, previewCode);
  assert.equal(result.codeSource, "preview");
});

test("a successful empty design code remains distinguishable from no code result", () => {
  const result = cad.buildCadResult({ status: "completed", action: "get_design_code", calls: [{ tool: "get_design_code", result: { content: [{ type: "text", text: JSON.stringify({ code: "" }) }] } }] });
  assert.equal(result.code, "");
  assert.equal(result.codeSource, "read");
  const normalized = cad.buildCadResult({ status: "completed", action: "get_design_code", code: "", calls: [] });
  assert.equal(normalized.code, "");
  assert.equal(normalized.codeSource, "read");
  assert.equal(cad.buildCadResult({ status: "completed", calls: [] }).codeSource, null);
});

test("failed MCP content cannot provide a successful preview or design link", () => {
  const result = cad.buildCadResult({ calls: [{ tool: "save_design", result: { isError: true, content: [{ type: "text", text: JSON.stringify({ error: "save failed", url: "https://buildcad.ai/design/failed" }) }, { type: "image", mimeType: "image/png", data: realPng }] } }] });
  assert.deepEqual(result.texts, []);
  assert.deepEqual(result.links, []);
  assert.deepEqual(result.images, []);
  assert.match(result.errors[0].message, /save failed/);
});

test("模型总结里的地址只作为普通文本，链接和预览仅来自实际工具返回", () => {
  const answer = "https://buildcad.ai/invented-model.png";
  const result = cad.buildCadResult({ answer, calls: [{ tool: "save_design", result: {
    content: [{ type: "text", text: "已保存：https://buildcad.ai/design/actual-result" }],
    structuredContent: { preview_url: "https://images.example.test/actual-preview.png" },
  } }] });
  assert.ok(result.texts.includes(answer));
  assert.deepEqual(result.links, ["https://buildcad.ai/design/actual-result", "https://images.example.test/actual-preview.png"]);
  assert.deepEqual(result.images.map((item) => item.src), ["https://images.example.test/actual-preview.png"]);
});

test("OAuth uses the exact same redirect URI and strips secrets from the browser URL", () => {
  const value = cad.oauthCallback("http://localhost:8001/?view=cad&code=secret-code&state=nonce&keep=value#result");
  assert.deepEqual(value.body, { code: "secret-code", state: "nonce", redirect_uri: "http://localhost:8001/?view=cad" });
  assert.equal(value.cleanUrl, "/?view=cad&keep=value#result");
  assert.equal(cad.oauthCallback("http://localhost:8001/?view=cad"), null);
  assert.throws(() => cad.oauthCallback("http://localhost:8001/?code=one"), /授权回调/);
});

test("restored run state is local session data and never accepts path injection", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  cad.saveCadSession(storage, { run_id: "run-1", prompt: "销轴", command_id: "one" });
  assert.deepEqual(cad.readCadSession(storage), { run_id: "run-1", prompt: "销轴", command_id: "one", action: "preview", design_id: "" });
  cad.saveCadSession(storage, { run_id: "run-save", prompt: "套筒", command_id: "two", action: "save", design_id: "actual-remote-id" });
  assert.deepEqual(cad.readCadSession(storage), { run_id: "run-save", prompt: "套筒", command_id: "two", action: "save", design_id: "actual-remote-id" });
  cad.saveCadSession(storage, { run_id: "../../secret", prompt: "销轴" });
  assert.equal(cad.readCadSession(storage), null);
  assert.equal(cad.readCadSession({ getItem() { throw new Error("disabled"); } }), null);
});

test("embedded image signatures must match PNG, JPEG or WebP rather than merely valid base64", () => {
  const image = (mimeType, data) => ({ type: "image", mimeType, data });
  const data = cad.buildCadResult({ calls: [{ tool: "render_preview", result: { content: [
    image("image/png", "aGVsbG8="), image("image/jpeg", "aGVsbG8="), image("image/webp", "aGVsbG8="),
    image("image/jpeg", realPng), image("image/png", "iVBORw0KGgo="),
    image("image/jpeg", Buffer.from([255, 216, 255, 0, 0]).toString("base64")),
    image("image/webp", Buffer.from("RIFF0000WEBP").toString("base64")),
    { type: "resource", resource: { uri: "buildcad://invalid", mimeType: "image/png", blob: "aGVsbG8=" } },
    image("image/png", realPng),
    image("image/jpeg", Buffer.from([255, 216, 255, 0, 255, 217]).toString("base64")),
    image("image/webp", Buffer.from("RIFF0000WEBP1234567890").toString("base64")),
  ] } }] });
  assert.deepEqual(data.images.map((item) => item.src), [
    `data:image/png;base64,${realPng}`,
    "data:image/jpeg;base64,/9j/AP/Z",
    "data:image/webp;base64,UklGRjAwMDBXRUJQMTIzNDU2Nzg5MA==",
  ]);
});
