// 隔离浏览器契约：真实 React 工作区对接受控的 HTTP 响应。
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const prefix = "/api/cad/buildcad";
const connected = { connected: true, endpoint: "https://buildcad.ai/mcp", transport: "streamableHttp", tools: [
  { name: "list_designs", description: "列出我的设计", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_design_code", description: "读取设计代码", inputSchema: { type: "object", properties: { designId: { type: "string" } }, required: ["designId"], additionalProperties: false } },
  { name: "render_preview", description: "静态四视图预览", inputSchema: { type: "object", properties: { code: { type: "string" }, views: { type: "array", items: { type: "string", enum: ["front", "back", "right", "left", "top", "bottom", "iso"] } } }, required: ["code"], additionalProperties: false } },
  { name: "save_design", description: "保存设计", inputSchema: { type: "object", properties: { designId: { type: "string" }, code: { type: "string" }, message: { type: "string" } }, required: ["designId", "code"], additionalProperties: false } },
] };
const imageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGAAAAABJRU5ErkJggg==";
const respond = (route, value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
let server, browser, base;

before(async () => {
  const { build } = await import(pathToFileURL(resolve(root, "frontend/monitor-react/node_modules/esbuild/lib/main.js")));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : "playwright-core");
  const compiled = await build({
    stdin: { resolveDir: resolve(root, "frontend/monitor-react/src/app/production-cad"), contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Workspace from './ProductionCadWorkspace.jsx'; createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(Workspace)));` },
    bundle: true, write: false, format: "iife", platform: "browser", loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"development"' },
  });
  server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": req.url === "/component.js" ? "application/javascript" : "text/html;charset=utf-8" });
    res.end(req.url === "/component.js" ? compiled.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script>');
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) });
});
after(async () => { await browser?.close(); if (server) await new Promise((done) => server.close(done)); });

test("disconnected workspace has one prompt, real connection status and no local modeling or manufacturing controls", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.route("**/api/**", (route) => respond(route, { connected: false, tools: [], error: "需要 BuildCAD 授权" }));
    await page.goto(`${base}/?view=cad`);
    await page.getByText("未连接", { exact: true }).waitFor();
    assert.equal(await page.locator("textarea").count(), 1);
    assert.equal(await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).isDisabled(), true);
    assert.equal(await page.locator('input[type="file"], canvas').count(), 0);
    assert.equal(await page.getByText(/结构化参数|确认当前设计版本|加工包|建模任务/).count(), 0);
    assert.match(await page.locator("form").innerText(), /save_design.*公开/);
    assert.equal(await page.getByRole("link", { name: "BuildCAD 官网" }).getAttribute("href"), "https://buildcad.ai");
  } finally { await context.close(); }
});

test("OAuth callback completes only once in StrictMode, cleans browser history, and uses the same redirect URI", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  try {
    await page.route("**/api/**", (route) => {
      if (route.request().method() === "POST") posts.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
      return respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : { connected: true });
    });
    await page.goto(`${base}/?view=cad&code=private-code&state=callback-nonce`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.deepEqual(posts, [{ path: `${prefix}/auth/complete`, body: { code: "private-code", state: "callback-nonce", redirect_uri: `${base}/?view=cad` } }]);
    assert.equal(page.url(), `${base}/?view=cad`);
    const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }));
    assert.doesNotMatch(stored, /private-code|callback-nonce/);
    await page.getByRole("button", { name: "断开连接", exact: true }).click();
    await page.getByText("未连接", { exact: true }).waitFor();
    assert.deepEqual(posts[1], { path: `${prefix}/auth/disconnect`, body: {} });
  } finally { await context.close(); }
});

test("connect begins server OAuth with the callback URI and navigates to the actual authorization URL", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const starts = [];
  const authorization = "https://buildcad.ai/oauth/authorize?state=server-state";
  try {
    await page.route("https://buildcad.ai/**", (route) => route.fulfill({ contentType: "text/html", body: "BuildCAD authorization" }));
    await page.route("**/api/**", (route) => {
      if (route.request().method() === "POST") { starts.push(route.request().postDataJSON()); return respond(route, { authorization_url: authorization, state: "server-state" }); }
      return respond(route, { connected: false, tools: [] });
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("未连接", { exact: true }).waitFor();
    await page.getByRole("button", { name: "连接 BuildCAD", exact: true }).click();
    await page.waitForURL(authorization);
    assert.deepEqual(starts, [{ redirect_uri: `${base}/?view=cad` }]);
  } finally { await context.close(); }
});

test("verified connection hides the login entry while preserving modeling and reauthorization after expiry", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let authorized = true;
  const writes = [];
  try {
    await page.route("**/api/**", (route) => {
      if (route.request().method() !== "GET") writes.push(route.request().url());
      return respond(route, authorized ? connected : { connected: false, tools: [], error_code: "authorization_required" });
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "连接 BuildCAD", exact: true }).count(), 0);
    await page.getByLabel("描述零件、尺寸和设计要求").fill("外径 30 mm、长度 50 mm 的销轴");
    assert.equal(await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).isEnabled(), true);
    await page.reload();
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "连接 BuildCAD", exact: true }).count(), 0);
    authorized = false;
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.getByText("未连接", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "连接 BuildCAD", exact: true }).isEnabled(), true);
    assert.equal(await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).isDisabled(), true);
    assert.deepEqual(writes, [], "更新界面不能断开授权或重新开始授权");
  } finally { await context.close(); }
});

test("one submission renders actual text, image, link and expandable MCP arguments/results, then restores by read only", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  const record = { run_id: "run-success", status: "completed", action: "preview", answer: "模型总结中的地址：https://buildcad.ai/design/invented-id", calls: [{ tool: "render_preview", arguments: { code: "from llmcad import *\n# 销轴 30 mm", views: ["front", "right", "top", "iso"] }, result: { content: [{ type: "text", text: "查看 https://buildcad.ai/design/returned-id" }, { type: "image", mimeType: "image/png", data: imageData }, { type: "image", mimeType: "image/svg+xml", data: "PHN2Zz4=" }], structuredContent: { unsafe_url: "javascript:alert(1)", design_id: "not-a-link" } } }] };
  try {
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/status")) return respond(route, connected);
      if (route.request().method() === "POST") { posts.push(route.request().postDataJSON()); return respond(route, { run_id: record.run_id, status: "running" }, 202); }
      return respond(route, record);
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    await page.getByLabel("描述零件、尺寸和设计要求").fill("销轴 30 mm");
    await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).click();
    await page.getByText(record.answer, { exact: true }).waitFor();
    assert.equal(posts.length, 1);
    assert.match(posts[0].command_id, /^[0-9a-f-]{36}$/i);
    assert.equal(posts[0].prompt, "销轴 30 mm");
    assert.equal(posts[0].action, "preview");
    assert.equal(posts[0].design_id, "");
    assert.equal(await page.locator(".cad-result-images img").count(), 1);
    assert.equal(await page.locator(".cad-result-images img").getAttribute("src"), `data:image/png;base64,${imageData}`);
    assert.equal(await page.getByRole("link", { name: "https://buildcad.ai/design/returned-id", exact: true }).getAttribute("href"), "https://buildcad.ai/design/returned-id");
    assert.equal(await page.locator('a[href="https://buildcad.ai/design/invented-id"]').count(), 0);
    assert.equal(await page.locator('a[href^="javascript:"],canvas').count(), 0);
    assert.match(await page.locator(".cad-result-images").innerText(), /静态预览/);
    assert.match(await page.locator(".production-cad").innerText(), /交互.*3D.*导出.*官网/);
    await page.locator(".cad-call-details > summary").click();
    await page.locator(".cad-call-details li summary").click();
    assert.match(await page.locator(".cad-call-details pre").first().innerText(), /销轴 30 mm/);
    assert.match(await page.locator(".cad-call-details pre").last().innerText(), /not-a-link/);
    await page.reload();
    await page.getByText(record.answer, { exact: true }).waitFor();
    assert.equal(posts.length, 1, "restoration must not resubmit the prompt");
  } finally { await context.close(); }
});

test("lost submission response blocks resubmission, survives refresh, and never retries a write", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let posts = 0;
  try {
    await page.route("**/api/**", (route) => {
      if (route.request().method() === "POST") { posts += 1; return route.abort("failed"); }
      return respond(route, connected);
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    await page.getByLabel("描述零件、尺寸和设计要求").fill("生成支架");
    await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).click();
    await page.getByText("结果待核对", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.reload();
    await page.getByText("结果待核对", { exact: true }).waitFor();
    assert.equal(posts, 1);
    await page.getByRole("button", { name: "已在 BuildCAD 核对，开始新需求", exact: true }).click();
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).isDisabled(), false);
    assert.equal(posts, 1);
  } finally { await context.close(); }
});

test("failed tool run shows the server error and retains real call evidence without successful-model claims", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await context.addInitScript(() => sessionStorage.setItem("buildcad.active-run", JSON.stringify({ run_id: "run-failed", prompt: "支架", command_id: "one" })));
    await page.route("**/api/**", (route) => respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : { run_id: "run-failed", status: "failed", error: "BuildCAD tool error: 尺寸不足", calls: [{ tool: "render_preview", arguments: { code: "from llmcad import *\n# 支架" }, result: { isError: true, content: [{ type: "text", text: "请补充尺寸" }] } }] }));
    await page.goto(`${base}/?view=cad`);
    await page.getByText("BuildCAD 请求失败", { exact: true }).waitFor();
    assert.equal(await page.getByText("BuildCAD 已返回结果", { exact: true }).count(), 0);
    assert.equal(await page.getByText("BuildCAD tool error: 尺寸不足", { exact: true }).count(), 1);
    assert.equal(await page.locator(".cad-call-details li").count(), 1);
  } finally { await context.close(); }
});

test("empty list plus fetch failed is classified as tool failure without raw JSON in the answer", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await context.addInitScript(() => sessionStorage.setItem("buildcad.active-run", JSON.stringify({ run_id: "run-empty-error", prompt: "支架", command_id: "one", action: "preview", design_id: "" })));
    await page.route("**/api/**", (route) => respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : { run_id: "run-empty-error", status: "failed", action: "preview", error: "BuildCAD tool error: fetch failed", calls: [
      { tool: "list_designs", arguments: {}, result: { content: [{ type: "text", text: "[]" }] } },
      { tool: "render_preview", arguments: { code: "from llmcad import *\n# 支架" }, result: { isError: true, content: [{ type: "text", text: "fetch failed" }] } },
    ] }));
    await page.goto(`${base}/?view=cad`);
    await page.getByText("BuildCAD 请求失败", { exact: true }).waitFor();
    assert.equal(await page.locator(".cad-result-text").count(), 0);
    assert.match(await page.locator(".cad-tool-errors").innerText(), /预览.*render_preview.*fetch failed/s);
    assert.match(await page.locator(".cad-design-empty").innerText(), /暂无.*设计/);
    assert.equal(await page.locator(".cad-result-images img, canvas").count(), 0);
    await page.locator(".cad-call-details > summary").click();
    assert.match(await page.locator(".cad-call-details").innerText(), /list_designs/);
    assert.equal(await page.locator(".cad-call-details li").count(), 2);
  } finally { await context.close(); }
});

test("save requires a real selected design and listing then reading code carries explicit actions", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  const code = "from llmcad import *\n# 远端返回的销轴代码";
  try {
    await page.route("**/api/**", (route) => {
      if (new URL(route.request().url()).pathname.endsWith("/status")) return respond(route, connected);
      assert.equal(route.request().method(), "POST");
      const body = route.request().postDataJSON(); posts.push(body);
      // Match the real API's required, non-empty prompt contract.
      if (typeof body.prompt !== "string" || !body.prompt.trim()) return respond(route, { detail: [{ loc: ["body", "prompt"], msg: "String should have at least 1 character" }] }, 422);
      if (body.action === "list_designs") return respond(route, { run_id: "run-list", status: "completed", action: "list_designs", designs: [{ design_id: "remote-pin", name: "我的销轴" }], calls: [{ tool: "list_designs", arguments: {}, result: { content: [{ type: "text", text: '[{"design_id":"remote-pin","name":"我的销轴"}]' }] } }] });
      if (body.action === "get_design_code") return respond(route, { run_id: "run-code", status: "completed", action: "get_design_code", design_id: "remote-pin", calls: [{ tool: "get_design_code", arguments: { designId: "remote-pin" }, result: { content: [{ type: "text", text: code }] } }] });
      return respond(route, { run_id: "run-save", status: "completed", action: "save", design_id: body.design_id, calls: [{ tool: "save_design", arguments: { designId: body.design_id, code }, result: { content: [{ type: "text", text: '{"url":"https://buildcad.ai/design/actual-pin"}' }] } }] });
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("操作方式").inputValue(), "preview");
    assert.equal(await page.locator('option[value="save"]').isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "读取设计代码", exact: true }).isDisabled(), true);
    assert.match(await page.locator(".cad-design-help").innerText(), /官网.*创建.*设计/);
    await page.getByRole("button", { name: "读取我的设计", exact: true }).click();
    assert.equal(posts[0].prompt, "读取我的BuildCAD设计");
    await page.getByLabel("我的 BuildCAD 设计").selectOption("remote-pin");
    assert.equal(await page.locator('option[value="save"]').isDisabled(), false);
    await page.getByRole("button", { name: "读取设计代码", exact: true }).click();
    assert.equal(posts[1].prompt, "读取选中设计代码");
    await page.locator(".cad-design-code pre").waitFor();
    assert.equal(await page.locator(".cad-design-code pre").innerText(), code);
    assert.equal(await page.locator(".cad-result-text").count(), 0);
    await page.getByLabel("描述零件、尺寸和设计要求").fill("长度改为 60 mm");
    await page.getByLabel("操作方式").selectOption("save");
    await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).click();
    await page.getByRole("link", { name: "https://buildcad.ai/design/actual-pin", exact: true }).waitFor();
    assert.deepEqual(posts.map(({ action, design_id }) => ({ action, design_id })), [
      { action: "list_designs", design_id: "" }, { action: "get_design_code", design_id: "remote-pin" }, { action: "save", design_id: "remote-pin" },
    ]);
    assert.equal(new Set(posts.map(({ command_id }) => command_id)).size, 3);
    assert.match(await page.locator(".cad-design-code summary").innerText(), /已保存代码/);
    assert.equal(await page.locator(".cad-design-code pre").innerText(), code);
  } finally { await context.close(); }
});

test("only verified tool capabilities enable actions and no list or save is sent automatically", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  try {
    await page.route("**/api/**", (route) => { if (route.request().method() === "POST") posts.push(route.request().postDataJSON()); return respond(route, { ...connected, tools: connected.tools.filter((tool) => tool.name === "render_preview") }); });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.deepEqual(await page.getByLabel("操作方式").locator("option").evaluateAll((options) => options.map((option) => option.value)), ["preview"]);
    assert.equal(await page.getByRole("button", { name: "读取我的设计", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "读取设计代码", exact: true }).count(), 0);
    assert.deepEqual(posts, []);
  } finally { await context.close(); }
});

test("read-only actions supply required intent even with an empty modeling prompt", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  try {
    await page.route("**/api/**", (route) => {
      if (new URL(route.request().url()).pathname.endsWith("/status")) return respond(route, { ...connected, tools: connected.tools.filter((tool) => ["list_designs", "get_design_code"].includes(tool.name)) });
      if (route.request().method() === "GET") return respond(route, { run_id: "read-code", action: "get_design_code", design_id: "remote-read", status: "completed", code: "from llmcad import *", calls: [] });
      const body = route.request().postDataJSON(); posts.push(body);
      if (typeof body.prompt !== "string" || !body.prompt.trim()) return respond(route, { detail: [{ loc: ["body", "prompt"], msg: "String should have at least 1 character" }] }, 422);
      if (body.action === "list_designs") return respond(route, { run_id: "read-list", action: "list_designs", status: "completed", designs: [{ design_id: "remote-read", name: "只读设计" }], calls: [] });
      return respond(route, { run_id: "read-code", action: "get_design_code", design_id: "remote-read", status: "completed", code: "from llmcad import *", calls: [] });
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "");
    await page.getByRole("button", { name: "读取我的设计", exact: true }).click();
    assert.equal(posts[0].prompt, "读取我的BuildCAD设计");
    await page.getByLabel("我的 BuildCAD 设计").selectOption("remote-read");
    await page.getByRole("button", { name: "读取设计代码", exact: true }).click();
    assert.equal(posts[1].prompt, "读取选中设计代码");
    await page.locator(".cad-design-code pre").waitFor();
    assert.deepEqual(posts.map(({ action, design_id }) => ({ action, design_id })), [{ action: "list_designs", design_id: "" }, { action: "get_design_code", design_id: "remote-read" }]);
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "");
    await page.reload();
    await page.locator(".cad-design-code pre").waitFor();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "", "internal read intent must not become a modeling request after refresh");
    assert.equal(posts.length, 2);
  } finally { await context.close(); }
});

test("restoring a saved operation preserves its design and refreshes only by GET", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const writes = [];
  try {
    await context.addInitScript(() => sessionStorage.setItem("buildcad.active-run", JSON.stringify({ run_id: "run-saved", prompt: "长度 60 mm", command_id: "saved-command", action: "save", design_id: "real-remote" })));
    await page.route("**/api/**", (route) => {
      if (route.request().method() !== "GET") writes.push(route.request().url());
      return respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : { run_id: "run-saved", status: "completed", action: "save", design_id: "real-remote", calls: [{ tool: "save_design", arguments: { designId: "real-remote", code: "// saved" }, result: { content: [{ type: "text", text: "已保存" }] } }] });
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("BuildCAD 已返回结果", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("操作方式").inputValue(), "save");
    assert.equal(await page.getByLabel("我的 BuildCAD 设计").inputValue(), "real-remote");
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.reload();
    await page.getByText("BuildCAD 已返回结果", { exact: true }).waitFor();
    assert.deepEqual(writes, []);
    assert.equal(await page.getByLabel("我的 BuildCAD 设计").inputValue(), "real-remote");
  } finally { await context.close(); }
});

test("missing dimensions show the model question without a success claim and allow a fresh submission", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  const question = "请补充支架的长度、宽度和高度（mm）。";
  try {
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/status")) return respond(route, connected);
      if (route.request().method() === "GET") return respond(route, { run_id: "needs-dimensions", status: "needs_input", action: "preview", answer: question, calls: [] });
      const body = route.request().postDataJSON(); posts.push(body);
      if (!body.prompt.includes("60 mm")) return respond(route, { run_id: "needs-dimensions", status: "needs_input", action: "preview", answer: question, calls: [] });
      return respond(route, { run_id: "preview-with-dimensions", status: "completed", action: "preview", calls: [{ tool: "render_preview", arguments: { code: "from llmcad import *\n# 支架 60 × 30 × 40 mm" }, result: { content: [{ type: "image", mimeType: "image/png", data: imageData }] } }] });
    });
    await page.goto(`${base}/?view=cad`);
    await page.getByText("已连接 · 工具列表已验证", { exact: true }).waitFor();
    await page.getByLabel("描述零件、尺寸和设计要求").fill("帮我设计一个支架");
    await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).click();
    await page.getByText("待补充需求（尚未建模）", { exact: true }).waitFor();
    assert.equal(await page.locator(".cad-result-text").innerText(), question);
    assert.equal(await page.getByText("BuildCAD 已返回结果", { exact: true }).count(), 0);
    assert.equal(await page.locator(".cad-badge.completed, .cad-result-images img, .cad-result-links").count(), 0);
    assert.doesNotMatch(await page.locator('[aria-labelledby="buildcad-result-title"]').innerText(), /保存成功|已保存|建模成功/);
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").isEnabled(), true);
    assert.equal(await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).isEnabled(), true);
    await page.reload();
    await page.getByText("待补充需求（尚未建模）", { exact: true }).waitFor();
    assert.equal(posts.length, 1, "restoring a clarification must remain read-only");
    // An explicit new attempt is distinct even before the user edits the prompt.
    await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).click();
    await page.getByText("待补充需求（尚未建模）", { exact: true }).waitFor();
    assert.notEqual(posts[1].command_id, posts[0].command_id);
    await page.getByLabel("描述零件、尺寸和设计要求").fill("支架长度 60 mm、宽度 30 mm、高度 40 mm");
    await page.getByRole("button", { name: "提交给 BuildCAD", exact: true }).click();
    await page.getByText("BuildCAD 已返回结果", { exact: true }).waitFor();
    assert.equal(posts[2].prompt, "支架长度 60 mm、宽度 30 mm、高度 40 mm");
    assert.equal(new Set(posts.map((post) => post.command_id)).size, 3);
    assert.equal(await page.getByText(question, { exact: true }).count(), 0);
  } finally { await context.close(); }
});

test("code output follows actual read, preview and save results and explains empty designs", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const oldCode = "from llmcad import *\n# 旧代码";
  const newCode = "from llmcad import *\n# 本轮修改代码";
  let current = { run_id: "code-source", status: "completed", action: "save", design_id: "actual-pin", calls: [
    { tool: "get_design_code", arguments: { designId: "actual-pin" }, result: { content: [{ type: "text", text: oldCode }] } },
    { tool: "render_preview", arguments: { code: newCode }, result: { content: [{ type: "image", mimeType: "image/png", data: imageData }] } },
    { tool: "save_design", arguments: { designId: "actual-pin", code: newCode }, result: { content: [{ type: "text", text: "已保存" }] } },
  ] };
  try {
    await context.addInitScript(() => sessionStorage.setItem("buildcad.active-run", JSON.stringify({ run_id: "code-source", prompt: "长度改为 60 mm", command_id: "code-command", action: "save", design_id: "actual-pin" })));
    await page.route("**/api/**", (route) => respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : current));
    await page.goto(`${base}/?view=cad`);
    await page.getByText("BuildCAD 已返回结果", { exact: true }).waitFor();
    assert.equal(await page.locator(".cad-design-code pre").innerText(), newCode);
    assert.match(await page.locator(".cad-design-code summary").innerText(), /已保存代码/);
    current = { ...current, status: "failed", error: "save failed", calls: [...current.calls.slice(0, 2), { tool: "save_design", arguments: { designId: "actual-pin", code: newCode }, result: { isError: true, content: [{ type: "text", text: "save failed" }] } }] };
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.getByText("BuildCAD 请求失败", { exact: true }).waitFor();
    assert.equal(await page.locator(".cad-design-code pre").innerText(), newCode);
    assert.match(await page.locator(".cad-design-code summary").innerText(), /本轮预览代码/);
    assert.doesNotMatch(await page.locator(".cad-design-code summary").innerText(), /已保存/);
    current = { run_id: "code-source", status: "completed", action: "get_design_code", code: "", calls: [{ tool: "get_design_code", arguments: { designId: "actual-pin" }, result: { content: [{ type: "text", text: '{"code":""}' }] } }] };
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.getByText("该设计暂为空代码", { exact: true }).waitFor();
    assert.match(await page.locator(".cad-design-code summary").innerText(), /读取的设计代码/);
    assert.equal(await page.locator(".cad-design-code pre").count(), 0);
  } finally { await context.close(); }
});

test("trace rows with only an error show failure or uncertainty and preserve the error code", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let current = { run_id: "row-error", status: "failed", action: "preview", error: "BuildCAD code 必须是可解析的 llmcad Python 代码", calls: [{ tool: "render_preview", arguments: { code: "invalid" }, error: "tool_failed" }] };
  try {
    await context.addInitScript(() => sessionStorage.setItem("buildcad.active-run", JSON.stringify({ run_id: "row-error", prompt: "销轴", command_id: "row-error-command" })));
    await page.route("**/api/**", (route) => respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : current));
    await page.goto(`${base}/?view=cad`);
    await page.getByText("BuildCAD 请求失败", { exact: true }).waitFor();
    await page.locator(".cad-call-details > summary").click();
    assert.match(await page.locator(".cad-call-details li summary").innerText(), /render_preview.*失败/);
    assert.doesNotMatch(await page.locator(".cad-call-details li summary").innerText(), /已返回/);
    await page.locator(".cad-call-details li summary").click();
    assert.match(await page.locator(".cad-call-details li pre").last().innerText(), /tool_failed/);
    current = { run_id: "row-error", status: "outcome_unknown", action: "save", error: "BuildCAD 请求超时，结果尚不确定", calls: [{ tool: "save_design", arguments: { designId: "actual-pin", code: "from llmcad import *" }, error: "outcome_unknown" }] };
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.getByText("结果待核对", { exact: true }).waitFor();
    assert.match(await page.locator(".cad-call-details li summary").innerText(), /save_design.*结果待核对/);
    assert.match(await page.locator(".cad-call-details li pre").last().innerText(), /outcome_unknown/);
    assert.equal(await page.locator(".cad-design-code").count(), 0);
  } finally { await context.close(); }
});

test("valid base64 without an image signature never creates a preview frame", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await context.addInitScript(() => sessionStorage.setItem("buildcad.active-run", JSON.stringify({ run_id: "invalid-image", prompt: "销轴", command_id: "image-command" })));
    await page.route("**/api/**", (route) => respond(route, new URL(route.request().url()).pathname.endsWith("/status") ? connected : { run_id: "invalid-image", status: "failed", action: "preview", error: "工具未返回有效预览图", calls: [{ tool: "render_preview", arguments: { code: "from llmcad import *" }, result: { content: [{ type: "image", mimeType: "image/png", data: "aGVsbG8=" }] } }] }));
    await page.goto(`${base}/?view=cad`);
    await page.getByText("BuildCAD 请求失败", { exact: true }).waitFor();
    assert.equal(await page.locator(".cad-result-images").count(), 0);
  } finally { await context.close(); }
});
