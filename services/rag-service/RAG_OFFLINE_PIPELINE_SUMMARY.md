# 工业多格式离线 RAG 入库流程总结

> 本文档原以工业 PDF 为主线编写，现已扩展为统一多格式离线入库流程。PDF 继续使用原有的复杂版面解析逻辑，其他格式通过各自解析器转换为同一个 `StructuredDocument`，后续统一经过清洗、切块、BGE-M3 向量化和 Milvus 入库。

## 当前支持矩阵

| 格式 | 解析方式 | 后续链路 |
| --- | --- | --- |
| PDF | PyMuPDF，支持文本、表格、图片、扫描页、CAD 图纸页 | 完整支持 |
| TXT | 编码自动回退、段落解析 | 完整支持 |
| Markdown | 标题、段落、表格、本地图片引用 | 完整支持 |
| DOCX | `python-docx`，段落、标题、表格、内嵌图片 | 完整支持 |
| CSV | Python `csv`，行列转语义表格 | 完整支持 |
| XLSX | `openpyxl`，按工作表转表格页 | 完整支持 |
| PNG/JPG/TIFF/BMP/WEBP | 图片资产读取，可选 SiliconFlow 视觉模型描述 | 完整支持 |
| DXF | `ezdxf`，图层、文字、尺寸、块、实体统计 | 完整支持 |
| DWG | ODA File Converter 转临时 DXF，再由 `ezdxf` 解析 | 需安装外部转换器 |

## 1. 总体目标

本离线 RAG 流程用于处理复杂工业 PDF 文档，并将文档内容转化为可检索的向量数据写入 Milvus。目标文档可能同时包含：

- 正文说明
- 表格数据
- 图片
- CAD 图纸
- 尺寸标注
- 零件编号
- 扫描页
- 多栏排版

因此，本流程不是简单地把 PDF 按固定长度切开，而是采用“结构化解析 + 清洗 + 结构感知语义切块 + BGE-M3 向量化 + 按业务类型拆分 Milvus collection + Whoosh BM25 同步分索引”的方式，尽量保留工业文档中的结构、语义和来源信息。

完整链路如下：

```text
读取本地源文件
  -> MySQL rag_documents 预登记 processing
  -> 可选 MinIO/S3 原始文件存储并回写对象 URI/ETag/版本
  -> PDF / 多格式 / DXF 结构化解析
  -> StructuredDocument 结构化文档
  -> DXF/DWG drawing/version/layer/entity/annotation/relations
  -> clean 清洗
  -> chunk 结构感知语义切块
  -> BGE-M3 本地向量化
  -> MySQL rag_chunks 元数据
  -> Milvus CAD-aware 语义向量
```

对于 CAD 文件，三个存储层通过稳定标识关联：

```text
原始文件
  -> document_id
  -> drawing_id
  -> version_id
  -> entity_id
  -> chunk_id
  -> Milvus primary key
```

MinIO/S3 保存原始文件及其对象版本信息；MySQL 保存可审计的文件、图纸版本、图层、实体、文字标注和关系事实；Milvus 只保存适合语义召回的 chunk 向量及其过滤字段。当前 `same_device_id` 关系来自可解释的文字或块标注，不代表空间相交、距离或工艺拓扑关系。

默认开启 MySQL 元数据写入时，重复处理同一文件会同时清理 Milvus 中已经失效的旧
chunk ID。向量集合已存在时会校验 embedding 维度，避免更换模型后静默写入失败。
MySQL 只保存可审计的文档和 chunk 清单，不参与 Milvus 集合或向量字段的定义。
如需从零重建，应先清理 `industry_agent` 数据库及其 Milvus 数据库，再运行标准入库命令。

## 2. 文件读取层

### 2.1 主要位置

- `app/ingestion/reader.py`
- `app/ingestion/file_reader.py`（底层兼容接口）

### 2.2 逻辑说明

文件读取层只负责安全、稳定地读取原始文件内容，不负责 PDF 解析、不负责文本抽取、不负责业务理解。

提供的能力包括：

- 一次性读取二进制文件
- 分块读取大文件
- 按指定编码读取文本文件
- 对文件不存在、非法 chunk size 等情况给出明确异常

### 2.3 使用的方法

采用“读取与解析分离”的设计：

