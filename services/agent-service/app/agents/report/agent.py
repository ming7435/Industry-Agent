"""运维案例报告 Agent。"""

from __future__ import annotations

from collections import Counter
from typing import Any, Mapping
from uuid import uuid4

from app.tools.registry import ToolRegistry
from app.validator import ReportResult

from .graph import build_report_graph
from .validator import ReportValidator


class ReportAgent:
    """只汇总已有记录，不重新诊断，也不新增故障事实。"""

    name = "report"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.graph = build_report_graph()

    def run(self, task: Any) -> ReportResult:
        payload = dict(task or {}) if isinstance(task, Mapping) else {}
        output = self.graph.invoke({"agent": self, "request": payload})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Report LangGraph 未生成结果")
        return result

    def _safe_tool(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        try:
            return self.tools.execute(name, arguments)
        except Exception as error:
            return {"found": False, "success": False, "error": str(error), "tool": name}

    @staticmethod
    def _record(value: Mapping[str, Any] | None) -> dict[str, Any]:
        payload = dict(value or {})
        record = payload.get("record")
        return dict(record) if isinstance(record, Mapping) else payload

    @classmethod
    def _completeness_findings(cls, sections: Mapping[str, Any], report_type: str) -> list[str]:
        required = {
            "diagnosis_report": ("diagnosis",),
            "maintenance_report": ("diagnosis", "maintenance_plan", "workorder"),
            "quality_report": ("workorder", "quality"),
            "incident_report": ("event",),
            "full_case_report": ("diagnosis", "maintenance_plan", "workorder", "quality"),
        }.get(report_type, ("diagnosis", "maintenance_plan", "workorder", "quality"))
        return ["报告缺少 %s 必需记录" % name for name in required if not cls._mapping(sections.get(name))]

    def _compose_result(
        self,
        payload: Mapping[str, Any],
        sections: Mapping[str, Any],
        report_type: str,
        source_refs: list[dict[str, Any]],
        findings: list[str],
    ) -> ReportResult:
        diagnosis = self._mapping(sections.get("diagnosis"))
        plan = self._mapping(sections.get("maintenance_plan"))
        order = self._mapping(sections.get("workorder"))
        quality = self._mapping(sections.get("quality"))
        event = self._mapping(sections.get("event"))
        device_id = self._device_id(payload, diagnosis, order, event)
        status = "completed" if not findings else "incomplete"
        return ReportResult(
            report_id="RPT-" + uuid4().hex[:10].upper(),
            report_type=report_type,
            title="%s设备运维案例报告" % device_id,
            summary=self._summary(device_id, diagnosis, plan, quality, status, findings),
            status=status,
            sections=dict(sections),
            source_refs=source_refs,
            validation_findings=list(findings),
            stop_reason="validator_pass" if not findings else "validation_failed",
        )

    @classmethod
    def _validate_report(
        cls,
        sections: Mapping[str, Any],
        source_refs: list[Mapping[str, Any]],
        report_type: str,
        completeness_findings: list[str],
    ) -> list[str]:
        return cls._dedupe(completeness_findings + ReportValidator.validate(sections, source_refs, report_type))

    def _fallback_result(self, payload: Mapping[str, Any], findings: list[str]) -> ReportResult:
        report_type = str(payload.get("report_type") or "incident_report")
        if report_type == "daily":
            report_type = "incident_report"
        event = self._mapping(payload.get("event"))
        sections = {"event": event} if event else {}
        refs = self._source_refs(payload, sections)
        return self._compose_result(payload, sections, report_type, refs, findings)

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values

    def _legacy_run(self, task: Any) -> ReportResult:
        payload = dict(task or {}) if isinstance(task, Mapping) else {}
        diagnosis = self._mapping(payload.get("diagnosis"))
        plan = self._mapping(payload.get("maintenance_plan") or payload.get("plan"))
        order = self._mapping(payload.get("workorder"))
        quality = self._mapping(payload.get("quality"))
        knowledge = self._mapping(payload.get("knowledge"))
        event = self._mapping(payload.get("event"))
        trace = list(payload.get("trace") or [])

        sections: dict[str, Any] = {
            "diagnosis": diagnosis,
            "maintenance_plan": plan,
            "workorder": order,
            "quality": quality,
        }
        if knowledge:
            sections["knowledge"] = knowledge
        if event:
            sections["event"] = event
        if trace:
            sections["trace_summary"] = self._trace_summary(trace)

        report_type = self._report_type(payload, diagnosis, plan, order, quality)
        source_refs = self._source_refs(payload, sections)
        findings = ReportValidator.validate(sections, source_refs, report_type)
        device_id = self._device_id(payload, diagnosis, order, event)
        status = "completed" if not findings else "incomplete"
        return ReportResult(
            report_id="RPT-" + uuid4().hex[:10].upper(),
            report_type=report_type,
            title="%s设备运维案例报告" % device_id,
            summary=self._summary(device_id, diagnosis, plan, quality, status, findings),
            status=status,
            sections=sections,
            source_refs=source_refs,
            validation_findings=findings,
        )

    @staticmethod
    def _mapping(value: Any) -> dict[str, Any]:
        if hasattr(value, "model_dump"):
            return value.model_dump(mode="json")
        return dict(value or {}) if isinstance(value, Mapping) else {}

    @staticmethod
    def _device_id(payload: Mapping[str, Any], diagnosis: Mapping[str, Any], order: Mapping[str, Any], event: Mapping[str, Any]) -> str:
        context = ReportAgent._mapping(payload.get("context"))
        return str(
            diagnosis.get("device_id")
            or order.get("device_id")
            or event.get("device_id")
            or payload.get("device_id")
            or context.get("device_id")
            or "unknown"
        )

    @staticmethod
    def _report_type(payload: Mapping[str, Any], diagnosis: Mapping[str, Any], plan: Mapping[str, Any], order: Mapping[str, Any], quality: Mapping[str, Any]) -> str:
        requested = str(payload.get("report_type") or "").strip().lower()
        aliases = {
            "diagnosis": "diagnosis_report",
            "maintenance": "maintenance_report",
            "quality": "quality_report",
            "daily": "incident_report",
        }
        if requested in aliases:
            return aliases[requested]
        if requested in {"diagnosis_report", "maintenance_report", "quality_report", "incident_report", "full_case_report"}:
            return requested
        if diagnosis and plan and order and quality:
            return "full_case_report"
        if quality:
            return "quality_report"
        if plan or order:
            return "maintenance_report"
        if diagnosis:
            return "diagnosis_report"
        return "incident_report"

    @staticmethod
    def _summary(device_id: str, diagnosis: Mapping[str, Any], plan: Mapping[str, Any], quality: Mapping[str, Any], status: str, findings: list[str]) -> str:
        fault = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or "").strip()
        if quality and "passed" in quality:
            quality_text = "通过" if bool(quality.get("passed")) else "未通过"
            base = "%s设备维修质检%s。" % (device_id, quality_text)
            if fault:
                base += "诊断记录：%s" % fault
        elif fault:
            base = "%s设备已汇总诊断与维修记录，诊断记录：%s" % (device_id, fault)
        elif plan:
            base = "%s设备已生成维修计划报告。" % device_id
        else:
            base = "%s设备运维记录已汇总。" % device_id
        if status != "completed":
            base += "报告状态为 incomplete：%s。" % "；".join(findings)
        return base

    @staticmethod
    def _trace_summary(trace: list[Any]) -> dict[str, Any]:
        records = [item for item in trace if isinstance(item, Mapping)]
        type_counts = Counter(str(item.get("type") or "unknown") for item in records)
        names = {
            trace_type: sorted({str(item.get("name") or "") for item in records if item.get("type") == trace_type and item.get("name")})
            for trace_type in type_counts
        }
        return {"record_count": len(records), "type_counts": dict(type_counts), "names": names}

    @classmethod
    def _source_refs(cls, payload: Mapping[str, Any], sections: Mapping[str, Any]) -> list[dict[str, Any]]:
        refs: list[dict[str, Any]] = []

        def add(section: str, ref_type: str, ref_id: Any = "", source: str = "", label: str = "") -> None:
            item = {"section": section, "type": ref_type, "id": str(ref_id or ""), "source": str(source or ""), "label": str(label or "")}
            key = (item["section"], item["type"], item["id"], item["source"], item["label"])
            existing = {(ref["section"], ref["type"], ref["id"], ref["source"], ref["label"]) for ref in refs}
            if key not in existing:
                refs.append(item)

        diagnosis = cls._mapping(sections.get("diagnosis"))
        if diagnosis:
            add("diagnosis", "record", diagnosis.get("diagnosis_run_id") or diagnosis.get("event_id"), diagnosis.get("source"), "DiagnosisResult")
            if diagnosis.get("trace_id"):
                add("diagnosis", "trace", diagnosis.get("trace_id"), "trace", "诊断 Trace")
            alarm = cls._mapping(diagnosis.get("alarm_definition"))
            if alarm.get("alarm_code"):
                add("diagnosis", "alarm", alarm.get("alarm_code"), alarm.get("source"), alarm.get("name"))
            for item in diagnosis.get("tool_calls") or []:
                if not isinstance(item, Mapping):
                    continue
                result = cls._mapping(item.get("result"))
                add("diagnosis", "tool", item.get("name"), result.get("source"), "诊断工具调用")
                for key in ("document_id", "id", "alarm_code"):
                    if result.get(key):
                        add("diagnosis", key, result.get(key), result.get("source"), result.get("title", ""))

        plan = cls._mapping(sections.get("maintenance_plan"))
        if plan:
            add("maintenance_plan", "plan", plan.get("plan_id"), "maintenance", plan.get("repair_target", "维修计划"))
            for ref_id in plan.get("source_documents") or []:
                add("maintenance_plan", "document", ref_id, "knowledge", "维修依据")
            for ref_id in plan.get("cad_components") or []:
                add("maintenance_plan", "cad_component", ref_id, "cad", "工程部件")
            for item in plan.get("evidence") or []:
                if isinstance(item, Mapping):
                    add("maintenance_plan", str(item.get("type") or "evidence"), item.get("document_id") or item.get("component_id") or item.get("part_no"), item.get("source"), item.get("title") or item.get("name"))

        order = cls._mapping(sections.get("workorder"))
        if order:
            add("workorder", "workorder", order.get("workorder_id"), "workorder", order.get("title", "WorkOrder"))
            if order.get("plan_id"):
                add("workorder", "plan", order.get("plan_id"), "workorder", "工单关联计划")
            if order.get("repair_feedback"):
                add("workorder", "repair_feedback", order.get("workorder_id"), "workorder", "维修反馈")

        quality = cls._mapping(sections.get("quality"))
        if quality:
            quality_ref = quality.get("part_id") or quality.get("part_no") or "part_quality"
            add("quality", "quality", quality_ref, "quality", "QualityResult")
            if quality.get("checked_at"):
                add("quality", "checked_at", quality.get("checked_at"), "quality", "质检时间")
            for item in quality.get("evidence") or []:
                if isinstance(item, Mapping):
                    add("quality", str(item.get("type") or "evidence"), item.get("part_id") or item.get("part_no") or item.get("metric") or item.get("document_id"), item.get("source"), "质检证据")

        knowledge = cls._mapping(sections.get("knowledge"))
        for item in knowledge.get("documents") or []:
            if isinstance(item, Mapping):
                add("knowledge", "document", item.get("document_id"), item.get("source"), item.get("title"))
        event = cls._mapping(sections.get("event"))
        if event:
            add("event", "event", event.get("event_id"), "monitor", event.get("alarm_code", "异常事件"))
        if payload.get("trace_id"):
            add("trace", "trace", payload.get("trace_id"), "trace", "流程 Trace")
        return refs
