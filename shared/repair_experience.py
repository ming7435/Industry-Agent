"""Summarize saved manual repair facts without claiming automatic verification."""
from datetime import datetime, timezone
from hashlib import sha256
import json

from .technician_confirmation import trusted_technician_confirmation


def manual_restart_cycle(order, cycles):
    """Use the completed incident, even if the line has since stopped again."""
    matches = [cycle for cycle in cycles
               if cycle.get('state') == 'running' and cycle.get('restart_method') == 'manual_confirmation'
               and cycle.get('restarted_at') and cycle.get('cycle_id')
               and order.get('workorder_id') in (cycle.get('workorder_ids') or [])
               and order.get('event_id') in (cycle.get('event_ids') or [])]
    if not matches:
        raise ValueError('尚无对应故障的成功启动记录，暂不生成经验总结')
    return max(matches, key=lambda cycle: float(cycle['restarted_at']))


def build_manual_summary(order, cycle):
    if not trusted_technician_confirmation(order) or (order.get('repair_verification') or {}).get('phase') != 'manual_confirmation':
        raise ValueError('经验总结需要已保存的维修人员人工确认记录')
    manual_restart_cycle(order, [cycle])
    diagnosis = order.get('diagnosis_snapshot') or {}
    plan = order.get('maintenance_plan_snapshot') or {}
    feedback = (order.get('repair_feedback') or {}).get('feedback') or ''
    alarm = str(order.get('alarm_code') or diagnosis.get('alarm_code') or (diagnosis.get('raw') or {}).get('alarm_code') or '未记录')
    fault = str(diagnosis.get('fault') or diagnosis.get('summary') or order.get('title') or '设备故障')
    steps = plan.get('repair_steps') or []
    recommendations = '；'.join(str(step) if isinstance(step, str) else json.dumps(step, ensure_ascii=False) for step in steps)
    summary = str(diagnosis.get('summary') or diagnosis.get('diagnosis') or fault)
    key = 'workorder-summary:' + order['workorder_id']
    receipt = order['technician_confirmation']
    report_id = cycle.get('report_id') or 'RPT-CYCLE-' + sha256(cycle['cycle_id'].encode()).hexdigest()[:16].upper()
    content = '\n'.join([
        '设备：' + str(order['device_id']) + '；报警：' + alarm,
        '故障与诊断：' + summary,
        '方案建议（不代表已实际执行）：' + (recommendations or '未记录具体步骤'),
        '实际处理说明：' + str(feedback),
        '处理结果：维修人员人工确认完成后，整线启动指令已成功执行；未进行自动恢复核验。',
        '经验要点：再次出现相同报警时，结合本次诊断和方案检查，并保留新的现场现象、检查结果和实际操作记录。',
        *(['记录限制：本次处理说明仅记录完成，未说明具体操作，不能据此确认根因或换件效果。']
          if str(feedback).strip() in {'完成', '已完成', '维修完成', '处理完成'} else []),
    ])
    return {
        'experience_id': 'EXP-SUM-' + sha256(key.encode()).hexdigest()[:16].upper(),
        'learning_idempotency_key': key, 'learning_scope': 'manual_case_summary',
        'validation_status': 'manual_confirmed', 'automatic_verification': False,
        'rag_saved': False, 'memory_saved': True,
        'knowledge_sync': {'status': 'pending', 'attempts': 0, 'next_retry_at': '',
                           'searchable': False, 'pipeline_ready': False},
        'knowledge_type': 'case', 'record_category': 'case', 'corpus': 'cases',
        'source_basis': '人工确认及启动回执；具体操作以处理说明为准',
        'diagnosis_summary': summary,
        'limitations': ['人工确认后直接复机，未进行自动恢复核验'] +
            (['处理说明仅记录完成，无法确认具体根因、换件或维修效果']
             if str(feedback).strip() in {'完成', '已完成', '维修完成', '处理完成'} else []),
        'title': '维修经验总结 · ' + str(order['device_id']) + ' · 报警 ' + alarm,
        'content': content, 'device_id': order['device_id'], 'alarm_code': alarm,
        'content_revision': sha256(content.encode()).hexdigest(),
        'fault': fault, 'treatment': str(feedback), 'recommended_steps': steps,
        'source_workorder': order['workorder_id'], 'source_event_id': order.get('event_id') or '',
        'source_plan': order.get('plan_id') or '', 'source_report': report_id,
        'cycle_id': cycle['cycle_id'], 'confirmed_by': receipt['actor_id'],
        'confirmation_receipt_id': receipt['receipt_id'], 'confirmed_at': receipt['confirmed_at'],
        'restarted_at': datetime.fromtimestamp(float(cycle['restarted_at']), timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
