// 当前工作台只读验证：不点击生成/检测/派工，不访问设备控制和模型接口。
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'file:///C:/Users/12587/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const output = 'L:/industry_agent/.runtime/verification/business-returns';
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const failedApis = [];
  const writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
  });
  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() >= 400 && response.status() !== 401) failedApis.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  for (const [view, heading, label] of [
    ['maintenance', '选择维修方案', '维修方案'], ['report', '报告中心', '设备故障处理完成后，自动汇总诊断、维修方案、工单执行和复机记录'],
    ['quality', null, null], ['logs', '日志系统', '运行记录'],
  ]) {
    await page.goto(`http://127.0.0.1:8001/?view=${view}`, { waitUntil: 'domcontentloaded' });
    if (view === 'quality') {
      const workspace = page.getByRole('region', { name: '质检系统', exact: true });
      await page.getByRole('heading', { name: '质量检测', exact: true }).waitFor();
      await page.getByRole('heading', { name: '检测零件', exact: true }).waitFor();
      // 当前质检界面新增只读版本跟随开关；仍禁止手工填写测量值和提交检测表单。
      assert.equal(await workspace.locator('input:not([type="checkbox"]), form, table').count(), 0);
      assert.equal(await workspace.locator('input[type="checkbox"]').count(), 1);
      assert.equal(await workspace.getByRole('checkbox', { name: '跟随最新发布版本', exact: true }).count(), 1);
      assert.equal(await page.getByRole('navigation', { name: '质检来源', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: '比对仪数值演示', exact: true }).count(), 0);
      assert.equal(await workspace.getByRole('combobox', { name: '零件名称', exact: true }).count(), 1);
      assert.equal(await page.getByRole('heading', { name: '工厂产出检测', exact: true }).count(), 0);
      assert.equal(await workspace.getByRole('button', { name: '开始检测', exact: true }).isDisabled(), true);
      await page.getByRole('button', { name: '质检系统', exact: true }).waitFor();
    } else {
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      await page.getByText(label, { exact: false }).first().waitFor();
    }
    if (view === 'report') await page.locator('.report-list-select').first().waitFor();
    if (view === 'maintenance') await page.locator('.maintenance-plan-list-row').first().waitFor();
    await page.screenshot({ path: `${output}/${view}.png`, fullPage: false });
    console.log(JSON.stringify({ view, readable: true }));
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failedApis, []);
  // 经验查询可能由现有页面发起 POST 只读检索；不允许任何业务变更。
  assert.ok(writes.every(url => url.endsWith('/api/experience/search')));
  console.log(JSON.stringify({ pages: 4, pageErrors: errors.length, failedApis: failedApis.length, mutationRequests: 0 }));
} finally { await browser.close(); }
