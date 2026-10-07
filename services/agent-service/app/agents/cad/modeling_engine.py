"""CAD 计算与图纸导出：隔离实体内核，输出真实投影的中文 PDF。"""

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[5]


class CADKernelError(RuntimeError):
    """几何内核不可用、超时或校验失败。"""


class CADKernel:
    def __init__(self, python_path=None, timeout=120):
        isolated = PROJECT_ROOT / ".runtime" / "cad-modeling-venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        self.python_path = str(python_path or (isolated if isolated.is_file() else sys.executable))
        self.timeout = timeout
        self.worker = Path(__file__).with_name("modeling_worker.py")
        self._health = None

    def _run(self, payload=None, health=False):
        command = [self.python_path, str(self.worker)] + (["--health"] if health else [])
        # CAD 子进程不继承 API 密钥、供应商配置或数据库凭据。
        environment = {key: value for key, value in os.environ.items() if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA"}}
        environment.update({"PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})
        try:
            result = subprocess.run(command, input=None if health else json.dumps(payload, ensure_ascii=False),
                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=self.timeout, env=environment,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            value = json.loads(result.stdout.strip())
        except subprocess.TimeoutExpired as error:
            raise CADKernelError("CAD 计算超时，工作进程已停止；请简化模型后创建新版本") from error
        except (OSError, ValueError) as error:
            raise CADKernelError("CAD 引擎不可用，请安装 CAD 专用依赖环境") from error
        if result.returncode or value.get("error"):
            raise CADKernelError(value.get("error", "CAD 实体校验失败"))
        return value

    def health(self):
        if self._health is None:
            try:
                self._health = self._run(health=True)
            except CADKernelError as error:
                self._health = {"ready": False, "message": str(error)}
        return dict(self._health)

    def build(self, spec, output_dir, **arguments):
        return self._run({"spec": spec, "output_dir": str(output_dir), **arguments})


def export_drawing_pdf(folder, task):
    """从真实实体投影输出中文工程视图，不绘制替代模型。"""
    import fitz

    folder = Path(folder)
    document = fitz.open()
    page = document.new_page(width=842, height=595)
    ink = (0.08, 0.2, 0.24)
    teal = (0.0, 0.43, 0.40)

    def text(target, x, y, value, size=11, color=ink):
        target.insert_text((x, y), str(value), fontname="china-s", fontsize=size, color=color)

    text(page, 32, 40, "生产前零件工程视图", 21, teal)
    # 首页面积有限，完整名称、材料及技术要求在后面的分页中保留。
    text(page, 32, 66, task["name"][:24], 13)
    text(page, 450, 40, task["design_id"], 10)
    text(page, 450, 62, "单位：mm    材料：" + (task.get("material") or "未指定")[:20], 11)
    page.draw_line((32, 80), (810, 80), color=teal)
    for index, (name, label) in enumerate((("front", "主视图"), ("top", "俯视图"), ("side", "侧视图"))):
        x = 32 + index * 260
        text(page, x, 107, label, 12)
        svg = fitz.open(stream=(folder / (name + ".svg")).read_bytes(), filetype="svg")
        try:
            with fitz.open("pdf", svg.convert_to_pdf()) as projection:
                page.show_pdf_page(fitz.Rect(x, 120, x + 245, 350), projection, 0)
        finally:
            svg.close()
    bounds = task["geometry"]["bounds_mm"]
    text(page, 32, 386, "实体包络尺寸：X %.4g mm / Y %.4g mm / Z %.4g mm" % tuple(bounds), 13)
    text(page, 32, 414, "校验：连续闭合实体；STEP 回读通过。DXF 文件为实体中截面。", 11)
    text(page, 32, 442, "完整零件资料、技术要求与参数见后续页面。", 10)
    text(page, 32, 476, "设计文件用于加工准备；当前未接入刀路、机床后处理与生产下发。", 10)
    text(page, 32, 555, "CAD Agent  |  实体生成视图  |  设计摘要：" + task["digest"][:20], 9)
    font = fitz.Font(fontname="china-s")
    table, y = None, 0

    def paragraph(value):
        nonlocal table, y
        for raw in str(value).splitlines() or [""]:
            line, width = "", 0
            lines = []
            for character in raw:
                advance = font.text_length(character, fontsize=11)
                if width + advance > 765:
                    lines.append(line); line, width = "", 0
                line += character; width += advance
            lines.append(line)
            for line in lines:
                if table is None or y > 522:
                    table = document.new_page(width=842, height=595)
                    text(table, 32, 40, "零件资料、技术要求与建模参数", 19, teal)
                    text(table, 32, 555, task["design_id"] + f"  |  第 {len(document)} 页", 9)
                    y = 82
                text(table, 32, y, line, 11)
                y += 18
            y += 4

    paragraph("零件名称：" + task["name"])
    paragraph("材料：" + (task.get("material") or "未指定"))
    paragraph("技术要求：" + (task.get("technical_requirements") or "未指定公差、粗糙度及后处理要求"))
    request = task.get("request") or {}
    input_units = (task.get("resolved_spec") or {}).get("units") or request.get("dxf_units")
    paragraph("输入单位：" + (input_units or "STEP 文件内部单位（导入后统一 mm）"))
    if request.get("dxf_depth") is not None:
        paragraph("拉伸深度：" + str(request["dxf_depth"]) + (request.get("dxf_units") or ""))
    labels = {"cylinder": "圆柱", "box": "方块", "extrude": "轮廓拉伸", "revolve": "轮廓旋转", "fillet": "圆角", "chamfer": "倒角"}
    keys = {"type": "类型", "position": "位置", "mode": "布尔方式", "diameter": "直径", "length": "长度", "width": "宽度", "height": "高度", "axis": "轴向", "points": "轮廓点", "depth": "深度", "angle": "角度", "size": "尺寸", "edges": "边选择"}
    for index, operation in enumerate((task.get("resolved_spec") or {}).get("operations") or []):
        paragraph(f"特征 {index + 1}：" + labels[operation["type"]])
        for key, value in operation.items():
            label = keys.get(key, key)
            if key == "points":
                paragraph(label + "（按顺序，每行最多四点）：")
                for offset in range(0, len(value), 4):
                    paragraph(json.dumps(value[offset:offset + 4], ensure_ascii=False, separators=(",", ":")))
            else:
                paragraph(label + "：" + json.dumps(value, ensure_ascii=False, separators=(",", ":")))
    try:
        document.save(folder / "drawing.pdf")
    finally:
        document.close()
