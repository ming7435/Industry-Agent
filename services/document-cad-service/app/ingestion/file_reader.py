"""Read arbitrary files as raw data.

This module deliberately does not inspect or parse file formats. Markdown,
images, PDF files, Office files, archives, logs, and unknown extensions are
all read as bytes so a later stage can decide how to process them.
"""

from __future__ import annotations

import argparse
from collections.abc import Iterator
from pathlib import Path

PathLike = str | Path
DEFAULT_CHUNK_SIZE = 1024 * 1024


class FileReadError(RuntimeError):
    """Raised when a file cannot be opened or read."""


def _validate_file_path(path: PathLike) -> Path:
    """Validate a file path without changing the file."""

    if path is None or (isinstance(path, str) and not path.strip()):
        raise ValueError("The file path must not be empty.")

    file_path = Path(path).expanduser()
    try:
        exists = file_path.exists()
        is_file = file_path.is_file()
    except OSError as exc:
        raise FileReadError(
            f"Unable to access file '{file_path}': {exc}"
        ) from exc

    if not exists:
        raise FileNotFoundError(f"File does not exist: {file_path}")
    if not is_file:
        raise IsADirectoryError(f"Path is not a file: {file_path}")

    return file_path


def read_file(path: PathLike) -> bytes:
    """Read and return the complete file content as raw bytes.

    The file extension and content are intentionally ignored. No decoding,
    parsing, cleaning, filtering, or conversion is performed.
    """

    file_path = _validate_file_path(path)
    try:
        with file_path.open("rb") as stream:
            return stream.read()
    except OSError as exc:
        raise FileReadError(f"Unable to read file '{file_path}': {exc}") from exc


def iter_file_chunks(
    path: PathLike,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
) -> Iterator[bytes]:
    """Yield raw file bytes in chunks without loading the whole file."""

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    file_path = _validate_file_path(path)
    try:
        with file_path.open("rb") as stream:
            while chunk := stream.read(chunk_size):
                yield chunk
    except OSError as exc:
        raise FileReadError(f"Unable to read file '{file_path}': {exc}") from exc


def read_text_file(
    path: PathLike,
    encoding: str = "utf-8",
    *,
    errors: str = "strict",
) -> str:
    """Decode a known text file without parsing or normalizing its content.

    Use :func:`read_file` for arbitrary files, including images. This helper
    exists only for callers that explicitly need a text string.
    """

    if not encoding.strip():
        raise ValueError("encoding must not be empty.")

    file_path = _validate_file_path(path)
    try:
        with file_path.open(
            "r",
            encoding=encoding,
            errors=errors,
            newline="",
        ) as stream:
            return stream.read()
    except UnicodeError as exc:
        raise FileReadError(
            f"Unable to decode file '{file_path}' using encoding "
            f"'{encoding}': {exc}"
        ) from exc
    except OSError as exc:
        raise FileReadError(f"Unable to read file '{file_path}': {exc}") from exc


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Read any file as raw bytes without parsing it."
    )
    parser.add_argument("path", type=Path, help="Path to the file")
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=None,
        help="Read in chunks of this size instead of loading the whole file",
    )
    return parser


def main() -> int:
    """Run a minimal read-only command-line check."""

    args = _build_argument_parser().parse_args()
    try:
        if args.chunk_size is None:
            content_size = len(read_file(args.path))
        else:
            content_size = sum(
                len(chunk)
                for chunk in iter_file_chunks(
                    args.path,
                    chunk_size=args.chunk_size,
                )
            )
    except (FileReadError, ValueError) as exc:
        print(f"Error: {exc}")
        return 1

    print(f"Read {content_size} bytes from '{args.path}'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


__all__ = [
    "DEFAULT_CHUNK_SIZE",
    "FileReadError",
    "iter_file_chunks",
    "read_file",
    "read_text_file",
]
