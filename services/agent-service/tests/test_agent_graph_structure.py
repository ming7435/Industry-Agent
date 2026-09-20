from __future__ import annotations

import sys
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.cad import CADAgent
from app.agents.diagnosis import DiagnosisAgent
from app.agents.knowledge import KnowledgeAgent
from app.agents.maintenance import MaintenanceAgent
from app.agents.quality import QualityAgent
from app.agents.report import ReportAgent
from app.agents.router import RouterAgent
from app.agents.memory import MemoryAgent
from app.agents.workorder import WorkOrderAgent
from app.tools.registry import ToolRegistry


def test_every_core_agent_uses_a_dedicated_langgraph_module() -> None:
    agents = [
        RouterAgent(),
        DiagnosisAgent(),
        KnowledgeAgent(ToolRegistry()),
        CADAgent(ToolRegistry()),
        MaintenanceAgent(ToolRegistry()),
        QualityAgent(ToolRegistry()),
        ReportAgent(ToolRegistry()),
        WorkOrderAgent(ToolRegistry()),
        MemoryAgent(tools=ToolRegistry()),
    ]

    for agent in agents:
        graph = agent.graph.get_graph()
        assert graph.nodes
        assert "__start__" in graph.nodes
        assert "__end__" in graph.nodes


def test_router_graph_keeps_documented_nodes() -> None:
    node_names = set(RouterAgent().graph.get_graph().nodes)
    assert {
        "initialize",
        "load_skill",
        "classify_intent",
        "extract_entities",
        "validate_route",
        "final",
        "fallback",
    }.issubset(node_names)


def test_memory_graph_validates_search_before_retrieval() -> None:
    node_names = set(MemoryAgent(tools=ToolRegistry()).graph.get_graph().nodes)
    assert {"load_skill", "validate_search", "retrieve_memory", "dedup", "rerank", "validate", "final", "fallback"} <= node_names
