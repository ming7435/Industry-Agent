"""自动派工只用后端真实的在线、可用、设备负责人，业务门禁保持有效。"""
from types import SimpleNamespace

import pytest

from app.agents.workorder.agent import WorkOrderAgent
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager
from app.runtime.policy import RuntimePolicy, PolicyStatus
from app.runtime.approval import ApprovalManager, PendingTaskStore
from app.tools.registry import ToolRegistry


def plan(**changes):
    return {'plan_id': 'PLAN-1', 'device_id': 'M-1', 'workorder_ready': True,
            'repair_steps': ['检查润滑油路'], 'risk_level': 'high', 'validation_findings': [],
            'diagnosis': {'device_id': 'M-1', 'fault': '润滑压力异常', 'confidence': .95,
                          'evidence_status': 'ready', 'maintenance_required': True}, **changes}


def person(user_id='USER-1', **changes):
    return {'technician_id': user_id, 'name': user_id, 'primary_device_id': 'M-1',
            'registered': True, 'available': True, 'online': True, 'workload': 0, **changes}


class Orders:
    def __init__(self):
        self.order = {}
        self.created = 0
        self.assigned = []

    def create_from_plan(self, payload):
        if not self.order:
            self.created += 1
            self.order = {'workorder_id': 'WO-1', 'device_id': 'M-1', 'status': 'open', 'assignee': ''}
        return dict(self.order)

    def get(self, workorder_id):
        assert workorder_id == self.order['workorder_id']
        return dict(self.order)

    def assign(self, workorder_id, assignee):
        assert workorder_id == self.order['workorder_id']
        self.assigned.append(assignee)
        self.order.update(status='in_progress', assignee=assignee, assignee_name=assignee)
        return dict(self.order)


def agent_with_candidates(candidates):
    orders = Orders()
    agent = WorkOrderAgent(ToolRegistry(), orders)
    agent.collect_dispatch_context = lambda *args: {'device_id': 'M-1', 'candidates': candidates}
    return agent, orders


def create_request(**changes):
    return {'action': 'create', 'source': 'monitor', 'event_id': 'EV-1',
            'idempotency_key': 'create:EV-1', 'maintenance_plan': plan(), **changes}


def test_high_risk_verified_order_automatically_assigns_through_real_runtime_dispatcher():
    agent, orders = agent_with_candidates([person()])
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    dispatcher = RuntimeDispatcher(registry, ExecutionManager())
    action = ActionModel.agent('workorder', {'required_capability': 'workorder_create'},
                               side_effect=True, idempotency_key='create:EV-1')
    state = {'event': {'event_id': 'EV-1'}, 'maintenance_plan': plan(), 'diagnosis': plan()['diagnosis'],
             'knowledge': {'documents': [{'id': 'SOP-1'}]}, 'cad': {'components': [{'id': 'PART-1'}]}}

    result = dispatcher.dispatch(action, state)

    assert result.success is True
    assert orders.order['status'] == 'in_progress'
    assert orders.assigned == ['USER-1']


@pytest.mark.parametrize('changes', [
    {'online': False}, {'online': None}, {'registered': False}, {'registered': None},
    {'available': False}, {'primary_device_id': 'M-OTHER'}, {'primary_device_id': ''},
])
def test_ineligible_person_never_completes_auto_dispatch(changes):
    agent, orders = agent_with_candidates([person(**changes)])

    result = agent.run(create_request())

    assert result.success is False
    assert result.status == 'waiting_for_personnel'
    assert result.stop_reason == 'waiting_for_personnel'
    assert result.workorder_id == 'WO-1'
    assert orders.assigned == []


def test_empty_authoritative_candidates_ignore_forged_request_personnel():
    agent, orders = agent_with_candidates([])
    result = agent.run(create_request(candidates=[person()], context={'candidates': [person()]}, online=True))
    assert result.success is False
    assert result.status == 'waiting_for_personnel'
    assert orders.assigned == []


def test_explicit_assignee_cannot_bypass_device_and_online_membership():
    agent, orders = agent_with_candidates([person(), person('USER-OTHER', primary_device_id='M-OTHER')])
    result = agent.run(create_request(assignee='USER-OTHER'))
    assert result.success is False
    assert result.status == 'waiting_for_personnel'
    assert orders.assigned == []


