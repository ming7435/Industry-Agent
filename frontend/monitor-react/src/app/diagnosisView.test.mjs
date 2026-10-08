import test from "node:test";
import assert from "node:assert/strict";
import { buildDiagnosisView, getLatestDiagnosis } from "./diagnosisView.mjs";

test('同设备再次出现同一报警时旧事件诊断不能冒充本次完成', () => {
  const snapshot={device_id:'D',trigger_history:[{abnormal_event:{device_id:'D',alarm_code:'700010',event_id:'E-NEW'}}],
    diagnosis:{latest:{device_id:'D',alarm_code:'700010',event_id:'E-OLD',status:'completed',summary:'上次结果'}}};
  const view=buildDiagnosisView(snapshot,{device_id:'D',alarm_code:'700010'});
  assert.equal(view.isCurrent,false);
  assert.equal(view.status,'waiting');
  assert.ok(!view.summary.includes('上次结果'));
});

test("diagnosis view prefers structured model fields over embedded JSON", () => {
  const raw = "分析过程\n\n```json\n{\"summary\":\"主轴温度异常\",\"diagnosis\":\"优先检查冷却系统\",\"recommendation\":\"停机检查冷却泵\",\"next_action\":\"核对压力传感器\"}\n```";
  const view = buildDiagnosisView({
    device_id: "MACHINE-1",
    diagnosis: { latest: { status: "completed", summary: raw, confidence: 0.4, evidence: ["证据A", "[table | 第1页]"] } },
  });
  assert.equal(view.summary, "主轴温度异常");
  assert.equal(view.cause, "优先检查冷却系统");
  assert.equal(view.recommendation, "停机检查冷却泵");
  assert.equal(view.nextAction, "核对压力传感器");
  assert.deepEqual(view.evidence, ["证据A"]);
});

test("diagnosis view ignores generic lifecycle recommendation", () => {
  const view = buildDiagnosisView({
    diagnosis: {
      latest: {
        summary: "```json\n{\"summary\":\"异常\",\"recommendation\":\"检查冷却泵\"}\n```",
        recommendation: "诊断完成",
        evidence: [],
      },
    },
  });
  assert.equal(view.recommendation, "检查冷却泵");
});

test("diagnosis view clears an old result when the live alarm changes", () => {
  const view = buildDiagnosisView(
    {
      device_id: "MACHINE-1",
      latest_result: { current_sample: { device_id: "MACHINE-1", alarm_code: "700013", status: "alarm" } },
      diagnosis: { latest: { device_id: "MACHINE-1", alarm_code: "700012", status: "completed", summary: "旧故障" } },
    },
  );
  assert.equal(view.isCurrent, false);
  assert.equal(view.summary, "正在等待报警 700013 的诊断结果");
  assert.equal(view.evidence.length, 0);
});

test("diagnosis view selects the result for the selected device", () => {
  const snapshot = {
    device_id: "MACHINE-1",
    latest_result: { current_sample: { device_id: "MACHINE-1", alarm_code: "700013", status: "alarm" } },
    diagnosis: {
      latest: { device_id: "MACHINE-2", alarm_code: "700012", summary: "另一台设备" },
      latest_by_device: { "MACHINE-1": { device_id: "MACHINE-1", alarm_code: "700013", summary: "当前设备" } },
    },
  };
  assert.equal(getLatestDiagnosis(snapshot, snapshot.latest_result.current_sample).summary, "当前设备");
  assert.equal(buildDiagnosisView(snapshot, snapshot.latest_result.current_sample).summary, "当前设备");
});

test("当前诊断失败必须展示错误，不伪装为等待", () => {
  const sample = { device_id: "D-1", alarm_code: "700002" };
  const view = buildDiagnosisView({ diagnosis: { latest_by_device: {
    "D-1": { ...sample, status: "failed", summary: "调用失败", error: "连接断开" },
  } } }, sample);
  assert.equal(view.status, "failed");
  assert.equal(view.error, "连接断开");
});

test("后台已返回低置信度判断时显示结论和待核实门禁", () => {
  const sample = { device_id: "D-1", alarm_code: "700002" };
  const view = buildDiagnosisView({ diagnosis: {
    latest_by_device: { "D-1": { ...sample, status: "completed", confidence: 0.465, requires_human_review: true, summary: "暂不能确认根因" } },
    pipeline_by_device: { "D-1": { status: "blocked", stop_reason: "replan_limit_exceeded" } },
  } }, sample);
  assert.equal(view.status, "completed");
  assert.equal(view.statusLabel, "诊断待核实");
  assert.equal(view.summary, "暂不能确认根因");
  assert.equal(view.confidence, 0.465);
  assert.match(view.statusHint, /人工核实/);
  assert.match(view.workflowReason, /未完成自动派工/);
});

