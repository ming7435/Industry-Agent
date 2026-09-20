# Milvus 字段表与集合说明（工业设备 RAG 离线入库）

> 适用管线：`services/rag-service/scripts/ingest_to_milvus.py` → `app/ingestion` → `app/chunk` → `app/embedding`(bge-m3) → `app/milvus/writer.py`
> 向量模型：BAAI/bge-m3，维度 **1024**
> 集合命名策略：按项目 `data/` 下的业务类型分库；metadata 只作辅助过滤，不承担主要隔离职责。

---

## 一、集合总览

| 数据目录 | 标准 collection | 内容 |
|----------|-----------------|------|
| `data/alarms/` | `industry_rag_alarm_codes` | 故障报警码目录 |
| `data/cases/` | `industry_rag_alarm_solutions` | 报警码卡片、故障案例与解决方案 |
| `data/manuals/` | `industry_rag_manuals` | 通用设备手册、维护资料 |
| `data/manuals/` 中文件名含 `BOM` | `industry_rag_bom` | 物料清单、部件信息 |
| `data/manuals/` 中文件名含 `SOP` | `industry_rag_sop` | 作业指导与操作流程 |
| `data/manuals/` 中文件名含 `保养维护` | `industry_rag_maintenance` | 保养维护资料 |
| `data/manuals/` 中文件名含 `安全规程` | `industry_rag_safety_rules` | 安全规程资料 |
| `data/manuals/` 中文件名含 `故障诊断` | `industry_rag_troubleshooting` | 故障诊断手册 |
| `data/cad/` | `industry_rag_drawings` | CAD、图纸、图纸图片与识别结果 |

路由优先级：

1. `data/` 下的一级业务目录；
2. `manuals/` 目录内的文件名业务关键词；
3. 无法识别时使用 `MILVUS_COLLECTION` 兜底集合。

`MILVUS_COLLECTIONS` 应列出实际存在、允许在线检索的集合。不存在的 collection 会导致 dense health 检查失败，因此不要把尚未入库的集合写入生产配置。

---

## 二、字段明细

所有类型 collection 使用同一套 schema，建表代码为 `app/milvus/writer.py` 的 `recreate_collection()`。

| 字段名 | 类型 | 长度/维度 | 是否必填 | 说明 |
|--------|------|-----------|----------|------|
| `id` | VARCHAR | 256 | 是（主键） | 向量记录全局唯一 ID，支持 upsert 幂等。 |
| `chunk_id` | VARCHAR | 256 | 是 | chunk 标识，便于回溯与去重。 |
| `text` | VARCHAR | 65535 | 是 | chunk 纯文本。 |
| `source_name` | VARCHAR | 512 | 是 | 原始文件名。 |
| `source_path` | VARCHAR | 2048 | 是 | 原始文件路径，用于溯源。 |
| `source_format` | VARCHAR | 32 | 是 | `pdf` / `txt` / `docx` / `png` / `dxf` / `step` 等。 |
| `corpus` | VARCHAR | 64 | 是 | `alarms` / `cases` / `manuals` / `sop` 等辅助标签。 |
| `device_model` | VARCHAR | 128 | 否 | 设备型号。 |
| `error_code` | VARCHAR | 128 | 否 | 报警码 / 故障码。 |
| `drawing_id` | VARCHAR | 128 | 否 | CAD 图纸 ID。 |
| `version_id` | VARCHAR | 128 | 否 | 图纸版本。 |
| `entity_id` | VARCHAR | 128 | 否 | CAD 实体 ID。 |
| `project_id` | VARCHAR | 128 | 否 | 项目 ID。 |
| `layer_name` | VARCHAR | 255 | 否 | CAD 图层名。 |
| `device_id` | VARCHAR | 128 | 否 | 设备 ID。 |
| `tenant_id` | VARCHAR | 128 | 否 | 租户 ID。 |
| `page_numbers_json` | VARCHAR | 2048 | 是 | 页码 JSON 数组。 |
| `chunk_type` | VARCHAR | 64 | 是 | `text` / `table` / `image` / `cad` 等。 |
| `quality` | VARCHAR | 32 | 是 | `high` / `medium` / `low` 等。 |
| `contains_table` | BOOL | — | 是 | 是否含表格。 |
| `contains_image` | BOOL | — | 是 | 是否含图片。 |
| `contains_cad` | BOOL | — | 是 | 是否含 CAD。 |
| `metadata_json` | VARCHAR | 65535 | 是 | 完整扩展元数据。 |
| `vector` | FLOAT_VECTOR | **1024** | 是 | bge-m3 向量，COSINE + AUTOINDEX。 |

---

## 三、在线检索策略

`DenseRetriever` 默认通过 `MILVUS_COLLECTIONS` 对类型库 fan-out 检索，再按相似度合并；业务路由可在上层优先选择目标 collection：

- 报警码问题：`industry_rag_alarm_codes`
- 报警解决方案 / 故障案例：`industry_rag_alarm_solutions`
- SOP 问题：`industry_rag_sop`
- BOM / 零件问题：`industry_rag_bom`
- CAD / 图纸问题：`industry_rag_drawings`
- 通用手册：`industry_rag_manuals`

metadata 过滤用于设备、项目、租户、版本、错误码等二级约束；不能替代 collection 级业务隔离。

Whoosh BM25 需要为每个 collection 构建索引，不能用一个 collection 的重建命令覆盖另一个 collection 的词法索引。

---

## 四、离线命令

首次完整重建类型库：

```powershell
cd C:\Users\Lenovo\Desktop\Agent\industry_agent\services\rag-service
python scripts\ingest_to_milvus.py --drop-collection
```

`--drop-collection` 会删除本次数据目录实际涉及的类型 collection，然后重新创建并写入。若要清空 Docker Milvus 中全部 collection，仅在确认是本地 disposable 环境时使用：

```powershell
python scripts\ingest_to_milvus.py --drop-all-collections
```

单独重建某个 BM25 索引时，必须指定对应的独立 index 目录，例如：

```powershell
python scripts\build_whoosh_index.py `
  --collection industry_rag_alarm_codes `
  --index-dir C:\Users\Lenovo\Desktop\Agent\industry_agent\services\rag-service\data\index\whoosh\alarm_codes
```
