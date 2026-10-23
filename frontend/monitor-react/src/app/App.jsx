import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import "../styles.css";
import machineImage from "../assets/trak-tc820-machine-transparent.png";
import { buildMaintenancePlanView, buildRepairCompletionPayload, buildWorkorderSheet, getDeviceDisplayName, getWorkorderAlarmCode, getWorkorderDisplayTitle } from "../workorderSheet.mjs";
import { buildDiagnosisTaskView, buildDiagnosisView, diagnosisMatchesCurrent, getLatestDiagnosis, getLatestPipeline } from "./diagnosisView.mjs";
import { currentIncident, incidentIdentity, matchesIncident, linkedPlanOrder, recordTimes, formatRecordTime } from './incidentIdentity.mjs';
import { buildReportArticleChapters, buildReportDisplaySections, reportCompleteness, reportQualityLabel } from "./reportView.mjs";
import { buildKnowledgeContext } from "./knowledgeScope.mjs";
import { buildAgentInvocations, buildTraceEventSummaries, formatTraceValue, normalizeRunResponse, normalizeTraceResponse, runEventMatches, traceDetailSections, traceEventSummary, traceIdentity } from "./traceLog.mjs";
import { getRagStorage, needsRagAnswerRefresh, persistRagMessages, restoreRagMessages } from "./ragSession.mjs";
import { request } from "./apiRequest.mjs";
import {peekWorkspaceRead,readWorkspace,startWorkspacePrefetch,workspaceRunVersion,workspaceRunTraceIds,workorderDetailVersion} from './workspaceReads.mjs';
import { getTeamSession, subscribeTeamSession } from '../teamSession.mjs';
import { buildMaintenanceWorkspaceRecords, deleteMaintenancePlans, executionReviewView, inspectionWorkorderView, loadMaintenancePlans, loadMaintenanceOrders, maintenanceDispatchView, maintenanceHistoryNotice, maintenanceReferenceDrawings, maintenanceWorkType, retryMaintenancePlan } from "./maintenanceWorkspace.mjs";
import { publishMaintenanceChange, subscribeMaintenanceChanges, rememberDeletedMaintenancePlans } from './maintenanceChanges.mjs';
import { cleanDisplayText, cleanEvidenceText, selectAgentAnswer, splitInlineMarkdown, splitTextBlocks, displayRiskLevel, resultListItems, normalizeResultText } from "./textFormatting.mjs";
import ResultText from './ResultText.jsx';
import { formatMonitorHealth, monitorEvidenceReason } from "./monitorDisplay.mjs";
import { getMachineMotionState, getWorkshopMotionState, machineStatus, machineStatusLabel } from "./workshopMotion.mjs";
import { WorkbenchSidebar } from "./WorkbenchShell.jsx";
import ExpertWorkspace from './ExpertWorkspace.jsx';
import ProductionCadWorkspace from "./production-cad/ProductionCadWorkspace.jsx";
import { freeCadRequest } from "./production-cad/freecad.mjs";
import PartQualityWorkspace from "./QualityWorkspace.jsx";
import RepairCadPanel from './WorkorderDrawingPanel.jsx';
import RuntimeMonitor from './RuntimeMonitor.jsx';
import "../workbench.css";
import TeamAccess from '../TeamAccess.jsx';
import SupervisorQueue from '../SupervisorQueue.jsx';
import '../team.css';

const Machine3DScene = lazy(() => import("./Machine3DScene.jsx"));

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
  industrial_camera: "工业视觉相机",
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
  industrial_camera: {
    area: "A05 视觉抽检工位",
    flow: "产线抽检示意 → 相机采集状态 → 使用实际图像进行视觉质检复核",
    focus: "相机在线、采集使能、帧率与曝光",
    metrics: [
      ["camera_online", "相机在线", "连接", ""],
      ["camera_frame_rate_fps", "图像帧率", "采集", "fps"],
      ["camera_exposure_us", "曝光时间", "曝光", "μs"],
    ],
  },
};

const defaultMachinePositions = [
  { x: 42, y: 58 },
  { x: 23, y: 46 },
  { x: 68, y: 42 },
  { x: 78, y: 62 },
  { x: 35, y: 78 },
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
  const [monitorLine, setMonitorLine] = useState(null);
  const [motionUnavailable, setMotionUnavailable] = useState(true);
  const revisionRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let controller;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      const revision = ++revisionRef.current;
      const canApply = () => !disposed && revision === revisionRef.current;
      const pauseOnFailure = failure => {
        if (canApply()) setMotionUnavailable(true);
        throw failure;
      };
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3000);
      try {
        // The public ledger is also required when logged out or in big-screen mode.
        const [monitor, line] = await Promise.allSettled([
          request("/api/monitor/snapshot", { signal: controller.signal }).then(value => {
            // A stop must not wait for the other request. Running is published
            // only after both reads in this round have succeeded.
            const deviceMotion = getWorkshopMotionState({ machines: buildWorkshopMachines(value), line: { state: "running" }, runner: value.runner });
            if (canApply() && !deviceMotion.running) setSnapshot(value);
            return value;
          }, pauseOnFailure),
          request("/api/team/line", { signal: controller.signal }).then(value => {
            if (canApply() && !["running", "unknown"].includes(value?.state)) setMonitorLine(value);
            return value;
          }, pauseOnFailure),
        ]);
        if (disposed || revision !== revisionRef.current) return;
        if (monitor.status === "fulfilled") {
          setSnapshot(monitor.value);
          setError("");
        } else setError(monitor.reason.message);
        if (line.status === "fulfilled") setMonitorLine(line.value);
        setMotionUnavailable(monitor.status !== "fulfilled" || line.status !== "fulfilled");
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, []);

  async function control(action) {
    ++revisionRef.current;
    setMotionUnavailable(true);
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
    ++revisionRef.current;
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

  return { snapshot, error, control, resetStats, monitorLine, motionUnavailable };
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
    return ["cad", "monitor", "diagnosis", "maintenance", "workorder", "quality", "rag", "expert", "logs", "report"].includes(requested) ? requested : "monitor";
  });
  const [maintenanceVisited, setMaintenanceVisited] = useState(activeView === "maintenance");
  const [logsVisited, setLogsVisited] = useState(activeView === "logs");
  const [workorderVisited, setWorkorderVisited] = useState(activeView === "workorder");
  const [reportVisited, setReportVisited] = useState(activeView === "report");
  const [expertVisited, setExpertVisited] = useState(activeView === "expert");
  useEffect(() => {
    if (activeView === "maintenance") setMaintenanceVisited(true);
    if (activeView === "logs") setLogsVisited(true);
    if (activeView === "workorder") setWorkorderVisited(true);
    if (activeView === "report") setReportVisited(true);
    if (activeView === "expert") setExpertVisited(true);
  }, [activeView]);
  const [ragMessages, setRagMessages] = useState(() => {
    if (typeof window === "undefined") return [];
    const storage = getRagStorage(window);
    return restoreRagMessages(storage.primary, storage.fallback);
  });
  const [toast, setToast] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState(workshopMachines[0].id);
  const [bigScreen, setBigScreen] = useState(false);
  const { snapshot, error, control, resetStats, monitorLine, motionUnavailable } = useMonitorSnapshot();
  const runner = snapshot?.runner || {};
  const machines = useMemo(() => buildWorkshopMachines(snapshot), [snapshot]);
  const motion = getWorkshopMotionState({ machines, line: monitorLine, runner, unavailable: motionUnavailable });
  const metricHistory = useMetricHistory(machines);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const result = selectedMachine?.result || null;
  const sample = result?.current_sample || selectedMachine?.sample || null;
  const prefetchContext=useRef(null);
  prefetchContext.current={snapshot,sample};
  const workflowReadKey=JSON.stringify([...Object.values(snapshot?.diagnosis?.pipeline_by_event||{}),...Object.values(snapshot?.diagnosis?.pipeline_by_device||{}),snapshot?.diagnosis?.pipeline].filter(Boolean)
    .map(pipeline=>[pipeline.event?.event_id||pipeline.event_id,pipeline.status,pipeline.diagnosis?.status,pipeline.knowledge?.status,
      pipeline.maintenance_plan?.plan_id,pipeline.workorder?.workorder?.workorder_id||pipeline.workorder?.workorder_id,
      pipeline.workorder?.workorder?.updated_at||pipeline.workorder?.updated_at,pipeline.report?.report_id,pipeline.memory?.experience?.experience_id]));
  useEffect(()=>startWorkspacePrefetch({chooseOrder:items=>preferredWorkorderId(items,prefetchContext.current.sample,prefetchContext.current.snapshot)}),[workflowReadKey]);

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
      if (["cad", "monitor", "diagnosis", "maintenance", "workorder", "quality", "rag", "expert", "logs", "report"].includes(requested || "")) {
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
        {!bigScreen && <TeamAccess actor={teamActor} onActor={setTeamActor} line={monitorLine || lineState} onLine={setLineState} />}
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
            motion={motion}
            result={result}
            sample={sample}
            dataSource={snapshot?.data_source}
            metricHistory={metricHistory}
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
            onOpenQuality={() => setActiveView("quality")}
          />
        )}
        {!bigScreen && activeView === "cad" && <ProductionCadWorkspace />}
        {!bigScreen && activeView === "diagnosis" && <DiagnosisWorkspace snapshot={snapshot} sample={sample} />}
        {(maintenanceVisited || activeView === "maintenance") && <MaintenancePlanWorkspace active={!bigScreen && activeView === "maintenance"} snapshot={snapshot} sample={sample} actor={teamActor} />}
        {!bigScreen && activeView === "workorder" && (teamActor ? <SupervisorQueue actor={teamActor} /> : <section className="workorder-queue"><h2>请先登录维修小组账号</h2><p>展开上方“注册 / 登录”。维修人员查看本人工单。</p></section>)}
        {teamActor && (workorderVisited || activeView === "workorder") && <WorkorderView key={`${teamActor.user_id}:${teamActor.role}`} active={!bigScreen && activeView === "workorder"} actor={teamActor} snapshot={snapshot} sample={sample}
          onClosed={() => { showToast("工单已关闭"); setActiveView("monitor"); }} />}
        {!bigScreen && activeView === "rag" && <RagWorkspace snapshot={snapshot} sample={sample} messages={ragMessages} setMessages={setRagMessages} />}
        {(expertVisited || activeView === "expert") && <div hidden={bigScreen || activeView !== "expert"}><ExpertWorkspace key={`${teamActor?.user_id || 'guest'}:${teamActor?.role || ''}`} actor={teamActor} active={!bigScreen && activeView === "expert"} /></div>}
        {(logsVisited || activeView === "logs") && <LogsWorkspace active={!bigScreen && activeView === "logs"} snapshot={snapshot} />}
        {!bigScreen && activeView === "quality" && <QualityWorkspace />}
        {(reportVisited || activeView === "report") && <ReportWorkspace active={!bigScreen && activeView === "report"} snapshot={snapshot} />}
        {toast && <div className="toast-message" role="status">{toast}</div>}
        {(bigScreen || activeView !== "quality") && (error || runner.last_error) && <footer className="error-bar">{error || runner.last_error}</footer>}
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
  motion,
  result,
  sample,
  dataSource,
  metricHistory,
  selectedMachineId,
  onSelectMachine,
  onOpenQuality,
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
        motion={motion}
        selectedMachineId={selectedMachine.id}
        result={result}
        onSelectMachine={selectFromMap}
      />
      {detailOpen && <MachineDetailDrawer machine={selectedMachine} result={result} sample={sample} dataSource={dataSource} history={metricHistory[selectedMachine.id] || []} onOpenQuality={onOpenQuality} onClose={() => setDetailOpen(false)} />}
    </section>
  );
}

