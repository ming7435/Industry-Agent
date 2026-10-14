import test from 'node:test';
import assert from 'node:assert/strict';
import { traceEventSummary, traceDetailSections } from './traceLog.mjs';

test('移除失败面板后原始失败事件仍保留错误状态和原因', () => {
  const record={type:'agent',event:'agent_error',agent:'maintenance',task_id:'TASK-FAIL',
    error:'维修方案服务 HTTP 503',can_resume:true};
  assert.equal(traceEventSummary(record).status,'异常');
  assert.match(JSON.stringify(traceDetailSections(record)),/维修方案服务 HTTP 503/);
  assert.equal(record.error,'维修方案服务 HTTP 503');
});

test('历史成功事件和失败事件在执行明细中保持不同状态', () => {
  assert.equal(traceEventSummary({type:'agent',event:'agent_completed',name:'maintenance'}).status,'已完成');
  assert.equal(traceEventSummary({type:'agent',event:'agent_error',name:'maintenance',error:'依据不足'}).status,'异常');
});
