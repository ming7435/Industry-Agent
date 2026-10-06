import test from "node:test";
import assert from "node:assert/strict";
import { buildKnowledgeContext } from "./knowledgeScope.mjs";

test("knowledge context forces document retrieval and scopes an active alarm machine", () => {
  const context = buildKnowledgeContext(
    { device_id: "MACHINE-001", status: "running", alarm_code: "" },
    {
      device_id: "MACHINE-001",
      latest_result: {
        current_sample: {
          device_id: "MACHINE-001",
          status: "alarm",
          alarm_code: "ALM-001",
          alarm_label: "主轴温度过高",
        },
      },
    },
  );

  assert.equal(context.required_capabilities, undefined);
  assert.equal(context.alarm_active, true);
  assert.equal(context.device_id, "MACHINE-001");
  assert.equal(context.alarm_code, "ALM-001");
});

test("knowledge context keeps all-document retrieval when no active alarm exists", () => {
  const context = buildKnowledgeContext(
    { device_id: "MACHINE-001", status: "running", alarm_code: "" },
    { device_id: "MACHINE-001" },
  );

  assert.deepEqual(context, {
    alarm_active: false,
  });
});
