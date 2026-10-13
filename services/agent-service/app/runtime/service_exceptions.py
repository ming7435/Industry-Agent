"""失败任务的持久化人工接管闭环；不调度原 Agent、业务写入或设备控制。"""
from datetime import datetime, timezone
from hashlib import sha256
import json
import re


NAMESPACE = 'service_exception_cases'
_FAILURES = {'failed', 'error', 'blocked', 'timeout', 'outcome_unknown', 'interrupted'}
_NORMAL = {'approval_required', 'policy_denied', 'knowledge_read_only_scope',
           'maintenance_not_required', 'waiting_for_personnel', 'maintenance_required_false'}
_LABELS = {'domain_validation_failed':'业务结果校验未通过', 'replan_limit_exceeded':'已达到重规划次数限制',
           'execution_timeout':'依赖服务执行超时', 'missing_required_evidence':'业务依据不足',
           'agent_error':'智能体执行异常'}


class ServiceCaseConflict(RuntimeError):
    """处理回执或记录版本冲突，不允许覆盖已有人工反馈。"""


def _now():
    return datetime.now(timezone.utc).isoformat()


def _text(value, limit=1500):
    text = str(value or '')
    text = re.sub(r'''(?ix)(["']?(?:api[_-]?key|password|token|密码|密钥)["']?\s*[=:：]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}\]]+)''', r'\1[已隐藏]', text)
    text = re.sub(r'(?i)(bearer\s+)\S+', r'\1[已隐藏]', text)
    text = re.sub(r'(?i)([a-z][a-z0-9+.-]*://)[^/@\s]+@', r'\1[凭据已隐藏]@', text)
    text = re.sub(r'(?i)\b(?:sk-[a-z0-9_-]+|api-[a-f0-9-]{20,})', '[密钥已隐藏]', text)
    return text[:limit]


def record_service_failure(recovery, agent, state, error, *, status='failed'):
    """直接业务入口的最终失败，只抽取事实建档，不复跑、不覆盖原已提交业务。"""
    if recovery is None:
        return None
    event = _mapping(state.get('event'))
    quality = _mapping(state.get('quality'))
    order = _mapping(state.get('workorder'))
    diagnosis = _mapping(state.get('diagnosis'))
    facts = {key:_text(state.get(key),200) for key in ('task_id','trace_id','recovery_actor_id','part_id','subject_summary')}
    facts.update(
        entry='service',next_action={'target':agent,'required_capability':'service_result','side_effect':status=='outcome_unknown'},
        event={key:_text(event.get(key)) for key in ('event_id','device_id','device_name','alarm_code','description','summary','alarm_name')},
        quality={key:_text(quality.get(key),200) for key in ('part_id','part_no','part_name','quality_check_id')},
        workorder={'workorder_id':_text(order.get('workorder_id'),120)},
        diagnosis={key:_text(diagnosis.get(key)) for key in ('summary','fault','diagnosis')},
        runtime_result={'status':status,'stop_reason':'service_unavailable'},
    )
    try:
        return recovery.checkpoint(facts,status,error=_text(error),kind='service')
    except Exception:
        # 原业务返回与已提交事务保持不变；记录失败不意味着允许重新执行业务。
        recovery.case_storage_warning='异常核查记录暂未保存，原执行日志保留'
        return None


def _mapping(value):
    return value if isinstance(value, dict) else {}


