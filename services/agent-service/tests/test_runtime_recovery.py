from concurrent.futures import ThreadPoolExecutor
from threading import Event
from types import SimpleNamespace

import pytest

from app.runtime.durable_store import DurableJsonStore
from app.runtime.recovery import RecoveryManager, RecoveryConflict
from app.runtime.action import ActionModel
from app.runtime.planner import Plan
from app.runtime.coordinator import RuntimeCoordinator
from app.agents.base import AgentResult
from app.harness import TraceRecorder


def snapshot():
    actions = [ActionModel.agent('knowledge', {'required_capability': 'document_search'}),
               ActionModel.agent('cad', {'required_capability': 'drawing_search'})]
    return {'task_id': 'TASK-RECOVERY', 'trace_id': 'TRACE-RECOVERY', 'entry': 'user',
            'user_text': '查询设备资料', 'runtime_plan': Plan(goal='查询资料', actions=actions).as_dict(),
            'runtime_next_index': 1, 'next_action': actions[1].as_dict(),
            'completed_steps': [{'agent': 'knowledge', 'action_id': actions[0].action_id}],
            'knowledge': {'documents': [{'id': 'saved-document'}]}}


def test_checkpoint_survives_new_manager_and_hides_inputs(tmp_path):
    path = str(tmp_path / 'recovery.sqlite3')
    first = RecoveryManager(DurableJsonStore(path))
    saved = first.checkpoint(snapshot(), 'failed', error='CAD disconnected')
    second = RecoveryManager(DurableJsonStore(path))
    assert second.get(saved['recovery_id'])['state']['knowledge']['documents'][0]['id'] == 'saved-document'
    summary = second.list()[0]
    assert summary['failed_agent'] == 'cad'
    assert summary['completed_steps'][0]['agent'] == 'knowledge'
    assert 'state' not in summary and 'runtime_plan' not in summary


def test_replayed_resume_request_returns_receipt_without_rerunning(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    saved = manager.checkpoint(snapshot(), 'failed')
    calls = []
    def resume(record):
        calls.append(record['state']['runtime_next_index'])
        return {**record['state'], 'runtime_result': {'status': 'completed'}, 'runtime_next_index': 2}
    first = manager.resume(saved['recovery_id'], 'request-1', resume)
    second = manager.resume(saved['recovery_id'], 'request-1', resume)
    assert first == second
    assert first['status'] == 'completed'
    assert calls == [1]


def test_concurrent_distinct_requests_have_one_resume_owner(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    saved = manager.checkpoint(snapshot(), 'failed')
    entered, release = Event(), Event()
    calls = []
    def resume(record):
        calls.append(1); entered.set(); release.wait(3)
        return {**record['state'], 'runtime_result': {'status': 'completed'}}
    with ThreadPoolExecutor(2) as pool:
        first = pool.submit(manager.resume, saved['recovery_id'], 'one', resume)
        assert entered.wait(2)
        with pytest.raises(RecoveryConflict):
            manager.resume(saved['recovery_id'], 'two', resume)
        release.set()
        assert first.result()['status'] == 'completed'
    assert calls == [1]


def test_live_running_task_cannot_be_resumed(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    saved = manager.checkpoint(snapshot(), 'running')
    with pytest.raises(RecoveryConflict):
        manager.resume(saved['recovery_id'], 'one', lambda record: pytest.fail('running task replayed'))


def test_other_live_instance_cannot_resume_running_task(tmp_path):
    store = DurableJsonStore(str(tmp_path / 'r.sqlite3'))
    first, second = RecoveryManager(store), RecoveryManager(store)
    saved = first.checkpoint(snapshot(), 'running')
    with pytest.raises(RecoveryConflict):
        second.resume(saved['recovery_id'], 'one', lambda record: pytest.fail('live peer replayed'))


def test_expired_owner_can_be_recovered(tmp_path):
    store = DurableJsonStore(str(tmp_path / 'r.sqlite3'))
    first, second = RecoveryManager(store), RecoveryManager(store)
    saved = first.checkpoint(snapshot(), 'running')
    first.close()
    assert second.resume(saved['recovery_id'], 'one', lambda record: {
        **record['state'], 'runtime_result': {'status': 'completed'}})['status'] == 'completed'


def test_old_recovery_callback_cannot_mark_new_owner_blocked(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    saved = manager.checkpoint(snapshot(), 'failed')
    def callback(record):
        manager.checkpoint({**record['state'], 'runtime_recovery_epoch': 2}, 'running')
        return {**record['state'], 'runtime_result': {'status': 'completed'}}
    with pytest.raises(RecoveryConflict):
        manager.resume(saved['recovery_id'], 'one', callback)
    assert manager.get(saved['recovery_id'])['status'] == 'running'


def test_incomplete_checkpoint_cannot_be_claimed_while_original_callback_is_active(tmp_path):
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'r.sqlite3')))
    with manager.execution_scope('TASK-RECOVERY'):
        saved=manager.checkpoint(snapshot(),'blocked')
        with pytest.raises(RecoveryConflict):
            manager.resume(saved['recovery_id'],'one',lambda record: pytest.fail('callback overlapped'))
    assert manager.summary(manager.get(saved['recovery_id']))['can_resume'] is True


def test_same_event_retry_finds_original_checkpoint_and_rejects_changed_parameters(tmp_path):
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'r.sqlite3')))
    event={'event_id':'E','device_id':'D','event_revision':1}
    saved=manager.checkpoint({**snapshot(),'entry':'trigger','event':event},'failed')
    assert manager.for_event(event)['recovery_id']==saved['recovery_id']
    with pytest.raises(RecoveryConflict):
        manager.for_event({**event,'alarm_code':'changed'})


