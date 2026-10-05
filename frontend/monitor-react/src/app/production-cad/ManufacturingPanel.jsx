import React, { useEffect, useRef, useState } from "react";
import { buildManufacturingPayload, cadRequest, canDispatchManufacturing, createCadCommandState, manufacturingFileUrl, manufacturingStatus, shouldRenewManufacturingConfirmation, mergeManufacturingProgress } from "./productionCad.mjs";

const fields = [
  ["stock_diameter_mm", "毛坯直径（mm）"], ["stock_length_mm", "毛坯总长度（mm）"],
  ["grip_length_mm", "独立夹持长度（mm）"], ["clearance_mm", "前端退刀距离（mm）"],
  ["pass_depth_mm", "每刀径向切深（mm）"], ["spindle_rpm", "明确主轴转速（rpm）"],
  ["feed_mm_per_rev", "每转进给（mm/rev）"], ["tolerance_mm", "尺寸公差（mm）"],
  ["tool_id", "外圆刀具号（1–99）"], ["drill_tool_id", "钻具号（通孔必填，实心留空）"],
  ["drill_diameter_mm", "钻头直径（mm，必须匹配通孔）"],
];
const empty = Object.fromEntries(fields.map(([key]) => [key, ""]));
const labels = { geometry_volume_matches: "真实实体体积匹配", geometry_bounds_match: "真实实体尺寸匹配", finite_coordinates: "坐标有效", bounded_point_count: "刀路点数受限", pass_depth_within_setup: "切深符合填写参数", grip_outside_cutting_zone: "加工区与夹持区分离", retract_in_removed_material_or_front_clearance: "退刀位于已去除材料或前端间隙", virtual_dimensions_within_input_tolerance: "虚拟尺寸符合填写公差" };

function ToolpathPreview({ program, job }) {
  const points = program.toolpath;
  const { stock_diameter_mm: diameter, clearance_mm: clearance } = program.setup;
  const { length_mm: length, outer_diameter_mm: outer, inner_diameter_mm: inner } = program.profile;
  const scale = Math.min(620 / (length + 2 * clearance), 200 / (diameter / 2 + clearance));
  const x = (z) => 680 + z * scale, y = (d) => 260 - d / 2 * scale;
  return <figure className="cad-toolpath"><figcaption>实际刀路 · X 为直径坐标，Z=0 为前端</figcaption>
    <svg viewBox="0 0 780 310" role="img" aria-label="加工程序的外圆与通孔实际刀路">
      <rect x={x(-length)} y={y(diameter)} width={length * scale} height={diameter / 2 * scale} fill="#edf2f1" stroke="#bdcecb" />
      <rect x={x(-length)} y={y(outer)} width={length * scale} height={(outer - inner) / 2 * scale} fill="#a0d8cb" opacity=".5" />
      <path d="M40 260 H730" stroke="#b2c2c7" />
      {points.slice(1).map((point, index) => <line key={index} x1={x(points[index].z_mm)} y1={y(points[index].x_mm)} x2={x(point.z_mm)} y2={y(point.x_mm)} stroke={point.motion === "cut" ? "#087f73" : "#869eaa"} strokeWidth="1.7" strokeDasharray={point.motion === "rapid" ? "4 4" : undefined} />)}
      {job?.position && <circle cx={x(job.position.z_mm)} cy={y(job.position.x_mm)} r="5" fill="#e68b27" />}
      <text x={x(-length)} y="285" fill="#47646b">Z=-{length} mm</text><text x="680" y="285" fill="#47646b">Z=0</text>
    </svg><p>绿色实线：切削；灰色虚线：快移；橙点：工厂返回的当前刀位。仅验证加工区域，不包含切断、取件或完整刀具碰撞检测。</p>
  </figure>;
}

