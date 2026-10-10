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
    'experience': '经验总结与知识沉淀',
    'references': '来源与追溯依据',
}
_FIELD_LABELS = {
    "cycle_id": "停机处理编号",
    "started_at": "故障停机开始",
    "stopped_at": "停机确认时间",
    "restarted_at": "复机时间",
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
    'evidence': '诊断依据', 'evidence_records': '证据明细', 'evidence_id': '证据编号',
    'source_documents': '参考资料', 'memory_evidence': '历史经验依据',
    'source_name': '来源名称', 'source_path': '资料位置', 'source_format': '资料格式',
    'document_id': '文档编号', 'chunk_id': '片段编号', 'page_numbers': '页码',
    'source_ref': '来源引用', 'source_refs': '来源引用', 'metadata': '来源信息',
    'experience_id': '经验编号', 'source_workorder': '来源工单', 'source_event_id': '来源故障事件',
    'source_plan': '来源方案', 'source_report': '来源报告', 'source_basis': '经验依据',
    'validation_status': '确认方式', 'limitations': '记录局限', 'knowledge_sync': '知识同步回执',
    'rag_saved': '关键词与向量索引全部完成', 'memory_saved': '经验数据库已保存',
    'pipeline_ready': '检索链路全部就绪', 'searchable': '支持关键词检索',
    'bm25_indexed': '关键词索引已保存', 'dense_indexed': '向量索引已保存',
    'attempts': '同步尝试次数', 'next_retry_at': '下次重试时间', 'last_attempt_at': '最近同步时间',
    'indexed_at': '索引完成时间', 'backends': '索引明细', 'metadata_saved': '检索文档已保存',
    'automatic_verification': '自动恢复核验', 'phase': '确认阶段', 'confirmed': '人工已确认',
    'confirmed_by': '确认人员', 'confirmed_at': '维修确认时间', 'restart_method': '复机方式',
    'receipt_id': '确认回执', 'confirmation_receipt_id': '确认回执', 'actor_id': '确认人员',
    'assignee_name': '负责人姓名', 'completed_at': '维修完成时间', 'accepted_by': '接单人员',
    'dispatch_mode': '派发方式', 'dispatch_findings': '派发提示', 'events': '工单操作记录',
    'status_history': '状态变更记录', 'operator': '操作人员', 'technician_confirmation': '维修确认回执',
    'tools_required': '所需工具', 'text': '内容', 'description': '说明', 'excerpt': '依据摘录',
    'knowledge_note': '知识沉淀状态', 'learning_scope': '经验范围', 'treatment': '实际处理说明',
    'recommended_steps': '方案建议步骤', 'diagnosis_summary': '诊断摘要',
    'whoosh': '关键词索引', 'milvus': '向量索引', 'written': '写入片段数', 'required': '启用此索引',
    'repair_feedback': '实际处理说明', 'repair_verification': '维修确认记录',
    'evidence_status': '证据状态', 'confidence_details': '置信度组成', 'knowledge_warning': '知识依据提示',
    'maintenance_reason': '维修原因', 'maintenance_required': '需要维修', 'requires_human_review': '需要现场核实',
    'alarm_definition': '报警定义', 'name': '名称', 'severity': '严重等级', 'severity_label': '严重等级说明',
    'recommended_action': '建议操作', 'raw_alarm_text': '报警原文', 'plan_kind': '方案用途',
    'engineering_context': '工程图纸依据', 'inventory_status': '备件库存信息', 'part_availability': '备件可用性',
    'drawing_refs': '参考图纸', 'available_drawings': '可用图纸', 'drawing_ref_details': '图纸信息',
    'retrieval_match': '检索匹配度', 'knowledge_degraded': '知识检索降级', 'warning': '提示',
    'historical_resolution': '历史解决记录权重', 'llm_probability': '模型置信度', 'overall': '综合置信度',
    'raw': '来源原始记录', 'model_metadata': '推理模型信息', 'result': '结果',
    'items': '明细', 'stock': '库存数量', 'synthetic': '演示数据', 'devices': '设备恢复记录',
    'state': '运行状态', 'restart_method': '复机方式', 'reason': '处理说明',
    'sample_count': '采样数量', 'series_summary': '历史曲线统计', 'history_summary': '历史采样统计',
    'mean': '均值', 'first': '首个值', 'latest': '最新值', 'ended_at': '采样结束时间',
    'direction': '变化趋势', 'trend': '历史趋势', 'metric_keys': '监测指标',
    'metric_definitions': '指标说明及阈值', 'returned_state': '设备返回状态', 'section': '报告章节',
    'spindle_rpm': '主轴转速（rpm）', 'spindle_load_percent': '主轴负载（%）',
    'spindle_temp_c': '主轴温度（℃）', 'hydraulic_pressure_psi': '液压总压力（psi）',
    'turret_servo_load_percent': '刀塔伺服负载（%）', 'turret_rotating_signal': '刀塔旋转信号',
    'live_tool_speed_rpm': '动力刀转速（rpm）', 'live_tool_load_percent': '动力刀负载（%）',
    'chuck_pressure_psi': '卡盘夹紧压力（psi）', 'quill_pressure_psi': '尾座套筒压力（psi）',
    'tailstock_clamp_pressure_psi': '尾座夹紧压力（psi）', 'lube_pressure_psi': '润滑压力（psi）',
    'coolant_pressure_psi': '冷却压力（psi）', 'coolant_level_percent': '冷却液位（%）',
    'barfeed_ready_signal': '送料机就绪信号', 'part_catcher_position_percent': '接料器位置（%）',
    'spindle_vibration_mm_s': '主轴振动（mm/s）', 'live_tool_vibration_mm_s': '动力刀振动（mm/s）',
    'x_axis_vibration_mm_s': 'X轴振动（mm/s）', 'z_axis_vibration_mm_s': 'Z轴振动（mm/s）',
    'normal_range': '正常范围', 'warn_range': '预警范围', 'alarm_range': '报警范围',
    'label': '指标名称', 'unit': '单位', 'group': '指标分组', 'timestamp': '记录时间',
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
    'manual_confirmed': '维修人员人工确认', 'manual_confirmation': '人工确认后直接启动',
    'manual_case_summary': '人工确认维修案例', 'retry': '待自动重试', 'indexed': '全部索引已完成',
    'automatic': '系统自动派发', 'system_auto': '系统自动派发',
    'running': '运行中', 'stopped': '已停止', 'applied': '启动指令已执行',
    'start': '启动', 'stop': '停止', 'cases': '维修案例', 'case': '维修案例',
    'backend-persisted-record': '业务数据库保存记录', 'line-control-ledger': '产线启停回执',
    'inspection': '工单检查', 'prestart': '开机前检查', 'poststart': '开机后检查',
}
_PDF_SKIP_FIELDS = {'_revision', 'idempotency_key', 'idempotency_fingerprint',
    'learning_idempotency_key', 'feedback_digest', 'plan_snapshot_digest', 'diagnosis_snapshot_digest'}



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
    timeline_fields = ('cycle_id', 'started_at', 'stopped_at', 'restarted_at', 'duration_seconds',
                       'restart_method', 'device_ids', 'event_ids', 'reason', 'devices')
    result['lifecycle'] = {key: lifecycle[key] for key in timeline_fields if key in lifecycle}
    # All substantive facts and evidence are retained. Nested copies of the same
    # diagnosis/plan and implementation-only fields stay in the JSON source.
    omitted = {
        'diagnosis': {'tool_calls', 'active_skill', 'active_skills', 'cached'},
        'maintenance_plan': {'diagnosis', 'workorder_draft'},
        'workorder': {'diagnosis_snapshot', 'maintenance_plan_snapshot', 'diagnosis_context'},
    }
    for name in ('diagnosis', 'maintenance_plan', 'workorder', 'repair_feedback',
                 'repair_verification', 'experience', 'references'):
        records = (sections.get(name) or {}).get('records') or []
        result[name] = [{key: value for key, value in record.items() if key not in omitted.get(name, set())}
                        for record in records] or {'summary': '未关联记录'}
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


