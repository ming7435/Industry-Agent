"""后端业务边界内的确定性 QMS 零件质检。"""

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
                "source": "backend-local-fixture", "synthetic": True, "degraded": True,
            }
        }

    def call(self, operation: str, **arguments: Any) -> dict[str, Any]:
        if operation == "get_production_part":
            supplied = dict(arguments.get("part") or {})
            identifiers = {
                key: supplied.get(key) or arguments.get(key)
                for key in ("part_id", "part_no", "batch_id", "production_order_id")
            }
            for item in self._parts.values():
                if any(value and value == item.get(key) for key, value in identifiers.items()):
                    return {"success": True, "found": True, "part": dict(item), "source": "backend-local-fixture", "synthetic": True, "degraded": True, "identity_verified": True}
            return {"success": False, "found": False, "part": {}, "source": "backend-local-fixture", "synthetic": True, "degraded": True, "error": "生产零件不存在"}
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
            required = ("scratch", "crack", "burr", "discoloration", "deformation")
            missing = [key for key in required if key not in appearance]
            defects = [{"type": "appearance", "item": key, "message": "发现外观缺陷"} for key in required if appearance.get(key)]
            defects.extend({"type": "appearance", "item": key, "message": "缺少外观检测数据"} for key in missing)
            return _inspection(not defects and not missing, appearance, defects, sufficient_data=bool(appearance) and not missing)
        if operation == "inspect_part_material":
            material = dict(part.get("material") or {})
            defects = []
            expected = specifications.get("material_grade")
            if expected and material.get("grade") != expected:
                defects.append({"type": "material", "item": "material_grade", "expected": expected, "actual": material.get("grade")})
            hardness_rule = specifications.get("hardness_hb")
            if isinstance(hardness_rule, Mapping) and not _in_range(_number(material.get("hardness_hb")), hardness_rule):
                defects.append({"type": "material", "item": "hardness_hb", "expected": dict(hardness_rule), "actual": _number(material.get("hardness_hb"))})
            required_data = bool(expected or hardness_rule) and (not expected or material.get("grade") not in (None, "")) and (not hardness_rule or material.get("hardness_hb") is not None)
            return _inspection(required_data and not defects, material, defects, sufficient_data=required_data)
        if operation == "inspect_part_function":
            function = dict(part.get("function") or {})
            defects = []
            rule = specifications.get("runout_mm")
            if isinstance(rule, Mapping) and not _in_range(_number(function.get("runout_mm")), rule):
                defects.append({"type": "function", "item": "runout_mm", "expected": dict(rule), "actual": _number(function.get("runout_mm"))})
            if function.get("rotation_test") is False:
                defects.append({"type": "function", "item": "rotation_test", "message": "旋转功能测试未通过"})
            required_data = isinstance(rule, Mapping) and bool(rule) and function.get("runout_mm") is not None and "rotation_test" in function
            return _inspection(required_data and not defects, function, defects, sufficient_data=required_data)
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


def _inspection(passed: bool, items: Any, defects: list[dict[str, Any]], *, sufficient_data: bool | None = None) -> dict[str, Any]:
    # 空输入不是合格：质检必须区分“通过、失败、未检测”，否则缺少测量数据会被误报为通过。
    if sufficient_data is None:
        sufficient_data = bool(items)
    status = "pass" if sufficient_data and passed else ("fail" if sufficient_data else "not_tested")
    return {
        "success": True,
        "passed": status == "pass",
        "qualified": status == "pass",
        "status": status,
        "sufficient_data": sufficient_data,
        "items": items,
        "defects": defects,
        "source": "backend-qms",
    }
