"""Configuration package for the RAG service.

Exposes the process-wide :data:`settings` singleton used by every online
(retrieval / fusion / rerank / generation) module.
"""

from .settings import Settings, get_settings, settings

__all__ = ["Settings", "get_settings", "settings"]
