"""Construct shared Agent, tool, service, harness, and A2A dependencies."""

from __future__ import annotations

import os

from app.a2a.client import A2AClient
from app.a2a.endpoints import A2AEndpoints
from app.a2a.requests import A2ARequests
from app.agents.diagnosis import DiagnosisAgent
from app.agents.registry import build_agent_registry
from app.closure import ClosureService
from app.harness import AgentHarness, TraceRecorder
from app.memory import ExperienceLearningModule, build_memory_stores
from app.skills import get_skill_registry
from app.tools.registry import ToolRegistry
from app.workorder import WorkOrderService
from app.config import Settings, get_settings

from .operations import RuntimeOperations
from .tracing import NodeTrace
from .capability import build_capability_registry
from .execution import ExecutionManager
from .planner import Planner
from .dispatcher import RuntimeDispatcher
from .coordinator import RuntimeCoordinator


class AgentContainer:
    """Own one orchestrator's shared resources and Agent bindings."""

    def __init__(
        self,
        diagnosis_agent: DiagnosisAgent | None = None,
        tools: ToolRegistry | None = None,
        settings: Settings | None = None,
    ) -> None:
        settings = settings or get_settings()
        registry = tools or ToolRegistry(rag_base_url=settings.rag_service_base_url)
        get_skill_registry().validate_tools(registry.mcp.handlers)
        self.registry = registry
        self.tools = registry
        self.capabilities = build_capability_registry()
        self.trace = TraceRecorder()
        self.execution_manager = ExecutionManager(
            timeout_seconds=settings.agent_timeout_seconds,
            max_retries=settings.agent_max_retries,
            trace=lambda event, payload: self.trace.record(
                type="execution", name="execution", node="runtime", agent="runtime",
                event=event, task_id=str(payload.get("task_id", "")),
                trace_id=str(payload.get("trace_id", "")), state_change=dict(payload),
                keys=list(payload), tool_name="", latency=0.0, error="",
            ),
        )
        self.planner = Planner(
            capabilities=self.capabilities,
            trace=lambda event, payload: self.trace.record(
                type="planner", name="runtime_planner", node="runtime", agent="runtime",
                event=event, task_id=str(payload.get("task_id") or payload.get("context", {}).get("task_id") or ""),
                trace_id=str(payload.get("trace_id") or payload.get("context", {}).get("trace_id") or ""),
                state_change=dict(payload), keys=list(payload), tool_name="", latency=0.0, error="",
            ),
        )
        self.registry.trace = self.trace
        self.a2a = A2AClient(trace=self.trace)
        self.short_memory, self.long_memory = build_memory_stores()
        self.workorder_service = WorkOrderService(registry)
        self.closure_service = ClosureService(trace=self.trace)
        self.experience_module = ExperienceLearningModule(
            self.short_memory,
            self.long_memory,
            registry.rag,
            trace=self.trace,
        )
        self.requests = A2ARequests(self.a2a)

        diagnosis_runtime = diagnosis_agent or DiagnosisAgent(
            tools=registry,
            knowledge_provider=self.requests.request_knowledge_for_diagnosis,
        )
        if getattr(diagnosis_runtime, "knowledge_provider", None) is None:
            diagnosis_runtime.knowledge_provider = self.requests.request_knowledge_for_diagnosis
        if hasattr(diagnosis_runtime.tools, "trace"):
            diagnosis_runtime.tools.trace = self.trace

        self.agents = build_agent_registry(
            tools=registry,
            diagnosis=diagnosis_runtime,
            maintenance_knowledge_provider=self.requests.request_knowledge_for_maintenance,
            maintenance_cad_provider=self.requests.request_cad_for_maintenance,
            workorder_service=self.workorder_service,
            experience_module=self.experience_module,
        )
        self.capabilities.register_agents(self.agents)
        self.harnesses = {
            name: AgentHarness(agent, timeout_seconds=settings.agent_timeout_seconds, max_retries=settings.agent_max_retries, trace=self.trace)
            for name, agent in self.agents.items()
        }
        self.endpoints = A2AEndpoints(self.harnesses)
        self.endpoints.register(self.a2a)
        self.dispatcher = RuntimeDispatcher(
            self.capabilities,
            self.execution_manager,
            trace=self.trace,
            tools=self.registry,
            harnesses=self.harnesses,
        )
        self.coordinator = RuntimeCoordinator(self)
        self.operations = RuntimeOperations(
            self.requests,
            self.closure_service,
            report_harness=self.harnesses.get("report"),
            learning_store_path=os.getenv("LEARNING_RESULT_STORE_PATH", ""),
            trace=self.trace,
        )
        self.tracing = NodeTrace(self.trace)
