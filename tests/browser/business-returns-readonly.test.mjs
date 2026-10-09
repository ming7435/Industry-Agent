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
    ['maintenance', '选择维修方案', '维修方案'], ['report', '报告中心', '从已有业务记录生成报告'],
    ['quality', null, null], ['logs', '日志系统', '运行记录'],
  ]) {
    await page.goto(`http://127.0.0.1:8001/?view=${view}`, { waitUntil: 'domcontentloaded' });
    if (view === 'quality') {
      const workspace = page.getByRole('region', { name: '质检系统', exact: true });
      await workspace.waitFor({ state: 'attached' });
      assert.equal((await workspace.textContent()).trim(), '');
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
