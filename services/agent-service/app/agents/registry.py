"""最终 Agent Registry：只注册七个核心 Agent。"""

from __future__ import annotations

from typing import Any

from .cad import CADAgent
from .diagnosis import DiagnosisAgent
from .knowledge import KnowledgeAgent
from .maintenance import MaintenanceAgent
from .quality import QualityAgent
from .report import ReportAgent
from .router import RouterAgent


CORE_AGENT_REGISTRY = {
    "router": RouterAgent,
    "diagnosis": DiagnosisAgent,
    "knowledge": KnowledgeAgent,
    "cad": CADAgent,
    "maintenance": MaintenanceAgent,
    "quality": QualityAgent,
    "report": ReportAgent,
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
        "quality": QualityAgent(dependencies["tools"]),
        "report": ReportAgent(),
    }
