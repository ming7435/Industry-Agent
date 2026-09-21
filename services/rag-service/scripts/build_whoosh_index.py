"""从 Milvus 集合重建 Whoosh BM25 索引。

当词法检索路径为空或过期，但向量已经写入 Milvus 时使用本脚本；例如使用 ``--no-whoosh`` 入库后，或在另一台机器上重建集合后。从 Milvus 读取可以让两个存储保持同步，且无需重新解析手册。

用法::

    python scripts/build_whoosh_index.py --all-configured
    python scripts/build_whoosh_index.py --collection industry_rag_alarm_codes
    python scripts/build_whoosh_index.py --index-dir data/index/whoosh
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from loguru import logger

from app.whoosh import build_index, count_documents, index_dir_for_collection

from config.settings import settings

OUTPUT_FIELDS: tuple[str, ...] = (
    "chunk_id",
    "text",
    "source_name",
    "source_path",
    "source_format",
    "corpus",
    "device_model",
    "error_code",
    "chunk_type",
    "quality",
    "metadata_json",
)
"""离线写入器实际存储的列；corpus 会从这些列派生。"""

_PAGE_SIZE = 1000
"""每次 Milvus ``query`` 调用获取的行数。"""


def iter_collection_rows(
    collection_name: str,
    uri: str | None = None,
    database: str | None = None,
) -> list[dict]:
    """获取某个集合中的所有分块行。

    参数：
        collection_name：要读取的 Milvus 集合。
        uri：Milvus URI；默认使用 ``settings.milvus_uri``。

    返回：
        每个分块对应一个映射，包含 :data:`OUTPUT_FIELDS` 中的列。

    异常：
        RuntimeError：缺少 ``pymilvus`` 或集合不存在。
    """
    try:
        from pymilvus import MilvusClient
    except (ImportError, ModuleNotFoundError) as exc:
        raise RuntimeError("未安装 pymilvus") from exc

    client = MilvusClient(
        uri=uri or settings.milvus_uri,
        db_name=database or settings.milvus_database,
    )
    if not client.has_collection(collection_name):
        raise RuntimeError(f"集合 {collection_name!r} 在 {uri or settings.milvus_uri} 中不存在")

    rows: list[dict] = []
    offset = 0
    paged = True
    while True:
        try:
            page = client.query(
                collection_name=collection_name,
                filter=None,
                output_fields=list(OUTPUT_FIELDS),
                limit=_PAGE_SIZE,
                offset=offset,
            )
        except TypeError:
            # 较旧的 MilvusClient 没有 ``offset``：退回到单页读取，并在集合超过一页时给出警告。
            if paged:
                logger.warning(
                    "当前 pymilvus 版本没有 query offset；最多读取 {} 行",
                    _PAGE_SIZE,
                )
            paged = False
            page = client.query(
                collection_name=collection_name,
                output_fields=list(OUTPUT_FIELDS),
                limit=_PAGE_SIZE,
            )
        if not page:
            break
        rows.extend(page)
        if not paged or len(page) < _PAGE_SIZE:
            break
        offset += len(page)

    logger.info("已从 collection={} 获取 {} 行", collection_name, len(rows))
    return rows


def rebuild(
    collection_name: str | None = None,
    index_dir: str | None = None,
    uri: str | None = None,
    database: str | None = None,
    *,
    append: bool = False,
) -> int:
    """从 Milvus 重建 BM25 索引。

    参数：
        collection_name：源集合；默认使用 ``settings.milvus_collection``。
        index_dir：Whoosh 基础目录；集合索引会写入 ``index_dir/<collection_name>``。
        uri：Milvus URI；默认使用 ``settings.milvus_uri``。

    返回：
        已索引的文档数量。
    """
    target_collection = collection_name or settings.milvus_collection
    target_index_dir = index_dir_for_collection(
        index_dir or settings.whoosh_index_dir,
        target_collection,
    )
    rows = iter_collection_rows(target_collection, uri, database)
    if not rows:
        logger.warning("collection={} 为空，无需建立索引", target_collection)
        return 0

    written = build_index(rows, target_index_dir, recreate=not append)
    logger.info(
        "Whoosh 索引已重建 collection={} dir={} documents={}",
        target_collection,
        target_index_dir,
        written,
    )
    return written


def rebuild_all_configured(
    index_dir: str | None = None,
    uri: str | None = None,
    database: str | None = None,
    *,
    append: bool = False,
) -> dict[str, int]:
    """为每个已配置的类型化集合重建 BM25 索引。"""

    results: dict[str, int] = {}
    for collection_name in settings.milvus_search_collections:
        try:
            results[collection_name] = rebuild(
                collection_name,
                index_dir,
                uri,
                database,
                append=append,
            )
        except RuntimeError as exc:
            logger.warning("跳过 collection={}，原因：{}", collection_name, exc)
            results[collection_name] = 0
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="从 Milvus 重建 Whoosh BM25 索引。")
    parser.add_argument("--collection", default=settings.milvus_collection)
    parser.add_argument("--index-dir", default=None)
    parser.add_argument("--milvus-uri", default=settings.milvus_uri)
    parser.add_argument("--milvus-database", default=settings.milvus_database)
    parser.add_argument(
        "--all-configured",
        action="store_true",
        help="为 MILVUS_COLLECTIONS 中的每个集合重建一个 Whoosh 子索引。",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="更新已有 Whoosh 索引，而不是重新创建。",
    )
    args = parser.parse_args()

    if args.all_configured:
        results = rebuild_all_configured(
            args.index_dir,
            args.milvus_uri,
            args.milvus_database,
            append=args.append,
        )
        total = sum(results.values())
        for collection_name, written in results.items():
            index_dir = index_dir_for_collection(
                args.index_dir or settings.whoosh_index_dir,
                collection_name,
            )
            print(
                f"Whoosh index rebuilt: collection={collection_name} "
                f"documents={written} total={count_documents(index_dir)}"
            )
        print(f"Whoosh indexes rebuilt: collections={len(results)} documents={total}")
        return 0

    target_index_dir = index_dir_for_collection(
        args.index_dir or settings.whoosh_index_dir,
        args.collection,
    )
    written = rebuild(
        args.collection,
        args.index_dir,
        args.milvus_uri,
        args.milvus_database,
        append=args.append,
    )
    print(f"Whoosh index rebuilt: collection={args.collection} documents={written} total={count_documents(target_index_dir)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
