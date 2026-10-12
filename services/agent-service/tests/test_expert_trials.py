"""样例测试必须运行草稿，不能修改线上技能或调用真实业务工具。"""
import json
from time import monotonic, sleep
from threading import Event

import pytest

from test_expert_center import expert_api, headers, update_body, detail

TARGET = '/api/expert/skills/diagnosis/alarm_diagnosis_skill'
SAMPLE = {'alarm_code': '700006', 'alarm_definition': '刀塔旋转超时',
          'scenario': '刀塔分度超时，现场尚未确定原因。', 'expected': '应建议检查分度机构，不能直接断言需要换件。'}


class SampleModel:
    available = True

    def __init__(self):
        self.messages = []

    def chat(self, messages, **kwargs):
        self.messages.extend(messages)
        content = json.dumps({'summary': '样例刀塔分度超时', 'diagnosis': '需要核对分度机构和就位反馈',
                              'confidence': 0.7, 'recommendation': '检查分度机构，记录现场结果'}, ensure_ascii=False)
        return {'choices': [{'message': {'role': 'assistant', 'content': content}}]}


def trial(api, body=None, actor='boss'):
    body = body or update_body(api)
    response = api.client.post(TARGET + '/test', json={**body, 'sample': SAMPLE}, headers=headers(actor))
    assert response.status_code == 200, response.text
    value = response.json()
    deadline = monotonic() + 15
    while value['status'] == 'running' and monotonic() < deadline:
        sleep(.01)
        response = api.client.get('/api/expert/tests/' + value['test_id'], headers=headers(actor))
        assert response.status_code == 200, response.text
        value = response.json()
    if value['status'] == 'running':
        manager = api.client.app.state.expert_skills
        assert not manager.trials.active, '测试工作线程仍在执行'
        pytest.fail('线程已退出却没有保存结果：' + str(manager.trials._read(value['test_id'], {'user_id': 'U-BOSS' if actor == 'boss' else 'U-WORKER'})))
    return value


def install_model(api, model=None):
    model = model or SampleModel()
    api.client.app.state.expert_skills.trials.client_factory = lambda: model
    return model


def test_publish_requires_server_test_and_human_review(expert_api):
    response = expert_api.client.post(TARGET, json=update_body(expert_api), headers=headers())
    assert response.status_code == 409
    assert '测试' in response.text


def test_trial_uses_draft_in_real_graph_without_publishing(expert_api):
    model = install_model(expert_api)
    body = update_body(expert_api)
    before = expert_api.path.read_bytes()
    result = trial(expert_api, body)
    assert result['status'] == 'completed', result
    assert result['mode'] == 'diagnosis'
    assert body['document'] in '\n'.join(str(m.get('content', '')) for m in model.messages)
    assert expert_api.path.read_bytes() == before
    assert result['result']['diagnosis']
    publish = {**body, 'test_id': result['test_id'], 'human_confirmed': True}
    assert expert_api.client.post(TARGET, json=publish, headers=headers()).status_code == 409
    assert expert_api.path.read_bytes() == before


@pytest.mark.parametrize('change', ['document', 'actor', 'confirmation', 'baseline'])
def test_test_receipt_cannot_publish_different_or_unreviewed_content(expert_api, change):
    install_model(expert_api)
    body = update_body(expert_api)
    result = trial(expert_api, body)
    assert result['status'] == 'completed', result
    publish = {**body, 'test_id': result['test_id'], 'human_confirmed': True}
    actor = 'boss'
    if change == 'document': publish['document'] += '\n未经测试的修改'
    if change == 'actor': actor = 'worker'
    if change == 'confirmation': publish['human_confirmed'] = False
    if change == 'baseline': expert_api.path.write_text(expert_api.path.read_text(encoding='utf-8') + '\n新基线', encoding='utf-8')
    before = expert_api.path.read_bytes()
    response = expert_api.client.post(TARGET, json=publish, headers=headers(actor))
    assert response.status_code in {403, 409}
    assert expert_api.path.read_bytes() == before


def test_model_failure_does_not_unlock_publish_or_leak_internal_details(expert_api):
    class FailedModel(SampleModel):
        def chat(self, *args, **kwargs):
            raise RuntimeError('secret upstream endpoint and token')
    install_model(expert_api, FailedModel())
    body = update_body(expert_api)
    result = trial(expert_api, body)
    assert result['status'] == 'failed', result
    assert 'secret' not in json.dumps(result)
    response = expert_api.client.post(TARGET, json={**body, 'test_id': result['test_id'], 'human_confirmed': True}, headers=headers())
    assert response.status_code == 409


def test_trial_receipt_private_and_poll_read_only(expert_api):
    install_model(expert_api)
    result = trial(expert_api)
    url = '/api/expert/tests/' + result['test_id']
    assert expert_api.client.get(url, headers=headers('worker')).status_code == 403
    before = expert_api.path.read_bytes()
    assert expert_api.client.get(url, headers=headers()).json() == result
    assert expert_api.path.read_bytes() == before


def test_test_sandbox_never_constructs_production_tools(expert_api, monkeypatch):
    monkeypatch.setattr('app.agents.diagnosis.agent.ToolRegistry', lambda: pytest.fail('试运行访问了生产工具'))
    monkeypatch.setattr('app.agents.diagnosis.graph.get_skill_registry', lambda: pytest.fail('试运行使用了线上注册表'))
    install_model(expert_api)
    assert trial(expert_api)['status'] == 'completed'


