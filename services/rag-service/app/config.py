"""向后兼容的配置辅助函数。

运行时配置现在位于 :mod:`config.settings`。本模块保留为旧离线脚本和存储辅助工具的小型兼容门面。
"""

from config.settings import SERVICE_ROOT, env_bool, load_service_env

__all__ = ["SERVICE_ROOT", "env_bool", "load_service_env"]
