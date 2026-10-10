// 浏览器契约使用受控服务响应与真实 STL 字节，真实组件、加载器及 WebGL 保持运行。
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL("../../", import.meta.url));
const prefix = "/api/cad/freecad";
const id = `FC-${"a".repeat(64)}`;
const prompt = "设计长 40 mm、宽 20 mm、高 10 mm 的长方体";
const connected = { connected: true, part_identity_supported: true, provider: "freecad", tools: [{ name: "execute_code", description: "执行 FreeCAD 代码", inputSchema: { type: "object", properties: { code: { type: "string" } }, required: ["code"] } }] };
const artifacts = ["stl", "step", "fcstd"].map((format) => ({ name: `model.${format}`, format, url: `${prefix}/runs/${id}/artifacts/model.${format}` }));
const completed = { run_id: id, prompt, status: "completed", answer: "已创建并校验实体。", artifacts, validation: { valid: true, solid_count: 1, volume_mm3: 8000, bounds_mm: [40, 20, 10] }, execution: { agent: "cad", node: "model_3d", skill: "production_modeling_skill", tool: "freecad_mcp" }, calls: [{ tool: "execute_code", arguments: { code: "shape = Part.makeBox(40, 20, 10)" }, result: { content: [{ type: "text", text: "实体校验通过" }] } }] };

test('清空质检页面后零件和装配结果不再显示旧质检快捷入口，建模结果仍保留', async()=>{
  const spec={units:'mm',operations:[{type:'box',mode:'add',length:40,width:20,height:10,position:[0,0,0]}]};
  const first=await setup({saved:true,record:{...completed,spec}});
  try {
    await first.page.getByRole('heading',{name:'模型与图纸',exact:true}).waitFor();
    assert.equal(await first.page.getByRole('link',{name:'按此图纸检验生产零件',exact:true}).count(),0);
    assert.equal(first.posts.length,0);
  } finally {await first.context.close();}
  const assembly=await setup({saved:true,record:{...completed,spec:{units:'mm',parts:[]}}});
  try {
    await assembly.page.getByRole('heading',{name:'模型与图纸',exact:true}).waitFor();
    assert.equal(await assembly.page.getByRole('link',{name:'按此图纸检验生产零件',exact:true}).count(),0);
  } finally {await assembly.context.close();}
});
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
  const stylesheet = readFileSync(resolve(root, 'frontend/monitor-react/src/app/production-cad/productionCad.css'), 'utf8');
  server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": req.url === "/component.js" ? "application/javascript" : "text/html;charset=utf-8" });
    res.end(req.url === "/component.js" ? compiled.outputFiles[0].text : `<!doctype html><meta charset="utf-8"><style>${stylesheet}\nbody{margin:20px}.cad-viewport{width:800px;height:440px}</style><div id="root"></div><script src="/component.js"></script>`);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}), args: ["--enable-unsafe-swiftshader"] });
});
after(async () => { await browser?.close(); if (server) await new Promise((done) => server.close(done)); });

async function setup({ record = completed, saved = false, stl = boxStl(), status = connected, webgl = true, postFailure = false, getRecord, postRecord, files = {}, statusGate } = {}) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const posts = [], reads = [], errors = [], artifactReads = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (saved) await page.addInitScript(({ runId, prompt }) => { if (!sessionStorage.getItem("freecad.active-run")) sessionStorage.setItem("freecad.active-run", JSON.stringify({ run_id: runId, prompt, command_id: "existing-command", draft_prompt: prompt })); }, { runId: id, prompt: record.prompt ?? prompt });
  if (!webgl) await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith("webgl") ? null : original.call(this, type, ...args); }; });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `${prefix}/status`) return statusGate ? statusGate.then(() => respond(route, status)) : respond(route, status);
    if (path.includes('/artifacts/')) {
      const name = path.split('/').at(-1);
      artifactReads.push(name);
      if (Object.hasOwn(files, name)) {
        const file = files[name];
        return route.fulfill({ status: file.status || 200, contentType: file.type, body: file.body });
      }
    }
    if (path.endsWith("/artifacts/model.stl")) return route.fulfill({ status: 200, contentType: "model/stl", body: stl });
    if (route.request().method() === "POST") {
      posts.push({ path, ...route.request().postDataJSON() });
      if (postFailure) return route.abort("connectionreset");
      if (postRecord) return respond(route, postRecord(posts.at(-1)), 202);
      return respond(route, { run_id: id, prompt: record.prompt, status: "running" }, 202);
    }
    reads.push(path);
    return respond(route, getRecord ? getRecord(reads.length, path) : record);
  });
  await page.goto(base);
  return { context, page, posts, reads, errors, artifactReads };
}

async function openDesignInput(page) {
  const input = page.locator('.cad-input-details');
  if (await input.count() && !await input.evaluate((element) => element.open)) await input.locator(':scope > summary').click();
}

async function openTemplates(page) {
  await openDesignInput(page);
  await page.getByText('模板与示例', { exact: true }).click();
}