function completedDiagnosis(pipeline = {}, latest = {}) {
  const sample = { device_id: "D-1", alarm_code: "700010" };
  return buildDiagnosisView({ diagnosis: {
    latest_by_device: { "D-1": { ...sample, status: "completed", confidence: 0.916,
      evidence_status: "ready", requires_human_review: false, summary: "液压压力异常已完成诊断", ...latest } },
    pipeline_by_device: { "D-1": pipeline },
  } }, sample);
}

test("后续重试达到上限不能把已完成诊断改成证据不足", () => {
  const view = completedDiagnosis({ status: "blocked", stop_reason: "replan_limit_exceeded" });
  assert.equal(view.status, "completed");
  assert.equal(view.statusLabel, "诊断已返回");
  assert.equal(view.confidence, 0.916);
  assert.equal(view.workflowStatus, "blocked");
  assert.equal(view.stopReason, "replan_limit_exceeded");
  assert.match(view.workflowReason, /后续流程重试达到上限/);
  assert.match(view.statusHint, /未完成自动派工/);
  assert.doesNotMatch(view.statusHint, /证据不足|补充报警定义/);
});

test("维修方案门禁与知识检索门禁属于后续流程，不否定诊断结果", () => {
  const plan = completedDiagnosis({ status: "blocked", stop_reason: "maintenance_plan_invalid" });
  assert.equal(plan.status, "completed");
  assert.equal(plan.statusLabel, "诊断已返回");
  assert.match(plan.workflowReason, /后续流程被门禁拦截/);
  assert.doesNotMatch(plan.statusHint, /诊断证据不足/);
  const knowledge = completedDiagnosis({ runtime_result: { status: "blocked", stop_reason: "knowledge_evidence_gate" } });
  assert.equal(knowledge.status, "completed");
  assert.equal(knowledge.workflowStatus, "blocked");
  assert.match(knowledge.workflowReason, /维修依据检索未通过/);
  assert.doesNotMatch(knowledge.statusHint, /诊断证据不足|补充报警定义/);
});

test("真实诊断证据不足即使高置信度也必须待核实", () => {
  const view = completedDiagnosis({ status: "completed" }, { evidence_status: "insufficient" });
  assert.equal(view.status, "completed");
  assert.equal(view.statusLabel, "诊断证据不足，待核实");
  assert.match(view.statusHint, /诊断证据不足/);
  assert.doesNotMatch(view.statusHint, /诊断已返回/);
});

test("后续流程运行、回查和未知与诊断完成分别表达", () => {
  for (const workflowStatus of ["running", "recovering", "unknown", "failed"]) {
    const view = completedDiagnosis({ status: workflowStatus });
    assert.equal(view.status, "completed");
    assert.equal(view.statusLabel, "诊断已返回");
    assert.equal(view.workflowStatus, workflowStatus);
    assert.match(view.workflowReason, workflowStatus === "unknown" ? /尚未确认/ : workflowStatus === "failed" ? /执行失败/ : /仍在处理/);
  }
  assert.equal(completedDiagnosis({}, { workflow_status: "unknown" }).workflowStatus, "unknown");
});

test("未知、失败与降级诊断不能借用后续完成状态声称成功", () => {
  for (const status of ["unknown", "unexpected_status", "failed", "fallback", "blocked"]) {
    const view = completedDiagnosis({ status: "completed" }, { status });
    assert.equal(view.status, status);
    assert.doesNotMatch(view.statusLabel, /已返回|已完成|成功/);
    assert.doesNotMatch(view.statusHint, /诊断已返回|诊断已完成/);
  }
  assert.equal(completedDiagnosis({}, { status: "unexpected_status" }).statusLabel, "诊断状态待确认");
});

test("选中设备不能借用另一台设备的诊断，即使当前无报警", () => {
  const view = buildDiagnosisView({ diagnosis: {
    latest: { device_id: "D-2", status: "completed", summary: "另一台的故障" },
  } }, { device_id: "D-1", alarm_code: "" });
  assert.equal(view.isCurrent, false);
  assert.equal(view.summary, "等待诊断结果");
});

test("阶段诊断已完成时立即展示正文，明确后续流程还在运行", () => {
  const sample = { device_id: "D-1", alarm_code: "700004" };
  const view = buildDiagnosisView({ diagnosis: { latest_by_device: { "D-1": {
    ...sample, status: "completed", summary: "开门互锁未满足", confidence: 0.9,
    workflow_status: "running", evidence: ["设备报警定义"],
  } } } }, sample);
  assert.equal(view.summary, "开门互锁未满足");
  assert.equal(view.status, "completed");
  assert.match(view.statusHint, /后续流程仍在处理/);
});
