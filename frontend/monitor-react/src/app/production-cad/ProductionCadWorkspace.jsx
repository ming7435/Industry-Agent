import React, { useEffect, useRef, useState } from "react";
import CadSolidPreview from "./CadSolidPreview.jsx";
import { buildCadPayload, cadFileUrl, cadPending, cadRequest, cadStatus, canConfirmCad, createCadCommandState, fileBase64, validateCadUpload } from "./productionCad.mjs";
import "./productionCad.css";

const emptyForm = { name: "", prompt: "", material: "", technicalRequirements: "", parameters: "", dxfDepth: "", dxfUnits: "" };
const example = { ...emptyForm, name: "带通孔销轴", material: "C45", prompt: "外径30mm、长50mm、中心通孔直径10mm的销轴", parameters: JSON.stringify({ units: "mm", operations: [{ type: "cylinder", diameter: 30, length: 50 }, { type: "cylinder", diameter: 10, length: 50, mode: "cut" }] }, null, 2) };
const toolLabels = { cad_input: "接收设计输入", cad_analyze: "CAD Agent 解析需求 / 图纸", cad_kernel: "CAD 内核实体建模与校验", cad_export: "导出工程文件", cad_modeling: "建模执行结果" };

export default function ProductionCadWorkspace() {
  const [form, setForm] = useState(emptyForm), [file, setFile] = useState(null);
  const [tasks, setTasks] = useState([]), [task, setTask] = useState(null), [health, setHealth] = useState(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [revision, setRevision] = useState("");
  const command = useRef(createCadCommandState()), fileInput = useRef(null);
  const [revisionSource, setRevisionSource] = useState(""), [requireParameterCheck, setRequireParameterCheck] = useState(false), [parameterChecked, setParameterChecked] = useState(false), [replaceSource, setReplaceSource] = useState(false);
  const update = (name) => (event) => setForm((value) => ({ ...value, [name]: event.target.value }));
  const refresh = async (signal) => { const value = await cadRequest("/api/cad/designs", { signal }); setTasks(value.items || []); };
  useEffect(() => {
    const abort = new AbortController();
    Promise.all([refresh(abort.signal), cadRequest("/api/cad/designs/status", { signal: abort.signal }).then(setHealth)]).catch((failure) => { if (!abort.signal.aborted) setError(failure.message); });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (!task || !cadPending(task.status)) return undefined;
    const abort = new AbortController();
    let timer;
    const poll = async () => {
      try {
        const next = await cadRequest(`/api/cad/designs/${task.design_id}`, { signal: abort.signal });
        setTask(next);
        if (cadPending(next.status)) timer = window.setTimeout(poll, 1000);
        else await refresh(abort.signal);
      } catch (failure) { if (!abort.signal.aborted) setError(failure.message); }
    };
    timer = window.setTimeout(poll, 800);
    return () => { abort.abort(); window.clearTimeout(timer); };
  }, [task?.design_id, task?.status]);

  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const payload = buildCadPayload(form);
      if (requireParameterCheck && !parameterChecked) throw new Error("请先核对提取参数，并勾选尺寸及特征确认");
      if (!payload.spec && !payload.prompt && !file) throw new Error("请输入完整零件需求，或上传对应图纸");
      let path = revision ? `/api/cad/designs/${revision}/revisions` : "/api/cad/designs";
      if (revision) {
        payload.replace_source_geometry = replaceSource;
        if (revisionSource && /\.dxf$/i.test(revisionSource) && !replaceSource) {
          if (!form.dxfDepth || !form.dxfUnits) throw new Error("请为继承的 DXF 轮廓填写深度和单位");
          payload.dxf_depth = Number(form.dxfDepth); payload.dxf_units = form.dxfUnits;
        }
      }
      if (file) {
        const issue = validateCadUpload(file); if (issue) throw new Error(issue);
        if (revision) throw new Error("上传图纸请创建独立任务；修改当前版本请填写完整结构化参数");
        payload.filename = file.name; payload.content_base64 = await fileBase64(file);
        if (/\.dxf$/i.test(file.name)) {
          if (!form.dxfDepth || !form.dxfUnits) throw new Error("二维 DXF 必须填写拉伸深度并选择图纸单位");
          payload.dxf_depth = Number(form.dxfDepth); payload.dxf_units = form.dxfUnits;
        }
        path += "/import";
      }
      const result = await cadRequest(path, { method: "POST", body: payload, key: command.current.keyFor(path, payload) });
      setTask(result); setRevision(""); setRevisionSource(""); setRequireParameterCheck(false); await refresh();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }

  async function select(identifier) {
    setError(""); setBusy(true);
    try { setTask(await cadRequest(`/api/cad/designs/${identifier}`)); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function confirm() {
    setError(""); setBusy(true);
    try { setTask(await cadRequest(`/api/cad/designs/${task.design_id}/confirm`, { method: "POST", body: { digest: task.digest } })); await refresh(); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  function revise() {
    const input = task.request;
    setRevision(task.design_id); setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    setRevisionSource(input.filename || ""); setRequireParameterCheck(Boolean(task.suggested_spec)); setParameterChecked(false); setReplaceSource(false);
    setForm({ ...emptyForm, name: task.name, prompt: input.prompt || "", material: task.material || "", technicalRequirements: task.technical_requirements || "", parameters: task.suggested_spec || task.resolved_spec ? JSON.stringify(task.suggested_spec || task.resolved_spec, null, 2) : "", dxfDepth: input.dxf_depth == null ? "" : String(input.dxf_depth), dxfUnits: input.dxf_units || "" });
    document.getElementById("cad-design-form")?.scrollIntoView({ behavior: "smooth" });
  }
  const stl = task?.artifacts?.find((item) => item.format === "stl");
  return <section className="production-cad">
    <header><span className="cad-eyebrow">CAD Agent · 生产准备</span><h1>生产前零件建模</h1><p>按需求或对应图纸生成真实三维实体，校验后查看、下载并确认设计版本。</p></header>
    <div className="cad-boundary"><strong>当前范围：设计文件与加工准备。</strong> 已接入实体建模；未接入刀路、机床后处理和机器生产下发。设计确认不等于允许机器启动。</div>
    {error && <div className="cad-alert" role="alert">{error}</div>}
    <section className="cad-card" id="cad-design-form"><h2>{revision ? "修改设计 · 创建新版本" : "零件需求与图纸"}</h2>
      <p>{health ? health.ready ? `CAD 内核已就绪：${health.engine || "CadQuery"}` : "CAD 内核未就绪，请安装独立建模依赖后重试" : "正在检查 CAD 内核…"}</p>
      {revision && <p>父版本：{revision}。提交后新版本需要重新确认。<button type="button" onClick={() => setRevision("")}>取消版本关联</button></p>}
      <form onSubmit={submit}>
        <label>零件名称<input maxLength={100} value={form.name} onChange={update("name")} placeholder="例如：带通孔销轴" /></label>
        <label>零件需求<textarea maxLength={10000} rows={4} value={form.prompt} onChange={update("prompt")} placeholder="说明形状、单位、尺寸和所有孔槽。简单圆柱可直接填写：直径30mm、长度50mm的圆柱。复杂需求经过现有模型服务解析。" /></label>
        <label>材料<input maxLength={100} value={form.material} onChange={update("material")} placeholder="填写实际选用材料，不自动推测" /></label>
        <label>技术要求<textarea maxLength={4000} rows={3} value={form.technicalRequirements} onChange={update("technicalRequirements")} placeholder="公差、表面粗糙度、热处理等；未填写时不声称加工要求完整" /></label>
        <label>上传对应图纸<input ref={fileInput} type="file" accept=".step,.stp,.dxf,.pdf,.png,.jpg,.jpeg" disabled={Boolean(revision)} onChange={(event) => { setFile(event.target.files[0] || null); setError(""); }} /></label>
        <p>STEP 导入真实实体；DXF 需要闭合轮廓、拉伸深度与单位；PDF/图片需要明确标注尺寸。每份不超过 8 MB。</p>
        {file && <p>已选择：<strong>{file.name}</strong><button type="button" onClick={() => { setFile(null); fileInput.current.value = ""; }}>取消文件</button></p>}
        {revisionSource && <p>新版本继承原图：<strong>{revisionSource}</strong>，不会丢弃原图或已有需求。</p>}
        {/\.dxf$/i.test(file?.name || revisionSource) && <><label>DXF 拉伸深度<input type="number" min="0.001" max="10000" step="any" value={form.dxfDepth} onChange={update("dxfDepth")} /></label><label>DXF 单位<select value={form.dxfUnits} onChange={update("dxfUnits")}><option value="">请选择</option><option value="mm">毫米</option><option value="cm">厘米</option><option value="inch">英寸</option></select></label></>}
        <details open={Boolean(form.parameters)}><summary>结构化参数（精确尺寸 / 复杂特征）</summary><p>支持圆柱、方块、轮廓拉伸、旋转体、布尔加减、圆角和倒角。未知特征或缺少尺寸不会替换成默认模型。</p><label>参数 JSON<textarea className="cad-json" rows={10} value={form.parameters} onChange={update("parameters")} placeholder={'{"units":"mm","operations":[{"type":"cylinder","diameter":30,"length":50}]}'} /></label></details>
        {requireParameterCheck && <label className="cad-check"><input type="checkbox" checked={parameterChecked} onChange={(event) => setParameterChecked(event.target.checked)} /> 我已核对并补全全部尺寸、单位和特征，按这些参数生成实体</label>}
        {revisionSource && /\.(step|stp|dxf)$/i.test(revisionSource) && form.parameters && <label className="cad-check"><input type="checkbox" checked={replaceSource} onChange={(event) => setReplaceSource(event.target.checked)} /> 使用完整参数替换原图几何（保留父任务资料，不与原实体叠加）</label>}
        <div className="cad-actions"><button type="submit" className="cad-primary" disabled={busy}>{busy ? "正在提交…" : revision ? "生成新版本" : "提交 CAD 建模"}</button><button type="button" disabled={busy} onClick={() => { setForm(example); setFile(null); setRevision(""); setRevisionSource(""); setRequireParameterCheck(false); command.current.reset(); if (fileInput.current) fileInput.current.value = ""; }}>填写带孔销轴示例</button><button type="button" disabled={busy} onClick={() => { setForm(emptyForm); setFile(null); setRevision(""); setRevisionSource(""); setRequireParameterCheck(false); command.current.reset(); if (fileInput.current) fileInput.current.value = ""; }}>新建任务</button></div>
      </form>
    </section>
    <section className="cad-card"><div className="cad-card-heading"><h2>建模任务</h2><button type="button" onClick={() => refresh().catch((failure) => setError(failure.message))}>刷新任务</button></div>
      {!tasks.length && <p>暂无建模任务。提交需求后，每个任务保留自己的输入、实体文件和执行明细。</p>}
      <div className="cad-task-list">{tasks.map((item) => <button key={item.design_id} type="button" disabled={busy} className={task?.design_id === item.design_id ? "is-selected" : ""} onClick={() => select(item.design_id)}><strong>{item.name}</strong><span className={`cad-badge ${item.status}`}>{cadStatus(item.status)}</span><small>{item.design_id} · {new Date(item.created_at).toLocaleString()}</small></button>)}</div>
    </section>
    {task && <section className="cad-card cad-task-detail"><div className="cad-card-heading"><h2>{task.name}</h2><span className={`cad-badge ${task.status}`}>{cadStatus(task.status)}</span></div><p className="cad-identifier">{task.design_id}{task.parent_id && ` · 父版本 ${task.parent_id}`}</p><p role="status">{task.message}</p>
      {!!task.missing_information?.length && <div className="cad-alert"><strong>需要补充以下信息</strong><ul>{task.missing_information.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      {task.suggested_spec && <div className="cad-alert"><strong>模型提取参数 · 尚未核实</strong><p>以下只是待核对参数，尚未建立实体或开放下载。点击“补充需求”后核对全部尺寸，不完整的参数需要补齐。</p><pre>{JSON.stringify(task.suggested_spec, null, 2)}</pre></div>}
      {stl && <><h3>真实实体预览</h3><p>拖动旋转、滚轮缩放。预览读取此任务生成的 STL；不是前端虚构模型。</p><CadSolidPreview artifact={stl} />
        <h3>实体校验</h3><dl className="cad-properties"><div><dt>单位</dt><dd>mm</dd></div><div><dt>连续实体</dt><dd>{task.geometry.solid_count} 个</dd></div><div><dt>包络尺寸 X / Y / Z</dt><dd>{task.geometry.bounds_mm.map((n) => Number(n.toFixed(4))).join(" / ")} mm</dd></div><div><dt>实体体积</dt><dd>{task.geometry.volume_mm3.toFixed(3)} mm³</dd></div><div><dt>STEP 回读</dt><dd>{task.geometry.step_roundtrip_valid ? "通过" : "未通过"}</dd></div></dl>
        <h3>工程视图</h3><div className="cad-projections">{task.artifacts.filter((item) => ["svg", "top", "side"].includes(item.format)).map((item) => <figure key={item.artifact_id}><figcaption>{item.label}</figcaption><img src={cadFileUrl(item.url)} alt={item.label} /></figure>)}</div>
        <h3>工程文件</h3><p>PDF 为中文三视图及参数表；DXF 为实体中截面，不是已经完成尺寸标注的机床加工图。</p><div className="cad-downloads">{task.artifacts.map((item) => <div key={item.artifact_id}><strong>{item.label}</strong><small>{(item.size / 1024).toFixed(1)} KB</small>{["pdf", "svg", "top", "side", "json"].includes(item.format) && <a href={cadFileUrl(item.url)} target="_blank" rel="noreferrer">打开</a>}<a href={cadFileUrl(item.url, true)} download={item.filename}>下载</a></div>)}</div>
        {!!task.manufacturing_missing?.length && <div className="cad-boundary">加工准备尚缺：{task.manufacturing_missing.join("、")}。当前仅完成几何建模，未进入机器生产。</div>}
        <div className="cad-actions"><button className="cad-primary" type="button" disabled={busy || !canConfirmCad(task)} onClick={confirm}>{task.status === "confirmed" ? "此版本已确认" : "确认当前设计版本"}</button><button type="button" disabled={busy} onClick={revise}>修改参数并建立新版本</button></div></>}
      {!stl && !cadPending(task.status) && <button type="button" disabled={busy} onClick={revise}>补充需求并建立新版本</button>}
      <h3>此任务的 CAD Agent 执行明细</h3><p>每一步展示实际工具输入和返回；文件内容仅记录摘要，避免把整份图纸重复写入日志。</p>
      <ol className="cad-events">{task.events.map((event, index) => <li key={index}><details><summary>{index + 1}. {toolLabels[event.tool] || event.tool} · {event.status === "failed" ? "失败" : "完成"}</summary><p>Agent：{event.agent} · 工具：{event.tool} · {new Date(event.timestamp).toLocaleString()}</p><h4>输入 / 上下文</h4><pre>{JSON.stringify(event.input, null, 2)}</pre><h4>返回体</h4><pre>{JSON.stringify(event.output, null, 2)}</pre>{event.error && <p role="alert">{event.error}</p>}</details></li>)}</ol>
    </section>}
  </section>;
}
