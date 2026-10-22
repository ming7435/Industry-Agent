"""Paired, split-aware YOLO localization evaluation with auditable box matching.

Generic/synthetic defects and NEU classes have different taxonomies. The metric
is explicitly label-agnostic spatial detection, never category accuracy or mAP.
"""
from __future__ import annotations

from collections import Counter
from contextlib import closing
from copy import deepcopy
from datetime import datetime, timezone
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

from app.vision.evaluation import _synthetic_image, file_sha256, load_rgb, pixel_sha256


SCHEMA = 'yolo-localization-v1'
GENERATOR = 'paired-brushed-yolo-v1'
SCENARIOS = ('normal', 'obvious_scratch', 'low_contrast')
DOMAINS = ('ambient', 'blur', 'low_light', 'glare')
PIXEL_DIGEST_FORMAT = 'sha256(RGB:width:height: + RGB bytes)'
METRIC_NAME = 'label_agnostic_spatial_detection'


def _number(value):
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value)


def _box(value):
    if not isinstance(value, (list, tuple)) or len(value) != 4 or not all(_number(n) for n in value):
        raise ValueError('box must contain four finite coordinates')
    if value[0] < 0 or value[1] < 0 or value[2] <= value[0] or value[3] <= value[1]:
        raise ValueError('box must have positive area in nonnegative image coordinates')
    return value


def bbox_iou(left, right):
    left, right = _box(left), _box(right)
    intersection = max(0, min(left[2], right[2]) - max(left[0], right[0])) * max(0, min(left[3], right[3]) - max(left[1], right[1]))
    union = (left[2] - left[0]) * (left[3] - left[1]) + (right[2] - right[0]) * (right[3] - right[1]) - intersection
    return float(intersection / union)


def match_detections(ground_truth, predictions, confidence=.25, match_iou=.5):
    """Confidence-ranked greedy one-to-one matching, class labels not compared.

    Indices always address the original raw prediction array. An unmatched box
    on a defect image is still FP; an unmatched GT instance is still FN.
    """
    if not _number(confidence) or not 0 <= confidence <= 1 or not _number(match_iou) or not 0 < match_iou <= 1:
        raise ValueError('confidence and matching IoU must be bounded finite values')
    for item in ground_truth:
        if not isinstance(item, dict):
            raise ValueError('ground truth must contain box records')
        _box(item.get('bbox'))
    for item in predictions:
        if not isinstance(item, dict) or not _number(item.get('confidence')) or not 0 <= item['confidence'] <= 1:
            raise ValueError('prediction confidence must be finite and in [0, 1]')
        _box(item.get('bbox'))
        if not isinstance(item.get('label'), str) or not item['label'].strip():
            raise ValueError('prediction category label is required')
    selected = sorted((i for i, item in enumerate(predictions) if item['confidence'] >= confidence),
                      key=lambda i: (-predictions[i]['confidence'], i))
    unmatched_gt, matches, unmatched_predictions = set(range(len(ground_truth))), [], []
    for prediction_index in selected:
        overlaps = [(bbox_iou(ground_truth[index]['bbox'], predictions[prediction_index]['bbox']), index) for index in unmatched_gt]
        overlap, target = max(overlaps, key=lambda pair: (pair[0], -pair[1])) if overlaps else (0, None)
        if target is not None and overlap >= match_iou:
            matches.append({'gt_index': target, 'prediction_index': prediction_index, 'iou': overlap})
            unmatched_gt.remove(target)
        else:
            unmatched_predictions.append(prediction_index)
    return {'matches': matches, 'tp': len(matches), 'fn': len(unmatched_gt), 'fp': len(unmatched_predictions),
            'predictions': [deepcopy(predictions[index]) for index in selected], 'selected_prediction_indices': selected,
            'unmatched_gt_indices': sorted(unmatched_gt), 'unmatched_prediction_indices': unmatched_predictions}


