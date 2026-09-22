import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./styles.css";
import machineImage from "./assets/trak-tc820-machine-transparent.png";
import { buildTechnicianSummary } from "./technicianSummary.mjs";
import { buildWorkorderSheet } from "./workorderSheet.mjs";
import { buildAgentFlow } from "./agentFlow.mjs";

const navItems = [
  { id: "monitor", label: "监控中心", icon: "⌁", badge: "实时" },
  { id: "diagnosis", label: "智能诊断", icon: "◇" },
  { id: "maintenance", label: "维修决策", icon: "▣" },
  { id: "workorder", label: "工单系统", icon: "□" },
  { id: "quality", label: "质检系统", icon: "✓" },
  { id: "report", label: "报告中心", icon: "≡" },
  { id: "rag", label: "RAG知识问答", icon: "?" },
  { id: "trace", label: "运行追踪", icon: "⋮" },
];

const workshopMachines = [
  {
    id: "TRAK-TC820LTYSI-001",
    name: "TRAK-TC820LTYSI-001",
    line: "A线 · 主加工单元",
    type: "数控车削中心",
    x: 50,
    y: 39,
    live: true,
    image: machineImage,
  },
];

const machineFallbacks = {
  "TRAK-TC820LTYSI-001": {
    name: "TRAK TC820LTYsi 车削中心",
    line: "A线 · 主加工单元",
    type: "数控车削中心",
    x: 42,
    y: 58,
    image: machineImage,
  },
  "LNS-QL-SERVO-80-S2-001": {
    name: "LNS QL Servo 80 S2 棒料送料机",
    line: "A线 · 上料单元",
    type: "棒料送料机",
    x: 23,
    y: 46,
  },
  "ELITE-CS612-ROBOT-001": {
    name: "ELITE ROBOTS CS612 六轴协作机器人",
    line: "A线 · 下料协作单元",
    type: "六轴协作机器人",
    x: 68,
    y: 42,
  },
};

const deviceTypeLabels = {
  turning_center: "数控车削中心",
  bar_feeder: "棒料送料机",
  industrial_robot: "工业机器人",
};

const deviceProfiles = {
  turning_center: {
    area: "A01 主加工单元",
    flow: "棒料 → 车削 → 成品缓存",
    focus: "主轴、液压、冷却与刀塔",
    metrics: [
      ["spindle_rpm", "主轴转速", "主轴", "rpm"],
      ["spindle_load_percent", "主轴负载", "主轴", "%"],
      ["spindle_temperature_c", "主轴温度", "主轴", "°C"],
      ["spindle_vibration_mm_s", "主轴振动", "主轴", "mm/s"],
      ["hydraulic_pressure_psi", "液压压力", "液压", "psi"],
      ["coolant_pressure_psi", "冷却压力", "冷却", "psi"],
      ["lubrication_pressure_psi", "润滑压力", "润滑", "psi"],
      ["turret_servo_load_percent", "刀塔负载", "刀塔", "%"],
    ],
  },
  bar_feeder: {
    area: "A02 棒料上料单元",
    flow: "棒料检测 → 推料 → 车床联动",
    focus: "棒料、伺服、推料与安全门",
    metrics: [
      ["bar_diameter_mm", "棒料直径", "棒料", "mm"],
      ["bar_length_mm", "剩余长度", "棒料", "mm"],
      ["pusher_position_mm", "推料位置", "送料", "mm"],
      ["feed_speed_m_min", "送料速度", "送料", "m/min"],
      ["pushing_torque_nm", "推送扭矩", "伺服", "N·m"],
      ["loading_cycle_seconds", "上料周期", "节拍", "s"],
      ["servo_battery_voltage_v", "伺服电池", "电气", "V"],
      ["dc_24v_supply_v", "24V电源", "电气", "V"],
    ],
  },
  industrial_robot: {
    area: "A03 下料协作单元",
    flow: "取件 → 搬运 → 装箱缓存",
    focus: "关节、末端力、控制器与安全 IO",
    metrics: [
      ["joint_comm_quality_percent", "关节通讯", "通讯", "%"],
      ["tool_speed_mm_s", "TCP速度", "运动", "mm/s"],
      ["tcp_force_n", "TCP力", "末端", "N"],
      ["joint_temperature_c", "关节温度", "关节", "°C"],
      ["robot_power_w", "机器人功率", "电气", "W"],
      ["robot_48v_power_v", "48V母线", "电气", "V"],
      ["controller_performance_pct", "控制器负载", "控制器", "%"],
      ["memory_free_mb", "剩余内存", "控制器", "MB"],
    ],
  },
};

const defaultMachinePositions = [
  { x: 42, y: 58 },
  { x: 23, y: 46 },
  { x: 68, y: 42 },
  { x: 78, y: 62 },
];

const ruleLabels = {
  critical: "关键规则",
  threshold: "阈值规则",
  duration: "持续规则",
  count: "计数规则",
  trend: "趋势规则",
  multi_metric: "多指标规则",
};

const statusLabels = {
  normal: "正常",
  warning: "预警",
  alarm: "报警",
  fault: "故障",
  running: "运行中",
  stopped: "已停止",
  offline: "离线",
};

const alertLevelLabels = {
  normal: "正常",
  initial: "初级预警",
  intermediate: "中级报警",
  high: "高级故障",
};

const kindLabels = {
  metric: "指标异常",
  temperature: "温度异常",
  vibration: "振动异常",
  alarm: "设备报警",
  status: "设备状态",
  trend: "趋势异常",
  multi_metric: "多指标联合异常",
};

const diagnosisStatusLabels = {
  idle: "等待异常",
  running: "分析中",
  completed: "已完成",
  fallback: "备用诊断",
  failed: "执行失败",
};

const diagnosisEvidenceLabels = {
  get_alarm_definition: "报警定义库",
  get_device_history: "历史趋势查询",
  get_device_logs: "设备日志查询",
  get_device_status: "实时设备状态",
  get_production_status: "生产状态查询",
  search_knowledge: "维修知识检索",
  search_alarm_knowledge: "报警知识检索",
  search_sop: "维修 SOP 检索",
  search_manual: "维修手册检索",
  search_fault_cases: "历史故障案例检索",
  search_semantic_memory: "历史经验检索",
};

const workorderStatusLabels = {
  open: "待处理",
  in_progress: "处理中",
  completed: "已完成",
  closed: "已关闭",
};

const repairTargetCatalog = {
  "700001": {
    component: "LUBRICATION-PUMP",
    part_no: "TN420050-B",
    cad_part_numbers: ["TN420050-B", "TN420390-A", "TN420470", "TR260061", "TR443560"],
    part_name: "润滑泵",
    system: "自动润滑系统",
    location: "机床后侧润滑单元",
    description: "向主轴轴承、导轨和丝杠提供定量润滑。压力未达到时，应优先检查泵体、油路、过滤器和压力开关。",
    relation: "上接润滑油箱，下接分配器和主轴/导轨润滑回路",
    symptom: "润滑压力未达到设定值",
    check: "检查油位、泵出口压力、过滤器和压力开关",
    marker: { left: "20%", top: "68%" },
  },
  "700002": {
    component: "MCP-PENDANT",
    part_no: "34431-1",
    cad_part_numbers: ["34410-1_FIXED", "34431-1", "34431-2", "34431-3", "34431-4", "34431-5", "34432-1", "34432-2", "34432-3", "34432-4", "34432-5"],
    part_name: "机床控制面板",
    system: "机床操作系统",
    location: "机床前侧悬臂操作箱区域",
    description: "用于操作机床运行、进给和手轮控制。Feed hold 报警时，应检查控制面板、进给启动按钮和手轮输入。",
    relation: "连接 CNC 控制器、进给启动按钮、手轮和操作面板输入",
    symptom: "机床处于 Feed hold，轴运动被暂停",
    check: "检查进给启动按钮、悬臂面板、手轮和控制信号反馈",
    marker: { left: "68%", top: "28%" },
  },
  "700010": {
    component: "HYDRAULIC-UNIT",
    part_no: "HY-TC820-002",
    part_name: "液压站",
    system: "液压系统",
    location: "机床后侧液压单元",
    description: "为卡盘、尾座和夹紧机构提供液压动力。压力不足会导致夹紧、松开或尾座动作异常。",
    relation: "连接液压泵、溢流阀、压力传感器和卡盘/尾座执行机构",
    symptom: "液压压力未达到设定值",
    check: "检查液压油位、泵站压力、溢流阀和泄漏点",
    marker: { left: "25%", top: "64%" },
  },
  "700032": {
    component: "COOLING-PUMP",
    part_no: "CP-TC820-015",
    part_name: "冷却泵",
    system: "冷却系统",
    location: "机床后侧冷却单元",
    description: "将冷却液输送至刀具和主轴加工区域，用于带走切削热并维持加工温度。过载通常与泵体堵塞、叶轮卡滞、过滤器堵塞或电机异常有关。",
    relation: "连接冷却箱、过滤器、冷却管路和主轴冷却回路",
    symptom: "冷却泵电机过载，冷却流量可能下降",
    check: "检查泵体、入口过滤器、出口压力、电机电流和叶轮阻塞",
    marker: { left: "24%", top: "72%" },
  },
  "700029": {
    component: "LUBRICATION-PUMP",
    part_no: "TN420050-B",
    cad_part_numbers: ["TN420050-B", "TN420390-A", "TN420470", "TR260061", "TR443560"],
    part_name: "润滑泵",
    system: "自动润滑系统",
    location: "机床后侧润滑单元",
    description: "监测润滑油箱液位并向主轴、导轨和丝杠供油。液位低时应先确认油箱、泵体和液位开关。",
    relation: "连接润滑油箱、润滑泵、液位开关和分配器",
    symptom: "润滑油液位低",
    check: "检查油箱液位、加油口、液位开关和是否存在泄漏",
    marker: { left: "20%", top: "68%" },
  },
  "700223": {
    component: "TEMP-PT100",
    part_no: "TS-PT100-008",
    part_name: "主轴温度传感器",
    system: "主轴温度监测",
    location: "主轴电机壳体测温孔",
    description: "采集主轴电机壳体温度并反馈给控制系统，用于过温保护和趋势监测。",
    relation: "安装于主轴电机壳体，信号接入 PLC 模拟量模块",
    symptom: "主轴温度超过报警阈值",
    check: "检查传感器安装、线缆、接插件和实际温度读数",
    marker: { left: "58%", top: "31%" },
  },
  "700006": {
    component: "TURRET-ASSY",
    part_no: "TR-TC820-006",
    part_name: "刀塔组件",
    system: "刀塔系统",
    location: "主轴箱前侧刀塔区域",
    description: "完成刀具选择、旋转定位和夹紧。动作超时可能由伺服、夹紧开关、机械卡滞或润滑不足引起。",
    relation: "连接刀塔伺服、电磁阀、夹紧/松开检测开关和刀具座",
    symptom: "刀塔未在规定时间内完成旋转",
    check: "检查刀塔参考位置、伺服负载、夹紧开关和机械干涉",
    marker: { left: "61%", top: "52%" },
  },
  "700509": {
    component: "TAILSTOCK-ASSY",
    part_no: "TS-TC820-009",
    part_name: "尾座夹紧机构",
    system: "尾座系统",
    location: "机床右侧尾座区域",
    description: "用于工件端部支撑和夹紧，夹紧压力不足时会影响加工稳定性和人身安全。",
    relation: "连接尾座液压缸、压力开关和夹紧执行机构",
    symptom: "尾座夹紧压力未达到设定值",
    check: "检查尾座压力、液压缸、夹紧开关和工件支撑状态",
    marker: { left: "78%", top: "52%" },
  },
  "700240": {
    component: "TOOL-PROBE",
    part_no: "TP-TC820-010",
    part_name: "刀具测头",
    system: "刀具检测系统",
    location: "刀塔/加工区测量位置",
    description: "用于确认刀具位置和刀具状态，未到位时禁止进入相关加工流程。",
    relation: "连接测头本体、到位开关和控制系统输入",
    symptom: "刀具测头未处于规定位置",
    check: "检查测头机构、到位开关、线缆和机械干涉",
    marker: { left: "55%", top: "58%" },
  },
  "700009": {
    component: "PART-CATCHER",
    part_no: "PC-TC820-011",
    part_name: "接料器",
    system: "下料系统",
    location: "主轴下方接料区域",
    description: "接收加工完成的零件并完成上下动作，位置异常时可能造成碰撞或下料失败。",
    relation: "连接升降执行机构、位置检测开关和下料托盘",
    symptom: "接料器上下动作异常",
    check: "检查位置开关、执行机构、导轨和是否存在工件干涉",
    marker: { left: "53%", top: "78%" },
  },
  "700015": {
    component: "BARFEEDER",
    part_no: "BF-QL80S2-001",
    part_name: "棒料送料机",
    system: "上料系统",
    location: "机床左侧上料单元",
    description: "将棒料按设定长度稳定送入主轴，报警时应检查送料准备信号、伺服和推料机构。",
    relation: "连接棒料通道、推料伺服、送料控制器和车床接口",
    symptom: "送料机未就绪或送料报警",
    check: "检查棒料通道、推料位置、伺服状态和车床联锁信号",
    marker: { left: "12%", top: "48%" },
  },
};

function resolveRepairTarget(order, sample) {
  const diagnosisSample = order?.diagnosis_context?.current_sample || order?.diagnosis_context?.sample || {};
  const codes = [
    order?.alarm_code,
    order?.diagnosis_context?.alarm_code,
    diagnosisSample?.alarm_code,
    ...(Array.isArray(sample?.alarm_codes) ? sample.alarm_codes : []),
    sample?.alarm_code,
  ].map((value) => String(value || "").trim()).filter(Boolean);
  const alarmCode = codes.find((code) => repairTargetCatalog[code]) || codes[0] || "";
  const catalogTarget = repairTargetCatalog[alarmCode];
  const stored = order?.repair_target;
  const storedLooksPlaceholder = !stored || typeof stored !== "object"
    || ["待确认故障部件", "UNMAPPED-COMPONENT", "待补充"].includes(String(stored.part_name || stored.component || stored.part_no || ""));
  if (catalogTarget) {
    const supplemental = storedLooksPlaceholder ? {} : {
      cad_node_id: stored.cad_node_id,
      cad_node_name: stored.cad_node_name,
    };
    return { ...catalogTarget, ...supplemental, alarm_code: alarmCode };
  }
  if (!storedLooksPlaceholder) return { ...stored, alarm_code: alarmCode };
  return {
    alarm_code: alarmCode,
    component: "UNMAPPED-COMPONENT",
    part_no: "待补充",
    part_name: "待确认故障部件",
    system: "待确认",
    location: "CAD 组件树中人工确认",
    description: "当前报警已经进入工单，但还没有与具体 CAD 部件建立映射。维修人员需要先在组件树中确认目标。",
    relation: "暂无装配关系数据",
    symptom: order?.title || "设备异常",
    check: "查看报警定义、现场状态和 CAD 组件树",
    marker: { left: "50%", top: "50%" },
  };
}

function buildWorkorderTitle(latest, target, sample, snapshot) {
  const partName = target?.part_name && target.part_name !== "待确认故障部件" ? target.part_name : "设备";
  const alarmText = sample?.alarm_label || latest?.alarm_definition?.label || latest?.fault || latest?.summary;
  if (alarmText && !String(alarmText).includes("{")) return `${partName}${String(alarmText).includes("维修") ? "" : "维修"}`;
  return `${sample?.device_id || snapshot?.device_id || "设备"}${partName}维修`;
}

function buildRepairSteps(latest, target) {
  const recommendation = String(latest?.recommendation || "").trim();
  const dynamicSteps = recommendation
    ? recommendation.split(/[；;。\n]/).map((item) => item.trim()).filter(Boolean)
    : [];
  const targetStep = target?.check ? [`${target.check}，确认故障原因`] : [];
  return [...new Set([...sampleWorkorderSteps.slice(0, 2), ...targetStep, ...dynamicSteps, ...sampleWorkorderSteps.slice(2)])].slice(0, 7);
}

