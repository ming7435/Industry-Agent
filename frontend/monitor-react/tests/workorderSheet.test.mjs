import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkorderSheet } from "../src/workorderSheet.mjs";

test("builds the automatic workorder sheet without exposing internal fields", () => {
  const sheet = buildWorkorderSheet({
    order: {
      workorder_id: "WO-001",
      title: "冷却泵过载维修",
      device_id: "TRAK-TC820LTYSI-001",
      assignee: "维修一组",
      status: "open",
      steps: ["停机、断电并执行挂牌上锁", "检查冷却液液位"],
      source: "agent",
    },
    target: {
      part_name: "冷却泵",
      part_no: "CP-TC820-015",
      system: "冷却系统",
      location: "机床后侧冷却单元",
      symptom: "冷却泵电机过载，冷却流量可能下降",
    },
    plan: {
      tools: ["万用表"],
      parts: ["CP-TC820-015 冷却泵"],
      safety: ["执行 LOTO 断电挂牌"],
    },
  });

  assert.equal(sheet.workorderId, "WO-001");
  assert.equal(sheet.partName, "冷却泵");
  assert.equal(sheet.faultSymptom, "冷却泵电机过载，冷却流量可能下降");
  assert.deepEqual(sheet.steps, ["停机、断电并执行挂牌上锁", "检查冷却液液位"]);
  assert.deepEqual(sheet.tools, ["万用表"]);
  assert.deepEqual(sheet.parts, ["CP-TC820-015 冷却泵"]);
  assert.deepEqual(sheet.safety, ["执行断电挂牌"]);
  assert.equal(sheet.autoDispatched, true);
  assert.equal(Object.hasOwn(sheet, "planId"), false);
});
