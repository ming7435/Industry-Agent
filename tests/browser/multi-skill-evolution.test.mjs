import test from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

for(const [agent,name,mode,field,input] of [
  ['knowledge','manual_search_skill','knowledge_flow','测试问题','查找主轴手册'],
  ['cad','production_modeling_skill','cad_spec_flow','测试设计需求','设计一个带孔零件，孔径尚未提供'],
  ['maintenance','repair_plan_skill','review_flow','任务输入（测试样例）','{"device_id":"D-1","feedback":null}'],
  ['workorder','auto_assignment','review_flow','任务输入（测试样例）','{"device_id":"D-1","feedback":null}'],
  ['quality','part_quality_inspection_skill','review_flow','任务输入（测试样例）','{"part_no":"00001","measurement":null}'],
  ['report','report_generation_skill','review_flow','任务输入（测试样例）','{"report_id":"R-1","document":null}'],
  ['router','intent_routing_skill','review_flow','任务输入（测试样例）','{"user_text":"查询手册"}'],
  ['memory','experience_extraction','review_flow','任务输入（测试样例）','{"workorder_id":"WO-1","feedback":null}'],
  ['cad','drawing_lookup_skill','review_flow','任务输入（测试样例）','{"device_id":"D-1","component":null}'],
]) {
  test(`${agent} 候选审核使用本领域样例，不查询机器或触发故障`,{timeout:25000},async()=>{
    const fixture=await centerFixture({fullApp:true}),page=await fixture.browser.newPage();
    page.setDefaultTimeout(6000);
    const writes=[],reads=[],errors=[];
    const skill={agent,name,optimization:{enabled:true,mode,description:'任务验证'},title:agent==='cad'?'零件建模':'手册检索',
      goal:'核对实际输入',version:'1.0',revision:'a'.repeat(64),document:'# 技能\n\n原有规则。',tools:[],steps:[],stop_conditions:[],can_edit:true};
    const candidate={proposal_id:'c'.repeat(32),candidate_hash:'b'.repeat(64),revision:1,agent,name,verification_mode:mode,
      base_revision:skill.revision,status:'awaiting_confirmation',source:{trace_id:'T-1'},draft:{
        document:'# 技能\n\n追加规则。',goal:skill.goal,version:'1.1',reason:'补充问题判断',rules:['缺少资料时不补造。'],
        expected_result:'缺少参数或证据时应要求补充。'}};
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/**',route=>{
      const req=route.request(),path=new URL(req.url()).pathname;
      reads.push(path);
      if(req.method()==='POST') {writes.push({path,body:req.postDataJSON()});return respond(route,{status:'confirmed',revision:2});}
      if(path==='/api/team/me') return respond(route,{user:{user_id:'U-1',role:'technician',username:'维修员'}});
      if(path==='/api/expert/skills') return respond(route,{items:[skill]});
      if(path===`/api/expert/skills/${agent}/${name}`) return respond(route,skill);
      if(path==='/api/expert/evolution') return respond(route,{items:[candidate],worker:{enabled:true}});
      if(path===`/api/expert/evolution/${candidate.proposal_id}`) return respond(route,candidate);
      if(path==='/api/expert/skill-loop') return respond(route,{kind:'skill_loop',health:null,plan:null,control:{paused:false}});
      return respond(route,{items:[],devices:[],runs:[],runner:{}});
    });
    try {
      await page.goto(fixture.base+'/?view=expert');
      await page.getByText('这是系统自动生成的待审核稿，并未替换线上技能。修改说明包含触发原因，预期结果用于核对实际测试。',{exact:true}).waitFor();
      await page.getByLabel(field,{exact:true}).fill(input);
      if(agent==='knowledge') {
        await page.getByLabel('测试参考资料',{exact:true}).fill(JSON.stringify([
          {document_id:'DOC-1',title:'主轴手册',content:'检查主轴冷却。',source_type:'manual'},
          {document_id:'DOC-2',title:'食堂菜单',content:'米饭鸡蛋。',source_type:'manual'},
        ]));
        await page.getByLabel(/预期状态/).selectOption('completed');
        await page.getByLabel('预期资料编号',{exact:true}).fill('["DOC-1"]');
      }
      await page.getByLabel('我已审核自动修改稿及预期结果，允许开始测试',{exact:true}).check();
      await page.getByRole('button',{name:'测试修改',exact:true}).click();
      await page.getByRole('tab',{name:'技能内容',exact:true}).click();
      await page.getByText('已确认，等待验证',{exact:true}).waitFor();
      assert.equal(writes.length,1);
      assert.ok(writes[0].path.endsWith('/confirm'));
      if(mode==='review_flow') {
        assert.deepEqual(writes[0].body.task.input,JSON.parse(input));
        assert.equal(writes[0].body.task.expected_status,'reviewed');
        assert.ok(reads.some(url=>url==='/api/expert/skills'));
      } else assert.equal(writes[0].body.task[agent==='cad'?'prompt':'query'],input);
      if(agent==='knowledge') assert.deepEqual(writes[0].body.task.expected_document_ids,['DOC-1']);
      assert.equal('machine' in writes[0].body,false);
      assert.equal(await page.getByLabel('测试设备',{exact:true}).count(),0);
      assert.equal(reads.includes('/api/expert/machines'),false);
      assert.deepEqual(errors,[]);
    } finally {await fixture.close();}
  });
}