def class_aware_localization(rows, confidence=.25, match_iou=.5):
    """Count boxes whose class *and* IoU match on a shared-label dataset.

    Use this only when prediction and ground-truth labels have the same taxonomy.
    Each prediction and GT instance can be matched at most once.
    """
    totals = Counter()
    per_class = {}
    for row in rows:
        truth, predictions = row['ground_truth'], row['predictions']
        selected = match_detections(truth, predictions, confidence, match_iou)['selected_prediction_indices']
        unmatched = set(range(len(truth)))
        totals['gt'] += len(truth)
        totals['predicted'] += len(selected)
        for item in truth:
            per_class.setdefault(item['label'], Counter())['gt'] += 1
        for index in selected:
            prediction = predictions[index]
            label = prediction['label']
            per_class.setdefault(label, Counter())['predicted'] += 1
            candidates = [(bbox_iou(truth[target]['bbox'], prediction['bbox']), target)
                          for target in unmatched if truth[target]['label'] == label]
            overlap, target = max(candidates, key=lambda pair: (pair[0], -pair[1])) if candidates else (0, None)
            if target is not None and overlap >= match_iou:
                unmatched.remove(target)
                totals['tp'] += 1
                per_class[label]['tp'] += 1
    totals['fn'] = totals['gt'] - totals['tp']
    totals['fp'] = totals['predicted'] - totals['tp']
    denominator = 2 * totals['tp'] + totals['fn'] + totals['fp']
    return {'tp': totals['tp'], 'fn': totals['fn'], 'fp': totals['fp'],
            'gt_instances': totals['gt'], 'predicted_boxes': totals['predicted'],
            'f1': 2 * totals['tp'] / denominator if denominator else None,
            'by_class': {label: {'gt': counts['gt'], 'predicted': counts['predicted'],
                                 'tp': counts['tp'], 'fn': counts['gt'] - counts['tp'],
                                 'fp': counts['predicted'] - counts['tp']}
                         for label, counts in sorted(per_class.items())}}


def _summary(rows):
    normals = [row for row in rows if row['label'] == 'normal']
    tp = sum(row['matching']['tp'] for row in rows)
    fn = sum(row['matching']['fn'] for row in rows)
    fp = sum(row['matching']['fp'] for row in rows)
    image_fp = sum(bool(row['matching']['predictions']) for row in normals)
    gt_instances = sum(len(row['ground_truth']) for row in rows)
    predicted = sum(len(row['matching']['predictions']) for row in rows)
    return {'images': len(rows), 'groups': len({row['group_id'] for row in rows}),
            'normal_images': len(normals), 'defect_images': len(rows) - len(normals),
            'image_fp': image_fp, 'image_fpr': image_fp / len(normals) if normals else None,
            'gt_instances': gt_instances, 'predicted_boxes': predicted, 'tp': tp, 'fn': fn, 'fp': fp,
            'instance_recall': tp / gt_instances if gt_instances else None,
            'instance_fnr': fn / gt_instances if gt_instances else None,
            'box_precision': tp / predicted if predicted else None,
            'normal_fp_boxes': sum(row['matching']['fp'] for row in normals),
            'defect_image_fp_boxes': sum(row['matching']['fp'] for row in rows if row['label'] == 'defect'),
            'prediction_category_counts': dict(sorted(Counter(item['label'] for row in rows for item in row['matching']['predictions']).items()))}


def aggregate_results(rows):
    if not rows:
        raise ValueError('evaluation requires at least one image')
    if len({row['sample_id'] for row in rows}) != len(rows):
        raise ValueError('duplicate sample would double-count evaluation')
    for row in rows:
        if row['label'] not in {'normal', 'defect'} or (row['label'] == 'normal') != (len(row['ground_truth']) == 0):
            raise ValueError('image label and ground truth disagree')
    return {'metric': METRIC_NAME, 'category_accuracy': None,
            'overall': _summary(rows),
            'by_scenario': {key: _summary([row for row in rows if row['scenario'] == key]) for key in sorted({row['scenario'] for row in rows})},
            'by_domain': {key: _summary([row for row in rows if row.get('domain', 'unspecified') == key]) for key in sorted({row.get('domain', 'unspecified') for row in rows})}}


