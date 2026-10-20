"""Offline streaming contracts with synthetic embeddings, not model accuracy claims."""
import json
from types import SimpleNamespace

import numpy as np
from PIL import Image
import pytest

from app.vision.algorithms import MAX_MEMORY_SIZE, PatchCoreDetector, nearest_distances
from app.vision.offline import MAX_OFFLINE_CANDIDATES, fit_full_memory
from app.vision.preprocessing import parse_patchcore_config


def fake_detector(extract=None, config=None):
    calls = []

    def features(image):
        marker = image.info["marker"]
        calls.append(marker)
        if extract:
            return extract(marker)
        return np.full((4, 2), marker, dtype=np.float32), (2, 2)

    return SimpleNamespace(config=parse_patchcore_config(config), _extract_features=features, calls=calls)


def images(count, calls=None, size=(12, 12)):
    for index in range(count):
        if calls is not None:
            assert len(calls) == index, "images must be extracted before advancing the input stream"
        with Image.new("RGB", size) as image:
            image.info["marker"] = index
            yield image


def test_more_than_24_images_are_streamed_and_late_outlier_is_represented():
    def extract(index):
        features = np.zeros((64, 2), dtype=np.float32)
        if index == 34:
            features[-1] = [1000, -1000]
        return features, (8, 8)

    detector = fake_detector(extract)
    events = []
    fitted = fit_full_memory(detector, images(35, detector.calls), expected_count=35, progress=events.append)
    assert detector.calls == list(range(35))
    bank, metadata = fitted["memory_bank"], fitted["metadata"]
    assert any(np.array_equal(row, [1000, -1000]) for row in bank)
    assert metadata["sample_count"] == 35 and metadata["all_images_processed"] is True
    assert metadata["original_feature_count"] == 35 * 64
    assert metadata["candidate_feature_count"] == 35 * 32
    assert metadata["selected_features"] == len(bank) == metadata["memory_size"]
    assert metadata["calibration_required"] is True
    assert "heuristic" in metadata["threshold_method"]
    assert "candidate" in metadata["threshold_method"]
    assert metadata["suggested_threshold"] > 0
    assert metadata["preprocessing"] == detector.config == metadata["config"]
    assert metadata["pipeline_version"] == 2 and metadata["feature_dimension"] == 2
    assert all(event["total"] == 35 for event in events)
    assert [event["completed"] for event in events if event["phase"] == "extract"] == list(range(1, 36))
    assert events[-1]["phase"] == "complete" and events[-1]["completed"] == 35
    json.dumps(metadata, allow_nan=False)


def test_all_2068_inputs_are_extracted_without_retaining_original_images():
    detector = fake_detector(lambda index: (np.array([[index, index]], dtype=np.float32), (1, 1)))
    result = fit_full_memory(detector, images(2068, detector.calls), expected_count=2068)
    assert detector.calls == list(range(2068))
    assert result["metadata"]["sample_count"] == 2068
    assert result["metadata"]["candidate_feature_count"] == 2068
    assert result["memory_bank"].shape == (207, 2)


@pytest.mark.parametrize("count,expected", [(1, 2), (2, 3), (3, 2)])
def test_expected_count_must_match_exactly_without_truncation(count, expected):
    detector = fake_detector()
    with pytest.raises(ValueError, match="expected_count|image count"):
        fit_full_memory(detector, images(count), expected_count=expected)
    assert len(detector.calls) == min(count, expected)


@pytest.mark.parametrize("options", [
    {"expected_count": 0}, {"expected_count": 1}, {"expected_count": True}, {"expected_count": 2.0},
    {"expected_count": 2068, "per_image_features": 37},
    {"expected_count": MAX_OFFLINE_CANDIDATES + 1, "per_image_features": 1},
    {"expected_count": 2, "per_image_features": 0}, {"expected_count": 2, "per_image_features": True},
    {"expected_count": 2, "per_image_features": 1025},
    {"expected_count": 2, "coreset_ratio": 0}, {"expected_count": 2, "coreset_ratio": 1.1},
    {"expected_count": 2, "coreset_ratio": float("nan")}, {"expected_count": 2, "coreset_ratio": float("inf")},
])
def test_invalid_limits_fail_before_loading_any_image(options):
    detector = fake_detector()
    with pytest.raises(ValueError):
        fit_full_memory(detector, images(3), **options)
    assert detector.calls == []


