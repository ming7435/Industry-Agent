// 实际 React 组件、浏览器点击与隔离真实 API 配合；禁止指向现场应用端口。
import { createServer, request as httpRequest } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import assert from "node:assert/strict";
import { chromium } from "file:///C:/Users/12587/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const target = new URL(process.argv[2]);
assert.equal(target.hostname, "127.0.0.1");
assert.ok(!["4529", "8001", "8010", "8020", "8030", "8040", "8050"].includes(target.port), "不允许调用现场端口");
assert.equal((await (await fetch(new URL("/fixture/verify", target))).json()).records_preserved, 3);
const source = fileURLToPath(new URL("../src/app/", import.meta.url));
const compiled = await build({
  stdin: { resolveDir: source, contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import {MaintenancePlanWorkspace} from './App.jsx';
    createRoot(document.getElementById('root')).render(React.createElement(MaintenancePlanWorkspace,{actor:{user_id:'USER-BROWSER',role:'technician'},sample:{},snapshot:{diagnosis:{pipeline:{maintenance_plan:{plan_id:'PLAN-BROWSER-1'},event:{device_id:'M-BROWSER'}}}}}));` },
  plugins: [{ name: "组件测试入口", setup(builder) { builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async ({ path }) => ({ contents: `${await readFile(path, "utf8")}\nexport {MaintenancePlanWorkspace};`, loader: "jsx" })); } }],
  bundle: true, write: false, format: "iife", platform: "browser", loader: { ".css": "empty", ".png": "dataurl" }, define: { "process.env.NODE_ENV": '"production"' },
});
const server = createServer((req, res) => {
  if (req.url === "/") { res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" }); res.end('<!doctype html><html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script></html>'); return; }
  if (req.url === "/component.js") { res.writeHead(200, { "Content-Type": "application/javascript" }); res.end(compiled.outputFiles[0].text); return; }
  if (!req.url.startsWith("/api/maintenance/plans") && req.url !== "/api/workorders") { res.writeHead(404); res.end(); return; }
  const forwarded = httpRequest(new URL(req.url, target), { method: req.method, headers: req.headers }, upstream => {
    res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res);
  });
  forwarded.on("error", () => { res.writeHead(502); res.end(); });
  req.pipe(forwarded);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const context = await browser.newContext();
  const url = `http://127.0.0.1:${server.address().port}`;
  await context.addCookies([{ name: "maintenance_session", value: "browser-test-only", url }]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await page.goto(url);
  await page.getByRole("button", { name: "删除此方案", exact: true }).nth(2).waitFor();
  assert.equal(await page.getByRole("button", { name: "删除此方案", exact: true }).count(), 3);
  // 已加载方案仍展示真实门禁原因和登录身份，替代无法执行 effect 的首屏 SSR 断言。
  await page.getByText("缺少 CAD/BOM 依据", { exact: true }).waitFor();
  await page.getByText("备件库存为演示数据", { exact: true }).waitFor();
  assert.ok((await page.locator('body').innerText()).includes("replan_limit_exceeded"));
  assert.ok((await page.locator('body').innerText()).includes("当前账号"));
  assert.ok(!(await page.locator('body').innerText()).includes("工单关联情况需登录"));
  await page.getByRole("button", { name: "删除此方案", exact: true }).first().click();
  await page.waitForFunction(() => document.querySelectorAll('.maintenance-plan-list-row').length === 2);
  // 重载时延迟并拒绝第一次列表请求，不能让旧监控快照短暂或持续恢复已删除方案。
  let releaseList;
  const held = new Promise(resolve => { releaseList = resolve; });
  await page.route("**/api/maintenance/plans", async route => {
    await held;
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "隔离读取失败" }) });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("正在读取已有维修方案", { exact: true }).waitFor();
  assert.equal(await page.getByText("PLAN-BROWSER-1", { exact: false }).count(), 0);
  releaseList();
  await page.getByText("历史方案暂未读出", { exact: true }).waitFor();
  assert.equal(await page.getByText("PLAN-BROWSER-1", { exact: false }).count(), 0);
  await page.unroute("**/api/maintenance/plans");
  await page.getByRole("button", { name: "刷新方案", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.maintenance-plan-list-row').length === 2);
  assert.equal(await page.getByText("PLAN-BROWSER-1", { exact: false }).count(), 0, "旧监控快照不能恢复已删除方案");
  await page.getByRole("button", { name: "全选方案", exact: true }).click();
  await page.getByRole("button", { name: "删除选中方案（2）", exact: true }).click();
  await page.getByText("暂无已生成的维修方案", { exact: true }).waitFor();
  const verify = await (await fetch(new URL("/fixture/verify", target))).json();
  assert.deepEqual(verify, { records_preserved: 3, deleted: 3 });
  await page.reload();
  await page.getByText("暂无已生成的维修方案", { exact: true }).waitFor();
  assert.equal(await page.locator('.maintenance-plan-list-row').count(), 0);
  assert.deepEqual(errors, []);
  console.log("浏览器回归通过：单条删除、刷新、快照过滤、全选批量删除、证据保留，页面异常 0。");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  await fetch(new URL("/fixture/shutdown", target));
}
