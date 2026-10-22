"""Build an expanded real-gear YOLO dataset with a fresh group-held-out test.

All prior 240-image test groups are quarantined. Their images and any other
view sharing the same numeric group never enter this expanded experiment.
"""

from __future__ import annotations

from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import random
import re
import sys

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / 'output/gear-dataset'
FULL = ROOT / 'output/gear-full-dataset'
sys.path.insert(0, str(ROOT / 'services/agent-service'))

from app.vision.evaluation import pixel_sha256
from app.vision.yolo_evaluation import load_yolo_manifest


def read(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_new(path: Path, value) -> None:
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)


def group_id(sample_id: str) -> str:
    match = re.search(r'\d+$', sample_id)
    if match is None:
        raise ValueError(f'no numeric source group: {sample_id}')
    return 'source-numeric-id-' + match.group()


def main() -> None:
    inventory = read(FULL / 'inventory.json')
    source = read(FULL / 'annotation-index.json')
    if inventory['images'] != 1165 or len(source) != 1165:
        raise ValueError('full 1165-image source must be downloaded and verified')
    source_pixels = defaultdict(list)
    for row in source:
        source_pixels[row['image_sha256']].append(row['sample_id'])
    duplicated = sorted(name for names in source_pixels.values() if len(names) > 1 for name in names)
    # Upstream contains identical image bytes with different boxes/classes.
    # Keep none of those variants: choosing one would silently trust a disputed
    # annotation, and keeping both could leak pixels across grouped splits.
    source = [row for row in source if row['sample_id'] not in set(duplicated)]
    old = read(OLD / 'prepared/manifest.json')
    fixed = {}
    for row in old['samples']:
        group = row['group_id']
        if group in fixed and fixed[group] != row['split']:
            raise ValueError('prior group crossed splits')
        fixed[group] = row['split']
    groups = defaultdict(list)
    seen_names = set()
    for row in source:
        name = row['sample_id']
        if name in seen_names:
            raise ValueError('duplicate source sample ID')
        seen_names.add(name)
        groups[group_id(name)].append(row)
    fresh = sorted(set(groups) - set(fixed))
    random.Random(20261026).shuffle(fresh)
    split = dict(fixed)
    for index, group in enumerate(fresh):
        split[group] = ('train' if index < int(.7 * len(fresh)) else
                        'calibration' if index < int(.85 * len(fresh)) else 'test')
    labels = sorted({label for row in source for label in row['labels']})
    if any(not row['labels'] or set(row['shape_types']) != {'rectangle'} for row in source):
        raise ValueError('all source images must have supported rectangle defects')
    moved = []
    for label in labels:
        if any(split[group] == 'train' and any(label in row['labels'] for row in values)
               for group, values in groups.items()):
            continue
        candidates = [group for group in fresh if split[group] != 'train'
                      and any(label in row['labels'] for row in groups[group])]
        if not candidates:
            raise ValueError(f'no trainable source group for class {label}')
        split[candidates[0]] = 'train'
        moved.append({'label': label, 'group': candidates[0]})
    if not any(split[group] == 'test' for group in fresh):
        raise ValueError('no fresh held-out test groups remain')

    prepared = FULL / 'prepared'
    if prepared.exists():
        raise FileExistsError('prepared dataset already exists; preserve frozen data')
    prepared.mkdir()
    samples = []
    excluded = []
    for row in source:
        group = group_id(row['sample_id'])
        if group in fixed and fixed[group] == 'test':
            excluded.append(row['sample_id'])
            continue
        part = split[group]
        image_path = FULL / row['image_path']
        annotation = read(FULL / row['annotation_path'])
        if digest(image_path) != row['image_sha256']:
            raise ValueError(f'source image digest changed: {row["sample_id"]}')
        image_dir = prepared / 'images' / part
        label_dir = prepared / 'labels' / part
        image_dir.mkdir(parents=True, exist_ok=True)
        label_dir.mkdir(parents=True, exist_ok=True)
        with Image.open(image_path) as image:
            rgb = ImageOps.exif_transpose(image).convert('RGB')
            original = rgb.size
            rgb.thumbnail((640, 640), Image.Resampling.LANCZOS)
            width, height = rgb.size
            destination = image_dir / f'{row["sample_id"]}.png'
            rgb.save(destination)
            pixels = pixel_sha256(rgb)
            rgb.close()
        truth, lines = [], []
        for shape in annotation['shapes']:
            if shape.get('shape_type') != 'rectangle' or len(shape.get('points', [])) != 2:
                raise ValueError(f'unsupported annotation: {row["sample_id"]}')
            points = shape['points']
            x0, x1 = sorted(point[0] * width / original[0] for point in points)
            y0, y1 = sorted(point[1] * height / original[1] for point in points)
            box = [max(0, x0), max(0, y0), min(width, x1), min(height, y1)]
            if box[2] <= box[0] or box[3] <= box[1]:
                raise ValueError(f'invalid annotation box: {row["sample_id"]}')
            label = shape['label']
            truth.append({'label': label, 'bbox': box})
            lines.append(f'{labels.index(label)} {(box[0]+box[2])/(2*width):.10f} '
                         f'{(box[1]+box[3])/(2*height):.10f} '
                         f'{(box[2]-box[0])/width:.10f} {(box[3]-box[1])/height:.10f}')
        (label_dir / f'{row["sample_id"]}.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
        samples.append({'sample_id': row['sample_id'], 'split': part, 'group_id': group,
                        'scenario': 'gear_surface_defects',
                        'domain': 'endface' if row['sample_id'].startswith('endface') else 'toothface',
                        'label': 'defect', 'path': destination.relative_to(prepared).as_posix(),
                        'file_sha256': digest(destination), 'pixel_sha256': pixels,
                        'ground_truth': truth, 'original_image_sha256': row['image_sha256']})
    if len({row['pixel_sha256'] for row in samples}) != len(samples):
        raise ValueError('duplicate resized image pixels; investigate source duplicates')
    if not all(row['group_id'] in fresh for row in samples if row['split'] == 'test'):
        raise ValueError('held-out test includes a previously used group')
    class_counts = {part: dict(Counter(item['label'] for row in samples if row['split'] == part
                                       for item in row['ground_truth']))
                    for part in ('train', 'calibration', 'test')}
    manifest = {'schema': 'yolo-localization-v1', 'kind': 'real_gear_dataset',
                'name': '公开塑料齿轮完整标注集，旧测试组隔离', 'normal_samples_available': False,
                'source_total_images': 1165, 'classes': labels,
                'split_policy': 'Prior test groups quarantined; prior train/calibration groups keep roles; untouched numeric-ID groups seeded 20261026 into train/calibration/new test; physical-part IDs unavailable.',
                'excluded_prior_test_group_samples': excluded,
                'excluded_duplicate_source_samples': duplicated,
                'new_test_groups_only': True, 'class_coverage_group_moves': moved,
                'class_box_counts': class_counts, 'samples': samples}
    save_new(prepared / 'manifest.json', manifest)
    save_new(prepared / 'data.yaml', {'path': str(prepared), 'train': 'images/train',
                                     'val': 'images/calibration', 'names': labels, 'nc': len(labels)})
    checked = load_yolo_manifest(prepared / 'manifest.json')
    save_new(FULL / 'prepared-summary.json', {
        'source_images': inventory['images'], 'excluded_duplicate_source_samples': len(duplicated),
        'excluded_prior_test_group_samples': len(excluded),
        'used_images': len(checked), 'split_images': dict(Counter(row['split'] for row in checked)),
        'split_groups': {part: len({row['group_id'] for row in checked if row['split'] == part})
                         for part in ('train', 'calibration', 'test')},
        'class_box_counts': class_counts, 'manifest_sha256': digest(prepared / 'manifest.json'),
        'prior_test_quarantined': True, 'new_test_groups_only': True,
    })
    print(json.dumps(read(FULL / 'prepared-summary.json'), ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
