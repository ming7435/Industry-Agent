import test from "node:test";
import assert from "node:assert/strict";
import { buildTechnicianSummary } from "../src/technicianSummary.mjs";

test("builds a technician-facing summary from dynamic diagnosis and maintenance data", () => {
  const summary = buildTechnicianSummary({
    latest: {
      alarm_code: "ALM-021",
      alarm_label: "主轴温度过高",
      diagnosis: "综合判断：冷却泵流量不足，导致主轴温度持续升高。",
      recommendation: "检查冷却液液位；确认冷却泵运行状态。",
      confidence: 0.86,
    },
    plan: {
      repair_target: "主轴冷却系统",
      pre_checks: ["确认设备处于安全停机状态"],
      repair_steps: ["执行 LOTO 断电挂牌并等待主轴完全停止"],
      safety: ["执行 LOTO 断电挂牌"],
      post_checks: ["确认设备状态恢复 running/idle 且无新增报警"],
      estimated_time: "60分钟",
      tools: ["红外测温仪"],
      parts: ["CP-TC820-015 冷却泵"],
    },
  });

  assert.equal(summary.symptom, "主轴温度过高（报警 ALM-021）");
  assert.equal(summary.judgment, "冷却泵流量不足，导致主轴温度持续升高。");
  assert.deepEqual(summary.checks, ["确认设备处于安全停机状态"]);
  assert.deepEqual(summary.steps, ["执行断电挂牌并等待主轴完全停止"]);
  assert.deepEqual(summary.safety, ["执行断电挂牌"]);
  assert.deepEqual(summary.recovery, ["确认设备状态恢复运行/待机且无新增报警"]);
  assert.equal(summary.target, "主轴冷却系统");
  assert.equal(summary.uncertainty, "");
});

test("states when the cause cannot be confirmed and keeps fallback guidance readable", () => {
  const summary = buildTechnicianSummary({
    latest: { alarm_code: "ALM-999", summary: "报警已触发", confidence: 0.42 },
    plan: {},
  });

  assert.equal(summary.uncertainty, "暂不能确认唯一原因，需要现场检查");
  assert.equal(summary.judgment, "暂不能确认唯一原因，需要现场检查");
  assert.ok(summary.checks.length > 0);
  assert.ok(summary.safety.every((item) => !item.includes("LOTO")));
});

test("translates machine field names and keeps the judgment short", () => {
  const summary = buildTechnicianSummary({
    latest: {
      alarm_label: "送料机未就绪",
      diagnosis: "根因指向 barfeed_ready_signal 丢失，导致送料机未向 CNC 输出就绪信号。历史趋势显示该信号持续为 0。需要现场检查确认。",
      confidence: 0.82,
    },
  });

  assert.match(summary.judgment, /送料机就绪信号/);
  assert.match(summary.judgment, /数控系统/);
  assert.doesNotMatch(summary.judgment, /barfeed_ready_signal|\bCNC\b/);
  assert.ok(!summary.judgment.includes("需要现场检查确认"));
});
