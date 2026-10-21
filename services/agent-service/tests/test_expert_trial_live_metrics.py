"""An expert's isolated invocation is visible while it runs, without leaking samples."""
import json
from threading import Event
from time import monotonic, sleep

import pytest

from app.api.expert_agents import expert_agent_metrics
from app.harness.trace import TraceRecorder
from app.skills.machine_testing import MachineTrials
from app.skills.testing import _observe_isolated_agent
from test_expert_center import expert_api, headers, update_body
from test_expert_trials import SAMPLE, SampleModel, install_model
from test_multi_skill_evolution import multiple
from test_skill_evolution import ACTOR, manager, model_reply
from test_skill_task_trials import TASK, values, wait


def metric(trace, agent):
    return next(item for item in expert_agent_metrics(trace)['items'] if item['agent'] == agent)


def lifecycle(trace):
    return [item for item in trace.list() if item.get('event') in
            {'agent_started', 'agent_completed', 'agent_error'}]


def worker_receipt(trials, identity):
    deadline = monotonic() + 10
    while monotonic() < deadline:
        result = trials.get(identity, {'user_id': 'U-WORKER'})
        if result['status'] != 'running':
            return result
        sleep(.02)
    pytest.fail('隔离测试未及时结束')


@pytest.mark.parametrize(('agent', 'result', 'expected_metric'), [
    ('knowledge', 'found', 'completed'),
    ('knowledge', 'missing', 'blocked'),
    ('knowledge', 'wrong_expected', 'completed'),
    ('cad', 'ready', 'completed'),
    ('cad', 'needs_input', 'blocked'),
    ('cad', 'error', 'failed'),
])
def test_real_isolated_task_is_observed_once(multiple, agent, result, expected_metric):
    trace = multiple.trace = TraceRecorder()
    entered, release = Event(), Event()
    spec = {'units': 'mm', 'operations': [{'type': 'box', 'mode': 'add',
        'length': 40, 'width': 20, 'height': 10, 'position': [0, 0, 0]}]}

    class Model:
        available = True
        timeout = 30

        def chat(self, messages, **kwargs):
            entered.set()
            if not release.wait(10):
                raise TimeoutError('test model not released')
            if result == 'error':
                raise RuntimeError('secret-model-error-DO-NOT-STORE')
            answer = ({'retrieval_plan': ['search_manual', 'search_knowledge']} if agent == 'knowledge' else
                      {'status': 'ready', 'spec': spec} if result == 'ready' else
                      {'status': 'needs_input', 'questions': ['请补充尺寸']})
            return {'choices': [{'message': {'role': 'assistant', 'content': json.dumps(answer)}}]}

    trials = MachineTrials(multiple, None)
    trials.client_factory = Model
    if agent == 'knowledge':
        sample = {**TASK, 'query': '查找主轴手册 secret-sample-DO-NOT-STORE'}
        if result == 'missing':
            sample.update(documents=[], expected_status='insufficient_evidence')
        elif result == 'wrong_expected':
            sample.update(documents=[*TASK['documents'], {'document_id': 'DOC-2', 'title': '食堂菜单',
                'content': '今日供应米饭。', 'source_type': 'manual'}], expected_document_ids=['DOC-2'])
        name = 'manual_search_skill'
    else:
        sample = {'query': '', 'prompt': '生成一个长度40mm、宽度20mm、高度10mm的长方体',
            'documents': [], 'expected': '核对规格 secret-sample-DO-NOT-STORE', 'expected_status': 'ready' if result == 'ready' else 'needs_input',
            'expected_spec': spec if result == 'ready' else None}
        name = 'production_modeling_skill'
    try:
        started = trials.start_task(agent, name, {**values(multiple, agent, name), 'task': sample}, ACTOR)
        assert entered.wait(5), 'the real task did not reach its model'
        active = metric(trace, agent)
        assert active['total'] == 1 and active['running'] == 1
        assert active['completed'] == active['blocked'] == active['failed'] == 0
        assert metric(trace, 'diagnosis')['total'] == 0
    finally:
        release.set()
    receipt = wait(trials, started['test_id'])
    assert receipt['status'] == ('failed' if result in {'error', 'wrong_expected'} else 'completed'), json.dumps(receipt, ensure_ascii=True)
    final = metric(trace, agent)
    assert final['total'] == 1 and final['running'] == 0 and final[expected_metric] == 1
    events = lifecycle(trace)
    assert [event['event'] for event in events] == [
        'agent_started', 'agent_error' if result == 'error' else 'agent_completed']
    assert events[0]['agent'] == events[1]['agent'] == agent
    assert events[0]['trace_id'] == events[1]['trace_id']
    assert events[0]['agent_run_id'] == events[1]['agent_run_id']
    assert all(event.get('run_type') == 'expert_trial' for event in events)
    assert 'DO-NOT-STORE' not in json.dumps(events, ensure_ascii=False)


