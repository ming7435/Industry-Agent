"""Repair a saved plan on its existing order; never dispatch or control equipment."""
from copy import deepcopy
from hashlib import sha256
import json
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict

from app.api.team_auth import require_assignee, team_actor
from app.clients.backend import BackendServiceClient, BackendServiceError
from app.common.alarm import AlarmCodeParser
from app.runtime.durable_store import PendingResultError
from app.runtime.event_store import EventResultConflict
from app.runtime.policy import RuntimePolicy
from app.workorder.policy import auto_workorder_decision
from app.workorder.repair_profile import plan_profile_findings
from app.workorder.review import reviewed_workorder


class PlanRevalidationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    request_id: UUID


def _layers(value):
    while isinstance(value, dict):
        yield value
        value = value.get('raw')


def _expanded(value):
    expanded = {}
    for layer in reversed(list(_layers(value))):
        expanded.update(layer)
    return expanded


def _diagnosis_findings(value):
    findings = []
    for layer in _layers(value):
        if layer.get('requires_approval'):
            findings.append('诊断明确要求审批，请通过原审批入口继续')
        if layer.get('synthetic') or layer.get('requires_human_review'):
            findings.append('诊断含演示证据或要求人工复核')
        if layer.get('evidence_validated') is False or layer.get('validated') is False:
            findings.append('诊断证据尚未通过校验')
    return findings


def _identity_findings(value, device_id, event_id, alarm_code):
    findings = []
    for item in _layers(value):
        if item.get('device_id') and item['device_id'] != device_id:
            findings.append('方案或诊断设备与原工单不一致')
        if item.get('event_id') and item['event_id'] != event_id:
            findings.append('方案或诊断事件与原工单不一致')
        if item.get('alarm_code') and AlarmCodeParser.extract(item['alarm_code']) != alarm_code:
            findings.append('方案或诊断报警与原工单不一致')
    return findings


def _candidate_findings(plan, diagnosis, event, old_plan_id):
    findings = list(plan.get('validation_findings') or []) + list(plan.get('validation_errors') or [])
    if not plan.get('plan_id') or plan['plan_id'] == old_plan_id:
        findings.append('重新生成的方案必须具有新的方案编号')
    generated_diagnosis = _expanded(plan.get('diagnosis'))
    original = _expanded(diagnosis)
    findings.extend(_diagnosis_findings(diagnosis))
    findings.extend(_diagnosis_findings(plan.get('diagnosis')))
    for value in (plan, plan.get('diagnosis') or {}):
        findings.extend(_identity_findings(value, event['device_id'], event['event_id'], event['alarm_code']))
    if generated_diagnosis.get('device_id') != event['device_id'] or \
            AlarmCodeParser.extract(generated_diagnosis.get('alarm_code')) != event['alarm_code']:
        findings.append('新方案缺少原设备及报警归属')
    if generated_diagnosis.get('fault') != original.get('fault'):
        findings.append('新方案的主故障与原诊断不一致')
    if RuntimePolicy._explicit_approval_required({'maintenance_plan': plan}, {'diagnosis': diagnosis}) \
            or any(bool(item.get('requires_approval')) for item in (original, generated_diagnosis)):
        findings.append('方案或诊断明确要求审批，请通过原审批入口继续')
    allowed, reason = auto_workorder_decision(original, plan, event)
    if not allowed:
        findings.append(reason)
    findings.extend(plan_profile_findings(plan, diagnosis))
    if not plan.get('repair_steps') or not plan.get('repair_target') or not (plan.get('safety_requirements') or plan.get('safety')):
        findings.append('新方案缺少维修对象、步骤或安全要求')
    return list(dict.fromkeys(str(item) for item in findings))


