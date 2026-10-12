import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const skill = {agent:'diagnosis',name:'alarm_diagnosis_skill',title:'报警诊断',goal:'核对当前事实',version:'1.0',
  revision:'a'.repeat(64),document:'# 报警诊断\n\n原有安全规则。',tools:[],steps:[],stop_conditions:[],can_edit:true};
const proposal = {proposal_id:'c'.repeat(32),candidate_hash:'b'.repeat(64),agent:'diagnosis',name:skill.name,
  base_revision:'a'.repeat(64),
  status:'awaiting_confirmation',message:'自动修改稿已生成，请先人工确认',
  source:{trace_id:'T-FAULT',facts:'现场证据不足'},draft:{document:'# 报警诊断\n\n原有安全规则。\n\n追加核查建议。',
    reason:'优化依据：现场证据不足。修改内容：补充不足信息的核查建议',
    trigger_summary:'现场证据不足',expected_result:'证据不足时列出待核查项，不能断言根因已经确认。',
    rules:['现场证据不足时保留不确定性。'],goal:skill.goal,version:'1.1'}};

async function setup({role='technician', delayed=null, staleAfterConfirm=false,publishFailsOnce=false}={}) {
  const fixture=await centerFixture({fullApp:true}), page=await fixture.browser.newPage();
  page.setDefaultTimeout(8000);
  const writes=[], errors=[], staleRead=deferred();
  let status=proposal.status, tested=false, published=false;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/api/team/me') return respond(route,{user:{user_id:'U-1',username:'维修人员',role}});
    if(path==='/api/team/logout') return respond(route,{});
    if(path==='/api/expert/skills') return respond(route,{items:[skill]});
    if(path==='/api/expert/machines') return respond(route,{items:[{device_id:'D-1',name:'测试车床',
      scenarios:[{scenario_id:'turret',name:'刀塔超时'}]}]});
    if(path===`/api/expert/skills/diagnosis/${skill.name}`) return respond(route,skill);
    if(path==='/api/expert/evolution') return respond(route,{items:[{...proposal,status}],worker:{enabled:true}});
    if(path===`/api/expert/evolution/${proposal.proposal_id}`) {
      if(delayed) {delayed.started.resolve(); return delayed.release.promise.then(()=>respond(route,proposal)).catch(()=>{});}
      if(staleAfterConfirm && tested && status==='verifying') return respond(route,{...proposal,revision:1,
        message:'迟到的旧版本，不能撤回审核状态'}).then(()=>staleRead.resolve());
      return respond(route,{...proposal,status,revision:tested ? 4 : 1,confirmed_by:tested ? 'U-1' : '',test_id:tested ? 'f'.repeat(32) : ''});
    }
    if(path.endsWith('/confirm')) {
      writes.push({path,body:req.postDataJSON()}); status='verifying';tested=true;
      return respond(route,{proposal_id:proposal.proposal_id,revision:3,status:'confirmed',message:'人工已确认，等待验证'});
    }
    if(path.endsWith('/publish')) {writes.push({path,body:req.postDataJSON()});
      if(publishFailsOnce) {publishFailsOnce=false;return respond(route,{detail:'发布服务暂不可用（隔离测试）'},503);}
      status='published';published=true;
      return respond(route,{proposal_id:proposal.proposal_id,status,message:'已发布到系统'});}
    if(path.endsWith('/reject')) {writes.push({path,body:req.postDataJSON()});status='rejected';return respond(route,{status,message:'旧版保留'});}
    if(path==='/api/expert/tests/'+'f'.repeat(32)) return respond(route,{test_id:'f'.repeat(32),
      status:status==='awaiting_publication' || published ? 'completed' : 'running',mode:'machine_flow',
      message:'测试状态已同步',sample:{expected:proposal.draft.expected_result},progress:[],workorders:[]});
    if(req.method()!=='GET') throw new Error('意外写入 '+path);
    return respond(route,{items:[],devices:[],runs:[],runner:{},state:'unknown'});
  });
  return {fixture,page,writes,errors,staleRead,finish:()=>{status='awaiting_publication';}};
}

