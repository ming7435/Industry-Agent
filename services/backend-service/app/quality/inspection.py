"""Deterministic QMS part inspection at the Backend business boundary."""

from __future__ import annotations

from typing import Any, Mapping


class PartInspectionService:
    def __init__(self) -> None:
        self._parts = {
            "PART-001": {
                "part_id": "PART-001", "part_no": "SPINDLE-HOUSING-001", "part_name": "主轴轴承座",
                "batch_id": "BATCH-20260920-01", "production_order_id": "PO-20260920-001",
                "device_id": "CNC-001", "status": "produced",
                "measurements": {"outer_diameter_mm": 50.01, "inner_diameter_mm": 30.0, "runout_mm": 0.018},
                "appearance": {"scratch": False, "crack": False, "burr": False, "discoloration": False},
                "material": {"grade": "45钢", "hardness_hb": 205},
                "function": {"runout_mm": 0.018, "rotation_test": True},
                "process": {"cycle_complete": True, "traceable": True, "operator_confirmed": True},
                "specifications": {
                    "outer_diameter_mm": {"min": 49.98, "max": 50.02},
                    "inner_diameter_mm": {"min": 29.98, "max": 30.02},
                    "runout_mm": {"min": 0.0, "max": 0.03},
                    "material_grade": "45钢", "hardness_hb": {"min": 190, "max": 220},
                },
            }
        }

    def call(self, operation: str, **arguments: Any) -> dict[str, Any]:
        if operation == "get_production_part":
            supplied = dict(arguments.get("part") or {})
            if supplied.get("part_id") or supplied.get("part_no"):
                return {"success": True, "found": True, "part": supplied, "source": "backend-qms"}
            for item in self._parts.values():
                if any(arguments.get(key) and arguments[key] == item.get(key) for key in ("part_id", "part_no", "batch_id", "production_order_id")):
                    return {"success": True, "found": True, "part": dict(item), "source": "backend-qms"}
            return {"success": False, "found": False, "part": {}, "source": "backend-qms", "error": "生产零件不存在"}
        part = dict(arguments.get("part") or {})
        specifications = dict(arguments.get("specifications") or part.get("specifications") or {})
        if operation == "get_part_specification":
            if not specifications:
                found = self.call("get_production_part", **part).get("part") or {}
                specifications = dict(found.get("specifications") or {})
            return {"success": bool(specifications), "found": bool(specifications), "specifications": specifications, "source": "backend-qms"}
        if operation == "inspect_part_dimensions":
            actual = dict(arguments.get("measurements") or part.get("measurements") or {})
            items = []
            for key, rule in specifications.items():
                if isinstance(rule, Mapping) and key.endswith("_mm"):
                    value = _number(actual.get(key))
                    passed = value is not None and _in_range(value, rule)
                    items.append({"item": key, "actual": value, "min": _number(rule.get("min")), "max": _number(rule.get("max")), "passed": passed})
            defects = [{"type": "dimension", **item} for item in items if not item["passed"]]
            return _inspection(bool(items) and not defects, items, defects)
        if operation == "inspect_part_appearance":
            appearance = dict(part.get("appearance") or {})
            defects = [{"type": "appearance", "item": key, "message": "发现外观缺陷"} for key in ("scratch", "crack", "burr", "discoloration", "deformation") if appearance.get(key)]
            return _inspection(not defects, appearance, defects)
        if operation == "inspect_part_material":
            material = dict(part.get("material") or {})
            defects = []
            expected = specifications.get("material_grade")
            if expected and material.get("grade") != expected:
                defects.append({"type": "material", "item": "material_grade", "expected": expected, "actual": material.get("grade")})
            hardness_rule = specifications.get("hardness_hb")
            if isinstance(hardness_rule, Mapping) and not _in_range(_number(material.get("hardness_hb")), hardness_rule):
                defects.append({"type": "material", "item": "hardness_hb", "expected": dict(hardness_rule), "actual": _number(material.get("hardness_hb"))})
            return _inspection(not defects, material, defects)
        if operation == "inspect_part_function":
            function = dict(part.get("function") or {})
            defects = []
            rule = specifications.get("runout_mm")
            if isinstance(rule, Mapping) and not _in_range(_number(function.get("runout_mm")), rule):
                defects.append({"type": "function", "item": "runout_mm", "expected": dict(rule), "actual": _number(function.get("runout_mm"))})
            if function.get("rotation_test") is False:
                defects.append({"type": "function", "item": "rotation_test", "message": "旋转功能测试未通过"})
            return _inspection(not defects, function, defects)
        if operation == "inspect_part_process":
            process = dict(part.get("process") or {})
            defects = [{"type": "process", "item": key, "message": "生产过程记录不完整"} for key in ("cycle_complete", "traceable", "operator_confirmed") if process.get(key) is not True]
            return _inspection(not defects, process, defects)
        raise KeyError("未知 QMS 工具：%s" % operation)


def _number(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def _in_range(value: float | None, rule: Mapping[str, Any]) -> bool:
    if value is None:
        return False
    minimum = _number(rule.get("min"))
    maximum = _number(rule.get("max"))
    return (minimum is None or value >= minimum) and (maximum is None or value <= maximum)


def _inspection(passed: bool, items: Any, defects: list[dict[str, Any]]) -> dict[str, Any]:
    return {"success": True, "passed": passed, "items": items, "defects": defects, "source": "backend-qms"}