- `read_file()` 只读取原始 bytes
- `iter_file_chunks()` 支持大文件流式读取
- `read_text_file()` 只用于明确文本文件读取

### 2.4 好处

- 职责清晰，读取层不会混入 PDF 解析逻辑
- 后续可以支持更多文件类型，例如 Word、Excel、图片、CAD 文件
- 大文件可以分块处理，避免一次性占用过多内存
- 方便测试和排查问题

## 3. PDF 结构化解析层

### 3.1 主要位置

- `app/ingestion/pdf_parser.py`
- `app/ingestion/models.py`

### 3.2 逻辑说明

PDF 解析层负责把工业 PDF 转换成结构化文档对象 `StructuredDocument`。

解析内容包括：

- 判断 PDF 类型：文本型、扫描型、混合型、空文档
- 抽取正文文本
- 抽取表格并转换为 Markdown 表格
- 抽取 PDF 内嵌图片
- 对扫描页或图纸页进行整页渲染
- 生成图片、表格、CAD、扫描页占位符
- 保留页码、坐标、块类型、来源路径等元数据

### 3.3 使用的方法

主要使用 PyMuPDF 进行 PDF 解析：

- 文本抽取：读取页面中的文本块
- 表格识别：尽量识别 PDF 中的表格结构
- 图片抽取：提取页面内嵌图片
- 页面渲染：将扫描页、CAD 图纸页渲染成图片
- 坐标记录：保留 block 的 bounding box

解析后的核心结构包括：

- `StructuredDocument`：完整文档
- `ParsedPage`：页面级信息
- `DocumentBlock`：文本、表格、图片、CAD、扫描页等内容块
- `ImageAsset`：图片或页面渲染资产
- `BoundingBox`：坐标信息

### 3.4 好处

- 不再把 PDF 当成一整段纯文本处理，可以保留页面结构
- 表格、图片、CAD 图纸不会被简单丢弃
- 每个内容块都有页码和来源，后续检索结果可追溯
- 为后续清洗、切块、向量化提供统一数据结构
- 对工业手册、维修文档、报警码文档等复杂 PDF 更友好

## 4. SiliconFlow 多模态识别层

### 4.1 主要位置

- `app/ingestion/vision.py`

### 4.2 逻辑说明

SiliconFlow 视觉识别层用于处理普通文本抽取无法理解的视觉内容，例如：

- 设备图片
- CAD 图纸
- 扫描页
- 表格截图
- 含尺寸标注的图纸
- 含零件编号的结构图

PDF 解析阶段会将图片或页面渲染为图像，再调用 SiliconFlow 视觉模型生成语义描述，并把描述与对应 placeholder 关联。

### 4.3 使用的方法

采用 SiliconFlow 的 OpenAI-compatible 多模态 API：

- 将图片转为 base64 data URL
- 使用文本 prompt 指导模型识别工业图像
- 返回图像的语义描述
- 支持通过 `.env` 配置密钥和模型名称

支持的环境变量包括：

```text
SILICONFLOW_API_KEY
SILICONFLOW_VISION_MODEL
SILICONFLOW_VISION_ENDPOINT
```

### 4.4 好处

- 解决传统 PDF 文本解析无法理解图片、CAD、扫描页的问题
- 将视觉内容转成可检索文本，提高召回率
- 图片、CAD 图纸、扫描页都可以进入 RAG 知识库
- 支持离线流程中按需开启，不开启时也可以保留 placeholder 等待后续识别
- 密钥通过 `.env` 管理，不写死在代码中

## 5. 结构化文档模型

### 5.1 主要位置

- `app/ingestion/models.py`

### 5.2 逻辑说明

结构化文档模型是解析、清洗、切块、向量化之间的统一数据协议。

核心思想是：

```text
PDF 不是纯文本，而是由多个页面、多个结构块、多个视觉资产组成的结构化对象。
```

主要类型包括：

- `PdfType`：PDF 类型
- `BlockType`：内容块类型
- `StructuredDocument`：完整文档
- `ParsedPage`：页面
- `DocumentBlock`：文档块
- `ImageAsset`：视觉资产
- `BoundingBox`：坐标框

### 5.3 使用的方法

采用 dataclass 建模，所有下游模块都围绕这些对象工作。

`DocumentBlock` 中保留：

- block id
- page number
- block kind
- content
- bbox
- placeholder
- metadata

### 5.4 好处

