"""面向工业设备的各类智能体。"""

from .cad import CADAgent
from .diagnosis import DiagnosisAgent
from .experience import ExperienceAgent
from .knowledge import KnowledgeAgent
from .maintenance import MaintenanceAgent
from .quality import QualityAgent
from .report import ReportAgent
from .router import RouterAgent
from .workorder import WorkOrderAgent

__all__ = [
    "CADAgent",
    "DiagnosisAgent",
    "ExperienceAgent",
    "KnowledgeAgent",
    "MaintenanceAgent",
    "QualityAgent",
    "ReportAgent",
    "RouterAgent",
    "WorkOrderAgent",
]
