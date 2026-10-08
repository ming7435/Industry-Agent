import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { freeCadArtifacts, freeCadRequest, freeCadRunId, freeCadStatus, readFreeCadSession, saveFreeCadSession, validFreeCadRun } from "./freecad.mjs";
import "./productionCad.css";

const FreeCadModelViewer = lazy(() => import("./FreeCadModelViewer.jsx"));
const terminal = new Set(["completed", "needs_input", "failed", "outcome_unknown"]);
function storage() { try { return window.sessionStorage; } catch { return null; } }
const advancedExamples = {
  sphere: { label: '球体', prompt: '直径40mm的球体' },
  cone: { label: '圆锥 / 圆台', prompt: '底径40mm、顶径0mm、高60mm的圆锥' },
  gear: { label: '渐开线直齿轮', prompt: '模数2mm、齿数20、压力角20度、齿宽10mm、孔径8mm的直齿轮' },
  thread: { label: '外螺纹', prompt: '大径20mm、螺距2mm、长20mm、牙深1mm、牙型角60度的右旋外螺纹' },
  fillet: { label: '全部边圆角', prompt: '长60mm、宽40mm、高20mm的长方体，全部边圆角半径2mm' },
  chamfer: { label: '全部边倒角', prompt: '长60mm、宽40mm、高20mm的长方体，全部边倒角距离2mm' },
  loft: { label: '圆形截面放样曲面', prompt: '按下方明确的三个圆形截面生成曲面实体', spec: { units: 'mm', operations: [{ type: 'loft', mode: 'add', position: [0,0,0], sections: [
    { z: 0, diameter: 40, center: [0,0] }, { z: 30, diameter: 20, center: [5,0] }, { z: 60, diameter: 30, center: [0,0] },
  ] }] } },
  assembly: { label: '底座与球体静态装配', prompt: '按下方坐标装配底座与球体，不自动改变位置', spec: { units: 'mm', parts: [
    { name: '底座', operations: [{ type: 'box', mode: 'add', length: 60, width: 40, height: 10, position: [0,0,0] }] },
    { name: '球体', operations: [{ type: 'sphere', mode: 'add', diameter: 20, position: [30,20,20] }] },
  ] } },
};

