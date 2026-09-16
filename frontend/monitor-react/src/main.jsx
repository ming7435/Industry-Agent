import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./styles.css";
import machineImage from "./assets/trak-tc820-machine-transparent.png";

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
};

const workorderStatusLabels = {
  open: "待处理",
  in_progress: "处理中",
  completed: "已完成",
  closed: "已关闭",
};

const quickQuestions = [
  "主轴温度过高怎么检查？",
  "报警 ALM-1001 的处理步骤是什么？",
  "振动异常时应该优先排查哪些部件？",
];

const sampleWorkorderSteps = [
  "执行设备断电和挂牌上锁",
  "检查冷却液液位、流量和冷却泵",
  "空载运行并复测主轴温度",
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
};

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
      type: fallback.type || deviceTypeLabels[device.device_type || device.type] || device.device_type || device.type || "工业设备",
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

function App() {
  const [activeView, setActiveView] = useState("monitor");
  const [selectedMachineId, setSelectedMachineId] = useState(workshopMachines[0].id);
  const { snapshot, error, control, resetStats } = useMonitorSnapshot();
  const runner = snapshot?.runner || {};
  const machines = useMemo(() => buildWorkshopMachines(snapshot), [snapshot]);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const result = selectedMachine?.result || snapshot?.latest_result;
  const sample = result?.current_sample;
  const healthText = sample?.health_score === null || sample?.health_score === undefined
    ? "--"
    : `${Number(sample.health_score).toFixed(0)} / 100`;
  const connectionText = error || runner.last_error ? "接口异常" : "连接正常";

  useEffect(() => {
    if (machines.length && !machines.some((machine) => machine.id === selectedMachineId)) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  return (
    <div className="platform-shell">
      <Sidebar activeView={activeView} onChange={setActiveView} connectionText={connectionText} hasError={Boolean(error || runner.last_error)} />
      <main className="app-shell">
        <Topbar
          snapshot={snapshot}
          runner={runner}
          onControl={control}
          onReset={resetStats}
        />
        {activeView === "monitor" && (
          <MonitorCenter
            snapshot={snapshot}
            machines={machines}
            result={result}
            sample={sample}
            runner={runner}
            healthText={healthText}
            selectedMachineId={selectedMachineId}
            onSelectMachine={setSelectedMachineId}
          />
        )}
        {activeView === "diagnosis" && <DiagnosisWorkspace snapshot={snapshot} />}
        {activeView === "maintenance" && <MaintenanceWorkspace snapshot={snapshot} />}
        {activeView === "workorder" && <WorkorderView snapshot={snapshot} sample={sample} />}
        {activeView === "rag" && <RagWorkspace snapshot={snapshot} sample={sample} />}
        {activeView === "quality" && <QualityWorkspace snapshot={snapshot} sample={sample} />}
        {activeView === "report" && <ReportWorkspace snapshot={snapshot} />}
        {activeView === "trace" && <TraceWorkspace snapshot={snapshot} />}
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

function Topbar({ snapshot, runner, onControl, onReset }) {
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
      </div>
    </header>
  );
}

function PlatformOverview() {
  return (
    <section className="platform-overview" aria-label="平台总览">
      <OverviewCard primary label="当前主线" value="监控中心" text="设备快照、异常判定和智能诊断实时联动。" />
      <OverviewCard label="工单闭环" value="待接入" text="异常转派、维修跟踪、备件消耗。" />
      <OverviewCard label="知识中枢" value="待接入" text="手册、历史案例和SOP问答。" />
      <OverviewCard label="质检协同" value="待接入" text="缺陷记录、抽检任务、质量追溯。" />
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
  selectedMachineId,
  onSelectMachine,
}) {
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0] || workshopMachines[0];
  const isLiveMachine = Boolean(selectedMachine.live);

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
      <MachineDetailHeader machine={selectedMachine} isLiveMachine={isLiveMachine} sample={sample} result={result} healthText={healthText} />
      {isLiveMachine ? (
        <>
          <StatusStrip snapshot={snapshot} sample={sample} runner={runner} healthText={healthText} />
          <section className="main-grid">
            <MetricsPanel result={result} sample={sample} />
            <DecisionPanel snapshot={snapshot} result={result} />
          </section>
          <section className="lower-grid">
            <TriggerPanel snapshot={snapshot} />
            <DiagnosisPanel snapshot={snapshot} />
          </section>
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
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) || machines[0];
  const selectedStatus = machineStatus(selectedMachine, selectedMachine?.result || result);
  const connectedCount = machines.filter((machine) => machine.live).length;
  const faultCount = machines.filter((machine) => {
    const status = machineStatus(machine, machine.result);
    return status !== "normal" && status !== "idle";
  }).length;

  return (
    <section className="panel workshop-panel">
      <div className="factory-map" aria-label="车间设备分布图">
        <Machine3DScene status={selectedStatus} onSelect={() => selectedMachine && onSelectMachine(selectedMachine.id)} />
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
        </div>
        {machines.map((machine) => {
          const status = machineStatus(machine, machine.result);
          return (
            <button
              key={machine.id}
              type="button"
              className={`scene-device-badge ${status} ${machine.id === selectedMachineId ? "active" : ""}`}
              style={{ left: `${machine.x}%`, top: `${machine.y}%`, bottom: "auto" }}
              onClick={() => onSelectMachine(machine.id)}
              aria-label={`${machine.name} ${machineStatusLabel(status)}`}
            >
              <strong>{machine.name}</strong>
              <span>{machineStatusLabel(status)}</span>
            </button>
          );
        })}
        <div className="scene-control-hint">内部加工动画 · 拖动旋转 · 滚轮缩放</div>
      </div>
      <div className="map-summary">
        <div><span>接入设备</span><strong>{connectedCount} / {machines.length}</strong></div>
        <div><span>选中设备</span><strong>{selectedMachine?.name || "--"}</strong></div>
        <div><span>当前故障</span><strong>{faultCount}</strong></div>
        <div><span>毛坯入料</span><strong>棒料</strong></div>
        <div><span>成品出料</span><strong>轴套件</strong></div>
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

function Machine3DScene({ status, onSelect }) {
  const mountRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf3f6f4, 14, 32);

    const camera = new THREE.PerspectiveCamera(36, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(7.8, 4.6, 8.8);
    camera.lookAt(0, .75, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, .75, 0);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.minDistance = 6.2;
    controls.maxDistance = 15.5;
    controls.minPolarAngle = Math.PI * .16;
    controls.maxPolarAngle = Math.PI * .49;
    controls.enablePan = true;
    controls.panSpeed = .55;
    controls.rotateSpeed = .55;
    controls.zoomSpeed = .72;
    controls.update();

    const accent = statusColor(status);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe4ecea, roughness: .84, metalness: .02 });
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xc4d3d0, roughness: .78, metalness: .01 });
    const areaMat = new THREE.MeshStandardMaterial({ color: 0xe0f1ee, roughness: .82, metalness: .02, transparent: true, opacity: .58 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd7e1df, roughness: .86, metalness: .02, transparent: true, opacity: .72 });
    const safetyMat = new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: .58, metalness: .04 });
    const conveyorMat = new THREE.MeshStandardMaterial({ color: 0x405057, roughness: .6, metalness: .18 });
    const conveyorEdgeMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .42, metalness: .1, emissive: accent, emissiveIntensity: .12, transparent: true, opacity: .82 });
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x647177, roughness: .72, metalness: .08 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b3338, roughness: .75, metalness: .05 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x697178, roughness: .62, metalness: .18, transparent: true, opacity: .64 });
    const solidBodyMat = new THREE.MeshStandardMaterial({ color: 0x697178, roughness: .62, metalness: .18 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22272d, roughness: .7, metalness: .2, transparent: true, opacity: .86 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xb9bec2, roughness: .55, metalness: .12, transparent: true, opacity: .68 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fb4bc, roughness: .2, metalness: .04, transparent: true, opacity: .24, side: THREE.DoubleSide });
    const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .42, metalness: .12, emissive: accent, emissiveIntensity: .08 });
    const translucentAccent = new THREE.MeshStandardMaterial({ color: accent, transparent: true, opacity: .45, roughness: .6, metalness: .05, side: THREE.DoubleSide });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x95a0a5, roughness: .52, metalness: .28 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x49545a, roughness: .36, metalness: .45 });
    const rawMat = new THREE.MeshStandardMaterial({ color: 0xb7822a, roughness: .42, metalness: .22, emissive: 0x3a2300, emissiveIntensity: .05 });
    const cutMetalMat = new THREE.MeshStandardMaterial({ color: 0xcbd2d7, roughness: .32, metalness: .72 });
    const cutterMat = new THREE.MeshStandardMaterial({ color: 0x425059, roughness: .28, metalness: .78 });
    const chipMat = new THREE.MeshStandardMaterial({ color: 0xd0a33c, roughness: .5, metalness: .38, emissive: 0x5a3800, emissiveIntensity: .06 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x263238, transparent: true, opacity: .42 });
    const scanMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.36;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(26, 26, 0x9eb8b6, 0xcbd9d7);
    grid.position.y = -.34;
    scene.add(grid);

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
    addSceneBox([24, .08, .12], [0, 2.32, -6.95], roofMat);
    addSceneBox([.12, .08, 12], [-11.5, 2.16, -.8], roofMat);
    addSceneBox([.12, .08, 12], [11.5, 2.16, -.8], roofMat);

    addSceneBox([20, .035, 1.45], [0, -.31, 3.25], roadMat);
    addSceneBox([1.5, .035, 10.5], [-5.2, -.3, -.9], roadMat);
    addSceneBox([6.6, .045, 3.8], [0, -.28, .05], areaMat);

    addSceneBox([6.8, .03, .08], [0, -.235, 2.0], safetyMat);
    addSceneBox([6.8, .03, .08], [0, -.235, -1.95], safetyMat);
    addSceneBox([.08, .03, 3.95], [-3.4, -.235, .02], safetyMat);
    addSceneBox([.08, .03, 3.95], [3.4, -.235, .02], safetyMat);

    const addConveyor = (size, position, rotation = [0, 0, 0]) => {
      addSceneBox(size, position, conveyorMat, rotation);
      addSceneBox([size[0], .035, .08], [position[0], position[1] + .06, position[2] - size[2] / 2], conveyorEdgeMat, rotation);
      addSceneBox([size[0], .035, .08], [position[0], position[1] + .06, position[2] + size[2] / 2], conveyorEdgeMat, rotation);
    };
    addConveyor([3.25, .13, .52], [-4.35, -.08, 1.05]);
    addConveyor([3.35, .13, .52], [4.35, -.08, 1.05]);

    for (let index = 0; index < 7; index += 1) {
      const leftRoller = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .62, 16), railMat);
      leftRoller.position.set(-5.75 + index * .46, .03, 1.05);
      leftRoller.rotation.x = Math.PI / 2;
      scene.add(leftRoller);

      const rightRoller = leftRoller.clone();
      rightRoller.material = railMat;
      rightRoller.position.x = 3.0 + index * .46;
      scene.add(rightRoller);
    }

    addSceneBox([1.45, .42, .75], [-6.15, -.08, -4.95], blockMat);
    addSceneBox([1.55, .13, .85], [-6.15, .22, -4.95], roofMat);
    addSceneBox([1.35, .38, .72], [6.05, -.08, -4.8], blockMat);
    addSceneBox([1.45, .12, .82], [6.05, .18, -4.8], roofMat);

    for (let index = 0; index < 10; index += 1) {
      const x = index % 2 === 0 ? -10.8 : 10.8;
      const z = -5.7 + Math.floor(index / 2) * 2.8;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 12), blockMat);
      column.position.set(x, .92, z);
      column.castShadow = true;
      scene.add(column);
    }

    const group = new THREE.Group();
    group.position.set(.05, -.1, -.08);
    group.rotation.y = -0.28;
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
    addBox("front-glass-door", [1.78, 1.22, .06], [-.72, 1.42, .84], glassMat);
    addBox("right-slanted-cover", [.86, 1.56, 1.5], [1.32, 1.38, .04], bodyMat, [0, 0, -0.18]);
    addBox("control-panel", [.45, 1.22, .18], [1.98, 1.5, .78], darkMat, [0, 0, -0.24]);
    addBox("top-service-rail", [3.12, .16, 1.34], [-.24, 2.28, 0], darkMat);
    addBox("status-strip", [1.82, .06, .08], [-.42, 2.39, .7], accentMat);
    addBox("chip-conveyor-neck", [1.12, .28, .34], [2.38, 1.0, .22], darkMat, [0, 0, .4]);
    addBox("chip-bin", [.7, .58, .7], [3.0, .76, .22], bodyMat);
    addBox("front-service-panel", [2.68, .5, .08], [-.36, .58, .86], lightMat);
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

    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .25, 24), accentMat);
    beacon.position.set(-1.72, 2.68, 0);
    beacon.castShadow = true;
    group.add(beacon);

    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.7), scanMat);
    scanPlane.position.set(-2.05, 1.28, .02);
    scanPlane.rotation.y = Math.PI / 2;
    group.add(scanPlane);

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

    const createFinishedPart = (offset) => {
      const part = new THREE.Group();
      part.userData.offset = offset;
      part.name = "finishedParts";
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.095, .095, .48, 40), cutMetalMat);
      body.rotation.z = Math.PI / 2;
      body.castShadow = true;
      part.add(body);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .14, 40), cutMetalMat);
      collar.position.x = -.16;
      collar.rotation.z = Math.PI / 2;
      collar.castShadow = true;
      part.add(collar);
      const bore = new THREE.Mesh(new THREE.CylinderGeometry(.042, .042, .5, 24), darkMat);
      bore.rotation.z = Math.PI / 2;
      bore.scale.set(1, 1, 1);
      part.add(bore);
      scene.add(part);
      return part;
    };

    const rawParts = [createRawPart(0), createRawPart(.48)];
    const finishedParts = [createFinishedPart(.1), createFinishedPart(.62)];

    const chips = Array.from({ length: 18 }, (_, index) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(.055, .018, .018), chipMat);
      chip.userData.offset = index / 18;
      chip.castShadow = true;
      group.add(chip);
      return chip;
    });

    const ground = new THREE.Mesh(new THREE.CircleGeometry(2.55, 72), translucentAccent);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(.15, -.27, .15);
    ground.receiveShadow = true;
    scene.add(ground);

    const statusPillar = new THREE.Mesh(new THREE.BoxGeometry(.22, 1.45, .07), translucentAccent);
    statusPillar.position.set(.8, 1.62, -1.55);
    statusPillar.rotation.y = -.18;
    statusPillar.castShadow = true;
    scene.add(statusPillar);

    const statusCap = new THREE.Mesh(new THREE.SphereGeometry(.13, 24, 16), accentMat);
    statusCap.position.set(.8, 2.42, -1.55);
    statusCap.castShadow = true;
    scene.add(statusCap);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xb8c5c9, 1.4);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, .9);
    rim.position.set(-3, 2.5, -2);
    scene.add(rim);

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      const cutCycle = (Math.sin(time * 1.05) + 1) / 2;

      spindleChuck.rotation.x = time * 8.6;
      machiningWorkpiece.rotation.x = time * 14;
      toolSlide.position.x = .22 + Math.sin(time * .92) * .22;
      toolSlide.position.z = .48 + Math.sin(time * 1.45) * .08;
      turret.rotation.z = time * .65;
      cutterGlow.intensity = .45 + Math.abs(Math.sin(time * 5.4)) * .85;
      cutter.material.emissive = new THREE.Color(0xff8d2a);
      cutter.material.emissiveIntensity = .08 + cutCycle * .18;
      loadingArm.rotation.z = Math.sin(time * 1.2) * .18;
      scanPlane.position.x = -2.1 + ((time * .35) % 4.2);
      scanPlane.material.opacity = .12 + Math.sin(time * 2.2) * .05;

      rawParts.forEach((part) => {
        const progress = (time * .16 + part.userData.offset) % 1;
        part.position.set(-5.78 + progress * 2.45, .08, 1.05);
        part.rotation.x = time * 2.5;
      });

      finishedParts.forEach((part) => {
        const progress = (time * .15 + part.userData.offset) % 1;
        part.position.set(2.86 + progress * 2.65, .08, 1.05);
        part.rotation.x = time * 3.4;
        part.rotation.y = Math.sin(time * 1.6 + part.userData.offset) * .08;
      });

      chips.forEach((chip) => {
        const progress = (time * 1.4 + chip.userData.offset) % 1;
        chip.position.set(
          -.18 + progress * .7,
          1.35 - progress * .45 + Math.sin(progress * Math.PI * 4) * .035,
          .8 + progress * .28,
        );
        chip.rotation.set(time * 4 + progress, time * 2.3, progress * 6);
        chip.material.opacity = 1 - progress * .7;
      });
      beacon.material.emissiveIntensity = .12 + Math.abs(Math.sin(time * 3.2)) * .36;
      statusCap.material.emissiveIntensity = .12 + Math.abs(Math.sin(time * 3.2)) * .36;
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

    const handleClick = () => onSelectRef.current();
    renderer.domElement.addEventListener("click", handleClick);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("click", handleClick);
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      controls.dispose();
      renderer.dispose();
    };
  }, [status]);

  return <div ref={mountRef} className="machine-3d-canvas" aria-hidden="true" />;
}

