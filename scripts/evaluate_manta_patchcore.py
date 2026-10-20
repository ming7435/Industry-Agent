"""Full-normal-training PatchCore research evaluation on official MANTA gear images.

Run only after the verified archive has been fully extracted:
  .venv/Scripts/python.exe scripts/evaluate_manta_patchcore.py
Or wait in a separately launched background process:
  .venv/Scripts/python.exe scripts/evaluate_manta_patchcore.py --wait-for-data

All 2,068 official train/good images contribute features to the memory bank.
Whole five-view composite images remain indivisible sample groups. Twelve normal
and twelve defective official test images form calibration; all remaining 150
normal and 69 defective images form independent testing. Consequently this is a
custom calibration split, NOT the official MANTA benchmark protocol.
No application configuration, production model registry, or YOLO file is changed.
"""
from __future__ import annotations

import argparse
from collections import Counter
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import sys
import time

for _key in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS'):
    os.environ.setdefault(_key, '1')

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'services' / 'agent-service'))

from app.vision.evaluation import file_sha256, load_rgb, metrics_from_scores, pixel_sha256


EXPECTED_INVENTORY = {'train/good': 2068, 'test/good': 162, 'test/fragmentation': 81}
SAMPLE_NAME = re.compile(r'mechanics_gear_\d+\.png\Z')
SOURCE_URLS = {
    'project': 'https://grainnet.github.io/MANTA',
    'supplement': 'https://grainnet.github.io/static/pdfs/Manta-supp.pdf',
    'record': 'https://api.figshare.com/v2/articles/27937518',
    'archive': 'https://ndownloader.figshare.com/files/50904840',
}
ARCHIVE_MD5 = 'bfa0b4e86d28b3ea7e63d628b7a5510c'


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
    temporary.replace(path)


def update_status(args, stage, **details):
    path = Path(args.status_file).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    write_json(path, {'stage': stage, 'updated_at': datetime.now(timezone.utc).isoformat(),
                      'pid': os.getpid(), 'output': str(Path(args.output).resolve()),
                      'training_mode': 'full', 'training_images': EXPECTED_INVENTORY['train/good'],
                      **details})


def wait_for_data(args):
    started = time.monotonic()
    preparation_path = Path(args.preparation_status).resolve()
    while True:
        preparation = None
        if preparation_path.is_file():
            try:
                preparation = json.loads(preparation_path.read_text(encoding='utf-8'))
            except (OSError, ValueError):
                pass  # The producer may be replacing its progress snapshot.
        stage = preparation.get('stage') if isinstance(preparation, dict) else None
        if stage in {'failed', 'error', 'cancelled', 'canceled'}:
            raise RuntimeError('MANTA preparation failed: ' + str(preparation.get('error', stage)))
        if stage == 'complete':
            discover(Path(args.dataset))
            update_status(args, 'validating_manifest', preparation_status=str(preparation_path))
            return
        elapsed = time.monotonic() - started
        if elapsed >= args.wait_timeout:
            raise TimeoutError(f'MANTA data not ready after {args.wait_timeout} seconds; no model or test metrics were produced.')
        update_status(args, 'waiting_for_data', preparation_status=str(preparation_path),
                      preparation_stage=stage, downloaded_percent=(preparation or {}).get('percent'),
                      waited_seconds=round(elapsed, 1), metrics_available=False)
        print(f'WAIT data stage={stage or "not-started"} elapsed={elapsed:.0f}s; no evaluation metrics yet', flush=True)
        time.sleep(min(args.poll_seconds, args.wait_timeout - elapsed))