test('零件名称和编号随实际建模请求提交，生成后收起需求并显示明确标识', async () => {
  const named = { ...completed, part_name: '带通孔销轴', part_number: '00123' };
  const { context, page, posts, errors } = await setup({ record: named });
  try {
    await page.getByLabel('零件名称', { exact: true }).fill(named.part_name);
    await page.getByLabel('零件编号（选填）', { exact: true }).fill(named.part_number);
    await page.getByLabel('描述零件、尺寸和设计要求').fill(prompt);
    assert.equal(await page.getByLabel('选择设计模板').isVisible(), false);
    assert.equal(await page.getByLabel('结构化参数（JSON，优先于文字描述）').isVisible(), false);
    await page.getByRole('button', { name: '生成 3D 模型', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].part_name, named.part_name);
    assert.equal(posts[0].part_number, named.part_number);
    assert.equal(posts[0].prompt, prompt);
    const identity = page.getByRole('region', { name: '当前零件标识', exact: true });
    assert.match(await identity.innerText(), /带通孔销轴.*零件编号.*00123/s);
    assert.equal(await page.getByLabel('描述零件、尺寸和设计要求').isVisible(), false);
    assert.equal(await page.locator('.cad-call-details').evaluate((element) => element.open), false);
    assert.equal(await page.getByRole('link', { name: '下载 STEP', exact: true }).isVisible(), true);
    await captureWorkbench(page, 'compact-named-design');
    await page.reload();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.match(await identity.innerText(), /带通孔销轴.*00123/s);
    assert.equal(posts.length, 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('修改新零件草稿不能改旧模型名称，应用图上修改沿用当前零件标识', async () => {
  const named = { ...completed, part_name: '带通孔销轴', part_number: 'PIN-001',
    spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts } = await setup({ saved: true, record: named });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await openDesignInput(page);
    await page.getByLabel('零件名称', { exact: true }).fill('下一零件');
    await page.getByLabel('零件编号（选填）', { exact: true }).fill('00234');
    const identity = page.getByRole('region', { name: '当前零件标识', exact: true });
    assert.match(await identity.innerText(), /带通孔销轴.*设计短号.*11530/s);
    await page.getByRole('button', { name: '修改设计', exact: true }).click();
    await page.getByRole('region', { name: '修改当前设计', exact: true }).getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true }).fill('65');
    await page.getByLabel('我已核对修改后的尺寸与特征').check();
    await page.getByRole('button', { name: '应用修改，生成新版本', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts[0].part_name, named.part_name);
    assert.equal(posts[0].part_number, named.part_number);
    assert.equal(posts[0].spec.operations[0].length, 65);
    await page.reload();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await openDesignInput(page);
    assert.equal(await page.getByLabel('零件名称', { exact: true }).inputValue(), '下一零件');
    assert.equal(await page.getByLabel('零件编号（选填）', { exact: true }).inputValue(), '00234');
    assert.match(await identity.innerText(), /带通孔销轴.*11530/s);
    await page.getByText('技术记录', { exact: true }).click();
    assert.match(await page.locator('.cad-call-details').innerText(), /原始零件编号：PIN-001/);
  } finally { await context.close(); }
});

test('历史未命名设计显示五位短号，查询下载仍使用完整编号，模板不会自动执行', async () => {
  const { context, page, posts, reads } = await setup({ saved: true });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    const identity = page.getByRole('region', { name: '当前零件标识', exact: true });
    assert.match(await identity.innerText(), /设计短号.*11530/s);
    assert.equal(await identity.locator('strong').innerText(), '11530');
    assert.equal(await page.getByRole('link', { name: '下载 STEP', exact: true }).getAttribute('href'), `${prefix}/runs/${id}/artifacts/model.step`);
    assert.ok(reads.includes(`${prefix}/runs/${id}`));
    await page.getByText('技术记录', { exact: true }).click();
    assert.match(await page.locator('.cad-call-details').innerText(), new RegExp(id));
    await openDesignInput(page);
    assert.equal(await page.getByLabel('选择设计模板').isVisible(), false);
    await openTemplates(page);
    await page.getByRole('button', { name: '填入带通孔销轴示例', exact: true }).click();
    assert.equal(await page.getByLabel('零件名称', { exact: true }).inputValue(), '带通孔销轴');
    assert.equal(await page.getByRole('region', { name: '当前零件标识', exact: true }).getByText('带通孔销轴', { exact: true }).count(), 0);
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

test('旧版建模服务不支持标识字段时仍能生成，名称只按当前版本保存到浏览器会话', async () => {
  const { context, page, posts } = await setup({ status: { ...connected, part_identity_supported: false } });
  try {
    await page.getByLabel('零件名称', { exact: true }).fill('长方体试件');
    await page.getByLabel('零件编号（选填）', { exact: true }).fill('00345');
    await page.getByLabel('描述零件、尺寸和设计要求').fill(prompt);
    await page.getByRole('button', { name: '生成 3D 模型', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(Object.hasOwn(posts[0], 'part_name'), false);
    assert.equal(Object.hasOwn(posts[0], 'part_number'), false);
    const identity = page.getByRole('region', { name: '当前零件标识', exact: true });
    assert.match(await identity.innerText(), /长方体试件.*00345/s);
    await page.reload();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.match(await identity.innerText(), /长方体试件.*00345/s);
    assert.equal(posts.length, 1);
  } finally { await context.close(); }
});

test('新编号只接受五位数字，非法草稿不能发起建模，前导零不丢失', async () => {
  const { context, page, posts } = await setup();
  try {
    await page.getByLabel('描述零件、尺寸和设计要求').fill(prompt);
    const number = page.getByLabel('零件编号（选填）', { exact: true });
    const generate = page.getByRole('button', { name: '生成 3D 模型', exact: true });
    assert.equal(await number.getAttribute('maxlength'), '5');
    assert.equal(await number.getAttribute('inputmode'), 'numeric');
    for (const invalid of ['1234', '12a45']) {
      await number.fill(invalid);
      assert.equal(await generate.isDisabled(), true);
      assert.equal(await number.getAttribute('aria-invalid'), 'true');
      assert.equal(posts.length, 0);
    }
    await number.fill('00123');
    assert.equal(await generate.isDisabled(), false);
    await generate.click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].part_number, '00123');
    assert.equal(await page.getByRole('region', { name: '当前零件标识', exact: true }).locator('strong').innerText(), '00123');
  } finally { await context.close(); }
});

// 检查实际 WebGL 像素，防止材质或灯光使零件重新偏绿、偏蓝。
async function assertNeutralPreview(canvas) {
  const pixels = await canvas.evaluate((element) => new Promise((done) => requestAnimationFrame(() => {
    const gl = element.getContext('webgl2'), rgba = new Uint8Array(element.width * element.height * 4);
    gl.readPixels(0, 0, element.width, element.height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    let colored = 0, foreground = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      const rgb = [rgba[i], rgba[i + 1], rgba[i + 2]];
      if (Math.max(...rgb) - Math.min(...rgb) > 5) colored += 1;
      if (Math.max(...rgb) < 230 && rgba[i + 3] === 255) foreground += 1;
    }
    done({ colored, foreground, total: element.width * element.height });
  })));
  assert.equal(pixels.colored, 0, `预览应为中性银灰色，不应出现绿色或蓝色偏色：${JSON.stringify(pixels)}`);
  assert.ok(pixels.foreground > pixels.total * 0.01, '画布必须显示真实实体，不能只显示空白背景');
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
    assert.ok(Math.max(...center.slice(0, 3)) - Math.min(...center.slice(0, 3)) <= 5 && center[0] < 230 && center[3] === 255,
      `中心应为真实银灰色实体，实际 RGBA=${center}`);
    await assertNeutralPreview(canvas);
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
    await openTemplates(page);
    await page.getByRole("button", { name: "填入带通孔销轴示例", exact: true }).click();
    assert.equal(await page.getByRole("heading", { name: "FreeCAD MCP 连接", exact: true }).count(), 0);
    assert.equal(await page.getByText(/可用工具 ·/).count(), 0);
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "外径30mm、长50mm的销轴，带同轴通孔直径10mm");
    assert.equal(posts.length, 0);
    assert.match(await page.getByRole('list', { name: '设计步骤' }).innerText(), /描述需求.*生成模型与图纸.*修改设计与导出/s);
    await page.getByText('设计范围与使用说明', { exact: true }).click();
    assert.match(await page.locator(".cad-review-note").innerText(), /FCStd.*编辑.*不.*启动/);
  } finally { await context.close(); }
});

test("高级放样示例保留完整参数，人工核对后才提交到唯一 MCP 接口", async () => {
  const { context, page, posts } = await setup();
  try {
    await openTemplates(page);
    await page.getByLabel('选择设计模板').selectOption('loft');
    await page.getByText('专业设置', { exact: true }).click();
    const input = page.getByLabel('结构化参数（JSON，优先于文字描述）');
    const spec = JSON.parse(await input.inputValue());
    assert.equal(spec.operations[0].type, 'loft');
    assert.deepEqual(spec.operations[0].sections.map((v) => v.z), [0, 30, 60]);
    assert.equal(posts.length, 0);
    assert.equal(await page.getByRole('button', { name: '生成 3D 模型', exact: true }).isDisabled(), true);
    await page.getByLabel('我已核对设计尺寸与参数').check();
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
    await openTemplates(page);
    await page.getByLabel('选择设计模板').selectOption('assembly');
    await page.getByText('专业设置', { exact: true }).click();
    const checkbox = page.getByLabel('我已核对设计尺寸与参数');
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
    await openTemplates(page);
    await page.getByRole("button", { name: "填入正四面体示例", exact: true }).click();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), "正四面体（立体三角形、四面相同、边长100mm）");
    assert.equal(posts.length, 0);
    await page.getByLabel("描述零件、尺寸和设计要求").fill(tetraPrompt);
    await page.getByRole("button", { name: "生成 3D 模型", exact: true }).click();
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.equal(posts[0].prompt, tetraPrompt);
    assert.equal(posts[0].path, `${prefix}/runs`);
    await page.getByText('技术记录', { exact: true }).click();
    await page.getByText('几何检查详情', { exact: true }).click();
    const proof = JSON.parse(await page.getByText('几何检查详情', { exact: true }).locator('..').locator('pre').innerText());
    assert.equal(proof.face_count, 4); assert.equal(proof.edge_count, 6);
    assert.equal(await page.getByRole("link", { name: "下载 FCStd", exact: true }).count(), 1);
  } finally { await context.close(); }
});

