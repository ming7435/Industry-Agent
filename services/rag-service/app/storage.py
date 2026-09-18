"""Object storage support for original source files."""

from __future__ import annotations

import hashlib
import mimetypes
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from config.settings import env_bool, load_service_env


class ObjectStorageError(RuntimeError):
    """Raised when original files cannot be stored in object storage."""


@dataclass(frozen=True)
class ObjectStorageConfig:
    """MinIO/S3-compatible object storage settings."""

    endpoint: str = "127.0.0.1:9000"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "industry-rag-source"
    secure: bool = False
    prefix: str = "source-files"
    public_base_url: str | None = None

    def __post_init__(self) -> None:
        if not self.endpoint.strip():
            raise ValueError("object storage endpoint must not be empty.")
        if not self.access_key.strip() or not self.secret_key.strip():
            raise ValueError("object storage credentials must not be empty.")
        if not self.bucket.strip():
            raise ValueError("object storage bucket must not be empty.")

    @classmethod
    def from_env(cls) -> "ObjectStorageConfig":
        load_service_env()
        return cls(
            endpoint=os.getenv("OBJECT_STORAGE_ENDPOINT", cls.endpoint),
            access_key=os.getenv("OBJECT_STORAGE_ACCESS_KEY", cls.access_key),
            secret_key=os.getenv("OBJECT_STORAGE_SECRET_KEY", cls.secret_key),
            bucket=os.getenv("OBJECT_STORAGE_BUCKET", cls.bucket),
            secure=env_bool("OBJECT_STORAGE_SECURE", cls.secure),
            prefix=os.getenv("OBJECT_STORAGE_PREFIX", cls.prefix),
            public_base_url=os.getenv("OBJECT_STORAGE_PUBLIC_BASE_URL") or None,
        )


@dataclass(frozen=True)
class StoredObject:
    """Metadata for a file stored in MinIO/S3."""

    bucket: str
    key: str
    uri: str
    etag: str | None = None
    version_id: str | None = None

    def to_metadata(self) -> dict[str, Any]:
        return {
            "storage_bucket": self.bucket,
            "storage_key": self.key,
            "storage_uri": self.uri,
            "storage_etag": self.etag,
            "storage_version_id": self.version_id,
        }


class ObjectStorageClient:
    """Upload original files to MinIO/S3-compatible storage."""

    def __init__(self, config: ObjectStorageConfig | None = None, *, client: Any | None = None) -> None:
        self.config = config or ObjectStorageConfig.from_env()
        self.client = client or self._create_client()

    def ensure_bucket(self) -> None:
        try:
            if not self.client.bucket_exists(self.config.bucket):
                self.client.make_bucket(self.config.bucket)
        except Exception as exc:
            raise ObjectStorageError(f"Unable to ensure object bucket '{self.config.bucket}': {exc}") from exc

    def upload_file(self, path: Path, *, root: Path | None = None, object_key: str | None = None) -> StoredObject:
        self.ensure_bucket()
        key = object_key or object_key_for_path(path, root=root, prefix=self.config.prefix)
        media_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        try:
            result = self.client.fput_object(
                self.config.bucket,
                key,
                str(path),
                content_type=media_type,
            )
        except Exception as exc:
            raise ObjectStorageError(f"Unable to upload '{path}' to object storage: {exc}") from exc
        etag = getattr(result, "etag", None)
        version_id = getattr(result, "version_id", None)
        return StoredObject(
            bucket=self.config.bucket,
            key=key,
            uri=self._object_uri(key),
            etag=str(etag) if etag else None,
            version_id=str(version_id) if version_id else None,
        )

    def _object_uri(self, key: str) -> str:
        if self.config.public_base_url:
            return f"{self.config.public_base_url.rstrip('/')}/{key}"
        return f"s3://{self.config.bucket}/{key}"

    def _create_client(self) -> Any:
        try:
            from minio import Minio
        except ImportError as exc:
            raise ObjectStorageError("Object storage requires minio. Install it with 'pip install minio'.") from exc
        return Minio(
            self.config.endpoint,
            access_key=self.config.access_key,
            secret_key=self.config.secret_key,
            secure=self.config.secure,
        )


def object_key_for_path(path: Path, *, root: Path | None = None, prefix: str = "source-files") -> str:
    source = Path(path)
    try:
        relative = source.resolve().relative_to(root.resolve()) if root else Path(source.name)
    except ValueError:
        relative = Path(source.name)
    normalized = "/".join(part for part in relative.parts if part not in {"", "."})
    digest = _sha256_file(source)[:16]
    stem = normalized.rsplit(".", 1)[0] if "." in normalized else normalized
    suffix = source.suffix.lower()
    base = f"{stem}-{digest}{suffix}" if suffix else f"{stem}-{digest}"
    clean_prefix = prefix.strip("/")
    return f"{clean_prefix}/{base}" if clean_prefix else base


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()



__all__ = [
    "ObjectStorageClient",
    "ObjectStorageConfig",
    "ObjectStorageError",
    "StoredObject",
    "object_key_for_path",
]
