export const BUILD_CAD_API = "/api/cad/buildcad";
const SESSION_KEY = "buildcad.active-run";
const statuses = { running: "BuildCAD 正在处理", completed: "BuildCAD 已返回结果", failed: "BuildCAD 请求失败", needs_input: "待补充需求（尚未建模）", outcome_unknown: "结果待核对" };
const actions = ["preview", "save", "list_designs", "get_design_code"];
const toolLabels = { render_preview: "生成预览", save_design: "保存设计", list_designs: "读取我的设计", get_design_code: "读取设计代码" };
export const cadToolLabel = (tool) => toolLabels[tool] || tool;
export const cadCallStatus = (call, runStatus) => call?.result?.isError ? "失败" : call?.error ? (runStatus === "outcome_unknown" ? "结果待核对" : "失败") : call?.result == null ? "未收到返回" : "已返回";
export const cadStatus = (status) => statuses[status] || "状态待确认";
export const cadPending = (status) => status === "running";
export const validRunId = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);

export function createCadCommandState(newKey = () => crypto.randomUUID()) {
  let fingerprint = "", key = "";
  const identify = (prompt, action = "preview", designId = "") => JSON.stringify([prompt, action, designId]);
  return {
    keyFor(prompt, action = "preview", designId = "") {
      const next = identify(prompt, action, designId);
      if (!key || next !== fingerprint) { fingerprint = next; key = newKey(); }
      return key;
    },
    restore(prompt, commandId, action = "preview", designId = "") { fingerprint = identify(prompt, action, designId); key = commandId; },
    reset() { fingerprint = ""; key = ""; },
  };
}

function uncertainRequest() {
  return Object.assign(new Error("请求未收到明确结果，请先在 BuildCAD 核对设计；不会自动重新提交。"), { outcomeUnknown: true });
}

export async function cadRequest(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(BUILD_CAD_API + path, {
      method, signal, credentials: "same-origin", headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (method !== "GET") throw uncertainRequest();
    throw new Error("无法读取 BuildCAD 连接或执行状态，请刷新重试。");
  }
  let value;
  try { value = await response.json(); } catch {
    if (method !== "GET" && (response.ok || response.status >= 500)) throw uncertainRequest();
    throw new Error(`BuildCAD 返回内容无法读取（${response.status}）`);
  }
  if (!response.ok) {
    const detail = value?.detail || value?.error;
    const message = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).join("；") : `BuildCAD 请求失败（${response.status}）`;
    if (method !== "GET" && response.status >= 500) throw Object.assign(uncertainRequest(), { message: `${message}。请先在 BuildCAD 核对结果，不会自动重新提交。` });
    throw new Error(message);
  }
  return value;
}

export function safeResultUrl(value, { image = false } = {}) {
  if (typeof value !== "string" || !value || /[\s\u0000-\u001f\u007f]/.test(value)) return "";
  try {
    const url = new URL(value);
    if (!(["https:"].includes(url.protocol) || (!image && url.protocol === "http:")) || url.username || url.password) return "";
    return value;
  } catch { return ""; }
}

