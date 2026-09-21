const state = {
  pollTimer: null,
  triggerCount: 0,
  lastTriggerAt: null,
};

const $ = (selector) => document.querySelector(selector);

// 统一转义后端返回的文本，避免动态 HTML 注入页面。
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("zh-CN", { hour12: false });
}

function severityClass(status) {
  return status === "fault" ? "fault" : status === "alarm" ? "alarm" : status === "warning" ? "warning" : "normal";
}

// 后端返回稳定的规则枚举值，前端在展示时映射为规则名称。
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

function labelFor(mapping, value) {
  return mapping[value] || value || "--";
}

function observationLabel(item) {
  if (item.kind === "multi_metric") return kindLabels.multi_metric;
  return item.label || kindLabels[item.kind] || item.kind || "监测项";
}

function renderMetrics(result) {
  const sample = result?.current_sample;
  const metrics = sample?.metrics || {};
  const details = sample?.metric_details || {};
  // 优先使用工厂快照中的 metric_details 渲染完整指标目录。
  const items = Object.entries(details).map(([key, detail]) => ({
    key,
    name: detail.label || key,
    group: detail.group || "整机",
    value: metrics[key],
    unit: detail.unit || "",
    normalRange: detail.normal_range,
  }));
  if (!items.length) {
    items.push(
      { key: "temperature", name: "温度", group: "主轴", value: sample?.temperature, unit: "C" },
      { key: "vibration", name: "振动", group: "主轴", value: sample?.vibration, unit: "mm/s" },
      { key: "rpm", name: "转速", group: "主轴", value: sample?.rpm, unit: "rpm" },
    );
  }
  $("#metrics").innerHTML = items.map((item) => {
    const { key, name, group, value, unit, normalRange } = item;
    const display = value === null || value === undefined ? "未提供" : `${Number(value).toFixed(1)}`;
    const anomaly = result?.observations?.find((observation) => (
      observation.key === `metric:${key}`
      || observation.key === key
      || (key === "spindle_temperature_c" && observation.key === "temperature")
      || (key === "spindle_vibration_rms" && observation.key === "vibration")
    ));
    const level = anomaly?.alert_level || "normal";
    const range = normalRange ? `正常 ${normalRange[0]} - ${normalRange[1]}` : "";
    return `<div class="metric ${severityClass(level === "high" ? "fault" : level === "intermediate" ? "alarm" : level === "initial" ? "warning" : "normal")}">
      <span class="metric-group">${escapeHtml(group)}</span>
      <span class="metric-name">${escapeHtml(name)}</span>
      <strong class="metric-value">${escapeHtml(display)}</strong>
      <span class="metric-unit">${escapeHtml(unit)} ${escapeHtml(range)}</span>
    </div>`;
  }).join("");
  $("#missingVibration").hidden = sample?.vibration !== null && sample?.vibration !== undefined;
}

function renderObservations(data) {
  const result = data.latest_result;
  const status = result?.status || "normal";
  const statusLabel = labelFor(statusLabels, status);
  $("#decisionStatus").textContent = statusLabel;
  $("#decisionStatus").className = `severity-pill ${severityClass(status)}`;
  if (!result?.observations?.length) {
    $("#observations").innerHTML = `<div class="empty-state">当前没有检测到异常</div>`;
    return;
  }
  $("#observations").innerHTML = result.observations.map((item) => {
    const level = item.alert_level === "high" ? "fault" : item.alert_level === "intermediate" ? "alarm" : "warning";
    const rule = ruleLabels[item.rule_type] || item.rule_type || "监控规则";
    return `<div class="observation">
      <span class="observation-dot ${level}"></span>
      <div><div class="observation-title">${escapeHtml(rule)} · ${escapeHtml(observationLabel(item))}：${escapeHtml(item.value)}</div>
      <div class="observation-meta">${escapeHtml(item.message)} · 阈值 ${escapeHtml(item.threshold ?? "-")} ${escapeHtml(item.unit || "")}</div></div>
      <span class="observation-level">${escapeHtml(labelFor(alertLevelLabels, item.alert_level))}</span>
    </div>`;
  }).join("");
}

function renderEquipmentStates(sample) {
  const states = Object.values(sample?.equipment_states || {});
  if (!states.length) {
    $("#equipmentStates").innerHTML = `<div class="empty-state">当前接口没有提供离散设备状态</div>`;
    return;
  }
  $("#equipmentStates").innerHTML = states.map((state) => `
    <div class="equipment-state ${state.is_normal ? "normal" : "fault"}">
      <span>${escapeHtml(state.label || "设备状态")}</span>
      <strong>${escapeHtml(labelFor(equipmentValueLabels, state.value))}</strong>
    </div>
  `).join("");
}

function renderTriggers(data) {
  const history = data.trigger_history || [];
  $("#triggerCount").textContent = data.diagnosis_task_count ?? history.length;
  if (!history.length) {
    $("#triggers").innerHTML = `<div class="empty-state">暂无触发记录</div>`;
    return;
  }
  $("#triggers").innerHTML = history.map((trigger) => `<div class="trigger-row">
    <span class="trigger-time">${escapeHtml(formatTime(trigger.triggered_at))}</span>
    <span class="trigger-device">${escapeHtml(trigger.device_id)}</span>
    <span class="trigger-rules">${escapeHtml(trigger.event_id || trigger.abnormal_event?.event_id || "--")}</span>
    <span class="trigger-reason">${escapeHtml(trigger.trigger_cause || "首次确认异常")} · ${escapeHtml(trigger.task_id || "--")} · ${escapeHtml((trigger.rule_types || []).map((item) => ruleLabels[item] || item).join("、"))}</span>
  </div>`).join("");
}

