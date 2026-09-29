from app.agents.diagnosis.dedup import DiagnosisRunCache


def test_missing_event_id_is_never_cached_across_requests():
    cache = DiagnosisRunCache()
    first = {"device_id": "D-1", "alarm_code": "E1"}
    cache.put(first, {"summary": "第一次"})

    assert cache.get(first) is None
    assert len(cache) == 0


def test_cache_is_scoped_by_device_tenant_and_evidence_revision():
    cache = DiagnosisRunCache()
    event = {"event_id": "EVT-1", "event_revision": 2, "device_id": "D-1", "tenant_id": "T-1", "evidence": {"temperature": 42}}
    cache.put(event, {"summary": "旧证据"})

    assert cache.get(event)["summary"] == "旧证据"
    assert cache.get({**event, "device_id": "D-2"}) is None
    assert cache.get({**event, "tenant_id": "T-2"}) is None
    assert cache.get({**event, "evidence": {"temperature": 43}}) is None


def test_review_or_explicit_bypass_does_not_reuse_or_store_result():
    cache = DiagnosisRunCache()
    event = {"event_id": "EVT-REVIEW", "device_id": "D-1"}
    cache.put(event, {"summary": "旧结果"})
    review = {**event, "review": True, "evidence": {"temperature": 50}}

    assert cache.get(review) is None
    cache.put(review, {"summary": "复核结果"})
    assert cache.get(review) is None


def test_transient_diagnosis_failure_is_not_cached():
    from app.agents.diagnosis.agent import DiagnosisAgent
    from app.tools.registry import ToolRegistry

    class BrokenGraph:
        def invoke(self, _state):
            raise TimeoutError("temporary model timeout")

    agent = DiagnosisAgent.__new__(DiagnosisAgent)
    agent.run_cache = DiagnosisRunCache()
    agent.graph = BrokenGraph()
    agent.tools = ToolRegistry()
    agent.client = type("Client", (), {"model": "test-model"})()

    result = agent.run({"event_id": "EVT-TIMEOUT", "device_id": "D-1"})

    assert result.error
    assert len(agent.run_cache) == 0
