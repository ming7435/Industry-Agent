"""面向工业文档检索的分块构建器。"""

from .industrial_chunker import (
    ChunkType,
    ChunkerConfig,
    IndustrialChunk,
    IndustrialChunker,
    build_chunks,
)

__all__ = [
    "ChunkType",
    "ChunkerConfig",
    "IndustrialChunk",
    "IndustrialChunker",
    "build_chunks",
]
