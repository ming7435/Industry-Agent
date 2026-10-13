export function recoveryLabel(item) {
  if (item.status === 'completed') return '历史任务已完成';
  return item.requires_reconcile ? '原操作结果待核对' : '等待人工处理';
}
