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
                "repair_verification": {
                    "passed": True, "status": "verified", "source": "device_recovery",
                    "device_recovery": {"device_id": "D-1", "status": "running", "metrics": {"vibration": 0.2}, "checked_at": "2026-09-28T12:00:00Z"},
                    "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
                },
        },
        "repair_feedback": {"feedback": "replaced bearing", "verification": {
            "passed": True, "status": "verified", "source": "device_recovery",
                "device_recovery": {"device_id": "D-1", "status": "running", "metrics": {"vibration": 0.2}, "checked_at": "2026-09-28T12:00:00Z"},
            "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
        }},
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


def test_sync_reuses_authoritative_saved_experience_and_rejects_unadmitted_input():
    store = LongMemoryStore()
    rag = _RetryRag()
    agent = MemoryAgent(ExperienceLearningModule(ShortMemoryStore(), store, rag=rag))
    rejected = agent.run({'action': 'sync', 'experience': {'experience_id': 'UNSAVED',
        'validation_status': 'accepted', 'experience_quality_score': 1, 'content': '编造经验'}})
    assert not rejected.success and rag.calls == 0
    store.save({'experience_id': 'EXP-VERIFIED', 'validation_status': 'accepted', 'experience_quality_score': .95,
                'source_workorder': 'WO-VERIFIED', 'device_id': 'M1', 'content': '真实维修记录'})
    request = {'action': 'sync', 'experience': {'experience_id': 'EXP-VERIFIED', 'content': '伪造操作'}}
    first = agent.run(request)
    second = agent.run(request)
    assert first.success and not first.experience['rag_saved']
    assert second.success and second.experience['rag_saved']
    assert second.experience['content'] == '真实维修记录' and len(store.search()) == 1
    assert agent.run(request).experience['rag_saved'] and rag.calls == 2