class ServiceExceptionCases:
    def __init__(self, store):
        self.store = store

    @staticmethod
    def permitted(item, actor):
        if actor.get('role') == 'supervisor':
            return True
        if actor.get('role') != 'technician' or not actor.get('user_id'):
            return False
        return bool(item.get('actor_id') == actor['user_id'] or item.get('device_id') and
                    item['device_id'] in actor.get('responsible_device_ids', []))

    def record(self, checkpoint):
        state = _mapping(checkpoint.get('state'))
        result = _mapping(state.get('runtime_result'))
        reason = str(result.get('stop_reason') or state.get('stop_reason') or '')
        original_status = str(checkpoint.get('status') or '')
        status = str(checkpoint.get('observed_status') or original_status)
        policy_status = _mapping(state.get('runtime_policy')).get('status')
        policy_denial = policy_status=='require_approval' or policy_status=='deny' and reason!='missing_required_evidence'
        if status not in _FAILURES or reason in _NORMAL or policy_denial or not checkpoint.get('task_id'):
            return None
        event = _mapping(state.get('event'))
        action = _mapping(state.get('next_action'))
        agent = str(action.get('target') or state.get('active_agent') or 'runtime')
        diagnosis = _mapping(state.get('diagnosis'))
        order = _mapping(state.get('workorder'))
        case_id = 'EXC-' + sha256(str(checkpoint['recovery_id']).encode()).hexdigest()[:24].upper()
        device_fault = bool(event.get('event_id') and event.get('device_id'))
        subject = 'device_fault' if device_fault else ('cad' if checkpoint.get('kind') == 'production' and agent!='quality' else agent)
        execution = _mapping(state.get('runtime_execution'))
        error = _text(execution.get('error') or checkpoint.get('error') or reason or '未返回有效业务结果')
        fault = _text(event.get('description') or event.get('summary') or event.get('alarm_name') or
                      diagnosis.get('summary') or diagnosis.get('fault') or diagnosis.get('diagnosis') or state.get('subject_summary') or
                      ('设备存在报警，具体根因尚未确认' if device_fault else '未关联设备故障'))
        identity = {
            'case_id': case_id, 'report_id':'EXR-' + case_id[4:], 'revision': 1,
            'task_id': str(checkpoint['task_id']), 'trace_id': str(checkpoint.get('trace_id') or ''),
            'recovery_id': str(checkpoint['recovery_id']), 'subject_type': subject,
            'device_id': _text(event.get('device_id'), 120) if device_fault else '',
            'device_name': _text(event.get('device_name') or event.get('device_name_zh'), 200),
            'event_id': _text(event.get('event_id'), 120), 'alarm_code': _text(event.get('alarm_code'), 48),
            'part_id': _text(state.get('part_id') or _mapping(state.get('quality')).get('part_id') or
                _mapping(state.get('production_arguments')).get('part_id') or _mapping(state.get('context')).get('part_id'), 120),
            'fault_summary': fault, 'failed_agent': agent,
            'failed_step': _text(action.get('required_capability') or action.get('step') or state.get('current_step'), 120),
            'service_error': error, 'failure_reason': _LABELS.get(reason, '原业务阶段未完成'),
            'completed_steps': [{'agent': _text(item.get('agent'), 80), 'step': _text(item.get('step'), 120)}
                for item in (state.get('completed_steps') or [])[:30] if isinstance(item, dict)],
            'workorder_id': _text(order.get('workorder_id'), 120),
            'actor_id': str(state.get('recovery_actor_id') or ''),
            'status': 'awaiting_manual', 'original_status': original_status, 'control_allowed': False,
            'requires_reconcile': bool(status in {'timeout','outcome_unknown','interrupted'} or
                _mapping(state.get('runtime_execution')).get('side_effect_status') == 'unknown'),
            'created_at': checkpoint.get('created_at') or _now(), 'updated_at': _now(),
            'feedback': '', 'handled_by': '', 'handled_at': '', 'request_id': '', 'request_fingerprint': '',
            'history': [{'event':'exception_recorded','timestamp':_now()}],
        }
        # 稳定任务记录只创建一次；不重放故障、不覆盖已保存的人工反馈。
        return self.store.get_or_create(NAMESPACE, case_id, lambda: identity)

    def get(self, case_id):
        if not re.fullmatch(r'EXC-[A-F0-9]{24}', str(case_id)):
            raise KeyError('异常记录不存在')
        item = self.store.get(NAMESPACE, case_id)
        if item is None:
            raise KeyError('异常记录不存在')
        return item

    def list(self, actor=None):
        items = self.store.values(NAMESPACE, 5000)
        return sorted([item for item in items if actor is None or self.permitted(item, actor)],
                      key=lambda item:item['created_at'], reverse=True)

    def handle(self, case_id, feedback, actor, request_id):
        item = self.get(case_id)
        if actor.get('role') != 'technician' or not self.permitted(item, actor):
            raise PermissionError('只能由本人或负责该设备的维修人员记录处理反馈')
        if not isinstance(feedback,str) or not feedback.strip() or len(feedback)>4000:
            raise ValueError('请填写实际处理说明，最多4000字')
        if not re.fullmatch(r'[A-Za-z0-9_.:-]{1,128}', str(request_id)):
            raise ValueError('处理请求编号无效')
        fingerprint = sha256(json.dumps([case_id,actor['user_id'],feedback],ensure_ascii=False).encode()).hexdigest()
        if item['status']=='handled':
            if item.get('request_id')==request_id and item.get('request_fingerprint')==fingerprint:
                return item
            raise ServiceCaseConflict('记录已由有效反馈处理，不能用新参数覆盖')
        timestamp = _now()
        changed = self.store.compare_and_set(NAMESPACE,case_id,'revision',item['revision'],{
            'revision':item['revision']+1,'status':'handled','feedback':_text(feedback,4000),
            'handled_by':actor['user_id'],'handled_at':timestamp,'updated_at':timestamp,
            'request_id':request_id,'request_fingerprint':fingerprint,
            'history':[*item['history'],{'event':'manual_handoff_recorded','actor_id':actor['user_id'],'timestamp':timestamp}],
        })
        if changed is None:
            current=self.get(case_id)
            if current.get('request_id')==request_id and current.get('request_fingerprint')==fingerprint:
                return current
            raise ServiceCaseConflict('其它请求已更新记录，请刷新核对')
        return changed

    def report(self, case_id):
        item=self.get(case_id)
        manual=item['status']=='handled'
        summary = f"已知故障：{item['fault_summary']}。服务异常：{item['failed_agent']} / {item['failure_reason']}；{item['service_error']}。"
        summary += ('人工处理：'+item['feedback'] if manual else '处理状态：等待维修人员核查和反馈。')
        summary += '本报告记录服务异常与人工接管，不代表维修完成、设备恢复或质检合格。'
        labels={'diagnosis':'智能诊断','knowledge':'知识检索','cad':'CAD 工程服务','maintenance':'维修方案',
                'workorder':'工单服务','quality':'零件质检','report':'报告服务','memory':'经验总结','router':'任务路由'}
        article = '\n\n'.join([
            '异常核查记录：'+item['case_id']+'；原任务：'+item['task_id']+'。',
            '已知故障：'+item['fault_summary']+'。设备：'+(item['device_name'] or item['device_id'] or '未关联设备')+
                '；报警码：'+(item['alarm_code'] or '未提供')+'。',
            '异常阶段：'+labels.get(item['failed_agent'],'业务处理')+'。原因：'+item['failure_reason']+
                '；原服务返回：'+item['service_error']+'。该阶段没有生成可靠业务结果。',
            ('人工反馈：'+item['feedback']+'。记录人员：'+item['handled_by']+'。') if manual else '当前状态：等待维修人员接管并填写实际处理反馈。',
            '处理范围：本报告记录服务异常与人工接管，不代表维修完成、设备恢复或质检合格；不授权拆修、设备启停或生产放行。',
        ])
        return {
            'report_id':item['report_id'],'report_type':'incident_report','scope':'service_exception_record',
            'title':'服务异常处理报告 · '+(item['device_name'] or item['device_id'] or item['failed_agent']),
            'summary':summary,'article_text':article,'status':'completed' if manual else 'incomplete','persisted':True,
            'created_at':item['created_at'],'updated_at':item['updated_at'],'device_id':item['device_id'],
            'task_id':item['task_id'],'trace_id':item['trace_id'],
            'sections':{'event':{'event_id':item['event_id'],'device_id':item['device_id'],
                'alarm_code':item['alarm_code'],'description':summary},
                'workorder':{'case_id':item['case_id'],'workorder_id':item['workorder_id'],
                    'title':'服务异常核查待办（不是正常维修工单）','status':item['status']},
                'repair_feedback':{'feedback':item['feedback'],'operator':item['handled_by']}},
            'source_refs':[{'type':'trace','id':item['trace_id']},{'type':'failed_task','id':item['task_id']}],
            'validation_findings':[] if manual else ['等待人工处理反馈'],
        }
