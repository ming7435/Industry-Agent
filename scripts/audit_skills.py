"""只读核对项目技能、真实Graph、工具权限及示例契约；不连接业务或模型服务。"""
from __future__ import annotations

import importlib
import json
import os
import re
import sys
from dataclasses import fields
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ['PYTHON_DOTENV_DISABLED'] = '1'
# 只读目录审计不应初始化业务存储，也不使用环境里的真实服务路由。
# 注册表正常构造及Guard逻辑仍保留；本脚本不会执行任何工具处理器。
os.environ['BACKEND_SERVICE_BASE_URL'] = 'http://127.0.0.1:9'
os.environ['MCP_MES_URL'] = 'http://127.0.0.1:9'
os.environ['MCP_QMS_URL'] = 'http://127.0.0.1:9'
os.environ['MCP_INVENTORY_URL'] = 'http://127.0.0.1:9'
os.environ['MCP_CAD_URL'] = 'http://127.0.0.1:9'
sys.path.insert(0, str(ROOT / 'services/agent-service'))
sys.path.insert(0, str(ROOT))

from app.skills.registry import SkillRegistry
from app.tools.registry import ToolRegistry
from app.contracts import AgentTask, CADResult, KnowledgeResult, MaintenancePlan, QualityResult, ReportResult, RouteResult
from app.agents.cad.schemas import CADQuery
from app.agents.knowledge.schemas import KnowledgeQuery
from app.agents.maintenance.schemas import MaintenanceQuery
from app.agents.memory.schemas import MemoryQuery, MemoryResult
from app.agents.workorder.schemas import WorkOrderQuery, WorkOrderResult
from app.agents.quality.schemas import QualityQuery
from app.agents.report.schemas import ReportQuery
from app.agents.diagnosis.schemas import DiagnosisResult, AgentStatus
from app.api.schemas.agent import AbnormalEventRequest
from app.a2a.models import QualityRequest, QualityResponse
from app.agents.cad.modeling_api import FreeCADRunRequest
from app.api.production_simulation import Plan

MODELS = {'diagnosis': (AbnormalEventRequest, DiagnosisResult), 'knowledge': (KnowledgeQuery, KnowledgeResult),
          'maintenance': (MaintenanceQuery, MaintenancePlan), 'workorder': (WorkOrderQuery, WorkOrderResult),
          'quality': (QualityQuery, QualityResult), 'cad': (CADQuery, CADResult),
          'memory': (MemoryQuery, MemoryResult), 'report': (ReportQuery, ReportResult), 'router': (AgentTask, RouteResult)}
# SKILL.md 只保留模型每次都要看到的章节；其余规则在 references/ 中按需读取。
CORE_HEADINGS = ('技能概述', '触发场景', '执行流程', '输出规范', '停止条件')
REFERENCE_HEADINGS = ('业务判断规则', '工具使用规范', '证据与数据真实性', '安全与权限边界', '异常处理',
                      '输入与前置条件', '示例', '参考实现')
REQUIRED_REFERENCES = ('reasoning', 'evidence', 'contract', 'source')


def validate_example(model, value):
    """实际契约验证并拒绝Pydantic默认会忽略的文档顶层虚构字段。"""
    if model is None:
        if not isinstance(value, dict) or not value:
            raise ValueError('原始返回体示例须为非空对象')
        return
    names = {field.name for field in fields(model)} if model is DiagnosisResult else set(model.model_fields)
    if set(value) - names:
        raise ValueError('示例存在契约外字段')
    if model is DiagnosisResult:
        model(**{**value, 'status': AgentStatus(value['status']),
                 'created_at': datetime.fromisoformat(value['created_at'])}).to_dict()
    else:
        model.model_validate(value)