- 上下游接口稳定，模块之间解耦
- 后续可以继续增加 Word、Excel、CAD 等解析器，只要输出相同结构即可
- 检索结果可以返回页码、来源、块类型、图片状态等信息
- 对多模态内容有统一表达方式

## 6. 清洗层

### 6.1 主要位置

- `app/clean/industrial_cleaner.py`

### 6.2 逻辑说明

清洗层负责将解析出来的原始内容变成更适合切块和向量化的文本。

主要处理内容包括：

- 删除重复页眉页脚
- 删除孤立页码
- 删除分隔线、目录点线等噪声
- 清洗 OCR 或视觉识别中的无效描述
- 将 Markdown 表格转换为更适合语义检索的行级描述
- 给每个块打质量标签

质量标签包括：

- `high`：高质量文本
- `medium`：可用但可能来自视觉识别或结构较复杂
- `low`：低质量内容，默认不进入向量化

### 6.3 使用的方法

采用文档级清洗 + 块级清洗结合的方式：

1. 文档级识别重复行
   - 统计多页中反复出现的短文本
   - 判断为页眉、页脚或模板噪声

2. 块级清洗
   - 正文块清洗换行和空白
   - 表格块转换为语义行
   - 图片/CAD/扫描页清洗视觉描述
   - 保留工业符号和单位

重点保留的工业信息包括：

- `Φ`
- `±`
- `M8`
- `Ra3.2`
- `A-102`
- `mm`
- `MPa`
- 零件编号
- 尺寸标注

### 6.4 好处

- 避免页眉页脚进入向量库造成召回污染
- 表格不再只是 Markdown 符号，而是更利于语义搜索的描述
- 工业符号、尺寸、公差、零件号不会被误删
- 可以通过质量标签控制是否进入 embedding
- 清洗层独立于 chunk 层，职责更清楚，后续更容易维护

## 7. 结构感知语义切块层

### 7.1 主要位置

- `app/chunk/industrial_chunker.py`

### 7.2 逻辑说明

切块层负责将清洗后的文档块转换为适合向量化的 `IndustrialChunk`。

本项目采用的是第一阶段“工业多模态结构感知语义切块”。

核心规则如下：

```text
正文连续合并
表格独立成块
图片合并上下文
CAD 图纸独立成块
扫描页按质量处理
最后再按长度拆分
```

### 7.3 使用的方法

#### 7.3.1 正文连续合并

相邻的正文块如果语义连续，会合并为一个 chunk。

好处：

- 避免一句话或一个段落被切得过碎
- 提高检索时上下文完整性
- 适合维修步骤、操作说明、故障描述等连续文本

#### 7.3.2 表格独立成块

表格内容单独形成 chunk，不强行和正文混合。

好处：

- 表格通常是参数、BOM、报警码、维护周期等结构化信息
- 独立存储有利于精准召回
- 避免表格被正文稀释

#### 7.3.3 图片合并上下文

图片描述会与上下相邻的正文块合并一定上下文。

好处：

- 图片本身的语义需要依赖前后文字解释
- 检索设备结构图、部件图时更容易命中
- 避免只有“图片描述”而缺少业务背景

#### 7.3.4 CAD 图纸独立成块

CAD 图纸或图纸页单独形成 chunk，可附带短标题或邻近说明。

好处：

- CAD 图纸信息密度高，适合独立检索
- 避免图纸尺寸、零件编号被普通正文切散
- 后续可扩展为图纸专用检索或图文检索

#### 7.3.5 扫描页按质量处理

扫描页根据识别质量决定是否进入向量化。

好处：

- 高质量扫描识别结果可以进入知识库
- 低质量扫描结果不会污染向量库
- 保留 metadata，方便后续重新 OCR 或多模态识别

#### 7.3.6 最后按长度拆分

所有 chunk 最终都会受到最大长度限制，如果超过最大字符数，会进行带 overlap 的拆分；
overlap 本身不会把结果重新撑大到超过上限。

好处：

- 适配 embedding 模型输入长度
- 保证每个 chunk 大小稳定
- overlap 可以减少语义断裂

### 7.4 chunk metadata

每个 chunk 会携带丰富元数据：

- source_name
- source_path
- pdf_type
- chunk_type
- group_index
- part_index
- page_numbers
- block_ids
- block_types
- contains_table
- contains_image
- contains_cad
- recognition_statuses
- quality
- warnings

