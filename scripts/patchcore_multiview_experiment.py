"""Offline, source-grouped PatchCore multiview experiment; never auto-deploys."""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import gc
import hashlib
import json
import math
import os
from pathlib import Path
import sys
import time

for key in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS'):
    os.environ.setdefault(key, '1')
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'services/agent-service'))
SOURCE = ROOT / '.runtime/quality-research/manta-gear-patchcore-full-v1'
ACTIVE = ROOT / '.runtime/quality-models/patchcore-gear-v1'
WEIGHTS = ROOT / '.runtime/quality-models/backbones/resnet18-f37072fd.pth'


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
    temporary.replace(path)


def now():
    return datetime.now(timezone.utc).isoformat()


def status(output, stage, **details):
    write(output / 'status.json', dict(stage=stage, updated_at=now(), pid=os.getpid(), **details))
    print(stage, json.dumps(details, ensure_ascii=False), flush=True)

def view_boxes(size):
    width, height = size
    if min(width, height) <= 0 or width % 5 or not .6 <= (width / 5) / height <= 1.2:
        raise ValueError('Expected an explicitly identified original five-view gear composite')
    stride = width // 5
    return [(i * stride, 0, (i + 1) * stride, height) for i in range(5)]

def validate_manifest(rows):
    for field in ('sample_id', 'group_id', 'file_sha256', 'pixel_sha256'):
        seen = {}
        for row in rows:
            previous = seen.get(row[field])
            if previous is not None and (previous != 'train' or row['split'] != 'train'):
                raise ValueError('Dataset overlap: ' + field)
            seen[row[field]] = row['split']
    if any(r['label'] != 'normal' for r in rows if r['split'] == 'train'):
        raise ValueError('Only normal images may enter the memory bank')
    for split in ('calibration', 'test'):
        if {r['label'] for r in rows if r['split'] == split} != {'normal', 'defect'}:
            raise ValueError('Both normal and defect denominators are required')

def select_threshold(normal, defect, max_fpr=0.):
    from app.vision.calibration import _metrics, _scores
    normal, defect = _scores(normal), _scores(defect)
    if not normal or not defect or not 0 <= max_fpr < 1:
        raise ValueError('Both calibration classes and a valid FPR budget are required')
    # The smallest threshold satisfying the normal false-positive budget also
    # minimizes misses. Never consult held-out scores to move this boundary.
    allowed = math.floor(max_fpr * len(normal))
    threshold = math.nextafter(sorted(normal, reverse=True)[allowed], math.inf)
    return dict(threshold=threshold, metrics=_metrics(normal, defect, threshold),
                rule='minimum threshold above every reserved normal calibration score; score >= threshold')

def replacement_gate(candidate, baseline):
    for value in (candidate, baseline):
        if value['defect_n'] <= 0 or value['normal_n'] <= 0:
            raise ValueError('Nonempty independent normal and defect test sets required')
        if not 0 <= value['fn'] <= value['defect_n'] or not 0 <= value['fp'] <= value['normal_n']:
            raise ValueError('Invalid confusion counts')
    fnr, fpr = candidate['fn'] / candidate['defect_n'], candidate['fp'] / candidate['normal_n']
    checks = dict(fnr_at_most_one_percent=fnr <= .01, fpr_at_most_one_percent=fpr <= .01,
                  misses_not_worse=fnr <= baseline['fn'] / baseline['defect_n'],
                  false_alarms_not_worse=fpr <= baseline['fp'] / baseline['normal_n'])
    return dict(empirical_pass=all(checks.values()), checks=checks,
                statistical_note='Empirical rates alone do not establish a population error rate below 1%.')


