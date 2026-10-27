import test from 'node:test';
import assert from 'node:assert/strict';
import {actualQualityFixture,measuredBatch} from './helpers/actual-quality-fixture.mjs';

test('normal quality page never reads simulation records or auto-generates a batch',async()=>{
  const {fixture,page,reads,posts,errors}=await actualQualityFixture({stored:false});
  try {
    await page.getByRole('tab',{name:'视觉检测',exact:true}).click();
    await page.getByRole('tab',{name:'尺寸检测',exact:true}).click();
    await page.reload();await page.getByRole('heading',{name:'批次尺寸检测',exact:true}).waitFor();
    assert.equal(reads.some(path=>path.includes('/simulation/')||path.includes('/production/virtual/')),false);
    assert.doesNotMatch(await page.locator('.quality-workspace').textContent(),/模拟联合|模拟测量|模拟比对仪|自动生成|历史流程验证/);
    assert.deepEqual(await page.locator('.joint-overview dd').allTextContents(),['—','—件','—件','—件']);
    assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
test('persisted measurements show real limits and leave the missing image pending',async()=>{
  const {fixture,page,posts}=await actualQualityFixture();
  try {
    await page.getByLabel('本次视觉图片对应的样本').selectOption(measuredBatch.samples[0].part_id);
    await page.getByRole('cell',{name:'19.98 ～ 20.02 mm',exact:true}).waitFor();
    await page.getByRole('cell',{name:'20.00 mm',exact:true}).waitFor();
    assert.match(await page.getByRole('article',{name:'所选样本联合处理'}).textContent(),/待判定/);
    assert.equal(await page.locator('.joint-metric-rate dd').textContent(),'—');
    assert.equal(await page.getByText('可能的问题机器 / 位置',{exact:true}).count(),0);
    assert.deepEqual(posts,[]);
  }finally{await fixture.close();}
});
