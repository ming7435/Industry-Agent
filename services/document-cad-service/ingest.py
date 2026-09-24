"""RAG 离线入库的统一主入口。

从仓库根目录直接运行：

    python services/rag-service/ingest.py

该文件只负责转发命令行参数，实际的扫描、解析、OCR、分块、向量化以及
Milvus、Whoosh、MySQL 写入仍由 ``scripts/ingest_to_milvus.py`` 统一实现。
"""

from __future__ import annotations

from scripts.ingest_to_milvus import main


if __name__ == "__main__":
    raise SystemExit(main())
