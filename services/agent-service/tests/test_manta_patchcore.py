"""Offline orchestration contract tests; fake features are not MANTA accuracy evidence."""
import hashlib
import importlib.util
from pathlib import Path
import sys
from types import SimpleNamespace

import numpy as np
import pytest


ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('manta_eval_under_test', ROOT / 'scripts/evaluate_manta_patchcore.py')
manta = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manta)


def pools():
    result = {}
    serial = 0
    for directory, count in manta.EXPECTED_INVENTORY.items():
        rows = []
        for _ in range(count):
            name = f'mechanics_gear_{serial:05d}'
            serial += 1
            path = ROOT / '.runtime/datasets/manta-gear/gear' / directory / (name + '.png')
            rows.append(dict(sample_id=name, group_id=name, path=str(path),
                official_split=directory.split('/')[0], scenario=directory.split('/')[1],
                label='normal' if directory.endswith('/good') else 'defect',
                file_sha256=hashlib.sha256(str(path).encode()).hexdigest()))
        result[directory] = rows
    return result


def test_full_partition_uses_every_official_training_image_and_all_remaining_test_objects():
    args = manta.parser().parse_args([])
    available = pools()
    rows = manta.partition_samples(available, args)
    assert {key: len(group) for key, group in available.items()} == {
        'train/good': 2068, 'test/good': 162, 'test/fragmentation': 23,
        'test/multi_anomalies': 24, 'test/scratch': 11, 'test/stain': 23,
    }
    assert {row['scenario'] for row in rows if row['label'] == 'defect'} == {
        'fragmentation', 'multi_anomalies', 'scratch', 'stain',
    }
    counts = {(split, label): sum(r['split'] == split and r['label'] == label for r in rows)
              for split in ('train', 'calibration', 'test') for label in ('normal', 'defect')}
    assert counts == {('train', 'normal'): 2068, ('train', 'defect'): 0,
                      ('calibration', 'normal'): 12, ('calibration', 'defect'): 12,
                      ('test', 'normal'): 150, ('test', 'defect'): 69}
    assert len(rows) == len({r['group_id'] for r in rows}) == 2311
    assert {r['group_id'] for r in rows if r['split'] == 'train'} == {r['group_id'] for r in available['train/good']}
    assert all(r['official_split'] == 'test' for r in rows if r['split'] != 'train')
    assert manta.partition_samples({k: list(reversed(v)) for k, v in available.items()}, args) == rows
    assert args.output.endswith('manta-gear-patchcore-full-v1')


def test_full_cli_rejects_old_24_image_limit_and_overlap_is_rejected():
    with pytest.raises(SystemExit):
        manta.parser().parse_args(['--train-normal', '24'])
    available = pools()
    available['test/good'][0]['group_id'] = available['train/good'][0]['group_id']
    with pytest.raises(ValueError, match='overlap'):
        manta.partition_samples(available, manta.parser().parse_args([]))


def test_full_partition_preserves_nonzero_calibration_and_independent_test_denominators():
    for count in (0, 162, 163):
        args = manta.parser().parse_args(['--calibration-normal', str(count)])
        with pytest.raises(ValueError):
            manta.partition_samples(pools(), args)


def test_full_fit_streams_2068_images_and_passes_explicit_sampling_contract(monkeypatch):
    args = manta.parser().parse_args([])
    rows = [r for r in manta.partition_samples(pools(), args) if r['split'] == 'train']
    active, processed, events = set(), [], []

    class Image:
        def __init__(self, name):
            assert not active, 'previous source image was retained'
            self.name = name
            active.add(name)

        def close(self):
            active.remove(self.name)

    monkeypatch.setattr(manta, 'load_rgb', lambda path: Image(str(path)))
    monkeypatch.setattr(manta, 'file_sha256', lambda path: hashlib.sha256(str(path).encode()).hexdigest())
    detector = object()

    def fake_fit(detector_arg, images, **kwargs):
        assert detector_arg is detector
        assert kwargs['expected_count'] == 2068
        assert kwargs['per_image_features'] == 32 and kwargs['coreset_ratio'] == .1
        for image in images:
            processed.append(image.name)
        kwargs['progress'](dict(phase='complete', completed=len(processed), total=2068))
        return dict(memory_bank=np.zeros((2, 384), dtype=np.float32),
                    metadata=dict(sample_count=len(processed), all_images_processed=True))

    monkeypatch.setitem(sys.modules, 'app.vision.offline', SimpleNamespace(fit_full_memory=fake_fit))
    fitted = manta.fit_training_images(detector, rows, args, progress=events.append)
    assert fitted['metadata']['sample_count'] == len(processed) == 2068
    assert not active and events[-1]['completed'] == 2068