// 只展示 MCP 实际返回的内容，不通过设计编号猜测资源地址。
export function buildCadResult(run) {
  const texts = new Set(), links = new Set(), images = new Map();
  const errors = [];
  let designs = null, code = "", codeSource = null;
  const jsonValue = (value) => {
    if (typeof value !== "string") return value;
    try { return JSON.parse(value); } catch { return value; }
  };
  const collectDesigns = (value) => {
    const items = Array.isArray(value) ? value : value?.designs;
    if (!Array.isArray(items)) return;
    const unique = new Map();
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const id = item.design_id || item.designId || item.id;
      if (typeof id !== "string" || !id.trim()) continue;
      const name = typeof item.name === "string" ? item.name : typeof item.title === "string" ? item.title : id;
      const url = safeResultUrl(item.url || item.design_url || item.designUrl);
      unique.set(id, { id, name, ...(url ? { url } : {}) });
    }
    designs = [...unique.values()];
  };
  const addImage = (src, label = "BuildCAD 返回的模型图片") => { if (src) images.set(src, { src, label }); };
  const imageMime = (mimeType) => ["image/png", "image/jpeg", "image/webp"].includes(mimeType);
  const addEmbeddedImage = (mimeType, data) => {
    if (!imageMime(mimeType) || typeof data !== "string" || !data.length || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return;
    let bytes;
    try { bytes = atob(data); } catch { return; }
    const valid = (mimeType === "image/png" && bytes.startsWith("\x89PNG\r\n\x1a\n") && bytes.length > 24)
      || (mimeType === "image/jpeg" && bytes.startsWith("\xff\xd8\xff") && bytes.endsWith("\xff\xd9"))
      || (mimeType === "image/webp" && bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP" && bytes.length > 20);
    if (valid) addImage(`data:${mimeType};base64,${data}`);
  };
  const scanString = (value, key = "") => {
    if (typeof value !== "string") return;
    const direct = safeResultUrl(value);
    if (direct) {
      links.add(direct);
      if (/image|preview|screenshot|thumbnail/i.test(key) || /\.(png|jpe?g|webp)(?:[?#]|$)/i.test(value)) addImage(safeResultUrl(value, { image: true }));
    }
    for (const match of value.matchAll(/https?:\/\/[^\s<>"'\[\]{}（）()，。；]+/g)) {
      const url = safeResultUrl(match[0]);
      if (url) links.add(url);
    }
  };
  const visit = (value, depth = 0, key = "") => {
    if (depth > 12 || value == null) return;
    if (typeof value === "string") { scanString(value, key); return; }
    if (Array.isArray(value)) { value.forEach((item) => visit(item, depth + 1, key)); return; }
    if (typeof value !== "object") return;
    if (value.type === "resource_link" || value.type === "resource") {
      const resource = value.type === "resource" ? value.resource : value;
      if (!resource || typeof resource !== "object") return;
      const url = safeResultUrl(resource.uri);
      if (url) links.add(url);
      if (value.type === "resource_link" && imageMime(resource.mimeType)) addImage(safeResultUrl(resource.uri, { image: true }));
      if (value.type === "resource") addEmbeddedImage(resource.mimeType, resource.blob || resource.data);
      return;
    }
    if (value.type === "image") {
      addEmbeddedImage(value.mimeType, value.data);
      addImage(safeResultUrl(value.url || value.image_url, { image: true }));
    }
    if (value.type === "text" && typeof value.text === "string") {
      const parsed = jsonValue(value.text);
      if (typeof parsed === "string" && parsed.trim()) texts.add(parsed);
      else visit(parsed, depth + 1);
    }
    for (const [name, item] of Object.entries(value)) if (name !== "data") visit(item, depth + 1, name);
  };
  // 模型总结仅保留文本，不能作为工具实际返回的链接或图片依据。
  if (run?.status !== "failed" && typeof run?.answer === "string" && typeof jsonValue(run.answer) === "string" && run.answer.trim()) texts.add(run.answer);
  for (const call of run?.calls || []) {
    const result = call.result;
    if (call.error) {
      errors.push({ tool: call.tool, message: typeof call.error === "string" ? call.error : JSON.stringify(call.error), uncertain: run?.status === "outcome_unknown" });
      continue;
    }
    if (result?.isError) {
      const messages = (result.content || []).filter((item) => item.type === "text" && typeof item.text === "string").map((item) => {
        const parsed = jsonValue(item.text);
        return typeof parsed === "string" ? parsed : parsed?.error?.message || parsed?.error || parsed?.message || item.text;
      }).filter((item) => typeof item === "string");
      errors.push({ tool: call.tool, message: messages.join("\n") || "工具返回错误，请查看原始调用记录。" });
      continue;
    }
    if (call.tool === "list_designs") {
      collectDesigns(result?.structuredContent);
      for (const item of result?.content || []) if (item.type === "text") collectDesigns(jsonValue(item.text));
      for (const item of designs || []) if (item.url) links.add(item.url);
      continue;
    }
    if (call.tool === "get_design_code") {
      if (typeof result?.structuredContent?.code === "string") { code = result.structuredContent.code; codeSource = "read"; }
      for (const item of result?.content || []) if (item.type === "text") {
        const parsed = jsonValue(item.text);
        if (typeof parsed === "string") { code = parsed; codeSource = "read"; }
        else if (typeof parsed?.code === "string") { code = parsed.code; codeSource = "read"; }
      }
      continue;
    }
    if (result && ["render_preview", "save_design"].includes(call.tool) && typeof call.arguments?.code === "string") {
      code = call.arguments.code;
      codeSource = call.tool === "save_design" ? "saved" : "preview";
    }
    visit(result);
  }
  if (run?.status === "completed") {
    if (designs === null && run.action === "list_designs") collectDesigns(run.designs);
    if (codeSource === null && run.action === "get_design_code" && typeof run.code === "string") { code = run.code; codeSource = "read"; }
  }
  return { texts: [...texts], links: [...links], images: [...images.values()], designs, code, codeSource, errors };
}

export function oauthCallback(href) {
  const url = new URL(href);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (!code && !state && !url.searchParams.has("error")) return null;
  if (url.searchParams.has("error")) throw new Error(`BuildCAD 授权未完成：${url.searchParams.get("error_description") || url.searchParams.get("error")}`);
  if (!code || !state) throw new Error("BuildCAD 授权回调缺少 code 或 state，请重新连接。");
  for (const name of ["code", "state", "error", "error_description"]) url.searchParams.delete(name);
  return { body: { code, state, redirect_uri: `${url.origin}/?view=cad` }, cleanUrl: url.pathname + url.search + url.hash };
}

export function readCadSession(storage) {
  try {
    const value = JSON.parse(storage?.getItem(SESSION_KEY) || "null");
    if (!value || (value.run_id && !validRunId(value.run_id)) || typeof value.prompt !== "string" || typeof value.command_id !== "string") return null;
    const action = value.action === undefined ? "preview" : value.action;
    const designId = value.design_id === undefined ? "" : value.design_id;
    if (!actions.includes(action) || typeof designId !== "string") return null;
    return { ...(value.run_id ? { run_id: value.run_id } : {}), prompt: value.prompt, command_id: value.command_id, action, design_id: designId, ...(typeof value.draft_prompt === "string" ? { draft_prompt: value.draft_prompt } : {}) };
  } catch { return null; }
}

export function saveCadSession(storage, value) {
  try { if (value) storage?.setItem(SESSION_KEY, JSON.stringify(value)); else storage?.removeItem(SESSION_KEY); } catch { /* 浏览器会话保存可选，失败不影响当前结果展示。 */ }
}