export default function ManufacturingPanel({ design }) {
  const [form, setForm] = useState(empty), [items, setItems] = useState([]), [record, setRecord] = useState(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [checked, setChecked] = useState(false);
  const prepareCommand = useRef(createCadCommandState()), dispatchCommand = useRef(createCadCommandState());
  const base = `/api/cad/designs/${design.design_id}/manufacturing`;
  const applyQueriedRecord = (value) => {
    if (shouldRenewManufacturingConfirmation(record?.status, value.status)) {
      dispatchCommand.current.reset(); setChecked(false);
    }
    setRecord(value);
    setItems((values) => mergeManufacturingProgress(values, value));
  };
  const refresh = async (signal) => { const value = await cadRequest(base, { signal }); setItems(value.items || []); return value.items || []; };
  useEffect(() => {
    const abort = new AbortController();
    refresh(abort.signal).then((values) => { if (!abort.signal.aborted) setRecord(values[0] || null); }).catch((failure) => { if (!abort.signal.aborted) setError(failure.message); });
    return () => abort.abort();
  }, [design.design_id]);
  useEffect(() => {
    if (!record || !["running", "paused", "interrupted", "received", "uncertain", "submitting", "rejected"].includes(record.status)) return undefined;
    const abort = new AbortController();
    let timer;
    const poll = async () => {
      try {
        const value = await cadRequest(`${base}/${record.program_id}/production`, { signal: abort.signal });
        if (!abort.signal.aborted) { applyQueriedRecord(value); timer = window.setTimeout(poll, 3000); }
      } catch (failure) { if (!abort.signal.aborted) { setError(failure.message); timer = window.setTimeout(poll, 5000); } }
    };
    timer = window.setTimeout(poll, 1000);
    return () => { abort.abort(); window.clearTimeout(timer); };
  }, [record?.program_id, record?.status, design.design_id]);

  async function prepare(event) {
    event.preventDefault(); setError(""); setBusy(true); setChecked(false);
    try {
      const payload = buildManufacturingPayload(form, design.digest);
      const result = await cadRequest(base, { method: "POST", body: payload, key: prepareCommand.current.keyFor(base, payload) });
      setRecord(result); dispatchCommand.current.reset(); await refresh();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function dispatch() {
    setError(""); setBusy(true);
    const path = `${base}/${record.program_id}/dispatch`;
    const payload = { digest: record.digest, acknowledge_simulation_only: checked };
    const key = dispatchCommand.current.keyFor(path, payload);
    setRecord((value) => ({ ...value, status: "submitting" }));
    try {
      const result = await cadRequest(path, { method: "POST", body: payload, key });
      setRecord(result); setChecked(false); await refresh();
      // 只有得到明确非不确定结果后，新一轮人工确认才使用新命令。
      if (!["uncertain", "submitting"].includes(result.status)) dispatchCommand.current.reset();
    } catch (failure) {
      setError(failure.message); setRecord((value) => ({ ...value, status: "uncertain", message: "请求未确认，正在只读查询状态，不重新发送生产命令" }));
    } finally { setBusy(false); }
  }
  async function select(value) {
    setRecord(value); setChecked(false); dispatchCommand.current.reset(); setError(""); setBusy(true);
    try { applyQueriedRecord(await cadRequest(`${base}/${value.program_id}/production`)); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function query() {
    setError("");
    try { const value = await cadRequest(`${base}/${record.program_id}/production`); applyQueriedRecord(value); await refresh(); }
    catch (failure) { setError(failure.message); }
  }
  return <section className="cad-manufacturing">
    <h3>加工准备 → 虚拟工厂生产</h3>
    <div className="cad-boundary"><strong>设计版本已确认，生产仍需单独确认。</strong> 当前支持 Z 轴圆柱和同轴通孔套筒。固定后处理器为 virtual-trak-turning-v1，只用于本机虚拟工厂，不是 TRAK 真实控制器程序。</div>
    <p>材料：<strong>{design.material || "未填写"}</strong>。技术要求：{design.technical_requirements || "未填写，需建立完整新版本"}。转速、进给、切深及公差由你明确填写，系统不推测工业加工阈值。</p>
    {error && <div className="cad-alert" role="alert">{error}</div>}
    <form onSubmit={prepare}><fieldset disabled={busy}><legend>工艺参数（全部采用毫米）</legend>
      {fields.map(([key, label]) => <label key={key}>{label}<input type="number" min="0.000001" step={key.endsWith("tool_id") ? "1" : "any"} value={form[key]} onChange={(event) => { setForm((value) => ({ ...value, [key]: event.target.value })); setChecked(false); }} /></label>)}
      <p>毛坯总长度必须覆盖零件长度加夹持长度；钻头必须匹配已确认孔径。计算资源限制不等于真实机床安全范围。</p>
      <button className="cad-primary" type="submit">{busy ? "处理中…" : "生成刀路、校验与虚拟 NC"}</button>
    </fieldset></form>
    {!!items.length && <><h3>当前设计的加工包</h3><div className="cad-task-list">{items.map((item) => <button key={item.program_id} disabled={busy} className={record?.program_id === item.program_id ? "is-selected" : ""} onClick={() => select(item)}><strong>{item.program_id}</strong><span>{manufacturingStatus(item.status)}</span><small>{new Date(item.created_at).toLocaleString()}</small></button>)}</div></>}
    {record && <><h3>{manufacturingStatus(record.status)}</h3><p role="status">{record.message}</p>{record.state_query_error && <div className="cad-alert">{record.state_query_error}</div>}
      <p>加工包：{record.program_id}<br />绑定设计：{record.program.design_id}<br />程序摘要：<span className="cad-identifier">{record.digest}</span></p>
      <ToolpathPreview program={record.program} job={record.job} />
      <h4>刀路校验结果</h4><dl className="cad-properties"><div><dt>虚拟加工区域体积 / CAD 实体体积</dt><dd>{record.program.simulation.simulated_volume_mm3.toFixed(3)} / {record.program.simulation.expected_volume_mm3.toFixed(3)} mm³</dd></div><div><dt>由刀路、转速及进给计算的时长</dt><dd>{record.program.simulation.duration_seconds.toFixed(2)} 秒（快移为固定虚拟速度）</dd></div>
        {Object.entries(record.program.simulation.checks).map(([key, value]) => <div key={key}><dt>{labels[key] || key}</dt><dd>{value === true ? "通过" : "未通过"}</dd></div>)}</dl>
      <h4>加工文件 · 可打开与下载</h4><div className="cad-downloads">{[["nc", "虚拟 NC 程序"], ["toolpath", "实际刀路 JSON"], ["package", "完整加工包 JSON"]].map(([kind, label]) => <div key={kind}><strong>{label}</strong><a href={manufacturingFileUrl(design.design_id, record.program_id, kind)} target="_blank" rel="noreferrer">打开</a><a href={manufacturingFileUrl(design.design_id, record.program_id, kind, true)} download>下载</a></div>)}</div>
      <details className="cad-nc"><summary>查看实际 NC 正文</summary><pre>{record.program.nc_program}</pre></details>
      {record.job && <><h4>虚拟工厂执行反馈</h4><p>任务：{record.job.job_id} · {manufacturingStatus(record.job.status)}</p><progress max="1" value={record.job.progress || 0} /><p>进度：{((record.job.progress || 0) * 100).toFixed(1)}% · 执行 {record.job.executed_points || 0} 个刀位 · 已运行 {(record.job.elapsed_seconds || 0).toFixed(2)} 秒</p>
        {record.job.simulated_volume_mm3 != null && <p>工厂计算的当前材料体积：{record.job.simulated_volume_mm3.toFixed(3)} mm³</p>}
        {record.job.result_profile && <p>工厂计算的终态尺寸：外径 {record.job.result_profile.outer_diameter_mm} mm · 内径 {record.job.result_profile.inner_diameter_mm} mm · 长度 {record.job.result_profile.length_mm} mm。虚拟加工完成不等于质量放行。</p>}
        <details><summary>工厂事件记录（实际接收 / 启动 / 暂停 / 完成）</summary><pre>{JSON.stringify(record.job.events, null, 2)}</pre></details></>}
      <label className="cad-check"><input type="checkbox" checked={checked} disabled={busy || ["running", "completed", "uncertain", "submitting"].includes(record.status)} onChange={(event) => setChecked(event.target.checked)} /> 我已核对该加工包，确认仅在虚拟工厂执行；这不是启动真实机器的授权</label>
      <div className="cad-actions"><button type="button" className="cad-primary" disabled={busy || !canDispatchManufacturing(record, checked)} onClick={dispatch}>{["paused", "interrupted", "received"].includes(record.status) ? "人工确认后继续虚拟加工" : "确认并下发虚拟生产"}</button><button type="button" disabled={busy} onClick={query}>查询生产状态（不发送控制）</button></div>
      <p>有设备故障或产线未就绪时，工厂拒绝启动；运行中故障会暂停此任务。维修后的生产线重启仍走已有工单人员确认流程，此处不替代或绕过该流程。</p>
      <details><summary>本加工包的工具输入与输出</summary>{record.events.map((event, index) => <div key={index}><h4>{index + 1}. {event.tool} · {new Date(event.timestamp).toLocaleString()}</h4><p>输入 / 上下文</p><pre>{JSON.stringify(event.input, null, 2)}</pre><p>返回体</p><pre>{JSON.stringify(event.output, null, 2)}</pre></div>)}</details>
    </>}
  </section>;
}
