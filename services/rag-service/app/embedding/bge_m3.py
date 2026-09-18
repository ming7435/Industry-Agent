"""Backward-compatible BGE-M3 client import.

The implementation lives in :mod:`app.embedding.models` with the rest of the
embedding types. This module preserves the historical import path.
"""

from .models import BGEM3EmbeddingClient

__all__ = ["BGEM3EmbeddingClient"]