test("刷新页面恢复原始需求和结果，手动刷新只读且保留未提交草稿", async () => {
  const { context, page, posts, reads } = await setup({ saved: true });
  try {
    await page.getByText("模型已加载", { exact: false }).waitFor();
    const draft = "下一件零件的待编辑草稿";
    await openDesignInput(page);
    await page.getByLabel("描述零件、尺寸和设计要求").fill(draft);
    await page.getByRole("region", { name: "模型与图纸", exact: true }).getByRole("button", { name: "刷新结果", exact: true }).click();
    await page.reload();
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.equal(await page.getByLabel("描述零件、尺寸和设计要求").inputValue(), draft);
    assert.equal(await page.locator(".cad-submitted-prompt").textContent(), prompt);
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
    await page.getByText("建模服务暂不可用，请稍后重试。", { exact: true }).waitFor();
    await page.getByRole("button", { name: "重试", exact: true }).click();
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
    await page.getByRole("button", { name: "刷新结果", exact: true }).click();
    await page.reload();
    await page.getByRole("heading", { name: "零件设计工作台", exact: true }).waitFor();
    assert.equal(posts.length, 1);
  } finally { await context.close(); }
});

test("运行期间手动刷新后继续自动查询，最终展示模型", async () => {
  let ready = false;
  const { context, page, posts, reads } = await setup({ saved: true, getRecord: () => ready ? completed : { run_id: id, prompt, status: "running", calls: [] } });
  try {
    await page.getByText("FreeCAD 正在建模", { exact: true }).waitFor();
    await page.getByRole("button", { name: "刷新结果", exact: true }).click();
    await page.getByRole("button", { name: "刷新结果", exact: true }).waitFor();
    ready = true;
    await page.getByText("模型已加载", { exact: false }).waitFor();
    assert.ok(reads.length >= 3);
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

// 此处只验证前端协议、真实文件读取和真实渲染；内核验收由独立 FreeCAD 测试执行。
const workbenchArtifact = (name) => ({ name, format: name.split('.').at(-1).toLowerCase(), url: `${prefix}/runs/${id}/artifacts/${name}` });
const workbenchModels = ['model.stl', 'model.step', 'model.FCStd'].map(workbenchArtifact);
const fixtureRoot = resolve(root, 'tests/fixtures/freecad-workbenches');
const screenshots = process.env.FREECAD_BROWSER_SCREENSHOT_DIR || resolve(root, '.runtime/verification/freecad-workbench-browser');

async function captureWorkbench(page, name) {
  mkdirSync(screenshots, { recursive: true });
  await page.screenshot({ path: resolve(screenshots, `${name}.png`), fullPage: true });
}

function verifiedFiles(entries) {
  const files = {};
  for (const [name, relative, type] of entries) {
    const path = resolve(fixtureRoot, relative);
    assert.ok(existsSync(path), `缺少仓库中的真实 FreeCAD 测试数据：${path}`);
    files[name] = { type, body: readFileSync(path) };
  }
  return files;
}

test('工作台示例完整填入JSON并保持人工确认门禁，编辑后重新核对', async () => {
  const { context, page, posts, errors } = await setup();
  try {
    await openTemplates(page);
    const select = page.getByLabel('选择设计模板');
    await page.getByText('专业设置', { exact: true }).click();
    const input = page.getByLabel('结构化参数（JSON，优先于文字描述）');
    const confirm = page.getByLabel('我已核对设计尺寸与参数');
    const submit = page.getByRole('button', { name: '生成 3D 模型', exact: true });
    for (const choice of ['drawing', 'section', 'sheetmetal', 'motion', 'bim']) {
      await select.selectOption(choice);
      const spec = JSON.parse(await input.inputValue());
      assert.equal(spec.units, 'mm');
      assert.equal(await input.isVisible(), true);
      assert.equal(await submit.isDisabled(), true);
      assert.equal(await confirm.isChecked(), false);
      assert.equal(posts.length, 0);
      assert.equal(await page.getByLabel('描述零件、尺寸和设计要求').isEnabled(), true);
      if (choice === 'drawing') assert.deepEqual(spec.drawing, { projection: 'third_angle', scale: 1, section: null });
      if (choice === 'section') assert.deepEqual(spec.drawing.section, { origin: [30, 20, 10], normal: [0, 1, 0] });
      if (choice === 'sheetmetal') assert.deepEqual(spec.sheet_metal, { width: 80, base_length: 60, flange_length: 30, thickness: 2, bend_radius: 3, bend_angle: 90, k_factor: 0.4 });
      if (choice === 'motion') {
        assert.equal(spec.assembly.joints[0].type, 'revolute');
        assert.deepEqual(spec.assembly.motion, { joint: 'Hinge', start: 0, end: 90, duration: 2, frames: 25 });
      }
      if (choice === 'bim') {
        assert.equal(spec.bim.walls.length, 1);
        assert.equal(spec.bim.slabs.length, 1);
        assert.equal(spec.bim.openings[0].wall, spec.bim.walls[0].name);
        assert.equal(spec.drawing.scale, 0.02);
      }
      await confirm.check();
      assert.equal(await submit.isEnabled(), true);
    }
    const selected = JSON.parse(await input.inputValue());
    selected.bim.walls[0].height = 2800;
    await input.fill(JSON.stringify(selected, null, 2));
    assert.equal(await confirm.isChecked(), false);
    assert.equal(await submit.isDisabled(), true);
    assert.equal(await page.getByRole('heading', { name: 'FreeCAD MCP 连接', exact: true }).count(), 0);
    await captureWorkbench(page, 'editable-bim-example');
    await confirm.check();
    await submit.click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.deepEqual(posts[0].spec, selected);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('真实工程图及钣金展开双SVG上下渲染，PDF和DXF下载保持各自文件名', async () => {
  const files = verifiedFiles([
    ['model.stl', 'sheetmetal/model.stl', 'model/stl'],
    ['drawing.svg', 'drawing/drawing.svg', 'image/svg+xml'],
    ['drawing.pdf', 'drawing/drawing.pdf', 'application/pdf'],
    ['unfold.svg', 'sheetmetal/unfold.svg', 'image/svg+xml'],
    ['unfold.dxf', 'sheetmetal/unfold.dxf', 'image/vnd.dxf'],
  ]);
  const { sheetmetal } = JSON.parse(readFileSync(resolve(fixtureRoot, 'proof.json'), 'utf8'));
  // 折弯模型、工程图和展开文件均来自同一个已通过公共 MCP 验收的运行。
  const record = { ...completed, artifacts: [...workbenchModels, ...['drawing.svg', 'drawing.pdf', 'unfold.svg', 'unfold.dxf'].map(workbenchArtifact)],
    prompt: '生成宽80、基板直段60、翻边直段30、厚2、内半径3mm、90°单折弯钣金板，ANSI K=0.4，并输出第三角工程图和展开图。',
    validation: sheetmetal, spec: sheetmetal.spec };
  const { context, page, errors, artifactReads } = await setup({ saved: true, record, files });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll('.cad-drawing-preview img')];
      return images.length === 2 && images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
    });
    assert.equal(await page.getByRole('img', { name: 'FreeCAD 工程图（含所选三视图与剖视图）', exact: true }).count(), 1);
    assert.equal(await page.getByRole('img', { name: 'FreeCAD 钣金展开图', exact: true }).count(), 1);
    const drawingBounds = await page.locator('.cad-drawing-preview').nth(0).boundingBox();
    const unfoldBounds = await page.locator('.cad-drawing-preview').nth(1).boundingBox();
    assert.ok(drawingBounds && unfoldBounds, '工程图和展开图都必须可见');
    assert.ok(unfoldBounds.y >= drawingBounds.y + drawingBounds.height,
      `工程图和展开图必须上下排版，实际工程图底部=${drawingBounds.y + drawingBounds.height}，展开图顶部=${unfoldBounds.y}`);
    for (const [name, label] of [['drawing.svg', '工程图 SVG'], ['drawing.pdf', '工程图 PDF'], ['unfold.svg', '展开 SVG'], ['unfold.dxf', '展开 DXF']]) {
      const link = page.getByRole('link', { name: `下载 ${label}`, exact: true });
      assert.equal(await link.getAttribute('download'), name);
      assert.equal(await link.getAttribute('href'), `${prefix}/runs/${id}/artifacts/${name}`);
    }
    for (const name of ['drawing.pdf', 'unfold.dxf']) {
      const url = `${prefix}/runs/${id}/artifacts/${name}`;
      const length = await page.evaluate(async (url) => (await (await fetch(url)).arrayBuffer()).byteLength, url);
      assert.equal(length, files[name].body.byteLength);
    }
    assert.ok(artifactReads.includes('drawing.svg') && artifactReads.includes('unfold.svg'));
    await captureWorkbench(page, 'real-drawing-and-unfold');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('图纸加载失败明确报错，缺少模型时不借二维附件显示成功', async () => {
  const record = { ...completed, artifacts: [...workbenchModels, workbenchArtifact('drawing.svg')],
    validation: { ...completed.validation, drawing: { verified: true } }, spec: { drawing: { projection: 'third_angle', scale: 1, section: null } } };
  const first = await setup({ saved: true, record, files: { 'drawing.svg': { status: 500, type: 'text/plain', body: 'SVG export unavailable' } } });
  try {
    await first.page.getByText(/工程图.*加载失败/).waitFor();
    assert.equal(await first.page.locator('.cad-drawing-preview img').count(), 0);
    await captureWorkbench(first.page, 'drawing-read-failure');
  } finally { await first.context.close(); }
  const second = await setup({ saved: true, record: { ...record, artifacts: [workbenchArtifact('drawing.svg')] } });
  try {
    await second.page.getByText(/不能将二维图纸作为建模成功结果/).waitFor();
    assert.equal(await second.page.locator('.cad-drawing-preview img').count(), 0);
    assert.equal(await second.page.getByRole('link', { name: /^下载 / }).count(), 0);
    assert.equal(second.artifactReads.length, 0);
  } finally { await second.context.close(); }
});

test('真实FreeCAD运动帧可播放、暂停和定位，三维画布随关节姿态变化', async () => {
  const files = verifiedFiles([
    ['motion.json', 'assembly/motion.json', 'application/json'],
    ['model.stl', 'assembly/model.stl', 'model/stl'],
  ]);
  const { assembly } = JSON.parse(readFileSync(resolve(fixtureRoot, 'proof.json'), 'utf8'));
  const data = JSON.parse(files['motion.json'].body.toString('utf8'));
  assert.equal(data.frames.length, 25);
  const record = { ...completed, artifacts: [...workbenchModels, workbenchArtifact('motion.json')],
    prompt: '生成圆柱基座与转臂装配，固定Base，用Hinge转动副驱动Arm从0°到90°，持续2秒，输出25帧真实求解运动。',
    validation: assembly, spec: assembly.spec };
  const { context, page, errors, artifactReads } = await setup({ saved: true, record, files });
  try {
    const play = page.getByRole('button', { name: '播放机构运动', exact: true });
    await play.waitFor();
    const slider = page.getByRole('slider', { name: '机构运动帧', exact: true });
    assert.equal(await slider.inputValue(), '0');
    assert.equal(await slider.getAttribute('max'), '24');
    assert.equal(await page.getByRole('button', { name: '自动旋转', exact: true }).getAttribute('aria-pressed'), 'false');
    assert.match(await page.locator('.cad-read-notice').innerText(), /尚未.*运动全过程.*碰撞/);
    const canvas = page.getByLabel('FreeCAD 三维模型');
    const initial = await canvas.screenshot();
    await assertNeutralPreview(canvas);
    await captureWorkbench(page, 'motion-first-frame');
    await play.click();
    await page.waitForFunction(() => Number(document.querySelector('[aria-label="机构运动帧"]').value) >= 4);
    await page.getByRole('button', { name: '暂停机构运动', exact: true }).click();
    const paused = await slider.inputValue();
    await page.waitForTimeout(150);
    assert.equal(await slider.inputValue(), paused);
    await slider.focus();
    await page.keyboard.press('End');
    assert.equal(await slider.inputValue(), '24');
    await page.waitForTimeout(100);
    assert.notDeepEqual(await canvas.screenshot(), initial, '关节姿态变化必须改变真实三维图形');
    await assertNeutralPreview(canvas);
    await captureWorkbench(page, 'motion-last-frame');
    assert.equal(await page.getByRole('button', { name: '自动旋转', exact: true }).getAttribute('aria-pressed'), 'false');
    assert.equal(await page.getByRole('link', { name: '下载 运动帧 JSON', exact: true }).getAttribute('download'), 'motion.json');
    assert.ok(artifactReads.includes('motion.json'));
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('用户默认看到中文设计工作台，内部执行术语和原始JSON不占用主界面', async () => {
  const { context, page, errors } = await setup();
  try {
    await page.getByRole('heading', { name: '零件设计工作台', exact: true }).waitFor();
    const visible = await page.locator('body').innerText();
    assert.doesNotMatch(visible, /model_3d|production_modeling_skill|freecad_mcp|JSON|MCP/);
    await openTemplates(page);
    await page.getByLabel('选择设计模板').selectOption('flange');
    await page.getByRole('spinbutton', { name: '主体 · 圆柱体 · 直径', exact: true }).waitFor();
    assert.equal(await page.locator('.cad-parameter-editor .cad-feature[open]').count(), 1, '复杂模板只展开主体，其他特征按需展开');
    assert.equal(await page.getByLabel('结构化参数（JSON，优先于文字描述）').isVisible(), false);
    await captureWorkbench(page, 'professional-design-workspace');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('生成后修改实际尺寸提交新版本，未应用修改前旧图纸和模型保持不变', async () => {
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts, errors } = await setup({ saved: true, record });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.getByRole('button', { name: '修改设计', exact: true }).click();
    await page.getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true }).fill('65');
    assert.equal(posts.length, 0);
    assert.match(await page.locator('.cad-validation').innerText(), /40.*20.*10/);
    await page.getByLabel('我已核对修改后的尺寸与特征').check();
    await page.getByRole('button', { name: '应用修改，生成新版本', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].spec.operations[0].length, 65);
    assert.equal(posts[0].spec.operations[0].width, 20);
    assert.notEqual(posts[0].command_id, 'existing-command');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('编辑器增加孔与删除特征是真实规格变更，空尺寸不能提交', async () => {
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts } = await setup({ saved: true, record });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.getByRole('button', { name: '修改设计', exact: true }).click();
    await page.getByRole('button', { name: '添加通孔', exact: true }).click();
    const diameter = page.getByRole('spinbutton', { name: '特征 1 · 通孔 · 直径', exact: true });
    await diameter.fill('8');
    await page.getByRole('button', { name: '删除特征 1 · 通孔', exact: true }).click();
    assert.equal(await diameter.count(), 0);
    await page.getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true }).fill('');
    await page.getByRole('button', { name: '添加倒角', exact: true }).click();
    await page.getByLabel('我已核对修改后的尺寸与特征').check();
    assert.equal(await page.getByRole('button', { name: '应用修改，生成新版本', exact: true }).isDisabled(), true);
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

test('保留初始需求表单时点击模型尺寸仍定位当前版本编辑器', async () => {
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page } = await setup({ saved: true, record });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await openTemplates(page);
    await page.getByLabel('选择设计模板').selectOption('drawing');
    await page.getByRole('button', { name: '修改长度，当前40mm', exact: true }).click();
    const editor = page.getByRole('region', { name: '修改当前设计', exact: true });
    const length = editor.getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true });
    await length.waitFor();
    assert.equal(await length.evaluate((element) => element === document.activeElement), true);
  } finally { await context.close(); }
});

test('点击三维图上的尺寸直接定位真实设计参数，不会只缩放预览网格', async () => {
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts } = await setup({ saved: true, record });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.getByRole('button', { name: '修改长度，当前40mm', exact: true }).click();
    const length = page.getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true });
    await length.waitFor();
    assert.equal(await length.evaluate((element) => element === document.activeElement), true);
    assert.equal(await length.inputValue(), '40');
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

test('修改版本保留原图，切换版本和刷新只读取对应记录，不重复建模', async () => {
  const original = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  let revised;
  const { context, page, posts, reads } = await setup({ saved: true, record: original,
    postRecord: (body) => {
      const nextId = `FC-${createHash('sha256').update(body.command_id).digest('hex')}`;
      revised = { ...original, run_id: nextId, prompt: body.prompt, spec: body.spec,
        validation: { ...original.validation, bounds_mm: [65,20,10], volume_mm3: 13000 },
        artifacts: original.artifacts.map((item) => ({ ...item, url: item.url.replace(id, nextId) })) };
      return { run_id: nextId, status: 'running', prompt: body.prompt };
    }, getRecord: (_, path) => revised && path.endsWith(revised.run_id) ? revised : original });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.getByRole('button', { name: '修改设计', exact: true }).click();
    await page.getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true }).fill('65');
    await page.getByLabel('我已核对修改后的尺寸与特征').check();
    await page.getByRole('button', { name: '应用修改，生成新版本', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    const versions = page.getByRole('combobox', { name: '设计版本', exact: true });
    assert.notEqual(revised.run_id, id);
    assert.equal(await versions.locator('option').count(), 3);
    assert.match(await page.locator('.cad-validation').innerText(), /65.*20.*10/);
    await versions.selectOption(id);
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.match(await page.locator('.cad-validation').innerText(), /40.*20.*10/);
    await page.reload();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(await versions.inputValue(), id);
    assert.equal(posts.length, 1);
    assert.ok(reads.some((path) => path.endsWith(revised.run_id)));
    assert.equal(await page.getByRole('link', { name: '下载 STEP', exact: true }).getAttribute('href'), `${prefix}/runs/${id}/artifacts/model.step`);
  } finally { await context.close(); }
});

test('模板尺寸有明确优先提示，切换文字建模清除旧参数且不自动执行', async () => {
  const { context, page, posts } = await setup();
  try {
    await openTemplates(page);
    await page.getByLabel('选择设计模板').selectOption('drawing');
    await page.getByText('使用下方参数生成，文字描述用于说明用途。', { exact: true }).waitFor();
    await page.getByRole('button', { name: '仅按文字建模', exact: true }).click();
    assert.equal(await page.getByRole('spinbutton').count(), 0);
    await page.getByLabel('描述零件、尺寸和设计要求').fill(prompt);
    await page.getByRole('button', { name: '生成 3D 模型', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].spec, undefined);
    assert.equal(posts[0].prompt, prompt);
  } finally { await context.close(); }
});

test('服务连接检查尚未结束时明确显示等待，不能提前应用修改', async () => {
  let release;
  const statusGate = new Promise((resolve) => { release = resolve; });
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts } = await setup({ saved: true, record, statusGate });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.getByText('正在检查建模服务，确认连接后可以生成或应用修改。', { exact: true }).waitFor();
    await page.getByRole('button', { name: '修改设计', exact: true }).click();
    await page.getByRole('spinbutton', { name: '主体 · 长方体 · 长度', exact: true }).fill('65');
    await page.getByLabel('我已核对修改后的尺寸与特征').check();
    const apply = page.getByRole('button', { name: '应用修改，生成新版本', exact: true });
    assert.equal(await apply.isDisabled(), true);
    release();
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((button) => button.textContent === '应用修改，生成新版本').disabled);
    assert.equal(await apply.isEnabled(), true);
    assert.equal(await page.getByText('正在检查建模服务，确认连接后可以生成或应用修改。', { exact: true }).count(), 0);
    assert.equal(posts.length, 0);
  } finally { release(); await context.close(); }
});

