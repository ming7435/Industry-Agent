# RAG 服务（工业运维）

一个服务包含两个部分，共享同一份配置文件（`config/settings.py`）和依赖清单：

| 部分 | 功能 | 入口 |
| --- | --- | --- |
| **离线** | 解析 → 清洗 → 分块 → 向量化（SiliconFlow BGE-M3）→ 写入类型化 Milvus 集合、MySQL 清单和 Whoosh BM25 索引 | `scripts/ingest_to_milvus.py`、`scripts/build_whoosh_index.py` |
| **在线** | BM25 + 稠密检索 → RRF 融合 → SiliconFlow 重排 → 证据与引用 → DeepSeek 生成 | `app/main.py`（`uvicorn app.main:app`） |

在线部分适配离线部分已经产生的数据，不改模式，也不要求重新入库：

* 根据项目数据布局生成的类型化 Milvus 集合（例如
  `data/alarms` -> `industry_rag_alarm_codes`, `data/sop` -> `industry_rag_sop`），
  元数据列只作为细化筛选层使用；
* 使用同一个向量化工厂（`app.embedding.model.get_embedder`），确保文档和查询共享同一组权重；
* 语料标签（`alarms` / `cases` / `manuals` / `sop`）在读取时由
  `app/corpus.py` 根据 `source_name` / `source_path` / `metadata_json` 推导，
  因此即使集合是在本代码存在之前入库的，也能正确分组；
* BM25 索引使用相同记录构建，每个类型化集合对应一个索引
  （`scripts/build_whoosh_index.py`）。

```
documents (PDF/DOCX/XLSX/CSV/TXT/MD/images)
        │  app.ingestion → app.clean → app.chunk → app.embedding
        ├──────────────► Milvus  typed collections ─► dense route  (app.milvus.retriever)
        ├──────────────► Whoosh  typed indexes      ─► BM25  route  (app.whoosh.retriever)
        └──────────────► MySQL   metadata    ──► ingestion bookkeeping
                                                  │
        query ──► BM25 ┐                          │
                       ├─► RRF ─► rerank ─► evidence ─► DeepSeek ─► answer
                dense ─┘
```

## 目录布局

```
config/settings.py      合并后的配置（在线预算 + 离线存储）——唯一配置来源
app/ingestion/          多格式解析器（PDF/VL、DOCX、XLSX、CSV、TXT/MD、图片）
app/clean/              模板内容移除、块质量评分
app/chunk/              面向检索的分块
app/embedding/          SiliconFlow BGE-M3 客户端、分块流水线和共享向量化工厂
app/milvus/             集合模式 + 写入器（离线）以及 DenseRetriever/Hit（在线）
app/mysql/              文档/分块元数据表
app/whoosh/             索引模式 + 构建器（离线）以及 BM25Retriever（在线）
app/fusion/             倒数排名融合
app/reranker/           SiliconFlow bge-reranker-v2-m3 客户端
app/evidence/           证据分组、去重和引用
app/llm/                DeepSeek 客户端和提示词
app/corpus.py            在读取时根据离线字段推导语料标签（在线）
app/api/                请求模型、单例装配、编排和路由
scripts/                离线入口
 tests/                  离线单元测试（不需要网络、GPU 或 Milvus）
```

## 安装配置

```bash
pip install -r requirements.txt
copy ..\..\.env.example ..\..\.env   # PowerShell 可使用 Copy-Item
# 然后在仓库根目录 .env 中填写 DEEPSEEK_API_KEY；向量/重排和视觉能力按需填写 SiliconFlow 密钥
```

## 离线：构建索引

```bash
# 1) 创建或打开 industry_agent 数据库，然后解析、向量化并写入类型化 Milvus 集合、MySQL 清单和对应的 Whoosh BM25 子索引。
#    参数默认从 .env 读取。
python scripts/ingest_to_milvus.py

# 2) 仅根据已有 Milvus 集合重建 BM25 索引
python scripts/build_whoosh_index.py --all-configured
python scripts/build_whoosh_index.py --collection industry_rag_alarm_codes
python scripts/build_whoosh_index.py --index-dir data/index/whoosh  # 基础目录；将在其中写入 data/index/whoosh/<collection>

# 常用参数
python scripts/ingest_to_milvus.py --data-dir data
```

离线入库只根据 `RAG_DATA_DIR` 下的第一级目录，将每份支持的文档写入类型化 Milvus 集合。这样可以在仍写入通用元数据字段以便可选筛选的同时，在物理上分离 alarms、cases、SOP 和 manuals。相同的目录推导集合列表会驱动在线稠密检索和 BM25 的扇出，不需要手工维护集合列表环境变量。

### 在线侧如何读取离线数据

语料标签（`alarms` / `cases` / `manuals` / `sop`）在离线索引阶段可用时会写入，也可以在在线侧作为后备逻辑**推导**：`app/corpus.py` 首先查看 `metadata_json["corpus"]`，然后查看 `source_path` 的父目录，再查看 `source_name` 中的关键词（`..._报警码数据.pdf` -> `alarms`），最后使用 `DEFAULT_CORPUS`。标签会写入 `hit.metadata["corpus"]`，证据层据此对引用进行分组。当字段存在时，`source_name`、`source_format`、`corpus`、`device_model`、`error_code`、`project_id`、`tenant_id`、`device_id`、`chunk_type` 和 `quality` 等筛选条件会下推到 Milvus / Whoosh；其他元数据键仍由 Python 侧细化处理。

## 在线：运行 API

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

返回 `hits`、`evidence_text`、`answer`、`degraded`、`degrade_reason`，以及包含 `bm25`、`dense`、`fusion`、`rerank`、`llm`、`total` 的 `latency_ms` 延迟分解。

`GET /health` 会报告 `milvus`、`whoosh`、`embedding`、`reranker` 和 `llm` 的状态。

### Degradation

每个阶段都有自己的预算，且不会直接导致请求失败。失败会以 `degraded: true` 以及下列原因之一报告：`request_timeout`、`all_retrievers_failed`、`dense_timeout`、`bm25_timeout`、`embedding_unavailable`、`milvus_unavailable`、`whoosh_unavailable`、`rerank_timeout`、`reranker_unavailable`、`llm_timeout`。只有整个检索层完全不可用（两条路由都无法构建）时，才会返回 `503 {"error": "all_dependencies_unavailable"}`。

注意：`REQUEST_TIMEOUT_MS` 必须大于 `LLM_TIMEOUT_MS`，否则请求预算会截断生成，`answer` 始终为空。

## Tests

```bash
pytest            # 离线单元测试，不需要外部服务
```