function statusColor(status) {
  if (status === "fault") return 0xb73732;
  if (status === "alarm" || status === "warning") return 0xb66a00;
  if (status === "idle") return 0x7d8c93;
  return 0x087f75;
}

function MachineDetailHeader({ machine, isLiveMachine, sample, result, healthText }) {
  const status = isLiveMachine ? machineStatus(machine, result) : "idle";
  return (
    <section className="machine-detail-header">
      <div>
        <span className="eyebrow">设备详情</span>
        <h2>{machine.name} · {machine.type}</h2>
        <p>{machine.line} · {isLiveMachine ? (sample?.device_id || machine.id) : machine.id}</p>
      </div>
      <div className="machine-detail-stats">
        <div><span>状态</span><strong className={status}>{machineStatusLabel(status)}</strong></div>
        <div><span>告警</span><strong>{isLiveMachine ? (sample?.alarm_code || "无") : "--"}</strong></div>
        <div><span>健康度</span><strong>{isLiveMachine ? healthText : "--"}</strong></div>
      </div>
    </section>
  );
}

function StatusStrip({ snapshot, sample, runner, healthText }) {
  const items = [
    ["监测状态", runner.enabled ? "开启" : "暂停"],
    ["设备状态", labelFor(statusLabels, sample?.status)],
    ["当前告警", sample?.alarm_code || "无"],
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

function MetricsPanel({ result, sample }) {
  const items = useMemo(() => buildMetricItems(result, sample), [result, sample]);
  return (
    <section className="panel metrics-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">实时快照</span><h2>实时指标</h2></div>
        <span className="muted">{sample ? `最近采样 ${formatTime(sample.timestamp)}` : "等待采样"}</span>
      </div>
      <div className="metrics-grid">
        {items.map((item) => <MetricCard key={item.key} item={item} result={result} />)}
      </div>
      {(sample?.vibration === null || sample?.vibration === undefined) && (
        <div className="notice">当前设备数据源没有提供振动字段，振动不会被其他指标替代；其他设备指标仍会继续监测。</div>
      )}
      <div className="subsection-heading"><span className="eyebrow">设备联锁与执行部件</span><strong>整机状态</strong></div>
      <EquipmentStates sample={sample} />
    </section>
  );
}

function buildMetricItems(result, sample) {
  const metrics = sample?.metrics || {};
  const details = sample?.metric_details || {};
  const items = Object.entries(details).map(([key, detail]) => ({
    key,
    name: detail.label || key,
    group: detail.group || "整机",
    value: metrics[key],
    unit: detail.unit || "",
    normalRange: detail.normal_range,
  }));
  if (items.length) return items;
  return [
    { key: "temperature", name: "温度", group: "主轴", value: sample?.temperature, unit: "C" },
    { key: "vibration", name: "振动", group: "主轴", value: sample?.vibration, unit: "mm/s" },
    { key: "rpm", name: "转速", group: "主轴", value: sample?.rpm, unit: "rpm" },
  ];
}

function MetricCard({ item, result }) {
  const anomaly = result?.observations?.find((observation) => (
    observation.key === `metric:${item.key}`
    || observation.key === item.key
    || (item.key === "spindle_temperature_c" && observation.key === "temperature")
    || (item.key === "spindle_vibration_rms" && observation.key === "vibration")
  ));
  const level = alertSeverity(anomaly?.alert_level);
  const display = item.value === null || item.value === undefined ? "未提供" : `${Number(item.value).toFixed(1)}`;
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
  const confidence = latest.confidence === null || latest.confidence === undefined
    ? "--"
    : `${(Number(latest.confidence) * 100).toFixed(0)}%`;
  const definition = latest.alarm_definition || {};
  const evidence = (latest.tool_calls || []).map((item) => labelFor(diagnosisEvidenceLabels, item.name)).join("、") || "等待诊断依据";
  const cells = [
    ["设备", latest.device_id || "--"],
    ["诊断任务", latest.task_id || "--"],
    ["异常事件", latest.event_id || "--"],
    ["事件轮次", `第 ${latest.event_revision || 1} 次`],
    ["触发时间", formatTime(latest.triggered_at)],
    ["报警定义", definition.name || "未查询到"],
    ["置信度", confidence],
    ["诊断依据", evidence],
  ];
  return (
    <div className="diagnosis-result">
      <div className="diagnosis-summary">{latest.summary || "正在生成诊断结果"}</div>
      <div className="diagnosis-grid">
        {cells.map(([label, value]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
      <div className="diagnosis-detail"><span>诊断说明</span><p>{latest.diagnosis || "暂无详细诊断"}</p></div>
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
  const knowledge = pipeline.knowledge || {};
  const evidence = latest.tool_calls || [];
  return (
    <section className="workspace-view active module-board" aria-label="智能诊断中心">
      <ModuleHero eyebrow="Diagnosis Agent" title="智能诊断中心" text="查看异常事件、诊断结论、报警定义、历史证据和知识检索结果。" />
      <div className="module-grid">
        <ModuleStat label="诊断状态" value={labelFor(diagnosisStatusLabels, latest.status)} text={latest.diagnosis_run_id || "等待异常任务"} />
        <ModuleStat label="置信度" value={latest.confidence == null ? "--" : `${(Number(latest.confidence) * 100).toFixed(0)}%`} text={latest.event_id || "暂无异常事件"} />
        <ModuleStat label="知识证据" value={(knowledge.documents || []).length} text={knowledge.source || "A2A / RAG"} />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">最终诊断</span><h2>{latest.summary || "等待异常事件"}</h2></div><span className={`severity-pill ${latest.status === "failed" ? "fault" : "normal"}`}>{labelFor(diagnosisStatusLabels, latest.status)}</span></div>
          <div className="detail-grid">
            <DetailCell label="设备" value={latest.device_id} />
            <DetailCell label="异常事件" value={latest.event_id} />
            <DetailCell label="事件轮次" value={latest.event_revision ? `第 ${latest.event_revision} 次` : "--"} />
            <DetailCell label="触发原因" value={latest.trigger_cause} />
          </div>
          <div className="diagnosis-detail"><span>诊断说明</span><p>{latest.diagnosis || "暂无诊断说明"}</p></div>
          {latest.recommendation && <div className="diagnosis-detail"><span>下一步建议</span><p>{latest.recommendation}</p></div>}
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">工具证据</span><h2>Reason · Act · Observe</h2></div></div>
          <TraceList items={evidence.map((item) => ({ event: item.name, agent: "Diagnosis Agent", tool: item.name, arguments: item.arguments }))} />
          <DocumentList documents={knowledge.documents || []} />
        </section>
      </div>
    </section>
  );
}

function MaintenanceWorkspace({ snapshot }) {
  const pipeline = PipelineData({ snapshot });
  const plan = pipeline.maintenance_plan || {};
  const diagnosis = plan.diagnosis || pipeline.diagnosis || {};
  return (
    <section className="workspace-view active module-board" aria-label="维修决策中心">
      <ModuleHero eyebrow="Maintenance Agent" title="维修决策中心" text="将诊断结果、RAG知识和CAD/BOM部件信息汇总为可执行维修方案。" />
      <div className="module-grid">
        <ModuleStat label="方案编号" value={plan.plan_id || "--"} text={diagnosis.fault || diagnosis.summary || "等待诊断"} />
        <ModuleStat label="预计用时" value={plan.estimated_time || "--"} text="Maintenance Agent 估算" />
        <ModuleStat label="关联部件" value={(plan.cad_components || []).length} text="来自 CAD / BOM 查询" />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">维修步骤</span><h2>执行清单</h2></div></div><StepList steps={plan.repair_steps || []} /></section>
        <section className="panel module-panel"><div className="panel-heading"><div><span className="eyebrow">安全与资源</span><h2>工器具、备件和安全要求</h2></div></div><div className="detail-grid"><DetailCell label="工器具" value={(plan.tools || []).join("、")} /><DetailCell label="备件" value={(plan.parts || []).join("、")} /><DetailCell label="安全要求" value={(plan.safety || []).join("；")} /><DetailCell label="知识来源" value={(plan.source_documents || []).join("、")} /></div></section>
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

function WorkorderView({ snapshot, sample }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [assignee, setAssignee] = useState("维修一组");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const latestDiagnosis = snapshot?.diagnosis?.latest || {};
  const selectedOrder = orders.find((order) => order.workorder_id === selectedId) || orders[0];

  async function loadOrders() {
    try {
      const body = await request("/api/workorders");
      const items = body.items || [];
      setOrders(items);
      if (!selectedId && items.length) setSelectedId(items[0].workorder_id);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function createOrder() {
    setBusy(true);
    try {
      const title = latestDiagnosis.summary || latestDiagnosis.fault || `${sample?.device_id || snapshot?.device_id || "unknown"} 设备维修`;
      const order = await request("/api/workorders", {
        method: "POST",
        body: JSON.stringify({
          device_id: sample?.device_id || snapshot?.device_id || "unknown",
          title,
          steps: latestDiagnosis.recommendation ? [latestDiagnosis.recommendation] : sampleWorkorderSteps,
          assignee,
        }),
      });
      await loadOrders();
      setSelectedId(order.workorder_id);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(status) {
    if (!selectedOrder) return;
    setBusy(true);
    try {
      const action = status === "closed" ? "close" : "update";
      const order = await request(`/api/workorders/${selectedOrder.workorder_id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, status, assignee }),
      });
      setOrders((items) => items.map((item) => item.workorder_id === order.workorder_id ? order : item));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-view active module-board" aria-label="工单系统">
      <ModuleHero eyebrow="MES 工单系统" title="维修工单闭环" text="把诊断结果转成维修任务，跟踪处理人、步骤和状态，并为质检验收提供入口。" />
      <div className="module-grid">
        <ModuleStat label="当前工单" value={orders.length} text="Agent Service 内存工单池" />
        <ModuleStat label="选中状态" value={labelFor(workorderStatusLabels, selectedOrder?.status)} text={selectedOrder?.workorder_id || "暂无工单"} />
        <ModuleStat label="关联设备" value={selectedOrder?.device_id || sample?.device_id || snapshot?.device_id || "--"} text="来自实时监测上下文" />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">创建工单</span><h2>诊断转派</h2></div>
            <span className="muted">{latestDiagnosis.summary || "可先创建演示工单"}</span>
          </div>
          <div className="form-row">
            <label>处理人<input value={assignee} onChange={(event) => setAssignee(event.target.value)} /></label>
            <button className="button primary" type="button" disabled={busy} onClick={createOrder}>{busy ? "处理中" : "创建工单"}</button>
          </div>
          {error && <div className="inline-error">{error}</div>}
        </section>
        <section className="panel module-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">工单列表</span><h2>任务队列</h2></div>
            <button className="button" type="button" onClick={loadOrders}>刷新</button>
          </div>
          <div className="order-list">
            {!orders.length && <div className="empty-state">暂无工单，点击创建工单生成第一条任务</div>}
            {orders.map((order) => (
              <button key={order.workorder_id} type="button" className={`order-row ${order.workorder_id === selectedOrder?.workorder_id ? "active" : ""}`} onClick={() => setSelectedId(order.workorder_id)}>
                <span><strong>{order.title}</strong><em>{order.workorder_id}</em></span>
                <b>{labelFor(workorderStatusLabels, order.status)}</b>
              </button>
            ))}
          </div>
        </section>
      </div>
      <WorkorderDetail order={selectedOrder} busy={busy} onUpdate={updateOrder} />
    </section>
  );
}

function WorkorderDetail({ order, busy, onUpdate }) {
  if (!order) return <section className="panel module-panel"><div className="empty-state">暂无工单详情</div></section>;
  return (
    <section className="panel module-panel detail-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">工单详情</span><h2>{order.title}</h2></div>
        <span className={`severity-pill ${order.status === "closed" || order.status === "completed" ? "normal" : "warning"}`}>{labelFor(workorderStatusLabels, order.status)}</span>
      </div>
      <div className="detail-grid">
        <DetailCell label="工单编号" value={order.workorder_id} />
        <DetailCell label="设备" value={order.device_id} />
        <DetailCell label="处理人" value={order.assignee || "未分配"} />
        <DetailCell label="更新时间" value={formatTime(order.updated_at)} />
      </div>
      <StepList steps={order.steps} />
      <div className="action-row">
        <button className="button" type="button" disabled={busy} onClick={() => onUpdate("in_progress")}>标记处理中</button>
        <button className="button" type="button" disabled={busy} onClick={() => onUpdate("completed")}>标记完成</button>
        <button className="button primary" type="button" disabled={busy} onClick={() => onUpdate("closed")}>关闭工单</button>
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
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quality, setQuality] = useState(null);
  const [trace, setTrace] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedOrder = orders.find((order) => order.workorder_id === selectedId) || orders[0];

  async function loadQualityData() {
    try {
      const [orderBody, traceBody, experienceBody] = await Promise.all([
        request("/api/workorders"),
        request("/api/trace"),
        request("/api/experience/search", {
          method: "POST",
          body: JSON.stringify({ device_id: sample?.device_id || snapshot?.device_id || "", limit: 8 }),
        }),
      ]);
      const items = orderBody.items || [];
      setOrders(items);
      setTrace(traceBody.trace || []);
      setExperiences(experienceBody.items || []);
      if (!selectedId && items.length) setSelectedId(items[0].workorder_id);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadQualityData();
  }, []);

  async function verifyQuality() {
    if (!selectedOrder) return;
    setBusy(true);
    try {
      const body = await request(`/api/workorders/${selectedOrder.workorder_id}/quality`, { method: "POST", body: "{}" });
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
      <ModuleHero eyebrow="QMS 质检系统" title="维修验收与经验沉淀" text="对已处理工单执行恢复验证，查看 Agent Trace，并展示维修经验库检索结果。" />
      <div className="module-grid">
        <ModuleStat label="待验工单" value={orders.length} text="来自当前工单池" />
        <ModuleStat label="最近验收" value={quality ? (quality.passed ? "通过" : "未通过") : "未执行"} text={quality?.workorder_id || "选择工单后执行"} />
        <ModuleStat label="经验记录" value={experiences.length} text="长期记忆/经验库结果" />
      </div>
      <div className="ops-grid">
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">验收对象</span><h2>选择工单</h2></div><button className="button" type="button" onClick={loadQualityData}>刷新</button></div>
          <select className="select-input" value={selectedOrder?.workorder_id || ""} onChange={(event) => setSelectedId(event.target.value)}>
            {!orders.length && <option value="">暂无工单</option>}
            {orders.map((order) => <option key={order.workorder_id} value={order.workorder_id}>{order.workorder_id} · {order.title}</option>)}
          </select>
          <div className="action-row"><button className="button primary" type="button" disabled={busy || !selectedOrder} onClick={verifyQuality}>{busy ? "验收中" : "执行质检"}</button></div>
          {error && <div className="inline-error">{error}</div>}
        </section>
        <section className="panel module-panel">
          <div className="panel-heading"><div><span className="eyebrow">质检结果</span><h2>{quality ? (quality.passed ? "验收通过" : "验收未通过") : "等待验收"}</h2></div></div>
          {quality ? <QualityResultView quality={quality} /> : <div className="empty-state">工单完成或关闭后，质检结果会显示恢复状态、报警清除和 SOP 合规性。</div>}
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

function StepList({ steps = [] }) {
  if (!steps.length) return <div className="empty-state">暂无维修步骤</div>;
  return <ol className="step-list">{steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol>;
}

function DocumentList({ documents }) {
  if (!documents.length) return <div className="empty-state">暂无命中文档</div>;
  return <div className="document-list">{documents.map((doc, index) => <article key={doc.document_id || index}><strong>{doc.title || doc.document_id}</strong><p>{doc.content}</p><span>{doc.source || doc.metadata?.collection || "知识库"} · 相关度 {doc.score ?? "--"}</span></article>)}</div>;
}

function QualityResultView({ quality }) {
  const checks = [
    ["设备恢复", quality.device_recovered],
    ["报警清除", quality.alarm_cleared],
    ["SOP合规", quality.sop_compliant],
  ];
  return <div className="quality-result"><div className="check-grid">{checks.map(([label, passed]) => <div key={label} className={passed ? "normal" : "fault"}><span>{label}</span><strong>{passed ? "通过" : "未通过"}</strong></div>)}</div><StepList steps={quality.findings || []} /></div>;
}

function ExperienceList({ items }) {
  if (!items.length) return <div className="empty-state">暂无经验记录；闭环通过后会自动沉淀。</div>;
  return <div className="document-list">{items.map((item, index) => <article key={item.experience_id || index}><strong>{item.title}</strong><p>{item.content}</p><span>{item.device_id || "--"} · {item.source_workorder || "历史经验"}</span></article>)}</div>;
}

function TraceList({ items }) {
  if (!items.length) return <div className="empty-state">暂无调用轨迹</div>;
  return <div className="trace-list">{items.slice(0, 12).map((item, index) => <div key={`${item.event || "trace"}-${index}`}><strong>{item.event}</strong><span>{item.agent || item.tool || item.mcp_server || "runtime"}</span></div>)}</div>;
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
