"""从既有事件结果投影独立维修方案，不创建方案或工单。"""
from typing import Any, Mapping
from datetime import datetime, timezone
import os
from app.clients.backend import BackendServiceClient, BackendServiceError

from app.workorder.policy import auto_workorder_decision
from app.runtime.policy import RuntimePolicy
from app.workorder.repair_profile import plan_profile_findings
from shared.local_drawings import device_reference_drawings


_PLAN_FIELDS = (
    "plan_id", "repair_target", "target_part", "engineering_context", "repair_steps", "tools", "parts", "safety",
    "required_tools", "required_parts", "safety_requirements", "pre_checks", "post_checks", "estimated_time",
    "estimated_duration", "source_documents", "cad_components", "evidence", "validation_findings", "risk_level",
    "workorder_ready", "maintenance_required", "maintenance_reason", "cad_required", "synthetic",
    "requires_approval", "validation_errors",
    "plan_kind", "inspection_required", "inspection_reason",
)
_DIAGNOSIS_FIELDS = (
    "device_id", "alarm_code", "fault", "summary", "cause", "diagnosis", "severity", "confidence", "evidence",
    "evidence_status", "evidence_validated", "validated", "maintenance_required", "maintenance_reason",
    "requires_human_review", "synthetic", "recommendation", "created_at", "event_timestamp",
    "event_id", "event_revision", "tenant_id", "project_id", "device_name", "device_model",
)


def deleted_maintenance_plan_ids(event_results):
    deleted = set(event_results.deleted_plan_ids())
    if os.getenv('BACKEND_SERVICE_BASE_URL', '').strip():
        result = BackendServiceClient().call('list_deleted_maintenance_plan_ids', {})
        ids = result.get('deleted_plan_ids')
        if not isinstance(ids, list) or any(not isinstance(value, str) for value in ids):
            raise BackendServiceError('维修方案删除状态返回异常')
        deleted.update(ids)
    return sorted(deleted)


def _timestamp(value):
    """旧监控从 UTC epoch 转成无时区文本；投影补齐时区，保留已知偏移。"""
    stamp = str(value or '')
    try:
        parsed = datetime.fromisoformat(stamp.replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc).isoformat()
    except ValueError:
        pass
    return stamp


