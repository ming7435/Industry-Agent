"""从设备停机、诊断、维修执行和复机事实汇总故障处理报告。"""
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import logging

from ..line_control.repository import LineControlRepository

log = logging.getLogger(__name__)
COMPOSITION_VERSION = 7


def iso(timestamp):
    return datetime.fromtimestamp(float(timestamp), timezone.utc).isoformat() if timestamp else ''


def aggregate(records, **empty):
    return {**(deepcopy(records[0]) if records else empty), 'records': deepcopy(records)}


class LifecycleReports:
    def __init__(self, business):
        self.business = business
        self.ledger = LineControlRepository(business.team.repository)

    def sync(self):
        cycles = self.ledger.status().get('completed_cycles', [])
        if not cycles:
            return
        reports = {r['report_id']: self.business._normalize_report(r) for r in self.business._list_records('report')}
        experiences = self.business._list_records('experience')
        for cycle in cycles:
            report_id = 'RPT-CYCLE-' + sha256(cycle['cycle_id'].encode()).hexdigest()[:16].upper()
            try:
                preview = reports.get(report_id)
                if cycle.get('report_status') == 'generated':
                    if not preview:
                        continue
                    current_experiences = [item for item in experiences if item.get('cycle_id') == cycle['cycle_id']
                        or item.get('source_workorder') in (preview.get('workorder_ids') or [])]
                    if (preview.get('composition_version') == COMPOSITION_VERSION
                            and (preview.get('sections', {}).get('experience') or {}).get('records') == current_experiences):
                        continue  # 未变化的历史报告不重新汇总或写库。
                # 与质检写入和报告删除串行化；锁释放后才更新产线报告回执。
                with self.business.repository.quality_transaction():
                    saved = self.business.get_report(report_id)['report']
                    if not saved and cycle.get('report_status') == 'generated':
                        continue
                    report = self.compose(cycle, saved)
                    if not saved or report != saved:
                        result = self.business.persist_report(report=report)
                        if not result.get('persisted'):
                            raise ValueError('未确认报告保存成功')
                if cycle.get('report_status') != 'generated':
                    self.ledger.record_cycle_report(cycle['cycle_id'], report_id)
            except Exception as error:
                log.warning('停机周期报告待重试 %s: %s', cycle['cycle_id'], type(error).__name__)
                # 意图随复机结果保存，下一次读取报告时可恢复，包括进程重启。
                if cycle.get('report_status') != 'generated':
                    try:
                        self.ledger.record_cycle_report(cycle['cycle_id'], report_id, 'pending', type(error).__name__)
                    except Exception:
                        log.warning('报告重试状态暂未保存 %s', cycle['cycle_id'])

    def compose(self, cycle, saved):
        if saved:
            report = deepcopy(saved)
            orders = report['sections']['workorder'].get('records', [])
        else:
            identities = {(f['event_id'], f['device_id']) for f in cycle['faults']}
            orders = [deepcopy(o) for o in self.business.repository.list()
                      if (o.get('event_id'), o.get('device_id')) in identities
                      or o.get('workorder_id') in (cycle.get('workorder_ids') or [])]
            orders.sort(key=lambda o: o['workorder_id'])
            diagnoses = [{'device_id': o['device_id'], 'event_id': o['event_id'], **o['diagnosis_snapshot'], 'workorder_id': o['workorder_id']}
                         for o in orders if o.get('diagnosis_snapshot')]
            plans = [{**o['maintenance_plan_snapshot'], 'workorder_id': o['workorder_id']}
                     for o in orders if o.get('maintenance_plan_snapshot')]
            feedback = [{**o['repair_feedback'], 'workorder_id': o['workorder_id']}
                        for o in orders if o.get('repair_feedback')]
            checks = [{**(o.get('inspection_verification') or o.get('repair_verification') or {}),
                       'workorder_id': o['workorder_id']} for o in orders
                      if o.get('inspection_verification') or o.get('repair_verification')]
            lifecycle = {k: deepcopy(v) for k, v in cycle.items() if k not in {'report_status', 'report_error', 'report_id'}}
            lifecycle.update(started_at=iso(cycle.get('started_at')), stopped_at=iso(cycle.get('stopped_at')),
                             restarted_at=iso(cycle['restarted_at']),
                             duration_seconds=round(cycle['restarted_at'] - cycle['started_at'], 1) if cycle.get('started_at') else None)
            report = dict(report_id='RPT-CYCLE-' + sha256(cycle['cycle_id'].encode()).hexdigest()[:16].upper(),
                          report_type='full_case_report', cycle_id=cycle['cycle_id'],
                          title='故障处理汇总报告 · ' + '、'.join(sorted({o['device_id'] for o in orders}) or cycle['device_ids']),
                          created_at=iso(cycle['restarted_at']), workorder_ids=[o['workorder_id'] for o in orders],
                          device_ids=cycle['device_ids'], event_ids=cycle['event_ids'], persisted=True,
                          sections={'lifecycle': lifecycle, 'diagnosis': aggregate(diagnoses),
                                    'maintenance_plan': aggregate(plans), 'workorder': aggregate(orders),
                                    'repair_feedback': aggregate(feedback), 'repair_verification': aggregate(checks)},
                          source_refs=[{'section': 'lifecycle', 'source': 'line-control-ledger', 'cycle_id': cycle['cycle_id']}])
            for section, records in [('diagnosis', diagnoses), ('maintenance_plan', plans), ('workorder', orders),
                                     ('repair_feedback', feedback), ('repair_verification', checks)]:
                for record in records:
                    report['source_refs'].append({'section': section, 'source': 'backend-persisted-record',
                        **{key: record[key] for key in ('workorder_id', 'plan_id', 'event_id', 'device_id', 'trace_id') if record.get(key)}})
        # 旧报告移除误纳入的产品质检，保留原故障与维修事实和报告编号。
        report['sections'].pop('quality', None)
        report['sections'].pop('quality_result', None)
        report['source_refs'] = [r for r in report['source_refs'] if r['section'] not in {'quality', 'quality_result', 'experience'}]
        experiences = [deepcopy(item) for item in self.business._list_records('experience')
                       if item.get('cycle_id') == cycle['cycle_id']
                       or item.get('source_workorder') in report['workorder_ids']]
        report['sections']['experience'] = aggregate(experiences)
        for item in experiences:
            report['source_refs'].append({'section': 'experience', 'source': 'backend-persisted-record',
                'experience_id': item['experience_id'], 'workorder_id': item.get('source_workorder')})
        report['sections']['references'] = {'records': deepcopy(report['source_refs'])}
        report['knowledge_status'] = ('indexed' if experiences and all(e.get('rag_saved') is True for e in experiences)
            else 'searchable' if experiences and all((e.get('knowledge_sync') or {}).get('searchable') for e in experiences)
            else 'pending')
        report['knowledge_note'] = ('经验已保存并同步至关键词与向量检索索引' if report['knowledge_status'] == 'indexed'
            else '经验可通过关键词检索；向量同步尚未完成，后台自动重试' if report['knowledge_status'] == 'searchable'
            else '经验总结或检索索引待后台自动保存与同步')
        findings = []
        if not cycle.get('started_at'):
            findings.append('历史停机开始时间未记录')
        for section, label in [('diagnosis', '智能诊断'), ('maintenance_plan', '维修方案'), ('workorder', '工单'),
                               ('repair_feedback', '处理说明'), ('repair_verification', '检查核验')]:
            if not report['sections'][section].get('records'):
                findings.append('未关联' + label + '记录')
        for order in orders:
            for key, label in [('diagnosis_snapshot', '智能诊断'), ('maintenance_plan_snapshot', '维修方案'),
                               ('repair_feedback', '处理说明')]:
                if not order.get(key):
                    findings.append(order['workorder_id'] + '缺少' + label + '记录')
            for key in ('diagnosis_snapshot', 'maintenance_plan_snapshot'):
                record = order.get(key) or {}
                if any(record.get(field) and record[field] != order.get(field) for field in ('event_id', 'device_id')):
                    findings.append(order['workorder_id'] + '关联记录的设备或故障事件不一致')
        manual = cycle.get('restart_method') == 'manual_confirmation'
        report.update(composition_version=COMPOSITION_VERSION,
                      status='incomplete' if findings else 'completed', validation_findings=findings,
                      stop_reason='restart_confirmed' if manual else 'restart_verified',
                      summary=('本次停机处理已完成，维修人员人工确认后整线启动指令已执行。' if manual else '本次停机处理已完成，整线复机核验通过。') + '已汇总 %s 张工单的智能诊断、维修方案及处理检查记录。' % len(orders))
        from shared.report_presentation import concise_report_sections, report_article, report_presentation
        report['presentation_sections'] = report_presentation(report['sections'])
        report['concise_sections'] = concise_report_sections(report)
        report['article_text'] = report_article(report)
        return report
