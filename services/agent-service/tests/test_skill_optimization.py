"""合并 Skill 的真实选择、工具权限和 Graph 日志行为。"""

import pytest

from app.harness.trace import TraceRecorder
from app.skills.registry import SkillRegistry, get_skill_registry
from app.tools.registry import ToolRegistry


@pytest.mark.parametrize('names,canonical,agent', [
    (['bom_analysis_skill', 'part_search_skill', 'drawing_lookup_skill'], 'drawing_lookup_skill', 'cad'),
    (['memory_write', 'experience_extraction'], 'experience_extraction', 'memory'),
    (['trace_report_skill', 'closure_report_skill'], 'closure_report_skill', 'report'),
])
def test_old_skill_names_activate_one_definition(names, canonical, agent):
    registry = get_skill_registry()
    assert [skill.name for skill in registry.select(agent, names=names)] == [canonical]


@pytest.mark.parametrize('context', [
    {'query': 'BOM'}, {'query': '查部件 BOM', 'component': '泵'}, {'part_no': 'P-1'},
])
def test_cad_original_triggers_share_same_scope_without_duplicate_activation(context):
    registry = get_skill_registry()
    skills = registry.select('cad', context)
    assert [s.name for s in skills] == ['drawing_lookup_skill']
    assert set(registry.merge_tools(skills)) == {'query_part', 'query_drawing', 'query_bom', 'query_relation', 'fetch_engineering_record'}


@pytest.mark.parametrize('report_type', ['trace', 'closure', 'trace_report', 'closure_report'])
def test_report_subtypes_share_original_six_tools_without_pdf_privilege(report_type):
    registry = get_skill_registry()
    skills = registry.select('report', {'report_type': report_type})
    assert [s.name for s in skills] == ['closure_report_skill']
    assert set(registry.merge_tools(skills)) == {'get_diagnosis_record', 'get_maintenance_record', 'get_workorder', 'get_quality_record', 'get_trace_summary', 'persist_report'}
    assert 'generate_report_file' not in registry.merge_tools(skills)


@pytest.mark.parametrize('names', [['not_registered'], []])
def test_explicit_unknown_or_empty_selection_never_falls_back_to_broad_permissions(names):
    registry = get_skill_registry()
    selected = registry.select('knowledge', {'query': '普通问题'}, names=names)
    assert selected == []
    tools = ToolRegistry()
    assert tools.guard_call('search_manual', {'query': '手册'}, context={'allowed_tools': registry.merge_tools(selected)})['allow'] is False


def test_search_action_with_learning_words_cannot_activate_write_skill():
    registry = get_skill_registry()
    skills = registry.select('memory', {'action': 'search', 'query': 'learn 维修经验'})
    assert [s.name for s in skills] == ['experience_retrieval', 'memory_dedup']
    assert registry.merge_tools(skills) == ['search_semantic_memory']


def test_learning_and_old_write_alias_grant_no_unused_workorder_tool():
    registry = get_skill_registry()
    for names in [None, ['memory_write'], ['experience_extraction']]:
        skills = registry.select('memory', {'action': 'learn'}, names=names)
        assert registry.merge_tools(skills) == []
        assert ToolRegistry().guard_call('get_workorder', {'workorder_id': 'WO-1'}, context={'allowed_tools': registry.merge_tools(skills)})['allow'] is False


def test_empty_metadata_fields_do_not_trigger_specialized_report():
    registry = get_skill_registry()
    skills = registry.select('report', {'report_type': '', 'trace_id': '', 'trace': []})
    assert [s.name for s in skills] == ['report_generation_skill']


def test_multiple_triggers_match_either_condition_without_inventing_permissions(tmp_path):
    directory = tmp_path / 'example'
    directory.mkdir()
    (directory / 'merged.md').write_text('---\nname: merged\ntriggers: [manual, sop]\ntools: [search_knowledge]\n---\n# 组合检索\n', encoding='utf-8')
    (directory / 'default.md').write_text('---\nname: fallback\ntrigger: default\ntools: []\n---\n# 回退\n', encoding='utf-8')
    registry = SkillRegistry(tmp_path)
    registry.validate_tools({'search_knowledge'})
    for text in ['维修手册', 'SOP', '手册 SOP']:
        assert [s.name for s in registry.select('example', {'query': text})] == ['merged']
    assert [s.name for s in registry.select('example', {'query': '无专用意图'})] == ['fallback']