def test_failed_domain_evidence_is_rechecked_before_later_actions(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    calls = []
    actions = [ActionModel.agent('knowledge', {'required_capability': 'document_search'}),
               ActionModel.agent('report', {'required_capability': 'case_reporting'})]
    class Dispatcher:
        def dispatch(self, action, state):
            calls.append(action.target)
            if calls == ['knowledge']:
                return AgentResult(success=True, output={'status': 'insufficient_evidence'})
            return AgentResult(success=True, output={'status': 'completed', 'documents': [{'id': 'DOC'}]})
    coordinator = RuntimeCoordinator(SimpleNamespace(planner=SimpleNamespace(plan=lambda *args: Plan(goal='查询', actions=actions)),
        dispatcher=Dispatcher(), trace=TraceRecorder(), recovery=manager))
    first = coordinator.run({'entry': 'user', 'user_text': '查询', 'task_id': 'TASK-GATE'})
    assert first['runtime_result']['status'] == 'blocked'
    assert first['completed_steps'] == []
    assert first['runtime_next_index'] == 0
    resumed = manager.resume(manager.identifier('TASK-GATE'), 'one', coordinator.resume_failed)
    assert resumed['status'] == 'completed'
    assert calls == ['knowledge', 'knowledge', 'report']


def test_resumed_agent_suggestions_cannot_reintroduce_completed_actions(tmp_path):
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'r.sqlite3')))
    calls=[];plans=[]
    actions=[ActionModel.agent('knowledge',{'required_capability':'document_search'}),
             ActionModel.agent('cad',{'required_capability':'drawing_search'}),
             ActionModel.agent('report',{'required_capability':'case_reporting'})]
    def plan(*args):
        plans.append(1);return Plan(goal='查询',actions=actions)
    class Dispatcher:
        def dispatch(self, action, state):
            calls.append(action.target)
            if action.target=='cad' and calls.count('cad')==1:
                return AgentResult(success=False,output={'error':'disconnected'})
            return AgentResult(success=True,output={'status':'completed','documents':[{'id':'D'}],'components':[{'id':'P'}]},
                next_actions=[{'required_capability':'document_search'}] if action.target=='cad' else [])
    coordinator=RuntimeCoordinator(SimpleNamespace(recovery=manager,trace=TraceRecorder(),dispatcher=Dispatcher(),
        planner=SimpleNamespace(plan=plan)))
    coordinator.run({'task_id':'TASK-FROZEN','entry':'user','user_text':'查询'})
    assert manager.resume(manager.identifier('TASK-FROZEN'),'one',coordinator.resume_failed)['status']=='completed'
    assert calls==['knowledge','cad','cad','report'] and len(plans)==1


