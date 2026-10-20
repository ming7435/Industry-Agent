"""Bounded research fine-tune using only explicit train/calibration manifest rows.

Never deploys a model, opens held-out images, or adds their paths to YOLO data.
All runtime settings, labels, weights, logs and provenance stay in a new output.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from contextlib import closing
from datetime import datetime, timezone
import gc
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import sys
import time


SOURCE_SHA = '0ebbc80d4a7680d14987a577cd21342b65ecfd94632bd9a8da63ae6417644ee1'
CLASSES = ['synthetic_scratch', 'synthetic_low_contrast']
SCENARIO_CLASS = {'obvious_scratch': 0, 'low_contrast': 1}
PARAMETERS = dict(epochs=40, patience=10, batch=2, imgsz=320, freeze=10,
                  device='cpu', workers=0, cache=False, optimizer='AdamW', lr0=0.001,
                  resume=False, plots=False, deterministic=True, seed=20261022,
                  amp=False, save=True, val=True)


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')


def ram():
    import psutil
    physical, swap = psutil.virtual_memory(), psutil.swap_memory()
    return {'physical_available_bytes': physical.available, 'physical_total_bytes': physical.total,
            'swap_free_bytes': swap.free, 'process_rss_bytes': psutil.Process().memory_info().rss}


def prepare_data(manifest, output, dataset_seed=20261024):
    from PIL import Image, ImageOps

    document = json.loads(manifest.read_text(encoding='utf-8'))
    if document.get('schema') != 'yolo-localization-v1' or document.get('kind') != 'synthetic_pipeline_optimization_only':
        raise ValueError('only the agreed synthetic localization manifest is accepted')
    if document.get('master_seed') != dataset_seed:
        raise ValueError('the independent dataset must use the agreed seed')
    rows = document.get('samples')
    if not isinstance(rows, list) or not rows:
        raise ValueError('manifest samples missing')
    seen_ids, seen_groups, seen_pixels, groups = set(), {}, set(), defaultdict(set)
    selected = []
    for row in rows:
        split = row.get('split')
        if split not in {'train', 'calibration', 'test'}:
            raise ValueError('explicit split missing')
        sample_id, group_id, pixel_sha = row['sample_id'], row['group_id'], row['pixel_sha256']
        if not re.fullmatch(r'[A-Za-z0-9_-]+', sample_id) or sample_id in seen_ids:
            raise ValueError('sample ID must be unique and path-safe')
        if group_id in seen_groups and seen_groups[group_id] != split:
            raise ValueError('group leakage across dataset splits')
        if not re.fullmatch(r'[a-f0-9]{64}', pixel_sha) or pixel_sha in seen_pixels:
            raise ValueError('duplicate/invalid pixel digest in manifest')
        seen_ids.add(sample_id); seen_groups[group_id] = split; seen_pixels.add(pixel_sha)
        groups[split].add(group_id)
        if split in {'train', 'calibration'}:
            selected.append(row)
    if {split: len(groups[split]) for split in groups} != {'train': 48, 'calibration': 16, 'test': 24}:
        raise ValueError('unexpected independent group counts')
    if Counter(row['split'] for row in selected) != {'train': 144, 'calibration': 48}:
        raise ValueError('expected 144 train and 48 calibration images')
    paired = defaultdict(set)
    audit_rows = []
    data_dir = output / 'data'
    for row in selected:
        split, sample_id, scenario = row['split'], row['sample_id'], row['scenario']
        paired[row['group_id']].add(scenario)
        image_path = (manifest.parent / row['path']).resolve(strict=True)
        mask_path = (manifest.parent / row['mask_path']).resolve(strict=True)
        if not image_path.is_relative_to(manifest.parent) or not mask_path.is_relative_to(manifest.parent):
            raise ValueError('input files must stay in the independent dataset')
        if digest(image_path) != row['file_sha256'] or digest(mask_path) != row['mask_sha256']:
            raise ValueError('image/mask bytes changed since manifest generation')
        with Image.open(image_path) as source, closing(ImageOps.exif_transpose(source).convert('RGB')) as image:
            width, height = image.size
            actual_pixel = hashlib.sha256(f'RGB:{width}:{height}:'.encode() + image.tobytes()).hexdigest()
        if actual_pixel != row['pixel_sha256']:
            raise ValueError('image pixels changed since manifest generation')
        with Image.open(mask_path) as mask:
            mask_bbox = mask.getbbox()
        truth = row['ground_truth']
        if row.get('ground_truth_source') != 'injected_mask_bbox':
            raise ValueError('ground truth must come from the injected mask')
        if scenario == 'normal':
            if truth or mask_bbox is not None or row['label'] != 'normal':
                raise ValueError('normal image must have an empty mask and empty labels')
            lines = []
        else:
            if scenario not in SCENARIO_CLASS or row['label'] != 'defect' or len(truth) != 1:
                raise ValueError('unknown defect scenario')
            box = truth[0]['bbox']
            if len(box) != 4 or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in box):
                raise ValueError('box coordinates must be finite')
            left, top, right, bottom = box
            if not (0 <= left < right <= width and 0 <= top < bottom <= height) or tuple(box) != mask_bbox:
                raise ValueError('box must exactly enclose the injected mask')
            lines = [f'{SCENARIO_CLASS[scenario]} {(left+right)/(2*width):.10f} {(top+bottom)/(2*height):.10f} {(right-left)/width:.10f} {(bottom-top)/height:.10f}']
        for kind in ('images', 'labels'):
            (data_dir / kind / split).mkdir(parents=True, exist_ok=True)
        copied = data_dir / 'images' / split / (sample_id + image_path.suffix)
        with image_path.open('rb') as src, copied.open('xb') as dst:
            shutil.copyfileobj(src, dst)
        with (data_dir / 'labels' / split / (sample_id + '.txt')).open('x', encoding='utf-8') as stream:
            stream.write('\n'.join(lines) + ('\n' if lines else ''))
        audit_rows.append({key: row[key] for key in ('sample_id', 'split', 'group_id', 'scenario', 'domain', 'file_sha256', 'pixel_sha256', 'mask_sha256', 'ground_truth')})
    if any(value != {'normal', 'obvious_scratch', 'low_contrast'} for value in paired.values()):
        raise ValueError('each selected group must contain all three paired scenarios')
    # JSON is valid YAML; the data file has no test key and no held-out paths.
    data_yaml = data_dir / 'data.yaml'
    write_json(data_yaml, {'path': str(data_dir.resolve()), 'train': 'images/train',
                           'val': 'images/calibration', 'names': CLASSES, 'nc': 2})
    write_json(output / 'selected-samples.json', {'manifest_sha256': digest(manifest),
               'selection': 'train/calibration only; test metadata used solely for overlap checks; no test image opened',
               'classes': CLASSES, 'samples': audit_rows})
    return data_yaml, audit_rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--source-sha256', default=SOURCE_SHA)
    parser.add_argument('--source-url', default='https://github.com/ultralytics/assets/releases/tag/v8.3.0')
    parser.add_argument('--family', choices=('yolo11',), default='yolo11')
    parser.add_argument('--dataset-seed', type=int, default=20261024)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    manifest, source, output = args.manifest.resolve(strict=True), args.source.resolve(strict=True), args.output.resolve()
    if not re.fullmatch(r'[a-f0-9]{64}', args.source_sha256) or digest(source) != args.source_sha256:
        raise ValueError('source checkpoint checksum mismatch')
    output.mkdir(parents=True, exist_ok=False)
    data_yaml, rows = prepare_data(manifest, output, args.dataset_seed)
    base = {'source_checkpoint': str(source), 'source_sha256': args.source_sha256,
            'source_url': args.source_url, 'family': args.family,
            'manifest': str(manifest), 'manifest_sha256': digest(manifest), 'script_sha256': digest(__file__),
            'classes': CLASSES, 'parameters': PARAMETERS, 'threads': 2, 'created_at': datetime.now(timezone.utc).isoformat(),
            'counts': dict(Counter(row['split'] for row in rows)), 'heldout_used': False,
            'scope': 'synthetic_pipeline_optimization_only; output restricted to two synthetic classes',
            'calibration_role': 'epoch validation and early stopping only; not independent test accuracy'}
    write_json(output / 'provenance.json', base)
    if args.prepare_only:
        print(json.dumps({'status': 'prepared', 'output': str(output), 'counts': base['counts']}), flush=True)
        return
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false', YOLO_OFFLINE='true',
                      YOLO_CONFIG_DIR=str(output / 'ultralytics-config'), MPLCONFIGDIR=str(output / 'matplotlib-config'),
                      OMP_NUM_THREADS='2', MKL_NUM_THREADS='2', WANDB_MODE='disabled')
    import torch
    from ultralytics import YOLO
    from ultralytics.utils import SETTINGS, SAFE_LOAD, callbacks
    from ultralytics.utils import torch_utils
    assert SAFE_LOAD is True
    SETTINGS.update({key: False for key in ('sync', 'clearml', 'comet', 'dvc', 'mlflow', 'raytune', 'tensorboard', 'wandb')})
    callbacks.add_integration_callbacks = lambda instance: None
    torch_utils.NUM_THREADS = 2
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    started, completed, events = time.monotonic(), 0, output / 'progress.jsonl'

    def event(kind, **values):
        record = {'kind': kind, 'at': datetime.now(timezone.utc).isoformat(),
                  'elapsed_seconds': round(time.monotonic() - started, 2), 'memory': ram(), **values}
        with events.open('a', encoding='utf-8') as stream:
            stream.write(json.dumps(record, ensure_ascii=False, allow_nan=False) + '\n')
        print('RESEARCH_PROGRESS ' + json.dumps(record, ensure_ascii=False), flush=True)
        return record

    def on_fit_epoch_end(trainer):
        nonlocal completed
        completed = max(completed, min(int(trainer.epoch) + 1, int(trainer.epochs)))
        event('epoch', epoch=int(trainer.epoch) + 1, attempt=str(trainer.save_dir),
              metrics={key: float(value) for key, value in trainer.metrics.items()},
              best_fitness=float(trainer.best_fitness), threads=torch.get_num_threads())

    def on_pretrain_end(trainer):
        torch.set_num_threads(2)
        if len(trainer.train_loader.dataset) != 144 or len(trainer.test_loader.dataset) != 48:
            raise ValueError('trainer dataset counts changed')
        if list(trainer.data['names'].values()) != CLASSES:
            raise ValueError('trainer labels changed')
        event('trainer_ready', train_images=len(trainer.train_loader.dataset), calibration_images=len(trainer.test_loader.dataset),
              batch=trainer.batch_size, threads=torch.get_num_threads(), classes=trainer.data['names'])

    event('start', parameters=PARAMETERS, torch_version=torch.__version__)
    for attempt, batch in enumerate((2, 1), start=1):
        current = dict(PARAMETERS, batch=batch, epochs=max(1, PARAMETERS['epochs'] - (completed if attempt > 1 else 0)),
                       data=str(data_yaml), project=str(output), name=f'attempt-{attempt}-batch-{batch}', exist_ok=False)
        try:
            model = YOLO(str(source), task='detect')
            if args.family == 'yolo11' and not any(type(layer).__name__ == 'C3k2' for layer in model.model.modules()):
                raise ValueError('expected a genuine YOLO11 architecture with C3k2 modules')
            model.add_callback('on_pretrain_routine_end', on_pretrain_end)
            model.add_callback('on_fit_epoch_end', on_fit_epoch_end)
            model.train(**current)
            weights = model.trainer.best
            if not weights.is_file():
                raise RuntimeError('training completed without a best checkpoint')
            result = event('completed', best_checkpoint=str(weights), best_sha256=digest(weights),
                           last_checkpoint=str(model.trainer.last), result_metrics=model.metrics.results_dict,
                           completed_epochs=completed, attempt=attempt)
            write_json(output / 'result.json', {**base, **result, 'actual_parameters': current})
            return
        except Exception as failure:
            oom = isinstance(failure, MemoryError) or any(term in str(failure).lower() for term in
                ('out of memory', 'not enough memory', 'defaultcpuallocator', 'bad allocation', 'not enough storage'))
            event('attempt_failed', attempt=attempt, batch=batch, error=str(failure), oom=oom)
            if not oom or attempt == 2:
                raise
            if 'model' in locals():
                del model
            gc.collect()
            event('retry_smaller_batch', batch=1, reason='actual memory allocation failure; no user process stopped')


if __name__ == '__main__':
    main()