function normalizeWorkorderSteps(order, target) {
  const sourceSteps = Array.isArray(order?.steps) ? order.steps.filter(Boolean) : [];
  if (sourceSteps.length >= 3) return sourceSteps;
  return buildRepairSteps(order?.diagnosis_context || {}, target);
}

const quickQuestions = [
  "主轴温度过高怎么检查？",
  "报警 ALM-1001 的处理步骤是什么？",
  "振动异常时应该优先排查哪些部件？",
];

const sampleWorkorderSteps = [
  "停机、断电并执行挂牌上锁",
  "检查冷却液液位和入口过滤器",
  "检查故障部件是否堵塞、卡滞或过载",
  "测量电机电流、出口压力和相关反馈信号",
  "复位保护后空载复测，确认状态恢复正常",
];

const equipmentValueLabels = {
  closed: "已关闭",
  open: "已打开",
  locked: "已锁定",
  unlocked: "未锁定",
  released: "已释放",
  pressed: "已按下",
  running: "运行中",
  stopped: "已停止",
  ready: "已就绪",
  clamped: "已夹紧",
  referenced: "已回零",
  inhibited: "已禁止",
  overtemperature: "温度过高",
  pressure_low: "压力不足",
  rotation_timeout: "旋转超时",
  clamp_pressure_low: "夹紧压力不足",
  not_in_position: "未到位",
  movement_error: "动作异常",
  alarm: "报警",
  overload: "过载",
  high_pressure_low: "高压不足",
  vibration_high: "振动过高",
  fault_injection: "故障注入状态",
  processing: "加工中",
  fault: "故障停机",
  emergency_stop: "急停状态",
  paused: "已暂停",
};

const cycleStateLabels = {
  idle: "待机",
  ready: "准备就绪",
  running: "运行中",
  processing: "加工中",
  paused: "已暂停",
  stopped: "已停止",
  completed: "加工完成",
  fault: "故障停机",
  fault_injection: "故障注入状态",
  emergency_stop: "急停状态",
  offline: "离线",
};

function displayCycleState(sample) {
  return sample?.cycle_state_label || labelFor(cycleStateLabels, sample?.cycle_state) || "未知状态";
}

function displayAlarm(sample) {
  if (!sample) return "无";
  const code = sample.alarm_code || "";
  const label = sample.alarm_label || sample.alarm_description || "";
  if (code && label) return `${code} · ${label}`;
  return label || code || "无";
}

function displayToolName(item) {
  return labelFor(diagnosisEvidenceLabels, item?.name || item?.tool) || "诊断工具";
}

function displayToolSummary(item) {
  const result = item?.result || {};
  if (item?.name === "get_alarm_definition") return result.name || "已查询报警定义";
  if (item?.name === "get_device_history") return result.trend ? "已获取历史趋势" : "已获取历史采样";
  if (item?.name === "get_device_logs") return result.logs?.length ? `已获取 ${result.logs.length} 条设备日志` : "未发现可用设备日志";
  if (item?.name?.startsWith("search_")) return result.documents?.length ? `命中 ${result.documents.length} 条知识证据` : "未命中知识证据";
  return item?.success === false ? "工具执行失败" : "已完成取证";
}

function readableDiagnosisText(value) {
  return String(value || "")
    .replace(/\bcycle_state\b/gi, "设备运行状态")
    .replace(/\bfault_injection\b/gi, "故障注入状态")
    .replace(/\bAUTO\b/g, "自动运行")
    .replace(/\bvalidator_pass\b/g, "证据校验通过")
    .replace(/\bunknown\b/gi, "未知");
}