def test_business_write_tool_request_is_denied_and_cannot_publish(expert_api):
    class WriteModel(SampleModel):
        def chat(self, messages, **kwargs):
            if any(m.get('role') == 'tool' for m in messages):
                return {'choices': [{'message': {'role': 'assistant', 'tool_calls': [
                    {'id': 'illegal', 'type': 'function', 'function': {'name': 'create_workorder', 'arguments': '{}'}}]}}]}
            return super().chat(messages, **kwargs)
    install_model(expert_api, WriteModel())
    assert trial(expert_api)['status'] == 'failed'


def test_active_test_and_concurrent_baseline_change_are_not_publishable(expert_api):
    started, release = Event(), Event()
    class SlowModel(SampleModel):
        def chat(self, messages, **kwargs):
            started.set()
            assert release.wait(10)
            return super().chat(messages, **kwargs)
    install_model(expert_api, SlowModel())
    body = update_body(expert_api)
    response = expert_api.client.post(TARGET + '/test', json={**body, 'sample': SAMPLE}, headers=headers())
    test_id = response.json()['test_id']
    try:
        assert started.wait(10)
        assert expert_api.client.post(TARGET + '/test', json={**body, 'sample': SAMPLE}, headers=headers()).status_code == 409
        assert expert_api.client.post(TARGET, json={**body, 'test_id': test_id, 'human_confirmed': True}, headers=headers()).status_code == 409
        expert_api.path.write_text(expert_api.path.read_text(encoding='utf-8') + '\n线上已变化', encoding='utf-8')
        release.set()
        deadline = monotonic() + 10
        while monotonic() < deadline:
            result = expert_api.client.get('/api/expert/tests/' + test_id, headers=headers()).json()
            if result['status'] != 'running': break
            sleep(.01)
        assert result['status'] == 'failed', result
    finally:
        release.set()


def test_completed_test_survives_restart_but_expired_test_cannot_publish(expert_api):
    from app.skills.testing import SkillTrials
    install_model(expert_api)
    body = update_body(expert_api)
    result = trial(expert_api, body)
    manager = expert_api.client.app.state.expert_skills
    manager.trials = SkillTrials(manager)
    assert expert_api.client.get('/api/expert/tests/' + result['test_id'], headers=headers()).json()['status'] == 'completed'
    path = manager.trials._path(result['test_id'])
    stored = json.loads(path.read_text(encoding='utf-8'))
    stored['created_epoch'] -= 90000
    path.write_text(json.dumps(stored), encoding='utf-8')
    assert expert_api.client.post(TARGET, json={**body, 'test_id': result['test_id'], 'human_confirmed': True}, headers=headers()).status_code == 409


def test_other_skill_preview_is_explicitly_limited(expert_api):
    install_model(expert_api)
    current = expert_api.client.get('/api/expert/skills/knowledge/knowledge_skill', headers=headers()).json()
    body = {k: current[k] for k in ('version', 'goal', 'document')}
    response = expert_api.client.post('/api/expert/skills/knowledge/knowledge_skill/test',
                                     json={**body, 'reason': '试读', 'expected_revision': current['revision'], 'sample': SAMPLE}, headers=headers())
    assert response.status_code == 200, response.text
    result = response.json()
    deadline = monotonic() + 10
    while result['status'] == 'running' and monotonic() < deadline:
        sleep(.01)
        result = expert_api.client.get('/api/expert/tests/' + result['test_id'], headers=headers()).json()
    assert result['status'] == 'completed', result
    assert result['mode'] == 'instruction_preview'
    assert '不运行' in result['scope']


def test_history_adapter_uses_only_supplied_samples_and_missing_data_is_not_a_hit():
    from app.skills.testing import SampleTools
    tools = SampleTools({**SAMPLE, 'history_metric': 'turret_load', 'history_values': [20, 40, 70, 92]})
    output = tools.execute('get_device_history', {'device_id': 'EXPERT-SAMPLE'})
    assert output['source'] == 'expert_test_sample'
    assert output['trend']['turret_load']['values'] == [20, 40, 70, 92]
    assert output['trend']['turret_load']['direction'] == 'rising'
    assert tools.execute('get_device_history', {'device_id': 'REAL-DEVICE'})['found'] is False
    assert tools.execute('search_knowledge', {'query': '检索'})['found'] is False
    with pytest.raises(PermissionError): tools.execute('start_machine', {})


def test_unstructured_model_text_is_not_a_successful_draft_trial(expert_api):
    class Unstructured(SampleModel):
        def chat(self, *args, **kwargs):
            return {'choices': [{'message': {'role': 'assistant', 'content': '我认为可以了'}}]}
    install_model(expert_api, Unstructured())
    assert trial(expert_api)['status'] == 'failed'


@pytest.mark.parametrize('actor,origin,status', [('viewer', 'http://testserver', 403),
                                               ('expired', 'http://testserver', 401),
                                               ('boss', 'http://evil.example', 403)])
def test_test_endpoint_uses_existing_write_permissions(expert_api, actor, origin, status):
    response = expert_api.client.post(TARGET + '/test', json={**update_body(expert_api), 'sample': SAMPLE},
                                     headers=headers(actor, origin))
    assert response.status_code == status
    assert not list(expert_api.client.app.state.expert_skills.backup_root.glob('tests/*.json'))
