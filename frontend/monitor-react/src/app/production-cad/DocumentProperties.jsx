import React,{useState} from 'react';
export const dimensionLabels={length:'长度',width:'宽度',height:'高度',diameter:'直径',bottom_diameter:'底径',top_diameter:'顶径'};
export default function DocumentProperties({object,pending,onSubmit}) {
  const properties=object?.properties||[],fields=properties.filter(p=>Object.hasOwn(dimensionLabels,p.name)&&p.editable);
  const [label,setLabel]=useState(object?.label||''),[values,setValues]=useState(()=>Object.fromEntries(fields.map(p=>[p.name,String(p.value)])));
  const initialPosition=properties.find(p=>p.name==='position')?.value||[0,0,0], initialRotation=properties.find(p=>p.name==='rotation')?.value||{axis:[0,0,1],angle:0};
  const [placement,setPlacement]=useState([...initialPosition,...initialRotation.axis,initialRotation.angle].map(String)),[error,setError]=useState('');
  if(!object) return <aside className="cad-document-properties"><h3>对象属性</h3><p>从模型树或三维模型选择对象。</p></aside>;
  const can=type=>object.editable_commands?.includes(type),submit=(type,parameters)=>onSubmit({command_type:type,parameters:{object_id:object.object_id,...parameters}});
  const applyDimensions=event=>{event.preventDefault();const dimensions=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,Number(v)]));
    if(Object.entries(values).some(([k,v])=>!v.trim()||!Number.isFinite(dimensions[k])||dimensions[k]>10000||dimensions[k]<(k==='top_diameter'?0:Number.MIN_VALUE))) {setError('请输入有效尺寸（毫米，不超过10000）');return;}
    setError('');submit('set_primitive_dimensions',{dimensions});};
  return <aside className="cad-document-properties" aria-label="对象属性"><h3>{object.label||object.name}</h3><p>{object.type_id} · {object.object_id}</p>
    {object.read_only_reason&&<p>{object.read_only_reason}</p>}{error&&<p role="alert">{error}</p>}
    <form onSubmit={event=>{event.preventDefault();if(label.trim())submit('set_label',{label});}}><label>对象标签<input value={label} maxLength={128} disabled={pending||!can('set_label')} onChange={e=>setLabel(e.target.value)}/></label><button disabled={pending||!label.trim()||!can('set_label')}>应用标签</button></form>
    <label className="cad-confirm"><input type="checkbox" checked={object.visible} disabled={pending||!can('set_visibility')} onChange={e=>submit('set_visibility',{visible:e.target.checked})}/>显示对象</label>
    {can('set_primitive_dimensions')&&fields.length>0&&<form onSubmit={applyDimensions}>{fields.map(p=><label key={p.name}>{dimensionLabels[p.name]}（mm）<input type="number" step="any" value={values[p.name]} disabled={pending} onChange={e=>setValues({...values,[p.name]:e.target.value})}/></label>)}<button disabled={pending}>应用尺寸</button></form>}
    {can('set_placement')&&<details><summary>位置与旋转</summary><form onSubmit={event=>{event.preventDefault();const numbers=placement.map(Number);if(placement.some(v=>!v.trim())||numbers.some(v=>!Number.isFinite(v)||Math.abs(v)>10000)||Math.hypot(...numbers.slice(3,6))===0){setError('位置或旋转轴无效');return;}setError('');submit('set_placement',{position:numbers.slice(0,3),rotation:{axis:numbers.slice(3,6),angle:numbers[6]}});}}>{['X（mm）','Y（mm）','Z（mm）','旋转轴 X','旋转轴 Y','旋转轴 Z','角度（deg）'].map((name,i)=><label key={name}>{name}<input type="number" step="any" value={placement[i]} disabled={pending} onChange={e=>setPlacement(placement.map((v,j)=>j===i?e.target.value:v))}/></label>)}<button disabled={pending}>应用位置与旋转</button></form></details>}
    <details><summary>全部属性与依赖</summary><dl>{properties.map(p=><React.Fragment key={p.name}><dt>{dimensionLabels[p.name]||p.name}{p.editable?'':'（只读）'}</dt><dd>{typeof p.value==='object'?JSON.stringify(p.value):String(p.value)} {p.unit}</dd></React.Fragment>)}</dl><p>依赖：{object.dependency_ids?.join('、')||'无'}</p></details>
  </aside>;
}
