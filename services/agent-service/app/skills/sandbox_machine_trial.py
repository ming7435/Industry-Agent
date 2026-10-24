"""Host-side receipt for one-shot machine-flow simulation."""

from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from time import time
from uuid import uuid4

from app.skills.management import AGENTS, SkillEditError
from app.skills.machine_testing import MachineDraftRegistry
from app.skills.optimization import assessment_keys
from app.skills.testing import TrialFailure, fingerprint


STAGES = (
    ("智能诊断", "diagnosis"), ("维修方案", "maintenance"), ("虚拟工单", "workorder"),
    ("模拟维修确认", "workorder"), ("模拟复机", "workorder"), ("模拟报告", "report"),
)


def start(trials, agent, name, values, actor):
    if actor.get('role') != 'technician' or not actor.get('user_id'):
        raise SkillEditError(403, '请使用负责设备的维修人员账号测试')
    machine_input = values['machine']
    sop = str(machine_input.get('sop_document') or '').strip()
    if not sop:
        raise SkillEditError(422, '请填写测试用 SOP 或知识库依据，才能验证维修闭环')
    machines = trials.catalog_machines(actor)['items']
    machine = next((item for item in machines if item['device_id'] == machine_input['device_id']), None)
    scenario = next((item for item in (machine or {}).get('scenarios', [])
                     if item['scenario_id'] == machine_input['scenario_id']), None)
    if not scenario:
        raise SkillEditError(409, '请选择本人负责的模拟设备及故障场景')
    if name == 'no_alarm_diagnosis_skill' and scenario.get('alarm_code'):
        raise SkillEditError(422, '无报警诊断需要选择不含报警码的异常场景')
    if name == 'alarm_diagnosis_skill' and not scenario.get('alarm_code'):
        raise SkillEditError(422, '报警诊断需要选择包含报警码的故障场景')
    with trials.lock:
        if actor['user_id'] in trials.active or not trials.slots.acquire(blocking=False):
            raise SkillEditError(409, '样例测试正在运行，请等待结果后重试')
        trials.active.add(actor['user_id'])
    try:
        with trials.manager._transaction():
            current = trials.manager._detail(agent, name)
            if current['revision'] != values['expected_revision']:
                raise SkillEditError(409, '线上技能已变化，请刷新后重新测试')
            if set(current['tools']) - trials.manager.available_tools:
                raise SkillEditError(503, '技能工具尚未注册，不能测试')
            dependencies = trials._dependencies()
            definitions = {}
            for folder in AGENTS:
                definitions[folder] = []
                for skill in trials.manager.registry.list(folder):
                    if folder == agent and skill.name == name:
                        skill = replace(skill, document=values['document'].strip(), goal=values['goal'].strip(),
                                        version=values['version'].strip(), metadata={**skill.metadata,
                                            'goal': values['goal'].strip(), 'version': values['version'].strip()})
                    definitions[folder].append(skill)
            if dependencies != trials._dependencies():
                raise SkillEditError(409, '线上技能正在变化，请重新测试')
            record = {'test_id': uuid4().hex, 'actor_id': actor['user_id'], 'agent': agent, 'name': name,
                      'fingerprint': fingerprint(values), 'dependencies': dependencies, 'instance': trials.instance,
                      'baseline_revision': current['revision'], 'created_epoch': time(),
                      'created_at': datetime.now(timezone.utc).isoformat(), 'status': 'running',
                      'mode': 'machine_flow', 'simulation': True,
                      'scope': '一次性沙箱内模拟诊断、维修方案、虚拟工单、维修确认、复机和报告；不操作设备或正式业务记录。',
                      'machine': {**machine_input, 'name': machine['name'],
                                  'alarm_code': scenario.get('alarm_code') or ''},
                      'sample': {'scenario': scenario.get('summary') or scenario.get('name') or '',
                                 'alarm_code': scenario.get('alarm_code') or '',
                                 'alarm_definition': scenario.get('name') or '',
                                 'severity': 'critical', 'sop_document': sop,
                                 'expected': machine_input['expected']},
                      'event_id': '', 'workorders': [], 'report_id': '', 'result': None,
                      'progress': [{'label': label, 'completed': False} for label, _ in STAGES],
                      'message': '正在一次性沙箱中验证完整模拟闭环'}
            registry = MachineDraftRegistry(trials.manager.registry.root, definitions)
            trials._write(record)
        trials.pool.submit(trials._execute, record, registry)
        return trials._public(record)
    except Exception:
        with trials.lock:
            trials.active.discard(actor['user_id'])
            trials.slots.release()
        raise


def execute(trials, record, registry, sandbox):
    payload = {'agent': record['agent'], 'name': record['name'], 'mode': 'machine_flow',
               'test_id': record['test_id'], 'sample': {key: value for key, value in record['sample'].items()
                                                      if key != 'expected'},
               'definitions': [{'agent': folder, 'metadata': dict(item.metadata), 'document': item.document}
                               for folder in AGENTS for item in registry.list(folder)]}
    response = sandbox.run(payload)
    if not response.get('ok'):
        raise TrialFailure(str(response.get('message') or '沙箱模拟闭环未通过'))
    criteria = response.get('criteria')
    result = response.get('result')
    required = set(assessment_keys('machine_flow')) - {'baseline_unchanged', 'dependencies_unchanged'}
    if (response.get('simulation') is not True or not isinstance(result, dict)
            or not isinstance(criteria, dict) or set(criteria) != required
            or any(type(value) is not bool for value in criteria.values())):
        raise TrialFailure('沙箱未返回有效的模拟闭环验收结果')
    order, report, plan = (result.get(key) for key in ('workorder', 'report', 'maintenance_plan'))
    if (not all(isinstance(result.get(key), str) and result[key].strip()
                for key in ('summary', 'diagnosis', 'recommendation'))
            or not isinstance(plan, dict) or plan.get('workorder_ready') is not True
            or not isinstance(order, dict) or order.get('simulation') is not True
            or not str(order.get('workorder_id') or '').startswith('SIM-WO-')
            or order.get('status') != 'completed'
            or not isinstance(report, dict) or report.get('simulation') is not True
            or report.get('status') != 'completed'):
        raise TrialFailure('沙箱模拟结果缺少完整的虚拟工单或报告')
    with trials.manager._transaction():
        criteria.update(baseline_unchanged=trials.manager._detail(record['agent'], record['name'])['revision'] == record['baseline_revision'],
                        dependencies_unchanged=trials._dependencies() == record['dependencies'])
        accepted = all(criteria.values())
        record.update(status='completed' if accepted else 'failed', result=result,
                      details={'diagnosis': {key: result.get(key) for key in ('summary', 'diagnosis', 'recommendation')},
                               'maintenance_plan': result.get('maintenance_plan'),
                               'workorders': [result.get('workorder')], 'report': result.get('report'),
                               'restart': {'completed': criteria['workorder'], 'simulation': True}},
                      progress=[{'label': label, 'completed': bool(criteria.get(key))} for label, key in STAGES],
                      message='沙箱模拟闭环已通过，请核对结果后发布。' if accepted else '沙箱模拟闭环未通过或线上版本已变化，请重新测试。',
                      assessment={'schema': 1, 'assessment_id': record['test_id'],
                                  'agent': record['agent'], 'name': record['name'],
                                  'trial_fingerprint': record['fingerprint'],
                                  'completed_at': datetime.now(timezone.utc).isoformat(),
                                  'accepted': accepted, 'criteria': criteria,
                                  'basis': 'machine_flow_receipt', 'simulation': True})
        trials._write(record)
