"""Opt-in end-to-end expert API test against a real OpenSandbox server.

Run with RUN_LIVE_SKILL_SANDBOX=1 after starting OpenSandbox and Model Service.
The skill documents and test receipts stay in pytest's temporary directory.
"""

import os
from pathlib import Path
from shutil import copytree
from time import monotonic, sleep

import pytest

from app.clients.skill_sandbox import SkillSandbox, SkillSandboxConfig
from app.tools.registry import ToolRegistry
from test_expert_center import expert_api, headers


def _live_sandbox():
    return SkillSandbox(SkillSandboxConfig(
        enabled=True,
        domain=os.getenv('SKILL_SANDBOX_DOMAIN', '127.0.0.1:18080'),
        protocol=os.getenv('SKILL_SANDBOX_PROTOCOL', 'http'),
        api_key=os.getenv('SKILL_SANDBOX_API_KEY', ''),
        image=os.getenv('SKILL_SANDBOX_IMAGE', 'industry-skill-runner:0.1'),
        model_base_url=os.getenv('SKILL_SANDBOX_MODEL_BASE_URL', 'http://host.docker.internal:8040'),
        allowed_hosts=('host.docker.internal',),
        fallback=False,
    ))


def _await_receipt(expert_api, receipt, actor='boss'):
    deadline = monotonic() + 240
    while receipt['status'] == 'running' and monotonic() < deadline:
        sleep(.5)
        response = expert_api.client.get('/api/expert/tests/' + receipt['test_id'], headers=headers(actor))
        assert response.status_code == 200, response.text
        receipt = response.json()
    assert receipt['status'] == 'completed', receipt.get('message')
    return receipt


@pytest.mark.skipif(os.getenv('RUN_LIVE_SKILL_SANDBOX') != '1', reason='requires local OpenSandbox and Model Service')
def test_expert_api_executes_real_diagnosis_in_disposable_sandbox(expert_api):
    # The shared fixture supplies isolated auth, trace and receipt storage.
    expert_api.path.unlink()
    source = Path(__file__).parents[1] / 'app/skills/diagnosis/alarm_diagnosis_skill'
    copytree(source, expert_api.root / 'diagnosis/alarm_diagnosis_skill')
    expert_api.registry.invalidate('diagnosis')
    manager = expert_api.client.app.state.expert_skills
    manager.available_tools = set(ToolRegistry().definitions)
    manager.trials._sandbox_executor = _live_sandbox()

    current = manager.detail('diagnosis', 'alarm_diagnosis_skill')
    body = {key: current[key] for key in ('version', 'goal', 'document')}
    body.update(expected_revision=current['revision'], reason='隔离验证沙箱调用链',
                sample={'alarm_code': '700006', 'alarm_definition': '刀塔旋转超时',
                        'scenario': '刀塔分度超时，现场尚未确定原因。',
                        'expected': '应建议检查分度机构，不能直接断言需要换件。'})
    response = expert_api.client.post('/api/expert/skills/diagnosis/alarm_diagnosis_skill/test',
                                      json=body, headers=headers())
    assert response.status_code == 200, response.text
    receipt = _await_receipt(expert_api, response.json())
    assert receipt['result']['summary']
    assert receipt['result']['diagnosis']
    assert receipt['result']['recommendation']
    assert (source / 'SKILL.md').read_bytes() == (expert_api.root / 'diagnosis/alarm_diagnosis_skill/SKILL.md').read_bytes()


@pytest.mark.skipif(os.getenv('RUN_LIVE_SKILL_SANDBOX') != '1', reason='requires local OpenSandbox and Model Service')
def test_expert_api_executes_real_instruction_preview_in_disposable_sandbox(expert_api):
    source = Path(__file__).parents[1] / 'app/skills/maintenance/repair_plan_skill'
    flat = expert_api.root / 'maintenance/instructions.md'
    flat.unlink()
    copytree(source, expert_api.root / 'maintenance/repair_plan_skill')
    expert_api.registry.invalidate('maintenance')
    manager = expert_api.client.app.state.expert_skills
    manager.available_tools = set(ToolRegistry().definitions)
    manager.trials._sandbox_executor = _live_sandbox()
    current = manager.detail('maintenance', 'repair_plan_skill')
    body = {key: current[key] for key in ('version', 'goal', 'document')}
    body.update(expected_revision=current['revision'], reason='隔离验证说明试读',
                sample={'alarm_code': '700006', 'alarm_definition': '刀塔旋转超时',
                        'scenario': '刀塔分度超时，现场尚未确定原因。',
                        'expected': '应建议核对现场证据。'})
    response = expert_api.client.post('/api/expert/skills/maintenance/repair_plan_skill/test',
                                      json=body, headers=headers())
    assert response.status_code == 200, response.text
    receipt = _await_receipt(expert_api, response.json())
    assert receipt['mode'] == 'instruction_preview'
    assert receipt['result']['summary']
    assert receipt['result']['diagnosis']
    assert receipt['result']['recommendation']


