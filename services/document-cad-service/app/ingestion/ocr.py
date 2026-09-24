"""Optional local OCR image describers for offline ingestion."""

from __future__ import annotations

import os
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .vision import ImageDescriber, VisionError


class OcrError(VisionError):
    """Raised when local OCR cannot recognize an image."""


@dataclass(frozen=True)
class LocalOcrConfig:
    """Configuration for optional local OCR backends."""

    backend: str = "paddleocr"
    language: str = "ch"
    command: str | None = None
    timeout_seconds: float = 120.0
    min_characters: int = 2

    def __post_init__(self) -> None:
        if not self.backend.strip():
            raise ValueError("OCR backend must not be empty.")
        if not self.language.strip():
            raise ValueError("OCR language must not be empty.")
        if self.timeout_seconds <= 0:
            raise ValueError("OCR timeout_seconds must be greater than zero.")
        if self.min_characters < 0:
            raise ValueError("OCR min_characters must not be negative.")

    @classmethod
    def from_env(cls) -> "LocalOcrConfig":
        try:
            from dotenv import load_dotenv
        except ImportError:
            pass
        else:
            load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)
        return cls(
            backend=os.getenv("LOCAL_OCR_BACKEND", cls.backend),
            language=os.getenv("LOCAL_OCR_LANGUAGE", cls.language),
            command=os.getenv("LOCAL_OCR_COMMAND") or None,
            timeout_seconds=float(os.getenv("LOCAL_OCR_TIMEOUT_SECONDS", str(cls.timeout_seconds))),
            min_characters=int(os.getenv("LOCAL_OCR_MIN_CHARACTERS", str(cls.min_characters))),
        )


class LocalOcrClient:
    """ImageDescriber implementation backed by local OCR only."""

    def __init__(self, config: LocalOcrConfig | None = None, *, ocr_engine: Any | None = None) -> None:
        self.config = config or LocalOcrConfig.from_env()
        self._ocr_engine = ocr_engine

    def describe_image(
        self,
        image: bytes,
        *,
        media_type: str,
        filename: str,
        page_number: int,
        prompt: str,
    ) -> str:
        if not image:
            raise ValueError("The image payload must not be empty.")
        if not media_type.startswith("image/"):
            raise ValueError("media_type must be an image MIME type.")

        if self.config.command:
            text = self._run_command(image, media_type, filename)
        elif self.config.backend.lower() == "paddleocr":
            text = self._run_paddleocr(image, media_type, filename)
        elif self.config.backend.lower() in {"rapidocr", "rapidocr_onnxruntime"}:
            text = self._run_rapidocr(image, media_type, filename)
        else:
            raise OcrError(f"Unsupported local OCR backend: {self.config.backend}")

        text = _normalize_ocr_text(text)
        if len(text) < self.config.min_characters:
            raise OcrError(f"Local OCR returned too little text for page {page_number}.")
        return f"本地OCR识别结果（第{page_number}页，{filename}）：\n{text}"

    def _run_paddleocr(self, image: bytes, media_type: str, filename: str) -> str:
        try:
            if self._ocr_engine is None:
                self._ocr_engine = self._load_paddleocr()
            engine = self._ocr_engine
        except ImportError as exc:
            raise OcrError(
                "Local OCR backend 'paddleocr' requires paddleocr. "
                "Install it or set LOCAL_OCR_COMMAND to an OCR executable."
            ) from exc

        image_path = _write_temp_image(image, media_type, filename)
        try:
            try:
                result = engine.ocr(str(image_path), cls=True)
            except TypeError:
                result = engine.ocr(str(image_path))
        finally:
            image_path.unlink(missing_ok=True)
        return _paddleocr_result_to_text(result)

    def _load_paddleocr(self) -> Any:
        from paddleocr import PaddleOCR

        return PaddleOCR(use_angle_cls=True, lang=self.config.language, show_log=False)

    def _run_rapidocr(self, image: bytes, media_type: str, filename: str) -> str:
        try:
            if self._ocr_engine is None:
                self._ocr_engine = self._load_rapidocr()
            engine = self._ocr_engine
        except ImportError as exc:
            raise OcrError(
                "Local OCR backend 'rapidocr' requires rapidocr_onnxruntime."
            ) from exc

        image_path = _write_temp_image(image, media_type, filename)
        try:
            result, _elapsed = engine(str(image_path))
        finally:
            image_path.unlink(missing_ok=True)
        return _rapidocr_result_to_text(result)

    @staticmethod
    def _load_rapidocr() -> Any:
        from rapidocr_onnxruntime import RapidOCR

        return RapidOCR()

    def _run_command(self, image: bytes, media_type: str, filename: str) -> str:
        image_path = _write_temp_image(image, media_type, filename)
        command_template = self.config.command
        if not command_template:
            raise OcrError("Local OCR command is not configured")
        command = [part.format(image=str(image_path)) for part in command_template.split()]
        try:
            completed = subprocess.run(
                command,
                check=False,
                capture_output=True,
                text=True,
                timeout=self.config.timeout_seconds,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise OcrError(f"Local OCR command failed: {exc}") from exc
        finally:
            image_path.unlink(missing_ok=True)
        if completed.returncode != 0:
            detail = (completed.stderr or completed.stdout).strip()
            raise OcrError(f"Local OCR command failed with code {completed.returncode}: {detail}")
        return completed.stdout


def _write_temp_image(image: bytes, media_type: str, filename: str) -> Path:
    suffix = _image_suffix(media_type, filename)
    with tempfile.NamedTemporaryFile(prefix="rag-ocr-", suffix=suffix, delete=False) as stream:
        stream.write(image)
        return Path(stream.name)


def _image_suffix(media_type: str, filename: str) -> str:
    suffix = Path(filename).suffix
    if suffix:
        return suffix
    if media_type == "image/jpeg":
        return ".jpg"
    if media_type == "image/png":
        return ".png"
    if media_type == "image/tiff":
        return ".tiff"
    return ".img"


def _paddleocr_result_to_text(result: Any) -> str:
    texts: list[str] = []
    _collect_ocr_text(result, texts)
    return "\n".join(texts)


def _rapidocr_result_to_text(result: Any) -> str:
    if not isinstance(result, (list, tuple)):
        return ""
    texts: list[str] = []
    for item in result:
        if not isinstance(item, (list, tuple)) or len(item) < 2:
            continue
        text = item[1]
        if isinstance(text, str) and text.strip():
            texts.append(text.strip())
    return "\n".join(texts)


def _collect_ocr_text(value: Any, texts: list[str]) -> None:
    if isinstance(value, str):
        if value.strip():
            texts.append(value.strip())
        return
    if not isinstance(value, (list, tuple)):
        return
    if len(value) >= 2:
        first, second = value[0], value[1]
        if isinstance(first, str) and isinstance(second, (int, float)):
            texts.append(first.strip())
            return
        if isinstance(second, (list, tuple)) and second and isinstance(second[0], str):
            texts.append(second[0].strip())
            return
    for item in value:
        _collect_ocr_text(item, texts)


def _normalize_ocr_text(text: str) -> str:
    lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").splitlines()]
    return "\n".join(line for line in lines if line)


__all__ = ["LocalOcrClient", "LocalOcrConfig", "OcrError"]
