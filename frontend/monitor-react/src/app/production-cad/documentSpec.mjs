import {addDesignFeature,designTemplates} from './designEditor.mjs';
import {freeCadWorkbenchExamples} from './freecad.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const primitives={'Part::Box':'box','Part::Cylinder':'cylinder','Part::Sphere':'sphere','Part::Cone':'cone'};
const dimensions={box:['length','width','height'],cylinder:['diameter','length'],sphere:['diameter'],cone:['bottom_diameter','top_diameter','height']};
export const specTasks=[
  {id:'edit',label:'编辑当前规格',current:true},
  {id:'hole',label:'通孔',current:true},{id:'fillet',label:'全部边圆角',current:true},{id:'chamfer',label:'全部边倒角',current:true},
  {id:'drawing',label:'三视图与工程图',current:true},{id:'section',label:'工程图与剖视图',current:true},
  {id:'gear',label:'渐开线直齿轮'},{id:'loft',label:'圆形截面放样'},
  {id:'flange',label:'法兰轴套'},{id:'plate',label:'安装底板'},
  {id:'sheetmetal',label:'钣金折弯与展开'},{id:'motion',label:'转动关节与装配运动'},{id:'bim',label:'BIM 墙、楼板与门洞'},
];
const templates={...freeCadWorkbenchExamples,...designTemplates,
  gear:{spec:{units:'mm',operations:[{type:'gear',mode:'add',module:2,teeth:20,pressure_angle:20,width:10,bore_diameter:8,axis:'z',position:[0,0,0]}]}},
  loft:{spec:{units:'mm',operations:[{type:'loft',mode:'add',position:[0,0,0],sections:[{z:0,diameter:40,center:[0,0]},{z:30,diameter:20,center:[5,0]},{z:60,diameter:30,center:[0,0]}]}]}},
};

// Only geometry whose full primitive definition is available can be converted.
// Unknown/dependent/rotated objects must never be replaced by a bounding-box guess.
export function snapshotSpec(snapshot){
  if(snapshot?.source_spec?.units==='mm')return copy(snapshot.source_spec);
  if(snapshot?.product_root_ids?.length!==1)throw new Error('当前流程需要单个独立主体或完整建模规格；多个独立零件请保留原文档或新建文档。');
  const object=snapshot.objects?.find(o=>o.object_id===snapshot.product_root_ids[0]),kind=primitives[object?.type_id];
  if(!kind||object.dependency_ids?.length||!object.editable_commands?.includes('set_primitive_dimensions')||!object.editable_commands?.includes('set_placement'))throw new Error('此模型没有可证明完整的可编辑规格，不能自动重建；可复制已有规格设计或新建文档。');
  const props=Object.fromEntries((object.properties||[]).map(p=>[p.name,p.value]));
  const rotation=props.rotation;
  if(!rotation||!Number.isFinite(rotation.angle)||Math.abs(rotation.angle)>1e-9)throw new Error('当前主体旋转信息缺失或存在旋转，不能把它转为轴对齐规格；请使用原生属性编辑或新建文档。');
  const complete={cylinder:{'native.Angle':360},cone:{'native.Angle':360},sphere:{'native.Angle1':-90,'native.Angle2':90,'native.Angle3':360}}[kind]||{};
  if(Object.entries(complete).some(([name,value])=>props[name]!==value))throw new Error('仅完整基础形体能转为规格，不能把部分圆柱、圆锥或球体当作完整主体。');
  const position=props.position;
  if(!Array.isArray(position)||position.length!==3||position.some(v=>!Number.isFinite(v)||Math.abs(v)>10000))throw new Error('当前主体位置不完整。');
  const operation={type:kind,mode:'add'};
  for(const name of dimensions[kind]){
    const value=props[name];
    if(!Number.isFinite(value)||value>10000||value<0||(value===0&&name!=='top_diameter'))throw new Error('当前主体尺寸不完整。');
    operation[name]=value;
  }
  if(kind==='cone'&&operation.bottom_diameter<=operation.top_diameter)throw new Error('圆锥底径必须大于顶径。');
  if(['cylinder','cone'].includes(kind))operation.axis='z';
  operation.position=[...position];
  return {units:'mm',operations:[operation]};
}

export function beginSpecTask(snapshot,id){
  const task=specTasks.find(item=>item.id===id);
  if(!task)throw new Error('不支持此建模任务。');
  if(!task.current)return copy(templates[id].spec);
  let spec=snapshotSpec(snapshot);
  if(['hole','fillet','chamfer'].includes(id)){
    if(!spec.operations)throw new Error('该任务需要单个零件的操作规格；装配请在参数编辑器选择具体零件后添加特征。');
    return addDesignFeature(spec,id);
  }
  if(['drawing','section'].includes(id)){
    spec.drawing=spec.drawing||{projection:'third_angle',scale:1,section:null};
    if(id==='section')spec.drawing.section=spec.drawing.section||{origin:[0,0,0],normal:[0,1,0]};
  }
  return spec;
}

export function specCommand(prepared,spec,current){
  if(!prepared?.document_id||prepared.document_id!==current?.document_id)throw new Error('文档已切换，请重新读取当前文档。');
  if(!Number.isInteger(prepared.revision)||prepared.revision!==current.revision)throw new Error('工作修订已更新，请重新读取参数并确认，旧草稿不会自动执行。');
  if(spec?.units!=='mm')throw new Error('规格必须使用毫米（mm）。');
  return {command_type:'replace_from_spec',document_id:prepared.document_id,expected_revision:prepared.revision,parameters:{spec:copy(spec)}};
}