export default function ProductionCadWorkspace() {
  const [saved] = useState(() => readFreeCadSession(storage()));
  const [prompt, setPrompt] = useState(saved?.draft_prompt || "");
  const [specText, setSpecText] = useState(saved?.draft_spec || ''), [confirmed, setConfirmed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(saved?.draft_spec));
  const [run, setRun] = useState(saved?.run_id ? { run_id: saved.run_id, prompt: saved.prompt, status: "restoring", calls: [] } : null);
  const [health, setHealth] = useState(null), [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pollEpoch, setPollEpoch] = useState(0);
  const session = useRef(saved), submitting = useRef(false), readVersion = useRef(0);
  const pending = run?.status === "running" || run?.status === "restoring";
  const unknown = run?.status === "outcome_unknown";
  const connected = health?.connected === true;
  const supported = (health?.tools || []).some((tool) => tool.name === "execute_code");
  const artifacts = freeCadArtifacts(run), stl = artifacts.find((item) => item.format === "stl");

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
    if (spec) setAdvancedOpen(true);
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

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || busy || pending || unknown || !connected || !supported || !prompt.trim() || (specText.trim() && !confirmed)) return;
    submitting.current = true; setBusy("submit"); setError(""); ++readVersion.current;
    let nextSession;
    try {
      let spec;
      if (specText.trim()) {
        try { spec = JSON.parse(specText); } catch { throw new Error('结构化参数不是有效 JSON，请检查后重新核对。'); }
        if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('结构化参数必须是完整的 JSON 对象。');
      }
      const command_id = crypto.randomUUID(), run_id = await freeCadRunId(command_id);
      // 请求发出前保存确定性编号；丢失响应后只回查，不自动重放建模。
      nextSession = { command_id, run_id, prompt, draft_prompt: prompt, draft_spec: specText };
      session.current = nextSession; saveFreeCadSession(storage(), nextSession);
      setRun({ run_id, prompt, status: "submitting", calls: [] });
      const record = await freeCadRequest("/runs", { method: "POST", body: { prompt, command_id, ...(spec ? { spec } : {}) } });
      if (!validFreeCadRun(record?.run_id) || (!terminal.has(record.status) && record.status !== "running")) throw Object.assign(new Error("未收到有效运行记录，请刷新状态核对。"), { outcomeUnknown: true });
      session.current = { ...nextSession, run_id: record.run_id }; saveFreeCadSession(storage(), session.current);
      setRun({ ...record, prompt: record.prompt ?? prompt });
    } catch (failure) {
      setError(failure.message);
      if (nextSession) setRun({ run_id: nextSession.run_id, prompt: nextSession.prompt, status: failure.outcomeUnknown ? "outcome_unknown" : "failed", error: failure.message, calls: [] });
    } finally { submitting.current = false; setBusy(""); }
  }

  function startNew() {
    ++readVersion.current; setRun(null); setError("");
    session.current = { prompt: "", command_id: "", draft_prompt: prompt, draft_spec: specText };
    saveFreeCadSession(storage(), session.current);
  }

  const locked = Boolean(busy) || pending || unknown;
  return <section className="production-cad">
    <header><span className="cad-eyebrow">CAD Agent · Local FreeCAD</span><h1>FreeCAD 本地建模</h1><p>描述零件和尺寸，通过本地 FreeCAD 生成实体，交互查看并下载模型。</p></header>
    <section className="cad-card" aria-labelledby="freecad-connection-title">
      <div className="cad-card-heading"><h2 id="freecad-connection-title">FreeCAD MCP 连接</h2><span className={`cad-badge ${connected ? "connected" : "disconnected"}`} role="status">{health === null ? "正在检查连接…" : connected ? "已连接 · 本地 FreeCAD" : "未连接"}</span></div>
      {health?.error && <p className="cad-connection-error">{String(health.error)}</p>}
      <div className="cad-actions"><button type="button" disabled={Boolean(busy)} onClick={refresh}>{busy === "refresh" ? "正在刷新…" : "刷新状态"}</button><span className="cad-storage-note">刷新只查询连接和本次运行记录。</span></div>
      {connected && <details className="cad-connection-details"><summary>可用工具 · {health.tools?.length || 0} 个</summary><ul>{(health.tools || []).map((tool) => <li key={tool.name}><strong>{tool.name}</strong>{tool.description && <p>{tool.description}</p>}</li>)}</ul></details>}
      {connected && !supported && <p className="cad-connection-error">当前工具列表缺少 execute_code，暂不能生成模型。</p>}
    </section>
    {error && <div className="cad-alert" role="alert">{error}</div>}
    <section className="cad-card">
      <h2>建模需求</h2>
      <p className="cad-input-flow">输入需求 → model_3d 节点 → production_modeling_skill → freecad_mcp → 本地 FreeCAD → 实体校验与预览</p>
      <form onSubmit={submit}>
        <label htmlFor="freecad-prompt">描述零件、尺寸和设计要求</label>
        <textarea id="freecad-prompt" rows={5} maxLength={10000} value={prompt} onChange={(event) => editPrompt(event.target.value)} disabled={locked} placeholder="例如：外径30mm、长50mm的销轴，带同轴通孔直径10mm" />
        <label htmlFor="advanced-example">高级建模示例</label>
        <select id="advanced-example" defaultValue="" disabled={locked} onChange={(event) => { const sample = advancedExamples[event.target.value]; if (sample) chooseExample(sample.prompt, sample.spec ? JSON.stringify(sample.spec, null, 2) : ''); }}>
          <option value="">选择形体或特征示例（只填入，不自动执行）</option>{Object.entries(advancedExamples).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
        <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
          <summary>高级结构化参数 · 曲面 / 装配 / 精确边选择</summary>
          <p>JSON 优先于上方文字，用于明确每个操作、截面、边或零件的位置。示例尺寸只是示例；请修改并人工核对。清空 JSON 可回到文字建模。</p>
          <label htmlFor="freecad-spec">结构化参数（JSON，优先于文字描述）</label>
          <textarea id="freecad-spec" rows={12} maxLength={30000} value={specText} disabled={locked} onChange={(event) => editSpec(event.target.value)} placeholder='{"units":"mm","operations":[...]}' />
          <label><input type="checkbox" checked={confirmed} disabled={locked || !specText.trim()} onChange={(event) => setConfirmed(event.target.checked)} />我已核对以上结构化参数</label>
        </details>
        <div className="cad-actions"><button type="submit" className="cad-primary" disabled={!connected || !supported || locked || !prompt.trim() || Boolean(specText.trim() && !confirmed)}>{busy === "submit" ? "正在提交…" : pending ? "FreeCAD 正在建模…" : "生成 3D 模型"}</button><button type="button" disabled={locked} onClick={() => chooseExample("外径30mm、长50mm的销轴，带同轴通孔直径10mm")}>填入带通孔销轴示例</button><button type="button" disabled={locked} onClick={() => chooseExample("正四面体（立体三角形、四面相同、边长100mm）")}>填入正四面体示例</button><span className="cad-save-note">请明确形状、尺寸与单位；缺少必要参数时会提示补充。</span></div>
        <p className="cad-storage-note">模型由本地 FreeCAD 生成。刷新页面可继续查询本轮结果，未提交草稿保存在当前浏览器会话。</p>
        <p className="cad-review-note">支持圆柱、长方体、正四面体、球体、圆锥/圆台、标准渐开线外直齿轮、明确牙型的外螺纹、圆角/倒角、圆形截面放样曲面及静态多零件装配。放样和装配请使用结构化参数；不是任意自由曲面、运动仿真或标准螺纹验收。下载 FCStd 后可在 FreeCAD 中人工核对、修改；也可修改需求后生成新版本。设计生成不等于生产放行，不会启动机器。</p>
      </form>
    </section>
    {!run && <section className="cad-card cad-preview-empty"><h2>三维模型</h2><p>尚未生成模型。填写需求后，生成的 STL 将在这里显示，支持旋转、缩放和平移。</p></section>}
    {run && <section className="cad-card" aria-labelledby="freecad-result-title">
      <div className="cad-card-heading"><h2 id="freecad-result-title">FreeCAD 建模结果</h2><span className={`cad-badge ${run.status}`} role="status">{freeCadStatus(run.status)}</span></div>
      <p className="cad-identifier">运行编号：{run.run_id}</p>
      <div className="cad-submitted-input"><h3>本轮已提交的需求</h3><p className="cad-submitted-prompt">{run.prompt}</p></div>
      {run.spec && <details><summary>本轮实际建模参数（只读）</summary><pre>{JSON.stringify(run.spec, null, 2)}</pre></details>}
      {pending && <p role="status">正在等待 FreeCAD 实际执行结果。可以稍后回到此页继续查询。</p>}
      {unknown && <div className="cad-alert"><p>尚未确认本次执行结果。请先刷新查询；如已在本地 FreeCAD 核对，可开始新需求。</p><button type="button" disabled={Boolean(busy)} onClick={startNew}>已核对，开始新需求</button></div>}
      {run.error && <p className="cad-run-error" role="alert">{String(run.error)}</p>}
      {run.answer && <p className="cad-result-text">{run.answer}</p>}
      {stl ? <>
        <div className="cad-validation"><span>实体校验通过 · {run.validation.solid_count} 个实体</span>{Number.isInteger(run.validation.face_count) && Number.isInteger(run.validation.edge_count) && <span>拓扑校验 {run.validation.face_count} 个面 · {run.validation.edge_count} 条边</span>}{Array.isArray(run.validation.bounds_mm) && <span>包围尺寸 {run.validation.bounds_mm.map((value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })).join(" × ")} mm</span>}{Number.isFinite(run.validation.volume_mm3) && <span>体积 {run.validation.volume_mm3.toLocaleString(undefined, { maximumFractionDigits: 3 })} mm³</span>}</div>
        {run.validation.model_kind === 'assembly' && <p>静态装配 · {run.validation.component_count} 个零件 · 干涉检查通过：{run.validation.components.map((p) => p.name).join('、')}</p>}
        <Suspense fallback={<p role="status">正在加载三维查看器…</p>}><FreeCadModelViewer key={stl.url} url={stl.url} /></Suspense>
        <div className="cad-downloads" aria-label="模型导出">{artifacts.map((item) => <a key={item.format} href={item.url} download={item.name}>下载 {item.format === "fcstd" ? "FCStd" : item.format.toUpperCase()}</a>)}</div>
      </> : terminal.has(run.status) && <p className="cad-no-model">本轮没有可展示的 STL 模型。{run.status === "needs_input" ? "请补充上方所需参数后再次生成。" : "请查看执行结果和实际工具调用。"}</p>}
      {run.execution && <details className="cad-execution-details"><summary>执行路径</summary><p>{run.execution.agent} → {run.execution.node} → {run.execution.skill} → {run.execution.tool}</p></details>}
      {!!run.calls?.length && <details className="cad-call-details"><summary>实际工具调用 · {run.calls.length} 次</summary><ol>{run.calls.map((call, index) => <li key={index}><details><summary>{index + 1}. {call.tool}{call.error || call.result?.isError ? " · 失败" : ""}</summary><h3>参数</h3><pre>{JSON.stringify(call.arguments, null, 2)}</pre><h3>{call.error ? "调用错误" : "工具返回"}</h3><pre>{JSON.stringify(call.error ? { error: call.error, result: call.result } : call.result, null, 2)}</pre></details></li>)}</ol></details>}
    </section>}
  </section>;
}
