"""固定流程技能的严格核查样例，不持有业务服务或控制适配器。"""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

from app.skills.review import review_data, review_payload, review_skills


class ReviewSample(BaseModel):
    model_config = ConfigDict(extra='forbid')
    input: dict
    output: dict
    expected_highlights: list[str] = Field(default_factory=list, max_length=8)
    expected_missing: list[str] = Field(default_factory=list, max_length=8)
    expected_status: Literal['reviewed'] = 'reviewed'
    expected: str = Field(min_length=1, max_length=2000)


def validate_review(task):
    value = ReviewSample.model_validate(task).model_dump()
    sanitized = review_payload(value['input'], value['output'])
    if sanitized != {'input': value['input'], 'output': value['output']}:
        raise ValueError('测试样例不能保存凭据或私有上下文，请先移除敏感字段')
    facts, missing = review_data(value['input'], value['output'])
    if not value['expected'].strip() or not (value['expected_highlights'] or value['expected_missing']):
        raise ValueError('需提供具体预期关注项或缺项')
    for key, allowed in [('expected_highlights', facts), ('expected_missing', missing)]:
        paths = value[key]
        if len(paths) != len(set(paths)) or any(p not in allowed for p in paths):
            raise ValueError('预期必须来自本样例真实非敏感路径')
    return value


def execute_review(record, registry, client):
    task = record['sample']
    definition = registry.get(record['agent'], record['name'])
    if definition is None:
        raise ValueError('当前技能未注册')
    result = review_skills([definition], task['input'], task['output'], client)[definition.name]
    criteria = {'skill_used': True, 'evidence_scope': True, 'readonly': True,
        'expected_result': [item['path'] for item in result['highlights']] == task['expected_highlights']
            and result['missing'] == task['expected_missing']}
    # 上述三个真值只有在真实核查函数通过全部字段/路径/值约束后构造；模型不能传入它们。
    return result, criteria
