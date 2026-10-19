"""Preprocessing geometry and raw-distance contracts, independent of model accuracy."""
import importlib
import json
import math

import cv2
import numpy as np
from PIL import Image
import pytest

from app.vision.algorithms import PatchCoreDetector, nearest_distances


def preprocessing():
    return importlib.import_module("app.vision.preprocessing")


def detector(tmp_path, monkeypatch, features=None, grid=(4, 4), config=None):
    weights = tmp_path / "resnet18.pth"
    weights.write_bytes(b"test fixture")
    model = PatchCoreDetector(str(weights), config=config)
    if features is not None:
        monkeypatch.setattr(model, "_extract_features", lambda image: (features, grid))
    return model


def test_config_defaults_are_explicit_json_and_independent():
    parse = preprocessing().parse_patchcore_config
    expected = {"input_size": 224, "resize_mode": "stretch", "contrast": "none", "blur_sigma": 4.0}
    assert parse(None) == expected
    assert parse({}) == expected
    supplied = {"input_size": 448, "blur_sigma": 0}
    result = parse(supplied)
    assert result == {**expected, "input_size": 448, "blur_sigma": 0.0}
    supplied["input_size"] = 224
    assert result["input_size"] == 448
    json.dumps(result, allow_nan=False)


@pytest.mark.parametrize("config", [
    [], "default", 224, True,
    {"unknown": 1}, {"input_size": True}, {"input_size": 224.0},
    {"input_size": 1024}, {"input_size": None},
    {"resize_mode": "crop"}, {"resize_mode": True}, {"resize_mode": []},
    {"contrast": "CLAHE"}, {"contrast": False}, {"contrast": {}},
    {"blur_sigma": True}, {"blur_sigma": "4"}, {"blur_sigma": None},
    {"blur_sigma": -0.01}, {"blur_sigma": 8.01},
    {"blur_sigma": float("nan")}, {"blur_sigma": float("inf")},
])
def test_config_rejects_unsupported_or_ambiguous_values(config):
    with pytest.raises(ValueError, match="config|input_size|resize_mode|contrast|blur_sigma"):
        preprocessing().parse_patchcore_config(config)


def test_default_preparation_preserves_previous_rgb_bilinear_pixels():
    pixels = np.random.default_rng(4).integers(0, 256, (39, 101, 4), dtype=np.uint8)
    image = Image.fromarray(pixels)
    prepared, transform = preprocessing().prepare_patchcore_image(image, None)
    expected = image.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
    np.testing.assert_array_equal(prepared, expected)
    assert prepared.mode == "RGB"
    assert transform["content_box"] == [0, 0, 224, 224]
    assert transform["original_size"] == [101, 39]


@pytest.mark.parametrize("size,box", [((400, 200), [0, 112, 448, 336]), ((200, 400), [112, 0, 336, 448])])
def test_letterbox_keeps_aspect_ratio_and_replicates_edge_pixels(size, box):
    x, y = np.meshgrid(np.arange(size[0]), np.arange(size[1]))
    image = Image.fromarray(np.stack([x % 256, y % 256, (x + y) % 256], axis=-1).astype(np.uint8))
    prepared, transform = preprocessing().prepare_patchcore_image(image, {"input_size": 448, "resize_mode": "letterbox"})
    assert transform["content_box"] == box
    left, top, right, bottom = box
    resized = image.resize((right - left, bottom - top), Image.Resampling.BILINEAR)
    expected = np.pad(np.asarray(resized), ((top, 448 - bottom), (left, 448 - right), (0, 0)), mode="edge")
    np.testing.assert_array_equal(prepared, expected)


def test_clahe_changes_only_lab_luminance_before_rgb_conversion():
    x, y = np.meshgrid(np.arange(224), np.arange(224))
    rgb = np.stack([105 + x % 20, 60 + y % 15, 35 + (x + y) % 12], axis=-1).astype(np.uint8)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    expected_lab = lab.copy()
    expected_lab[:, :, 0] = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(lab[:, :, 0])
    expected = cv2.cvtColor(expected_lab, cv2.COLOR_LAB2RGB)
    prepared, _ = preprocessing().prepare_patchcore_image(Image.fromarray(rgb), {"contrast": "clahe"})
    np.testing.assert_array_equal(prepared, expected)
    assert not np.array_equal(np.asarray(prepared), rgb)


def test_letterbox_training_bank_excludes_padding_patch_centers(tmp_path, monkeypatch):
    features = np.arange(16, dtype=np.float32).reshape(-1, 1)
    model = detector(tmp_path, monkeypatch, features, config={"resize_mode": "letterbox"})
    result = model.fit([Image.new("RGB", (400, 200))], coreset_ratio=1)
    assert set(result["memory_bank"][:, 0]) == set(range(4, 12))
    assert result["metadata"]["patch_count"] == 8
    assert result["metadata"]["pipeline_version"] == 2
    assert result["metadata"]["preprocessing"] == model.config
    assert result["metadata"]["config"] == model.config


def test_fit_consumes_training_images_as_a_stream(tmp_path, monkeypatch):
    model = detector(tmp_path, monkeypatch)
    def extract(image):
        value = image.getpixel((0, 0))[0]
        return np.full((16, 1), value, dtype=np.float32), (4, 4)
    monkeypatch.setattr(model, "_extract_features", extract)
    def images():
        for value in (10, 20):
            image = Image.new("RGB", (80, 40), (value, 0, 0))
            try:
                yield image
            finally:
                image.close()
    result = model.fit(images(), coreset_ratio=1)
    assert result["metadata"]["sample_count"] == 2
    assert set(result["memory_bank"][:, 0]) == {10, 20}


