const prefix = "/api/cad/freecad";
const sessionKey = "freecad.active-run";

const drawingPart = { units: 'mm', operations: [
  { type: 'box', mode: 'add', length: 60, width: 40, height: 20, position: [0, 0, 0] },
  { type: 'cylinder', mode: 'cut', diameter: 12, length: 20, axis: 'z', position: [30, 20, 0] },
] };

export const freeCadWorkbenchExamples = {
  drawing: { label: '二维工程图 · 三视图与等轴测', prompt: '按下方参数生成带通孔零件及第三角法三视图、等轴测工程图。',
    spec: { ...drawingPart, drawing: { projection: 'third_angle', scale: 1, section: null } } },
  section: { label: '剖视图 · 三视图与 A-A 剖面', prompt: '按下方参数生成带通孔零件、三视图和指定平面的 A-A 剖视图。',
    spec: { ...drawingPart, drawing: { projection: 'third_angle', scale: 1, section: { origin: [30, 20, 10], normal: [0, 1, 0] } } } },
  sheetmetal: { label: '钣金 · 单折弯与展开', prompt: '按下方参数生成单折弯钣金和展开图，底边及翼边长度均为不含圆弧的直段长度，K 因子采用 ANSI。',
    spec: { units: 'mm', sheet_metal: { width: 80, base_length: 60, flange_length: 30, thickness: 2, bend_radius: 3, bend_angle: 90, k_factor: 0.4 } } },
  motion: { label: '机械装配 · 真实转动关节', prompt: '按下方参数固定圆柱基体，让悬臂绕明确的转动关节从 0 度运动至 90 度，导出实际求解的运动帧。',
    spec: { units: 'mm', parts: [
      { name: 'Base', operations: [{ type: 'cylinder', mode: 'add', diameter: 20, length: 20, axis: 'z', position: [0, 0, 0] }] },
      { name: 'Arm', operations: [{ type: 'box', mode: 'add', length: 50, width: 8, height: 4, position: [0, -4, 0] }] },
    ], assembly: { grounded: 'Base', joints: [{ name: 'Hinge', type: 'revolute', part1: 'Base', part2: 'Arm',
      connector1: { position: [0, 0, 20], axis: [0, 0, 1] }, connector2: { position: [0, 0, 0], axis: [0, 0, 1] } }],
      motion: { joint: 'Hinge', start: 0, end: 90, duration: 2, frames: 25 } } } },
  bim: { label: 'BIM 建筑 · 墙、楼板与门洞', prompt: '按下方毫米参数生成墙、楼板和宿主墙门洞，并生成比例为 1:50 的建筑三视图。',
    spec: { units: 'mm', bim: {
      walls: [{ name: 'Wall', start: [0, 0, 0], end: [6000, 0, 0], height: 3000, thickness: 200 }],
      slabs: [{ name: 'Slab', length: 6000, width: 4000, thickness: 200, position: [0, -2000, 0] }],
      openings: [{ name: 'DoorOpening', wall: 'Wall', offset: 1000, sill: 0, width: 900, height: 2100 }],
    }, drawing: { projection: 'third_angle', scale: 0.02, section: null } } },
};

export const validFreeCadRun = (value) => typeof value === "string" && /^FC-[a-f0-9]{64}$/.test(value);

export const validFreeCadPartNumber = (value) => typeof value === 'string' && value.length === 5 && /^[0-9]{5}$/.test(value);

export function freeCadDisplayNumber(run) {
  if (validFreeCadPartNumber(run?.part_number)) return run.part_number;
  // 历史设计的五位短号仅用于显示，查询、版本和下载始终保留完整运行编号。
  return validFreeCadRun(run?.run_id) ? String(parseInt(run.run_id.slice(-8), 16) % 100000).padStart(5, '0') : '';
}