test('三维图内点击尺寸直接输入并提交真实新规格，不跳到图外表单', async () => {
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts, errors } = await setup({ saved: true, record });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    await page.getByText('生成后点击图上的“图上编辑”，直接改尺寸或拖动端点；核对后应用修改。设计文件不代表生产放行，不会启动机器。', { exact: true }).waitFor();
    const viewer = page.getByRole('region', { name: '交互三维预览', exact: true });
    await viewer.getByRole('button', { name: '图上编辑', exact: true }).click();
    const layer = viewer.getByRole('region', { name: '三维图内编辑', exact: true });
    await layer.getByRole('button', { name: '图内修改长度', exact: true }).click();
    const input = layer.getByRole('spinbutton', { name: '图内长度', exact: true });
    await input.fill('55');
    assert.equal(await input.evaluate((element) => element.closest('.cad-viewport') !== null), true);
    assert.equal(posts.length, 0);
    assert.match(await page.locator('.cad-validation').innerText(), /40.*20.*10/);
    await layer.getByLabel('图上修改已核对').check();
    await layer.getByRole('button', { name: '应用图上修改', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].spec.operations[0].length, 55);
    assert.equal(posts[0].spec.operations[0].width, 20);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('三维尺寸端点可拖动，松手只保存草稿，空输入阻止确认', async () => {
  const record = { ...completed, spec: { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }] } };
  const { context, page, posts } = await setup({ saved: true, record });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    const viewer = page.getByRole('region', { name: '交互三维预览', exact: true });
    await viewer.getByRole('button', { name: '图上编辑', exact: true }).click();
    const layer = viewer.getByRole('region', { name: '三维图内编辑', exact: true });
    const handle = layer.getByRole('button', { name: '拖动长度尺寸', exact: true });
    await handle.waitFor();
    await handle.scrollIntoViewIfNeeded();
    const bounds = await handle.boundingBox();
    await page.mouse.move(bounds.x+bounds.width/2, bounds.y+bounds.height/2);
    await page.mouse.down(); await page.mouse.move(bounds.x+bounds.width/2+35, bounds.y+bounds.height/2, { steps: 8 }); await page.mouse.up();
    await layer.getByRole('button', { name: '图内修改长度', exact: true }).click();
    const input = layer.getByRole('spinbutton', { name: '图内长度', exact: true });
    assert.ok(Number(await input.inputValue()) > 40, '拖动必须改变绑定的设计尺寸');
    assert.equal(posts.length, 0);
    await input.fill('');
    await layer.getByLabel('图上修改已核对').check();
    assert.equal(await layer.getByRole('button', { name: '应用图上修改', exact: true }).isDisabled(), true);
    await input.fill('50');
    await layer.getByLabel('图上修改已核对').check();
    await layer.getByRole('button', { name: '应用图上修改', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts[0].spec.operations[0].length, 50);
  } finally { await context.close(); }
});

