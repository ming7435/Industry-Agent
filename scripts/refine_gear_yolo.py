"""Continue the real-gear YOLO baseline using only the fixed training split.

This creates an isolated experiment. It never changes deployed weights or opens
the held-out test images. Run evaluation on the calibration split afterwards.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'output/gear-dataset'
EXPERIMENT = ROOT / 'output/gear-yolo-refinement-v1'
sys.path.insert(0, str(ROOT / 'services/agent-service'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_new(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)


def main() -> None:
    from app.vision.yolo_evaluation import load_yolo_manifest

    baseline = json.loads((DATA / 'training-result.json').read_text(encoding='utf-8'))
    source = Path(baseline['best']).resolve(strict=True)
    manifest = Path(baseline['manifest']).resolve(strict=True)
    if digest(source) != baseline['sha256']:
        raise ValueError('baseline weights changed')
    rows = load_yolo_manifest(manifest)
    if len(rows) != 240 or {part: sum(row['split'] == part for row in rows)
                            for part in ('train', 'calibration', 'test')} != {
                                'train': 145, 'calibration': 46, 'test': 49}:
        raise ValueError('fixed grouped gear dataset changed')
    dataset = DATA / 'prepared/data.yaml'
    if 'test' in dataset.read_text(encoding='utf-8').lower():
        raise ValueError('training YAML must not include held-out test images')
    if EXPERIMENT.exists():
        raise FileExistsError('experiment directory already exists; preserve prior evidence')
    EXPERIMENT.mkdir(parents=True)

    for variable in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS'):
        os.environ[variable] = '2'
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false',
                      YOLO_OFFLINE='true', WANDB_MODE='disabled',
                      YOLO_CONFIG_DIR=str(EXPERIMENT / 'ultralytics-config'))
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
    parameters = dict(data=str(dataset), epochs=16, patience=6, batch=2,
                      imgsz=640, freeze=0, device='cpu', workers=0, cache=False,
                      optimizer='AdamW', lr0=.0003, lrf=.1, resume=False,
                      plots=False, deterministic=True, seed=20261026, amp=False,
                      project=str(EXPERIMENT), name='training', exist_ok=False,
                      val=True, save=True)
    save_new(EXPERIMENT / 'provenance.json', {
        'source_weights_sha256': digest(source), 'manifest_sha256': digest(manifest),
        'training_yaml_sha256': digest(dataset), 'parameters': parameters,
        'test_used_in_training': False,
        'purpose': 'isolated continuation with all YOLO11 layers trainable; compare on calibration before test',
    })
    model.train(**parameters)
    best = model.trainer.best.resolve(strict=True)
    save_new(EXPERIMENT / 'result.json', {
        'best': str(best), 'sha256': digest(best),
        'source_weights_sha256': digest(source), 'manifest_sha256': digest(manifest),
        'parameters': parameters,
    })
    print(json.dumps({'best': str(best), 'sha256': digest(best)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
