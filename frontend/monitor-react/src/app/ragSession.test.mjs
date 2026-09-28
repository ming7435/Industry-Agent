import test from "node:test";
import assert from "node:assert/strict";
import { needsRagAnswerRefresh } from "./ragSession.mjs";

test("历史问答只有检索摘要时需要重新生成正文", () => {
  assert.equal(needsRagAnswerRefresh({ answer: { knowledge: { summary: "检索到 3 条相关知识证据：主轴手册。" } } }), true);
  assert.equal(needsRagAnswerRefresh({ answer: { knowledge: { answer: "检查冷却系统。" } } }), false);
  assert.equal(needsRagAnswerRefresh({ answer: { knowledge: { summary: "检索完成" } } }), false);
});