### 7.5 好处

- 比固定长度切块更适合工业文档
- 能区分正文、表格、图片、CAD、扫描页
- 检索结果可追溯到 PDF、页码和内容类型
- 支持后续按类型过滤，例如只查报警码、只查 BOM、只查 CAD
- 减少脏数据、低质量视觉识别结果进入向量库

## 8. BGE-M3 向量化层

### 8.1 主要位置

- `app/embedding/bge_m3.py`
- `app/embedding/models.py`
- `app/embedding/pipeline.py`

### 8.2 逻辑说明

向量化层负责将 `IndustrialChunk` 转换为 `VectorRecord`。

本项目使用硅基流动 BGE-M3 embedding API：

```text
BAAI/bge-m3
```

实际测试的向量维度为：

```text
1024（最终维度仍以模型实际输出为准）
```

### 8.3 使用的方法

通过 `SiliconFlowEmbeddingClient` 调用远程 embedding 接口，避免在本机加载模型权重。

向量化前会进行过滤：

- 空文本不向量化
- 太短文本不向量化
- low quality chunk 默认不向量化
- 图片/CAD/扫描页如果识别状态是 pending、failed、disabled，默认不向量化

生成的 `VectorRecord` 包含：

- id
- chunk_id
- text
- vector
- source_name
- page_numbers
- chunk_type
- quality
- contains_table
- contains_image
- contains_cad
- metadata

### 8.4 为什么选择 BGE-M3

BGE-M3 适合本项目的原因：

- 支持多语言，中英文表现较好
- 适合语义检索场景
- 通过硅基流动 API 调用，避免维护本地模型文件
- 成本可控，适合批量离线入库
- 向量维度稳定，方便 Milvus 建表
- 对工业文档中的说明、参数、故障、报警码等文本检索较合适

### 8.5 好处

- 不需要本地 GPU 或模型权重
- 可重复构建向量库
- 与 Milvus 向量检索天然适配
- 通过过滤策略降低脏数据进入向量库的概率

## 9. VectorRecord 向量记录层

### 9.1 主要位置

- `app/embedding/models.py`

### 9.2 逻辑说明

`VectorRecord` 是 chunk 和 Milvus 之间的标准写入格式。

它将复杂的 chunk metadata 扁平化，方便 Milvus 建字段、过滤和返回结果。

### 9.3 使用的方法

每个 `VectorRecord` 包含 Milvus 可直接写入的字段：

- 主键 id
- chunk_id
- text
- vector
- source_name
- page_numbers
- chunk_type
- quality
- contains_table
- contains_image
- contains_cad
- metadata_json

同时会校验向量：

- 不能为空
- 维度必须正确
- 不能包含 NaN
- 不能包含 Inf
- 必须是数值类型

### 9.4 好处

- 避免直接把复杂 Python 对象写入 Milvus
- 方便后续做条件过滤
- 方便检索结果展示来源、页码和内容类型
- 提前校验向量质量，减少入库失败

## 10. Milvus 入库层

### 10.1 主要位置

- `app/milvus/schema.py`
- `app/milvus/writer.py`
- `scripts/ingest_to_milvus.py`

### 10.2 逻辑说明

Milvus 入库层负责按业务类型创建 collection、写入向量记录、flush 数据，并支持删除目标 typed collection 后重建。

当前标准工业离线管道按项目数据目录进行物理分库：报警码、案例、手册、SOP、CAD/图纸等不会堆到同一个 collection 中。`corpus`、`source_name`、`source_format`、`device_model`、`project_id`、`tenant_id`、`device_id`、`error_code` 等字段仍会写入 Milvus，但它们只作为二次过滤和证据展示补充，不作为唯一隔离手段。

```text
data/alarms  -> industry_rag_alarm_codes

data/cases   -> industry_rag_alarm_solutions

data/manuals -> industry_rag_manuals（文件名包含 BOM/SOP/保养维护/安全规程/故障诊断时细分到对应 collection）

data/sop     -> industry_rag_sop

data/cad     -> industry_rag_drawings
```

### 10.3 使用的方法

Milvus 使用：

- `pymilvus`
- `MilvusClient`
- `FLOAT_VECTOR`
- `AUTOINDEX`
- `COSINE`

schema 字段包括：

