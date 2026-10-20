"""Numerical and adapter contracts; these tests do not certify pretrained models."""
import base64
import builtins
from io import BytesIO
import json
import math
from types import SimpleNamespace

import numpy as np
from PIL import Image
import pytest

from app.vision.algorithms import (
    PatchCoreDetector,
    VisionUnavailable,
    YoloDetector,
    decode_image,
    greedy_coreset,
    nearest_distances,
)


def encoded_image(format="PNG", size=(12, 8), mode="RGB"):
    output = BytesIO()
    Image.new(mode, size, color=0).save(output, format=format)
    return base64.b64encode(output.getvalue()).decode("ascii")


@pytest.mark.parametrize("format,mime", [("PNG", "png"), ("JPEG", "jpeg"), ("WEBP", "webp")])
def test_decode_accepts_supported_images_and_returns_loaded_rgb(format, mime):
    image = decode_image(f"data:image/{mime};base64,{encoded_image(format, mode='L')}")
    assert image.mode == "RGB"
    assert image.size == (12, 8)
    assert image.getpixel((0, 0)) == (0, 0, 0)


def test_decode_accepts_bare_base64():
    assert decode_image(encoded_image()).size == (12, 8)


def test_decode_applies_camera_exif_orientation_to_match_displayed_dimensions():
    output = BytesIO()
    image = Image.new("RGB", (12, 8), color=0)
    exif = image.getexif()
    exif[274] = 6
    image.save(output, format="JPEG", exif=exif)
    decoded = decode_image(base64.b64encode(output.getvalue()).decode("ascii"))
    assert decoded.size == (8, 12)
    assert decoded.getexif().get(274) is None


@pytest.mark.parametrize("value", ["", "YWJj%%", "YW Jj", "data:text/plain;base64,YWJj", "data:image/png,YWJj", "YWJj"])
def test_decode_rejects_malformed_or_nonimage_payloads(value):
    with pytest.raises(ValueError):
        decode_image(value)


def test_decode_rejects_unsupported_image_and_forged_mime():
    with pytest.raises(ValueError, match="format"):
        decode_image(encoded_image("GIF"))
    with pytest.raises(ValueError, match="match"):
        decode_image("data:image/jpeg;base64," + encoded_image("PNG"))


def test_decode_rejects_more_than_four_mib_before_image_decoding():
    payload = base64.b64encode(b"x" * (4 * 1024 * 1024 + 1)).decode("ascii")
    with pytest.raises(ValueError, match="4 MiB"):
        decode_image(payload)


def test_decode_rejects_oversized_pixel_count():
    with pytest.raises(ValueError, match="16 million"):
        decode_image(encoded_image(size=(4001, 4000), mode="1"))


def test_decode_treats_pillow_bomb_warning_as_invalid(monkeypatch):
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 50)
    with pytest.raises(ValueError, match="pixels|decompression"):
        decode_image(encoded_image(size=(10, 8)))


def test_chunked_nearest_distances_match_hand_calculated_euclidean_distances():
    queries = np.array([[0, 0], [3, 4], [10, 10]], dtype=np.float32)
    bank = np.array([[0, 0], [6, 8]], dtype=np.float32)
    result = nearest_distances(queries, bank, chunk_size=1)
    np.testing.assert_allclose(result, [0, 5, np.sqrt(20)], rtol=1e-6)


@pytest.mark.parametrize("queries,bank", [
    (np.array([[np.nan, 0]]), np.zeros((1, 2))),
    (np.zeros((1, 2)), np.zeros((0, 2))),
    (np.zeros((1, 2)), np.zeros((1, 3))),
])
def test_distances_reject_corrupt_memory(queries, bank):
    with pytest.raises(ValueError):
        nearest_distances(queries, bank)


def test_greedy_coreset_preserves_extremes_and_never_invents_features():
    features = np.array([[0.0], [1.0], [2.0], [3.0], [20.0]], dtype=np.float32)
    bank = greedy_coreset(features, ratio=0.4, max_size=20)
    assert bank.shape == (2, 1)
    assert set(bank[:, 0]) == {0, 20}
    np.testing.assert_array_equal(bank, greedy_coreset(features, ratio=0.4, max_size=20))


def test_greedy_coreset_honors_limit_and_degenerate_features():
    features = np.ones((100, 8), dtype=np.float32)
    bank = greedy_coreset(features, ratio=1, max_size=7)
    assert bank.shape == (7, 8)
    np.testing.assert_array_equal(bank, np.ones((7, 8), dtype=np.float32))


@pytest.mark.parametrize("ratio", [0, -0.1, 1.1, float("nan")])
def test_greedy_coreset_rejects_invalid_ratio(ratio):
    with pytest.raises(ValueError):
        greedy_coreset(np.ones((2, 2), dtype=np.float32), ratio=ratio)


def test_models_require_existing_local_weights(tmp_path):
    for create in (PatchCoreDetector, YoloDetector):
        with pytest.raises(VisionUnavailable, match="local"):
            create(str(tmp_path / "missing.pt"))
        with pytest.raises(VisionUnavailable, match="local"):
            create("https://example.test/model.pt")


