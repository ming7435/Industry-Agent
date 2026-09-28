import test from "node:test";
import assert from "node:assert/strict";
import { formatMonitorHealth, isEvidenceUnavailable, monitorEvidenceReason } from "./monitorDisplay.mjs";

test("急停但没有停机前证据时不显示 100 健康度", () => {
  const sample = {
    status: "emergency_stop",
    control_state: "emergency_stop",
    health_score: 100,
    control_reason: "监控确认高级故障",
    fault_evidence: { evidence_status: "unavailable" },
  };

  assert.equal(isEvidenceUnavailable(sample), true);
  assert.equal(formatMonitorHealth(sample), "待复核");
  assert.equal(
    monitorEvidenceReason(sample),
    "监控确认高级故障；停机前未采集到具体报警码或异常指标，健康度不可用",
  );
});

test("有真实健康度时继续显示数值", () => {
  assert.equal(formatMonitorHealth({ status: "running", health_score: 74 }), "74/100");
});
