import test from "node:test";
import assert from "node:assert/strict";
import { buildDiagnosisView, getLatestDiagnosis } from "./diagnosisView.mjs";

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
    latest_by_device: { "D-1": { ...sample, status: "completed", confidence: 0.465, summary: "暂不能确认根因" } },
    pipeline_by_device: { "D-1": { status: "blocked", stop_reason: "replan_limit_exceeded" } },
  } }, sample);
  assert.equal(view.status, "blocked");
  assert.equal(view.summary, "暂不能确认根因");
  assert.equal(view.confidence, 0.465);
  assert.match(view.statusHint, /未自动派工/);
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