def test_letterbox_rejects_training_content_with_no_patch_centers(tmp_path, monkeypatch):
    model = detector(tmp_path, monkeypatch, np.ones((16, 1), dtype=np.float32), config={"resize_mode": "letterbox"})
    with pytest.raises(ValueError, match="patch centers"):
        model.fit([Image.new("RGB", (400, 1))])


@pytest.mark.parametrize("size", [(448, 224), (224, 448)])
def test_letterbox_raw_heatmap_crops_padding_before_returning_global_coordinates(tmp_path, monkeypatch, size):
    # Patch centers lie at (column + .5) * 8, (row + .5) * 8 on the 448 canvas.
    features = np.zeros((56, 56), dtype=np.float32)
    if size[0] > size[1]:
        features[14, 42] = 10
    else:
        features[42, 14] = 10
    model = detector(tmp_path, monkeypatch, features.reshape(-1, 1), grid=(56, 56), config={"input_size": 448, "resize_mode": "letterbox", "blur_sigma": 0})
    image = Image.new("RGB", size)
    bank = np.zeros((1, 1), dtype=np.float32)
    heatmap = model.anomaly_map(image, bank)
    assert heatmap.shape == (size[1], size[0])
    assert heatmap.dtype == np.float32
    peak_y, peak_x = np.unravel_index(int(np.argmax(heatmap)), heatmap.shape)
    if size[0] > size[1]:
        assert abs(peak_x - 340) <= 1 and 0 <= peak_y <= 4
    else:
        assert 0 <= peak_x <= 4 and abs(peak_y - 340) <= 1
    predicted = model.predict(image, bank, threshold=4)
    assert predicted["score"] == float(heatmap.max())
    x1, y1, x2, y2 = predicted["defects"][0]["bbox"]
    assert x1 <= peak_x < x2 and y1 <= peak_y < y2
    if size[0] > size[1]:
        assert y1 == 0
    else:
        assert x1 == 0
    clear = model.predict(image, bank, math.nextafter(predicted["score"], math.inf))
    assert clear["status"] == "clear" and clear["defects"] == []


def test_default_raw_heatmap_and_score_match_legacy_smoothing(tmp_path, monkeypatch):
    features = np.array([[0], [1], [4], [10]], dtype=np.float32)
    model = detector(tmp_path, monkeypatch, features, grid=(2, 2))
    image = Image.new("RGB", (101, 39))
    expected = cv2.resize(features.reshape(2, 2), (224, 224), interpolation=cv2.INTER_LINEAR)
    expected = cv2.GaussianBlur(expected, (0, 0), sigmaX=4, sigmaY=4)
    expected = cv2.resize(expected, image.size, interpolation=cv2.INTER_LINEAR)
    actual = model.anomaly_map(image, np.zeros((1, 1), dtype=np.float32))
    np.testing.assert_array_equal(actual, expected)
    assert model.predict(image, np.zeros((1, 1), dtype=np.float32), 3)["score"] == float(expected.max())


def test_448_feature_budget_accepts_24_full_grids_and_rejects_overflow():
    queries = np.zeros((24 * 56 * 56, 1), dtype=np.float32)
    result = nearest_distances(queries, np.zeros((1, 1), dtype=np.float32), chunk_size=1024)
    assert result.shape == (24 * 56 * 56,)
    assert np.count_nonzero(result) == 0
    with pytest.raises(ValueError, match="feature size"):
        nearest_distances(np.zeros((24 * 56 * 56 + 1, 1), dtype=np.float32), np.zeros((1, 1), dtype=np.float32))


def test_raw_heatmap_keeps_memory_bank_capped_at_1024(tmp_path, monkeypatch):
    model = detector(tmp_path, monkeypatch, np.zeros((16, 1), dtype=np.float32))
    with pytest.raises(ValueError, match="1024"):
        model.anomaly_map(Image.new("RGB", (8, 8)), np.zeros((1025, 1), dtype=np.float32))


def test_clahe_feature_preparation_is_identical_for_training_and_inference(tmp_path, monkeypatch):
    torch = pytest.importorskip("torch")
    model = detector(tmp_path, monkeypatch, config={"input_size": 448, "contrast": "clahe", "blur_sigma": 0})
    model._torch = torch
    def extract(tensor):
        assert tuple(tensor.shape) == (1, 3, 448, 448)
        return {"layer2": torch.nn.functional.adaptive_avg_pool2d(tensor, (4, 4)), "layer3": torch.nn.functional.adaptive_avg_pool2d(tensor, (2, 2))}
    monkeypatch.setattr(model, "_load_extractor", lambda: extract)
    pixels = np.random.default_rng(9).integers(50, 90, (50, 120, 3), dtype=np.uint8)
    image = Image.fromarray(pixels)
    fitted = model.fit([image], coreset_ratio=1)
    result = model.predict(image, fitted["memory_bank"], threshold=0.01)
    assert result["score"] < 1e-6
    assert result["status"] == "clear"
    assert fitted["metadata"]["input_size"] == 448
