"""工业运维 RAG 服务——一个包含离线和在线两部分的包。

离线部分（``scripts/`` 及以下包）：
    ``app.ingestion``  解析 PDF / DOCX / XLSX / CSV / TXT / MD / 图片
    ``app.clean``      清理模板噪声和低价值分块
    ``app.chunk``      将清洗后的内容分组为可检索分块
    ``app.embedding``  为分块和在线查询生成 bge-m3 向量
    ``app.milvus``     创建集合并写入向量
    ``app.mysql``      保存文档/分块元数据及入库记录
    ``app.whoosh``     构建词法路径读取的 BM25 索引

在线部分：
    ``app.corpus``     在读取时根据离线字段推导语料标签
    ``app.api``        请求模型、单例装配、编排和路由
    ``app.fusion``     融合两条检索路径的倒数排名
    ``app.reranker``   bge-reranker-v2-m3 交叉编码器重排
    ``app.evidence``   证据规范化、去重和引用
    ``app.llm``        DeepSeek 客户端和提示词模板

在线部分直接适配离线部分已经产生的数据：读取现有 Milvus 字段，共享向量化工厂，
并在查询时推导语料标签（见 :mod:`app.corpus`），不要求入库阶段增加额外字段。
``app.main`` 将在线部分接入 FastAPI；离线部分由 ``scripts/ingest_to_milvus.py``
和 ``scripts/build_whoosh_index.py`` 驱动。
"""

__all__: list[str] = []
