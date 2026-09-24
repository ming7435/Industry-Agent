"""Industrial-maintenance RAG service -- one package, two halves.

Offline half (``scripts/`` + the packages below)
    ``app.ingestion``  parse PDF / DOCX / XLSX / CSV / TXT / MD / images
    ``app.clean``      drop boilerplate and low-value blocks
    ``app.chunk``      group cleaned blocks into retrieval-ready chunks
    ``app.embedding``  bge-m3 vectors for chunks **and** for online queries
    ``app.milvus``     create the collection and insert the vectors
    ``app.mysql``      document / chunk metadata and ingestion bookkeeping
    ``app.whoosh``     build the BM25 index the lexical route reads

Online half
    ``app.corpus``     derive the corpus label from the offline fields at read time
    ``app.api``        request models, singleton wiring, orchestration, routes
    ``app.fusion``     reciprocal rank fusion over the two retrieval routes
    ``app.reranker``   bge-reranker-v2-m3 cross-encoder reranking
    ``app.evidence``   evidence normalisation, de-duplication, citations
    ``app.llm``        DeepSeek-v4-Flash client and prompt templates

The online half adapts to the data the offline half already produces: it reads
the existing Milvus columns, shares the embedder factory, and derives the corpus
label at query time (see :mod:`app.corpus`) instead of asking ingestion to write
extra fields. ``app.main`` wires the online half into FastAPI; the offline half
is driven by ``scripts/ingest_to_milvus.py`` and
``scripts/build_whoosh_index.py``.
"""

__all__: list[str] = []
