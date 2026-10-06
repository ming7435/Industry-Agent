import React, {useState} from 'react';
import {request} from './apiRequest.mjs';
import {INSPECTION_FIELDS,prepareInspectionInput} from './inspectionInput.mjs';

export default function InspectionInput({partId,onSaved}) {
  const [identity,setIdentity] = useState({part_no:'',part_name:'',batch_id:'',production_order_id:'',device_id:''});
  const [fields,setFields] = useState({});
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  async function save() {
    setBusy(true);
    try {
      const payload = prepareInspectionInput(identity,fields);
      const result = await request(`/api/quality/parts/${encodeURIComponent(partId.trim())}/input`,{method:'POST',body:JSON.stringify(payload)});
      setMessage(`实测记录已保存，来源：人工录入，录入人 ${result.part?.recorded_by || '--'}。现在可以执行质量检测。`);
      onSaved?.(result.part);
    } catch(err) {setMessage(err.message);}
    finally {setBusy(false);}
  }
  async function load() {
    setBusy(true);
    try {
      const result = await request(`/api/quality/parts/${encodeURIComponent(partId.trim())}/input`);
      const part = result.part || {};
      setIdentity(Object.fromEntries(Object.keys(identity).map(key=>[key,part[key] || ''])));
      setFields(Object.fromEntries(INSPECTION_FIELDS.map(([key])=>[key,JSON.stringify(part[key] || {},null,2)])));
      setMessage(`已读取保存的原始检测数据；来源 ${part.source || '--'}，请根据本次实测修改。`);
    } catch(err) {setMessage(err.message);}
    finally {setBusy(false);}
  }
  return <details className="quality-input-panel"><summary>录入／修改实测数据和检验规格（需登录）</summary><p>只输入本次真实观测和实际图纸规格，不会自动补正常值或猜测合格阈值。当前支持旋转类零件的五项检验；不适用的零件需接入其专用检验规则，不能强行判合格。</p>
    {Object.entries({part_no:'零件号',part_name:'中文名称',batch_id:'批次（复检须一致）',production_order_id:'生产单',device_id:'生产设备编号'}).map(([key,label])=><div key={key}><label className="field-label">{label}</label><input className="select-input" value={identity[key]} onChange={event=>setIdentity({...identity,[key]:event.target.value})}/></div>)}
    {INSPECTION_FIELDS.map(([key,label,help])=><div key={key}><label className="field-label">{label}（JSON）</label><p>{help}</p><textarea className="qa-input" value={fields[key] || ''} placeholder="{}（未检测项目保持为空，不会默认合格）" onChange={event=>setFields({...fields,[key]:event.target.value})}/></div>)}
    <div className="action-row"><button className="button" disabled={busy || !partId.trim()} onClick={load}>读取已保存的数据</button><button className="button primary" disabled={busy || !partId.trim()} onClick={save}>{busy?'处理中…':'保存实测数据'}</button></div>{message && <p role="status">{message}</p>}
  </details>;
}
