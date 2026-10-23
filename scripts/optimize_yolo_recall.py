"""Calibrate crop-assisted YOLO on calibration only, freeze, then evaluate test."""
import argparse
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import sys
from time import perf_counter

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
OUT = ROOT / 'output/gear-yolo-recall-v1'
MANIFEST = ROOT / 'output/gear-full-dataset/prepared/manifest.json'
WEIGHTS = ROOT / '.runtime/quality-models/yolo11-gear-v3/best.pt'


def digest(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save(path, value):
    with Path(path).open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)


def evaluate(rows, confidence, tile_confidence, *, fraction=.6):
    from app.vision.yolo_multiview import merge_views
    from app.vision.yolo_evaluation import class_aware_localization, match_detections
    config = {'mode': 'full_and_tiles_v1', 'tile_fraction': fraction, 'tile_confidence': tile_confidence, 'border_margin': 2}
    selected = [{**row, 'predictions': merge_views(row['views'], (row['width'], row['height']), confidence, .45, config)} for row in rows]
    category = class_aware_localization(selected, confidence, .5)
    spatial = Counter()
    for row in selected:
        matches = match_detections(row['ground_truth'], row['predictions'], confidence, .5)
        spatial.update({k: matches[k] for k in ('tp', 'fp', 'fn')})
    spatial['f1'] = 2*spatial['tp'] / (2*spatial['tp']+spatial['fn']+spatial['fp'])
    return {'confidence': confidence, 'inference': config, 'class_and_position': category, 'spatial': dict(spatial)}, selected


def baseline_score(rows):
    from app.vision.yolo_evaluation import class_aware_localization, match_detections
    category = class_aware_localization(rows, .25, .5)
    spatial = Counter()
    for row in rows:
        matching = match_detections(row['ground_truth'], row['predictions'], .25, .5)
        spatial.update({k: matching[k] for k in ('tp', 'fp', 'fn')})
    spatial['f1'] = 2*spatial['tp'] / (2*spatial['tp']+spatial['fn']+spatial['fp'])
    return {'class_and_position': category, 'spatial': dict(spatial)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('split', choices=('calibration', 'test'))
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    baseline = read(ROOT / f'output/gear-yolo-full-v1/candidate-{args.split}.json')
    assert baseline['weights_sha256'] == digest(WEIGHTS)
    assert baseline['manifest_sha256'] == digest(MANIFEST)
    frozen = read(OUT / 'selection.json') if args.split == 'test' else None
    if frozen:
        assert frozen['eligible'] and frozen['weights_sha256'] == digest(WEIGHTS) and frozen['manifest_sha256'] == digest(MANIFEST)
    if args.split == 'calibration' and not (OUT / 'protocol.json').exists():
        save(OUT / 'protocol.json', {'created_at': datetime.now(timezone.utc).isoformat(),
            'rule': 'reduce class and spatial FN; improve both F1; class FP <= 1.2x baseline and spatial FP <= 1.2x baseline',
            'selection': 'maximize correctly located/classified defects within bounds; tie-break by F1',
            'confidence_grid': [.175, .2, .225, .25, .275, .3, .35, .4],
            'tile_confidence_grid': [.15, .2, .25, .3, .4, .5, .6, .7, .8],
            'tile_fraction': .6, 'border_margin': 2, 'nms_iou': .45, 'match_iou': .5,
            'weights_sha256': digest(WEIGHTS), 'manifest_sha256': digest(MANIFEST),
            'test_used_for_selection': False, 'test_previously_seen': True})
    rows = []
    cache = OUT / (args.split + '-raw.json')
    if cache.exists():
        stored = read(cache)
        assert stored['weights_sha256'] == digest(WEIGHTS) and stored['manifest_sha256'] == digest(MANIFEST)
        rows = stored['samples']
    else:
        from scripts.evaluate_yolo import configure_inference_runtime
        configure_inference_runtime(WEIGHTS)
        from app.vision.algorithms import YoloDetector
        from app.vision.evaluation import load_rgb, pixel_sha256
        from app.vision.yolo_multiview import extract_views
        detector = YoloDetector(str(WEIGHTS), input_size=640)
        config = {'mode': 'full_and_tiles_v1', 'tile_fraction': .6, 'tile_confidence': .01, 'border_margin': 2}
        for i, row in enumerate(baseline['samples']):
            assert row['split'] == args.split
            path = Path(row['path'])
            assert digest(path) == row['file_sha256']
            with load_rgb(path) as image:
                assert pixel_sha256(image) == row['pixel_sha256']
                start = perf_counter()
                views = extract_views(detector, image, .01, .45, config)
                seconds = perf_counter() - start
            rows.append({k: row[k] for k in ('sample_id', 'group_id', 'pixel_sha256', 'ground_truth', 'width', 'height')} | {'views': views, 'seconds': seconds})
            if (i+1) % 10 == 0 or i+1 == len(baseline['samples']):
                print(json.dumps({'split': args.split, 'done': i+1, 'total': len(baseline['samples']), 'seconds': round(seconds, 2)}), flush=True)
        save(cache, {'weights_sha256': digest(WEIGHTS), 'manifest_sha256': digest(MANIFEST), 'samples': rows})
    old = baseline_score(baseline['samples'])
    if args.split == 'calibration':
        protocol = read(OUT / 'protocol.json')
        candidates = [evaluate(rows, conf, tile)[0] for conf in protocol['confidence_grid'] for tile in protocol['tile_confidence_grid']]
        def eligible(candidate):
            cls, spatial = candidate['class_and_position'], candidate['spatial']
            return (cls['fn'] < old['class_and_position']['fn'] and spatial['fn'] < old['spatial']['fn']
                    and cls['f1'] > old['class_and_position']['f1'] and spatial['f1'] >= old['spatial']['f1']
                    and cls['fp'] <= old['class_and_position']['fp']*1.2 and spatial['fp'] <= old['spatial']['fp']*1.2)
        valid = [candidate for candidate in candidates if eligible(candidate)]
        selected = max(valid or candidates, key=lambda c: (c['class_and_position']['tp'] if valid else c['class_and_position']['f1'], c['class_and_position']['f1'], c['spatial']['f1']))
        selection = {'created_at': datetime.now(timezone.utc).isoformat(), 'eligible': bool(valid), 'baseline': old, 'selected': selected,
                     'weights_sha256': digest(WEIGHTS), 'manifest_sha256': digest(MANIFEST), 'candidates': candidates,
                     'selection_split': 'calibration', 'test_used_for_selection': False}
        save(OUT / 'selection.json', selection)
        print(json.dumps({k: selection[k] for k in ('eligible', 'baseline', 'selected')}, ensure_ascii=False), flush=True)
    else:
        selected = frozen['selected']
        new, predictions = evaluate(rows, selected['confidence'], selected['inference']['tile_confidence'])
        comparison = {'baseline': old, 'candidate': new, 'images': len(rows),
                      'weights_sha256': digest(WEIGHTS), 'manifest_sha256': digest(MANIFEST),
                      'selection_sha256': digest(OUT / 'selection.json'), 'samples': predictions}
        save(OUT / 'test-comparison.json', comparison)
        print(json.dumps({k: comparison[k] for k in ('images', 'baseline', 'candidate')}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
