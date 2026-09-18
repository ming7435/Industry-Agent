"""Agent-to-Agent 通信契约和本地传输适配。"""

from .client import A2AClient, A2AError
from .registry import ALLOWED_A2A_ROUTES, CORE_A2A_AGENT_TARGETS, is_allowed_a2a_route
from .models import (
    A2ARequest, A2AResponse, CADRequest, CADResponse, DiagnosisRequest, DiagnosisResponse,
    KnowledgeRequest, KnowledgeResponse, MaintenanceRequest, MaintenanceResponse,
    QualityRequest, QualityResponse,
)

__all__ = [
    "A2AClient", "A2AError", "A2ARequest", "A2AResponse", "CADRequest", "CADResponse",
    "DiagnosisRequest", "DiagnosisResponse", "KnowledgeRequest", "KnowledgeResponse",
    "MaintenanceRequest", "MaintenanceResponse", "QualityRequest", "QualityResponse",
    "ALLOWED_A2A_ROUTES", "CORE_A2A_AGENT_TARGETS", "is_allowed_a2a_route",
]