def list_saved_maintenance_plans(results: list[dict[str, Any]], device_id: str = "", limit: int = 100, deleted_plan_ids=None) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str]] = set()
    deleted = set(deleted_plan_ids or [])
    for result in results:
        plan = result.get("maintenance_plan")
        if not isinstance(plan, Mapping) or not plan:
            continue
        if plan.get("plan_id") in deleted:
            continue
        event = result.get("event") if isinstance(result.get("event"), Mapping) else {}
        plan_diagnosis = plan.get("diagnosis") if isinstance(plan.get("diagnosis"), Mapping) else {}
        pipeline_diagnosis = result.get("diagnosis") if isinstance(result.get("diagnosis"), Mapping) else {}
        diagnosis = {**plan_diagnosis, **pipeline_diagnosis}
        raw = diagnosis.get("raw")
        for _ in range(6):
            if not isinstance(raw, Mapping):
                break
            diagnosis = {**raw, **diagnosis}
            raw = raw.get('raw')
        plan_device = str(event.get("device_id") or diagnosis.get("device_id") or plan.get("device_id") or "")
        if device_id and plan_device != device_id:
            continue
        event_id = str(event.get("event_id") or diagnosis.get("event_id") or "")
        revision = event.get("event_revision", diagnosis.get("event_revision", 1))
        event_timestamp = _timestamp(event.get('timestamp') or diagnosis.get('event_timestamp'))
        diagnosis = {**diagnosis, 'event_id':event_id, 'event_revision':revision,
                     'device_id':plan_device, 'event_timestamp':event_timestamp}
        identity = (plan_device, str(plan.get("plan_id") or ""), event_id, str(revision))
        if identity in seen:
            continue
        seen.add(identity)
        allowed, reason = auto_workorder_decision(diagnosis, plan, event)
        profile_findings = plan_profile_findings(plan, diagnosis)
        if profile_findings:
            allowed, reason = False, '；'.join(profile_findings)
        findings = plan.get('validation_findings') or plan.get('validation_errors')
        if allowed and findings:
            allowed, reason = False, '维修方案校验未通过：%s' % '；'.join(str(item) for item in findings)
        dispatch = {"allowed": allowed, "reason": reason}
        workorder_result = result.get('workorder') if isinstance(result.get('workorder'), Mapping) else {}
        nested = workorder_result.get('workorder')
        workorder = nested if isinstance(nested, Mapping) else workorder_result
        assigned = (workorder.get('workorder_id') and workorder.get('assignee')
                    and workorder.get('device_id') == plan_device
                    and (not workorder.get('plan_id') or workorder.get('plan_id') == plan.get('plan_id'))
                    and (not workorder.get('event_id') or workorder.get('event_id') == event_id))
        if assigned:
            # Historical assignment remains a fact even when a saved template now needs review.
            dispatch = {'allowed': allowed, 'status': 'dispatched', 'reason': reason if profile_findings else '',
                        'workorder_id': str(workorder['workorder_id']),
                        'assignee': str(workorder['assignee']), 'assignee_name': str(workorder.get('assignee_name') or ''),
                        'device_id': plan_device}
        elif result.get('status') == 'running':
            dispatch = {'allowed':False, 'status':'running', 'reason':'方案已生成，后续校验与派发仍在处理中'}
        # 高风险工单允许自动派发，但明确要求审批的动作仍保留原门禁。
        if allowed and not assigned:
            if RuntimePolicy._explicit_approval_required({}, result) or result.get('requires_approval') is True:
                dispatch = {"allowed": False, "status": "waiting_approval",
                            "reason": "该动作明确要求服务端审批，审批通过后继续派发"}
            elif workorder_result.get('status') == 'waiting_for_personnel' or result.get('status') == 'waiting_for_personnel':
                dispatch = {'allowed': False, 'status': 'waiting_for_personnel',
                            'reason': str(workorder_result.get('error') or result.get('dispatch_reason') or '等待该设备对应负责人员登录')}
            elif workorder_result.get('stop_reason') == 'personnel_query_failed' or result.get('stop_reason') == 'personnel_query_failed':
                dispatch = {'allowed': False, 'status': 'blocked',
                            'reason': str(workorder_result.get('error') or result.get('dispatch_reason') or '对应设备负责人员查询失败，请稍后重试')}
        items.append({
            **{key: plan[key] for key in _PLAN_FIELDS if key in plan},
            "diagnosis": {key: diagnosis[key] for key in _DIAGNOSIS_FIELDS if key in diagnosis},
            "device_id": plan_device,
            "alarm_code": str(event.get("alarm_code") or diagnosis.get("alarm_code") or ""),
            "event_id": event_id, "event_revision": revision,
            "tenant_id": str(event.get('tenant_id') or diagnosis.get('tenant_id') or ''),
            "project_id": str(event.get('project_id') or diagnosis.get('project_id') or ''),
            "device_name": str(event.get('device_name') or diagnosis.get('device_name') or ''),
            "device_model": str(event.get('device_model') or diagnosis.get('device_model') or ''),
            "task_id": str(result.get("task_id") or ""), "trace_id": str(result.get("trace_id") or ""),
            "created_at": _timestamp(plan.get('created_at')),
            "event_timestamp": event_timestamp,
            "diagnosis_created_at": _timestamp(diagnosis.get('created_at')),
            "status": str(result.get("status") or ""), "stop_reason": str(result.get("stop_reason") or ""),
            # 已保存方案仍可查看当前存在的设备图纸；不修改原校验或派工事实。
            "available_drawings": device_reference_drawings(
                device_id=plan_device, device_model=str(event.get("device_model") or ""),
                tenant_id=str(event.get("tenant_id") or ""), project_id=str(event.get("project_id") or ""),
            ) if plan_device.strip() else [],
            "dispatch": dispatch,
            "execution_review": {"required": bool(profile_findings), "findings": profile_findings},
        })
        if len(items) >= limit:
            break
    return {"items": items, "count": len(items), "source": "saved-event-results"}
