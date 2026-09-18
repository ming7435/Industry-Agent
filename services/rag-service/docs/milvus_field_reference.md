# Milvus 字段表与集合说明（工业设备 RAG 离线入库）

> 适用管线：`services/rag-service/scripts/ingest_to_milvus.py` → `app/ingestion` → `app/chunk` → `app/embedding`(bge-m3) → `app/milvus/writer.py`
> 向量模型：BAAI/bge-m3，本地 `D:/models/bge-m3`，维度 **1024**
> 集合命名策略：**每个数据类别一个独立集合**（"分库"），在线检索跨 5 个集合并集检索。

---

## 一、集合总览（"表"）

所有集合使用**同一套字段结构**（见第二节），仅数据内容不同。集合由离线脚本 `writer.recreate_collection()` 自动建表，字段顺序与类型固定。

| # | 集合名 | 数据来源目录 | 内容 | 当前状态 |
|---|--------|--------------|------|----------|
| 1 | `industry_rag_alarm_codes` | `data/alarms/` | 纯故障报警码目录（无解决方案） | ✅ 已入库（文本切块） |
| 2 | `industry_rag_alarm_solutions` | `data/cases/` | 报警码 + 对应故障解决方案卡片 | ⏳ 入库中（后台任务 KyDCQr） |
| 3 | `industry_rag_bom` | `data/manuals/` | 三台机器 BOM（物料清单） | ⏳ 入库中 |
| 4 | `industry_rag_sop` | `data/sop/` | 多设备维修 SOP | ⏳ 入库中（11MB，耗时最长） |
| 5 | `industry_rag_drawings` | `data/cad/` | 3 台设备 2D/3D 图纸（89 张栅格图） | 🔧 待处理（需视觉识别） |

> 备注：
> - 在线检索读取 `settings.milvus_collection`（主集合，兜底值 `industry_rag_alarm_codes`）与 `settings.milvus_collections`（逗号分隔的 5 个集合名）。`DenseRetriever` 已改为对这 5 个集合分别 `search` 后按 `score` 归并取 top-k。
> - 历史残留集合 `industry_rag_chunks`（旧单库）已在本次干净入库时清掉。

---

## 二、字段明细（所有集合通用）

建表代码：`app/milvus/writer.py` 的 `recreate_collection()`。主键为 `id`，向量字段为 `vector`。

| 字段名 | 类型 | 长度/维度 | 是否必填 | 说明 |
|--------|------|-----------|----------|------|
| `id` | VARCHAR | 256 | 是（主键） | 整条向量的全局唯一 ID，离线写入时由 `(document_id + chunk_id)` 或内容哈希生成，用作 upsert 主键，保证重跑幂等。 |
| `chunk_id` | VARCHAR | 256 | 是 | 文档内 chunk 编号，标识"这是该文档切分出的第几块"，便于回溯与去重。 |
| `text` | VARCHAR | 65535 | 是 | chunk 的**纯文本内容**（文字/表格文本/图片经视觉模型生成的文字描述）。检索与 LLM 生成都基于它。 |
| `source_name` | VARCHAR | 512 | 是 | 原始文件名（如 `three_equipment_fault_code_catalog.pdf`）。 |
| `source_path` | VARCHAR | 2048 | 是 | 原始文件相对 `data/` 的路径（如 `alarms/three_equipment_fault_code_catalog.pdf`），用于结果溯源。 |
| `source_format` | VARCHAR | 32 | 是 | 源文件扩展名小写（`pdf` / `txt` / `docx` / `png` / `jpeg` / `jp2` / `dxf` / `step` 等）。 |
| `drawing_id` | VARCHAR | 128 | 否 | CAD 图纸 ID（图纸类数据专用，普通 PDF/文档为空）。 |
| `version_id` | VARCHAR | 128 | 否 | 图纸版本标签（由 `--version-label` 或文件名解析，普通文档为空）。 |
| `entity_id` | VARCHAR | 128 | 否 | CAD 实体 ID（解析 dxf/step 时填入，普通文档为空）。 |
| `project_id` | VARCHAR | 128 | 否 | 项目 ID（由 `--project-id` 注入），用于项目级隔离。 |
| `layer_name` | VARCHAR | 255 | 否 | CAD 图层名（图纸专用，普通文档为空）。 |
| `device_id` | VARCHAR | 128 | 否 | 设备 ID / 机型标识（如 `ELITE_CS612`、`TC820LTsi`、`LNS_QLServo80S2`），用于按设备过滤检索。 |
| `tenant_id` | VARCHAR | 128 | 否 | 租户 ID（多租户隔离，由 `--tenant-id` 注入）。 |
| `page_numbers_json` | VARCHAR | 2048 | 是 | JSON 数组字符串，记录该 chunk 在 PDF 中的页码，如 `"[3,4]"`；非 PDF 为空数组 `[]`。 |
| `chunk_type` | VARCHAR | 64 | 是 | chunk 类型标签：`text` / `table` / `image` / `cad` 等，用于按类型过滤与展示。 |
| `quality` | VARCHAR | 32 | 是 | 质量标记（如 `high` / `low` / `pending`）。图片未做视觉识别时为 `pending`。 |
| `contains_table` | BOOL | — | 是 | 该 chunk 是否包含表格。 |
| `contains_image` | BOOL | — | 是 | 该 chunk 是否包含图片。 |
| `contains_cad` | BOOL | — | 是 | 该 chunk 是否包含 CAD 内容。 |
| `metadata_json` | VARCHAR | 65535 | 是 | 任意扩展元数据（JSON 字符串），如设备型号、错误码、corpus 标签等；在线检索的 `corpus`/`device_model`/`error_code` 等过滤条件多从这里解析。 |
| `vector` | FLOAT_VECTOR | **1024** | 是 | bge-m3 生成的稠密向量，余弦相似度索引（AUTOINDEX），在线检索的匹配对象。 |