def initialize(output):
    if (output / 'protocol.json').exists():
        return check_protocol(output)
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use an empty experiment directory')
    rows = experiment_rows()
    validate_manifest(rows)
    active = read(ACTIVE / 'model.json')
    protocol = dict(created_at=now(), source_manifest_sha256=sha(SOURCE / 'manifest.json'),
                    source_script_sha256=sha(__file__), weights_sha256=sha(WEIGHTS),
                    active_hashes={str(p.relative_to(ROOT)): sha(p) for p in (
                        ACTIVE / 'model.json', ACTIVE / 'memory.npz',
                        ROOT / '.runtime/quality-models/yolo11-gear-fine-defects-v2/best.pt',
                        ROOT / '.runtime/quality-models/yolo11-gear-fine-defects-v2/model.json')},
                    active_threshold=active['suggested_threshold'], active_config=active['preprocessing'],
                    variants=[dict(input_size=s, resize_mode='letterbox', contrast='none', blur_sigma=2.)
                              for s in (224, 448)],
                    memory='five position-specific banks, 1024 original 384-D feature vectors each',
                    local_coreset=32, training_images=1768,
                    reserved_normal_calibration=300,
                    selection='calibration only: minimize misses subject to zero false alarms on 312 reserved normals; ties prefer 224',
                    acceptance=dict(max_fnr=.01, max_fpr=.01, no_regression=True),
                    split_counts={s: dict(Counter(r['label'] for r in rows if r['split'] == s))
                                  for s in ('train', 'calibration', 'test')},
                    data_scope='real public MANTA gear photographs, not user production-line captures',
                    test_scope='Same previously evaluated 219 held-out composites; independent of building/calibration, not a new unseen benchmark.',
                    grouping='All five views stay in one source group. Never counted as independent test samples.',
                    promotion='No automatic deployment; require metric gates and application compatibility verification.')
    output.mkdir(parents=True, exist_ok=True)
    write(output / 'protocol.json', protocol)
    write(output / 'manifest.json', rows)
    audit = []
    from app.vision.evaluation import load_rgb, pixel_sha256
    for index, row in enumerate(rows, 1):
        if sha(row['path']) != row['file_sha256']:
            raise ValueError('Source changed: ' + row['path'])
        with load_rgb(row['path']) as image:
            view_boxes(image.size)
            if pixel_sha256(image) != row['pixel_sha256']:
                raise ValueError('Decoded pixels changed: ' + row['path'])
        audit.append(row['sample_id'])
        if index % 200 == 0:
            status(output, 'auditing_real_images', completed=index, total=len(rows))
    write(output / 'data-audit.json', dict(passed=True, images=len(audit), group_overlap=0,
                                         file_or_pixel_overlap_across_splits=0, finished_at=now()))
    return protocol


def experiment_rows():
    rows = read(SOURCE / 'manifest.json')
    train = [r for r in rows if r['split'] == 'train']
    reserved = {r['sample_id'] for r in sorted(train, key=lambda r: hashlib.sha256(
        ('20261023:reserve-normal:' + r['group_id']).encode()).hexdigest())[:300]}
    return [{**r, 'split': 'calibration', 'calibration_origin': 'reserved_official_train_normal'}
            if r['sample_id'] in reserved else r for r in rows]


def check_protocol(output):
    protocol = read(output / 'protocol.json')
    if protocol['source_script_sha256'] != sha(__file__) or protocol['weights_sha256'] != sha(WEIGHTS):
        raise ValueError('Experiment code or backbone changed; use a new experiment directory')
    if protocol['source_manifest_sha256'] != sha(SOURCE / 'manifest.json'):
        raise ValueError('Original manifest changed')
    if read(output / 'manifest.json') != experiment_rows():
        raise ValueError('Manifest changed')
    for path, digest in protocol['active_hashes'].items():
        if sha(ROOT / path) != digest:
            raise ValueError('Active model changed during experiment: ' + path)
    return protocol


def setup_runtime():
    import torch
    import cv2
    torch.manual_seed(20261023)
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    cv2.setNumThreads(1)


