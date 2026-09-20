import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.memory import MemoryAgent
from app.experience import ExperienceLearningModule
from app.memory import LongMemoryStore, ShortMemoryStore
from app.rag import RAGIndex, RAGServiceClient


def _agent():
    module = ExperienceLearningModule(ShortMemoryStore(), LongMemoryStore(), RAGServiceClient(fallback=RAGIndex()))
    return MemoryAgent(experience_module=module), module


def test_memory_agent_rejects_unverified_learning():
    agent, _ = _agent()
    result = agent.run({"action": "learn", "workorder": {"workorder_id": "WO-001", "device_id": "CNC-001", "status": "completed"}, "quality": {"passed": False}})
    assert result.success is False
    assert result.validation_findings


def test_memory_agent_rejects_empty_search_before_retrieval():
    agent, _ = _agent()
    result = agent.run({"action": "search"})
    assert result.success is False
    assert "检索条件" in result.validation_findings[0]


def test_memory_agent_learns_only_closed_passed_workorders_and_searches_it():
    agent, _ = _agent()
    learned = agent.run({
        "action": "learn",
        "diagnosis": {"device_id": "CNC-001", "fault": "主轴轴承异常", "alarm_code": "E102"},
        "maintenance_plan": {"repair_steps": ["更换轴承"]},
        "workorder": {"workorder_id": "WO-002", "device_id": "CNC-001", "status": "closed", "title": "主轴轴承维修", "repair_feedback": "已更换并复测"},
        "quality": {"passed": True, "findings": ["报警已清除"]},
    })
    found = agent.run({"action": "search", "device_id": "CNC-001", "alarm_code": "E102"})
    assert learned.success is True
    assert learned.experience["memory_saved"] is True
    assert found.items
    assert found.items[0]["alarm_code"] == "E102"
