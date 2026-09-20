"""最终 Agent Registry：注册九个核心 Agent。"""

from __future__ import annotations

from typing import Any

from .cad import CADAgent
from .diagnosis import DiagnosisAgent
from .knowledge import KnowledgeAgent
from .maintenance import MaintenanceAgent
from .memory import MemoryAgent
from .quality import QualityAgent
from .report import ReportAgent
from .router import RouterAgent
from .workorder import WorkOrderAgent


CORE_AGENT_REGISTRY = {
    "router": RouterAgent,
    "diagnosis": DiagnosisAgent,
    "knowledge": KnowledgeAgent,
    "cad": CADAgent,
    "maintenance": MaintenanceAgent,
    "workorder": WorkOrderAgent,
    "quality": QualityAgent,
    "report": ReportAgent,
    "memory": MemoryAgent,
}


def build_agent_registry(**dependencies: Any) -> dict[str, Any]:
    """按核心 Agent 名称构造实例，依赖由编排层注入。"""

    return {
        "router": RouterAgent(),
        "diagnosis": dependencies.get("diagnosis") or DiagnosisAgent(),
        "knowledge": KnowledgeAgent(dependencies["tools"]),
        "cad": CADAgent(dependencies["tools"]),
        "maintenance": MaintenanceAgent(
            dependencies["tools"],
            knowledge_provider=dependencies.get("maintenance_knowledge_provider"),
            cad_provider=dependencies.get("maintenance_cad_provider"),
        ),
        "workorder": WorkOrderAgent(
            dependencies["tools"],
            service=dependencies.get("workorder_service"),
        ),
        "quality": QualityAgent(dependencies["tools"]),
        "report": ReportAgent(dependencies["tools"]),
        "memory": MemoryAgent(
            experience_module=dependencies.get("experience_module"),
            tools=dependencies["tools"],
        ),
    }