def test_cached_unassigned_order_continues_after_corresponding_person_logs_in_without_recreation():
    candidates = []
    agent, orders = agent_with_candidates(candidates)
    first = agent.run(create_request())
    assert first.success is False
    candidates.append(person())

    second = agent.run(create_request())
    third = agent.run(create_request())

    assert second.success is True
    assert second.workorder_id == first.workorder_id == third.workorder_id
    assert orders.created == 1
    assert orders.assigned == ['USER-1']


def test_normal_diagnosis_and_invalid_plan_keep_business_gates_before_creation():
    agent, orders = agent_with_candidates([person()])
    normal = plan()
    normal['diagnosis']['maintenance_required'] = False
    assert agent.run(create_request(maintenance_plan=normal)).success is False
    assert agent.run(create_request(maintenance_plan=plan(validation_findings=['缺少库存证据']))).success is False
    assert orders.created == 0


def test_explicit_approval_and_other_mutations_remain_gated():
    state = {'diagnosis': {'fault': 'fault'}, 'knowledge': {'documents': [1]}, 'cad': {'components': [1]},
             'maintenance_plan': {'workorder_ready': True, 'risk_level': 'high'}}
    explicit = ActionModel.agent('workorder', {'required_capability': 'workorder_create', 'requires_approval': True},
                                 side_effect=True, idempotency_key='explicit')
    update = ActionModel.agent('workorder', {'required_capability': 'workorder_update', 'action': 'assign'},
                               side_effect=True, idempotency_key='update')
    control = ActionModel.tool('stop_device', {'risk_level': 'high'}, side_effect=True, idempotency_key='control')
    policy = RuntimePolicy()
    assert all(policy.evaluate(action, state).status == PolicyStatus.REQUIRE_APPROVAL
               for action in (explicit, update, control))


def test_personnel_query_failure_is_not_reported_as_people_not_logged_in():
    orders = Orders()
    agent = WorkOrderAgent(ToolRegistry(), orders)
    agent._safe_tool = lambda name, arguments: {'success': False, 'error': 'isolated directory unavailable'} \
        if name == 'query_technicians' else {'items': []}
    result = agent.run(create_request())
    assert result.success is False
    assert result.status == 'blocked'
    assert result.stop_reason == 'personnel_query_failed'
    assert '查询' in result.error
    assert orders.assigned == []


def test_device_control_cannot_borrow_create_capability_to_skip_high_risk_approval():
    state = {'diagnosis': {'fault': 'fault'}, 'knowledge': {'documents': [1]}, 'cad': {'components': [1]},
             'maintenance_plan': {'workorder_ready': True, 'risk_level': 'high'}}
    action = ActionModel.tool('stop_device', {'required_capability': 'workorder_create'},
                               side_effect=True, idempotency_key='fake-create')
    assert RuntimePolicy().evaluate(action, state).status == PolicyStatus.REQUIRE_APPROVAL


@pytest.mark.parametrize('location', ['plan', 'payload_target', 'state_target', 'event_target',
                                      'payload_target_plan', 'state_target_plan', 'event_target_plan'])
def test_explicit_approval_sources_cannot_be_overridden_by_false_or_client_claims(location):
    state = {'diagnosis': {'fault': 'fault'}, 'knowledge': {'documents': [1]}, 'cad': {'components': [1]},
             'maintenance_plan': {'workorder_ready': True, 'risk_level': 'high'},
             'context': {'approval_granted': True}}
    payload = {'required_capability': 'workorder_create', 'requires_approval': False}
    if location == 'plan':
        state['maintenance_plan']['requires_approval'] = True
    elif location.startswith('payload_target'):
        payload['target_input'] = {'maintenance_plan': {'requires_approval': True}} if location.endswith('_plan') else {'requires_approval': True}
    elif location.startswith('state_target'):
        state['target_input'] = {'maintenance_plan': {'requires_approval': True}} if location.endswith('_plan') else {'requires_approval': True}
    else:
        state['event'] = {'target_input': {'maintenance_plan': {'requires_approval': True}} if location.endswith('_plan') else {'requires_approval': True}}
    action = ActionModel.agent('workorder', payload, side_effect=True, idempotency_key='explicit')
    assert RuntimePolicy().evaluate(action, state).status == PolicyStatus.REQUIRE_APPROVAL
    pending = {'status': 'resuming', 'action': action.as_dict()}
    approved_policy = RuntimePolicy(approval_lookup=lambda _: pending)
    assert approved_policy.evaluate(action, {**state, 'runtime_resume': {'pending_id': 'P1'}}).status == PolicyStatus.ALLOW