def test_second_failure_moves_checkpoint_forward_without_replaying_recovered_action(tmp_path):
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'r.sqlite3')));calls=[]
    actions=[ActionModel.agent('knowledge',{'required_capability':'document_search'}),
             ActionModel.agent('cad',{'required_capability':'drawing_search'}),
             ActionModel.agent('report',{'required_capability':'case_reporting'})]
    class Dispatcher:
        def dispatch(self,action,state):
            calls.append(action.target)
            if action.target in {'cad','report'} and calls.count(action.target)==1:
                return AgentResult(success=False,output={'error':'disconnected'})
            return AgentResult(success=True,output={'status':'completed','documents':[{'id':'D'}],'components':[{'id':'P'}]})
    coordinator=RuntimeCoordinator(SimpleNamespace(recovery=manager,trace=TraceRecorder(),dispatcher=Dispatcher(),
        planner=SimpleNamespace(plan=lambda *args:Plan(goal='查询',actions=actions))))
    coordinator.run({'task_id':'TASK-SECOND-FAILURE','entry':'user','user_text':'查询'})
    identity=manager.identifier('TASK-SECOND-FAILURE')
    assert manager.resume(identity,'one',coordinator.resume_failed)['status']=='failed'
    assert manager.get(identity)['state']['runtime_next_index']==2
    assert manager.resume(identity,'two',coordinator.resume_failed)['status']=='completed'
    assert calls==['knowledge','cad','cad','report','report']


def test_recovery_does_not_reuse_failed_diagnosis_knowledge_cache():
    from app.runtime.dispatcher import RuntimeDispatcher
    from app.runtime.execution import ExecutionManager
    from app.runtime.capability import build_capability_registry
    calls=[]
    class Knowledge:
        name='knowledge'
        capabilities=('document_search',)
        def run(self, task):
            calls.append(task['query'])
            return AgentResult(success=True,output={'status':'completed','documents':[{'id':'FRESH'}]})
    registry=build_capability_registry();registry.register_agent(Knowledge())
    dispatcher=RuntimeDispatcher(registry,ExecutionManager())
    action=ActionModel.agent('knowledge',{'required_capability':'document_search'})
    state={'user_text':'bearing','diagnosis':{'tool_calls':[{'name':'search_knowledge',
        'arguments':{'query':'bearing'},'result':{'success':True,'status':'blocked','documents':[{'id':'OLD'}]}}]},
        'runtime_recovery':True,'runtime_failed_action_id':action.action_id}
    result=dispatcher.dispatch(action,state)
    assert result.output['documents'][0]['id']=='FRESH'
    assert calls==['bearing']


def test_failed_diagnosis_recovery_bypasses_old_domain_cache_only_for_failed_action():
    from app.runtime.dispatcher import RuntimeDispatcher
    from app.agents.diagnosis.dedup import DiagnosisRunCache
    action=ActionModel.agent('diagnosis',{'required_capability':'fault_analysis'})
    event={'event_id':'E','device_id':'D','alarm_code':'A'}
    cache=DiagnosisRunCache();cache.put(event,{'status':'insufficient_evidence'})
    state={'event':event,'runtime_recovery':True,'runtime_failed_action_id':action.action_id,'next_action':action.as_dict()}
    task=RuntimeDispatcher._task_for_agent('fault_analysis',state,action.payload)
    assert cache.get(task) is None and task['review'] is True
    assert 'review' not in event
    later=RuntimeDispatcher._task_for_agent('fault_analysis',{**state,'next_action':{'action_id':'later'}},action.payload)
    assert 'review' not in later


def test_exception_after_skipped_action_keeps_actual_failed_index(tmp_path, monkeypatch):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    calls = []
    actions = [ActionModel.agent('cad', {'required_capability': 'drawing_search'}),
               ActionModel.agent('report', {'required_capability': 'case_reporting'})]
    class Dispatcher:
        def dispatch(self, action, state):
            calls.append(action.target)
            return AgentResult(success=len(calls) > 1, output={'status': 'completed', 'error': 'connection failed'})
    coordinator = RuntimeCoordinator(SimpleNamespace(planner=SimpleNamespace(plan=lambda *args: Plan(goal='查询', actions=actions)),
        dispatcher=Dispatcher(), trace=TraceRecorder(), recovery=manager))
    monkeypatch.setattr(coordinator, '_optional_drawing_reason', lambda action, *args: 'optional' if action.target == 'cad' else '')
    first = coordinator.run({'entry': 'user', 'user_text': '查询', 'task_id': 'TASK-SKIP'})
    assert first['runtime_next_index'] == 1
    assert manager.resume(manager.identifier('TASK-SKIP'), 'one', coordinator.resume_failed)['status'] == 'completed'
    assert calls == ['report', 'report']


