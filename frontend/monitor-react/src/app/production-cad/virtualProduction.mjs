import {request} from '../apiRequest.mjs';

export const productionPendingKey=(actorId,runId)=>`production.virtual.pending:${actorId}:${runId}`;
export const productionRequest=(path,options={})=>request('/api/production/virtual'+path,{credentials:'same-origin',...options});
const hex=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);

export function validateProductionJob(value,expected={}){
  const invalid=()=>{throw new Error('生产任务身份或事实不完整，请核对原指令。');};
  if(!value||!/^SIM-JOB-[a-f0-9]{64}$/.test(value.job_id||'')||value.part_id!=='SIM-PART-'+value.job_id.slice(8)
    ||!/^FC-[a-f0-9]{64}$/.test(value.design_run_id||'')||!hex(value.design_digest)||!hex(value.program_digest)
    ||typeof value.actor_id!=='string'||!value.actor_id||!Number.isInteger(value.revision)||value.revision<1
    ||value.source!=='factory-simulation'||value.simulation_only!==true
    ||!['prepared','received','running','paused','interrupted','completed'].includes(value.status)
    ||!['pending','confirmed','outcome_unknown','unavailable','review'].includes(value.sync_status)
    ||typeof value.progress!=='number'||!Number.isFinite(value.progress)||value.progress<0||value.progress>1)invalid();
  if(Object.entries(expected).some(([key,want])=>want&&value[key]!==want))invalid();
  const output=value.output;
  if(value.status==='completed'&&value.sync_status==='confirmed'&&!output)invalid();
  if(output&&(output.job_id!==value.job_id||output.part_id!==value.part_id||output.design_run_id!==value.design_run_id
    ||output.design_digest!==value.design_digest||output.program_digest!==value.program_digest||!hex(output.output_digest)
    ||output.source!=='factory-simulation'||output.simulation_only!==true||output.synthetic!==true||output.units!=='mm'))invalid();
  return value;
}

export function formatProductionStatus(job){
  if(job?.sync_status==='review')return '待复核';
  if(job?.sync_status==='outcome_unknown')return '结果待核对';
  if(job?.sync_status==='unavailable')return '同步暂不可用';
  return {prepared:'方案已保存',received:'工厂已接收',running:'加工中',paused:'加工暂停',interrupted:'加工中断',completed:'模拟加工完成'}[job?.status]||'尚未生成方案';
}

export function virtualDesignSupport(run){
  if(!run||run.status!=='completed'||run.validation?.valid!==true||run.validation?.step_roundtrip!==true||run.validation?.solid_count!==1||run.synthetic||run.degraded)return '设计尚未完成实体及 STEP 校验。';
  const ops=run.spec?.operations;
  if(run.spec?.units!=='mm'||!Array.isArray(ops)||ops.length<1||ops.length>2||run.spec.parts||run.spec.bim||run.spec.sheet_metal
    ||ops.some(op=>op.type!=='cylinder')||(ops[0].mode||'add')!=='add')return '当前模拟工厂仅支持圆柱及单个同轴通孔。';
  if(ops.length===2){
    const [base,hole]=ops,axis='xyz'.indexOf(base.axis);
    if(hole.mode!=='cut'||hole.axis!==base.axis||axis<0||!Array.isArray(base.position)||!Array.isArray(hole.position)
      ||hole.position.some((value,index)=>index!==axis&&value!==base.position[index])
      ||hole.position[axis]>base.position[axis]||hole.position[axis]+hole.length<base.position[axis]+base.length)return '仅支持沿主体轴贯通的同轴圆孔。';
  }
  return '';
}