@pytest.mark.parametrize('location', ['payload', 'state', 'event'])
def test_final_target_input_plan_alias_preserves_explicit_approval(location):
    state = {'diagnosis': {'fault': 'fault'}, 'knowledge': {'documents': [1]}, 'cad': {'components': [1]},
             'maintenance_plan': {'workorder_ready': True}}
    payload = {'required_capability': 'workorder_create'}
    target = {'plan': {'requires_approval': True}}
    if location == 'payload':
        payload['target_input'] = target
    elif location == 'state':
        state['target_input'] = target
    else:
        state['event'] = {'target_input': target}
    action = ActionModel.agent('workorder', payload, side_effect=True, idempotency_key='explicit-alias')
    assert RuntimePolicy().evaluate(action, state).status == PolicyStatus.REQUIRE_APPROVAL


@pytest.mark.parametrize('location', ['plan', 'request'])
def test_direct_create_respects_explicit_approval_without_accepting_client_approval(location):
    agent, orders = agent_with_candidates([person()])
    request = create_request()
    if location == 'plan':
        request['maintenance_plan']['requires_approval'] = True
    else:
        request['requires_approval'] = True
    request['context'] = {'approval_granted': True, 'approved_capabilities': ['workorder_create']}
    result = agent.run(request)
    assert result.success is False
    assert result.status == 'waiting_approval'
    assert result.stop_reason == 'approval_required'
    assert orders.created == 0
    assert orders.assigned == []


def test_server_approval_resumes_real_agent_once_and_does_not_leak_authority(tmp_path):
    agent, orders = agent_with_candidates([person()])
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    store = PendingTaskStore(str(tmp_path / 'approval.sqlite3'))
    dispatcher = RuntimeDispatcher(registry, ExecutionManager(), policy=RuntimePolicy(approval_lookup=store.get))
    action = ActionModel.agent('workorder', {'required_capability': 'workorder_create'},
                               side_effect=True, idempotency_key='approved-create')
    state = {'event': {'event_id': 'EV-1'}, 'maintenance_plan': plan(requires_approval=True),
             'diagnosis': plan()['diagnosis'], 'knowledge': {'documents': [1]}, 'cad': {'components': [1]},
             'context': {'approved_capabilities': ['workorder_create'], 'approval_granted': True}}
    waiting = dispatcher.dispatch(action, state)
    assert waiting.success is False
    assert waiting.output['status'] == 'waiting_approval'
    assert orders.created == 0
    def resume(record):
        result = dispatcher.dispatch(ActionModel.coerce(record['action']),
                                     {**record['state'], 'runtime_resume': {'pending_id': record['pending_id']}})
        return {'runtime_result': {'status': 'completed' if result.success else 'blocked'}, 'workorder': result.output}
    manager = ApprovalManager(store, resume_callback=resume)
    pending = manager.create_pending(action=action.as_dict(), state=state, plan={}, next_index=0, policy={})
    resumed = manager.approve(pending['pending_id'], approved_by='server-operator')
    replay = manager.approve(pending['pending_id'], approved_by='server-operator')
    assert resumed['status'] == 'completed'
    assert replay == resumed
    assert orders.created == 1
    assert orders.assigned == ['USER-1']
    # 已批准的线程上下文离开回调即复位，直接客户端请求仍被拒绝。
    direct = agent.run(create_request(maintenance_plan=plan(requires_approval=True), approval_granted=True))
    assert direct.success is False
    assert direct.status == 'waiting_approval'