def load_yolo_manifest(path):
    """Verify saved bytes/pixels and reject object-group/content split leakage."""
    path = Path(path).resolve(strict=True)
    if path.stat().st_size > 8 * 1024 * 1024:
        raise ValueError('dataset manifest exceeds 8 MiB')
    document = json.loads(path.read_text(encoding='utf-8-sig'), parse_constant=lambda value: (_ for _ in ()).throw(ValueError('nonfinite JSON')))
    rows = document.get('samples') if isinstance(document, dict) else None
    if not isinstance(document, dict) or document.get('schema') != SCHEMA or not isinstance(rows, list) or not 1 <= len(rows) <= 10000:
        raise ValueError('expected a bounded yolo-localization-v1 sample manifest')
    seen_ids, seen_pixels, seen_groups, result = set(), {}, {}, []
    for raw in rows:
        row = deepcopy(raw)
        if not isinstance(row, dict) or any(not isinstance(row.get(key), str) or not row[key].strip()
                                            for key in ('sample_id', 'split', 'group_id', 'scenario', 'label', 'path', 'file_sha256', 'pixel_sha256')):
            raise ValueError('each manifest row needs explicit identity, split, group and image digests')
        if row['split'] not in {'train', 'calibration', 'test'} or row['label'] not in {'normal', 'defect'}:
            raise ValueError('unknown split or image label')
        if row['sample_id'] in seen_ids:
            raise ValueError('duplicate sample_id')
        seen_ids.add(row['sample_id'])
        if row['group_id'] in seen_groups and seen_groups[row['group_id']] != row['split']:
            raise ValueError('group leakage across train/calibration/test splits')
        seen_groups[row['group_id']] = row['split']
        image_path = (path.parent / row['path']).resolve(strict=True)
        with closing(load_rgb(image_path)) as image:
            width, height = image.size
            if row['file_sha256'] != file_sha256(image_path) or row['pixel_sha256'] != pixel_sha256(image):
                raise ValueError('image file/pixel SHA digest differs from frozen manifest')
        if row['pixel_sha256'] in seen_pixels:
            raise ValueError('duplicate image pixels across dataset; would leak or double-count samples')
        seen_pixels[row['pixel_sha256']] = row['split']
        truth = row.get('ground_truth')
        if not isinstance(truth, list) or (row['label'] == 'normal') != (not truth):
            raise ValueError('normal images require no GT boxes and defects require at least one')
        for box in truth:
            coords = _box(box.get('bbox'))
            if coords[2] > width or coords[3] > height or not isinstance(box.get('label'), str) or not box['label'].strip():
                raise ValueError('GT box must fit image and keep its category label')
        mask_path = row.get('mask_path')
        if mask_path:
            mask_path = (path.parent / mask_path).resolve(strict=True)
            if row.get('mask_sha256') != file_sha256(mask_path):
                raise ValueError('mask SHA digest differs from frozen manifest')
            with closing(Image.open(mask_path)) as source:
                with closing(source.convert('L')) as mask:
                    if mask.size != (width, height) or (mask.getbbox() is None) != (row['label'] == 'normal'):
                        raise ValueError('mask dimensions or normal/defect labels disagree')
                    if row.get('ground_truth_source') == 'injected_mask_bbox' and truth and (len(truth) != 1 or list(mask.getbbox()) != truth[0]['bbox']):
                        raise ValueError('synthetic GT box must exactly bound the injected mask')
            row['mask_path'] = str(mask_path)
        row.update(path=str(image_path), width=width, height=height)
        result.append(row)
    for split in ('train', 'calibration', 'test'):
        labels = {row['label'] for row in result if row['split'] == split}
        no_normals = document.get('kind') == 'real_gear_dataset' and document.get('normal_samples_available') is False
        if labels != {'normal', 'defect'} and not (no_normals and labels == {'defect'}):
            raise ValueError(f'{split} requires independent normal and defect samples')
    return result


