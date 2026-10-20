"""Local PatchCore-style anomaly detection and Ultralytics detection adapters.

Only operator-provided local weights are loaded. PatchCore uses ImageNet-normalized
ResNet18 layer2/layer3 patch embeddings; its distances are not probabilities.
The smaller backbone, projected coreset and bounded calibration sample are explicit
deployment choices, not a claim of equivalence to a benchmark configuration.
"""
from __future__ import annotations

import base64
import binascii
from io import BytesIO
import math
import os
from pathlib import Path
import threading
from typing import TYPE_CHECKING
import warnings

from .preprocessing import _patchcore_transform, parse_patchcore_config, prepare_patchcore_image

if TYPE_CHECKING:
    from collections.abc import Iterable
    import numpy as np
    from PIL import Image


MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_IMAGE_PIXELS = 16_000_000
MAX_TRAINING_SAMPLES = 24
INPUT_SIZE = 224
MAX_MEMORY_SIZE = 1024
PROJECTION_DIM = 64
MAX_CALIBRATION_PATCHES = 2048


class VisionUnavailable(RuntimeError):
    """Optional runtime, local weights, or model outputs are unavailable/invalid."""


def _numpy():
    try:
        import numpy
    except (ImportError, OSError) as exc:
        raise VisionUnavailable("Install requirements-vision.txt to enable visual inspection.") from exc
    return numpy


def _pillow():
    try:
        from PIL import Image, ImageDraw
    except (ImportError, OSError) as exc:
        raise VisionUnavailable("Install requirements-vision.txt to enable image decoding.") from exc
    return Image, ImageDraw


def _opencv():
    try:
        import cv2
    except (ImportError, OSError) as exc:
        raise VisionUnavailable("Install requirements-vision.txt to enable anomaly heatmaps.") from exc
    return cv2


def decode_image(data_url_or_bare_base64: str) -> Image.Image:
    """Decode a bounded still image, rejecting ambiguous MIME and unsafe images."""
    if not isinstance(data_url_or_bare_base64, str) or not data_url_or_bare_base64:
        raise ValueError("image must contain a PNG, JPEG or WebP base64 string")
    encoded = data_url_or_bare_base64
    declared_format = None
    if encoded.startswith("data:"):
        header, separator, encoded = encoded.partition(",")
        supported = {
            "data:image/png;base64": "PNG",
            "data:image/jpeg;base64": "JPEG",
            "data:image/webp;base64": "WEBP",
        }
        if not separator or header not in supported:
            raise ValueError("image data URL format must be PNG, JPEG or WebP base64")
        declared_format = supported[header]
    if len(encoded) > 4 * ((MAX_IMAGE_BYTES + 2) // 3):
        raise ValueError("image exceeds the 4 MiB decoded limit")
    try:
        content = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("image contains invalid base64") from exc
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError("image exceeds the 4 MiB decoded limit")
    Image, _ = _pillow()
    from PIL import ImageOps
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as image:
                if image.format not in {"PNG", "JPEG", "WEBP"}:
                    raise ValueError("image format must be PNG, JPEG or WebP")
                if declared_format and image.format != declared_format:
                    raise ValueError("image format does not match its declared MIME type")
                if image.width * image.height > MAX_IMAGE_PIXELS:
                    raise ValueError("image exceeds the 16 million pixels limit")
                if getattr(image, "n_frames", 1) != 1:
                    raise ValueError("image must contain one still frame")
                image.load()
                return ImageOps.exif_transpose(image).convert("RGB")
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValueError("image exceeds safe decompression pixels limits") from exc
    except (OSError, SyntaxError) as exc:
        raise ValueError("image bytes are not a valid PNG, JPEG or WebP image") from exc


def _validate_image(image):
    Image, _ = _pillow()
    if not isinstance(image, Image.Image) or image.width <= 0 or image.height <= 0:
        raise ValueError("image must be a nonempty PIL image")
    if image.width * image.height > MAX_IMAGE_PIXELS:
        raise ValueError("image exceeds the 16 million pixels limit")
    return image if image.mode == "RGB" else image.convert("RGB")


def _feature_matrix(features, name="features"):
    np = _numpy()
    try:
        values = np.asarray(features, dtype=np.float32)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"{name} must be a finite numeric feature matrix") from exc
    if values.ndim != 2 or not values.shape[0] or not values.shape[1] or not np.isfinite(values).all():
        raise ValueError(f"{name} must be a nonempty finite feature matrix")
    if values.shape[0] > MAX_TRAINING_SAMPLES * 56 * 56 or values.shape[1] > 4096:
        raise ValueError(f"{name} exceeds the supported feature size")
    return np.ascontiguousarray(values)


