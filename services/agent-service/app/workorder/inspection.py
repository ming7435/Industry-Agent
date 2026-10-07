"""Fixed, non-invasive scope for warning inspection work orders."""

from __future__ import annotations

from typing import Any, Mapping


_PROCEDURES = {
    "repair_steps": (
        "只读核对设备当前报警码、报警时间和运行状态。",
        "在安全观察位置检查设备外观和可见状态，不打开防护或接触运动部件。",
        "记录观察结果与现场照片，核对预警是否仍然存在。",
        "上报检查结果；发现需拆修的问题时另行生成经工程证据校验的维修方案。",
    ),
    "pre_checks": ("确认设备身份与预警事件一致，按现场安全规程确认可以安全观察。",),
    "post_checks": ("提交报警与观察记录，不执行报警复位或设备控制。",),
    "safety": ("仅作只读核查和外观观察，禁止拆装、更换、接线及设备启停或运动操作。",),
    "safety_requirements": ("仅作只读核查和外观观察，禁止拆装、更换、接线及设备启停或运动操作。",),
}


def inspection_plan_template() -> dict[str, Any]:
    """Return a fresh fixed inspection scope, without diagnosis or readiness claims."""

    return {
        "plan_kind": "inspection", "inspection_required": True,
        "maintenance_required": False, "cad_required": False,
        "repair_target": "设备预警现场检查",
        **{key: list(values) for key, values in _PROCEDURES.items()},
        "tools": [], "required_tools": [], "parts": [], "required_parts": [],
        "cad_components": [], "inventory_status": {}, "part_availability": {},
        "target_part": {"part_no": "", "part_name": "", "component": ""},
    }


def inspection_plan_findings(plan: Mapping[str, Any]) -> list[str]:
    """Check the full scope rather than trusting an inspection label or CAD flag."""

    findings: list[str] = []
    if plan.get("plan_kind") != "inspection" or plan.get("inspection_required") is not True:
        findings.append("检查方案类型或检查必要性未明确")
    if plan.get("maintenance_required") is not False or plan.get("cad_required") is not False:
        findings.append("检查方案不能包含维修或工程拆修要求")
    if not str(plan.get("repair_target") or "").strip():
        findings.append("检查对象不明确")
    for key, expected in _PROCEDURES.items():
        values = plan.get(key)
        if not isinstance(values, (list, tuple)) or tuple(values) != expected:
            findings.append("检查方案%s超出固定只读核查范围" % key)
    for key in ("tools", "required_tools", "parts", "required_parts", "cad_components", "inventory_status", "part_availability"):
        if plan.get(key):
            findings.append("检查方案不得包含工具、备件、库存或工程部件：%s" % key)
    target = plan.get("target_part")
    if target and (not isinstance(target, Mapping) or any(target.values())):
        findings.append("检查方案不得指定维修零件")
    # The persisted workorder draft is another executable step source.
    draft = plan.get("workorder_draft")
    if isinstance(draft, Mapping):
        for key in ("steps", "repair_steps"):
            if draft.get(key) and draft.get(key) != list(_PROCEDURES["repair_steps"]):
                findings.append("检查工单草稿步骤超出固定只读核查范围")
    return findings


__all__ = ["inspection_plan_template", "inspection_plan_findings"]
