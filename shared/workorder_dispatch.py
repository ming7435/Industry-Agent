"""Workorder scope for following up a diagnosed fault with pending engineering data.

The saved plan remains evidence. This scope authorizes no replacement, stock issue,
equipment command, or claim that the plan's engineering checks have passed.
"""
from copy import deepcopy
from math import isfinite
import os
from collections.abc import Mapping


def layers(value):
    for _ in range(8):
        if not isinstance(value, Mapping):
            return
        yield value
        value = value.get('raw')


def followup_steps():
    return [
        '遵守现场隔离和安全要求，核对本工单设备、报警及现有维修方案',
        '读取报警、状态和已有反馈，从安全位置观察故障现象并记录现场核查结果',
        '工程部件、图纸或备件待核实时，不执行拆装、更换、调参或旁路互锁；补齐对应依据后处理',
        '填写实际处理结果；申请恢复时由系统独立核验设备报警、指标与整线条件',
    ]


def followup_findings(plan, diagnosis, event):
    """Only engineering/inventory gaps may become pending items on a task."""
    if not all(isinstance(value, Mapping) for value in (plan, diagnosis, event)):
        return ['方案、诊断或事件缺失']
    identities = {'device_id':str(event.get('device_id') or ''),
                  'event_id':str(event.get('event_id') or ''),
                  'alarm_code':str(event.get('alarm_code') or '')}
    if not all(identities.values()) or not plan.get('plan_id'):
        return ['故障任务缺少设备、事件、报警或方案编号']
    sources = [event, *layers(plan), *layers(diagnosis), *layers(plan.get('diagnosis'))]
    for item in sources:
        if (item.get('maintenance_required') is False or item.get('requires_maintenance') is False
                or item.get('disposition') in {'no_action','monitor_only'}):
            return ['该异常明确无需维修任务']
        if any(item.get(key) in (True, 'true', '1') for key in
               ('requires_approval','synthetic','requires_human_review','degraded')):
            return ['诊断或方案要求审批、复核或含非正式证据']
        if item.get('evidence_validated') is False or item.get('validated') is False:
            return ['诊断证据校验未通过']
        for key, expected in identities.items():
            if item.get(key) and str(item[key]) != expected:
                return ['方案、诊断和事件归属不一致']
    combined = {}
    for item in reversed(list(layers(diagnosis))):
        combined.update(item)
    if combined.get('maintenance_required') is not True and plan.get('maintenance_required') is not True:
        return ['尚未确认需要故障处理']
    try:
        confidence = float(combined.get('confidence'))
        threshold = max(0.8, float(os.getenv('AUTO_WORKORDER_MIN_CONFIDENCE','0.80')))
    except (ValueError, TypeError):
        return ['诊断置信度未达到派发要求']
    if isinstance(combined.get('confidence'), bool) or not isfinite(confidence) or not threshold <= confidence <= 1:
        return ['诊断置信度未达到派发要求']
    if combined.get('evidence_status') != 'ready' or not (combined.get('evidence') or combined.get('evidence_records')):
        return ['诊断证据尚未就绪']
    if any(item.get('validation_findings') or item.get('validation_errors') for item in layers(diagnosis)):
        return ['诊断校验未通过']
    if not plan.get('repair_steps') or not (plan.get('safety_requirements') or plan.get('safety')):
        return ['方案缺少步骤或安全要求']
    pending = list(plan.get('validation_findings') or []) + list(plan.get('validation_errors') or [])
    prefixes = ('已找到设备图纸，但缺少与故障部件匹配的工程部件',
                'CAD/BOM 工程证据未通过校验', 'CAD/BOM 工程证据校验未通过',
                '所需备件库存缺失或不可用：', '备件库存为演示数据，不能作为正式派工依据')
    if not pending or any(not isinstance(item,str) or not item.startswith(prefixes) for item in pending):
        return ['存在工程资料以外的未通过校验项']
    return []


def followup_values(plan, diagnosis, event, idempotency_key):
    findings = followup_findings(plan, diagnosis, event)
    if findings:
        raise ValueError('；'.join(findings))
    return {
        'device_id':event['device_id'], 'event_id':event['event_id'], 'alarm_code':str(event['alarm_code']),
        'plan_id':plan['plan_id'], 'title':'故障处理 · ' + str(diagnosis.get('fault') or '报警 '+str(event['alarm_code'])),
        'steps':followup_steps(), 'required_parts':deepcopy(plan.get('required_parts') or []),
        'repair_target':deepcopy(plan.get('target_part') or {}),
        'diagnosis_snapshot':deepcopy(diagnosis), 'maintenance_plan_snapshot':deepcopy(plan),
        'diagnosis_context':{key:diagnosis[key] for key in ('fault','summary','cause','recommendation') if key in diagnosis},
        'source':'saved-plan-dispatch', 'idempotency_key':idempotency_key,
        'risk_level':plan.get('risk_level') or '', 'dispatch_mode':'fault_followup',
        'dispatch_findings':deepcopy(list(plan.get('validation_findings') or []) + list(plan.get('validation_errors') or [])),
    }


def validate_followup_order(order):
    if order.get('dispatch_mode') != 'fault_followup':
        return
    plan, diagnosis = order.get('maintenance_plan_snapshot') or {}, order.get('diagnosis_snapshot') or {}
    findings = followup_findings(plan, diagnosis, order)
    if (order.get('steps') != followup_steps() or order.get('plan_id') != plan.get('plan_id')
            or order.get('required_parts') != (plan.get('required_parts') or [])
            or order.get('dispatch_findings') != list(plan.get('validation_findings') or []) + list(plan.get('validation_errors') or [])):
        findings.append('故障跟进任务范围或方案引用不一致')
    if findings:
        raise ValueError('；'.join(findings))
