// 业务页面仅展示可读事实；原始执行明细仍由日志和原数据保留。
const INTERNAL_TEXT = /^(?:历史趋势|停止原因|工具调用|工具返回|模型返回|执行回执|校验明细)\s*[:：]|^(?:Monitor|Runtime|Evaluator)\b|\b(?:validator_pass|replan_limit_exceeded|insufficient_engineering_data|validation_findings|EXP-[0-9A-F]{8,})\b|[a-z0-9_-]+\.pdf\b/i;

export function businessText(value) {
  if (typeof value !== 'string') return '';
  return value.split(/[；;\n]+/).map(part => part.trim())
    .filter(part => part && !INTERNAL_TEXT.test(part)).join('；');
}
