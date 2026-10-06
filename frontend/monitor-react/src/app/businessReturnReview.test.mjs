import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from './apiRequest.mjs';
import * as reportView from './reportView.mjs';

test('派工只读前置拒绝保留明确的未执行信息', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => ({ detail: { message: '设备读取失败', execution_started: false } }) });
  try {
    await assert.rejects(request('/api/maintenance/plans/P/retry'), error => error.detail?.execution_started === false && error.status === 502);
  } finally { globalThis.fetch = original; }
});

test('报告同时保留初检失败与有效复检关闭结果', () => {
  const quality = { passed: false, result: 'failed', status: 'closed', reinspection: { passed: true, reinspection_check_id: 'QC-NEW' } };
  assert.match(reportView.buildReportDisplaySections({ quality })[0].body, /初检未通过.*复检通过.*已关闭/);
  assert.equal(reportView.reportQualityLabel(quality), '初检未通过；复检通过，已关闭');
  assert.equal(reportView.reportQualityLabel({ passed: false, result: 'review', status: 'open' }), '未检测或数据不足');
  assert.equal(reportView.reportQualityLabel({ passed: false, result: 'failed', status: 'closed' }), '未通过');
});