def build(output, size):
    import numpy as np
    from app.vision.algorithms import PatchCoreDetector, greedy_coreset
    from app.vision.evaluation import load_rgb
    from app.vision.preprocessing import _patchcore_transform
    protocol = check_protocol(output)
    config = next(c for c in protocol['variants'] if c['input_size'] == size)
    dest = output / str(size)
    dest.mkdir(exist_ok=True)
    if (dest / 'model.json').exists():
        status(output, 'already_built', input_size=size)
        return
    rows = [r for r in read(output / 'manifest.json') if r['split'] == 'train']
    detector = PatchCoreDetector(str(WEIGHTS), config=config)
    cache = dest / 'feature_candidates.npy'
    checkpoint = dest / 'feature_progress.json'
    completed = read(checkpoint)['completed'] if checkpoint.exists() else 0
    if completed and not cache.exists():
        raise ValueError('Feature cache missing')
    features = np.lib.format.open_memmap(cache, mode='r+' if cache.exists() else 'w+',
                                        dtype=np.float32, shape=(5, len(rows), 32, 384))
    started = time.perf_counter()
    for index in range(completed, len(rows)):
        row = rows[index]
        if sha(row['path']) != row['file_sha256']:
            raise ValueError('Training image changed')
        with load_rgb(row['path']) as image:
            for view, box in enumerate(view_boxes(image.size)):
                with image.crop(box) as tile:
                    patch, grid = detector._extract_features(tile)
                    left, top, right, bottom = _patchcore_transform(tile.size, config)['content_box']
                    xs = (np.arange(grid[1]) + .5) * size / grid[1]
                    ys = (np.arange(grid[0]) + .5) * size / grid[0]
                    valid = ((ys >= top) & (ys < bottom))[:, None] & ((xs >= left) & (xs < right))[None, :]
                    eligible = patch[valid.reshape(-1)]
                    features[view, index] = greedy_coreset(eligible, ratio=1., max_size=32)
        if (index + 1) % 25 == 0 or index + 1 == len(rows):
            features.flush()
            write(checkpoint, dict(completed=index + 1, total=len(rows), input_size=size))
            status(output, 'extracting_normal_views', input_size=size, completed=index + 1,
                   total=len(rows), elapsed_seconds=round(time.perf_counter() - started, 1))
    del features, detector
    gc.collect()
    features = np.load(cache, mmap_mode='r', allow_pickle=False)
    banks = []
    for view in range(5):
        bank_path = dest / f'view-{view}.npy'
        if bank_path.exists():
            bank = np.load(bank_path, allow_pickle=False)
        else:
            status(output, 'selecting_view_memory', input_size=size, view=view)
            bank = greedy_coreset(features[view].reshape(-1, 384), ratio=1., max_size=1024)
            np.save(bank_path, bank)
        banks.append(bank)
    np.savez_compressed(dest / 'memory.npz', **{f'view_{i}': b for i, b in enumerate(banks)})
    write(dest / 'model.json', dict(algorithm='patchcore_multiview_research', preprocessing=config,
          sample_count=len(rows), training_views=len(rows) * 5, per_view_memory=1024, total_memory=5120,
          memory_sha256=sha(dest / 'memory.npz'), weights_sha256=sha(WEIGHTS),
          scope=protocol['data_scope'], automatic_geometry_detection=False,
          source_groups=[r['group_id'] for r in rows]))
    status(output, 'memory_ready', input_size=size, total_memory=5120)