function diagnosisParagraphs(value) {
  const text = readableDiagnosisText(value).trim();
  if (!text) return [];
  return text
    .split(/(?<=[。！？；])\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function confidenceText(value) {
  if (value === null || value === undefined || value === "") return "--";
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function alarmLevelText(latest) {
  const definition = latest?.alarm_definition || {};
  const dictionaryLabel = definition.severity_label || definition.severity;
  if (dictionaryLabel && !["unknown", "未知"].includes(dictionaryLabel)) return dictionaryLabel;
  const match = String(latest?.summary || "").match(/报警等级(?:由[^，。]+)?升级为([^，。]+)/);
  return match?.[1] || "待确认";
}

function compactDiagnosisSummary(latest) {
  const raw = String(latest?.summary || "").trim();
  if (!raw) return "等待异常事件";
  const alarmCode = latest?.alarm_code
    || latest?.alarm_definition?.alarm_code
    || raw.match(/报警码\s*([A-Z0-9-]+)/i)?.[1]
    || "未知";
  const rule = raw.match(/触发规则为“([^”]+)”/)?.[1];
  const state = raw.match(/cycle_state\s*为“([^”]+)”/)?.[1];
  const health = raw.match(/健康评分\s*(\d+)/)?.[1];
  const conclusion = String(latest?.diagnosis || "")
    .match(/综合判断：(.+?)(?=；|。|$)/)?.[1];
  const parts = [`检测到报警 ${alarmCode}`];
  if (rule) parts.push(`触发规则：${rule}`);
  if (state) parts.push(`设备状态：${state}`);
  if (health) parts.push(`健康评分：${health}`);
  if (conclusion) parts.push(`当前判断：${conclusion}`);
  return readableDiagnosisText(`${parts.join("；")}。`);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `请求失败：${response.status}`);
  return body;
}

function normalizeWorkorderResponse(body) {
  if (body?.workorder && typeof body.workorder === "object") {
    return { ...body.workorder, dispatch_context: body.dispatch_context, candidates: body.candidates };
  }
  return body;
}

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("zh-CN", { hour12: false });
}

function labelFor(mapping, value) {
  return mapping[value] || value || "--";
}

function severityClass(status) {
  if (status === "fault") return "fault";
  if (status === "alarm") return "alarm";
  if (status === "warning") return "warning";
  return "normal";
}

function alertSeverity(alertLevel) {
  if (alertLevel === "high") return "fault";
  if (alertLevel === "intermediate") return "alarm";
  if (alertLevel === "initial") return "warning";
  return "normal";
}

function buildWorkshopMachines(snapshot) {
  const devices = snapshot?.devices?.length ? snapshot.devices : workshopMachines;
  return devices.map((device, index) => {
    const id = device.device_id || device.id;
    const fallback = machineFallbacks[id] || {};
    const position = defaultMachinePositions[index % defaultMachinePositions.length];
    const result = device.latest_result || snapshot?.latest_results?.[id] || (id === snapshot?.device_id ? snapshot?.latest_result : null);
    const sample = result?.current_sample || device.current_sample || null;
    return {
      id,
      name: device.name || fallback.name || id,
      line: fallback.line || device.line || "产线设备",
      deviceType: device.device_type || device.type || fallback.deviceType || "industrial_device",
      type: fallback.type || deviceTypeLabels[device.device_type || device.type] || device.device_type || device.type || "工业设备",
      area: deviceProfiles[device.device_type || device.type]?.area || fallback.line || device.line || "产线设备",
      flow: deviceProfiles[device.device_type || device.type]?.flow || "实时采集 → 规则判定 → Agent诊断",
      focus: deviceProfiles[device.device_type || device.type]?.focus || "关键指标与告警状态",
      x: fallback.x ?? device.x ?? position.x,
      y: fallback.y ?? device.y ?? position.y,
      live: device.live !== false,
      image: fallback.image || device.image,
      result,
      sample,
    };
  });
}

function observationLabel(item) {
  if (item.kind === "multi_metric") return kindLabels.multi_metric;
  return item.label || kindLabels[item.kind] || item.kind || "监测项";
}

function useMonitorSnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setSnapshot(await request("/api/monitor/snapshot"));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function control(action) {
    try {
      setSnapshot(await request("/api/monitor/control", {
        method: "POST",
        body: JSON.stringify({ action }),
      }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetStats() {
    try {
      setSnapshot(await request("/api/monitor/reset", {
        method: "POST",
        body: "{}",
      }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return { snapshot, error, control, resetStats };
}

function useMetricHistory(machines) {
  const [history, setHistory] = useState({});

  useEffect(() => {
    if (!machines.length) return;
    const timestamp = Date.now();
    setHistory((current) => {
      const next = { ...current };
      machines.forEach((machine) => {
        const sample = machine.sample;
        if (!sample) return;
        const metrics = sample.metrics || {};
        const profile = deviceProfiles[machine.deviceType];
        const metricKeys = (profile?.metrics || []).slice(0, 3).map(([key]) => key);
        const points = metricKeys.map((key) => ({ key, value: metrics[key] })).filter((item) => item.value !== null && item.value !== undefined);
        if (!points.length) return;
        next[machine.id] = [...(next[machine.id] || []), { timestamp, points }].slice(-30);
      });
      return next;
    });
  }, [machines]);

  return history;
}

function App() {
  const [activeView, setActiveView] = useState("monitor");
  const [toast, setToast] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState(workshopMachines[0].id);
  const [bigScreen, setBigScreen] = useState(false);
  const { snapshot, error, control, resetStats } = useMonitorSnapshot();
  const runner = snapshot?.runner || {};
  const machines = useMemo(() => buildWorkshopMachines(snapshot), [snapshot]);
  const metricHistory = useMetricHistory(machines);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const result = selectedMachine?.result || snapshot?.latest_result;
  const sample = result?.current_sample;
  const healthText = sample?.health_score === null || sample?.health_score === undefined
    ? "--"
    : `${Number(sample.health_score).toFixed(0)} / 100`;
  const connectionText = error || runner.last_error ? "接口异常" : "连接正常";

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    if (machines.length && !machines.some((machine) => machine.id === selectedMachineId)) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  return (
    <div className={`platform-shell ${bigScreen ? "big-screen" : ""}`}>
      {!bigScreen && <Sidebar activeView={activeView} onChange={setActiveView} connectionText={connectionText} hasError={Boolean(error || runner.last_error)} />}
      <main className="app-shell">
        <Topbar
          snapshot={snapshot}
          runner={runner}
          onControl={control}
          onReset={resetStats}
          bigScreen={bigScreen}
          onToggleBigScreen={() => setBigScreen((value) => !value)}
        />
        {(activeView === "monitor" || bigScreen) && (
          <MonitorCenter
            snapshot={snapshot}
            machines={machines}
            result={result}
            sample={sample}
            runner={runner}
            healthText={healthText}
            metricHistory={metricHistory}
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
          />
        )}
        {!bigScreen && activeView === "diagnosis" && <DiagnosisWorkspace snapshot={snapshot} />}
        {!bigScreen && activeView === "maintenance" && <MaintenanceWorkspace snapshot={snapshot} />}
        {!bigScreen && activeView === "workorder" && <WorkorderView snapshot={snapshot} sample={sample} onClosed={() => { showToast("工单已关闭"); setActiveView("monitor"); }} />}
        {!bigScreen && activeView === "rag" && <RagWorkspace snapshot={snapshot} sample={sample} />}
        {!bigScreen && activeView === "quality" && <QualityWorkspace snapshot={snapshot} sample={sample} />}
        {!bigScreen && activeView === "report" && <ReportWorkspace snapshot={snapshot} />}
        {!bigScreen && activeView === "trace" && <TraceWorkspace snapshot={snapshot} />}
        {toast && <div className="toast-message" role="status">{toast}</div>}
        {(error || runner.last_error) && <footer className="error-bar">{error || runner.last_error}</footer>}
      </main>
    </div>
  );
}

function Sidebar({ activeView, onChange, connectionText, hasError }) {
  return (
    <aside className="sidebar" aria-label="平台导航">
      <div className="brand-block">
        <span className="brand-mark">IA</span>
        <div>
          <strong>IND-Agent</strong>
          <span>工业智能平台</span>
        </div>
      </div>
      <nav className="side-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? "active" : ""}`}
            type="button"
            onClick={() => onChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <em>{item.badge}</em>}
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <span>平台状态</span>
        <strong className={hasError ? "bad" : ""}>{connectionText}</strong>
        <p>监控服务、诊断智能体和知识工具将统一汇入平台工作台。</p>
      </div>
    </aside>
  );
}

function Topbar({ snapshot, runner, onControl, onReset, bigScreen, onToggleBigScreen }) {
  const deviceCount = snapshot?.device_ids?.length || snapshot?.devices?.length || (snapshot?.device_id ? 1 : 0);
  const deviceLabel = `数据源：${snapshot?.data_source || "设备数据源"} · 接入 ${deviceCount || "--"} 台设备 · 在线监测`;
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">工业运营中台</span>
        <h1>智能制造统一工作台</h1>
        <p className="subline">{deviceLabel}</p>
        <AgentFlow snapshot={snapshot} />
      </div>
      <div className="toolbar">
        <label className="switch-control" title="开启或暂停自动监测">
          <input
            type="checkbox"
            checked={Boolean(runner.enabled)}
            onChange={(event) => onControl(event.target.checked ? "on" : "off")}
          />
          <span className="switch-track"><span className="switch-thumb" /></span>
          <span>{runner.enabled ? "监测开启" : "监测暂停"}</span>
        </label>
        <button className="button" type="button" onClick={onReset}>归零统计</button>
        <button className="button primary" type="button" onClick={onToggleBigScreen}>{bigScreen ? "退出大屏" : "进入大屏"}</button>
      </div>
    </header>
  );
}

function PlatformOverview() {
  return (
    <section className="platform-overview" aria-label="平台总览">
      <OverviewCard primary label="当前主线" value="监控中心" text="设备快照、异常判定和智能诊断实时联动。" />
      <OverviewCard label="工单闭环" value="已联动" text="异常诊断可转派维修工单，支持处理和验收流转。" />
      <OverviewCard label="知识中枢" value="已接入" text="手册、历史案例、报警码和SOP统一检索。" />
      <OverviewCard label="质检协同" value="已接入" text="工单恢复验证、经验沉淀和质量追溯联动。" />
    </section>
  );
}

function OverviewCard({ primary = false, label, value, text }) {
  return (
    <div className={`overview-card ${primary ? "primary" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}

function MonitorCenter({
  snapshot,
  machines,
  result,
  sample,
  runner,
  healthText,
  metricHistory,
  selectedMachineId,
  onSelectMachine,
}) {
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0] || workshopMachines[0];
  const isLiveMachine = Boolean(selectedMachine.live);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <section className="workspace-view active">
      <WorkshopMap
        machines={machines}
        selectedMachineId={selectedMachine.id}
        result={result}
        sample={sample}
        healthText={healthText}
        onSelectMachine={onSelectMachine}
      />
      <MachineDetailHeader machine={selectedMachine} isLiveMachine={isLiveMachine} sample={sample} result={result} healthText={healthText} onOpenDetail={() => setDetailOpen(true)} />
      {detailOpen && <MachineDetailDrawer machine={selectedMachine} result={result} sample={sample} history={metricHistory[selectedMachine.id] || []} onClose={() => setDetailOpen(false)} />}
      {isLiveMachine ? (
        <>
          <StatusStrip snapshot={snapshot} sample={sample} runner={runner} healthText={healthText} />
          <section className="main-grid">
            <MetricsPanel result={result} sample={sample} machine={selectedMachine} />
            <DecisionPanel snapshot={snapshot} result={result} />
          </section>
          <TrendPanel machine={selectedMachine} history={metricHistory[selectedMachine.id] || []} />
          <AlarmTimeline snapshot={snapshot} machines={machines} />
        </>
      ) : (
        <section className="panel machine-empty-panel">
          <span className="eyebrow">设备详情</span>
          <h2>该设备暂未接入实时采集</h2>
          <p>后续接入多设备监控接口后，这里会展示该机器的实时指标、规则判定和诊断结果。</p>
        </section>
      )}
    </section>
  );
}

function WorkshopMap({ machines, selectedMachineId, result, sample, healthText, onSelectMachine }) {
  const [viewMode, setViewMode] = useState("iso");
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const selectedStatus = machineStatus(selectedMachine, selectedMachine?.result || result);
  const connectedCount = machines.filter((machine) => machine.live).length;
  const onlineCount = connectedCount;
  const normalCount = machines.filter((machine) => machineStatus(machine, machine.result) === "normal").length;
  const faultCount = machines.filter((machine) => {
    const status = machineStatus(machine, machine.result);
    return status !== "normal" && status !== "idle";
  }).length;

  return (
    <section className="panel workshop-panel">
      <div className="factory-map" aria-label="车间设备分布图">
        <Machine3DScene
          machines={machines}
          selectedMachineId={selectedMachineId}
          status={selectedStatus}
          viewMode={viewMode}
          onSelect={(machineId) => onSelectMachine(machineId || selectedMachine?.id)}
        />
        <div className="scene-overlay">
          <div>
            <span className="eyebrow">车间总览</span>
            <h2>车间设备状态总览</h2>
          </div>
          <div className="map-legend" aria-label="状态图例">
            <span><i className="legend-dot normal" />正常</span>
            <span><i className="legend-dot warning" />预警</span>
            <span><i className="legend-dot fault" />故障</span>
          </div>
          <div className="scene-view-toggle" aria-label="视角切换">
            {[["iso", "等轴"], ["top", "俯视"], ["line", "产线"]].map(([id, label]) => (
              <button key={id} type="button" className={viewMode === id ? "active" : ""} onClick={() => setViewMode(id)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="scene-device-strip" aria-label="设备工位状态">
          {machines.map((machine) => {
            const localStatus = machineStatus(machine, machine.result);
            const health = formatHealthValue(machine.sample?.health_score);
            const leadMetric = leadMetricForMachine(machine);
            return (
              <button
                key={machine.id}
                type="button"
                className={`scene-device-chip ${localStatus} ${machine.id === selectedMachineId ? "active" : ""}`}
                onClick={() => onSelectMachine(machine.id)}
              >
                <span>{machine.area || machine.line}</span>
                <strong>{machine.name}</strong>
                <small>{leadMetric}</small>
                <em>{machineStatusLabel(localStatus)} · 健康度 {health}</em>
              </button>
            );
          })}
        </div>
        <div className="scene-control-hint">内部加工动画 · 拖动旋转 · 滚轮缩放</div>
      </div>
      <div className="map-summary">
        <div><span>接入设备</span><strong>{onlineCount} / {machines.length}</strong></div>
        <div><span>正常设备</span><strong>{normalCount}</strong></div>
        <div><span>异常设备</span><strong>{faultCount}</strong></div>
        <div><span>当前工位</span><strong>{selectedMachine?.area || "--"}</strong></div>
        <div><span>工艺流向</span><strong>{selectedMachine?.flow || "--"}</strong></div>
      </div>
    </section>
  );
}

function machineStatus(machine, result) {
  if (!machine?.live) return "idle";
  if (result?.status === "fault") return "fault";
  if (result?.status === "alarm") return "alarm";
  if (result?.status === "warning") return "warning";
  return "normal";
}

function machineStatusLabel(status) {
  if (status === "fault") return "故障";
  if (status === "alarm") return "报警";
  if (status === "warning") return "预警";
  if (status === "idle") return "未接入";
  return "正常";
}

function formatHealthValue(value) {
  if (value === null || value === undefined) return "--";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(0)}/100` : String(value);
}

function leadMetricForMachine(machine) {
  const metrics = machine?.sample?.metrics || {};
  const profile = deviceProfiles[machine?.deviceType];
  const preferred = profile?.metrics?.find(([key]) => metrics[key] !== null && metrics[key] !== undefined);
  if (!preferred) return machine?.focus || "等待实时采样";
  const [key, name, , unit] = preferred;
  return `${name} ${formatMetricValue(metrics[key])}${unit ? ` ${unit}` : ""}`;
}

function Machine3DScene({ machines = [], selectedMachineId, status, viewMode, onSelect }) {
  const mountRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const machinesRef = useRef(machines);
  const hoverTimerRef = useRef(null);
  const hoveredMachineRef = useRef(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const sceneMachineState = useMemo(
    () => machines.map((machine) => `${machine.id}:${machine.live ? 1 : 0}:${machineStatus(machine, machine.result)}:${machine.id === selectedMachineId ? 1 : 0}`).join("|"),
    [machines, selectedMachineId],
  );
  const sceneViewState = viewMode || "iso";

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    machinesRef.current = machines;
  }, [machines]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf3f6f4, 14, 52);

    const camera = new THREE.PerspectiveCamera(39, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const compactScene = mount.clientWidth < 600;
    if (compactScene) {
      camera.fov = 44;
      camera.updateProjectionMatrix();
    }
    camera.position.set(compactScene ? 12 : 8.2, compactScene ? 7 : 4.9, compactScene ? 22 : 9.6);
    camera.lookAt(.4, .75, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(.4, .75, 0);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.minDistance = 6.2;
    controls.maxDistance = compactScene ? 30 : 15.5;
    controls.minPolarAngle = Math.PI * .16;
    controls.maxPolarAngle = Math.PI * .49;
    controls.enablePan = true;
    controls.panSpeed = .55;
    controls.rotateSpeed = .55;
    controls.zoomSpeed = .72;
    const applyCameraView = (mode) => {
      if (mode === "top") {
        camera.position.set(0, compactScene ? 18 : 13, .1);
        controls.target.set(.2, 0, -.2);
        controls.enableRotate = false;
      } else if (mode === "line") {
        camera.position.set(compactScene ? 4 : 2.8, compactScene ? 5.6 : 3.8, compactScene ? 18 : 13.5);
        controls.target.set(.2, .55, .2);
        controls.enableRotate = true;
      } else {
        camera.position.set(compactScene ? 12 : 8.2, compactScene ? 7 : 4.9, compactScene ? 22 : 9.6);
        controls.target.set(.4, .75, 0);
        controls.enableRotate = true;
      }
      camera.lookAt(controls.target);
      controls.update();
    };
    applyCameraView(sceneViewState);

    const machineById = new Map(machinesRef.current.map((machine) => [machine.id, machine]));
    const getCurrentMachine = (id) => machinesRef.current.find((machine) => machine.id === id);
    const currentStatusForMachine = (id) => {
      const machine = getCurrentMachine(id);
      return machineStatus(machine, machine?.result);
    };
    const statusForMachine = (id) => machineStatus(machineById.get(id), machineById.get(id)?.result);
    const colorForMachine = (id) => statusColor(statusForMachine(id));
    const isSelectedMachine = (id) => id === selectedMachineId;
    const isAlertStatus = (localStatus) => {
      return localStatus === "fault" || localStatus === "alarm" || localStatus === "warning";
    };
    const labelForMachine = (id) => {
      const machine = getCurrentMachine(id);
      if (!machine) return null;
      const localStatus = currentStatusForMachine(id);
      return {
        id,
        name: machine.name || id,
        type: machine.type || "设备",
        status: localStatus,
        statusLabel: machineStatusLabel(localStatus),
      };
    };
    const accent = statusColor(status);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xcbd2d3, roughness: .42, metalness: .12 });
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xc4d3d0, roughness: .78, metalness: .01 });
    const areaMat = new THREE.MeshStandardMaterial({ color: 0xe0f1ee, roughness: .82, metalness: .02, transparent: true, opacity: .58 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd7dedf, roughness: .8, metalness: .04, side: THREE.DoubleSide });
    const safetyMat = new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: .58, metalness: .04 });
    const conveyorMat = new THREE.MeshStandardMaterial({ color: 0x405057, roughness: .6, metalness: .18 });
    const conveyorEdgeMat = new THREE.MeshStandardMaterial({ color: 0x687b80, roughness: .4, metalness: .5 });
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x647177, roughness: .72, metalness: .08 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b3338, roughness: .75, metalness: .05 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9d1d3, roughness: .43, metalness: .25 });
    const solidBodyMat = new THREE.MeshStandardMaterial({ color: 0x859399, roughness: .46, metalness: .32 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22272d, roughness: .7, metalness: .2, transparent: true, opacity: .86 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xb9bec2, roughness: .55, metalness: .12, transparent: true, opacity: .68 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x71969c, roughness: .12, metalness: .04, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
    const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .42, metalness: .12, emissive: accent, emissiveIntensity: .08 });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x95a0a5, roughness: .52, metalness: .28 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x49545a, roughness: .36, metalness: .45 });
    const rawMat = new THREE.MeshStandardMaterial({ color: 0xb7822a, roughness: .42, metalness: .22, emissive: 0x3a2300, emissiveIntensity: .05 });
    const cutMetalMat = new THREE.MeshStandardMaterial({ color: 0xcbd2d7, roughness: .32, metalness: .72 });
    const cutterMat = new THREE.MeshStandardMaterial({ color: 0x425059, roughness: .28, metalness: .78 });
    const chipMat = new THREE.MeshStandardMaterial({ color: 0xc3c9c9, roughness: .3, metalness: .82 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x263238, transparent: true, opacity: .42 });
    const hitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .001, depthWrite: false });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveObjects = [];
    const alertEffects = [];

    const registerMachineObject = (root, id, hitTarget) => {
      root.userData.machineId = id;
      root.traverse((object) => {
        object.userData.machineId = id;
      });
      if (hitTarget) interactiveObjects.push(hitTarget);
      return root;
    };

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.36;
    floor.receiveShadow = true;
    scene.add(floor);

    const addSceneBox = (size, position, material, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    addSceneBox([26, 2.6, .08], [0, .92, -7.2], wallMat);
    addSceneBox([.08, 2.25, 12.5], [-12.3, .78, -.6], wallMat);
    addSceneBox([.08, 2.25, 12.5], [12.3, .78, -.6], wallMat);
    addSceneBox([26, 2.25, .08], [0, .78, 7.2], new THREE.MeshStandardMaterial({ color: 0xe3e9e9, roughness: .8, transparent: true, opacity: .18, depthWrite: false }));
    addSceneBox([24, .08, .12], [0, 2.32, -6.95], roofMat);
    addSceneBox([.12, .08, 12], [-11.5, 2.16, -.8], roofMat);
    addSceneBox([.12, .08, 12], [11.5, 2.16, -.8], roofMat);

    addSceneBox([20, .035, 1.45], [0, -.31, 3.25], roadMat);
    addSceneBox([1.5, .035, 10.5], [-5.2, -.3, -.9], roadMat);
    addSceneBox([6.8, .012, .07], [0, -.32, 2.0], safetyMat);
    addSceneBox([6.8, .012, .07], [0, -.32, -1.95], safetyMat);
    addSceneBox([.07, .012, 3.95], [-3.4, -.32, .02], safetyMat);
    addSceneBox([.07, .012, 3.95], [3.4, -.32, .02], safetyMat);
    const aisleMat = new THREE.MeshStandardMaterial({ color: 0xe8ebeb, roughness: .55 });
    addSceneBox([17, .012, .045], [0, -.31, 2.52], aisleMat);
    addSceneBox([17, .012, .045], [0, -.31, 3.92], aisleMat);

    const addConveyor = (size, position, rotation = [0, 0, 0], edgeNormal = new THREE.Vector3(0, 0, 1)) => {
      addSceneBox(size, position, conveyorMat, rotation);
      addSceneBox(
        [size[0], .035, .08],
        [position[0] - edgeNormal.x * size[2] / 2, position[1] + .06, position[2] - edgeNormal.z * size[2] / 2],
        conveyorEdgeMat,
        rotation,
      );
      addSceneBox(
        [size[0], .035, .08],
        [position[0] + edgeNormal.x * size[2] / 2, position[1] + .06, position[2] + edgeNormal.z * size[2] / 2],
        conveyorEdgeMat,
        rotation,
      );
    };

    const conveyorRollers = [];
    const conveyorFlights = [];
    const yAxis = new THREE.Vector3(0, 1, 0);
    const addConveyorSegment = (start, end, width = .52, flightCount = 6) => {
      const from = new THREE.Vector3(start[0], -.08, start[1]);
      const to = new THREE.Vector3(end[0], -.08, end[1]);
      const delta = new THREE.Vector3().subVectors(to, from);
      const length = delta.length();
      const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(.5);
      const yaw = Math.atan2(delta.x, delta.z);
      const rotation = [0, yaw - Math.PI / 2, 0];

      const direction = delta.clone().normalize();
      const normal = new THREE.Vector3(-direction.z, 0, direction.x);
      addConveyor([length, .13, width], [center.x, center.y, center.z], rotation, normal);
      const rollerCount = Math.max(3, Math.round(length / .27));
      for (let index = 0; index <= rollerCount; index += 1) {
        const t = index / rollerCount;
        const point = from.clone().lerp(to, t);
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, width + .1, 16), railMat);
        roller.position.set(point.x, .03, point.z);
        roller.quaternion.setFromUnitVectors(yAxis, normal);
        scene.add(roller);
        conveyorRollers.push(roller);
      }

      for (let index = 0; index < flightCount; index += 1) {
        const flight = new THREE.Mesh(new THREE.BoxGeometry(.08, .035, width + .06), railMat);
        flight.userData.offset = index / flightCount;
        flight.quaternion.setFromAxisAngle(yAxis, yaw - Math.PI / 2);
        flight.castShadow = true;
        scene.add(flight);
        conveyorFlights.push({ mesh: flight, start: from, end: to });
      }
    };

    // 原料停在送料机处，成品通过独立输送线离开。
    addConveyorSegment([-5.68, 2.45], [-5.68, .72], .55, 0);
    addConveyorSegment([2.45, 1.12], [4.85, 1.12], .55, 0);

    addSceneBox([1.45, .42, .75], [-6.15, -.08, -4.95], blockMat);
    addSceneBox([1.55, .13, .85], [-6.15, .22, -4.95], roofMat);
    addSceneBox([1.35, .38, .72], [6.05, -.08, -4.8], blockMat);
    addSceneBox([1.45, .12, .82], [6.05, .18, -4.8], roofMat);
    const fenceFrameMat = new THREE.MeshStandardMaterial({ color: 0x596970, roughness: .46, metalness: .55 });
    const fenceGlassMat = new THREE.MeshStandardMaterial({ color: 0x9bbfc4, roughness: .14, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide });
    for (const x of [-3.25, -1.65, -.05, 1.55, 3.15]) {
      addSceneBox([.055, 1.18, .055], [x, .31, -2.25], fenceFrameMat);
    }
    for (let i = 0; i < 4; i += 1) {
      const x = -2.45 + i * 1.6;
      addSceneBox([1.54, .98, .018], [x, .32, -2.25], fenceGlassMat);
      addSceneBox([1.54, .035, .05], [x, .87, -2.25], fenceFrameMat);
      addSceneBox([1.54, .035, .05], [x, -.21, -2.25], fenceFrameMat);
    }
    addSceneBox([.07, 1.04, .07], [1.75, .31, -2.19], safetyMat);
    for (const x of [-8.9, 8.9]) {
      addSceneBox([.85, 1.65, .62], [x, .5, -4.6], solidBodyMat);
      addSceneBox([.62, .35, .025], [x, .95, -4.27], darkMat);
      for (let i = 0; i < 5; i += 1) addSceneBox([.48, .014, .015], [x, .15 + i * .055, -4.27], railMat);
    }

    for (let index = 0; index < 10; index += 1) {
      const x = index % 2 === 0 ? -10.8 : 10.8;
      const z = -5.7 + Math.floor(index / 2) * 2.8;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 12), blockMat);
      column.position.set(x, .92, z);
      column.castShadow = true;
      scene.add(column);
    }

    const addMachineHalo = (id, position, radius = 1.45) => {
      const color = colorForMachine(id);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, .024, 6, 56),
        new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: isSelectedMachine(id) ? .72 : .24,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position[0], -.28, position[2]);
      scene.add(ring);
      return ring;
    };

    const addMachineAlert = (id, position, radius = 1.45) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius + .13, .035, 6, 56),
        new THREE.MeshStandardMaterial({
          color: 0xd91f1f,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position[0], -.27, position[2]);
      ring.visible = false;
      scene.add(ring);

      const glow = new THREE.PointLight(0xff2d2d, 0, 4.2);
      glow.position.set(position[0], 1.35, position[2]);
      scene.add(glow);
      alertEffects.push({ id, ring, glow });
      return { ring, glow };
    };

    const towerLamps = [];
    const addTowerLamp = (id, x, y, z) => {
      addSceneBox([.08, .28, .08], [x, y - .16, z], railMat);
      const lamps = [0xb83436, 0xe6a729, 0x36977f].map((color, index) => {
        const material = new THREE.MeshStandardMaterial({ color, roughness: .3, emissive: color, emissiveIntensity: .06 });
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(.083, .083, .09, 20), material);
        lens.position.set(x, y + index * .095, z);
        scene.add(lens);
        return material;
      });
      towerLamps.push({ id, lamps });
    };

    const addBarFeeder = () => {
      const id = "LNS-QL-SERVO-80-S2-001";
      const color = colorForMachine(id);
      const accentLocal = new THREE.MeshStandardMaterial({ color, roughness: .4, metalness: .12, emissive: color, emissiveIntensity: isSelectedMachine(id) ? .16 : .05 });
      const feederWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ec, roughness: .56, metalness: .08 });
      const feederPanelMat = new THREE.MeshStandardMaterial({ color: 0xcfd5d8, roughness: .5, metalness: .12 });
      const feederGlassMat = new THREE.MeshStandardMaterial({ color: 0x9eb9c0, roughness: .2, metalness: .04, transparent: true, opacity: .42, side: THREE.DoubleSide });
      const feederGroup = new THREE.Group();
      const feederRollers = [];
      feederGroup.position.set(-4.15, .12, .13);
      feederGroup.rotation.y = 0;
      feederGroup.scale.set(.86, .86, .86);
      scene.add(feederGroup);
      addMachineHalo(id, [feederGroup.position.x, feederGroup.position.y, feederGroup.position.z], 1.5);
      addMachineAlert(id, [feederGroup.position.x, feederGroup.position.y, feederGroup.position.z], 1.5);
      addTowerLamp(id, -3.9, 1.7, .1);

      const addFeederBox = (size, position, material, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        feederGroup.add(mesh);
        return mesh;
      };

      const addFeederCylinder = (radius, length, position, material, rotation = [0, 0, 0], segments = 24) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        feederGroup.add(mesh);
        return mesh;
      };

      const addTubeBetween = (start, end, radius, material) => {
        const from = new THREE.Vector3(...start);
        const to = new THREE.Vector3(...end);
        const direction = new THREE.Vector3().subVectors(to, from);
        const length = direction.length();
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), material);
        mesh.position.copy(from.add(to).multiplyScalar(.5));
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        feederGroup.add(mesh);
        return mesh;
      };

      addFeederBox([4.3, .08, 1.08], [0, .06, 0], railMat);
      addFeederBox([4.05, .08, .1], [0, .18, -.48], darkMat);
      addFeederBox([4.05, .08, .1], [0, .18, .48], darkMat);
      addFeederBox([.18, .16, .24], [-1.92, .13, -.48], darkMat);
      addFeederBox([.18, .16, .24], [-1.92, .13, .48], darkMat);
      addFeederBox([.18, .16, .24], [1.92, .13, -.48], darkMat);
      addFeederBox([.18, .16, .24], [1.92, .13, .48], darkMat);

      addFeederBox([1.05, .78, .82], [-.35, .55, .03], feederPanelMat);
      addFeederBox([.86, .52, .06], [-.35, .58, .46], feederWhiteMat);
      addFeederBox([.5, .08, .08], [-.35, .9, .5], accentLocal);
      addFeederBox([.42, .18, .04], [-.35, .46, .5], darkMat);

      addTubeBetween([-1.45, .16, -.42], [-.82, .88, -.2], .035, railMat);
      addTubeBetween([1.45, .16, -.42], [.82, .88, -.2], .035, railMat);
      addTubeBetween([-1.45, .16, .42], [-.82, .88, .2], .035, railMat);
      addTubeBetween([1.45, .16, .42], [.82, .88, .2], .035, railMat);

      addFeederBox([4.1, .24, .72], [0, 1.02, 0], feederWhiteMat);
      addFeederBox([4.28, .14, .84], [0, 1.2, 0], feederPanelMat);
      addFeederBox([.34, .74, .84], [-2.0, .9, 0], feederPanelMat);
      addFeederBox([.34, .66, .84], [2.0, .86, 0], feederPanelMat);
      addFeederBox([3.75, .08, .64], [0, 1.37, -.18], feederWhiteMat, [-.18, 0, 0]);
      addFeederBox([1.05, .055, .34], [-.82, 1.45, -.36], feederGlassMat, [-.18, 0, 0]);
      addFeederBox([1.05, .055, .34], [.82, 1.45, -.36], feederGlassMat, [-.18, 0, 0]);
      addFeederBox([4.08, .08, .12], [0, 1.31, .46], darkMat);
      for (const x of [-1.5, -.5, .5, 1.5]) {
        addFeederBox([.025, .18, .012], [x, 1.08, .435], railMat);
      }
      for (const x of [-1.55, 1.55]) {
        addFeederBox([.18, .62, .55], [x, -.28, 0], feederPanelMat);
        addFeederBox([.38, .07, .65], [x, -.61, 0], railMat);
      }
      for (let i = 0; i < 8; i += 1) {
        addFeederBox([.016, .14, .012], [-.58 + i * .065, .55, .502], railMat);
      }
      addFeederBox([.42, .18, .012], [.35, .6, .504], darkMat);
      addFeederBox([.22, .045, .014], [.35, .6, .514], accentLocal);

      addFeederBox([3.85, .09, .24], [.18, .88, .43], conveyorMat);
      addFeederCylinder(.09, 4.25, [.18, .94, .55], conveyorMat, [0, 0, Math.PI / 2], 32);
      addFeederCylinder(.045, 4.0, [.08, 1.03, .43], rawMat, [0, 0, Math.PI / 2], 24);
      const pusher = addFeederBox([.18, .16, .28], [-1.72, 1.03, .55], accentLocal);
      addFeederBox([1.05, .09, .18], [1.28, 1.02, .58], accentLocal);
      addFeederBox([.42, .18, .24], [2.1, .96, .55], darkMat);

      addFeederBox([3.35, .055, .06], [0, .78, -.35], railMat);
      addFeederBox([3.35, .055, .06], [0, .78, .35], railMat);

      for (let index = 0; index < 8; index += 1) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .78, 18), railMat);
        roller.position.set(-1.45 + index * .42, .82, 0);
        roller.rotation.x = Math.PI / 2;
        roller.castShadow = true;
        feederGroup.add(roller);
        feederRollers.push(roller);
      }

      for (let index = 0; index < 4; index += 1) {
        const wheelX = index < 2 ? -1.82 : 1.82;
        const wheelZ = index % 2 === 0 ? -.55 : .55;
        addFeederCylinder(.09, .08, [wheelX, .04, wheelZ], darkMat, [Math.PI / 2, 0, 0], 20);
      }

      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(4.7, 1.6, 1.3), hitMat);
      hitBox.position.set(0, .78, .02);
      feederGroup.add(hitBox);
      registerMachineObject(feederGroup, id, hitBox);
      return { feederGroup, feederRollers, pusher };
    };

    const addRobotCell = () => {
      const id = "ELITE-CS612-ROBOT-001";
      const color = colorForMachine(id);
      const accentLocal = new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .16, emissive: color, emissiveIntensity: isSelectedMachine(id) ? .18 : .06 });
      const robotShellMat = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: .34, metalness: .08 });
      const robotArmMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, roughness: .24, metalness: .62 });
      const robotBandMat = new THREE.MeshStandardMaterial({ color: 0x172b68, roughness: .28, metalness: .2 });
      const robotDarkMat = new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: .42, metalness: .4 });
      const robotGroup = new THREE.Group();
      robotGroup.position.set(5.15, -.25, -.35);
      scene.add(robotGroup);
      addMachineHalo(id, [robotGroup.position.x, robotGroup.position.y, robotGroup.position.z], 1.28);
      addMachineAlert(id, [robotGroup.position.x, robotGroup.position.y, robotGroup.position.z], 1.28);
      addTowerLamp(id, 5.15, 1.42, -.35);

      const addRobotCylinder = (radius, length, position, material, rotation = [0, 0, 0], segments = 40) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        robotGroup.add(mesh);
        return mesh;
      };

      const addRobotBox = (size, position, material, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        robotGroup.add(mesh);
        return mesh;
      };

      const addJoint = (radius, material) => {
        const joint = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .26, 32), material);
        shell.rotation.x = Math.PI / 2;
        shell.castShadow = true;
        joint.add(shell);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * .79, radius * .79, .028, 32), robotBandMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.z = .145;
        joint.add(cap);
        joint.castShadow = true;
        robotGroup.add(joint);
        return joint;
      };
      const addLink = (radius, length, material) => {
        const link = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * .94, length, 24), material);
        link.castShadow = true;
        robotGroup.add(link);
        return link;
      };
      addRobotCylinder(.45, .08, [0, .05, 0], robotDarkMat);
      addRobotCylinder(.31, .32, [0, .27, 0], robotShellMat);
      addRobotCylinder(.32, .045, [0, .46, 0], robotBandMat);
      addRobotBox([.22, .1, .1], [.28, .12, 0], robotDarkMat);
      const shoulderJoint = addJoint(.26, robotShellMat);
      const elbowJoint = addJoint(.23, robotShellMat);
      const wristJoint = addJoint(.17, robotShellMat);
      const upperLink = addLink(.145, 1.14, robotArmMat);
      const foreLink = addLink(.12, 1.14, robotArmMat);
      const wristBand = addLink(.175, .05, robotBandMat);
      const attachedTool = new THREE.Group();
      robotGroup.add(attachedTool);
      const toolFlange = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 24), robotDarkMat);
      attachedTool.add(toolFlange);
      const gripperBody = new THREE.Mesh(new THREE.BoxGeometry(.28, .1, .2), robotDarkMat);
      gripperBody.position.y = -.1;
      attachedTool.add(gripperBody);
      const makeFinger = (z) => {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(.055, .26, .05), robotArmMat);
        finger.position.set(0, -.25, z);
        attachedTool.add(finger);
        return finger;
      };
      const attachedFingerA = makeFinger(.13);
      const attachedFingerB = makeFinger(-.13);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .28, 12), robotDarkMat);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(.29, .14, 0);
      robotGroup.add(cable);
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.2, 2.2), hitMat);
      hitBox.position.set(.72, 1.0, 0);
      robotGroup.add(hitBox);
      registerMachineObject(robotGroup, id, hitBox);
      return {
        robotGroup,
        shoulderJoint,
        elbowJoint,
        wristJoint,
        upperLink,
        foreLink,
        wristBand,
        toolCarrier: attachedTool,
        fingerA: attachedFingerA,
        fingerB: attachedFingerB,
      };
    };

    const feederCell = addBarFeeder();
    const robotCell = addRobotCell();

    const group = new THREE.Group();
    group.position.set(.05, -.1, -.08);
    group.rotation.y = 0;
    group.scale.set(.82, .82, .82);
    scene.add(group);

    const addBox = (name, size, position, material, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      edges.scale.copy(mesh.scale);
      group.add(edges);
      return mesh;
    };

    addBox("machine-base", [4.65, .52, 1.68], [0, .28, 0], darkMat);
    addBox("left-headstock-cabinet", [1.08, 1.88, 1.66], [-1.78, 1.4, 0], darkMat);
    addBox("transparent-main-shell", [3.35, 1.78, 1.58], [-.15, 1.4, 0], bodyMat);
    addBox("rear-column", [.45, 1.95, 1.58], [-2.2, 1.44, 0], solidBodyMat);
    const machineDoor = new THREE.Group();
    machineDoor.position.set(-1.62, 1.42, .89);
    group.add(machineDoor);
    const doorBox = (size, position, material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      machineDoor.add(mesh);
      return mesh;
    };
    doorBox([1.68, 1.18, .025], [.9, 0, 0], glassMat);
    doorBox([1.8, .075, .08], [.9, .64, 0], solidBodyMat);
    doorBox([1.8, .075, .08], [.9, -.64, 0], solidBodyMat);
    doorBox([.075, 1.3, .08], [.04, 0, 0], solidBodyMat);
    doorBox([.075, 1.3, .08], [1.76, 0, 0], solidBodyMat);
    doorBox([.075, .32, .075], [1.65, -.06, .09], railMat);
    addBox("right-slanted-cover", [.86, 1.56, 1.5], [1.32, 1.38, .04], bodyMat, [0, 0, -0.18]);
    addBox("control-panel", [.45, 1.22, .18], [1.98, 1.5, .78], darkMat, [0, 0, -0.24]);
    addBox("top-service-rail", [3.12, .16, 1.34], [-.24, 2.28, 0], darkMat);
    addBox("status-strip", [1.82, .06, .08], [-.42, 2.39, .7], accentMat);
    addBox("chip-conveyor-neck", [1.12, .28, .34], [2.38, 1.0, .22], darkMat, [0, 0, .4]);
    addBox("chip-bin", [.7, .58, .7], [3.0, .76, .22], bodyMat);
    addBox("front-service-panel", [2.68, .5, .08], [-.36, .58, .86], lightMat);
    for (let i = 0; i < 9; i += 1) addBox("cabinet-vent", [.23, .018, .014], [1.34, 1.9 - i * .06, .83], railMat);
    for (let i = 0; i < 6; i += 1) addBox("panel-key", [.035, .035, .018], [1.94 + (i % 2) * .09, 1.95 - Math.floor(i / 2) * .1, .89], lightMat);
    addBox("panel-screen", [.27, .24, .025], [1.97, 1.66, .9], glassMat);
    addBox("nameplate", [.46, .12, .02], [-1.8, 1.9, .85], railMat);
    addBox("left-foot", [.25, .5, .22], [-1.85, -.02, .56], darkMat);
    addBox("right-foot", [.25, .5, .22], [1.55, -.02, .56], darkMat);

    addBox("inner-bed", [2.45, .18, .46], [-.35, 1.02, .4], innerMat);
    addBox("linear-guide-left", [2.35, .055, .055], [-.32, 1.16, .22], railMat);
    addBox("linear-guide-right", [2.35, .055, .055], [-.32, 1.16, .58], railMat);
    addBox("tailstock-shadow", [.42, .44, .5], [.9, 1.26, .38], innerMat);

    const spindleChuck = new THREE.Group();
    spindleChuck.name = "spindleChuck";
    spindleChuck.position.set(-1.12, 1.36, .78);
    group.add(spindleChuck);

    const chuckBody = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .22, 48), railMat);
    chuckBody.rotation.z = Math.PI / 2;
    chuckBody.castShadow = true;
    spindleChuck.add(chuckBody);

    const chuckFace = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .04, 48), accentMat);
    chuckFace.position.x = .13;
    chuckFace.rotation.z = Math.PI / 2;
    spindleChuck.add(chuckFace);

    for (let index = 0; index < 3; index += 1) {
      const angle = index * (Math.PI * 2 / 3);
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(.16, .06, .24), cutterMat);
      jaw.position.set(.17, Math.cos(angle) * .16, Math.sin(angle) * .16);
      jaw.rotation.x = angle;
      jaw.castShadow = true;
      spindleChuck.add(jaw);
    }

    const machiningWorkpiece = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .88, 48), cutMetalMat);
    machiningWorkpiece.name = "machiningWorkpiece";
    machiningWorkpiece.position.x = .48;
    machiningWorkpiece.rotation.z = Math.PI / 2;
    machiningWorkpiece.castShadow = true;
    spindleChuck.add(machiningWorkpiece);

    const toolSlide = new THREE.Group();
    toolSlide.name = "toolSlide";
    toolSlide.position.set(.32, 1.27, .55);
    group.add(toolSlide);

    const toolCarriage = new THREE.Mesh(new THREE.BoxGeometry(.56, .34, .42), innerMat);
    toolCarriage.castShadow = true;
    toolSlide.add(toolCarriage);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .25, 8), railMat);
    turret.rotation.x = Math.PI / 2;
    turret.position.set(-.05, .08, .24);
    turret.castShadow = true;
    toolSlide.add(turret);

    const cutter = new THREE.Mesh(new THREE.ConeGeometry(.06, .34, 4), cutterMat);
    cutter.name = "cutterTip";
    cutter.position.set(-.33, .08, .24);
    cutter.rotation.z = Math.PI / 2;
    cutter.rotation.y = Math.PI / 4;
    cutter.castShadow = true;
    toolSlide.add(cutter);

    const cutterGlow = new THREE.PointLight(0xffc05a, .9, 1.3);
    cutterGlow.name = "cuttingGlow";
    cutterGlow.position.set(-.45, .08, .24);
    toolSlide.add(cutterGlow);

    const loadingArm = new THREE.Group();
    loadingArm.name = "loadingArm";
    loadingArm.position.set(-2.02, 1.62, .62);
    group.add(loadingArm);
    const armRail = new THREE.Mesh(new THREE.BoxGeometry(.08, .72, .08), railMat);
    armRail.castShadow = true;
    loadingArm.add(armRail);
    const armFingerA = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .38), cutterMat);
    armFingerA.position.set(.18, -.33, .12);
    loadingArm.add(armFingerA);
    const armFingerB = armFingerA.clone();
    armFingerB.position.z = -.12;
    loadingArm.add(armFingerB);

    addTowerLamp("TRAK-TC820LTYSI-001", -1.35, 2.05, -.08);
    // 送料管和出料滑槽共用机床轴线，但分别服务两端。
    addSceneBox([1.2, .12, .17], [-1.93, .98, .56], railMat);
    addSceneBox([1.1, .055, .27], [2.37, .31, 1.02], innerMat, [0, 0, -.16]);
    addSceneBox([.09, .14, .28], [2.82, .28, 1.02], railMat);

    const createRawPart = (offset) => {
      const part = new THREE.Group();
      part.userData.offset = offset;
      part.name = "rawBarStock";
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .66, 32), rawMat);
      bar.rotation.z = Math.PI / 2;
      bar.castShadow = true;
      part.add(bar);
      const end = new THREE.Mesh(new THREE.CylinderGeometry(.115, .115, .025, 32), darkMat);
      end.position.x = -.35;
      end.rotation.z = Math.PI / 2;
      part.add(end);
      scene.add(part);
      return part;
    };

    const createScrewPart = (offset = 0, material = cutMetalMat) => {
      const part = new THREE.Group();
      part.userData.offset = offset;
      part.name = "screwPart";
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .42, 32), material);
      body.rotation.z = Math.PI / 2;
      body.castShadow = true;
      part.add(body);

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .08, 32), material);
      collar.position.x = -.23;
      collar.rotation.z = Math.PI / 2;
      collar.castShadow = true;
      part.add(collar);

      const slot = new THREE.Mesh(new THREE.BoxGeometry(.018, .13, .018), darkMat);
      slot.position.x = -.275;
      slot.castShadow = true;
      part.add(slot);

      scene.add(part);
      return part;
    };

    const createFinishedPart = (offset) => {
      const part = createScrewPart(offset);
      part.name = "finishedParts";
      const bore = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .44, 24), darkMat);
      bore.rotation.z = Math.PI / 2;
      bore.scale.set(1, 1, 1);
      part.add(bore);
      return part;
    };

    const rawParts = [createRawPart(0), createRawPart(.48)];
    const finishedParts = [createFinishedPart(.05), createFinishedPart(.34), createFinishedPart(.68)];
    const carriedScrew = createScrewPart(0, cutMetalMat);
    if (robotCell?.toolCarrier) {
      robotCell.toolCarrier.add(carriedScrew);
      carriedScrew.position.set(0, -.35, 0);
      carriedScrew.rotation.set(0, 0, 0);
      carriedScrew.scale.setScalar(.78);
      carriedScrew.visible = false;
    }

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x566978, roughness: .6, metalness: .22 });
    const boxPosition = new THREE.Vector3(5.9, -.16, .45);
    addSceneBox([1.05, .12, .82], [boxPosition.x, boxPosition.y, boxPosition.z], boxMat);
    addSceneBox([1.05, .48, .08], [boxPosition.x, boxPosition.y + .24, boxPosition.z - .41], boxMat);
    addSceneBox([1.05, .48, .08], [boxPosition.x, boxPosition.y + .24, boxPosition.z + .41], boxMat);
    addSceneBox([.08, .48, .82], [boxPosition.x - .52, boxPosition.y + .24, boxPosition.z], boxMat);
    addSceneBox([.08, .48, .82], [boxPosition.x + .52, boxPosition.y + .24, boxPosition.z], boxMat);
    for (const x of [boxPosition.x - .36, boxPosition.x, boxPosition.x + .36]) {
      addSceneBox([.035, .42, .03], [x, boxPosition.y + .24, boxPosition.z + .44], railMat);
    }
    for (const side of [-1, 1]) {
      addSceneBox([.1, .1, .25], [boxPosition.x + side * .55, boxPosition.y + .3, boxPosition.z], railMat);
    }
    addSceneBox([.3, .15, .014], [boxPosition.x, boxPosition.y + .25, boxPosition.z + .455], lightMat);

    const boxedScrews = Array.from({ length: 9 }, (_, index) => {
      const screw = createScrewPart(index / 9, cutMetalMat);
      screw.position.set(
        boxPosition.x - .28 + (index % 3) * .22,
        boxPosition.y + .16 + Math.floor(index / 3) * .035,
        boxPosition.z - .2 + Math.floor(index / 3) * .18,
      );
      screw.rotation.set(0, 0, 0);
      screw.scale.setScalar(.72);
      return screw;
    });

    const chips = Array.from({ length: 18 }, (_, index) => {
      const spark = index < 3;
      const material = spark ? new THREE.MeshBasicMaterial({ color: 0xffba63 }) : chipMat;
      const chip = new THREE.Mesh(new THREE.TorusGeometry(spark ? .01 : .033, spark ? .004 : .008, 4, 10, Math.PI * 1.3), material);
      chip.userData.offset = index / 18;
      chip.castShadow = true;
      group.add(chip);
      return chip;
    });

    addMachineHalo("TRAK-TC820LTYSI-001", [group.position.x, group.position.y, group.position.z], 2.05);
    addMachineAlert("TRAK-TC820LTYSI-001", [group.position.x, group.position.y, group.position.z], 2.05);
    const machineHitBox = new THREE.Mesh(new THREE.BoxGeometry(5.1, 2.8, 2.3), hitMat);
    machineHitBox.position.set(.08, 1.15, .05);
    group.add(machineHitBox);
    registerMachineObject(group, "TRAK-TC820LTYSI-001", machineHitBox);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xb8c5c9, 1.4);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, .9);
    rim.position.set(-3, 2.5, -2);
    scene.add(rim);

    const toolHomePosition = new THREE.Vector3(0, 1.35, .48);
    const toolPickHoverPosition = new THREE.Vector3(-.45, 1.12, 1.47);
    const toolPickPosition = new THREE.Vector3(-.45, .7, 1.47);
    const toolLiftPosition = new THREE.Vector3(.1, 1.42, 1.12);
    const toolBoxHoverPosition = new THREE.Vector3(.75, 1.14, .8);
    const toolBoxDropPosition = new THREE.Vector3(.75, .8, .8);
    const handoffScrew = finishedParts[0];
    const tempA = new THREE.Vector3();
    const tempB = new THREE.Vector3();
    const tempC = new THREE.Vector3();
    const tempD = new THREE.Vector3();
    const buildMotionPath = (points) => {
      const segments = [];
      let total = 0;
      for (let index = 0; index < points.length - 1; index += 1) {
        const from = points[index];
        const to = points[index + 1];
        const length = from.distanceTo(to);
        segments.push({ from, to, length });
        total += length;
      }
      return { segments, total };
    };
    const rawMotionPath = buildMotionPath([
      new THREE.Vector3(-5.68, .08, 2.45),
      new THREE.Vector3(-5.68, .08, .72),
    ]);
    const finishedMotionPath = buildMotionPath([
      new THREE.Vector3(2.45, .08, 1.12),
      new THREE.Vector3(4.7, .08, 1.12),
    ]);
    const pointOnMotionPath = (path, progress, target) => {
      let distance = Math.max(0, Math.min(1, progress)) * path.total;
      for (const segment of path.segments) {
        if (distance <= segment.length) {
          return target.copy(segment.from).lerp(segment.to, segment.length ? distance / segment.length : 0);
        }
        distance -= segment.length;
      }
      const lastSegment = path.segments[path.segments.length - 1];
      return target.copy(lastSegment.to);
    };

    const moveBetween = (from, to, progress) => tempA.copy(from).lerp(to, progress);
    const moveOverArc = (from, via, to, progress) => {
      tempB.copy(from).lerp(via, progress);
      tempC.copy(via).lerp(to, progress);
      return tempA.copy(tempB).lerp(tempC, progress);
    };
    const easeInOut = (value) => value * value * (3 - 2 * value);
    const handoffPickWorld = new THREE.Vector3(4.7, .08, 1.12);
    const armUp = new THREE.Vector3(0, 1, 0);
    const shoulderPoint = new THREE.Vector3(0, .7, 0);
    const armAxis = new THREE.Vector3(0, 1, 0);
    const elbowPoint = new THREE.Vector3();
    const armDirection = new THREE.Vector3();
    const bendDirection = new THREE.Vector3();
    const placeArmLink = (mesh, start, end, length) => {
      mesh.position.copy(start).add(end).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(armAxis, tempD.copy(end).sub(start).normalize());
      mesh.scale.y = start.distanceTo(end) / length;
    };
    const poseRobot = (target) => {
      const distance = Math.min(2.26, Math.max(.01, armDirection.copy(target).sub(shoulderPoint).length()));
      armDirection.normalize();
      bendDirection.copy(armUp).addScaledVector(armDirection, -armUp.dot(armDirection)).normalize();
      if (bendDirection.lengthSq() < .001) bendDirection.set(0, 0, 1);
      const height = Math.sqrt(Math.max(0, 1.14 * 1.14 - distance * distance / 4));
      elbowPoint.copy(shoulderPoint).addScaledVector(armDirection, distance / 2).addScaledVector(bendDirection, height);
      robotCell.shoulderJoint.position.copy(shoulderPoint);
      robotCell.elbowJoint.position.copy(elbowPoint);
      robotCell.wristJoint.position.copy(target);
      placeArmLink(robotCell.upperLink, shoulderPoint, elbowPoint, 1.14);
      placeArmLink(robotCell.foreLink, elbowPoint, target, 1.14);
      robotCell.wristBand.position.copy(target).addScaledVector(armUp, -.12);
      robotCell.toolCarrier.position.copy(target);
    };

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      const cutCycle = (Math.sin(time * 1.05) + 1) / 2;
      const lineCycle = (time * .18) % 1;
      const robotCycle = (time % 6) / 6;

      const machining = robotCycle < .62;
      spindleChuck.rotation.x = machining ? time * 8.6 : 0;
      machiningWorkpiece.rotation.x = 0;
      toolSlide.position.x = machining ? .22 + Math.sin(time * .92) * .22 : .48;
      toolSlide.position.z = machining ? .48 + Math.sin(time * 1.45) * .08 : .55;
      turret.rotation.z = machining ? time * .65 : 0;
      cutterGlow.intensity = machining ? .15 + cutCycle * .2 : 0;
      cutter.material.emissive.setHex(0x5a625d);
      cutter.material.emissiveIntensity = machining ? .08 : 0;
      machineDoor.position.x = -1.62 + (machining ? 0 : 1.12);
      loadingArm.rotation.z = Math.sin(time * 1.2) * .18;
      conveyorRollers.forEach((roller) => {
        roller.rotateY(-.16);
      });
      conveyorFlights.forEach((flight) => {
        const progress = (lineCycle + flight.mesh.userData.offset) % 1;
        tempB.copy(flight.start).lerp(flight.end, progress);
        flight.mesh.position.set(tempB.x, .02, tempB.z);
      });
      if (feederCell) {
        feederCell.feederRollers.forEach((roller) => {
          roller.rotateY(-.18);
        });
        feederCell.pusher.position.x = -1.72 + ((time * .32) % 1) * 3.18;
      }
      if (robotCell) {
        const carrying = robotCycle >= .38 && robotCycle < .82;
        const gripping = robotCycle >= .34 && robotCycle < .86;
        let toolPosition = toolHomePosition;
        if (robotCycle < .12) {
          toolPosition = toolHomePosition;
        } else if (robotCycle < .24) {
          toolPosition = moveBetween(toolHomePosition, toolPickHoverPosition, easeInOut((robotCycle - .12) / .12));
        } else if (robotCycle < .34) {
          toolPosition = moveBetween(toolPickHoverPosition, toolPickPosition, easeInOut((robotCycle - .24) / .1));
        } else if (robotCycle < .44) {
          toolPosition = toolPickPosition;
        } else if (robotCycle < .54) {
          toolPosition = moveBetween(toolPickPosition, toolPickHoverPosition, easeInOut((robotCycle - .44) / .1));
        } else if (robotCycle < .7) {
          toolPosition = moveOverArc(toolPickHoverPosition, toolLiftPosition, toolBoxHoverPosition, easeInOut((robotCycle - .54) / .16));
        } else if (robotCycle < .8) {
          toolPosition = moveBetween(toolBoxHoverPosition, toolBoxDropPosition, easeInOut((robotCycle - .7) / .1));
        } else if (robotCycle < .88) {
          toolPosition = toolBoxDropPosition;
        } else if (robotCycle < .96) {
          toolPosition = moveBetween(toolBoxDropPosition, toolBoxHoverPosition, easeInOut((robotCycle - .88) / .08));
        } else {
          toolPosition = moveBetween(toolBoxHoverPosition, toolHomePosition, easeInOut((robotCycle - .96) / .04));
        }

        poseRobot(toolPosition);
        robotCell.fingerA.position.z = gripping ? .07 : .14;
        robotCell.fingerB.position.z = gripping ? -.07 : -.14;
        carriedScrew.visible = carrying;
      }
      rawParts.forEach((part) => {
        const progress = (time * .2 + part.userData.offset) % 1;
        const stagedProgress = progress > .78 ? .78 + (progress - .78) * .18 : progress;
        pointOnMotionPath(rawMotionPath, stagedProgress, tempB);
        part.position.copy(tempB);
        part.rotation.x = time * 2.5;
      });

      if (handoffScrew) {
        if (robotCycle < .38) {
          handoffScrew.visible = true;
          handoffScrew.position.copy(handoffPickWorld);
        } else if (robotCycle < .82) {
          handoffScrew.visible = false;
        } else {
          handoffScrew.visible = false;
        }
      }

      finishedParts.slice(1).forEach((part) => {
        const progress = (time * .17 + part.userData.offset) % 1;
        const stagedProgress = progress > .86 ? .86 + (progress - .86) * .18 : progress;
        pointOnMotionPath(finishedMotionPath, stagedProgress, tempB);
        part.position.copy(tempB);
        part.rotation.x = time * 2.6;
        part.rotation.y = Math.sin(time * 1.6 + part.userData.offset) * .08;
      });

      boxedScrews.forEach((screw, index) => { screw.visible = index < 3 + Math.floor(time / 6) % 7; });

      chips.forEach((chip) => {
        const progress = (time * 1.4 + chip.userData.offset) % 1;
        chip.position.set(
          -.18 + progress * .7,
          1.35 - progress * .45 + Math.sin(progress * Math.PI * 4) * .035,
          .8 + progress * .28,
        );
        chip.rotation.set(time * 4 + progress, time * 2.3, progress * 6);
        chip.visible = machining;
      });
      alertEffects.forEach((effect) => {
        const shouldAlert = isAlertStatus(currentStatusForMachine(effect.id));
        const pulse = .35 + Math.abs(Math.sin(time * 4.6)) * .65;
        effect.ring.visible = shouldAlert;
        effect.ring.material.opacity = shouldAlert ? .18 + pulse * .44 : 0;
        effect.ring.scale.setScalar(1 + pulse * .08);
        effect.glow.intensity = shouldAlert ? .8 + pulse * 2.1 : 0;
      });
      towerLamps.forEach(({ id, lamps }) => {
        const current = currentStatusForMachine(id);
        const active = current === "fault" || current === "alarm" ? 0 : current === "warning" ? 1 : 2;
        lamps.forEach((lamp, index) => { lamp.emissiveIntensity = index === active ? (active === 0 ? .8 + Math.abs(Math.sin(time * 5)) * 1.3 : .9) : .04; });
      });
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    const clearHover = () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      hoveredMachineRef.current = null;
      setHoveredLabel(null);
    };

    const pickMachineAtPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveObjects, false);
      return hits[0]?.object?.userData?.machineId || null;
    };

    const handlePointerMove = (event) => {
      const machineId = pickMachineAtPointer(event);
      if (!machineId) {
        clearHover();
        return;
      }

      const tooltipPosition = {
        x: Math.min(Math.max(event.offsetX + 14, 14), Math.max(mount.clientWidth - 250, 14)),
        y: Math.min(Math.max(event.offsetY + 14, 14), Math.max(mount.clientHeight - 112, 14)),
      };

      if (hoveredMachineRef.current === machineId) {
        setHoveredLabel((current) => current ? { ...current, ...tooltipPosition } : current);
        return;
      }

      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoveredMachineRef.current = machineId;
      setHoveredLabel(null);
      hoverTimerRef.current = window.setTimeout(() => {
        const label = labelForMachine(machineId);
        if (!label || hoveredMachineRef.current !== machineId) return;
        setHoveredLabel({ ...label, ...tooltipPosition });
      }, 2000);
    };

    const handlePointerLeave = () => clearHover();
    const handleClick = () => onSelectRef.current(hoveredMachineRef.current);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("click", handleClick);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      clearHover();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("click", handleClick);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [sceneMachineState, sceneViewState]);

  return (
    <div ref={mountRef} className="machine-3d-canvas" aria-hidden="true">
      {hoveredLabel ? (
        <div
          className={`scene-hover-label ${hoveredLabel.status}`}
          style={{ left: hoveredLabel.x, top: hoveredLabel.y }}
        >
          <strong>{hoveredLabel.name}</strong>
          <span>{hoveredLabel.type}</span>
          <em>{hoveredLabel.statusLabel}</em>
        </div>
      ) : null}
    </div>
  );
}

