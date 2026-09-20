"""统一处理工厂原始报警文本。

工厂接口可能把报警码和控制器底层英文一起返回。该模块只负责提取稳定的
报警码、清理占位符，并把已知报警转换成维修人员可读的中文；原始文本仍
保留在 ``raw_text``，用于追溯和后续补充报警字典。
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any, Mapping


@dataclass(frozen=True)
class ParsedAlarm:
    code: str = ""
    raw_text: str = ""
    display_text: str = ""
    description: str = ""
    matched: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AlarmCodeParser:
    """从报警码或报警原文提取标准码并隐藏控制器底层乱码。"""

    STANDARD_CODE = re.compile(r"(?<![A-Z0-9])([A-Z]\d+[A-Z]\d+)(?![A-Z0-9])", re.I)
    NUMERIC_CODE = re.compile(r"(?<![A-Z0-9])(\d{3,8})(?![A-Z0-9])")
    NAMED_CODE = re.compile(r"(?<![A-Z0-9])([A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+)(?![A-Z0-9])", re.I)
    PLACEHOLDER = re.compile(r"\s*[<{\[][^>\]}]*[>\]}]\s*", re.I)
    WHITESPACE = re.compile(r"\s+")

    # E11S3/E11S4 的英文属于控制器底层实现信息，不能直接展示给维修人员。
    OPERATOR_DESCRIPTIONS: dict[str, str] = {
        "E11S2": "控制器错误内存指针被释放",
        "E11S3": "指针值为零时被释放",
        "E11S4": "指针值为零",
        # 该码先纳入标准化字典，详细含义以现场手册和控制器版本为准。
        "E12S101": "控制器报警 E12S101，请根据设备手册确认具体原因",
    }

    @classmethod
    def extract(cls, value: Any) -> str:
        text = str(value or "").strip().upper()
        if not text:
            return ""
        for pattern in (cls.STANDARD_CODE, cls.NUMERIC_CODE, cls.NAMED_CODE):
            match = pattern.search(text)
            if match:
                return match.group(1).upper()
        return ""

    @classmethod
    def clean_text(cls, value: Any) -> str:
        text = str(value or "").strip()
        if not text:
            return ""
        text = cls.PLACEHOLDER.sub(" ", text)
        text = re.sub(r"\bPointer with value zero is freed\b", "", text, flags=re.I)
        text = re.sub(r"\bWrong memory pointer is freed\b", "", text, flags=re.I)
        text = re.sub(r"\bThe pointer value is 0\b", "", text, flags=re.I)
        text = cls.WHITESPACE.sub(" ", text)
        return text.strip(" :-,;")

    @classmethod
    def parse(cls, value: Any, description: str = "") -> ParsedAlarm:
        raw_text = str(value or "").strip()
        code = cls.extract(raw_text)
        mapped = cls.OPERATOR_DESCRIPTIONS.get(code, "")
        cleaned = cls.clean_text(raw_text)
        display = mapped or cleaned or code
        return ParsedAlarm(
            code=code,
            raw_text=raw_text,
            display_text=display,
            description=mapped or str(description or "").strip(),
            matched=bool(code),
        )

    @classmethod
    def normalize_mapping(cls, payload: Mapping[str, Any]) -> dict[str, Any]:
        """归一化设备/事件字典，同时保留 raw_alarm_text 供追溯。"""

        result = dict(payload)
        raw = result.get("alarm_code") or result.get("alarm") or result.get("alarm_message")
        parsed = cls.parse(raw)
        if parsed.code:
            result["alarm_code"] = parsed.code
            result["alarm_label"] = parsed.display_text
            result["alarm_description"] = parsed.description or parsed.display_text
            result["raw_alarm_text"] = parsed.raw_text
        elif not result.get("alarm_code"):
            result["alarm_code"] = None
        return result
