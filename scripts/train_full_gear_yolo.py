"""Train an isolated YOLO11 experiment on expanded real gear data.

The training YAML exposes only train and calibration images. Previous test
groups are quarantined and the newly held-out test is never passed to YOLO.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / 'output/gear-full-dataset'
RUN = ROOT / 'output/gear-yolo-full-v1'
BASELINE = ROOT / 'output/gear-dataset/training-result.json'
sys.path.insert(0, str(ROOT / 'services/agent-service'))


def read(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_new(path: Path, value) -> None:
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)


def main() -> None:
    from app.vision.yolo_evaluation import load_yolo_manifest

    baseline = read(BASELINE)
    source = Path(baseline['best']).resolve(strict=True)
    if digest(source) != baseline['sha256']:
        raise ValueError('source weights differ from recorded baseline')
    manifest = FULL / 'prepared/manifest.json'
    rows = load_yolo_manifest(manifest)
    summary = read(FULL / 'prepared-summary.json')
    if (summary['manifest_sha256'] != digest(manifest)
            or not summary['prior_test_quarantined'] or not summary['new_test_groups_only']
            or len(rows) != summary['used_images']):
        raise ValueError('expanded grouped dataset validation failed')
    yaml = FULL / 'prepared/data.yaml'
    contents = read(yaml)
    if set(contents) != {'path', 'train', 'val', 'names', 'nc'}:
        raise ValueError('training YAML exposes unexpected data paths')
    if contents['names'] != baseline['classes']:
        raise ValueError('source model class order differs from expanded data')
    if RUN.exists():
        raise FileExistsError('training experiment already exists')
    RUN.mkdir(parents=True)

    for variable in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS'):
        os.environ[variable] = '2'
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false',
                      YOLO_OFFLINE='true', WANDB_MODE='disabled',
                      YOLO_CONFIG_DIR=str(RUN / 'ultralytics-config'))
    import torch
    from ultralytics import YOLO
    from ultralytics.utils import SAFE_LOAD, SETTINGS, callbacks, torch_utils

    if SAFE_LOAD is not True:
        raise ValueError('safe-only checkpoint loading is required')
    callbacks.add_integration_callbacks = lambda instance: None
    SETTINGS.update({key: False for key in ('sync', 'clearml', 'comet', 'dvc',
                                            'mlflow', 'raytune', 'tensorboard', 'wandb')})
    torch_utils.NUM_THREADS = 2
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    model = YOLO(str(source), task='detect')
    if not any(type(layer).__name__ == 'C3k2' for layer in model.model.modules()):
        raise ValueError('source checkpoint is not YOLO11')
    parameters = dict(data=str(yaml), epochs=12, patience=5, batch=4,
                      imgsz=640, freeze=0, device='cpu', workers=0, cache=False,
                      optimizer='AdamW', lr0=.0003, lrf=.1, resume=False,
                      mosaic=.5, close_mosaic=5, plots=False, deterministic=True,
                      seed=20261026, amp=False, project=str(RUN), name='training',
                      exist_ok=False, val=True, save=True)
    save_new(RUN / 'provenance.json', {
        'source_weights_sha256': digest(source), 'manifest_sha256': digest(manifest),
        'training_yaml_sha256': digest(yaml), 'parameters': parameters,
        'split_images': summary['split_images'], 'test_used_in_training': False,
        'prior_test_groups_quarantined': True, 'fresh_test_groups': summary['split_groups']['test'],
    })
    model.train(**parameters)
    best = model.trainer.best.resolve(strict=True)
    save_new(RUN / 'result.json', {'best': str(best), 'sha256': digest(best),
                                   'source_weights_sha256': digest(source),
                                   'manifest_sha256': digest(manifest),
                                   'parameters': parameters})
    print(json.dumps({'best': str(best), 'sha256': digest(best)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
