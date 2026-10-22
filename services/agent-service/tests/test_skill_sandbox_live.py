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
        domain=os.getenv('SKILL_SANDBOX_DOMAIN', '127.0.0.1:8080'),
        protocol=os.getenv('SKILL_SANDBOX_PROTOCOL', 'http'),
        api_key=os.getenv('SKILL_SANDBOX_API_KEY', ''),
        image=os.getenv('SKILL_SANDBOX_IMAGE', 'industry-skill-runner:0.1'),
        model_base_url=os.getenv('SKILL_SANDBOX_MODEL_BASE_URL', 'http://host.docker.internal:8040'),
        allowed_hosts=('host.docker.internal',),
        fallback=False,
    ))


def _await_receipt(expert_api, receipt):
    deadline = monotonic() + 240
    while receipt['status'] == 'running' and monotonic() < deadline:
        sleep(.5)
        response = expert_api.client.get('/api/expert/tests/' + receipt['test_id'], headers=headers())
        assert response.status_code == 200, response.text
        receipt = response.json()
    assert receipt['status'] == 'completed', receipt
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
