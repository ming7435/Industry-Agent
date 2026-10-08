import React, { useEffect, useMemo, useRef, useState } from 'react';
import { designParameterGroups, updateDesignParameter } from './designEditor.mjs';
import { directDimensions, dragDimensionValue } from './directEditing.mjs';

// 标注层只修改设计草稿；真实实体仍由原来的唯一建模接口生成。
export default function InlineDimensionEditor({ sourceSpec, spec, disabled, onChange, onDiscard, confirmed, onConfirm, canApply, onApply, onValidityChange, resetEpoch = 0, kind = 'model', projections = [], size, onMeasurements, onInteraction }) {
  const [editing, setEditing] = useState(false), [selected, setSelected] = useState(''), [active, setActive] = useState('');
  const [raw, setRaw] = useState(''), [error, setError] = useState('');
  const drag = useRef(null), latest = useRef({ spec, onChange }), localEdit = useRef(null), previousReset = useRef(resetEpoch);
  latest.current = { spec, onChange };
  const groups = useMemo(() => designParameterGroups(spec), [spec]);
  const group = groups.find((item) => item.id === selected) || groups[0];
  const field = group?.fields.find((item) => item.id === active);
  const measures = useMemo(() => editing ? directDimensions(spec, group?.id) : [], [editing, spec, group?.id]);
  const changed = JSON.stringify(spec) !== JSON.stringify(sourceSpec);
  useEffect(() => {
    const reset = previousReset.current !== resetEpoch;
    previousReset.current = resetEpoch;
    if (!field) { if (reset) { setError(''); onValidityChange(true); } return; }
    // 本视图输入保留正在键入的格式；其他视图修改同一字段或撤销时同步实际草稿。
    if (!reset && localEdit.current?.id === field.id && localEdit.current.value === field.value) { localEdit.current = null; return; }
    localEdit.current = null;
    setRaw(String(field.value)); setError(''); onValidityChange(true);
  }, [field?.id, field?.value, resetEpoch, onValidityChange]);
  useEffect(() => { onMeasurements?.(measures); }, [measures, onMeasurements]);
  useEffect(() => () => { onValidityChange(true); onInteraction?.(false); }, [onValidityChange, onInteraction]);
  useEffect(() => { if (disabled) { drag.current = null; onInteraction?.(false); } }, [disabled, onInteraction]);
  function choose(id) {
    const item = group.fields.find((value) => value.id === id);
    setActive(id); setRaw(String(item.value)); setError(''); onValidityChange(true);
  }
  function edit(value) {
    setRaw(value);
    try {
      const next = updateDesignParameter(spec, field.id, value);
      localEdit.current = { id: field.id, value: designParameterGroups(next).flatMap((item) => item.fields).find((item) => item.id === field.id).value };
      onChange(next); setError(''); onValidityChange(true);
    }
    catch (failure) { setError(failure.message); onValidityChange(false); }
  }
  function begin(event, item) {
    if (disabled || Math.hypot(...item.unitPixels) < 0.1) return;
    event.preventDefault(); event.stopPropagation();
    drag.current = { item, x: event.clientX, y: event.clientY, spec, pointer: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId); onInteraction?.(true);
    setActive(''); setError(''); onValidityChange(true);
  }
  function move(event) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    try {
      const value = dragDimensionValue(start.item, event.clientX-start.x, event.clientY-start.y);
      latest.current.onChange(updateDesignParameter(start.spec, start.item.id, value));
      setError(''); onValidityChange(true);
    } catch (failure) { setError(failure.message); onValidityChange(false); }
  }
  function end(event, cancelled = false) {
    const start = drag.current;
    if (!start) return;
    if (cancelled) latest.current.onChange(start.spec);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onInteraction?.(false);
    if (cancelled) { setError(''); onValidityChange(true); }
  }
  function reset() { onDiscard(); setEditing(false); setActive(''); setError(''); onValidityChange(true); onInteraction?.(false); }
  if (!groups.length) return null;
  return <>
    <button type="button" className="cad-inline-toggle" disabled={disabled} aria-pressed={editing} onClick={() => { setEditing(!editing); setActive(''); setError(''); onValidityChange(true); onInteraction?.(false); }}>{editing ? '结束图上编辑' : '图上编辑'}</button>
    {editing && <section className={`cad-inline-layer ${kind}`} aria-label={kind === 'model' ? '三维图内编辑' : '图纸内编辑'}>
      {kind === 'model' && size && <><svg className="cad-dimension-guides" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="设计尺寸引线">
        {projections.map((item) => <g key={item.id} className={changed ? 'draft' : ''}>
          <line className="cad-dimension-leader" x1={item.anchorA[0]} y1={item.anchorA[1]} x2={item.a[0]} y2={item.a[1]} />
          <line className="cad-dimension-leader" x1={item.anchorB[0]} y1={item.anchorB[1]} x2={item.b[0]} y2={item.b[1]} />
          <line x1={item.a[0]} y1={item.a[1]} x2={item.b[0]} y2={item.b[1]} />
          <circle cx={item.a[0]} cy={item.a[1]} r="3" />
        </g>)}
      </svg><svg className="cad-dimension-handles" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="可拖动设计标注">
        {projections.map((item) => <g key={item.id} className={changed ? 'draft' : ''}>
          <circle cx={item.b[0]} cy={item.b[1]} r="8" role="button" tabIndex={disabled ? -1 : 0} aria-label={`拖动${item.label}尺寸`} aria-disabled={disabled || Math.hypot(...item.unitPixels) < 0.1}
            onPointerDown={(event) => begin(event, item)} onPointerMove={move} onPointerUp={end} onPointerCancel={(event) => end(event, true)} onLostPointerCapture={() => { drag.current = null; onInteraction?.(false); }}
            onKeyDown={(event) => { if (disabled) return; if (event.key === 'Enter') choose(item.id); if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) { event.preventDefault(); try { onChange(updateDesignParameter(spec, item.id, String(item.value + (['ArrowLeft','ArrowDown'].includes(event.key) ? -1 : 1) * (event.shiftKey ? 1 : 0.1)))); setError(''); onValidityChange(true); } catch (failure) { setError(failure.message); onValidityChange(false); } } }} />
        </g>)}
      </svg></>}
      <div className="cad-inline-object"><label>图上编辑对象<select disabled={disabled} value={group.id} onChange={(event) => { setSelected(event.target.value); setActive(''); setError(''); onValidityChange(true); }}>{groups.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><span>{changed ? '修改草稿 · 原实体尚未改变' : '点尺寸输入，或拖动圆点'}</span></div>
      {projections.map((item) => <button key={item.id} className="cad-floating-dimension" type="button" disabled={disabled} style={{ left: item.labelAt[0], top: item.labelAt[1] }} aria-label={`图内修改${item.label}`} onClick={() => choose(item.id)}>{item.label} {item.value} {item.unit}</button>)}
      <div className="cad-inline-parameters">{group.fields.filter((item) => !projections.some((p) => p.id === item.id)).map((item) => <button key={item.id} type="button" disabled={disabled} aria-label={`图内修改${item.label}`} onClick={() => choose(item.id)}>{item.label} {item.value} {item.unit}</button>)}</div>
      {field && <div className="cad-inline-input" role="group" aria-label="图内尺寸输入"><label>{field.label} {field.unit}{field.options ? <select aria-label={`图内${field.label}`} disabled={disabled} value={raw} onChange={(event) => edit(event.target.value)}>{field.options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select> : <input key={field.id} type="number" autoFocus step={field.integer ? 1 : 'any'} aria-label={`图内${field.label}`} aria-invalid={Boolean(error)} value={raw} disabled={disabled} onChange={(event) => edit(event.target.value)} />}</label><button type="button" disabled={disabled} onClick={() => { setActive(''); setError(''); onValidityChange(true); }}>关闭输入</button></div>}
      {error && <p className="cad-inline-error" role="alert">{error}</p>}
      <div className="cad-inline-apply"><label><input type="checkbox" checked={confirmed} disabled={disabled} onChange={(event) => onConfirm(event.target.checked)} />图上修改已核对</label><button type="button" className="cad-primary" disabled={disabled || !changed || !canApply || Boolean(error)} onClick={onApply}>应用图上修改</button><button type="button" disabled={disabled} onClick={reset}>撤销图上草稿</button></div>
    </section>}
  </>;
}
