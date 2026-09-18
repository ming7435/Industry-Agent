"""Milvus persistence and dense retrieval for RAG vector records.

``schema`` / ``writer`` belong to the offline half (create the collection, insert
the embedded chunks); ``retriever`` to the online half (:class:`Hit` and
:class:`DenseRetriever` are the dense leg of the search chain). Both use the same
collection, ``settings.milvus_collection``.
"""

from .retriever import SOURCE_DENSE, DenseRetriever, Hit
from .schema import MilvusConfig
from .writer import MilvusVectorWriter, MilvusWriteError

__all__ = [
    "DenseRetriever",
    "Hit",
    "MilvusConfig",
    "MilvusVectorWriter",
    "MilvusWriteError",
    "SOURCE_DENSE",
]
