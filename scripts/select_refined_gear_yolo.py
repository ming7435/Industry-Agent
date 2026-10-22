"""Compare continued YOLO training against the baseline on calibration only.

The held-out test split is intentionally inaccessible here. The selection rule
is fixed before running this script: improve class-and-position F1 without
lowering label-agnostic spatial F1 on the same 46 calibration images.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'output/gear-dataset'
EXPERIMENT = ROOT / 'output/gear-yolo-refinement-v1'
sys.path.insert(0, str(ROOT / 'services/agent-service'))

from app.vision.yolo_evaluation import class_aware_localization, rescore_report


THRESHOLDS = (.01, .025, .05, .075, .1, .15, .2, .25, .3, .4, .5, .6, .7, .8)


def read(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def spatial_f1(metrics: dict) -> float:
    totals = metrics['overall']
    denominator = 2 * totals['tp'] + totals['fn'] + totals['fp']
    return 2 * totals['tp'] / denominator if denominator else 0.0


def assess(report: dict) -> dict:
    choices = []
    for confidence in THRESHOLDS:
        rescored = rescore_report(report, confidence)
        category = class_aware_localization(rescored['samples'], confidence,
                                             rescored['config']['match_iou'])
        choices.append({'confidence': confidence, 'class_aware': category,
                        'spatial_f1': spatial_f1(rescored['metrics']),
                        'spatial': rescored['metrics']['overall']})
    selected = max(choices, key=lambda item: (
        item['class_aware']['f1'], item['spatial_f1'], item['confidence']))
    return {'selected': selected, 'candidates': choices}


def main() -> None:
    result = read(EXPERIMENT / 'result.json')
    weights = Path(result['best']).resolve(strict=True)
    manifest = DATA / 'prepared/manifest.json'
    if digest(weights) != result['sha256'] or digest(manifest) != result['manifest_sha256']:
        raise ValueError('weights or manifest differs from training record')
    baseline = read(DATA / 'calibration.json')
    if baseline['manifest_sha256'] != result['manifest_sha256'] or baseline['split'] != 'calibration':
        raise ValueError('baseline calibration uses a different dataset')
    candidate_path = EXPERIMENT / 'calibration.json'
    if candidate_path.exists():
        raise FileExistsError('candidate calibration already exists; preserve original evaluation')
    subprocess.run([sys.executable, str(ROOT / 'scripts/evaluate_yolo.py'),
                    'evaluate', '--weights', str(weights), '--manifest', str(manifest),
                    '--input-size', '640', '--out', str(candidate_path)],
                   cwd=ROOT, check=True)
    candidate = read(candidate_path)
    identities = lambda report: [(row['sample_id'], row['pixel_sha256'],
                                  row['group_id'], row['ground_truth'])
                                 for row in sorted(report['samples'], key=lambda row: row['sample_id'])]
    if identities(baseline) != identities(candidate):
        raise ValueError('calibration samples or annotations differ')
    baseline_score, candidate_score = assess(baseline), assess(candidate)
    old, new = baseline_score['selected'], candidate_score['selected']
    eligible = (new['class_aware']['f1'] > old['class_aware']['f1']
                and new['spatial_f1'] >= old['spatial_f1'])
    selection = {'rule': 'candidate class-and-position F1 must improve and spatial F1 must not decrease on fixed calibration; no normal images available',
                 'manifest_sha256': digest(manifest), 'baseline_weights_sha256': baseline['weights_sha256'],
                 'candidate_weights_sha256': digest(weights), 'baseline': baseline_score,
                 'candidate': candidate_score, 'eligible_for_frozen_test': eligible,
                 'test_predictions_opened': False}
    with (EXPERIMENT / 'selection.json').open('x', encoding='utf-8') as stream:
        json.dump(selection, stream, ensure_ascii=False, indent=2, allow_nan=False)
    print(json.dumps({'eligible_for_frozen_test': eligible,
                      'baseline': {'confidence': old['confidence'], 'class_f1': old['class_aware']['f1'], 'spatial_f1': old['spatial_f1']},
                      'candidate': {'confidence': new['confidence'], 'class_f1': new['class_aware']['f1'], 'spatial_f1': new['spatial_f1']}},
                     ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