- `id`
- `chunk_id`
- `text`
- `source_name`
- `source_path`
- `source_format`
- `corpus`
- `device_model`
- `error_code`
- `project_id`
- `tenant_id`
- `device_id`
- `page_numbers_json`
- `chunk_type`
- `quality`
- `contains_table`
- `contains_image`
- `contains_cad`
- `metadata_json`
- `vector`

### 10.4 业务域隔离方式

在线检索优先通过 collection 物理隔离业务域，再在 collection 内使用 metadata 字段细化过滤：

| 文档类型 | 目标 collection | 辅助过滤字段 |
| --- | --- | --- |
| 报警码数据 | `industry_rag_alarm_codes` | `error_code` / `device_model` |
| 报警处理案例 | `industry_rag_alarm_solutions` | `corpus=cases` / `device_model` |
| 普通手册 | `industry_rag_manuals` | `corpus=manuals` / `source_name` |
| BOM 数据 | `industry_rag_bom` | `source_name` / `chunk_type` |
| SOP 数据 | `industry_rag_sop` | `corpus=sop` |
| 保养维护数据 | `industry_rag_maintenance` | `device_model` / `source_name` |
| 安全规程数据 | `industry_rag_safety_rules` | `source_name` / `quality` |
| 故障诊断数据 | `industry_rag_troubleshooting` | `error_code` / `device_model` |
| CAD / 图纸 | `industry_rag_drawings` | `project_id` / `device_id` / `chunk_type` |

### 10.5 为什么采用类型分库

类型分库的好处：

- 避免在元数据不完整时仅靠过滤条件隔离业务域导致误召回
- Milvus 中的 collection 与项目数据目录一一对应，便于运维观察和重建
- 报警、案例、手册、SOP、BOM、CAD 等数据可以独立 drop / rebuild
- 在线 dense 与 BM25 都按同一组 typed collection fan-out 后合并结果
- metadata 继续用于租户、项目、设备、报警码等精细筛选，而不是承担全部隔离职责

### 10.6 好处

- Milvus schema 稳定，各 typed collection 复用同一字段定义
- 支持删除目标 collection 后完整重建
- 支持批量写入和 flush
- 支持 metadata 过滤、top_k 检索、rerank 和证据链展示

## 11. MySQL 元数据入库层

### 11.1 主要位置

- `app/mysql/schema.py`
- `app/mysql/writer.py`

### 11.2 保存内容

MySQL 不替代 Milvus 的向量检索，而是保存可审计、可更新的结构化数据：

- `rag_documents`：源文件、格式、SHA-256、处理状态、chunk 数量、错误信息，以及 MinIO/S3 bucket、key、URI、ETag、版本 ID
- `rag_chunks`：chunk 原文、页码、质量、类型、Milvus collection、完整 metadata，以及 drawing/version/entity/project/layer/device/tenant 关联字段
- `cad_drawings` / `cad_drawing_versions`：图纸及版本
- `cad_layers` / `cad_entities`：图层和结构化实体
- `cad_text_annotations` / `cad_entity_relations`：文字标注和可解释实体关系

文档重新处理时使用相同的 `document_id`，chunk 使用相同的 `chunk_id` 做
upsert，并删除该文档已经不存在的旧 chunk，因此可以重复运行。

### 11.3 双写顺序

```text
MySQL processing
  -> 解析 / 清洗 / 分块 / 向量化
  -> Milvus upsert
  -> MySQL chunk upsert
  -> MySQL complete
```

如果任一步失败，文档会记录为 `failed`，错误信息保留在
`rag_documents.error_message` 中，下一次运行可以继续修复。

## 12. 总流程脚本

### 11.1 主要位置

- `scripts/ingest_to_milvus.py`

### 11.2 逻辑说明

该脚本串联完整离线流程：

```text
读取 data/ 下一级目录中的支持文件
  -> parse_document / DocumentSource
  -> build_chunks
  -> embed_chunks
  -> create/reuse typed Milvus collection
  -> Milvus upsert
  -> MySQL 文档和 chunk upsert
  -> Whoosh collection 子索引更新
```

### 11.3 常用命令

按数据目录创建 typed collection：

```bash
python scripts/ingest_to_milvus.py --data-dir data
```

需要从零重建时，先删除 `industry_agent` 的 MySQL 数据库和 Milvus
数据库，再执行上面的命令；脚本会同时写入 Milvus、MySQL 和 Whoosh。