function renderDiagnosis(data) {
  const diagnosis = data.diagnosis || {};
  const latest = diagnosis.latest || {};
  const status = latest.status || "idle";
  const statusClass = status === "failed" ? "fault" : status === "fallback" ? "warning" : status === "completed" ? "normal" : "normal";
  $("#diagnosisStatus").textContent = labelFor(diagnosisStatusLabels, status);
  $("#diagnosisStatus").className = `severity-pill ${statusClass}`;
  if (!latest || status === "idle") {
    $("#diagnosisResult").innerHTML = `<div class="empty-state">满足触发条件后自动生成诊断结果</div>`;
    return;
  }
  const confidence = latest.confidence === null || latest.confidence === undefined
    ? "--"
    : `${(Number(latest.confidence) * 100).toFixed(0)}%`;
  const definition = latest.alarm_definition || {};
  const toolCalls = latest.tool_calls || [];
  const evidence = toolCalls.map((item) => labelFor(diagnosisEvidenceLabels, item.name)).join("、") || "等待诊断依据";
  $("#diagnosisResult").innerHTML = `
    <div class="diagnosis-summary">${escapeHtml(latest.summary || "正在生成诊断结果")}</div>
    <div class="diagnosis-grid">
      <div><span>设备</span><strong>${escapeHtml(latest.device_id || "--")}</strong></div>
      <div><span>诊断任务</span><strong>${escapeHtml(latest.task_id || "--")}</strong></div>
      <div><span>异常事件</span><strong>${escapeHtml(latest.event_id || "--")}</strong></div>
      <div><span>事件轮次</span><strong>第 ${escapeHtml(latest.event_revision || 1)} 次</strong></div>
      <div><span>触发时间</span><strong>${escapeHtml(formatTime(latest.triggered_at))}</strong></div>
      <div><span>报警定义</span><strong>${escapeHtml(definition.name || "未查询到")}</strong></div>
      <div><span>置信度</span><strong>${escapeHtml(confidence)}</strong></div>
      <div><span>诊断依据</span><strong>${escapeHtml(evidence)}</strong></div>
    </div>
    <div class="diagnosis-detail"><span>诊断说明</span><p>${escapeHtml(latest.diagnosis || "暂无详细诊断")}</p></div>
    ${latest.error ? `<div class="diagnosis-error">${escapeHtml(latest.error)}</div>` : ""}
  `;
}

function render(data) {
  const runner = data.runner || {};
  const result = data.latest_result;
  const sample = result?.current_sample;
  $("#deviceLabel").textContent = `数据源：${data.data_source || "设备数据源"} · ${data.device_id} · 在线监测`;
  $("#monitorState").textContent = runner.enabled ? "开启" : "暂停";
  $("#deviceState").textContent = labelFor(statusLabels, sample?.status);
  $("#alarmCode").textContent = sample?.alarm_code || "无";
  $("#sampleCount").textContent = data.result_count ?? "--";
  $("#alarmEventCount").textContent = data.alarm_event_count ?? "--";
  $("#sampleInterval").textContent = runner.interval_seconds ? `${runner.interval_seconds} 秒/次` : "--";
  $("#healthScore").textContent = sample?.health_score === null || sample?.health_score === undefined
    ? "--"
    : `${Number(sample.health_score).toFixed(0)} / 100`;
  $("#lastSample").textContent = sample ? `最近采样 ${formatTime(sample.timestamp)}` : "等待采样";
  $("#monitorSwitch").checked = Boolean(runner.enabled);
  $("#switchLabel").textContent = runner.enabled ? "监测开启" : "监测暂停";
  $("#connectionBadge").textContent = runner.last_error ? "接口异常" : "连接正常";
  $("#connectionBadge").className = `connection-badge${runner.last_error ? " bad" : ""}`;
  renderMetrics(result);
  renderEquipmentStates(sample);
  renderObservations(data);
  renderTriggers(data);
  renderDiagnosis(data);
  $("#errorBar").hidden = !runner.last_error;
  $("#errorBar").textContent = runner.last_error || "";
}

async function refresh() {
  try {
    render(await request("/api/monitor/snapshot"));
  } catch (error) {
    $("#connectionBadge").textContent = "监测服务异常";
    $("#connectionBadge").className = "connection-badge bad";
    $("#errorBar").hidden = false;
    $("#errorBar").textContent = error.message;
  }
}

async function control(action) {
  try {
    render(await request("/api/monitor/control", { method: "POST", body: JSON.stringify({ action }) }));
  } catch (error) {
    $("#errorBar").hidden = false;
    $("#errorBar").textContent = error.message;
  }
}

async function resetStats() {
  try {
    render(await request("/api/monitor/reset", { method: "POST", body: "{}" }));
  } catch (error) {
    $("#errorBar").hidden = false;
    $("#errorBar").textContent = error.message;
  }
}

$("#monitorSwitch").addEventListener("change", (event) => control(event.target.checked ? "on" : "off"));
$("#resetStats").addEventListener("click", resetStats);

refresh();
state.pollTimer = window.setInterval(refresh, 1000);
