"""QMS 生产零件质检的本地适配器。

生产环境可由 ``MCP_QMS_URL`` 接入真实 QMS；本地适配器提供稳定的演示数据，
让 Quality Agent 在没有外部系统时仍能完整跑通零件质检闭环。
"""

from __future__ import annotations

from typing import Any, Dict, Mapping


class QualityMcpAdapter:
    """提供生产零件、质量规格和检测结果查询。"""

    def __init__(self) -> None:
        self._parts: Dict[str, Dict[str, Any]] = {
            "PART-001": {
                "part_id": "PART-001",
                "part_no": "SPINDLE-HOUSING-001",
                "part_name": "主轴轴承座",
                "batch_id": "BATCH-20260920-01",
                "production_order_id": "PO-20260920-001",
                "device_id": "CNC-001",
                "status": "produced",
                "measurements": {
                    "outer_diameter_mm": 50.01,
                    "inner_diameter_mm": 30.00,
                    "runout_mm": 0.018,
                },
                "appearance": {"scratch": False, "crack": False, "burr": False, "discoloration": False},
                "material": {"grade": "45钢", "hardness_hb": 205},
                "function": {"runout_mm": 0.018, "rotation_test": True},
                "process": {"cycle_complete": True, "traceable": True, "operator_confirmed": True},
                "specifications": {
                    "outer_diameter_mm": {"min": 49.98, "max": 50.02},
                    "inner_diameter_mm": {"min": 29.98, "max": 30.02},
                    "runout_mm": {"min": 0.0, "max": 0.03},
                    "material_grade": "45钢",
                    "hardness_hb": {"min": 190, "max": 220},
                },
            }
        }

    def get_production_part(
        self,
        part_id: str = "",
        part_no: str = "",
        batch_id: str = "",
        production_order_id: str = "",
        part: Mapping[str, Any] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        supplied = dict(part or {})
        if supplied and (supplied.get("part_id") or supplied.get("part_no")):
            return {"found": True, "success": True, "part": supplied, "source": "qms-mcp"}
        for item in self._parts.values():
            if part_id and item["part_id"] == part_id:
                return {"found": True, "success": True, "part": dict(item), "source": "qms-mcp"}
            if part_no and item["part_no"] == part_no:
                return {"found": True, "success": True, "part": dict(item), "source": "qms-mcp"}
            if batch_id and item["batch_id"] == batch_id:
                return {"found": True, "success": True, "part": dict(item), "source": "qms-mcp"}
            if production_order_id and item["production_order_id"] == production_order_id:
                return {"found": True, "success": True, "part": dict(item), "source": "qms-mcp"}
        return {"found": False, "success": False, "part": {}, "source": "qms-mcp", "error": "生产零件不存在"}

    def get_part_specification(self, part: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        record = dict(part or {})
        specifications = dict(record.get("specifications") or {})
        if not specifications:
            lookup = self.get_production_part(part_id=str(record.get("part_id") or ""), part_no=str(record.get("part_no") or ""))
            specifications = dict((lookup.get("part") or {}).get("specifications") or {})
        return {"success": bool(specifications), "found": bool(specifications), "specifications": specifications, "source": "qms-mcp"}

    def inspect_part_dimensions(
        self,
        part: Mapping[str, Any] | None = None,
        measurements: Mapping[str, Any] | None = None,
        specifications: Mapping[str, Any] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        record = dict(part or {})
        actual = dict(measurements or record.get("measurements") or {})
        specs = dict(specifications or record.get("specifications") or {})
        items: list[dict[str, Any]] = []
        defects: list[dict[str, Any]] = []
        for key, rule in specs.items():
            if not isinstance(rule, Mapping) or not key.endswith("_mm"):
                continue
            value = _number(actual.get(key))
            minimum = _number(rule.get("min"))
            maximum = _number(rule.get("max"))
            passed = value is not None and (minimum is None or value >= minimum) and (maximum is None or value <= maximum)
            item = {"item": key, "actual": value, "min": minimum, "max": maximum, "passed": passed}
            items.append(item)
            if not passed:
                defects.append({"type": "dimension", **item})
        passed = bool(items) and not defects
        return {"success": True, "passed": passed, "items": items, "defects": defects, "source": "qms-mcp"}

    def inspect_part_appearance(self, part: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        appearance = dict((part or {}).get("appearance") or {})
        defect_keys = [key for key in ("scratch", "crack", "burr", "discoloration", "deformation") if appearance.get(key)]
        defects = [{"type": "appearance", "item": key, "message": "发现外观缺陷"} for key in defect_keys]
        return {"success": True, "passed": not defect_keys, "items": appearance, "defects": defects, "source": "qms-mcp"}

    def inspect_part_material(self, part: Mapping[str, Any] | None = None, specifications: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        record = dict(part or {})
        material = dict(record.get("material") or {})
        specs = dict(specifications or record.get("specifications") or {})
        expected = specs.get("material_grade")
        actual = material.get("grade")
        grade_passed = not expected or actual == expected
        hardness_rule = specs.get("hardness_hb") if isinstance(specs.get("hardness_hb"), Mapping) else {}
        hardness = _number(material.get("hardness_hb"))
        hardness_passed = not hardness_rule or (hardness is not None and _in_range(hardness, hardness_rule))
        defects = []
        if not grade_passed:
            defects.append({"type": "material", "item": "material_grade", "expected": expected, "actual": actual})
        if not hardness_passed:
            defects.append({"type": "material", "item": "hardness_hb", "expected": dict(hardness_rule), "actual": hardness})
        return {"success": True, "passed": grade_passed and hardness_passed, "items": material, "defects": defects, "source": "qms-mcp"}

    def inspect_part_function(self, part: Mapping[str, Any] | None = None, specifications: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        record = dict(part or {})
        function = dict(record.get("function") or {})
        specs = dict(specifications or record.get("specifications") or {})
        runout = _number(function.get("runout_mm"))
        rule = specs.get("runout_mm") if isinstance(specs.get("runout_mm"), Mapping) else {}
        runout_passed = not rule or (runout is not None and _in_range(runout, rule))
        rotation_passed = function.get("rotation_test") is not False
        defects = []
        if not runout_passed:
            defects.append({"type": "function", "item": "runout_mm", "expected": dict(rule), "actual": runout})
        if not rotation_passed:
            defects.append({"type": "function", "item": "rotation_test", "message": "旋转功能测试未通过"})
        return {"success": True, "passed": runout_passed and rotation_passed, "items": function, "defects": defects, "source": "qms-mcp"}

    def inspect_part_process(self, part: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        process = dict((part or {}).get("process") or {})
        required = ("cycle_complete", "traceable", "operator_confirmed")
        defects = [{"type": "process", "item": key, "message": "生产过程记录不完整"} for key in required if process.get(key) is not True]
        return {"success": True, "passed": not defects, "items": process, "defects": defects, "source": "qms-mcp"}


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
