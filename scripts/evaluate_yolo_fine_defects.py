"""Select class thresholds on real calibration data; gate frozen real tests."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from time import perf_counter

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
from scripts.train_yolo_fine_defects import OUT, SOURCE, digest, read, save


def raw_config(classes):
    return {'mode': 'fine_defects_v1', 'tile_fraction': .6, 'tile_confidence': .01, 'border_margin': 2,
            'small_tile_fraction': .4, 'detail_grid_size': 3, 'detail_labels': ['dirt', 'hair'],
            'class_confidences': {label: .01 for label in classes}}


def score(rows):
    from app.vision.yolo_evaluation import class_aware_localization, match_detections
    cls = class_aware_localization(rows, .01, .5)
    spatial = Counter()
    for row in rows:
        matching = match_detections(row['ground_truth'], row['predictions'], .01, .5)
        spatial.update({k: matching[k] for k in ('tp', 'fn', 'fp')})
    spatial['f1'] = 2*spatial['tp'] / (2*spatial['tp']+spatial['fn']+spatial['fp'])
    return {'class_and_position': cls, 'spatial': dict(spatial)}


def filter_rows(rows, thresholds):
    return [{**r, 'predictions': [p for p in r['predictions'] if p['confidence'] >= thresholds[p['label']]]} for r in rows]


def merge_variant(rows, config):
    from app.vision.yolo_multiview import merge_views
    results = []
    for row in rows:
        views = row['views'] if config['detail_grid_size'] else [v for v in row['views'] if v['kind'] != 'detail']
        width, height = views[0]['window'][2:]
        predictions = merge_views(views, (width, height), .01, .45, config)
        results.append({**row, 'predictions': predictions})
    return results


def select(rows, classes, protocol):
    from app.vision.yolo_evaluation import class_aware_localization
    gates = protocol['calibration_gates']
    options = {}
    for label in classes:
        subset = [{'ground_truth': [g for g in r['ground_truth'] if g['label'] == label],
                   'predictions': [p for p in r['predictions'] if p['label'] == label]} for r in rows]
        choices = []
        for threshold in protocol['confidence_grid']:
            counts = class_aware_localization(subset, threshold, .5)
            target_fp_max = gates.get('target_fp_max', {}).get(label, max(2, counts['tp']))
            if label in ('dirt', 'hair') and (counts['tp'] < gates[label+'_tp_min'] or counts['fp'] > target_fp_max):
                continue
            choices.append({'threshold': threshold, **{k: counts[k] for k in ('tp', 'fp', 'fn')}})
        # Preserve the most conservative threshold when it emits identical counts.
        unique = {(c['tp'], c['fp']): c for c in choices}
        options[label] = list(unique.values())
    if any(not options[label] for label in classes):
        return {'eligible': False, 'reason': 'No dirt/hair threshold satisfies the predeclared precision/recall bound', 'options': options}
    # Dynamic programming keeps the maximum overall TP for every (FP, target-TP) state.
    states = {(0, 0): (0, {})}
    for label in classes:
        next_states = {}
        for (fp, target_tp), (tp, thresholds) in states.items():
            for option in options[label]:
                next_fp = fp+option['fp']
                if next_fp > gates['overall_class_fp_max']:
                    continue
                key = (next_fp, target_tp+(option['tp'] if label in ('dirt', 'hair') else 0))
                value = (tp+option['tp'], {**thresholds, label: option['threshold']})
                if key not in next_states or value[0] > next_states[key][0]:
                    next_states[key] = value
        states = next_states
    gt = sum(len(r['ground_truth']) for r in rows)
    ranked = []
    for (fp, target_tp), (tp, thresholds) in states.items():
        f1 = 2*tp/(gt+tp+fp)
        if tp >= gates['overall_tp_min'] and f1 >= gates['overall_f1_min']:
            ranked.append((target_tp, f1, -fp, thresholds))
    ranked.sort(key=lambda item: item[:3], reverse=True)
    for target_tp, _, _, thresholds in ranked:
        metrics = score(filter_rows(rows, thresholds))
        if metrics['spatial']['fp'] <= gates['overall_spatial_fp_max']:
            return {'eligible': True, 'target_tp': target_tp, 'thresholds': thresholds,
                    'metrics': metrics, 'options': options}
    return {'eligible': False, 'reason': 'No threshold combination satisfies overall recall and false-box bounds', 'options': options}


def main():
    global OUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--experiment-root', type=Path, default=OUT)
    parser.add_argument('--weights', type=Path, required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--split', choices=('calibration', 'test'), default='calibration')
    parser.add_argument('--triage', action='store_true', help='Only the fixed calibration target/control subset; cannot select/deploy')
    args = parser.parse_args()
    OUT = args.experiment_root.resolve(strict=True)
    assert args.name.replace('-', '').replace('_', '').isalnum()
    weights = args.weights.resolve(strict=True)
    weight_hash = digest(weights)
    folder = OUT / 'evaluation' / args.name
    folder.mkdir(parents=True, exist_ok=True)
    protocol = read(OUT / 'protocol.json')
    document = read(SOURCE / 'manifest.json')
    assert digest(SOURCE / 'manifest.json') == protocol['manifest_sha256']
    config = raw_config(document['classes'])
    selection = read(folder / 'selection.json') if args.split == 'test' else None
    if selection:
        assert not args.triage and selection['eligible'] and selection['weights_sha256'] == weight_hash
        assert selection['manifest_sha256'] == digest(SOURCE / 'manifest.json')
        assert selection['protocol_sha256'] == digest(OUT / 'protocol.json'), 'Selection protocol changed after freezing'
        config = {**selection['inference'], 'class_confidences': {label: .01 for label in document['classes']}}
    samples = [r for r in document['samples'] if r['split'] == args.split]
    if args.triage:
        assert args.split == 'calibration'
        targets = [r for r in samples if any(g['label'] in ('dirt', 'hair') for g in r['ground_truth'])]
        controls = [r for r in samples if r not in targets]
        samples = targets + controls[::6]
    suffix = '-triage' if args.triage else ''
    raw_path = folder / (args.split+suffix+'-raw.json')
    if raw_path.exists():
        cached = read(raw_path)
        assert cached['weights_sha256'] == weight_hash and cached['manifest_sha256'] == digest(SOURCE / 'manifest.json')
        rows = cached['samples']
    else:
        from scripts.evaluate_yolo import configure_inference_runtime
        configure_inference_runtime(weights)
        from app.vision.algorithms import YoloDetector
        from app.vision.evaluation import load_rgb, pixel_sha256
        from app.vision.yolo_multiview import extract_views, merge_views
        detector = YoloDetector(str(weights), input_size=640)
        rows = []
        for index, sample in enumerate(samples):
            path = SOURCE / sample['path']
            assert digest(path) == sample['file_sha256']
            with load_rgb(path) as image:
                assert pixel_sha256(image) == sample['pixel_sha256']
                start = perf_counter()
                views = extract_views(detector, image, .01, .45, config)
                predictions = merge_views(views, image.size, .01, .45, config)
                seconds = perf_counter()-start
            rows.append({**sample, 'views': views, 'predictions': predictions, 'seconds': seconds})
            if (index+1) % 5 == 0 or index+1 == len(samples):
                print(json.dumps({'name': args.name, 'split': args.split, 'done': index+1, 'total': len(samples), 'seconds': round(seconds, 2)}), flush=True)
        assert digest(weights) == weight_hash
        save(raw_path, {'weights_sha256': weight_hash, 'manifest_sha256': digest(SOURCE / 'manifest.json'),
                        'extraction_config': config, 'samples': rows})
    if args.triage:
        scores = {str(threshold): score(filter_rows(rows, {label: threshold for label in document['classes']}))['class_and_position']['by_class']
                  for threshold in protocol['confidence_grid']}
        save(folder / 'triage.json', scores)
        print(json.dumps({t: {label: s.get(label) for label in ('dirt', 'hair')} for t, s in scores.items()}), flush=True)
        return
    if args.split == 'calibration':
        variants = []
        for labels in ([], ['dirt', 'hair'], ['hair'], ['dirt']):
            for aspect in protocol.get('hair_min_aspect_variants', [1]):
                variant = {**config, 'detail_grid_size': 3 if labels else 0, 'detail_labels': labels,
                           'hair_min_aspect_ratio': aspect}
                if protocol.get('hair_suppress_contained', False):
                    variant['hair_suppress_contained'] = True
                candidate = select(merge_variant(rows, variant), document['classes'], protocol)
                candidate['inference'] = variant
                variants.append(candidate)
        valid = [c for c in variants if c['eligible']]
        result = max(valid, key=lambda c: (c['target_tp'], c['metrics']['class_and_position']['f1'])) if valid else {
            'eligible': False, 'reason': 'Neither five-view nor fourteen-view configuration passed calibration', 'variants': variants}
        if result['eligible']:
            result['inference']['class_confidences'] = result['thresholds']
            result.update(recommended_confidence=min(result['thresholds'].values()), recommended_iou=.45)
        result.update(created_at=datetime.now(timezone.utc).isoformat(), weights_sha256=weight_hash,
                      weights=str(weights), manifest_sha256=digest(SOURCE / 'manifest.json'),
                      protocol_sha256=digest(OUT / 'protocol.json'), selection_split='calibration',
                      test_used_for_selection=protocol.get('test_feedback_informed_implementation', False),
                      test_labels_used_for_threshold_selection=False)
        assert not (folder / 'selection.json').exists(), 'Preserve frozen selection'
        save(folder / 'selection.json', result)
        print(json.dumps({k: v for k, v in result.items() if k not in ('options', 'variants')}, ensure_ascii=False), flush=True)
    else:
        chosen = merge_variant(rows, selection['inference'])
        metrics = score(chosen)
        cls, spatial = metrics['class_and_position'], metrics['spatial']
        # The prior deployed model's test metrics were known before this experiment.
        gates = protocol.get('test_gates', {'dirt_tp_min': 1, 'hair_tp_min': 2,
            'overall_tp_min': 151, 'overall_class_fp_max': 122, 'overall_spatial_fp_max': 106,
            'overall_f1_min': .5109983079526227})
        eligible = (cls['by_class']['dirt']['tp'] >= gates['dirt_tp_min']
                    and cls['by_class']['hair']['tp'] >= gates['hair_tp_min']
                    and cls['tp'] >= gates['overall_tp_min'] and cls['fp'] <= gates['overall_class_fp_max']
                    and spatial['fp'] <= gates['overall_spatial_fp_max'] and cls['f1'] >= gates['overall_f1_min']
                    and all(cls['by_class'][label]['fp'] <= gates.get('target_fp_max', {}).get(label, max(2, cls['by_class'][label]['tp'])) for label in ('dirt', 'hair')))
        result = {'metrics': metrics, 'deployment_gate_passed': eligible, 'images': len(rows),
                  'selection_sha256': digest(folder / 'selection.json'), 'weights_sha256': weight_hash,
                  'samples': chosen, 'test_previously_seen': True}
        assert not (folder / 'test-comparison.json').exists(), 'Preserve test result'
        save(folder / 'test-comparison.json', result)
        print(json.dumps({k: v for k, v in result.items() if k != 'samples'}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
