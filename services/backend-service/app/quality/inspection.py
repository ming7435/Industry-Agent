"""后端业务边界内的确定性 QMS 零件质检。"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from copy import deepcopy
from typing import Any, Mapping


class PartInspectionService:
    def __init__(self, repository=None) -> None:
        self.repository = repository
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
        if operation == 'register_production_part':
            if self.repository is None:
                raise ValueError('正式质检数据存储未配置')
            supplied = deepcopy(dict(arguments.get('part') or {}))
            operator = str(arguments.get('operator') or '').strip()
            if not operator or not str(supplied.get('part_id') or '').strip():
                raise ValueError('录入必须有登录人员和零件编号')
            # 保存原始观测和设计规格，不接受用户宣称 passed 或 identity_verified。
            allowed = ('part_id', 'part_no', 'part_name', 'batch_id', 'production_order_id', 'device_id',
                       'measurements', 'specifications', 'appearance', 'material', 'function', 'process')
            item = {key: supplied[key] for key in allowed if key in supplied}
            for key in ('measurements', 'specifications', 'appearance', 'material', 'function', 'process'):
                if not isinstance(item.get(key, {}), Mapping):
                    raise ValueError('%s 必须是检测数据对象' % key)
            item.update(source='manual-inspection', synthetic=False, degraded=False, recorded_by=operator,
                        recorded_at=datetime.now(timezone.utc).isoformat())
            self.repository.save_record('production_part', str(item['part_id']), item)
            return {'success': True, 'part': item, 'source': 'manual-inspection'}
        if operation == "get_production_part":
            supplied = dict(arguments.get("part") or {})
            identifiers = {
                key: supplied.get(key) or arguments.get(key)
                for key in ("part_id", "part_no", "batch_id", "production_order_id", "device_id")
            }
            if self.repository is not None:
                candidates = ([self.repository.get_record('production_part', str(identifiers['part_id']))]
                              if identifiers.get('part_id') else self.repository.list_records('production_part'))
                for item in candidates:
                    if item and any(identifiers.values()) and all(not value or value == item.get(key) for key, value in identifiers.items()):
                        return {'success': True, 'found': True, 'part': deepcopy(item), 'identity_verified': True,
                                'source': item.get('source'), 'synthetic': item.get('synthetic', False), 'degraded': item.get('degraded', False)}
                return {'success': False, 'found': False, 'part': {}, 'source': 'backend-qms',
                        'error': '未找到匹配的正式零件记录，请先录入该零件实测数据与设计规格'}
            for item in self._parts.values():
                if any(identifiers.values()) and all(not value or value == item.get(key) for key, value in identifiers.items()):
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
                if key.endswith("_mm"):
                    value = _number(actual.get(key))
                    minimum = _number(rule.get("min")) if isinstance(rule,Mapping) else None
                    maximum = _number(rule.get("max")) if isinstance(rule,Mapping) else None
                    has_bound = _valid_rule(rule)
                    passed = value is not None and has_bound and _in_range(value, rule)
                    items.append({"item": key, "actual": value, "min": minimum, "max": maximum, "passed": passed, "sufficient_data": value is not None and has_bound})
            defects = [{"type": "dimension", **item} for item in items if not item["passed"]]
            sufficient_data = bool(items) and all(item["sufficient_data"] for item in items)
            return _inspection(sufficient_data and not defects, items, defects, sufficient_data=sufficient_data)
        if operation == "inspect_part_appearance":
            appearance = dict(part.get("appearance") or {})
            required = ("scratch", "crack", "burr", "discoloration", "deformation")
            invalid = [key for key in required if type(appearance.get(key)) is not bool]
            defects = [{"type": "appearance", "item": key, "message": "发现外观缺陷"} for key in required if appearance.get(key) is True]
            defects.extend({"type": "appearance", "item": key, "message": "外观检测值必须是布尔值"} for key in invalid)
            sufficient_data = not invalid
            return _inspection(sufficient_data and not defects, appearance, defects, sufficient_data=sufficient_data)
        if operation == "inspect_part_material":
            material = dict(part.get("material") or {})
            defects = []
            expected = specifications.get("material_grade")
            if expected and material.get("grade") != expected:
                defects.append({"type": "material", "item": "material_grade", "expected": expected, "actual": material.get("grade")})
            hardness_rule = specifications.get("hardness_hb")
            if isinstance(hardness_rule, Mapping) and not _in_range(_number(material.get("hardness_hb")), hardness_rule):
                defects.append({"type": "material", "item": "hardness_hb", "expected": dict(hardness_rule), "actual": _number(material.get("hardness_hb"))})
            grade_declared = 'material_grade' in specifications
            hardness_declared = 'hardness_hb' in specifications
            grade_valid = isinstance(expected,str) and bool(expected.strip()) and isinstance(material.get('grade'),str) and bool(material['grade'].strip())
            hardness_valid = _valid_rule(hardness_rule) and _number(material.get('hardness_hb')) is not None
            required_data = (grade_declared or hardness_declared) and (not grade_declared or grade_valid) and (not hardness_declared or hardness_valid)
            if not required_data:
                defects.append({'type':'material','message':'材料规格或实测数据缺失、格式无效，不能判定合格'})
            return _inspection(required_data and not defects, material, defects, sufficient_data=required_data)
        if operation == "inspect_part_function":
            function = dict(part.get("function") or {})
            defects = []
            rule = specifications.get("runout_mm")
            runout = _number(function.get("runout_mm"))
            rule_valid = _valid_rule(rule)
            if rule_valid and not _in_range(runout, rule):
                defects.append({"type": "function", "item": "runout_mm", "expected": dict(rule), "actual": _number(function.get("runout_mm"))})
            if type(function.get("rotation_test")) is bool and function.get("rotation_test") is False:
                defects.append({"type": "function", "item": "rotation_test", "message": "旋转功能测试未通过"})
            required_data = rule_valid and runout is not None and type(function.get("rotation_test")) is bool
            if not rule_valid:
                defects.append({"type": "function", "item": "runout_mm", "message": "缺少有效的功能规格"})
            if type(function.get("rotation_test")) is not bool:
                defects.append({"type": "function", "item": "rotation_test", "message": "旋转功能测试必须明确为布尔值"})
            return _inspection(required_data and not defects, function, defects, sufficient_data=required_data)
        if operation == "inspect_part_process":
            process = dict(part.get("process") or {})
            defects = [{"type": "process", "item": key, "message": "生产过程记录不完整"} for key in ("cycle_complete", "traceable", "operator_confirmed") if process.get(key) is not True]
            return _inspection(not defects, process, defects, sufficient_data=all(type(process.get(key)) is bool for key in ('cycle_complete', 'traceable', 'operator_confirmed')))
        raise KeyError("未知 QMS 工具：%s" % operation)


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        number = None if value is None else float(value)
        return number if number is not None and math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def _valid_rule(rule: Any) -> bool:
    if not isinstance(rule,Mapping):
        return False
    bounds = [key for key in ('min','max') if key in rule]
    if not bounds or any(_number(rule[key]) is None for key in bounds):
        return False
    return not ('min' in rule and 'max' in rule) or _number(rule['min']) <= _number(rule['max'])


def _in_range(value: float | None, rule: Mapping[str, Any]) -> bool:
    if value is None or not _valid_rule(rule):
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
