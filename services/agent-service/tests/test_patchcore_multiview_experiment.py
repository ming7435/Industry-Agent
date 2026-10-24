"""Geometry, leakage and promotion safeguards, not evidence of model accuracy."""
import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location('pc_multiview', ROOT / 'scripts/patchcore_multiview_experiment.py')
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


def test_views_cover_original_image_without_crop_or_overlap():
    boxes = mod.view_boxes((2555, 517))
    assert boxes == [(i * 511, 0, (i + 1) * 511, 517) for i in range(5)]
    with pytest.raises(ValueError):
        mod.view_boxes((640, 535))


def test_manifest_rejects_same_object_or_pixels_crossing_splits():
    rows = [dict(sample_id=str(i), group_id=str(i), split=s, label=l,
                 file_sha256=str(i), pixel_sha256=str(i)) for i, (s, l) in enumerate([
                     ('train', 'normal'), ('calibration', 'normal'), ('calibration', 'defect'),
                     ('test', 'normal'), ('test', 'defect')])]
    mod.validate_manifest(rows)
    rows[-1]['pixel_sha256'] = rows[0]['pixel_sha256']
    with pytest.raises(ValueError, match='overlap'):
        mod.validate_manifest(rows)


def test_threshold_respects_normal_false_positive_budget():
    selected = mod.select_threshold([1., 2., 3.], [2.5, 4., 5.])
    assert selected['metrics']['fp'] == 0
    assert selected['metrics']['fn'] == 1
    assert 3 < selected['threshold'] <= 4


def test_replacement_requires_both_errors_within_target_and_baseline():
    baseline = dict(defect_n=69, normal_n=150, fn=12, fp=26)
    assert mod.replacement_gate(dict(defect_n=69, normal_n=150, fn=0, fp=1), baseline)['empirical_pass']
    assert not mod.replacement_gate(dict(defect_n=69, normal_n=150, fn=1, fp=0), baseline)['empirical_pass']
    assert not mod.replacement_gate(dict(defect_n=69, normal_n=150, fn=0, fp=2), baseline)['empirical_pass']
    assert not mod.replacement_gate(dict(defect_n=69, normal_n=150, fn=0, fp=1), {**baseline, 'fp': 0})['empirical_pass']
    with pytest.raises(ValueError):
        mod.replacement_gate(dict(defect_n=0, normal_n=150, fn=0, fp=0), baseline)
