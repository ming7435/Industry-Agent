"""检索与规格解析的隔离领域验证；没有生产工具、设备控制或自由代码执行。"""
from copy import deepcopy
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.skills.management import SkillEditError
from app.skills.optimization import verification_mode


class ReferenceDocument(BaseModel):
    model_config = ConfigDict(extra='forbid')
    document_id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1, max_length=6000)
    source_type: Literal['manual', 'sop', 'alarm', 'case']


class TaskSample(BaseModel):
    model_config = ConfigDict(extra='forbid')
    query: str = Field(default='', max_length=4000)
    prompt: str = Field(default='', max_length=4000)
    documents: list[ReferenceDocument] = Field(default_factory=list, max_length=20)
    expected_status: Literal['completed', 'insufficient_evidence', 'ready', 'needs_input']
    expected_spec: dict | None = None
    expected_document_ids: list[str] | None = Field(default=None, max_length=20)
    expected: str = Field(min_length=1, max_length=2000)

    @field_validator('query', 'prompt', 'expected')
    @classmethod
    def text(cls, value):
        if any(ord(c) < 32 and c not in '\n\r\t' for c in value):
            raise ValueError('文本不能含控制字符')
        return value


def validate_task(agent, name, task):
    mode = verification_mode(agent, name)
    try:
        if mode == 'review_flow':
            from app.skills.review_testing import validate_review
            return validate_review(task)
        value = TaskSample.model_validate(task).model_dump()
        if mode == 'knowledge_flow':
            if not value['query'].strip() or value['prompt'] or value['expected_spec'] is not None or value['expected_status'] not in {'completed', 'insufficient_evidence'}:
                raise ValueError('检索样例需要问题、参考资料及预期证据状态')
            ids = [item['document_id'] for item in value['documents']]
            if len(ids) != len(set(ids)):
                raise ValueError('参考资料编号不能重复')
            expected_ids = value['expected_document_ids']
            if expected_ids is not None and (len(expected_ids) != len(set(expected_ids)) or
                    any(identity not in ids for identity in expected_ids) or
                    (value['expected_status'] == 'completed' and not expected_ids) or
                    (value['expected_status'] == 'insufficient_evidence' and expected_ids)):
                raise ValueError('预期资料编号必须来自样例且与预期状态一致')
        elif mode == 'cad_spec_flow':
            if not value['prompt'].strip() or value['query'] or value['documents'] or value['expected_document_ids'] is not None or value['expected_status'] not in {'ready', 'needs_input'}:
                raise ValueError('CAD 样例需要设计需求及预期规格状态')
            if value['expected_status'] == 'ready':
                from app.tools.cad.text_to_cad import validate_spec
                value['expected_spec'] = validate_spec(value['expected_spec'])
            elif value['expected_spec'] is not None:
                raise ValueError('待补充样例不应提供成功规格')
        else:
            raise ValueError('此技能没有隔离任务验证模式')
        if not value['expected'].strip():
            raise ValueError('预期说明不能为空')
    except Exception:
        # 不公开验证堆栈、输入中的凭据或内部路径。
        raise SkillEditError(422, '任务样例不符合当前技能的字段或预期状态，请核对问题、资料及规格') from None
    if value.get('expected_document_ids') is None:
        value.pop('expected_document_ids', None)  # 保持既有样例的持久化形状。
    return value


class ReferenceTools:
    """只返回人工提供的参考资料，没有远程或业务写入能力。"""
    def __init__(self, documents):
        self.documents = [{'document_id': d['document_id'], 'title': d['title'], 'content': d['content'],
            'source': 'expert_reference', 'metadata': {'knowledge_type': d['source_type']}}
            for d in documents]
        self.calls = []

    def execute(self, name, arguments, context=None):
        from app.agents.knowledge.graph import KNOWLEDGE_TOOLS
        if name not in KNOWLEDGE_TOOLS:
            raise PermissionError('领域验证禁止业务写入')
        self.calls.append({'tool': name, 'arguments': deepcopy(arguments)})
        source = {'search_manual': 'manual', 'search_sop': 'sop', 'search_alarm_knowledge': 'alarm',
                  'search_fault_cases': 'case', 'search_semantic_memory': 'case'}.get(name)
        from app.agents.knowledge.confidence import calculate_confidence
        documents = []
        for document in self.documents:
            if source and document['metadata']['knowledge_type'] != source:
                continue
            # 本地样例使用可解释的词项覆盖，不伪造向量或重排器的满分。
            score = calculate_confidence([document], query=arguments.get('query', ''))['query_coverage']
            if score > 0:
                documents.append({**deepcopy(document), 'score': score})
        documents.sort(key=lambda d: d['score'], reverse=True)
        return {'documents': documents[:arguments.get('limit', 5)], 'source': 'expert_reference', 'degraded': False}


def execute_task(record, registry, client):
    from app.skills.registry import skill_registry_scope
    task = record['sample']
    with skill_registry_scope(registry):
        if record['mode'] == 'review_flow':
            from app.skills.review_testing import execute_review
            return execute_review(record, registry, client)
        if record['mode'] == 'knowledge_flow':
            from app.agents.knowledge.agent import KnowledgeAgent
            tools = ReferenceTools(task['documents'])
            agent = KnowledgeAgent(tools=tools, client=client)
            state = agent.graph.invoke({'agent': agent, 'request': {'query': task['query']}})
            output = state['result'].model_dump(mode='json')
            reference_ids = {d['document_id'] for d in task['documents']}
            from app.agents.knowledge.confidence import calculate_confidence
            expected_ids = task.get('expected_document_ids')
            criteria = {'retrieval': bool(tools.calls),
                'evidence': all(d['document_id'] in reference_ids for d in output['documents']),
                'query_relevance': all(calculate_confidence([d], query=task['query'])['query_coverage'] > 0
                    for d in output['documents']),
                'expected_result': output['status'] == task['expected_status'] and
                    (expected_ids is None or {d['document_id'] for d in output['documents']} == set(expected_ids)),
                'skill_used': state.get('skill_plan_used') is True and record['name'] in state.get('active_skills', [])}
            output['calls'] = tools.calls
        else:
            from app.cad_documents.proposal import resolve_text_to_cad_spec
            initial_calls = client.calls
            output = resolve_text_to_cad_spec(task['prompt'], client)
            consumed = client.calls > initial_calls
            # 缺失尺寸探针使用同一候选正文，不能由模型或用户提供 passed 回执。
            missing = resolve_text_to_cad_spec('请设计一个零件，尺寸尚未提供', client)
            criteria = {'specification': output.get('status') in {'ready', 'needs_input'},
                'missing_dimensions': missing.get('status') == 'needs_input' and not missing.get('spec'),
                'expected_result': output.get('status') == task['expected_status'] and
                    (task['expected_status'] != 'ready' or output.get('spec') == task['expected_spec']),
                'skill_used': consumed}
    return output, criteria