def nearest_distances(queries: np.ndarray, memory_bank: np.ndarray, chunk_size: int = 256) -> np.ndarray:
    """Exact L2 nearest neighbors, bounding both axes of the distance matrix."""
    np = _numpy()
    queries = _feature_matrix(queries, "queries")
    bank = _feature_matrix(memory_bank, "memory_bank")
    if queries.shape[1] != bank.shape[1]:
        raise ValueError("memory_bank feature dimensions do not match the backbone")
    if not isinstance(chunk_size, int) or not 1 <= chunk_size <= 1024:
        raise ValueError("chunk_size must be an integer between 1 and 1024")
    output = np.empty(len(queries), dtype=np.float32)
    # Float64 accumulation avoids cancellation for nearly identical normal patches.
    bank64 = bank.astype(np.float64)
    bank_norm = np.einsum("ij,ij->i", bank64, bank64)
    for start in range(0, len(queries), chunk_size):
        query = queries[start : start + chunk_size].astype(np.float64)
        query_norm = np.einsum("ij,ij->i", query, query)
        closest = np.full(len(query), np.inf)
        for bank_start in range(0, len(bank64), chunk_size):
            block = bank64[bank_start : bank_start + chunk_size]
            squared = query_norm[:, None] + bank_norm[bank_start : bank_start + chunk_size][None, :]
            squared -= 2.0 * (query @ block.T)
            closest = np.minimum(closest, np.maximum(squared, 0).min(axis=1))
        output[start : start + len(query)] = np.sqrt(closest)
    if not np.isfinite(output).all():
        raise ValueError("feature distances exceed the supported numeric range")
    return output


def greedy_coreset(features: np.ndarray, ratio: float = 0.1, max_size: int = MAX_MEMORY_SIZE) -> np.ndarray:
    """Deterministic greedy k-center; select original rows in a 64-D projection."""
    np = _numpy()
    features = _feature_matrix(features)
    if not math.isfinite(ratio) or not 0 < ratio <= 1:
        raise ValueError("coreset_ratio must be finite and in (0, 1]")
    if not isinstance(max_size, int) or not 1 <= max_size <= MAX_MEMORY_SIZE:
        raise ValueError("max_size must be an integer between 1 and 1024")
    count = min(max_size, max(1, math.ceil(len(features) * ratio)))
    projected = features.astype(np.float64)
    if features.shape[1] > PROJECTION_DIM:
        projection = np.random.default_rng(0).normal(size=(features.shape[1], PROJECTION_DIM))
        projected = projected @ (projection / math.sqrt(PROJECTION_DIM))
    # Starting at an extreme covers rare normal appearances better than row zero.
    offset = projected - projected.mean(axis=0)
    next_index = int(np.argmax(np.einsum("ij,ij->i", offset, offset)))
    closest = np.full(len(features), np.inf)
    indices = []
    for _ in range(count):
        indices.append(next_index)
        offset = projected - projected[next_index]
        closest = np.minimum(closest, np.einsum("ij,ij->i", offset, offset))
        closest[indices] = -1  # Identical patches still produce distinct sampled rows.
        next_index = int(np.argmax(closest))
    return features[indices].copy()