def test_full_fit_closes_current_image_when_extractor_fails(monkeypatch):
    args = manta.parser().parse_args([])
    rows = [r for r in manta.partition_samples(pools(), args) if r['split'] == 'train']
    closed = []
    monkeypatch.setattr(manta, 'load_rgb', lambda path: SimpleNamespace(close=lambda: closed.append(path)))
    monkeypatch.setattr(manta, 'file_sha256', lambda path: hashlib.sha256(str(path).encode()).hexdigest())

    def fail(detector, images, **kwargs):
        next(images)
        raise RuntimeError('extractor failed')

    monkeypatch.setitem(sys.modules, 'app.vision.offline', SimpleNamespace(fit_full_memory=fail))
    with pytest.raises(RuntimeError, match='extractor failed'):
        manta.fit_training_images(object(), rows, args)
    assert closed == [rows[0]['path']]


def test_saved_bank_reload_checks_digest_shape_dtype_and_finiteness(tmp_path):
    path = tmp_path / 'memory.npz'
    valid = np.ones((4, 384), dtype=np.float32)
    np.savez_compressed(path, memory_bank=valid)
    restored = manta.reload_memory_bank(path, manta.file_sha256(path))
    assert restored.dtype == np.float32 and np.array_equal(restored, valid)
    with pytest.raises(ValueError, match='digest'):
        manta.reload_memory_bank(path, '0' * 64)
    for invalid in [np.ones((4, 12), np.float32), np.ones((1025, 384), np.float32),
                    np.ones((0, 384), np.float32), np.ones((4, 384), np.float64),
                    np.full((4, 384), np.nan, np.float32)]:
        np.savez_compressed(path, memory_bank=invalid)
        with pytest.raises(ValueError, match='memory'):
            manta.reload_memory_bank(path, manta.file_sha256(path))
    np.savez_compressed(path, memory_bank=np.array([dict(untrusted=True)], dtype=object))
    with pytest.raises(ValueError):
        manta.reload_memory_bank(path, manta.file_sha256(path))


def test_reload_probe_only_accepts_reserved_normal_calibration_image(monkeypatch):
    args = manta.parser().parse_args([])
    row = next(r for r in manta.partition_samples(pools(), args) if r['split'] == 'calibration' and r['label'] == 'normal')
    row.update(width=25, height=5)
    from PIL import Image
    monkeypatch.setattr(manta, 'load_rgb', lambda path: Image.new('RGB', (25, 5)))
    monkeypatch.setattr(manta, 'file_sha256', lambda path: row['file_sha256'])
    detector = SimpleNamespace(anomaly_map=lambda image, bank: np.ones((5, 25), np.float32))
    outcome = manta.verify_memory_probe(detector, np.zeros((2, 384), np.float32), row)
    assert outcome['passed'] is True and outcome['sample_id'] == row['sample_id']
    for changes in [dict(split='test'), dict(label='defect')]:
        with pytest.raises(ValueError):
            manta.verify_memory_probe(detector, np.zeros((2, 384), np.float32), {**row, **changes})
    detector.anomaly_map = lambda image, bank: np.full((5, 25), np.nan, np.float32)
    with pytest.raises(ValueError):
        manta.verify_memory_probe(detector, np.zeros((2, 384), np.float32), row)


