"""Verify and package the expanded-data YOLO11 gear model as read-only v3."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / 'output/gear-yolo-full-v1'
BASELINE = ROOT / '.runtime/quality-models/yolo11-gear-v2'
TARGET = ROOT / '.runtime/quality-models/yolo11-gear-v3'
MANIFEST = ROOT / 'output/gear-full-dataset/prepared/manifest.json'


def read(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    policy = read(RUN / 'test-policy.json')
    selection = read(RUN / 'selection.json')
    comparison = read(RUN / 'test-comparison.json')
    result = read(RUN / 'result.json')
    summary = read(ROOT / 'output/gear-full-dataset/prepared-summary.json')
    weights = Path(result['best']).resolve(strict=True)
    candidate = comparison['candidate']
    if (not selection['eligible_for_frozen_test'] or not comparison['accepted_for_research_model']
            or comparison['policy'] != policy or comparison['test_images'] != 118
            or digest(weights) != policy['candidate_weights_sha256']
            or digest(MANIFEST) != policy['manifest_sha256']
            or result['sha256'] != digest(weights)
            or result['manifest_sha256'] != digest(MANIFEST)
            or summary['manifest_sha256'] != digest(MANIFEST)
            or summary['split_images'] != {'train': 779, 'calibration': 188, 'test': 118}
            or TARGET.exists()):
        raise ValueError('expanded model evidence is incomplete, inconsistent, or already packaged')
    metadata = read(BASELINE / 'model.json')
    metadata.pop('refinement_source_sha256', None)
    metadata.update({
        'name': 'YOLO11n 塑料齿轮外观缺陷 v3（研究验证）',
        'description': '同源扩充数据训练，118张全新测试图含318个标注缺陷：正确定位155个，其中类别与位置均正确136个，多余框86个。仍有漏检，且没有正常齿轮图，不能用于产线放行。',
        'weights_sha256': digest(weights),
        'manifest_sha256': digest(MANIFEST),
        'recommended_confidence': policy['candidate_confidence'],
        'calibration_scope': 'real_gear_expanded_defect_only_calibration',
        'scope': 'public_gear_research_expanded',
        'evaluation_status': 'research_expanded_misses_remain',
        'training_images': summary['split_images']['train'],
        'calibration_images': summary['split_images']['calibration'],
        'fresh_test_images': comparison['test_images'],
        'test_gt_instances': candidate['spatial']['gt_instances'],
        'test_class_and_position_tp': candidate['class_and_position']['tp'],
        'test_spatial_tp': candidate['spatial']['tp'],
        'test_extra_boxes': candidate['spatial']['fp'],
    })
    if metadata['classes'] != read(MANIFEST)['classes']:
        raise ValueError('model and expanded data class order differ')
    metadata_path = RUN / 'model.json'
    with metadata_path.open('x', encoding='utf-8') as stream:
        json.dump(metadata, stream, ensure_ascii=False, indent=2, allow_nan=False)
    api_dir = RUN / 'api-verification'
    subprocess.run([sys.executable, str(ROOT / 'scripts/verify_gear_vision.py'),
                    '--weights', str(weights), '--metadata', str(metadata_path),
                    '--manifest', str(MANIFEST), '--out', str(api_dir)],
                   cwd=ROOT, check=True)
    TARGET.mkdir(exist_ok=False)
    shutil.copy2(weights, TARGET / 'best.pt')
    shutil.copy2(metadata_path, TARGET / 'model.json')
    for name in ('provenance.json', 'result.json', 'selection.json',
                 'test-policy.json', 'baseline-frozen.json', 'candidate-frozen.json',
                 'test-comparison.json'):
        shutil.copy2(RUN / name, TARGET / name)
    (TARGET / 'validated.json').write_text(json.dumps({
        'weights_sha256': metadata['weights_sha256'],
        'manifest_sha256': metadata['manifest_sha256'],
        'fresh_test_class_and_position_f1': candidate['class_and_position']['f1'],
        'fresh_test_spatial_f1': candidate['spatial_f1'],
        'api_verification': str(api_dir / 'summary.json'),
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'model': str(TARGET), 'api': 'passed',
                      'test_class_and_position_tp': candidate['class_and_position']['tp'],
                      'test_spatial_tp': candidate['spatial']['tp']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
