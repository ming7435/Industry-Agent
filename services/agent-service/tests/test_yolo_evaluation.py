"""Localization evidence cannot turn duplicate or unrelated boxes into true positives."""
from copy import deepcopy
import json
import math

from PIL import Image
import pytest

from app.vision.evaluation import file_sha256, pixel_sha256
from app.vision.yolo_evaluation import (
    aggregate_results, bbox_iou, class_aware_localization, generate_yolo_dataset, load_yolo_manifest, match_detections,
    build_evaluation_freeze, verify_evaluation_freeze, rescore_report, compare_evaluation_reports,
    evaluate_detector,
)


def gt(box=(10, 10, 20, 20)):
    return {'bbox': list(box), 'label': 'low_contrast'}


def prediction(box=(10, 10, 20, 20), confidence=.9, label='scratches'):
    return {'bbox': list(box), 'confidence': confidence, 'label': label}


def test_duplicate_boxes_only_match_one_ground_truth_and_keep_unmatched_false_positive():
    result = match_detections([gt()], [prediction(), prediction(confidence=.8)])
    assert (result['tp'], result['fn'], result['fp']) == (1, 0, 1)
    assert result['matches'][0]['prediction_index'] == 0
    assert result['unmatched_prediction_indices'] == [1]


def test_false_box_on_defect_image_remains_false_negative_and_false_positive():
    result = match_detections([gt()], [prediction((50, 50, 60, 60))])
    assert (result['tp'], result['fn'], result['fp']) == (0, 1, 1)
    assert result['matches'] == []


def test_one_box_cannot_cover_two_instances_and_confidence_boundary_is_inclusive():
    result = match_detections([gt(), gt()], [prediction(confidence=.25), prediction(confidence=.249)])
    assert (result['tp'], result['fn'], result['fp']) == (1, 1, 0)
    assert len(result['predictions']) == 1
    assert bbox_iou([0, 0, 10, 10], [5, 0, 15, 10]) == pytest.approx(1 / 3)


def test_label_agnostic_spatial_metric_preserves_category_labels():
    result = match_detections([gt()], [prediction(label='pitted_surface')])
    assert result['tp'] == 1
    assert result['predictions'][0]['label'] == 'pitted_surface'


def test_class_aware_localization_requires_both_correct_label_and_position():
    row = {'ground_truth': [gt()], 'predictions': [
        prediction(label='wrong', confidence=.9),
        prediction(label='low_contrast', confidence=.8),
        prediction(label='low_contrast', confidence=.7),
        prediction((40, 40, 50, 50), confidence=.6, label='low_contrast'),
    ]}
    assert match_detections(row['ground_truth'], row['predictions'])['tp'] == 1
    report = class_aware_localization([row], confidence=.65)
    assert (report['tp'], report['fn'], report['fp']) == (1, 0, 2)
    assert report['by_class']['wrong']['fp'] == 1
    assert report['by_class']['low_contrast']['tp'] == 1
    assert report['f1'] == pytest.approx(.5)


def test_exact_iou_boundary_matches_without_rounding_or_category_equivalence():
    result = match_detections([gt((0, 0, 10, 10))], [prediction((0, 0, 5, 10), confidence=.25)])
    assert result['tp'] == 1
    assert result['matches'][0]['iou'] == .5


@pytest.mark.parametrize('value', [prediction((1, 1, 1, 2)), prediction(confidence=math.nan), prediction(confidence=1.1)])
def test_invalid_model_boxes_are_rejected(value):
    with pytest.raises(ValueError):
        match_detections([gt()], [value])


def test_image_fpr_and_instance_fnr_have_separate_denominators():
    rows = []
    for index, (label, scenario, truth, predicted) in enumerate([
        ('normal', 'normal', [], [prediction()]),
        ('normal', 'normal', [], []),
        ('defect', 'low_contrast', [gt()], [prediction((40, 40, 50, 50))]),
        ('defect', 'obvious_scratch', [gt()], [prediction()]),
    ]):
        rows.append({'sample_id': str(index), 'group_id': 'group-' + str(index), 'split': 'calibration',
                     'label': label, 'scenario': scenario, 'ground_truth': truth, 'predictions': predicted,
                     'matching': match_detections(truth, predicted)})
    report = aggregate_results(rows)
    assert report['overall']['image_fpr'] == .5
    assert report['overall']['instance_recall'] == .5
    assert report['overall']['instance_fnr'] == .5
    assert report['overall']['fp'] == 2
    assert report['by_scenario']['low_contrast']['instance_fnr'] == 1
    assert report['by_scenario']['low_contrast']['image_fpr'] is None


def manifest_fixture(tmp_path):
    rows = []
    for index, (split, label) in enumerate((split, label) for split in ('train', 'calibration', 'test') for label in ('normal', 'defect')):
        path = tmp_path / f'{index}.png'
        with Image.new('RGB', (20, 20), (20 + index, 30, 40)) as image:
            image.save(path)
            pixel_hash = pixel_sha256(image)
        rows.append({'sample_id': str(index), 'split': split, 'group_id': 'group-' + str(index),
                     'scenario': 'normal' if label == 'normal' else 'low_contrast', 'domain': 'ambient', 'label': label,
                     'path': path.name, 'ground_truth': [] if label == 'normal' else [gt()],
                     'file_sha256': file_sha256(path), 'pixel_sha256': pixel_hash})
    path = tmp_path / 'manifest.json'
    path.write_text(json.dumps({'schema': 'yolo-localization-v1', 'samples': rows}), encoding='utf-8')
    return path, rows


