"""Unified, validated access to source documents."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

from .file_reader import DEFAULT_CHUNK_SIZE, FileReadError, PathLike


TEXT_ENCODINGS = ("utf-8-sig", "utf-8", "gb18030", "gbk", "big5", "latin-1")


@dataclass(frozen=True)
class DocumentSource:
    """A validated local file shared by all document parsers."""

    path: Path

    @classmethod
    def from_path(
        cls,
        path: PathLike,
        *,
        extensions: set[str] | None = None,
    ) -> "DocumentSource":
        if path is None or (isinstance(path, str) and not path.strip()):
            raise ValueError("The input path must not be empty.")
        file_path = Path(path).expanduser()
        try:
            if not file_path.exists():
                raise FileNotFoundError(f"File does not exist: {file_path}")
            if not file_path.is_file():
                raise IsADirectoryError(f"Path is not a file: {file_path}")
        except OSError as exc:
            raise FileReadError(f"Unable to access file '{file_path}': {exc}") from exc
        if extensions and file_path.suffix.lower() not in extensions:
            expected = ", ".join(sorted(extensions))
            raise ValueError(f"Expected one of {expected}, got: {file_path}")
        return cls(file_path)

    @property
    def suffix(self) -> str:
        return self.path.suffix.lower()

    @property
    def size(self) -> int:
        return self.path.stat().st_size

    def read_bytes(self) -> bytes:
        try:
            return self.path.read_bytes()
        except OSError as exc:
            raise FileReadError(f"Unable to read file '{self.path}': {exc}") from exc

    def iter_bytes(self, *, chunk_size: int = DEFAULT_CHUNK_SIZE):
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero.")
        try:
            with self.path.open("rb") as stream:
                while chunk := stream.read(chunk_size):
                    yield chunk
        except OSError as exc:
            raise FileReadError(f"Unable to read file '{self.path}': {exc}") from exc

    def read_text(self) -> tuple[str, str]:
        data = self.read_bytes()
        last_error: UnicodeError | None = None
        for encoding in TEXT_ENCODINGS:
            try:
                return data.decode(encoding), encoding
            except UnicodeDecodeError as exc:
                last_error = exc
        raise FileReadError(f"Unable to decode text file '{self.path}': {last_error}")

    def sha256(self) -> str:
        digest = hashlib.sha256()
        for chunk in self.iter_bytes():
            digest.update(chunk)
        return digest.hexdigest()

    def identity(self, *, root: Path | None = None) -> str:
        """Return a stable ID based on the source's logical relative path."""

        resolved = self.path.resolve()
        if root is not None:
            try:
                logical_path = resolved.relative_to(root.resolve())
            except ValueError:
                logical_path = resolved
        else:
            logical_path = Path(self.path.name)
        key = logical_path.as_posix().casefold()
        return hashlib.sha256(key.encode("utf-8")).hexdigest()


__all__ = ["DocumentSource", "TEXT_ENCODINGS"]
