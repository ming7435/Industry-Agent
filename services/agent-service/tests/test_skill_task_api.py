"""任务验证 API 的真实身份、类型及作用域约束。"""
from pathlib import Path
from shutil import copytree
from test_skill_evolution import manager
from test_skill_evolution_api import api, headers
from test_skill_task_trials import TASK


def candidate(api):
    root = api.service.manager.registry.root
    if not (root / 'knowledge').exists():
        copytree(Path(__file__).parents[1] / 'app/skills/knowledge', root / 'knowledge')
    return api.service.generate_source({'source_id': 'K-1', 'trace_id': 'K-RUN-1',
        'agent': 'knowledge', 'name': 'manual_search_skill', 'facts': '{}'})


def test_confirm_api_routes_knowledge_task_without_machine_request(api):
    c = candidate(api)
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
        json={'candidate_hash': c['candidate_hash'], 'task': TASK}, headers=headers())
    assert response.status_code == 200, response.text
    record = api.service.get(c['proposal_id'])
    assert record['verification_mode'] == 'knowledge_flow'
    assert record['machine'] == {'task': TASK}
    assert not (api.service.manager.backup_root / 'machine-test.json').exists()


def test_task_api_rejects_simultaneous_machine_and_task_or_forged_result(api):
    c = candidate(api)
    endpoint = '/api/expert/evolution/' + c['proposal_id'] + '/confirm'
    for extra in [{'machine': {'device_id': 'D', 'scenario_id': 'S', 'expected': 'X'}},
                  {'task': {**TASK, 'passed': True}}]:
        response = api.client.post(endpoint, json={'candidate_hash': c['candidate_hash'], 'task': TASK, **extra}, headers=headers())
        assert response.status_code == 422, response.text
    assert api.service.get(c['proposal_id'])['status'] == 'awaiting_confirmation'


def test_supervisor_cannot_start_domain_validation(api):
    c = candidate(api)
    draft = c['draft']
    response = api.client.post('/api/expert/skills/knowledge/manual_search_skill/task-test',
        json={k: draft[k] for k in ('expected_revision', 'version', 'goal', 'document', 'reason')} | {'task': TASK},
        headers=headers('boss'))
    assert response.status_code == 403, response.text
