"""Backward-compatible configuration helpers.

Runtime configuration now lives in :mod:`config.settings`. This module remains as
a small compatibility facade for older offline scripts and storage helpers.
"""

from config.settings import SERVICE_ROOT, env_bool, load_service_env

__all__ = ["SERVICE_ROOT", "env_bool", "load_service_env"]
