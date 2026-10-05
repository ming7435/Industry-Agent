const statuses = { queued: "排队中", analyzing: "解析需求", modeling: "实体建模", validating: "校验与导出", ready: "模型已生成", confirmed: "设计已确认", needs_input: "待补充信息", failed: "建模失败", interrupted: "任务已中断" };
export const cadStatus = (status) => statuses[status] || "未知状态";
export const cadPending = (status) => ["queued", "analyzing", "modeling", "validating"].includes(status);
export const canConfirmCad = (task) => task?.status === "ready" && Boolean(task.digest) && task.geometry?.valid === true && task.geometry?.step_roundtrip_valid === true;

export function createCadCommandState(newKey = () => crypto.randomUUID()) {
  let fingerprint = "", key = "";
  const ordered = (value) => Array.isArray(value) ? value.map(ordered) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((name) => [name, ordered(value[name])])) : value;
  return {
    keyFor(path, payload) {
      const current = JSON.stringify(ordered({ path, payload }));
      if (current !== fingerprint) { fingerprint = current; key = newKey(); }
      return key;
    },
    reset() { fingerprint = ""; key = ""; },
  };
}

export function cadFileUrl(value, download = false) {
  if (!/^\/api\/cad\/designs\/CAD-[A-F0-9]{20}\/artifacts\/(step|stl|svg|top|side|dxf|json|pdf)$/.test(value || "")) throw new Error("无效的 CAD 文件地址");
  return value + (download ? "?download=1" : "");
}

export function validateCadUpload(file) {
  if (!file) return "请选择对应零件的图纸";
  if (/[\/\\:\r\n\x00]/.test(file.name) || file.name.startsWith(".")) return "图纸文件名不合法";
  if (!/\.(step|stp|dxf|pdf|png|jpg|jpeg)$/i.test(file.name)) return "不支持的图纸格式";
  if (!file.size || file.size > 8 * 1024 * 1024) return "图纸必须非空且不超过 8 MB";
  return "";
}

export function buildCadPayload(form) {
  let spec = null;
  if (form.parameters.trim()) {
    try { spec = JSON.parse(form.parameters); } catch { throw new Error("结构化参数必须是合法 JSON"); }
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) throw new Error("结构化参数必须是 JSON 对象");
  }
  return { name: form.name.trim() || "自定义零件", prompt: form.prompt.trim(), material: form.material.trim(), technical_requirements: form.technicalRequirements.trim(), spec };
}

export async function cadRequest(path, { method = "GET", body, signal, key } = {}) {
  const payload = key && body ? { ...body, command_id: key } : body;
  let response;
  try {
    response = await fetch(path, { method, signal, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("CAD 请求未收到确认，结果暂不确定。请刷新任务状态核对结果；生产请求不会自动重新发送。");
  }
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = value.detail;
    throw new Error(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item) => `${item.loc?.slice(1).join(".") || "输入"}：${item.msg}`).join("；") : `CAD 请求失败（${response.status}）`);
  }
  return value;
}

export function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.onerror = () => reject(new Error("图纸读取失败"));
    reader.readAsDataURL(file);
  });
}

export function buildManufacturingPayload(form, digest) {
  if (!/^[a-f0-9]{64}$/.test(digest || "")) throw new Error("设计版本摘要无效");
  const payload = { design_digest: digest, device_id: "TRAK-TC820LTYSI-001", postprocessor: "virtual-trak-turning-v1" };
  for (const key of ["stock_diameter_mm", "stock_length_mm", "grip_length_mm", "clearance_mm", "pass_depth_mm", "spindle_rpm", "feed_mm_per_rev", "tolerance_mm", "tool_id", "drill_tool_id", "drill_diameter_mm"]) {
    const input = form[key];
    if (["drill_tool_id", "drill_diameter_mm"].includes(key) && (input === "" || input == null)) continue;
    if (typeof input === "boolean" || input == null || String(input).trim() === "") throw new Error(`请明确填写 ${key}`);
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0 || (key.endsWith("tool_id") && (!Number.isInteger(value) || value > 99))) throw new Error(`${key} 必须是合法正数，刀具号为 1–99 的整数`);
    payload[key] = value;
  }
  return payload;
}

export const manufacturingStatus = (status) => ({ prepared: "加工包已准备", submitting: "正在下发", received: "工厂已接收 · 待确认启动", running: "虚拟加工中", paused: "故障暂停 · 待人工确认", completed: "虚拟加工完成", interrupted: "重启中断 · 待人工确认", uncertain: "结果不确定 · 只读对账", rejected: "工厂拒绝 / 尚未下发" }[status] || "未知状态");
export const canDispatchManufacturing = (record, checked) => checked === true && ["prepared", "received", "paused", "interrupted", "rejected"].includes(record?.status) && /^[a-f0-9]{64}$/.test(record?.digest || "") && record?.program?.simulation_only === true && record?.program?.simulation?.passed === true;
export const shouldRenewManufacturingConfirmation = (previous, next) => ["uncertain", "submitting"].includes(previous) && ["received", "paused", "interrupted", "rejected", "prepared"].includes(next);
export const mergeManufacturingProgress = (items, next) => items.some((item) => item.program_id === next.program_id) ? items.map((item) => item.program_id === next.program_id ? next : item) : [next, ...items];

export function manufacturingFileUrl(designId, programId, kind, download = false) {
  if (!/^CAD-[A-F0-9]{20}$/.test(designId || "") || !/^CAM-[A-F0-9]{20}$/.test(programId || "") || !["nc", "toolpath", "package"].includes(kind)) throw new Error("无效的加工文件地址");
  return `/api/cad/designs/${designId}/manufacturing/${programId}/files/${kind}${download ? "?download=1" : ""}`;
}