for(const scenario of [{name:'修改说明和预期自动填好，人工审核测试，完成后仍须点击发布'},
  {name:'自动稿测试通过后刷新技能，回执仍可核对并人工发布',refreshBeforePublish:true},
  {name:'人工发布临时失败后保留测试回执，再次审核可安全发布',publishFailsOnce:true}]) {
test(scenario.name,{timeout:30000},async()=>{
  const {fixture,page,writes,errors,finish}=await setup(scenario);
  try {
    await page.goto(fixture.base+'/?view=expert');
    const panel=page.getByRole('region',{name:'自动优化修改稿',exact:true});
    const editor=page.getByRole('region',{name:'技能编辑',exact:true});
    await editor.getByLabel('修改说明',{exact:true}).waitFor();
    await page.waitForFunction(reason=>document.querySelector('[aria-label="技能编辑"] input[placeholder*="补充"]')?.value===reason,
      proposal.draft.reason);
    assert.equal(await editor.getByLabel('预期结果',{exact:true}).inputValue(),proposal.draft.expected_result);
    assert.equal(await editor.getByRole('button',{name:'测试修改',exact:true}).isEnabled(),false);
    await editor.getByRole('checkbox',{name:'我已审核自动修改稿及预期结果，允许开始测试'}).check();
    await editor.getByRole('button',{name:'测试修改',exact:true}).click();
    await panel.getByText('正在验证',{exact:true}).waitFor();
    assert.equal(writes.length,1);
    assert.deepEqual(Object.keys(writes[0].body).sort(),['candidate_hash','machine']);
    assert.equal(writes[0].body.candidate_hash,proposal.candidate_hash);
    assert.equal(writes[0].body.machine.device_id,'D-1');
    finish();
    await panel.getByText('测试通过，等待人工发布',{exact:true}).waitFor();
    assert.equal(writes.length,1,'测试通过不能自动发布');
    if(scenario.refreshBeforePublish) {
      await editor.getByRole('button',{name:'刷新技能',exact:true}).click();
      await page.getByText('已刷新技能内容；你的未保存草稿已保留，请核对后保存。',{exact:true}).waitFor();
    }
    await editor.getByRole('checkbox',{name:'我已核对测试结果，确认符合预期'}).check();
    await editor.getByRole('button',{name:'发布到系统',exact:true}).click();
    if(scenario.publishFailsOnce) {
      await page.getByText(/发布服务暂不可用/).waitFor();
      await editor.getByRole('checkbox',{name:'我已核对测试结果，确认符合预期'}).check();
      await editor.getByRole('button',{name:'发布到系统',exact:true}).click();
    }
    await panel.getByText('已发布',{exact:true}).waitFor();
    assert.equal(writes.length,scenario.publishFailsOnce ? 3 : 2);
    assert.ok(writes.at(-1).path.endsWith('/publish'));
    assert.deepEqual(writes.at(-1).body,{candidate_hash:proposal.candidate_hash});
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});
}

test('监督人只能查看自动修改稿，不能启动设备验证',{timeout:20000},async()=>{
  const {fixture,page,writes,errors}=await setup({role:'supervisor'});
  try {
    await page.goto(fixture.base+'/?view=expert');
    const panel=page.getByRole('region',{name:'自动优化修改稿',exact:true});
    await panel.getByText('现场证据不足',{exact:true}).waitFor();
    assert.equal(await panel.getByRole('button',{name:'确认修改稿并开始验证'}).count(),0);
    assert.equal(writes.length,0);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('退出后迟到的修改稿不能恢复上一个账号内容',{timeout:20000},async()=>{
  const delayed={started:deferred(),release:deferred()};
  const {fixture,page,writes,errors}=await setup({delayed});
  try {
    await page.goto(fixture.base+'/?view=expert'); await delayed.started.promise;
    await page.getByText(/维修小组/).first().click();
    await page.getByRole('button',{name:/退出/}).click();
    delayed.release.resolve();
    await page.getByText(/请.*登录/).first().waitFor();
    assert.equal(await page.getByText(proposal.draft.reason,{exact:true}).count(),0);
    assert.equal(writes.length,0);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('迟到的自动稿不能覆盖人工已修改的预期结果',{timeout:20000},async()=>{
  const delayed={started:deferred(),release:deferred()};
  const {fixture,page,errors}=await setup({delayed});
  try {
    await page.goto(fixture.base+'/?view=expert');await delayed.started.promise;
    const editor=page.getByRole('region',{name:'技能编辑',exact:true});
    await editor.getByRole('textbox',{name:'预期结果',exact:true}).fill('人工已选择的不同测试预期');
    delayed.release.resolve();
    await page.getByRole('button',{name:'载入此修改稿',exact:true}).waitFor();
    assert.equal(await editor.getByRole('textbox',{name:'预期结果',exact:true}).inputValue(),'人工已选择的不同测试预期');
    assert.equal(await editor.getByRole('textbox',{name:'修改说明',exact:true}).inputValue(),'');
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('旧版本的轮询响应不能撤回已审核并测试的状态',{timeout:20000},async()=>{
  const {fixture,page,writes,errors,staleRead}=await setup({staleAfterConfirm:true});
  try {
    await page.goto(fixture.base+'/?view=expert');
    const editor=page.getByRole('region',{name:'技能编辑',exact:true});
    await editor.getByRole('checkbox',{name:'我已审核自动修改稿及预期结果，允许开始测试'}).check();
    await editor.getByRole('button',{name:'测试修改',exact:true}).click();
    await staleRead.promise;
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await editor.getByRole('button',{name:'测试修改',exact:true}).isEnabled(),false);
    assert.equal(await editor.getByRole('checkbox',{name:'我已审核自动修改稿及预期结果，允许开始测试'}).count(),0);
    assert.equal(writes.length,1);assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});
