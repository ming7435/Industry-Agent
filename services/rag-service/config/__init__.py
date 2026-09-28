"""RAG 服务配置包。

导出所有在线（检索、融合、重排、生成）模块共用的进程级 :data:`settings` 单例。
"""

from .settings import Settings, get_settings, settings

__all__ = ["Settings", "get_settings", "settings"]