@pytest.mark.parametrize("features,grid", [
    (np.zeros((0, 2)), (0, 2)), (np.zeros((2,)), (1, 2)),
    (np.array([[np.nan, 0]]), (1, 1)), (np.array([[np.inf, 0]]), (1, 1)),
    (np.zeros((1, 4097)), (1, 1)), (np.zeros((4, 2)), (1, 2)),
    (np.zeros((4, 2)), (2, -2)), (np.zeros((4, 2)), (True, 4)),
])
def test_corrupt_features_or_grid_fail_instead_of_saving_partial_model(features, grid):
    detector = fake_detector(lambda index: (features, grid))
    with pytest.raises(ValueError):
        fit_full_memory(detector, images(2), expected_count=2)


def test_late_dimension_change_and_extraction_failure_are_not_skipped():
    detector = fake_detector(lambda index: (np.zeros((4, 2 if index < 25 else 3)), (2, 2)))
    with pytest.raises(ValueError, match="dimension"):
        fit_full_memory(detector, images(27), expected_count=27)
    assert len(detector.calls) == 26

    def broken(index):
        if index == 25:
            raise RuntimeError("synthetic feature failure")
        return np.zeros((4, 2)), (2, 2)

    detector = fake_detector(broken)
    with pytest.raises(RuntimeError, match="synthetic feature failure"):
        fit_full_memory(detector, images(27), expected_count=27)
    assert len(detector.calls) == 26


def test_deterministic_bank_is_bounded_and_roundtrips_without_object_pickle(tmp_path):
    def extract(index):
        return np.random.default_rng(index).normal(size=(64, 8)).astype(np.float32), (8, 8)

    first = fit_full_memory(fake_detector(extract), images(40), expected_count=40, coreset_ratio=1)
    second = fit_full_memory(fake_detector(extract), images(40), expected_count=40, coreset_ratio=1)
    np.testing.assert_array_equal(first["memory_bank"], second["memory_bank"])
    assert first["metadata"] == second["metadata"]
    assert first["memory_bank"].dtype == np.float32
    assert first["memory_bank"].shape == (MAX_MEMORY_SIZE, 8)
    path = tmp_path / "bank.npy"
    np.save(path, first["memory_bank"], allow_pickle=False)
    restored = np.load(path, allow_pickle=False)
    np.testing.assert_array_equal(restored, first["memory_bank"])
    np.testing.assert_allclose(nearest_distances(restored, restored), 0, atol=1e-6)
    json.loads(json.dumps(first["metadata"], allow_nan=False))


def test_letterbox_excludes_padding_centers_consistently_with_online_fit():
    features = np.full((16, 2), 999, dtype=np.float32)
    features[4:12] = 1
    detector = fake_detector(lambda index: (features, (4, 4)), config={"resize_mode": "letterbox"})
    result = fit_full_memory(detector, images(2, size=(16, 8)), expected_count=2)
    np.testing.assert_array_equal(result["memory_bank"], np.ones_like(result["memory_bank"]))
    assert result["metadata"]["original_feature_count"] == 32
    assert result["metadata"]["eligible_feature_count"] == 16
    assert result["metadata"]["patch_count"] == 16
    assert result["metadata"]["candidate_feature_count"] == 16
    assert "excluded" in result["metadata"]["padding_policy"]


def test_extreme_letterbox_with_no_patch_centers_is_rejected():
    detector = fake_detector(config={"resize_mode": "letterbox"})
    with pytest.raises(ValueError, match="patch centers"):
        fit_full_memory(detector, images(2, size=(1000, 1)), expected_count=2)


def test_existing_fit_still_rejects_25_images(tmp_path, monkeypatch):
    weights = tmp_path / "weights.pt"
    weights.write_bytes(b"synthetic fixture weights, never loaded")
    detector = PatchCoreDetector(str(weights))
    monkeypatch.setattr(detector, "_extract_features", lambda image: (np.zeros((4, 2)), (2, 2)))
    with pytest.raises(ValueError, match="1 to 24"):
        detector.fit(images(25))
