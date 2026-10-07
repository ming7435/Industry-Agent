"""确定性的工单、库存、技师和 QMS 业务操作。"""

from __future__ import annotations

from datetime import datetime, timezone
from contextlib import contextmanager, nullcontext
from copy import deepcopy
from functools import wraps
from typing import Any, Mapping
from uuid import uuid4
import hashlib
import json
import os

from .repository import build_repository
from ..quality import PartInspectionService
from ..team.service import TeamService
from shared.repair_recovery import repair_checks
from shared.technician_confirmation import confirmation_digest, trusted_technician_confirmation


def _quality_operation(method):
    @wraps(method)
    def execute(self, *args, **kwargs):
        with self._quality_transaction():
            return method(self, *args, **kwargs)
    return execute


class BackendBusinessService:
    VALID_STATUSES = {"open", "in_progress", "awaiting_verification", "completed", "closed", "rejected", "timeout"}
    STATUS_TRANSITIONS = {
        "open": {"open", "in_progress", "rejected", "timeout"},
        "in_progress": {"in_progress", "awaiting_verification", "rejected", "timeout"},
        "awaiting_verification": {"awaiting_verification", "completed", "in_progress"},
        "completed": {"completed", "closed", "in_progress"},
        "closed": {"closed", "open"},
        "rejected": {"rejected", "open"},
        "timeout": {"timeout", "open"},
    }
    REQUIRED_RECOVERY_CHECKS = ("device_identity", "operational", "alarms_clear", "metrics_available")

    def __init__(self, repository: Any | None = None, team_service: TeamService | None = None) -> None:
        self.repository = repository or build_repository()
        self.team = team_service or TeamService()
        self.inspection = PartInspectionService(repository=self.repository)
        self._quality: dict[str, dict[str, Any]] = {str(item.get("quality_check_id")): item for item in self._list_records("quality") if item.get("quality_check_id")}
        self._closure_tasks: dict[str, dict[str, Any]] = {str(item.get("closure_task_id")): item for item in self._list_records("closure") if item.get("closure_task_id")}
        self._audit: list[dict[str, Any]] = self._list_records("audit")
        self._experiences: dict[str, dict[str, Any]] = {str(item.get("experience_id")): item for item in self._list_records("experience") if item.get("experience_id")}
        self._inventory: dict[str, dict[str, Any]] = {}

    def _save_record(self, record_type: str, record_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        saver = getattr(self.repository, "save_record", None)
        if saver is not None:
            return dict(saver(record_type, record_id, payload))
        return dict(payload)

    def _list_records(self, record_type: str) -> list[dict[str, Any]]:
        loader = getattr(self.repository, "list_records", None)
        return [dict(item) for item in (loader(record_type) if loader is not None else [])]

    def _append_audit(self, record: dict[str, Any]) -> None:
        self._audit.append(record)
        self._save_record("audit", str(record.get("audit_id") or uuid4().hex), record)

    @contextmanager
    def _quality_transaction(self):
        # The repository transaction also prevents another worker from changing tasks
        # between the gate and release. Restore process caches if persistence fails.
        with self.repository.quality_transaction():
            snapshot = deepcopy((self._quality, self._closure_tasks, self._audit))
            try:
                yield
            except Exception:
                self._quality, self._closure_tasks, self._audit = snapshot
                raise

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _idempotency_fingerprint(values: Mapping[str, Any]) -> str:
        fields = {
            key: values.get(key)
            for key in (
                "device_id", "title", "plan_id", "steps", "required_parts", "repair_target",
                "drawing_context", "alarm_code", "diagnosis_context", "priority", "risk_level",
                "source", "event_id", "diagnosis_snapshot", "maintenance_plan_snapshot",
            )
        }
        encoded = json.dumps(fields, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()

    @staticmethod
    def _order_result(order: Mapping[str, Any], **extra: Any) -> dict[str, Any]:
        value = dict(order)
        return {**value, "success": True, "workorder": value, "workorder_id": str(value.get("workorder_id") or ""), "backend": "backend-service", **extra}

    def create_workorder(self, **values: Any) -> dict[str, Any]:
        fingerprint = self._idempotency_fingerprint(values)
        order = {
            "workorder_id": "WO-" + uuid4().hex[:10].upper(),
            "device_id": str(values.get("device_id") or "unknown"), "status": "open",
            "title": str(values.get("title") or "设备维修工单"), "plan_id": str(values.get("plan_id") or ""),
            "steps": list(values.get("steps") or values.get("repair_steps") or []),
            "required_parts": list(values.get("required_parts") or []),
            "repair_target": dict(values.get("repair_target") or values.get("target_part") or {}),
            "drawing_context": dict(values.get("drawing_context") or values.get("engineering_context") or {}),
            "alarm_code": str(values.get("alarm_code") or ""), "diagnosis_context": dict(values.get("diagnosis_context") or values.get("diagnosis") or {}),
            "repair_feedback": {}, "repair_verification": {}, "status_history": [], "events": [],
            "priority": str(values.get("priority") or "normal"), "risk_level": str(values.get("risk_level") or ""),
            "source": str(values.get("source") or "backend"), "idempotency_key": str(values.get("idempotency_key") or ""),
            "event_id": str(values.get("event_id") or ""), "diagnosis_snapshot": dict(values.get("diagnosis_snapshot") or values.get("diagnosis") or {}),
            "maintenance_plan_snapshot": dict(values.get("maintenance_plan_snapshot") or values.get("maintenance_plan") or {}),
            "created_at": self._now(), "updated_at": self._now(),
            "idempotency_fingerprint": fingerprint,
        }
        existing = self.repository.create(order)
        if str(existing.get("workorder_id") or "") != str(order.get("workorder_id") or ""):
            existing_fingerprint = str(existing.get("idempotency_fingerprint") or self._idempotency_fingerprint(existing))
            if existing_fingerprint != fingerprint:
                raise ValueError("幂等键已绑定不同的工单参数")
            return self._order_result(existing)
        if not existing.get("events"):
            self._record_event(existing, "created", "", "open", {})
            existing = self.repository.update(existing)
        return self._order_result(existing)

    def get_workorder(self, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        value = self.repository.get(workorder_id)
        return {**dict(value or {}), "success": bool(value), "found": bool(value), "workorder": dict(value or {}), "workorder_id": workorder_id, "backend": "backend-service"}

    def query_workorder(self, workorder_id: str = "", **kwargs: Any) -> dict[str, Any]:
        return self.get_workorder(workorder_id=workorder_id, **kwargs)

    def list_workorders(self, device_id: str = "", status: str = "", **_: Any) -> dict[str, Any]:
        values = [item for item in self.repository.list() if (not device_id or item.get("device_id") == device_id) and (not status or item.get("status") == status)]
        return {"success": True, "items": values, "total": len(values), "backend": "backend-service"}

    def delete_workorder(self, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        workorder_id = str(workorder_id or "").strip()
        if not workorder_id:
            raise ValueError("workorder_id 不能为空")
        order = self.repository.get(workorder_id)
        if order is None:
            return {"success": False, "deleted": False, "found": False, "workorder_id": workorder_id, "backend": "backend-service"}
        if str(order.get("status") or "open") not in {"open", "rejected", "timeout"} or order.get("repair_feedback") or order.get("repair_verification"):
            raise ValueError("只有未开始且没有维修结果的工单允许删除")
        deleted = bool(getattr(self.repository, "delete", lambda _id: False)(workorder_id))
        return {"success": deleted, "deleted": deleted, "found": deleted, "workorder_id": workorder_id, "backend": "backend-service"}

    def update_workorder(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> dict[str, Any]:
        order = self.repository.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        if status not in self.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % status)
        previous = str(order.get("status") or "")
        allowed = self.STATUS_TRANSITIONS.get(previous, set())
        if status not in allowed:
            raise ValueError("不允许的工单状态迁移：%s -> %s" % (previous, status))
        if status == "closed" and previous != "closed":
            if (order.get('repair_verification') or {}).get('phase') == 'prestart':
                raise ValueError('预启动验证不能代替运行复核，暂不允许关闭')
            if previous != "completed" or not self._verification_is_valid(order.get("repair_verification"), order):
                raise ValueError("工单关闭前必须完成维修并通过基于设备恢复数据的验证")
        if previous == "closed" and status != "open":
            immutable = {"repair_feedback", "repair_verification", "maintenance_plan_snapshot", "diagnosis_snapshot", "steps", "repair_target"}
            if immutable.intersection(fields):
                raise ValueError("已关闭工单的维修事实已冻结，请先重开工单")
        if previous == "closed" and status == "open":
            immutable = {"repair_feedback", "repair_verification", "maintenance_plan_snapshot", "diagnosis_snapshot", "steps", "repair_target"}
            if immutable.intersection(fields):
                raise ValueError("重开工单仅允许改变状态，维修事实仍保持冻结")
        if status == "in_progress" and previous != "in_progress" and not str(fields.get("assignee") or order.get("assignee") or "").strip():
            raise ValueError("进入 in_progress 前必须完成派工并提供 assignee")
        if previous == "awaiting_verification" and status == "in_progress":
            failed_verification = fields.get("repair_verification")
            if not isinstance(failed_verification, Mapping) or failed_verification.get("passed") is not False:
                raise ValueError("验证失败回退必须提交 passed=false 的 repair_verification")
        candidate = {**order, **fields, "status": status}
        if status == "completed" and not self._verification_is_valid(candidate.get("repair_verification"), candidate):
            raise ValueError("维修完成必须提供基于设备恢复数据且通过的 repair_verification")
        if status == "closed" and not self._verification_is_valid(candidate.get("repair_verification"), candidate):
            raise ValueError("工单关闭前必须通过基于设备恢复数据的维修验证")
        if status == "completed" and previous != "completed":
            verification = fields.get("repair_verification") or order.get("repair_verification") or {}
            if not self._verification_is_valid(verification, order):
                raise ValueError("维修完成必须提供基于设备恢复数据且通过的 repair_verification")
        order.update({key: value for key, value in fields.items() if key not in {"action", "workorder_id"}})
        order["status"] = status
        order["updated_at"] = self._now()
        if status == "in_progress" and not order.get("started_at"):
            order["started_at"] = order["updated_at"]
        if status == "completed":
            order["completed_at"] = order["updated_at"]
        if status == "closed":
            order["closed_at"] = order["updated_at"]
        self._record_event(order, "status_changed" if status != previous else "updated", previous, status, fields)
        value = self.repository.update(order)
        return self._order_result(value)

    def assign_workorder(self, workorder_id: str, assignee: str = "", **_: Any) -> dict[str, Any]:
        assignee = str(assignee or "").strip()
        if not assignee:
            raise ValueError("派工必须提供 assignee")
        # 复用团队既有数据库锁，覆盖派工读、资格复核、库存预留和落库。
        inventory_snapshot = None
        try:
            with self.team.repository.transaction() as db:
                self.team.repository.lock(db)
                inventory_snapshot = deepcopy(self._inventory)
                borrower = getattr(self.repository, 'borrow_transaction', None)
                team_path = self.team.repository.sqlite_path
                transaction = borrower(db, team_path) if borrower and team_path else nullcontext()
                with transaction:
                    current = self._require(workorder_id)
                    if current.get('assignee'):
                        if current['assignee'] == assignee:
                            return self._order_result(current)
                        raise ValueError('已派工任务不能隐式更换负责人')
                    device_id = str(current.get('device_id') or '').strip()
                    if not device_id:
                        raise ValueError('工单缺少设备归属，不能派工')
                    candidates = self.query_technicians(device_id=device_id).get('items') or []
                    candidate = next((item for item in candidates if item.get('technician_id') == assignee), None)
                    if not candidate:
                        raise ValueError('派工对象必须是启用且负责该设备的维修人员')
                    if candidate.get('online') is not True or candidate.get('available') is not True:
                        raise ValueError('对应设备维修人员当前未登录，不能派工')
                    self._reserve_required_parts(current)
                    return self.update_workorder(workorder_id, status="in_progress", assignee=assignee, assignee_name=candidate['name'])
        except Exception:
            if inventory_snapshot is not None:
                self._inventory = inventory_snapshot
            raise

    def submit_repair_feedback(self, workorder_id: str, feedback: Any = "", repair_feedback: Any = None, **_: Any) -> dict[str, Any]:
        order = self._require(workorder_id)
        if str(order.get("status") or "") not in {"in_progress", "awaiting_verification"}:
            raise ValueError("只有 in_progress 或 awaiting_verification 工单可以提交维修反馈")
        normalized = dict(repair_feedback or feedback) if isinstance(repair_feedback or feedback, Mapping) else {"feedback": str(feedback or "")}
        order["repair_feedback"] = normalized
        order["updated_at"] = self._now()
        self._record_event(order, "repair_feedback_submitted", order.get("status", ""), order.get("status", ""), normalized)
        value = self.repository.update(order)
        return self._order_result(value)

    def replace_team_workorder_plan(self, workorder_id, actor_id, expected_plan_id,
                                   expected_updated_at, request_id, maintenance_plan):
        """Apply a server-generated revision without granting repair/restart authority.

        Revision, audit event and retry receipt share the one atomic order update.
        The repository's row lock/revision check also rejects concurrent repair writes.
        """
        if not all(isinstance(value, str) and value.strip() for value in
                   (workorder_id, actor_id, expected_plan_id, expected_updated_at, request_id)):
            raise ValueError('方案替换缺少工单、人员、原方案版本或请求身份')
        fingerprint = hashlib.sha256(json.dumps(
            [workorder_id, actor_id, expected_plan_id, expected_updated_at, request_id, maintenance_plan],
            ensure_ascii=False, sort_keys=True, separators=(',', ':'), default=str).encode('utf-8')).hexdigest()
        inventory_snapshot = None
        try:
            with self.team.repository.transaction() as db:
                self.team.repository.lock(db)
                borrower = getattr(self.repository, 'borrow_transaction', None)
                team_path = self.team.repository.sqlite_path
                transaction = borrower(db, team_path) if borrower and team_path else nullcontext()
                with transaction:
                    order = self._require(workorder_id)
                    technician = next((item for item in self.team.technicians(device_id=order.get('device_id'))
                                       if item['user_id'] == actor_id), None)
                    if not technician or order.get('assignee') != actor_id:
                        raise PermissionError('仅该设备当前被派工的维修人员可以更新方案')
                    for revision in order.get('plan_revisions') or []:
                        if revision.get('request_id') == request_id:
                            if revision.get('request_fingerprint') != fingerprint:
                                raise ValueError('该请求已绑定不同的方案替换参数')
                            return self._order_result(order, plan_replaced=True, replayed=True,
                                                      plan_revision_id=revision['plan_revision_id'], request_id=request_id)
                    if order.get('status') not in {'open', 'in_progress'}:
                        raise ValueError('只有尚未提交维修完成的工单可以替换方案')
                    if order.get('plan_id') != expected_plan_id or order.get('updated_at') != expected_updated_at:
                        raise ValueError('工单或方案已被更新，请刷新后重新生成方案')
                    plan = self._validated_replacement_plan(order, maintenance_plan)
                    inventory_snapshot = deepcopy(self._inventory)
                    reservations = self._replacement_reservations(order, plan.get('required_parts') or [])
                    revision_id = 'PLAN-REV-' + uuid4().hex[:12].upper()
                    revision = {'plan_revision_id': revision_id, 'request_id': request_id,
                                'request_fingerprint': fingerprint, 'actor_id': actor_id,
                                'previous_plan_id': order['plan_id'], 'plan_id': plan['plan_id'],
                                'previous_plan_snapshot': deepcopy(order.get('maintenance_plan_snapshot') or {}),
                                'previous_repair_verification': deepcopy(order.get('repair_verification') or {}),
                                'previous_updated_at': order['updated_at'], 'created_at': self._now()}
                    engineering = dict(plan.get('engineering_context') or {})
                    viewer = engineering.get('viewer_context') or {}
                    refs = engineering.get('drawing_ref_details') or engineering.get('drawing_refs') or []
                    first_ref = refs[0] if refs and isinstance(refs[0], Mapping) else {}
                    drawing = {'drawing_url': str(engineering.get('drawing_url') or first_ref.get('drawing_url') or ''),
                               'model_url': str(engineering.get('model_url') or viewer.get('model_url') or ''),
                               'mesh_name': str(engineering.get('mesh_name') or viewer.get('mesh_name') or ''),
                               'location': str(engineering.get('location') or viewer.get('location') or '')}
                    updated = {**order, 'plan_id': plan['plan_id'], 'maintenance_plan_snapshot': plan,
                               'steps': list(plan['repair_steps']), 'required_parts': list(plan.get('required_parts') or []),
                               'repair_target': dict(plan.get('target_part') or plan.get('repair_target_detail') or {}),
                               'drawing_context': drawing, 'inventory_reservations': reservations,
                               'repair_verification': {}, 'updated_at': self._now(),
                               'plan_revisions': [*deepcopy(order.get('plan_revisions') or []), revision]}
                    self._record_event(updated, 'maintenance_plan_replaced', order['status'], order['status'],
                                       {key: revision[key] for key in ('plan_revision_id', 'actor_id', 'request_id', 'previous_plan_id', 'plan_id')})
                    stored = self.repository.update(updated)
                    return self._order_result(stored, plan_replaced=True, replayed=False,
                                              plan_revision_id=revision_id, request_id=request_id)
        except Exception:
            if inventory_snapshot is not None:
                self._inventory = inventory_snapshot
            raise

    @classmethod
    def _validated_replacement_plan(cls, order, candidate):
        old = order.get('maintenance_plan_snapshot') or {}
        diagnosis = order.get('diagnosis_snapshot')
        if not isinstance(diagnosis, Mapping) or not diagnosis:
            raise ValueError('原工单缺少可靠诊断身份，不能补造来源替换方案')
        if not isinstance(candidate, Mapping):
            raise ValueError('新维修方案数据无效')
        plan = deepcopy(dict(candidate))
        new_diagnosis = plan.get('diagnosis')
        if not isinstance(new_diagnosis, Mapping):
            raise ValueError('新维修方案缺少原诊断归属')
        original_sources = list(cls._plan_contract_sources(diagnosis))
        revised_sources = list(cls._plan_contract_sources(new_diagnosis))
        device = str(order.get('device_id') or '')
        alarm = str(order.get('alarm_code') or next((source.get('alarm_code') for source in original_sources if source.get('alarm_code')), ''))
        fault = str(next((source.get('fault') for source in original_sources if source.get('fault')), ''))
        original_device = next((source.get('device_id') for source in original_sources if source.get('device_id')), '')
        revised_device = next((source.get('device_id') for source in revised_sources if source.get('device_id')), '')
        revised_fault = str(next((source.get('fault') for source in revised_sources if source.get('fault')), ''))
        if not device or original_device != device or not alarm or not fault or not order.get('event_id'):
            raise ValueError('原工单缺少可靠设备或故障身份')
        if revised_device != device or revised_fault != fault:
            raise ValueError('新方案与原工单设备或主故障不一致')
        if not any(source.get('alarm_code') for source in revised_sources):
            raise ValueError('新方案诊断缺少原报警身份，不能从原单补造')
        sources = list(cls._plan_contract_sources(order, old, diagnosis, plan, new_diagnosis, old.get('diagnosis') or {}))
        for source in sources:
            if any(source.get(key) and str(source[key]) != expected for key, expected in
                   (('device_id', device), ('event_id', str(order['event_id'])), ('alarm_code', alarm))):
                raise ValueError('新方案与原工单设备、事件或报警归属不一致')
        if old.get('plan_id') and old['plan_id'] != order.get('plan_id'):
            raise ValueError('原工单方案身份不一致')
        if not isinstance(plan.get('plan_id'), str) or not plan['plan_id'].strip() or plan['plan_id'] == order.get('plan_id'):
            raise ValueError('新方案必须具有不同于原方案的有效编号')
        if any(source.get('requires_approval') for source in sources):
            raise ValueError('原方案或新方案明确要求审批，请通过审批流程处理')
        if plan.get('plan_kind', 'repair') != old.get('plan_kind', 'repair'):
            raise ValueError('方案替换不能改变维修或检查工单用途')
        steps = plan.get('repair_steps')
        if (plan.get('workorder_ready') is not True or plan.get('validation_findings') or plan.get('validation_errors')
                or not isinstance(steps, list) or not steps or any(not isinstance(step, str) or not step.strip() for step in steps)
                or cls._contains_untrusted_flag(plan)):
            raise ValueError('新方案未通过校验就绪或包含不可信工程证据')
        if not isinstance(plan.get('required_parts', []), list):
            raise ValueError('新方案备件数据无效')
        return plan

    @staticmethod
    def _plan_contract_sources(*values):
        """Inspect known input wrappers; outer values cannot hide inner identity/approval."""
        pending, seen = list(reversed(values)), set()
        while pending:
            source = pending.pop()
            if not isinstance(source, Mapping) or id(source) in seen:
                continue
            seen.add(id(source))
            yield source
            pending.extend(source.get(key) for key in ('raw', 'target_input', 'maintenance_plan', 'plan', 'event'))

    def _replacement_reservations(self, order, required_parts):
        requested = {}
        for raw in required_parts:
            part = raw if isinstance(raw, Mapping) else {'part_no': str(raw)}
            number = str(part.get('part_no') or part.get('part_id') or '').strip()
            quantity = part.get('quantity', 1)
            if not number or isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
                raise ValueError('新方案备件必须提供有效编号及正整数数量')
            requested[number] = requested.get(number, 0) + quantity
        existing = dict(order.get('inventory_reservations') or {})
        reservations = {}
        for number in set(existing) | set(requested):
            record = existing.get(number) or {}
            reserved = int(record.get('quantity') or 0)
            desired = requested.get(number, 0)
            if reserved > desired:
                self.release_inventory(part_no=number, quantity=reserved - desired)
            if desired > reserved:
                result = self.reserve_inventory(part_no=number, quantity=desired - reserved,
                                                workorder_id=order['workorder_id'])
                record = {'reservation_id': result['reservation']['reservation_id']}
            if desired:
                reservations[number] = {**record, 'quantity': desired}
        return reservations

    def mark_repair_completed(self, workorder_id: str, repair_feedback: Any = None, feedback: Any = None, repair_verification: Mapping[str, Any] | None = None, **_: Any) -> dict[str, Any]:
        current = self._require(workorder_id)
        if (current.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection':
            raise ValueError('现场检查工单不能提供维修完成证明')
        if str(current.get("status") or "") != "in_progress":
            raise ValueError("维修提交前工单必须处于 in_progress，不能跳过派工")
        if not str(current.get("assignee") or "").strip() or not current.get("started_at"):
            raise ValueError("维修提交前必须完成派工并记录 started_at")
        supplied = dict(repair_verification or {})
        recovery = supplied.get("device_recovery") or supplied.get("recovery_snapshot")
        if not isinstance(recovery, Mapping):
            raise ValueError("维修完成必须提供设备恢复数据，不能只提交 passed=true")
        feedback_value = repair_feedback if repair_feedback is not None else feedback
        if not self._has_feedback(feedback_value):
            raise ValueError("维修完成必须提供实际维修反馈")
        result = self.submit_repair_feedback(workorder_id, feedback_value or {})
        order = result["workorder"]
        verification = self._build_repair_verification(order, recovery, order.get("repair_feedback") or {})
        if not verification["passed"]:
            raise ValueError("设备恢复数据未通过维修验证：%s" % "、".join(verification.get("validation_findings") or []))
        order = self.update_workorder(workorder_id, status="awaiting_verification", repair_feedback=order.get("repair_feedback") or {}, repair_verification=verification)
        order["repair_verification"] = verification
        return self.update_workorder(workorder_id, status="completed", repair_feedback=order.get("repair_feedback") or {}, repair_verification=verification)

    def record_repair_verification_failed(self, workorder_id: str, repair_verification: Mapping[str, Any] | None = None, reason: str = "", **_: Any) -> dict[str, Any]:
        """记录验证失败事件，禁止无证据地从待验证直接改回处理中。"""
        order = self._require(workorder_id)
        if str(order.get("status") or "") != "awaiting_verification":
            raise ValueError("只有 awaiting_verification 工单可以记录验证失败")
        verification = dict(repair_verification or {})
        verification["passed"] = False
        verification["status"] = "failed"
        verification.setdefault("source", "device_recovery")
        if reason:
            verification.setdefault("validation_findings", []).append(str(reason))
        return self.update_workorder(workorder_id, status="in_progress", repair_verification=verification)

    def close_workorder(self, workorder_id: str, reason: str = "", **_: Any) -> dict[str, Any]:
        order = self._require(workorder_id)
        if (order.get('repair_verification') or {}).get('phase') == 'prestart':
            raise ValueError('预启动验证不能代替运行复核，暂不允许关闭')
        if order.get("status") == "closed":
            return self._order_result(order, already_closed=True)
        if order.get("status") != "completed":
            raise ValueError("工单必须先完成维修（completed）后才能关闭")
        if not self._verification_is_valid(order.get("repair_verification"), order):
            raise ValueError("工单关闭前必须通过基于设备恢复数据的维修验证")
        return self.update_workorder(workorder_id, status="closed", closure_reason=reason)

    def reopen_workorder(self, workorder_id: str, **_: Any) -> dict[str, Any]:
        return self.update_workorder(workorder_id, status="open")

    def get_workorder_template(self, device_id: str = "", plan: Mapping[str, Any] | None = None, **_: Any) -> dict[str, Any]:
        return {"template_id": "WO-TPL-MAINT-001", "device_id": device_id, "title": "设备维修工单", "steps": list((plan or {}).get("repair_steps") or []), "source": "backend-service"}

    def remind(self, workorder_id, actor, text):
        order = self._require(workorder_id)
        return self.team.create_reminder(workorder_id, actor['user_id'], str(order.get('assignee') or ''), text)

    def record_team_inspection(self, workorder_id, actor_id, feedback, snapshot):
        """Save an assignee's inspection; close only after current safe-state evidence.

        Inspection closure is independent of repair confirmation and never grants
        restart or repair-learning authority.
        """
        with self.team.repository.transaction() as db:
            self.team.repository.lock(db)
            borrower = getattr(self.repository, 'borrow_transaction', None)
            team_path = self.team.repository.sqlite_path
            transaction = borrower(db, team_path) if borrower and team_path else nullcontext()
            with transaction:
                order = self._require(workorder_id)
                if not order.get('assignee'):
                    raise ValueError('检查工单必须先完成派工')
                technician = next((item for item in self.team.technicians(device_id=order.get('device_id'))
                                   if item['user_id'] == actor_id), None)
                if not technician or order.get('assignee') != actor_id:
                    raise PermissionError('仅该设备被派工的维修人员可以提交检查记录')
                if (order.get('maintenance_plan_snapshot') or {}).get('plan_kind') != 'inspection':
                    raise ValueError('该接口仅用于现场检查工单，不能替代维修确认')
                previous = str(order.get('status') or '')
                verification = order.get('repair_verification') or {}
                if previous == 'closed' and verification.get('source') == 'inspection' and verification.get('passed') is True:
                    return {**self._order_result(order), 'already_recorded': True,
                            'inspection_result': {key: verification[key] for key in ('passed', 'checks', 'validation_findings')}}
                if previous != 'in_progress' or not order.get('started_at'):
                    raise ValueError('检查工单必须已派工且尚未关闭')
                if not isinstance(feedback, str) or not feedback.strip():
                    raise ValueError('请提交实际现场检查记录')
                sample = dict(snapshot) if isinstance(snapshot, Mapping) else {}
                # Safe stopped states are allowed: another fault may still hold
                # the line stopped while this warning inspection is resolved.
                checks = repair_checks(order.get('device_id'), sample, 'prestart')
                checks['alarm_state_available'] = any(key in sample for key in ('alarm_code', 'active_alarms', 'alarm_codes', 'alarms'))
                checks['snapshot_trusted'] = not any(sample.get(key) is True for key in ('synthetic', 'degraded')) \
                    and sample.get('found') is not False and sample.get('success') is not False and not sample.get('error')
                if sample.get('alarm_active') is True:
                    checks['alarms_clear'] = False
                # Inspection submission reads a current sample, so a day-old
                # repair recovery record is not sufficient to close it.
                try:
                    stamp = sample.get('checked_at') or sample.get('timestamp') or sample.get('updated_at')
                    checked = datetime.fromisoformat(str(stamp).replace('Z', '+00:00'))
                    checked = checked if checked.tzinfo else checked.replace(tzinfo=timezone.utc)
                    age = (datetime.now(timezone.utc) - checked).total_seconds()
                    checks['recovery_fresh'] = checks['recovery_fresh'] and -30 <= age <= 300
                except (TypeError, ValueError, OverflowError):
                    checks['recovery_fresh'] = False
                labels = {'device_identity': '当前样本与工单设备不一致',
                          'ready_to_start': '设备当前状态不适合结束检查',
                          'alarms_clear': '设备仍有报警或异常指标，需要继续处理',
                          'metrics_available': '缺少有效设备指标', 'interlocks_clear': '设备安全互锁未解除',
                          'recovery_fresh': '设备样本已过期或时间无效',
                          'alarm_state_available': '缺少设备当前报警状态',
                          'snapshot_trusted': '当前设备样本不可用或为演示数据'}
                findings = [labels[key] for key, passed in checks.items() if not passed]
                passed = not findings
                verification = {'source': 'inspection', 'phase': 'inspection', 'passed': passed,
                                'checks': checks, 'inspection_snapshot': sample,
                                'validation_findings': findings, 'verified_at': self._now()}
                order.update(repair_feedback={'feedback': feedback.strip(), 'operator': actor_id},
                             repair_verification=verification, updated_at=self._now())
                if passed:
                    order.update(status='closed', completed_at=order['updated_at'], closed_at=order['updated_at'])
                self._record_event(order, 'inspection_completed' if passed else 'inspection_recorded',
                                   previous, order['status'], {'feedback': order['repair_feedback'], 'verification': verification})
                stored = self.repository.update(order)
                return {**self._order_result(stored), 'inspection_result': {
                    'passed': passed, 'checks': checks, 'validation_findings': findings}}

    def confirm_team_repair(self, workorder_id, actor_id, feedback, snapshot):
        order = self._require(workorder_id)
        if (order.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection':
            raise ValueError('现场检查工单不能提供维修确认或复机授权')
        tech = next((t for t in self.team.technicians() if t['user_id'] == actor_id), None)
        if not tech or order.get('assignee') != actor_id:
            raise PermissionError('仅被派工维修人员可以确认')
        checks = repair_checks(order.get('device_id'), snapshot, 'prestart')
        if not str(feedback).strip() or not all(checks.values()) or self._contains_untrusted_flag(snapshot):
            raise ValueError('维修反馈或设备恢复数据不满足预启动验证')
        if (order.get('status') == 'completed' and (order.get('repair_verification') or {}).get('phase') == 'poststart'
                and trusted_technician_confirmation(order)):
            return self._order_result(order, already_confirmed=True)
        verification = {'source': 'device_recovery', 'phase': 'prestart', 'passed': True, 'checks': checks, 'device_recovery': dict(snapshot), 'verified_at': self._now()}
        actual_feedback = {'feedback': str(feedback).strip(), 'operator': actor_id}
        receipt = {'schema_version': 1, 'receipt_id': 'TCF-' + uuid4().hex[:16].upper(),
                   'source': 'backend_team_repair_confirmation', 'confirmation_method': 'technician_feedback',
                   **{key: str(order.get(key) or '') for key in ('workorder_id', 'device_id', 'event_id', 'plan_id')},
                   'actor_id': actor_id, 'confirmed_at': self._now(),
                   'plan_snapshot_digest': confirmation_digest(order.get('maintenance_plan_snapshot') or {}),
                   'diagnosis_snapshot_digest': confirmation_digest(order.get('diagnosis_snapshot') or {}),
                   'feedback_digest': confirmation_digest(actual_feedback),
                   'prestart_checks': dict(checks), 'prestart_snapshot_digest': confirmation_digest(snapshot)}
        fields = {'repair_feedback': actual_feedback, 'maintenance_confirmed_by': actor_id,
                  'repair_verification': verification, 'technician_confirmation': receipt}
        if order.get('status') == 'in_progress':
            self.update_workorder(workorder_id, 'awaiting_verification', **fields)
        elif order.get('status') not in {'awaiting_verification', 'completed'}:
            raise ValueError('工单必须已派发且尚未关闭')
        return self.update_workorder(workorder_id, 'completed', **fields)

    def finalize_team_repair(self, workorder_id, snapshot):
        order = self._require(workorder_id)
        checks = repair_checks(order.get('device_id'), snapshot, 'poststart')
        if order.get('status') != 'completed' or not order.get('maintenance_confirmed_by') or not all(checks.values()):
            raise ValueError('工单或启动后设备证据不满足运行复核')
        verification = {'source': 'device_recovery', 'phase': 'poststart', 'passed': True, 'checks': checks, 'device_recovery': dict(snapshot), 'verified_at': self._now()}
        return self.update_workorder(workorder_id, 'completed', repair_verification=verification)

    def submit_workorder_draft(self, **values: Any) -> dict[str, Any]:
        draft_id = str(values.get("draft_id") or "WOD-" + uuid4().hex[:12].upper())
        draft = {**dict(values), "draft_id": draft_id, "submitted": True, "source": "backend-service"}
        self._save_record("workorder_draft", draft_id, draft)
        return draft

    def get_production_status(self, device_id: str = "", **_: Any) -> dict[str, Any]:
        return {"device_id": device_id, "line": "A线", "status": "running", "cycle_state": "processing", "cycle_state_label": "加工中", "source": "backend-local-fixture", "synthetic": True, "degraded": True, "checked_at": self._now()}

    def query_technicians(self, device_id: str = "", **kwargs: Any) -> dict[str, Any]:
        orders = self.repository.list()
        items = [{"technician_id": user['user_id'], "name": user['username'], "primary_device_id": user['primary_device_id'], "online": user['online'], "available": bool(user['enabled']) and user['online'], "workload": sum(1 for order in orders if order.get('assignee') == user['user_id'] and order.get('status') not in {'completed', 'closed', 'rejected'}), 'registered': True} for user in self.team.technicians(device_id=device_id)]
        return {'success': True, 'items': items, 'total': len(items), 'backend': 'backend-service'}

    def query_technician_skills(self, technician_id: str = "", **_: Any) -> dict[str, Any]:
        return {'success': True, 'items': [], 'status': 'not_recorded', 'backend': 'backend-service'}

    def query_technician_workload(self, technician_id: str = "", **_: Any) -> dict[str, Any]:
        return {'success': True, 'items': [item for item in self.query_technicians()['items'] if item['technician_id'] == technician_id], 'backend': 'backend-service'}

    def query_shift(self, **_: Any) -> dict[str, Any]:
        return {'success': True, 'status': 'not_recorded', 'backend': 'backend-service'}

    def query_team_availability(self, device_id: str = "", **_: Any) -> dict[str, Any]:
        count = sum(1 for user in self.team.technicians(device_id=device_id) if user['online'] and user['enabled'])
        return {'success': True, 'available': count > 0, 'team': '设备维修一组', 'available_count': count, 'backend': 'backend-service'}

    def query_spare_part(self, query: str = "", **_: Any) -> dict[str, Any]:
        part_no = query or "SP-ASSY-TC820-001"
        item = dict(self._inventory.get(part_no) or {"part_no": part_no, "available": True, "quantity": 4, "stock": 4, "part_id": part_no, "name": "维修备件", "reserved": 0, "consumed": 0, "synthetic": True})
        # 保持通用后端契约与现有维修 Agent 兼容；本地 MCP 适配器会在
        # ``parts``/``stock`` 下暴露同一条记录。这些别名只用于观察，
        # 不改变库存语义。
        return {"success": True, "items": [item], "parts": [item], "stock": [item], "backend": "backend-service", "synthetic": bool(item.get("synthetic")), "inventory_status": "demo_only" if item.get("synthetic") else "ready"}

    def reserve_inventory(self, part_no: str, quantity: int = 1, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单预留")
        amount = max(1, int(quantity))
        if int(item.get("stock") or 0) - int(item.get("reserved") or 0) < amount:
            raise ValueError("库存不足，无法预留")
        item["reserved"] = int(item.get("reserved") or 0) + amount
        item["reservation_id"] = "RES-" + uuid4().hex[:10].upper()
        self._inventory[str(part_no)] = item
        return {"success": True, "reservation": dict(item), "backend": "backend-service"}

    def release_inventory(self, part_no: str, quantity: int = 1, **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单释放")
        item["reserved"] = max(0, int(item.get("reserved") or 0) - max(1, int(quantity)))
        self._inventory[str(part_no)] = item
        return {"success": True, "inventory": dict(item), "backend": "backend-service"}

    def consume_inventory(self, part_no: str, quantity: int = 1, **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单消耗")
        amount = max(1, int(quantity))
        if int(item.get("reserved") or 0) < amount:
            raise ValueError("未预留足量库存，不能消耗")
        item["reserved"] -= amount
        item["stock"] -= amount
        item["quantity"] = item["stock"]
        item["consumed"] = int(item.get("consumed") or 0) + amount
        self._inventory[str(part_no)] = item
        return {"success": True, "inventory": dict(item), "backend": "backend-service"}

    def return_inventory(self, part_no: str, quantity: int = 1, **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单归还")
        item["stock"] = int(item.get("stock") or 0) + max(1, int(quantity))
        item["quantity"] = item["stock"]
        self._inventory[str(part_no)] = item
        return {"success": True, "inventory": dict(item), "backend": "backend-service"}

    query_inventory = query_stock = query_part_availability = query_spare_part

    def qms(self, operation: str, **arguments: Any) -> dict[str, Any]:
        return self.inspection.call(operation, **arguments)

    def persist_report(self, **values: Any) -> dict[str, Any]:
        # Agent 报告工具提交 {"report": ReportResult}；直接持久化报告本身，
        # 使列表、详情接口和前端共用同一个扁平契约。
        submitted = values.get("report")
        report = dict(submitted) if isinstance(submitted, Mapping) else dict(values)
        report_id = str(report.get("report_id") or values.get("report_id") or "REPORT-" + uuid4().hex[:10].upper())
        report = {**report, "report_id": report_id, "persisted": True, "updated_at": self._now()}
        report = self._save_record("report", report_id, report)
        return {"success": True, "persisted": True, "report_id": report_id, "report": report, "backend": "backend-service"}

    def get_report(self, report_id: str = "", **_: Any) -> dict[str, Any]:
        report = self._get_record("report", report_id)
        return {"success": bool(report), "found": bool(report), "report_id": report_id, "report": self._normalize_report(report) if report else {}, "backend": "backend-service"}

    @staticmethod
    def _normalize_report(value: Mapping[str, Any]) -> dict[str, Any]:
        nested = value.get('report')
        if isinstance(nested, Mapping):
            return {**nested, 'report_id': value.get('report_id') or nested.get('report_id'),
                    'original_report_id': nested.get('report_id'), 'updated_at': value.get('updated_at') or nested.get('updated_at')}
        return dict(value)

    def list_reports(self, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        records = [self._normalize_report(item) for item in self._list_records("report")]
        items = [item for item in records if not workorder_id or str(item.get("workorder_id") or (item.get('sections') or {}).get('workorder', {}).get('workorder_id') or "") == workorder_id]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def delete_report(self, report_id: str = "", **_: Any) -> dict[str, Any]:
        report_id = str(report_id or "").strip()
        if not report_id:
            raise ValueError("report_id 不能为空")
        deleted = bool(getattr(self.repository, "delete_record", lambda *_args: False)("report", report_id))
        return {"success": deleted, "deleted": deleted, "found": deleted, "report_id": report_id, "backend": "backend-service"}

    def save_experience(self, experience: Mapping[str, Any] | None = None, **values: Any) -> dict[str, Any]:
        item = dict(experience or values)
        source_workorder = str(item.get("source_workorder") or item.get("workorder_id") or "").strip()
        if not source_workorder:
            raise ValueError("经验记录必须关联 source_workorder")
        source_order = self.repository.get(source_workorder)
        if source_order is None or str(source_order.get("status") or "") != "closed":
            raise ValueError("经验记录只能来自已关闭工单")
        if not self._verification_is_valid(source_order.get("repair_verification"), source_order, enforce_freshness=False):
            raise ValueError("经验记录来源工单缺少有效设备恢复验证")
        try:
            quality_score = float(item.get("experience_quality_score") or 0.0)
        except (TypeError, ValueError):
            quality_score = 0.0
        if str(item.get("validation_status") or "") not in {"accepted", "duplicate"} or quality_score < 0.8:
            raise ValueError("经验记录尚未通过质量准入校验")
        if self._contains_untrusted_flag(item) or self._contains_untrusted_flag(source_order):
            raise ValueError("合成演示数据不得写入经验库")
        key = str(item.get("experience_id") or "EXP-" + uuid4().hex[:10].upper())
        item["experience_id"] = key
        self._experiences[key] = self._save_record("experience", key, item)
        return {"success": True, "experience": dict(item), "experience_id": key, "backend": "backend-service"}

    def search_experience(self, device_id: str = "", limit: int = 20, **filters: Any) -> dict[str, Any]:
        values = list(self._experiences.values())
        if device_id:
            values = [item for item in values if str(item.get("device_id") or "") == device_id]
        return {"success": True, "items": [dict(item) for item in values[-max(1, int(limit)):]], "backend": "backend-service"}

    @_quality_operation
    def create_quality_check(self, operator: str = "", **values: Any) -> dict[str, Any]:
        check_id = "QC-" + uuid4().hex[:12].upper()
        result = str(values.get("result") or "pending").lower()
        if result not in {"pending", "passed", "failed", "minor_issue", "major_issue", "high_risk", "not_tested", "insufficient_data", "review"}:
            result = "pending"
        if result == "passed" and (not self._quality_evidence_is_complete(values) or self._contains_untrusted_flag(values)):
            # 只有通用备注或任意 evidence 不能证明尺寸、外观、材料、功能和工艺均已检测。
            result = "pending"
        workflow_status = "passed" if result == "passed" else "failed" if result in {"failed", "minor_issue", "major_issue", "high_risk"} else "open"
        record = {
            "quality_check_id": check_id,
            "target_type": "production_part",
            "target_id": str(values.get("target_id") or values.get("part_id") or ""),
            "workorder_id": str(values.get("workorder_id") or ""),
            "part_id": str(values.get("part_id") or ""),
            "part_no": str(values.get("part_no") or ""),
            "batch_id": str(values.get("batch_id") or ""),
            "production_order_id": str(values.get("production_order_id") or ""),
            "inspection_type": str(values.get("inspection_type") or "part_quality"),
            'measurements': dict(values.get('measurements') or {}), 'specifications': dict(values.get('specifications') or {}),
            'device_id': str(values.get('device_id') or ''), 'task_id': str(values.get('task_id') or ''), 'trace_id': str(values.get('trace_id') or ''),
            "score": values.get("score"),
            "result": result,
            "findings": list(values.get("findings") or []),
            "items": list(values.get("items") or []),
            "quality_validation": dict(values.get("quality_validation") or values.get("inspection_summary") or {}),
            "evidence": list(values.get("evidence") or values.get("inspection_evidence") or []),
            "reviewer": str(values.get("reviewer") or operator),
            "risk_level": str(values.get("risk_level") or "R1"),
            "status": workflow_status,
            "reinspection": {},
            "created_at": self._now(),
            "updated_at": self._now(),
        }
        self._quality[check_id] = self._save_record("quality", check_id, record)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_check_created", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "quality_check_id": check_id, "quality_check": dict(record), "backend": "backend-service"}

    def list_quality_checks(self, target_id: str = "", status: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._list_records("quality") if (not target_id or item.get("target_id") == target_id) and (not status or item.get("status") == status)]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def get_quality_check(self, check_id: str = "", **_: Any) -> dict[str, Any]:
        item = self._get_record("quality", check_id)
        return {"success": bool(item), "quality_check": dict(item or {}), "quality_check_id": check_id, "backend": "backend-service"}

    @_quality_operation
    def submit_quality_appeal(self, check_id: str, reason: str = "", evidence: list[Any] | None = None, operator: str = "", applicant: str = "", **_: Any) -> dict[str, Any]:
        item = self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        appeal = {"appeal_id": "APPEAL-" + uuid4().hex[:10].upper(), "quality_check_id": check_id, "reason": reason, "evidence": list(evidence or []), "applicant": applicant or operator, "status": "pending", "created_at": self._now()}
        item["status"] = "appealed"
        item.setdefault("appeals", []).append(appeal)
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_appeal_submitted", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "appeal": appeal, "backend": "backend-service"}

    @_quality_operation
    def resolve_quality_appeal(self, check_id: str, appeal_id: str = "", decision: str = "approved", reason: str = "", operator: str = "", **_: Any) -> dict[str, Any]:
        item = self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        appeals = list(item.get("appeals") or [])
        if appeal_id:
            appeal = next((value for value in appeals if value.get("appeal_id") == appeal_id), None)
        else:
            pending = [value for value in appeals if value.get("status") == "pending"]
            if len(pending) > 1:
                raise ValueError("存在多个待处理申诉，请指定 appeal_id")
            if not pending:
                raise ValueError("没有待处理的申诉")
            appeal = pending[0]
        if appeal is None:
            raise KeyError("申诉记录不存在：%s" % appeal_id)
        decision = str(decision or "approved").lower()
        if decision not in {"approved", "rejected", "withdrawn"}:
            raise ValueError("无效申诉结论：%s" % decision)
        if appeal.get("status") != "pending":
            raise ValueError("申诉已结束，不能重复处理")
        appeal.update({"status": decision, "resolution_reason": reason, "resolved_by": operator, "resolved_at": self._now()})
        item["appeals"] = appeals
        # 申诉批准后必须重新整改并复检，不能停留在 appealed 状态。
        item["status"] = "rectification" if decision == "approved" else decision
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_appeal_resolved", "object_id": check_id, "operator": operator, "decision": decision, "created_at": self._now()})
        return {"success": True, "appeal": dict(appeal), "quality_check": dict(item), "backend": "backend-service"}

    @_quality_operation
    def create_closure_task(self, operator: str = "", **values: Any) -> dict[str, Any]:
        quality_check_id = str(values.get("quality_check_id") or "")
        quality_check = self._get_record("quality", quality_check_id) if quality_check_id else None
        if quality_check_id and quality_check is None:
            raise KeyError("质检记录不存在：%s" % quality_check_id)
        if quality_check and quality_check.get("status") not in {"failed", "rectification", "appealed", "passed", "open"}:
            raise ValueError("当前质检状态不能创建整改任务：%s" % quality_check.get("status"))
        task_id = "CLOSE-" + uuid4().hex[:12].upper()
        task = {"closure_task_id": task_id, "workorder_id": str(values.get("workorder_id") or ""), "quality_check_id": quality_check_id, "title": str(values.get("title") or ""), "owner": str(values.get("owner") or ""), "actions": list(values.get("actions") or []), "due_at": str(values.get("due_at") or ""), "status": "open", "created_by": operator, "created_at": self._now(), "updated_at": self._now()}
        self._closure_tasks[task_id] = self._save_record("closure", task_id, task)
        if quality_check and quality_check.get("status") in {"failed", "rectification", "passed"}:
            quality_check["status"] = "rectification"
            quality_check["updated_at"] = self._now()
            self._quality[quality_check_id] = self._save_record("quality", quality_check_id, quality_check)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "closure_task_created", "object_id": task_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "closure_task_id": task_id, "closure_task": dict(task), "backend": "backend-service"}

    def list_closure_tasks(self, status: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._list_records("closure") if not status or item.get("status") == status]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    @_quality_operation
    def complete_closure_task(self, task_id: str, operator: str = "", note: str = "", **_: Any) -> dict[str, Any]:
        task = self._get_record("closure", task_id)
        if task is None:
            raise KeyError("闭环整改任务不存在：%s" % task_id)
        if task.get("status") != "open":
            raise ValueError("整改任务已经完成，不能重复提交")
        task.update({"status": "completed", "completion_note": note, "completed_by": operator, "completed_at": self._now(), "updated_at": self._now()})
        self._closure_tasks[task_id] = self._save_record("closure", task_id, task)
        quality_check_id = str(task.get("quality_check_id") or "")
        quality_check = self._get_record("quality", quality_check_id) if quality_check_id else None
        if quality_check and quality_check.get("status") == "rectification":
            related = [
                item for item in self._list_records("closure")
                if str(item.get("quality_check_id") or "") == quality_check_id
            ]
            if related and all(item.get("status") == "completed" for item in related):
                quality_check["status"] = "reinspection"
                quality_check["updated_at"] = self._now()
                self._quality[quality_check_id] = self._save_record("quality", quality_check_id, quality_check)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "closure_task_completed", "object_id": task_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "closure_task": dict(task), "backend": "backend-service"}

    @_quality_operation
    def reinspect_quality_check(self, check_id: str, passed: bool = False, findings: list[Any] | None = None, evidence: list[Any] | None = None, operator: str = "", reinspection_check_id: str = "", **_: Any) -> dict[str, Any]:
        item = self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if item.get("status") != "reinspection":
            raise ValueError("只有完成整改的质检记录才能复检")
        if type(passed) is not bool:
            raise ValueError("复检 passed 必须是布尔值")
        source = self._validated_reinspection(item, reinspection_check_id) if passed else None
        reinspection = {"passed": passed, "findings": list(findings or []), "evidence": list(evidence or []), "operator": operator, "checked_at": self._now()}
        if source is not None:
            reinspection.update({"reinspection_check_id": reinspection_check_id, "quality_validation": deepcopy(source["quality_validation"])})
        item["reinspection"] = reinspection
        item["status"] = "reinspection" if passed else "failed"
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_reinspection_recorded", "object_id": check_id, "operator": operator, "passed": passed, "reinspection_check_id": reinspection_check_id if passed else "", "created_at": self._now()})
        return {"success": True, "quality_check": dict(item), "quality_check_id": check_id, "backend": "backend-service"}

    @_quality_operation
    def release_quality_check(self, check_id: str, operator: str = "", **_: Any) -> dict[str, Any]:
        item = self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        self._completed_quality_tasks(check_id)
        direct_pass = item.get("status") == "passed" and self._quality_record_is_trusted(item)
        reinspection = item.get("reinspection") or {}
        reinspected_pass = item.get("status") == "reinspection" and reinspection.get("passed") is True
        if reinspected_pass:
            self._validated_reinspection(item, str(reinspection.get("reinspection_check_id") or ""))
        if not direct_pass and not reinspected_pass:
            raise ValueError("质检未通过有效检测或复检，不能 Release")
        item["status"] = "released"
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_released", "object_id": check_id, "operator": operator, "reinspection_check_id": str(reinspection.get("reinspection_check_id") or ""), "created_at": self._now()})
        return {"success": True, "quality_check": dict(item), "quality_check_id": check_id, "backend": "backend-service"}

    @_quality_operation
    def close_quality_check(self, check_id: str, operator: str = "", note: str = "", **_: Any) -> dict[str, Any]:
        item = self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if item.get("status") != "released":
            raise ValueError("只有 Release 后的质检记录才能 Close")
        item["status"] = "closed"
        item["close_note"] = note
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_closed", "object_id": check_id, "operator": operator, "note": note, "created_at": self._now()})
        return {"success": True, "quality_check": dict(item), "quality_check_id": check_id, "backend": "backend-service"}

    def list_audit_logs(self, object_id: str = "", action: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._list_records("audit") if (not object_id or item.get("object_id") == object_id) and (not action or item.get("action") == action)]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def _completed_quality_tasks(self, check_id: str, *, required: bool = False) -> list[dict[str, Any]]:
        tasks = [item for item in self._list_records("closure") if str(item.get("quality_check_id") or "") == check_id]
        if (required and not tasks) or any(item.get("status") != "completed" or not item.get("completed_at") for item in tasks):
            raise ValueError("所有必需整改任务必须完成整改后才能复检或放行")
        return tasks

    @classmethod
    def _quality_record_is_trusted(cls, item: Mapping[str, Any]) -> bool:
        return (
            item.get("result") == "passed"
            and item.get("status") in {"passed", "released", "closed"}
            and item.get("target_type") == "production_part"
            and item.get("inspection_type") == "part_quality"
            and bool(str(item.get("part_id") or item.get("target_id") or "").strip())
            and bool(str(item.get("batch_id") or "").strip())
            and not cls._contains_untrusted_flag(item)
            and cls._quality_evidence_is_complete(item)
        )

    def _validated_reinspection(self, item: Mapping[str, Any], reference: str) -> dict[str, Any]:
        check_id = str(item.get("quality_check_id") or "")
        tasks = self._completed_quality_tasks(check_id, required=True)
        source = self._get_record("quality", reference) if reference and reference != check_id else None
        if source is None or not self._quality_record_is_trusted(source):
            raise ValueError("复检通过必须引用已持久化且五项检测通过的 reinspection_check_id")
        part_id = str(item.get("part_id") or item.get("target_id") or "").strip()
        batch_id = str(item.get("batch_id") or "").strip()
        if not part_id or not batch_id or part_id != str(source.get("part_id") or source.get("target_id") or "").strip() or batch_id != str(source.get("batch_id") or "").strip():
            raise ValueError("复检记录必须属于同一零件和非空生产批次")
        try:
            inspected_at = datetime.fromisoformat(str(source.get("created_at") or "").replace("Z", "+00:00"))
            completed_at = [datetime.fromisoformat(str(task["completed_at"]).replace("Z", "+00:00")) for task in tasks]
            if inspected_at.tzinfo is None or any(moment.tzinfo is None for moment in completed_at) or any(inspected_at < moment for moment in completed_at):
                raise ValueError("复检记录必须在所有整改完成之后生成")
        except (TypeError, ValueError) as error:
            raise ValueError("复检记录必须在所有整改完成之后生成且有有效时间") from error
        return source

    def _require(self, workorder_id: str) -> dict[str, Any]:
        value = self.repository.get(workorder_id)
        if value is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        return value

    def _reserve_required_parts(self, order: Mapping[str, Any]) -> None:
        """派工前预留维修方案声明的备件，避免未锁库存就进入执行中。"""
        reservations = dict(order.get("inventory_reservations") or {})
        for raw in order.get("required_parts") or []:
            item = raw if isinstance(raw, Mapping) else {"part_no": str(raw)}
            part_no = str(item.get("part_no") or item.get("part_id") or "").strip()
            if not part_no:
                raise ValueError("维修方案中的备件缺少 part_no，不能派工")
            quantity = max(1, int(item.get("quantity") or 1))
            if part_no in reservations and int(reservations[part_no].get("quantity") or 0) >= quantity:
                continue
            reservation = self.reserve_inventory(part_no=part_no, quantity=quantity, workorder_id=str(order.get("workorder_id") or ""))
            reservations[part_no] = {"reservation_id": (reservation.get("reservation") or {}).get("reservation_id", ""), "quantity": quantity}
        if reservations and str(order.get("workorder_id") or ""):
            order_value = dict(order)
            order_value["inventory_reservations"] = reservations
            self.repository.update(order_value)

    @staticmethod
    def _has_feedback(value: Any) -> bool:
        if isinstance(value, Mapping):
            return any(str(value.get(key) or "").strip() for key in ("feedback", "summary", "result", "content", "repair_feedback"))
        return bool(str(value or "").strip())

    @staticmethod
    def _contains_untrusted_flag(value: Any) -> bool:
        if isinstance(value, Mapping):
            if value.get("synthetic") is True or value.get("is_synthetic") is True or value.get("degraded") is True:
                return True
            return any(BackendBusinessService._contains_untrusted_flag(item) for item in value.values())
        if isinstance(value, (list, tuple, set)):
            return any(BackendBusinessService._contains_untrusted_flag(item) for item in value)
        return False

    @staticmethod
    def _quality_evidence_is_complete(values: Mapping[str, Any]) -> bool:
        checks = values.get("quality_validation") or values.get("inspection_summary") or values.get("checks")
        if not isinstance(checks, Mapping):
            return False
        required = ("dimensions", "appearance", "material", "function", "process")
        return all(
            isinstance(checks.get(key), Mapping)
            and checks[key].get("passed") is True
            and checks[key].get("sufficient_data") is True
            and str(checks[key].get("status") or "").lower() == "pass"
            and bool(checks[key].get("items"))
            for key in required
        )

    @classmethod
    def _verification_is_valid(cls, verification: Any, order: Mapping[str, Any], *, enforce_freshness: bool = True) -> bool:
        if (order.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection':
            return False
        if not isinstance(verification, Mapping) or verification.get("passed") is not True:
            return False
        if verification.get("source") != "device_recovery":
            return False
        recovery = verification.get("device_recovery")
        checks = verification.get("checks")
        if verification.get('phase') == 'prestart':
            return isinstance(recovery, Mapping) and all(repair_checks(order.get('device_id'), recovery, 'prestart').values())
        return isinstance(recovery, Mapping) and isinstance(checks, Mapping) and all(checks.get(key) is True for key in cls.REQUIRED_RECOVERY_CHECKS) and (not enforce_freshness or cls._recovery_is_fresh(recovery))

    @classmethod
    def _build_repair_verification(cls, order: Mapping[str, Any], recovery: Mapping[str, Any], feedback: Mapping[str, Any]) -> dict[str, Any]:
        values = dict(recovery)
        device_id = str(order.get("device_id") or "")
        recovery_device_id = str(values.get("device_id") or values.get("id") or "")
        status = str(values.get("status") or values.get("state") or "").lower()
        fault_evidence = values.get("fault_evidence") if isinstance(values.get("fault_evidence"), Mapping) else {}
        active_alarms = values.get("active_alarms")
        alarms_clear = not bool(values.get("alarm_code") or active_alarms or fault_evidence.get("active"))
        metrics = values.get("metrics") or values.get("metric_details")
        checks = {
            "device_identity": bool(device_id and recovery_device_id and device_id == recovery_device_id),
            "operational": status in {"running", "idle", "ready", "standby", "normal", "completed"},
            "alarms_clear": alarms_clear,
            "metrics_available": isinstance(metrics, Mapping) and bool(metrics),
            "recovery_fresh": cls._recovery_is_fresh(values),
        }
        findings: list[str] = []
        if not checks["device_identity"]:
            findings.append("设备身份与工单不一致")
        if not checks["operational"]:
            findings.append("设备未恢复到可运行状态")
        if not checks["alarms_clear"]:
            findings.append("设备仍存在活动报警或故障证据")
        if not checks["metrics_available"]:
            findings.append("缺少设备恢复指标")
        if not checks["recovery_fresh"]:
            findings.append("recovery_fresh")
        return {
            "source": "device_recovery",
            "passed": not findings,
            "device_recovery": values,
            "checks": checks,
            "validation_findings": findings,
            "feedback": dict(feedback or {}),
            "status": "verified" if not findings else "failed",
            "verified_at": cls._now(),
        }

    @staticmethod
    def _recovery_is_fresh(recovery: Mapping[str, Any], *, now: datetime | None = None) -> bool:
        if any(recovery.get(key) is True for key in ("stale", "expired", "is_stale")):
            return False
        raw_checked_at = recovery.get("checked_at") or recovery.get("timestamp") or recovery.get("updated_at")
        if not raw_checked_at:
            return False
        try:
            _checked_at = datetime.fromisoformat(str(raw_checked_at).replace("Z", "+00:00"))
            if _checked_at.tzinfo is None:
                _checked_at = _checked_at.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return False
        current = now or datetime.now(timezone.utc)
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        try:
            max_age = float(os.getenv("RECOVERY_MAX_AGE_SECONDS", "86400"))
            clock_skew = float(os.getenv("RECOVERY_CLOCK_SKEW_SECONDS", "30"))
        except (TypeError, ValueError):
            return False
        if max_age < 0 or clock_skew < 0:
            return False
        age = (current - _checked_at).total_seconds()
        if age > max_age or age < -clock_skew:
            return False
        raw_expires_at = recovery.get("expires_at")
        if not raw_expires_at:
            return True
        try:
            expires_at = datetime.fromisoformat(str(raw_expires_at).replace("Z", "+00:00"))
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return False
        return expires_at > current

    def _get_record(self, record_type: str, record_id: str) -> dict[str, Any] | None:
        loader = getattr(self.repository, "get_record", None)
        if loader is None:
            return None
        value = loader(record_type, record_id)
        return dict(value) if value else None

    @staticmethod
    def _record_event(order: dict[str, Any], action: str, from_status: str, to_status: str, payload: Mapping[str, Any]) -> None:
        event = {"event_id": "WO-EVT-" + uuid4().hex[:12].upper(), "workorder_id": order["workorder_id"], "action": action, "from_status": from_status, "to_status": to_status, "payload": dict(payload or {}), "created_at": datetime.now(timezone.utc).isoformat()}
        order.setdefault("events", []).append(event)
        order.setdefault("status_history", []).append(event)
