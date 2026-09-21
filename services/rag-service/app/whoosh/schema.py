"""离线写入器和在线 BM25 路径共享的 Whoosh 索引 Schema。

一个 Schema，两个使用方：

* :mod:`app.whoosh.indexer` 在入库后（或入库过程中）写入；
* :mod:`app.whoosh.retriever` 在在线链路的词法检索分支读取。

分析器在这里统一选择，确保两部分分词一致；用一种分析器建索引、用另一种分析器查询会导致无结果。本语料以中文为主，因此优先使用基于 jieba 的 :class:`ChineseAnalyzer`，不可用时退回到无依赖的 CJK 单字分析器。
"""

from __future__ import annotations

from typing import Any

FIELD_CHUNK_ID = "chunk_id"
FIELD_TEXT = "text"
FIELD_CORPUS = "corpus"
FIELD_SOURCE_NAME = "source_name"
FIELD_DEVICE_MODEL = "device_model"
FIELD_ERROR_CODE = "error_code"
FIELD_METADATA = "metadata_json"

TEXT_FIELDS: tuple[str, ...] = (FIELD_TEXT,)
"""BM25 查询解析器检索的字段。"""

FILTER_FIELDS: tuple[str, ...] = (
    FIELD_CORPUS,
    FIELD_DEVICE_MODEL,
    FIELD_ERROR_CODE,
    FIELD_SOURCE_NAME,
)
"""请求过滤条件可下推为 Whoosh ``Term`` 的字段。"""

_CJK_TOKEN_PATTERN = r"[\u4e00-\u9fff]|[A-Za-z0-9_]+"


def cjk_analyzer() -> Any:
    """返回无额外依赖、仍能切分中文文本的分析器。

    返回：
        一个 Whoosh 分析器：逐字切分 CJK 字符，整体保留 ASCII 单词并转为小写。
    """
    from whoosh.analysis import LowercaseFilter, RegexTokenizer

    return RegexTokenizer(_CJK_TOKEN_PATTERN) | LowercaseFilter()


def build_analyzer() -> Any:
    """返回写入和查询索引时使用的分析器。

    返回：
        安装 jieba 时返回 :class:`whoosh.analysis.ChineseAnalyzer`，否则返回 :func:`cjk_analyzer`。
    """
    try:
        from whoosh.analysis import ChineseAnalyzer
    except (ImportError, ModuleNotFoundError):
        return cjk_analyzer()

    try:
        return ChineseAnalyzer()
    except Exception:  # noqa: BLE001 - jieba 存在但不可用
        return cjk_analyzer()


def build_schema() -> Schema:
    """返回 BM25 索引的 Whoosh Schema。

    返回：
        以 ``chunk_id`` 为唯一键、包含已分析 ``text`` 字段、可过滤元数据列和已存储 ``metadata_json`` blob 的 Schema。
    """
    from whoosh.fields import ID, STORED, TEXT, Schema

    analyzer = build_analyzer()
    return Schema(
        chunk_id=ID(stored=True, unique=True),
        text=TEXT(analyzer=analyzer, stored=True),
        corpus=ID(stored=True),
        source_name=ID(stored=True),
        device_model=ID(stored=True),
        error_code=ID(stored=True),
        metadata_json=STORED,
    )


__all__ = [
    "FILTER_FIELDS",
    "TEXT_FIELDS",
    "build_analyzer",
    "build_schema",
    "cjk_analyzer",
]
