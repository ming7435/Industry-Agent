import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {centerFixture,respond} from './helpers/center-fixture.mjs';

const runId='FC-'+'a'.repeat(56)+'00016973';
const sampleIds=['MP-'+'1'.repeat(32),'MP-'+'2'.repeat(32)];
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const image='data:image/png;base64,'+png;
const run={run_id:runId,status:'completed',part_name:'安装底板',part_number:'92531',validation:{valid:true,step_roundtrip:true,solid_count:1},spec:{units:'mm',operations:[]}};
const basis={...run,digest:'basis-verified',parameters:[{key:'operations.0.length',name:'主体长度',kind:'number',unit:'mm',expected:'100',lower:'99.95',upper:'100.05'}]};

test('one sample combines dimensions and its image, shows handling and keeps batch counts after reload',async()=>{
  const fixture=await centerFixture({withStyles:true}),page=await fixture.browser.newPage();
  page.setDefaultTimeout(7000);
  const errors=[],posts=[],linked=new Map();let batch=null,nextId=0;
  const id=()=>'VI-'+(++nextId).toString(16).padStart(32,'0');
  function report() {
    const items=sampleIds.map((sample_id,index)=>{
      const record=linked.get(sample_id),dimensions=index?'fail':'pass',visual=record?(record.status==='clear'?'pass':'fail'):'pending';
      const status=[dimensions,visual].includes('fail')?'unqualified':visual==='pass'?'qualified':'pending';
      const issues=index?[{type:'dimension',label:'尺寸偏差',source:'dimensions',location:'主体长度',evidence:'100 → 100.1 mm',action_label:'复测后判定返工或重造'}]:[];
      if(visual==='fail')issues.push({type:'vision:hair',label:'细丝／异物',source:'vision',location:'图片区域 [1, 2, 5, 6] px',evidence:'YOLO 检出 hair',action_label:'去除异物后复检'});
      return {sample_id,serial_number:'GEAR-00'+(index+1),dimensions,visual,status,issues,dimensions_incomplete:false,inspection_id:record?.inspection_id||'',
        handling:status==='qualified'?'合格流转：保存记录，进入下一工序或入库':status==='unqualified'?'隔离不合格品；'+issues.map(i=>i.action_label).join('；')+'；处理后重新完成尺寸和视觉检测':'暂缓流转，补齐尺寸／视觉检测后重新判定'};
    });
    const qualified=items.filter(r=>r.status==='qualified').length,unqualified=items.filter(r=>r.status==='unqualified').length;
    return {version:1,scope:'measured_batch',batch_id:batch.batch_id,request_id:batch.request_id,design_run_id:runId,
      counts:{total:2,qualified,unqualified,pending:2-qualified-unqualified,determinate:qualified+unqualified},qualified_rate:100*qualified/(qualified+unqualified),
      items,types:[{key:'dimension',label:'尺寸偏差',sample_count:1},...(linked.get(sampleIds[1])?[{key:'vision:hair',label:'细丝／异物',sample_count:1}]:[])],execution:'not_executed',release_allowed:false};
  }
  await page.addInitScript(runId=>sessionStorage.setItem('freecad.active-run',JSON.stringify({run_id:runId,prompt:'底板',command_id:'saved'})),runId);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/team/me')return respond(route,{user:{user_id:'U-joint',role:'technician'}});
    if(path.includes('/cad/')&&path.includes('/runs/'))return respond(route,run);
    if(path==='/api/quality/vision/batches'&&route.request().method()==='GET')return respond(route,{items:batch?[batch]:[]});
    if(path.startsWith('/api/quality/vision/batches/'))return respond(route,batch);
    if(path==='/api/quality/vision/batches'&&route.request().method()==='POST') {
      const body=route.request().postDataJSON();posts.push(body);
      batch={version:1,scope:'measured_batch',source:'measurement_import',batch_id:body.batch_id,request_id:'MB-'+'a'.repeat(32),design_run_id:runId,simulation:false,synthetic:false,status:'unqualified',basis,
        part_name:'齿轮',standard_reference:'Drawing A',measurement_reference:'measurements.csv',measured_at:'2026-10-25T08:00:00+08:00',plan_complete:true,
        counts:{total:2,qualified:1,unqualified:1,pending:0,determinate:2},
        samples:sampleIds.map((part_id,index)=>({part_id,serial_number:'GEAR-00'+(index+1),observations:{length:{value:index?'100.1':'100',unit:'mm'}},
          comparison:{items:[{key:'length',name:'主体长度',lower:'99.95',upper:'100.05',actual:index?'100.1':'100',unit:'mm',actual_unit:'mm',status:index?'unqualified':'qualified'}]}}))};
      return respond(route,batch);
    }
    if(path.includes('/vision/joint/'))return respond(route,report());
    if(path.endsWith('/vision/capabilities'))return respond(route,{algorithms:[{id:'patchcore',available:true},{id:'yolo',available:true}],models:[
      {model_id:'patchcore-gear',name:'齿轮正常记忆库',algorithm:'patchcore',sample_count:2068,memory_size:1024,suggested_threshold:1,read_only:true},
      {model_id:'yolo-default',name:'YOLO 缺陷定位',algorithm:'yolo',read_only:true,classes:['hair']}],limits:{max_image_bytes:4194304,max_training_images:24}});
    if(path.endsWith('/pipeline/detect')) {
      const body=route.request().postDataJSON();posts.push(body);
      const defect=body.dimension_sample_id===sampleIds[1];
      const stage=algorithm=>({inspection_id:id(),algorithm,model_id:algorithm==='patchcore'?'patchcore-gear':'yolo-default',filename:body.filename,
        part_id:body.part_id,image_source:'upload',created_at:'2026-10-26T01:00:00Z',status:defect?'defect':'clear',score:defect?(algorithm==='patchcore'?1.5:.9):.1,
        threshold:algorithm==='patchcore'?body.threshold:body.confidence,
        parameters:{threshold:algorithm==='patchcore'?body.threshold:body.confidence,confidence:body.confidence,iou:body.iou},
        image_sha256:'a'.repeat(64),image_digest_format:'rgb-pixels-with-size-v1',image:{width:100,height:80},annotated_image:image,
        defects:defect?[{label:algorithm==='patchcore'?'anomaly':'hair',confidence:algorithm==='patchcore'?null:.9,bbox:[1,2,5,6]}]:[],
        ...(algorithm==='patchcore'?{heatmap_image:image}:{}),steps:[{name:'检测',status:'completed',detail:'受控测试结果'}]});
      const pc=stage('patchcore'),yolo=defect?stage('yolo'):null;
      const value={...pc,inspection_id:id(),algorithm:'patchcore_yolo_pipeline',pipeline_version:1,patchcore:pc,yolo,
        defects:(yolo||pc).defects,classification:defect?'known_defect':'clear',yolo_state:defect?'completed':'skipped',localization_error:null,
        inspection_ids:[pc.inspection_id,...(yolo?[yolo.inspection_id]:[])],
        joint_identity:{scope:'measured_batch',request_id:body.dimension_request_id,sample_id:body.dimension_sample_id,design_run_id:runId}};
      linked.set(body.dimension_sample_id,value);return respond(route,value);
    }
    return respond(route,{items:[],devices:[],runs:[],enabled:false});
  });
  try {
    await page.goto(fixture.base+'/?view=quality&quality_panel=dimensions');
    await page.getByLabel('尺寸测量记录（CSV）').setInputFiles({name:'measurements.csv',mimeType:'text/csv',buffer:Buffer.from(
      '批次号,零件编号,图纸版本,零件名称,检验项目,单位,下限,上限,实测值,实测单位,测量时间,图纸或检验标准\n'+
      ['GEAR-001','GEAR-002'].map((serial,i)=>`B-QA,${serial},${runId},齿轮,主体长度,mm,99.95,100.05,${i?'100.1':'100'},mm,2026-10-25T08:00:00+08:00,Drawing A`).join('\n'))});
    await page.getByRole('checkbox',{name:/本文件已包含/}).check();
    await page.getByRole('button',{name:'核验并保存本批尺寸',exact:true}).click();
    const joint=page.getByRole('region',{name:'联合质检结果',exact:true});
    const overview=joint.locator('.joint-overview');
    await overview.getByText('0.00%',{exact:true}).waitFor();
    await page.getByLabel('本次视觉图片对应的样本').selectOption(sampleIds[0]);
    await page.getByRole('button',{name:'为此样本做视觉检测'}).click();
    await page.getByLabel('待检测图片').setInputFiles({name:'sample-1.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await page.getByRole('button',{name:'运行缺陷检测',exact:true}).click();
    await overview.getByText('50.00%',{exact:true}).waitFor();
    assert.match(await joint.getByRole('article',{name:'所选样本联合处理'}).textContent(),/合格流转/);
    assert.equal(posts.at(-1).dimension_sample_id,sampleIds[0]);
    await page.getByLabel('本次视觉图片对应的样本').selectOption(sampleIds[1]);
    await page.getByRole('button',{name:'运行缺陷检测',exact:true}).isDisabled().then(value=>assert.equal(value,true));
    await page.getByLabel('待检测图片').setInputFiles({name:'sample-2.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await page.getByRole('button',{name:'运行缺陷检测',exact:true}).click();
    await joint.getByRole('article',{name:'所选样本联合处理'}).getByText(/隔离不合格品.*去除异物后复检/).waitFor();
    assert.equal(posts.at(-1).dimension_sample_id,sampleIds[1]);
    await page.reload();
    await overview.getByText('50.00%',{exact:true}).waitFor();
    assert.equal(await page.getByLabel('本次视觉图片对应的样本').inputValue(),'');
    assert.match(await joint.textContent(),/细丝／异物/);
    await page.getByLabel('本次视觉图片对应的样本').selectOption(sampleIds[1]);
    await mkdir('output/quality-measured-20261026',{recursive:true});
    await joint.screenshot({path:'output/quality-measured-20261026/joint-desktop.png'});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await joint.screenshot({path:'output/quality-measured-20261026/joint-mobile.png'});
    assert.doesNotMatch(await page.locator('.quality-workspace').textContent(),/模拟联合|模拟测量|模拟比对仪|历史流程验证/);
    assert.deepEqual(errors,[]);
  } finally {await fixture.close();}
});
