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
            ("dimension_not_qualified", "尺寸检测", dimension_check),
            ("appearance_not_qualified", "外观检测", appearance_check),
            ("material_not_qualified", "材料检测", material_check),
            ("function_not_qualified", "功能检测", function_check),
            ("process_not_qualified", "工艺追溯检测", process_check),
        ]
        failed: list[str] = []
        findings: list[str] = []
        defects: list[dict[str, Any]] = []
        inspection_items: list[dict[str, Any]] = []
        for code, label, result in check_definitions:
            payload = dict(result or {})
            passed = bool(payload.get("passed"))
            inspection_items.append({"name": label, "passed": passed, "source": payload.get("source", "qms-mcp")})
            defects.extend(list(payload.get("defects") or []))
            if passed:
                findings.append("%s通过" % label)
            else:
                failed.append(code)
                findings.append("%s未通过" % label)

        passed = not failed and bool(part.get("part_id") or part.get("part_no"))
        if not part.get("part_id") and not part.get("part_no"):
            failed.append("part_identity_missing")
            findings.append("缺少生产零件编号，无法形成可追溯质检结果")
        checks = [
            {"name": item[1], "passed": bool((result or {}).get("passed"))}
            for item in check_definitions
            for result in [item[2]]
        ]
        return {
            "inspection_type": "part_quality",
            "passed": passed,
            "qualified": passed,
            "status": "pass" if passed else "fail",
            "quality_grade": "合格" if passed else "不合格",
            "failed_checks": cls._dedupe(failed),
            "findings": cls._dedupe(findings),
            "inspection_items": inspection_items,
            "specifications": dict(specification or {}),
            "defects": defects,
            "validation": {
                "passed": passed,
                "checks": {
                    "input": bool(part.get("part_id") or part.get("part_no")),
                    "evidence": all(item["passed"] for item in checks),
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