### 字段填充规则（按数据类型）

| 数据类型 | text | chunk_type | contains_* | 关键字段 |
|----------|------|-----------|------------|----------|
| PDF/文档（无视觉） | 抽取的文字/表格文本 | `text` / `table` | 按内容置位 | `source_name`, `page_numbers_json` |
| PDF 内嵌图（带 `--vision`） | 视觉模型生成的图文描述 | `image` | `contains_image=true` | `quality`（识别成功=high，失败=pending） |
| 图纸栅格图（带 `--vision`） | Qwen-VL 识别出的结构/参数/标注 | `image`/`cad` | `contains_image=true` | `device_id`, `drawing_id`, `quality` |
| CAD 矢量（dxf/step，解析后） | 实体/属性文本 | `cad` | `contains_cad=true` | `entity_id`, `layer_name` |

---

## 三、在线检索如何使用这些字段

`app/milvus/retriever.py` 的 `DenseRetriever`：

1. 用 bge-m3 把用户问句编码为 1024 维向量；
2. 对 `collection_names`（5 个集合）**逐个**执行 `client.search(vector, top_k, filter, output_fields)`；
3. 合并所有命中，按 `score`（余弦相似度）降序排序，截取 `dense_top_k`；
4. 回读字段：`chunk_id`, `text`, `source_name`, `source_path`, `source_format`, `page_numbers_json`, `chunk_type`, `quality`, `contains_table/image/cad`, `metadata_json`；
5. 由 `app.corpus.infer_corpus()` 从 `source_name/source_path/metadata_json` 推导出 `corpus`（数据类别标签）与 `device_model`，附到 `Hit.metadata` 供证据与引用展示。

> 可下推到 Milvus 的过滤字段（`_FILTERABLE_FIELDS`）：`source_name`, `source_format`, `chunk_type`, `quality`。
> 其余过滤（`corpus`/`device_model`/`error_code`）在 Python 层对 `metadata_json` 做后置过滤。

---

## 四、重要状态与待办

- ⚠️ **视觉识别（`--vision`）当前会卡死**：`--vision` 模式启用 pymupdf 版面分析定位嵌图，在这些 PDF 上极慢/挂死；单张图纸直传 Qwen-VL 正常。故 PDF 暂以**无视觉**入库（文字/表格不受影响，仅 PDF 内嵌图暂为占位）。
- 🔧 **图纸集合 `industry_rag_drawings` 待处理**：89 张栅格图需逐个调用 Qwen-VL（`qwen3-vl-32b-thinking` 为思考模型，单图较慢，客户端 90s 超时）。待确定稳妥批处理方案后再入库。
- ✅ 已完成：5 集合架构、在线跨集合检索改造、4 本 PDF 的干净分库入库（后台进行中）。
