import React, { useEffect, useState } from 'react';
import { addDesignFeature, designParameterGroups, removeDesignFeature, updateDesignParameter } from './designEditor.mjs';

function ParameterField({ field, group, spec, disabled, onChange, onInvalid, idPrefix }) {
  const [raw, setRaw] = useState(String(field.value)), [error, setError] = useState('');
  useEffect(() => { setRaw(String(field.value)); setError(''); onInvalid(field.id, false); }, [field.value]);
  function edit(value) {
    setRaw(value);
    try { const next = updateDesignParameter(spec, field.id, value); setError(''); onInvalid(field.id, false); onChange(next); }
    catch (failure) { setError(failure.message); onInvalid(field.id, true); }
  }
  const id = `${idPrefix}-parameter-${field.id}`;
  return <div className="cad-dimension-field">
    <label htmlFor={id}>{field.label}{field.unit && <span>{field.unit}</span>}</label>
    {field.options ? <select id={id} aria-label={`${group.label} · ${field.label}`} disabled={disabled} value={raw} onChange={(event) => edit(event.target.value)}>{field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> :
      <input id={id} aria-label={`${group.label} · ${field.label}`} type="number" step={field.integer ? '1' : 'any'} min={field.min} max={field.max} value={raw} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => edit(event.target.value)} />}
    {error && <small role="alert">{error}</small>}
  </div>;
}

export default function DesignParameterEditor({ spec, onChange, disabled = false, onValidityChange = () => {}, allowFeatures = true, idPrefix = 'draft' }) {
  const groups = designParameterGroups(spec), [invalid, setInvalid] = useState({}), [error, setError] = useState('');
  const [expanded, setExpanded] = useState(() => new Set(groups.slice(0, 1).map((group) => group.id)));
  const [part, setPart] = useState('0');
  const fields = new Set(groups.flatMap((group) => group.fields.map((field) => field.id)));
  useEffect(() => { onValidityChange(!Object.entries(invalid).some(([id, value]) => fields.has(id) && value)); }, [invalid, spec]);
  const validity = (id, value) => setInvalid((current) => current[id] === value ? current : { ...current, [id]: value });
  function changeFeature(action, openAdded = false) {
    try {
      const next = action();
      if (openAdded) {
        const list = partPath ? next.parts[Number(part)].operations : next.operations;
        const previous = partPath ? spec.parts[Number(part)].operations : spec.operations;
        const index = list.findIndex((operation, i) => JSON.stringify(operation) !== JSON.stringify(previous[i]));
        const id = [...(partPath || ['operations']), index < 0 ? list.length - 1 : index].join('.');
        setExpanded((current) => new Set([...current, id]));
      }
      onChange(next); setError('');
    }
    catch (failure) { setError(failure.message); }
  }
  const partPath = spec?.parts ? ['parts', Number(part), 'operations'] : undefined;
  return <div className="cad-parameter-editor" aria-label="设计参数编辑器">
    <div className="cad-editor-help"><strong>直接修改尺寸与特征</strong><span>修改后重新生成，三维模型和图纸会同步更新。原版本不覆盖。</span></div>
    {groups.map((group) => <details className="cad-feature" open={expanded.has(group.id)} key={group.id} onToggle={(event) => {
      const open = event.currentTarget.open;
      setExpanded((current) => {
        if (current.has(group.id) === open) return current;
        const next = new Set(current); if (open) next.add(group.id); else next.delete(group.id); return next;
      });
    }}>
      <summary><span>{group.label}</span><span className="cad-feature-count">{group.fields.length} 项参数</span></summary>
      <div className="cad-dimension-grid">{group.fields.map((field) => <ParameterField key={field.id} field={field} group={group} spec={spec} disabled={disabled} onChange={onChange} onInvalid={validity} idPrefix={idPrefix} />)}</div>
      {group.removable && allowFeatures && <button className="cad-remove-feature" type="button" disabled={disabled} aria-label={`删除${group.label}`} onClick={() => changeFeature(() => removeDesignFeature(spec, group.id))}>删除此特征</button>}
    </details>)}
    {!groups.length && <p>当前设计没有可直接修改的尺寸，请补充完整需求。</p>}
    {allowFeatures && (spec?.operations || spec?.parts) && <div className="cad-feature-actions">
      {spec.parts && <label>修改零件<select value={part} disabled={disabled} onChange={(event) => setPart(event.target.value)}>{spec.parts.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}</select></label>}
      {[['hole','添加通孔'],['fillet','添加圆角'],['chamfer','添加倒角']].map(([type, label]) => <button key={type} type="button" disabled={disabled} onClick={() => changeFeature(() => addDesignFeature(spec, type, partPath), true)}>{label}</button>)}
      <small>新增特征使用可修改的初始参数，请核对尺寸和位置。圆角/倒角默认作用于全部边。</small>
    </div>}
    {error && <p className="cad-run-error" role="alert">{error}</p>}
  </div>;
}
