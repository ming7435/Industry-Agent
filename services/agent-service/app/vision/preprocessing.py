"""Validated, serializable PatchCore preprocessing and image geometry.

Configuration parsing deliberately needs no optional vision dependencies so it
can also validate persisted model metadata when the vision runtime is absent.
"""
from __future__ import annotations

import math


def parse_patchcore_config(value: dict | None) -> dict:
    """Expand a partial configuration, rejecting coercions and unknown fields."""
    defaults = {"input_size": 224, "resize_mode": "stretch", "contrast": "none", "blur_sigma": 4.0}
    if value is None:
        return defaults
    if not isinstance(value, dict):
        raise ValueError("PatchCore config must be an object")
    if set(value) - set(defaults):
        raise ValueError("PatchCore config contains unsupported fields")
    config = {**defaults, **value}
    if type(config["input_size"]) is not int or config["input_size"] not in (224, 448):
        raise ValueError("PatchCore input_size must be 224 or 448")
    if not isinstance(config["resize_mode"], str) or config["resize_mode"] not in ("stretch", "letterbox"):
        raise ValueError("PatchCore resize_mode must be stretch or letterbox")
    if not isinstance(config["contrast"], str) or config["contrast"] not in ("none", "clahe"):
        raise ValueError("PatchCore contrast must be none or clahe")
    sigma = config["blur_sigma"]
    if type(sigma) not in (int, float) or not 0 <= sigma <= 8 or not math.isfinite(sigma):
        raise ValueError("PatchCore blur_sigma must be a finite number between 0 and 8")
    config["blur_sigma"] = float(sigma)
    return config


def _patchcore_transform(image_size, config: dict) -> dict:
    """Compute geometry without resizing or applying contrast a second time."""
    width, height = image_size
    size = config["input_size"]
    if config["resize_mode"] == "letterbox":
        scale = min(size / width, size / height)
        resized_width = min(size, max(1, round(width * scale)))
        resized_height = min(size, max(1, round(height * scale)))
    else:
        resized_width = resized_height = size
    left = (size - resized_width) // 2
    top = (size - resized_height) // 2
    return {
        "original_size": [width, height],
        "input_size": size,
        "content_box": [left, top, left + resized_width, top + resized_height],
        "scale": [resized_width / width, resized_height / height],
    }


def prepare_patchcore_image(image, config: dict | None):
    """Return an RGB model canvas and its original-image-to-canvas transform.

CLAHE operates only on resized content's LAB L channel (clip 2, 8x8 tiles).
Letterbox padding replicates the enhanced content edge; it adds no black border.
The content box uses right/bottom-exclusive target-pixel coordinates.
"""
    config = parse_patchcore_config(config)
    import numpy as np
    from PIL import Image

    if not isinstance(image, Image.Image) or image.width <= 0 or image.height <= 0:
        raise ValueError("image must be a nonempty PIL image")
    if image.width * image.height > 16_000_000:
        raise ValueError("image exceeds the 16 million pixels limit")
    transform = _patchcore_transform(image.size, config)
    left, top, right, bottom = transform["content_box"]
    image = image if image.mode == "RGB" else image.convert("RGB")
    image = image.resize((right - left, bottom - top), Image.Resampling.BILINEAR)
    if config["contrast"] == "clahe":
        import cv2

        lab = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2LAB)
        lab[:, :, 0] = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(lab[:, :, 0])
        image = Image.fromarray(cv2.cvtColor(lab, cv2.COLOR_LAB2RGB))
    size = config["input_size"]
    if left or top or right != size or bottom != size:
        pixels = np.pad(np.asarray(image), ((top, size - bottom), (left, size - right), (0, 0)), mode="edge")
        image = Image.fromarray(pixels)
    return image, transform
