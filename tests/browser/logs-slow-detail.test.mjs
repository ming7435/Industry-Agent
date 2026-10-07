import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { centerFixture, deferred, respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const frame = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));

test('运行持续新增事件时慢首次详情仍能呈现且正文请求保持单次在途', async () => {
  const appSource = await readFile(resolve(root, 'frontend/monitor-react/src/app/App.jsx'), 'utf8');
  const fixture = await centerFixture();
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  const started = deferred();
  const pending = [], writes = [], errors = [];
  let indexReads = 0, firstReadVisible = false, requestsBeforeFirstCompletion = 0;
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.clock.install();
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (route.request().method() !== 'GET') {
        writes.push({ method: route.request().method(), path: url.pathname });
        return route.abort();
      }
      if (url.pathname === '/api/runs') {
        const version = ++indexReads;
        return respond(route, { runs: [{
          run_id: 'fault:SLOW', run_type: 'fault', label: '持续增长的运行', status: 'running',
          trace_id: 'TRACE-SLOW', trace_ids: ['TRACE-SLOW'], task_ids: ['TASK-SLOW'],
          event_count: version, ended_at: `2026-10-07T00:00:${String(version).padStart(2, '0')}Z`, phases: [],
        }] });
      }
      if (url.pathname === '/api/trace') { pending.push(route); started.resolve(); return; }
      return respond(route, {});
    });
    await page.goto(`${fixture.base}/?view=logs`);
    await started.promise;
    // The first full-body read takes longer than two index polling cycles.
    await page.clock.runFor(5000); await frame(page);
    await page.clock.runFor(5000); await frame(page);
    requestsBeforeFirstCompletion = pending.length;
    assert.ok(indexReads >= 3, '索引仍需在慢正文请求期间更新');
    await respond(pending[0], { trace: [{
      trace_record_id: 'REC-SLOW-OWNER', trace_id: 'TRACE-SLOW', task_id: 'TASK-SLOW',
      agent: 'memory', agent_run_id: 'MEMORY-SLOW', type: 'agent', event: 'agent_completed', name: 'memory',
      output: { summary: 'FIRST-SLOW-DETAIL' }, timestamp: '2026-10-07T00:00:01Z',
    }] });
    await frame(page);
    firstReadVisible = (await page.locator('.logs-workspace').innerText()).includes('FIRST-SLOW-DETAIL');
    assert.equal(firstReadVisible, true, '索引版本增长不得取消同一运行的首次完整正文并让加载无限等待');
    assert.equal(requestsBeforeFirstCompletion, 1, '同一运行最多一个完整正文请求在途，完成后再读取新版本');
    assert.equal(pending.length, 2, '首次正文完成后应补取已增长的最新版本');
    await respond(pending[1], { trace: [{
      trace_record_id: 'REC-SLOW-LATEST', trace_id: 'TRACE-SLOW', task_id: 'TASK-SLOW',
      agent: 'memory', agent_run_id: 'MEMORY-SLOW', type: 'agent', event: 'agent_completed', name: 'memory',
      output: { summary: 'LATEST-SLOW-DETAIL' }, timestamp: '2026-10-07T00:00:03Z',
    }] });
    await frame(page);
    assert.ok((await page.locator('.logs-workspace').innerText()).includes('LATEST-SLOW-DETAIL'), '补取后必须显示最新正文');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally {
    const dir = resolve(root, '.runtime/verification/logs-reentry-20261007');
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'slow-detail-observation.json'), JSON.stringify({
      app_sha256: createHash('sha256').update(appSource).digest('hex'), api_mocked: true,
      first_detail_delay_ms: 10000, index_reads_before_first_completion: indexReads,
      detail_requests_before_first_completion: requestsBeforeFirstCompletion, first_detail_visible: firstReadVisible,
      writes, errors,
    }, null, 2));
    await context.close(); await fixture.close();
  }
});