function WorkshopMap({ machines, motion = getWorkshopMotionState(), selectedMachineId, result, onSelectMachine }) {
  const [viewMode, setViewMode] = useState("iso");
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const selectedStatus = machineStatus(selectedMachine, selectedMachine?.result || result);

  return (
    <section className="panel workshop-panel">
      <div className="factory-map" aria-label="车间设备分布图">
        <Suspense fallback={<div className="machine-3d-canvas" role="status">正在加载车间视图…</div>}>
        <Machine3DScene
          machines={machines}
          motion={motion}
          selectedMachineId={selectedMachineId}
          status={selectedStatus}
          viewMode={viewMode}
          onSelect={(machineId) => onSelectMachine(machineId || selectedMachine?.id)}
        />
        </Suspense>
        <div className="scene-overlay">
          <div>
            <span className="eyebrow">车间总览</span>
            <h2>流水线三维视图</h2>
            <p className="scene-click-hint">点击设备模型查看运行数据</p>
            <p className={`scene-motion-status ${motion.running ? "running" : "paused"}`} role="status">
              <strong>{motion.label}</strong><span>{motion.reason}</span>
            </p>
          </div>
          <div className="map-legend" aria-label="状态图例">
            <span><i className="legend-dot normal" />正常</span>
            <span><i className="legend-dot warning" />预警</span>
            <span><i className="legend-dot fault" />故障</span>
            <span><i className="legend-dot stopped" />已停止</span>
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

function MachineDetailDrawer({ machine, result, sample, dataSource, history, onOpenQuality, onClose }) {
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
          {machine.deviceType === "industrial_camera" && <>
            <p>相机指标来自设备监控；台式工位的工件移动与扫描灯为流程示意。视觉缺陷判定须使用实际图像并在质量检测页运行、复核。</p>
            <button className="button primary" type="button" onClick={onOpenQuality}>进入视觉质检</button>
          </>}
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
  const [selectedFault, setSelectedFault] = useState('');
  const {tasks, selectedTask, view} = buildDiagnosisTaskView(snapshot, sample, selectedFault);
  const confidence = view.confidence == null ? "--" : `${Math.round(view.confidence * 100)}%`;
  const alarm = selectedTask ? selectedTask.event.alarm_code : sample?.alarm_label || sample?.alarm_code || "当前无活动报警";
  return (
    <section className="workspace-view active module-board diagnosis-workspace" aria-label="智能诊断">
      <ModuleHero eyebrow="故障分析" title="智能诊断" text="查看设备故障判断、原因分析和处理建议。" />
      {tasks.length > 0 && <section className="panel module-panel" aria-label="故障任务选择">
        <label htmlFor="diagnosis-fault-task">查看故障任务</label>
        <select id="diagnosis-fault-task" value={selectedTask?.key || ''} onChange={event => setSelectedFault(event.target.value)}>
          <option value="">当前故障（自动跟随）</option>
          {tasks.map(task => <option key={task.key} value={task.key}>{task.label}</option>)}
        </select>
        {selectedTask && <>
          <p className="muted">正在查看所选故障的已保存结果，不会重新诊断或重复派工。</p>
          <p>维修方案：{selectedTask.planId || '尚未生成'}　工单：{selectedTask.workorderId
            ? <a href={`?view=workorder&workorder_id=${encodeURIComponent(selectedTask.workorderId)}`}>{selectedTask.workorderId}</a>
            : '尚未派发，以方案校验和审批结果为准'}</p>
        </>}
      </section>}
      <div className="module-grid">
        <ModuleStat label="诊断状态" value={view.statusLabel} text={view.deviceId || "等待设备"} />
        <ModuleStat label="置信度" value={confidence} text="诊断结果参考" />
        <ModuleStat label={selectedTask ? "所选故障报警" : "当前报警"} value={alarm} text={view.workflowReason || (selectedTask ? '所选故障的处理结果' : "持续监测中")} />
      </div>
      <div className="answer-grid diagnosis-content-grid result-diagnosis-grid">
        <section className="panel module-panel result-card result-summary-card" aria-label="诊断结论">
          <div className="panel-heading"><div><span className="eyebrow">诊断结论</span><h2>当前判断</h2></div></div>
          <ResultText value={view.summary} className="diagnosis-summary" />
          {view.statusHint && <div className="notice-banner" role="status">{view.statusHint}</div>}
          {view.error && <div className="inline-error" role="alert">诊断暂未完成，请稍后重试或联系维修人员。</div>}
        </section>
        {view.cause && <section className="result-card" aria-label="根因分析"><h3>根因分析</h3><ResultText value={view.cause} /></section>}
        {view.recommendation && <section className="result-card" aria-label="处置建议"><h3>处置建议</h3><ResultText value={view.recommendation} /></section>}
        {view.nextAction && <section className="result-card" aria-label="下一步操作"><h3>下一步操作</h3><ResultText value={view.nextAction} /></section>}
        {view.evidence.length > 0 && <section className="result-card result-evidence-card" aria-label="诊断依据"><h3>诊断依据</h3><ResultText value={view.evidence} /></section>}
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
  if (getMachineMotionState(machine) === "stopped") return sample?.control_reason || "设备已停止，整线画面同步暂停";
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
  const visibleItems = items.filter(item => !item.deleted_at);
  const incident = currentIncident(snapshot, sample, visibleItems);
  const deviceId = incident.device_id, alarmCode = incident.alarm_code;
  const exact = visibleItems.find(item => matchesIncident({...item,alarm_code:getWorkorderAlarmCode(item)},incident));
  const sameDevice = visibleItems.find((item) => String(item.device_id || "") === deviceId);
  // 存在报警时，绝不能静默回退到其他报警的工单，否则历史工单会被误显示为当前事件。
  if (alarmCode) return exact?.workorder_id || "";
  return sameDevice?.workorder_id || visibleItems[0]?.workorder_id || "";
}

const AgentInvocationCard = React.memo(function AgentInvocationCard({invocation}) {
  return <article className={`agent-invocation-card agent-invocation-${invocation.status === "异常" ? "error" : invocation.status === "执行中" ? "running" : "done"}`} key={invocation.id}>
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
              {!!invocation.skill_reviews.length && <section className="agent-io-block" aria-label="技能执行核查"><h5>技能执行核查 · {invocation.skill_reviews.length} 项</h5>
                <p>只读核查已有事实与缺项，不改变本次业务结果，也不代表审批、质检或维修验收通过。</p>
                {invocation.skill_reviews.map((review,index)=><details key={`${invocation.id}-review-${index}`}><summary>{review.skill} · {review.status==='completed' ? '已核查' : '尚未验证'}</summary>
                  <p>技能指纹：{review.skill_fingerprint || '未记录'}</p>{review.message && <p>{review.message}</p>}
                  <pre className="log-json">{formatTraceValue(review.output)}</pre></details>)}</section>}
              <section className="agent-io-block agent-tool-chain"><h5>工具调用链（Tool Calls） · {invocation.tool_calls.length} 次</h5>{invocation.tool_calls.length ? <div className="agent-tool-list">{invocation.tool_calls.map((tool) => <section className="agent-tool-call" key={`${invocation.id}-${tool.call_no}-${tool.tool_name}`}><div className="agent-tool-head"><strong>#{tool.call_no} {tool.tool_name}</strong><span>{tool.status}{tool.mcp_server ? ` · MCP ${tool.mcp_server}` : ""} · {tool.duration}</span></div><div className="agent-tool-meta"><span>技能：{tool.context?.skill || "未绑定"} → {tool.context?.step || "--"}</span><span>开始：{tool.started_at ? formatTime(tool.started_at) : "--"}</span><span>结束：{tool.ended_at ? formatTime(tool.ended_at) : "--"}</span><span>事件：{tool.event_count}</span></div><div className="agent-tool-io"><div><h6>工具输入</h6><pre className="log-json">{formatTraceValue(tool.input)}</pre></div><div><h6>工具输出</h6><pre className="log-json">{formatTraceValue(tool.output)}</pre></div></div>{tool.error && <div className="log-event-error">错误：{tool.error}</div>}</section>)}</div> : <div className="agent-io-empty">本次 Agent 没有记录工具调用。</div>}</section>
              <section className="agent-io-block"><h5>输出（Output）</h5><pre className="log-json">{formatTraceValue(invocation.output)}</pre></section>
            </div>
          </article>;
});

function RawLogDetail({detail}) {
  const [open,setOpen]=useState(detail.key==='operation');
  const value=useMemo(()=>open?formatTraceValue(detail.value):'',[open,detail.value]);
  return <details className="log-detail" open={open} onToggle={event=>setOpen(event.currentTarget.open)}><summary>{detail.title}</summary>{open&&<pre className="log-json">{value}</pre>}</details>;
}

const RawLogEvent = React.memo(function RawLogEvent({record,index,count,resolvedSummary}) {
          const summary = resolvedSummary || traceEventSummary(record);
          const identity = traceIdentity(record, index);
          return <article className={`log-event log-event-${summary.status === "异常" ? "error" : summary.status === "执行中" ? "running" : "done"}`} key={record.trace_record_id || `${identity}-${record.timestamp || index}-${record.event || ""}-${record.name || ""}`}>
            <div className="log-event-head">
              <div className="log-event-title"><span className="log-event-index">{count - index}</span><div><strong>{summary.label}</strong><h3>{summary.operation}</h3></div></div>
              <span className="log-event-status">{summary.status}</span>
            </div>
            <div className="log-event-meta"><span>{record.timestamp ? formatTime(record.timestamp) : "--"}</span><span>类型：{record.type || "--"}</span><span>事件：{record.event || "--"}</span><span>Trace：{record.trace_id || "--"}</span><span>Task：{record.task_id || "--"}</span>{summary.server && <span>MCP：{summary.server}</span>}{summary.duration !== "--" && <span>耗时：{summary.duration}</span>}</div>
            {record.error && <div className="log-event-error">错误：{record.error}</div>}
            <div className="log-event-details">{traceDetailSections(record,value=>value,summary).map(detail=><RawLogDetail key={detail.key} detail={detail} />)}</div>
          </article>;

});

function LogsWorkspace({ snapshot, active = true }) {
  const [runsOpen,setRunsOpen]=useState(false);
  const [detailsOpen,setDetailsOpen]=useState(false);
  const initialRuns=peekWorkspaceRead('/api/runs?limit=5000');
  const [runRecords, setRunRecords] = useState(()=>initialRuns?normalizeRunResponse(initialRuns):[]);
  const [filter, setFilter] = useState("all");
  const [selectedRunId, setSelectedRunId] = useState(()=>runRecords[0]?.run_id||'');
  const [details, setDetails] = useState(()=>{
    const run=runRecords[0],version=workspaceRunVersion(run),ids=workspaceRunTraceIds(run);
    const cached=ids.map(id=>peekWorkspaceRead(`/api/trace?trace_id=${encodeURIComponent(id)}&limit=5000`,{revision:version}));
    return run&&cached.length&&cached.every(Boolean)?{runId:run.run_id,version,records:cached.flatMap(normalizeTraceResponse)}:{runId:'',records:[]};
  });
  const [loading, setLoading] = useState(!initialRuns);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [indexError, setIndexError] = useState("");
  const [detailError, setDetailError] = useState("");
  const indexRequest = useRef(null);
  const indexLoaded = useRef(Boolean(initialRuns));
  const lastIndexRead = useRef(0);
  const detailGeneration = useRef(0);
  const detailRequest = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const selectedRunRef = useRef(selectedRunId);
  selectedRunRef.current = selectedRunId;

  useEffect(() => {
    let sessionVersion = getTeamSession().version;
    return subscribeTeamSession(value => {
      if (value.version === sessionVersion) return;
      sessionVersion = value.version;
      indexRequest.current?.controller.abort(); indexRequest.current = null;
      detailGeneration.current++; detailRequest.current?.controller.abort(); detailRequest.current = null;
      setDetails({ runId: '', records: [] });
      setRunRecords(values => values.filter(item => item.run_type !== 'production_simulation'));
      setSelectedRunId(value => value.startsWith('production_simulation:') ? '' : value);
      indexLoaded.current = false;
      loadTraceIndex(true);
    });
  }, []);

  function loadTraceIndex(manual = false) {
    if (!activeRef.current) return Promise.resolve(null);
    if (manual || !indexLoaded.current) setLoading(true);
    if (indexRequest.current) return indexRequest.current.promise;
    const entry = { controller: new AbortController() };
    const isCurrent = () => indexRequest.current === entry && activeRef.current;
    entry.promise = readWorkspace("/api/runs?limit=5000", { signal: entry.controller.signal,freshFor:5000,force:manual }).then(body => {
      if (!isCurrent()) return null;
      const nextRuns = normalizeRunResponse(body);
      indexLoaded.current = true;
      lastIndexRead.current = Date.now();
      setRunRecords(previous=>JSON.stringify(previous)===JSON.stringify(nextRuns)?previous:nextRuns);
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
  const detailVersion = workspaceRunVersion(selectedRun);

  useEffect(() => {
    return () => {
      detailGeneration.current++;
      detailRequest.current?.controller.abort();
      detailRequest.current = null;
      setLoadingDetails(false);
    };
  }, [active, selectedRunId, detailsOpen]);

  useEffect(() => {
    if (!active || !detailsOpen || !selectedRun || detailRequest.current || (details.runId === selectedRunId && details.version === detailVersion)) return;
    const generation = ++detailGeneration.current;
    const controller = new AbortController();
    const entry = { controller };
    detailRequest.current = entry;
    const runId = selectedRunId;
    const isCurrent = () => activeRef.current && generation === detailGeneration.current && selectedRunRef.current === runId;
    const traceIds = workspaceRunTraceIds(selectedRun);
    setDetailError("");
    setLoadingDetails(true);
    Promise.all(traceIds.map(value => readWorkspace(`/api/trace?trace_id=${encodeURIComponent(value)}&limit=5000`, { signal: controller.signal,revision:detailVersion,freshFor:5000 })))
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
  }, [active, detailsOpen, selectedRunId, detailVersion, details.version]);

  const records = useMemo(() => details.runId === selectedRunId ? details.records.filter(record => selectedRun && runEventMatches(selectedRun, record)) : [], [details, selectedRunId, selectedRun]);
  const eventSummaries = useMemo(() => buildTraceEventSummaries(records), [records]);
  const initialDetailsLoading = loadingDetails && !(details.runId === selectedRunId && details.version);
  const filteredRecords = useMemo(()=>records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "error") return Boolean(record.error) || /error|failed|timeout/i.test(String(record.event || ""));
    return String(record.type || "").toLowerCase() === filter;
  }).slice().reverse(),[records,filter]);
  const traceCount = runRecords.length;
  const qualityRunCount = runRecords.filter(run=>run.run_type==='quality').length;
  const productionRunCount = runRecords.filter(run=>run.run_type==='production_simulation').length;
  const toolCount = records.filter((record) => record.type === "tool" || record.tool_name || record.tool).length;
  const errorCount = records.filter((record) => Boolean(record.error) || /error|failed|timeout/i.test(String(record.event || ""))).length;
  const agentInvocations = useMemo(() => buildAgentInvocations(records), [records]);
  const experienceSummaries = useMemo(() => {
    const saved = new Map();
    for (const invocation of agentInvocations) {
      const result = invocation.output;
      const experience = result?.experience;
      if (result?.success && experience?.experience_id && experience?.content && experience?.memory_saved !== false) {
        const previous = saved.get(experience.experience_id);
        if (!previous || Number(experience.knowledge_sync?.attempts || 0) >= Number(previous.knowledge_sync?.attempts || 0)) {
          saved.set(experience.experience_id, experience);
        }
      }
    }
    return [...saved.values()];
  }, [agentInvocations]);
  const error = [indexError, detailError].filter(Boolean).join("；");
  const statusText = (status) => ({ completed: "已完成", running: "进行中", error: "异常", pending: "待执行", blocked: "待补充或处理" }[status] || status || "待执行");

  return (
    <section className="workspace-view active module-board logs-workspace" aria-label="日志系统" hidden={!active} style={active ? undefined : { display: "none" }}>
      <ModuleHero eyebrow="Runtime Logs" title="日志系统" text="运行记录自动更新：监控 → 诊断 → 维修方案 → 工单派发 → 报告中心 → 经验总结；质检始终独立成单。" />
      {error && <div className="workspace-notice logs-notice" role="status">日志读取提示：{error}</div>}
      <RuntimeMonitor active={active}/>
      <details className="panel module-panel logs-panel logs-runs-panel logs-collapse" aria-label="运行记录" open={runsOpen} onToggle={event=>{if(event.target===event.currentTarget)setRunsOpen(event.currentTarget.open);}}>
        <summary className="panel-heading logs-panel-heading"><div><h2>运行记录</h2></div><span className="logs-collapse-count">{traceCount} 条记录</span></summary>
        {runsOpen&&<>
        <div className="module-grid logs-stat-grid">
          <ModuleStat label="运行记录" value={traceCount} text="已保留的生命周期记录"/>
          <ModuleStat label="独立质检" value={qualityRunCount} text="不会并入故障闭环"/>
          {productionRunCount>0&&<ModuleStat label="生产运行" value={productionRunCount} text="生产准备 → 模拟加工 → 模拟检测"/>}
        </div>
        {runRecords.length ? <div className="logs-runs-list">{runRecords.map((run) => <button key={run.run_id} type="button" className={`logs-run-card ${selectedRunId === run.run_id ? "is-selected" : ""}`} onClick={() => {setSelectedRunId(run.run_id);setDetailsOpen(true);}}>
          <div className="logs-run-card-head"><strong>{run.label || (run.run_type === "quality" ? "质检运行" : "运行记录")}</strong><span className={`logs-run-status logs-run-${run.status}`}>{statusText(run.status)}</span></div>
          <div className="logs-run-card-title">{run.device_id ? getDeviceDisplayName(run.device_id, { snapshot }) : "未绑定设备"}{run.alarm_code ? ` · 报警 ${run.alarm_code}` : ""}</div>
          <div className="logs-run-card-meta"><span>{run.started_at ? formatTime(run.started_at) : "--"}</span><span>{run.event_count || 0} 个事件</span><span>{run.error_count || 0} 个异常</span></div>
          <div className="logs-run-phases">{(run.phases || []).map((phase) => <span key={phase.id} className={`logs-phase logs-phase-${phase.status}`}><i />{phase.label} · {statusText(phase.status)}</span>)}</div>
          {run.status_reason && <div className="logs-run-hint">{run.status_reason}</div>}
          <div className="logs-run-id">{run.run_id}</div>
        </button>)}</div> : <div className="empty-state logs-empty">{loading ? '正在加载运行记录…' : indexError ? '运行记录暂未加载，系统会自动重试。' : '暂无运行记录；监控确认故障或执行质检后，这里会生成生命周期记录。'}</div>}
        </>}
      </details>
      {detailsOpen&&experienceSummaries.length > 0 && <section className="panel module-panel logs-panel" aria-label="故障经验总结">
        <div className="panel-heading"><div><span className="eyebrow">Repair Experience</span><h2>经验总结</h2></div></div>
        <div className="document-list logs-experience-summaries">{experienceSummaries.map((experience) => <article key={experience.experience_id}>
          <strong>{cleanDisplayText(experience.title) || "维修经验总结"}</strong>
          <p>关联工单：{experience.source_workorder || "--"}{experience.validation_status === "manual_confirmed" ? " · 依据维修人员人工确认" : ""}</p>
          <p>{experience.rag_saved === true ? '知识沉淀：经验已保存，关键词与向量索引均已完成。' : experience.knowledge_sync?.searchable ? '知识沉淀：经验已保存并可通过关键词检索；向量索引待后台自动重试。' : '知识沉淀：经验已保存；检索索引待后台自动同步。'}</p>
          <FormattedText value={cleanDisplayText(experience.content).replace(/\n/g, "\n\n")} />
        </article>)}</div>
      </section>}
      <details className="panel module-panel logs-panel logs-execution-panel logs-collapse" aria-label="执行日志" open={detailsOpen} onToggle={event=>{if(event.target===event.currentTarget)setDetailsOpen(event.currentTarget.open);}}>
        <summary className="panel-heading logs-panel-heading"><div><h2>执行明细</h2></div><span className="logs-collapse-count">{selectedRun?.label||'选择运行查看'}</span></summary>
        {detailsOpen&&<>
        <div className="module-grid logs-stat-grid">
          <ModuleStat label="所选运行事件" value={records.length} text="当前运行保留的日志记录" />
          <ModuleStat label="工具事件" value={toolCount} text="包含开始和结束，非调用次数" />
          <ModuleStat label="异常事件" value={errorCount} text="不等于故障数量" />
        </div>
        <div className="panel-heading logs-panel-heading">
          <div className="logs-filter" aria-label="日志筛选">
            <select className="select-input logs-trace-select" value={selectedRunId} onChange={(event) => setSelectedRunId(event.target.value)} aria-label="按运行记录筛选"><option value="">选择运行记录</option>{runRecords.map((run) => <option key={run.run_id} value={run.run_id}>{run.label || "运行记录"} · {run.run_id}</option>)}</select>
            {[['all', '全部'], ['agent', 'Agent'], ['tool', '工具'], ['runtime', '运行时'], ['error', '异常']].map(([value, label]) => <button key={value} type="button" className={`logs-filter-button ${filter === value ? "is-active" : ""}`} onClick={() => setFilter(value)}>{label}</button>)}
          </div>
        </div>
        {!initialDetailsLoading && <section className="agent-invocations" aria-label="Agent调用明细">
          <div className="agent-invocations-heading"><div><span className="eyebrow">Agent Invocation I/O</span><h3>Agent 调用明细</h3></div><span className="logs-run-hint">每次调用独立编号，完整展示输入 → 上下文 → 工具 → 输出</span></div>
          {agentInvocations.length ? <div className="agent-invocation-list">{agentInvocations.map(invocation => <AgentInvocationCard key={invocation.id} invocation={invocation} />)}</div> : <div className="empty-state logs-empty">当前运行记录没有 Agent 生命周期事件；请刷新或先执行一次监控→诊断→维修方案→工单闭环。</div>}
        </section>}
        <div className="logs-subsection-heading"><span className="eyebrow">Raw Events</span><h3>底层事件明细</h3><span>保留每条原始记录，便于核对调用顺序与返回体</span></div>
        {initialDetailsLoading ? <div className="empty-state logs-empty">正在加载所选执行链路的完整返回体…</div> : filteredRecords.length ? <div className="logs-list">{filteredRecords.map((record,index) => <RawLogEvent key={record.trace_record_id || `${traceIdentity(record,index)}-${record.timestamp || index}-${record.event || ""}-${record.name || ""}`} record={record} index={index} count={filteredRecords.length} resolvedSummary={eventSummaries.get(record)} />)}</div> : <div className="empty-state logs-empty">暂无执行日志；触发一次诊断、知识检索或工单操作后，这里会显示完整执行链路。</div>}
        </>}
      </details>
    </section>
  );
}

function ReportWorkspace({ snapshot, active = true }) {
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportError, setReportError] = useState("");
  const [loadingReports, setLoadingReports] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState("");
  const [pdfReportIds, setPdfReportIds] = useState([]);
  const reportGeneration = useRef(0);
  const currentReportRef = useRef("");
  const reportsLoaded = useRef(false);
  const reportVersions = useRef({});
  const reportIndexRequest = useRef(null);
  const [reportDetails, setReportDetails] = useState({});
  const [reportDetailError, setReportDetailError] = useState('');

  async function loadReports({ silent = false } = {}) {
    if (reportIndexRequest.current) return reportIndexRequest.current.promise;
    const generation = ++reportGeneration.current;
    const entry = {controller: new AbortController()};
    reportIndexRequest.current = entry;
    if (!silent) setLoadingReports(true);
    entry.promise = (async () => { try {
      const body = await request("/api/reports?summary=true", {signal:entry.controller.signal});
      if (generation !== reportGeneration.current) return;
      const items = (body.items || []).map((item) => item?.report && typeof item.report === "object" ? item.report : item).filter(Boolean);
      setReports(items);
      setSelectedReportId((current) => items.some((item) => item.report_id === current) ? current : items[0]?.report_id || "");
      const oldVersions = reportVersions.current;
      setPdfReportIds((current) => current.filter((id) => items.some((item) => item.report_id === id && oldVersions[id] === item.updated_at)));
      reportVersions.current = Object.fromEntries(items.map(item => [item.report_id, item.updated_at]));
      reportsLoaded.current = true;
      setReportError("");
    } catch (error) {
      if (generation === reportGeneration.current && error.name !== 'AbortError') setReportError(error.message);
    } finally {
      if (generation === reportGeneration.current) setLoadingReports(false);
      if (reportIndexRequest.current === entry) reportIndexRequest.current = null;
    } })();
    return entry.promise;
  }

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer;
    async function poll() {
      await loadReports({silent: reportsLoaded.current});
      if (!cancelled) timer = window.setTimeout(poll, 1000);
    }
    poll();
    const unsubscribe = subscribeMaintenanceChanges(() => loadReports({silent: true}));
    return () => { cancelled = true; reportGeneration.current++; reportIndexRequest.current?.controller.abort(); reportIndexRequest.current = null; window.clearTimeout(timer); unsubscribe(); };
  }, [active]);
  const reportItems = reports.map((item) => item?.report && typeof item.report === "object" ? item.report : item).filter(Boolean);
  const selectedReport = reportItems.find((item) => item.report_id === selectedReportId) || reportItems[0];
  const detailVersion = selectedReport?.updated_at || selectedReport?.created_at || '';
  const cachedDetail = reportDetails[selectedReport?.report_id];
  const listedBody = selectedReport && ('sections' in selectedReport || 'article_text' in selectedReport);
  const persistedReport = listedBody ? selectedReport : cachedDetail?.version === detailVersion ? cachedDetail.value : null;
  useEffect(() => {
    if (!active || !selectedReport?.report_id || persistedReport) return;
    const controller = new AbortController(), id = selectedReport.report_id;
    setReportDetailError('');
    request(`/api/reports/${encodeURIComponent(id)}?display=true`, {signal:controller.signal}).then(body => {
      if (controller.signal.aborted) return;
      const value = body.report && typeof body.report === 'object' ? body.report : body;
      if (value.report_id !== id && body.report_id !== id) throw new Error('报告正文身份不一致，请刷新重试');
      setReportDetails(current => {
        const next = {...current}; delete next[id];
        next[id] = {version:detailVersion, value:{...value, report_id:id}};
        for (const old of Object.keys(next).slice(0, -3)) delete next[old];
        return next;
      });
    }).catch(error => { if (!controller.signal.aborted) setReportDetailError(error.message); });
    return () => controller.abort();
  }, [active, selectedReport?.report_id, detailVersion]);
  const report = persistedReport || {};
  currentReportRef.current = selectedReport?.report_id || "";
  const pdfReady = pdfReportIds.includes(report.report_id);
  const completeness = reportCompleteness(report);
  const sections = report.sections || {};
  const qualityReport = report.report_type === 'quality_report';
  const displaySections = qualityReport ? buildReportDisplaySections(sections, report.report_type) : [];
  const articleChapters = qualityReport ? [] : buildReportArticleChapters(report);
  const workorderCount = new Set([...(report.workorder_ids || []), ...(sections.workorder?.records || []).map(order => order.workorder_id),
    sections.workorder?.workorder_id].filter(Boolean)).size;
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
      reportGeneration.current++;
      reportIndexRequest.current?.controller.abort(); reportIndexRequest.current = null;
      setReports(remaining);
      setReportDetails(current => {const next={...current};delete next[reportId];return next;});
      setSelectedReportId(remaining[0]?.report_id || "");
      setPdfReportIds((current) => current.filter((id) => id !== reportId));
      setReportError("");
    } catch (error) {
      setReportError(error.message);
    }
  }
  if (!active) return null;
  return (
    <section className="workspace-view active module-board report-workspace" aria-label="报告中心">
      <ModuleHero eyebrow="Report Agent" title="报告中心" text="设备故障处理完成后，自动汇总诊断、维修方案、工单执行和复机记录。产品质检报告按独立检测流程生成。" action={<button className="button" type="button" onClick={() => loadReports()} disabled={loadingReports}>{loadingReports ? "同步中…" : "同步报告"}</button>} />
      {reportError && <div className="inline-error" role="status">报告服务暂不可用：{reportError}</div>}
      <section className="panel module-panel report-list-panel" aria-label="已持久化报告列表">
        <div className="panel-heading"><div><span className="eyebrow">持久化记录 · {reportItems.length} 份</span><h2>报告列表</h2></div></div>
        {reportItems.length ? <div className="report-list">{reportItems.map((item) => <div className={`report-list-item ${item.report_id === selectedReport?.report_id ? "is-selected" : ""}`} key={item.report_id}>
          <button type="button" className="report-list-select" onClick={() => setSelectedReportId(item.report_id)}><strong>{item.title || "运维报告"}</strong><span>{item.report_id} · {formatTime(item.created_at || item.updated_at)} · {reportCompleteness(item).label}</span></button>
          <button type="button" className="button danger-button" onClick={() => deleteReport(item.report_id)}>删除</button>
        </div>)}</div> : <div className="empty-state">{loadingReports ? '正在读取报告目录…' : '暂无持久化报告'}</div>}
      </section>
      {hasReport ? (
        <>
          {qualityReport && <div className="module-grid"><ModuleStat label="报告编号" value={report.report_id || "--"} text="产品质检报告" /><ModuleStat label="生成时间" value={report.created_at || report.updated_at ? formatTime(report.created_at || report.updated_at) : "--"} text={`${reports.length || 1} 份已持久化报告`} /><ModuleStat label="质检结果" value={reportQualityLabel(sections.quality)} text="产品的实际检测结果" /></div>}
          <section className="panel module-panel report-panel"><div className="panel-heading"><div><h2>{(!qualityReport && report.article_title) || report.title || "运维报告"}</h2><span className={`severity-pill ${completeness.tone}`}>{completeness.label}</span></div><div className="report-file-actions"><button className="button" type="button" onClick={generatePdf} disabled={!report.report_id || Boolean(generatingPdf)}>{generatingPdf === report.report_id ? "生成中…" : "生成 PDF"}</button>{pdfReady && <><a className="button" href={pdfUrl} target="_blank" rel="noreferrer">打开 PDF</a><a className="button" href={`${pdfUrl}?download=1`} download={`report-${report.report_id}.pdf`}>下载 PDF</a></>}</div></div>{completeness.findings.length > 0 && <div className="workspace-notice" role="status">报告资料尚不完整，请补充相关处理记录。</div>}{qualityReport ? <><FormattedText value={cleanDisplayText(report.summary) || "暂无摘要"} className="answer-summary" />{displaySections.length > 0 && <ReportDisplaySections sections={displaySections} />}</> : <>{report.article_subtitle && <p className="report-subtitle">{report.article_subtitle}</p>}<p className="report-byline">{formatTime(report.created_at || report.updated_at)} · {report.report_id} · {workorderCount} 张工单</p><article className="report-article" aria-label="故障处理报告正文">{articleChapters.map((chapter, index) => <section className="report-chapter" key={index}>{chapter.title && <h3>{chapter.title}</h3>}{chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</section>)}</article></>}</section>
        </>
      ) : selectedReport ? <section className="panel module-panel" role="status">{reportDetailError ? `报告正文读取失败：${reportDetailError}` : '正在读取选中报告正文…'}</section>
        : !loadingReports && <WorkspaceEmpty eyebrow="报告队列" title="暂无可查看的报告" text="工单检查通过并确认整线恢复运行后，报告会自动显示，无需选择来源或手动生成。" />}
    </section>
  );
}


function IncidentTimeline({ record, compact = false }) {
  const times = recordTimes(record);
  const labels = {event:'报警发生',diagnosis:'诊断完成',plan:'方案生成',order:'工单创建',updated:'工单更新'};
  const identity = incidentIdentity(record);
  if (compact) return <section className="maintenance-plan-panel workorder-timeline" aria-label="故障与处理时间">
    <div className="workorder-section-heading"><h2>处理时间</h2><span>北京时间</span></div>
    <dl className="workorder-time-grid">{Object.entries(labels).filter(([key]) => key !== 'order' && key !== 'updated' || record.workorder_id).map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{formatRecordTime(times[key])}</dd></div>)}</dl>
  </section>;
  return <section className="maintenance-plan-panel" aria-label="故障与处理时间">
    <h2>故障与处理时间（北京时间）</h2>
    <p>{record.device_name || record.device_id}{record.device_model ? ` · 型号 ${record.device_model}` : ''} · 报警 {identity.alarm_code || '待确认'}{identity.event_id ? ` · ${identity.event_id}` : ''}</p>
    {Object.entries(labels).filter(([key]) => key !== 'order' && key !== 'updated' || record.workorder_id).map(([key,label]) => <p key={key}>{label}：{formatRecordTime(times[key])}</p>)}
  </section>;
}

function MaintenancePlanWorkspace({ snapshot, sample, actor, active = true }) {
  const initialPlans=peekWorkspaceRead('/api/maintenance/plans');
  const [planItems, setPlanItems] = useState(()=>initialPlans?.items||[]);
  const [history, setHistory] = useState(()=>initialPlans?.history||{ status: "loading" });
  const actorKey = JSON.stringify([actor?.user_id || "", actor?.role || ""]);
  const [orderState, setOrderState] = useState({ actorKey, items: [], error: "", status: "loading" });
  // 私有工单与读取它的身份绑定，身份变化的首帧也不能带出旧关联。
  const orders = orderState.actorKey === actorKey ? orderState.items : [];
  const orderError = orderState.actorKey === actorKey ? orderState.error : "";
  const ordersReady = orderState.actorKey === actorKey && orderState.status === "ready";
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletedPlanIds, setDeletedPlanIds] = useState(()=>initialPlans?.deleted_plan_ids||[]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletionsLoaded, setDeletionsLoaded] = useState(Boolean(initialPlans));
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');
  const retryCommands = useRef({});
  const refreshRef = useRef(null);
  const workspaceRevision = useRef(0);
  const currentAlarm = String(sample?.alarm_code || "").trim();
  const currentDevice = String(sample?.device_id || snapshot?.device_id || "").trim();
  // 删除集合未知时不能信任旧监控/工单快照，避免页面切换时已删除方案复活。
  const records = deletionsLoaded ? buildMaintenanceWorkspaceRecords({ snapshot, items: planItems, orders, deletedPlanIds }) : [];
  const incident = currentIncident(snapshot, sample, records);
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
  const currentNoRepair = buildDiagnosisView(snapshot, sample).noRepairRequired;
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
    function refreshPlans(manual = false, poll = false) {
      if (plansPending) return plansPending;
      if (manual) setLoading(true);
      const revision = workspaceRevision.current;
      plansPending = loadMaintenancePlans(readWorkspace, { signal: controller.signal,freshFor:5000,force:manual || poll }).then(result => {
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
      ordersPending = loadMaintenanceOrders(readWorkspace, actor, { signal: controller.signal,freshFor:1000 }).then(items => {
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
    // The response arrives after the interval's start; a matching cache TTL would
    // otherwise reuse it at the next tick and hide a new assignment for another cycle.
    const timer = window.setInterval(() => {
      refreshPlans(false, true);
      refreshOrders();
    }, 5000);
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
      setRetryMessage(orderId ? `系统已处理派工，工单：${orderId}；具体状态以工单列表为准。` : '本次尚未派发工单，请联系维修人员确认方案和设备负责人。');
      delete retryCommands.current[planId];
      await refreshRef.current?.();
    } catch (err) {
      if (err.detail?.execution_started === false) {
        delete retryCommands.current[planId];
        setRetryMessage('本次派工尚未开始，请确认方案与设备负责人后重试。');
      } else {
        setRetryMessage('派工结果尚未确认，请稍后核对工单状态再重试。');
      }
    } finally {
      setRetrying(false);
    }
  }

  async function removePlans(ids) {
    if (!actor?.user_id || deleting || !ids.length) return;
    if (ids.length > 100) { setDeleteError("每批最多删除 100 条方案，请减少选择后重试。"); return; }
    if (!window.confirm(`确定删除这 ${ids.length} 条维修方案的已保存内容吗？`)) return;
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
      <ModuleHero eyebrow="Maintenance Agent" title="维修方案" text="已生成的方案自动更新；查看维修依据与派发条件，工单负责执行反馈。" action={<>{error&&<button className="button" type="button" disabled={loading} onClick={() => refreshRef.current?.(true)}>{loading ? "重试中…" : "重试读取方案"}</button>}<button className="button primary" type="button" onClick={() => openWorkorder(assignedOrders[0]?.workorder_id || "")}>进入工单执行</button></>} />
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
        <p className="maintenance-plan-muted">{actor?.user_id ? "删除会清除已保存的维修方案内容。" : "登录后可删除已保存的维修方案。"}</p>
        {records.length ? <div className="workorder-queue-list">{records.map(record => {
          const hasOrder = orders.some(order => linkedPlanOrder(record,order));
          const dispatch = maintenanceDispatchView(record, { hasOrder });
          return <div key={record.recordId} className={`maintenance-plan-list-row ${selectedRecord?.recordId === record.recordId ? "is-selected" : ""}`}>
            <label className="maintenance-plan-select"><input type="checkbox" aria-label={`选择方案 ${record.plan_id || record.recordId}`} disabled={!actor?.user_id || deleting || !record.plan_id} checked={checkedIds.includes(record.plan_id)} onChange={event => setCheckedIds(previous => event.target.checked ? [...new Set([...previous, record.plan_id])] : previous.filter(id => id !== record.plan_id))} /></label>
            <button type="button" className="workorder-queue-item" onClick={() => setSelectedId(record.recordId)}><span>
              <strong>{getDeviceDisplayName(record.device_id, { snapshot, device_name:record.device_name })} · {cleanDisplayText(record.diagnosis?.fault || record.diagnosis?.summary) || `报警 ${record.alarm_code || "待确认"}`}</strong>
              <small>{maintenanceWorkType(record).label} · {record.plan_id || "未编号方案"} · {record.device_id}{record.created_at ? ` · 方案生成 ${formatRecordTime(record.created_at)}` : record.diagnosis_created_at ? ` · 诊断完成 ${formatRecordTime(record.diagnosis_created_at)}` : ""}</small>
              {dispatch.displayReason && <small className="maintenance-plan-dispatch-reason">{dispatch.displayReason}</small>}
            </span>{dispatch.label !== '暂不能自动派发' && <em>{dispatch.label}</em>}</button>
            <button className="button danger" type="button" disabled={!actor?.user_id || deleting || !record.plan_id} onClick={() => removePlans([record.plan_id])}>删除此方案</button>
          </div>;
        })}</div> : <WorkspaceEmpty eyebrow="维修方案" title={history?.status === "loading" ? "正在读取已有维修方案" : history?.status === "failed" ? "历史方案暂未读出" : "暂无已生成的维修方案"} text={history?.status === "loading" ? "后台只读加载较大的历史记录，请稍候；这里不会将尚未读出的方案判断为不存在。" : "诊断生成方案后会自动显示；未满足派发条件的方案也可查看。"} />}
      </section>
      {currentAlarm && !currentRecord && <div className="workspace-notice" role="status">{currentNoRepair ? `当前报警 ${currentAlarm}：诊断判定无需维修，不生成维修方案和工单；请按智能诊断中的建议处理。` : generating ? `当前报警 ${currentAlarm}：诊断已完成，维修方案正在生成或校验；生成后自动显示，无需刷新。` : history?.status === "ready" && !error ? `当前设备 ${currentDevice} 的报警 ${currentAlarm} 尚无本次故障对应的维修方案；列表中保留的是已有方案。` : `正在核对当前设备 ${currentDevice} 的报警 ${currentAlarm} 对应方案；历史记录尚未完整读出，不能判定方案不存在。`}</div>}
      {selectedRecord && <><div className="workspace-notice" role="status">{hasCurrentDiagnosis ? "当前设备方案" : "历史 / 其他设备方案"} · {selectedRecord.device_id} · 报警 {selectedRecord.alarm_code || "待确认"}{selectedRecord.event_id ? ` · ${selectedRecord.event_id}` : ""}{linkedOrders.length ? ` · 已关联工单 ${linkedOrders.map(order => order.workorder_id).join("、")}` : actor?.user_id ? " · 当前账号未读取到关联工单，派发情况以授权工单列表为准" : " · 工单关联情况需登录后在工单系统查看"}</div><IncidentTimeline record={selectedRecord} /><MaintenanceDispatchStatus record={selectedRecord} hasOrder={linkedOrders.length > 0} /><MaintenancePlanPanel plan={plan} record={selectedRecord} hasCurrentDiagnosis={hasCurrentDiagnosis} /></>}
    </section>
  );
}

// Keep an unconfirmed command across workspace navigation, scoped to its actor and order.
const workorderPlanCommands = new Map();

function WorkorderView({ snapshot, sample, onClosed, actor, active = true }) {
  const initialScope=JSON.stringify([actor?.user_id||'',actor?.role||'']);
  const initialOrders=peekWorkspaceRead('/api/workorders?summary=true',{scope:initialScope});
  const [orders, setOrders] = useState(()=>(initialOrders?.items||[]).map(normalizeWorkorderResponse).filter(item=>!item.deleted_at));
  const requestedOrder=typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('workorder_id')||'';
  const [selectedId, setSelectedId] = useState(()=>requestedOrder||preferredWorkorderId(orders,sample,snapshot));
  const explicitSelection = useRef(Boolean(requestedOrder));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState(initialOrders?'ready':'loading');
  const reloadRef = useRef(null);
  const orderRevisionRef = useRef(0);
  const mountedRef = useRef(false);
  const lineObservation=useRef({key:'',epoch:0});
  const [lineEpoch,setLineEpoch]=useState(null);
  const [controlReadAttempt,setControlReadAttempt]=useState(0);
  const [controlReadError,setControlReadError]=useState('');
  const [taskDetails,setTaskDetails]=useState(()=>{
    const queue=orders.find(item=>item.workorder_id===selectedId);
    if(!queue)return {};
    const version=workorderDetailVersion(queue);
    const cached=peekWorkspaceRead(`/api/workorders/${encodeURIComponent(queue.workorder_id)}`,{scope:initialScope,revision:version});
    const value=cached&&normalizeWorkorderResponse(cached);
    return value?.workorder_id===queue.workorder_id&&value.device_id===queue.device_id
      &&value._revision===queue._revision&&value.updated_at===queue.updated_at
      ? {[queue.workorder_id]:{version,value,controlEpoch:-1}}:{};
  });
  const [taskDetailError,setTaskDetailError]=useState('');
  const [taskReadAttempt,setTaskReadAttempt]=useState(0);
  const [revalidationResults, setRevalidationResults] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const actorKey = JSON.stringify([actor?.user_id || '', actor?.role || '']);
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
  const incident = currentIncident(snapshot, sample, orders);
  const incidentKey = JSON.stringify(incident);
  const currentPlanRecord = buildMaintenanceWorkspaceRecords({ snapshot }).find(record => matchesIncident(record,incident));
  const hasVisibleIncidentOrder = orders.some(order => matchesIncident({...order,alarm_code:getWorkorderAlarmCode(order)},incident));
  const currentNoRepair = buildDiagnosisView(snapshot, sample).noRepairRequired;
  const selectedQueueOrder = orders.find((order) => order.workorder_id === selectedId)
    || (!hasCurrentIncident ? orders[0] : undefined);
  const taskVersion=workorderDetailVersion(selectedQueueOrder);
  const cachedTask=taskDetails[selectedQueueOrder?.workorder_id];
  const detailOrder=selectedQueueOrder? selectedQueueOrder._summary_record
    ? cachedTask?.version===taskVersion?{...cachedTask.value,
        machine_control:selectedQueueOrder.machine_control||cachedTask.value.machine_control}:null : selectedQueueOrder : null;
  const controlNeedsRefresh=Boolean(selectedQueueOrder?._summary_record&&detailOrder&&lineEpoch!==null
    && (['completed','closed'].includes(detailOrder.status)||detailOrder.machine_control)
    && cachedTask?.controlEpoch!==lineEpoch);
  const selectedOrder=controlNeedsRefresh?{...detailOrder,machine_control:{state:'checking',
    reason:controlReadError||'正在核对最新复机结果；维修记录保持不变。'}}:detailOrder;
  useEffect(()=>{
    if(!active||!selectedQueueOrder?._summary_record||selectedOrder)return;
    const controller=new AbortController(), id=selectedQueueOrder.workorder_id;
    const controlEpoch=lineObservation.current.epoch;
    let retryTimer;
    setTaskDetailError('');
    readWorkspace(`/api/workorders/${encodeURIComponent(id)}`,{signal:controller.signal,revision:taskVersion,freshFor:5000,scope:actorKey}).then(body=>{
      if(controller.signal.aborted)return;
      const value=normalizeWorkorderResponse(body);
      if(value.workorder_id!==id||value.device_id!==selectedQueueOrder.device_id)
        throw new Error('任务详情身份或设备归属不一致，请重新加载');
      setTaskDetails(current=>{
        const next={...current};delete next[id];next[id]={version:taskVersion,value,controlEpoch};
        for(const old of Object.keys(next).slice(0,-3))delete next[old];
        return next;
      });
    }).catch(error=>{
      if(controller.signal.aborted)return;
      if(error.name==='AbortError'){
        retryTimer=window.setTimeout(()=>setTaskReadAttempt(value=>value+1),3000);return;
      }
      if([401,403].includes(error.status)){setOrders([]);setTaskDetails({});setLoadState('failed');}
      else retryTimer=window.setTimeout(()=>setTaskReadAttempt(value=>value+1),3000);
      setTaskDetailError(error.message);
    });
    return()=>{controller.abort();window.clearTimeout(retryTimer);};
  },[active,selectedQueueOrder?.workorder_id,taskVersion,taskReadAttempt,actorKey]);

  // 控制投影会变化，但不能使已读取的维修正文反复消失或中断在途请求。
  useEffect(()=>{
    if(!active||!controlNeedsRefresh)return;
    const controller=new AbortController(),id=selectedQueueOrder.workorder_id;
    const controlEpoch=lineObservation.current.epoch,revision=orderRevisionRef.current;
    let retryTimer;
    setControlReadError('');
    readWorkspace(`/api/workorders/${encodeURIComponent(id)}`,{
      signal:controller.signal,scope:actorKey,revision:taskVersion,force:true,
    }).then(body=>{
      if(controller.signal.aborted)return;
      if(revision!==orderRevisionRef.current){
        retryTimer=window.setTimeout(()=>setControlReadAttempt(value=>value+1),3000);return;
      }
      const value=normalizeWorkorderResponse(body);
      if(value.workorder_id!==id||value.device_id!==selectedQueueOrder.device_id)
        throw new Error('复机结果身份或设备归属不一致，请重新核对');
      // 新的产线变化到达时忽略旧投影，结束本次读取后再核对最新状态。
      if(controlEpoch===lineObservation.current.epoch)setTaskDetails(current=>current[id]?.version===taskVersion
        ? {...current,[id]:{version:taskVersion,value,controlEpoch}}:current);
      setControlReadAttempt(value=>value+1);
    }).catch(error=>{
      if(controller.signal.aborted)return;
      if(error.name==='AbortError'){
        retryTimer=window.setTimeout(()=>setControlReadAttempt(value=>value+1),3000);return;
      }
      if([401,403].includes(error.status)){setOrders([]);setTaskDetails({});setLoadState('failed');}
      else retryTimer=window.setTimeout(()=>setControlReadAttempt(value=>value+1),3000);
      setControlReadError(`复机结果暂未更新：${error.message}`);
    });
    return()=>{controller.abort();window.clearTimeout(retryTimer);};
  },[active,selectedQueueOrder?.workorder_id,taskVersion,actorKey,controlNeedsRefresh,controlReadAttempt]);

  useEffect(() => {
    if (!active) return;
    // 报警触发的创建由运行时负责；查看队列不能创建或重新创建操作员明确删除的工单。
    let cancelled = false;
    let pending = null;
    let linePending = null;
    const controller = new AbortController();
    setLoadState(previous => previous === 'ready' ? previous : 'loading');
    function loadOrders() {
      if (pending) return pending;
      const revision = orderRevisionRef.current;
      let line = null;
      if (!linePending) {
        linePending = request('/api/team/line', {signal:controller.signal})
          .catch(() => null).finally(() => {linePending = null;});
      }
      linePending.then(value => {
          line = value;
          if (cancelled || revision !== orderRevisionRef.current) return;
          if(typeof line?.state==='string'){
            const key=JSON.stringify([line.state,line.generation]);
            if(lineObservation.current.key!==key){
              const epoch=lineObservation.current.epoch+(lineObservation.current.key?1:0);
              lineObservation.current={key,epoch};setLineEpoch(epoch);
            }
          }
          if(line?.state!=='running')return;
          setOrders(previous => previous.map(item => !item.machine_control
            && item.repair_verification?.phase === 'poststart' && item.repair_verification?.passed === true
            ? {...item, machine_control:{state:'running'}} : item));
      });
      pending = readWorkspace('/api/workorders?summary=true', { signal: controller.signal,freshFor:1000,scope:actorKey,revision:incidentKey }).then(body => {
        if (cancelled || revision !== orderRevisionRef.current) return;
        if (!Array.isArray(body.items)) throw new Error("工单列表返回异常，请重试");
        rememberDeletedMaintenancePlans(body.deleted_plan_ids || []);
        const items = body.items.map(normalizeWorkorderResponse).filter(item => !item.deleted_at);
        setOrders(previous => items.map(item => item._summary_record?item:({...item, machine_control: item.machine_control
          || (line?.state === 'running' && item.repair_verification?.phase === 'poststart' && item.repair_verification?.passed === true
            ? {state:'running'} : previous.find(old => old.workorder_id === item.workorder_id)?.machine_control)})));
        setSelectedId(previous => explicitSelection.current && items.some(item => item.workorder_id === previous) ? previous : preferredWorkorderId(items, sample, snapshot));
        setError("");
        setLoadState("ready");
      }).catch(err => {
        if (cancelled || revision !== orderRevisionRef.current) return;
        if ([401, 403].includes(err.status)) {
          setOrders([]);
          setTaskDetails({});
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
    const timer = window.setInterval(loadOrders, 1000);
    return () => {
      cancelled = true;
      controller.abort();
      reloadRef.current = null;
      window.clearInterval(timer);
    };
  }, [actor?.user_id, actor?.role, currentDevice, currentIncidentCode, incidentKey, active]);

  useEffect(() => subscribeMaintenanceChanges(change => {
    if (change.actorKey !== actorKey) return;
    orderRevisionRef.current++;
    const updated = change.workorder;
    if (updated && !updated.deleted_at && (actor?.role === 'supervisor' || updated.assignee === actor?.user_id)) {
      setOrders(items => [updated, ...items.filter(item => item.workorder_id !== updated.workorder_id)]);
      setSelectedId(previous => explicitSelection.current ? previous : updated.workorder_id);
      setLoadState('ready');
    }
    if (change.deleted_workorder_ids?.length) {
      setOrders(items => items.filter(item => !change.deleted_workorder_ids.includes(item.workorder_id)));
    }
  }), [actorKey]);

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
          message: '方案暂未更新，原工单与原方案保留。请联系维修人员确认；完成实际维修后可填写处理说明并申请复机。' });
      }
    } catch (err) {
      const notStarted = err.detail?.execution_started === false;
      publish({ requestId: notStarted ? null : requestId, pending: false,
        phase: notStarted ? 'not_started' : 'unknown', revision, findings: [],
        message: notStarted ? '方案更新尚未开始，请确认现场情况后重试。'
          : '方案更新结果尚未确认，请稍后核对结果。' });
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
    if (!order?.workorder_id || !window.confirm(`确定删除工单 ${order.workorder_id} 及对应维修方案的已保存内容吗？删除后无法恢复。`)) return;
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

  if (!active) return null;
  return (
    <section className="workspace-view active workorder-page" aria-label="工单系统">
      {!currentFaultActive && <div className="module-hero"><span className="eyebrow">维修执行</span><h1>工单系统</h1><p>跟进维修任务、执行反馈与验收。</p></div>}
      <section className="workorder-queue" aria-label="工单队列">
        <div className="workorder-queue-heading">
          <div><span className="eyebrow">工单队列</span><h2>维修任务</h2></div>
          <div className="maintenance-delete-actions"><span>{orders.length ? `${orders.length} 条记录` : loadState === "ready" ? "0 条记录" : '自动更新'}</span>{loadState==='failed'&&<button className="button" type="button" disabled={busy} onClick={() => reloadRef.current?.()}>重试加载</button>}</div>
        </div>
        {orders.length ? (
          <div className="workorder-queue-list">
            {orders.map((order) => <button key={order.workorder_id} type="button" className={`workorder-queue-item ${selectedQueueOrder?.workorder_id === order.workorder_id ? "is-selected" : ""}`} onClick={() => { explicitSelection.current = true; setSelectedId(order.workorder_id); }}>
              <span className="workorder-queue-copy"><span className="workorder-queue-title"><strong>{getWorkorderDisplayTitle(order, order.repair_target, { snapshot })}</strong><small>{maintenanceWorkType(order).label}</small></span><span className="workorder-queue-identity"><span>工单编号 <b>{order.workorder_id}</b></span><span>设备 <b>{order.device_id}</b></span><span>负责人 <b>{order.assignee_name || order.assignee || '未分配'}</b></span></span></span>
              <em className={order.status === "closed" || order.status === "completed" ? "is-done" : ""}>{inspectionWorkorderView(order).statusLabel || labelFor(workorderStatusLabels, order.status)}</em>
            </button>)}
          </div>
        ) : <div className="workorder-queue-empty" role="status">{loadState === "loading" ? "正在读取已派发工单及任务内容，请稍候…" : loadState === "failed" ? "工单暂未加载，系统会自动重试。" : "暂无可见工单；已有有效诊断和方案后，系统自动派发给负责该设备且已登录的维修人员，任务生成后自动显示。"}</div>}
        {!selectedOrder && error && <div className="inline-error" role="alert">工单读取失败：{error}</div>}
      </section>
      {loadState === "ready" && hasCurrentIncident && !hasVisibleIncidentOrder && <div className="workspace-notice" role="status">{currentNoRepair ? `当前报警 ${currentIncidentCode}：诊断判定无需维修，不生成维修方案和工单；请按智能诊断中的建议处理。` : <>当前账号尚无报警 {currentIncidentCode} 对应的可见工单；系统正在核对本次方案、当前报警和设备负责人，派发后自动显示。{currentPlanRecord ? '工程资料待核实项将保留在任务内。' : '需先有本次故障对应的已保存方案；已删除的方案不会自动恢复。'}</>}</div>}
      {loadState === 'ready' && !selectedOrder && !hasVisibleIncidentOrder && currentPlanRecord && !currentNoRepair &&
        <MaintenanceDispatchStatus record={currentPlanRecord} />}
      {selectedQueueOrder&&!selectedOrder&&<section className="maintenance-plan-panel" role="status">{taskDetailError?`任务详情暂不可用：${taskDetailError}`:'正在加载任务详情…'}</section>}
      {(selectedOrder || !selectedQueueOrder&&loadState === "ready") && <WorkorderDetail
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
  const executionPlan = buildMaintenancePlanView({ order, diagnosis: matchedDiagnosis });
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
          <dl className="workorder-identity">
            <div><dt>工单编号</dt><dd>{order.workorder_id}</dd></div>
            <div><dt>设备编号</dt><dd>{order.device_id}</dd></div>
            <div><dt>负责人</dt><dd>{order.assignee_name || order.assignee || "未分配"}</dd></div>
            <div><dt>故障事件</dt><dd>{order.event_id || '未记录'}</dd></div>
            <div><dt>报警代码</dt><dd>{getWorkorderAlarmCode(order) || incidentIdentity(order).alarm_code || '待确认'}</dd></div>
            {order.device_name && <div><dt>设备名称</dt><dd>{order.device_name}</dd></div>}
            {order.device_model && <div><dt>设备型号</dt><dd>{order.device_model}</dd></div>}
          </dl>
        </div>
        <div className="workorder-titlebar-actions"><span className={`workorder-status-badge ${order.status === "closed" || order.status === "completed" ? "done" : "pending"}`}>{statusLabel}</span><button className="button danger-button" type="button" disabled={busy || readOnly} onClick={() => onDelete?.(order)}>删除工单</button></div>
      </header>

      {(review.required || revalidation?.message) && <section className="maintenance-plan-panel" aria-label="方案执行复核">
        <h2>{review.required ? review.label : '方案校验结果'}</h2>
        {review.required && <p>请维修人员确认方案与现场情况。完成实际维修后，在处理说明中填写结果并申请复机。</p>}
        {!readOnly && canRevalidate && (review.required || revalidation?.requestId) && <><p>基于原工单的故障依据重新生成并校验方案；保留原工单和负责人，不重新派单，不控制设备。</p><button className="button" type="button" disabled={busy || revalidation?.pending} onClick={onRevalidate}>{revalidation?.phase === 'unknown' ? '核对方案更新结果' : '重新生成并校验方案'}</button></>}
        {revalidation?.message && <p role="status">{revalidation.message}</p>}
      </section>}

      <WorkorderSheet sheet={sheet} executionPlan={executionPlan} planId={order.plan_id || executionPlan.planId} workType={workType} inspectionResult={inspectionResult} review={review} confirmationRevision={revalidation?.revision || 0} busy={busy} error={error} onUpdate={onUpdate} readOnly={readOnly} localization={<div className="workorder-bigscreen-grid cad-only"><RepairCadPanel key={`${order.workorder_id}:${order.device_id}`} order={order} target={target} /></div>} />
      <IncidentTimeline record={order} compact />
    </section>
  );
}

function MaintenanceDispatchStatus({ record, hasOrder = false }) {
  const status = maintenanceDispatchView(record, { hasOrder });
  return <section className="maintenance-plan-panel" aria-label="自动派发条件">
    <div className="maintenance-plan-heading"><h2>{status.label}</h2><span>工单就绪：{status.ready}</span></div>
    {status.reviewRequired && <div role="status"><strong>{status.reviewLabel}</strong><p>请维修人员确认方案与现场情况，实际处理结果在关联工单中提交。</p></div>}
    {status.assigneeName && <p>维修负责人：{status.assigneeName} · 对应设备：{status.assignmentDeviceId || "未提供"}</p>}
    {status.displayReason && <p>{status.displayReason}</p>}
    {!hasOrder && !status.assigneeName && <p>工单派发后会自动显示在工单系统；尚未派发时，请确认设备已有负责的维修人员并已登录。</p>}
  </section>;
}

function MaintenancePlanPanel({ plan, record, hasCurrentDiagnosis }) {
  const diagnosis = plan.diagnosis || {};
  const drawings = maintenanceReferenceDrawings(record);
  const workType = maintenanceWorkType(record);
  const sourceLabel = plan.source === "maintenance-plan"
    ? "独立维修方案"
    : plan.source === "legacy-workorder-snapshot"
      ? "历史工单方案快照"
      : "未关联维修方案";
  return (
    <section className="maintenance-plan-panel" aria-label="维修方案">
      <div className="maintenance-plan-heading">
        <div><span className="eyebrow">{workType.label}</span><h2>{workType.inspection ? "检查方案" : "维修方案"}</h2><p>根据设备故障生成处理方案，实际处理结果在工单中提交。</p>{workType.inspection && <p>{workType.description}{workType.reason && ` ${workType.reason}`}</p>}</div>
        <div className="maintenance-plan-meta"><span>{sourceLabel}</span>{plan.planId && <strong>{plan.planId}</strong>}</div>
      </div>
      {plan.source === "unavailable" ? (
        <div className="maintenance-plan-empty">当前工单没有可读取的维修方案。故障定位仍保留在下方工单详情中，不会用工单字段伪造维修方案。</div>
      ) : (
        <>
          <div className="maintenance-plan-diagnosis">
            <div><span className="section-kicker">故障判断</span><ResultText value={diagnosis.fault || diagnosis.summary || "待确认"} className="result-plan-fault" /><h4 className="result-plan-label">原因分析</h4><ResultText value={diagnosis.cause || diagnosis.diagnosis || "暂无原因分析"} /></div>
            <div><span className="section-kicker">处置建议</span><ResultText value={diagnosis.recommendation || "按方案步骤执行并复测"} /><div className="result-plan-meta"><span className="result-risk">{displayRiskLevel(plan.riskLevel || diagnosis.severity)}</span>{plan.estimatedTime && <span>预计用时：{plan.estimatedTime}</span>}<span>{hasCurrentDiagnosis ? "当前设备方案" : "已保存方案"}</span></div></div>
          </div>
          {drawings.length > 0 && <section className="maintenance-plan-section" aria-label="设备图纸参考">
            <div className="maintenance-plan-section-head"><h3>设备图纸参考</h3><span>{drawings.length} 项</span></div>
            <ul>{drawings.map(drawing => <li key={drawing.url}><a href={drawing.url} target="_blank" rel="noreferrer">查看 {drawing.name}</a> · {drawing.label}</li>)}</ul>
            <p className="maintenance-plan-muted">可查看设备模型和图纸；目标部件的 BOM、尺寸、材料等工程资料仍以校验结果为准。</p>
          </section>}
          <div className="maintenance-plan-grid">
            <PlanList title="安全要求" items={plan.safety} />
            <PlanList title={workType.inspection ? "检查前确认" : "维修前检查"} items={plan.preChecks} />
            <PlanList title={workType.inspection ? "检查步骤" : "维修步骤"} items={plan.steps} ordered wide />
            <PlanList title="工具清单" items={plan.tools} />
            <PlanList title="备件清单" items={plan.parts} />
            <PlanList title={workType.inspection ? "检查后核验" : "维修后验收"} items={plan.postChecks} wide />
          </div>
        </>
      )}
    </section>
  );
}

function PlanList({ title, items = [], ordered = false, wide = false }) {
  const values = resultListItems(items);
  return <section className={`maintenance-plan-section${wide?' is-wide':''}`} aria-label={title}><div className="maintenance-plan-section-head"><h3>{title}</h3><span>{values.length} 项</span></div>{values.length ? (ordered ? <ol>{values.map((item, index) => <li key={index}><ResultText value={item} /></li>)}</ol> : <ul>{values.map((item, index) => <li key={index}><ResultText value={item} /></li>)}</ul>) : <p className="maintenance-plan-muted">暂无记录</p>}</section>;
}

function WorkorderSheet({ sheet, executionPlan = {}, planId = '', localization, workType = maintenanceWorkType(), inspectionResult = inspectionWorkorderView(), review = executionReviewView(), confirmationRevision = 0, busy, error, onUpdate, readOnly = false }) {
  const [repairFeedback, setRepairFeedback] = useState(sheet.feedback || "");
  const [feedbackSavedId, setFeedbackSavedId] = useState("");
  useEffect(() => {
    setFeedbackSavedId("");
  }, [sheet.workorderId, confirmationRevision]);
  const isDone = ["completed", "closed"].includes(sheet.status);
  const followup = sheet.dispatchMode === 'fault_followup';
  const taskSteps = followup ? sheet.taskSteps : review.required ? [] : sheet.taskSteps.length ? sheet.taskSteps : executionPlan.steps || [];
  const showTasks = followup || taskSteps.length > 0;
  const completionVerified = isDone && (sheet.machineControl?.state === 'running' && sheet.machineControl?.restart_method === 'manual_confirmation'
    || sheet.verificationPhase === 'poststart' && (!review.required || review.humanConfirmed));
  async function saveRecord() {
    setFeedbackSavedId("");
    if (await onUpdate("feedback", { repair_feedback: { feedback: repairFeedback.trim() } })) setFeedbackSavedId(sheet.workorderId);
  }
  return (
    <section className="maintenance-sheet" aria-label={workType.inspection ? "自动派发检查工单" : "自动派发维修工单"}>
      <div className="sheet-heading">
        <div>
          <span className="eyebrow">执行信息</span>
          <h2>{workType.inspection ? "检查工单" : "维修工单"}</h2>
          <p className="sheet-subtitle">{workType.inspection ? `${workType.description} 检查通过后自动核验整线复机；仍有异常保留待处理。` : "按本工单处理步骤执行，记录现场处理过程与复测结果。"}</p>
        </div>
        <span className={isDone ? "sheet-status done" : "sheet-status"}>{inspectionResult.statusLabel || labelFor(workorderStatusLabels, sheet.status)}</span>
      </div>

      <div className="basic-grid">
        <div><span>{workType.inspection ? "检查负责人" : "维修负责人"}</span><strong>{sheet.assignee}</strong></div>
        <div><span>派发方式</span><strong>{sheet.autoDispatched ? "系统自动派发" : "系统工单"}</strong></div>
      </div>

      <div className="sheet-execution-grid">
        <section className="sheet-section fault-summary-card">
          <div className="workorder-section-heading"><span className="workorder-section-index" aria-hidden="true">01</span><div><span className="section-kicker">故障信息</span><h3>故障描述与定位</h3></div></div>
          <dl className="fault-meta-list">
            <div><dt>故障部件</dt><dd>{sheet.partName}</dd></div>
            <div><dt>料号</dt><dd>{sheet.partNo}</dd></div>
            <div><dt>所属系统</dt><dd>{sheet.system}</dd></div>
            <div><dt>位置</dt><dd>{sheet.location}</dd></div>
          </dl>
          <div className="workorder-fault-layout">
            <div className="workorder-fault-text">
              <ResultText value={sheet.faultSymptom} className="fault-symptom" />
              {sheet.faultAnalysis && sheet.faultAnalysis !== normalizeResultText(sheet.faultSymptom) && <section className="workorder-fault-analysis" aria-label="工单故障分析"><h4>故障分析</h4><ResultText value={sheet.faultAnalysis} /></section>}
            </div>
            {localization}
          </div>
        </section>
        {showTasks && <section className="sheet-section workorder-task-card" aria-label="工单任务范围">
          <div className="workorder-section-heading"><span className="workorder-section-index" aria-hidden="true">02</span><div><span className="section-kicker">执行要求</span><h3>处理步骤与执行要求</h3></div></div>
          {planId && <p className="workorder-plan-source">关联维修方案：{planId}</p>}
          {followup && <ResultText value="原方案已保留；先完成现场核查，涉及拆修或换件前需补齐相应工程与备件依据。" />}
          <PlanList title="本工单处理步骤" items={taskSteps} ordered wide />
          {!followup && !review.required && <div className="workorder-task-support">
            {executionPlan.safety?.length > 0 && <PlanList title="安全要求" items={executionPlan.safety} />}
            {executionPlan.preChecks?.length > 0 && <PlanList title="执行前检查" items={executionPlan.preChecks} />}
            {executionPlan.postChecks?.length > 0 && <PlanList title="完成后验收" items={executionPlan.postChecks} />}
          </div>}
        </section>}
        <section className="sheet-section feedback-card">
          <div className="workorder-section-heading"><span className="workorder-section-index" aria-hidden="true">{showTasks?'03':'02'}</span><div><span className="section-kicker">执行反馈</span><h3>{workType.inspection ? "检查结果与核验" : "处理记录与结果"}</h3></div></div>
          {sheet.feedback && <section className="saved-feedback-preview" aria-label="已保存处理记录"><h4>已保存处理记录</h4><ResultText value={sheet.feedback} /></section>}
          <label htmlFor="repair-feedback">处理说明</label>
          <textarea id="repair-feedback" value={repairFeedback} onChange={(event) => setRepairFeedback(event.target.value)} placeholder={workType.inspection ? "填写检查结果或未解决原因" : "填写实际完成的维修处理和结果"} disabled={busy || readOnly || sheet.status === 'closed'} />
          {error && <div className="inline-error">{error}</div>}
          {workType.inspection && (feedbackSavedId === sheet.workorderId || inspectionResult.completed) && <p role="status">{inspectionResult.completed ? "检查已完成。" : "检查结果已保存；仍有异常或核验条件未满足，保留待处理。"}</p>}
          {!workType.inspection && review.required && feedbackSavedId === sheet.workorderId && <p role="status">处理记录已保存。完成实际维修后可直接确认并申请复机。</p>}
          {workType.inspection && inspectionResult.findings.length > 0 && <PlanList title="检查未满足的条件" items={inspectionResult.findings} />}
          {sheet.machineControl && (
            <div className={`machine-control-result ${sheet.machineControl.state === 'running' ? "is-ok" : sheet.machineControl.state==='checking'?"is-pending":"is-error"}`} role="status">
              <span>{sheet.machineControl.state==='checking'?sheet.machineControl.reason:sheet.machineControl.state === 'running'
                ? sheet.machineControl.restart_method === 'manual_confirmation'
                  ? "维修已人工确认，整线设备已启动；如再次异常，系统会重新报警。"
                  : "整线设备启动后已逐台读回，运行复核通过。"
                : `${workType.inspection ? '检查已完成，整线复机未通过' : isDone ? '维修已完成，复机申请未通过' : '维修确认未通过'}：${sheet.machineControl.reason || sheet.machineControl.error || sheet.machineControl.state}`}</span>
              {Array.isArray(sheet.machineControl.workorder_ids) && sheet.machineControl.workorder_ids.length > 0 && (
                <p className="machine-control-blockers">需先处理的故障工单：{sheet.machineControl.workorder_ids.join('、')}</p>
              )}
              {Array.isArray(sheet.machineControl.fault_blockers) && sheet.machineControl.fault_blockers.length > 0 && (
                <section aria-label="复机阻挡记录">
                  <ul>{sheet.machineControl.fault_blockers.map(blocker => <li key={`${blocker.event_id}-${blocker.device_id}`}>
                    <strong>{blocker.device_id} · 报警 {blocker.alarm_code || '未记录'}</strong>
                    <p>{blocker.kind === 'missing_workorder' ? '这条停机记录没有关联工单，需确认旧故障处理结果并核验设备。' : '关联工单尚未确认完成。'}</p>
                    <small>故障事件：{blocker.event_id}</small>
                    {blocker.workorder_ids?.map(id => <p key={id}><a href={`/?view=workorder&workorder_id=${encodeURIComponent(id)}`}>查看工单 {id}</a></p>)}
                  </li>)}</ul>
                </section>
              )}
            </div>
          )}
          {!workType.inspection && <p>填写实际处理结果并人工确认后，直接启动整线设备；如仍有问题，系统会再次报警。</p>}
          <div className="sheet-actions">
            <button className="button" type="button" disabled={busy || readOnly || isDone || sheet.accepted} onClick={() => onUpdate("in_progress")}>{busy ? "处理中" : sheet.accepted ? '已确认接单' : "确认接单"}</button>
            {!workType.inspection && review.required && <button className="button" type="button" disabled={busy || readOnly || sheet.status === 'closed' || !repairFeedback.trim()} onClick={saveRecord}>提交处理记录</button>}
            {workType.inspection ? <button className="button primary" type="button" disabled={busy || readOnly || isDone || !repairFeedback.trim()} onClick={saveRecord}>提交检查结果</button> : <button
              className="button primary"
              type="button"
              disabled={busy || readOnly || sheet.status === 'closed' || completionVerified || !repairFeedback.trim()}
              onClick={() => onUpdate("completed", buildRepairCompletionPayload({ feedback: repairFeedback }))}
            >{completionVerified && sheet.machineControl?.restart_method === 'manual_confirmation' ? '维修已完成，设备已启动' : isDone ? '再次确认并申请复机' : '确认维修完成并申请复机'}</button>}
            {workType.inspection && inspectionResult.completed && sheet.machineControl && sheet.machineControl.state !== 'running' && <button className="button primary" type="button" disabled={busy || readOnly || !(sheet.feedback || repairFeedback).trim()} onClick={() => onUpdate('feedback', {repair_feedback:{feedback:sheet.feedback || repairFeedback.trim()}})}>再次核验并申请复机</button>}
            {!workType.inspection && sheet.status === 'completed' && sheet.verificationPhase === 'poststart' && <button className="button" disabled={busy || readOnly || (review.required && !review.humanConfirmed)} onClick={() => onUpdate('closed')}>{review.required ? '关闭工单' : '关闭工单并生成总结'}</button>}
          </div>
        </section>
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

function QualityWorkspace(props) {
  return <PartQualityWorkspace {...props} />;
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
        {section.lines?.length ? section.lines.map((line, index) => /^记录 \d+$/.test(line)
          ? <h4 className="report-record-heading" key={index}>{line}</h4>
          : <FormattedText key={index} value={line} />) : section.body && <FormattedText value={section.body} />}
      {section.items?.length > 0 && <StepList steps={section.items} />}
    </section>
  ))}</div>;
}

export { App };
