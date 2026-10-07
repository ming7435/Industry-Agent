import test from "node:test";
import assert from "node:assert/strict";
import * as sheet from "./workorderSheet.mjs";

test("工单顶层报警为空时从真实诊断快照raw识别报警，保留原存储字段", () => {
  assert.equal(typeof sheet.getWorkorderAlarmCode, "function");
  const order = { workorder_id: "WO-B1BAE75E20", device_id: "TRAK-TC820LTYSI-001", alarm_code: "",
    diagnosis_snapshot: { device_id: "TRAK-TC820LTYSI-001", raw: { device_id: "TRAK-TC820LTYSI-001", alarm_code: "700006" } } };
  const before = structuredClone(order);
  assert.equal(sheet.getWorkorderAlarmCode(order), "700006");
  assert.equal(order.alarm_code, "");
  assert.deepEqual(order, before);
});

test("工单已存顶层报警优先，不被其他诊断上下文覆盖", () => {
  assert.equal(typeof sheet.getWorkorderAlarmCode, "function");
  assert.equal(sheet.getWorkorderAlarmCode({ device_id: "D-1", alarm_code: " 700005 ",
    diagnosis_snapshot: { raw: { alarm_code: "700006" } } }), "700005");
});

test("兼容诊断快照顶层、历史诊断上下文和已保存方案诊断，不使用当前采样猜填", () => {
  assert.equal(typeof sheet.getWorkorderAlarmCode, "function");
  for (const [order, expected] of [
    [{ diagnosis_snapshot: { alarm_code: "A-1" } }, "A-1"],
    [{ diagnosis_context: { alarm_code: "A-2" } }, "A-2"],
    [{ diagnosis_context: { raw: { alarm_code: "A-3" } } }, "A-3"],
    [{ maintenance_plan_snapshot: { diagnosis: { raw: { alarm_code: "A-4" } } } }, "A-4"],
    [{ alarm_code: 700006 }, "700006"],
    [{ title: "报警700006", diagnosis_snapshot: { summary: "700006报警" } }, ""],
  ]) assert.equal(sheet.getWorkorderAlarmCode(order), expected);
});

test("跨设备诊断快照和非标量报警不被当成工单报警", () => {
  assert.equal(typeof sheet.getWorkorderAlarmCode, "function");
  for (const order of [
    { device_id: "D-1", diagnosis_snapshot: { device_id: "D-2", raw: { alarm_code: "700006" } } },
    { device_id: "D-1", diagnosis_snapshot: { device_id: "D-1", raw: { device_id: "D-2", alarm_code: "700006" } } },
    { alarm_code: { code: "700006" }, diagnosis_snapshot: { raw: ["700006"] } },
    { alarm_code: true, diagnosis_context: { alarm_code: ["700006"] } },
    { alarm_code: Infinity, diagnosis_snapshot: "700006" },
    null,
  ]) assert.equal(sheet.getWorkorderAlarmCode(order), "");
});