def _local_weights(value: str, suffixes: set[str]) -> Path:
    try:
        if not isinstance(value, str) or not value.strip() or "://" in value:
            raise ValueError()
        path = Path(value).expanduser().resolve(strict=True)
        if not path.is_file() or path.suffix.lower() not in suffixes:
            raise ValueError()
    except (OSError, ValueError, RuntimeError) as exc:
        raise VisionUnavailable("Configure an existing trusted local model weights file with a supported extension.") from exc
    return path


def _png_data_url(image):
    output = BytesIO()
    image.save(output, format="PNG")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def _annotated(image, defects):
    _, ImageDraw = _pillow()
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)
    width = max(2, round(min(image.size) / 300))
    for defect in defects:
        x1, y1, x2, y2 = defect["bbox"]
        # Detection boxes are continuous, right/bottom-exclusive coordinates;
        # Pillow draws inclusive integer pixels, including subpixel edge boxes.
        left = max(0, min(image.width - 1, math.floor(x1)))
        top = max(0, min(image.height - 1, math.floor(y1)))
        right = max(left, min(image.width - 1, math.ceil(x2) - 1))
        bottom = max(top, min(image.height - 1, math.ceil(y2) - 1))
        draw.rectangle((left, top, right, bottom), outline=(255, 55, 55), width=width)
        label = defect["label"]
        if defect["confidence"] is not None:
            label += f" {defect['confidence']:.2f}"
        try:
            draw.text((x1 + 2, max(0, y1 - 12)), label, fill=(255, 55, 55))
        except UnicodeEncodeError:
            draw.text((x1 + 2, max(0, y1 - 12)), label.encode("ascii", "replace").decode(), fill=(255, 55, 55))
    return _png_data_url(annotated)


def _step(name, detail):
    return {"name": name, "status": "completed", "detail": detail}


