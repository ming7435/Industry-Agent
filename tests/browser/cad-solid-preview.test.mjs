// 只读浏览器回归：使用现有已生成实体，不提交设计、确认或机器命令。
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const base = process.env.CAD_PREVIEW_URL || "http://127.0.0.1:8001";
let browser, identifier;

before(async () => {
  const module = process.env.PLAYWRIGHT_MODULE_PATH;
  const { chromium } = module ? await import(pathToFileURL(module).href) : await import("playwright-core");
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}), args: ["--enable-unsafe-swiftshader"] });
  const response = await fetch(`${base}/api/cad/designs`);
  assert.equal(response.status, 200);
  const { items } = await response.json();
  identifier = items.find((item) => ["ready", "confirmed"].includes(item.status))?.design_id;
  assert.ok(identifier, "只读验收需要至少一份已生成的真实 CAD，不创建或伪造任务");
});
after(async () => { await browser?.close(); });

async function workspace(reducedMotion = "no-preference", brokenStl = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion });
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  await page.route("**/api/**", (route) => {
    if (route.request().method() !== "GET") return route.abort("blockedbyclient");
    if (brokenStl && /\/artifacts\/stl$/.test(route.request().url())) return route.abort("failed");
    return route.continue();
  });
  await page.goto(`${base}/?view=cad`);
  await page.getByRole("button").filter({ hasText: identifier }).click();
  await page.getByRole("heading", { name: "真实实体预览", exact: true }).waitFor();
  const canvas = page.locator('canvas[aria-label="由 CAD 实体 STL 文件加载的三维零件"]');
  if (!brokenStl) { await canvas.waitFor({ state: "visible" }); await canvas.scrollIntoViewIfNeeded(); }
  return { page, context, canvas };
}

test("真实 STL 默认明显转动，暂停后画面保持稳定", async () => {
  const { page, context, canvas } = await workspace();
  try {
    const pause = page.getByRole("button", { name: "暂停旋转", exact: true });
    assert.equal(await pause.count(), 1, "缺少可见的自动旋转控制");
    assert.equal(await page.getByRole("button", { name: "等轴", exact: true }).getAttribute("aria-pressed"), "false", "转动中不能仍声称固定在等轴视角");
    const first = await canvas.screenshot();
    await page.waitForTimeout(650);
    assert.notDeepEqual(await canvas.screenshot(), first, "自动旋转必须改变实际 WebGL 画面");
    await pause.click();
    await page.waitForTimeout(250);
    const still = await canvas.screenshot();
    await page.waitForTimeout(500);
    assert.deepEqual(await canvas.screenshot(), still, "暂停不能继续产生旋转帧");
    await page.getByRole("button", { name: "开始旋转", exact: true }).click();
    await page.waitForTimeout(600);
    assert.notDeepEqual(await canvas.screenshot(), still);
  } finally { await context.close(); }
});

test("拖动、缩放、视角和线框按钮实际改变画面", async () => {
  const { page, context, canvas } = await workspace();
  try {
    await page.getByRole("button", { name: "暂停旋转", exact: true }).click();
    const box = await canvas.boundingBox();
    const start = await canvas.screenshot();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.65, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    const dragged = await canvas.screenshot();
    assert.notDeepEqual(dragged, start, "拖动应改变观察角度");
    await page.getByRole("button", { name: "放大", exact: true }).click();
    await page.waitForTimeout(100);
    assert.notDeepEqual(await canvas.screenshot(), dragged, "缩放应改变零件显示尺寸");
    let prior = await canvas.screenshot();
    for (const name of ["俯视", "主视", "侧视", "等轴"]) {
      await page.getByRole("button", { name, exact: true }).click();
      assert.equal(await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"), "true");
      const next = await canvas.screenshot();
      assert.notDeepEqual(next, prior, `${name}应切换真实相机视角`);
      prior = next;
    }
    await page.getByRole("button", { name: "线框", exact: true }).click();
    assert.notDeepEqual(await canvas.screenshot(), prior, "线框必须改变实体绘制，而非只改变按钮状态");
    await page.getByRole("button", { name: "重置视角", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "等轴", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "线框", exact: true }).click();
    if (process.env.CAD_PREVIEW_SCREENSHOT) await page.locator(".cad-solid-preview").screenshot({ path: process.env.CAD_PREVIEW_SCREENSHOT });
  } finally { await context.close(); }
});

test("全屏在真实浏览器切换，退出后画布保留", async () => {
  const { page, context, canvas } = await workspace();
  try {
    await page.getByRole("button", { name: "全屏", exact: true }).click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    await page.getByRole("button", { name: "退出全屏", exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await canvas.count(), 1);
  } finally { await context.close(); }
});

test("减少动态效果偏好下不擅自旋转，用户仍可手动开启", async () => {
  const { page, context } = await workspace("reduce");
  try {
    assert.equal(await page.getByRole("button", { name: "开始旋转", exact: true }).count(), 1);
    await page.getByRole("button", { name: "开始旋转", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "暂停旋转", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "等轴", exact: true }).getAttribute("aria-pressed"), "false");
  } finally { await context.close(); }
});

test("实体加载失败显示原因且不开放无效交互", async () => {
  const { page, context } = await workspace("no-preference", true);
  try {
    await page.getByRole("status").filter({ hasText: /实体文件加载失败|Failed to fetch/ }).waitFor();
    assert.match(await page.getByRole("toolbar", { name: "3D 模型交互控制" }).innerText(), /预览暂不可用/, "加载失败不能一直显示正在加载");
    assert.equal(await page.getByRole("button", { name: "放大", exact: true }).isDisabled(), true);
    assert.equal(await page.locator(".cad-solid-preview canvas").count(), 0);
  } finally { await context.close(); }
});
