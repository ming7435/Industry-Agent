"""Agent-to-Agent 通信契约和本地传输适配。"""

from .client import A2AClient, A2AError
from .registry import CORE_A2A_AGENT_TARGETS
from .models import CADRequest, CADResponse, DiagnosisRequest, DiagnosisResponse, KnowledgeRequest, KnowledgeResponse, MaintenanceRequest, MaintenanceResponse

__all__ = [
    "A2AClient", "A2AError", "CADRequest", "CADResponse", "DiagnosisRequest", "DiagnosisResponse",
    "KnowledgeRequest", "KnowledgeResponse", "MaintenanceRequest", "MaintenanceResponse", "CORE_A2A_AGENT_TARGETS",
]
