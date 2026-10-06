import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Compile the actual components and expose only their existing private entry points for these tests.
// React server rendering exercises the user-visible output without a browser or live service.
const compiled = await build({
  stdin: {
    contents: `import React from "react"; import { renderToStaticMarkup } from "react-dom/server";
      import { MaintenancePlanWorkspace, WorkorderView, request } from "./App.jsx";
      export { request }; export const renderPlans = props => renderToStaticMarkup(React.createElement(MaintenancePlanWorkspace, props));
      export const renderOrders = props => renderToStaticMarkup(React.createElement(WorkorderView, props));`,
    resolveDir: fileURLToPath(new URL(".", import.meta.url)),
  },
  plugins: [{ name: "expose-component-test-boundary", setup(builder) {
    builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async ({ path }) => ({
      contents: `${await readFile(path, "utf8")}\nexport { MaintenancePlanWorkspace, WorkorderView, request };`, loader: "jsx",
    }));
  } }],
  bundle: true, write: false, format: "cjs", platform: "node",
  loader: { ".css": "empty", ".png": "dataurl" },
  define: { "process.env.NODE_ENV": '"production"' },
});
const renderedModule = { exports: {} };
new Function("require", "module", "exports", compiled.outputFiles[0].text)(createRequire(import.meta.url), renderedModule, renderedModule.exports);
const { request, renderPlans, renderOrders } = renderedModule.exports;

const blockedPipeline = {
  event: { device_id: "M-1", alarm_code: "700001", event_id: "EVT-1" },
  diagnosis: { device_id: "M-1", alarm_code: "700001", summary: "润滑压力异常", confidence: 0.886, evidence_status: "ready" },
  maintenance_plan: { plan_id: "PLAN-UNASSIGNED", diagnosis: { device_id: "M-1", fault: "润滑压力异常" },
    repair_steps: ["隔离电源后检查油路"], tools: [], parts: [], safety: ["断电挂牌"], evidence: [],
    workorder_ready: false, validation_findings: ["缺少 CAD/BOM 依据", "备件库存为演示数据"] },
  status: "blocked", stop_reason: "replan_limit_exceeded",
};

test("删除标记未读出前不显示可能已删除的监控方案", () => {
  const html = renderPlans({ snapshot: { diagnosis: { pipeline: blockedPipeline } }, sample: {} });
  assert.doesNotMatch(html, /PLAN-UNASSIGNED/);
  assert.match(html, /正在读取已有维修方案/);
});

test("首次读取期间删除操作禁用，身份提示正确；加载后的单条操作由浏览器回归覆盖", () => {
  const props = { snapshot: { diagnosis: { pipeline: blockedPipeline } }, sample: {} };
  const loggedIn = renderPlans({ ...props, actor: { user_id: "U-1", role: "technician" } });
  assert.match(loggedIn, /删除选中方案/);
  assert.match(loggedIn, /disabled=""[^>]*>删除选中方案/);
  const anonymous = renderPlans(props);
  assert.match(anonymous, /disabled=""[^>]*>删除选中方案/);
  assert.match(anonymous, /登录后可删除/);
});

test("维修方案等待删除集合，不在首次读取前把快照当作已核验列表", () => {
  const html = renderPlans({ snapshot: { device_id: "M-1", diagnosis: { pipeline_by_device: { "M-1": blockedPipeline } } }, sample: { device_id: "M-1" } });
  assert.doesNotMatch(html, /PLAN-UNASSIGNED/);
  assert.match(html, /正在读取已有维修方案/);
  assert.doesNotMatch(html, /完成诊断并生成工单后/);
});

test("新设备报警尚未返回时明确提示核对，不提前展示未核验的其他设备快照", () => {
  const html = renderPlans({ snapshot: { device_id: "M-2", diagnosis: { pipeline_by_device: { "M-1": blockedPipeline } } }, sample: { device_id: "M-2", alarm_code: "NEW", status: "alarm" } });
  assert.doesNotMatch(html, /PLAN-UNASSIGNED/);
  assert.match(html, /NEW/);
});

test("maintenance page does not claim a current plan is absent before history is loaded", () => {
  const html = renderPlans({ snapshot: { device_id: "M-2", diagnosis: { pipeline_by_device: { "M-1": blockedPipeline } } }, sample: { device_id: "M-2", alarm_code: "NEW", status: "alarm" } });
  assert.doesNotMatch(html, /PLAN-UNASSIGNED/);
  assert.match(html, /NEW/);
  assert.match(html, /正在核对当前设备/);
  assert.doesNotMatch(html, /尚无对应维修方案/);
});

test("maintenance page does not ask an authenticated actor to log in again when no linked order is visible", () => {
  const html = renderPlans({ snapshot: { device_id: "M-1", diagnosis: { pipeline: blockedPipeline } }, sample: { device_id: "M-1" }, actor: { user_id: "U-1", role: "technician" } });
  assert.doesNotMatch(html, /登录后可删除/);
  assert.doesNotMatch(html, /工单关联情况需登录/);
});

test("workorder empty state explains automatic dispatch rather than offering forbidden manual creation", () => {
  const html = renderOrders({ snapshot: {}, sample: {}, actor: { role: "technician", user_id: "U-1" } });
  assert.match(html, /自动派发/);
  assert.doesNotMatch(html, /从当前故障创建工单/);
});

test("workorder page displays the real plan blockers when a current fault has not been dispatched", () => {
  const html = renderOrders({ snapshot: { device_id: "M-1", diagnosis: { latest: blockedPipeline.diagnosis, pipeline_by_device: { "M-1": blockedPipeline } } }, sample: { device_id: "M-1", alarm_code: "700001", status: "alarm" }, actor: { role: "technician", user_id: "U-1" } });
  assert.match(html, /缺少 CAD\/BOM 依据/);
  assert.match(html, /备件库存为演示数据/);
  assert.match(html, /replan_limit_exceeded/);
  assert.doesNotMatch(html, /请先完成工单派发/);
});

test("request displays FastAPI's actual denial detail", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: "请先登录维修小组账号" }), { status: 401 });
  await assert.rejects(request("/api/workorders"), /请先登录维修小组账号/);
});

test("request retains validation paths and messages from FastAPI 422 responses", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: [{ loc: ["body", "feedback"], msg: "Field required", type: "missing" }] }), { status: 422 });
  await assert.rejects(request("/api/workorders/WO-1/action"), /feedback.*Field required/);
});
