"""优化候选不能靠重复旧规则生成一个没有行为变化的新版本。"""
import json
from types import SimpleNamespace

import pytest

from app.skills.evolution import build_draft
from app.skills.management import SkillEditError


def draft(rules):
    current = {'name': 'alarm_diagnosis_skill', 'version': '1.1', 'revision': 'baseline',
               'goal': '核对报警与当前证据',
               'document': '## 业务判断规则\n\n- 报警定义不能证明实际根因。\n\n## 安全\n保留人工复核。\n'}
    client = SimpleNamespace(available=True, chat=lambda messages: {'choices': [{'message': {
        'content': json.dumps({'reason': '修正证据判断', 'rules': rules}, ensure_ascii=False)}}]})
    return current, build_draft(current, {'trace_id': 'REAL-RUN'}, client)


@pytest.mark.parametrize('rule', [' 报警定义不能证明实际根因。 ', '- 报警定义不能证明实际根因。', '* 报警定义不能证明实际根因。'])
def test_repeating_existing_rule_does_not_generate_a_new_version(rule):
    with pytest.raises(SkillEditError, match='没有新增业务判断规则'):
        draft([rule])


@pytest.mark.parametrize('rule', ['- ', '* ', '-', '*'])
def test_empty_list_marker_does_not_generate_a_new_version(rule):
    with pytest.raises(SkillEditError, match='没有新增业务判断规则'):
        draft([rule])


def test_only_new_rules_are_appended_when_model_also_repeats_old_rule():
    current, candidate = draft(['* 报警定义不能证明实际根因。', '- 当前实测在正常范围而报警越界时，应保留证据冲突。'])
    assert candidate['rules'] == ['当前实测在正常范围而报警越界时，应保留证据冲突。']
    assert candidate['document'].count('报警定义不能证明实际根因。') == 1
    assert candidate['version'] == '1.2'
    assert candidate['document'].replace(candidate['addition'], '') == current['document']
