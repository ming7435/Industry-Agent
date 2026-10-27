export const measurementColumns = ['批次号','零件编号','图纸版本','零件名称','检验项目','单位','下限','上限','实测值','实测单位','测量时间','图纸或检验标准'];
export const measurementTemplate = '\uFEFF' + measurementColumns.join(',') + '\r\n';

// Read UTF-8 CSV including quoted commas/newlines and Excel's doubled quotes.
export function csvRows(text) {
  if (typeof text !== 'string' || text.length > 4*1024*1024) throw new Error('测量文件不能超过 4 MB');
  text=text.replace(/^\uFEFF/,'');
  const rows=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted) {if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c==='"') {if(field||closed)throw new Error('CSV 引号格式无效');quoted=true;continue;}
    if(c===','||c==='\n'||c==='\r') {
      row.push(field.trim());field='';closed=false;
      if(c!==','){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}
    }else {if(closed&&!/\s/.test(c))throw new Error('CSV 引号后存在多余内容');if(!closed)field+=c;}
  }
  if(quoted)throw new Error('CSV 引号未闭合');
  row.push(field.trim());if(row.some(Boolean))rows.push(row);
  return rows;
}

export function parseMeasurementCsv(text, filename, planComplete=false) {
  const [headers,...rows]=csvRows(text);
  if(!headers||!rows.length)throw new Error('文件中没有测量记录，请填写实际批次与实测数据');
  if(rows.length>50000)throw new Error('单次最多导入 50000 条测量记录');
  if(headers.length!==new Set(headers).size||measurementColumns.some(k=>!headers.includes(k))||headers.some(k=>!measurementColumns.includes(k)))
    throw new Error('CSV 表头不匹配，请使用空白模板中的列名');
  let batch=null;const parameters=new Map(),samples=new Map();
  for(const [index,cells] of rows.entries()) {
    if(cells.length!==headers.length)throw new Error(`第 ${index+2} 行列数不一致`);
    const r=Object.fromEntries(headers.map((k,i)=>[k,cells[i]]));
    for(const key of ['批次号','零件编号','图纸版本','检验项目','单位','实测单位','测量时间','图纸或检验标准'])if(!r[key])throw new Error(`第 ${index+2} 行缺少${key}`);
    const identity={batch_id:r['批次号'],design_version:r['图纸版本'],part_name:r['零件名称'],standard_reference:r['图纸或检验标准'],measured_at:r['测量时间']};
    if(batch&&JSON.stringify(identity)!==JSON.stringify(batch))throw new Error('一次只能导入同一批次、图纸版本、检验标准及测量时间的记录');
    batch=identity;
    const p={key:r['检验项目'],name:r['检验项目'],unit:r['单位'],lower:r['下限']||null,upper:r['上限']||null};
    if(parameters.has(p.key)&&JSON.stringify(parameters.get(p.key))!==JSON.stringify(p))throw new Error(`项目“${p.key}”的验收范围或单位不一致`);
    parameters.set(p.key,p);
    const sample=samples.get(r['零件编号'])||{serial_number:r['零件编号'],measurements:{}};
    if(Object.hasOwn(sample.measurements,p.key))throw new Error(`零件 ${sample.serial_number} 的项目“${p.key}”重复，需先核对测量记录`);
    Object.defineProperty(sample.measurements,p.key,{value:{value:r['实测值']||null,unit:r['实测单位']},enumerable:true});
    samples.set(sample.serial_number,sample);
  }
  return {...batch,measurement_reference:filename,plan_complete:planComplete,parameters:[...parameters.values()],samples:[...samples.values()]};
}

export function verifiedMeasuredBatch(value) {
  if(value?.version!==1||value.scope!=='measured_batch'||value.source!=='measurement_import'||value.synthetic!==false||value.simulation!==false
    ||!/^MB-[a-f0-9]{32}$/.test(value.request_id||'')||!value.batch_id||!value.design_run_id||!value.basis?.digest
    ||!Array.isArray(value.basis.parameters)||!value.basis.parameters.length||!Array.isArray(value.samples)||!value.samples.length
    ||value.samples.some(s=>!/^MP-[a-f0-9]{32}$/.test(s.part_id)||!s.serial_number||!Array.isArray(s.comparison?.items))
    ||new Set(value.samples.map(s=>s.part_id)).size!==value.samples.length)throw new Error('实测批次返回无效，暂不生成合格结论');
  return value;
}