def generate_yolo_dataset(output, *, seed=20261022, train_groups=48, calibration_groups=16, test_groups=24):
    """Three paired scenes per independent group; never overwrite a fixed dataset."""
    counts = (train_groups, calibration_groups, test_groups)
    if any(isinstance(n, bool) or not isinstance(n, int) or not 1 <= n <= 256 for n in counts):
        raise ValueError('each split requires 1 to 256 groups')
    if not isinstance(seed, int) or isinstance(seed, bool) or not 0 <= seed < 2**32:
        raise ValueError('master seed must be a uint32 integer')
    output = Path(output).resolve()
    if output.exists() and any(output.iterdir()):
        raise FileExistsError('dataset folder is nonempty; choose a fresh immutable dataset path')
    output.mkdir(parents=True, exist_ok=True)
    (output / 'images').mkdir(exist_ok=True)
    (output / 'masks').mkdir(exist_ok=True)
    rows = []
    for split_index, (split, count) in enumerate(zip(('train', 'calibration', 'test'), counts)):
        for group_index in range(count):
            group_seed = int(np.random.SeedSequence([seed, split_index, group_index]).generate_state(1, dtype=np.uint64)[0])
            group_id = f'{GENERATOR}-{seed}-{split}-{group_index:04d}'
            domain = DOMAINS[group_index % len(DOMAINS)]
            for scenario in SCENARIOS:
                sample_id = f'{split}-g{group_index:04d}-{scenario}'
                image, mask = _synthetic_image(np.random.default_rng(group_seed), (512, 384), domain, scenario)
                try:
                    image_path = Path('images') / (sample_id + '.png')
                    mask_path = Path('masks') / (sample_id + '.png')
                    image.save(output / image_path)
                    mask.save(output / mask_path)
                    bounds = mask.getbbox()
                    truth = [] if bounds is None else [{'bbox': list(bounds), 'label': 'scratch' if scenario == 'obvious_scratch' else 'low_contrast'}]
                    rows.append({'sample_id': sample_id, 'split': split, 'group_id': group_id, 'scenario': scenario,
                                 'domain': domain, 'label': 'normal' if not truth else 'defect', 'path': image_path.as_posix(),
                                 'mask_path': mask_path.as_posix(), 'file_sha256': file_sha256(output / image_path),
                                 'pixel_sha256': pixel_sha256(image), 'mask_sha256': file_sha256(output / mask_path),
                                 'ground_truth': truth, 'ground_truth_source': 'injected_mask_bbox', 'generator_seed': group_seed})
                finally:
                    image.close()
                    mask.close()
    manifest = output / 'manifest.json'
    document = {'schema': SCHEMA, 'kind': 'synthetic_pipeline_optimization_only', 'generator': GENERATOR,
                'master_seed': seed, 'pixel_digest_format': PIXEL_DIGEST_FORMAT, 'size': [512, 384],
                'group_counts': dict(zip(('train', 'calibration', 'test'), counts)), 'domains': list(DOMAINS),
                'split_policy': 'Independent SeedSequence([master_seed, split_index, group_index]); paired scene RNG reset within each group.',
                'limitations': ['Not product photographs or CAD renderings; not industrial accuracy.',
                                'GT boxes exactly enclose injected masks before domain blur; no category equivalence with NEU taxonomy.',
                                'Same procedural family across splits; cannot establish real-world generalization.'],
                'samples': rows}
    manifest.write_text(json.dumps(document, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
    digest = file_sha256(manifest)
    (output / 'manifest.sha256').write_text(digest + '  manifest.json\n', encoding='ascii')
    return manifest


def validate_evaluation_config(config):
    config = deepcopy(config)
    for key in ('confidence', 'extraction_confidence', 'nms_iou', 'match_iou'):
        if not _number(config.get(key)) or not 0 < config[key] <= 1:
            raise ValueError(f'{key} must be finite and in (0, 1]')
    if config['confidence'] < config['extraction_confidence']:
        raise ValueError('cannot evaluate below the confidence used to extract actual boxes')
    if 'input_size' in config and (type(config['input_size']) is not int or config['input_size'] not in (320, 640)):
        raise ValueError('input size must be 320 or 640')
    return config


def build_evaluation_freeze(weights, manifest, config):
    return {'schema': 'yolo-evaluation-freeze-v1', 'created_at': datetime.now(timezone.utc).isoformat(),
            'weights_sha256': file_sha256(weights), 'manifest_sha256': file_sha256(manifest),
            'config': validate_evaluation_config(config),
            'policy': 'Freeze weights and all inference/evaluation thresholds before opening held-out predictions. No selection from test.'}


def verify_evaluation_freeze(frozen, weights, manifest, config):
    if (not isinstance(frozen, dict) or frozen.get('schema') != 'yolo-evaluation-freeze-v1'
            or frozen.get('weights_sha256') != file_sha256(weights) or frozen.get('manifest_sha256') != file_sha256(manifest)
            or frozen.get('config') != validate_evaluation_config(config)):
        raise ValueError('held-out test requires the exact frozen weights, manifest and thresholds')
    return frozen


def evaluate_detector(detector, samples, split, config):
    """Run actual detector boxes on one explicit split; never select thresholds."""
    config = validate_evaluation_config(config)
    if split not in {'calibration', 'test'}:
        raise ValueError('evaluation split must be calibration or frozen test')
    rows = []
    for sample in samples:
        if sample['split'] != split:
            continue
        with closing(load_rgb(sample['path'])) as image:
            if pixel_sha256(image) != sample['pixel_sha256']:
                raise ValueError('image pixels changed after manifest validation')
            result = detector.predict(image, confidence=config['extraction_confidence'], iou=config['nms_iou'])
        if not isinstance(result, dict) or result.get('algorithm') != 'yolo' or not isinstance(result.get('defects'), list):
            raise ValueError('detector did not return actual YOLO box evidence')
        predictions = deepcopy(result['defects'])
        for prediction in predictions:
            coords = _box(prediction.get('bbox'))
            if coords[2] > sample['width'] or coords[3] > sample['height']:
                raise ValueError('detector box lies outside the evaluated image')
        row = {**deepcopy(sample), 'predictions': predictions,
               'matching': match_detections(sample['ground_truth'], predictions, config['confidence'], config['match_iou'])}
        rows.append(row)
    return {'samples': rows, 'metrics': aggregate_results(rows)}


def rescore_report(report, confidence):
    """Reuse emitted boxes for calibration threshold selection only, never test."""
    if report.get('split') != 'calibration':
        raise ValueError('threshold rescoring is allowed on calibration reports only')
    rescored = deepcopy(report)
    rescored['config'] = validate_evaluation_config({**report['config'], 'confidence': confidence})
    rescored['rescored_from_confidence'] = report['config']['confidence']
    for row in rescored['samples']:
        row['matching'] = match_detections(row['ground_truth'], row['predictions'], confidence, rescored['config']['match_iou'])
    rescored['metrics'] = aggregate_results(rescored['samples'])
    return rescored


def compare_evaluation_reports(baseline, candidate):
    """Require paired image and GT identities, keep category outcomes separate."""
    validate_evaluation_config(baseline['config'])
    validate_evaluation_config(candidate['config'])
    identity = lambda row: (row['sample_id'], row['pixel_sha256'], row['group_id'], row['split'], row['label'], row['scenario'], row['ground_truth'])
    left = sorted(baseline['samples'], key=lambda row: row['sample_id'])
    right = sorted(candidate['samples'], key=lambda row: row['sample_id'])
    if (baseline.get('manifest_sha256') != candidate.get('manifest_sha256') or baseline.get('split') != candidate.get('split')
            or baseline['config']['match_iou'] != candidate['config']['match_iou']
            or [identity(row) for row in left] != [identity(row) for row in right]):
        raise ValueError('comparison requires paired frozen images, GT, groups, split and matching IoU')
    # Recompute from saved raw boxes, so a modified summary cannot change comparison.
    def recompute(report):
        rows = deepcopy(report['samples'])
        for row in rows:
            row['matching'] = match_detections(row['ground_truth'], row['predictions'], report['config']['confidence'], report['config']['match_iou'])
        return aggregate_results(rows)
    baseline_metrics, candidate_metrics = recompute(baseline), recompute(candidate)
    def delta(a, b):
        keys = ('image_fpr', 'instance_recall', 'instance_fnr', 'box_precision', 'tp', 'fn', 'fp', 'image_fp')
        return {key: b[key] - a[key] if a[key] is not None and b[key] is not None else None for key in keys}
    return {'schema': 'yolo-paired-comparison-v1', 'metric': METRIC_NAME, 'split': baseline['split'],
            'manifest_sha256': baseline['manifest_sha256'], 'images': len(left),
            'baseline_weights_sha256': baseline.get('weights_sha256'), 'candidate_weights_sha256': candidate.get('weights_sha256'),
            'baseline_config': baseline['config'], 'candidate_config': candidate['config'],
            'baseline': baseline_metrics, 'candidate': candidate_metrics,
            'overall_delta': delta(baseline_metrics['overall'], candidate_metrics['overall']),
            'scenario_delta': {key: delta(baseline_metrics['by_scenario'][key], candidate_metrics['by_scenario'][key])
                               for key in baseline_metrics['by_scenario']},
            'interpretation': 'Deltas are candidate minus baseline. FPR uses normal images; FNR uses GT instances. Labels are preserved but not matched.'}
