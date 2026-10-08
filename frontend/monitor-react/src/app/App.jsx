import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createEquator300 } from "./equator300.js";
import "../styles.css";
import machineImage from "../assets/trak-tc820-machine-transparent.png";
import { buildMaintenancePlanView, buildRepairCompletionPayload, buildWorkorderSheet, getDeviceDisplayName, getWorkorderAlarmCode, getWorkorderDisplayTitle } from "../workorderSheet.mjs";
import { buildDiagnosisView, diagnosisMatchesCurrent, getLatestDiagnosis, getLatestPipeline } from "./diagnosisView.mjs";
import { currentIncident, incidentIdentity, matchesIncident, linkedPlanOrder, recordTimes, formatRecordTime } from './incidentIdentity.mjs';
import { buildReportDisplaySections, reportCompleteness, reportQualityLabel } from "./reportView.mjs";
import { buildKnowledgeContext } from "./knowledgeScope.mjs";
import { buildAgentInvocations, formatTraceValue, normalizeRunResponse, normalizeTraceResponse, runEventMatches, traceDetailSections, traceEventSummary, traceIdentity } from "./traceLog.mjs";
import { getRagStorage, needsRagAnswerRefresh, persistRagMessages, restoreRagMessages } from "./ragSession.mjs";
import { request } from "./apiRequest.mjs";
import { buildMaintenanceWorkspaceRecords, deleteMaintenancePlans, executionReviewView, inspectionWorkorderView, loadMaintenancePlans, loadMaintenanceOrders, maintenanceDispatchView, maintenanceHistoryNotice, maintenanceReferenceDrawings, maintenanceWorkType, retryMaintenancePlan } from "./maintenanceWorkspace.mjs";
import { publishMaintenanceChange, subscribeMaintenanceChanges, rememberDeletedMaintenancePlans } from './maintenanceChanges.mjs';
import { cleanDisplayText, cleanEvidenceText, selectAgentAnswer, splitInlineMarkdown, splitTextBlocks } from "./textFormatting.mjs";
import { formatMonitorHealth, monitorEvidenceReason } from "./monitorDisplay.mjs";
import { loadQualityResources, pendingQualityAppealId, qualityChecks, qualityFromAction, qualityHistoryStatusLabel, qualityOutcome, runQualityAction } from "./qualityWorkspace.mjs";
import { WorkbenchSidebar } from "./WorkbenchShell.jsx";
import ProductionCadWorkspace from "./production-cad/ProductionCadWorkspace.jsx";
import InspectionInput from './InspectionInput.jsx';
import "../workbench.css";
import TeamAccess from '../TeamAccess.jsx';
import SupervisorQueue from '../SupervisorQueue.jsx';
import '../team.css';

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
  equator_gauge: "尺寸检测设备",
};

const deviceProfiles = {
  turning_center: {
    area: "A01 主加工单元",
    flow: "棒料 → 车削 → 机械臂取件",
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
    flow: "取件 → 送检 → 合格／待处理分流",
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
  equator_gauge: {
    area: "A04 尺寸检测工位",
    flow: "机械臂送检 → 尺寸检测 → 分流",
    focus: "测头、控制器、环境与检测过程",
    metrics: [],
  },
};

const defaultMachinePositions = [
  { x: 42, y: 58 },
  { x: 23, y: 46 },
  { x: 68, y: 42 },
  { x: 78, y: 62 },
];

const knownMachineDefinitions = [
  { id: "TRAK-TC820LTYSI-001", device_type: "turning_center", name: "TRAK TC820LTYsi 车削中心" },
  { id: "LNS-QL-SERVO-80-S2-001", device_type: "bar_feeder", name: "LNS QL Servo 80 S2 棒料送料机" },
  { id: "ELITE-CS612-ROBOT-001", device_type: "industrial_robot", name: "ELITE ROBOTS CS612 六轴协作机器人" },
  { id: "RENISHAW-EQUATOR300-001", device_type: "equator_gauge", name: "Renishaw Equator 300 比对仪" },
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
  unknown: "状态未知",
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
  // 已持久化的工单目标是操作员/诊断结果的权威来源。
  // 不要用当前监控报警的静态目录项替换它，否则旧工单可能会指向错误的 CAD 部件。
  if (!storedLooksPlaceholder) return { ...stored, alarm_code: stored.alarm_code || alarmCode };
  if (catalogTarget) {
    return { ...catalogTarget, alarm_code: alarmCode };
  }
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
  const alarmText = sample?.alarm_label || latest?.alarm_definition?.label || latest?.fault || latest?.summary;
  const partName = target?.part_name && target.part_name !== "待确认故障部件" ? target.part_name : "设备";
  return getWorkorderDisplayTitle(
    {
      device_id: sample?.device_id || snapshot?.device_id || "",
      alarm_code: sample?.alarm_code || latest?.alarm_code || "",
      title: `${partName}维修`,
      diagnosis_context: latest,
    },
    target,
    { snapshot, sample, fault: alarmText },
  );
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


function alarmLevelText(latest) {
  const definition = latest?.alarm_definition || {};
  const dictionaryLabel = definition.severity_label || definition.severity;
  if (dictionaryLabel && !["unknown", "未知"].includes(dictionaryLabel)) return dictionaryLabel;
  const match = String(latest?.summary || "").match(/报警等级(?:由[^，。]+)?升级为([^，。]+)/);
  return match?.[1] || "待确认";
}


function normalizeWorkorderResponse(body) {
  if (body?.workorder && typeof body.workorder === "object") {
    return {
      ...body.workorder,
      dispatch_context: body.dispatch_context,
      candidates: body.candidates,
      machine_control: body.machine_control ?? body.workorder.machine_control,
    };
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
  const knownIds = new Set(devices.map((device) => String(device.device_id || device.id || "")));
  const missingDefinitions = knownMachineDefinitions
    .filter((definition) => !knownIds.has(definition.id))
    .map((definition) => ({ ...definition, live: false, data_unavailable: true }));
  const allDevices = [...devices, ...missingDefinitions];
  const mapped = allDevices.map((device, index) => {
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
      live: device.live !== false && !device.data_unavailable,
      image: fallback.image || device.image,
      result,
      sample,
    };
  });
  if (!mapped.some((machine) => machine.id === "RENISHAW-EQUATOR300-001")) {
    mapped.push({
      id: "RENISHAW-EQUATOR300-001",
      name: "Renishaw Equator 300",
      line: "A线 · 尺寸检测工位",
      area: "A04 尺寸检测工位",
      type: "尺寸检测设备",
      deviceType: "inspection",
      flow: "机械臂送检 → 检测 → 合格／待处理分流",
      focus: "仅展示三维模型，未接入测量数据",
      live: false,
      result: null,
      sample: null,
      visualOnly: true,
    });
  }
  return mapped;
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
  const [teamActor, setTeamActor] = useState(null);
  const [lineState, setLineState] = useState({state: 'unknown'});
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === "undefined") return "monitor";
    const requested = new URLSearchParams(window.location.search).get("view");
    return ["cad", "monitor", "diagnosis", "maintenance", "workorder", "quality", "rag", "logs", "report"].includes(requested) ? requested : "monitor";
  });
  const [maintenanceVisited, setMaintenanceVisited] = useState(activeView === "maintenance");
  const [logsVisited, setLogsVisited] = useState(activeView === "logs");
  useEffect(() => {
    if (activeView === "maintenance") setMaintenanceVisited(true);
    if (activeView === "logs") setLogsVisited(true);
  }, [activeView]);
  const [ragMessages, setRagMessages] = useState(() => {
    if (typeof window === "undefined") return [];
    const storage = getRagStorage(window);
    return restoreRagMessages(storage.primary, storage.fallback);
  });
  const [toast, setToast] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState(workshopMachines[0].id);
  const [bigScreen, setBigScreen] = useState(false);
  const { snapshot, error, control, resetStats } = useMonitorSnapshot();
  const runner = snapshot?.runner || {};
  const machines = useMemo(() => buildWorkshopMachines(snapshot), [snapshot]);
  const metricHistory = useMetricHistory(machines);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const result = selectedMachine?.result || null;
  const sample = result?.current_sample || selectedMachine?.sample || null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storage = getRagStorage(window);
      persistRagMessages(storage.primary, ragMessages, storage.fallback);
    }
  }, [ragMessages]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleHistoryNavigation = () => {
      const requested = new URLSearchParams(window.location.search).get("view");
      if (["cad", "monitor", "diagnosis", "maintenance", "workorder", "quality", "rag", "logs", "report"].includes(requested || "")) {
        setActiveView(requested);
      } else if (!requested) {
        setActiveView("monitor");
      }
    };
    window.addEventListener("popstate", handleHistoryNavigation);
    return () => window.removeEventListener("popstate", handleHistoryNavigation);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (activeView === "monitor") params.delete("view");
    else params.set("view", activeView);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState({ view: activeView }, "", nextUrl);
    }
  }, [activeView]);

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
    <div className={`platform-shell ${bigScreen ? "big-screen" : "workbench"}`}>
      {!bigScreen && <WorkbenchSidebar activeView={activeView} onChange={setActiveView} hasError={Boolean(error || runner.last_error)} connected={Boolean(snapshot)} />}
      <main className={`app-shell ${!bigScreen && activeView === "monitor" ? "monitor-canvas-shell" : !bigScreen ? "content-shell" : ""}`}>
        {!bigScreen && <TeamAccess actor={teamActor} onActor={setTeamActor} line={lineState} onLine={setLineState} />}
        {bigScreen ? (
          <Topbar
            snapshot={snapshot}
            runner={runner}
            onControl={control}
            onReset={resetStats}
            bigScreen={bigScreen}
            onToggleBigScreen={() => setBigScreen((value) => !value)}
          />
        ) : null}
        {(activeView === "monitor" || bigScreen) && (
          <MonitorCenter
            machines={machines}
            result={result}
            sample={sample}
            dataSource={snapshot?.data_source}
            metricHistory={metricHistory}
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
          />
        )}
        {!bigScreen && activeView === "cad" && <ProductionCadWorkspace />}
        {!bigScreen && activeView === "diagnosis" && <DiagnosisWorkspace snapshot={snapshot} sample={sample} />}
        {(maintenanceVisited || activeView === "maintenance") && <MaintenancePlanWorkspace active={!bigScreen && activeView === "maintenance"} snapshot={snapshot} sample={sample} actor={teamActor} />}
        {!bigScreen && activeView === "workorder" && (teamActor ? <><SupervisorQueue actor={teamActor} /><WorkorderView key={`${teamActor.user_id}:${teamActor.role}`} actor={teamActor} snapshot={snapshot} sample={sample} onClosed={() => { showToast("工单已关闭"); setActiveView("monitor"); }} /></> : <section className="workorder-queue"><h2>请先登录维修小组账号</h2><p>展开上方“注册 / 登录”。维修人员查看本人工单，监督人查看全部并催办。</p></section>)}
        {!bigScreen && activeView === "rag" && <RagWorkspace snapshot={snapshot} sample={sample} messages={ragMessages} setMessages={setRagMessages} />}
        {(logsVisited || activeView === "logs") && <LogsWorkspace active={!bigScreen && activeView === "logs"} snapshot={snapshot} />}
        {!bigScreen && activeView === "quality" && <QualityWorkspace snapshot={snapshot} sample={sample} />}
        {!bigScreen && activeView === "report" && <ReportWorkspace snapshot={snapshot} />}
        {toast && <div className="toast-message" role="status">{toast}</div>}
        {(error || runner.last_error) && <footer className="error-bar">{error || runner.last_error}</footer>}
      </main>
    </div>
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

function MonitorCenter({
  machines,
  result,
  sample,
  dataSource,
  metricHistory,
  selectedMachineId,
  onSelectMachine,
}) {
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0] || workshopMachines[0];
  const [detailOpen, setDetailOpen] = useState(false);
  const selectFromMap = (machineId) => {
    onSelectMachine(machineId);
    setDetailOpen(true);
  };

  return (
    <section className="workspace-view active monitor-map-only" aria-label="车间流水线">
      <WorkshopMap
        machines={machines}
        selectedMachineId={selectedMachine.id}
        result={result}
        onSelectMachine={selectFromMap}
      />
      {detailOpen && <MachineDetailDrawer machine={selectedMachine} result={result} sample={sample} dataSource={dataSource} history={metricHistory[selectedMachine.id] || []} onClose={() => setDetailOpen(false)} />}
    </section>
  );
}

function WorkshopMap({ machines, selectedMachineId, result, onSelectMachine }) {
  const [viewMode, setViewMode] = useState("iso");
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const selectedStatus = machineStatus(selectedMachine, selectedMachine?.result || result);

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
            <h2>流水线三维视图</h2>
            <p className="scene-click-hint">点击设备模型查看运行数据</p>
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
      </div>
      <DeviceAlertBoard machines={machines} onSelectMachine={onSelectMachine} />
    </section>
  );
}

