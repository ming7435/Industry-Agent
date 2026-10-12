import test from 'node:test';
import assert from 'node:assert/strict';
import { centerFixture, respond, deferred } from './helpers/center-fixture.mjs';

const skill = {agent:'diagnosis',name:'alarm_diagnosis_skill',title:'报警诊断',goal:'核对当前事实',version:'1.0',
  revision:'a'.repeat(64),document:'# 报警诊断\n\n原有安全规则。',tools:[],steps:[],stop_conditions:[],can_edit:true};
const proposal = {proposal_id:'c'.repeat(32),candidate_hash:'b'.repeat(64),agent:'diagnosis',name:skill.name,
  status:'awaiting_confirmation',message:'自动修改稿已生成，请先人工确认',
  source:{trace_id:'T-FAULT',facts:'现场证据不足'},draft:{document:'# 报警诊断\n\n原有安全规则。\n\n追加核查建议。',
    reason:'补充不足信息的核查建议',rules:['现场证据不足时保留不确定性。'],version:'1.1'}};

async function setup({role='technician', delayed=null}={}) {
  const fixture=await centerFixture({fullApp:true}), page=await fixture.browser.newPage();
  page.setDefaultTimeout(8000);
  const writes=[], errors=[];
  let status=proposal.status;
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
      return respond(route,{...proposal,status});
    }
    if(path.endsWith('/confirm')) {
      writes.push(req.postDataJSON()); status='confirmed';
      return respond(route,{proposal_id:proposal.proposal_id,status,message:'人工已确认，等待验证'});
    }
    if(path.endsWith('/reject')) {writes.push(req.postDataJSON());status='rejected';return respond(route,{status,message:'旧版保留'});}
    if(req.method()!=='GET') throw new Error('意外写入 '+path);
    return respond(route,{items:[],devices:[],runs:[],runner:{},state:'unknown'});
  });
  return {fixture,page,writes,errors,finish:()=>{status='published';}};
}

test('自动修改稿先人工确认，提交只绑定版本与机器，不伪造验证通过',{timeout:20000},async()=>{
  const {fixture,page,writes,errors,finish}=await setup();
  try {
    await page.goto(fixture.base+'/?view=expert');
    const panel=page.getByRole('region',{name:'自动优化修改稿',exact:true});
    await panel.getByText('补充不足信息的核查建议',{exact:true}).waitFor();
    await panel.getByRole('checkbox',{name:'我已核对这份自动修改稿，确认可以进入验证'}).check();
    await panel.getByRole('button',{name:'确认修改稿并开始验证'}).click();
    await panel.getByText('已确认，等待验证',{exact:true}).waitFor();
    assert.equal(writes.length,1);
    assert.deepEqual(Object.keys(writes[0]).sort(),['candidate_hash','machine']);
    assert.equal(writes[0].candidate_hash,proposal.candidate_hash);
    assert.equal(writes[0].machine.device_id,'D-1');
    finish();
    await panel.getByText('已发布',{exact:true}).waitFor();
    assert.equal(writes.length,1,'发布由服务端执行，浏览器不能补发自报通过请求');
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});

test('监督人只能查看自动修改稿，不能启动设备验证',{timeout:20000},async()=>{
  const {fixture,page,writes,errors}=await setup({role:'supervisor'});
  try {
    await page.goto(fixture.base+'/?view=expert');
    const panel=page.getByRole('region',{name:'自动优化修改稿',exact:true});
    await panel.getByText('补充不足信息的核查建议',{exact:true}).waitFor();
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
    assert.equal(await page.getByText('补充不足信息的核查建议',{exact:true}).count(),0);
    assert.equal(writes.length,0);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});
