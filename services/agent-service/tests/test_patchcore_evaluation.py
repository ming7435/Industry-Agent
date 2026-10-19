"""Prevent split leakage, invalid manifests and misleading evaluation denominators."""
import csv
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
import pytest

from app.vision.evaluation import (
    SCENARIOS, generate_synthetic_dataset, load_manifest,
    metrics_from_scores, scenario_metrics, threshold_sweep, wilson_interval,
)


def manifest_fixture(tmp_path):
    rows = []
    for index, (split, label) in enumerate((("train", "normal"), ("calibration", "normal"), ("calibration", "defect"), ("test", "normal"), ("test", "defect"))):
        path = tmp_path / f"image-{index}.png"
        Image.new("RGB", (12, 10), (30 + index, 20, 10)).save(path)
        rows.append({"split": split, "label": label, "scenario": label, "path": path.name})
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    return manifest, rows


def test_manifest_accepts_explicit_split_and_optional_mask(tmp_path):
    manifest, rows = manifest_fixture(tmp_path)
    mask = tmp_path / "mask.png"
    Image.new("L", (12, 10), 255).save(mask)
    rows[-1]["mask_path"] = mask.name
    manifest.write_text(json.dumps({"samples": rows}), encoding="utf-8")
    result = load_manifest(manifest)
    assert len(result) == 5
    assert result[0]["split"] == "train"
    assert result[-1]["mask_path"] == str(mask)
    assert len({row["pixel_sha256"] for row in result}) == 5


def test_manifest_rejects_same_pixels_even_if_file_encoding_differs(tmp_path):
    manifest, rows = manifest_fixture(tmp_path)
    duplicate = tmp_path / "different-file.bmp"
    with Image.open(tmp_path / rows[0]["path"]) as image:
        image.save(duplicate)
    rows[-1]["path"] = duplicate.name
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(ValueError, match="content overlap"):
        load_manifest(manifest)


@pytest.mark.parametrize("label", ["normal", "defect"])
def test_manifest_rejects_duplicate_within_same_split_including_label_conflict(tmp_path, label):
    manifest, rows = manifest_fixture(tmp_path)
    rows.append({**rows[1], "label": label})
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(ValueError, match="duplicate image content within split"):
        load_manifest(manifest)


def test_manifest_rejects_nonfinite_float_mask(tmp_path):
    manifest, rows = manifest_fixture(tmp_path)
    array = np.zeros((10, 12), dtype=np.float32)
    array[0, 0] = np.nan
    Image.fromarray(array).save(tmp_path / "mask.tiff")
    rows[-1]["mask_path"] = "mask.tiff"
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(ValueError, match="mask contains nonfinite"):
        load_manifest(manifest)


@pytest.mark.parametrize("mutation,expected", [
    (lambda rows: rows[0].update(label="defect"), "training samples"),
    (lambda rows: rows[2].update(label="normal"), "calibration split requires"),
    (lambda rows: rows[-1].update(label="normal"), "test split requires"),
    (lambda rows: rows[0].update(scenario="NaN"), "nonempty text"),
    (lambda rows: rows[0].update(split="validation"), "unknown split"),
    (lambda rows: rows[0].pop("path"), "nonempty text"),
])
def test_manifest_invalid_protocol(tmp_path, mutation, expected):
    manifest, rows = manifest_fixture(tmp_path)
    mutation(rows)
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(ValueError, match=expected):
        load_manifest(manifest)


def test_manifest_missing_image_and_nonfinite_json(tmp_path):
    manifest, rows = manifest_fixture(tmp_path)
    rows[0]["path"] = "missing.png"
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(FileNotFoundError):
        load_manifest(manifest)
    manifest.write_text('[{"path": NaN}]', encoding="utf-8")
    with pytest.raises(ValueError, match="nonfinite JSON"):
        load_manifest(manifest)


