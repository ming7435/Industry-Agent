import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond } from './helpers/center-fixture.mjs';

async function setup(options = {}) {
  const fixture = await centerFixture(options);
  const page = await fixture.browser.newPage();
  const qualityRequests = [], writes = [], errors = [];
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (/\/quality(?:\/|$)|\/closure-tasks(?:\/|$)/.test(path)) qualityRequests.push(path);
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(path);
    if (path.endsWith('/team/me')) return respond(route, {}, 401);
    return respond(route, { items: [{ quality_check_id: 'QC-OLD', result: 'failed' }], devices: [], runs: [],
      runner: { last_error: options.fullApp ? 'Factory unavailable' : '' } });
  });
  return { fixture, page, qualityRequests, writes, errors };
}

test('清空后的质检页面没有表单、结果或历史，也不读取或写入旧质检数据', async () => {
  const { fixture, page, qualityRequests, writes, errors } = await setup();
  try {
    await page.goto(fixture.base + '/?view=quality&design_run_id=FC-old');
    const workspace = page.getByRole('region', { name: '质检系统', exact: true });
    await workspace.waitFor({ state: 'attached' });
    assert.equal((await workspace.textContent()).trim(), '');
    assert.equal(await workspace.locator('input, button, form, table, a').count(), 0);
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});

test('左侧质检入口保留，离开再进入质检仍为空白且不加载历史', async () => {
  const { fixture, page, qualityRequests, writes, errors } = await setup({ fullApp: true });
  try {
    await page.goto(fixture.base + '/?view=quality');
    const entry = page.getByRole('button', { name: '质检系统', exact: true });
    await entry.waitFor();
    assert.equal((await page.locator('main').textContent()).trim(), '');
    await page.getByRole('button', { name: '日志系统', exact: true }).click();
    await page.getByRole('heading', { name: '日志系统', exact: true }).waitFor();
    await entry.click();
    const workspace = page.getByRole('region', { name: '质检系统', exact: true });
    await workspace.waitFor({ state: 'attached' });
    assert.equal((await workspace.textContent()).trim(), '');
    assert.deepEqual(qualityRequests, []);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await fixture.close(); }
});
