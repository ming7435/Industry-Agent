# RAG 服务（工业维修）

一个服务包含在线和离线两部分；两部分共享同一个配置文件（`config/settings.py`）和同一份依赖列表：

| 部分 | 职责 | 入口 |
| --- | --- | --- |
| **离线** | 解析 -> 清洗 -> 分块 -> 嵌入（SiliconFlow BGE-M3）-> 写入类型化 Milvus 集合 + MySQL 清单 + Whoosh BM25 索引 | `scripts/ingest_to_milvus.py`, `scripts/build_whoosh_index.py` |
| **在线** | BM25 + 稠密检索 -> RRF 融合 -> SiliconFlow 重排 -> 证据与引用 -> DeepSeek 生成 | `app/main.py`（`uvicorn app.main:app`） |

在线部分会适配离线部分已经产出的数据，不需要修改 schema，也不需要重新入库：

* 类型化 Milvus 集合由项目数据目录推导，例如 `data/alarms` -> `industry_rag_alarm_codes`、`data/sop` -> `industry_rag_sop`、`data/cad` -> `industry_rag_drawings`，metadata 列只作为细化过滤层；
* 使用同一个嵌入器工厂（`app.embedding.model.get_embedder`），因此文档和查询共享同一组权重；
* 语料标签（`alarms` / `cases` / `manuals` / `sop`）由 `app/corpus.py` 在读取时根据 `source_name` / `source_path` / `metadata_json` 推导，即使集合在这段代码出现前已经入库，也能正确分组；
* BM25 索引从同一批行构建，每个类型化集合对应一个 Whoosh 子索引（`scripts/build_whoosh_index.py`）。

```
文档（PDF/DOCX/XLSX/CSV/TXT/MD/图片/CAD）
        │  app.ingestion → app.clean → app.chunk → app.embedding
        ├──────────────► Milvus  类型化集合  ─► 稠密路线  (app.milvus.retriever)
        ├──────────────► Whoosh  类型化索引  ─► BM25 路线  (app.whoosh.retriever)
        └──────────────► MySQL   元数据      ──► 入库台账
                                                  │
        查询 ──► BM25 ┐                           │
                       ├─► RRF ─► 重排 ─► 证据 ─► DeepSeek ─► 答案
                稠密 ─┘
```

## 目录结构

```
config/settings.py      合并后的配置（在线预算 + 离线存储），唯一配置来源
app/ingestion/          多格式解析器（PDF/VL、DOCX、XLSX、CSV、TXT/MD、图片、DWG/DXF）
app/clean/              模板内容移除、块质量评分
app/chunk/              面向检索的分块
app/embedding/          SiliconFlow BGE-M3 客户端、分块流水线和共享嵌入器工厂
app/milvus/             集合 schema + 写入器（离线）以及 DenseRetriever/Hit（在线）
app/mysql/              文档 / 分块元数据表
app/whoosh/             索引 schema + 构建器（离线）以及 BM25Retriever（在线）
app/fusion/             倒数排名融合
app/reranker/           SiliconFlow bge-reranker-v2-m3 客户端
app/evidence/           证据分组、去重和引用
app/llm/                DeepSeek 客户端和提示词
app/corpus.py           在线读取时从离线字段推导语料标签
app/api/                请求模型、单例装配、编排和路由
scripts/                离线入口
tests/                  离线单元测试（不需要网络、GPU 或 Milvus）
```

## 环境准备

```bash
pip install -r requirements.txt
cp .env.example .env      # 然后填写 SILICONFLOW_API_KEY、DEEPSEEK_API_KEY，可选填写 MySQL / Qwen-VL
```

## 离线：构建索引

```bash
# 1) 解析 + 嵌入 + 写入类型化 Milvus 集合、MySQL 清单，以及匹配的 Whoosh BM25 子索引。
#    默认值来自 .env。
python scripts/ingest_to_milvus.py

# 2) 从头重建类型化向量集合；首次成功写入文档时也会重建每个集合的 Whoosh 子索引。
python scripts/ingest_to_milvus.py --drop-collection

# 3) 仅从已有 Milvus 集合重建 BM25 索引
python scripts/build_whoosh_index.py --all-configured
python scripts/build_whoosh_index.py --collection industry_rag_alarm_codes
python scripts/build_whoosh_index.py --index-dir data/index/whoosh  # 基础目录；写入 data/index/whoosh/<collection>

# 常用参数
python scripts/ingest_to_milvus.py --data-dir data/SHUJU
python scripts/ingest_to_milvus.py --vision            # 对图片 / 扫描页使用 Qwen-VL
python scripts/ingest_to_milvus.py --local-ocr         # 使用本地 OCR 替代 Qwen-VL
python scripts/ingest_to_milvus.py --no-mysql          # 跳过 MySQL 台账
python scripts/ingest_to_milvus.py --no-whoosh         # 跳过 BM25 索引更新
python scripts/ingest_to_milvus.py --drop-all-collections  # 仅用于本地一次性存储
```

离线入库会先根据项目数据目录，再根据近似手册类语料的文件名关键词，把每个受支持文档写入类型化 Milvus 集合。这样报警、案例、SOP、BOM、CAD/图纸和手册会在物理上分离，同时仍写入通用 metadata 字段用于可选过滤。

### 在线侧如何读取离线数据

语料标签（`alarms` / `cases` / `manuals` / `sop`）在离线索引时可写入；缺失时也可以在在线侧兜底推导：`app/corpus.py` 会先读取 `metadata_json["corpus"]`，再读取 `source_path` 的父目录，再从 `source_name` 中匹配关键词（例如 `..._报警码数据.pdf` -> `alarms`），最后回退到 `DEFAULT_CORPUS`。该标签会写入 `hit.metadata["corpus"]`，证据层据此对引用分组。`source_name`、`source_format`、`corpus`、`device_model`、`error_code`、`project_id`、`tenant_id`、`device_id`、`chunk_type`、`quality` 等过滤条件会在字段存在时下推到 Milvus / Whoosh；其他 metadata 键保留为 Python 侧细化过滤。

## 在线：运行 API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
# 或：python -m app.main
```

`POST /search`

```json
{
  "query": "注塑机报 E-204 液压压力低，怎么处理？",
  "filters": {"corpus": "manuals", "device_model": "TC820LTYsi"},
  "top_n": 5
}
```

返回 `hits`、`evidence_text`、`answer`、`degraded`、`degrade_reason`，以及 `latency_ms` 明细（`bm25`、`dense`、`fusion`、`rerank`、`llm`、`total`）。

`GET /health` 报告 `milvus`、`whoosh`、`embedding`、`reranker`、`llm`。

### 降级

每个阶段都有独立预算，且不会拖垮整个请求。失败会报告为 `degraded: true`，并带上以下原因之一：`request_timeout`、`all_retrievers_failed`、`dense_timeout`、`bm25_timeout`、`embedding_unavailable`、`milvus_unavailable`、`whoosh_unavailable`、`rerank_timeout`、`reranker_unavailable`、`llm_timeout`。只有检索层完全不可用（两条路线都无法构建）时，才返回 `503 {"error": "all_dependencies_unavailable"}`。

注意：保持 `REQUEST_TIMEOUT_MS` 大于 `LLM_TIMEOUT_MS`，否则请求预算会截断生成，导致 `answer` 始终为空。

## 测试

```bash
pytest            # 离线单元测试，不需要外部服务
```

`RAG_OFFLINE_PIPELINE_SUMMARY.md` 详细记录离线流水线。