def score(output, size, split):
    import numpy as np
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.evaluation import load_rgb
    protocol = check_protocol(output)
    dest = output / (str(size) if size else 'baseline')
    dest.mkdir(exist_ok=True)
    if size:
        metadata = read(dest / 'model.json')
        if metadata['memory_sha256'] != sha(dest / 'memory.npz'):
            raise ValueError('Candidate memory changed')
        with np.load(dest / 'memory.npz', allow_pickle=False) as saved:
            banks = [saved[f'view_{i}'].copy() for i in range(5)]
        config = metadata['preprocessing']
    else:
        config = protocol['active_config']
        with np.load(ACTIVE / 'memory.npz', allow_pickle=False) as saved:
            banks = [saved['memory_bank'].copy()]
    detector = PatchCoreDetector(str(WEIGHTS), config=config)
    samples = [r for r in read(output / 'manifest.json') if r['split'] == split]
    score_path = dest / f'{split}_scores.json'
    scores = read(score_path) if score_path.exists() else []
    if len(scores) > len(samples) or any(s['sample_id'] != r['sample_id'] for s, r in zip(scores, samples)):
        raise ValueError('Saved score prefix mismatch')
    for row in samples[len(scores):]:
        if sha(row['path']) != row['file_sha256']:
            raise ValueError('Evaluation image changed')
        started = time.perf_counter()
        with load_rgb(row['path']) as image:
            view_scores = []
            boxes = view_boxes(image.size) if size else [(0, 0, image.width, image.height)]
            for box, bank in zip(boxes, banks):
                with image.crop(box) as tile:
                    heatmap = detector.anomaly_map(tile, bank)
                    view_scores.append(float(heatmap.max()))
        scores.append({**row, 'score': max(view_scores), 'view_scores': view_scores,
                       'seconds': time.perf_counter() - started})
        write(score_path, scores)
        if len(scores) % 10 == 0 or len(scores) == len(samples):
            status(output, 'scoring_' + split, input_size=size, completed=len(scores), total=len(samples))
    if split == 'calibration' and size:
        selected = select_threshold([r['score'] for r in scores if r['label'] == 'normal'],
                                    [r['score'] for r in scores if r['label'] == 'defect'])
        write(dest / 'calibration.json', selected)
        status(output, 'calibration_result', input_size=size, **selected)
    return scores


def evaluate(rows, threshold):
    from app.vision.evaluation import metrics_from_scores
    return dict(overall=metrics_from_scores(rows, threshold),
                by_scenario={s: metrics_from_scores([r for r in rows if r['scenario'] == s], threshold)
                             for s in sorted({r['scenario'] for r in rows})},
                misses=[r['sample_id'] for r in rows if r['label'] == 'defect' and r['score'] < threshold],
                false_alarms=[r['sample_id'] for r in rows if r['label'] == 'normal' and r['score'] >= threshold])


def final_test(output):
    protocol = check_protocol(output)
    lock_path = output / 'selection_locked.json'
    if lock_path.exists():
        locked = read(lock_path)
    else:
        choices = [(s, read(output / str(s) / 'calibration.json')) for s in (224, 448)]
        size, calibration = min(choices, key=lambda item: (item[1]['metrics']['fnr'], item[1]['metrics']['fpr'], item[0]))
        locked = dict(locked_at=now(), input_size=size, threshold=calibration['threshold'],
                      calibration=calibration, memory_sha256=sha(output / str(size) / 'memory.npz'),
                      protocol_sha256=sha(output / 'protocol.json'), script_sha256=sha(__file__))
        write(lock_path, locked)
    if (locked['memory_sha256'] != sha(output / str(locked['input_size']) / 'memory.npz') or
            locked['protocol_sha256'] != sha(output / 'protocol.json') or locked['script_sha256'] != sha(__file__)):
        raise ValueError('Frozen candidate changed')
    baseline = evaluate(score(output, 0, 'test'), protocol['active_threshold'])
    candidate = evaluate(score(output, locked['input_size'], 'test'), locked['threshold'])
    gate = replacement_gate(candidate['overall'], baseline['overall'])
    result = dict(finished_at=now(), baseline=baseline, candidate=candidate, gate=gate,
                  locked=locked, protocol=protocol, deployed=False,
                  active_models_unchanged=True)
    check_protocol(output)
    write(output / 'comparison.json', result)
    status(output, 'completed', baseline=baseline['overall'], candidate=candidate['overall'], gate=gate)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'output/patchcore-multiview-v2')
    parser.add_argument('--stage', choices=('prepare', 'build', 'calibrate', 'test', 'all'), default='all')
    parser.add_argument('--size', type=int, choices=(224, 448), default=224)
    args = parser.parse_args()
    output = args.output.resolve()
    setup_runtime()
    if args.stage in ('prepare', 'all'):
        initialize(output)
        score(output, 0, 'calibration')
    if args.stage == 'all':
        for size in (224, 448):
            build(output, size)
            score(output, size, 'calibration')
        final_test(output)
    elif args.stage == 'build':
        build(output, args.size)
    elif args.stage == 'calibrate':
        score(output, args.size, 'calibration')
    elif args.stage == 'test':
        final_test(output)


if __name__ == '__main__':
    main()
