"""Qwen-VL image description client.

The client uses the OpenAI-compatible DashScope endpoint and deliberately
keeps HTTP details here so PDF parsing can be tested without network access.
"""

from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class VisionError(RuntimeError):
    """Raised when Qwen-VL cannot describe an image."""


class UrlOpener(Protocol):
    def __call__(self, request: Request, timeout: float) -> Any:
        ...


def _load_local_env() -> None:
    """Load the service-local .env file when python-dotenv is available."""

    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path)


@dataclass(frozen=True)
class QwenVLConfig:
    """Connection and generation settings for the Qwen-VL API."""

    api_key: str
    model: str = "qwen-vl-max"
    endpoint: str = (
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    )
    timeout_seconds: float = 90.0
    max_tokens: int = 1200
    temperature: float = 0.1

    def __post_init__(self) -> None:
        if not self.api_key.strip():
            raise ValueError("Qwen-VL api_key must not be empty.")
        if not self.model.strip():
            raise ValueError("Qwen-VL model must not be empty.")
        if not self.endpoint.strip():
            raise ValueError("Qwen-VL endpoint must not be empty.")
        if self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be greater than zero.")
        if self.max_tokens <= 0:
            raise ValueError("max_tokens must be greater than zero.")
        if not 0 <= self.temperature <= 2:
            raise ValueError("temperature must be between zero and two.")

    @classmethod
    def from_env(cls) -> "QwenVLConfig":
        """Load configuration from .env and common DashScope/Qwen variables."""

        _load_local_env()
        api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("QWEN_API_KEY")
        if not api_key:
            raise VisionError(
                "Qwen-VL is not configured; set DASHSCOPE_API_KEY or QWEN_API_KEY."
            )
        return cls(
            api_key=api_key,
            model=os.getenv("QWEN_VL_MODEL", cls.model),
            endpoint=os.getenv("QWEN_VL_ENDPOINT", cls.endpoint),
        )


class ImageDescriber(Protocol):
    """Protocol implemented by visual recognition providers."""

    def describe_image(
        self,
        image: bytes,
        *,
        media_type: str,
        filename: str,
        page_number: int,
        prompt: str,
    ) -> str:
        ...


class QwenVLClient:
    """Small dependency-light client for Qwen-VL image understanding."""

    def __init__(self, config: QwenVLConfig, *, opener: UrlOpener | None = None) -> None:
        if not config.api_key.strip():
            raise ValueError("Qwen-VL api_key must not be empty.")
        if not config.model.strip():
            raise ValueError("Qwen-VL model must not be empty.")
        self.config = config
        self._opener = opener or urlopen

    @classmethod
    def from_env(cls, *, opener: UrlOpener | None = None) -> "QwenVLClient":
        """Create a client from environment variables."""

        return cls(QwenVLConfig.from_env(), opener=opener)

    def describe_image(
        self,
        image: bytes,
        *,
        media_type: str,
        filename: str,
        page_number: int,
        prompt: str,
    ) -> str:
        """Send one image to Qwen-VL and return its semantic description."""

        if not image:
            raise ValueError("The image payload must not be empty.")
        if not media_type.startswith("image/"):
            raise ValueError("media_type must be an image MIME type.")

        image_data = base64.b64encode(image).decode("ascii")
        payload = {
            "model": self.config.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_data}"
                            },
                        },
                    ],
                }
            ],
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }
        request = Request(
            self.config.endpoint,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
                "X-Filename": filename,
                "X-Page-Number": str(page_number),
            },
            method="POST",
        )

        try:
            with self._opener(request, timeout=self.config.timeout_seconds) as response:
                response_body = response.read()
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise VisionError(
                f"Qwen-VL request failed with HTTP {exc.code}: {detail[:500]}"
            ) from exc
        except (URLError, TimeoutError, OSError) as exc:
            raise VisionError(f"Qwen-VL request failed: {exc}") from exc

        try:
            result = json.loads(response_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise VisionError("Qwen-VL returned an invalid JSON response.") from exc

        try:
            message_content = result["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise VisionError("Qwen-VL response did not contain message content.") from exc

        description = _content_to_text(message_content).strip()
        if not description:
            raise VisionError("Qwen-VL returned an empty image description.")
        return description


def _content_to_text(content: Any) -> str:
    """Normalize string and multimodal response content to plain text."""

    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "\n".join(parts)
    return ""


__all__ = [
    "ImageDescriber",
    "QwenVLClient",
    "QwenVLConfig",
    "VisionError",
]
