"""对 BM25 和稠密检索路径执行倒数排名融合。"""

from .rrf import rrf_fusion

__all__ = ["rrf_fusion"]
