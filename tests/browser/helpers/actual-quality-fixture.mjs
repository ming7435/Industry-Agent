import {centerFixture,respond} from './center-fixture.mjs';
import {measuredBatch,pendingJoint,measuredCsv} from './measured-batch-fixture.mjs';
export {measuredBatch,pendingJoint,measuredCsv};

export async function actualQualityFixture(options={}) {
  const fixture=await centerFixture({withStyles:true}),page=await fixture.browser.newPage();
  page.setDefaultTimeout(5000);
  const state={stored:true,loggedIn:true,readFailure:false,importFailure:false,...options},reads=[],posts=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    sessionStorage.setItem('freecad.active-run',JSON.stringify({run_id:'FC-old',draft_part_name:'未提交草稿'}));
    sessionStorage.setItem('quality-sim-pending','old-simulation-request');
  });
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;reads.push(path);
    if(path==='/api/team/me')return respond(route,state.loggedIn?{user:{user_id:'QA',role:'technician'}}:{detail:'请先登录'},state.loggedIn?200:401);
    if(route.request().method()==='POST') {
      posts.push({path,body:route.request().postDataJSON()});
      if(path==='/api/quality/vision/batches') {
        if(state.gate)await state.gate.promise;
        state.stored=true;
        return state.importFailure?respond(route,{detail:'保存结果待确认'},503):respond(route,measuredBatch);
      }
      return respond(route,{detail:'unexpected write'},500);
    }
    if(path==='/api/quality/vision/batches')return respond(route,{items:state.stored?[measuredBatch]:[]});
    if(path.startsWith('/api/quality/vision/batches/'))return state.readFailure?respond(route,{detail:'实测记录待核验'},409):respond(route,measuredBatch);
    if(path.startsWith('/api/quality/vision/joint/'))return respond(route,pendingJoint);
    if(path==='/api/quality/vision/capabilities')return respond(route,{models:[],algorithms:[]});
    return respond(route,{items:[],devices:[],runs:[]});
  });
  await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
  await page.getByRole('heading',{name:'批次尺寸检测',exact:true}).waitFor();
  if(state.stored&&state.loggedIn&&!state.readFailure)await page.getByRole('heading',{name:'尺寸核验记录',exact:true}).waitFor();
  return {fixture,page,state,reads,posts,errors};
}
export async function chooseMeasurements(page){
  await page.getByLabel('尺寸测量记录（CSV）').setInputFiles({name:'fixture.csv',mimeType:'text/csv',buffer:Buffer.from(measuredCsv)});
  await page.getByRole('checkbox',{name:/本文件已包含/}).check();
}