function DeviceAlertBoard({ machines = [], onSelectMachine }) {
  const liveMachines = machines.filter((machine) => machine.live);
  const alertMachines = liveMachines.filter((machine) => ["fault", "alarm", "warning"].includes(machineStatus(machine, machine.result)));
  return (
    <section className="device-alert-board" aria-label="设备状态与预警">
      <div className="device-alert-heading">
        <div><span className="eyebrow">设备监测</span><h2>设备状态与预警</h2></div>
        <span>{liveMachines.length} 台设备 · {alertMachines.length} 项预警</span>
      </div>
      <div className="device-alert-grid">
        {machines.map((machine) => {
          const status = machineStatus(machine, machine.result);
          const sample = machine.result?.current_sample || machine.sample;
          return (
            <button
              className={`device-alert-card ${status}`}
              key={machine.id}
              type="button"
              onClick={() => onSelectMachine(machine.id)}
            >
              <span className="device-alert-card-top"><i className={`legend-dot ${status === "normal" ? "normal" : status === "idle" ? "idle" : status}`} /><strong>{machine.name}</strong><em>{machineStatusLabel(status)}</em></span>
              <span className="device-alert-reason">{machineAlertReason(machine)}</span>
              <small>{machine.live && sample?.timestamp ? `最近采样 ${formatTime(sample.timestamp)}` : "暂无实时采样"}</small>
            </button>
          );
        })}
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

// 世界坐标中的工位；三个机器人交接目标都保持在其 2.22 单位的工作范围内。
const workshopLayout = Object.freeze({
  robot: [5.8, -.15],
  pickup: [4.7, 1.12],
  inspection: [7.6, 1],
  qualified: [7.65, -1.3],
  rework: [6.65, -2.1],
  robotReach: 2.22,
});

function Machine3DScene({ machines = [], selectedMachineId, status, viewMode, onSelect }) {
  const mountRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const machinesRef = useRef(machines);
  const selectedMachineIdRef = useRef(selectedMachineId);
  const updateSelectionRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const hoveredMachineRef = useRef(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const sceneMachineState = useMemo(
    () => machines.map((machine) => `${machine.id}:${machine.live ? 1 : 0}:${machineStatus(machine, machine.result)}`).join("|"),
    [machines],
  );
  const sceneViewState = viewMode || "iso";

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    machinesRef.current = machines;
  }, [machines]);
  useEffect(() => {
    selectedMachineIdRef.current = selectedMachineId;
    updateSelectionRef.current?.(selectedMachineId);
  }, [selectedMachineId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf3f6f4, 14, 52);

    const camera = new THREE.PerspectiveCamera(39, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const compactScene = mount.clientWidth < 600;
    if (compactScene) {
      camera.fov = 55;
      camera.updateProjectionMatrix();
    }
    camera.position.set(compactScene ? 13 : 10.4, compactScene ? 12 : 5.7, compactScene ? 40 : 13.7);
    camera.lookAt(1.3, .75, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactScene ? 1.25 : 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(1.3, .75, 0);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.minDistance = 6.2;
    controls.maxDistance = compactScene ? 55 : 22;
    controls.minPolarAngle = Math.PI * .16;
    controls.maxPolarAngle = Math.PI * .49;
    controls.enablePan = true;
    controls.panSpeed = .55;
    controls.rotateSpeed = .55;
    controls.zoomSpeed = .72;
    const applyCameraView = (mode) => {
      if (mode === "top") {
        camera.position.set(1.3, compactScene ? 33 : 18, .1);
        controls.target.set(1.3, 0, -.2);
        controls.enableRotate = false;
      } else if (mode === "line") {
        camera.position.set(compactScene ? 7 : 3.8, compactScene ? 10 : 4.5, compactScene ? 40 : 17);
        controls.target.set(1.3, .55, .2);
        controls.enableRotate = true;
      } else {
        camera.position.set(compactScene ? 13 : 10.4, compactScene ? 12 : 5.7, compactScene ? 40 : 13.7);
        controls.target.set(1.3, .75, 0);
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
    const selectionEffects = [];
    const machineHalos = [];
    const isSelectedMachine = (id) => id === selectedMachineIdRef.current;
    const updateSelection = (id) => {
      machineHalos.forEach(({ machineId, ring }) => {
        const current = currentStatusForMachine(machineId);
        const alert = ["fault", "alarm", "warning"].includes(current);
        const color = current === "fault" ? 0xe13b35 : current === "alarm" ? 0xd27a12 : current === "warning" ? 0xe0a229 : 0x14aa72;
        ring.visible = alert || machineId === id;
        ring.material.color.setHex(alert ? color : 0x14aa72);
        ring.material.emissive.setHex(alert ? color : 0x14aa72);
      });
      selectionEffects.forEach(({ machineId, material, selectedValue, defaultValue, property }) => {
        material[property] = machineId === id ? selectedValue : defaultValue;
      });
    };
    updateSelectionRef.current = updateSelection;
    const isAlertStatus = (localStatus) => {
      return localStatus === "fault" || localStatus === "alarm" || localStatus === "warning";
    };
    const labelForMachine = (id) => {
      if (id === "EQUATOR300-VISUAL") {
        const simulatedMachine = getCurrentMachine("RENISHAW-EQUATOR300-001");
        const localStatus = machineStatus(simulatedMachine, simulatedMachine?.result);
        return {
          id,
          name: "Renishaw Equator 300",
          type: "模拟工厂质检工位 · 动画仅示意",
          status: localStatus,
          statusLabel: simulatedMachine ? machineStatusLabel(localStatus) : "无设备数据",
        };
      }
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
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd9ddde, roughness: .63, metalness: .03 });
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

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.36;
    // 不透明墙面/顶棚的阴影投射会在环氧地面上形成很大的三角形斑块。
    floor.receiveShadow = false;
    scene.add(floor);

    const addSceneBox = (size, position, material, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = !material.transparent && size[1] > .05;
      mesh.receiveShadow = material !== wallMat && !material.transparent;
      scene.add(mesh);
      return mesh;
    };

    addSceneBox([26, 2.6, .08], [0, .92, -7.2], wallMat);
    addSceneBox([.08, 2.25, 12.5], [-12.3, .78, -.6], wallMat);
    addSceneBox([.08, 2.25, 12.5], [12.3, .78, -.6], wallMat);
    addSceneBox([24, .08, .12], [0, 2.32, -6.95], roofMat);
    addSceneBox([.12, .08, 12], [-11.5, 2.16, -.8], roofMat);
    addSceneBox([.12, .08, 12], [11.5, 2.16, -.8], roofMat);

    // 使用略微抬高并带边缘收口的工业地面标线，避免与地面共面产生闪烁。
    const lineEdgeMat = new THREE.MeshStandardMaterial({ color: 0x707875, roughness: .78 });
    const addFloorLine = (size, position, paint) => {
      addSceneBox([size[0] + .035, .017, size[2] + .035], [position[0], -.332, position[2]], lineEdgeMat);
      addSceneBox([size[0], .019, size[2]], [position[0], -.313, position[2]], paint);
    };
    addFloorLine([6.8, 0, .075], [0, 0, 2], safetyMat);
    addFloorLine([6.8, 0, .075], [0, 0, -1.95], safetyMat);
    addFloorLine([.075, 0, 3.95], [-3.4, 0, .02], safetyMat);
    addFloorLine([.075, 0, 3.95], [3.4, 0, .02], safetyMat);
    const aisleMat = new THREE.MeshStandardMaterial({ color: 0xf4f4ed, roughness: .7 });
    addFloorLine([17, 0, .045], [0, 0, 2.52], aisleMat);
    addFloorLine([17, 0, .045], [0, 0, 3.92], aisleMat);

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

    // 原料进入送料机；加工件沿出料线到机械臂，再送 Equator300 检测。
    addConveyorSegment([-5.68, 2.45], [-5.68, .72], .55, 0);
    addConveyorSegment([2.45, 1.12], [4.85, 1.12], .55, 0);

    addSceneBox([1.45, .42, .75], [-6.15, -.08, -6.15], blockMat);
    addSceneBox([1.55, .13, .85], [-6.15, .22, -6.15], roofMat);
    addSceneBox([1.35, .38, .72], [6.05, -.08, -6.15], blockMat);
    addSceneBox([1.45, .12, .82], [6.05, .18, -6.15], roofMat);
    const fenceFrameMat = new THREE.MeshStandardMaterial({ color: 0x596970, roughness: .46, metalness: .55 });
    const fenceGlassMat = new THREE.MeshStandardMaterial({ color: 0x9bbfc4, roughness: .18, transparent: true, opacity: .24, depthWrite: false, side: THREE.DoubleSide });
    for (const x of [-3.25, -1.65, -.05, 1.55, 3.15]) {
      addSceneBox([.065, 1.22, .065], [x, .31, -2.25], fenceFrameMat);
      addSceneBox([.16, .035, .16], [x, -.32, -2.25], fenceFrameMat);
    }
    for (let i = 0; i < 3; i += 1) {
      const x = -2.45 + i * 1.6;
      addSceneBox([1.49, 1.06, .018], [x, .32, -2.25], fenceGlassMat);
      addSceneBox([1.54, .04, .06], [x, .89, -2.25], fenceFrameMat);
      addSceneBox([1.54, .04, .06], [x, -.25, -2.25], fenceFrameMat);
    }
    // 带边框的亚克力安全门，包含铰链、把手和顶部导轨。
    addSceneBox([1.49, 1.06, .018], [2.35, .32, -2.25], fenceGlassMat);
    addSceneBox([1.52, .045, .07], [2.35, .89, -2.25], fenceFrameMat);
    addSceneBox([1.52, .045, .07], [2.35, -.25, -2.25], fenceFrameMat);
    addSceneBox([.05, 1.14, .07], [1.59, .32, -2.25], fenceFrameMat);
    addSceneBox([.05, 1.14, .07], [3.11, .32, -2.25], fenceFrameMat);
    for (const y of [.02, .66]) addSceneBox([.09, .11, .12], [1.59, y, -2.17], railMat);
    addSceneBox([.035, .25, .09], [2.96, .28, -2.14], railMat);
    addSceneBox([6.48, .045, .07], [-.05, .94, -2.25], fenceFrameMat);
    for (const x of [-8.9, 8.9]) {
      const z = -6.35;
      addSceneBox([.85, 1.65, .62], [x, .5, z], solidBodyMat);
      addSceneBox([.62, .35, .025], [x, .95, z + .33], darkMat);
      addSceneBox([.08, .2, .05], [x + .32, .45, z + .34], railMat);
      for (let i = 0; i < 5; i += 1) addSceneBox([.48, .014, .015], [x, .15 + i * .055, z + .33], railMat);
      for (const footX of [-.3, .3]) addSceneBox([.1, .08, .1], [x + footX, -.32, z], railMat);
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
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, .035, 8, 64),
        new THREE.MeshStandardMaterial({
          color: 0x14aa72,
          emissive: 0x14aa72,
          emissiveIntensity: .35,
          transparent: true,
          opacity: .9,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position[0], -.28, position[2]);
      ring.visible = false;
      scene.add(ring);
      machineHalos.push({ machineId: id, ring });
      return ring;
    };

    const addMachineAlert = (id, position) => {
      const glow = new THREE.PointLight(0xff2525, 0, 4.8);
      glow.position.set(position[0], 1.05, position[2]);
      scene.add(glow);
      alertEffects.push({ id, glow });
      return glow;
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
      selectionEffects.push({ machineId: id, material: accentLocal, property: "emissiveIntensity", selectedValue: .16, defaultValue: .05 });
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
      addMachineAlert(id, [feederGroup.position.x, feederGroup.position.y, feederGroup.position.z]);
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
      selectionEffects.push({ machineId: id, material: accentLocal, property: "emissiveIntensity", selectedValue: .18, defaultValue: .06 });
      const robotShellMat = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: .34, metalness: .08 });
      const robotArmMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, roughness: .24, metalness: .62 });
      const robotBandMat = new THREE.MeshStandardMaterial({ color: 0x172b68, roughness: .28, metalness: .2 });
      const robotDarkMat = new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: .42, metalness: .4 });
      const robotGroup = new THREE.Group();
      robotGroup.position.set(workshopLayout.robot[0], -.25, workshopLayout.robot[1]);
      scene.add(robotGroup);
      addMachineHalo(id, [robotGroup.position.x, robotGroup.position.y, robotGroup.position.z], .85);
      addMachineAlert(id, [robotGroup.position.x, robotGroup.position.y, robotGroup.position.z]);
      addTowerLamp(id, workshopLayout.robot[0], 1.42, workshopLayout.robot[1]);

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
    const inspection = createEquator300();
    inspection.root.position.set(workshopLayout.inspection[0], -.3, workshopLayout.inspection[1]);
    scene.add(inspection.root);
    addMachineHalo("RENISHAW-EQUATOR300-001", [workshopLayout.inspection[0], -.3, workshopLayout.inspection[1]], .95);
    addMachineAlert("RENISHAW-EQUATOR300-001", [workshopLayout.inspection[0], -.3, workshopLayout.inspection[1]]);
    const inspectionHitBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.76, 1.6), hitMat);
    inspectionHitBox.position.set(workshopLayout.inspection[0], .56, workshopLayout.inspection[1]);
    scene.add(inspectionHitBox);
    registerMachineObject(inspection.root, "EQUATOR300-VISUAL", inspectionHitBox);
    inspectionHitBox.userData.machineId = "EQUATOR300-VISUAL";
    addTowerLamp("RENISHAW-EQUATOR300-001", workshopLayout.inspection[0], 1.57, workshopLayout.inspection[1]);

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
    const boxPosition = new THREE.Vector3(workshopLayout.qualified[0], -.16, workshopLayout.qualified[1]);
    const rejectPosition = new THREE.Vector3(workshopLayout.rework[0], -.16, workshopLayout.rework[1]);
    const rejectMat = new THREE.MeshStandardMaterial({ color: 0x9a7250, roughness: .68, metalness: .08 });
    const addBin = (position, material, label) => {
      const { x, y, z } = position;
      addSceneBox([1.05, .12, .82], [x, y, z], material);
      for (const side of [-1, 1]) {
        addSceneBox([.08, .47, .82], [x + side * .52, y + .25, z], material);
        addSceneBox([.16, .065, .28], [x + side * .56, y + .51, z], railMat);
        for (const offset of [-.22, .22]) addSceneBox([.025, .4, .08], [x + side * .565, y + .25, z + offset], railMat);
      }
      for (const side of [-1, 1]) {
        addSceneBox([1.05, .47, .08], [x, y + .25, z + side * .41], material);
        for (const offset of [-.35, .35]) addSceneBox([.045, .4, .025], [x + offset, y + .25, z + side * .455], railMat);
      }
      addSceneBox([1.15, .065, .07], [x, y + .51, z + .41], railMat);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 96;
      const context = canvas.getContext("2d");
      context.fillStyle = "#e4e8e7";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#26343b";
      context.font = "bold 46px sans-serif";
      context.textAlign = "center";
      context.fillText(label, 128, 66);
      const texture = new THREE.CanvasTexture(canvas);
      const sticker = new THREE.Mesh(new THREE.PlaneGeometry(.5, .18), new THREE.MeshStandardMaterial({ map: texture, roughness: .75 }));
      sticker.position.set(x, y + .26, z + .457);
      scene.add(sticker);
    };
    addBin(boxPosition, boxMat, "合格品");
    addBin(rejectPosition, rejectMat, "待处理");

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
    addMachineAlert("TRAK-TC820LTYSI-001", [group.position.x, group.position.y, group.position.z]);
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
    const toRobotLocal = (point, y) => new THREE.Vector3(point[0] - workshopLayout.robot[0], y, point[1] - workshopLayout.robot[1]);
    const toolPickHoverPosition = toRobotLocal(workshopLayout.pickup, 1.12);
    const toolPickPosition = toRobotLocal(workshopLayout.pickup, .7);
    const toolLiftPosition = new THREE.Vector3(.1, 1.42, 1.12);
    const toolInspectHoverPosition = toRobotLocal(workshopLayout.inspection, 1.13);
    const toolInspectDropPosition = toRobotLocal(workshopLayout.inspection, .58);
    const toolQualifiedHoverPosition = toRobotLocal(workshopLayout.qualified, 1.25);
    const toolQualifiedDropPosition = toRobotLocal(workshopLayout.qualified, .95);
    const toolReworkHoverPosition = toRobotLocal(workshopLayout.rework, 1.25);
    const toolReworkDropPosition = toRobotLocal(workshopLayout.rework, .95);
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
    const handoffPickWorld = new THREE.Vector3(workshopLayout.pickup[0], .08, workshopLayout.pickup[1]);
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
      const robotCycle = (time % 12) / 12;

      const machining = robotCycle < .38;
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
        // 一个周期包含两次机器人交接：输送线 → 检测台，检测台 → 一个示意性出料箱。
        const outputToRework = Math.floor(time / 12) % 2 === 1;
        const binHover = outputToRework ? toolReworkHoverPosition : toolQualifiedHoverPosition;
        const binDrop = outputToRework ? toolReworkDropPosition : toolQualifiedDropPosition;
        const carrying = (robotCycle >= .25 && robotCycle < .56) || (robotCycle >= .83 && robotCycle < .96);
        const gripping = (robotCycle >= .22 && robotCycle < .6) || (robotCycle >= .78 && robotCycle < .97);
        let toolPosition = toolHomePosition;
        if (robotCycle < .1) {
          toolPosition = toolHomePosition;
        } else if (robotCycle < .2) {
          toolPosition = moveBetween(toolHomePosition, toolPickHoverPosition, easeInOut((robotCycle - .1) / .1));
        } else if (robotCycle < .25) {
          toolPosition = moveBetween(toolPickHoverPosition, toolPickPosition, easeInOut((robotCycle - .2) / .05));
        } else if (robotCycle < .28) {
          toolPosition = toolPickPosition;
        } else if (robotCycle < .38) {
          toolPosition = moveBetween(toolPickPosition, toolPickHoverPosition, easeInOut((robotCycle - .28) / .1));
        } else if (robotCycle < .5) {
          toolPosition = moveOverArc(toolPickHoverPosition, toolLiftPosition, toolInspectHoverPosition, easeInOut((robotCycle - .38) / .12));
        } else if (robotCycle < .56) {
          toolPosition = moveBetween(toolInspectHoverPosition, toolInspectDropPosition, easeInOut((robotCycle - .5) / .06));
        } else if (robotCycle < .6) {
          toolPosition = toolInspectDropPosition;
        } else if (robotCycle < .66) {
          toolPosition = moveBetween(toolInspectDropPosition, toolInspectHoverPosition, easeInOut((robotCycle - .6) / .06));
        } else if (robotCycle < .72) {
          toolPosition = toolInspectHoverPosition;
        } else if (robotCycle < .78) {
          toolPosition = moveBetween(toolInspectHoverPosition, toolInspectDropPosition, easeInOut((robotCycle - .72) / .06));
        } else if (robotCycle < .83) {
          toolPosition = toolInspectDropPosition;
        } else if (robotCycle < .87) {
          toolPosition = moveBetween(toolInspectDropPosition, toolInspectHoverPosition, easeInOut((robotCycle - .83) / .04));
        } else if (robotCycle < .93) {
          toolPosition = moveOverArc(toolInspectHoverPosition, toolHomePosition, binHover, easeInOut((robotCycle - .87) / .06));
        } else if (robotCycle < .96) {
          toolPosition = moveBetween(binHover, binDrop, easeInOut((robotCycle - .93) / .03));
        } else if (robotCycle < .975) {
          toolPosition = binDrop;
        } else {
          toolPosition = moveOverArc(binDrop, binHover, toolHomePosition, easeInOut((robotCycle - .975) / .025));
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
        if (robotCycle < .25) {
          handoffScrew.visible = true;
          handoffScrew.position.copy(handoffPickWorld);
        } else {
          handoffScrew.visible = false;
        }
      }
      // 交替路径仅用于展示流程，不代表实际测量的合格/不合格结论。
      inspection.workpiece.visible = robotCycle >= .56 && robotCycle < .83;

      finishedParts.slice(1).forEach((part) => {
        const progress = (time * .17 + part.userData.offset) % 1;
        const stagedProgress = progress > .86 ? .86 + (progress - .86) * .18 : progress;
        pointOnMotionPath(finishedMotionPath, stagedProgress, tempB);
        part.position.copy(tempB);
        part.rotation.x = time * 2.6;
        part.rotation.y = Math.sin(time * 1.6 + part.userData.offset) * .08;
      });

      boxedScrews.forEach((screw, index) => { screw.visible = index < 3 + Math.floor(time / 12) % 7; });

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
        effect.glow.intensity = shouldAlert ? 2.2 + pulse * 2.4 : 0;
      });
      towerLamps.forEach(({ id, lamps }) => {
        const current = currentStatusForMachine(id);
        const active = current === "idle" ? -1 : current === "fault" || current === "alarm" ? 0 : current === "warning" ? 1 : 2;
        lamps.forEach((lamp, index) => { lamp.emissiveIntensity = index === active ? (active === 0 ? .8 + Math.abs(Math.sin(time * 5)) * 1.3 : .9) : .04; });
      });
      controls.update();
      renderer.render(scene, camera);
    };
    updateSelection(selectedMachineIdRef.current);
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
    const handleClick = (event) => {
      const machineId = pickMachineAtPointer(event) || hoveredMachineRef.current;
      if (machineId === "EQUATOR300-VISUAL") {
        if (getCurrentMachine("RENISHAW-EQUATOR300-001")) onSelectRef.current("RENISHAW-EQUATOR300-001");
      } else if (machineId) onSelectRef.current(machineId);
    };
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("click", handleClick);

    return () => {
      updateSelectionRef.current = null;
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
          else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
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

function MachineDetailDrawer({ machine, result, sample, dataSource, history, onClose }) {
  const status = machineStatus(machine, result);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="machine-drawer" role="dialog" aria-modal="true" aria-label={`${machine.name}设备详情`} onClick={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">{machine.area || machine.line}</span>
            <h2>{machine.name}</h2>
            <p>{machine.type} · {machine.id}</p>
            {machine.live && <p>数据源：{dataSource || "监控服务"}{String(dataSource || "").includes("模拟") ? "（非实体测量）" : ""}</p>}
          </div>
          <button className="button" type="button" onClick={onClose} aria-label="关闭设备详情">关闭</button>
        </div>
        <div className="drawer-status">
          <div><span>状态</span><strong className={status}>{machineStatusLabel(status)}</strong></div>
          <div><span>健康度</span><strong>{machine.live ? formatMonitorHealth(sample) : "--"}</strong></div>
          <div><span>当前报警</span><strong>{machine.live ? displayAlarm(sample) : "--"}</strong></div>
        </div>
        <div className="drawer-section">
          <span className="eyebrow">工位与数据</span>
          <p>{machine.flow || "设备工艺信息暂未提供"}</p>
          {machine.live && sample && <p>最近采样：{formatTime(sample.timestamp)} · 运行阶段：{displayCycleState(sample)}</p>}
        </div>
        {!machine.live ? (
          <div className="drawer-no-data"><strong>该工位尚未接入实时采集</strong><p>三维模型可查看；健康度、测量值和报警状态暂不提供。</p></div>
        ) : sample ? (
          <>
            <MetricsPanel result={result} sample={sample} machine={machine} />
            <DecisionPanel result={result} sample={sample} />
            <TrendPanel machine={machine} history={history} />
          </>
        ) : <div className="drawer-no-data"><strong>等待设备采样</strong><p>接入正常后，实时指标与监测判定会显示在这里。</p></div>}
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
      {machine?.deviceType === "turning_center" && sample?.vibration == null && sample?.metrics?.spindle_vibration_mm_s == null && sample?.metrics?.spindle_vibration_rms == null && (
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

function DecisionPanel({ result, sample }) {
  const status = result?.status || "normal";
  const observations = result?.observations || [];
  return (
    <section className="panel decision-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">监测判定</span><h2>规则引擎</h2></div>
        <span className={`severity-pill ${severityClass(status)}`}>{labelFor(statusLabels, status)}</span>
      </div>
      <div className={`decision-reason ${severityClass(status)}`}>
        <span>故障 / 预警原因</span>
        <strong>{machineAlertReason({ result, sample })}</strong>
      </div>
      <ObservationList observations={observations} />
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



function PipelineData({ snapshot }) {
  return snapshot?.diagnosis?.pipeline || {};
}


function DiagnosisWorkspace({ snapshot, sample }) {
  const view = buildDiagnosisView(snapshot, sample);
  const pipeline = view.isCurrent ? getLatestPipeline(snapshot, sample) : {};
  const runtime = pipeline.runtime_result || {};
  const status = ({ completed: "诊断已返回", waiting: "等待诊断", running: "正在诊断", recovering: "正在回查结果",
    blocked: "证据不足，待核实", failed: "诊断调用失败", unknown: "结果待确认", idle: "等待异常事件" })[view.status] || view.status;
  const confidence = view.confidence == null ? "--" : `${Math.round(view.confidence * 100)}%`;
  const alarm = sample?.alarm_label || sample?.alarm_code || "当前无活动报警";
  return (
    <section className="workspace-view active module-board diagnosis-workspace" aria-label="智能诊断">
      <ModuleHero eyebrow="Runtime Diagnosis" title="智能诊断" text="基于实时事件、知识证据和工程数据生成可追溯的诊断结论。" />
      <div className="module-grid">
        <ModuleStat label="诊断状态" value={status} text={view.deviceId || "等待设备"} />
        <ModuleStat label="置信度" value={confidence} text="Evaluator 评估结果" />
        <ModuleStat label="当前报警" value={alarm} text={runtime.stop_reason || pipeline.stop_reason || "持续监测中"} />
      </div>
      <div className="answer-grid diagnosis-content-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">诊断结论</span><h2>当前判断</h2></div></div>
          <FormattedText value={view.summary} className="diagnosis-summary" />
          {view.statusHint && <div className="notice-banner" role="status">{view.statusHint}</div>}
          {view.error && <div className="inline-error" role="alert">{view.error}</div>}
          {view.cause && <div className="diagnosis-recommendation"><span className="section-kicker">根因判断</span><FormattedText value={view.cause} /></div>}
          {view.recommendation && <div className="diagnosis-recommendation"><span className="section-kicker">处置建议</span><FormattedText value={view.recommendation} /></div>}
          {view.nextAction && <div className="diagnosis-recommendation"><span className="section-kicker">下一步</span><FormattedText value={view.nextAction} /></div>}
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">Evidence</span><h2>诊断依据</h2></div><span className="step-count">{view.evidence.length} 条</span></div>
          {view.evidence.length ? <StepList steps={view.evidence} /> : <div className="empty-state">等待 Runtime 收集证据</div>}
        </section>
      </div>
    </section>
  );
}

function machineAlertReason(machine) {
  const result = machine?.result;
  const sample = result?.current_sample || machine?.sample;
  const observations = Array.isArray(result?.observations) ? result.observations : [];
  const evidenceReason = monitorEvidenceReason(sample);
  if (evidenceReason) return evidenceReason;
  if (observations.length) {
    return observations
      .slice(0, 3)
      .map((item) => `${item.label || observationLabel(item)}：${item.message || "检测值异常"}`)
      .join("；");
  }
  if (sample?.alarm_code) return `${sample.alarm_label || "设备报警"}（报警 ${sample.alarm_code}）`;
  if (result?.status === "fault") return "设备当前状态不可运行";
  if (machine?.live === false || (!machine?.live && !sample && !result)) return "未接入实时采集，无法判断故障原因";
  return "当前未检测到异常";
}

function preferredWorkorderId(items, sample, snapshot) {
  const incident = currentIncident(snapshot, sample);
  const deviceId = incident.device_id, alarmCode = incident.alarm_code;
  const exact = items.find(item => matchesIncident({...item,alarm_code:getWorkorderAlarmCode(item)},incident));
  const sameDevice = items.find((item) => String(item.device_id || "") === deviceId);
  // 存在报警时，绝不能静默回退到其他报警的工单，否则历史工单会被误显示为当前事件。
  if (alarmCode) return exact?.workorder_id || "";
  return sameDevice?.workorder_id || items[0]?.workorder_id || "";
}

function LogsWorkspace({ snapshot, active = true }) {
  const [runRecords, setRunRecords] = useState([]);
  const [details, setDetails] = useState({ runId: "", records: [] });
  const [filter, setFilter] = useState("all");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [indexError, setIndexError] = useState("");
  const [detailError, setDetailError] = useState("");
  const indexRequest = useRef(null);
  const indexLoaded = useRef(false);
  const lastIndexRead = useRef(0);
  const detailGeneration = useRef(0);
  const detailRequest = useRef(null);
  const [detailRevision, setDetailRevision] = useState(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const selectedRunRef = useRef(selectedRunId);
  selectedRunRef.current = selectedRunId;

  function loadTraceIndex(manual = false) {
    if (!activeRef.current) return Promise.resolve(null);
    if (manual || !indexLoaded.current) setLoading(true);
    if (indexRequest.current) return indexRequest.current.promise;
    const entry = { controller: new AbortController() };
    const isCurrent = () => indexRequest.current === entry && activeRef.current;
    entry.promise = request("/api/runs?limit=5000", { signal: entry.controller.signal }).then(body => {
      if (!isCurrent()) return null;
      const nextRuns = normalizeRunResponse(body);
      indexLoaded.current = true;
      lastIndexRead.current = Date.now();
      setRunRecords(nextRuns);
      setSelectedRunId((current) => current && nextRuns.some((run) => run.run_id === current)
        ? current
        : nextRuns[0]?.run_id || "");
      setIndexError(body.storage_warning || "");
      return nextRuns;
    }).catch(requestError => {
      if (isCurrent()) setIndexError(requestError.message || "日志服务暂不可用");
      return null;
    }).finally(() => {
      if (indexRequest.current === entry) {
        indexRequest.current = null;
        setLoading(false);
      }
    });
    indexRequest.current = entry;
    return entry.promise;
  }

  async function refreshLogs() {
    const nextRuns = await loadTraceIndex(true);
    if (nextRuns && activeRef.current) setDetailRevision(current => current + 1);
  }

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let timer;
    async function poll() {
      await loadTraceIndex();
      if (!disposed) timer = window.setTimeout(poll, 5000);
    }
    // 最近读取过的索引无需因切页重复请求；旧内容始终可见。
    const delay = indexLoaded.current ? Math.max(0, 5000 - (Date.now() - lastIndexRead.current)) : 0;
    if (delay) timer = window.setTimeout(poll, delay);
    else poll();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      indexRequest.current?.controller.abort();
      indexRequest.current = null;
      setLoading(false);
    };
  }, [active]);

  const selectedRun = runRecords.find((run) => run.run_id === selectedRunId) || null;
  const detailVersion = JSON.stringify([selectedRunId, selectedRun?.trace_ids, selectedRun?.trace_id,
    selectedRun?.event_count, selectedRun?.ended_at, selectedRun?.status, selectedRun?.error_count, detailRevision]);

  useEffect(() => {
    return () => {
      detailGeneration.current++;
      detailRequest.current?.controller.abort();
      detailRequest.current = null;
      setLoadingDetails(false);
    };
  }, [active, selectedRunId]);

  useEffect(() => {
    if (!active || !selectedRun || detailRequest.current || (details.runId === selectedRunId && details.version === detailVersion)) return;
    const generation = ++detailGeneration.current;
    const controller = new AbortController();
    const entry = { controller };
    detailRequest.current = entry;
    const runId = selectedRunId;
    const isCurrent = () => activeRef.current && generation === detailGeneration.current && selectedRunRef.current === runId;
    const traceIds = (Array.isArray(selectedRun.trace_ids) && selectedRun.trace_ids.length ? selectedRun.trace_ids : [selectedRun.trace_id])
      .filter(value => value && !String(value).startsWith("event-"));
    setDetailError("");
    setLoadingDetails(true);
    Promise.all(traceIds.map(value => request(`/api/trace?trace_id=${encodeURIComponent(value)}&limit=5000`, { signal: controller.signal })))
      .then(bodies => {
        if (!isCurrent()) return;
        setDetails({ runId, version: detailVersion, records: bodies.flatMap(body => normalizeTraceResponse(body)) });
        setDetailError(bodies.map(body => body.storage_warning || "").filter(Boolean).join("；"));
      }).catch(requestError => {
        if (isCurrent()) setDetailError(requestError.message || "完整日志读取失败");
      }).finally(() => {
        if (detailRequest.current === entry) {
          detailRequest.current = null;
          setLoadingDetails(false);
        }
      });
    // 同一运行先完成在途读取；若期间版本增长，已读版本更新后再补取。
  }, [active, selectedRunId, detailVersion, details.version]);

  const records = useMemo(() => details.runId === selectedRunId ? details.records.filter(record => selectedRun && runEventMatches(selectedRun, record)) : [], [details, selectedRunId, selectedRun]);
  const initialDetailsLoading = loadingDetails && !(details.runId === selectedRunId && details.version);
  const filteredRecords = records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "error") return Boolean(record.error) || /error|failed|timeout/i.test(String(record.event || ""));
    return String(record.type || "").toLowerCase() === filter;
  }).slice().reverse();
  const traceCount = runRecords.length;
  const qualityRunCount = runRecords.filter((run) => run.run_type === "quality").length;
  const toolCount = records.filter((record) => record.type === "tool" || record.tool_name || record.tool).length;
  const errorCount = records.filter((record) => Boolean(record.error) || /error|failed|timeout/i.test(String(record.event || ""))).length;
  const agentInvocations = useMemo(() => buildAgentInvocations(records), [records]);
  const error = [indexError, detailError].filter(Boolean).join("；");
  const statusText = (status) => ({ completed: "已完成", running: "进行中", error: "异常", pending: "待执行", blocked: "待补充或处理" }[status] || status || "待执行");

  return (
    <section className="workspace-view active module-board logs-workspace" aria-label="日志系统" hidden={!active} style={active ? undefined : { display: "none" }}>
      <ModuleHero eyebrow="Runtime Logs" title="日志系统" text="一次完整故障闭环只形成一条运行记录：监控 → 诊断 → 维修方案 → 工单派发 → 报告中心 → 经验总结；质检始终独立成单。" action={<button className="button" type="button" onClick={refreshLogs} disabled={loading}>{loading ? "刷新中…" : "刷新运行记录"}</button>} />
      {error && <div className="workspace-notice logs-notice" role="status">日志读取提示：{error}</div>}
      <div className="module-grid logs-stat-grid">
        <ModuleStat label="事件总数" value={records.length} text="Trace Recorder 保留记录" />
        <ModuleStat label="运行记录" value={traceCount} text="故障闭环、RAG 问答与质检" />
        <ModuleStat label="独立质检" value={qualityRunCount} text="不会并入故障闭环" />
        <ModuleStat label="工具调用" value={toolCount} text="含输入参数与返回体" />
        <ModuleStat label="异常事件" value={errorCount} text={errorCount ? "需要进一步检查" : "当前没有错误记录"} />
      </div>
      <section className="panel module-panel logs-panel logs-runs-panel" aria-label="运行记录">
        <div className="panel-heading logs-panel-heading"><div><span className="eyebrow">Lifecycle Runs</span><h2>运行记录</h2></div><span className="logs-run-hint">故障从监控开始，到报告与经验总结结束</span></div>
        {runRecords.length ? <div className="logs-runs-list">{runRecords.map((run) => <button key={run.run_id} type="button" className={`logs-run-card ${selectedRunId === run.run_id ? "is-selected" : ""}`} onClick={() => setSelectedRunId(run.run_id)}>
          <div className="logs-run-card-head"><strong>{run.label || (run.run_type === "quality" ? "质检运行" : "运行记录")}</strong><span className={`logs-run-status logs-run-${run.status}`}>{statusText(run.status)}</span></div>
          <div className="logs-run-card-title">{run.device_id ? getDeviceDisplayName(run.device_id, { snapshot }) : "未绑定设备"}{run.alarm_code ? ` · 报警 ${run.alarm_code}` : ""}</div>
          <div className="logs-run-card-meta"><span>{run.started_at ? formatTime(run.started_at) : "--"}</span><span>{run.event_count || 0} 个事件</span><span>{run.error_count || 0} 个异常</span></div>
          <div className="logs-run-phases">{(run.phases || []).map((phase) => <span key={phase.id} className={`logs-phase logs-phase-${phase.status}`}><i />{phase.label} · {statusText(phase.status)}</span>)}</div>
          <div className="logs-run-id">{run.run_id}</div>
        </button>)}</div> : <div className="empty-state logs-empty">暂无运行记录；监控确认故障或执行质检后，这里会生成生命周期记录。</div>}
      </section>
      <section className="panel module-panel logs-panel" aria-label="执行日志">
        <div className="panel-heading logs-panel-heading">
          <div><span className="eyebrow">Execution Timeline</span><h2>执行明细</h2></div>
          <div className="logs-filter" aria-label="日志筛选">
            <select className="select-input logs-trace-select" value={selectedRunId} onChange={(event) => setSelectedRunId(event.target.value)} aria-label="按运行记录筛选"><option value="">选择运行记录</option>{runRecords.map((run) => <option key={run.run_id} value={run.run_id}>{run.label || "运行记录"} · {run.run_id}</option>)}</select>
            {[['all', '全部'], ['agent', 'Agent'], ['tool', '工具'], ['runtime', '运行时'], ['error', '异常']].map(([value, label]) => <button key={value} type="button" className={`logs-filter-button ${filter === value ? "is-active" : ""}`} onClick={() => setFilter(value)}>{label}</button>)}
          </div>
        </div>
        {!initialDetailsLoading && <section className="agent-invocations" aria-label="Agent调用明细">
          <div className="agent-invocations-heading"><div><span className="eyebrow">Agent Invocation I/O</span><h3>Agent 调用明细</h3></div><span className="logs-run-hint">每次调用独立编号，完整展示输入 → 上下文 → 工具 → 输出</span></div>
          {agentInvocations.length ? <div className="agent-invocation-list">{agentInvocations.map((invocation) => <article className={`agent-invocation-card agent-invocation-${invocation.status === "异常" ? "error" : invocation.status === "执行中" ? "running" : "done"}`} key={invocation.id}>
            <div className="agent-invocation-head">
              <div><span className="agent-invocation-kicker">第 {invocation.invocation_no} 次 Agent 调用</span><h4>{invocation.agent}</h4></div>
              <span className="log-event-status">{invocation.status}</span>
            </div>
            <div className="agent-invocation-meta"><span>agent_run_id：{invocation.agent_run_id}</span><span>Trace：{invocation.trace_id || "--"}</span><span>Task：{invocation.task_id || "--"}</span><span>开始：{invocation.started_at ? formatTime(invocation.started_at) : "--"}</span><span>结束：{invocation.ended_at ? formatTime(invocation.ended_at) : "--"}</span><span>耗时：{invocation.duration}</span><span>事件：{invocation.event_count}</span></div>
            {invocation.error && <div className="log-event-error agent-invocation-error-text">错误：{invocation.error}</div>}
            <div className="agent-io-stack">
              <section className="agent-io-block"><h5>输入（Input）</h5><pre className="log-json">{formatTraceValue(invocation.input)}</pre></section>
              <section className="agent-io-block"><h5>上下文（Context）</h5><pre className="log-json">{formatTraceValue(invocation.context)}</pre></section>
              <section className="agent-io-block"><h5>MD Skill 执行步骤 · {invocation.skill_steps.length} 步</h5>{invocation.skill_steps.map((step,index) => <details key={`${invocation.id}-skill-${index}`}><summary>#{index+1} {step.skill || "基础步骤（未绑定技能）"} → {step.step} · {step.status}</summary><h6>步骤输入</h6><pre className="log-json">{formatTraceValue(step.input)}</pre><h6>步骤输出</h6><pre className="log-json">{formatTraceValue(step.output)}</pre>{step.error && <p className="inline-error">{step.error}</p>}</details>)}</section>
              <section className="agent-io-block agent-tool-chain"><h5>工具调用链（Tool Calls） · {invocation.tool_calls.length} 次</h5>{invocation.tool_calls.length ? <div className="agent-tool-list">{invocation.tool_calls.map((tool) => <section className="agent-tool-call" key={`${invocation.id}-${tool.call_no}-${tool.tool_name}`}><div className="agent-tool-head"><strong>#{tool.call_no} {tool.tool_name}</strong><span>{tool.status}{tool.mcp_server ? ` · MCP ${tool.mcp_server}` : ""} · {tool.duration}</span></div><div className="agent-tool-meta"><span>技能：{tool.context?.skill || "未绑定"} → {tool.context?.step || "--"}</span><span>开始：{tool.started_at ? formatTime(tool.started_at) : "--"}</span><span>结束：{tool.ended_at ? formatTime(tool.ended_at) : "--"}</span><span>事件：{tool.event_count}</span></div><div className="agent-tool-io"><div><h6>工具输入</h6><pre className="log-json">{formatTraceValue(tool.input)}</pre></div><div><h6>工具输出</h6><pre className="log-json">{formatTraceValue(tool.output)}</pre></div></div>{tool.error && <div className="log-event-error">错误：{tool.error}</div>}</section>)}</div> : <div className="agent-io-empty">本次 Agent 没有记录工具调用。</div>}</section>
              <section className="agent-io-block"><h5>输出（Output）</h5><pre className="log-json">{formatTraceValue(invocation.output)}</pre></section>
            </div>
          </article>)}</div> : <div className="empty-state logs-empty">当前运行记录没有 Agent 生命周期事件；请刷新或先执行一次监控→诊断→维修方案→工单闭环。</div>}
        </section>}
        <div className="logs-subsection-heading"><span className="eyebrow">Raw Events</span><h3>底层事件明细</h3><span>保留每条原始记录，便于核对调用顺序与返回体</span></div>
        {initialDetailsLoading ? <div className="empty-state logs-empty">正在加载所选执行链路的完整返回体…</div> : filteredRecords.length ? <div className="logs-list">{filteredRecords.map((record, index) => {
          const summary = traceEventSummary(record);
          const identity = traceIdentity(record, index);
          return <article className={`log-event log-event-${summary.status === "异常" ? "error" : summary.status === "执行中" ? "running" : "done"}`} key={record.trace_record_id || `${identity}-${record.timestamp || index}-${record.event || ""}-${record.name || ""}`}>
            <div className="log-event-head">
              <div className="log-event-title"><span className="log-event-index">{filteredRecords.length - index}</span><div><strong>{summary.label}</strong><h3>{summary.operation}</h3></div></div>
              <span className="log-event-status">{summary.status}</span>
            </div>
            <div className="log-event-meta"><span>{record.timestamp ? formatTime(record.timestamp) : "--"}</span><span>类型：{record.type || "--"}</span><span>事件：{record.event || "--"}</span><span>Trace：{record.trace_id || "--"}</span><span>Task：{record.task_id || "--"}</span>{summary.server && <span>MCP：{summary.server}</span>}{summary.duration !== "--" && <span>耗时：{summary.duration}</span>}</div>
            {record.error && <div className="log-event-error">错误：{record.error}</div>}
            <div className="log-event-details">{traceDetailSections(record).map((detail) => <details key={detail.key} className="log-detail" open={detail.key === "operation"}><summary>{detail.title}</summary><pre className="log-json">{detail.value}</pre></details>)}</div>
          </article>;
        })}</div> : <div className="empty-state logs-empty">暂无执行日志；触发一次诊断、知识检索或工单操作后，这里会显示完整执行链路。</div>}
      </section>
    </section>
  );
}

function ReportWorkspace({ snapshot }) {
  const pipeline = PipelineData({ snapshot });
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportError, setReportError] = useState("");
  const [loadingReports, setLoadingReports] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState("");
  const [pdfReportIds, setPdfReportIds] = useState([]);
  const reportGeneration = useRef(0);
  const currentReportRef = useRef("");
  const [sourceType,setSourceType] = useState('plan_id');
  const [sourceId,setSourceId] = useState('');
  const [generatingReport,setGeneratingReport] = useState(false);
  async function generateReport() {
    setGeneratingReport(true);
    try {
      const result = await request('/api/reports/generate',{method:'POST',body:JSON.stringify({[sourceType]:sourceId.trim()})});
      await loadReports();
      setSelectedReportId(result.report_id);
      setReportError('');
    } catch (err) {setReportError(err.message);}
    finally {setGeneratingReport(false);}
  }

  async function loadReports() {
    const generation = ++reportGeneration.current;
    setLoadingReports(true);
    try {
      const body = await request("/api/reports");
      if (generation !== reportGeneration.current) return;
      const items = (body.items || []).map((item) => item?.report && typeof item.report === "object" ? item.report : item).filter(Boolean);
      setReports(items);
      setSelectedReportId((current) => items.some((item) => item.report_id === current) ? current : items[0]?.report_id || "");
      setPdfReportIds((current) => current.filter((id) => items.some((item) => item.report_id === id)));
      setReportError("");
    } catch (error) {
      if (generation === reportGeneration.current) setReportError(error.message);
    } finally {
      if (generation === reportGeneration.current) setLoadingReports(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let timer;
    async function poll() {
      await loadReports();
      if (!cancelled) timer = window.setTimeout(poll, 5000);
    }
    poll();
    return () => { cancelled = true; reportGeneration.current++; window.clearTimeout(timer); };
  }, []);
  const reportItems = reports.map((item) => item?.report && typeof item.report === "object" ? item.report : item).filter(Boolean);
  const persistedReport = reportItems.find((item) => item.report_id === selectedReportId) || reportItems[0];
  const report = persistedReport || pipeline.report || {};
  currentReportRef.current = report.report_id || "";
  const pdfReady = pdfReportIds.includes(report.report_id);
  const completeness = reportCompleteness(report);
  const sections = report.sections || {};
  const displaySections = buildReportDisplaySections(sections);
  const hasReport = Boolean(report.report_id || report.title || report.summary || Object.keys(sections).length);
  const pdfUrl = report.report_id ? `/api/reports/${encodeURIComponent(report.report_id)}/pdf` : "";
  async function generatePdf() {
    if (!report.report_id) return;
    const reportId = report.report_id;
    setGeneratingPdf(reportId);
    try {
      await request(`/api/reports/${encodeURIComponent(reportId)}/pdf`, { method: "POST", body: JSON.stringify({}) });
      setPdfReportIds((current) => current.includes(reportId) ? current : [...current, reportId]);
      if (currentReportRef.current === reportId) setReportError("");
    } catch (error) {
      if (currentReportRef.current === reportId) setReportError(`PDF 生成失败：${error.message}`);
    } finally {
      setGeneratingPdf("");
    }
  }
  async function deleteReport(reportId) {
    if (!reportId || !window.confirm(`确定删除报告 ${reportId} 吗？删除后不可恢复。`)) return;
    try {
      await request(`/api/reports/${encodeURIComponent(reportId)}`, { method: "DELETE" });
      const remaining = reportItems.filter((item) => item.report_id !== reportId);
      setReports(remaining);
      setSelectedReportId(remaining[0]?.report_id || "");
      setPdfReportIds((current) => current.filter((id) => id !== reportId));
      setReportError("");
    } catch (error) {
      setReportError(error.message);
    }
  }
  return (
    <section className="workspace-view active module-board report-workspace" aria-label="报告中心">
      <section className="panel module-panel"><h2>从已有业务记录生成报告</h2><label className="field-label">来源类型</label><select className="select-input" value={sourceType} onChange={event=>setSourceType(event.target.value)}><option value="plan_id">维修方案 PLAN</option><option value="workorder_id">工单 WO</option><option value="quality_check_id">质检 QC</option></select><label className="field-label">来源编号</label><input className="select-input" value={sourceId} onChange={event=>setSourceId(event.target.value)} placeholder="输入已保存的 PLAN、WO 或 QC 编号"/><p>Report Agent 汇总服务器保存的内容；未完成维修不会标记闭环完成。</p><button className="button primary" disabled={generatingReport || !sourceId.trim()} onClick={generateReport}>{generatingReport ? '正在生成…' : '生成报告'}</button></section>
      <ModuleHero eyebrow="Report Agent" title="报告中心" text="汇总诊断、维修方案、工单和质检结果，形成可追溯运维报告。" action={<button className="button" type="button" onClick={loadReports} disabled={loadingReports}>{loadingReports ? "刷新中…" : "刷新报告"}</button>} />
      {reportError && <div className="inline-error" role="status">报告服务暂不可用：{reportError}</div>}
      <section className="panel module-panel report-list-panel" aria-label="已持久化报告列表">
        <div className="panel-heading"><div><span className="eyebrow">持久化记录 · {reportItems.length} 份</span><h2>报告列表</h2></div></div>
        {reportItems.length ? <div className="report-list">{reportItems.map((item) => <div className={`report-list-item ${item.report_id === report.report_id ? "is-selected" : ""}`} key={item.report_id}>
          <button type="button" className="report-list-select" onClick={() => setSelectedReportId(item.report_id)}><strong>{item.title || "运维报告"}</strong><span>{item.report_id} · {formatTime(item.created_at || item.updated_at)} · {reportCompleteness(item).label}</span></button>
          <button type="button" className="button danger-button" onClick={() => deleteReport(item.report_id)}>删除</button>
        </div>)}</div> : <div className="empty-state">暂无持久化报告</div>}
      </section>
      {hasReport ? (
        <>
          <div className="module-grid"><ModuleStat label="报告编号" value={report.report_id || "--"} text={report.report_type || "运维报告"} /><ModuleStat label="生成时间" value={report.created_at || report.updated_at ? formatTime(report.created_at || report.updated_at) : "--"} text={`${reports.length || 1} 份已持久化报告`} /><ModuleStat label="质量状态" value={reportQualityLabel(sections.quality)} text="质量协同结果" /></div>
          <section className="panel module-panel report-panel"><div className="panel-heading"><div><span className="eyebrow">报告摘要</span><h2>{report.title || "运维报告"}</h2><span className={`severity-pill ${completeness.tone}`}>{completeness.label}</span></div><div className="report-file-actions"><button className="button" type="button" onClick={generatePdf} disabled={!report.report_id || Boolean(generatingPdf)}>{generatingPdf === report.report_id ? "生成中…" : "生成 PDF"}</button>{pdfReady && <><a className="button" href={pdfUrl} target="_blank" rel="noreferrer">打开 PDF</a><a className="button" href={`${pdfUrl}?download=1`} download={`report-${report.report_id}.pdf`}>下载 PDF</a></>}</div></div>{completeness.findings.length > 0 && <div className="workspace-notice" role="status"><ul>{completeness.findings.map((finding, index) => <li key={`${index}-${finding}`}>{finding}</li>)}</ul></div>}<FormattedText value={cleanDisplayText(report.summary) || "暂无摘要"} className="answer-summary" />{displaySections.length > 0 && <ReportDisplaySections sections={displaySections} />}</section>
        </>
      ) : <WorkspaceEmpty eyebrow="报告队列" title="暂无可查看的报告" text="完成异常诊断、维修与质检闭环后，报告会自动汇总在这里。" />}
    </section>
  );
}


function IncidentTimeline({ record }) {
  const times = recordTimes(record);
  const labels = {event:'报警发生',diagnosis:'诊断完成',plan:'方案生成',order:'工单创建',updated:'工单更新'};
  const identity = incidentIdentity(record);
  return <section className="maintenance-plan-panel" aria-label="故障与处理时间">
    <h2>故障与处理时间（北京时间）</h2>
    <p>{record.device_name || record.device_id}{record.device_model ? ` · 型号 ${record.device_model}` : ''} · 报警 {identity.alarm_code || '待确认'}{identity.event_id ? ` · ${identity.event_id}` : ''}</p>
    {Object.entries(labels).filter(([key]) => key !== 'order' && key !== 'updated' || record.workorder_id).map(([key,label]) => <p key={key}>{label}：{formatRecordTime(times[key])}</p>)}
  </section>;
}

function MaintenancePlanWorkspace({ snapshot, sample, actor, active = true }) {
  const [planItems, setPlanItems] = useState([]);
  const [history, setHistory] = useState({ status: "loading" });
  const actorKey = JSON.stringify([actor?.user_id || "", actor?.role || ""]);
  const [orderState, setOrderState] = useState({ actorKey, items: [], error: "", status: "loading" });
  // 私有工单与读取它的身份绑定，身份变化的首帧也不能带出旧关联。
  const orders = orderState.actorKey === actorKey ? orderState.items : [];
  const orderError = orderState.actorKey === actorKey ? orderState.error : "";
  const ordersReady = orderState.actorKey === actorKey && orderState.status === "ready";
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletedPlanIds, setDeletedPlanIds] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletionsLoaded, setDeletionsLoaded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');
  const retryCommands = useRef({});
  const refreshRef = useRef(null);
  const workspaceRevision = useRef(0);
  const currentAlarm = String(sample?.alarm_code || "").trim();
  const currentDevice = String(sample?.device_id || snapshot?.device_id || "").trim();
  // 删除集合未知时不能信任旧监控/工单快照，避免页面切换时已删除方案复活。
  const records = deletionsLoaded ? buildMaintenanceWorkspaceRecords({ snapshot, items: planItems, orders, deletedPlanIds }) : [];
  const incident = currentIncident(snapshot, sample);
  const currentRecord = records.find(record => matchesIncident(record, incident));
  const selectedRecord = records.find(record => record.recordId === selectedId) || currentRecord || records[0];
  const linkedOrders = selectedRecord?.plan_id ? orders.filter(order => linkedPlanOrder(selectedRecord,order)) : [];
  const assignedOrders = linkedOrders.filter(order => order.assignee || (order.status && order.status !== "open"));
  const savedDispatch = selectedRecord?.dispatch || {};
  const hasAssignedOrder = assignedOrders.length > 0 || (savedDispatch.status === "dispatched" && savedDispatch.workorder_id);
  const hasCurrentDiagnosis = Boolean(selectedRecord && selectedRecord === currentRecord);
  const plan = selectedRecord ? buildMaintenancePlanView({ plan: selectedRecord, diagnosis: selectedRecord.diagnosis }) : null;
  const diagnosis = getLatestDiagnosis(snapshot, sample);
  const currentPipeline = getLatestPipeline(snapshot, sample);
  const generating = matchesIncident(diagnosis,incident) && (['running','recovering'].includes(diagnosis.workflow_status)
    || diagnosis.status === 'running' || (matchesIncident(currentPipeline,incident) && currentPipeline.status === 'running'));

  useEffect(() => subscribeMaintenanceChanges(change => {
    if (change.actorKey !== actorKey) return;
    workspaceRevision.current++;
    const removed = change.deleted_plan_ids || [];
    if (removed.length) {
      setDeletedPlanIds(ids => [...new Set([...ids, ...removed])]);
      setPlanItems(items => items.filter(item => !removed.includes(item.plan_id)));
      setCheckedIds(ids => ids.filter(id => !removed.includes(id)));
    }
    setOrderState(previous => {
      if (previous.actorKey !== actorKey) return previous;
      const items = previous.items.filter(item => !(change.deleted_workorder_ids || []).includes(item.workorder_id));
      const updated = change.workorder;
      return {...previous, items:updated ? [...items.filter(item => item.workorder_id !== updated.workorder_id), updated] : items};
    });
  }), [actorKey]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let plansPending = null;
    let ordersPending = null;
    const controller = new AbortController();
    function refreshPlans(manual = false) {
      if (plansPending) return plansPending;
      if (manual) setLoading(true);
      const revision = workspaceRevision.current;
      plansPending = loadMaintenancePlans(request, { signal: controller.signal }).then(result => {
        if (cancelled || revision !== workspaceRevision.current) return;
        setPlanItems(result.items);
        setDeletedPlanIds(previous => [...new Set([...previous, ...result.deletedPlanIds])]);
        setDeletionsLoaded(true);
        setHistory(result.history);
        setError("");
      }).catch(err => {
        if (cancelled || revision !== workspaceRevision.current) return;
        setHistory({ status: "failed", error: err.message });
        setError(err.message);
      }).finally(() => {
        plansPending = null;
        if (!cancelled) setLoading(false);
      });
      return plansPending;
    }
    function refreshOrders() {
      if (ordersPending) return ordersPending;
      const revision = workspaceRevision.current;
      ordersPending = loadMaintenanceOrders(request, actor, { signal: controller.signal }).then(items => {
        if (!cancelled && revision === workspaceRevision.current) setOrderState({ actorKey, items: items.map(normalizeWorkorderResponse), error: "", status: "ready" });
      }).catch(err => {
        if (!cancelled && revision === workspaceRevision.current) setOrderState({ actorKey, items: [], error: err.message, status: "failed" });
      }).finally(() => { ordersPending = null; });
      return ordersPending;
    }
    const refresh = (manual = false) => Promise.all([refreshPlans(manual), refreshOrders()]);
    setLoading(false);
    refreshRef.current = refresh;
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      controller.abort();
      refreshRef.current = null;
      window.clearInterval(timer);
    };
  }, [actorKey, active]);

  function openWorkorder(orderId = "") {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "workorder");
    if (orderId) params.set("workorder_id", orderId);
    else params.delete("workorder_id");
    window.history.pushState({ view: "workorder" }, "", `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  async function retryPlan() {
    if (!selectedRecord?.plan_id || !selectedRecord.event_id || retrying || !actor?.user_id || !ordersReady || hasAssignedOrder) return;
    const planId = selectedRecord.plan_id;
    retryCommands.current[planId] ||= crypto.randomUUID();
    setRetrying(true);
    setRetryMessage('');
    try {
      const result = await retryMaintenancePlan(request,planId,retryCommands.current[planId]);
      const orderId = result.workorder?.workorder_id || '';
      setRetryMessage(orderId ? `系统已处理派工，工单：${orderId}；具体状态以工单和日志为准。` : `校验已返回：${result.status || '待核对'}；${(result.maintenance_plan?.validation_findings || []).join('；') || result.stop_reason || '请在日志中查看执行结果'}`);
      delete retryCommands.current[planId];
      await refreshRef.current?.();
    } catch (err) {
      if (err.detail?.execution_started === false) {
        delete retryCommands.current[planId];
        setRetryMessage(`未启动重新派工：${err.message}。补齐数据后可以重新校验。`);
      } else {
        setRetryMessage(`重新校验未确认成功：${err.message}。请先核对日志和工单；本页保留原命令编号，避免重复派工。`);
      }
    } finally {
      setRetrying(false);
    }
  }

  async function removePlans(ids) {
    if (!actor?.user_id || deleting || !ids.length) return;
    if (ids.length > 100) { setDeleteError("每批最多删除 100 条方案，请减少选择后重试。"); return; }
    if (!window.confirm(`确定从方案列表移除这 ${ids.length} 条方案吗？关联工单、执行日志和审计记录仍保留。`)) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteMaintenancePlans(request, ids);
      const removed = result.deleted_plan_ids || [];
      publishMaintenanceChange(actor, {deleted_plan_ids:removed});
      setDeletedPlanIds(previous => [...new Set([...previous, ...removed])]);
      setCheckedIds(previous => previous.filter(id => !removed.includes(id)));
      await refreshRef.current?.();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // 离开时卸载页面内容与图纸，暂停请求；仅保留已读数据和选择状态。
  if (!active) return null;
  return (
    <section className="workspace-view active maintenance-workspace" aria-label="维修方案">
      <ModuleHero eyebrow="Maintenance Agent" title="维修方案" text="查看已有诊断生成的方案、维修依据与派发条件；工单负责执行反馈。" action={<><button className="button" type="button" disabled={loading} onClick={() => refreshRef.current?.(true)}>{loading ? "刷新中…" : "刷新方案"}</button><button className="button primary" type="button" onClick={() => openWorkorder(assignedOrders[0]?.workorder_id || "")}>进入工单执行</button></>} />
      {error && <div className="inline-error" role="status">方案列表刷新失败：{error}{records.length > 0 ? "；仍可查看已读取的方案。" : ""}</div>}
      {orderError && <div className="workspace-notice" role="status">关联工单读取失败：{orderError}；维修方案仍可独立查看。</div>}
      {maintenanceHistoryNotice(history) && <div className="workspace-notice" role="status">{maintenanceHistoryNotice(history)}</div>}
      {deleteError && <div className="inline-error" role="alert">删除失败：{deleteError}，方案仍保留。</div>}
      {selectedRecord && <section className="panel module-panel" aria-label="方案工单处理">
        {hasAssignedOrder ? <>
          <h2>已派发工单</h2>
          <p>此方案已有工单，可直接进入查看或处理。{maintenanceWorkType(selectedRecord).inspection ? "检查结果在工单中提交。" : "维修结果和复机申请在工单中提交。"}</p>
          {assignedOrders.map(order => <div key={order.workorder_id}><p>工单 {order.workorder_id} · 负责人：{order.assignee_name || order.assignee || "待核对"} · {labelFor(workorderStatusLabels, order.status)}</p><button className="button primary" type="button" onClick={() => openWorkorder(order.workorder_id)}>进入工单处理</button></div>)}
          {!assignedOrders.length && <p>工单 {savedDispatch.workorder_id} · 负责人：{savedDispatch.assignee_name || "以派发记录为准"}。{!actor?.user_id ? "登录负责人账号后可进入工单处理。" : !ordersReady && !orderError ? "正在核对关联工单，请稍候…" : "当前账号未读取到此工单，请核对负责人账号。"}</p>}
        </> : <>
          <h2>重新校验与自动派工</h2>
          {selectedRecord.status === 'running' || savedDispatch.status === 'running' ? <p>方案已生成，系统正在完成后续校验与派发，无需重复提交。</p>
            : !selectedRecord.event_id ? <p>此历史方案缺少故障事件，请到监控中心重新诊断当前设备。</p>
            : actor?.user_id && !ordersReady ? <p>{orderError ? "关联工单读取失败，请重试读取后再派工。" : "正在核对关联工单，请稍候…"}</p>
            : <><p>重新读取当前设备并校验方案，通过后系统自动派发给对应维修人员。</p><button className="button primary" type="button" onClick={retryPlan} disabled={!actor?.user_id || retrying || !selectedRecord.plan_id}>{retrying ? '正在重新校验…' : '重新校验并自动派工'}</button></>}
          {!actor?.user_id && <p>请先登录维修小组账号。</p>}
        </>}
        {orderError && <button className="button" type="button" onClick={() => refreshRef.current?.(true)}>重试读取工单</button>}
        {retryMessage && <p role="status">{retryMessage}</p>}
      </section>}
      <section className="workorder-queue maintenance-plan-queue" aria-label="维修方案列表">
        <div className="workorder-queue-heading"><div><span className="eyebrow">已有方案</span><h2>选择维修方案</h2></div><div className="maintenance-delete-actions"><span>{records.length} 条记录</span><button className="button" type="button" disabled={!actor?.user_id || deleting || !records.some(record => record.plan_id)} onClick={() => setCheckedIds(records.filter(record => record.plan_id).slice(0, 100).map(record => record.plan_id))}>{records.length > 100 ? "选择前 100 条" : "全选方案"}</button><button className="button danger" type="button" disabled={!actor?.user_id || deleting || !checkedIds.length} onClick={() => removePlans(checkedIds)}>{deleting ? "删除中…" : `删除选中方案（${checkedIds.length}）`}</button></div></div>
        <p className="maintenance-plan-muted">{actor?.user_id ? "删除仅移除方案列表展示，不删除关联工单和审计日志。" : "登录后可删除方案；关联工单和审计日志将保留。"}</p>
        {records.length ? <div className="workorder-queue-list">{records.map(record => {
          const hasOrder = orders.some(order => linkedPlanOrder(record,order));
          const dispatch = maintenanceDispatchView(record, { hasOrder });
          return <div key={record.recordId} className={`maintenance-plan-list-row ${selectedRecord?.recordId === record.recordId ? "is-selected" : ""}`}>
            <label className="maintenance-plan-select"><input type="checkbox" aria-label={`选择方案 ${record.plan_id || record.recordId}`} disabled={!actor?.user_id || deleting || !record.plan_id} checked={checkedIds.includes(record.plan_id)} onChange={event => setCheckedIds(previous => event.target.checked ? [...new Set([...previous, record.plan_id])] : previous.filter(id => id !== record.plan_id))} /></label>
            <button type="button" className="workorder-queue-item" onClick={() => setSelectedId(record.recordId)}><span>
              <strong>{getDeviceDisplayName(record.device_id, { snapshot, device_name:record.device_name })} · {cleanDisplayText(record.diagnosis?.fault || record.diagnosis?.summary) || `报警 ${record.alarm_code || "待确认"}`}</strong>
              <small>{maintenanceWorkType(record).label} · {record.plan_id || "未编号方案"} · {record.device_id}{record.created_at ? ` · 方案生成 ${formatRecordTime(record.created_at)}` : record.diagnosis_created_at ? ` · 诊断完成 ${formatRecordTime(record.diagnosis_created_at)}` : ""}</small>
              {dispatch.reason && <small style={{ whiteSpace: "normal" }} title={dispatch.reason}>派发与执行校验：{dispatch.reason}</small>}
            </span><em>{dispatch.label}</em></button>
            <button className="button danger" type="button" disabled={!actor?.user_id || deleting || !record.plan_id} onClick={() => removePlans([record.plan_id])}>删除此方案</button>
          </div>;
        })}</div> : <WorkspaceEmpty eyebrow="维修方案" title={history?.status === "loading" ? "正在读取已有维修方案" : history?.status === "failed" ? "历史方案暂未读出" : "暂无已生成的维修方案"} text={history?.status === "loading" ? "后台只读加载较大的历史记录，请稍候；这里不会将尚未读出的方案判断为不存在。" : "诊断生成方案后会自动显示；未满足派发条件的方案也可查看。"} />}
      </section>
      {currentAlarm && !currentRecord && <div className="workspace-notice" role="status">{generating ? `当前报警 ${currentAlarm}：诊断已完成，维修方案正在生成或校验；生成后自动显示，无需刷新。` : history?.status === "ready" && !error ? `当前设备 ${currentDevice} 的报警 ${currentAlarm} 尚无本次故障对应的维修方案；列表中保留的是已有方案。` : `正在核对当前设备 ${currentDevice} 的报警 ${currentAlarm} 对应方案；历史记录尚未完整读出，不能判定方案不存在。`}</div>}
      {selectedRecord && <><div className="workspace-notice" role="status">{hasCurrentDiagnosis ? "当前设备方案" : "历史 / 其他设备方案"} · {selectedRecord.device_id} · 报警 {selectedRecord.alarm_code || "待确认"}{selectedRecord.event_id ? ` · ${selectedRecord.event_id}` : ""}{linkedOrders.length ? ` · 已关联工单 ${linkedOrders.map(order => order.workorder_id).join("、")}` : actor?.user_id ? " · 当前账号未读取到关联工单，派发情况以授权工单列表为准" : " · 工单关联情况需登录后在工单系统查看"}</div><IncidentTimeline record={selectedRecord} /><MaintenanceDispatchStatus record={selectedRecord} hasOrder={linkedOrders.length > 0} /><MaintenancePlanPanel plan={plan} record={selectedRecord} hasCurrentDiagnosis={hasCurrentDiagnosis} /></>}
    </section>
  );
}

// Keep an unconfirmed command across workspace navigation, scoped to its actor and order.
const workorderPlanCommands = new Map();

function WorkorderView({ snapshot, sample, onClosed, actor }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("workorder_id") || "");
  const explicitSelection = useRef(Boolean(selectedId));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDeleted, setShowDeleted] = useState(() => new URLSearchParams(window.location.search).get('include_deleted') === 'true');
  const [loadState, setLoadState] = useState("loading");
  const reloadRef = useRef(null);
  const orderRevisionRef = useRef(0);
  const mountedRef = useRef(false);
  const [revalidationResults, setRevalidationResults] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const candidateDiagnosis = getLatestDiagnosis(snapshot, sample);
  const latestDiagnosis = diagnosisMatchesCurrent(snapshot, sample, candidateDiagnosis) ? candidateDiagnosis : {};
  const liveSample = sample
    || snapshot?.latest_result?.current_sample
    || snapshot?.devices?.find((device) => device.device_id === snapshot?.device_id)?.current_sample
    || {};
  const currentFaultCode = String(liveSample?.alarm_code || "").trim();
  const currentFaultStatus = String(liveSample?.status || "").toLowerCase();
  const currentFaultActive = Boolean(currentFaultCode) && ["alarm", "fault", "warning"].includes(currentFaultStatus);
  const currentIncidentCode = currentFaultCode || String(latestDiagnosis?.alarm_code || "").trim();
  const hasCurrentIncident = Boolean(currentIncidentCode);
  const currentDevice = String(liveSample?.device_id || snapshot?.device_id || "");
  const incident = currentIncident(snapshot, sample);
  const incidentKey = JSON.stringify(incident);
  const currentPlanRecord = buildMaintenanceWorkspaceRecords({ snapshot }).find(record => matchesIncident(record,incident));
  const hasVisibleIncidentOrder = orders.some(order => matchesIncident({...order,alarm_code:getWorkorderAlarmCode(order)},incident));
  const selectedOrder = orders.find((order) => order.workorder_id === selectedId)
    || (!hasCurrentIncident ? orders[0] : undefined);

  useEffect(() => {
    // 报警触发的创建由运行时负责；查看队列不能创建或重新创建操作员明确删除的工单。
    let cancelled = false;
    let pending = null;
    const controller = new AbortController();
    setLoadState("loading");
    function loadOrders() {
      if (pending) return pending;
      const revision = orderRevisionRef.current;
      pending = request(`/api/workorders${showDeleted ? '?include_deleted=true' : ''}`, { signal: controller.signal }).then(body => {
        if (cancelled || revision !== orderRevisionRef.current) return;
        if (!Array.isArray(body.items)) throw new Error("工单列表返回异常，请重试");
        rememberDeletedMaintenancePlans(body.deleted_plan_ids || []);
        const items = body.items.map(normalizeWorkorderResponse).filter(item => showDeleted || !item.deleted_at);
        setOrders(previous => items.map(item => ({...item, machine_control: previous.find(old => old.workorder_id === item.workorder_id)?.machine_control || item.machine_control})));
        setSelectedId(previous => explicitSelection.current && items.some(item => item.workorder_id === previous) ? previous : preferredWorkorderId(items, sample, snapshot));
        setError("");
        setLoadState("ready");
      }).catch(err => {
        if (cancelled || revision !== orderRevisionRef.current) return;
        if ([401, 403].includes(err.status)) {
          setOrders([]);
          setSelectedId("");
        }
        setError(err.message);
        setLoadState("failed");
      }).finally(() => { pending = null; });
      return pending;
    }
    reloadRef.current = loadOrders;
    loadOrders();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const timer = window.setInterval(loadOrders, 5000);
    return () => {
      cancelled = true;
      controller.abort();
      reloadRef.current = null;
      window.clearInterval(timer);
    };
  }, [actor?.user_id, actor?.role, currentDevice, currentIncidentCode, incidentKey, showDeleted]);

  const revalidationKey = orderId => JSON.stringify([actor?.user_id, actor?.role, orderId]);
  const revalidation = revalidationResults[revalidationKey(selectedOrder?.workorder_id)]
    || workorderPlanCommands.get(revalidationKey(selectedOrder?.workorder_id));
  const canRevalidate = Boolean(actor?.user_id) && actor?.role === 'technician' && selectedOrder?.assignee === actor.user_id;

  async function revalidatePlan() {
    if (!selectedOrder?.workorder_id || !canRevalidate || busy) return;
    const originalOrder = selectedOrder;
    const orderId = originalOrder.workorder_id;
    const key = revalidationKey(orderId);
    const previous = workorderPlanCommands.get(key);
    if (previous?.pending || (!executionReviewView(originalOrder).required && !previous?.requestId)) return;
    const requestId = previous?.requestId || crypto.randomUUID();
    const publish = result => {
      workorderPlanCommands.set(key, result);
      if (mountedRef.current) setRevalidationResults(values => ({ ...values, [key]: result }));
    };
    const revision = previous?.revision || 0;
    publish({ requestId, pending: true, phase: 'running', revision, findings: [], message: '正在基于原工单重新生成并校验方案…' });
    orderRevisionRef.current += 1;
    setBusy(true);
    try {
      const result = await request(`/api/workorders/${encodeURIComponent(orderId)}/revalidate-plan`, {
        method: 'POST', body: JSON.stringify({ request_id: requestId }),
      });
      const order = result.workorder;
      if (result.request_id !== requestId || !['applied', 'blocked'].includes(result.status)
          || order?.workorder_id !== orderId || order.device_id !== originalOrder.device_id
          || order.assignee !== originalOrder.assignee
          || (result.status === 'applied' && order.execution_review?.required !== false)) {
        throw new Error('方案更新回包尚不能确认，请核对原请求结果');
      }
      const findings = Array.isArray(result.validation_findings)
        ? result.validation_findings.filter(item => typeof item === 'string' && item.trim()) : [];
      orderRevisionRef.current += 1;
      if (result.status === 'applied') {
        if (mountedRef.current) {
          setOrders(items => items.map(item => item.workorder_id === orderId ? order : item));
          setError('');
        }
        publishMaintenanceChange(actor, {workorder:order});
        publish({ requestId: null, pending: false, phase: 'applied', revision: revision + 1, findings,
          message: '新方案已更新至原工单，负责人保持不变。仍需实际执行并复测；此次校验不代表完成维修或复机。' });
      } else {
        publish({ requestId: null, pending: false, phase: 'blocked', revision, findings,
          message: `${typeof result.message === 'string' ? result.message : '候选方案未通过校验'}。原工单与原方案保留；完成实际维修后可填写处理说明并申请设备恢复核验。` });
      }
    } catch (err) {
      const notStarted = err.detail?.execution_started === false;
      publish({ requestId: notStarted ? null : requestId, pending: false,
        phase: notStarted ? 'not_started' : 'unknown', revision, findings: [],
        message: notStarted ? `未启动方案重新校验：${err.message}。补齐依据后可再次生成。`
          : `方案更新结果尚未确认：${err.message}。保留原请求编号；请显式核对同一请求结果，勿重复生成。` });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function updateOrder(status, fields = {}) {
    if (!selectedOrder || busy) return;
    const actionKey = revalidationKey(selectedOrder.workorder_id);
    setActionErrors(values => ({ ...values, [actionKey]: '' }));
    setBusy(true);
    orderRevisionRef.current++;
    try {
      const action = status === "closed"
        ? "close"
        : status === "completed"
          ? "mark_repair_completed"
          : status === "feedback" ? "submit_feedback" : "update";
      const response = await request(`/api/workorders/${selectedOrder.workorder_id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, status: status === "feedback" ? selectedOrder.status || "in_progress" : status, ...fields }),
      });
      const order = normalizeWorkorderResponse(response);
      if (order?.workorder_id !== selectedOrder.workorder_id || order.device_id !== selectedOrder.device_id
          || order.assignee !== selectedOrder.assignee) {
        const reason = response?.machine_control?.reason || response?.machine_control?.error;
        throw new Error(`工单操作结果未确认${reason ? `：${reason}` : '，返回的工单或负责人不匹配，请核对后重试'}`);
      }
      if (response.machine_control) order.machine_control = response.machine_control;
      const hasReviewDecision = order.execution_review?.required === true || order.execution_review?.required === false;
      if (!hasReviewDecision && executionReviewView(selectedOrder).required) order.execution_review = selectedOrder.execution_review;
      orderRevisionRef.current++;
      setOrders((items) => items.map((item) => {
        if (item.workorder_id !== order.workorder_id) return item;
        const hasReviewDecision = order.execution_review?.required === true || order.execution_review?.required === false;
        if (!hasReviewDecision && executionReviewView(item).required) {
          return { ...order, execution_review: item.execution_review };
        }
        return order;
      }));
      setError("");
      publishMaintenanceChange(actor, {workorder:order});
      if (status === "closed") onClosed?.();
      return status !== 'completed' || ['completed', 'closed'].includes(order.status);
    } catch (err) {
      setActionErrors(values => ({ ...values, [actionKey]: err.message }));
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder(order) {
    if (!order?.workorder_id || !window.confirm(`确定从列表删除工单 ${order.workorder_id} 及关联维修方案吗？原始处理记录仍保留。`)) return;
    setBusy(true);
    orderRevisionRef.current++;
    try {
      const result = await request(`/api/workorders/${encodeURIComponent(order.workorder_id)}`, { method: "DELETE" });
      if (!result.deleted || result.workorder_id !== order.workorder_id) throw new Error('工单删除结果未确认，请核对后重试');
      orderRevisionRef.current++;
      publishMaintenanceChange(actor, {deleted_workorder_ids:[order.workorder_id], deleted_plan_ids:result.deleted_plan_ids || []});
      const remaining = orders.filter((item) => item.workorder_id !== order.workorder_id);
      setOrders(remaining);
      setSelectedId(preferredWorkorderId(remaining, sample, snapshot));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-view active workorder-page" aria-label="工单系统">
      {!currentFaultActive && <div className="module-hero"><span className="eyebrow">维修执行</span><h1>工单系统</h1><p>跟进维修任务、执行反馈与验收。</p></div>}
      <section className="workorder-queue" aria-label="工单队列">
        <label><input type="checkbox" checked={showDeleted} onChange={event => setShowDeleted(event.target.checked)} />查看已删除工单的处理记录</label>
        <div className="workorder-queue-heading">
          <div><span className="eyebrow">工单队列</span><h2>维修任务</h2></div>
          <div className="maintenance-delete-actions"><span>{orders.length ? `${orders.length} 条记录` : loadState === "ready" ? "0 条记录" : loadState === "failed" ? "读取未完成" : "正在读取…"}</span><button className="button" type="button" disabled={busy || loadState === "loading"} onClick={() => reloadRef.current?.()}>刷新工单</button></div>
        </div>
        {orders.length ? (
          <div className="workorder-queue-list">
            {orders.map((order) => <button key={order.workorder_id} type="button" className={`workorder-queue-item ${selectedOrder?.workorder_id === order.workorder_id ? "is-selected" : ""}`} onClick={() => { explicitSelection.current = true; setSelectedId(order.workorder_id); }}>
              <span><strong>{getWorkorderDisplayTitle(order, order.repair_target, { snapshot })}</strong><small>{maintenanceWorkType(order).label} · {order.workorder_id} · {order.device_id}</small></span>
              <em className={order.status === "closed" || order.status === "completed" ? "is-done" : ""}>{inspectionWorkorderView(order).statusLabel || labelFor(workorderStatusLabels, order.status)}</em>
            </button>)}
          </div>
        ) : <div className="workorder-queue-empty" role="status">{loadState === "loading" ? "正在读取已派发工单及任务内容，请稍候…" : loadState === "failed" ? "工单暂未读出，请查看错误提示或点击刷新工单重试。" : "暂无可见工单；系统仅在诊断证据、维修方案和派发条件通过后自动派发。可在维修方案页查看未满足条件的具体原因。"}</div>}
        {!selectedOrder && error && <div className="inline-error" role="alert">工单读取失败：{error}</div>}
      </section>
      {loadState === "ready" && hasCurrentIncident && !hasVisibleIncidentOrder && <><div className="workspace-notice" role="status">当前账号尚无报警 {currentIncidentCode} 对应的可见工单；系统按派发条件处理，可在维修方案页查看已有方案和依据。</div>{currentPlanRecord && <MaintenanceDispatchStatus record={currentPlanRecord} />}</>}
      {(selectedOrder || loadState === "ready") && <WorkorderDetail
        order={selectedOrder || null}
        sample={sample}
        snapshot={snapshot}
        diagnosis={latestDiagnosis}
        busy={busy}
        error={actionErrors[revalidationKey(selectedOrder?.workorder_id)] || error}
        onUpdate={updateOrder}
        onDelete={deleteOrder}
        onRevalidate={revalidatePlan}
        revalidation={revalidation}
        canRevalidate={canRevalidate}
        readOnly={actor?.role !== 'technician'}
      />}
    </section>
  );
}

function WorkorderDetail({ order, sample, snapshot, diagnosis = {}, busy, error, onUpdate, onDelete, onRevalidate, revalidation, canRevalidate = false, readOnly = false }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [order?.workorder_id]);
  if (!order) {
    return (
      <section className="workorder-empty-shell">
        <div className="workorder-empty-content">
          <span className="workorder-empty-icon" aria-hidden="true">□</span>
          <span className="eyebrow">工单队列</span>
          <h2>当前没有待处理工单</h2>
          <p>诊断、维修方案与派发条件通过后，系统自动派发工单；维修人员查看本人工单，监督人查看全部工单。</p>
          {error && <div className="inline-error" role="alert">{error}</div>}
        </div>
      </section>
    );
  }
  const sameDevice = String(diagnosis?.device_id || "") === String(order.device_id || "");
  const sameAlarm = String(diagnosis?.alarm_code || "") === getWorkorderAlarmCode(order);
  const hasCurrentDiagnosis = sameDevice && sameAlarm && matchesIncident({...order,alarm_code:getWorkorderAlarmCode(order)},incidentIdentity(diagnosis));
  const orderDiagnosis = order.diagnosis_snapshot || order.diagnosis_context || order.maintenance_plan_snapshot?.diagnosis || {};
  const matchedDiagnosis = hasCurrentDiagnosis ? diagnosis : orderDiagnosis;
  const matchedSample = hasCurrentDiagnosis && String(sample?.device_id || "") === String(order.device_id || "") && String(sample?.alarm_code || "") === getWorkorderAlarmCode(order) ? sample : {};
  const liveDevice = Array.isArray(snapshot?.devices)
    ? snapshot.devices.find((device) => String(device?.device_id || "") === String(order.device_id || ""))
    : null;
  const recoverySample = snapshot?.latest_results?.[order.device_id]?.current_sample
    || liveDevice?.current_sample
    || (String(sample?.device_id || "") === String(order.device_id || "") ? sample : {});
  const target = resolveRepairTarget(order, matchedSample);
  const sheet = buildWorkorderSheet({ order, target, diagnosis: matchedDiagnosis, context: { snapshot, sample: matchedSample, recoverySample } });
  const workType = maintenanceWorkType(order);
  const inspectionResult = inspectionWorkorderView(order);
  const review = executionReviewView(order);
  const statusLabel = inspectionResult.statusLabel || labelFor(workorderStatusLabels, order.status);
  return (
    <section className="workorder-detail-page">
      <header className="workorder-titlebar">
        <div>
          <span className="eyebrow">{workType.inspection ? "检查工单详情" : "维修工单详情"}</span>
          <h1>{getWorkorderDisplayTitle(order, target, { snapshot, sample: matchedSample, fault: matchedDiagnosis.fault || matchedDiagnosis.summary })}</h1>
          <p>{order.workorder_id} · {order.device_id} · {order.assignee_name || order.assignee || "未分配"}{order.event_id ? ` · 故障事件 ${order.event_id}` : ''}</p>
        </div>
        <div className="workorder-titlebar-actions"><span className={`workorder-status-badge ${order.status === "closed" || order.status === "completed" ? "done" : "pending"}`}>{statusLabel}</span><button className="button danger-button" type="button" disabled={busy || readOnly || Boolean(order.deleted_at)} onClick={() => onDelete?.(order)}>{order.deleted_at ? '已从列表删除' : '删除工单'}</button></div>
      </header>

      <IncidentTimeline record={order} />

      {(review.required || revalidation?.message) && <section className="maintenance-plan-panel" aria-label="方案执行复核">
        <h2>{review.required ? review.label : '方案校验结果'}</h2>
        {review.required && <><PlanList title="原方案校验记录" items={review.findings} /><p>原方案的问题保留记录。完成实际维修后，在处理说明中填写结果并确认，系统将自动核验设备状态并申请复机。</p></>}
        {!readOnly && canRevalidate && (review.required || revalidation?.requestId) && <><p>基于原工单的故障依据重新生成并校验方案；保留原工单和负责人，不重新派单，不控制设备。</p><button className="button" type="button" disabled={busy || revalidation?.pending} onClick={onRevalidate}>{revalidation?.phase === 'unknown' ? '核对方案更新结果' : '重新生成并校验方案'}</button></>}
        {revalidation?.message && <p role="status">{revalidation.message}</p>}
        {revalidation?.findings?.length > 0 && <PlanList title="新方案未满足的条件" items={revalidation.findings} />}
      </section>}

      <div className="workorder-bigscreen-grid cad-only">
        <RepairCadPanel order={order} target={target} />
      </div>
      <WorkorderSheet sheet={sheet} workType={workType} inspectionResult={inspectionResult} review={review} confirmationRevision={revalidation?.revision || 0} busy={busy} error={error} onUpdate={onUpdate} readOnly={readOnly} />
    </section>
  );
}

function MaintenanceDispatchStatus({ record, hasOrder = false }) {
  const status = maintenanceDispatchView(record, { hasOrder });
  return <section className="maintenance-plan-panel" aria-label="自动派发条件"><div className="maintenance-plan-heading"><h2>{status.label}</h2><span>工单就绪：{status.ready}</span></div>{status.reviewRequired && <div role="status"><strong>{status.reviewLabel}</strong><PlanList title="需重新校验的原因" items={status.reviewFindings} /><p>派发记录和原方案问题保留；已派发工单可由维修人员填写实际处理结果，申请设备恢复核验与复机。</p></div>}{status.reason && <p>{status.reason}</p>}{status.assigneeName && <p>维修负责人：{status.assigneeName} · 对应设备：{status.assignmentDeviceId || "未提供"}</p>}{status.findings.length > 0 && <PlanList title="未满足的条件" items={status.findings} />}{status.stopReason && <p>流程停止原因：{status.stopReason}</p>}<p>系统按证据校验、明确审批要求及登录人员负责设备匹配后派发；方案存在不代表已创建工单。</p></section>;
}

function MaintenancePlanPanel({ plan, record, hasCurrentDiagnosis }) {
  const diagnosis = plan.diagnosis || {};
  const drawings = maintenanceReferenceDrawings(record);
  const workType = maintenanceWorkType(record);
  const evidence = (plan.evidence || []).map((item) => {
    if (typeof item === "string") return item;
    return item.title || item.content || item.evidence_text || item.source || item.document_id || item.component_id || "维修证据";
  }).filter(Boolean);
  const sourceLabel = plan.source === "maintenance-plan"
    ? "独立维修方案"
    : plan.source === "legacy-workorder-snapshot"
      ? "历史工单方案快照"
      : "未关联维修方案";
  return (
    <section className="maintenance-plan-panel" aria-label="维修方案">
      <div className="maintenance-plan-heading">
        <div><span className="eyebrow">Maintenance Plan · {workType.label}</span><h2>{workType.inspection ? "检查方案" : "维修方案"}</h2><p>由 Diagnosis Agent → Maintenance Agent 生成，工单仅引用并负责执行。</p>{workType.inspection && <p>{workType.description}{workType.reason && ` ${workType.reason}`}</p>}</div>
        <div className="maintenance-plan-meta"><span>{sourceLabel}</span>{plan.planId && <strong>{plan.planId}</strong>}</div>
      </div>
      {plan.source === "unavailable" ? (
        <div className="maintenance-plan-empty">当前工单没有可读取的维修方案。故障定位仍保留在下方工单详情中，不会用工单字段伪造维修方案。</div>
      ) : (
        <>
          <div className="maintenance-plan-diagnosis">
            <div><span>故障分析</span><strong>{diagnosis.fault || diagnosis.summary || "待确认"}</strong><p>{diagnosis.cause || diagnosis.diagnosis || "暂无原因分析"}</p></div>
            <div><span>建议与风险</span><strong>{diagnosis.recommendation || "按方案步骤执行并复测"}</strong><p>{diagnosis.severity || plan.riskLevel || "风险等级待确认"}{plan.estimatedTime ? ` · 预计 ${plan.estimatedTime}` : ""}{hasCurrentDiagnosis ? " · 当前设备方案" : " · 已保存方案"}</p></div>
          </div>
          {drawings.length > 0 && <section className="maintenance-plan-section" aria-label="设备图纸参考">
            <div className="maintenance-plan-section-head"><h3>设备图纸参考</h3><span>{drawings.length} 项</span></div>
            <ul>{drawings.map(drawing => <li key={drawing.url}><a href={drawing.url} target="_blank" rel="noreferrer">查看 {drawing.name}</a> · {drawing.label}</li>)}</ul>
            <p className="maintenance-plan-muted">可查看设备模型和图纸；目标部件的 BOM、尺寸、材料等工程资料仍以校验结果为准。</p>
          </section>}
          <div className="maintenance-plan-grid">
            <PlanList title={workType.inspection ? "检查步骤" : "维修步骤"} items={plan.steps} ordered />
            <PlanList title="工具与备件" items={[...plan.tools.map((item) => `工具：${item}`), ...plan.parts.map((item) => `备件：${item}`)]} />
            <PlanList title="安全与检查" items={[...plan.safety, ...plan.preChecks, ...plan.postChecks]} />
            <PlanList title={workType.inspection ? "Evidence 检查依据" : "Evidence 维修证据"} items={evidence} />
          </div>
        </>
      )}
    </section>
  );
}

function PlanList({ title, items = [], ordered = false }) {
  const values = items.filter(Boolean);
  return <section className="maintenance-plan-section"><div className="maintenance-plan-section-head"><h3>{title}</h3><span>{values.length} 项</span></div>{values.length ? (ordered ? <ol>{values.map((item, index) => <li key={`${item}-${index}`}><FormattedText value={item} /></li>)}</ol> : <ul>{values.map((item, index) => <li key={`${item}-${index}`}><FormattedText value={item} /></li>)}</ul>) : <p className="maintenance-plan-muted">暂无记录</p>}</section>;
}

function resolveWorkorderDrawing(order = {}, target = {}) {
  const identity = [order.device_id, order.drawing_context?.drawing_url, target.component, target.part_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (identity.includes("qls80") || identity.includes("ql-servo") || identity.includes("lns")) return "/drawings/QLS80S2.html";
  if (identity.includes("equator") || identity.includes("renishaw")) return "/drawings/Equator300.html";
  if (identity.includes("tc820") || identity.includes("trak") || identity.includes("lubrication-pump") || identity.includes("cooling-pump")) return "/drawings/TC820si.html";
  return "";
}

function WorkorderSheet({ sheet, workType = maintenanceWorkType(), inspectionResult = inspectionWorkorderView(), review = executionReviewView(), confirmationRevision = 0, busy, error, onUpdate, readOnly = false }) {
  const [repairFeedback, setRepairFeedback] = useState("");
  const [feedbackSavedId, setFeedbackSavedId] = useState("");
  useEffect(() => {
    setFeedbackSavedId("");
  }, [sheet.workorderId, confirmationRevision]);
  const isDone = ["completed", "closed"].includes(sheet.status);
  const completionVerified = isDone && sheet.verificationPhase === 'poststart' && (!review.required || review.humanConfirmed);
  async function saveRecord() {
    setFeedbackSavedId("");
    if (await onUpdate("feedback", { repair_feedback: { feedback: repairFeedback.trim() } })) setFeedbackSavedId(sheet.workorderId);
  }
  return (
    <section className="maintenance-sheet" aria-label={workType.inspection ? "自动派发检查工单" : "自动派发维修工单"}>
      <div className="sheet-heading">
        <div>
          <span className="eyebrow">自动派发工单</span>
          <h2>{workType.inspection ? "检查工单" : "维修工单"}</h2>
          <p className="sheet-subtitle">{workType.inspection ? `${workType.description} 报警解除并核验通过后结束检查；仍有异常保留待处理。` : "故障确认后由系统自动派出，维修人员按维修方案执行并提交反馈。"}</p>
        </div>
        <span className={isDone ? "sheet-status done" : "sheet-status"}>{inspectionResult.statusLabel || labelFor(workorderStatusLabels, sheet.status)}</span>
      </div>

      <div className="basic-grid">
        <div><span>工单编号</span><strong>{sheet.workorderId || "--"}</strong></div>
        <div><span>设备</span><strong>{sheet.deviceId || "--"}</strong></div>
        <div><span>{workType.inspection ? "检查负责人" : "维修负责人"}</span><strong>{sheet.assignee}</strong></div>
        <div><span>派发方式</span><strong>{sheet.autoDispatched ? "系统自动派发" : "系统工单"}</strong></div>
      </div>

      <div className="sheet-execution-grid">
        <section className="sheet-section fault-summary-card">
          <span className="section-kicker">故障信息</span>
          <h3>{sheet.title}</h3>
          <div className="fault-meta-list">
            <span>故障部件：{sheet.partName}</span>
            <span>料号：{sheet.partNo}</span>
            <span>所属系统：{sheet.system}</span>
            <span>位置：{sheet.location}</span>
          </div>
          <FormattedText value={`故障表现：${sheet.faultSymptom}`} className="fault-symptom" />
        </section>
        <section className="sheet-section feedback-card">
          <div className="sheet-subhead"><div><span className="section-kicker">WorkOrder 执行反馈</span><h3>{workType.inspection ? "检查结果与核验" : "完成后提交结果"}</h3></div></div>
          <label htmlFor="repair-feedback">处理说明</label>
          <textarea id="repair-feedback" value={repairFeedback} onChange={(event) => setRepairFeedback(event.target.value)} placeholder={workType.inspection ? "填写检查结果或未解决原因" : "填写实际完成的维修处理和结果"} disabled={busy || readOnly || sheet.status === 'closed'} />
          {error && <div className="inline-error">{error}</div>}
          {workType.inspection && (feedbackSavedId === sheet.workorderId || inspectionResult.completed) && <p role="status">{inspectionResult.completed ? "检查已完成。" : "检查结果已保存；仍有异常或核验条件未满足，保留待处理。"}</p>}
          {!workType.inspection && review.required && feedbackSavedId === sheet.workorderId && <p role="status">处理记录已保存。完成实际维修后可直接确认并申请复机。</p>}
          {workType.inspection && inspectionResult.findings.length > 0 && <PlanList title="检查未满足的条件" items={inspectionResult.findings} />}
          {!workType.inspection && sheet.machineControl && (
            <div className={`machine-control-result ${sheet.machineControl.state === 'running' ? "is-ok" : "is-error"}`} role="status">
              <span>{sheet.machineControl.state === 'running'
                ? "整线设备启动后已逐台读回，运行复核通过。"
                : `${isDone ? '维修已完成，复机申请未通过' : '维修确认未通过'}：${sheet.machineControl.reason || sheet.machineControl.error || sheet.machineControl.state}`}</span>
              {Array.isArray(sheet.machineControl.workorder_ids) && sheet.machineControl.workorder_ids.length > 0 && (
                <p className="machine-control-blockers">需先处理的故障工单：{sheet.machineControl.workorder_ids.join('、')}</p>
              )}
            </div>
          )}
          {!workType.inspection && <p>填写实际处理结果后，点击下方按钮确认完成；系统自动检查设备状态并申请复机。</p>}
          <div className="sheet-actions">
            <button className="button" type="button" disabled={busy || readOnly || isDone || sheet.accepted} onClick={() => onUpdate("in_progress")}>{busy ? "处理中" : sheet.accepted ? '已确认接单' : "确认接单"}</button>
            {!workType.inspection && review.required && <button className="button" type="button" disabled={busy || readOnly || sheet.status === 'closed' || !repairFeedback.trim()} onClick={saveRecord}>提交处理记录</button>}
            {workType.inspection ? <button className="button primary" type="button" disabled={busy || readOnly || isDone || !repairFeedback.trim()} onClick={saveRecord}>提交检查结果</button> : <button
              className="button primary"
              type="button"
              disabled={busy || readOnly || sheet.status === 'closed' || completionVerified || !repairFeedback.trim()}
              onClick={() => onUpdate("completed", buildRepairCompletionPayload({ feedback: repairFeedback }))}
            >{isDone ? '再次确认并申请复机' : '确认维修完成并申请复机'}</button>}
            {!workType.inspection && sheet.status === 'completed' && sheet.verificationPhase === 'poststart' && <button className="button" disabled={busy || readOnly || (review.required && !review.humanConfirmed)} onClick={() => onUpdate('closed')}>{review.required ? '关闭工单' : '关闭工单并生成总结'}</button>}
          </div>
        </section>
      </div>
    </section>
  );
}

function RepairCadPanel({ order, target }) {
  const [cad, setCad] = useState(null);
  const [cadError, setCadError] = useState("");
  const sceneMountRef = useRef(null);
  const targetComponent = target.component || target.part_no || target.part_name || "";
  const drawingUrl = resolveWorkorderDrawing(order, target);

  useEffect(() => {
    let cancelled = false;
    setCad(null);
    setCadError("");
    if (!targetComponent) return undefined;
    request(`/api/cad/resolve?component=${encodeURIComponent(targetComponent)}&part_no=${encodeURIComponent(target.part_no || "")}&device_id=${encodeURIComponent(order?.device_id || "")}`)
      .then((body) => { if (!cancelled) setCad(body); })
      .catch((error) => { if (!cancelled) setCadError(error.message); });
    return () => { cancelled = true; };
  }, [targetComponent, target.part_no, order?.device_id]);

  function openFullscreen() {
    sceneMountRef.current?.requestFullscreen?.();
  }

  return (
    <section className="repair-visual-panel" aria-label="3D 故障定位">
      <div className="repair-visual-head">
        <div>
          <span className="eyebrow">3D 故障定位</span>
          <h2>{target.part_name}</h2>
          <p>{target.location} · 工单目标：{targetComponent}</p>
        </div>
        <div className="repair-visual-actions">
          <button className="button ghost-button" type="button" onClick={openFullscreen}>全屏</button>
        </div>
      </div>
      <div className="repair-visual-body">
        <div className="repair-cad-scene" ref={sceneMountRef} aria-label="CAD 结构定位视图">
          {drawingUrl ? <iframe className="repair-drawing-frame" title={`${target.part_name || order?.device_id || "设备"} 工单图纸`} src={drawingUrl} /> : <div className="cad-scene-status is-error"><strong>未匹配到工单图纸</strong><span>当前设备：{order?.device_id || "未知"}</span><small>没有可确认的机器图纸，不显示虚构模型。</small></div>}
          {cadError && <div className="cad-scene-status is-error repair-cad-notice"><strong>CAD 部件关系暂不可用</strong><span>{cadError}</span><small>工单图纸仍保留；部件定位请以图纸和现场核验为准。</small></div>}
          {cad?.part && <div className="cad-scene-status repair-cad-notice"><strong>已匹配：{cad.part.name} · {cad.part.part_no}</strong><span>{cad.part.position}</span><small>CAD 来源：{cad.source}。图纸为本工单对应机器的真实离线查看器。</small></div>}
        </div>
      </div>
    </section>
  );
}

function RagWorkspace({ snapshot, sample, messages, setMessages }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [busy, setBusy] = useState(false);
  const messageListRef = useRef(null);
  const refreshedLegacyIds = useRef(new Set());

  async function loadStatus() {
    try {
      setStatus(await request("/api/rag/status"));
      setStatusError("");
    } catch (err) {
      setStatusError(err.message);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function buildConversationHistory() {
    return messages
      .filter((message) => !message.pending)
      .slice(-6)
      .flatMap((message) => {
        const answer = selectAgentAnswer(message.answer) || cleanDisplayText(message.answer?.report?.summary) || "";
        return [
          { role: "user", content: message.question },
          ...(answer ? [{ role: "assistant", content: answer }] : []),
        ];
      })
      .slice(-12);
  }

  async function askKnowledge(nextQuery = query, replaceId = "") {
    const question = nextQuery.trim();
    if (!question || busy) return;
    const id = replaceId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((current) => replaceId
      ? current.map((message) => message.id === replaceId ? { ...message, question, pending: true, answer: null, agentError: "" } : message)
      : [...current, { id, question, pending: true }]);
    setQuery("");
    setBusy(true);
    let answer = null;
    let agentError = "";
    try {
      answer = await request("/api/agent/question/summary", {
        method: "POST",
        body: JSON.stringify({
          user_text: question,
          mode: "knowledge",
          context: {
            ...buildKnowledgeContext(sample, snapshot),
            conversation_history: buildConversationHistory(),
          },
        }),
      });
    } catch (error) {
      agentError = String(error?.message || error);
    }
    setMessages((current) => current.map((message) => message.id === id ? {
      ...message,
      pending: false,
      answer,
      agentError,
    } : message));
    setBusy(false);
  }

  useEffect(() => {
    if (busy) return;
    const legacy = messages.find((message) => needsRagAnswerRefresh(message) && !refreshedLegacyIds.current.has(message.id));
    if (!legacy) return;
    refreshedLegacyIds.current.add(legacy.id);
    askKnowledge(legacy.question, legacy.id);
  }, [messages, busy]);

  function handleComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      askKnowledge();
    }
  }

  return (
    <section className="workspace-view active module-board rag-workspace rag-chat" aria-label="RAG知识问答">
      <ModuleHero eyebrow="RAG 知识中枢" title="维修知识问答" text="围绕设备故障、报警码与 SOP 连续提问；回答只展示模型生成的正文。" />
      <div className="rag-chat-shell">
        <div className="rag-chat-toolbar">
          <div><span className="rag-chat-status-dot" /><strong>知识助手</strong><span>· {status?.backend || "检索服务待确认"}</span></div>
          <div><span>知识记录 {status?.record_count ?? "--"}</span><span>本次对话 {messages.filter((message) => !message.pending).length} 轮</span><button className="button" type="button" onClick={() => setMessages([])} disabled={!messages.length || busy}>清空对话</button><button className="button" type="button" onClick={loadStatus}>刷新状态</button></div>
        </div>
        {statusError && <div className="rag-chat-status-error" role="status">知识库状态暂不可用：{statusError}</div>}
        <div className="rag-chat-messages" ref={messageListRef} role="log" aria-label="知识问答对话" aria-live="polite">
          {messages.length === 0 ? (
            <div className="rag-chat-welcome"><span className="rag-chat-welcome-mark" aria-hidden="true">IA</span><h2>有什么设备问题需要排查？</h2><p>可以询问报警含义、维修步骤或 SOP；回答只展示模型生成的正文。</p></div>
          ) : messages.map((message) => {
            const report = message.answer?.report || {};
            const knowledge = message.answer?.knowledge || {};
            const summary = selectAgentAnswer(message.answer) || cleanDisplayText(report.summary);
            const routedToReport = message.answer?.route === "report" || message.answer?.route_result?.intent === "report";
            const legacyAnswerMissing = needsRagAnswerRefresh(message);
            const retrievalScope = knowledge.retrieval_scope === "device" ? "当前报警机器优先" : knowledge.retrieval_scope === "all" ? "全库检索" : "检索范围待确认";
            return <div className="rag-chat-turn" key={message.id}>
              <div className="rag-chat-row is-user"><span className="rag-chat-avatar">你</span><div className="rag-chat-bubble">{message.question}</div></div>
              <div className="rag-chat-row is-assistant"><span className="rag-chat-avatar">IA</span><div className="rag-chat-bubble">
                {message.pending ? <p className="rag-chat-pending">正在检索并整理回答…</p> : <>
                  {routedToReport && <span className="rag-chat-result-tag">路由至报告流程 · 非知识回答</span>}
                  {!message.agentError && knowledge.retrieval_scope && <span className={`rag-chat-scope-tag ${knowledge.retrieval_scope}`}>{retrievalScope}{knowledge.retrieval_fallback ? " · 已扩大到全库" : ""}</span>}
                  {report.title && <h3>{report.title}</h3>}
                  <FormattedText value={summary || (message.agentError ? "问答服务暂不可用，本次未生成回答。" : legacyAnswerMissing ? "正在重新整理这条历史问题的中文答案…" : "暂未找到直接相关知识，请补充设备编号、报警码或故障现象。")} />
                  {message.agentError && <FormattedText value={`问答服务异常：${message.agentError}`} className="rag-chat-error" />}
                </>}
              </div></div>
            </div>;
          })}
        </div>
        <div className="rag-chat-composer">
          <div className="rag-chat-suggestions">{quickQuestions.map((item) => <button className="button" type="button" key={item} disabled={busy} onClick={() => askKnowledge(item)}>{item}</button>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); askKnowledge(); }}>
            <textarea className="qa-input" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="输入设备维修、SOP 或报警码问题…" aria-label="维修知识问题" />
            <div className="rag-chat-composer-actions"><span>Enter 发送 · Shift+Enter 换行</span><button className="button primary" type="submit" disabled={busy || !query.trim()}>{busy ? "回答中…" : "发送问题"}</button></div>
          </form>
        </div>
      </div>
    </section>
  );
}

function QualityWorkspace({ snapshot, sample }) {
  const [partId, setPartId] = useState("PART-001");
  const [quality, setQuality] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qualityHistory, setQualityHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskOwner, setTaskOwner] = useState("");
  const [note, setNote] = useState("");
  const [reinspectionId, setReinspectionId] = useState("");
  const resourceGeneration = useRef(0);
  const targetGeneration = useRef(0);
  const operationGeneration = useRef(0);
  const currentPartRef = useRef(partId.trim());
  const currentCheckRef = useRef(selectedId);
  currentPartRef.current = partId.trim();
  currentCheckRef.current = selectedId;
  const selected = qualityHistory.find(item => item.quality_check_id === selectedId);
  const relatedTasks = tasks.filter(item => item.quality_check_id === selectedId);
  const outcome = qualityOutcome(quality || {});
  const appealId = pendingQualityAppealId(selected || {});
  function qualityScope(checkId = "") {
    return { partId: partId.trim(), generation: targetGeneration.current, checkId };
  }
  function isQualityScopeCurrent(scope) {
    return scope.generation === targetGeneration.current && scope.partId === currentPartRef.current
      && (!scope.checkId || scope.checkId === currentCheckRef.current);
  }
  async function loadQualityData(value) {
    const scope = value?.partId !== undefined ? value : qualityScope();
    if (!isQualityScopeCurrent(scope)) return;
    const generation = ++resourceGeneration.current;
    const result = await loadQualityResources(request, scope.partId, sample?.device_id || snapshot?.device_id);
    if (generation !== resourceGeneration.current || !isQualityScopeCurrent(scope)) return;
    setExperiences(result.experiences);
    setQualityHistory(result.history);
    setTasks(result.tasks);
    setError(result.errors.join("；"));
    return result;
  }

  useEffect(() => {
    setBusy(false);
    setError("");
    setQuality(null);
    setQualityHistory([]);
    setTasks([]);
    setSelectedId("");
    setReinspectionId("");
    loadQualityData();
    return () => {
      resourceGeneration.current++;
      targetGeneration.current++;
      operationGeneration.current++;
    };
  }, [partId]);

  async function verifyQuality() {
    if (!partId.trim()) return;
    const scope = qualityScope();
    const selectedAtStart = currentCheckRef.current;
    const operation = ++operationGeneration.current;
    const ownsOperation = () => operation === operationGeneration.current && isQualityScopeCurrent(scope);
    const isCurrent = () => ownsOperation() && currentCheckRef.current === selectedAtStart;
    setBusy(true);
    setError("");
    try {
      const body = await request(`/api/quality/parts/${encodeURIComponent(scope.partId)}`, { method: "POST", body: "{}" });
      if (!isCurrent()) return;
      setQuality(body);
      setSelectedId(body.quality_check_id || "");
      setQualityHistory((items) => body.quality_check_id && !items.some((item) => item.quality_check_id === body.quality_check_id)
        ? [{ quality_check_id: body.quality_check_id, target_id: scope.partId, result: body.status, score: body.score, created_at: body.checked_at }, ...items]
        : items);
      await loadQualityData(scope);
    } catch (err) {
      if (isCurrent()) setError(err.message);
    } finally {
      if (ownsOperation()) setBusy(false);
    }
  }

  async function executeAction(action, extras = {}) {
    const scope = qualityScope(selectedId);
    const operation = ++operationGeneration.current;
    const isCurrent = () => operation === operationGeneration.current && isQualityScopeCurrent(scope);
    setBusy(true);
    setError("");
    try {
      const result = await runQualityAction(request, action, { checkId: selectedId, title: taskTitle, owner: taskOwner, note, reinspectionCheckId: reinspectionId, ...extras });
      if (!isCurrent()) return;
      const updated = qualityFromAction(result);
      if (updated) setQuality(updated);
      await loadQualityData(scope);
    } catch (err) { if (isCurrent()) setError(err.message); }
    finally { if (operation === operationGeneration.current) setBusy(false); }
  }

  return (
    <section className="workspace-view active module-board quality-workspace" aria-label="质检系统">
      <ModuleHero eyebrow="QMS 质检系统" title="生产零件质量检测" text="对生产完成的零件执行尺寸、外观、材料、功能和工艺追溯检测。" />
      <div className="ops-grid quality-primary-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">检测任务</span><h2>输入零件编号</h2></div></div>
          <label className="field-label" htmlFor="quality-part-id">生产零件编号</label>
          <input id="quality-part-id" className="select-input" value={partId} onChange={(event) => setPartId(event.target.value)} placeholder="例如 PART-001" />
          <InspectionInput key={partId} partId={partId} onSaved={() => setError('')} />
          <div className="action-row"><button className="button primary" type="button" disabled={busy || !partId.trim()} onClick={verifyQuality}>{busy ? "检测中" : "执行质量检测"}</button></div>
          {error && <div className="inline-error">{error}</div>}
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">最近结果</span><h2>{quality ? `检测结果：${outcome.label}` : "等待检测"}</h2></div>{quality && <span className={`severity-pill ${outcome.tone}`}>{outcome.label}</span>}</div>
          {quality ? <QualityResultView quality={quality} /> : <div className="empty-state">输入生产零件编号后，系统会返回尺寸、外观、材料、功能和工艺检测结果。</div>}
          {quality?.recommendation && <FormattedText value={quality.recommendation} />}
          {quality?.trace_id && <p>本轮日志：{quality.trace_id}（日志系统中查看 Quality Agent 和五项工具调用）</p>}
          {quality?.report?.report_id && <p>已生成质检报告：{quality.report.report_id}，请在报告中心查看和导出 PDF。</p>}
        </section>
      </div>
      <section className="answer-grid quality-experience-grid">
        <div className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">经验库 · {experiences.length} 条</span><h2>相关维修经验</h2></div><button className="button" type="button" onClick={loadQualityData}>刷新经验</button></div><ExperienceList items={experiences} /></div>
        <div className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">真实记录 · {qualityHistory.length} 条</span><h2>质检历史 · 选择记录查看闭环</h2></div></div>{qualityHistory.length ? <div className="document-list">{qualityHistory.map((item) => <button className="button quality-history-card" type="button" aria-pressed={selectedId === item.quality_check_id} key={item.quality_check_id} onClick={() => { setSelectedId(item.quality_check_id); setQuality(item); setReinspectionId(""); }}><strong>{item.quality_check_id}</strong><span>{item.target_id || item.part_id || partId} · {qualityHistoryStatusLabel(item)} · {formatTime(item.created_at)}</span></button>)}</div> : <div className="empty-state">完成检测后，质检记录会写入后端并显示在这里。</div>}</div>
      </section>
      {selected && <section className="panel module-panel quality-closure-panel">
        <div className="panel-heading"><div><span className="eyebrow">同一质检任务的闭环操作</span><h2>{qualityHistoryStatusLabel(selected)}</h2><p>{selected.quality_check_id} · 批次 {selected.batch_id || "未提供"}</p></div></div>
        <p>检测失败后创建整改任务；全部整改完成后，重新执行质量检测并引用新记录复检。服务端再次校验通过才能放行和关闭。</p>
        {["failed", "rectification"].includes(selected.status) && <div>
          <label className="field-label" htmlFor="quality-task-title">整改内容</label><input className="select-input" id="quality-task-title" value={taskTitle} onChange={event => setTaskTitle(event.target.value)} />
          <label className="field-label" htmlFor="quality-task-owner">整改负责人</label><input className="select-input" id="quality-task-owner" value={taskOwner} onChange={event => setTaskOwner(event.target.value)} />
          <div className="action-row"><button className="button primary" disabled={busy || !taskTitle.trim()} onClick={() => executeAction("create_task")}>创建整改任务</button></div>
        </div>}
        <label className="field-label" htmlFor="quality-closure-note">执行记录／申诉原因</label><textarea className="qa-input" id="quality-closure-note" value={note} onChange={event => setNote(event.target.value)} placeholder="记录真实整改操作、检测数据或申诉原因" />
        {relatedTasks.map(task => <div className="quality-task-record" key={task.closure_task_id}><strong>{task.title}</strong><p>{task.closure_task_id} · {task.owner || "负责人未设置"} · {task.status === "completed" ? "已整改" : "待整改"}</p>{task.status === "open" && <button className="button" disabled={busy || !note.trim()} onClick={() => executeAction("complete_task", { taskId: task.closure_task_id })}>提交该任务整改记录</button>}</div>)}
        {selected.status === "reinspection" && <div>
          <label className="field-label" htmlFor="quality-reinspection-id">选择新生成的合格检测记录</label>
          <select className="select-input" id="quality-reinspection-id" value={reinspectionId} onChange={event => setReinspectionId(event.target.value)}><option value="">完成整改后，请先重新执行质量检测</option>{qualityHistory.filter(item => item.quality_check_id !== selectedId && item.result === "passed" && item.batch_id && item.batch_id === selected.batch_id).map(item => <option value={item.quality_check_id} key={item.quality_check_id}>{item.quality_check_id} · {formatTime(item.created_at)}</option>)}</select>
          <div className="action-row"><button className="button" disabled={busy || !reinspectionId} onClick={() => executeAction("reinspect")}>引用该记录复检</button></div>
        </div>}
        <div className="action-row">
          {["failed", "rectification"].includes(selected.status) && <button className="button" disabled={busy || !note.trim()} onClick={() => executeAction("appeal")}>提交申诉</button>}
          {selected.status === "appealed" && <><button className="button" disabled={busy || !appealId} onClick={() => executeAction("resolve_appeal", { decision: "approved", appealId })}>批准申诉并重新整改</button><button className="button" disabled={busy || !appealId} onClick={() => executeAction("resolve_appeal", { decision: "rejected", appealId })}>驳回申诉</button>{!appealId && <p>待处理申诉信息不完整或存在多条待办，请刷新质检记录后核对。</p>}</>}
          {(selected.status === "passed" || (selected.status === "reinspection" && selected.reinspection?.passed === true)) && <button className="button primary" disabled={busy || relatedTasks.some(task => task.status !== "completed")} onClick={() => executeAction("release")}>校验并放行</button>}
          {selected.status === "released" && <button className="button primary" disabled={busy} onClick={() => executeAction("close")}>关闭质检任务</button>}
        </div>
        {error && <div className="inline-error" role="alert">{error}</div>}
      </section>}
    </section>
  );
}

function ModuleHero({ eyebrow, title, text, action = null }) {
  return <header className="module-hero"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action && <div className="module-hero-action">{action}</div>}</header>;
}