def discover(root):
    """Require the full documented inventory; never silently evaluate partial downloads."""
    root = root.resolve(strict=True)
    pools = {}
    seen = set()
    for subdir, expected in EXPECTED_INVENTORY.items():
        directory = root / subdir
        if not directory.is_dir():
            raise ValueError(f'Incomplete MANTA extraction: missing {directory}')
        paths = sorted(directory.glob('*.png'))
        if len(paths) != expected:
            raise ValueError(f'Incomplete/unexpected MANTA inventory: {subdir} has {len(paths)}, expected {expected}. '
                             'Wait for archive verification and extraction; do not substitute generated images.')
        if any(p.is_dir() for p in directory.iterdir()):
            raise ValueError(f'Unexpected nested view layout at {directory}; inspect grouping before evaluation.')
        rows = []
        for path in paths:
            if not SAMPLE_NAME.fullmatch(path.name):
                raise ValueError(f'Unexpected sample name: {path}; do not infer a physical group.')
            if path.stem in seen:
                raise ValueError(f'Duplicate composite sample identity across official splits: {path.stem}')
            seen.add(path.stem)
            rows.append(dict(sample_id=path.stem, group_id=path.stem, path=str(path),
                             official_split=subdir.split('/')[0], scenario=subdir.split('/')[1],
                             label='normal' if subdir.endswith('/good') else 'defect'))
        pools[subdir] = rows
    unexpected = [p.name for p in (root / 'test').iterdir()
                  if p.is_dir() and p.name not in {'good', 'fragmentation'}]
    if unexpected:
        raise ValueError(f'Unexpected defect categories {unexpected}; verify official inventory before evaluation.')
    return pools


def verify_preparation(root, pools):
    """Use the downloader's verified manifest; hash the selected images again below."""
    parent = root.resolve().parent
    manifest_path, provenance_path = parent / 'file-manifest.json', parent / 'source-and-counts.json'
    provenance = json.loads(provenance_path.read_text(encoding='utf-8'))
    if provenance.get('archive_md5_verified') is not True or provenance.get('counts_match_author_supplement') is not True:
        raise ValueError('Dataset provenance does not confirm archive MD5 verification and complete official counts.')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if not isinstance(manifest, list):
        raise ValueError('Dataset file manifest must be a list.')
    entries = {}
    for entry in manifest:
        path = entry.get('path', '') if isinstance(entry, dict) else ''
        if (not isinstance(path, str) or path in entries or Path(path).is_absolute()
                or '..' in Path(path).parts or not isinstance(entry.get('sha256'), str)
                or not re.fullmatch(r'[a-f0-9]{64}', entry['sha256'])
                or type(entry.get('size_bytes')) is not int or entry['size_bytes'] <= 0):
            raise ValueError('Dataset file manifest contains malformed or duplicate entries.')
        entries[path.replace('\\', '/')] = entry
    for rows in pools.values():
        for row in rows:
            path = Path(row['path'])
            relative = path.relative_to(parent).as_posix()
            if relative not in entries or path.stat().st_size != entries[relative]['size_bytes']:
                raise ValueError('Official image is missing from the verified manifest or its size changed: ' + relative)
    return entries, {
        'file_manifest': str(manifest_path), 'file_manifest_sha256': file_sha256(manifest_path),
        'source_and_counts': str(provenance_path), 'source_and_counts_sha256': file_sha256(provenance_path),
        'archive_md5_verified': True, 'counts_match_author_supplement': True,
    }


def ordered(rows, seed, pool):
    return sorted(rows, key=lambda row: (
        hashlib.sha256(f'{seed}:{pool}:{row["group_id"]}'.encode()).hexdigest(), row['group_id']))


def partition_samples(pools, args):
    """All official training samples participate; calibration never borrows them."""
    if any(len(pools.get(key, [])) != count for key, count in EXPECTED_INVENTORY.items()):
        raise ValueError('Full training requires the complete 2,311-image official inventory.')
    if not 0 < args.calibration_normal < len(pools['test/good']):
        raise ValueError('Normal calibration count must leave a nonempty independent normal test set.')
    if not 0 < args.calibration_defect < len(pools['test/fragmentation']):
        raise ValueError('Defect calibration count must leave a nonempty independent defect test set.')
    normals = ordered(pools['train/good'], args.seed, 'train-normal')
    defects = ordered(pools['test/fragmentation'], args.seed, 'test-defect')
    tests = ordered(pools['test/good'], args.seed, 'test-normal')
    requests = [
        ('train', normals),
        ('calibration', tests[:args.calibration_normal]),
        ('calibration', defects[:args.calibration_defect]),
        ('test', tests[args.calibration_normal:]),
        ('test', defects[args.calibration_defect:]),
    ]
    rows = [dict(row, split=split) for split, selected in requests for row in selected]
    expected = sum(EXPECTED_INVENTORY.values())
    if len(rows) != expected:
        raise ValueError('Full partition did not include all official images.')
    if len({r['group_id'] for r in rows}) != len(rows):
        raise ValueError('Physical composite group overlap between partitions.')
    return rows