@pytest.mark.parametrize('source_pool,target_pool,allowed', [
    ('train/good', 'train/good', True),
    ('train/good', 'test/good', False),
    ('test/good', 'test/good', False),
])
def test_content_duplicates_are_retained_only_inside_full_training(monkeypatch, source_pool, target_pool, allowed):
    args = manta.parser().parse_args([])
    available = pools()
    source = available[source_pool][0]['path']
    target = available[target_pool][1]['path']
    digest = lambda path: hashlib.sha256((source if str(path) == target else str(path)).encode()).hexdigest()

    class Image:
        width, height = 25, 5

        def __init__(self, path):
            self.path = path

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    monkeypatch.setattr(manta, 'load_rgb', Image)
    monkeypatch.setattr(manta, 'file_sha256', digest)
    monkeypatch.setattr(manta, 'pixel_sha256', lambda image: digest(image.path))
    monkeypatch.setattr(manta, 'update_status', lambda *args, **kwargs: None)
    entries = {Path(row['path']).relative_to(Path(args.dataset).parent).as_posix(): {'sha256': digest(row['path'])}
               for group in available.values() for row in group}
    if allowed:
        rows = manta.select_manifest(available, args, entries)
        assert len(rows) == 2311
        assert sum(r['split'] == 'train' for r in rows) == 2068
        assert sum('duplicate_training_file_of' in r for r in rows) == 1
        assert sum('duplicate_training_pixels_of' in r for r in rows) == 1
    else:
        with pytest.raises(ValueError, match='Duplicate content'):
            manta.select_manifest(available, args, entries)


def test_manifest_accepts_narrow_official_five_view_composite(monkeypatch):
    args = manta.parser().parse_args([])
    available = pools()
    target = available['test/fragmentation'][0]['path']

    class Image:
        def __init__(self, path):
            self.path = str(path)
            self.width, self.height = (1790, 530) if self.path == target else (25, 5)

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    monkeypatch.setattr(manta, 'load_rgb', Image)
    monkeypatch.setattr(manta, 'file_sha256', lambda path: hashlib.sha256(str(path).encode()).hexdigest())
    monkeypatch.setattr(manta, 'pixel_sha256', lambda image: hashlib.sha256(image.path.encode()).hexdigest())
    monkeypatch.setattr(manta, 'update_status', lambda *args, **kwargs: None)
    rows = manta.partition_samples(available, args)
    entries = {Path(row['path']).relative_to(Path(args.dataset).parent).as_posix():
               {'sha256': hashlib.sha256(str(row['path']).encode()).hexdigest()} for row in rows}
    selected = manta.select_manifest(available, args, entries)
    narrow = next(row for row in selected if row['path'] == target)
    assert (narrow['width'], narrow['height'], narrow['view_count']) == (1790, 530, 5)


def test_waiting_status_explicitly_exposes_full_training(tmp_path):
    import json
    args = manta.parser().parse_args(['--status-file', str(tmp_path / 'status.json')])
    manta.update_status(args, 'waiting_for_data', metrics_available=False)
    status = json.loads((tmp_path / 'status.json').read_text(encoding='utf-8'))
    assert status['training_mode'] == 'full' and status['training_images'] == 2068
    assert status['metrics_available'] is False


def test_resumed_scores_reuse_only_verified_prefix(monkeypatch, tmp_path):
    import json
    from PIL import Image

    samples = [dict(sample_id=name, path=name, file_sha256=name, width=25, height=5,
                    split='test', label='normal') for name in ('first', 'second')]
    path = tmp_path / 'test_scores.json'
    manta.write_json(path, [{**samples[0], 'score': .5, 'seconds': .1}])
    calls = []

    def anomaly_map(image, bank):
        calls.append(True)
        return np.full((5, 25), .8, np.float32)

    monkeypatch.setattr(manta, 'load_rgb', lambda path: Image.new('RGB', (25, 5)))
    monkeypatch.setattr(manta, 'file_sha256', lambda path: path)
    monkeypatch.setattr(manta, 'update_status', lambda *args, **kwargs: None)
    result = manta.score_images(SimpleNamespace(anomaly_map=anomaly_map), None, samples,
                                tmp_path, 'test', object(), resume=True)
    assert len(calls) == 1 and len(result) == 2
    assert result[0]['score'] == .5 and result[1]['score'] == pytest.approx(.8)
    saved = json.loads(path.read_text(encoding='utf-8'))
    saved[0]['file_sha256'] = 'changed'
    manta.write_json(path, saved)
    with pytest.raises(ValueError, match='Saved scores differ'):
        manta.score_images(SimpleNamespace(anomaly_map=anomaly_map), None, samples,
                           tmp_path, 'test', object(), resume=True)
    assert len(calls) == 1
