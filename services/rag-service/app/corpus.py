"""服务在线侧的语料标签推断。

离线流水线保持不变：只写入 ``source_name``、``source_path`` 和 ``metadata_json`` blob。在线链路仍需要为每个命中结果提供语料标签，因为 :mod:`app.evidence.builder` 会按标签对引用分组（``alarms`` / ``cases`` / ``manuals`` / ``sop``，并按这个顺序读取）。

因此标签在**读取时**从离线部分已经产出的字段派生：

1. ``metadata_json`` 中显式声明的 ``corpus`` 键；
2. ``source_path`` 的父目录（例如 ``data/alarms/...``）；
3. ``source_name`` 中的关键词（例如 ``..._报警码数据.pdf`` -> ``alarms``）；
4. ``settings.default_corpus``。

采用派生而不是存储，意味着已入库的集合无需重新入库也能得到正确标签，同时离线写入器可以保持现有 Schema。
"""

from __future__ import annotations

import re
from typing import Any

from config.settings import settings

CONTROLLED_CORPORA: tuple[str, ...] = ("alarms", "cases", "manuals", "sop")
"""证据层已知如何排序的语料标签。"""

CORPUS_BY_KEYWORD: dict[str, str] = {
    "报警码": "alarms",
    "报警": "alarms",
    "alarm": "alarms",
    "故障诊断": "cases",
    "故障": "cases",
    "troubleshooting": "cases",
    "case": "cases",
    "sop": "sop",
    "作业指导": "sop",
    "保养维护": "manuals",
    "安全规程": "manuals",
    "维修手册": "manuals",
    "manual": "manuals",
    "bom": "manuals",
}
"""文件名关键词到语料标签的映射，最长/最先命中的规则生效。"""

DEVICE_MODEL_PATTERN = re.compile(r"[A-Za-z]{1,5}\d{2,6}[A-Za-z0-9]*")
"""宽松的 ``字母 + 数字`` 设备型号模式，例如 ``TC820LTYsi``。"""


def _from_metadata(metadata: dict[str, Any] | None) -> str:
    """返回文档元数据声明的语料标签（如果存在）。

    参数：
        metadata：分块解析后的 ``metadata_json``。

    返回：
        小写语料标签；不存在时返回空字符串。
    """
    if not isinstance(metadata, dict):
        return ""
    value = metadata.get("corpus")
    return str(value).strip().lower() if value else ""


def _from_path(source_path: str | None) -> str:
    """返回文档目录暗示的语料标签。

    参数：
        source_path：源文档路径。

    返回：
        父目录匹配时返回语料标签，否则返回空字符串。
    """
    if not source_path:
        return ""
    for part in reversed(str(source_path).replace("\\", "/").split("/")[:-1]):
        if part.lower() in CONTROLLED_CORPORA:
            return part.lower()
    return ""


def _from_name(source_name: str | None) -> str:
    """返回文档文件名暗示的语料标签。

    参数：
        source_name：文档文件名或任意展示名。

    返回：
        第一个匹配关键词对应的语料标签，否则返回空字符串。
    """
    if not source_name:
        return ""
    name = str(source_name).lower()
    for keyword, corpus in CORPUS_BY_KEYWORD.items():
        if keyword.lower() in name:
            return corpus
    return ""


def infer_corpus(
    *,
    source_name: str | None = None,
    source_path: str | None = None,
    metadata: dict[str, Any] | None = None,
    default: str | None = None,
) -> str:
    """返回从离线字段派生出的分块语料标签。

    参数：
        source_name：源文档文件名。
        source_path：源文档路径。
        metadata：分块解析后的 ``metadata_json``。
        default：兜底标签；省略时使用 ``settings.default_corpus``。

    返回：
        :data:`CONTROLLED_CORPORA` 之一；均未匹配时返回兜底值。
    """
    for candidate in (
        _from_metadata(metadata),
        _from_path(source_path),
        _from_name(source_name),
    ):
        if candidate:
            return candidate
    return default or settings.default_corpus


def infer_device_model(source_name: str | None, source_path: str | None = None) -> str:
    """返回文档中可能的设备型号。

    参数：
        source_name：源文档文件名。
        source_path：源文档路径，用作兜底。

    返回：
        第一个 ``字母 + 数字`` 标记（例如 ``TC820LTYsi``）；未命中时返回空字符串。
    """
    for candidate in (source_name, source_path):
        if not candidate:
            continue
        match = DEVICE_MODEL_PATTERN.search(str(candidate))
        if match:
            return match.group(0)
    return ""


__all__ = [
    "CONTROLLED_CORPORA",
    "CORPUS_BY_KEYWORD",
    "infer_corpus",
    "infer_device_model",
]
