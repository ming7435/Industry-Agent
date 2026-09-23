"""Minimal JEV (Goal/Event) parsing boundary.

JEV normalizes user or monitor input. It deliberately does not select Agents,
execute Actions, or control loops; those responsibilities remain in Planner,
CapabilityRegistry, and LoopEngine.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(frozen=True)
class GoalEvent:
    goal: str
    entities: dict[str, Any] = field(default_factory=dict)
    constraints: dict[str, Any] = field(default_factory=dict)
    required_capabilities: tuple[str, ...] = ()
    source: str = "unknown"
    raw: dict[str, Any] = field(default_factory=dict)
    validation_findings: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "goal": self.goal,
            "entities": dict(self.entities),
            "constraints": dict(self.constraints),
            "required_capabilities": list(self.required_capabilities),
            "source": self.source,
            "raw": dict(self.raw),
            "validation_findings": list(self.validation_findings),
        }


class JEVParser:
    """Normalize the existing event/user payloads without adding a dependency."""

    EVENT_CAPABILITIES = (
        "fault_analysis",
        "document_search",
        "drawing_search",
        "repair_planning",
        "workorder_create",
    )

    def parse(self, payload: Any) -> GoalEvent:
        if isinstance(payload, str):
            text = payload.strip()
            return GoalEvent(
                goal=text or "处理工业运维请求",
                required_capabilities=self._user_capabilities(text),
                source="user",
                raw={"user_text": payload},
                validation_findings=("goal is blank",) if not text else (),
            )
        findings: list[str] = []
        if not isinstance(payload, Mapping):
            findings.append("payload must be a mapping or string")
        raw = dict(payload or {}) if isinstance(payload, Mapping) else {}
        user_text = str(raw.get("user_text") or raw.get("goal") or "").strip()
        event_type = str(raw.get("event_type") or raw.get("alarm_code") or "设备异常").strip()
        is_event = bool(raw.get("event_id") or raw.get("abnormal_metrics") or raw.get("realtime_snapshot"))
        source = "event" if is_event else "user"
        goal = user_text or "处理%s" % event_type
        entities = {
            key: value
            for key, value in raw.items()
            if key not in {"user_text", "goal", "constraints", "required_capabilities"}
            and value not in (None, "", [], {})
        }
        constraints = dict(raw.get("constraints") or {}) if isinstance(raw.get("constraints"), Mapping) else {}
        capabilities = raw.get("required_capabilities")
        if isinstance(capabilities, (list, tuple)):
            required = tuple(str(item) for item in capabilities if str(item).strip())
        elif is_event:
            required = self.EVENT_CAPABILITIES
        else:
            required = self._user_capabilities(user_text)
        if capabilities is not None and not isinstance(capabilities, (list, tuple)):
            findings.append("required_capabilities must be a list")
        if not user_text and not is_event:
            findings.append("goal is blank")
        return GoalEvent(
            goal=goal,
            entities=entities,
            constraints=constraints,
            required_capabilities=required,
            source=source,
            raw=raw,
            validation_findings=tuple(findings),
        )

    @staticmethod
    def _user_capabilities(text: str) -> tuple[str, ...]:
        value = str(text or "").lower()
        if any(token in value for token in ("质检", "质量", "零件检测", "inspection")):
            return ("quality_inspection",)
        if any(token in value for token in ("工单", "派工", "维修完成", "重开")):
            return ("workorder_update",)
        if any(token in value for token in ("图纸", "bom", "部件", "装配", "cad")):
            return ("drawing_search",)
        if any(token in value for token in ("报告", "report")):
            return ("case_reporting",)
        if any(token in value for token in ("经验", "手册", "sop", "案例", "知识", "维修")):
            return ("document_search",)
        if any(token in value for token in ("故障", "报警", "诊断", "异常", "fault")):
            return ("fault_analysis",)
        return ("document_search",)


__all__ = ["GoalEvent", "JEVParser"]