def build_workorder_plan_revalidation_router(runtime, event_results, require_write_auth):
    router = APIRouter()

    @router.post('/api/workorders/{workorder_id}/revalidate-plan', dependencies=[Depends(require_write_auth)])
    def revalidate_plan(workorder_id: str, body: PlanRevalidationRequest, request: Request):
        # Authenticate on every replay; never return another user's cached order.
        try:
            backend = BackendServiceClient()
            actor = team_actor(request, backend)
            order = require_assignee(workorder_id, actor, backend)
        except HTTPException as error:
            raise HTTPException(error.status_code, {'message': str(error.detail), 'execution_started': False}) from None
        except BackendServiceError:
            raise HTTPException(503, '工单身份核验暂不可用，请稍后核对本次请求') from None
        request_id = str(body.request_id)
        key = json.dumps(['workorder-plan-revalidation', workorder_id, actor['user_id'], request_id])
        fingerprint = sha256(key.encode()).hexdigest()

        def generate():
            # All mutable preconditions are inside the cached generation phase.
            # The captured version predates generation and is used unchanged by Backend CAS.
            original = deepcopy(order)
            plan = original.get('maintenance_plan_snapshot') or {}
            diagnosis = original.get('diagnosis_snapshot') or {}
            device_id, event_id = original.get('device_id'), original.get('event_id')
            plan_id = original.get('plan_id')

            def reject(message):
                return {'execution_started': False, 'http_status': 409, 'message': message}

            if original.get('status') not in {'open', 'in_progress'}:
                return reject('当前工单状态不允许更新维修方案')
            if not all((device_id, event_id, plan_id, original.get('updated_at'), diagnosis)) or plan.get('plan_id') != plan_id:
                return reject('原工单缺少完整方案、诊断或版本记录，不能安全更新')
            results, _ = event_results.list_plan_results()
            source = next((item for item in results if (item.get('maintenance_plan') or {}).get('plan_id') == plan_id), None)
            if not source:
                return reject('原方案来源暂不可用，不能安全更新，请稍后重试')
            event = deepcopy(source.get('event') or {})
            alarm_code = AlarmCodeParser.extract(event.get('alarm_code'))
            if event.get('device_id') != device_id or event.get('event_id') != event_id or not alarm_code:
                return reject('原方案的设备、报警或事件归属与工单不一致')
            event['alarm_code'] = alarm_code
            expanded = _expanded(diagnosis)
            if expanded.get('device_id') != device_id or not expanded.get('fault') or \
                    AlarmCodeParser.extract(expanded.get('alarm_code')) != alarm_code or \
                    _identity_findings(diagnosis, device_id, event_id, alarm_code):
                return reject('原诊断的设备、报警或事件归属不完整或不一致')
            if RuntimePolicy._explicit_approval_required({'maintenance_plan': plan}, source) or \
                    source.get('requires_approval') or any(layer.get('requires_approval') for layer in _layers(diagnosis)):
                return reject('该方案明确要求审批，请通过原审批入口继续')
            state = {'entry': 'user', 'task_id': 'TASK-REPLAN-' + uuid4().hex,
                     'trace_id': 'TRACE-REPLAN-' + uuid4().hex,
                     'context': {'device_id': device_id, 'event_id': event_id},
                     'user_text': '依据原诊断重新生成并校验维修方案，仅更新原工单方案'}
            generated = {'event': event, 'diagnosis': diagnosis, 'workorder': original,
                         'task_id': state['task_id'], 'trace_id': state['trace_id'],
                         'request_id': request_id, 'expected_plan_id': plan_id,
                         'expected_updated_at': original['updated_at']}
            try:
                # The formal Maintenance Agent retrieves and validates its evidence.
                # entry=user explicitly prevents submit_workorder_draft and dispatch.
                # DiagnosisView stores extension evidence in raw; expose the saved values
                # to its normalizer without changing the immutable order snapshot.
                candidate = runtime.container.requests.create_maintenance_plan(state, expanded, {}, {})
                if not isinstance(candidate, dict):
                    raise ValueError('invalid maintenance result')
                findings = _candidate_findings(candidate, diagnosis, event, plan_id)
            except Exception:
                return {**generated, 'status': 'blocked', 'candidate_plan': {},
                        'validation_findings': ['方案生成或校验未完成，原工单保持不变，可稍后重新校验']}
            return {**generated, 'status': 'blocked' if findings else 'ready',
                    'candidate_plan': candidate, 'validation_findings': findings}

        try:
            generated = event_results.get_or_create(key, generate, fingerprint=fingerprint)
        except (EventResultConflict, PendingResultError):
            raise HTTPException(409, '方案校验正在处理或结果待核对，请保留本次请求编号') from None
        except Exception:
            raise HTTPException(503, '方案校验结果暂无法读取，请使用同一次请求核对') from None
        if generated.get('execution_started') is False:
            raise HTTPException(generated['http_status'], {'message': generated['message'], 'execution_started': False})

        def response(status, actual, findings=(), message=''):
            return {'status': status, 'workorder': reviewed_workorder(actual),
                    'maintenance_plan': generated.get('candidate_plan') or {},
                    'validation_findings': list(findings), 'message': message, 'request_id': request_id}

        if generated['status'] == 'blocked':
            return response('blocked', order, generated['validation_findings'], '新方案未通过校验，原工单保持不变')
        # Candidate persistence and replacement are separate phases. A lost apply response
        # can therefore replay Backend's durable receipt with the identical candidate/CAS.
        payload = {'workorder_id': workorder_id, 'actor_id': actor['user_id'], 'request_id': request_id,
                   'expected_plan_id': generated['expected_plan_id'],
                   'expected_updated_at': generated['expected_updated_at'],
                   'maintenance_plan': generated['candidate_plan']}
        try:
            applied = backend.request('/internal/team/workorder/replace-plan', payload)
        except BackendServiceError as error:
            if error.status_code in {400, 403, 404, 409, 422}:
                current = require_assignee(workorder_id, actor, backend)
                return response('blocked', current, ['工单状态、权限、审批、库存或版本已变化，请核对后重新校验'],
                                '方案未应用，原工单的现有记录已保留')
            raise HTTPException(503, '方案更新结果尚未确认，请使用同一次请求核对，勿重复提交维修完成') from None
        actual = applied.get('workorder') or {}
        if not applied.get('plan_replaced') or actual.get('workorder_id') != workorder_id:
            raise HTTPException(503, '方案更新回执不完整，请使用同一次请求核对')
        result = response('applied', actual, message='方案已更新，请按新方案完成实际维修和复测后再提交结果')
        # Save a final plan projection only after the authoritative order receipt exists.
        # This is read-model persistence; it must not turn a proved apply into an unknown.
        try:
            event_results.get_or_create(key + ':applied', lambda: {**generated, **result}, fingerprint=fingerprint)
        except Exception:
            result['message'] += '；维修方案列表同步暂有延迟，工单已保存'
        return result

    return router
