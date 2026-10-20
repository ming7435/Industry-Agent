import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

test('专家总览展示真实统计，进入后仅调用绑定技能并保留四个北极星指标',async()=>{
  const fixture=await centerFixture({fullApp:true,withStyles:true});
  const page=await fixture.browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(5000);
  const writes=[],errors=[];
  const skills=[['diagnosis','智能诊断','alarm','报警诊断'],['knowledge','知识检索','manual','手册检索']].map(
    ([agent,agent_label,name,title])=>({agent,agent_label,name,title,goal:'核对真实证据',version:'1.0',
      document:'# 测试技能',revision:'a'.repeat(64),can_edit:true,optimization:{mode:'review_flow'},
      tools:[],steps:[],stop_conditions:[]}));
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(req.method()!=='GET')writes.push(path);
    if(path==='/api/team/me')return respond(route,{user:{user_id:'U-1',role:'technician'}});
    if(path==='/api/expert/skills')return respond(route,{items:skills});
    if(path==='/api/expert/agents')return respond(route,{available:true,partial:false,
      window_end:'2026-10-20T03:00:00Z',items:[{agent:'diagnosis',total:4,completed:2,failed:1,blocked:1,running:0,pending:0,
        completion_rate:50,last_failure_at:'2026-10-20T02:00:00Z'},
        {agent:'knowledge',total:0,completed:0,failed:0,blocked:0,running:0,pending:0,completion_rate:null}]});
    const skill=skills.find(item=>path===`/api/expert/skills/${item.agent}/${item.name}`);
    if(skill)return respond(route,skill);
    return respond(route,{items:[],devices:[],runs:[],runner:{}});
  });
  try{
    await page.goto(fixture.base+'/?view=expert');
    const overview=page.getByRole('region',{name:'专家总览',exact:true});
    await overview.waitFor();
    const diagnosis=overview.getByRole('article',{name:'智能诊断专家',exact:true});
    await diagnosis.getByText('50%',{exact:true}).waitFor();
    assert.match(await diagnosis.innerText(),/有执行失败/);
    assert.match(await overview.getByRole('article',{name:'知识检索专家',exact:true}).innerText(),/暂无运行数据/);
    assert.equal(await page.getByRole('button',{name:'测试修改',exact:true}).count(),0);
    await diagnosis.getByRole('button',{name:'查看技能',exact:true}).click();
    const catalog=page.getByRole('region',{name:'技能目录',exact:true});
    await catalog.getByRole('button',{name:/报警诊断/}).waitFor();
    assert.equal(await catalog.getByRole('button',{name:/手册检索/}).count(),0);
    assert.equal(await page.getByRole('combobox',{name:'所属智能体',exact:true}).count(),0);
    await page.getByRole('tab',{name:'运行效果',exact:true}).click();
    for(const name of ['周进化收益','漂移召回率','门禁通过率','回滚率'])
      await page.getByRole('heading',{name,exact:true}).waitFor();
    await page.getByRole('tab',{name:'技能内容',exact:true}).click();
    await page.getByRole('textbox',{name:'技能目标',exact:true}).fill('保留未发布草稿');
    page.once('dialog',dialog=>dialog.dismiss());
    await page.getByRole('button',{name:'返回专家总览',exact:true}).click();
    assert.equal(await page.getByRole('textbox',{name:'技能目标',exact:true}).inputValue(),'保留未发布草稿');
    page.once('dialog',dialog=>dialog.accept());
    await page.getByRole('button',{name:'返回专家总览',exact:true}).click();
    await overview.waitFor();
    await page.evaluate(skill=>sessionStorage.setItem('expert-machine-test:U-1',JSON.stringify({skill,test_id:'old'})),skills[0]);
    await page.reload();
    await overview.waitFor();
    await overview.getByRole('article',{name:'智能诊断专家',exact:true}).waitFor();
    assert.deepEqual(writes,[],'浏览专家和指标不应触发机器故障或业务写入');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);
  }finally{await fixture.close();}
});
