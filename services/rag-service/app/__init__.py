"""工业维护 RAG 服务：一个包内包含在线与离线两部分。

离线部分（``scripts/`` 以及下面的包）
    ``app.ingestion``  解析 PDF / DOCX / XLSX / CSV / TXT / MD / 图片 / CAD
    ``app.clean``      去除模板噪声和低价值块
    ``app.chunk``      将清洗后的块组合为可检索分块
    ``app.embedding``  为分块和在线查询生成 bge-m3 向量
    ``app.milvus``     创建集合并写入向量
    ``app.mysql``      维护文档/分块元数据和入库记录
    ``app.whoosh``     构建词法检索路径读取的 BM25 索引

在线部分
    ``app.corpus``     在读取时从离线字段派生 corpus 标签
    ``app.api``        请求模型、单例装配、编排和路由
    ``app.fusion``     对两条检索路径做倒数排名融合
    ``app.reranker``   使用 bge-reranker-v2-m3 交叉编码器重排
    ``app.evidence``   证据归一化、去重和引用
    ``app.llm``        DeepSeek-v4-Flash 客户端和提示词模板

在线部分会适配离线部分已经产出的数据：它读取现有 Milvus 字段，共用嵌入器工厂，并在查询时派生 corpus 标签（参见 :mod:`app.corpus`），而不是要求入库流程写入额外字段。``app.main`` 将在线部分接入 FastAPI；离线部分由 ``scripts/ingest_to_milvus.py`` 和 ``scripts/build_whoosh_index.py`` 驱动。
"""

__all__: list[str] = []
