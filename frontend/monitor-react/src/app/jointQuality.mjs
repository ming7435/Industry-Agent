export const jointStatus={qualified:'合格',unqualified:'不合格',pending:'待判定'};
export const checkStatus={pass:'通过',fail:'不通过',pending:'未完成'};
export function verifiedJointReport(value,batch) {
  const fail=()=>{throw new Error('联合质检结果与当前批次不一致，请刷新核对。');};
  const c=value?.counts, ids=new Set((batch.samples||[]).map(row=>row.part_id));
  if(value?.version!==1 || value.scope!=='measured_batch' || batch.scope!=='measured_batch' || value.batch_id!==batch.batch_id
    || value.request_id!==batch.request_id || value.design_run_id!==batch.design_run_id || value.release_allowed!==false
    || value.execution!=='not_executed' || !c || !Array.isArray(value.items) || value.items.length!==ids.size
    || !Array.isArray(value.types) || !['total','qualified','unqualified','pending','determinate'].every(k=>Number.isSafeInteger(c[k])&&c[k]>=0)
    || c.total!==ids.size || c.determinate!==c.qualified+c.unqualified || c.total!==c.determinate+c.pending) fail();
  const counts={qualified:0,unqualified:0,pending:0};
  for(const row of value.items) {
    if(!ids.delete(row.sample_id) || !checkStatus[row.dimensions] || !checkStatus[row.visual]
      || typeof row.handling!=='string' || !Array.isArray(row.issues)) fail();
    const status=[row.dimensions,row.visual].includes('fail')?'unqualified':row.dimensions===row.visual&&row.visual==='pass'?'qualified':'pending';
    if(row.status!==status) fail(); counts[status]++;
  }
  if(Object.keys(counts).some(k=>counts[k]!==c[k])) fail();
  if(c.determinate ? !Number.isFinite(value.qualified_rate) || Math.abs(value.qualified_rate-100*c.qualified/c.determinate)>.00501 : value.qualified_rate!==null) fail();
  return value;
}
