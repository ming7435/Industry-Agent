import test from 'node:test';
import assert from 'node:assert/strict';

const id='FC-'+'a'.repeat(64), jobId='SIM-JOB-'+'b'.repeat(64);
const fixture=()=>({job_id:jobId,part_id:'SIM-PART-'+'b'.repeat(64),actor_id:'U1',design_run_id:id,
  design_digest:'c'.repeat(64),program_digest:'d'.repeat(64),revision:1,status:'received',sync_status:'confirmed',
  source:'factory-simulation',simulation_only:true,progress:0,output:null});

test('job validation keeps design owner and saved digest identities',async()=>{
  const {validateProductionJob}=await import('./virtualProduction.mjs');
  assert.equal(validateProductionJob(fixture(),{design_run_id:id,actor_id:'U1'}).status,'received');
  for(const field of ['design_run_id','actor_id','program_digest','source','status']){
    assert.throws(()=>validateProductionJob({...fixture(),[field]:'wrong'},{design_run_id:id,actor_id:'U1'}));
  }
  assert.throws(()=>validateProductionJob({...fixture(),progress:NaN}));
  assert.throws(()=>validateProductionJob({...fixture(),revision:true}));
});

test('completed job requires matching factory output and preserves unknown states',async()=>{
  const {validateProductionJob,formatProductionStatus,productionPendingKey}=await import('./virtualProduction.mjs');
  assert.throws(()=>validateProductionJob({...fixture(),status:'completed'}));
  assert.match(formatProductionStatus({...fixture(),sync_status:'outcome_unknown'}),/待核对/);
  assert.match(formatProductionStatus({...fixture(),status:'paused'}),/暂停/);
  assert.notEqual(productionPendingKey('U1',id),productionPendingKey('U2',id));
});
