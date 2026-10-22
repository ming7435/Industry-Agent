"""Package the calibrated 240-image YOLO refinement as a separate read-only model."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
EXPERIMENT = ROOT / 'output/gear-yolo-refinement-v1'
BASELINE = ROOT / '.runtime/quality-models/yolo11-gear-v1'
TARGET = ROOT / '.runtime/quality-models/yolo11-gear-v2'
sys.path.insert(0, str(ROOT / 'services/agent-service'))

from app.vision.yolo_evaluation import class_aware_localization


def read(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    selection = read(EXPERIMENT / 'selection.json')
    result = read(EXPERIMENT / 'result.json')
    test = read(EXPERIMENT / 'test.json')
    frozen = read(EXPERIMENT / 'frozen.json')
    baseline_test = read(ROOT / 'output/gear-dataset/test.json')
    weights = Path(result['best']).resolve(strict=True)
    if (not selection['eligible_for_frozen_test']
            or digest(weights) != result['sha256']
            or test['weights_sha256'] != digest(weights)
            or frozen['weights_sha256'] != digest(weights)
            or frozen['manifest_sha256'] != selection['manifest_sha256']
            or test['config']['confidence'] != selection['candidate']['selected']['confidence']):
        raise ValueError('candidate selection, freeze, or weights disagree')
    old = class_aware_localization(baseline_test['samples'], baseline_test['config']['confidence'])
    new = class_aware_localization(test['samples'], test['config']['confidence'])
    if (test['metrics']['overall']['tp'] < baseline_test['metrics']['overall']['tp']
            or test['metrics']['overall']['fp'] > baseline_test['metrics']['overall']['fp']
            or new['tp'] < old['tp']):
        raise ValueError('test safety check found fewer hits or more extra boxes')
    TARGET.mkdir(exist_ok=False)
    shutil.copy2(weights, TARGET / 'best.pt')
    metadata = read(BASELINE / 'model.json')
    metadata.update({
        'name': 'YOLO11n 塑料齿轮外观缺陷 v2（研究验证）',
        'description': '基于同一240张齿轮数据继续微调。原49张测试图复核：112个缺陷中正确定位42个、类别与位置均正确40个，多余框39个；burn/hair等类别仍漏检，不适合产线放行。没有正常齿轮，误报率未知。',
        'weights_sha256': digest(TARGET / 'best.pt'),
        'recommended_confidence': selection['candidate']['selected']['confidence'],
        'evaluation_status': 'research_refinement_misses_remain',
        'refinement_source_sha256': result['source_weights_sha256'],
        'test_class_and_position_tp': new['tp'],
        'test_spatial_tp': test['metrics']['overall']['tp'],
    })
    (TARGET / 'model.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    for name in ('provenance.json', 'result.json', 'selection.json', 'calibration.json',
                 'frozen.json', 'test.json'):
        shutil.copy2(EXPERIMENT / name, TARGET / name)
    out = EXPERIMENT / 'api-verification'
    subprocess.run([sys.executable, str(ROOT / 'scripts/verify_gear_vision.py'),
                    '--weights', str(TARGET / 'best.pt'), '--metadata', str(TARGET / 'model.json'),
                    '--out', str(out)], cwd=ROOT, check=True)
    (TARGET / 'validated.json').write_text(json.dumps({
        'weights_sha256': metadata['weights_sha256'],
        'calibration_eligible': True,
        'test_spatial_tp': test['metrics']['overall']['tp'],
        'test_class_and_position_tp': new['tp'],
        'api_verification': str(out / 'summary.json'),
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'model': str(TARGET), 'api': 'passed',
                      'spatial_tp': test['metrics']['overall']['tp'],
                      'class_and_position_tp': new['tp']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
