# RAG service (industrial maintenance)

One service, two halves that share a single configuration file
(`config/settings.py`) and a single dependency list:

| half | what it does | entry point |
| --- | --- | --- |
| **offline** | parse -> clean -> chunk -> embed (SiliconFlow BGE-M3) -> write typed Milvus collections + MySQL manifest + Whoosh BM25 index | `scripts/ingest_to_milvus.py`, `scripts/build_whoosh_index.py` |
| **online** | BM25 + dense retrieval -> RRF fusion -> SiliconFlow rerank -> evidence & citations -> DeepSeek generation | `app/main.py` (`uvicorn app.main:app`) |

The online half adapts to the data the offline half already produces -- no
schema change, no re-ingestion:

* typed Milvus collections derived from the project data layout (for example
  `data/alarms` -> `industry_rag_alarm_codes`, `data/sop` -> `industry_rag_sop`,
  `data/cad` -> `industry_rag_drawings`), with metadata columns used only as a
  refinement layer;
* the same embedder factory (`app.embedding.model.get_embedder`), so documents and
  queries share one set of weights;
* the corpus label (`alarms` / `cases` / `manuals` / `sop`) is **derived at read
  time** by `app/corpus.py` from `source_name` / `source_path` / `metadata_json`,
  so even a collection ingested before this code existed is grouped correctly;
* the BM25 index is built from the same rows, one Whoosh sub-index per typed
  collection (`scripts/build_whoosh_index.py`).

```
documents (PDF/DOCX/XLSX/CSV/TXT/MD/images/CAD)
        │  app.ingestion → app.clean → app.chunk → app.embedding
        ├──────────────► Milvus  typed collections ─► dense route  (app.milvus.retriever)
        ├──────────────► Whoosh  typed indexes      ─► BM25  route  (app.whoosh.retriever)
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
app/embedding/          SiliconFlow BGE-M3 client, chunk pipeline, and shared embedder factory
app/milvus/             collection schema + writer (offline) and DenseRetriever/Hit (online)
app/mysql/              document / chunk metadata tables
app/whoosh/             index schema + builder (offline) and BM25Retriever (online)
app/fusion/             reciprocal rank fusion
app/reranker/           SiliconFlow bge-reranker-v2-m3 client
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
cp .env.example .env      # then fill in SILICONFLOW_API_KEY, DEEPSEEK_API_KEY and, optionally, MySQL / SiliconFlow vision
```

## Offline: build the indexes

```bash
# 1) create/open the industry_agent databases, then parse + embed + write
#    typed Milvus collections, MySQL manifest, and matching Whoosh BM25
#    sub-indexes. Values default from .env.
python scripts/ingest_to_milvus.py

# 2) only rebuild BM25 indexes from existing Milvus collections
python scripts/build_whoosh_index.py --all-configured
python scripts/build_whoosh_index.py --collection industry_rag_alarm_codes
python scripts/build_whoosh_index.py --index-dir data/index/whoosh  # base dir; writes data/index/whoosh/<collection>

# useful flags
python scripts/ingest_to_milvus.py --data-dir data
```

Offline ingestion writes each supported document into a typed Milvus collection
based only on its first-level directory under `RAG_DATA_DIR`. This keeps alarms,
cases, SOP, CAD/drawings and manuals physically separated while still writing
common metadata fields for optional filtering. The same directory-derived
collection list drives the online dense and BM25 fan-out; there is no manual
collection-list environment variable.

### How the online side reads the offline data

Corpus labels (`alarms` / `cases` / `manuals` / `sop`) are written during
offline indexing when available and can still be **derived online** as a fallback:
`app/corpus.py` looks at `metadata_json["corpus"]` first, then the parent directory
of `source_path`, then a keyword in `source_name` (`..._报警码数据.pdf` ->
`alarms`), then `DEFAULT_CORPUS`. The label lands in `hit.metadata["corpus"]` and
is what the evidence layer groups citations by. Filters such as `source_name`,
`source_format`, `corpus`, `device_model`, `error_code`, `project_id`, `tenant_id`,
`device_id`, `chunk_type` and `quality` are pushed down to Milvus / Whoosh when the
field exists; other metadata keys remain Python-side refinements.

## Online: run the API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
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
