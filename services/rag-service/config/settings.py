"""整个 RAG 服务的集中式运行时配置。

同一个服务包含两个部分：

* **在线链路**（检索 -> 融合 -> 重排 -> 证据 -> 生成）读取下方的并发数量、
  各阶段预算、模型路径和 DeepSeek 凭据；
* **离线链路**（解析 -> 清洗 -> 切分 -> 向量化 -> Milvus/MySQL/Whoosh）
  从同一个配置对象读取语料目录、Milvus 写入选项、MySQL 元数据存储配置，
  以及可选的 SiliconFlow 视觉模型凭据。

所有配置都通过环境变量（或本地 ``.env`` 文件）由 ``pydantic-settings`` 读取。
代码不会硬编码任何密钥：API 密钥默认是空字符串，必须通过环境变量提供，
并且不会写入日志（参见 :mod:`app.llm.client`）。

``.env`` 文件的查找路径固定在服务根目录，因此无论从
``services/rag-service``、仓库根目录启动服务，还是由改变了工作目录的容器入口启动，
服务行为都保持一致。
"""

from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_ROOT = Path(__file__).resolve().parents[1]
"""``services/rag-service`` 的绝对路径，用于定位 ``.env`` 和数据目录。"""

PROJECT_ROOT = SERVICE_ROOT.parents[1]
"""Repository root used for the lower-priority shared ``.env`` file."""

ENV_FILE = SERVICE_ROOT / ".env"
"""服务本地的 ``.env`` 文件；此外还会读取当前工作目录中的 ``.env``。"""


def load_service_env() -> None:
    """加载服务本地的 ``.env``，且不覆盖进程环境变量。

    ``pydantic-settings`` 在实例化 :class:`Settings` 时已经会读取 :data:`ENV_FILE`。
    这个辅助函数用于那些直接读取 ``os.getenv`` 的代码路径（例如离线 MySQL 和
    可选的 SiliconFlow 视觉模型配置辅助函数），确保服务的两个部分看到相同的配置值。

    如果没有安装 ``python-dotenv``，不会抛出错误；此时只使用进程环境变量。
    """
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(ENV_FILE, override=False)


def env_bool(name: str, default: bool = False) -> bool:
    """读取布尔类型的环境变量。

    参数：
        name：环境变量名称。
        default：未设置环境变量时返回的值。

    返回：
        解析后的布尔值。

    异常：
        ValueError：环境变量被设置为既不是真值
            （``1``/``true``/``yes``/``on``），也不是假值
            （``0``/``false``/``no``/``off``）的内容。
    """
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value, got {value!r}.")


