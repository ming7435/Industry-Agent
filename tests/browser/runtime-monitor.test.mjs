import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

const metrics={generated_at:'2026-10-15T02:15:00Z',window_minutes:60,model:{available:true,scope:'model_service_process',
  started_at:'2026-10-15T01:00:00Z',observed_seconds:3600,calls:4,successful:3,failed:1,inflight:1,synthetic_calls:0,
  success_rate:0.75,requests_per_minute:4/60,tokens_per_minute:2.5,partial:false,
  usage:{input_tokens:120,output_tokens:30,total_tokens:150,reported_calls:3,missing_calls:1},
  duration_ms:{average:1200,p95:3000,maximum:3000},capabilities:[],timeline:[
    {at:'2026-10-15T02:00:00Z',calls:1,failed:0,total_tokens:60},
    {at:'2026-10-15T02:05:00Z',calls:1,failed:0,total_tokens:50},
    {at:'2026-10-15T02:10:00Z',calls:2,failed:1,total_tokens:40}]},
  agent:{available:true,partial:false,agents:{completed:2,failed:0,success_rate:1},tools:{completed:3,failed:1,success_rate:.75}}};

test('监控位于折叠日志上方，明细按需读取，时间窗只发GET且切页停止轮询',async()=>{
  const fixture=await centerFixture({fullApp:true,withStyles:true}),page=await fixture.browser.newPage();
  const reads=[],writes=[],errors=[];
  await page.clock.install();
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),url=new URL(req.url());
    if(req.method()!=='GET'){writes.push(url.pathname);return route.abort();}
    reads.push(url.pathname+url.search);
    if(url.pathname==='/api/runtime/metrics'){
      const selected=Number(url.searchParams.get('window_minutes'));
      return respond(route,{...metrics,window_minutes:selected,...(selected===1440?{model:{...metrics.model,
        observed_seconds:86400,bucket_seconds:3600,calls:8,successful:7,success_rate:7/8,requests_per_minute:8/1440,tokens_per_minute:300/1440,
        usage:{input_tokens:240,output_tokens:60,total_tokens:300,reported_calls:7,missing_calls:1},
        timeline:[{at:'2026-10-15T01:20:00Z',calls:4,failed:0,total_tokens:150},...metrics.model.timeline]}}:{})});
    }
    if(url.pathname==='/api/runs')return respond(route,{runs:[{run_id:'rag:TRACE-ONE',run_type:'rag',label:'测试问答',
      trace_ids:['TRACE-ONE'],event_count:1,status:'completed'}]});
    if(url.pathname==='/api/trace')return respond(route,{trace:[{trace_id:'TRACE-ONE',type:'agent',event:'agent_completed',name:'knowledge',
      agent_run_id:'ONE',timestamp:'2026-10-15T02:10:00Z',output:{summary:'已保存的结果'}}]});
    return respond(route,{devices:[],items:[],user:null});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    const monitor=page.getByRole('region',{name:'系统运行监控',exact:true});
    await monitor.getByText('150',{exact:true}).waitFor();
    const chart=monitor.getByRole('img',{name:/每分钟模型调用量折线图/});
    assert.equal(await chart.count(),1,'调用量应绘制为折线图');
    assert.deepEqual(await chart.locator('.runtime-trend-value').allTextContents(),['1','1','2']);
    assert.equal(await chart.locator('polyline').count(),1);
    assert.ok((await chart.locator('.runtime-trend-tick').allTextContents()).some(label=>/:02:30$/.test(label)),'半分钟刻度不能冒充整分钟');
    assert.match(await chart.locator('.runtime-trend-point').last().getAttribute('aria-label'),/2 次.*1 个错误/);
    const tokens=monitor.getByRole('img',{name:/Token 消耗量折线图/});
    assert.equal(await tokens.count(),1,'调用次数和 Token 应分别展示，不能混用单位');
    assert.deepEqual(await tokens.locator('.runtime-trend-value').allTextContents(),['60','50','40']);
    assert.match(await tokens.locator('.runtime-trend-point').first().getAttribute('aria-label'),/60 Token/);
    const runs=page.locator('details.logs-runs-panel'),detail=page.locator('details.logs-execution-panel');
    assert.equal(await runs.getAttribute('open'),null);
    assert.equal(await detail.getAttribute('open'),null);
    await page.clock.runFor(1000);
    assert.equal(reads.filter(path=>path.startsWith('/api/trace?')).length,0);
    assert.ok((await monitor.boundingBox()).y<(await runs.boundingBox()).y);
    await page.screenshot({path:'.runtime/verification/runtime-monitor-desktop-20261015.png',fullPage:true});
    await runs.locator('summary').first().click();
    await page.getByRole('button',{name:/测试问答/}).waitFor();
    await detail.locator('summary').first().click();
    await page.locator('.logs-list .log-event').waitFor();
    assert.equal(reads.filter(path=>path.startsWith('/api/trace?')).length,1);
    const changed=page.waitForResponse(response=>response.url().includes('window_minutes=1440'));
    await page.getByLabel('监控时间范围').selectOption('1440');
    await changed;
    await monitor.getByText('300',{exact:true}).waitFor();
    assert.deepEqual(await tokens.locator('.runtime-trend-value').allTextContents(),['150','60','50','40'],'Token 曲线应同步切换时间范围');
    await page.getByRole('navigation',{name:'功能导航'}).getByRole('button',{name:'智能诊断',exact:true}).click();
    const before=reads.filter(path=>path.startsWith('/api/runtime/metrics')).length;
    await page.clock.runFor(16000);
    assert.equal(reads.filter(path=>path.startsWith('/api/runtime/metrics')).length,before);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('折线按真实时间间隔绘制，全部数值可见且一小时时间窗在窄屏内滚动',async()=>{
  const fixture=await centerFixture({withStyles:true}),page=await fixture.browser.newPage({viewport:{width:390,height:844}});
  const errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  const timeline=Array.from({length:61},(_,index)=>({at:new Date(Date.UTC(2026,9,15,1,index)).toISOString(),calls:index%4,failed:index===3?1:0}));
  let dense=false;
  await page.route('**/api/**',route=>{
    const req=route.request(),url=new URL(req.url());
    if(req.method()!=='GET'){writes.push(url.pathname);return route.abort();}
    if(url.pathname==='/api/runtime/metrics'){
      const selected=Number(url.searchParams.get('window_minutes'));
      return respond(route,{...metrics,window_minutes:selected,model:{...metrics.model,timeline:dense?timeline:[
        {at:'2026-10-15T02:00:00Z',calls:1,failed:0},
        {at:'2026-10-15T02:02:00Z',calls:4,failed:1},
        {at:'2026-10-15T02:10:00Z',calls:2,failed:0}]}});
    }
    return respond(route,{runs:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    await page.getByText('150',{exact:true}).waitFor();
    const chart=page.getByRole('img',{name:/每分钟模型调用量折线图/});
    assert.equal(await chart.count(),1);
    const positions=await chart.locator('.runtime-trend-point circle').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('cx'))));
    assert.equal(positions.length,3);
    assert.ok(Math.abs((positions[1]-positions[0])/(positions[2]-positions[0])-.2)<.001,'两分钟必须仅占十分钟时间轴的五分之一');
    const changed=page.waitForResponse(response=>response.url().includes('window_minutes=60'));
    dense=true;
    await page.getByRole('button',{name:'刷新监控',exact:true}).click();
    await changed;
    await chart.locator('.runtime-trend-point').last().waitFor();
    await page.waitForFunction(()=>document.querySelectorAll('.runtime-trend-value').length===61);
    const labels=await chart.locator('.runtime-trend-value').allTextContents();
    assert.equal(labels.length,61);
    assert.deepEqual(labels.slice(0,8),['0','1','2','3','0','1','2','3']);
    const callTrend=page.locator('.runtime-trend').filter({has:chart});
    const layout=await callTrend.locator('.runtime-trend-scroll').evaluate(element=>({
      scrolls:element.scrollWidth>element.clientWidth,
      outerFits:document.documentElement.scrollWidth<=innerWidth+1,
      labelsFit:[...element.querySelectorAll('.runtime-trend-value')].every(node=>{
        const box=node.getBBox(),svg=node.ownerSVGElement.viewBox.baseVal;
        return box.x>=0&&box.y>=0&&box.x+box.width<=svg.width&&box.y+box.height<=svg.height;
      })
    }));
    assert.deepEqual(layout,{scrolls:true,outerFits:true,labelsFit:true});
    await page.screenshot({path:'.runtime/verification/runtime-line-chart-mobile-20261015.png',fullPage:true});
    await callTrend.locator('.runtime-trend-scroll').evaluate(element=>{element.scrollLeft=element.scrollWidth;});
    assert.equal(await chart.locator('.runtime-trend-value').last().evaluate(node=>{
      const label=node.getBoundingClientRect(),viewport=node.closest('.runtime-trend-scroll').getBoundingClientRect();
      return label.left>=viewport.left&&label.right<=viewport.right;
    }),true,'滚动后最后一个数值必须完整进入可视区域');
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('折线保留零值和单点，缺失采样不伪造成零或跨缺项连线',async()=>{
  const fixture=await centerFixture({withStyles:true});
  const cases=[
    {name:'单点',timeline:[{at:'2026-10-15T02:00:00Z',calls:3,failed:0}],labels:['3'],lines:0},
    {name:'零值',timeline:[{at:'2026-10-15T02:00:00Z',calls:0,failed:0},{at:'2026-10-15T02:01:00Z',calls:0,failed:0}],labels:['0','0'],lines:1},
    {name:'缺项',timeline:[{at:'2026-10-15T02:00:00Z',calls:1,failed:0},{at:'2026-10-15T02:01:00Z',calls:null,failed:null},{at:'2026-10-15T02:02:00Z',calls:2,failed:0}],labels:['1','2'],lines:0},
    {name:'空采样',timeline:[],labels:[],lines:0},
  ];
  try{
    for(const scenario of cases){
      const page=await fixture.browser.newPage();
      await page.route('**/api/**',route=>new URL(route.request().url()).pathname==='/api/runtime/metrics'
        ?respond(route,{...metrics,model:{...metrics.model,timeline:scenario.timeline}}):respond(route,{runs:[]}));
      await page.goto(fixture.base+'/?view=logs');
      await page.getByText('150',{exact:true}).waitFor();
      const trend=page.locator('.runtime-trend').filter({has:page.getByRole('heading',{name:'每分钟模型调用量',exact:true})});
      assert.deepEqual(await trend.locator('.runtime-trend-value').allTextContents(),scenario.labels,scenario.name);
      assert.equal(await trend.locator('polyline').count(),scenario.lines,scenario.name);
      assert.equal(await trend.locator('[cx="NaN"],[cy="NaN"]').count(),0,scenario.name);
      if(!scenario.timeline.length)assert.match(await trend.innerText(),/暂无已采集/);
      await page.close();
    }
  }finally{await fixture.close();}
});

test('Token 曲线保留真实零值、跳过缺失回执，大数值及坐标在窄屏内完整显示',async()=>{
  const fixture=await centerFixture({withStyles:true}),page=await fixture.browser.newPage({viewport:{width:390,height:844}});
  const writes=[],errors=[];
  let dense=false;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()!=='GET'){writes.push(url.pathname);return route.abort();}
    if(url.pathname==='/api/runtime/metrics'){
      const selected=Number(url.searchParams.get('window_minutes'));
      if(selected===60&&dense)return respond(route,{...metrics,window_minutes:60,model:{...metrics.model,calls:61,successful:61,failed:0,success_rate:1,
        requests_per_minute:61/60,tokens_per_minute:62830/60,
        usage:{input_tokens:60000,output_tokens:2830,total_tokens:62830,reported_calls:61,missing_calls:0},
        timeline:Array.from({length:61},(_,index)=>({at:new Date(Date.UTC(2026,9,15,1,index)).toISOString(),calls:1,failed:0,total_tokens:1000+index}))}});
      return respond(route,{...metrics,window_minutes:selected,model:{...metrics.model,calls:5,successful:5,failed:0,
        success_rate:1,requests_per_minute:5/selected,tokens_per_minute:selected===43200?null:46000/60,
        usage:{input_tokens:selected===43200?null:40000,output_tokens:selected===43200?null:6000,total_tokens:selected===43200?null:46000,reported_calls:selected===43200?0:3,missing_calls:selected===43200?5:2},
        timeline:[12000,null,0,34000,null].map((total_tokens,index)=>({at:new Date(Date.UTC(2026,9,15,2,index)).toISOString(),calls:1,failed:0,total_tokens:selected===43200?null:total_tokens}))}});
    }
    return respond(route,{runs:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    const heading=page.getByRole('heading',{name:'每分钟 Token 消耗量',exact:true});
    assert.equal(await heading.count(),1,'应新增按分钟的 Token 趋势');
    const trend=page.locator('.runtime-trend').filter({has:heading}),chart=trend.getByRole('img');
    await chart.waitFor();
    assert.deepEqual(await chart.locator('.runtime-trend-value').allTextContents(),['12,000','0','34,000']);
    assert.equal(await chart.locator('polyline').count(),1,'不能把缺少用量回执的分钟连成连续消耗');
    assert.equal((await chart.locator('polyline').getAttribute('points')).split(' ').length,2);
    const geometry=await chart.evaluate(svg=>{
      const bounds=svg.viewBox.baseVal;
      return [...svg.querySelectorAll('text')].every(node=>{
        const box=node.getBBox();
        return box.x>=0&&box.y>=0&&box.x+box.width<=bounds.width&&box.y+box.height<=bounds.height;
      });
    });
    assert.equal(geometry,true,'Token 的数值和纵轴刻度不能裁剪');
    const labelsOverlapAxis=await chart.evaluate(svg=>[...svg.querySelectorAll('.runtime-trend-value')].some(label=>{
      const value=label.getBBox();
      return [...svg.querySelectorAll('.runtime-trend-grid text')].some(tick=>{
        const axis=tick.getBBox();
        return value.x<axis.x+axis.width&&value.x+value.width>axis.x&&value.y<axis.y+axis.height&&value.y+value.height>axis.y;
      });
    }));
    assert.equal(labelsOverlapAxis,false,'首个数值不能与纵轴刻度重叠');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:'.runtime/verification/runtime-token-trend-mobile-20261015.png',fullPage:true});
    const hour=page.waitForResponse(response=>response.url().includes('window_minutes=60'));
    dense=true;await page.getByRole('button',{name:'刷新监控',exact:true}).click();await hour;
    await page.waitForFunction(()=>[...document.querySelectorAll('.runtime-trend')].find(element=>element.querySelector('h3')?.textContent==='每分钟 Token 消耗量')?.querySelectorAll('.runtime-trend-value').length===61);
    const hourly=await chart.locator('.runtime-trend-value').allTextContents();
    assert.equal(hourly.length,61);assert.equal(hourly[0],'1,000');assert.equal(hourly.at(-1),'1,060');
    assert.equal(await trend.locator('.runtime-trend-scroll').evaluate(element=>element.scrollWidth>element.clientWidth),true);
    await trend.locator('.runtime-trend-scroll').evaluate(element=>{element.scrollLeft=element.scrollWidth;});
    assert.equal(await chart.locator('.runtime-trend-value').last().evaluate(node=>{
      const box=node.getBoundingClientRect(),viewport=node.closest('.runtime-trend-scroll').getBoundingClientRect();
      return box.left>=viewport.left&&box.right<=viewport.right;
    }),true);
    const changed=page.waitForResponse(response=>response.url().includes('window_minutes=43200'));
    await page.getByLabel('监控时间范围').selectOption('43200');await changed;
    await trend.getByText(/本时段暂无已采集的 Token/).waitFor();
    assert.equal(await trend.locator('.runtime-trend-point').count(),0);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});

test('Token未采集和监控服务失败都不显示虚假零值，窄屏不溢出',async()=>{
  const fixture=await centerFixture({withStyles:true}),page=await fixture.browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/runtime/metrics')return respond(route,{...metrics,model:{available:false,message:'模型监控暂不可用'}});
    return respond(route,{runs:[]});
  });
  try{
    await page.goto(fixture.base+'/?view=logs');
    const monitor=page.getByRole('region',{name:'系统运行监控',exact:true});
    await monitor.getByText('模型监控暂不可用',{exact:true}).waitFor();
    assert.match(await monitor.innerText(),/未采集/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:'.runtime/verification/runtime-monitor-mobile-20261015.png',fullPage:true});
  }finally{await fixture.close();}
});
