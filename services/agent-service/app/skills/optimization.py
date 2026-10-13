"""自动优化能力与验证口径；没有实际消费或验证路径的技能不自动入选。"""


def verification_mode(agent, name):
    if agent == 'diagnosis':
        return 'machine_flow'
    if agent == 'knowledge':
        return 'knowledge_flow'
    if agent == 'cad' and name == 'production_modeling_skill':
        return 'cad_spec_flow'
    if agent in {'cad', 'router', 'maintenance', 'workorder', 'quality', 'report', 'memory'}:
        return 'review_flow'
    return ''


def capability(agent, name):
    mode = verification_mode(agent, name)
    return {'enabled': bool(mode), 'mode': mode, 'description': {
        'machine_flow': '诊断规则使用模拟故障闭环验证，保留维修、复机及报告门禁。',
        'knowledge_flow': '检索规则参与只读检索顺序决策，用问题及参考资料验证证据结果。',
        'cad_spec_flow': '建模规则参与规格解析及补充问题，用设计需求验证；不执行实体或生产。',
        'review_flow': '核查规则可自动优化：发布后关注实际输入输出的重点证据和缺项；固定业务算法、审批及控制权限不变。',
        '': '当前为固定业务流程；可维护说明，但自动改正文不改变算法、权限或门禁。',
    }[mode]}


def assessment_keys(mode):
    common = ('skill_used', 'baseline_unchanged', 'dependencies_unchanged')
    return {
        'machine_flow': ('diagnosis', 'maintenance', 'workorder', 'report', *common),
        'knowledge_flow': ('retrieval', 'evidence', 'expected_result', *common),
        'cad_spec_flow': ('specification', 'missing_dimensions', 'expected_result', *common),
        'review_flow': ('evidence_scope', 'expected_result', 'readonly', *common),
    }.get(mode, ())