@pytest.mark.skipif(os.getenv('RUN_LIVE_SKILL_SANDBOX') != '1', reason='requires local OpenSandbox and Model Service')
def test_machine_flow_runs_all_agents_in_disposable_sandbox():
    """No production factory or backend client is constructed for this runner test."""
    from app.skills.registry import SkillRegistry

    source = Path(__file__).parents[1] / 'app/skills'
    registry = SkillRegistry(source)
    definitions = [{'agent': agent, 'metadata': dict(skill.metadata), 'document': skill.document}
                   for agent in ('diagnosis', 'maintenance', 'workorder', 'report')
                   for skill in registry.list(agent)]
    result = _live_sandbox().run({
        'agent': 'diagnosis', 'name': 'alarm_diagnosis_skill', 'mode': 'machine_flow',
        'test_id': 'LIVE-SANDBOX-MACHINE', 'definitions': definitions,
        'sample': {'alarm_code': '700006', 'alarm_definition': '刀塔旋转超时',
                   'scenario': '刀塔分度超时，现场尚未确定原因。', 'severity': 'critical',
                   'sop_document': '刀塔分度超时：断电挂牌，检查分度机构和就位反馈，确认报警清除后申请复机。'},
    })
    assert result.get('ok') is True, result.get('message')
    assert result.get('simulation') is True
    assert all(result['criteria'].values())
    assert result['result']['workorder']['workorder_id'].startswith('SIM-WO-')


@pytest.mark.skipif(os.getenv('RUN_LIVE_SKILL_SANDBOX') != '1', reason='requires local OpenSandbox and Model Service')
def test_expert_machine_api_uses_disposable_sandbox_without_factory_writes(expert_api, monkeypatch):
    from types import SimpleNamespace
    from test_expert_machine_trials import Machines

    source = Path(__file__).parents[1] / 'app/skills'
    for agent in ('diagnosis', 'maintenance', 'workorder', 'report'):
        flat = expert_api.root / agent / 'instructions.md'
        if flat.exists():
            flat.unlink()
        for folder in (source / agent).iterdir():
            if folder.is_dir() and (folder / 'SKILL.md').exists():
                copytree(folder, expert_api.root / agent / folder.name)
        expert_api.registry.invalidate(agent)
    manager = expert_api.client.app.state.expert_skills
    manager.available_tools = set(ToolRegistry().definitions)
    manager.trials._sandbox_executor = _live_sandbox()
    factory = Machines()
    manager.trials.factory, manager.trials.backend = factory, object()
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    actor = {'user_id': 'U-WORKER', 'role': 'technician', 'responsible_device_ids': ['D-1']}
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient',
                        lambda: SimpleNamespace(resolve_session=lambda token: actor if token == 'worker' else None))
    current = manager.detail('diagnosis', 'alarm_diagnosis_skill')
    body = {key: current[key] for key in ('version', 'goal', 'document')}
    body.update(expected_revision=current['revision'], reason='验证一次性沙箱完整闭环',
                machine={'device_id': 'D-1', 'scenario_id': 'turret',
                         'expected': '检查刀塔分度机构并完成虚拟闭环',
                         'sop_document': '刀塔分度超时：断电挂牌，检查分度机构和就位反馈，确认报警清除后申请复机。'})
    response = expert_api.client.post('/api/expert/skills/diagnosis/alarm_diagnosis_skill/machine-test',
                                      json=body, headers=headers('worker'))
    assert response.status_code == 200, response.text
    receipt = _await_receipt(expert_api, response.json(), actor='worker')
    assert receipt['simulation'] is True and receipt['assessment']['accepted'] is True
    assert not receipt['event_id'] and not receipt['workorders'] and not receipt['report_id']
    assert factory.starts == [] and factory.clears == 0
