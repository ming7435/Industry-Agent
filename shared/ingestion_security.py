"""Local asset boundaries shared by the two offline ingestion services."""
from __future__ import annotations

import io
import re
from pathlib import Path, PureWindowsPath

MAX_IMAGE_BYTES = 20 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000


def validate_collection_name(name: str) -> None:
    reserved = {'CON', 'PRN', 'AUX', 'NUL', *[f'COM{i}' for i in range(1, 10)], *[f'LPT{i}' for i in range(1, 10)]}
    if not name or len(name) > 255 or not all(char.isalnum() or char in '_-' for char in name) or name.upper() in reserved:
        raise ValueError('Collection must be a single safe index name')


def local_image_path(markdown_path: Path, reference: str, asset_root: Path | None = None) -> Path | None:
    if re.match(r'^(?:https?:|data:|//)', reference, flags=re.IGNORECASE):
        return None
    local = reference.split('#', 1)[0].split('?', 1)[0]
    windows = PureWindowsPath(local)
    if Path(local).is_absolute() or windows.drive or windows.root or ':' in local:
        raise ValueError('Image reference must be relative to the asset root')
    root = Path(asset_root or markdown_path.parent).resolve()
    candidate = (markdown_path.parent / local).resolve()
    if not candidate.is_relative_to(root):
        raise ValueError('Image reference escapes the asset root')
    return candidate if candidate.is_file() else None


def read_image_payload(path: Path) -> tuple[bytes, str]:
    from PIL import Image, UnidentifiedImageError
    with path.open('rb') as stream:
        data = stream.read(MAX_IMAGE_BYTES + 1)
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise ValueError('Image exceeds the configured byte budget')
    try:
        with Image.open(io.BytesIO(data)) as image:
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise ValueError('Image exceeds the configured pixel budget')
            media_type = Image.MIME.get(image.format or '')
            if not media_type or not media_type.startswith('image/'):
                raise ValueError('Unsupported image format')
            image.verify()
        with Image.open(io.BytesIO(data)) as decoded:
            decoded.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValueError('File is not a valid supported image') from error
    return data, media_type