function statusColor(status) {
  if (status === "fault") return 0xb73732;
  if (status === "alarm" || status === "warning") return 0xb66a00;
  if (status === "idle") return 0x7d8c93;
  return 0x087f75;
}

function MachineDetailHeader({ machine, isLiveMachine, sample, result, healthText, onOpenDetail }) {
  const status = isLiveMachine ? machineStatus(machine, result) : "idle";
  return (
    <section className="machine-detail-header">
      <div>
        <span className="eyebrow">设备详情</span>
        <h2>{machine.name} · {machine.type}</h2>
        <p>{machine.area || machine.line} · {isLiveMachine ? (sample?.device_id || machine.id) : machine.id}</p>
        <div className="machine-context">
          <span>{machine.flow || "实时采集 → 规则判定 → Agent诊断"}</span>
          <span>{machine.focus || "关键指标与告警状态"}</span>
        </div>
        <button className="button detail-button" type="button" onClick={onOpenDetail}>查看设备详情</button>
      </div>
      <div className="machine-detail-stats">
        <div><span>状态</span><strong className={status}>{machineStatusLabel(status)}</strong></div>
        <div><span>运行阶段</span><strong>{isLiveMachine ? displayCycleState(sample) : "--"}</strong></div>
        <div><span>告警</span><strong>{isLiveMachine ? displayAlarm(sample) : "--"}</strong></div>
        <div><span>健康度</span><strong>{isLiveMachine ? healthText : "--"}</strong></div>
      </div>
    </section>
  );
}

