"""Asynchronous DeepSeek chat client used for diagnostic generation.

``AsyncOpenAI`` is used directly (no thread off-loading) because the OpenAI SDK
is already async -- letting the event loop own the wait is what allows
:mod:`app.api.pipeline` to cancel generation the moment the LLM budget or the
overall request budget expires.

The client is deliberately thin: no retries (a retry would silently consume the
request budget), no streaming (the response is consumed as a whole) and no retry
loop on rate limits.  Every failure is normalised into :class:`LLMError` so the
orchestrator only has to handle one exception type, and the API key is never
logged.
"""

from __future__ import annotations

from typing import Any

from loguru import logger

from config.settings import settings

from .prompt import build_messages

try:  # pragma: no cover - exercised only when the dependency is installed
    import openai
    from openai import AsyncOpenAI
except (ImportError, ModuleNotFoundError):  # pragma: no cover
    openai = None  # type: ignore[assignment]
    AsyncOpenAI = None  # type: ignore[assignment]


if openai is not None:  # pragma: no branch - trivial
    _CLIENT_ERRORS: tuple[type[BaseException], ...] = (
        openai.APIError,
        openai.APIStatusError,
        openai.APITimeoutError,
        openai.APIConnectionError,
        openai.RateLimitError,
        OSError,
        ValueError,
        TypeError,
        KeyError,
        IndexError,
        AttributeError,
    )
else:  # pragma: no cover - dependency missing
    _CLIENT_ERRORS = (
        OSError,
        ValueError,
        TypeError,
        KeyError,
        IndexError,
        AttributeError,
        RuntimeError,
    )


class LLMError(RuntimeError):
    """Raised when a generation attempt fails for any reason.

    The orchestrator maps it to ``degrade_reason="llm_timeout"`` and an empty
    answer, so the retrieval result is still returned to the caller.
    """


class LLMUnavailableError(LLMError):
    """Raised when the client is not usable (missing package or API key)."""


class LLMClient:
    """DeepSeek chat-completions client with a fixed model and timeout policy."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout_s: float | None = None,
    ) -> None:
        """Create the client.

        Args:
            api_key: DeepSeek key; defaults to ``settings.deepseek_api_key``.
            base_url: OpenAI-compatible endpoint; defaults to
                ``settings.deepseek_base_url``.
            model: Chat model name; defaults to ``settings.deepseek_model``.
            timeout_s: Per-request timeout in seconds; defaults to
                ``settings.llm_timeout_ms / 1000``.
        """
        self.api_key = (api_key if api_key is not None else settings.deepseek_api_key) or ""
        self.base_url = base_url or settings.deepseek_base_url
        self.model = model or settings.deepseek_model
        self.timeout_s = (
            float(timeout_s)
            if timeout_s is not None
            else settings.llm_timeout_ms / 1000
        )
        self._client: Any | None = None

        if AsyncOpenAI is None:
            logger.warning(
                "llm client unavailable: openai package is not installed model={}",
                self.model,
            )
        elif not self.api_key:
            logger.warning(
                "llm client unavailable: DEEPSEEK_API_KEY is not set model={}",
                self.model,
            )

    @property
    def is_configured(self) -> bool:
        """Whether generation can be attempted at all.

        Returns:
            ``True`` when both the SDK and an API key are available.
        """
        return AsyncOpenAI is not None and bool(self.api_key)

    def _get_client(self) -> Any:
        """Return the lazily created SDK client.

        Returns:
            The ``AsyncOpenAI`` instance bound to the DeepSeek endpoint.

        Raises:
            LLMUnavailableError: If the SDK is missing or the key is not set.
        """
        if AsyncOpenAI is None:
            raise LLMUnavailableError("openai package is not installed")
        if not self.api_key:
            raise LLMUnavailableError("DEEPSEEK_API_KEY is not configured")

        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=self.timeout_s,
                max_retries=0,
            )
            logger.info(
                "llm client created model={} base_url={} timeout_s={}",
                self.model,
                self.base_url,
                self.timeout_s,
            )
        return self._client

    async def generate(self, query: str, evidence_text: str) -> str:
        """Generate the grounded diagnostic answer.

        Args:
            query: The user's fault description.
            evidence_text: Citation-formatted evidence context.

        Returns:
            The assistant message content, stripped of surrounding whitespace.

        Raises:
            LLMUnavailableError: If the client is not configured.
            LLMError: If the API call fails or returns an unusable payload.
        """
        client = self._get_client()
        messages = build_messages(query, evidence_text)

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
                stream=False,
            )
        except _CLIENT_ERRORS as exc:
            # The key is intentionally absent from the log payload.
            logger.warning(
                "llm request failed model={} error_type={}",
                self.model,
                type(exc).__name__,
            )
            raise LLMError(f"deepseek request failed: {type(exc).__name__}") from exc

        try:
            content = response.choices[0].message.content or ""
        except (AttributeError, IndexError, KeyError, TypeError) as exc:
            raise LLMError("deepseek returned an unusable response payload") from exc

        return content.strip()

    async def aclose(self) -> None:
        """Close the underlying HTTP connection pool.

        Safe to call when the client was never used.
        """
        if self._client is None:
            return
        try:
            await self._client.close()
        except _CLIENT_ERRORS as exc:
            logger.debug("llm client close failed error_type={}", type(exc).__name__)
        finally:
            self._client = None
