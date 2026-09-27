import test from "node:test";
import assert from "node:assert/strict";
import { buildMaintenancePlanView, buildRepairCompletionPayload, buildWorkorderSheet } from "./workorderSheet.mjs";

test("frontend separates maintenance plan fields from the WorkOrder sheet", () => {
  const order = {
    workorder_id: "WO-1",
    device_id: "MACHINE-1",
    assignee: "张工",
    status: "open",
    title: "冷却泵维修",
    repair_target: { part_name: "冷却泵", part_no: "CP-1", location: "后侧" },
    maintenance_plan_snapshot: {
      plan_id: "PLAN-1",
      repair_steps: ["检查过滤器"],
      tools: ["万用表"],
      parts: ["CP-1"],
      evidence: [{ type: "knowledge", title: "SOP" }],
    },
  };

  const sheet = buildWorkorderSheet({ order, target: order.repair_target });
  const plan = buildMaintenancePlanView({ order });

  assert.equal(sheet.workorderId, "WO-1");
  assert.equal(sheet.assignee, "张工");
  assert.equal("steps" in sheet, false);
  assert.equal("tools" in sheet, false);
  assert.equal("parts" in sheet, false);
  assert.equal("safety" in sheet, false);
  assert.equal("evidence" in sheet, false);
  assert.equal(plan.planId, "PLAN-1");
  assert.deepEqual(plan.steps, ["检查过滤器"]);
  assert.deepEqual(plan.tools, ["万用表"]);
  assert.deepEqual(plan.parts, ["CP-1"]);
  assert.equal(plan.evidence[0].title, "SOP");
  assert.equal(plan.source, "legacy-workorder-snapshot");
});

test("frontend removes embedded model JSON and retrieval table fragments", () => {
  const rawDiagnosis = "分析过程\n\n```json\n{\"summary\":\"主轴温度异常\",\"diagnosis\":\"优先检查冷却系统\",\"recommendation\":\"停机检查冷却泵\"}\n```";
  const plan = buildMaintenancePlanView({
    order: {
      workorder_id: "WO-2",
      title: rawDiagnosis,
      maintenance_plan_snapshot: {
        diagnosis: { fault: rawDiagnosis },
        repair_steps: ["检查冷却泵", "[table | 第4页 | p4-table1-part2]\\n表格行1: 700032"],
      },
    },
  });
  const sheet = buildWorkorderSheet({ order: { workorder_id: "WO-2", title: rawDiagnosis }, target: { part_name: "冷却泵" } });
  assert.equal(plan.diagnosis.fault, "主轴温度异常");
  assert.equal(plan.diagnosis.cause, "优先检查冷却系统");
  assert.deepEqual(plan.steps, ["检查冷却泵"]);
  assert.equal(sheet.title, "冷却泵维修");
});

test("repair completion sends a verified lifecycle action instead of a generic update", () => {
  const payload = buildRepairCompletionPayload({
    feedback: "更换冷却泵并复测正常",
    operator: "维修一组",
    deviceId: "MACHINE-1",
  });

  assert.equal(payload.action, "mark_repair_completed");
  assert.deepEqual(payload.repair_feedback, {
    feedback: "更换冷却泵并复测正常",
    operator: "维修一组",
  });
  assert.equal(payload.repair_verification.passed, true);
  assert.equal(payload.repair_verification.device_id, "MACHINE-1");
  assert.equal(typeof payload.repair_verification.verified_at, "string");
});