test('二维图纸内编辑孔参数发送真实切除规格，取消草稿不执行', async () => {
  const spec = { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }, { type: 'cylinder', mode: 'cut', diameter: 8, length: 10, axis: 'z', position: [20,10,0] }], drawing: { projection: 'third_angle', scale: 1, section: null } };
  const record = { ...completed, spec, validation: { ...completed.validation, drawing: { verified: true } }, artifacts: [...artifacts, { name: 'drawing.svg', format: 'svg', url: `${prefix}/runs/${id}/artifacts/drawing.svg` }] };
  const { context, page, posts } = await setup({ saved: true, record, files: { 'drawing.svg': { type: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="40" height="20"/></svg>' } } });
  try {
    const figure = page.locator('.cad-drawing-preview');
    await figure.getByRole('button', { name: '图上编辑', exact: true }).click();
    const layer = figure.getByRole('region', { name: '图纸内编辑', exact: true });
    await layer.getByLabel('图上编辑对象').selectOption('operations.1');
    await layer.getByRole('button', { name: '图内修改直径', exact: true }).click();
    await layer.getByRole('spinbutton', { name: '图内直径', exact: true }).fill('12');
    await layer.getByRole('button', { name: '撤销图上草稿', exact: true }).click();
    assert.equal(posts.length, 0);
    await figure.getByRole('button', { name: '图上编辑', exact: true }).click();
    await layer.getByLabel('图上编辑对象').selectOption('operations.1');
    await layer.getByRole('button', { name: '图内修改直径', exact: true }).click();
    const diameter = layer.getByRole('spinbutton', { name: '图内直径', exact: true });
    assert.equal(await diameter.inputValue(), '8');
    await diameter.fill('12');
    await layer.getByLabel('图上修改已核对').check();
    await layer.getByRole('button', { name: '应用图上修改', exact: true }).click();
    await page.getByText('模型已加载', { exact: false }).waitFor();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].spec.operations[1].diameter, 12);
    assert.equal(posts[0].spec.operations[1].mode, 'cut');
    assert.deepEqual(posts[0].spec.drawing, spec.drawing);
  } finally { await context.close(); }
});

