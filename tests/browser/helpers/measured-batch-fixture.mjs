// Controlled API records for UI behavior; these are never imported into the live app.
export const measuredBatch={version:1,scope:'measured_batch',source:'measurement_import',simulation:false,synthetic:false,
  request_id:'MB-'+'a'.repeat(32),batch_id:'B-QA',design_run_id:'DRAWING-A/03',part_name:'齿轮',
  standard_reference:'QA fixture standard',measurement_reference:'fixture.csv',measured_at:'2026-10-25T08:00:00+08:00',plan_complete:true,
  basis:{digest:'fixture-basis',parameters:[{key:'diameter',name:'轴孔直径',lower:'19.98',upper:'20.02',unit:'mm'}]},
  samples:[{part_id:'MP-'+'1'.repeat(32),serial_number:'GEAR-001',observations:{},comparison:{items:[{key:'diameter',name:'轴孔直径',lower:'19.98',upper:'20.02',unit:'mm',actual:'20.00',actual_unit:'mm',status:'qualified'}]}}],
  counts:{total:1,qualified:1,unqualified:0,pending:0,determinate:1},status:'qualified'};
export const pendingJoint={version:1,scope:'measured_batch',batch_id:measuredBatch.batch_id,request_id:measuredBatch.request_id,design_run_id:measuredBatch.design_run_id,
  counts:{total:1,qualified:0,unqualified:0,pending:1,determinate:0},qualified_rate:null,types:[],release_allowed:false,execution:'not_executed',
  items:[{sample_id:measuredBatch.samples[0].part_id,serial_number:'GEAR-001',dimensions:'pass',visual:'pending',status:'pending',issues:[],handling:'暂缓流转，补齐视觉图片',dimensions_incomplete:false}]};
export const measuredCsv='批次号,零件编号,图纸版本,零件名称,检验项目,单位,下限,上限,实测值,实测单位,测量时间,图纸或检验标准\nB-QA,GEAR-001,DRAWING-A/03,齿轮,轴孔直径,mm,19.98,20.02,20.00,mm,2026-10-25T08:00:00+08:00,QA fixture standard\n';
