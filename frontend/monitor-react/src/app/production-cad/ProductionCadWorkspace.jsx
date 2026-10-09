import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { freeCadArtifacts, freeCadRequest, freeCadRunId, freeCadStatus, freeCadWorkbenchExamples, readFreeCadSession, saveFreeCadSession, validFreeCadRun } from "./freecad.mjs";
import DesignParameterEditor from './DesignParameterEditor.jsx';
import { appendDesignVersion, designParameterGroups, designTemplates } from './designEditor.mjs';
import InlineDimensionEditor from './InlineDimensionEditor.jsx';
import SimulatedProductionPanel from "./SimulatedProductionPanel.jsx";
import "./productionCad.css";

const FreeCadModelViewer = lazy(() => import("./FreeCadModelViewer.jsx"));
const terminal = new Set(["completed", "needs_input", "failed", "outcome_unknown"]);
function storage() { try { return window.sessionStorage; } catch { return null; } }
const advancedExamples = {
  sphere: { label: '球体', prompt: '直径40mm的球体' },
  cone: { label: '圆锥 / 圆台', prompt: '底径40mm、顶径0mm、高60mm的圆锥' },
  gear: { label: '渐开线直齿轮', prompt: '模数2mm、齿数20、压力角20度、齿宽10mm、孔径8mm的直齿轮' },
  thread: { label: '外螺纹（实验，可能校验失败）', prompt: '大径20mm、螺距2mm、长20mm、牙深1mm、牙型角60度的右旋外螺纹' },
  fillet: { label: '全部边圆角', prompt: '长60mm、宽40mm、高20mm的长方体，全部边圆角半径2mm' },
  chamfer: { label: '全部边倒角', prompt: '长60mm、宽40mm、高20mm的长方体，全部边倒角距离2mm' },
  loft: { label: '圆形截面放样曲面', prompt: '按下方明确的三个圆形截面生成曲面实体', spec: { units: 'mm', operations: [{ type: 'loft', mode: 'add', position: [0,0,0], sections: [
    { z: 0, diameter: 40, center: [0,0] }, { z: 30, diameter: 20, center: [5,0] }, { z: 60, diameter: 30, center: [0,0] },
  ] }] } },
  assembly: { label: '底座与球体静态装配', prompt: '按下方坐标装配底座与球体，不自动改变位置', spec: { units: 'mm', parts: [
    { name: '底座', operations: [{ type: 'box', mode: 'add', length: 60, width: 40, height: 10, position: [0,0,0] }] },
    { name: '球体', operations: [{ type: 'sphere', mode: 'add', diameter: 20, position: [30,20,20] }] },
  ] } },
  ...freeCadWorkbenchExamples,
  ...designTemplates,
};

const artifactLabels = { 'model.stl': 'STL', 'model.step': 'STEP', 'model.FCStd': 'FCStd', 'model.fcstd': 'FCStd',
  'drawing.svg': '工程图 SVG', 'drawing.pdf': '工程图 PDF', 'unfold.svg': '展开 SVG', 'unfold.dxf': '展开 DXF', 'motion.json': '运动帧 JSON' };

function DimensionButtons({ dimensions, onEdit }) {
  return dimensions?.length > 0 && <div className="cad-on-model-dimensions" aria-label="可修改设计尺寸"><span>设计尺寸 · 点击修改</span>{dimensions.map((field) => <button key={field.id} type="button" aria-label={`修改${field.label}，当前${field.value}${field.unit}`} onClick={() => onEdit(field.id)}>{field.label} <strong>{field.value}</strong> {field.unit}</button>)}</div>;
}

function DrawingPreview({ artifact, title, dimensions, onEdit, editProps }) {
  const [state, setState] = useState('loading');
  return <figure className="cad-drawing-preview">
    <figcaption>{title}</figcaption>
    {state === 'loading' && <p role="status">正在读取{title}…</p>}
    {state === 'error' ? <p className="cad-run-error" role="alert">{title}加载失败，请刷新结果或下载文件核对。</p> :
      <div className="cad-drawing-stage"><img src={artifact.url} alt={`FreeCAD ${title}`} onLoad={() => setState('ready')} onError={() => setState('error')} />
        {state === 'ready' && editProps && <InlineDimensionEditor {...editProps} kind="drawing" />}</div>}
    {onEdit && <DimensionButtons dimensions={dimensions} onEdit={onEdit} />}
  </figure>;
}