def test_manifest_group_overlap_and_mask_mismatch(tmp_path):
    manifest, rows = manifest_fixture(tmp_path)
    rows[0]["group_id"] = rows[1]["group_id"] = "same-object"
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(ValueError, match="group_id overlap"):
        load_manifest(manifest)
    rows[1]["group_id"] = "different-object"
    Image.new("L", (2, 2), 255).save(tmp_path / "mask.png")
    rows[-1]["mask_path"] = "mask.png"
    manifest.write_text(json.dumps(rows), encoding="utf-8")
    with pytest.raises(ValueError, match="mask size"):
        load_manifest(manifest)


def test_metrics_ties_denominators_and_empty_class_are_explicit():
    rows = [{"label": "normal", "score": 1}, {"label": "normal", "score": 2},
            {"label": "defect", "score": 2}, {"label": "defect", "score": 3}]
    metrics = metrics_from_scores(rows, 2)
    assert (metrics["tp"], metrics["fn"], metrics["fp"], metrics["tn"]) == (2, 0, 1, 1)
    assert metrics["recall"] == 1 and metrics["fpr"] == 0.5
    assert metrics["precision"] == 2 / 3
    assert metrics_from_scores(rows[:2], 2)["fnr"] is None
    assert wilson_interval(0, 0) is None
    assert 0 < wilson_interval(0, 40)[1] < 0.1


@pytest.mark.parametrize("score", [math.nan, math.inf, -1, True, None, "NaN"])
def test_invalid_scores_rejected(score):
    with pytest.raises(ValueError, match="finite nonnegative"):
        metrics_from_scores([{"label": "normal", "score": score}], 1)


def test_sweep_includes_tied_and_all_clear_boundaries():
    rows = [{"label": "normal", "score": 1}, {"label": "defect", "score": 1}]
    sweep = threshold_sweep(rows)
    assert sweep[0]["tp"] == 1 and sweep[0]["fp"] == 1
    assert sweep[-1]["tp"] == 0 and sweep[-1]["fp"] == 0
    assert sweep[-1]["threshold"] > 1


def test_per_scenario_metrics_do_not_count_other_defects_as_normal():
    rows = [{"label": "normal", "score": 1, "scenario": "normal"},
            {"label": "defect", "score": 2, "scenario": "scratch"},
            {"label": "defect", "score": 0.5, "scenario": "hole"}]
    result = scenario_metrics(rows, 1.5)
    assert result["scenarios"]["hole"]["fnr"] == 1
    assert result["scenarios"]["hole"]["normal_n"] == 0
    assert result["normal"]["tn"] == 1


def test_synthetic_reproducibility_independent_splits_and_masks(tmp_path):
    options = dict(seed=11, train_normal=4, calibration_normal=4, calibration_per_scenario=1,
                   test_normal=4, test_per_scenario=1)
    first = load_manifest(generate_synthetic_dataset(tmp_path / "first", **options))
    second = load_manifest(generate_synthetic_dataset(tmp_path / "second", **options))
    assert [r["pixel_sha256"] for r in first] == [r["pixel_sha256"] for r in second]
    assert {r["scenario"] for r in first if r["label"] == "defect"} == set(SCENARIOS)
    assert len(first) == 12 + 2 * len(SCENARIOS)
    assert len({r["pixel_sha256"] for r in first}) == len(first)
    # Increasing only test sample counts must not change train or calibration pixels.
    third = load_manifest(generate_synthetic_dataset(tmp_path / "third", **{**options, "test_per_scenario": 2}))
    assert [r["pixel_sha256"] for r in first if r["split"] != "test"] == [r["pixel_sha256"] for r in third if r["split"] != "test"]


def test_configuration_selection_uses_only_calibration_objective():
    path = Path(__file__).resolve().parents[3] / "scripts/evaluate_patchcore.py"
    spec = importlib.util.spec_from_file_location("evaluate_patchcore_script", path)
    script = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(script)
    results = [
        {"config": {"id": "a"}, "preregistered_order": 0,
         "strategies": {"recall_priority": {"metrics": {"fnr": 0.1, "fpr": 0.0}}}, "test": {"fnr": 0.0}},
        {"config": {"id": "b"}, "preregistered_order": 1,
         "strategies": {"recall_priority": {"metrics": {"fnr": 0.0, "fpr": 0.25}}}, "test": {"fnr": 1.0}},
    ]
    assert script.choose_configuration(results) == "b"
