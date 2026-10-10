import test from 'node:test';
import assert from 'node:assert/strict';
import {readQualityCandidates} from './qualityParts.mjs';

const oldId='FC-'+'a'.repeat(64),newId='FC-'+'b'.repeat(64);
const storage=values=>({getItem:key=>values[key]||null});

test('quality merges the completed cross-tab model index and follows its newer full version',()=>{
  const local=storage({'freecad.active-run':JSON.stringify({run_id:oldId,prompt:'旧设计',command_id:'saved'}),
    'freecad.design-versions':JSON.stringify([{run_id:oldId,status:'completed',created_at:1}])});
  const shared=storage({'freecad.completed-designs.v1':JSON.stringify([
    {run_id:oldId,status:'completed',created_at:1},
    {run_id:newId,status:'completed',created_at:2},
    {run_id:'FC-invalid',status:'completed',created_at:3},
    {run_id:'FC-'+'c'.repeat(64),status:'running',created_at:4},
  ])});
  const source=readQualityCandidates(local,shared);
  assert.equal(source.currentRunId,newId);
  assert.equal(source.automaticRunId,newId);
  assert.deepEqual(source.candidates.map(row=>[row.run_id,row.version]),[[newId,2],[oldId,1]]);
  assert.equal(JSON.parse(local.getItem('freecad.active-run')).run_id,oldId);
});

test('a new cross-tab version never inherits the previous version identity as a fallback',()=>{
  const local=storage({'freecad.active-run':JSON.stringify({run_id:oldId,prompt:'旧设计',command_id:'saved',part_name:'旧名称',part_number:'12345'})});
  const shared=storage({'freecad.completed-designs.v1':JSON.stringify([{run_id:newId,status:'completed',created_at:2}])});
  const source=readQualityCandidates(local,shared);
  assert.equal(source.candidates[0].part_name,'');
  assert.equal(source.candidates[0].part_number,'');
});