def audit():
    registry, tools = SkillRegistry(), ToolRegistry()
    agents, skills, errors = {}, [], []
    registry.validate_tools(tools.definitions)
    for directory in sorted(registry.root.iterdir()):
        if not directory.is_dir() or directory.name.startswith(('.', '__')):
            continue
        agent = directory.name
        module = importlib.import_module('app.agents.' + agent + '.graph')
        graph = getattr(module, 'build_' + agent + '_graph')()
        compiled = graph.get_graph()
        nodes = sorted(set(compiled.nodes) - {'__start__', '__end__'})
        entry = importlib.import_module('app.agents.' + agent + '.agent')
        agents[agent] = {
            'agent_entry': str(Path(entry.__file__).relative_to(ROOT)).replace('\\', '/'),
            'graph_nodes': nodes,
            'graph_edges': [{'source': edge.source, 'target': edge.target, 'conditional': edge.conditional}
                            for edge in compiled.edges],
            'graph_file': str(Path(module.__file__).relative_to(ROOT)).replace('\\', '/'),
        }
        for skill in registry.list(agent):
            findings = []
            if not str(skill.metadata.get('description') or '').strip():
                findings.append('缺少description')
            if skill.layout != 'directory':
                findings.append('技能仍是扁平文档，未迁移为目录包')
            for heading in CORE_HEADINGS:
                if not any(line.startswith('## ' + heading) for line in skill.document.splitlines()):
                    findings.append('SKILL.md缺少章节：' + heading)
            for name in REQUIRED_REFERENCES:
                if skill.reference(name) is None:
                    findings.append('缺少参考文档：' + name)
            reference_text = "\n".join(item.document for item in skill.references)
            for heading in REFERENCE_HEADINGS:
                if not any(line.startswith('## ' + heading) for line in reference_text.splitlines()):
                    findings.append('参考文档缺少章节：' + heading)
            input_model, output_model = MODELS[agent]
            if skill.name == 'production_modeling_skill':
                input_model, output_model = FreeCADRunRequest, None
            elif skill.name == 'virtual_production_skill':
                input_model, output_model = Plan, None
            elif skill.name == 'virtual_size_inspection_skill':
                input_model, output_model = QualityRequest, QualityResponse
            contract = skill.reference('contract')
            example = (contract.document if contract else '').split('## 示例', 1)[-1].split('## 参考实现', 1)[0]
            blocks = re.findall(r'```json\s*\n(.*?)\n```', example, re.S)
            if len(blocks) != 2:
                findings.append('示例缺少一组输入输出')
            else:
                for model, block in zip((input_model, output_model), blocks):
                    try:
                        validate_example(model, json.loads(block))
                    except (ValueError, TypeError, KeyError):
                        findings.append('示例不符合真实输入/输出契约')
            for reference in re.findall(r'\]\((L:/[^)]*)\)', skill.document + "\n" + reference_text):
                if not Path(reference).is_file():
                    findings.append('参考实现不存在：' + reference)
            runner = Path(skill.path).parent / 'scripts' / 'run.py'
            if not runner.is_file():
                findings.append('缺少独立入口：scripts/run.py')
            permission = tools.guard_call('delete_workorder', {'workorder_id': 'WO-AUDIT'},
                                         context={'agent': agent, 'skills': [skill.name], 'allowed_tools': list(skill.tools)})
            if permission['allow']:
                findings.append('技能意外授权删除工单')
            for alias in skill.aliases:
                if registry.get(agent, alias) is not skill:
                    findings.append('别名未映射原定义')
            tool_steps = []
            for step in skill.normalized_steps():
                if step.type == 'tool':
                    if step.tool not in skill.tools:
                        findings.append('结构化步骤超出原工具权限')
                    tool_steps.append({'id': step.id, 'tool': step.tool, 'required_inputs': step.required_inputs})
            item = {'agent': agent, 'name': skill.name, 'file': str(Path(skill.path).relative_to(ROOT)).replace('\\', '/'),
                    'layout': skill.layout, 'goal': skill.goal, 'description': skill.metadata.get('description'),
                    'aliases': list(skill.aliases),
                    'triggers': list(skill.conditions), 'steps': list(skill.steps), 'tools': list(skill.tools),
                    'tool_steps': tool_steps, 'input_model': input_model.__name__,
                    'input_schema': input_model.__module__ + '.' + input_model.__name__,
                    'output_model': output_model.__name__ if output_model else 'dict（专属工具/接口返回）',
                    'output_schema': output_model.__module__ + '.' + output_model.__name__ if output_model else '',
                    'document_characters': len(skill.document), 'document_lines': len(skill.document.splitlines()),
                    'references': [{'name': ref.name, 'title': ref.title, 'when': ref.when,
                                    'characters': len(ref.document)} for ref in skill.references],
                    'reference_characters': len(reference_text),
                    'errors': findings}
            skills.append(item)
            errors.extend({'agent': agent, 'name': skill.name, 'error': finding} for finding in findings)
    return {'schema': 'industry-agent-internal-skills-v2', 'layout': 'directory-package',
            'reference_tool': 'read_skill_reference',
            'skill_count': len(skills), 'agent_count': len(agents), 'agents': agents, 'skills': skills, 'errors': errors}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    result = audit()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1 if result['errors'] else 0)