def test_diagnosis_sample_execution_is_observed(expert_api):
    entered, release = Event(), Event()

    class Model(SampleModel):
        def chat(self, messages, **kwargs):
            entered.set()
            if not release.wait(10):
                raise TimeoutError('test model not released')
            return super().chat(messages, **kwargs)

    install_model(expert_api, Model())
    try:
        response = expert_api.client.post('/api/expert/skills/diagnosis/alarm_diagnosis_skill/test',
            json={**update_body(expert_api), 'sample': SAMPLE}, headers=headers('worker'))
        assert response.status_code == 200
        assert entered.wait(5)
        active = metric(expert_api.trace, 'diagnosis')
        assert active['total'] == 1 and active['running'] == 1
    finally:
        release.set()
    manager = expert_api.client.app.state.expert_skills
    receipt = worker_receipt(manager.trials, response.json()['test_id'])
    assert receipt['status'] == 'completed', receipt
    final = metric(expert_api.trace, 'diagnosis')
    assert final['total'] == 1 and final['completed'] == 1 and final['running'] == 0
    events = lifecycle(expert_api.trace)
    assert [e['event'] for e in events] == ['agent_started', 'agent_completed']
    assert events[0]['agent_run_id'] == events[1]['agent_run_id']


def test_instruction_preview_is_not_recorded_as_an_agent_invocation(expert_api):
    install_model(expert_api)
    response = expert_api.client.get('/api/expert/skills/knowledge/knowledge_skill', headers=headers('worker'))
    skill = response.json()
    body = {k: skill[k] for k in ('version', 'goal', 'document')}
    response = expert_api.client.post('/api/expert/skills/knowledge/knowledge_skill/test',
        json={**body, 'reason': '试读', 'expected_revision': skill['revision'], 'sample': SAMPLE},
        headers=headers('worker'))
    assert response.status_code == 200
    manager = expert_api.client.app.state.expert_skills
    assert worker_receipt(manager.trials, response.json()['test_id'])['status'] == 'completed'
    assert lifecycle(expert_api.trace) == []


def test_review_only_test_does_not_count_as_an_agent_call(multiple):
    multiple.trace = TraceRecorder()
    trials = MachineTrials(multiple, None)
    name = 'repair_plan_skill'
    trials.client_factory = lambda: model_reply({'skills': {name: {
        'highlights': ['/output/intent'], 'missing': []}}})
    sample = {'input': {'query': '查找资料'}, 'output': {'intent': 'maintenance'},
              'expected_highlights': ['/output/intent'], 'expected_missing': [], 'expected': '核对意图'}
    started = trials.start_task('maintenance', name, {**values(multiple, 'maintenance', name), 'task': sample}, ACTOR)
    assert wait(trials, started['test_id'])['status'] == 'completed'
    assert lifecycle(multiple.trace) == []


def test_interrupted_isolated_execution_does_not_remain_active():
    trace = TraceRecorder()
    def interrupted():
        raise KeyboardInterrupt('secret-DO-NOT-STORE')
    with pytest.raises(KeyboardInterrupt):
        _observe_isolated_agent(trace, {'test_id': '1', 'agent': 'knowledge'}, interrupted)
    final = metric(trace, 'knowledge')
    assert final['running'] == 0 and final['failed'] == 1
    assert 'DO-NOT-STORE' not in json.dumps(lifecycle(trace))


def test_cannot_leave_a_live_attempt_if_terminal_record_fails():
    class FaultyTrace(TraceRecorder):
        def record(self, **payload):
            if payload.get('event') == 'agent_completed':
                raise OSError('unavailable')
            return super().record(**payload)
    trace = FaultyTrace()
    with pytest.raises(OSError, match='unavailable'):
        _observe_isolated_agent(trace, {'test_id': '1', 'agent': 'knowledge'}, lambda: {'status': 'completed'})
    final = metric(trace, 'knowledge')
    assert final['running'] == 0 and final['unconfirmed'] == 1
