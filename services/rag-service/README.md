# RAG service (industrial maintenance)

One service, two halves that share a single configuration file
(`config/settings.py`) and a single dependency list:

| half | what it does | entry point |
| --- | --- | --- |
| **offline** | parse -> clean -> chunk -> embed (bge-m3) -> write Milvus + MySQL + Whoosh | `scripts/ingest_to_milvus.py`, `scripts/build_whoosh_index.py` |
| **online** | BM25 + dense retrieval -> RRF fusion -> bge-reranker-v2-m3 -> evidence & citations -> DeepSeek generation | `app/main.py` (`uvicorn app.main:app`) |

The online half adapts to the data the offline half already produces -- no
schema change, no re-ingestion:

* the same Milvus collection (`settings.milvus_collection`, default
  `industry_rag_chunks`, the offline writer's default);
* the same embedder factory (`app.embedding.model.get_embedder`), so documents and
  queries share one set of weights;
* the corpus label (`alarms` / `cases` / `manuals` / `sop`) is **derived at read
  time** by `app/corpus.py` from `source_name` / `source_path` / `metadata_json`,
  so even a collection ingested before this code existed is grouped correctly;
* the BM25 index is built from the same rows (`scripts/build_whoosh_index.py`).

```
documents (PDF/DOCX/XLSX/CSV/TXT/MD/images/CAD)
        │  app.ingestion → app.clean → app.chunk → app.embedding
        ├──────────────► Milvus  collection  ──► dense route  (app.milvus.retriever)
        ├──────────────► Whoosh  index       ──► BM25  route  (app.whoosh.retriever)
        └──────────────► MySQL   metadata    ──► ingestion bookkeeping
                                                  │
        query ──► BM25 ┐                          │
                       ├─► RRF ─► rerank ─► evidence ─► DeepSeek ─► answer
                dense ─┘
```

## Layout

```
config/settings.py      merged settings (online budgets + offline stores) — the only config source
app/ingestion/          multi-format parsers (PDF/VL, DOCX, XLSX, CSV, TXT/MD, images, DWG/DXF)
app/clean/              boilerplate removal, block quality scoring
app/chunk/              retrieval-ready chunking
app/embedding/          bge-m3 client, chunk pipeline, and the shared embedder factory
app/milvus/             collection schema + writer (offline) and DenseRetriever/Hit (online)
app/mysql/              document / chunk metadata tables
app/whoosh/             index schema + builder (offline) and BM25Retriever (online)
app/fusion/             reciprocal rank fusion
app/reranker/           bge-reranker-v2-m3
app/evidence/           evidence grouping, de-duplication, citations
app/llm/                DeepSeek client and prompts
app/corpus.py            corpus label derived at read time from the offline fields (online)
app/api/                request models, singleton wiring, orchestration, routes
scripts/                offline entry points
tests/                  offline unit tests (no network, no GPU, no Milvus required)
```

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env      # then fill in DEEPSEEK_API_KEY and, optionally, MySQL / Qwen-VL
```

## Offline: build the indexes

```bash
# 1) parse + embed + write Milvus, MySQL and the Whoosh BM25 index
python scripts/ingest_to_milvus.py --data-dir data/SHUJU

# 2) only rebuild the BM25 index (e.g. after ingesting with --no-whoosh)
python scripts/build_whoosh_index.py

# useful flags
python scripts/ingest_to_milvus.py --vision            # Qwen-VL for images / scanned pages
python scripts/ingest_to_milvus.py --no-mysql          # skip MySQL bookkeeping
python scripts/ingest_to_milvus.py --drop-all-collections
python scripts/ingest_to_milvus.py --collection-per-document   # one collection per file
```

### How the online side reads the offline data

Corpus labels (`alarms` / `cases` / `manuals` / `sop`) are **derived online**,
not written offline: `app/corpus.py` looks at `metadata_json["corpus"]` first,
then the parent directory of `source_path`, then a keyword in `source_name`
(`..._报警码数据.pdf` -> `alarms`), then `DEFAULT_CORPUS`. The label lands in
`hit.metadata["corpus"]` and is what the evidence layer groups citations by.
Filters follow the same split: `source_name` / `source_format` / `chunk_type` /
`quality` are real Milvus columns and are pushed down, `corpus` /
`device_model` / `error_code` are applied in Python on the metadata.

Ingesting into a different collection is just `MILVUS_COLLECTION=<name>` plus
`--collection <name>`; nothing else needs to change.

## Online: run the API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
# or: python -m app.main
```

`POST /search`

```json
{
  "query": "注塑机报 E-204 液压压力低，怎么处理？",
  "filters": {"corpus": "manuals", "device_model": "TC820LTYsi"},
  "top_n": 5
}
```

returns `hits`, `evidence_text`, `answer`, `degraded`, `degrade_reason` and a
`latency_ms` breakdown (`bm25`, `dense`, `fusion`, `rerank`, `llm`, `total`).

`GET /health` reports `milvus`, `whoosh`, `embedding`, `reranker`, `llm`.

### Degradation

Every stage has its own budget and never takes the request down. A failure is
reported as `degraded: true` plus one of
`request_timeout`, `all_retrievers_failed`, `dense_timeout`, `bm25_timeout`,
`embedding_unavailable`, `milvus_unavailable`, `whoosh_unavailable`,
`rerank_timeout`, `reranker_unavailable`, `llm_timeout`. Only a completely
unusable retrieval layer (neither route constructible) answers
`503 {"error": "all_dependencies_unavailable"}`.

Note: keep `REQUEST_TIMEOUT_MS` larger than `LLM_TIMEOUT_MS`, otherwise the
request budget truncates generation and `answer` is always empty.

## Tests

```bash
pytest            # offline unit tests, no external services needed
```

`RAG_OFFLINE_PIPELINE_SUMMARY.md` documents the offline pipeline in detail.
