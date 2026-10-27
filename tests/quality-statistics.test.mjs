import test from 'node:test';
import assert from 'node:assert/strict';
import {dimensionDefectTypes,verifiedVisionStatistics} from '../frontend/monitor-react/src/app/qualityStatistics.mjs';

test('dimension types count repeated parameters separately from affected samples and keep quantity distinct',()=>{
  const result={status:'partial',issues:[{kind:'number',key:'length',part_id:'A'},{kind:'number',key:'width',part_id:'A'},
    {kind:'count',key:'model.solid_count',part_id:'B'}]};
  const groups=dimensionDefectTypes(result);
  assert.equal(groups[0].occurrences,2);assert.equal(groups[0].sample_count,1);
  assert.equal(groups[1].key,'quantity');assert.equal(groups[1].sample_count,1);
  assert.deepEqual(dimensionDefectTypes({...result,status:'review'}),[]);
});

test('empty statistics never fabricate a pass rate or reuse another source',()=>{
  const value={version:1,unit:'image_inspection',image_source:'upload',part_id:'',
    counts:{total:0,qualified:0,unqualified:0,unlocalized:0},qualified_rate:null,types:[],invalid_records:0,research_model_count:0,truncated:false};
  assert.equal(verifiedVisionStatistics(value,'upload',''),value);
  assert.throws(()=>verifiedVisionStatistics({...value,qualified_rate:100},'upload',''));
  assert.throws(()=>verifiedVisionStatistics(value,'public_gear_reference',''));
  assert.throws(()=>verifiedVisionStatistics(value,'upload','another-part'));
});