class PatchCoreDetector:
    """A bounded CPU PatchCore pipeline backed by an operator-supplied ResNet18."""

    def __init__(self, backbone_weights: str, config: dict | None = None):
        self.config = parse_patchcore_config(config)
        self.weights = _local_weights(backbone_weights, {".pt", ".pth", ".bin"})
        self._extractor = None
        self._torch = None
        self._lock = threading.RLock()

    def _load_extractor(self):
        with self._lock:
            if self._extractor is not None:
                return self._extractor
            try:
                import torch
                from torchvision.models import resnet18
                from torchvision.models.feature_extraction import create_feature_extractor
            except (ImportError, OSError, RuntimeError) as exc:
                raise VisionUnavailable("Install compatible torch/torchvision from requirements-vision.txt for PatchCore.") from exc
            try:
                # Explicit weights=None prevents Torchvision's weight downloader.
                model = resnet18(weights=None)
                state = torch.load(str(self.weights), map_location="cpu", weights_only=True)
                if isinstance(state, dict) and "state_dict" in state:
                    state = state["state_dict"]
                model.load_state_dict(state, strict=True)
                model.eval().requires_grad_(False)
                extractor = create_feature_extractor(model, return_nodes={"layer2": "layer2", "layer3": "layer3"})
                self._extractor = extractor.eval()
                self._torch = torch
            except Exception as exc:
                raise VisionUnavailable("The local PatchCore weights must be a compatible ResNet18 state_dict.") from exc
            return self._extractor

    def _extract_features(self, image: Image.Image):
        np = _numpy()
        _pillow()
        extractor = self._load_extractor()
        torch = self._torch
        if self.config["contrast"] == "clahe":
            _opencv()
        image, _ = prepare_patchcore_image(image, self.config)
        pixels = np.asarray(image, dtype=np.float32) / 255.0
        pixels = (pixels - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)
        tensor = torch.from_numpy(pixels.transpose(2, 0, 1).copy()).unsqueeze(0)
        try:
            with self._lock, torch.inference_mode():
                layers = extractor(tensor)
                layer2 = torch.nn.functional.avg_pool2d(layers["layer2"], kernel_size=3, stride=1, padding=1)
                layer3 = torch.nn.functional.avg_pool2d(layers["layer3"], kernel_size=3, stride=1, padding=1)
                layer3 = torch.nn.functional.interpolate(layer3, size=layer2.shape[-2:], mode="bilinear", align_corners=False)
                embedding = torch.cat([layer2, layer3], dim=1)
                grid = (int(embedding.shape[2]), int(embedding.shape[3]))
                features = embedding.permute(0, 2, 3, 1).reshape(-1, embedding.shape[1]).cpu().numpy()
        except Exception as exc:
            raise VisionUnavailable("PatchCore feature extraction failed with the configured local backbone.") from exc
        return _feature_matrix(features), grid

    def fit(self, images: Iterable[Image.Image], coreset_ratio: float = 0.1) -> dict:
        np = _numpy()
        if not math.isfinite(coreset_ratio) or not 0 < coreset_ratio <= 1:
            raise ValueError("coreset_ratio must be finite and in (0, 1]")
        feature_batches = []
        for image in images:
            if len(feature_batches) >= MAX_TRAINING_SAMPLES:
                raise ValueError("PatchCore requires 1 to 24 normal training images")
            image = _validate_image(image)
            features, grid = self._extract_features(image)
            if self.config["resize_mode"] == "letterbox":
                left, top, right, bottom = _patchcore_transform(image.size, self.config)["content_box"]
                size = self.config["input_size"]
                centers_x = (np.arange(grid[1]) + 0.5) * size / grid[1]
                centers_y = (np.arange(grid[0]) + 0.5) * size / grid[0]
                valid = ((centers_y >= top) & (centers_y < bottom))[:, None] & ((centers_x >= left) & (centers_x < right))[None, :]
                features = features[valid.reshape(-1)]
                if not len(features):
                    raise ValueError("Letterbox training content contains no patch centers; use a less extreme image aspect ratio")
            feature_batches.append(features)
        if not feature_batches:
            raise ValueError("PatchCore requires 1 to 24 normal training images")
        sample_count_images = len(feature_batches)
        features = np.concatenate(feature_batches, axis=0)
        del feature_batches
        memory_bank = greedy_coreset(features, ratio=coreset_ratio)
        sample_count = min(len(features), MAX_CALIBRATION_PATCHES)
        calibration = features[np.linspace(0, len(features) - 1, sample_count, dtype=int)]
        training_distances = nearest_distances(calibration, memory_bank)
        suggested = max(0.001, float(np.quantile(training_distances, 0.99)) * 1.2)
        return {
            "memory_bank": memory_bank,
            "metadata": {
                "algorithm": "patchcore",
                "pipeline_version": 2,
                "preprocessing": dict(self.config),
                "config": dict(self.config),
                "backbone": "resnet18_layer2_layer3",
                "sample_count": sample_count_images,
                "patch_count": len(features),
                "memory_size": len(memory_bank),
                "feature_dimension": int(features.shape[1]),
                "input_size": self.config["input_size"],
                "coreset_ratio": float(coreset_ratio),
                "coreset_method": "deterministic_greedy_k_center_random_projection",
                "projection_dimension": min(PROJECTION_DIM, int(features.shape[1])),
                "projection_seed": 0,
                "calibration_patch_count": sample_count,
                "suggested_threshold": suggested,
                "threshold_method": "heuristic_training_patch_p99_times_1.2_floor_0.001",
                "calibration_required": True,
                "calibration_note": "Validate the threshold on separate normal and defective images; distances are not probabilities.",
                "score_method": "max_smoothed_pixel_nearest_neighbor_distance",
            },
        }

    def anomaly_map(self, image: Image.Image, memory_bank: np.ndarray) -> np.ndarray:
        """Return unnormalized float32 L2 distances in original image coordinates."""
        cv2 = _opencv()
        image = _validate_image(image)
        bank = _feature_matrix(memory_bank, "memory_bank")
        if len(bank) > MAX_MEMORY_SIZE:
            raise ValueError("memory_bank exceeds the 1024 patch limit")
        features, grid = self._extract_features(image)
        distances = nearest_distances(features, bank).reshape(grid)
        # Smooth at the bounded model resolution, then map back to original pixels.
        size = self.config["input_size"]
        heatmap = cv2.resize(distances, (size, size), interpolation=cv2.INTER_LINEAR)
        sigma = self.config["blur_sigma"]
        if sigma > 0:
            heatmap = cv2.GaussianBlur(heatmap, (0, 0), sigmaX=sigma, sigmaY=sigma)
        left, top, right, bottom = _patchcore_transform(image.size, self.config)["content_box"]
        heatmap = heatmap[top:bottom, left:right]
        heatmap = cv2.resize(heatmap, image.size, interpolation=cv2.INTER_LINEAR)
        return heatmap

    def predict(self, image: Image.Image, memory_bank: np.ndarray, threshold: float) -> dict:
        if not math.isfinite(threshold) or threshold <= 0:
            raise ValueError("PatchCore threshold must be a positive finite calibrated raw distance")
        np = _numpy()
        cv2 = _opencv()
        Image, _ = _pillow()
        image = _validate_image(image)
        heatmap = self.anomaly_map(image, memory_bank)
        score = float(heatmap.max())
        # Match Python float score comparisons without rounding the threshold to
        # float32 (otherwise a clear image can still acquire anomaly regions).
        mask = (heatmap.astype(np.float64) >= threshold).astype(np.uint8)
        count, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        defects = []
        # Bounds are inclusive/exclusive image coordinates, including border defects.
        for region in sorted(stats[1:count], key=lambda row: int(row[cv2.CC_STAT_AREA]), reverse=True)[:100]:
            x, y, width, height, _ = [int(value) for value in region]
            defects.append({"label": "anomaly", "confidence": None, "bbox": [x, y, x + width, y + height]})
        scaled = np.clip(heatmap.astype(np.float64) / threshold * 127.5, 0, 255).astype(np.uint8)
        colors = cv2.cvtColor(cv2.applyColorMap(scaled, cv2.COLORMAP_TURBO), cv2.COLOR_BGR2RGB)
        overlay = Image.blend(image, Image.fromarray(colors), alpha=0.42)
        return {
            "algorithm": "patchcore",
            "status": "defect" if score >= threshold else "clear",
            "score": score,
            "threshold": float(threshold),
            "defects": defects,
            "image": {"width": image.width, "height": image.height},
            "annotated_image": _annotated(overlay, defects),
            "heatmap_image": _png_data_url(Image.fromarray(colors)),
            "steps": [
                _step("preprocess", f"RGB image {self.config['resize_mode']} resized to {self.config['input_size']} × {self.config['input_size']}; contrast {self.config['contrast']}; ImageNet normalized."),
                _step("extract_features", "ResNet18 layer2/layer3 locally averaged patches aligned and concatenated."),
                _step("nearest_neighbors", f"Compared image patches with {len(memory_bank)} normal memory patches using L2 distances."),
                _step("localize", f"Smoothed distance heatmap and applied raw threshold {threshold:g}; {len(defects)} regions."),
            ],
        }


