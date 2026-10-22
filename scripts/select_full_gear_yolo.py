"""Select expanded-data YOLO against v2 using calibration before fresh test."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / 'output/gear-full-dataset'
RUN = ROOT / 'output/gear-yolo-full-v1'
V2 = ROOT / '.runtime/quality-models/yolo11-gear-v2'
sys.path.insert(0, str(ROOT / 'scripts'))

from select_refined_gear_yolo import assess


def read(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def evaluate(weights: Path, manifest: Path, out: Path) -> dict:
    if out.exists():
        report = read(out)
        if (report.get('split') != 'calibration'
                or report.get('weights_sha256') != digest(weights)
                or report.get('manifest_sha256') != digest(manifest)):
            raise ValueError(f'existing calibration evidence differs: {out}')
        return report
    subprocess.run([sys.executable, str(ROOT / 'scripts/evaluate_yolo.py'), 'evaluate',
                    '--weights', str(weights), '--manifest', str(manifest),
                    '--input-size', '640', '--max-images', '2000', '--out', str(out)],
                   cwd=ROOT, check=True)
    return read(out)


def main() -> None:
    result = read(RUN / 'result.json')
    candidate = Path(result['best']).resolve(strict=True)
    baseline = V2 / 'best.pt'
    manifest = FULL / 'prepared/manifest.json'
    if digest(candidate) != result['sha256'] or digest(manifest) != result['manifest_sha256']:
        raise ValueError('candidate or dataset differs from frozen training record')
    v2_model = read(V2 / 'model.json')
    if digest(baseline) != v2_model['weights_sha256']:
        raise ValueError('baseline v2 weights changed')
    baseline_report = evaluate(baseline, manifest, RUN / 'baseline-calibration.json')
    candidate_report = evaluate(candidate, manifest, RUN / 'candidate-calibration.json')
    identities = lambda report: [(row['sample_id'], row['pixel_sha256'], row['group_id'], row['ground_truth'])
                                 for row in sorted(report['samples'], key=lambda item: item['sample_id'])]
    if identities(baseline_report) != identities(candidate_report):
        raise ValueError('calibration image or annotation mismatch')
    old, new = assess(baseline_report), assess(candidate_report)
    old_best, new_best = old['selected'], new['selected']
    eligible = (new_best['class_aware']['f1'] > old_best['class_aware']['f1']
                and new_best['spatial_f1'] >= old_best['spatial_f1'])
    selection = {'rule': 'class-and-position F1 improves and label-agnostic spatial F1 does not decrease on identical calibration groups',
                 'baseline_weights_sha256': digest(baseline),
                 'candidate_weights_sha256': digest(candidate),
                 'manifest_sha256': digest(manifest),
                 'baseline': old, 'candidate': new,
                 'eligible_for_frozen_test': eligible, 'fresh_test_opened': False}
    with (RUN / 'selection.json').open('x', encoding='utf-8') as stream:
        json.dump(selection, stream, ensure_ascii=False, indent=2, allow_nan=False)
    print(json.dumps({'eligible_for_frozen_test': eligible,
                      'baseline': {'confidence': old_best['confidence'], 'class_f1': old_best['class_aware']['f1'], 'spatial_f1': old_best['spatial_f1']},
                      'candidate': {'confidence': new_best['confidence'], 'class_f1': new_best['class_aware']['f1'], 'spatial_f1': new_best['spatial_f1']}},
                     ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
