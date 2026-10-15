import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

test('监控只提供小时、天、周、月，范围改变同时更新两张曲线、总量和日期刻度',async()=>{
  const fixture=await centerFixture({withStyles:true}),page=await fixture.browser.newPage({viewport:{width:1280,height:1000}});
  const reads=[],writes=[],errors=[];
  const scenarios={
    60:{grain:60,label:'每分钟',times:['2026-10-15T01:00:00Z','2026-10-15T01:01:00Z'],calls:[1,2],tokens:[100,200]},
    1440:{grain:3600,label:'每小时',times:['2026-10-14T23:00:00Z','2026-10-15T00:00:00Z'],calls:[10,20],tokens:[1000,2000]},
    10080:{grain:86400,label:'每天',times:['2026-10-12T16:00:00Z','2026-10-14T16:00:00Z'],calls:[100,200],tokens:[10000,20000]},
    43200:{grain:86400,label:'每天',times:['2026-09-30T16:00:00Z','2026-10-14T16:00:00Z'],calls:[1000,2000],tokens:[100000,200000]},
  };
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()!=='GET'){writes.push(url.pathname);return route.abort();}
    if(url.pathname!=='/api/runtime/metrics')return respond(route,{runs:[]});
    const selected=Number(url.searchParams.get('window_minutes'));reads.push(selected);
    const scenario=scenarios[selected];
    if(!scenario)return respond(route,{detail:'unsupported'},422);
    const total=scenario.tokens[0]+scenario.tokens[1],calls=scenario.calls[0]+scenario.calls[1];
    return respond(route,{generated_at:'2026-10-15T02:00:00Z',window_minutes:selected,model:{available:true,scope:'model_service_process',
      started_at:'2026-09-01T00:00:00Z',window_start:scenario.times[0],observed_seconds:selected*60,
      bucket_seconds:scenario.grain,timezone:'Asia/Shanghai',calls,successful:calls,failed:0,inflight:0,success_rate:1,
      usage:{input_tokens:total,output_tokens:0,total_tokens:total,reported_calls:calls,missing_calls:0},capabilities:[],
      timeline:scenario.times.map((at,index)=>({at,calls:scenario.calls[index],failed:0,total_tokens:scenario.tokens[index]}))},
      agent:{available:false,message:'本测试无 Agent 样本'}});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    const select=page.getByLabel('监控时间范围');
    await select.waitFor();
    assert.deepEqual(await select.locator('option').evaluateAll(nodes=>nodes.map(node=>({value:node.value,label:node.textContent}))),[
      {value:'60',label:'最近 1 小时'},{value:'1440',label:'最近 1 天'},
      {value:'10080',label:'最近 1 周'},{value:'43200',label:'最近 1 个月（30天）'},
    ]);
    assert.equal(await select.inputValue(),'60');
    for(const [minutes,callLabels,tokenLabels,total,label] of [
      ['60',['1','2'],['100','200'],'300','每分钟'],
      ['1440',['10','20'],['1,000','2,000'],'3,000','每小时'],
      ['10080',['100','200'],['10,000','20,000'],'30,000','每天'],
      ['43200',['1,000','2,000'],['100,000','200,000'],'300,000','每天'],
    ]){
      if(minutes!=='60'){
        const response=page.waitForResponse(value=>value.url().includes(`window_minutes=${minutes}`));
        await select.selectOption(minutes);await response;
      }
      const callChart=page.getByRole('img',{name:new RegExp(`${label}模型调用量折线图`)});
      const tokenChart=page.getByRole('img',{name:new RegExp(`${label} Token 消耗量折线图`)});
      await tokenChart.waitFor();
      assert.deepEqual(await callChart.locator('.runtime-trend-value').allTextContents(),callLabels);
      assert.deepEqual(await tokenChart.locator('.runtime-trend-value').allTextContents(),tokenLabels);
      assert.equal(await page.locator('.runtime-metric').first().locator('strong').innerText(),total);
      if(Number(minutes)>=10080){
        const dates=(await tokenChart.locator('.runtime-trend-tick').allTextContents()).filter(value=>/10\//.test(value));
        assert.deepEqual(dates,minutes==='10080'?['10/13','10/15']:['10/1','10/15'],'每日刻度应按实际日期定位，不能插入重复的半天标签');
      }
    }
    assert.deepEqual(reads,[60,1440,10080,43200]);
    await page.screenshot({path:'.runtime/verification/runtime-long-windows-month-20261015.png',fullPage:true});
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
