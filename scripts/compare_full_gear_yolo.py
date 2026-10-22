"""Apply the frozen v3 promotion policy to paired fresh-test predictions."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / 'output/gear-yolo-full-v1'
sys.path.insert(0, str(ROOT / 'services/agent-service'))

from app.vision.yolo_evaluation import class_aware_localization


def read(name: str) -> dict:
    return json.loads((RUN / name).read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def spatial_f1(report: dict) -> float:
    counts = report['metrics']['overall']
    denominator = 2 * counts['tp'] + counts['fn'] + counts['fp']
    return 2 * counts['tp'] / denominator if denominator else 0.0


def main() -> None:
    policy = read('test-policy.json')
    selection = read('selection.json')
    baseline = read('baseline-test.json')
    candidate = read('candidate-test.json')
    manifest = ROOT / 'output/gear-full-dataset/prepared/manifest.json'
    weights = {
        'baseline': ROOT / '.runtime/quality-models/yolo11-gear-v2/best.pt',
        'candidate': RUN / 'training/weights/best.pt',
    }
    if not selection['eligible_for_frozen_test'] or not policy['created_before_fresh_test']:
        raise ValueError('candidate was not eligible for the frozen test')
    if digest(manifest) != policy['manifest_sha256']:
        raise ValueError('test dataset manifest changed')
    for name, report in (('baseline', baseline), ('candidate', candidate)):
        frozen = read(f'{name}-frozen.json')
        expected_hash = policy[f'{name}_weights_sha256']
        expected_confidence = policy[f'{name}_confidence']
        if (report['split'] != 'test' or report['manifest_sha256'] != policy['manifest_sha256']
                or report['weights_sha256'] != expected_hash or digest(weights[name]) != expected_hash
                or frozen['weights_sha256'] != expected_hash
                or frozen['manifest_sha256'] != policy['manifest_sha256']
                or frozen['config'] != report['config']
                or report['config']['confidence'] != expected_confidence):
            raise ValueError(f'{name} test result, frozen settings, or weights changed')
    identities = lambda report: [
        (row['sample_id'], row['pixel_sha256'], row['group_id'], row['ground_truth'])
        for row in sorted(report['samples'], key=lambda item: item['sample_id'])
    ]
    if identities(baseline) != identities(candidate) or len(baseline['samples']) != 118:
        raise ValueError('fresh test images or annotations differ')
    scores = {}
    for name, report in (('baseline', baseline), ('candidate', candidate)):
        category = class_aware_localization(
            report['samples'], report['config']['confidence'], report['config']['match_iou'])
        scores[name] = {
            'confidence': report['config']['confidence'],
            'class_and_position': category,
            'spatial': report['metrics']['overall'],
            'spatial_f1': spatial_f1(report),
        }
    accepted = (scores['candidate']['class_and_position']['f1'] > scores['baseline']['class_and_position']['f1']
                and scores['candidate']['spatial_f1'] >= scores['baseline']['spatial_f1'])
    comparison = {
        'policy': policy,
        'test_images': len(baseline['samples']),
        'normal_images_available': False,
        'baseline': scores['baseline'],
        'candidate': scores['candidate'],
        'accepted_for_research_model': accepted,
    }
    with (RUN / 'test-comparison.json').open('x', encoding='utf-8') as stream:
        json.dump(comparison, stream, ensure_ascii=False, indent=2, allow_nan=False)
    print(json.dumps({
        'accepted': accepted,
        'baseline': {'class_f1': scores['baseline']['class_and_position']['f1'],
                     'spatial_f1': scores['baseline']['spatial_f1']},
        'candidate': {'class_f1': scores['candidate']['class_and_position']['f1'],
                      'spatial_f1': scores['candidate']['spatial_f1']},
    }, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
