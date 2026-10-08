const deletedPlans = new Set();
const listeners = new Set();

export const deletedMaintenancePlanIds = () => [...deletedPlans];
export function rememberDeletedMaintenancePlans(ids = []) {
  for (const id of ids) if (typeof id === 'string' && id) deletedPlans.add(id);
}
export function subscribeMaintenanceChanges(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function publishMaintenanceChange(actor, change) {
  rememberDeletedMaintenancePlans(change.deleted_plan_ids);
  const detail = {...change, actorKey: JSON.stringify([actor?.user_id || '', actor?.role || ''])};
  for (const listener of listeners) listener(detail);
}