def test_report_real_steps_all_map_to_merged_skill():
    from app.agents.report.agent import ReportAgent

    agent = ReportAgent()
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({'report_type': 'trace_report', 'event': {'event_id': 'E-1', 'device_id': 'D-1'}, 'persist': False})
    assert result.report_id
    rows = [row for row in trace.list() if row['event'] == 'step_completed']
    assert [row['name'] for row in rows] == ['initialize', 'load_skill', 'collect_sources', 'check_completeness', 'compose', 'validate', 'persist', 'final']
    assert all(row['state_change']['mapped'] for row in rows)
    assert {row['state_change']['skill'] for row in rows} == {'closure_report_skill'}


def test_recent_memory_maps_real_read_steps_without_learning():
    from app.agents.memory.agent import MemoryAgent
    from app.memory.service import ExperienceLearningModule
    from app.memory.store import LongMemoryStore, ShortMemoryStore
    from runtime_slimming_adapter import ScriptedRAG

    store = LongMemoryStore()
    store.save({'experience_id': 'EXP-READ', 'source_workorder': 'WO-READ', 'device_id': 'D-1', 'content': '主轴维修', 'validation_status': 'accepted', 'memory_saved': True, 'rag_saved': True})
    agent = MemoryAgent(experience_module=ExperienceLearningModule(ShortMemoryStore(), store, ScriptedRAG([])))
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({'action': 'recent', 'limit': 20})
    assert result.success and result.count == 1
    rows = [row for row in trace.list() if row['event'] == 'step_completed']
    assert [row['name'] for row in rows] == ['initialize', 'load_skill', 'retrieve_memory', 'dedup', 'rerank', 'validate', 'final']
    assert all(row['state_change']['mapped'] for row in rows)
    assert {row['state_change']['skill'] for row in rows} <= {'experience_retrieval', 'memory_dedup'}


def test_cad_prepare_real_steps_map_after_bom_skill_merge():
    from app.agents.cad.agent import CADAgent

    agent = CADAgent()
    agent.runtime_trace = trace = TraceRecorder()
    output = agent.graph.invoke({'agent': agent, 'request': {'device_id': 'D-1', 'query': 'BOM'}}, interrupt_after=['prepare'])
    assert output['query_type'] == 'bom'
    rows = [row for row in trace.list() if row['event'] == 'step_completed']
    assert all(row['state_change']['mapped'] for row in rows)
    assert {row['state_change']['skill'] for row in rows} == {'drawing_lookup_skill'}


def test_actual_full_case_report_selects_closed_loop_scope_in_runtime():
    from types import SimpleNamespace
    from app.runtime.action import ActionModel
    from app.runtime.capability import build_capability_registry
    from app.runtime.coordinator import RuntimeCoordinator

    registry = get_skill_registry()
    assert [s.name for s in registry.select('report', {'report_type': 'full_case_report'})] == ['closure_report_skill']
    coordinator = RuntimeCoordinator(SimpleNamespace(capabilities=build_capability_registry()))
    action = ActionModel.agent('report', {'required_capability': 'case_reporting', 'report_type': 'full_case_report'})
    enriched = coordinator._enrich_action(action, {'event': {}, 'context': {}})
    assert enriched.payload['active_skills'] == ['closure_report_skill']
    assert set(enriched.payload['allowed_tools']) == {'get_diagnosis_record', 'get_maintenance_record', 'get_workorder', 'get_quality_record', 'get_trace_summary', 'persist_report'}


def test_actual_full_case_report_real_steps_use_merged_skill():
    from app.agents.report.agent import ReportAgent

    agent = ReportAgent()
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({'report_type': 'full_case_report', 'event': {'event_id': 'E-1', 'device_id': 'D-1'}, 'persist': False})
    assert result.report_type == 'full_case_report'
    assert result.status == 'incomplete'
    rows = [row for row in trace.list() if row['event'] == 'step_completed']
    assert [row['name'] for row in rows] == ['initialize', 'load_skill', 'collect_sources', 'check_completeness', 'compose', 'validate', 'persist', 'final']
    assert all(row['state_change']['mapped'] for row in rows)
    assert {row['state_change']['skill'] for row in rows} == {'closure_report_skill'}
