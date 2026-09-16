"""面向工业设备的各类智能体。"""

from .cad import CADAgent
from .diagnosis import DiagnosisAgent
from .knowledge import KnowledgeAgent
from .maintenance import MaintenanceAgent
from .quality import QualityAgent
from .report import ReportAgent
from .router import RouterAgent

CORE_AGENT_NAMES = ("router", "diagnosis", "knowledge", "cad", "maintenance", "quality", "report")

__all__ = [
    "CADAgent",
    "DiagnosisAgent",
    "KnowledgeAgent",
    "MaintenanceAgent",
    "QualityAgent",
    "ReportAgent",
    "RouterAgent",
    "CORE_AGENT_NAMES",
]
