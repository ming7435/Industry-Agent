export function dimensionDefectTypes(result) {
  if (!result || result.status === 'review') return [];
  const groups = new Map();
  for (const issue of result.issues || []) {
    const key = issue.kind === 'count' ? 'quantity' : issue.kind === 'choice' ? 'direction'
      : /position|center|offset/.test(issue.key || '') ? 'position' : 'dimension';
    const label = {quantity:'数量不一致',direction:'方向不一致',position:'位置偏差',dimension:'尺寸偏差'}[key];
    if (!groups.has(key)) groups.set(key, {key, label, occurrences:0, samples:new Set()});
    const row = groups.get(key); row.occurrences++; row.samples.add(issue.part_id);
  }
  return [...groups.values()].map(row => ({...row, sample_count:row.samples.size}));
}

export function verifiedVisionStatistics(value, source, partId) {
  const invalid = () => {throw new Error('质检统计返回无效，请刷新重试。');};
  const natural = n => Number.isSafeInteger(n) && n >= 0;
  const c=value?.counts;
  if(value?.version!==1 || value.unit!=='image_inspection' || value.image_source!==source || value.part_id!==partId
    || !c || !['total','qualified','unqualified','unlocalized'].every(k=>natural(c[k]))
    || c.total!==c.qualified+c.unqualified || c.unlocalized>c.unqualified || !Array.isArray(value.types)
    || !natural(value.invalid_records) || !natural(value.research_model_count) || value.research_model_count>c.total
    || typeof value.truncated!=='boolean') invalid();
  if(c.total ? typeof value.qualified_rate!=='number' || !Number.isFinite(value.qualified_rate)
    || Math.abs(value.qualified_rate-100*c.qualified/c.total)>.00501 : value.qualified_rate!==null) invalid();
  const keys=new Set();
  for(const row of value.types) {
    if(!row || typeof row.key!=='string' || !row.key || keys.has(row.key) || typeof row.label!=='string' || !row.label
      || !natural(row.image_count) || !row.image_count || row.image_count>c.unqualified || !natural(row.occurrences)
      || typeof row.share!=='number' || !Number.isFinite(row.share) || Math.abs(row.share-100*row.image_count/c.unqualified)>.00501) invalid();
    keys.add(row.key);
  }
  return value;
}
