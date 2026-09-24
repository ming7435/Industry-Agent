import io
import http.client
import json
import urllib.error
from unittest.mock import patch

from app.embedding import SiliconFlowEmbeddingClient


class _Response:
    def __init__(self, payload: dict):
        self._body = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self) -> bytes:
        return self._body


def test_embedding_client_retries_temporary_network_failures():
    response = _Response({"data": [{"index": 0, "embedding": [1.0, 0.0]}]})
    client = SiliconFlowEmbeddingClient(
        api_key="test-key",
        max_attempts=4,
        retry_base_s=0.25,
        retry_max_s=1.0,
    )

    with (
        patch(
            "urllib.request.urlopen",
            side_effect=[urllib.error.URLError("temporary"), urllib.error.URLError("temporary"), response],
        ) as urlopen,
        patch("app.embedding.models.time.sleep") as sleep,
    ):
        vectors = client.embed_texts(["test text"])

    assert vectors == [[1.0, 0.0]]
    assert urlopen.call_count == 3
    assert [call.args[0] for call in sleep.call_args_list] == [0.25, 0.5]


def test_embedding_client_retries_rate_limit_with_retry_after():
    rate_limit = urllib.error.HTTPError(
        "https://example.test/embeddings",
        429,
        "rate limited",
        {"Retry-After": "3"},
        io.BytesIO(b"busy"),
    )
    response = _Response({"data": [{"index": 0, "embedding": [0.0, 1.0]}]})
    client = SiliconFlowEmbeddingClient(
        api_key="test-key",
        max_attempts=2,
        retry_base_s=0.25,
        retry_max_s=2.0,
    )

    with (
        patch("urllib.request.urlopen", side_effect=[rate_limit, response]),
        patch("app.embedding.models.time.sleep") as sleep,
    ):
        vectors = client.embed_texts(["test text"])

    assert vectors == [[0.0, 1.0]]
    sleep.assert_called_once_with(2.0)


def test_embedding_client_retries_incomplete_response_body():
    response = _Response({"data": [{"index": 0, "embedding": [1.0, 1.0]}]})
    client = SiliconFlowEmbeddingClient(
        api_key="test-key",
        max_attempts=2,
        retry_base_s=0.1,
        retry_max_s=1.0,
    )

    with (
        patch(
            "urllib.request.urlopen",
            side_effect=[http.client.IncompleteRead(b"partial", 10), response],
        ),
        patch("app.embedding.models.time.sleep") as sleep,
    ):
        vectors = client.embed_texts(["test text"])

    assert vectors == [[1.0, 1.0]]
    sleep.assert_called_once_with(0.1)
