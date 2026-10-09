import test from 'node:test';import assert from 'node:assert/strict';
const run='FC-'+'a'.repeat(64),job='SIM-JOB-'+'b'.repeat(64),part='SIM-PART-'+'b'.repeat(64);
const check={check_id:'SIM-CHECK-'+'c'.repeat(64),job_id:job,part_id:part,actor_id:'U1',batch_id:'A',design_run_id:run,
  design_digest:'d'.repeat(64),output_digest:'e'.repeat(64),source:'factory-simulation',simulation_only:true,rule:'virtual_profile_dimensions_v1',status:'fail',
  items:[{key:'outer_diameter_mm',name:'加工区外径',expected:'20',actual:'20.1',difference:'0.1',unit:'mm',status:'fail'}]};
test('inspection identity rejects another output and preserves real difference',async()=>{
  const {validateProductionInspection}=await import('./productionQuality.mjs');
  assert.equal(validateProductionInspection(check,{part_id:part,output_digest:check.output_digest}).items[0].difference,'0.1');
  for(const change of [{part_id:'other'},{output_digest:'f'.repeat(64)},{source:'local-simulated-equator-adapter'},{rule:'nominal_exact_demo_v1'}]){
    assert.throws(()=>validateProductionInspection({...check,...change},{part_id:part,output_digest:check.output_digest}));
  }
});
test('rates and selection scopes do not invent samples or blend owners',async()=>{
  const {formatProductionRate,qualitySelectionIdentity}=await import('./productionQuality.mjs');
  assert.equal(formatProductionRate(null),'—');assert.equal(formatProductionRate(0),'0%');assert.equal(formatProductionRate(NaN),'—');
  assert.notEqual(qualitySelectionIdentity('U1',run,'A',part),qualitySelectionIdentity('U2',run,'A',part));
});
