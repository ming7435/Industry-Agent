"""Complete business report presentation with de-duplicated raw sampling receipts."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import json
import re


def report_article(report):
    """Write a full article from saved evidence, recommendations and actual receipts."""
    source = report.get('sections') or {}
    cycle = source.get('lifecycle') or {}

    def records(name):
        value = source.get(name) or {}
        if not isinstance(value, dict):
            return []
        return [item for item in value.get('records', [value] if value else []) if isinstance(item, dict)]

    def text(value, *keys):
        if isinstance(value, str):
            value = re.sub(r'\s+', ' ', value).strip().replace('**', '')
            labels = {'barfeed_ready_signal': '送料机就绪信号', 'spindle_rpm': '主轴转速',
                'spindle_load_percent': '主轴负载', 'hydraulic_pressure_psi': '液压总压力',
                'chuck_pressure_psi': '卡盘压力', 'spindle_vibration_mm_s': '主轴振动',
                'turret_servo_load_percent': '刀塔伺服负载', 'running/idle': '运行或待机'}
            for key, label in labels.items():
                value = value.replace(key, label)
            return value
        if isinstance(value, dict):
            return next((text(value[key]) for key in keys if isinstance(value.get(key), str) and value[key].strip()), '')
        return ''

    def excerpt(value, limit):
        value = value.strip('，；。 ')
        if len(value) <= limit:
            return value
        endings = [m.end() for m in re.finditer(r'[。；！？]', value) if m.end() <= limit]
        return value[:endings[-1]].rstrip('。；') if endings else value[:limit - 1].rstrip('，；。 ') + '…'

    def local_time(value):
        try:
            stamp = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            if not stamp.tzinfo:
                stamp = stamp.replace(tzinfo=timezone.utc)
            return stamp.astimezone(timezone(timedelta(hours=8))).strftime('%Y年%m月%d日%H:%M:%S')
        except (ValueError, TypeError):
            return ''

    diagnoses, plans, orders = records('diagnosis'), records('maintenance_plan'), records('workorder')
    experiences = records('experience')
    device = next((text(r.get('device_id')) for r in orders + diagnoses if r.get('device_id')), '')
    alarm = next((str(r['alarm_code']) for r in diagnoses + orders + cycle.get('faults', []) if r.get('alarm_code')), '')
    diagnosis_parts = []
    for record in diagnoses:
        body = text(record, 'diagnosis', 'conclusion', 'fault', 'summary')
        # The saved diagnosis may quote the event's UTC clock; narrate it in Beijing time.
        stamp = record.get('triggered_at')
        try:
            anchor = datetime.fromisoformat(str(stamp).replace('Z', '+00:00'))
            if not anchor.tzinfo:
                anchor = anchor.replace(tzinfo=timezone.utc)
            local = anchor.astimezone(timezone(timedelta(hours=8)))
            raw_clock, local_clock = anchor.strftime('%H:%M'), local.strftime('%H:%M')
            if raw_clock != local_clock:
                body = re.sub(r'(?<!\d)' + re.escape(raw_clock) + r'(?![\d:])', local_clock, body)
            raw_date = anchor.strftime('%Y-%m-%d')
            body = body.replace(raw_date + 'T' + anchor.strftime('%H:%M:%S'), local.strftime('%Y年%m月%d日%H:%M:%S'))
            body = body.replace(raw_date + ' ' + raw_clock, local.strftime('%Y年%m月%d日%H:%M'))
        except (ValueError, TypeError):
            pass
        if body and body not in diagnosis_parts:
            diagnosis_parts.append(body)
    diagnosis = '；'.join(diagnosis_parts)
    steps = [text(step, 'instruction', 'description', 'text', 'title') for r in plans
             for step in (r.get('repair_steps') or r.get('steps') or r.get('checks') or [])]
    plan = '、'.join(filter(None, steps)) or '；'.join(filter(None, (text(r, 'summary', 'description') for r in plans)))
    feedback = '；'.join(dict.fromkeys(filter(None, [text(r.get('repair_feedback'), 'feedback', 'summary', 'result') for r in orders]
        + [text(r, 'feedback', 'summary', 'result') for r in records('repair_feedback')])))
    people = '、'.join(dict.fromkeys(text(r.get('assignee_name')) for r in orders if r.get('assignee_name')))
    checks = records('repair_verification') + [r.get('inspection_verification') or r.get('repair_verification') or {} for r in orders]
    manual = cycle.get('restart_method') == 'manual_confirmation' or any(r.get('phase') == 'manual_confirmation' for r in checks)
    started, restarted = local_time(cycle.get('started_at')), local_time(cycle.get('restarted_at'))
    saved_lesson = '；'.join(filter(None, (text(e, 'lesson', 'experience_summary', 'summary') for e in experiences)))
    limited = any('具体' in str(e.get('limitations') or '') or '根因' in str(e.get('limitations') or '') for e in experiences)

    first = (started + '，' if started else '本次故障处理中，') + (device or '相关设备')
    first += '出现' + alarm + '报警' if alarm else '发生故障'
    first += '并触发整线停机。' if cycle else '。'
    if cycle.get('device_ids'):
        first += '本次停机涉及整线' + str(len(cycle['device_ids'])) + '台设备。'
    first += '本报告依据已保存的故障事件、诊断结果、维修方案、工单反馈及启动回执，记录从发现异常到恢复运行的处理过程，保留各环节的关联关系。'

    second = '智能诊断结合报警定义、历史趋势和设备日志进行分析。'
    second += excerpt(diagnosis, 700).rstrip('。') + '。' if diagnosis else '当前未保存明确的诊断结论，无法补充故障定位依据。'
    confidences = [r['confidence'] for r in diagnoses if type(r.get('confidence')) in (int, float) and 0 <= r['confidence'] <= 1]
    if confidences:
        second += '诊断记录给出的置信度为' + '、'.join(str(round(v * 100, 1)) + '%' for v in dict.fromkeys(confidences)) + '。'

    recommendations = '；'.join(filter(None, (text(r, 'recommendation') for r in diagnoses)))
    recommendations = re.sub(r'(?<!\d)\d+\)\s*', '', recommendations).replace(';', '；')
    third = ('针对上述故障，诊断建议' + excerpt(recommendations, 150) + '。' if recommendations else '')
    third += '维修方案建议' + excerpt(plan, 160) + '。' if plan else '当前未保存维修方案，无法还原计划中的检查步骤。'
    for keys, prefix, cap in [(('safety_requirements', 'safety'), '方案要求', 90),
                              (('required_tools', 'tools'), '拟使用的工具包括', 60),
                              (('post_checks',), '计划中的维修后检查包括', 95)]:
        points = []
        for record in plans:
            items = next((record.get(key) for key in keys if record.get(key)), [])
            points.extend(filter(None, (text(item, 'instruction', 'description', 'text', 'title') for item in items)))
        if points:
            third += prefix + excerpt('、'.join(dict.fromkeys(points)).replace('LOTO ', ''), cap) + '。'
    third += '以上内容为方案建议，实际执行情况以工单中的处理反馈为依据。'

    fourth = ('系统将维修任务派发给' + people + '，' if people else '工单处理过程中，')
    ids = '、'.join(r['workorder_id'] for r in orders if r.get('workorder_id'))
    fourth += '关联工单为' + ids + '。' if ids else '当前未记录工单编号。'
    for order in orders:
        created, completed = local_time(order.get('created_at')), local_time(order.get('completed_at'))
        if created:
            fourth += '工单于' + created + '创建。'
        if completed:
            fourth += '维修完成确认于' + completed + '提交。'
    fourth += '处理说明记录为“' + excerpt(feedback, 240) + '”。' if feedback else '当前未保存实际处理说明，无法还原维修人员执行的具体操作。'
    if limited:
        fourth += '具体操作未记录，缺少换件项目和复测数值，不能据此确认故障根因或换件效果。'

    fifth = ('维修人员人工确认后，' if manual else '根据已保存的复机记录，')
    fifth += '整线于' + restarted + '恢复运行。' if restarted else '当前尚无整线复机记录。'
    duration = cycle.get('duration_seconds')
    if type(duration) in (int, float):
        fifth += '本次停机处理持续' + str(round(duration, 1)) + '秒，按停机开始至整线启动回执的时间差计算。'
    if manual:
        fifth += '此次采用人工确认流程，未进行自动恢复核验，复机依据为人员确认及启动指令执行回执。'
    elif any(r.get('passed') is False for r in checks):
        fifth += '已记录的检查结果未通过，仍需继续处理。'
    elif any(r.get('passed') is True for r in checks):
        fifth += '已记录的检查结果通过。'
    fifth += '后续运行如再次出现同类报警，应结合新的监控状态和现场检查结果重新判断。'

    if experiences:
        searchable = all(e.get('rag_saved') is True or (e.get('knowledge_sync') or {}).get('searchable') for e in experiences)
        sixth = '本次处理经验已保存，可供后续同类故障检索参考。' if searchable else '本次处理经验已保存，检索索引仍待同步。'
        if searchable and any(e.get('rag_saved') is not True for e in experiences):
            sixth += '当前可通过关键词索引检索，部分检索索引仍在后台同步。'
        sixth += excerpt(saved_lesson, 180) + '。' if saved_lesson and not limited else '经验内容关联本次诊断、方案建议、实际反馈及复机结果。'
    else:
        sixth = '本次报告已汇总诊断、方案及工单记录，经验总结尚未生成。'
    sixth += '后续应补充现场现象、实际处理操作、检测数据和报警变化；只有记录了具体措施及对应结果，才能形成可复用的维修经验，帮助后续人员核对相同故障的排查方向。'
    return '\n\n'.join([first, second, third, fourth, fifth, sixth])


def concise_report_sections(report):
    """Business prose only, at most 500 characters, shared by the page and PDF."""
    source = report.get('sections') or {}
    cycle = source.get('lifecycle') or {}

    def records(name):
        value = source.get(name) or {}
        return value.get('records', [value] if value else []) if isinstance(value, dict) else []

    def text(value, *keys):
        if isinstance(value, str):
            return re.sub(r'\s+', ' ', value).strip().replace('**', '')
        if isinstance(value, dict):
            return next((text(value[key]) for key in keys if isinstance(value.get(key), str) and value[key].strip()), '')
        return ''

    def local_time(value):
        if not value:
            return '未记录'
        try:
            stamp = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            if not stamp.tzinfo:
                stamp = stamp.replace(tzinfo=timezone.utc)
            return stamp.astimezone(timezone(timedelta(hours=8))).strftime('%m月%d日%H:%M:%S')
        except (ValueError, TypeError):
            return '未记录'

    diagnoses, plans, orders = records('diagnosis'), records('maintenance_plan'), records('workorder')
    experiences = records('experience')
    device = next((r.get('device_id') for r in orders + diagnoses if r.get('device_id')), '')
    alarm = next((r.get('alarm_code') for r in diagnoses + orders if r.get('alarm_code')), '')
    if not alarm:
        alarm = next((f.get('alarm_code') for f in cycle.get('faults', []) if f.get('alarm_code')), '')
    overview = '；'.join(part for part in [device, '报警' + str(alarm) if alarm else '',
        '停机：' + local_time(cycle.get('started_at')) if cycle else ''] if part) or '故障信息未记录'
    diagnosis = '；'.join(text(r, 'conclusion', 'fault', 'diagnosis', 'summary') for r in diagnoses)
    steps = [text(step, 'instruction', 'description', 'text', 'title') for r in plans
             for step in (r.get('repair_steps') or r.get('steps') or r.get('checks') or [])]
    plan = '；'.join(step for step in steps if step) or '；'.join(text(r, 'summary', 'description') for r in plans)
    feedbacks = [text(r.get('repair_feedback'), 'feedback', 'summary', 'result') for r in orders]
    feedbacks += [text(r, 'feedback', 'summary', 'result') for r in records('repair_feedback')]
    feedback = '；'.join(dict.fromkeys(value for value in feedbacks if value))
    people = '、'.join(dict.fromkeys(str(r.get('assignee_name')) for r in orders if r.get('assignee_name')))
    checks = records('repair_verification') + [r.get('inspection_verification') or r.get('repair_verification') or {} for r in orders]
    manual = cycle.get('restart_method') == 'manual_confirmation' or any(r.get('phase') == 'manual_confirmation' for r in checks)
    execution = ('负责人：' + people + '。' if people else '') + ('实际处理：' + feedback + '。' if feedback else '处理说明未记录。')
    if manual:
        execution += '人工确认；未进行自动恢复核验。'
    elif any(r.get('passed') is False for r in checks):
        execution += '检查未通过。'
    elif any(r.get('passed') is True for r in checks):
        execution += '检查通过。'
    if cycle.get('restarted_at'):
        execution += local_time(cycle['restarted_at']) + '整线复机。'
        if isinstance(cycle.get('duration_seconds'), (int, float)):
            execution += '停机处理' + str(cycle['duration_seconds']) + '秒。'
    else:
        execution += '尚无复机记录。'
    if experiences:
        searchable = all(e.get('rag_saved') is True or (e.get('knowledge_sync') or {}).get('searchable') for e in experiences)
        lesson = '经验已保存，可供后续检索参考。' if searchable else '经验已保存，检索索引同步待完成。'
        if any('具体' in str(e.get('limitations') or '') or '根因' in str(e.get('limitations') or '') for e in experiences):
            lesson += '具体操作未记录，不能确认根因或换件效果。'
        else:
            points = [text(e, 'lesson', 'experience_summary', 'summary') for e in experiences]
            lesson += '；'.join(point for point in points if point)
    else:
        lesson = '经验总结尚未生成。'
    values = [('停机到复机', overview, 80), ('智能诊断', diagnosis or '诊断结论未记录', 110),
              ('维修方案', plan or '维修方案未记录', 70), ('工单执行与检查', execution, 135), ('经验总结', lesson, 65)]
    result, remaining = [], 500 - sum(len(title) for title, _, _ in values)
    for title, body, cap in values:
        budget = min(cap, remaining)
        clipped = body
        if len(body) > budget:
            # End at a complete sentence rather than cutting a value or timestamp.
            endings = [match.end() for match in re.finditer(r'[。；！？]', body) if match.end() <= budget]
            clipped = body[:endings[-1]] if endings else body[:budget - 1].rstrip('，；。 ') + '…'
        result.append({'title': title, 'body': clipped})
        remaining -= len(clipped)
    return result


def _sampling_summary(value):
    if isinstance(value, dict):
        return {key: _sampling_summary(items) for key, items in value.items()}
    if not isinstance(value, list) or not value:
        return value
    numbers = [item.get('value') for item in value if isinstance(item, dict) and type(item.get('value')) in (float, int)]
    result = {'sample_count': len(value), 'source_basis': '逐点采样已完整保留在原始报告 JSON 中'}
    if numbers:
        result.update(min=min(numbers), max=max(numbers), mean=round(sum(numbers) / len(numbers), 4),
                      first=numbers[0], latest=numbers[-1])
    for key, index in [('started_at', 0), ('ended_at', -1)]:
        stamp = value[index].get('timestamp') if isinstance(value[index], dict) else None
        if isinstance(stamp, (int, float)):
            result[key] = datetime.fromtimestamp(stamp / 1000 if stamp > 10**11 else stamp, timezone.utc).isoformat()
        elif stamp:
            result[key] = stamp
    return result


def _clean(value):
    if isinstance(value, list):
        return [_clean(item) for item in value]
    if not isinstance(value, dict):
        return deepcopy(value)
    result = {}
    for key, item in value.items():
        if key in {'series', 'history'} and isinstance(item, (list, dict)):
            result[key + '_summary'] = _sampling_summary(item)
        else:
            result[key] = _clean(item)
    return result


def report_presentation(sections):
    """Keep every business record, evidence text, and source ID; summarize sample arrays."""
    if not sections.get('lifecycle'):
        return deepcopy(sections)
    cycle = sections['lifecycle']
    result = {'lifecycle': {key: deepcopy(cycle[key]) for key in
        ('cycle_id', 'started_at', 'stopped_at', 'restarted_at', 'duration_seconds',
         'device_ids', 'event_ids', 'reason', 'restart_method') if key in cycle}}
    result['lifecycle']['devices'] = [
        {'device_id': item.get('device_id') or identity, 'action': item.get('action'),
         'state': item.get('state'), 'restart_method': item.get('restart_method'),
         'returned_state': ((item.get('response') or {}).get('device') or {}).get('status')}
        for identity, item in (cycle.get('devices') or {}).items()]
    omit = {'diagnosis': {'tool_calls', 'active_skill', 'active_skills', 'cached'},
            'maintenance_plan': {'diagnosis', 'workorder_draft'},
            'workorder': {'diagnosis_snapshot', 'maintenance_plan_snapshot', 'diagnosis_context'}}
    for name in ('diagnosis', 'maintenance_plan', 'workorder', 'repair_feedback', 'repair_verification', 'experience', 'references'):
        records = []
        for item in (sections.get(name) or {}).get('records') or []:
            record = {key: _clean(value) for key, value in item.items() if key not in omit.get(name, set())}
            # Several evidence sentences may quote the very same tool response.
            # Keep all sentences; attach the complete sampling summary once.
            seen = set()
            for evidence in record.get('evidence_records') or []:
                if not isinstance(evidence, dict) or 'result' not in evidence:
                    continue
                fingerprint = json.dumps(evidence['result'], ensure_ascii=False, sort_keys=True)
                if fingerprint in seen:
                    evidence.pop('result')
                    evidence['source_basis'] = '同工具、同来源的证据结果见本节首次记录'
                seen.add(fingerprint)
            records.append(record)
        result[name] = {'records': records}
    return result