function WorkspaceEmpty({ eyebrow, title, text }) {
  return <div className="workspace-empty"><span className="workspace-empty-mark" aria-hidden="true">—</span><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>;
}

function ModuleStat({ label, value, text }) {
  return <div className="module-card"><span>{label}</span><strong>{value}</strong><p>{text}</p></div>;
}

function TechnicianSection({ title, items = [], ordered = false, tone = "" }) {
  const values = (items || []).map(cleanEvidenceText).filter(Boolean);
  if (!values.length) return null;
  const renderItem = (item, index) => {
    const content = String(item);
    const isDocumentEvidence = /本地OCR识别结果|内容类型:|^\[cad_drawing/i.test(content);
    const detail = content.length > 220
      ? <details className="long-evidence"><summary>{isDocumentEvidence ? "参考文档正文" : `${content.slice(0, 130).trim()}…`} <span>展开正文</span></summary><FormattedText value={content} /></details>
      : <FormattedText value={content} />;
    return <li key={`${index}-${content.slice(0, 40)}`}>{detail}</li>;
  };
  return (
    <div className={`technician-section ${tone}`}>
      <h3>{title}</h3>
      {ordered ? (
        <ol>{values.map(renderItem)}</ol>
      ) : (
        <ul>{values.map(renderItem)}</ul>
      )}
    </div>
  );
}

function StepList({ steps = [] }) {
  const visibleSteps = steps.map(cleanDisplayText).filter(Boolean);
  if (!visibleSteps.length) return <div className="empty-state">暂无维修步骤</div>;
  return <ol className="step-list">{visibleSteps.map((step, index) => <li key={`${step}-${index}`}><FormattedText value={step} /></li>)}</ol>;
}

function QualityResultView({ quality }) {
  const checks = qualityChecks(quality);
  const defects = (quality.defects || []).map((item) => typeof item === "string" ? item : item?.description || item?.message || item?.name || "").filter(Boolean);
  return <div className="quality-result"><div className="check-grid">{checks.map((item, index) => { const status = qualityOutcome(item); return <div key={`${item.name}-${index}`} className={status.tone}><span>{item.name}</span><strong>{status.label}</strong></div>; })}</div><StepList steps={[...defects, ...(quality.findings || [])]} /></div>;
}

function ExperienceList({ items }) {
  if (!items.length) return <div className="empty-state">暂无经验记录；闭环通过后会自动沉淀。</div>;
  return <div className="document-list">{items.map((item, index) => <article key={item.experience_id || index}><strong>{cleanDisplayText(item.title) || "维修经验"}</strong><FormattedText value={cleanDisplayText(item.content) || "暂无经验正文"} /></article>)}</div>;
}

function FormattedText({ value, className = "" }) {
  const blocks = splitTextBlocks(value);
  if (!blocks.length) return null;
  const inline = (text, keyPrefix) => splitInlineMarkdown(text).map((part, partIndex) => {
    const key = `${keyPrefix}-${partIndex}`;
    if (part.type === "strong") return <strong key={key}>{part.text}</strong>;
    if (part.type === "code") return <code key={key}>{part.text}</code>;
    return <React.Fragment key={key}>{part.text}</React.Fragment>;
  });
  return <div className={`formatted-text ${className}`.trim()}>{blocks.map((block, index) => {
    if (block.type === "list") return <ul key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{inline(item, `list-${index}-${itemIndex}`)}</li>)}</ul>;
    if (block.type === "heading") {
      const Heading = `h${Math.min(Math.max(block.level + 1, 3), 6)}`;
      return <Heading key={`heading-${index}`}>{inline(block.text, `heading-${index}`)}</Heading>;
    }
    if (block.type === "rule") return <hr key={`rule-${index}`} />;
    return <p key={`paragraph-${index}`}>{inline(block.text, `paragraph-${index}`)}</p>;
  })}</div>;
}


function ReportDisplaySections({ sections }) {
  return <div className="report-display-sections">{sections.map((section) => (
    <section className="report-display-section" key={section.title}>
      <h3>{section.title}</h3>
      {section.body && <FormattedText value={section.body} />}
      {section.items?.length > 0 && <StepList steps={section.items} />}
    </section>
  ))}</div>;
}

export { App };
