export function skillUpdateQuota(skill,snapshot) {
  const matches=value=>value?.scope==='skill' && value.agent===skill?.agent && value.name===skill?.name;
  if(matches(snapshot?.value?.update_quota)) return snapshot.value.update_quota;
  if(matches(skill?.update_quota)) return skill.update_quota;
  // 旧服务仍可提供发布计数依据，显示迁移前预览；没有后端确认时不宣称限制已生效。
  const data=snapshot?.value,rate=data?.rollback_rate;
  if(data?.agent!==skill?.agent || data?.name!==skill?.name ||
      !['available','not_applicable'].includes(rate?.status) ||
      !Number.isInteger(rate?.observed_publications) || !Array.isArray(rate.records) ||
      rate.records.length!==rate.observed_publications) return null;
  if(rate.records.some(row=>typeof row.edit_id!=='string' || !row.edit_id || typeof row.old_version!=='string' || typeof row.new_version!=='string')) return null;
  const used=new Set(rate.records.filter(row=>row.counted===true || row.old_version!==row.new_version).map(row=>row.edit_id)).size;
  return {scope:'skill',agent:skill.agent,name:skill.name,limit:3,used,remaining:Math.max(0,3-used),
    complete:true,enforced:false};
}

export function canPublishWithQuota(quota) {
  return quota?.scope==='skill' && quota.complete===true && quota.enforced===true && quota.limit===3 &&
    Number.isInteger(quota.used) && quota.used>=0 && quota.used<quota.limit &&
    Number.isInteger(quota.remaining) && quota.remaining===quota.limit-quota.used;
}