def test_missing_deep_learning_packages_produce_actionable_error(tmp_path, monkeypatch):
    weights = tmp_path / "model.pt"
    weights.write_bytes(b"not-a-model")
    original = builtins.__import__

    def unavailable(name, *args, **kwargs):
        if name in {"torch", "torchvision", "ultralytics"} or name.startswith(("torch.", "torchvision.")):
            raise ModuleNotFoundError(name)
        return original(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", unavailable)
    with pytest.raises(VisionUnavailable, match="requirements-vision"):
        PatchCoreDetector(str(weights)).fit([Image.new("RGB", (10, 10))])
    with pytest.raises(VisionUnavailable, match="requirements-vision"):
        YoloDetector(str(weights)).predict(Image.new("RGB", (10, 10)))


def feature_detector(tmp_path, monkeypatch, features):
    """Replace only unavailable CNN extraction; scoring and images remain real."""
    weights = tmp_path / "features.pt"
    weights.write_bytes(b"fixture")
    detector = PatchCoreDetector(str(weights))
    monkeypatch.setattr(detector, "_extract_features", lambda image: (features, (2, 2)))
    return detector


def test_patchcore_fit_builds_numeric_bank_with_explicit_heuristic_calibration(tmp_path, monkeypatch):
    features = np.array([[0, 0], [1, 0], [2, 0], [4, 0]], dtype=np.float32)
    detector = feature_detector(tmp_path, monkeypatch, features)
    result = detector.fit([Image.new("RGB", (12, 8))], coreset_ratio=0.5)
    assert result["memory_bank"].shape == (2, 2)
    metadata = result["metadata"]
    assert metadata["sample_count"] == 1
    assert metadata["patch_count"] == 4
    assert metadata["memory_size"] == 2
    assert metadata["suggested_threshold"] > 0
    assert metadata["calibration_required"] is True
    assert "heuristic" in metadata["threshold_method"]
    json.dumps(metadata, allow_nan=False)


@pytest.mark.parametrize("count", [0, 25])
def test_patchcore_fit_limits_training_sample_count(tmp_path, monkeypatch, count):
    detector = feature_detector(tmp_path, monkeypatch, np.ones((4, 2), dtype=np.float32))
    with pytest.raises(ValueError, match="1.*24"):
        detector.fit([Image.new("RGB", (12, 8))] * count)


@pytest.mark.parametrize("threshold", [0, -1, float("nan"), float("inf")])
def test_patchcore_predict_rejects_uncalibrated_threshold(tmp_path, monkeypatch, threshold):
    detector = feature_detector(tmp_path, monkeypatch, np.ones((4, 2), dtype=np.float32))
    with pytest.raises(ValueError, match="threshold"):
        detector.predict(Image.new("RGB", (12, 8)), np.zeros((1, 2), dtype=np.float32), threshold)


def test_patchcore_predict_reports_raw_distance_and_full_size_overlay(tmp_path, monkeypatch):
    detector = feature_detector(tmp_path, monkeypatch, np.full((4, 2), [3, 4], dtype=np.float32))
    result = detector.predict(Image.new("RGB", (12, 8)), np.zeros((1, 2), dtype=np.float32), threshold=2)
    assert result["algorithm"] == "patchcore"
    assert result["status"] == "defect"
    assert result["score"] == pytest.approx(5)
    assert result["threshold"] == 2
    assert result["image"] == {"width": 12, "height": 8}
    assert result["defects"][0]["bbox"] == [0, 0, 12, 8]
    assert result["defects"][0]["confidence"] is None
    assert decode_image(result["annotated_image"]).size == (12, 8)
    assert decode_image(result["heatmap_image"]).size == (12, 8)
    assert all(step["status"] == "completed" for step in result["steps"])
    json.dumps(result, allow_nan=False)


def test_patchcore_matching_normal_features_are_clear(tmp_path, monkeypatch):
    detector = feature_detector(tmp_path, monkeypatch, np.zeros((4, 2), dtype=np.float32))
    result = detector.predict(Image.new("RGB", (12, 8)), np.zeros((1, 2), dtype=np.float32), threshold=1)
    assert result["score"] == 0
    assert result["status"] == "clear"
    assert result["defects"] == []


def test_patchcore_threshold_uses_same_precision_for_score_and_regions(tmp_path, monkeypatch):
    detector = feature_detector(tmp_path, monkeypatch, np.full((4, 2), [3, 4], dtype=np.float32))
    image = Image.new("RGB", (12, 8))
    bank = np.zeros((1, 2), dtype=np.float32)
    baseline = detector.predict(image, bank, threshold=2)
    # A threshold strictly above an unchanged image's score must have no regions,
    # even when both values round to the same float32 number.
    result = detector.predict(image, bank, threshold=math.nextafter(baseline["score"], math.inf))
    assert result["status"] == "clear"
    assert result["score"] < result["threshold"]
    assert result["defects"] == []


@pytest.mark.parametrize("confidence,iou", [(0, .45), (1.1, .45), (.25, -1), (.25, float("nan"))])
def test_yolo_rejects_invalid_inference_thresholds_before_model_loading(tmp_path, confidence, iou):
    weights = tmp_path / "model.pt"
    weights.write_bytes(b"fixture")
    with pytest.raises(ValueError):
        YoloDetector(str(weights)).predict(Image.new("RGB", (12, 8)), confidence=confidence, iou=iou)


class OutputTensor:
    def __init__(self, value):
        self.value = np.asarray(value, dtype=np.float32)

    def cpu(self):
        return self

    def numpy(self):
        return self.value


def yolo_adapter(tmp_path, monkeypatch, coordinates, confidences, classes):
    weights = tmp_path / "model.pt"
    weights.write_bytes(b"fixture")
    detector = YoloDetector(str(weights))
    result = SimpleNamespace(
        boxes=SimpleNamespace(xyxy=OutputTensor(coordinates), conf=OutputTensor(confidences), cls=OutputTensor(classes)),
        names={0: "scratch", 1: "dent"},
    )

    def predict(*, source, conf, iou, device, save, verbose, imgsz, max_det):
        assert isinstance(source, Image.Image)
        assert conf == .25 and iou == .45 and device == "cpu"
        assert save is False and verbose is False and imgsz == 640 and max_det <= 300
        return [result]

    monkeypatch.setattr(detector, "_load_model", lambda: SimpleNamespace(task="detect", predict=predict))
    return detector


def test_yolo_converts_actual_box_fields_to_clamped_defect_annotations(tmp_path, monkeypatch):
    detector = yolo_adapter(tmp_path, monkeypatch, [[-2, 1, 13, 7], [2, 2, 4, 5]], [.8, .2], [1, 0])
    result = detector.predict(Image.new("RGB", (12, 8)))
    assert result["status"] == "defect"
    assert result["algorithm"] == "yolo"
    assert result["score"] == pytest.approx(.8)
    assert result["threshold"] == .25
    assert result["defects"][0]["bbox"] == [0, 1, 12, 7]
    assert result["defects"][0]["label"] == "dent"
    assert len(result["defects"]) == 1
    assert decode_image(result["annotated_image"]).size == (12, 8)
    json.dumps(result, allow_nan=False)


def test_yolo_empty_detections_are_clear(tmp_path, monkeypatch):
    detector = yolo_adapter(tmp_path, monkeypatch, np.empty((0, 4)), [], [])
    result = detector.predict(Image.new("RGB", (12, 8)))
    assert result["status"] == "clear"
    assert result["score"] == 0
    assert result["defects"] == []


def test_yolo_uses_saved_input_size_and_rejects_invalid_sizes(tmp_path, monkeypatch):
    weights = tmp_path / 'sized.pt'
    weights.write_bytes(b'fixture')
    for invalid in (0, 321, True, '320'):
        with pytest.raises(ValueError):
            YoloDetector(str(weights), input_size=invalid)
    detector = YoloDetector(str(weights), input_size=320)
    seen = []
    def predict(**kwargs):
        seen.append(kwargs['imgsz'])
        return [SimpleNamespace(boxes=SimpleNamespace(xyxy=OutputTensor(np.empty((0,4))), conf=OutputTensor([]), cls=OutputTensor([])), names={})]
    monkeypatch.setattr(detector, '_load_model', lambda: SimpleNamespace(predict=predict))
    assert detector.predict(Image.new('RGB', (12, 8)))['status'] == 'clear'
    assert seen == [320]


@pytest.mark.parametrize("box,edge_pixel", [([11.8, 1, 12, 5], (11, 3)), ([2, 7.8, 5, 8], (3, 7))])
def test_yolo_subpixel_edge_boxes_remain_drawable(tmp_path, monkeypatch, box, edge_pixel):
    detector = yolo_adapter(tmp_path, monkeypatch, [box], [.8], [0])
    result = detector.predict(Image.new("RGB", (12, 8)))
    assert result["status"] == "defect"
    np.testing.assert_allclose(result["defects"][0]["bbox"], box)
    assert decode_image(result["annotated_image"]).getpixel(edge_pixel) == (255, 55, 55)


def test_yolo_invalid_model_output_is_not_reported_as_clear(tmp_path, monkeypatch):
    detector = yolo_adapter(tmp_path, monkeypatch, [[0, 0, float("nan"), 5]], [.8], [0])
    with pytest.raises(VisionUnavailable, match="output"):
        detector.predict(Image.new("RGB", (12, 8)))


@pytest.mark.parametrize("box", [[4, 1, 4, 5], [15, 1, 20, 5], [8, 1, 2, 5]])
def test_yolo_invalid_high_confidence_geometry_is_not_reported_as_clear(tmp_path, monkeypatch, box):
    detector = yolo_adapter(tmp_path, monkeypatch, [box], [.8], [0])
    with pytest.raises(VisionUnavailable, match="output"):
        detector.predict(Image.new("RGB", (12, 8)))