function readVersions() {
  try { return appendDesignVersion(JSON.parse(storage()?.getItem('freecad.design-versions') || '[]'), null); }
  catch { return []; }
}

export default function ProductionCadWorkspace() {
  const [saved] = useState(() => readFreeCadSession(storage()));
  const [prompt, setPrompt] = useState(saved?.draft_prompt || "");
  const [specText, setSpecText] = useState(saved?.draft_spec || ''), [confirmed, setConfirmed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [run, setRun] = useState(saved?.run_id ? { run_id: saved.run_id, prompt: saved.prompt, status: "restoring", calls: [] } : null);
  const [health, setHealth] = useState(null), [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pollEpoch, setPollEpoch] = useState(0);
  const [versions, setVersions] = useState(readVersions), [revision, setRevision] = useState(null);
  const [draftValid, setDraftValid] = useState(true), [revisionValid, setRevisionValid] = useState(true), [revisionConfirmed, setRevisionConfirmed] = useState(false);
  const [directValidity, setDirectValidity] = useState({});
  const [directReset, setDirectReset] = useState(0);
  const recordValidity = useCallback((key, valid) => setDirectValidity((current) => current[key] === valid ? current : { ...current, [key]: valid }), []);
  const modelValidity = useCallback((valid) => recordValidity('model', valid), [recordValidity]);
  const drawingValidity = useCallback((valid) => recordValidity('drawing', valid), [recordValidity]);
  const unfoldValidity = useCallback((valid) => recordValidity('unfold', valid), [recordValidity]);
  const validRevision = revisionValid && Object.values(directValidity).every(Boolean);
  const draftSpec = useMemo(() => { try { return specText.trim() ? JSON.parse(specText) : null; } catch { return null; } }, [specText]);
  const session = useRef(saved), submitting = useRef(false), readVersion = useRef(0);
  const pending = run?.status === "running" || run?.status === "restoring";
  const unknown = run?.status === "outcome_unknown";
  const connected = health?.connected === true;
  const supported = (health?.tools || []).some((tool) => tool.name === "execute_code");
  const artifacts = freeCadArtifacts(run), stl = artifacts.find((item) => item.format === "stl");
  const drawing = artifacts.find((item) => item.name === 'drawing.svg');
  const unfold = artifacts.find((item) => item.name === 'unfold.svg');
  const motion = artifacts.find((item) => item.name === 'motion.json');
  const dimensions = designParameterGroups(run?.spec).filter((group) => group.operation || group.id === 'sheet_metal').slice(0, 1)
    .flatMap((group) => group.fields.filter((field) => !field.options && !field.id.includes('.position.') && !field.id.includes('.sections.'))).slice(0, 4);

  useEffect(() => {
    if (run?.status !== 'completed' || !freeCadArtifacts(run).some((item) => item.format === 'stl')) return;
    setVersions((current) => {
      const next = appendDesignVersion(current, run);
      try { storage()?.setItem('freecad.design-versions', JSON.stringify(next)); } catch { /* 会话存储不可用不影响当前设计。 */ }
      return JSON.stringify(current) === JSON.stringify(next) ? current : next;
    });
  }, [run]);

  useEffect(() => {
    const abort = new AbortController();
    freeCadRequest("/status", { signal: abort.signal }).then(setHealth).catch((failure) => { if (!abort.signal.aborted) { setHealth({ connected: false, tools: [] }); setError(failure.message); } });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!validFreeCadRun(run?.run_id) || !pending) return undefined;
    const abort = new AbortController(), version = ++readVersion.current;
    let timer;
    const poll = async () => {
      try {
        const record = await freeCadRequest(`/runs/${run.run_id}`, { signal: abort.signal });
        if (abort.signal.aborted || version !== readVersion.current) return;
        if (record.run_id !== run.run_id || (!terminal.has(record.status) && record.status !== "running")) throw new Error("运行记录格式不完整，请刷新状态重查。");
        setRun(record); setError("");
        if (record.status === "running") timer = window.setTimeout(poll, 1500);
      } catch (failure) {
        if (abort.signal.aborted || version !== readVersion.current) return;
        setError(failure.status === 404 ? "本次运行记录暂未找到。请确认本地 FreeCAD 状态后刷新查询。" : failure.message);
        setRun((value) => ({ ...value, status: "outcome_unknown" }));
      }
    };
    timer = window.setTimeout(poll, run.status === "restoring" ? 0 : 400);
    return () => { abort.abort(); window.clearTimeout(timer); };
  }, [run?.run_id, run?.status, pending, pollEpoch]);

  function editPrompt(value) {
    setConfirmed(false);
    setPrompt(value);
    session.current = { prompt: session.current?.prompt || "", command_id: session.current?.command_id || "", ...session.current, draft_prompt: value };
    saveFreeCadSession(storage(), session.current);
  }

  function editSpec(value) {
    setSpecText(value); setConfirmed(false);
    session.current = { prompt: '', command_id: '', ...session.current, draft_prompt: prompt, draft_spec: value };
    saveFreeCadSession(storage(), session.current);
  }

  function chooseExample(value, spec = '') {
    setPrompt(value); setSpecText(spec); setConfirmed(false);
    setDraftValid(true);
    session.current = { prompt: '', command_id: '', ...session.current, draft_prompt: value, draft_spec: spec };
    saveFreeCadSession(storage(), session.current);
  }

  async function refresh() {
    setBusy("refresh"); setError(""); ++readVersion.current;
    try {
      setHealth(await freeCadRequest("/status"));
      if (validFreeCadRun(run?.run_id)) {
        const record = await freeCadRequest(`/runs/${run.run_id}`);
        if (record.run_id !== run.run_id || (!terminal.has(record.status) && record.status !== "running")) throw new Error("运行记录格式不完整，请稍后刷新。");
        setRun(record);
      }
    } catch (failure) { setError(failure.status === 404 ? "本次运行记录暂未找到。刷新仅查询已有记录；如已确认未生成，可开始新需求。" : failure.message); }
    finally { setBusy(""); setPollEpoch((value) => value + 1); }
  }

  async function submit(event, changedSpec = null) {
    event.preventDefault();
    if (submitting.current || busy || pending || unknown || !connected || !supported ||
        (changedSpec ? !validRevision || !revisionConfirmed : !prompt.trim() || !draftValid || (specText.trim() && !confirmed))) return;
    submitting.current = true; setBusy("submit"); setError(""); ++readVersion.current;
    let nextSession;
    try {
      let spec = changedSpec || undefined;
      if (!changedSpec && specText.trim()) {
        try { spec = JSON.parse(specText); } catch { throw new Error('结构化参数不是有效 JSON，请检查后重新核对。'); }
        if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('结构化参数必须是完整的 JSON 对象。');
      }
      const submittedPrompt = changedSpec ? `修改现有设计：${String(run.prompt || '零件设计').slice(0, 9500)}。以本次确认的参数为准，重新生成模型和图纸。` : prompt;
      const command_id = crypto.randomUUID(), run_id = await freeCadRunId(command_id);
      // 请求发出前保存确定性编号；丢失响应后只回查，不自动重放建模。
      nextSession = { command_id, run_id, prompt: submittedPrompt, draft_prompt: prompt, draft_spec: specText };
      session.current = nextSession; saveFreeCadSession(storage(), nextSession);
      setRevision(null); setRevisionConfirmed(false);
      setRun({ run_id, prompt: submittedPrompt, status: "submitting", calls: [] });
      const record = await freeCadRequest("/runs", { method: "POST", body: { prompt: submittedPrompt, command_id, ...(spec ? { spec } : {}) } });
      if (!validFreeCadRun(record?.run_id) || (!terminal.has(record.status) && record.status !== "running")) throw Object.assign(new Error("未收到有效运行记录，请刷新状态核对。"), { outcomeUnknown: true });
      session.current = { ...nextSession, run_id: record.run_id }; saveFreeCadSession(storage(), session.current);
      setRun({ ...record, prompt: record.prompt ?? submittedPrompt });
    } catch (failure) {
      setError(failure.message);
      if (nextSession) setRun({ run_id: nextSession.run_id, prompt: nextSession.prompt, status: failure.outcomeUnknown ? "outcome_unknown" : "failed", error: failure.message, calls: [] });
    } finally { submitting.current = false; setBusy(""); }
  }

  function startNew() {
    ++readVersion.current; setRun(null); setError(""); setRevision(null);
    session.current = { prompt: "", command_id: "", draft_prompt: prompt, draft_spec: specText };
    saveFreeCadSession(storage(), session.current);
  }

  function editCurrent(fieldId = null) {
    if (!revision || revision.run_id !== run.run_id) {
      setRevision({ run_id: run.run_id, spec: JSON.parse(JSON.stringify(run.spec)) });
      setRevisionValid(true); setRevisionConfirmed(false); setError('');
    }
    window.setTimeout(() => {
      document.getElementById('cad-design-edit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof fieldId === 'string') document.getElementById(`revision-parameter-${fieldId}`)?.focus({ preventScroll: true });
    }, 0);
  }
  function selectVersion(id) {
    if (locked || !validFreeCadRun(id) || id === run?.run_id) return;
    const version = versions.find((item) => item.run_id === id);
    setRevision(null); setRevisionConfirmed(false);
    session.current = { ...session.current, run_id: id, prompt: version?.prompt || '' };
    saveFreeCadSession(storage(), session.current);
    setRun({ run_id: id, prompt: version?.prompt || '', status: 'restoring', calls: [] });
  }

  function changeOnDrawing(spec) {
    if (locked) return;
    setRevision({ run_id: run.run_id, spec }); setRevisionConfirmed(false);
  }
  function discardOnDrawing() {
    setRevision(null); setRevisionConfirmed(false); setRevisionValid(true); setDirectValidity({}); setDirectReset((value) => value + 1);
  }

  const locked = Boolean(busy) || pending || unknown;
  const currentSpec = revision && revision.run_id === run?.run_id ? revision.spec : run?.spec;
  const directProps = stl && run.spec?.units === 'mm' ? { sourceSpec: run.spec, spec: currentSpec, disabled: locked, resetEpoch: directReset,
    onChange: changeOnDrawing, onDiscard: discardOnDrawing, confirmed: revisionConfirmed, onConfirm: setRevisionConfirmed,
    canApply: connected && supported && validRevision && revisionConfirmed,
    onApply: (event) => submit(event, currentSpec) } : null;
  return <section className="production-cad">
    <header className="cad-workspace-header"><div><span className="cad-eyebrow">设计与工程</span><h1>零件设计工作台</h1><p>从需求到三维模型，再到可修改、可下载的工程图纸。</p></div><span className="cad-workspace-unit">尺寸单位 · 毫米</span></header>
    <ol className="cad-steps" aria-label="设计步骤"><li><span>01</span>描述需求</li><li><span>02</span>生成模型与图纸</li><li><span>03</span>修改设计与导出</li></ol>
    {error && <div className="cad-alert" role="alert">{error}</div>}
    <section className="cad-card">
      <div className="cad-card-heading"><div><span className="cad-section-number">01 / 设计输入</span><h2>创建你的设计</h2></div><button type="button" disabled={locked} onClick={startNew}>新建设计</button></div>
      {health === null && <p className="cad-read-notice" role="status">正在检查建模服务，确认连接后可以生成或应用修改。</p>}
      {health !== null && (!connected || !supported) && <div className="cad-alert" role="alert"><p>建模服务暂不可用，请稍后重试。</p><button type="button" disabled={Boolean(busy)} onClick={refresh}>{busy === "refresh" ? "正在重试…" : "重试"}</button></div>}
      <form onSubmit={submit}>
        <label htmlFor="freecad-prompt">描述零件、尺寸和设计要求</label>
        <textarea id="freecad-prompt" rows={3} maxLength={10000} value={prompt} onChange={(event) => editPrompt(event.target.value)} disabled={locked} placeholder="说明用途、形状和尺寸。例如：法兰直径70mm、厚12mm，中心通孔16mm，四个安装孔。" />
        <label htmlFor="advanced-example">选择设计模板</label>
        <select id="advanced-example" defaultValue="" disabled={locked} onChange={(event) => { const sample = advancedExamples[event.target.value]; if (sample) chooseExample(sample.prompt, sample.spec ? JSON.stringify(sample.spec, null, 2) : ''); }}>
          <option value="">从模板开始，尺寸与特征都可以修改</option>{Object.entries(advancedExamples).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
        {specText.trim() && <div className="cad-template-notice"><p>使用下方参数生成，文字描述用于说明用途。</p><button type="button" disabled={locked} onClick={() => { editSpec(''); setDraftValid(true); setAdvancedOpen(false); }}>仅按文字建模</button></div>}
        {draftSpec?.units === 'mm' && <DesignParameterEditor key={prompt} spec={draftSpec} disabled={locked} onChange={(value) => editSpec(JSON.stringify(value, null, 2))} onValidityChange={setDraftValid} />}
        {specText.trim() && <label className="cad-confirm"><input type="checkbox" checked={confirmed} disabled={locked} onChange={(event) => setConfirmed(event.target.checked)} />我已核对设计尺寸与参数</label>}
        <details className="cad-expert-options" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
          <summary>专业设置</summary>
          <p>JSON 优先于上方文字，用于明确每个操作、图纸比例、剖面、关节或建筑对象的位置。示例尺寸只是示例；请修改并人工核对。清空 JSON 可回到文字建模。</p>
          <p className="cad-parameter-help">尺寸统一为毫米，角度为度。钣金底边和翼边为不含圆弧的直段长度，K 因子采用 ANSI。drawing 可叠加到任一模型；section 为 null 时不生成剖面，scale 为图纸比例。</p>
          <label htmlFor="freecad-spec">结构化参数（JSON，优先于文字描述）</label>
          <textarea id="freecad-spec" rows={12} maxLength={30000} value={specText} disabled={locked} onChange={(event) => editSpec(event.target.value)} placeholder='{"units":"mm","operations":[...]}' />
        </details>
        <div className="cad-actions"><button type="submit" className="cad-primary" disabled={!connected || !supported || locked || !draftValid || !prompt.trim() || Boolean(specText.trim() && !confirmed)}>{busy === "submit" ? "正在提交…" : pending ? "正在生成模型…" : "生成 3D 模型"}</button><button type="button" disabled={locked} onClick={() => chooseExample("外径30mm、长50mm的销轴，带同轴通孔直径10mm")}>填入带通孔销轴示例</button><button type="button" disabled={locked} onClick={() => chooseExample("正四面体（立体三角形、四面相同、边长100mm）")}>填入正四面体示例</button></div>
        <p className="cad-storage-note">生成后点击图上的“图上编辑”，直接改尺寸或拖动端点；核对后应用修改。设计文件不代表生产放行，不会启动机器。</p>
        <details className="cad-expert-options"><summary>设计范围与使用说明</summary><p className="cad-review-note">支持基础实体、齿轮、圆角、倒角、放样、工程图、关节装配、单折弯钣金和基础建筑。外螺纹为实验功能；装配未进行运动碰撞和强度验收，建筑未进行结构安全验收。下载 FCStd 可在 FreeCAD 继续编辑；设计生成不会启动机器。修改版本记录保存在当前浏览器会话，运行记录过期后仍可保留已下载的文件。</p></details>
      </form>
    </section>
    {!run && <section className="cad-card cad-preview-empty"><div className="cad-empty-icon" aria-hidden="true">◇</div><h2>你的设计将显示在这里</h2><p>描述需求或选择模板，生成后可查看三维模型、修改尺寸并导出图纸。</p></section>}
    {run && <section className="cad-card" aria-labelledby="freecad-result-title">
      <div className="cad-card-heading"><div><span className="cad-section-number">02 / 设计成果</span><h2 id="freecad-result-title">模型与图纸</h2></div><span className={`cad-badge ${run.status}`} role="status">{freeCadStatus(run.status)}</span></div>
      <div className="cad-actions"><button type="button" disabled={Boolean(busy)} onClick={refresh}>{busy === "refresh" ? "正在刷新…" : "刷新结果"}</button>{stl && run.spec?.units === 'mm' && <button type="button" className="cad-primary" disabled={locked} onClick={() => editCurrent()}>修改设计</button>}
        {versions.length > 0 && <label className="cad-version-label">设计版本<select aria-label="设计版本" value={versions.some((item) => item.run_id === run.run_id) ? run.run_id : ''} disabled={locked} onChange={(event) => selectVersion(event.target.value)}><option value="" disabled>正在生成新版本</option>{versions.map((item, index) => <option key={item.run_id} value={item.run_id}>版本 {index + 1} · {new Date(item.created_at * 1000).toLocaleTimeString('zh-CN')}</option>)}</select></label>}</div>
      <details className="cad-design-brief"><summary>查看设计要求</summary><p className="cad-submitted-prompt">{run.prompt}</p></details>
      {pending && <p role="status">正在等待 FreeCAD 实际执行结果。可以稍后回到此页继续查询。</p>}
      {unknown && <div className="cad-alert"><p>尚未确认本次执行结果。请先刷新查询；如已在本地 FreeCAD 核对，可开始新需求。</p><button type="button" disabled={Boolean(busy)} onClick={startNew}>已核对，开始新需求</button></div>}
      {run.error && <p className="cad-run-error" role="alert">{String(run.error)}</p>}
      {run.answer && !stl && <p className="cad-result-text">{run.answer}</p>}
      {stl ? <>
        <div className="cad-validation"><span>模型检查通过</span>{Array.isArray(run.validation.bounds_mm) && <span>外形尺寸 {run.validation.bounds_mm.map((value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })).join(" × ")} mm</span>}{Number.isFinite(run.validation.volume_mm3) && <span>体积 {run.validation.volume_mm3.toLocaleString(undefined, { maximumFractionDigits: 3 })} mm³</span>}</div>
        {run.validation.model_kind === 'assembly' && <p>{motion ? '真实关节运动' : run.validation.assembly?.verified ? '原生装配' : '静态装配'} · {run.validation.component_count} 个零件 · 首帧干涉检查通过：{run.validation.components.map((p) => p.name).join('、')}</p>}
        {run.validation.model_kind === 'bim' && <p>BIM 建筑 · {run.validation.bim.walls} 面墙 · {run.validation.bim.slabs} 块楼板 · {run.validation.bim.openings} 个开口</p>}
        {motion && <p className="cad-read-notice">播放的是 FreeCAD 关节求解生成的运动帧；尚未进行运动全过程的碰撞或强度验收。</p>}
        <Suspense fallback={<p role="status">正在加载三维查看器…</p>}><FreeCadModelViewer key={stl.url} url={stl.url} motionUrl={motion?.url} editProps={directProps && { ...directProps, onValidityChange: modelValidity }} dimensionControls={!locked && <DimensionButtons dimensions={dimensions} onEdit={editCurrent} />} /></Suspense>
        {revision?.run_id === run.run_id && <section id="cad-design-edit" className="cad-edit-design" aria-label="修改当前设计">
          <div className="cad-card-heading"><div><span className="cad-section-number">03 / 设计修改</span><h3>修改当前设计</h3></div><button type="button" disabled={locked} onClick={discardOnDrawing}>取消修改</button></div>
          <DesignParameterEditor key={revision.run_id} idPrefix="revision" spec={revision.spec} disabled={locked} onChange={(spec) => { setRevision((value) => ({ ...value, spec })); setRevisionConfirmed(false); }} onValidityChange={setRevisionValid} />
          <label className="cad-confirm"><input type="checkbox" checked={revisionConfirmed} disabled={locked} onChange={(event) => setRevisionConfirmed(event.target.checked)} />我已核对修改后的尺寸与特征</label>
          <div className="cad-actions"><button type="button" className="cad-primary" disabled={locked || !connected || !supported || !validRevision || !revisionConfirmed || JSON.stringify(revision.spec) === JSON.stringify(run.spec)} onClick={(event) => submit(event, revision.spec)}>应用修改，生成新版本</button><span className="cad-save-note">当前图纸保持原样；应用后生成新的模型与图纸。</span></div>
        </section>}
        {(drawing || unfold) && <section className="cad-drawing-results" aria-label="二维图纸预览">
          <h3>二维图纸</h3>
          <div className="cad-drawing-grid">
            {drawing && <DrawingPreview key={drawing.url} artifact={drawing} title="工程图（含所选三视图与剖视图）" dimensions={dimensions} onEdit={!locked && run.spec?.units === 'mm' ? editCurrent : null} editProps={directProps && { ...directProps, onValidityChange: drawingValidity }} />}
            {unfold && <DrawingPreview key={unfold.url} artifact={unfold} title="钣金展开图" dimensions={dimensions} onEdit={!locked && run.spec?.units === 'mm' ? editCurrent : null} editProps={directProps && { ...directProps, onValidityChange: unfoldValidity }} />}
          </div>
        </section>}
        {run.spec?.drawing && !drawing && <p className="cad-run-error" role="alert">本轮请求的工程图没有通过完整产物校验，无法预览。</p>}
        {run.spec?.sheet_metal && !unfold && <p className="cad-run-error" role="alert">本轮请求的钣金展开图没有通过完整产物校验，无法预览。</p>}
        {run.spec?.assembly?.motion && !motion && <p className="cad-run-error" role="alert">本轮未返回通过求解校验的运动帧，无法播放关节运动。</p>}
        <div className="cad-downloads" aria-label="模型导出">{artifacts.map((item) => <a key={item.name} href={item.url} download={item.name}>下载 {artifactLabels[item.name]}</a>)}</div>
      </> : terminal.has(run.status) && <p className="cad-no-model" role={run.status === 'completed' ? 'alert' : undefined}>本轮没有可展示的 STL 模型。{run.status === "needs_input" ? "请补充上方所需参数后再次生成。" : run.status === 'completed' ? "实体证据或模型产物不完整，不能将二维图纸作为建模成功结果。" : "请查看执行结果和实际工具调用。"}</p>}
      <SimulatedProductionPanel run={run} draftPending={Boolean(revision) || locked || Boolean(run.prompt && prompt.trim() !== run.prompt.trim()) || Boolean(specText.trim() && JSON.stringify(draftSpec) !== JSON.stringify(run.spec))} />
      <details className="cad-call-details"><summary>技术记录</summary><p className="cad-identifier">运行编号：{run.run_id}</p>
        {run.spec && <details><summary>建模参数</summary><pre>{JSON.stringify(run.spec, null, 2)}</pre></details>}
        {run.validation && <details><summary>几何检查详情</summary><pre>{JSON.stringify(run.validation, null, 2)}</pre></details>}
        {run.execution && <details className="cad-execution-details"><summary>执行路径</summary><p>{run.execution.agent} → {run.execution.node} → {run.execution.skill} → {run.execution.tool}</p></details>}
        {!!run.calls?.length && <details><summary>实际工具调用 · {run.calls.length} 次</summary><ol>{run.calls.map((call, index) => <li key={index}><details><summary>{index + 1}. {call.tool}{call.error || call.result?.isError ? " · 失败" : ""}</summary><h3>参数</h3><pre>{JSON.stringify(call.arguments, null, 2)}</pre><h3>{call.error ? "调用错误" : "工具返回"}</h3><pre>{JSON.stringify(call.error ? { error: call.error, result: call.result } : call.result, null, 2)}</pre></details></li>)}</ol></details>}
      </details>
    </section>}
  </section>;
}
