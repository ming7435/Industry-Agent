"""面向工业设备的各类智能体。"""

from .cad import CADAgent
from .diagnosis import DiagnosisAgent
from .knowledge import KnowledgeAgent
from .maintenance import MaintenanceAgent
from .memory import MemoryAgent
from .quality import QualityAgent
from .report import ReportAgent
from .router import RouterAgent
from .workorder import WorkOrderAgent

CORE_AGENT_NAMES = ("router", "diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory")

__all__ = [
    "CADAgent",
    "DiagnosisAgent",
    "KnowledgeAgent",
    "MaintenanceAgent",
    "MemoryAgent",
    "QualityAgent",
    "ReportAgent",
    "RouterAgent",
    "WorkOrderAgent",
    "CORE_AGENT_NAMES",
]
