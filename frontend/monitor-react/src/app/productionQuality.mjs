import {productionRequest,validateProductionJob} from './production-cad/virtualProduction.mjs';
export const qualitySelectionIdentity=(actorId,runId,batchId,partId)=>JSON.stringify([actorId,runId,batchId,partId]);
export const formatProductionRate=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100?`${value}%`:'—';
export const inspectionStatus={pass:'参数一致',fail:'参数不一致',insufficient_data:'缺少测量值',review:'待复核',pending:'待检测'};
export function validateProductionInspection(value,expected={}){
  if(!value||!/^SIM-CHECK-[a-f0-9]{64}$/.test(value.check_id||'')||value.rule!=='virtual_profile_dimensions_v1'
    ||value.source!=='factory-simulation'||value.simulation_only!==true||!Object.hasOwn(inspectionStatus,value.status)||value.status==='pending'
    ||!Array.isArray(value.items)||!value.items.length||Object.entries(expected).some(([key,want])=>want&&value[key]!==want)
    ||value.items.some(item=>!['pass','fail','insufficient_data','review'].includes(item.status)||item.unit!=='mm'
      ||typeof item.expected!=='string'||!Number.isFinite(Number(item.expected))
      ||(item.actual!==null&&(typeof item.actual!=='string'||!Number.isFinite(Number(item.actual))))
      ||(item.difference!==null&&(typeof item.difference!=='string'||!Number.isFinite(Number(item.difference))))))throw new Error('检测记录与所选产出不一致，请核对保存记录。');
  return value;
}
export async function readProductionJobs(options={}){
  const values=[],seen=new Set();let cursor='';
  for(let page=0;page<100;page++){
    const result=await productionRequest('/jobs?'+new URLSearchParams({limit:'50',...(cursor?{cursor}:{})}),options);
    if(!Array.isArray(result.items))throw new Error('生产任务目录格式不完整。');
    values.push(...result.items.map(value=>validateProductionJob(value)));
    if(!result.next_cursor)return values;
    if(seen.has(result.next_cursor))throw new Error('生产任务目录游标重复。');seen.add(result.next_cursor);cursor=result.next_cursor;
  }
  throw new Error('生产任务目录过大，请按版本查询。');
}