def test_coordinator_resumes_failed_step_without_replaying_completed_step(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    calls, plans = [], []
    actions = [ActionModel.agent('knowledge', {'required_capability': 'document_search'}),
               ActionModel.agent('cad', {'required_capability': 'drawing_search'})]
    class Dispatcher:
        def dispatch(self, action, state):
            calls.append(action.target)
            if action.target == 'cad' and calls.count('cad') == 1:
                return AgentResult(success=False, output={'error': 'disconnected', 'status': 'blocked'})
            output = {'status': 'completed', 'documents': [{'id': 'DOC'}]} if action.target == 'knowledge' else {'status': 'completed', 'components': [{'id': 'PART'}]}
            return AgentResult(success=True, output=output, evidence=[{'id': action.target}])
    def plan(goal, context):
        plans.append(goal)
        return Plan(goal=goal, actions=actions)
    coordinator = RuntimeCoordinator(SimpleNamespace(planner=SimpleNamespace(plan=plan), dispatcher=Dispatcher(),
        trace=TraceRecorder(), recovery=manager))
    result = coordinator.run({'entry': 'user', 'user_text': '查询设备图纸', 'task_id': 'TASK-TWO', 'trace_id': 'TRACE-TWO'})
    assert result['runtime_result']['status'] != 'completed'
    saved = manager.list()[0]
    resumed = manager.resume(saved['recovery_id'], 'request-1', coordinator.resume_failed)
    assert resumed['status'] == 'completed'
    assert calls == ['knowledge', 'cad', 'cad']
    assert len(plans) == 1


def test_stale_attempt_cannot_overwrite_new_recovery_checkpoint(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    old = snapshot()
    saved = manager.checkpoint(old, 'failed')
    manager.resume(saved['recovery_id'], 'one', lambda record: {**record['state'], 'runtime_result': {'status': 'completed'}})
    with pytest.raises(RecoveryConflict):
        manager.checkpoint(old, 'running')
    assert manager.get(saved['recovery_id'])['status'] == 'completed'


def test_unknown_write_uses_authoritative_receipt_without_dispatching(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    action = ActionModel.agent('workorder', {'required_capability': 'workorder_create'}, side_effect=True, idempotency_key='fixed-key')
    state = {**snapshot(), 'runtime_plan': Plan(goal='派工', actions=[action]).as_dict(), 'runtime_next_index': 0,
             'next_action': action.as_dict(), 'runtime_execution': {'side_effect_status': 'unknown', 'execution_status': 'TIMEOUT'}}
    saved = manager.checkpoint(state, 'timeout')
    receipt = {'success': True, 'output': {'workorder_id': 'WO-EXISTING', 'status': 'open', 'assignee': 'U'}, 'evidence': [{'id': 'WO-EXISTING'}]}
    class Dispatcher:
        resolvers = SimpleNamespace(callback=lambda *args: lambda: receipt)
        def dispatch(self, *_): pytest.fail('already applied write was replayed')
    coordinator = RuntimeCoordinator(SimpleNamespace(dispatcher=Dispatcher(), recovery=manager,
        trace=TraceRecorder(), planner=SimpleNamespace(plan=lambda *args: pytest.fail('planner was replayed'))))
    assert manager.resume(saved['recovery_id'], 'one', coordinator.resume_failed)['status'] == 'completed'
    assert manager.get(saved['recovery_id'])['state']['workorder']['workorder_id'] == 'WO-EXISTING'


def test_unknown_write_without_receipt_remains_blocked(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    action = ActionModel.agent('workorder', {'required_capability': 'workorder_create'}, side_effect=True, idempotency_key='fixed-key')
    state = {**snapshot(), 'runtime_plan': Plan(goal='派工', actions=[action]).as_dict(), 'runtime_next_index': 0,
             'next_action': action.as_dict(), 'runtime_execution': {'side_effect_status': 'unknown'}}
    saved = manager.checkpoint(state, 'timeout')
    dispatcher = SimpleNamespace(resolvers=SimpleNamespace(callback=lambda *args: lambda: None))
    coordinator = RuntimeCoordinator(SimpleNamespace(dispatcher=dispatcher, recovery=manager, trace=TraceRecorder()))
    result = manager.resume(saved['recovery_id'], 'one', coordinator.resume_failed)
    assert result['status'] == 'blocked' and result['requires_reconcile'] is True


def test_workorder_capability_alias_reuses_authoritative_original_order(tmp_path):
    from app.runtime.dispatcher import SideEffectResolverRegistry
    from app.runtime.workorder_recovery import resolver_factory
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'r.sqlite3')))
    action=ActionModel.agent('workorder',{'required_capability':'create_workorder'},side_effect=True,idempotency_key='alias-key')
    plan={'plan_id':'PLAN','repair_steps':['check']}
    order={'workorder_id':'WO-original','idempotency_key':'alias-key','device_id':'D','event_id':'E',
           'plan_id':'PLAN','maintenance_plan_snapshot':plan,'assignee':'owner','status':'in_progress'}
    tools=SimpleNamespace(execute=lambda *args,**kwargs:{'items':[order]})
    resolvers=SideEffectResolverRegistry();resolvers.register('workorder_create',resolver_factory(tools))
    state={'task_id':'TASK-ALIAS','entry':'trigger','event':{'event_id':'E','device_id':'D'},'maintenance_plan':plan,
           'runtime_plan':Plan(goal='派工',actions=[action]).as_dict(),'runtime_next_index':0,'next_action':action.as_dict(),
           'runtime_execution':{'side_effect_status':'unknown'}}
    saved=manager.checkpoint(state,'timeout')
    coordinator=RuntimeCoordinator(SimpleNamespace(recovery=manager,trace=TraceRecorder(),
        dispatcher=SimpleNamespace(resolvers=resolvers,dispatch=lambda *args:pytest.fail('original workorder replayed'))))
    assert manager.resume(saved['recovery_id'],'one',coordinator.resume_failed)['status']=='completed'
    assert manager.get(saved['recovery_id'])['state']['workorder']['workorder_id']=='WO-original'


def test_waiting_dispatch_continues_same_order_after_personnel_available(tmp_path):
    from app.runtime.dispatcher import RuntimeDispatcher
    from app.runtime.execution import ExecutionManager
    from app.runtime.capability import build_capability_registry
    from app.runtime.policy import PolicyDecision, PolicyStatus
    from app.runtime.workorder_recovery import resolver_factory
    from app.runtime.dispatcher import SideEffectResolverRegistry
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    action = ActionModel.agent('workorder', {'required_capability': 'workorder_create'}, side_effect=True, idempotency_key='same-key')
    plan = {'plan_id': 'PLAN', 'repair_steps': ['check']}
    order = {'workorder_id': 'WO-original', 'idempotency_key': 'same-key', 'device_id': 'D', 'event_id': 'E',
             'plan_id': 'PLAN', 'maintenance_plan_snapshot': plan, 'assignee': '', 'status': 'open'}
    calls = []
    class Agent:
        name = 'workorder'
        capabilities = ('workorder_create',)
        def run(self, task):
            from app.agents.workorder.validator import recovery_workorder_id
            calls.append(recovery_workorder_id())
            if len(calls) == 1:
                return AgentResult(success=False, output={'status': 'waiting_for_personnel', 'workorder_id': order['workorder_id'], 'workorder': dict(order)})
            assert recovery_workorder_id() == order['workorder_id']
            order['assignee'] = 'owner'
            return AgentResult(success=True, output={'success': True, 'status': 'open', 'workorder_id': order['workorder_id'], 'workorder': dict(order)})
    capabilities = build_capability_registry()
    capabilities.register_agent(Agent())
    tools = SimpleNamespace(execute=lambda *args, **kwargs: {'items': [dict(order)]})
    resolvers = SideEffectResolverRegistry(); resolvers.register('workorder_create', resolver_factory(tools))
    policy = SimpleNamespace(evaluate=lambda *args: PolicyDecision(PolicyStatus.ALLOW, 'verified'),
                             _effective_capability=lambda *args: 'workorder_create')
    execution = ExecutionManager()
    dispatcher = RuntimeDispatcher(capabilities, execution, policy=policy, resolvers=resolvers)
    coordinator = RuntimeCoordinator(SimpleNamespace(planner=SimpleNamespace(plan=lambda *args: Plan(goal='派工', actions=[action])),
        dispatcher=dispatcher, registry=tools, trace=TraceRecorder(), recovery=manager))
    state = {'entry': 'trigger', 'event': {'device_id': 'D', 'event_id': 'E'}, 'maintenance_plan': plan, 'task_id': 'TASK-DISPATCH'}
    first = coordinator.run(state)
    assert first['runtime_result']['status'] == 'waiting_for_personnel'
    result = manager.resume(manager.identifier(state['task_id']), 'one', coordinator.resume_failed)
    assert result['status'] == 'completed'
    assert calls == ['', 'WO-original']
    assert manager.get(result['recovery_id'])['state']['workorder']['workorder_id'] == 'WO-original'