def _value_lines(value: Any, prefix: str = "", depth: int = 0, limit: int | None = None) -> list[str]:
    """Render complete nested facts without record, line, or character truncation."""
    if value is None or value == "" or value == [] or value == {}:
        return []
    indent = '  ' * min(depth, 5)
    if isinstance(value, Mapping):
        lines = [indent + prefix] if prefix else []
        for key, child in value.items():
            if str(key) in _PDF_SKIP_FIELDS:
                continue
            if isinstance(child, (Mapping, list, tuple, set)):
                lines.extend(_value_lines(child, _display_key(key), depth + 1))
            elif child is not None and child != '':
                lines.extend(indent + _display_key(key) + '：' + part for part in
                             _display_value(child, str(key)).splitlines() if part.strip())
        return lines
    if isinstance(value, (list, tuple, set)):
        lines = []
        for index, child in enumerate(value, 1):
            label = f'{prefix or "记录"} {index}'
            if isinstance(child, (Mapping, list, tuple, set)):
                lines.extend(_value_lines(child, label, depth + 1))
            else:
                lines.extend(indent + label + '：' + part for part in _display_value(child).splitlines() if part.strip())
        return lines
    return [indent + (prefix + '：' if prefix else '') + line for line in _display_value(value, prefix).splitlines() if line.strip()]


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
    y = margin + 18
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
        y = margin + 18
        if font_path:
            page.insert_font(fontname=font_name, fontfile=font_path)

    def add_text(text: str, size: float = 10.5, color: tuple[float, float, float] = (0.12, 0.2, 0.23), bold: bool = False, leading: float = 1.55, first_indent: bool = False) -> None:
        nonlocal y
        line_height = size * leading
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
            if char == '\n':
                if current:
                    words.append(current)
                current = ''
                continue
            candidate = current + char
            width = measure(candidate)
            available_width = 511 - (size * 2 if first_indent and not words else 0)
            if current and width > available_width:
                words.append(current)
                current = char
            else:
                current = candidate
        if current:
            words.append(current)
        for line_index, line in enumerate(words):
            if y + line_height > 790:
                add_page()
            x = float(margin) + (size * 2 if first_indent and line_index == 0 else 0)
            if font_path:
                page.insert_text((x, y), line, fontsize=size, fontname=font_name, color=color)
            else:
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
    article = str(report.get('article_text') or '').strip()
    concise = report.get('concise_sections') or []
    if article:
        y += 18
        for paragraph in article.split('\n\n'):
            add_text(paragraph, size=11.5, leading=1.55, first_indent=True)
            y += 8
    elif not concise:
        y += 8
        add_text("报告摘要", size=13, color=(0.02, 0.32, 0.38), bold=True)
        add_text(str(report.get("summary") or "暂无摘要"), size=11)
        if report.get('knowledge_note'):
            add_text('知识沉淀：' + report['knowledge_note'], size=10, color=(0.35, 0.43, 0.46))
    sections = report.get('presentation_sections') or report.get("sections") or {}
    if concise:
        sections = {item['title']: item['body'] for item in concise}
    elif sections.get('lifecycle'):
        from shared.report_presentation import report_presentation
        if not report.get('presentation_sections'):
            sections = report_presentation(sections)
        sections = _lifecycle_pdf_sections(sections)
    elif report.get('report_type') in {'full_case_report', 'maintenance_report', 'diagnosis_report', 'incident_report'}:
        sections = {key: value for key, value in sections.items() if key not in {'quality', 'quality_result'}}
    if not article and isinstance(sections, Mapping):
        for section_number, (key, value) in enumerate(sections.items(), 1):
            if y + 64 > 790:
                add_page()
            y += 14
            page.draw_line((margin, y - 8), (553, y - 8), color=(0.72, 0.83, 0.82), width=0.5)
            add_text(f'{section_number:02d}  ' + _SECTION_LABELS.get(str(key), _display_key(key)), size=13, color=(0.02, 0.32, 0.38), bold=True)
            lines = _value_lines(value)
            if not lines:
                add_text("暂无记录", size=10, color=(0.4, 0.46, 0.48))
            for line in lines:
                add_text(line, size=10.2)
    findings = [] if article or concise else report.get("validation_findings") or []
    if findings:
        y += 8
        add_text("校验结果", size=13, color=(0.62, 0.2, 0.16), bold=True)
        for line in _value_lines(findings):
            add_text(f"• {line}", size=10.2, color=(0.5, 0.2, 0.16))
    document.set_metadata({'title': title, 'author': 'IND-Agent', 'subject': '故障处理全过程与知识沉淀'})
    for index, item in enumerate(document, 1):
        item.draw_line((margin, 805), (553, 805), color=(0.72, 0.83, 0.82), width=0.5)
        item.insert_text((margin, 30), 'IND-Agent  |  ' + report_id, fontsize=8, fontname='helv', color=(0.45, 0.52, 0.54))
        item.insert_text((margin, 818), f"报告中心 · 第 {index} / {len(document)} 页", fontsize=8, fontname=font_name, color=(0.45, 0.52, 0.54))
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
