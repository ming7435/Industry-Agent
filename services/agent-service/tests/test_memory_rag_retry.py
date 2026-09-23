from app.agents.memory.agent import MemoryAgent
from app.memory.service import ExperienceLearningModule
from app.memory.store import LongMemoryStore, ShortMemoryStore


class _RetryRag:
    def __init__(self):
        self.calls = 0

    def upsert(self, record, collection=""):
        self.calls += 1
        return {"success": self.calls > 1, "loaded": 1 if self.calls > 1 else 0}


def test_duplicate_experience_retries_failed_rag_upsert():
    rag = _RetryRag()
    module = ExperienceLearningModule(ShortMemoryStore(), LongMemoryStore(), rag=rag)
    agent = MemoryAgent(experience_module=module)
    request = {
        "action": "learn",
        "workorder": {
            "workorder_id": "WO-RETRY",
            "learning_idempotency_key": "workorder:WO-RETRY",
            "device_id": "D-1",
            "status": "closed",
            "repair_feedback": {"feedback": "replaced bearing"},
        },
        "repair_feedback": {"feedback": "replaced bearing"},
        "diagnosis": {"fault": "bearing fault"},
        "maintenance_plan": {"repair_steps": ["replace bearing"]},
    }

    first = agent.run(request)
    second = agent.run(request)

    assert first.success is True
    assert first.experience["rag_saved"] is False
    assert second.success is True
    assert second.experience["rag_saved"] is True
    assert rag.calls == 2


def test_rag_upsert_requires_unified_pipeline_when_reported():
    from app.memory.writer import ExperienceWriter

    class _PartialRag:
        def upsert(self, record, collection=""):
            return {"success": True, "loaded": 1, "pipeline_ready": False}

    writer = ExperienceWriter(ShortMemoryStore(), LongMemoryStore(), _PartialRag())
    assert writer._upsert_rag({"experience_id": "EXP-PARTIAL"}) is False
