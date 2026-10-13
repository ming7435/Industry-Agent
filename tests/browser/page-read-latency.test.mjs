import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond, deferred} from './helpers/center-fixture.mjs';

test('任务详情短暂503后自动重试，队列保持可见', async()=>{
  const fixture=await centerFixture({actor:{user_id:'U-A',role:'technician'}});
  const context=await fixture.browser.newContext(),page=await context.newPage();let reads=0;
  await page.clock.install();
  try {
    await page.route('**/api/**',route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/api/workorders')return respond(route,{summary:true,items:[{_summary_record:true,workorder_id:'WO-RETRY',device_id:'D-MOCK',assignee:'U-A',status:'in_progress',updated_at:'v1'}]});
      if(path==='/api/workorders/WO-RETRY')return ++reads===1?respond(route,{detail:'短暂不可用'},503):respond(route,{workorder_id:'WO-RETRY',device_id:'D-MOCK',assignee:'U-A',status:'in_progress'});
      return respond(route,{items:[]});
    });
    await page.goto(`${fixture.base}/?view=workorder`);
    await page.getByRole('status').filter({hasText:'任务详情暂不可用'}).waitFor();
    assert.ok(await page.getByRole('button',{name:/WO-RETRY/}).isVisible());
    await page.clock.runFor(3100);
    await page.locator('.workorder-titlebar').waitFor({timeout:1500});
    assert.equal(reads,2);
  } finally {await context.close();await fixture.close();}
});

test('工单目录先展示，任务详情按选中读取并复用同版本，正常状态不提供刷新按钮', async () => {
  const fixture=await centerFixture({actor:{user_id:'U-A',role:'technician'}});
  const context=await fixture.browser.newContext(),page=await context.newPage();
  const started=deferred(),release=deferred(),reads=[];
  try {
    await page.route('**/api/**',async route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/api/workorders')return respond(route,{summary:true,items:[{_summary_record:true,workorder_id:'WO-SMALL',device_id:'D-MOCK',assignee:'U-A',status:'in_progress',updated_at:'v1',title:'轻量队列任务'}]});
      if(path==='/api/workorders/WO-SMALL'){reads.push(path);started.resolve();await release.promise;return respond(route,{workorder_id:'WO-SMALL',device_id:'D-MOCK',assignee:'U-A',status:'in_progress',updated_at:'v1',steps:['现场检查内容']});}
      return respond(route,{items:[]});
    });
    const detailRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/workorders/WO-SMALL',{timeout:2000});
    await page.goto(`${fixture.base}/?view=workorder`);await detailRead;await started.promise;
    await page.getByRole('button',{name:/WO-SMALL/}).waitFor();
    assert.equal(await page.getByRole('button',{name:'刷新工单',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'删除工单',exact:true}).count(),0);
    release.resolve();await page.locator('.workorder-titlebar').waitFor();
    const poll=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/workorders');await poll;
    assert.deepEqual(reads,['/api/workorders/WO-SMALL']);
  } finally {release.resolve();await context.close();await fixture.close();}
});

test('工单内容不等待慢产线状态；只读请求不触发创建或控制', async () => {
  const fixture = await centerFixture({actor:{user_id:'U-A',role:'technician'}});
  const context = await fixture.browser.newContext(), page = await context.newPage();
  const line = deferred(), started = deferred(), writes = [];
  try {
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (route.request().method() !== 'GET') {writes.push(path);return route.abort();}
      if (path === '/api/team/line') {started.resolve();await line.promise;return respond(route,{state:'stopped'});}
      if (path === '/api/workorders') return respond(route,{items:[{workorder_id:'WO-FAST',device_id:'D-MOCK',assignee:'U-A',status:'in_progress',title:'及时显示工单'}]});
      return respond(route,{items:[]});
    });
    await page.goto(`${fixture.base}/?view=workorder`);
    await started.promise;
    await page.getByRole('button',{name:/WO-FAST/}).waitFor({timeout:1500});
    assert.deepEqual(writes,[]);
  } finally {line.resolve();await context.close();await fixture.close();}
});

test('报告目录先出现，正文按选中读取；未变版本不重复读取，换选中丢弃旧返回', async () => {
  const fixture = await centerFixture();
  const context = await fixture.browser.newContext(), page = await context.newPage();
  const slow = deferred(), started = deferred(), details = [], writes = [];
  let stamp='v1';
  const items=()=>[{report_id:'R-A',title:'报告甲',status:'completed',updated_at:stamp},
                  {report_id:'R-B',title:'报告乙',status:'completed',updated_at:'v1'}];
  try {
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      if(route.request().method()!=='GET'){writes.push(url.pathname);return route.abort();}
      if(url.pathname==='/api/reports') return respond(route,{items:items()});
      if(url.pathname==='/api/reports/R-A') {details.push('A');started.resolve();await slow.promise;return respond(route,{report:{report_id:'R-A',title:'报告甲',article_text:'旧请求甲的正文',updated_at:stamp}});}
      if(url.pathname==='/api/reports/R-B') {details.push('B');return respond(route,{report:{report_id:'R-B',title:'报告乙',article_text:'及时显示乙的正文',updated_at:'v1'}});}
      return respond(route,{items:[]});
    });
    const selectedRead=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/reports/R-A',{timeout:2000});
    await page.goto(`${fixture.base}/?view=report`);await selectedRead;await started.promise;
    await page.locator('.report-list-select').filter({hasText:'报告乙'}).click({timeout:1500});
    await page.locator('.report-article').filter({hasText:'及时显示乙的正文'}).waitFor();
    slow.resolve();
    const secondPoll=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/reports');
    await secondPoll;
    assert.deepEqual(details.filter(value=>value==='B'),['B']);
    assert.match(await page.locator('.report-panel').innerText(),/及时显示乙的正文/);
    assert.doesNotMatch(await page.locator('.report-panel').innerText(),/旧请求甲的正文/);
    assert.deepEqual(writes,[]);
  } finally {slow.resolve();await context.close();await fixture.close();}
});
