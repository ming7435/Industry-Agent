import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// 编译并渲染真实组件；服务端不执行副作用，因此不会启动任何工厂任务。
const compiled = await build({ stdin: { contents: `import React from "react"; import { renderToStaticMarkup } from "react-dom/server"; import ManufacturingPanel from "./ManufacturingPanel.jsx"; export const render = design => renderToStaticMarkup(React.createElement(ManufacturingPanel, {design}));`, resolveDir: fileURLToPath(new URL(".", import.meta.url)) }, bundle: true, write: false, format: "cjs", platform: "node", define: { "process.env.NODE_ENV": '"production"' } });
const result = { exports: {} };
new Function("require", "module", "exports", compiled.outputFiles[0].text)(createRequire(import.meta.url), result, result.exports);

test("加工页面展示显式工艺要求和虚拟限定，不声明真实机器可直接生产", () => {
  const html = result.exports.render({ design_id: "CAD-0123456789ABCDEF0123", digest: "a".repeat(64), material: "C45", technical_requirements: "按确认尺寸加工" });
  for (const text of ["毛坯直径", "独立夹持长度", "每转进给", "钻头直径", "尺寸公差", "不是 TRAK 真实控制器程序", "单独确认", "虚拟工厂", "C45"]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /未接入刀路/);
});

test("缺少材料或技术要求时真实页面不伪造完整工艺，不自动填写转速", () => {
  const html = result.exports.render({ design_id: "CAD-0123456789ABCDEF0123", digest: "a".repeat(64) });
  assert.match(html, /未填写，需建立完整新版本/);
  assert.match(html, /系统不推测工业加工阈值/);
  assert.doesNotMatch(html, /value="1200"/);
});