class Settings(BaseSettings):
    """工业维护 RAG 服务的运行时配置。

    字段名称与环境变量不区分大小写，因此可以使用
    ``BM25_TOP_K=30`` 覆盖 ``bm25_top_k``，使用
    ``DEEPSEEK_API_KEY=sk-...`` 覆盖 ``deepseek_api_key``，
    使用 ``MYSQL_HOST=127.0.0.1`` 覆盖 ``mysql_host``。
    """

    model_config = SettingsConfigDict(
        # 先读取服务本地文件，再读取当前工作目录的 ``.env``；
        # 实际的进程环境变量优先级高于这两个文件。
        # pydantic-settings applies later files last.  The service file must
        # therefore follow the repository file while process ENV remains first.
        env_file=(str(PROJECT_ROOT / ".env"), str(ENV_FILE)),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # 检索并发与结果融合
    # ------------------------------------------------------------------
    bm25_top_k: int = 20
    """从 Whoosh（BM25）检索路径请求的候选数量。"""

    dense_top_k: int = 20
    """从 Milvus（稠密向量）检索路径请求的候选数量。"""

    rrf_k: int = 60
    """倒数排名融合使用的平滑常数。"""

    fusion_top_m: int = 30
    """进入重排阶段的融合候选数量。"""

    rerank_top_n: int = 5
    """请求未提供 ``top_n`` 时保留的证据数量。"""

    # ------------------------------------------------------------------
    # 各阶段的毫秒级时间预算
    # ------------------------------------------------------------------
    bm25_timeout_ms: int = 3000
    """Whoosh/BM25 检索阶段的时间预算。"""

    dense_timeout_ms: int = 5000
    """Milvus/稠密向量检索阶段的时间预算。"""

    rerank_timeout_ms: int = 15000
    """重排阶段的时间预算。"""

    request_timeout_ms: int = 35000
    """整个 ``POST /search`` 请求的时间预算。

    必须大于 :attr:`llm_timeout_ms`，否则整体时间预算会在 DeepSeek 返回前
    截断生成阶段，导致每次响应的 ``answer`` 都为空，并返回
    ``degrade_reason="request_timeout"``。历史默认值 2000 毫秒正好会触发
    这个问题，因此当前默认值跟随 ``llm_timeout_ms`` 设置。
    """

    llm_timeout_ms: int = 30000
    """DeepSeek 生成调用的时间预算。"""

    health_probe_timeout_ms: int = 3000
    """``GET /health`` 使用的单个依赖探测时间预算。

    第一次 Milvus 就绪探测可能包含客户端创建和集合发现过程。
    500 毫秒的预算会导致健康的本地 Milvus 实例在冷启动进程中被误报为不可用，
    因此默认值会有意高于本地连接和发现操作的延迟。
    """

    # ------------------------------------------------------------------
    # 模型
    # ------------------------------------------------------------------
    siliconflow_api_key: str = ""
    """用于远程向量化和重排的 SiliconFlow API 密钥。"""

    siliconflow_base_url: str = "https://api.siliconflow.cn/v1"
    """兼容 OpenAI 接口的 SiliconFlow API 基础地址。"""

    siliconflow_embedding_model: str = "BAAI/bge-m3"
    """SiliconFlow 向量模型标识。"""

    siliconflow_reranker_model: str = "BAAI/bge-reranker-v2-m3"
    """SiliconFlow 重排模型标识。"""

    embedding_dim: int = 1024
    """bge-m3 生成的稠密向量维度。"""

    embedding_batch_size: int = 16
    """文本块（离线）和查询（在线）向量化时使用的批大小。"""

    embedding_min_characters: int = 20
    """短于该长度的文本块会被离线向量化流程跳过。"""

    embedding_normalize: bool = True
    """是否对向量进行 L2 归一化（COSINE/IP 度量要求归一化）。"""

    reranker_batch_size: int = 16
    """对查询与文本段落组合进行评分时使用的批大小。"""

    # ------------------------------------------------------------------
    # 离线语料
    # ------------------------------------------------------------------
    rag_data_dir: str = str(SERVICE_ROOT / "data")
    """``scripts/ingest_to_milvus.py`` 扫描的目录（固定在服务根目录）。"""

    default_corpus: str = "manuals"
    """当文档没有语料标识时，由 :func:`app.corpus.infer_corpus` 使用的默认语料标签
    （``alarms`` / ``cases`` / ``manuals`` / ``sop``）。
    """

    # ------------------------------------------------------------------
    # 离线存储
    # ------------------------------------------------------------------
    whoosh_index_dir: str = str(SERVICE_ROOT / "data" / "index" / "whoosh")
    """生成的 Whoosh BM25 索引所在目录。"""

    milvus_uri: str = "http://localhost:19530"
    """Milvus 连接地址。"""

    milvus_database: str = "industry_agent"
    """工业维护 RAG 服务使用的 Milvus 数据库；不存在时由写入器创建。"""

    milvus_host: str = "localhost"
    """Milvus 主机地址，供使用主机和端口而非 URI 的客户端使用。"""

    milvus_port: int = 19530
    """Milvus 端口。"""

    milvus_collections: str = ""
    """Comma-separated explicit collection names; overrides directory discovery."""

    rag_experience_collection: str = "maint_fault_events"
    """Collection receiving closed-work-order experiences."""

    @property
    def milvus_search_collections(self) -> list[str]:
        """Return collections derived from the first-level data directories.

        The data tree is the only source of collection membership. Empty marker
        files do not create online collections, so health checks only target
        collections that the ingestion command can actually build.
        """

        explicit = [item.strip() for item in self.milvus_collections.split(",") if item.strip()]
        if explicit:
            discovered = explicit
        else:
            discovered = []
        data_root = Path(self.rag_data_dir)
        folder_collections = {
            "alarms": "industry_rag_alarm_codes",
            "cases": "industry_rag_alarm_solutions",
            "manuals": "industry_rag_manuals",
            "sop": "industry_rag_sop",
            "cad": "industry_rag_drawings",
        }
        if not explicit and data_root.is_dir():
            for folder in sorted(data_root.iterdir(), key=lambda item: item.name.casefold()):
                if not folder.is_dir() or folder.name.lower() in {"index", ".git", "__pycache__"}:
                    continue
                if not any(path.is_file() and path.name != ".gitkeep" for path in folder.rglob("*")):
                    continue
                normalized = folder.name.lower()
                if normalized in folder_collections:
                    discovered.append(folder_collections[normalized])
                    continue
                slug = "".join(
                    char if char.isalnum() or char == "_" else "_"
                    for char in normalized
                ).strip("_")
                discovered.append(f"industry_rag_{slug or 'unknown'}"[:255])
        if self.rag_experience_collection.strip():
            discovered.append(self.rag_experience_collection.strip())
        return list(dict.fromkeys(discovered))

    milvus_primary_field: str = "id"
    """文本块集合的主键字段。"""

    milvus_vector_field: str = "vector"
    """文本块集合的向量字段。"""

    milvus_metric_type: str = "COSINE"
    """向量索引的度量类型。"""

    milvus_index_type: str = "AUTOINDEX"
    """向量索引的索引类型。"""

    milvus_batch_size: int = 128
    """离线 Milvus 写入器使用的批大小。"""

    milvus_drop_existing: bool = False
    """离线写入器是否在创建集合前删除已有集合。"""

    # ------------------------------------------------------------------
    # MySQL 元数据存储（离线入库记录）
    # ------------------------------------------------------------------
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "industry_agent"
    mysql_charset: str = "utf8mb4"
    mysql_connect_timeout: int = 10

    # ------------------------------------------------------------------
    # 离线解析器使用的 SiliconFlow 视觉/CAD 辅助配置
    # ------------------------------------------------------------------
    siliconflow_vision_model: str = "Qwen/Qwen3-VL-8B-Instruct"
    """用于描述图像和扫描页面的 SiliconFlow 视觉模型标识。"""

    siliconflow_vision_endpoint: str = (
        "https://api.siliconflow.cn/v1/chat/completions"
    )
    """SiliconFlow 兼容 OpenAI 接口的视觉模型端点。"""

    oda_file_converter: str = ""
    """读取 DWG 图纸所需的 ``ODAFileConverter.exe`` 路径。"""

    # ------------------------------------------------------------------
    # 大语言模型（DeepSeek）
    # ------------------------------------------------------------------
    deepseek_api_key: str = ""
    """DeepSeek API 密钥。必须来自 ``DEEPSEEK_API_KEY``，不能硬编码。"""

    deepseek_base_url: str = "https://api.deepseek.com/v1"
    """兼容 OpenAI 接口的 DeepSeek 服务基础地址。"""

    deepseek_model: str = "deepseek-chat"
    """用于诊断生成的聊天模型。"""

    llm_temperature: float = 0.2
    """采样温度；保持较低值，使回答始终基于证据。"""

    llm_max_tokens: int = 1024
    """生成令牌数量上限。"""

    # ------------------------------------------------------------------
    # 服务
    # ------------------------------------------------------------------
    service_host: str = "0.0.0.0"
    """uvicorn 服务的绑定地址。"""

    service_port: int = 8020
    """服务绑定端口。"""

    log_level: str = "INFO"
    """服务日志记录器使用的 loguru 日志级别。"""

    cors_allow_origins: list[str] = ["*"]
    """CORS 中间件允许的来源。"""


settings = Settings()
"""由所有服务模块导入的进程级配置实例。"""


def get_settings() -> Settings:
    """返回进程级配置单例。

    这是一个兼容 FastAPI 的访问器，使路由和依赖可以通过 ``Depends`` 注入配置，
    而不是直接导入全局实例。

    返回：
        已构造完成的 :class:`Settings` 实例。
    """
    return settings


__all__ = [
    "ENV_FILE",
    "PROJECT_ROOT",
    "SERVICE_ROOT",
    "Settings",
    "env_bool",
    "get_settings",
    "load_service_env",
    "settings",
]
