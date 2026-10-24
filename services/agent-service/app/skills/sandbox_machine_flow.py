"""One-shot virtual fault loop for expert draft verification inside OpenSandbox.

All device, workorder and report records are local to this process. No service
address, credential or host mount is available to the runner.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from app.agents.diagnosis.agent import DiagnosisAgent
from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.workorder.agent import WorkOrderAgent
from app.agents.report.agent import ReportAgent
from app.skills.registry import skill_registry_scope
from app.skills.testing import SampleTools, TrialClient
from app.workorder.validator import WorkOrderValidator


def _as_dict(value: Any) -> dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


class VirtualTools:
    """Bounded in-memory adapters used by the real domain Agents."""

    def __init__(self, sample: Mapping[str, Any]) -> None:
        self.sample = dict(sample)
        self.diagnosis = SampleTools(self.sample)
        self.orders: dict[str, dict[str, Any]] = {}
        self.calls: list[str] = []
        self.denied = False

    def tool_schemas(self, allowed_tools=None):
        return self.diagnosis.tool_schemas(allowed_tools)

    def execute(self, name, arguments, context=None):
        self.calls.append(name)
        if name == "search_knowledge":
            sop = str(self.sample.get("sop_document") or "").strip()
            return {"source": "expert_test_sample", "success": True, "found": bool(sop),
                    "documents": [{"document_id": "SIM-SOP", "title": "专家提供的测试依据",
                                   "content": sop, "source_type": "sop"}] if sop else []}
        if name in self.diagnosis.names:
            return self.diagnosis.execute(name, arguments, context)
        if name == "submit_workorder_draft":
            return {**dict(arguments), "draft_id": "SIM-DRAFT", "submitted": True,
                    "source": "expert_test_sample"}
        if name == "generate_repair_plan":
            return {}
        if name == "create_workorder":
            identity = "SIM-WO-" + str(self.sample.get("test_id") or "sample")[:12]
            order = {**dict(arguments), "workorder_id": identity, "status": "open", "assignee": ""}
            self.orders[identity] = order
            return order
        if name == "assign_workorder":
            order = self.orders[str(arguments.get("workorder_id") or "")]
            order.update(status="in_progress", assignee=str(arguments.get("assignee") or "SIM-TECH"))
            return dict(order)
        if name == "get_workorder":
            order = self.orders.get(str(arguments.get("workorder_id") or ""))
            return dict(order) if order else {"found": False}
        if name == "query_technicians":
            return {"success": True, "items": [{"technician_id": "SIM-TECH", "name": "模拟维修人员",
                                                "available": True, "online": True, "registered": True,
                                                "responsible_device_ids": ["EXPERT-SAMPLE"],
                                                "skills": ["设备维修"], "workload": 0}]}
        if name == "query_technician_skills":
            return {"success": True, "items": [{"skills": ["设备维修"]}]}
        if name == "query_technician_workload":
            return {"success": True, "items": [{"workload": 0}]}
        if name in {"query_shift", "query_team_availability"}:
            return {"success": True, "available": True, "shift": "simulated"}
        if name in {"search_knowledge", "query_cad", "query_part", "query_bom", "get_component_location",
                    "query_inventory", "query_part_availability", "get_workorder_template"}:
            return {"success": True, "found": False, "documents": [], "components": [], "bom_items": [], "items": []}
        if name in {"get_diagnosis_record", "get_maintenance_record", "get_quality_record"}:
            return {"record": dict(arguments.get("record") or {}), "success": True}
        if name == "get_trace_summary":
            return {"summary": {}, "success": True}
        self.denied = True
        raise PermissionError("模拟闭环禁止调用外部业务工具")


def execute_machine_flow(payload: Mapping[str, Any], registry: Any, client: Any) -> dict[str, Any]:
    sample = dict(payload.get("sample") or {})
    sample["test_id"] = str(payload.get("test_id") or "sandbox")
    sample.setdefault("alarm_code", "")
    sample.setdefault("scenario", "")
    if not str(sample.get("sop_document") or "").strip():
        return {"ok": False, "message": "请提供测试用 SOP 或知识库依据；缺少维修证据不能验证完整闭环。"}
    tools = VirtualTools(sample)
    trial_client = TrialClient(client, "diagnosis")
    if not trial_client.available:
        return {"ok": False, "message": "尚未配置模型服务，无法运行模拟闭环。"}
    event = {
        "event_id": "SIM-" + sample["test_id"], "device_id": "EXPERT-SAMPLE",
        "alarm_code": sample["alarm_code"] or None,
        "severity": sample.get("severity") or "critical",
        "summary": sample["scenario"], "description": sample["scenario"],
        "realtime_snapshot": {"现场记录": sample["scenario"]},
        "abnormal_metrics": sample.get("abnormal_metrics") or [],
        "occurrence_count": sample.get("occurrence_count") or 1,
    }
    with skill_registry_scope(registry):
        diagnosis = _as_dict(DiagnosisAgent(client=trial_client, tools=tools, skill_registry=registry).run(event))
        if payload.get("name") not in diagnosis.get("active_skills", []):
            return {"ok": False, "message": "当前模拟场景未触发所选诊断技能。"}
        if (diagnosis.get("status") != "completed" or diagnosis.get("stop_reason") != "validator_pass"
                or tools.denied or tools.diagnosis.denied or not trial_client.last_candidate):
            return {"ok": False, "message": "模拟诊断未通过校验，请核对场景和草稿。"}

        plan = _as_dict(MaintenanceAgent(tools=tools).run({
            "device_id": event["device_id"], "event": event, "diagnosis_result": diagnosis,
            "runtime_managed": False, "knowledge": {}, "cad": {},
        }))
        if not plan.get("workorder_ready") or plan.get("validation_findings"):
            return {"ok": False, "message": "模拟维修方案未通过派工校验。",
                    "result": {"diagnosis": diagnosis, "maintenance_plan": plan}}

        workorder_agent = WorkOrderAgent(tools=tools)
        order_result = _as_dict(workorder_agent.run({
            "action": "create", "maintenance_plan": plan, "event": event,
            "source": "manual_draft", "auto_dispatch": False,
        }))
        order = tools.orders.get(str(order_result.get("workorder_id") or "")) or {}
        if order_result.get("success") and order and not order.get("assignee"):
            dispatch = workorder_agent.collect_dispatch_context(plan, order)
            candidates = workorder_agent.rank_candidates(dispatch, {}, plan)
            if candidates:
                assignment = _as_dict(workorder_agent.run({"action": "assign", "workorder_id": order["workorder_id"],
                                                           "assignee": candidates[0]["technician_id"]}))
                if not assignment.get("success"):
                    order = {}
        if not order_result.get("success") or not order.get("assignee") or tools.denied:
            return {"ok": False, "message": "模拟工单未通过派工校验。",
                    "result": {"findings": order_result.get("validation_findings") or []}}

        # These are explicitly simulated observations. They never become a
        # production repair or physical restart receipt.
        WorkOrderValidator.validate_transition(order["status"], "awaiting_verification")
        order["status"] = "awaiting_verification"
        recovery = {"device_id": event["device_id"], "status": "running", "alarm_code": "",
                    "active_alarms": [], "metrics": {"simulated": 1},
                    "checked_at": datetime.now(timezone.utc).isoformat(), "simulation": True}
        verification = WorkOrderValidator.build_repair_verification(order, recovery, {"feedback": "沙箱模拟维修"})
        if not verification.get("passed"):
            return {"ok": False, "message": "模拟复机验证未通过。"}
        WorkOrderValidator.validate_transition(order["status"], "completed")
        order.update(status="completed", repair_feedback={"feedback": "沙箱模拟维修", "simulation": True},
                     repair_verification=verification)

        report = _as_dict(ReportAgent(tools=tools).run({
            "report_type": "full_case_report", "event": event, "diagnosis": diagnosis,
            "maintenance_plan": plan, "workorder": order,
            "repair_feedback": order["repair_feedback"], "repair_verification": verification,
            "persist": False,
        }))
    if report.get("status") != "completed" or tools.denied:
        return {"ok": False, "message": "模拟汇总报告未通过校验。"}
    return {"ok": True, "result": {
        "summary": diagnosis.get("summary"), "diagnosis": diagnosis.get("diagnosis"),
        "recommendation": diagnosis.get("recommendation"),
        "maintenance_plan": {key: plan.get(key) for key in ("plan_id", "plan_kind", "repair_steps", "workorder_ready")},
        "workorder": {"workorder_id": order["workorder_id"], "status": order["status"], "assignee": order["assignee"], "simulation": True},
        "report": {"report_type": report.get("report_type"), "status": report.get("status"), "simulation": True},
    }, "criteria": {"diagnosis": True, "maintenance": True, "workorder": True,
                     "report": True, "skill_used": True}, "simulation": True}
