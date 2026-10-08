"""报告文件工具：将结构化报告导出为 JSON 或 PDF 文件。"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Mapping

_DEFAULT_REPORT_FILE_DIR = ".runtime/report-files"
_SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")
_SECTION_LABELS = {
    "lifecycle": "停机到复机",
    "diagnosis": "诊断结果",
    "diagnosis_result": "诊断结果",
    "maintenance_plan": "维修方案",
    "maintenance": "维修方案",
    "workorder": "工单执行",
    "work_order": "工单执行",
    "repair_feedback": "维修反馈",
    "repair_verification": "维修复核",
    "repair_result": "维修结果",
    "quality": "质检结果",
    "quality_result": "质检结果",
    "knowledge": "知识依据",
    "event": "故障事件",
    "trace_summary": "运行记录",
}
_FIELD_LABELS = {
    "cycle_id": "停机处理编号",
    "started_at": "故障停机开始",
    "stopped_at": "停机确认时间",
    "restarted_at": "复机核验通过时间",
    "duration_seconds": "停机处理时长（秒）",
    "device_ids": "整线设备",
    "event_ids": "故障事件",
    "records": "关联业务记录",
    "inspection_verification": "工单检查核验",
    "generation": "产线控制版本",
    "claimed_at": "故障登记时间",
    "faults": "停机事件",
    "reason": "核验说明",
    "resolved": "故障已处理",
    "report_id": "报告编号",
    "report_type": "报告类型",
    "title": "报告标题",
    "summary": "摘要",
    "status": "状态",
    "created_at": "生成时间",
    "updated_at": "更新时间",
    "persisted_at": "持久化时间",
    "device_id": "设备编号",
    "device_model": "设备型号",
    "alarm_code": "报警代码",
    "alarm_message": "报警信息",
    "event_id": "事件编号",
    "event_type": "事件类型",
    "component": "故障部件",
    "part_no": "零件编号",
    "part_name": "零件名称",
    "fault": "故障结论",
    "diagnosis": "诊断结论",
    "confidence": "置信度",
    "recommendation": "处理建议",
    "repair_target": "维修对象",
    "target_part": "目标部件",
    "repair_steps": "维修步骤",
    "steps": "步骤",
    "checks": "检查项目",
    "tools": "工具",
    "required_tools": "所需工具",
    "parts": "备件",
    "required_parts": "所需备件",
    "safety": "安全要求",
    "safety_requirements": "安全要求",
    "pre_checks": "维修前检查",
    "post_checks": "维修后检查",
    "estimated_time": "预计用时",
    "estimated_duration": "预计时长",
    "risk_level": "风险等级",
    "workorder_id": "工单编号",
    "priority": "优先级",
    "assignee": "负责人",
    "team": "处理班组",
    "workorder": "工单内容",
    "dispatch_context": "派发信息",
    "stop_reason": "结束原因",
    "repair_result": "维修结果",
    "feedback": "执行反馈",
    "verification": "复核结果",
    "passed": "是否通过",
    "qualified": "是否合格",
    "quality_grade": "质量等级",
    "inspection_type": "检测类型",
    "part_id": "零件编号",
    "batch_id": "批次编号",
    "production_order_id": "生产订单",
    "findings": "发现项",
    "defects": "缺陷项",
    "failed_checks": "未通过检查",
    "query": "检索问题",
    "query_type": "检索类型",
    "total": "证据数量",
    "possible_causes": "可能原因",
    "recommended_checks": "建议检查",
    "source": "数据来源",
    "sources": "来源列表",
    "documents": "参考文档",
    "backend_status": "后端状态",
    "degraded": "是否降级",
    "error": "错误信息",
    "tool": "调用工具",
    "found": "是否找到",
    "success": "是否成功",
    "active_skill": "使用技能",
    "record_count": "记录数量",
    "step": "步骤",
    "index": "序号",
    "action": "操作",
    "plan_id": "方案编号",
    "validation_findings": "校验问题",
    "document": "文档",
    "page": "页码",
    "content": "内容",
    "cad_drawing": "CAD 图纸",
    "cad_components": "CAD 部件",
    "trigger": "触发条件",
    "reference": "参考",
    "warning": "提示",
    "quality_check_id": "质检编号",
    "target_type": "检测对象类型",
    "target_id": "检测对象编号",
    "task_id": "任务编号",
    "trace_id": "运行日志编号",
    "measurements": "实测数据",
    "specifications": "检验规格",
    "quality_validation": "五项检测明细",
    "score": "检测评分",
    "result": "检测结论",
    "reviewer": "检测人员",
    "reinspection": "复检记录",
    "reinspection_check_id": "复检依据编号",
    "checked_at": "检测时间",
    "type_counts": "事件类型统计",
    "names": "调用名称统计",
    "dimensions": "尺寸检测",
    "appearance": "外观检测",
    "material": "材料检测",
    "function": "功能检测",
    "process": "工艺检测",
    "diameter_mm": "直径（毫米）",
    "length_mm": "长度（毫米）",
    "runout_mm": "跳动（毫米）",
    "material_grade": "材料牌号",
    "hardness_hb": "布氏硬度",
    "sufficient_data": "检测数据是否充分",
    "actual": "实测值",
    "min": "下限",
    "max": "上限",
    "item": "检测项目",
}
_VALUE_LABELS = {
    "completed": "已完成",
    "incomplete": "待补充",
    "error": "生成失败",
    "in_progress": "处理中",
    "open": "待处理",
    "closed": "已关闭",
    "pass": "通过",
    "fail": "未通过",
    "review": "待复核",
    "normal": "普通",
    "low": "低",
    "medium": "中",
    "high": "高",
    "true": "是",
    "false": "否",
    "quality_report": "质量检测报告",
    "diagnosis_report": "故障诊断报告",
    "maintenance_report": "维修方案报告",
    "incident_report": "故障事件报告",
    "full_case_report": "完整故障案例报告",
    "daily": "日常运维报告",
    "alarm": "报警",
    "event": "事件",
    "monitor": "监控中心",
    "connected": "已连接",
    "backend-service": "后端服务",
    "remote-rag-service": "远程知识库",
    "model-service": "模型服务",
    "get_diagnosis_record": "获取诊断记录",
    "get_maintenance_record": "获取维修方案",
    "get_quality_record": "获取质检记录",
    "search_knowledge": "检索知识库",
    "trace": "运行日志",
    "create": "创建",
    "update": "更新",
    "delete": "删除",
    "dispatch": "派发",
    "cad_drawing": "CAD 图纸",
    "evidence_ready": "证据已就绪",
    "validator_pass": "校验通过",
    "validation_failed": "校验未通过",
    "not_tested": "未检测",
    "insufficient_data": "数据不足",
    "passed": "通过",
    "failed": "未通过",
    "released": "已放行",
    "rectification": "整改中",
    "reinspection": "复检阶段",
    "part_quality": "生产零件质量检测",
    "production_part": "生产零件",
    "manual-inspection": "人工实测录入",
    "pending": "待处理",
}
_PDF_SKIP_FIELDS = {
    "evidence",
    "evidence_records",
    "documents",
    "sources",
    "retrieval_trace",
    "memory_evidence",
    "source_documents",
    "cad_components",
    "items",
    "candidates",
    "dispatch_context",
    "workorder",
    "payload",
    "filters",
    "confidence_details",
    "required_capabilities",
    "realtime_snapshot",
    "abnormal_metrics",
    "engineering_context",
    "inventory_status",
    "part_availability",
    "recommended_checks",
}


def _safe_report_id(report_id: Any) -> str:
    """把报告编号转换为可安全用于文件名的字符串。"""

    value = _SAFE_FILENAME.sub("-", str(report_id or "report").strip()).strip(".-")
    return value or "report"


def get_report_file_path(report_id: Any, format: str = "pdf") -> Path:
    """返回报告文件的稳定路径，便于生成、预览和下载共用同一个文件。"""

    directory = Path(os.getenv("REPORT_FILE_DIR", _DEFAULT_REPORT_FILE_DIR)).expanduser()
    extension = str(format or "pdf").lower().lstrip(".")
    return directory / f"report-{_safe_report_id(report_id)}.{extension}"


def _find_font() -> str:
    """读取可选字体路径；未配置时使用 PDF 内置中文字体，避免文件膨胀。"""

    configured = os.getenv("REPORT_PDF_FONT_PATH", "").strip()
    return configured if configured and Path(configured).is_file() else ""


def _display_key(key: Any) -> str:
    """将结构化报告字段转换为中文显示名称。"""

    value = str(key or "")
    return _FIELD_LABELS.get(value, value.replace("_", " "))


def _lifecycle_pdf_sections(sections):
    """统一报告按全部业务记录输出，避免首张工单快照挤掉后续记录。"""
    lifecycle = sections['lifecycle']
    result = {'lifecycle': {key: lifecycle[key] for key in (
        'cycle_id', 'started_at', 'stopped_at', 'restarted_at', 'duration_seconds', 'device_ids', 'event_ids', 'reason'
    ) if key in lifecycle}}
    fields = {
        'diagnosis': ('device_id', 'event_id', 'fault', 'summary', 'confidence', 'possible_causes', 'recommended_checks'),
        'maintenance_plan': ('plan_id', 'workorder_id', 'plan_kind', 'repair_target', 'repair_steps', 'safety_requirements'),
        'workorder': ('workorder_id', 'device_id', 'status', 'assignee_name', 'assignee', 'created_at', 'updated_at',
                      'repair_feedback', 'inspection_verification', 'repair_verification'),
        'quality': ('quality_check_id', 'workorder_id', 'device_id', 'part_id', 'part_no', 'batch_id', 'result', 'status',
                    'created_at', 'findings', 'quality_validation', 'reinspection'),
    }
    for name, keys in fields.items():
        records = (sections.get(name) or {}).get('records') or []
        result[name] = [{key: record[key] for key in keys if key in record} for record in records] or {'summary': '未关联记录'}
        if name == 'diagnosis' and records:
            for record, display in zip(records, result[name]):
                event = re.match(r'^EVT-(\d{8})-(\d{6})-\d{3}-\d+$', str(record.get('event_id') or ''))
                stamp = record.get('event_timestamp')
                if not stamp and event:
                    try:
                        stamp = datetime.strptime(event[1] + event[2], '%Y%m%d%H%M%S').replace(tzinfo=timezone.utc).isoformat()
                    except ValueError:
                        pass
                stamp = stamp or record.get('triggered_at') or (record.get('raw') or {}).get('triggered_at')
                if not stamp:
                    continue
                try:
                    when = datetime.fromisoformat(str(stamp).replace('Z', '+00:00'))
                    if when.tzinfo is None:
                        when = when.replace(tzinfo=timezone.utc)
                    utc = when.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S')
                    local = _display_value(when.isoformat(), 'triggered_at')
                    for key in ('fault', 'summary'):
                        if isinstance(display.get(key), str):
                            display[key] = display[key].replace(utc, local).replace(utc.replace('T', ' '), local)
                except (TypeError, ValueError):
                    pass
    return result


def _display_value(value: Any, key: str = "") -> str:
    """将状态、布尔值等机器值转换为中文可读文本。"""

    if isinstance(value, bool):
        return "是" if value else "否"
    if key.endswith('_at') and value:
        try:
            stamp = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            if stamp.tzinfo:
                return stamp.astimezone(timezone(timedelta(hours=8))).strftime('%Y/%m/%d %H:%M:%S（北京时间）')
        except (TypeError, ValueError):
            pass
    text = str(value)
    if "HTTP Error 404" in text or text == "404":
        return "未找到对应记录（HTTP 404）"
    if key in {"status", "priority", "risk_level", "inspection_type"}:
        return _VALUE_LABELS.get(text, text)
    text = _VALUE_LABELS.get(text.casefold(), text)
    for token, label in (("cad_drawing", "CAD 图纸"), ("trigger", "触发条件"), ("reference", "参考")):
        text = text.replace(token, label)
    text = text.replace("QualityResult.passed", "质检结果是否通过")
    return text


def _value_lines(value: Any, prefix: str = "", depth: int = 0, limit: int = 80) -> list[str]:
    """将字典、列表和标量转换为适合报告阅读的分层文本。"""

    if value is None or value == "":
        return []
    if depth >= 4:
        compact = str(value).replace("\r", " ").replace("\n", " ").strip()
        return [f"{prefix}: {compact[:400]}".strip()]
    if isinstance(value, Mapping):
        lines: list[str] = []
        for key, child in value.items():
            if str(key) in _PDF_SKIP_FIELDS:
                continue
            key_text = _display_key(key)
            if str(key).endswith('_at') and isinstance(child, str):
                child = _display_value(child, str(key))
            if key in {"success", "found"} and child is True:
                continue
            child_lines = _value_lines(child, key_text, depth + 1, limit)
            lines.extend(child_lines or [f"{key_text}: {_display_value(child, str(key))}"])
            if len(lines) >= limit:
                break
        omitted = max(0, len(value) - len(lines))
        if omitted:
            lines.append(f"{prefix or '本节'}：其余 {omitted} 个字段已保留在原始报告中")
        return lines[:limit]
    if isinstance(value, (list, tuple, set)):
        lines: list[str] = []
        values = list(value)
        for index, child in enumerate(values[:24], 1):
            child_lines = _value_lines(child, f"{prefix} {index}".strip(), depth + 1, limit)
            lines.extend(child_lines or [f"{prefix} {index}: {_display_value(child)}".strip()])
            if len(lines) >= limit:
                break
        omitted = len(values) - min(len(values), 24)
        if omitted:
            lines.append(f"{prefix or '本节'}：其余 {omitted} 项已保留在原始报告中")
        return lines[:limit]
    text = _display_value(value, prefix).replace("\r\n", "\n").replace("\r", "\n").strip()
    if "\n" in text:
        return [f"{prefix}: {line}" if prefix else line for line in text.splitlines() if line.strip()][:limit]
    return [f"{prefix}: {text}" if prefix else text]


def _write_pdf(report: Mapping[str, Any], target: Path) -> None:
    """使用 PyMuPDF 创建带中文字体、自动分页的 PDF。"""

    try:
        import pymupdf
    except ImportError as error:  # pragma: no cover - 由部署依赖保证
        raise RuntimeError("PDF 工具缺少 PyMuPDF 依赖，请安装 PyMuPDF") from error

    font_path = _find_font()
    document = pymupdf.open()
    page = document.new_page(width=595, height=842)
    margin = 42
    y = margin
    font_name = "china-s"
    font = pymupdf.Font(fontname=font_name)
    latin_font = pymupdf.Font(fontname="helv")
    if font_path:
        font_name = "report-font"
        font = pymupdf.Font(fontfile=font_path)
        page.insert_font(fontname=font_name, fontfile=font_path)

    def add_page() -> None:
        nonlocal page, y
        page = document.new_page(width=595, height=842)
        y = margin
        if font_path:
            page.insert_font(fontname=font_name, fontfile=font_path)

    def add_text(text: str, size: float = 10.5, color: tuple[float, float, float] = (0.12, 0.2, 0.23), bold: bool = False) -> None:
        nonlocal y
        line_height = size * 1.55
        text = str(text or "").strip()
        if not text:
            return
        def measure(value: str) -> float:
            if font_path:
                return font.text_length(value, fontsize=size)
            return sum((latin_font.text_length(char, fontsize=size) if char.isascii() else font.text_length(char, fontsize=size)) for char in value)

        # 按字体测量逐行换行，避免中文内容越过页面边界。
        words: list[str] = []
        current = ""
        for char in text:
            candidate = current + char
            width = measure(candidate)
            if current and width > 511:
                words.append(current)
                current = char
            else:
                current = candidate
        if current:
            words.append(current)
        for line in words:
            if y + line_height > 790:
                add_page()
            if font_path:
                page.insert_text((margin, y), line, fontsize=size, fontname=font_name, color=color)
            else:
                x = float(margin)
                start = 0
                is_ascii = line[0].isascii()
                for index in range(1, len(line) + 1):
                    next_is_ascii = index < len(line) and line[index].isascii()
                    if index == len(line) or next_is_ascii != is_ascii:
                        chunk = line[start:index]
                        run_font = latin_font if is_ascii else font
                        run_name = "helv" if is_ascii else font_name
                        page.insert_text((x, y), chunk, fontsize=size, fontname=run_name, color=color)
                        x += run_font.text_length(chunk, fontsize=size)
                        start = index
                        is_ascii = next_is_ascii
            y += line_height

    report_id = str(report.get("report_id") or "未编号")
    title = str(report.get("title") or "运维报告")
    add_text(title, size=20, color=(0.02, 0.32, 0.38), bold=True)
    add_text(f"报告编号：{report_id}", size=10, color=(0.35, 0.43, 0.46))
    report_type = _VALUE_LABELS.get(str(report.get("report_type") or ""), _SECTION_LABELS.get(str(report.get("report_type") or ""), "运维报告"))
    report_status = _VALUE_LABELS.get(str(report.get("status") or ""), str(report.get("status") or "待确认"))
    add_text(f"停机处理汇总    报告状态：{report_status}" if (report.get('sections') or {}).get('lifecycle') else f"报告类型：{report_type}    报告状态：{report_status}", size=10, color=(0.35, 0.43, 0.46))
    add_text(f"生成时间：{_display_value(report.get('created_at') or report.get('updated_at') or '未记录', 'created_at')}", size=10, color=(0.35, 0.43, 0.46))
    y += 8
    add_text("报告摘要", size=13, color=(0.02, 0.32, 0.38), bold=True)
    add_text(str(report.get("summary") or "暂无摘要"), size=11)
    sections = report.get("sections") or {}
    if sections.get('lifecycle'):
        sections = _lifecycle_pdf_sections(sections)
    if isinstance(sections, Mapping):
        for key, value in sections.items():
            y += 8
            add_text(_SECTION_LABELS.get(str(key), _display_key(key)), size=13, color=(0.02, 0.32, 0.38), bold=True)
            lines = _value_lines(value)
            if not lines:
                add_text("暂无记录", size=10, color=(0.4, 0.46, 0.48))
            for line in lines:
                add_text(f"• {line}", size=10.2)
    findings = report.get("validation_findings") or []
    if findings:
        y += 8
        add_text("校验结果", size=13, color=(0.62, 0.2, 0.16), bold=True)
        for line in _value_lines(findings):
            add_text(f"• {line}", size=10.2, color=(0.5, 0.2, 0.16))
    for index, item in enumerate(document, 1):
        item.insert_text((margin, 818), f"报告中心 · 第 {index} 页", fontsize=8, fontname=font_name, color=(0.45, 0.52, 0.54))
    target.parent.mkdir(parents=True, exist_ok=True)
    document.save(str(target), garbage=4, deflate=True)
    document.close()


def generate_report_file(
    report: Mapping[str, Any],
    path: str = "",
    format: str = "json",
    **_: Any,
) -> Dict[str, Any]:
    report_value = dict(report or {})
    output_format = str(format or "json").lower().lstrip(".")
    report_id = report_value.get("report_id") or "report"
    target = Path(path).expanduser() if path else get_report_file_path(report_id, output_format)
    target = target.with_suffix(f".{output_format}")
    target.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        target.write_text(json.dumps(report_value, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    elif output_format == "pdf":
        _write_pdf(report_value, target)
    else:
        return {"success": False, "generated": False, "error": f"不支持的报告格式：{output_format}", "source": "report-file"}
    return {
        "success": True,
        "generated": True,
        "report_id": str(report_id),
        "format": output_format,
        "mime_type": "application/pdf" if output_format == "pdf" else "application/json",
        "filename": target.name,
        "path": str(target),
        "source": "report-file",
    }


__all__ = ["generate_report_file", "get_report_file_path"]
