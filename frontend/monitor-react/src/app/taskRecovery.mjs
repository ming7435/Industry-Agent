export function recoveryLabel(item) {
  if (item.status === 'completed') return '已完成';
  if (!item.can_resume) return '等待核对或处理';
  return item.requires_reconcile ? '核对结果并继续' : '从失败步骤继续';
}

export function createRecoveryCommands(request, newId = () => crypto.randomUUID()) {
  const requests = new Map();
  return {
    async resume(id) {
      if (!requests.has(id)) requests.set(id, newId());
      const result = await request(`/api/runtime/recovery/${encodeURIComponent(id)}/resume`, {
        method: 'POST', body: JSON.stringify({request_id: requests.get(id)}),
      });
      requests.delete(id);
      return result;
    },
  };
}
