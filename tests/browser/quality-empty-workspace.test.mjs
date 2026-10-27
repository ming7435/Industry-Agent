import test from 'node:test';
import assert from 'node:assert/strict';
import {actualQualityFixture} from './helpers/actual-quality-fixture.mjs';

test('without measurement records quality stays empty and preserves unrelated CAD data',async()=>{
  const {fixture,page,posts}=await actualQualityFixture({stored:false});
  try {
    assert.equal(await page.getByRole('button',{name:'核验并保存本批尺寸',exact:true}).isDisabled(),true);
    assert.equal(await page.getByLabel('本次视觉图片对应的样本').isDisabled(),true);
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('freecad.active-run')).draft_part_name),'未提交草稿');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('quality-sim-pending')),'old-simulation-request');
    assert.deepEqual(posts,[]);
  }finally{await fixture.close();}
});
test('logged-out page does not read private batches or enable measurement import',async()=>{
  const {fixture,page,reads,posts}=await actualQualityFixture({loggedIn:false});
  try {
    await page.getByText(/请先通过顶部.*登录账号/).waitFor();
    assert.equal(await page.getByLabel('尺寸测量记录（CSV）').isDisabled(),true);
    assert.equal(reads.includes('/api/quality/vision/batches'),false);
    assert.deepEqual(posts,[]);
  }finally{await fixture.close();}
});
test('unverifiable saved measurement never reuses an old simulated pass',async()=>{
  const {fixture,page,posts}=await actualQualityFixture({readFailure:true});
  try {
    await page.getByRole('alert').getByText('实测记录待核验',{exact:true}).waitFor();
    assert.equal(await page.locator('.joint-metric-rate dd').textContent(),'—');
    assert.equal(await page.getByRole('heading',{name:'尺寸核验记录',exact:true}).count(),0);
    assert.deepEqual(posts,[]);
  }finally{await fixture.close();}
});