test('三维和二维图内编辑同一尺寸时，打开的输入同步最新草稿而不保留旧值', async () => {
  const spec = { units: 'mm', operations: [{ type: 'box', mode: 'add', length: 40, width: 20, height: 10, position: [0,0,0] }], drawing: { projection: 'third_angle', scale: 1, section: null } };
  const record = { ...completed, spec, validation: { ...completed.validation, drawing: { verified: true } }, artifacts: [...artifacts, { name: 'drawing.svg', format: 'svg', url: `${prefix}/runs/${id}/artifacts/drawing.svg` }] };
  const { context, page, posts } = await setup({ saved: true, record, files: { 'drawing.svg': { type: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="40" height="20"/></svg>' } } });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    const viewer = page.getByRole('region', { name: '交互三维预览', exact: true });
    const figure = page.locator('.cad-drawing-preview');
    await viewer.getByRole('button', { name: '图上编辑', exact: true }).click();
    await viewer.getByRole('button', { name: '图内修改长度', exact: true }).click();
    const modelInput = viewer.getByRole('spinbutton', { name: '图内长度', exact: true });
    await modelInput.fill('50');
    await figure.getByRole('button', { name: '图上编辑', exact: true }).click();
    await figure.getByRole('button', { name: '图内修改长度', exact: true }).click();
    const drawingInput = figure.getByRole('spinbutton', { name: '图内长度', exact: true });
    assert.equal(await drawingInput.inputValue(), '50');
    await drawingInput.fill('60');
    assert.equal(await modelInput.inputValue(), '60');
    await drawingInput.fill('');
    // 对方的其他尺寸修改不能放行当前仍为空的输入。
    await viewer.getByRole('button', { name: '图内修改宽度', exact: true }).click();
    await viewer.getByRole('spinbutton', { name: '图内宽度', exact: true }).fill('25');
    await viewer.getByLabel('图上修改已核对').check();
    assert.equal(await viewer.getByRole('button', { name: '应用图上修改', exact: true }).isDisabled(), true);
    await figure.getByRole('button', { name: '撤销图上草稿', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.cad-viewport input[aria-label="图内宽度"]').value === '20');
    assert.equal(await viewer.getByRole('spinbutton', { name: '图内宽度', exact: true }).inputValue(), '20');
    await viewer.getByRole('spinbutton', { name: '图内宽度', exact: true }).fill('');
    await figure.getByRole('button', { name: '图上编辑', exact: true }).click();
    await figure.getByRole('button', { name: '图内修改长度', exact: true }).click();
    await drawingInput.fill('55');
    await figure.getByRole('button', { name: '撤销图上草稿', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.cad-viewport input[aria-label="图内宽度"]').value === '20');
    // 宽度的源值始终20；撤销也必须清掉另一视图的非法原始输入。
    assert.equal(await viewer.getByRole('spinbutton', { name: '图内宽度', exact: true }).inputValue(), '20');
    assert.equal(await viewer.getByRole('spinbutton', { name: '图内宽度', exact: true }).getAttribute('aria-invalid'), 'false');
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});

test('真实法兰厚度标注不能挡住拖动端点，命中圆点后实际修改厚度草稿', async () => {
  const spec = { units: 'mm', operations: [{ type: 'cylinder', mode: 'add', diameter: 90, length: 12, axis: 'z', position: [0,0,0] }, { type: 'cylinder', mode: 'add', diameter: 32, length: 30, axis: 'z', position: [0,0,12] }, { type: 'cylinder', mode: 'cut', diameter: 16, length: 42, axis: 'z', position: [0,0,0] }, ...[[22,0,0],[-22,0,0],[0,22,0],[0,-22,0]].map((position) => ({ type: 'cylinder', mode: 'cut', diameter: 6, length: 12, axis: 'z', position }))], drawing: { projection: 'third_angle', scale: 1, section: null } };
  const stl = readFileSync(resolve(root, 'tests/fixtures/freecad-workbenches/flange/model.stl'));
  assert.equal(createHash('sha256').update(stl).digest('hex'), 'b33e44beb0e3c4e339f2a57d287148e2e220832ed363b3169fdfaa4cb590c37f');
  const record = { ...completed, spec, validation: { ...completed.validation, bounds_mm: [90,90,42] } };
  const { context, page, posts } = await setup({ saved: true, record, stl });
  try {
    await page.getByText('模型已加载', { exact: false }).waitFor();
    const viewer = page.getByRole('region', { name: '交互三维预览', exact: true });
    await viewer.getByRole('button', { name: '图上编辑', exact: true }).click();
    const handle = viewer.getByRole('button', { name: '拖动长度尺寸', exact: true });
    await handle.waitFor();
    await handle.scrollIntoViewIfNeeded();
    const bounds = await handle.boundingBox(), x = bounds.x+bounds.width/2, y = bounds.y+bounds.height/2;
    assert.equal(await page.evaluate(({ x,y }) => document.elementFromPoint(x,y)?.getAttribute('aria-label'), { x,y }), '拖动长度尺寸');
    await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x,y-25,{ steps: 8 }); await page.mouse.up();
    await viewer.getByRole('button', { name: '图内修改长度', exact: true }).click();
    assert.ok(Number(await viewer.getByRole('spinbutton', { name: '图内长度', exact: true }).inputValue()) > 12);
    assert.equal(posts.length, 0);
  } finally { await context.close(); }
});