### 11.4 好处

- 一条命令完成完整离线入库
- 可以重复执行，方便重建知识库
- 可以选择是否启用视觉识别
- 固定按文档类型拆分 Milvus collection
- 适合后续接入定时任务或离线批处理任务

## 13. 测试与验证

### 12.1 主要测试文件

- `tests/test_file_reader.py`
- `tests/test_pdf_ingestion.py`
- `tests/test_industrial_cleaner.py`
- `tests/test_industrial_chunker.py`
- `tests/test_embedding_pipeline.py`
- `tests/test_rag_pipeline_integration.py`
- `tests/test_milvus_writer.py`
- `tests/test_mysql_writer.py`
- `tests/test_object_storage.py`
- `tests/test_ingest_to_milvus_script.py`

### 12.2 测试覆盖内容

测试覆盖了：

- 文件读取
- PDF 类型判断
- 表格转换
- 视觉识别请求格式
- 清洗逻辑
- 结构感知切块
- 低质量内容过滤
- embedding pipeline
- VectorRecord 生成
- Milvus 写入字段扁平化
- collection 命名规则
- 从 StructuredDocument 到向量记录的集成链路

### 12.3 当前验证结果

当前回归验证结果：

```text
python -m compileall -q app scripts
python -m pytest tests
55 passed
```

测试覆盖文件读取、多格式解析、DXF 实体字段、清洗、切块、Embedding、对象存储客户端、MySQL 文档/chunk 双写、CAD 元数据写入和 Milvus 字段扁平化。真实 MinIO、MySQL、Milvus 服务仍需在部署环境中执行端到端验证。

Milvus 标准验证结果应按业务类型分布到多个 collection：

```text
industry_rag_alarm_codes: <alarm_code_vector_records>
industry_rag_alarm_solutions: <case_vector_records>
industry_rag_manuals / industry_rag_bom / industry_rag_sop / ...: <manual_vector_records>
industry_rag_drawings: <cad_vector_records>
```

### 12.4 好处

- 每个核心模块都有对应测试
- 修改清洗、切块、入库逻辑时更安全
- 可以快速发现接口不兼容问题
- 保障离线入库流程可重复运行

## 14. 当前方案的优势总结

### 13.1 适合工业 PDF

工业 PDF 常见特点是结构复杂、图文混合、表格多、图纸多、扫描页多。本方案不是简单文本切块，而是针对工业文档做结构化处理。

### 13.2 多模态能力可扩展

图片、CAD、扫描页可以通过 SiliconFlow 视觉模型转换为语义文本，解决传统 RAG 无法处理视觉信息的问题。

### 13.3 数据质量更可控

清洗层和 embedding 前过滤机制可以减少噪声进入向量库，降低错误召回概率。

### 13.4 检索可追溯

每条向量记录都保留来源文件、页码、块类型、质量、是否包含表格/图片/CAD 等信息，方便后续展示证据链。

### 13.5 离线成本更低

BGE-M3 本地向量化减少对外部 embedding API 的依赖，适合批量处理大量工业资料。

### 13.6 知识库管理更清晰

按 PDF 类型拆成六个 collection 后，业务查询可以更精准地选择知识库，降低不同类型文档之间的干扰。

## 15. 后续建议

当前已经完成离线入库部分。下一阶段建议继续补充在线检索链路：

```text
用户问题
  -> BGE-M3 query embedding
  -> 选择目标 collection
  -> Milvus top_k 检索
  -> 返回 chunk + 页码 + 来源
  -> reranker 重排
  -> 证据融合
  -> 大模型生成回答
```

建议优先实现：

1. `MilvusSearcher`
   - 输入 query
   - 生成 query embedding
   - 搜索指定 collection
   - 返回 top_k chunk

2. collection 路由
   - 报警码问题查 `industry_rag_alarm_codes`
   - 故障问题查 `industry_rag_troubleshooting`
   - SOP 问题查 `industry_rag_sop`
   - BOM 问题查 `industry_rag_bom`

3. reranker
   - 对 Milvus 初召回结果进行重排
   - 提高最终答案相关性

4. 证据链输出
   - 返回来源 PDF
   - 返回页码
   - 返回 chunk 原文
   - 返回命中的 collection

这样就可以从“离线入库完成”进入“在线问答检索可用”的阶段。