function StatusStrip({ snapshot, sample, runner, healthText }) {
  const items = [
    ["监测状态", runner.enabled ? "开启" : "暂停"],
    ["设备状态", labelFor(statusLabels, sample?.status)],
    ["运行阶段", displayCycleState(sample)],
    ["当前告警", displayAlarm(sample)],
    ["采样次数", snapshot?.result_count ?? "--"],
    ["告警事件次数", snapshot?.alarm_event_count ?? "--"],
    ["Agent诊断任务", snapshot?.diagnosis_task_count ?? "--"],
    ["采样周期", runner.interval_seconds ? `${runner.interval_seconds} 秒/次` : "--"],
    ["整机健康度", healthText],
  ];
  return (
    <section className="status-strip" aria-label="运行状态">
      {items.map(([label, value]) => (
        <div className="status-item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}

function AlarmTimeline({ snapshot, machines }) {
  const triggerEvents = (snapshot?.trigger_history || []).map((item) => ({
    id: item.event_id || item.task_id || item.triggered_at,
    time: item.triggered_at,
    deviceId: item.device_id,
    title: item.trigger_cause || "诊断触发",
    detail: (item.rule_types || []).map((rule) => ruleLabels[rule] || rule).join("、") || item.event_id || "异常事件",
    level: severityClass(item.status),
  }));
  const liveEvents = machines.flatMap((machine) => {
    const result = machine.result;
    return (result?.observations || []).map((item, index) => ({
      id: `${machine.id}-${item.key || index}`,
      time: result.current_sample?.timestamp,
      deviceId: machine.id,
      title: observationLabel(item),
      detail: item.message || `${item.value ?? "--"} ${item.unit || ""}`,
      level: alertSeverity(item.alert_level),
    }));
  });
  const events = [...liveEvents, ...triggerEvents].slice(0, 8);

  return (
    <section className="panel alarm-timeline-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">报警时间线</span><h2>最新异常与诊断移交</h2></div>
        <span className="muted">实时观测 + 触发记录</span>
      </div>
      <div className="alarm-timeline">
        {!events.length && <div className="empty-state">当前没有异常或报警事件</div>}
        {events.map((event) => (
          <div className={`alarm-event ${event.level}`} key={event.id}>
            <span className="alarm-time">{formatTime(event.time)}</span>
            <span className="alarm-device">{event.deviceId}</span>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendPanel({ machine, history }) {
  const profileMetrics = (deviceProfiles[machine?.deviceType]?.metrics || []).slice(0, 3);
  const latest = history[history.length - 1]?.points || [];
  const series = profileMetrics.map(([key, name, , unit], index) => {
    const values = history.map((item) => item.points.find((point) => point.key === key)?.value).filter((value) => value !== undefined);
    return { key, name, unit, values, color: ["#087f75", "#235a8f", "#b66a00"][index] };
  }).filter((item) => item.values.length);

  return (
    <section className="panel trend-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">实时趋势</span><h2>关键指标最近 30 秒</h2></div>
        <span className="muted">{history.length ? `${history.length} 个采样点` : "等待采样"}</span>
      </div>
      <div className="trend-grid">
        {series.map((item) => <MiniTrend key={item.key} item={item} />)}
        {!series.length && <div className="empty-state">等待实时采样后生成趋势曲线</div>}
      </div>
      <div className="trend-latest">
        {latest.map((point) => {
          const config = profileMetrics.find(([key]) => key === point.key);
          return <span key={point.key}>{config?.[1] || point.key}：{formatMetricValue(point.value)} {config?.[3] || ""}</span>;
        })}
      </div>
    </section>
  );
}

function MiniTrend({ item }) {
  const width = 220;
  const height = 72;
  const min = Math.min(...item.values);
  const max = Math.max(...item.values);
  const range = max - min || 1;
  const points = item.values.map((value, index) => {
    const x = item.values.length === 1 ? width : (index / (item.values.length - 1)) * width;
    const y = height - ((Number(value) - min) / range) * (height - 12) - 6;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const latest = item.values[item.values.length - 1];
  return (
    <div className="mini-trend">
      <div><span>{item.name}</span><strong>{formatMetricValue(latest)} {item.unit}</strong></div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${item.name}趋势`}>
        <polyline points={points} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MachineDetailDrawer({ machine, result, sample, history, onClose }) {
  const items = buildMetricItems(result, sample, machine).slice(0, 12);
  const status = machineStatus(machine, result);
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="machine-drawer" role="dialog" aria-label="设备详情" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">{machine.area || machine.line}</span>
            <h2>{machine.name}</h2>
            <p>{machine.type} · {machine.flow}</p>
          </div>
          <button className="button" type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="drawer-status">
          <div><span>状态</span><strong className={status}>{machineStatusLabel(status)}</strong></div>
          <div><span>健康度</span><strong>{formatHealthValue(sample?.health_score)}</strong></div>
          <div><span>报警</span><strong>{displayAlarm(sample)}</strong></div>
        </div>
        <div className="drawer-section">
          <span className="eyebrow">设备关注点</span>
          <p>{machine.focus || "关键指标与告警状态"}</p>
        </div>
        <div className="drawer-metrics">
          {items.map((item) => <MetricCard key={item.key} item={item} result={result} />)}
        </div>
        <TrendPanel machine={machine} history={history} />
      </aside>
    </div>
  );
}

function MetricsPanel({ result, sample, machine }) {
  const [showAll, setShowAll] = useState(false);
  const items = useMemo(() => buildMetricItems(result, sample, machine), [result, sample, machine]);
  const visibleItems = showAll ? items : items.slice(0, 12);
  return (
    <section className="panel metrics-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">实时快照</span><h2>实时指标</h2></div>
        <div className="panel-actions">
          <span className="muted">{sample ? `最近采样 ${formatTime(sample.timestamp)}` : "等待采样"}</span>
          {items.length > 12 && <button className="link-button" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "收起重点" : `显示全部 ${items.length} 项`}</button>}
        </div>
      </div>
      <div className="metrics-grid">
        {visibleItems.map((item) => <MetricCard key={item.key} item={item} result={result} />)}
      </div>
      {machine?.deviceType === "turning_center" && (sample?.vibration === null || sample?.vibration === undefined) && (
        <div className="notice">当前车削中心数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。</div>
      )}
      <div className="subsection-heading"><span className="eyebrow">设备联锁与执行部件</span><strong>整机状态</strong></div>
      <EquipmentStates sample={sample} />
    </section>
  );
}

function buildMetricItems(result, sample, machine) {
  const metrics = sample?.metrics || {};
  const details = sample?.metric_details || {};
  const profile = deviceProfiles[machine?.deviceType];
  const usedKeys = new Set();
  const preferredItems = (profile?.metrics || [])
    .filter(([key]) => metrics[key] !== null && metrics[key] !== undefined || details[key])
    .map(([key, name, group, unit]) => {
      const detail = details[key] || {};
      usedKeys.add(key);
      return {
        key,
        name: detail.label || name,
        group: detail.group || group,
        value: metrics[key],
        unit: detail.unit || unit,
        normalRange: detail.normal_range,
      };
    });
  const detailItems = Object.entries(details)
    .filter(([key]) => !usedKeys.has(key))
    .map(([key, detail]) => {
      usedKeys.add(key);
      return {
        key,
        name: detail.label || key,
        group: detail.group || "整机",
        value: metrics[key],
        unit: detail.unit || "",
        normalRange: detail.normal_range,
      };
    });
  const rawItems = Object.entries(metrics)
    .filter(([key]) => !usedKeys.has(key))
    .map(([key, value]) => ({
      key,
      name: key,
      group: "实时数据",
      value,
      unit: "",
    }));
  const items = [...preferredItems, ...detailItems, ...rawItems];
  if (items.length) return items;
  return [
    { key: "temperature", name: "温度", group: "主轴", value: sample?.temperature, unit: "°C" },
    { key: "vibration", name: "振动", group: "主轴", value: sample?.vibration, unit: "mm/s" },
    { key: "rpm", name: "转速", group: "主轴", value: sample?.rpm, unit: "rpm" },
  ];
}

function formatMetricValue(value) {
  if (value === null || value === undefined) return "未提供";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  if (Math.abs(numericValue) >= 100) return numericValue.toFixed(0);
  if (Number.isInteger(numericValue)) return String(numericValue);
  return numericValue.toFixed(1);
}

function MetricCard({ item, result }) {
  const anomaly = result?.observations?.find((observation) => (
    observation.key === `metric:${item.key}`
    || observation.key === item.key
    || (item.key === "spindle_temperature_c" && observation.key === "temperature")
    || (item.key === "spindle_vibration_rms" && observation.key === "vibration")
  ));
  const level = alertSeverity(anomaly?.alert_level);
  const display = formatMetricValue(item.value);
  const range = item.normalRange ? `正常 ${item.normalRange[0]} - ${item.normalRange[1]}` : "";
  return (
    <div className={`metric ${level}`}>
      <span className="metric-group">{item.group}</span>
      <span className="metric-name">{item.name}</span>
      <strong className="metric-value">{display}</strong>
      <span className="metric-unit">{item.unit} {range}</span>
    </div>
  );
}

function EquipmentStates({ sample }) {
  const states = Object.values(sample?.equipment_states || {});
  if (!states.length) return <div className="equipment-grid"><div className="empty-state">当前接口没有提供离散设备状态</div></div>;
  return (
    <div className="equipment-grid">
      {states.map((state, index) => (
        <div className={`equipment-state ${state.is_normal ? "normal" : "fault"}`} key={`${state.label || "state"}-${index}`}>
          <span>{state.label || "设备状态"}</span>
          <strong>{labelFor(equipmentValueLabels, state.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function DecisionPanel({ result }) {
  const status = result?.status || "normal";
  return (
    <section className="panel decision-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">监测判定</span><h2>规则引擎</h2></div>
        <span className={`severity-pill ${severityClass(status)}`}>{labelFor(statusLabels, status)}</span>
      </div>
      <ObservationList observations={result?.observations || []} />
      <div className="threshold-note">
        <span>触发条件</span>
        <strong>关键故障立即触发；普通指标阈值+5秒；间歇故障5分钟内3次；趋势/联合异常</strong>
      </div>
    </section>
  );
}

function ObservationList({ observations }) {
  if (!observations.length) return <div className="observation-list"><div className="empty-state">当前没有检测到异常</div></div>;
  return (
    <div className="observation-list">
      {observations.map((item, index) => {
        const level = alertSeverity(item.alert_level);
        return (
          <div className="observation" key={`${item.key || item.kind}-${index}`}>
            <span className={`observation-dot ${level}`} />
            <div>
              <div className="observation-title">{labelFor(ruleLabels, item.rule_type)} · {observationLabel(item)}：{item.value}</div>
              <div className="observation-meta">{item.message} · 阈值 {item.threshold ?? "-"} {item.unit || ""}</div>
            </div>
            <span className="observation-level">{labelFor(alertLevelLabels, item.alert_level)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TriggerPanel({ snapshot }) {
  const history = snapshot?.trigger_history || [];
  return (
    <section className="panel trigger-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">诊断移交</span><h2>诊断触发记录</h2></div>
        <span className="muted">只记录监测器已确认的触发事件</span>
      </div>
      <div className="trigger-list">
        {!history.length && <div className="empty-state">暂无触发记录</div>}
        {history.map((trigger, index) => (
          <div className="trigger-row" key={`${trigger.task_id || trigger.event_id || index}`}>
            <span className="trigger-time">{formatTime(trigger.triggered_at)}</span>
            <span className="trigger-device">{trigger.device_id}</span>
            <span className="trigger-rules">{trigger.event_id || trigger.abnormal_event?.event_id || "--"}</span>
            <span className="trigger-reason">{trigger.trigger_cause || "首次确认异常"} · {trigger.task_id || "--"} · {(trigger.rule_types || []).map((item) => ruleLabels[item] || item).join("、")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiagnosisPanel({ snapshot }) {
  const latest = snapshot?.diagnosis?.latest || {};
  const status = latest.status || "idle";
  const statusClass = status === "failed" ? "fault" : status === "fallback" ? "warning" : "normal";
  return (
    <section className="panel diagnosis-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">智能诊断</span><h2>诊断结果</h2></div>
        <span className={`severity-pill ${statusClass}`}>{labelFor(diagnosisStatusLabels, status)}</span>
      </div>
      <DiagnosisResult latest={latest} />
    </section>
  );
}

function DiagnosisResult({ latest }) {
  if (!latest || latest.status === "idle") {
    return <div className="diagnosis-result"><div className="empty-state">满足触发条件后自动生成诊断结果</div></div>;
  }
  const confidence = confidenceText(latest.confidence);
  const definition = latest.alarm_definition || {};
  const evidence = (latest.tool_calls || []).slice(0, 4).map(displayToolName).join("、") || "等待诊断依据";
  const diagnosis = diagnosisParagraphs(latest.diagnosis);
  const cells = [
    ["设备", latest.device_id || "--"],
    ["报警信息", latest.alarm_label || definition.name || latest.alarm_code || definition.alarm_code || "--"],
    ["报警级别", alarmLevelText(latest)],
    ["运行状态", readableDiagnosisText(latest.cycle_state_label || latest.cycle_state || "--")],
    ["置信度", confidence],
    ["取证工具", evidence],
  ];
  return (
    <div className="diagnosis-result">
      <div className="diagnosis-summary">{compactDiagnosisSummary(latest)}</div>
      <div className="diagnosis-grid">
        {cells.map(([label, value]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
      <div className="diagnosis-detail"><span>诊断说明</span>{diagnosis.length ? diagnosis.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>暂无详细诊断</p>}</div>
      {latest.error && <div className="diagnosis-error">{latest.error}</div>}
    </div>
  );
}

function PipelineData({ snapshot }) {
  return snapshot?.diagnosis?.pipeline || {};
}

function DiagnosisWorkspace({ snapshot }) {
  const latest = snapshot?.diagnosis?.latest || {};
  const pipeline = PipelineData({ snapshot });
  const plan = pipeline.maintenance_plan || {};
  const sample = snapshot?.latest_result?.current_sample || {};
  const summary = buildTechnicianSummary({ latest, plan, sample });
  return (
    <section className="workspace-view active module-board" aria-label="智能诊断中心">
      <ModuleHero eyebrow="维修人员视图" title="智能诊断中心" text="把设备报警转换成现场能直接执行的判断、检查和安全要求。" />
      <div className="module-grid">
        <ModuleStat label="故障现象" value={summary.symptom} text={latest.device_id || "等待设备报警"} />
        <ModuleStat label="故障部件" value={summary.target} text={summary.judgment} />
        <ModuleStat label="诊断可信度" value={confidenceText(latest.confidence)} text={summary.uncertainty ? "需要现场进一步确认" : "可作为维修前检查依据"} />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">现场判断</span><h2>维修人员先看这里</h2></div><span className={`severity-pill ${summary.uncertainty ? "warning" : "normal"}`}>{summary.uncertainty ? "待现场确认" : "可执行"}</span></div>
          <div className="technician-callout">{summary.judgment}</div>
          <TechnicianSection title="优先检查" items={summary.checks} />
          <TechnicianSection title="安全要求" items={summary.safety} tone="safety" />
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">维修提示</span><h2>现场确认重点</h2></div></div>
          <div className="detail-grid technician-detail-grid">
            <DetailCell label="设备" value={latest.device_id} />
            <DetailCell label="报警" value={summary.symptom} />
            <DetailCell label="报警级别" value={alarmLevelText(latest)} />
            <DetailCell label="故障部件" value={summary.target} />
          </div>
          {summary.uncertainty && <div className="technician-warning">{summary.uncertainty}。请先完成“优先检查”，再决定更换部件。</div>}
          <TechnicianSection title="诊断说明" items={[summary.judgment]} />
        </section>
      </div>
    </section>
  );
}

const agentStatusLabels = {
  completed: "已完成",
  running: "运行中",
  waiting: "等待",
  error: "异常",
};

function AgentFlow({ snapshot }) {
  const agents = buildAgentFlow(snapshot);
  const completedCount = agents.filter((agent) => agent.status === "completed").length;
  return (
    <div className="agent-flow" aria-label="九个核心 Agent 运行流程">
      <div className="agent-flow-heading">
        <span>Agent运行流程</span>
        <em>{completedCount}/9 已完成</em>
      </div>
      <div className="agent-flow-track">
        {agents.map((agent, index) => (
          <React.Fragment key={agent.id}>
            <div className={`agent-flow-node ${agent.status}`} title={`${agent.label}：${agent.id === "quality" && agent.status === "waiting" ? "未触发" : agentStatusLabels[agent.status]}`}>
              <span className="agent-flow-dot" aria-hidden="true" />
              <span className="agent-flow-name">{agent.label}</span>
              <small>{agent.id === "quality" && agent.status === "waiting" ? "未触发" : agentStatusLabels[agent.status]}</small>
            </div>
            {index < agents.length - 1 && <span className="agent-flow-arrow" aria-hidden="true">›</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function MaintenanceWorkspace({ snapshot }) {
  const pipeline = PipelineData({ snapshot });
  const plan = pipeline.maintenance_plan || {};
  const latest = snapshot?.diagnosis?.latest || {};
  const sample = snapshot?.latest_result?.current_sample || {};
  const summary = buildTechnicianSummary({ latest, plan, sample });
  return (
    <section className="workspace-view active module-board" aria-label="维修决策中心">
      <ModuleHero eyebrow="维修人员视图" title="维修决策中心" text="按故障部件给出可执行的检查、维修、恢复和安全要求。" />
      <div className="module-grid">
        <ModuleStat label="故障部件" value={summary.target} text={summary.symptom} />
        <ModuleStat label="预计用时" value={summary.estimatedTime || "现场评估"} text="以现场检查结果为准" />
        <ModuleStat label="需要备件" value={summary.parts.length || "暂未确定"} text={summary.uncertainty || "按检查结果决定是否更换"} />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">维修执行</span><h2>按顺序处理</h2></div></div>
          <TechnicianSection title="故障判断" items={[summary.judgment]} />
          <TechnicianSection title="优先检查" items={summary.checks} />
          <TechnicianSection title="维修步骤" items={summary.steps} ordered />
          <TechnicianSection title="恢复标准" items={summary.recovery} />
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">安全与资源</span><h2>开工前确认</h2></div></div>
          <TechnicianSection title="安全要求" items={summary.safety} tone="safety" />
          <div className="detail-grid technician-detail-grid">
            <DetailCell label="工器具" value={summary.tools.join("、")} />
            <DetailCell label="备件" value={summary.parts.join("、")} />
          </div>
          {summary.uncertainty && <div className="technician-warning">{summary.uncertainty}。禁止仅凭系统建议直接更换部件。</div>}
        </section>
      </div>
    </section>
  );
}

function ReportWorkspace({ snapshot }) {
  const pipeline = PipelineData({ snapshot });
  const report = pipeline.report || {};
  const sections = report.sections || {};
  return (
    <section className="workspace-view active module-board" aria-label="报告中心">
      <ModuleHero eyebrow="Report Agent" title="报告中心" text="汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。" />
      <div className="module-grid"><ModuleStat label="报告编号" value={report.report_id || "--"} text={report.report_type || "maintenance"} /><ModuleStat label="报告标题" value={report.title || "--"} text={report.created_at ? formatTime(report.created_at) : "等待生成"} /><ModuleStat label="质量状态" value={sections.quality?.passed == null ? "--" : sections.quality.passed ? "通过" : "未通过"} text="Quality Agent" /></div>
      <section className="panel module-panel report-panel"><div className="panel-heading"><div><span className="eyebrow">报告摘要</span><h2>{report.title || "暂无报告"}</h2></div></div><p className="answer-summary">{report.summary || "完成一次异常闭环后，将在此展示诊断报告、维修报告和质检报告内容。"}</p><JsonBlock value={sections} /></section>
    </section>
  );
}

function TraceWorkspace({ snapshot }) {
  const pipeline = PipelineData({ snapshot });
  const trace = pipeline.trace || [];
  return (
    <section className="workspace-view active module-board" aria-label="AI运行追踪">
      <ModuleHero eyebrow="Agent Runtime" title="AI运行追踪" text="观察 Router、Harness、Agent、Tool、MCP 和 Experience 的调用链。" />
      <div className="module-grid"><ModuleStat label="Trace记录" value={trace.length} text={pipeline.trace_id || "当前异常流程"} /><ModuleStat label="Agent事件" value={trace.filter((item) => item.agent).length} text="生命周期记录" /><ModuleStat label="Tool事件" value={trace.filter((item) => item.tool).length} text="MCP工具调用记录" /></div>
      <section className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">调用链</span><h2>Trace Timeline</h2></div></div><TraceList items={trace} /></section>
    </section>
  );
}

function WorkorderView({ snapshot, sample, onClosed }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [assignee, setAssignee] = useState("维修一组");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const autoSyncingRef = useRef(false);
  const latestDiagnosis = snapshot?.diagnosis?.latest || {};
  const maintenancePlan = snapshot?.diagnosis?.pipeline?.maintenance_plan || {};
  const selectedOrder = orders.find((order) => order.workorder_id === selectedId) || orders[0];
  const liveSample = sample
    || snapshot?.latest_result?.current_sample
    || snapshot?.devices?.find((device) => device.device_id === snapshot?.device_id)?.current_sample
    || {};
  const currentFaultCode = String(liveSample?.alarm_code || "").trim();
  const currentFaultStatus = String(liveSample?.status || "").toLowerCase();
  const currentFaultActive = Boolean(currentFaultCode) && ["alarm", "fault", "warning"].includes(currentFaultStatus);

  async function loadOrders() {
    try {
      const body = await request("/api/workorders");
      const items = (body.items || []).map(normalizeWorkorderResponse);
      setOrders(items);
      if (!selectedId && items.length) setSelectedId(items[0].workorder_id);
      setError("");
      return items;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function syncCurrentFault() {
      const items = await loadOrders();
      const faultCode = String(liveSample?.alarm_code || "").trim();
      const deviceId = liveSample?.device_id || snapshot?.device_id || "";
      const faultStatus = String(liveSample?.status || "").toLowerCase();
      const faultActive = Boolean(faultCode) && ["alarm", "fault", "warning"].includes(faultStatus);
      if (cancelled || autoSyncingRef.current) return;
      if (!faultActive || !deviceId) {
        setSelectedId("");
        return;
      }

      const existing = items.find((item) => (
        String(item.device_id || "") === String(deviceId)
        && String(item.alarm_code || "") === faultCode
      ));
      if (existing) {
        setSelectedId(existing.workorder_id);
        return;
      }

      autoSyncingRef.current = true;
      try {
        const target = resolveRepairTarget({ alarm_code: faultCode, diagnosis_context: latestDiagnosis }, liveSample);
        const title = buildWorkorderTitle(latestDiagnosis, target, liveSample, snapshot);
        const response = await request("/api/workorders", {
          method: "POST",
          body: JSON.stringify({
            device_id: deviceId,
            title,
            steps: buildRepairSteps(latestDiagnosis, target),
            assignee,
            alarm_code: faultCode,
            diagnosis_context: latestDiagnosis,
            repair_target: target,
            source: "monitor",
            idempotency_key: `monitor:${latestDiagnosis?.event_id || `${deviceId}:${faultCode}`}`,
            drawing_context: {
              model_url: "http://127.0.0.1:8023/",
              mesh_name: target.component,
              location: target.location,
              drawing_url: "TC820si.html",
            },
          }),
        });
        const order = normalizeWorkorderResponse(response);
        if (!cancelled) {
          setOrders((current) => [...current.filter((item) => item.workorder_id !== order.workorder_id), order]);
          setSelectedId(order.workorder_id);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(`故障工单自动生成失败：${err.message}`);
      } finally {
        autoSyncingRef.current = false;
      }
    }

    syncCurrentFault();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return () => { cancelled = true; };
  }, [liveSample?.device_id, liveSample?.alarm_code, liveSample?.status, latestDiagnosis?.alarm_code]);

  async function createOrder() {
    setBusy(true);
    try {
      const target = resolveRepairTarget({ alarm_code: sample?.alarm_code }, sample);
      const title = buildWorkorderTitle(latestDiagnosis, target, sample, snapshot);
      const response = await request("/api/workorders", {
        method: "POST",
        body: JSON.stringify({
          device_id: sample?.device_id || snapshot?.device_id || "unknown",
          title,
          steps: buildRepairSteps(latestDiagnosis, target),
          assignee,
          alarm_code: sample?.alarm_code || latestDiagnosis.alarm_code || "",
          diagnosis_context: latestDiagnosis,
          repair_target: target,
          drawing_context: {
            model_url: "http://127.0.0.1:8023/",
            mesh_name: target.component,
            location: target.location,
            drawing_url: "TC820si.html",
          },
        }),
      });
      const order = normalizeWorkorderResponse(response);
      await loadOrders();
      setSelectedId(order.workorder_id);
      setError("");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(status, fields = {}) {
    if (!selectedOrder) return;
    setBusy(true);
    try {
      const action = status === "closed" ? "close" : "update";
      const response = await request(`/api/workorders/${selectedOrder.workorder_id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, status, assignee, ...fields }),
      });
      const order = normalizeWorkorderResponse(response);
      setOrders((items) => items.map((item) => item.workorder_id === order.workorder_id ? order : item));
      setError("");
      if (status === "closed") onClosed?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-view active workorder-page" aria-label="工单系统">
      <WorkorderDetail
        order={currentFaultActive ? selectedOrder : null}
        sample={sample}
        diagnosis={latestDiagnosis}
        plan={maintenancePlan}
        busy={busy}
        error={error}
        onUpdate={updateOrder}
      />
    </section>
  );
}

function WorkorderDetail({ order, sample, diagnosis = {}, plan = {}, busy, error, onUpdate }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [order?.workorder_id]);
  if (!order) {
    return (
      <section className="workorder-empty-shell">
        <div className="empty-state">暂无工单详情，等待虚拟工厂触发故障后自动派发维修工单。{error && <div className="inline-error">{error}</div>}</div>
      </section>
    );
  }
  const target = resolveRepairTarget(order, sample);
  const sheet = buildWorkorderSheet({ order, target, plan, diagnosis });
  const statusLabel = labelFor(workorderStatusLabels, order.status);
  return (
    <section className="workorder-detail-page">
      <header className="workorder-titlebar">
        <div>
          <span className="eyebrow">维修工单详情</span>
          <h1>{order.title}</h1>
          <p>{order.workorder_id} · {order.device_id} · {order.assignee || "未分配"} · {formatTime(order.updated_at)}</p>
        </div>
        <span className={`workorder-status-badge ${order.status === "closed" || order.status === "completed" ? "done" : "pending"}`}>{statusLabel}</span>
      </header>

      <div className="workorder-bigscreen-grid cad-only">
        <RepairCadPanel order={order} target={target} />
      </div>
      <WorkorderSheet sheet={sheet} busy={busy} error={error} onUpdate={onUpdate} />
    </section>
  );
}

function WorkorderSheet({ sheet, busy, error, onUpdate }) {
  const [repairFeedback, setRepairFeedback] = useState("");
  const isDone = ["completed", "closed"].includes(sheet.status);
  const isStarted = ["in_progress", "completed", "closed"].includes(sheet.status);
  return (
    <section className="maintenance-sheet" aria-label="自动派发维修工单">
      <div className="sheet-heading">
        <div>
          <span className="eyebrow">自动派发工单</span>
          <h2>维修工单</h2>
          <p className="sheet-subtitle">故障确认后由系统自动派出，维修人员按下方步骤处理。</p>
        </div>
        <span className={isDone ? "sheet-status done" : "sheet-status"}>{labelFor(workorderStatusLabels, sheet.status)}</span>
      </div>

      <div className="basic-grid">
        <div><span>工单编号</span><strong>{sheet.workorderId || "--"}</strong></div>
        <div><span>设备</span><strong>{sheet.deviceId || "--"}</strong></div>
        <div><span>处理班组</span><strong>{sheet.assignee}</strong></div>
        <div><span>派发方式</span><strong>{sheet.autoDispatched ? "系统自动派发" : "系统工单"}</strong></div>
      </div>

      <div className="sheet-section-grid">
        <section className="sheet-section fault-summary-card">
          <span className="section-kicker">故障信息</span>
          <h3>{sheet.title}</h3>
          <div className="fault-meta-list">
            <span>故障部件：{sheet.partName}</span>
            <span>料号：{sheet.partNo}</span>
            <span>所属系统：{sheet.system}</span>
            <span>位置：{sheet.location}</span>
          </div>
          <strong>故障表现：{sheet.faultSymptom}</strong>
        </section>
        <section className="sheet-section evidence-card">
          <span className="section-kicker">开工前确认</span>
          <dl>
            <div><dt>工器具</dt><dd>{sheet.tools.length ? sheet.tools.join("、") : "按现场检查准备"}</dd></div>
            <div><dt>备件</dt><dd>{sheet.parts.length ? sheet.parts.join("、") : "检查后决定是否更换"}</dd></div>
            <div><dt>安全要求</dt><dd>{sheet.safety.length ? sheet.safety.join("；") : "确认停机、断电后再操作"}</dd></div>
          </dl>
        </section>
      </div>

      <div className="sheet-bottom-grid">
        <section className="sheet-section">
          <div className="sheet-subhead"><div><span className="section-kicker">维修步骤</span><h3>按顺序处理</h3></div><span className="step-count">{sheet.steps.length} 项</span></div>
          <ol className="workorder-checklist">
            {sheet.steps.map((step, index) => <li key={`${step}-${index}`}><span>□</span><p>{String(index + 1).padStart(2, "0")}　{step}</p></li>)}
          </ol>
        </section>
        <section className="sheet-section feedback-card">
          <div className="sheet-subhead"><div><span className="section-kicker">处理记录</span><h3>完成后提交结果</h3></div></div>
          <label htmlFor="repair-feedback">处理说明</label>
          <textarea id="repair-feedback" value={repairFeedback} onChange={(event) => setRepairFeedback(event.target.value)} placeholder="填写处理结果、复测数据或未解决原因" disabled={isDone} />
          {error && <div className="inline-error">{error}</div>}
          <div className="sheet-actions">
            <button className="button" type="button" disabled={busy || isStarted} onClick={() => onUpdate("in_progress")}>{busy ? "处理中" : "开始处理"}</button>
            <button className="button primary" type="button" disabled={busy || isDone || !repairFeedback.trim()} onClick={() => onUpdate("completed", { repair_feedback: { feedback: repairFeedback.trim(), operator: sheet.assignee } })}>提交结果</button>
          </div>
        </section>
      </div>
    </section>
  );
}

function RepairCadPanel({ order, target }) {
  const [exploded, setExploded] = useState(true);
  const [resetView, setResetView] = useState(false);
  const cadFrameRef = useRef(null);
  const targetComponent = target.component || target.part_no || target.part_name || "";
  const viewerParams = new URLSearchParams({
    fault: targetComponent,
    component: targetComponent,
    part: target.part_name || "",
    part_no: target.part_no || "",
    alarm_code: target.alarm_code || order?.alarm_code || "",
    device_id: order?.device_id || "TRAK-TC820LTYSI-001",
    mode: "workorder",
    highlight: "1",
    action: "explode",
  });
  const viewerUrl = `http://127.0.0.1:8023/?${viewerParams.toString()}`;

  function sendViewerCommand(command, extra = {}) {
    const payload = {
      type: "tc820si-cad-command",
      command,
      target: targetComponent,
      component: targetComponent,
      part: target.part_name,
      part_no: target.part_no,
      cad_part_numbers: target.cad_part_numbers || [],
      alarm_code: target.alarm_code || order?.alarm_code || "",
      device_id: order?.device_id || "TRAK-TC820LTYSI-001",
      keepHighlight: true,
      ...extra,
    };
    if (cadFrameRef.current?.contentWindow) {
      cadFrameRef.current.contentWindow.postMessage(payload, "http://127.0.0.1:8023");
      return;
    }
    window.open(`${viewerUrl}&action=${encodeURIComponent(command)}`, "tc820si-repair-view");
  }

  function focusFaultPart() {
    sendViewerCommand("focus", { action: "focus" });
  }

  useEffect(() => {
    const timers = [150, 600, 1400, 2600].map((delay) => window.setTimeout(() => {
      if (cadFrameRef.current?.contentWindow) focusFaultPart();
    }, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [viewerUrl, targetComponent, target.part_no]);

  function openFullscreen() {
    if (cadFrameRef.current?.requestFullscreen) {
      cadFrameRef.current.requestFullscreen();
      return;
    }
    window.open(viewerUrl, "tc820si-repair-view");
  }

  return (
    <section className="repair-visual-panel" aria-label="3D 故障定位">
      <div className="repair-visual-head">
        <div>
          <span className="eyebrow">3D 故障定位</span>
          <h2>{target.part_name}</h2>
          <p>{target.location} · CAD 对应：{targetComponent}</p>
        </div>
        <div className="repair-visual-actions">
          <button className={`button ${exploded ? "active" : ""}`} type="button" onClick={() => { const next = !exploded; setExploded(next); setResetView(false); sendViewerCommand(next ? "explode" : "collapse", { action: next ? "explode" : "collapse" }); }}>{exploded ? "收回部件" : "爆炸查看"}</button>
          <button className="button" type="button" onClick={() => { setExploded(false); setResetView(true); sendViewerCommand("reset", { action: "reset", keepHighlight: true }); }}>恢复装配</button>
          <button className="button ghost-button" type="button" onClick={openFullscreen}>全屏</button>
        </div>
      </div>
      <div className={`repair-visual-body ${exploded ? "is-exploded" : ""} ${resetView ? "is-reset" : ""}`}>
        <iframe
          className="repair-cad-frame"
          title={`${target.part_name} CAD 维修视图`}
          src={viewerUrl}
          ref={cadFrameRef}
          onLoad={focusFaultPart}
        />
      </div>
    </section>
  );
}

function RagWorkspace({ snapshot, sample }) {
  const [query, setQuery] = useState(quickQuestions[0]);
  const [answer, setAnswer] = useState(null);
  const [ragResult, setRagResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    try {
      setStatus(await request("/api/rag/status"));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function askKnowledge(nextQuery = query) {
    if (!nextQuery.trim()) return;
    setBusy(true);
    try {
      const [agentBody, ragBody] = await Promise.all([
        request("/api/agent/question", {
          method: "POST",
          body: JSON.stringify({ user_text: nextQuery, context: { device_id: sample?.device_id || snapshot?.device_id || "" } }),
        }),
        request(`/api/rag/search?query=${encodeURIComponent(nextQuery)}&limit=5`),
      ]);
      setAnswer(agentBody);
      setRagResult(ragBody);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const documents = ragResult?.documents || answer?.knowledge?.documents || [];
  const report = answer?.report || {};
  return (
    <section className="workspace-view active module-board" aria-label="RAG知识问答">
      <ModuleHero eyebrow="RAG 知识中枢" title="维修知识问答" text="统一调用 Router、Knowledge 和 RAG 检索接口，展示答案摘要、命中文档与知识库状态。" />
      <div className="module-grid">
        <ModuleStat label="检索后端" value={status?.backend || "--"} text="支持本地 fallback 或远程 RAG" />
        <ModuleStat label="知识记录" value={status?.record_count ?? "--"} text="当前可检索记录数" />
        <ModuleStat label="命中文档" value={documents.length} text="本次问答引用结果" />
      </div>
      <section className="qa-shell">
        <div className="quick-row">
          {quickQuestions.map((item) => (
            <button key={item} className="button" type="button" onClick={() => { setQuery(item); askKnowledge(item); }}>{item}</button>
          ))}
        </div>
        <textarea className="qa-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入设备维修、SOP、报警码问题" />
        <div className="action-row">
          <button className="button primary" type="button" disabled={busy} onClick={() => askKnowledge()}>{busy ? "检索中" : "提交问答"}</button>
          <button className="button" type="button" onClick={loadStatus}>刷新知识库状态</button>
        </div>
        {error && <div className="inline-error">{error}</div>}
      </section>
      <section className="answer-grid">
        <div className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">Agent 回答</span><h2>{report.title || "等待提问"}</h2></div></div>
          <p className="answer-summary">{report.summary || answer?.diagnosis?.fault || answer?.route_result?.reason || "输入问题后将展示 Router 与 Knowledge Agent 的回答。"}</p>
          {answer?.route_result && <JsonBlock value={answer.route_result} />}
        </div>
        <div className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">引用文档</span><h2>RAG 命中</h2></div><span className="muted">{ragResult?.source || answer?.knowledge?.source || "--"}</span></div>
          <DocumentList documents={documents} />
        </div>
      </section>
    </section>
  );
}

function QualityWorkspace({ snapshot, sample }) {
  const [partId, setPartId] = useState("PART-001");
  const [quality, setQuality] = useState(null);
  const [trace, setTrace] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function loadQualityData() {
    try {
      const [traceBody, experienceBody] = await Promise.all([
        request("/api/trace"),
        request("/api/experience/search", {
          method: "POST",
          body: JSON.stringify({ device_id: sample?.device_id || snapshot?.device_id || "", limit: 8 }),
        }),
      ]);
      setTrace(traceBody.trace || []);
      setExperiences(experienceBody.items || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadQualityData();
  }, []);

  async function verifyQuality() {
    if (!partId.trim()) return;
    setBusy(true);
    try {
      const body = await request(`/api/quality/parts/${encodeURIComponent(partId.trim())}`, { method: "POST", body: "{}" });
      setQuality(body);
      await loadQualityData();
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-view active module-board" aria-label="质检系统">
      <ModuleHero eyebrow="QMS 质检系统" title="生产零件质量检测" text="对生产完成的零件执行尺寸、外观、材料、功能和工艺追溯检测。" />
      <div className="module-grid">
        <ModuleStat label="检测对象" value={quality?.part_id || partId || "--"} text={quality?.part_no || "输入生产零件编号"} />
        <ModuleStat label="检测结果" value={quality ? (quality.qualified ? "合格" : "不合格") : "未执行"} text={quality?.quality_grade || "等待检测"} />
        <ModuleStat label="经验记录" value={experiences.length} text="长期记忆/经验库结果" />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">检测对象</span><h2>生产零件</h2></div><button className="button" type="button" onClick={loadQualityData}>刷新</button></div>
          <input className="select-input" value={partId} onChange={(event) => setPartId(event.target.value)} placeholder="例如 PART-001" aria-label="生产零件编号" />
          <div className="action-row"><button className="button primary" type="button" disabled={busy || !partId.trim()} onClick={verifyQuality}>{busy ? "检测中" : "执行质量检测"}</button></div>
          {error && <div className="inline-error">{error}</div>}
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">检测结果</span><h2>{quality ? (quality.qualified ? "零件合格" : "零件不合格") : "等待检测"}</h2></div></div>
          {quality ? <QualityResultView quality={quality} /> : <div className="empty-state">输入生产零件编号后，系统会返回尺寸、外观、材料、功能和工艺检测结果。</div>}
        </section>
      </div>
      <section className="answer-grid">
        <div className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">经验库</span><h2>维修经验</h2></div></div><ExperienceList items={experiences} /></div>
        <div className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">Trace</span><h2>Agent 调用轨迹</h2></div></div><TraceList items={trace} /></div>
      </section>
    </section>
  );
}

function ModuleHero({ eyebrow, title, text }) {
  return <div className="module-hero"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>;
}

function ModuleStat({ label, value, text }) {
  return <div className="module-card"><span>{label}</span><strong>{value}</strong><p>{text}</p></div>;
}

function DetailCell({ label, value }) {
  return <div><span>{label}</span><strong>{value || "--"}</strong></div>;
}

function TechnicianSection({ title, items = [], ordered = false, tone = "" }) {
  const values = (items || []).filter(Boolean);
  if (!values.length) return null;
  return (
    <div className={`technician-section ${tone}`}>
      <h3>{title}</h3>
      {ordered ? (
        <ol>{values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>
      ) : (
        <ul>{values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
      )}
    </div>
  );
}

function StepList({ steps = [] }) {
  if (!steps.length) return <div className="empty-state">暂无维修步骤</div>;
  return <ol className="step-list">{steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol>;
}

function DocumentList({ documents, limit = null, compact = false }) {
  if (!documents.length) return <div className="empty-state">暂无命中文档</div>;
  const visibleDocuments = limit ? documents.slice(0, limit) : documents;
  return <div className={`document-list ${compact ? "compact" : ""}`}>{visibleDocuments.map((doc, index) => <article key={doc.document_id || index}><strong>{doc.title || doc.document_id}</strong><p>{doc.content}</p><span>{doc.source || doc.metadata?.collection || "知识库"} · 相关度 {doc.score ?? "--"}</span></article>)}</div>;
}

function QualityResultView({ quality }) {
  const checks = quality.inspection_items || [];
  return <div className="quality-result"><div className="check-grid">{checks.map((item) => <div key={item.name} className={item.passed ? "normal" : "fault"}><span>{item.name}</span><strong>{item.passed ? "通过" : "未通过"}</strong></div>)}</div>{quality.defects?.length > 0 && <JsonBlock value={quality.defects} />}<StepList steps={quality.findings || []} /></div>;
}

function ExperienceList({ items }) {
  if (!items.length) return <div className="empty-state">暂无经验记录；闭环通过后会自动沉淀。</div>;
  return <div className="document-list">{items.map((item, index) => <article key={item.experience_id || index}><strong>{item.title}</strong><p>{item.content}</p><span>{item.device_id || "--"} · {item.source_workorder || "历史经验"}</span></article>)}</div>;
}

function TraceList({ items }) {
  if (!items.length) return <div className="empty-state">暂无调用轨迹</div>;
  return <div className="trace-list">{items.slice(0, 12).map((item, index) => <div key={`${item.event || "trace"}-${index}`}><strong>{item.event}</strong><span>{item.summary || item.agent || item.tool || item.mcp_server || "runtime"}</span></div>)}</div>;
}

function JsonBlock({ value }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

function PendingView({ title }) {
  return (
    <section className="workspace-view active pending-view" aria-label={title}>
      <div className="pending-board">
        <span className="eyebrow">{title}</span>
        <h2>待开发~</h2>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
