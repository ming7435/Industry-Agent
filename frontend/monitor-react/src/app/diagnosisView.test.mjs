import test from "node:test";
import assert from "node:assert/strict";
import { buildDiagnosisView } from "./diagnosisView.mjs";

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
