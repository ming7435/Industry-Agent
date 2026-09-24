import json
import os
import time
from urllib.request import Request, urlopen

import pytest


@pytest.mark.skipif(not os.getenv("RAG_SMOKE_URL"), reason="requires a running RAG service")
def test_rag_search_stays_within_smoke_budget():
    url = os.environ["RAG_SMOKE_URL"].rstrip("/") + "/search"
    request = Request(
        url,
        data=json.dumps({"query": "主轴轴承异常维修方法", "top_n": 3}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.monotonic()
    with urlopen(request, timeout=float(os.getenv("RAG_SMOKE_TIMEOUT_SECONDS", "30"))) as response:
        payload = json.loads(response.read().decode("utf-8"))
    elapsed = time.monotonic() - started
    assert response.status == 200
    assert isinstance(payload, dict)
    assert elapsed <= float(os.getenv("RAG_SMOKE_BUDGET_SECONDS", "30"))
