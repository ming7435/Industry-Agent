"""Pytest bootstrap for the RAG service.

The service is imported as a top-level ``app`` / ``config`` / ``scripts`` package
tree, whatever the working directory pytest is started from. Putting the service
root on ``sys.path`` here keeps every ``from app... import`` and
``from config.settings import settings`` resolvable in the tests.
"""

from __future__ import annotations

import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

__all__ = ["SERVICE_ROOT"]
