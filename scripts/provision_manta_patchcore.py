"""Expose a verified offline gear memory as a read-only normal-bank preset.

The source evaluation and the deployed preset remain separate. This script does
not change production quality records or enable the preset in ``.env``.
"""
from __future__ import annotations

import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
import shutil
from uuid import uuid4

import numpy as np


ROOT = Path(__file__).resolve().parents[1]


def digest(path: Path) -> str:
    value = sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def load_json(path: Path) -> dict:
    value = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(value, dict):
        raise ValueError(f'Expected JSON object: {path}')
    return value


def prepare(source: Path, weights: Path, policy: str = 'balanced') -> tuple[Path, dict]:
    source = source.resolve(strict=True)
    weights = weights.resolve(strict=True)
    status = load_json(source.parent / 'manta-gear-patchcore-status.json')
    offline = load_json(source / 'model.json')
    summary = load_json(source / 'summary.json')
    calibration = load_json(source / 'calibration.json')
    memory = source / 'memory.npz'
    checksum = digest(memory)
    with np.load(memory, allow_pickle=False) as saved:
        bank = saved['memory_bank']
        if bank.shape != (1024, 384) or bank.dtype != np.float32 or not np.isfinite(bank).all():
            raise ValueError('Expected the verified 1024 × 384 float32 MANTA memory bank.')
    if (status.get('stage') != 'completed' or status.get('metrics_available') is not True
            or Path(status.get('output', '')).resolve() != source
            or offline.get('sample_count') != 2068 or offline.get('all_images_processed') is not True
            or summary.get('official_training_count') != 2068
            or summary.get('memory_bank_sha256') != checksum
            or offline.get('memory_bank_sha256') != checksum
            or offline.get('weights_sha256') != digest(weights)
            or summary.get('calibration') != calibration
            or policy not in calibration.get('strategies', {})):
        raise ValueError('Offline memory, source weights, calibration or completed report do not agree.')
    result = summary['test'][policy]['overall']
    if result['normal_n'] != 150 or result['defect_n'] != 69:
        raise ValueError('Independent test denominators differ from the locked evaluation split.')
    strategies = calibration['strategies']
    selected = strategies[policy]
    record = {
        'model_id': 'patchcore-gear',
        'name': '齿轮正常记忆库',
        'algorithm': 'patchcore',
        'sample_count': 2068,
        'memory_size': 1024,
        'pipeline_version': offline['pipeline_version'],
        'preprocessing': offline['preprocessing'],
        'weights_sha256': offline['weights_sha256'],
        'memory_bank_sha256': checksum,
        'suggested_threshold': selected['threshold'],
        'threshold_method': 'independent_labeled_calibration',
        'calibration_required': False,
        'calibration': {
            'policy': policy,
            'normal_count': 12,
            'defect_count': 12,
            'created_at': calibration['locked_before_test_at'],
            'strategies': strategies,
        },
        'description': '基于 2068 张正常齿轮图像建立的 PatchCore 正常记忆库。',
        'read_only': True,
    }
    return memory, record


def install(source: Path, weights: Path, target: Path, policy: str = 'balanced') -> dict:
    memory, record = prepare(source, weights, policy)
    target = target.resolve()
    target.mkdir(parents=True, exist_ok=True)
    bank_target = target / 'memory.npz'
    metadata_target = target / 'model.json'
    if any(target.iterdir()):
        if (bank_target.is_file() and metadata_target.is_file()
                and digest(bank_target) == record['memory_bank_sha256']
                and load_json(metadata_target) == record):
            return record
        raise ValueError(f'Existing preset differs; preserve or inspect it before replacing: {target}')
    bank_temp = target / ('.' + uuid4().hex + '.npz')
    model_temp = target / ('.' + uuid4().hex + '.json')
    try:
        shutil.copyfile(memory, bank_temp)
        if digest(bank_temp) != record['memory_bank_sha256']:
            raise ValueError('Copied memory bank digest differs from the source.')
        model_temp.write_text(json.dumps(record, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
        os.replace(bank_temp, bank_target)
        os.replace(model_temp, metadata_target)
    finally:
        bank_temp.unlink(missing_ok=True)
        model_temp.unlink(missing_ok=True)
    return record


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / '.runtime/quality-research/manta-gear-patchcore-full-v1')
    parser.add_argument('--weights', type=Path, default=ROOT / '.runtime/quality-models/backbones/resnet18-f37072fd.pth')
    parser.add_argument('--target', type=Path, default=ROOT / '.runtime/quality-models/patchcore-gear-v1')
    parser.add_argument('--policy', choices=('recall_priority', 'balanced', 'zero_fp'), default='balanced')
    options = parser.parse_args()
    metadata = install(options.source, options.weights, options.target, options.policy)
    print(json.dumps({'target': str(options.target.resolve()), 'model_id': metadata['model_id'],
                      'sample_count': metadata['sample_count'], 'memory_size': metadata['memory_size'],
                      'threshold': metadata['suggested_threshold']}, ensure_ascii=False))
