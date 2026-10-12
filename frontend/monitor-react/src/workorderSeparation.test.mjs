import test from "node:test";
import assert from "node:assert/strict";
import { buildMaintenancePlanView, buildRepairCompletionPayload, buildWorkorderSheet, getWorkorderDisplayTitle } from "./workorderSheet.mjs";

test("workorder titles identify the actual machine and current fault", () => {
  const title = getWorkorderDisplayTitle(
    {
      device_id: "ELITE-CS612-ROBOT-001",
      title: "主轴电机组件维修",
      alarm_code: "CTRL-001",
      diagnosis_context: { fault: "控制器通讯异常" },
    },
    { part_name: "主轴电机组件" },
  );

  assert.equal(title, "ELITE ROBOTS CS612 六轴协作机器人 · 控制器通讯异常");
});

test('长篇诊断不能成为工单标题，完整分析与压力数据保留在正文',()=>{
  const narrative='设备 TRAK-TC820LTYSI-001 触发报警 700010「液压压力未达到」，液压总压力 697→567 psi，尾座夹紧压力 694→548 psi，呈典型液压系统整体压力跌落特征。'.repeat(3);
  const order={device_id:'TRAK-TC820LTYSI-001',title:'设备维修工单',alarm_code:'700010',diagnosis_context:{summary:narrative}};
  const original=structuredClone(order);
  const title=getWorkorderDisplayTitle(order,{}, {fault:narrative});
  assert.equal(title,'TRAK TC820LTYsi 车削中心 · 液压压力未达到');
  const sheet=buildWorkorderSheet({order,target:{symptom:'压力下降'},diagnosis:{summary:narrative}});
  assert.equal(sheet.faultAnalysis,narrative);
  assert.deepEqual(order,original);
});

test('原标题包含读数而诊断摘要较短时，缩标题仍完整保留原始故障记录',()=>{
  const narrative='设备触发报警 700010「液压压力未达到」，现场测得 0.42 MPa，设定范围 0.60–0.80 MPa。'.repeat(3);
  const order={device_id:'TRAK-TC820LTYSI-001',title:narrative,alarm_code:'700010',diagnosis_context:{summary:'液压压力异常'}};
  const sheet=buildWorkorderSheet({order,target:{symptom:'液压压力低于设定值。'},diagnosis:{summary:'液压压力异常'}});
  assert.ok(sheet.title.length<=80);
  assert.ok(sheet.faultAnalysis.includes(narrative));
  assert.ok(sheet.faultAnalysis.includes('液压压力异常'));
  assert.equal(order.title,narrative);
});

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

test("frontend hides raw OCR evidence from the repair step list", () => {
  const rawOcr = "本地OCR识别结果（第43页）：触发条件 编码器丢失原点 POSITIONINGERROR ENCODERLOST steps.action";
  const plan = buildMaintenancePlanView({
    plan: { repair_steps: [rawOcr, "检查冷却液液位"] },
  });

  assert.deepEqual(plan.steps, ["检查冷却液液位"]);
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
  });
  assert.equal('repair_verification' in payload, false);
  assert.equal('maintenance_confirmed_by' in payload, false);
});
