// 浏览器契约使用受控服务响应与真实 STL 字节，真实组件、加载器及 WebGL 保持运行。
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const prefix = "/api/cad/freecad";
const id = `FC-${"a".repeat(64)}`;
const prompt = "设计长 40 mm、宽 20 mm、高 10 mm 的长方体";
const connected = { connected: true, provider: "freecad", tools: [{ name: "execute_code", description: "执行 FreeCAD 代码", inputSchema: { type: "object", properties: { code: { type: "string" } }, required: ["code"] } }] };
const artifacts = ["stl", "step", "fcstd"].map((format) => ({ name: `model.${format}`, format, url: `${prefix}/runs/${id}/artifacts/model.${format}` }));
const completed = { run_id: id, prompt, status: "completed", answer: "已创建并校验实体。", artifacts, validation: { valid: true, solid_count: 1, volume_mm3: 8000, bounds_mm: [40, 20, 10] }, execution: { agent: "cad", node: "model_3d", skill: "production_modeling_skill", tool: "freecad_mcp" }, calls: [{ tool: "execute_code", arguments: { code: "shape = Part.makeBox(40, 20, 10)" }, result: { content: [{ type: "text", text: "实体校验通过" }] } }] };
// 手工定义的闭合长方体：12 个三角面，尺寸 40 × 20 × 10 mm。
function boxStl() {
  const vertices = [[0,0,0],[40,0,0],[40,20,0],[0,20,0],[0,0,10],[40,0,10],[40,20,10],[0,20,10]];
  const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const buffer = Buffer.alloc(84 + faces.length * 50);
  buffer.writeUInt32LE(faces.length, 80);
  faces.forEach((face, i) => face.forEach((vertex, j) => vertices[vertex].forEach((value, axis) => buffer.writeFloatLE(value, 84 + i * 50 + 12 + j * 12 + axis * 4))));
  return buffer;
}
const respond = (route, value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
let server, browser, base;
before(async () => {
  const { build } = await import(pathToFileURL(resolve(root, "frontend/monitor-react/node_modules/esbuild/lib/main.js")));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : "playwright-core");
  const compiled = await build({ stdin: { resolveDir: resolve(root, "frontend/monitor-react/src/app/production-cad"), contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Workspace from './ProductionCadWorkspace.jsx'; createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(Workspace)));` }, bundle: true, write: false, format: "iife", platform: "browser", loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"development"' } });
  server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": req.url === "/component.js" ? "application/javascript" : "text/html;charset=utf-8" });
    res.end(req.url === "/component.js" ? compiled.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><style>body{margin:20px}.cad-viewport{width:800px;height:440px}</style><div id="root"></div><script src="/component.js"></script>');
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}), args: ["--enable-unsafe-swiftshader"] });
});
after(async () => { await browser?.close(); if (server) await new Promise((done) => server.close(done)); });

async function setup({ record = completed, saved = false, stl = boxStl(), status = connected, webgl = true, postFailure = false, getRecord } = {}) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const posts = [], reads = [], errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (saved) await page.addInitScript(({ runId, prompt }) => { if (!sessionStorage.getItem("freecad.active-run")) sessionStorage.setItem("freecad.active-run", JSON.stringify({ run_id: runId, prompt, command_id: "existing-command", draft_prompt: prompt })); }, { runId: id, prompt });
  if (!webgl) await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith("webgl") ? null : original.call(this, type, ...args); }; });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `${prefix}/status`) return respond(route, status);
    if (path.endsWith("/artifacts/model.stl")) return route.fulfill({ status: 200, contentType: "model/stl", body: stl });
    if (route.request().method() === "POST") {
      posts.push({ path, ...route.request().postDataJSON() });
      if (postFailure) return route.abort("connectionreset");
      return respond(route, { run_id: id, prompt: record.prompt, status: "running" }, 202);
    }
    reads.push(path);
    return respond(route, getRecord ? getRecord(reads.length) : record);
  });
  await page.goto(base);
  return { context, page, posts, reads, errors };
}

test("提交本地 FreeCAD 后加载真实 STL，旋转/缩放/复位有效并提供三种导出", async () => {
  const { context, page, posts, errors } = await setup();
  try {
    await page.getByLabel("描述零件、尺寸和设计要求").fill(prompt);
    await page.getByRole("button", { name: "生成 3D 模型", exact: true }).click();
    const canvas = page.getByLabel("FreeCAD 三维模型");
    await canvas.waitFor();
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].path, `${prefix}/runs`);
    assert.equal(posts[0].prompt, prompt);
    assert.ok(posts[0].command_id);
    const initial = await canvas.screenshot();
    const center = await canvas.evaluate((element) => new Promise((done) => requestAnimationFrame(() => {
      const gl = element.getContext("webgl2"), pixel = new Uint8Array(4);
      gl.readPixels(element.width / 2, element.height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      done(Array.from(pixel));
    })));
    assert.ok(center[1] > center[0] + 15 && center[2] > center[0] + 15, `中心应为真实青色实体，实际 RGBA=${center}`);
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 330, box.y + 220);
    await page.mouse.down(); await page.mouse.move(box.x + 480, box.y + 280, { steps: 12 }); await page.mouse.up();
    await page.waitForTimeout(400);
    assert.notDeepEqual(await canvas.screenshot(), initial, "拖动必须改变真实画布中的视角");
    await page.mouse.wheel(0, -320); await page.waitForTimeout(300);
    const zoomed = await canvas.screenshot();
    await page.getByRole("button", { name: "复位视角", exact: true }).click();
    await page.waitForTimeout(300);
    assert.notDeepEqual(await canvas.screenshot(), zoomed, "复位应重新取景");
    await page.getByRole("button", { name: "自动旋转", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "自动旋转", exact: true }).getAttribute("aria-pressed"), "true");
    for (const type of ["STL", "STEP", "FCStd"]) assert.match(await page.getByRole("link", { name: `下载 ${type}`, exact: true }).getAttribute("href"), /\/artifacts\/model\./);
    assert.match(await page.locator(".cad-validation").innerText(), /40.*20.*10/);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("填入示例只编辑需求，不会自动执行，并说明人工修改与生产边界", async () => {
  const { context, page, posts } = await setup();
  try {
    await page.getByRole("button", { name: "填入带通孔销轴示例", exact: true }).click();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "外径30mm、长50mm的销轴，带同轴通孔直径10mm");
    assert.equal(posts.length, 0);
    assert.match(await page.locator(".cad-input-flow").innerText(), /production_modeling_skill.*freecad_mcp/);
    assert.match(await page.locator(".cad-review-note").innerText(), /FCStd.*FreeCAD.*人工.*不.*启动/);
  } finally { await context.close(); }
});

test("高级放样示例保留完整参数，人工核对后才提交到唯一 MCP 接口", async () => {
  const { context, page, posts } = await setup();
  try {
    await page.getByLabel('高级建模示例').selectOption('loft');
    const input = page.getByLabel('结构化参数（JSON，优先于文字描述）');
    const spec = JSON.parse(await input.inputValue());
    assert.equal(spec.operations[0].type, 'loft');
    assert.deepEqual(spec.operations[0].sections.map((v) => v.z), [0, 30, 60]);
    assert.equal(posts.length, 0);
    assert.equal(await page.getByRole('button', { name: '生成 3D 模型', exact: true }).isDisabled(), true);
    await page.getByLabel('我已核对以上结构化参数').check();
    await page.getByRole('button', { name: '生成 3D 模型', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.deepEqual(posts[0].spec, spec);
    assert.equal(posts[0].path, `${prefix}/runs`);
  } finally { await context.close(); }
});

test("结构化 JSON 错误不能发送，编辑参数后需要重新人工核对", async () => {
  const { context, page, posts } = await setup();
  try {
    await page.getByLabel('高级建模示例').selectOption('assembly');
    const checkbox = page.getByLabel('我已核对以上结构化参数');
    await checkbox.check();
    await page.getByLabel('结构化参数（JSON，优先于文字描述）').fill('{');
    assert.equal(await checkbox.isChecked(), false);
    await checkbox.check();
    await page.getByRole('button', { name: '生成 3D 模型', exact: true }).click();
    await page.getByText(/结构化参数不是有效 JSON/).waitFor();
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

test("正四面体示例可编辑边长，仍经唯一 MCP 接口提交并显示拓扑校验", async () => {
  const tetraPrompt = "正四面体（立体三角形、四面相同、边长120mm）";
  const { context, page, posts } = await setup({ record: { ...completed, prompt: tetraPrompt,
    validation: { ...completed.validation, face_count: 4, edge_count: 6, edge_lengths_mm: [120,120,120,120,120,120] } } });
  try {
    await page.getByRole("button", { name: "填入正四面体示例", exact: true }).click();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "正四面体（立体三角形、四面相同、边长100mm）");
    assert.equal(posts.length, 0);
    await page.getByLabel("描述零件、尺寸和设计要求").fill(tetraPrompt);
    await page.getByRole("button", { name: "生成 3D 模型", exact: true }).click();
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.equal(posts[0].prompt, tetraPrompt);
    assert.equal(posts[0].path, `${prefix}/runs`);
    assert.match(await page.locator(".cad-validation").innerText(), /4 个面.*6 条边/);
    assert.equal(await page.getByRole("link", { name: "下载 FCStd", exact: true }).count(), 1);
  } finally { await context.close(); }
});

test("刷新页面恢复原始需求和结果，手动刷新只读且保留未提交草稿", async () => {
  const { context, page, posts, reads } = await setup({ saved: true });
  try {
    await page.getByText("模型已加载", { exact: false }).waitFor();
    const draft = "下一件零件的待编辑草稿";
    await page.getByLabel("描述零件、尺寸和设计要求").fill(draft);
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.reload();
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), draft);
    assert.equal(await page.locator(".cad-submitted-prompt").innerText(), prompt);
    assert.equal(posts.length, 0);
    assert.ok(reads.filter((path) => path.endsWith(id)).length >= 2);
  } finally { await context.close(); }
});

test("待补充尺寸不会显示模型或导出按钮，用户可补充需求", async () => {
  const { context, page, posts } = await setup({ record: { run_id: id, prompt: "设计销轴", status: "needs_input", answer: "请补充外径和长度（mm）。", artifacts: [], calls: [] } });
  try {
    await page.getByLabel("描述零件、尺寸和设计要求").fill("设计销轴");
    await page.getByRole("button", { name: "生成 3D 模型", exact: true }).click();
    await page.getByText("请补充外径和长度（mm）。", { exact: true }).waitFor();
    assert.equal(await page.locator("canvas").count(), 0);
    assert.equal(await page.getByRole("link", { name: /^下载 / }).count(), 0);
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").isEnabled(), true);
    assert.equal(posts.length, 1);
  } finally { await context.close(); }
});

test("没有合格 STL 时明确告知，失败结果不能借用附件宣称生成成功", async () => {
  for (const record of [{ ...completed, artifacts: [] }, { ...completed, status: "failed", error: "实体校验未通过" }, { ...completed, validation: { valid: false, solid_count: 0 } }]) {
    const { context, page } = await setup({ saved: true, record });
    try {
      await page.getByText(/没有可展示的 STL 模型/).waitFor();
      assert.equal(await page.locator("canvas").count(), 0);
      assert.equal(await page.getByRole("link", { name: /^下载 / }).count(), 0);
    } finally { await context.close(); }
  }
});

test("损坏 STL 与 WebGL 不可用时明确报错，仍可下载已校验的文件", async () => {
  for (const options of [{ stl: Buffer.from("not an STL") }, { webgl: false }]) {
    const { context, page } = await setup({ saved: true, ...options });
    try {
      await page.locator(".cad-viewer-error").waitFor();
      assert.match(await page.locator(".cad-viewer-error").innerText(), /STL|WebGL/);
      assert.equal(await page.getByRole("link", { name: "下载 STEP", exact: true }).count(), 1);
    } finally { await context.close(); }
  }
});

test("断连时禁用生成，不存在 OAuth 或远端设计操作", async () => {
  const { context, page, posts } = await setup({ status: { connected: false, provider: "freecad", tools: [], error: "本地 FreeCAD MCP 未连接" } });
  try {
    await page.getByText("本地 FreeCAD MCP 未连接", { exact: true }).waitFor();
    await page.getByLabel("描述零件、尺寸和设计要求").fill(prompt);
    assert.equal(await page.getByRole("button", { name: "生成 3D 模型", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: /BuildCAD|授权|读取我的设计/ }).count(), 0);
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

test("提交响应中断保留命令身份，刷新与重进页面不自动重新建模", async () => {
  const { context, page, posts } = await setup({ postFailure: true });
  try {
    await page.getByLabel("描述零件、尺寸和设计要求").fill(prompt);
    await page.getByRole("button", { name: "生成 3D 模型", exact: true }).click();
    await page.getByText("结果待核对", { exact: true }).waitFor();
    const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("freecad.active-run")));
    assert.equal(saved.command_id, posts[0].command_id);
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.reload();
    await page.getByRole("heading", { name: "FreeCAD 本地建模", exact: true }).waitFor();
    assert.equal(posts.length, 1);
  } finally { await context.close(); }
});

test("运行期间手动刷新后继续自动查询，最终展示模型", async () => {
  let ready = false;
  const { context, page, posts, reads } = await setup({ saved: true, getRecord: () => ready ? completed : { run_id: id, prompt, status: "running", calls: [] } });
  try {
    await page.getByText("FreeCAD 正在建模", { exact: true }).waitFor();
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    await page.getByRole("button", { name: "刷新状态", exact: true }).waitFor();
    ready = true;
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.ok(reads.length >= 3);
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});