def select_manifest(pools, args, prepared_entries):
    rows = partition_samples(pools, args)
    file_digests, pixel_digests = {}, {}
    for position, row in enumerate(rows, 1):
        path = Path(row['path'])
        with load_rgb(path) as image:
            # Full-resolution gear data uses horizontal, five-view composites.
            # Reject a different domain/layout instead of silently cropping it.
            if image.width % 5 or not 0.8 <= (image.width / 5) / image.height <= 1.2:
                raise ValueError(f'Unexpected five-view composite dimensions {image.size}: {path}')
            digest, pixels = file_sha256(path), pixel_sha256(image)
            relative = path.relative_to(Path(args.dataset).resolve().parent).as_posix()
            if digest != prepared_entries[relative]['sha256']:
                raise ValueError('Selected image differs from the verified archive manifest: ' + relative)
            for seen, value, field in ((file_digests, digest, 'duplicate_training_file_of'),
                                      (pixel_digests, pixels, 'duplicate_training_pixels_of')):
                if value in seen:
                    previous = seen[value]
                    if previous['split'] != 'train' or row['split'] != 'train':
                        raise ValueError(f'Duplicate content across splits or within evaluation would contaminate metrics: {path}')
                    # Keep every official training image, including repeated
                    # content, and report it rather than silently reducing 2068.
                    row[field] = previous['sample_id']
                else:
                    seen[value] = row
            row.update(file_sha256=digest, pixel_sha256=pixels, width=image.width, height=image.height,
                       view_count=5, grouping='entire_original_five_view_composite')
        if position % 100 == 0 or position == len(rows):
            update_status(args, 'validating_manifest', completed=position, total=len(rows), metrics_available=False)
    return rows


def fit_training_images(detector, rows, args, progress=None):
    """Yield and release one full composite at a time, including on fit failure."""
    from app.vision.offline import fit_full_memory
    if len(rows) != EXPECTED_INVENTORY['train/good'] or any(
            row['split'] != 'train' or row['official_split'] != 'train'
            or row['label'] != 'normal' or row['scenario'] != 'good' for row in rows):
        raise ValueError('Memory fitting requires all 2,068 official train/good normal images.')

    def images():
        for row in rows:
            if file_sha256(row['path']) != row['file_sha256']:
                raise ValueError('Training image changed after manifest verification: ' + row['path'])
            image = load_rgb(row['path'])
            try:
                yield image
            finally:
                image.close()

    with closing(images()) as source:
        fitted = fit_full_memory(detector, source, expected_count=len(rows),
                                 per_image_features=args.per_image_features, coreset_ratio=.1,
                                 progress=progress)
    if (fitted['metadata'].get('sample_count') != len(rows)
            or fitted['metadata'].get('all_images_processed') is not True):
        raise ValueError('Full-memory fitting did not confirm every official training image.')
    return fitted


def reload_memory_bank(path, expected_digest):
    import numpy as np
    if file_sha256(path) != expected_digest:
        raise ValueError('Saved memory bank digest differs from metadata.')
    with np.load(path, allow_pickle=False) as saved:
        bank = saved['memory_bank'].copy()
    if (bank.dtype != np.float32 or bank.ndim != 2 or bank.shape[1] != 384
            or not 1 <= bank.shape[0] <= 1024 or not np.isfinite(bank).all()):
        raise ValueError('Saved memory bank must contain finite float32[1..1024,384] features.')
    return bank


def verify_memory_probe(detector, bank, row):
    """Check the restored bank with reserved calibration data, never independent test."""
    import numpy as np
    if row['split'] != 'calibration' or row['label'] != 'normal':
        raise ValueError('Memory reload verification requires a reserved normal calibration image.')
    if file_sha256(row['path']) != row['file_sha256']:
        raise ValueError('Memory probe image changed after manifest verification.')
    with load_rgb(row['path']) as image:
        heatmap = detector.anomaly_map(image, bank)
        if (heatmap.shape != (row['height'], row['width'])
                or not np.isfinite(heatmap).all() or (heatmap < 0).any()):
            raise ValueError('Restored memory bank did not produce a valid full-resolution anomaly map.')
    return {'passed': True, 'sample_id': row['sample_id'], 'split': 'calibration',
            'image_file_sha256': row['file_sha256'], 'heatmap_shape': list(heatmap.shape),
            'note': 'Artifact reload/finite-map check only; no accuracy or pass/fail claim.'}


