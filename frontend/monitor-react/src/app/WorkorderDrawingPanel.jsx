import React, {useEffect, useRef, useState} from 'react';
import {request} from './apiRequest.mjs';

const viewerPath = /^\/drawings\/[A-Za-z0-9_-][A-Za-z0-9_.-]*\.html$/;
const identifier = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
const drawingKey = item => JSON.stringify([item.drawing_id,item.version_id || '',item.drawing_url]);

export default function WorkorderDrawingPanel({order, target}) {
  const deviceId = String(order?.device_id || '').trim();
  const deviceModel = String(order?.device_model || order?.drawing_context?.device_model || '').trim();
  const version = String(order?.drawing_context?.version_id || '').trim()
    || String(order?.drawing_context?.version_label || '').trim();
  const [revision, setRevision] = useState(0);
  const [drawingState, setDrawingState] = useState({status:'loading', drawings:[]});
  const [selectedId, setSelectedId] = useState('');
  const [location, setLocation] = useState({status:'missing'});
  const scene = useRef(null);
  // 故障描述不是部件编号；只有明确的结构化编号才查询部件关系。
  const component = identifier.test(target?.component || '') ? target.component : '';
  const partNo = identifier.test(target?.part_no || '') ? target.part_no : '';

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setDrawingState({status:'loading',drawings:[]});
    setSelectedId('');
    async function load() {
      try {
        if (!deviceId) throw new Error('工单缺少设备编号，不能确定图纸归属');
        const params = new URLSearchParams({device_id:deviceId});
        if (deviceModel) params.set('device_model',deviceModel);
        if (version) params.set('version',version);
        const body = await request('/api/cad/drawings?' + params, {signal:controller.signal});
        if (body.device_id !== deviceId || !Array.isArray(body.drawings)
          || !['available','not_found'].includes(body.status)
          || body.drawings.some(item => item.device_id !== deviceId || item.evidence_scope !== 'device_reference'
            || !viewerPath.test(item.drawing_url || '')
            || deviceModel && item.device_model !== deviceModel
            || version && ![item.version_id,item.version_label].includes(version))
          || (body.status === 'available') !== Boolean(body.drawings.length)) {
          throw new Error('返回图纸的设备归属、版本或文件地址不匹配');
        }
        if (!cancelled) {
          setDrawingState({status:body.status,drawings:body.drawings});
          setSelectedId(body.drawings[0] ? drawingKey(body.drawings[0]) : '');
        }
      } catch (error) {
        if (!cancelled) setDrawingState({status:'error',drawings:[],error:error.name === 'AbortError'
          ? '图纸检索超时，可点击重新检索图纸。' : error.message});
      } finally { clearTimeout(timeout); }
    }
    load();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [deviceId, deviceModel, version, revision]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLocation({status:'missing'});
    if (!deviceId || !(component || partNo)) return undefined;
    setLocation({status:'loading'});
    const timeout = setTimeout(() => controller.abort(),15000);
    const params = new URLSearchParams({device_id:deviceId,component,part_no:partNo});
    request('/api/cad/resolve?' + params, {signal:controller.signal}).then(body => {
      if (cancelled) return;
      const part = body.part;
      if (!part || part.device_id !== deviceId || component && part.component_id !== component
        || partNo && part.part_no !== partNo) {
        setLocation({status:'error',message:'部件返回的设备或编号不匹配，未展示定位结果'});
      } else setLocation({status:'found',part});
    }).catch(error => {
      if (!cancelled) setLocation(error.status === 404 ? {status:'missing'}
        : {status:'error',message:'部件定位查询暂不可用；不影响整机图纸查看。'});
    }).finally(() => clearTimeout(timeout));
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [deviceId, component, partNo, revision]);

  const drawing = drawingState.drawings.find(item => drawingKey(item) === selectedId);
  return <section className="repair-visual-panel" aria-label="3D 故障定位">
    <div className="repair-visual-head">
      <div><span className="eyebrow">设备图纸与故障定位</span>
        <h2>{drawing?.drawing_name || '当前设备图纸'}</h2>
        <p>设备：{deviceId || '未提供'} · 工单目标：{target?.part_name || '待核实'}</p></div>
      <div className="repair-visual-actions">
        <button className="button ghost-button" type="button" disabled={drawingState.status === 'loading'} onClick={() => setRevision(value => value+1)}>重新检索图纸</button>
        <button className="button ghost-button" type="button" disabled={!drawing} onClick={() => scene.current?.requestFullscreen?.()}>全屏</button>
      </div>
    </div>
    {drawingState.drawings.length > 1 && <label className="maintenance-plan-section">选择图纸版本
      <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>{drawingState.drawings.map(item =>
        <option key={drawingKey(item)} value={drawingKey(item)}>{item.drawing_name} · {item.version_label || item.version_id || '版本未标注'}</option>)}</select></label>}
    <div className="repair-visual-body"><div className="repair-cad-scene" ref={scene} aria-label="CAD 结构定位视图">
      {drawing ? <iframe key={drawing.drawing_url} className="repair-drawing-frame" title={`${deviceId} 工单图纸`} src={drawing.drawing_url} />
        : <div className={`cad-scene-status ${drawingState.status === 'error' ? 'is-error':''}`} role="status">
          <strong>{drawingState.status === 'loading' ? '正在检索设备图纸' : drawingState.status === 'error' ? '图纸检索失败':'尚未登记这台设备的图纸'}</strong>
          <span>{drawingState.error || `当前设备：${deviceId || '未提供'}`}</span>
          {drawingState.status === 'not_found' && <small>需要登记该设备的真实图纸，不使用其他机器的图纸代替。</small>}
        </div>}
    </div></div>
    <div className="maintenance-plan-section" aria-label="故障部件定位状态" role="status">
      {location.status === 'found' ? <><strong>已检索到部件资料：{location.part.name} · {location.part.part_no || location.part.component_id}</strong>
        <p>{location.part.position || '安装位置未标注'}。部件资料已匹配，不表示查看器已自动高亮该部件。</p></>
        : <><strong>{location.status === 'loading' ? '正在查询故障部件资料':location.status === 'error' ? '故障部件定位暂不可用':'故障部件定位尚未建立'}</strong>
          <p>{location.message || '整机图纸可独立查看；尚缺该设备的部件编号、装配关系与模型对象映射。'}</p></>}
      {drawing && <p>{drawing.source_kind === 'original_edrawings' ? '整机原始图纸':'设备图纸与参考模型'} · {drawing.version_label || drawing.version_id || '版本未标注'}。支持查看器原有的旋转、缩放操作。</p>}
    </div>
  </section>;
}
