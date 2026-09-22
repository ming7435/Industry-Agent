import test from "node:test";
import assert from "node:assert/strict";

import { buildAgentFlow } from "../src/agentFlow.mjs";

test("builds the nine core agents from the latest trace", () => {
  const flow = buildAgentFlow({
    diagnosis: {
      pending: 0,
      latest: { status: "completed" },
      pipeline: {
        task_id: "TASK-1",
        trace: [
          { task_id: "TASK-1", type: "node", name: "route", event: "node_completed", agent: "router" },
          { task_id: "TASK-1", type: "agent", name: "DiagnosisAgent", event: "agent_completed", agent: "DiagnosisAgent" },
          { task_id: "TASK-1", type: "agent", name: "knowledge", event: "agent_completed", agent: "knowledge" },
          { task_id: "TASK-1", type: "agent", name: "cad", event: "agent_completed", agent: "cad" },
          { task_id: "TASK-1", type: "agent", name: "maintenance", event: "agent_completed", agent: "maintenance" },
          { task_id: "TASK-1", type: "agent", name: "workorder", event: "agent_completed", agent: "workorder" },
          { task_id: "TASK-1", type: "agent", name: "report", event: "agent_completed", agent: "report" },
          { task_id: "TASK-1", type: "agent", name: "memory", event: "agent_completed", agent: "memory" },
        ],
        quality: {},
        report: { status: "completed" },
      },
    },
  });

  assert.deepEqual(flow.map((item) => item.id), [
    "router", "diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory",
  ]);
  assert.equal(flow.find((item) => item.id === "report").status, "completed");
  assert.equal(flow.find((item) => item.id === "quality").status, "waiting");
});

test("marks an active agent as running and keeps missing trace idle", () => {
  const flow = buildAgentFlow({
    diagnosis: {
      pending: 1,
      latest: { status: "running" },
      pipeline: {
        task_id: "TASK-2",
        trace: [{ task_id: "TASK-2", type: "node", name: "diagnosis", event: "node_started", agent: "diagnosis" }],
      },
    },
  });

  assert.equal(flow.find((item) => item.id === "diagnosis").status, "running");
  assert.equal(flow.find((item) => item.id === "report").status, "waiting");
});

test("does not overwrite a completed latest run when another task is pending", () => {
  const flow = buildAgentFlow({
    diagnosis: {
      pending: 1,
      latest: { status: "completed" },
      pipeline: {
        task_id: "TASK-3",
        trace: [
          { task_id: "TASK-3", type: "node", name: "diagnosis", event: "node_completed", agent: "diagnosis" },
          { task_id: "TASK-3", type: "node", name: "workorder", event: "node_completed", agent: "workorder" },
          { task_id: "TASK-3", type: "node", name: "report", event: "node_completed", agent: "report" },
          { type: "agent", name: "quality", event: "agent_completed", agent: "quality" },
        ],
        quality: { stale: true },
      },
    },
  });

  assert.equal(flow.find((item) => item.id === "diagnosis").status, "completed");
  assert.equal(flow.find((item) => item.id === "quality").status, "waiting");
  assert.equal(flow.find((item) => item.id === "report").status, "completed");
});
