"""诊断完成后立即可读，后续流程未结束也不丢失真实结论。"""
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app, event_result_key
from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.planner import Plan
from app.runtime.event_store import EventResultStore

EVENT = {'tenant_id':'tenant-a','event_id':'stage-event','device_id':'D-1','event_revision':2,'alarm_code':'700004'}
DIAGNOSIS = {'status':'completed','summary':'开门互锁未满足','confidence':0.9,'maintenance_required':True,
             'evidence':['当前设备报警定义'], 'device_id':'D-1','alarm_code':'700004'}


def test_stage_store_is_scoped_and_final_result_has_priority(monkeypatch):
    monkeypatch.delenv('EVENT_STORE_PATH', raising=False)
    store = EventResultStore()
    key = event_result_key(EVENT)
    store.record_stage(EVENT, {'status':'running','diagnosis':DIAGNOSIS})
    assert store.get_stage(key)['diagnosis']['summary'] == '开门互锁未满足'
    for change in ({'device_id':'D-2'},{'event_revision':1},{'tenant_id':'tenant-b'}):
        assert store.get_stage(event_result_key({**EVENT, **change})) is None
    assert store.get_result(key) is None
    store.get_or_create(key, lambda: {'status':'blocked','diagnosis':DIAGNOSIS})
    assert store.get_result(key)['status'] == 'blocked'


def test_real_coordinator_publishes_diagnosis_before_downstream_returns(monkeypatch):
    monkeypatch.delenv('AGENT_API_TOKEN', raising=False)
    monkeypatch.delenv('EVENT_STORE_PATH', raising=False)
    downstream_started, finish = Event(), Event()

    class Dispatcher:
        def dispatch(self, action, state):
            if action.required_capability == 'fault_analysis':
                return AgentResult(success=True, output=DIAGNOSIS, evidence=[{'id':'alarm'}])
            downstream_started.set()
            assert finish.wait(3), '测试后续动作必须被及时释放'
            return AgentResult(success=True, output={'status':'completed','documents':[{'id':'doc'}]}, evidence=[{'id':'doc'}])

    class Planner:
        def plan(self, goal, context):
            return Plan(goal=goal, actions=[ActionModel.agent('diagnosis', {'required_capability':'fault_analysis'}),
                                           ActionModel.agent('knowledge', {'required_capability':'document_search'})])

    class Runtime:
        def __init__(self):
            self.container = SimpleNamespace(planner=Planner(), dispatcher=Dispatcher(), trace=TraceRecorder(),
                                             execution_manager=SimpleNamespace(timeout_seconds=4))
        def run_abnormal_event(self, event):
            return RuntimeCoordinator(self.container).run({'entry':'trigger','event':event,'task_id':'stage-task','trace_id':'stage-trace'})

    with TestClient(create_app(Runtime())) as client, ThreadPoolExecutor(max_workers=1) as worker:
        posted = worker.submit(client.post, '/api/v1/agent/event', json={'event':EVENT})
        try:
            assert downstream_started.wait(2)
            response = client.get('/api/v1/agent/event/stage-event/result',
                                  params={'tenant_id':'tenant-a','device_id':'D-1','event_revision':2})
            assert response.status_code == 200
            assert response.json()['status'] == 'in_progress'
            assert response.json()['result']['diagnosis']['summary'] == '开门互锁未满足'
            assert not posted.done()
            assert client.get('/api/v1/agent/event/stage-event/result',
                params={'tenant_id':'tenant-b','device_id':'D-1','event_revision':2}).status_code == 202
        finally:
            finish.set()
        assert posted.result(timeout=3).status_code == 200
        final = client.get('/api/v1/agent/event/stage-event/result',
            params={'tenant_id':'tenant-a','device_id':'D-1','event_revision':2}).json()
        assert final['status'] == 'available'
