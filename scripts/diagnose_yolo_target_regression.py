"""Separate proposal, class, threshold and suppression failures on calibration only."""
from collections import Counter
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read, save, digest, SOURCE
from scripts.evaluate_yolo_fine_defects import merge_variant, score
from app.vision.yolo_multiview import overlap

OUT = ROOT/'output/gear-yolo-fine-defects-v4'
ACTIVE = ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2'


def analyse(name, raw_path, config):
    raw = read(raw_path)
    assert all(r['split'] == 'calibration' for r in raw['samples'])
    low = {**config, 'class_confidences': {k: .01 for k in config['class_confidences']},
           'hair_min_aspect_ratio': 1., 'hair_suppress_contained': False}
    low_rows = merge_variant(raw['samples'], low)
    final = merge_variant(raw['samples'], config)
    traces = []
    for row, deployed in zip(low_rows, final):
        for gt in row['ground_truth']:
            if gt['label'] not in ('dirt', 'hair'):
                continue
            same = [p for p in row['predictions'] if p['label'] == gt['label']]
            matched = [p for p in same if overlap(p['bbox'], gt['bbox']) >= .5]
            others = [p for p in row['predictions'] if p['label'] != gt['label'] and overlap(p['bbox'], gt['bbox']) >= .5]
            final_matches = [p for p in deployed['predictions'] if p['label'] == gt['label'] and overlap(p['bbox'], gt['bbox']) >= .5]
            floor = config['class_confidences'][gt['label']]
            cause = ('detected' if final_matches else 'threshold' if matched and max(p['confidence'] for p in matched) < floor
                     else 'suppression' if matched else 'other_class_only' if others else 'no_matching_box')
            traces.append({'sample_id': row['sample_id'], 'gt': gt, 'cause': cause,
                           'max_same_class_score_at_iou50': max((p['confidence'] for p in matched), default=0),
                           'best_same_class_iou': max((overlap(p['bbox'], gt['bbox']) for p in same), default=0),
                           'other_classes': sorted(others, key=lambda p: -p['confidence'])[:3]})
    curves = {}
    for threshold in [.01,.05,.1,.2,.3,.4,.5,.6,.7,.8,.9,.95]:
        c = {**config, 'class_confidences': {**config['class_confidences'], 'dirt': threshold, 'hair': threshold}}
        metrics = score(merge_variant(raw['samples'], c))['class_and_position']['by_class']
        curves[str(threshold)] = {k: metrics[k] for k in ('dirt', 'hair')}
    return {'name': name, 'raw_sha256': digest(raw_path), 'weights_sha256': raw['weights_sha256'],
            'config': config, 'final_metrics': score(final),
            'failure_counts': {label: dict(Counter(t['cause'] for t in traces if t['gt']['label'] == label)) for label in ('dirt','hair')},
            'traces': traces, 'threshold_curves': curves}


def main():
    OUT.mkdir(exist_ok=True)
    active = read(ACTIVE/'model.json')
    config = active.get('inference', active.get('yolo_inference'))
    assert config
    old = analyse('deployed', ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/calibration-raw.json', config)
    freeze = read(ROOT/'output/gear-yolo-fine-defects-v3/diagnostic-freeze.json')
    new = analyse('v3_rejected', ROOT/'output/gear-yolo-fine-defects-v3/evaluation/masked-epoch4/calibration-raw.json', freeze['inference'])
    result = {'calibration_only': True, 'images': 188, 'test_used': False, 'models': [old,new]}
    save(OUT/'regression-diagnosis.json', result)
    for model in result['models']:
        print(model['name'], model['failure_counts'], flush=True)
        print({k:{label:{s:v[s] for s in ('tp','fp')} for label,v in values.items()} for k,values in model['threshold_curves'].items()}, flush=True)


if __name__ == '__main__':
    main()