def score_images(detector, bank, samples, output, phase, args):
    import numpy as np
    rows = []
    for index, sample in enumerate(samples, 1):
        # Fail if an image changes after the manifest/selection was locked.
        if file_sha256(sample['path']) != sample['file_sha256']:
            raise ValueError('Source image changed after manifest creation: ' + sample['path'])
        started = time.perf_counter()
        with load_rgb(sample['path']) as image:
            heatmap = detector.anomaly_map(image, bank)
            if heatmap.shape != (sample['height'], sample['width']) or not np.isfinite(heatmap).all():
                raise ValueError('Invalid anomaly map for ' + sample['sample_id'])
            rows.append({**sample, 'score': float(heatmap.max()), 'seconds': time.perf_counter() - started})
        write_json(output / f'{phase}_scores.json', rows)
        update_status(args, phase, completed=index, total=len(samples), metrics_available=False)
        print(f'{phase.upper()} {index}/{len(samples)} {sample["sample_id"]} score={rows[-1]["score"]:.6f}', flush=True)
    return rows


def evaluations(rows, threshold):
    overall = metrics_from_scores(rows, threshold)
    if not overall['normal_n'] or not overall['defect_n']:
        raise ValueError('Overall FPR/FNR requires nonzero independent normal and defect denominators.')
    return {
        'overall': overall,
        'by_official_scenario': {
            scenario: metrics_from_scores([r for r in rows if r['scenario'] == scenario], threshold)
            for scenario in sorted({r['scenario'] for r in rows})
        },
        'missed_sample_ids': [r['sample_id'] for r in rows if r['label'] == 'defect' and r['score'] < threshold],
        'false_positive_sample_ids': [r['sample_id'] for r in rows if r['label'] == 'normal' and r['score'] >= threshold],
    }


