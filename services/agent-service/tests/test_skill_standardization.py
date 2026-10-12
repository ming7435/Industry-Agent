"""技能文档由真实加载器、契约模型和权限 Guard 共同验证；不调用外部服务。"""
import json
import os
import re
import subprocess
import sys
from dataclasses import fields as dataclass_fields
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

import pytest

from app.skills.registry import SkillRegistry
from app.tools.registry import ToolRegistry
from app.contracts import AgentTask, CADResult, KnowledgeResult, MaintenancePlan, QualityResult, ReportResult, RouteResult
from app.agents.cad.schemas import CADQuery
from app.agents.knowledge.schemas import KnowledgeQuery
from app.agents.maintenance.schemas import MaintenanceQuery
from app.agents.memory.schemas import MemoryQuery, MemoryResult
from app.agents.workorder.schemas import WorkOrderQuery, WorkOrderResult
from app.agents.quality.schemas import QualityQuery
from app.agents.diagnosis.schemas import DiagnosisResult, AgentStatus
from app.api.schemas.agent import AbnormalEventRequest
from app.a2a.models import QualityRequest, QualityResponse
from app.agents.cad.modeling_api import FreeCADRunRequest
from app.api.production_simulation import Plan

BASELINE = json.loads((Path(__file__).parent / 'fixtures/skill-runtime-contracts.json').read_text(encoding='utf-8'))
MODELS = {'diagnosis': (AbnormalEventRequest, DiagnosisResult), 'knowledge': (KnowledgeQuery, KnowledgeResult),
          'maintenance': (MaintenanceQuery, MaintenancePlan), 'workorder': (WorkOrderQuery, WorkOrderResult),
          'quality': (QualityQuery, QualityResult), 'cad': (CADQuery, CADResult),
          'memory': (MemoryQuery, MemoryResult), 'report': (None, ReportResult), 'router': (AgentTask, RouteResult)}
from app.agents.report.schemas import ReportQuery
MODELS['report'] = (ReportQuery, ReportResult)
HEADINGS = ('技能概述', '触发场景', '输入与前置条件', '执行流程', '业务判断规则', '工具使用规范',
            '证据与数据真实性', '输出规范', '异常处理', '停止条件', '安全与权限边界', '示例', '参考实现')


@pytest.fixture(scope='module')
def registry():
    return SkillRegistry()


@pytest.mark.parametrize('entry', BASELINE, ids=lambda entry: entry['agent'] + '-' + entry['name'])
def test_each_document_loads_without_changing_runtime_contract(registry, entry):
    skill = registry.get(entry['agent'], entry['name'])
    assert skill is not None
    expected = {key: value for key, value in entry['metadata'].items() if key != 'goal'}
    actual = {key: value for key, value in skill.metadata.items() if key not in ('description', 'goal')}
    assert actual == expected
    assert skill.metadata.get('description', '').strip(), '缺少发现用 description'
    assert all(any(line.startswith('## ' + title) for line in skill.document.splitlines()) for title in HEADINGS)
    for alias in skill.aliases:
        assert registry.get(skill.agent, alias).name == skill.name
    assert registry.select(skill.agent, names=[skill.name])[0].name == skill.name


def _check_model(model, value):
    if model is DiagnosisResult:
        assert set(value) <= {field.name for field in dataclass_fields(model)}
        instance = model(**{**value, 'status': AgentStatus(value['status']),
                            'created_at': datetime.fromisoformat(value['created_at'])})
        assert instance.to_dict()['event_id'] == value['event_id']
    else:
        assert set(value) <= set(model.model_fields), '文档示例包含真实模型没有的字段'
        instance = model.model_validate(value)
        assert instance.model_dump(mode='json') is not None


@pytest.mark.parametrize('entry', BASELINE, ids=lambda entry: entry['agent'] + '-' + entry['name'])
def test_each_document_example_uses_real_input_and_result_models(registry, entry):
    skill = registry.get(entry['agent'], entry['name'])
    section = skill.document.split('## 示例', 1)[-1].split('## 参考实现', 1)[0]
    blocks = re.findall(r'```json\s*\n(.*?)\n```', section, re.S)
    assert len(blocks) == 2, '需一组真实输入/输出契约示例'
    input_model, output_model = MODELS[skill.agent]
    if skill.name == 'production_modeling_skill':
        input_model, output_model = FreeCADRunRequest, None
    elif skill.name == 'virtual_production_skill':
        input_model, output_model = Plan, None
    elif skill.name == 'virtual_size_inspection_skill':
        input_model, output_model = QualityRequest, QualityResponse
    input_value, output_value = map(json.loads, blocks)
    _check_model(input_model, input_value)
    if output_model:
        _check_model(output_model, output_value)
    else:
        assert isinstance(output_value, dict) and output_value
        # 原生建模/模拟生产公开返回是字典，继续由专属业务测试验证，不伪造统一Schema。


