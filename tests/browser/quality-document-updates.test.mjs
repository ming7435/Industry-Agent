import test from 'node:test';
import assert from 'node:assert/strict';
import {actualQualityFixture,measuredBatch} from './helpers/actual-quality-fixture.mjs';

test('publishing a new CAD model cannot rewrite a physical batch drawing or measurements',async()=>{
  const {fixture,page,posts}=await actualQualityFixture();
  try {
    await page.evaluate(()=>{
      localStorage.setItem('freecad.completed-designs',JSON.stringify([{run_id:'FC-new',part_name:'新图纸',revision:99}]));
      window.dispatchEvent(new Event('freecad:completed'));
    });
    await page.getByRole('button',{name:'刷新批次',exact:true}).click();
    assert.equal(await page.getByLabel('检测批次',{exact:true}).inputValue(),measuredBatch.request_id);
    await page.getByText('图纸版本：DRAWING-A/03 · 标准：QA fixture standard',{exact:true}).waitFor();
    assert.deepEqual(posts,[]);
  }finally{await fixture.close();}
});