class YoloDetector:
    """Detection-only local Ultralytics adapter; weights must be defect-trained."""

    def __init__(self, weights: str, input_size: int = 640):
        if type(input_size) is not int or input_size not in (320, 640):
            raise ValueError('YOLO input size must be 320 or 640')
        self.input_size = input_size
        self.weights = _local_weights(weights, {".pt", ".onnx"})
        self._model = None
        self._lock = threading.RLock()

    def _load_model(self):
        with self._lock:
            if self._model is not None:
                return self._model
            # Optional dependencies must be installed explicitly, never by prediction.
            os.environ["YOLO_AUTOINSTALL"] = "false"
            os.environ["ULTRALYTICS_SAFE_LOAD"] = "1"
            try:
                if self.weights.suffix.lower() == ".onnx":
                    import onnxruntime  # noqa: F401
                from ultralytics import YOLO
            except (ImportError, OSError, RuntimeError) as exc:
                raise VisionUnavailable("Install requirements-vision.txt (including onnxruntime for ONNX) to enable YOLO.") from exc
            try:
                model = YOLO(str(self.weights), task="detect")
                if model.task != "detect":
                    raise ValueError("model task is not detect")
                self._model = model
            except Exception as exc:
                raise VisionUnavailable("The local YOLO weights must be a compatible defect detection model.") from exc
            return self._model

    def predict(self, image: Image.Image, confidence: float = 0.25, iou: float = 0.45) -> dict:
        if not math.isfinite(confidence) or not 0 < confidence <= 1:
            raise ValueError("confidence must be finite and in (0, 1]")
        if not math.isfinite(iou) or not 0 < iou <= 1:
            raise ValueError("iou must be finite and in (0, 1]")
        np = _numpy()
        image = _validate_image(image)
        with self._lock:
            model = self._load_model()
            try:
                results = model.predict(source=image, conf=float(confidence), iou=float(iou), device="cpu", save=False, verbose=False, imgsz=self.input_size, max_det=300)
                if len(results) != 1 or results[0].boxes is None:
                    raise ValueError("expected one detection result")
                boxes = results[0].boxes
                coordinates = np.asarray(boxes.xyxy.cpu().numpy(), dtype=np.float64)
                confidences = np.asarray(boxes.conf.cpu().numpy(), dtype=np.float64)
                classes = np.asarray(boxes.cls.cpu().numpy(), dtype=np.float64)
                names = results[0].names
                if coordinates.shape != (len(confidences), 4) or classes.shape != confidences.shape or confidences.ndim != 1:
                    raise ValueError("inconsistent detection output shapes")
                if not all(np.isfinite(value).all() for value in (coordinates, confidences, classes)):
                    raise ValueError("nonfinite detection output")
                if np.any((confidences < 0) | (confidences > 1)) or np.any(classes < 0) or np.any(classes != np.floor(classes)):
                    raise ValueError("invalid confidence or class output")
                defects = []
                for xyxy, conf, class_id in zip(coordinates, confidences, classes):
                    if conf < confidence:
                        continue
                    x1, y1, x2, y2 = xyxy
                    x1, x2 = float(np.clip(x1, 0, image.width)), float(np.clip(x2, 0, image.width))
                    y1, y2 = float(np.clip(y1, 0, image.height)), float(np.clip(y2, 0, image.height))
                    if x2 <= x1 or y2 <= y1:
                        raise ValueError("invalid or off-image detection output coordinates")
                    label = str(names[int(class_id)])
                    defects.append({"label": label, "confidence": float(conf), "bbox": [x1, y1, x2, y2]})
            except Exception as exc:
                raise VisionUnavailable("YOLO inference failed or returned invalid detection output; verify the local model and runtime.") from exc
        return {
            "algorithm": "yolo",
            "status": "defect" if defects else "clear",
            "score": max((defect["confidence"] for defect in defects), default=0.0),
            "threshold": float(confidence),
            "defects": defects,
            "image": {"width": image.width, "height": image.height},
            "annotated_image": _annotated(image, defects),
            "steps": [
                _step("preprocess", "Validated RGB image; Ultralytics applies its detection preprocessing."),
                _step("detect", "Executed the configured local YOLO detection model on CPU."),
                _step("filter", f"Applied confidence {confidence:g} and IoU {iou:g}; {len(defects)} detected defects."),
                _step("annotate", "Mapped detected boxes and class labels to the original image coordinates."),
            ],
        }
