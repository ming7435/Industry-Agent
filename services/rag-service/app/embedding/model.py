"""Backward-compatible query embedder imports.

The embedding implementation is consolidated in :mod:`app.embedding.models` so
offline vector records, the BGE-M3 client and the online query embedder share one
module. This file keeps the historical import path used by the API and tests.
"""

from .models import QueryEmbedder, get_embedder, reset_embedder

__all__ = ["QueryEmbedder", "get_embedder", "reset_embedder"]
