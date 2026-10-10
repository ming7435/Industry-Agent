"""按同一故障的已保存业务结果同步阶段，不生成或补写执行轨迹。"""
from datetime import timezone

from .runs import _run_status, _timestamp


def _utc_timestamp(value):
    timestamp = _timestamp(value)
    return timestamp.replace(tzinfo=timezone.utc) if timestamp.tzinfo is None else timestamp.astimezone(timezone.utc)


def reconcile_run_business_facts(runs, facts):
    def ids(record, singular, plural):
        values = record.get(plural) or []
        return {str(value) for value in values if value} | ({str(record[singular])} if record.get(singular) else set())

    for run in runs:
        if run.get('run_type') != 'fault' or not run.get('event_id'):
            continue
        event_id, device_id = run['event_id'], run.get('device_id')
        orders = [o for o in facts.get('workorders', []) if o.get('event_id') == event_id
                  and (not device_id or o.get('device_id') == device_id)]
        order_ids = {o['workorder_id'] for o in orders}
        phases = {phase['id']: phase for phase in run['phases']}

        def set_phase(phase_id, status, records, key, reason=''):
            phase = phases[phase_id]
            phase.update(status=status, status_source='business', business_record_ids=[r[key] for r in records if r.get(key)])
            if reason:
                phase['status_reason'] = reason
            else:
                phase.pop('status_reason', None)

        if orders:
            assigned = [o for o in orders if o.get('assignee') and o.get('status') in {'in_progress', 'completed', 'closed'}]
            set_phase('workorder', 'completed' if assigned else 'blocked', orders, 'workorder_id',
                      '' if assigned else '工单尚未成功派发，请核对负责人和派发结果')
        reports = [r for r in facts.get('reports', []) if r.get('report_type') in {None, '', 'full_case_report', 'maintenance_report'}
                   and (order_ids.intersection(ids(r, 'workorder_id', 'workorder_ids'))
                        or (event_id in ids(r, 'event_id', 'event_ids')
                            and device_id in ids(r, 'device_id', 'device_ids')))]
        if reports:
            latest = max(reports, key=lambda r: str(r.get('updated_at') or r.get('created_at') or ''))
            status = str(latest.get('status') or '')
            state = 'completed' if status == 'completed' and latest.get('persisted') is not False else 'error' if status in {'error', 'failed'} else 'blocked'
            reason = '；'.join(str(v) for v in (latest.get('validation_findings') or [])[:3])
            set_phase('report', state, [latest], 'report_id', reason or ('报告内容尚未完整，请补齐所需记录' if state == 'blocked' else ''))
        experiences = [r for r in facts.get('experiences', []) if (r.get('source_workorder') or r.get('workorder_id')) in order_ids]
        if experiences:
            accepted = []
            for record in experiences:
                try:
                    score = float(record.get('experience_quality_score') or 0)
                except (TypeError, ValueError):
                    score = 0
                manual_summary = (record.get('learning_scope') == 'manual_case_summary'
                                  and record.get('validation_status') == 'manual_confirmed'
                                  and record.get('memory_saved') in (True, 1) and record.get('confirmation_receipt_id'))
                if (manual_summary and record.get('rag_saved') is True) or (record.get('validation_status') in {'accepted', 'duplicate'} and score >= .8 and record.get('rag_saved') is not False):
                    accepted.append(record)
            set_phase('experience', 'completed' if accepted else 'blocked', accepted or experiences, 'experience_id',
                      '' if accepted else ('经验已保存，可通过关键词检索；向量索引待后台自动重试'
                          if any((record.get('knowledge_sync') or {}).get('searchable') for record in experiences)
                          else '经验记录已保存，知识库索引待后台自动同步'))
        if not any(p.get('status_source') == 'business' for p in phases.values()):
            continue
        # 派工、报告或经验在自动执行停止后继续推进时，原终态不再代表当前闭环。
        progressed = any(_utc_timestamp(record.get('updated_at') or record.get('created_at')) > _utc_timestamp(run.get('runtime_ended_at') or run.get('ended_at'))
                         for record in [*orders, *reports, *experiences])
        if run['status'] not in {'blocked', 'error', 'failed', 'timeout'} or progressed:
            if run.get('stop_reason'):
                run['runtime_stop_reason'] = run['stop_reason']
            run['status'] = _run_status(run['phases'])
            blocked = next((p for p in run['phases'] if p.get('status_source') == 'business' and p['status'] in {'blocked', 'error'}), None)
            run['stop_reason'] = blocked['id'] + '_incomplete' if blocked else ''
            if blocked:
                run['status_reason'] = blocked.get('status_reason', '')
    return runs