@pytest.mark.parametrize('entry', BASELINE, ids=lambda entry: entry['agent'] + '-' + entry['name'])
def test_skill_scope_remains_enforced_by_real_tool_guard(registry, entry):
    skill = registry.get(entry['agent'], entry['name'])
    tools = ToolRegistry()
    assert set(skill.tools) <= set(tools.definitions)
    context = {'agent': skill.agent, 'skills': [skill.name], 'allowed_tools': list(skill.tools)}
    assert tools.guard_call('delete_workorder', {'workorder_id': 'WO-TEST'}, context=context)['allow'] is False
    # 真实结构化工具步骤必须绑定原白名单；字符串步骤是追踪标签，不假定其皆为Graph节点。
    for step in skill.normalized_steps():
        if step.type == 'tool':
            assert step.tool in skill.tools


def test_catalog_has_no_omitted_or_duplicate_registered_documents(registry):
    actual = {(directory.name, skill.name) for directory in registry.root.iterdir()
              if directory.is_dir() and not directory.name.startswith(('.', '__')) for skill in registry.list(directory.name)}
    assert actual == {(entry['agent'], entry['name']) for entry in BASELINE}
    registry.validate_tools(ToolRegistry().definitions)


def test_readonly_audit_cli_reports_every_skill_and_real_graph(tmp_path):
    root = Path(__file__).resolve().parents[3]
    # 单独CLI不能借助pytest临时路径隐式初始化数据库；无需生产配置也应只读运行。
    isolated_env = {key: value for key, value in os.environ.items()
                    if not key.startswith(('MYSQL_', 'REDIS_')) and
                    key not in ('WORKORDER_STORE_PATH', 'BACKEND_SERVICE_BASE_URL', 'MODEL_SERVICE_BASE_URL',
                                'RAG_SERVICE_BASE_URL', 'CAD_SERVICE_BASE_URL')}
    isolated_env['APP_ENV'] = 'production'
    isolated_env['MCP_MES_URL'] = ''
    result = subprocess.run([sys.executable, str(root / 'scripts/audit_skills.py')], cwd=root,
                            env=isolated_env, capture_output=True, text=True, encoding='utf-8', timeout=60)
    assert result.returncode == 0, result.stderr
    audit = json.loads(result.stdout)
    assert audit['skill_count'] == 30
    assert audit['agent_count'] == 9
    assert audit['errors'] == []
    assert 'reason' in audit['agents']['diagnosis']['graph_nodes']
    assert 'model_3d' in audit['agents']['cad']['graph_nodes']
    assert 'virtual_size_inspection' in audit['agents']['quality']['graph_nodes']
    assert any(edge['source'] == 'loop_guard' and edge['target'] == 'reason'
               for edge in audit['agents']['diagnosis']['graph_edges'])
    assert all((root / data['agent_entry']).is_file() for data in audit['agents'].values())
    assert {(item['agent'], item['name']) for item in audit['skills']} == {(item['agent'], item['name']) for item in BASELINE}


def _document_example(registry, agent, name):
    section = registry.get(agent, name).document.split('## 示例', 1)[-1].split('## 参考实现', 1)[0]
    return tuple(map(json.loads, re.findall(r'```json\s*\n(.*?)\n```', section, re.S)))


def _knowledge_example_result(name, request):
    from app.agents.knowledge.agent import KnowledgeAgent
    from app.agents.knowledge.graph import rerank, validate, fallback, final
    source_type = 'alarm' if name == 'hybrid_search_skill' else 'manual'
    document = {'document_id': 'ALARM-EXAMPLE' if source_type == 'alarm' else 'MAN-001',
                'title': '示例报警目录' if source_type == 'alarm' else '示例设备手册',
                'content': '仅说明报警含义，不包含SOP。' if source_type == 'alarm' else
                           '' if name == 'manual_search_skill' else '示例手册资料，不是SOP。',
                'source': 'isolated-example', 'score': 0.8, 'metadata': {'knowledge_type': source_type}}
    # 只走真实合并、校验、构建函数；没有调用Tools或外部检索。
    agent = KnowledgeAgent(tools=SimpleNamespace())
    state = {'agent': agent, 'request': request, 'query': request['query'],
             'query_type': 'alarm' if source_type == 'alarm' else 'manual' if name == 'manual_search_skill' else 'sop',
             'documents': [document], 'observations': []}
    state.update(rerank(state)); state.update(validate(state))
    if state['route'] == 'fallback':
        state.update(fallback(state))
    return final(state)['result'].model_dump(mode='json')