export async function freeCadRunId(commandId) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(commandId));
  return `FC-${Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function readFreeCadSession(storage) {
  try {
    const value = JSON.parse(storage?.getItem(sessionKey) || "null");
    if (!value || typeof value.prompt !== "string" || typeof value.command_id !== "string" || (value.run_id && !validFreeCadRun(value.run_id))) return null;
    return { prompt: value.prompt, command_id: value.command_id, run_id: value.run_id || "", draft_prompt: typeof value.draft_prompt === "string" ? value.draft_prompt : value.prompt,
      draft_spec: typeof value.draft_spec === 'string' ? value.draft_spec : '',
      part_name: typeof value.part_name === 'string' ? value.part_name.slice(0, 120) : '',
      part_number: typeof value.part_number === 'string' ? value.part_number.slice(0, 80) : '',
      draft_part_name: typeof value.draft_part_name === 'string' ? value.draft_part_name.slice(0, 120) : typeof value.part_name === 'string' ? value.part_name.slice(0, 120) : '',
      draft_part_number: typeof value.draft_part_number === 'string' ? value.draft_part_number.slice(0, 80) : typeof value.part_number === 'string' ? value.part_number.slice(0, 80) : '' };
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
  if (proof.model_kind === 'assembly' || proof.model_kind === 'bim') {
    const building = proof.model_kind === 'bim';
    if (!Number.isInteger(proof.solid_count) || proof.solid_count < (building ? 1 : 2) || proof.solid_count > (building ? 32 : 8) ||
        proof.component_count !== proof.solid_count || proof.step_roundtrip !== true || (!building && proof.interference_checked !== true) ||
        !Array.isArray(proof.components) || proof.components.length !== proof.solid_count ||
        proof.components.some((p) => !p || typeof p.name !== 'string' || !p.name.trim() || p.solid_count !== 1 || !Number.isFinite(p.volume_mm3) || p.volume_mm3 <= 0) ||
        new Set(proof.components.map((p) => p.name)).size !== proof.solid_count) return [];
    if (building) {
      const bim = proof.bim;
      if (bim?.verified !== true || !['walls', 'slabs', 'openings'].every((key) => Number.isInteger(bim[key]) && bim[key] >= 0) ||
          bim.walls > 24 || bim.slabs > 8 || bim.openings > 32 || bim.walls + bim.slabs !== proof.solid_count ||
          !Number.isFinite(bim.opening_volume_removed) || bim.opening_volume_removed < 0 ||
          (bim.openings > 0 && bim.opening_volume_removed <= 0)) return [];
    }
  } else if (proof.solid_count !== 1) return [];
  const allowed = new Map([['model.stl', 'stl'], ['model.step', 'step'], ['model.FCStd', 'fcstd'], ['model.fcstd', 'fcstd']]);
  if (proof.drawing?.verified === true) { allowed.set('drawing.svg', 'svg'); allowed.set('drawing.pdf', 'pdf'); }
  if (proof.sheet_metal?.verified === true) { allowed.set('unfold.svg', 'svg'); allowed.set('unfold.dxf', 'dxf'); }
  if (proof.model_kind === 'assembly' && proof.assembly?.verified === true && proof.assembly.solver_status === 0 &&
      Number.isInteger(proof.assembly.motion_frames) && proof.assembly.motion_frames >= 2 && proof.assembly.motion_frames <= 120) allowed.set('motion.json', 'json');
  const seen = new Set();
  return (Array.isArray(run.artifacts) ? run.artifacts : []).filter((item) => {
    if (!item || !allowed.has(item.name) || allowed.get(item.name) !== item.format) return false;
    // 保留旧记录的 fcstd 小写后缀，但工程图和展开图按各自固定名称保留。
    const name = item.name === 'model.fcstd' ? 'model.FCStd' : item.name;
    if (seen.has(name) || item.url !== `${prefix}/runs/${run.run_id}/artifacts/${item.name}`) return false;
    seen.add(name);
    return true;
  });
}

export function freeCadStatus(status) {
  return { running: "FreeCAD 正在建模", submitting: "正在提交建模需求", completed: "建模完成", needs_input: "待补充需求（尚未建模）", failed: "建模失败", outcome_unknown: "结果待核对" }[status] || "正在读取运行记录";
}
