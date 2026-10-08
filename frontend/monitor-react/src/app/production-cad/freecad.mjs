const prefix = "/api/cad/freecad";
const sessionKey = "freecad.active-run";

export const validFreeCadRun = (value) => typeof value === "string" && /^FC-[a-f0-9]{64}$/.test(value);

export async function freeCadRunId(commandId) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(commandId));
  return `FC-${Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function readFreeCadSession(storage) {
  try {
    const value = JSON.parse(storage?.getItem(sessionKey) || "null");
    if (!value || typeof value.prompt !== "string" || typeof value.command_id !== "string" || (value.run_id && !validFreeCadRun(value.run_id))) return null;
    return { prompt: value.prompt, command_id: value.command_id, run_id: value.run_id || "", draft_prompt: typeof value.draft_prompt === "string" ? value.draft_prompt : value.prompt,
      draft_spec: typeof value.draft_spec === 'string' ? value.draft_spec : '' };
  } catch { return null; }
}

export function saveFreeCadSession(storage, value) {
  try { if (value) storage?.setItem(sessionKey, JSON.stringify(value)); else storage?.removeItem(sessionKey); } catch { /* 存储不可用时仍可在当前页面建模。 */ }
}

export async function freeCadRequest(path, { method = "GET", body, signal } = {}) {
  const writing = method !== "GET";
  let response, data;
  try {
    response = await fetch(`${prefix}${path}`, { method, credentials: "same-origin", signal, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    data = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(new Error(writing ? "提交响应中断，结果待核对。请刷新状态查询本次运行。" : "无法读取本地 FreeCAD 状态，请检查连接后刷新。"), { outcomeUnknown: writing });
  }
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : typeof data?.error === "string" ? data.error : `FreeCAD 请求失败（${response.status}）`;
    throw Object.assign(new Error(detail), { outcomeUnknown: writing && response.status >= 500, status: response.status });
  }
  return data;
}

export function freeCadArtifacts(run) {
  // 仅接受本轮、服务端校验成功的固定导出路径，模型文本不能提供下载地址。
  if (!validFreeCadRun(run?.run_id) || run.status !== "completed" || run.validation?.valid !== true) return [];
  const proof = run.validation;
  if (proof.model_kind === 'assembly') {
    if (!Number.isInteger(proof.solid_count) || proof.solid_count < 2 || proof.solid_count > 8 ||
        proof.component_count !== proof.solid_count || proof.step_roundtrip !== true || proof.interference_checked !== true ||
        !Array.isArray(proof.components) || proof.components.length !== proof.solid_count ||
        proof.components.some((p) => !p || typeof p.name !== 'string' || !p.name.trim() || p.solid_count !== 1 || !Number.isFinite(p.volume_mm3) || p.volume_mm3 <= 0) ||
        new Set(proof.components.map((p) => p.name)).size !== proof.solid_count) return [];
  } else if (proof.solid_count !== 1) return [];
  const seen = new Set();
  return (Array.isArray(run.artifacts) ? run.artifacts : []).filter((item) => {
    if (!item || !["stl", "step", "fcstd"].includes(item.format) || seen.has(item.format)) return false;
    const name = `model.${item.format}`;
    if (item.name?.toLowerCase() !== name || item.url !== `${prefix}/runs/${run.run_id}/artifacts/${item.name}`) return false;
    seen.add(item.format);
    return true;
  });
}

export function freeCadStatus(status) {
  return { running: "FreeCAD 正在建模", submitting: "正在提交建模需求", completed: "建模完成", needs_input: "待补充需求（尚未建模）", failed: "建模失败", outcome_unknown: "结果待核对" }[status] || "正在读取运行记录";
}