def test_manifest_accepts_supervised_defect_training_and_rejects_group_leakage(tmp_path):
    path, rows = manifest_fixture(tmp_path)
    assert len(load_yolo_manifest(path)) == 6
    rows[-1]['group_id'] = rows[0]['group_id']
    path.write_text(json.dumps({'schema': 'yolo-localization-v1', 'samples': rows}), encoding='utf-8')
    with pytest.raises(ValueError, match='group'):
        load_yolo_manifest(path)


def test_manifest_rejects_changed_pixels_and_false_normal_ground_truth(tmp_path):
    path, rows = manifest_fixture(tmp_path)
    rows[0]['ground_truth'] = [gt()]
    path.write_text(json.dumps({'schema': 'yolo-localization-v1', 'samples': rows}), encoding='utf-8')
    with pytest.raises(ValueError, match='normal'):
        load_yolo_manifest(path)
    rows[0]['ground_truth'] = []
    rows[0]['pixel_sha256'] = 'a' * 64
    path.write_text(json.dumps({'schema': 'yolo-localization-v1', 'samples': rows}), encoding='utf-8')
    with pytest.raises(ValueError, match='digest|SHA|hash'):
        load_yolo_manifest(path)


def test_detector_evaluation_keeps_raw_low_score_boxes_but_matches_only_selected_split(tmp_path):
    path, _ = manifest_fixture(tmp_path)
    samples = load_yolo_manifest(path)
    calls = []
    class Detector:
        def predict(self, image, confidence, iou):
            calls.append((image.size, confidence, iou))
            return {'algorithm': 'yolo', 'defects': [prediction(confidence=.7), prediction(confidence=.02)]}
    result = evaluate_detector(Detector(), samples, 'calibration',
                               {'confidence': .25, 'extraction_confidence': .01, 'nms_iou': .45, 'match_iou': .5})
    assert calls == [((20, 20), .01, .45)] * 2
    assert len(result['samples']) == 2
    assert len(result['samples'][0]['predictions']) == 2
    assert len(result['samples'][0]['matching']['predictions']) == 1
    assert result['metrics']['overall']['image_fpr'] == 1
    assert result['metrics']['overall']['instance_fnr'] == 0


def test_generation_is_paired_deterministic_and_split_independent(tmp_path):
    options = dict(seed=20261022, train_groups=1, calibration_groups=1, test_groups=1)
    first = load_yolo_manifest(generate_yolo_dataset(tmp_path / 'first', **options))
    second = load_yolo_manifest(generate_yolo_dataset(tmp_path / 'second', **{**options, 'test_groups': 2}))
    assert len(first) == 9
    assert [row['pixel_sha256'] for row in first if row['split'] != 'test'] == [row['pixel_sha256'] for row in second if row['split'] != 'test']
    for split in ('train', 'calibration', 'test'):
        rows = [row for row in first if row['split'] == split]
        assert len({row['group_id'] for row in rows}) == 1
        assert len({row['generator_seed'] for row in rows}) == 1
        assert {row['scenario'] for row in rows} == {'normal', 'obvious_scratch', 'low_contrast'}
    assert len({row['pixel_sha256'] for row in first}) == len(first)
    with pytest.raises(FileExistsError):
        generate_yolo_dataset(tmp_path / 'first', **options)


def test_test_split_requires_exact_frozen_weights_manifest_and_thresholds(tmp_path):
    manifest, _ = manifest_fixture(tmp_path)
    weights = tmp_path / 'weights.pt'
    weights.write_bytes(b'fixed-model')
    config = {'confidence': .25, 'extraction_confidence': .01, 'nms_iou': .45, 'match_iou': .5}
    frozen = build_evaluation_freeze(weights, manifest, config)
    assert verify_evaluation_freeze(frozen, weights, manifest, config) == frozen
    with pytest.raises(ValueError, match='frozen'):
        verify_evaluation_freeze(frozen, weights, manifest, {**config, 'confidence': .3})
    weights.write_bytes(b'changed-model')
    with pytest.raises(ValueError, match='frozen'):
        verify_evaluation_freeze(frozen, weights, manifest, config)


def test_rescoring_is_calibration_only_and_comparison_requires_same_image_and_gt():
    row = {'sample_id': 'one', 'group_id': 'g1', 'split': 'calibration', 'label': 'defect', 'scenario': 'low_contrast',
           'pixel_sha256': 'a' * 64, 'ground_truth': [gt()], 'predictions': [prediction(confidence=.2)]}
    row['matching'] = match_detections(row['ground_truth'], row['predictions'], confidence=.25)
    report = {'split': 'calibration', 'manifest_sha256': 'b' * 64,
              'config': {'confidence': .25, 'extraction_confidence': .01, 'nms_iou': .45, 'match_iou': .5},
              'samples': [row], 'metrics': aggregate_results([row])}
    rescored = rescore_report(report, confidence=.1)
    assert rescored['metrics']['overall']['instance_recall'] == 1
    assert report['metrics']['overall']['instance_recall'] == 0
    paired = compare_evaluation_reports(report, rescored)
    assert paired['overall_delta']['instance_recall'] == 1
    with pytest.raises(ValueError, match='calibration'):
        rescore_report({**report, 'split': 'test'}, confidence=.1)
    changed = deepcopy(rescored)
    changed['samples'][0]['ground_truth'][0]['bbox'][0] += 1
    with pytest.raises(ValueError, match='paired'):
        compare_evaluation_reports(report, changed)
