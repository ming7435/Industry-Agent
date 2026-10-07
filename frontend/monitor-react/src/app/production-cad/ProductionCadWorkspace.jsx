import React, { useEffect, useRef, useState } from "react";
import { buildCadResult, cadCallStatus, cadPending, cadRequest, cadStatus, cadToolLabel, createCadCommandState, oauthCallback, readCadSession, safeResultUrl, saveCadSession, validRunId } from "./productionCad.mjs";
import "./productionCad.css";

function sessionStorage() {
  try { return window.sessionStorage; } catch { return null; }
}

function ResultImage({ src, label }) {
  const [failed, setFailed] = useState(false);
  return failed ? <p>BuildCAD 返回的图片暂时无法加载，请查看下方原始返回。</p> : <img src={src} alt={label} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

export default function ProductionCadWorkspace() {
  const [saved] = useState(() => readCadSession(sessionStorage()));
  const [prompt, setPrompt] = useState(saved?.draft_prompt ?? (["preview", "save"].includes(saved?.action) ? saved?.prompt : "") ?? "");
  const [action, setAction] = useState(saved?.action === "save" ? "save" : "preview");
  const [designId, setDesignId] = useState(saved?.design_id || "");
  const [designs, setDesigns] = useState(null);
  const [health, setHealth] = useState(null);
  const [run, setRun] = useState(saved ? { run_id: saved.run_id, action: saved.action, design_id: saved.design_id, status: saved.run_id ? "running" : "outcome_unknown", calls: [] } : null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [pollVersion, setPollVersion] = useState(0);
  const commands = useRef(null), initialization = useRef(null);
  if (!commands.current) {
    commands.current = createCadCommandState();
    if (saved) commands.current.restore(saved.prompt, saved.command_id, saved.action, saved.design_id);
  }

  useEffect(() => {
    const current = buildCadResult(run);
    if (current.designs !== null) {
      setDesigns(current.designs);
      setDesignId((selected) => current.designs.some((design) => design.id === selected) ? selected : "");
    }
  }, [run]);

  useEffect(() => {
    let active = true;
    // 共用同一个 Promise，避免 React StrictMode 重复交换授权码。
    if (!initialization.current) initialization.current = (async () => {
      let callbackError = "";
      try {
        const callback = oauthCallback(window.location.href);
        if (callback) {
          window.history.replaceState(window.history.state, "", callback.cleanUrl);
          await cadRequest("/auth/complete", { method: "POST", body: callback.body });
        }
      } catch (failure) { callbackError = failure.message; }
      finally {
        const clean = new URL(window.location.href);
        if (["code", "state", "error", "error_description"].some((key) => clean.searchParams.has(key))) {
          for (const key of ["code", "state", "error", "error_description"]) clean.searchParams.delete(key);
          window.history.replaceState(window.history.state, "", clean.pathname + clean.search + clean.hash);
        }
      }
      try { return { health: await cadRequest("/status"), error: callbackError }; }
      catch (failure) { return { health: { connected: false, tools: [] }, error: callbackError || failure.message }; }
    })();
    initialization.current.then((value) => { if (active) { setHealth(value.health); setError(value.error); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (health === null || !validRunId(run?.run_id) || !cadPending(run.status)) return undefined;
    const abort = new AbortController();
    let timer;
    const poll = async () => {
      try {
        const next = await cadRequest(`/runs/${encodeURIComponent(run.run_id)}`, { signal: abort.signal });
        if (abort.signal.aborted) return;
        setRun(next);
        if (cadPending(next.status)) timer = window.setTimeout(poll, 1200);
      } catch (failure) { if (!abort.signal.aborted) setError(failure.message); }
    };
    timer = window.setTimeout(poll, 400);
    return () => { abort.abort(); window.clearTimeout(timer); };
  }, [run?.run_id, run?.status, pollVersion, health === null]);

  async function refresh() {
    setError(""); setBusy("refresh");
    try {
      const nextHealth = await cadRequest("/status");
      setHealth(nextHealth);
      if (validRunId(run?.run_id)) {
        setRun(await cadRequest(`/runs/${encodeURIComponent(run.run_id)}`));
        setPollVersion((value) => value + 1);
      }
    } catch (failure) { setError(failure.message); }
    finally { setBusy(""); }
  }

  async function connect() {
    setError(""); setBusy("connect");
    try {
      const result = await cadRequest("/auth/start", { method: "POST", body: { redirect_uri: `${window.location.origin}/?view=cad` } });
      const url = safeResultUrl(result.authorization_url);
      if (!url || !url.startsWith("https://")) throw new Error("BuildCAD 未返回有效的授权地址，请刷新连接状态。");
      window.location.assign(url);
    } catch (failure) { setError(failure.message); setBusy(""); }
  }

  async function disconnect() {
    setError(""); setBusy("disconnect");
    try {
      await cadRequest("/auth/disconnect", { method: "POST", body: {} });
      setHealth({ connected: false, tools: [] });
      setDesigns(null); setDesignId("");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(""); }
  }

  async function submit(event) {
    event.preventDefault();
    await execute(action);
  }

  async function execute(requestAction) {
    if (busy || cadPending(run?.status) || run?.status === "outcome_unknown") return;
    const requestPrompt = requestAction === "list_designs" ? "读取我的BuildCAD设计" : requestAction === "get_design_code" ? "读取选中设计代码" : prompt.trim();
    const target = requestAction === "list_designs" ? "" : designId;
    if (!connected || !supported[requestAction]) { setError("当前连接未提供此操作所需的工具，请刷新连接状态。"); return; }
    if (["preview", "save"].includes(requestAction) && !requestPrompt) { setError("请输入建模需求。"); return; }
    if (["save", "get_design_code"].includes(requestAction) && !target) { setError("请先读取并选择一个 BuildCAD 设计。"); return; }
    setError(""); setBusy("submit");
    if (["completed", "failed", "needs_input"].includes(run?.status)) commands.current.reset();
    const payload = { prompt: requestPrompt, action: requestAction, design_id: target, command_id: commands.current.keyFor(requestPrompt, requestAction, target) };
    const session = { ...payload, draft_prompt: prompt };
    saveCadSession(sessionStorage(), session);
    setRun(null);
    try {
      const next = await cadRequest("/runs", { method: "POST", body: payload });
      if (!validRunId(next?.run_id) || !["running", "completed", "failed", "needs_input", "outcome_unknown"].includes(next.status)) throw Object.assign(new Error("提交后未收到有效运行编号，请先在 BuildCAD 核对结果。"), { outcomeUnknown: true });
      saveCadSession(sessionStorage(), { ...session, run_id: next.run_id });
      setRun({ ...next, action: next.action || requestAction, design_id: next.design_id ?? target });
    } catch (failure) {
      setError(failure.message);
      if (failure.outcomeUnknown) setRun({ status: "outcome_unknown", action: requestAction, design_id: target, calls: [], error: failure.message });
      else saveCadSession(sessionStorage(), null);
    } finally { setBusy(""); }
  }

  function startAfterCheck() {
    commands.current.reset(); saveCadSession(sessionStorage(), null); setRun(null); setError("");
  }

  const result = buildCadResult(run);
  const connected = health?.connected === true;
  const pending = cadPending(run?.status);
  const unknown = run?.status === "outcome_unknown";
  const tools = new Set((health?.tools || []).map((tool) => tool.name));
  const supported = { preview: tools.has("render_preview"), save: tools.has("save_design") && tools.has("render_preview") && tools.has("get_design_code"), list_designs: tools.has("list_designs"), get_design_code: tools.has("get_design_code") };
  const locked = Boolean(busy) || pending || unknown;
  const operationLabels = { preview: "生成预览", save: "保存设计", list_designs: "读取我的设计", get_design_code: "读取设计代码" };
  const selectableDesigns = designs || (designId ? [{ id: designId, name: `${designId}（上次选择）` }] : []);
  return <section className="production-cad">
    <header><span className="cad-eyebrow">CAD Agent</span><h1>BuildCAD 建模</h1><p>描述零件需求，读取设计、生成静态预览，或将修改保存到已选设计。</p></header>
    <section className="cad-card" aria-labelledby="buildcad-connection-title">
      <div className="cad-card-heading"><h2 id="buildcad-connection-title">BuildCAD MCP 连接</h2><span className={`cad-badge ${connected ? "connected" : "disconnected"}`} role="status">{health === null ? "正在检查连接…" : connected ? "已连接 · 工具列表已验证" : "未连接"}</span></div>
      {health?.error && <p className="cad-connection-error">{String(health.error)}</p>}
      <div className="cad-actions">{!connected && <button type="button" className="cad-primary" disabled={Boolean(busy) || pending || health === null} onClick={connect}>{busy === "connect" ? "正在打开授权…" : "连接 BuildCAD"}</button>}<button type="button" disabled={Boolean(busy) || pending || !connected} onClick={disconnect}>断开连接</button><button type="button" disabled={Boolean(busy)} onClick={refresh}>{busy === "refresh" ? "正在刷新…" : "刷新状态"}</button><a href="https://buildcad.ai" target="_blank" rel="noopener noreferrer">BuildCAD 官网</a></div>
      {connected && <details className="cad-connection-details"><summary>可用工具 · {health.tools?.length || 0} 个</summary><p>{health.endpoint} {health.transport && `· ${health.transport}`}</p><ul>{(health.tools || []).map((tool) => <li key={tool.name}><strong>{tool.name}</strong>{tool.description && <p>{tool.description}</p>}</li>)}</ul></details>}
    </section>
    {error && <div className="cad-alert" role="alert">{error}</div>}
    {connected && (supported.list_designs || supported.get_design_code) && <section className="cad-card" aria-labelledby="buildcad-designs-title">
      <div className="cad-card-heading"><h2 id="buildcad-designs-title">远端设计</h2>{supported.list_designs && <button type="button" disabled={locked} onClick={() => execute("list_designs")}>读取我的设计</button>}</div>
      <label htmlFor="buildcad-design">我的 BuildCAD 设计</label>
      <select id="buildcad-design" value={designId} disabled={locked || !selectableDesigns.length} onChange={(event) => setDesignId(event.target.value)}><option value="">请选择设计</option>{selectableDesigns.map((design) => <option key={design.id} value={design.id}>{design.name} · {design.id}</option>)}</select>
      {designs?.length === 0 && <p className="cad-design-empty">BuildCAD 账号中暂无设计。你仍可描述需求并生成预览。</p>}
      {!designId && <p className="cad-design-help">保存前，请先在 BuildCAD 官网创建一个空设计，再读取并选择它。当前 MCP 工具不提供创建设计操作。</p>}
      {supported.get_design_code && <div className="cad-actions"><button type="button" disabled={locked || !designId} onClick={() => execute("get_design_code")}>读取设计代码</button></div>}
    </section>}
    <section className="cad-card">
      <h2>建模需求</h2>
      <form onSubmit={submit}>
        <label htmlFor="buildcad-action">操作方式</label>
        <select id="buildcad-action" value={action} disabled={!connected || locked} onChange={(event) => setAction(event.target.value)}>
          {(supported.preview || !connected) && <option value="preview">仅生成预览（默认）</option>}
          {supported.save && <option value="save" disabled={!designId}>保存到已选设计</option>}
          {connected && !supported.preview && !supported.save && <option value="">当前连接未提供建模工具</option>}
        </select>
        <label htmlFor="buildcad-prompt">描述零件、尺寸和设计要求</label>
        <textarea id="buildcad-prompt" rows={6} maxLength={10000} value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={locked} placeholder="例如：设计一个外径 30 mm、长度 50 mm、中心通孔直径 10 mm 的销轴。" />
        <div className="cad-actions"><button type="submit" className="cad-primary" disabled={!connected || !supported[action] || locked || !prompt.trim() || (action === "save" && !designId)}>{busy === "submit" ? "正在提交…" : pending ? "BuildCAD 正在处理…" : "提交给 BuildCAD"}</button><span className="cad-save-note">预览不会保存设计。选择保存时，save_design 会更新已选设计，并可能将其公开。</span></div>
        <p className="cad-storage-note">默认请求前视、右视、顶视、轴测；实际展示以工具返回图片为准。交互 3D 编辑与导出请前往 BuildCAD 官网。</p>
        <p className="cad-storage-note">设计保存在 BuildCAD；本地仅在 Redis 临时保留执行记录，刷新页面可继续查询当前运行。</p>
      </form>
    </section>
    {run && <section className="cad-card" aria-labelledby="buildcad-result-title">
      <div className="cad-card-heading"><h2 id="buildcad-result-title">BuildCAD 返回</h2><span className={`cad-badge ${run.status}`} role="status">{cadStatus(run.status)}</span></div>
      {run.action && <p className="cad-result-operation">本次操作：{operationLabels[run.action] || run.action}{run.design_id && ` · 设计 ${run.design_id}`}</p>}
      {run.run_id && <p className="cad-identifier">运行编号：{run.run_id}</p>}
      {pending && <p>正在等待真实工具返回。你可以刷新状态或稍后回到此页查询。</p>}
      {unknown && <div className="cad-alert"><p>结果尚不确定。请先前往 BuildCAD 核对设计，再决定是否提交新需求。</p><button type="button" disabled={Boolean(busy)} onClick={startAfterCheck}>已在 BuildCAD 核对，开始新需求</button></div>}
      {run.error && <p className="cad-run-error" role="alert">{run.error_tool && `${cadToolLabel(run.error_tool)}（${run.error_tool}）：`}{String(run.error)}</p>}
      {!!result.errors.length && <div className="cad-tool-errors" role="alert">{result.errors.map((item, index) => <p key={index}><strong>{cadToolLabel(item.tool)}（{item.tool}）{item.uncertain ? "结果待核对" : "失败"}：</strong>{item.message}</p>)}</div>}
      {result.texts.map((text, index) => <p className="cad-result-text" key={index}>{text}</p>)}
      {result.designs !== null && run.action === "list_designs" && <p>{result.designs.length ? `已读取 ${result.designs.length} 个设计，请在上方选择。` : "读取完成：当前账号没有设计。"}</p>}
      {result.codeSource && <details className="cad-design-code" open><summary>{{ read: "读取的设计代码 · get_design_code", preview: "本轮预览代码 · render_preview", saved: "已保存代码 · save_design" }[result.codeSource]}</summary>{result.code === "" ? <p>该设计暂为空代码</p> : <pre>{result.code}</pre>}</details>}
      {!!result.images.length && <div className="cad-result-images">{result.images.map((item) => <figure key={item.src}><ResultImage {...item} /><figcaption>BuildCAD 返回的静态预览</figcaption></figure>)}</div>}
      {!!result.links.length && <div className="cad-result-links"><h3>工具返回的链接</h3><ul>{result.links.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>)}</ul></div>}
      {run.status === "completed" && !result.texts.length && !result.images.length && !result.links.length && !result.codeSource && result.designs === null && <p>本次调用已结束，工具未返回可展示的文本、图片或链接。请查看实际调用记录。</p>}
      {!!run.calls?.length && <details className="cad-call-details"><summary>实际工具调用 · {run.calls.length} 次</summary><ol>{run.calls.map((call, index) => <li key={index}><details><summary>{index + 1}. {cadToolLabel(call.tool)} · {call.tool} · {cadCallStatus(call, run.status)}</summary><h3>参数</h3><pre>{JSON.stringify(call.arguments, null, 2)}</pre><h3>{call.error ? "调用错误" : "返回"}</h3><pre>{JSON.stringify(call.error ? { error: call.error, ...(call.result ? { result: call.result } : {}) } : call.result ?? { error: "未收到工具返回" }, null, 2)}</pre></details></li>)}</ol></details>}
    </section>}
  </section>;
}
