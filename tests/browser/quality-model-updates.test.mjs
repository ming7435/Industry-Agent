import test from 'node:test';
import assert from 'node:assert/strict';
import {actualQualityFixture,chooseMeasurements,measuredBatch} from './helpers/actual-quality-fixture.mjs';
import {deferred} from './helpers/center-fixture.mjs';

test('in-flight import locks batch selection and prevents duplicate submissions',async()=>{
  const gate=deferred();const {fixture,page,posts}=await actualQualityFixture({gate});
  try {
    await chooseMeasurements(page);await page.getByRole('button',{name:'核验并保存本批尺寸',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.quality-measurement-import .primary').disabled);
    assert.equal(await page.getByLabel('检测批次',{exact:true}).isDisabled(),true);
    assert.equal(await page.getByLabel('尺寸测量记录（CSV）').isDisabled(),true);
    gate.resolve();await page.getByRole('button',{name:'核验并保存本批尺寸',exact:true}).waitFor();
    assert.equal(posts.length,1);assert.equal(posts[0].body.samples[0].serial_number,'GEAR-001');
    assert.equal(posts[0].body.plan_complete,true);
  }finally{gate.resolve();await fixture.close();}
});
test('failed response can reconcile saved batch by refresh without creating another batch',async()=>{
  const {fixture,page,state,posts}=await actualQualityFixture({stored:false,importFailure:true});
  try {
    await chooseMeasurements(page);await page.getByRole('button',{name:'核验并保存本批尺寸',exact:true}).click();
    await page.getByRole('alert').getByText('保存结果待确认',{exact:true}).waitFor();
    assert.equal(state.stored,true);
    await page.getByRole('button',{name:'刷新批次',exact:true}).click();
    await page.getByRole('heading',{name:'尺寸核验记录',exact:true}).waitFor();
    assert.equal(await page.getByLabel('检测批次',{exact:true}).inputValue(),measuredBatch.request_id);
    assert.equal(posts.length,1);
  }finally{await fixture.close();}
});
