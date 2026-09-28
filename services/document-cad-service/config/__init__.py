"""CAD 服务配置包。

导出在线检索、融合、重排和生成模块共用的进程级 :data:`settings` 单例。
"""

from .settings import Settings, get_settings, settings

__all__ = ["Settings", "get_settings", "settings"]