def run(args):
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.calibration import threshold_strategies
    import numpy as np
    import torch
    import cv2

    pools = discover(Path(args.dataset))
    prepared_entries, preparation = verify_preparation(Path(args.dataset), pools)
    weights = Path(args.weights).resolve(strict=True)
    output = Path(args.output).resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError(f'Output is not empty: {output}. Use a new --output directory to preserve prior evidence.')
    update_status(args, 'validating_manifest', metrics_available=False)
    rows = select_manifest(pools, args, prepared_entries)
    torch.manual_seed(args.seed)
    torch.set_num_threads(args.torch_threads)
    torch.set_num_interop_threads(1)
    torch.use_deterministic_algorithms(True)
    cv2.setNumThreads(1)
    config = dict(input_size=args.input_size, resize_mode='letterbox', contrast='none', blur_sigma=2.0)
    source_files = [
        Path(__file__), ROOT / 'services/agent-service/app/vision/algorithms.py',
        ROOT / 'services/agent-service/app/vision/offline.py',
        ROOT / 'services/agent-service/app/vision/calibration.py',
        ROOT / 'services/agent-service/app/vision/evaluation.py',
        ROOT / 'services/agent-service/app/vision/preprocessing.py',
    ]
    started = time.perf_counter()
    output.mkdir(parents=True, exist_ok=True)
    plan = {
        'created_at': datetime.now(timezone.utc).isoformat(),
        'scope': 'public_MANTA_gear_full_training_custom_calibration_research_only',
        'official_benchmark_protocol': False,
        'all_official_training_images': True, 'official_training_count': 2068,
        'all_official_images_partitioned': True, 'total_partitioned_images': len(rows),
        'source_urls': SOURCE_URLS, 'expected_archive_md5': ARCHIVE_MD5,
        'license_note': 'Project page states CC BY-NC-SA 4.0 while Figshare metadata differs; research/noncommercial use only pending clarification.',
        'dataset_root': str(Path(args.dataset).resolve()),
        'verified_preparation': preparation,
        'full_available_inventory': {k: len(v) for k, v in pools.items()},
        'partition_counts': {split: dict(Counter(r['label'] for r in rows if r['split'] == split))
                          for split in ('train', 'calibration', 'test')},
        'training_duplicate_file_count': sum('duplicate_training_file_of' in r for r in rows),
        'training_duplicate_pixel_count': sum('duplicate_training_pixels_of' in r for r in rows),
        'selection_seed': args.seed, 'selection_rule': 'ascending SHA256(seed:pool:composite_group_id); no image-score-based selection',
        'grouping': 'All five views remain in their original composite PNG; the entire composite is indivisible across train/calibration/test.',
        'threshold_rule': 'calibration only; recall_priority=5*FNR+FPR, balanced=FNR+FPR, zero_fp=nextafter(max normal,+inf)',
        'selected_policy': args.policy, 'test_policy': 'All thresholds are saved before any independent test image is scored; no test tuning.',
        'preprocessing': config, 'coreset_ratio': .1, 'per_image_features': args.per_image_features,
        'weights': str(weights), 'weights_sha256': file_sha256(weights),
        'source_sha256': {str(p.relative_to(ROOT)): file_sha256(p) for p in source_files},
        'python': sys.version, 'packages': {p: importlib.metadata.version(p)
                                          for p in ('numpy', 'Pillow', 'torch', 'torchvision')},
        'threads': {'torch': args.torch_threads, 'interop': 1,
                    **{k: os.environ.get(k) for k in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS')}},
        'limitations': [
            'All 2,068 official normal training images contribute; each supplies bounded feature candidates before global coreset compression.',
            'Custom calibration partition uses 12 normal and 12 defective official test images by default; this is not the official benchmark protocol.',
            'One sample is one five-view composite. Per-view and pixel-localization accuracy are not evaluated.',
            'Physical identity follows official composite filenames; additional cross-session identity is not available.',
            'Letterboxing preserves proportions, but each view has limited resolution after resizing the full composite.',
            'Official defect scenario is fragmentation; this evaluation cannot establish scratch/low-contrast coverage.',
            'No production normal model registration, YOLO comparison, application setting change, or production readiness claim.',
        ],
    }
    write_json(output / 'plan.json', plan)
    write_json(output / 'manifest.json', rows)
    write_json(output / 'inventory.json', {k: [r['sample_id'] for r in v] for k, v in pools.items()})
    detector = PatchCoreDetector(str(weights), config=config)
    train_rows = [r for r in rows if r['split'] == 'train']
    update_status(args, 'building_memory_bank', training_images=len(train_rows), metrics_available=False)
    print(f'FIT ALL {len(train_rows)} official normal composite images; output={output}', flush=True)

    def fit_progress(event):
        update_status(args, 'building_memory_bank', phase=event['phase'], completed=event['completed'],
                      total=event['total'], training_images=len(train_rows), metrics_available=False)
        if event['completed'] % 50 == 0 or event['completed'] == event['total']:
            print(f'FIT {event["phase"]} {event["completed"]}/{event["total"]}', flush=True)

    fitted = fit_training_images(detector, train_rows, args, progress=fit_progress)
    bank = fitted['memory_bank']
    np.savez_compressed(output / 'memory.npz', memory_bank=bank)
    metadata = {**fitted['metadata'], 'name': 'MANTA gear PatchCore 全量 2068 张正常图（研究验证）',
                'scope': plan['scope'], 'production_registered': False,
                'all_official_training_images': True, 'official_training_count': 2068,
                'partition_counts': plan['partition_counts'],
                'training_duplicate_file_count': plan['training_duplicate_file_count'],
                'training_duplicate_pixel_count': plan['training_duplicate_pixel_count'],
                'weights_sha256': plan['weights_sha256'], 'memory_bank_sha256': file_sha256(output / 'memory.npz'),
                'training_original_file_sha256': [r['file_sha256'] for r in train_rows],
                'training_pixel_sha256': [r['pixel_sha256'] for r in train_rows],
                'training_group_ids': [r['group_id'] for r in train_rows]}
    write_json(output / 'model.json', metadata)
    update_status(args, 'verifying_memory_bank', training_images=len(train_rows), metrics_available=False)
    bank = reload_memory_bank(output / 'memory.npz', metadata['memory_bank_sha256'])
    detector = PatchCoreDetector(str(weights), config=metadata['preprocessing'])
    probe = next(r for r in rows if r['split'] == 'calibration' and r['label'] == 'normal')
    verification = verify_memory_probe(detector, bank, probe)
    metadata['artifact_reload_verification'] = verification
    write_json(output / 'memory-verification.json', verification)
    write_json(output / 'model.json', metadata)
    calibration = score_images(detector, bank, [r for r in rows if r['split'] == 'calibration'], output, 'calibration', args)
    strategies = threshold_strategies([r['score'] for r in calibration if r['label'] == 'normal'],
                                     [r['score'] for r in calibration if r['label'] == 'defect'])
    locked = {'locked_before_test_at': datetime.now(timezone.utc).isoformat(),
              'selected_policy': args.policy, 'strategies': strategies,
              'evaluation': {p: evaluations(calibration, s['threshold']) for p, s in strategies.items()}}
    write_json(output / 'calibration.json', locked)
    metadata.update(suggested_threshold=strategies[args.policy]['threshold'],
                    threshold_method='independent_labeled_MANTA_custom_calibration',
                    calibration_required=False, calibration=locked)
    write_json(output / 'model.json', metadata)
    test = score_images(detector, bank, [r for r in rows if r['split'] == 'test'], output, 'test', args)
    if file_sha256(weights) != plan['weights_sha256']:
        raise ValueError('Backbone weights changed during evaluation.')
    report = {**plan, 'finished_at': datetime.now(timezone.utc).isoformat(),
              'elapsed_seconds': time.perf_counter() - started,
              'memory_size': len(bank), 'calibration': locked,
              'test': {p: evaluations(test, s['threshold']) for p, s in strategies.items()},
              'manifest_sha256': file_sha256(output / 'manifest.json'),
              'memory_bank_sha256': metadata['memory_bank_sha256']}
    write_json(output / 'summary.json', report)
    chosen = report['test'][args.policy]['overall']
    update_status(args, 'completed', metrics_available=True, policy=args.policy,
                  independent_test=chosen, summary=str(output / 'summary.json'))
    print(json.dumps({'output': str(output), 'policy': args.policy, 'test': chosen}, ensure_ascii=False), flush=True)
    return report


def parser():
    result = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    result.add_argument('--dataset', default=str(ROOT / '.runtime/datasets/manta-gear/gear'))
    result.add_argument('--weights', default=str(ROOT / '.runtime/quality-models/backbones/resnet18-f37072fd.pth'))
    result.add_argument('--output', default=str(ROOT / '.runtime/quality-research/manta-gear-patchcore-full-v1'))
    result.add_argument('--seed', type=int, default=20261020)
    result.add_argument('--calibration-normal', type=int, default=12)
    result.add_argument('--calibration-defect', type=int, default=12)
    result.add_argument('--per-image-features', type=int, default=32,
                        help='Feature candidates per training image; all 2068 normal images always participate.')
    result.add_argument('--input-size', type=int, choices=(224, 448), default=448)
    result.add_argument('--torch-threads', type=int, default=2)
    result.add_argument('--policy', choices=('recall_priority', 'balanced', 'zero_fp'), default='recall_priority')
    result.add_argument('--wait-for-data', action='store_true', help='Wait for verified dataset preparation before inference.')
    result.add_argument('--preparation-status', default=str(ROOT / '.runtime/datasets/manta-gear/preparation-status.json'))
    result.add_argument('--status-file', default=str(ROOT / '.runtime/quality-research/manta-gear-patchcore-status.json'))
    result.add_argument('--wait-timeout', type=float, default=14400, help='Maximum dataset wait in seconds (default 4 hours).')
    result.add_argument('--poll-seconds', type=float, default=20)
    return result


if __name__ == '__main__':
    arguments = parser().parse_args()
    try:
        if not 1 <= arguments.per_image_features <= 36:
            raise ValueError('--per-image-features must be within 1..36 to bound the full-training candidate matrix.')
        if any(getattr(arguments, key) < 1 for key in
               ('calibration_normal', 'calibration_defect', 'torch_threads')):
            raise ValueError('Both calibration/test labels and torch thread count must be positive.')
        if not 0 < arguments.poll_seconds <= 60 or not 0 < arguments.wait_timeout <= 86400:
            raise ValueError('Poll interval must be within (0,60] and wait timeout within (0,86400].')
        if arguments.wait_for_data:
            wait_for_data(arguments)
        run(arguments)
    except Exception as failure:
        update_status(arguments, 'failed', error=str(failure), metrics_available=False)
        print(f'Evaluation not completed: {failure}', file=sys.stderr, flush=True)
        raise SystemExit(1)
    except KeyboardInterrupt:
        update_status(arguments, 'interrupted', metrics_available=False)
        raise SystemExit(130)