@pytest.mark.parametrize('name', ['sop_search_skill', 'hybrid_search_skill', 'manual_search_skill'])
def test_knowledge_examples_preserve_real_partial_evidence_and_validator_status(registry, name):
    request, expected = _document_example(registry, 'knowledge', name)
    actual = _knowledge_example_result(name, request)
    assert expected['status'] == actual['status']
    assert expected['documents'] == actual['documents']
    assert expected['evidence'] == actual['evidence']
    assert expected['sources'] == actual['sources']
    assert expected['confidence'] == actual['confidence']


@pytest.mark.parametrize('name', ['alarm_diagnosis_skill', 'multi_metric_diagnosis_skill', 'safety_triage_skill', 'trend_diagnosis_skill'])
def test_diagnosis_examples_do_not_drop_existing_event_evidence(registry, name):
    from app.agents.diagnosis.evidence import event_evidence
    request, expected = _document_example(registry, 'diagnosis', name)
    evidence = event_evidence(request['event'])
    assert evidence and set(evidence) <= set(expected['evidence'])
    assert expected['evidence_status'] == 'ready'
    assert expected['status'] == 'fallback' and expected['requires_human_review'] is True
    actual = _diagnosis_example_result(name, request)
    assert expected['evidence'] == actual['evidence']
    assert expected['confidence'] == actual['confidence']
    assert expected['alarm_definition'] == actual['alarm_definition']


def _diagnosis_example_result(name, request):
    from app.agents.diagnosis.agent import DiagnosisAgent
    from app.agents.diagnosis.schemas import DiagnosisState
    # 仅报警目录传输边界返回空数据；真实fallback与置信度算法不mock。
    agent = DiagnosisAgent(client=SimpleNamespace(model='isolated-doc-example', provider='testing'),
                           tools=SimpleNamespace(execute=lambda *args, **kwargs: {}), run_cache=SimpleNamespace())
    event = request['event']
    state = DiagnosisState(abnormal_event=event, active_skill=name, active_skills=[name])
    result = agent._build_fallback_result(state, event['event_id'], event['device_id'], event.get('alarm_code'),
                                          '隔离示例：未取得完整资料', '', None, 'DIAG-EXAMPLE')
    return result.to_dict()


def _virtual_example_result(request):
    from app.a2a.client import A2AClient
    from app.a2a.endpoints import A2AEndpoints
    from app.agents.quality.agent import QualityAgent
    from app.production_simulation.context import create_virtual_context
    check = {'check_id': 'SIM-CHECK-EXAMPLE', 'part_id': request['part_id'], 'output_digest': request['output_digest'],
             'rule': 'virtual_profile_dimensions_v1', 'status': 'insufficient_data', 'items': [],
             'source': 'factory-simulation', 'simulation_only': True, 'scope': 'machining-zone'}
    # 后端事实边界用隔离测试适配器；实际权限、A2A端点、Quality Graph与Skill工具均保留。
    backend = SimpleNamespace(inspect=lambda actor, part_id, output_digest: check)
    context = create_virtual_context({'user_id': 'U-EXAMPLE', 'role': 'technician'}, 'inspect',
                                     {'part_id': request['part_id'], 'output_digest': request['output_digest']},
                                     backend, None, 'TRACE-EXAMPLE')
    agent = QualityAgent(tools=ToolRegistry())
    client = A2AClient()
    endpoints = A2AEndpoints({'quality': SimpleNamespace(execute_agent=agent.run)})
    client.register('quality', endpoints._quality_endpoint)
    return client.request(QualityRequest(**request, virtual_context=context), QualityResponse).model_dump(mode='json')


def test_virtual_example_uses_real_authorized_route_and_return_shape(registry):
    request, expected = _document_example(registry, 'quality', 'virtual_size_inspection_skill')
    actual = _virtual_example_result(request)
    assert expected['from_agent'] == actual['from_agent']
    assert expected['to_agent'] == actual['to_agent']
    assert expected['status'] == actual['status'] and expected['success'] == actual['success']
    assert expected['quality_result'] == actual['quality_result']
