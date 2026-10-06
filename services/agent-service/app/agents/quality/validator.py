"""生产零件质量检测的确定性校验规则。"""

from __future__ import annotations

from typing import Any, Mapping


class QualityValidator:
    """按生产零件的五类质量门禁形成确定性 PASS/FAIL。"""

    @classmethod
    def validate_part(
        cls,
        part: Mapping[str, Any],
        specification: Mapping[str, Any],
        dimension_check: Mapping[str, Any],
        appearance_check: Mapping[str, Any],
        material_check: Mapping[str, Any],
        function_check: Mapping[str, Any],
        process_check: Mapping[str, Any],
    ) -> dict[str, Any]:
        check_definitions = [
            ("dimension_not_qualified", "尺寸检测", dimension_check or {}),
            ("appearance_not_qualified", "外观检测", appearance_check or {}),
            ("material_not_qualified", "材料检测", material_check or {}),
            ("function_not_qualified", "功能检测", function_check or {}),
            ("process_not_qualified", "工艺追溯检测", process_check or {}),
        ]
        failed: list[str] = []
        findings: list[str] = []
        defects: list[dict[str, Any]] = []
        inspection_items: list[dict[str, Any]] = []
        if not specification:
            failed.append("specification_missing")
            findings.append("缺少生产零件检验规格，不能判定质量合格")
        for code, label, result in check_definitions:
            payload = dict(result or {})
            passed = payload.get("passed") is True
            sufficient_data = payload.get("sufficient_data") is True and str(payload.get("status") or "").lower() not in {"not_tested", "pending", "insufficient_data"}
            trusted = payload.get("synthetic") is not True and payload.get("degraded") is not True
            item_passed = passed and sufficient_data and trusted
            inspection_items.append({"name": label, "passed": item_passed, "source": payload.get("source", "qms-mcp"), "status": payload.get("status", ""), "evidence_status": "trusted" if trusted else "untrusted"})
            defects.extend(list(payload.get("defects") or []))
            if item_passed:
                findings.append("%s通过" % label)
            else:
                failed.append(code)
                findings.append("%s未通过、缺少数据或检测证据不可信" % label)

        passed = not failed and bool(part.get("part_id") or part.get("part_no"))
        if not part.get("part_id") and not part.get("part_no"):
            failed.append("part_identity_missing")
            findings.append("缺少生产零件编号，无法形成可追溯质检结果")
        checks = [
            {"name": item[1], "passed": (result or {}).get("passed") is True and (result or {}).get("sufficient_data") is True and (result or {}).get("synthetic") is not True and (result or {}).get("degraded") is not True}
            for item in check_definitions
            for result in [item[2]]
        ]
        if passed:
            status = "pass"
        elif any(
            result.get("passed") is False
            and result.get("sufficient_data") is True
            and str(result.get("status") or "").lower() == "fail"
            and result.get("synthetic") is not True
            and result.get("degraded") is not True
            for _, _, result in check_definitions
        ):
            status = "fail"
        elif not specification or not (part.get("part_id") or part.get("part_no")) or any(
            result.get("sufficient_data") is not True
            or str(result.get("status") or "").lower() in {"not_tested", "pending", "insufficient_data"}
            for _, _, result in check_definitions
        ):
            status = "not_tested"
        else:
            status = "review"
        return {
            "inspection_type": "part_quality",
            "passed": passed,
            "qualified": passed,
            "status": status,
            "quality_grade": {"pass": "合格", "fail": "不合格", "not_tested": "未检测", "review": "待复核"}[status],
            "failed_checks": cls._dedupe(failed),
            "findings": cls._dedupe(findings),
            "inspection_items": inspection_items,
            "specifications": dict(specification or {}),
            "defects": defects,
            "validation": {
                "passed": passed,
                "checks": {
                    "input": bool(part.get("part_id") or part.get("part_no")),
                    "evidence": all(item["passed"] for item in checks) and bool(specification),
                    "confidence": True,
                    "consistency": all(item["passed"] for item in checks),
                    "safety": True,
                    "schema": True,
                },
                "findings": cls._dedupe(findings),
                "missing": list(failed),
                "recommended_action": {"type": "continue" if passed else "wait", "target": "release_part" if passed else "hold_part_and_review"},
            },
        }

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values
