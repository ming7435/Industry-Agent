"""Train one YOLO on real training-only dirt/hair crops plus replay examples."""
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import argparse
import json
import math
import os
from pathlib import Path
import random
import sys
from time import monotonic

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/gear-full-dataset/prepared'
OUT = ROOT / 'output/gear-yolo-fine-defects-v1'
BASE = ROOT / '.runtime/quality-models/yolo11-gear-recall-v1'
SEED = 20261023
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]


def digest(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')


def crop_truth(truth, window):
    """Retain every visible annotation; skip crops that would cut any defect."""
    l, t, r, b = window
    result = []
    for item in truth:
        x1, y1, x2, y2 = item['bbox']
        ix1, iy1, ix2, iy2 = max(l, x1), max(t, y1), min(r, x2), min(b, y2)
        if ix2 <= ix1 or iy2 <= iy1:
            continue
        if ix1 != x1 or iy1 != y1 or ix2 != x2 or iy2 != y2:
            return None
        result.append({'label': item['label'], 'bbox': [x1-l, y1-t, x2-l, y2-t]})
    return result


def prepare():
    from PIL import Image
    OUT.mkdir(parents=True, exist_ok=False)
    document = read(SOURCE / 'manifest.json')
    classes = document['classes']
    rows = [r for r in document['samples'] if r['split'] == 'train']
    calibration = [r for r in document['samples'] if r['split'] == 'calibration']
    rng = random.Random(SEED)
    target = [r for r in rows if any(g['label'] in ('dirt', 'hair') for g in r['ground_truth'])]
    # Retain all target images, balanced examples of other classes, and a random replay set.
    whole = {r['sample_id']: r for r in target}
    for label in classes:
        group = [r for r in rows if any(g['label'] == label for g in r['ground_truth'])]
        for r in rng.sample(group, min(12, len(group))):
            whole[r['sample_id']] = r
    for r in rng.sample(rows, 120):
        whole[r['sample_id']] = r
    data = OUT / 'dataset'
    for split in ('train', 'calibration'):
        for kind in ('images', 'labels'):
            (data / kind / split).mkdir(parents=True)
    samples, pixels_seen = [], set()

    def add(row, image, truth, identity, kind, window=None, split='train'):
        pixels = sha256(f'{image.size}:'.encode() + image.tobytes()).hexdigest()
        if pixels in pixels_seen:
            return
        pixels_seen.add(pixels)
        image_path = data / 'images' / split / (identity + '.png')
        image.save(image_path)
        w, h = image.size
        labels = []
        for item in truth:
            x1, y1, x2, y2 = item['bbox']
            assert 0 <= x1 < x2 <= w and 0 <= y1 < y2 <= h
            labels.append(f'{classes.index(item["label"])} {(x1+x2)/2/w:.10f} {(y1+y2)/2/h:.10f} {(x2-x1)/w:.10f} {(y2-y1)/h:.10f}')
        (data / 'labels' / split / (identity + '.txt')).write_text('\n'.join(labels), encoding='utf-8')
        samples.append({'sample_id': identity, 'source_id': row['sample_id'], 'source_split': row['split'],
                        'split': split, 'kind': kind, 'window': window, 'source_file_sha256': row['file_sha256'],
                        'file_sha256': digest(image_path), 'pixel_sha256': pixels, 'ground_truth': truth,
                        'path': image_path.relative_to(data).as_posix(), 'width': w, 'height': h})

    for row in sorted(whole.values(), key=lambda r: r['sample_id']):
        path = SOURCE / row['path']
        assert digest(path) == row['file_sha256']
        with Image.open(path) as source, source.convert('RGB') as image:
            add(row, image, row['ground_truth'], row['sample_id'], 'real_whole')
    for row in target:
        with Image.open(SOURCE / row['path']) as source, source.convert('RGB') as image:
            for index, item in enumerate(row['ground_truth']):
                if item['label'] not in ('dirt', 'hair'):
                    continue
                scales = (144, 192, 256, 384) if item['label'] == 'dirt' else (192, 320)
                for side in scales:
                    for attempt in range(30):
                        x1, y1, x2, y2 = item['bbox']
                        size = min(max(side, math.ceil(max(x2-x1, y2-y1)*1.5)), min(image.size))
                        cx, cy = (x1+x2)/2, (y1+y2)/2
                        left = int(max(0, min(image.width-size, cx-size/2+rng.uniform(-.18, .18)*size)))
                        top = int(max(0, min(image.height-size, cy-size/2+rng.uniform(-.18, .18)*size)))
                        window = [left, top, left+size, top+size]
                        truth = crop_truth(row['ground_truth'], window)
                        if truth is not None and any(t['label'] == item['label'] for t in truth):
                            with image.crop(window) as crop:
                                add(row, crop, truth, f'{row["sample_id"]}-{index}-{side}', 'real_target_crop', window)
                            break
    # Background crops contain no annotated defects; these are not independent normal parts.
    negatives = 0
    candidates = list(rows)
    rng.shuffle(candidates)
    for row in candidates:
        if negatives >= 64:
            break
        with Image.open(SOURCE / row['path']) as source, source.convert('RGB') as image:
            for attempt in range(12):
                side = rng.choice([192, 256, 320])
                left = rng.randrange(image.width-side+1)
                top = rng.randrange(image.height-side+1)
                window = [left, top, left+side, top+side]
                if crop_truth(row['ground_truth'], window) == []:
                    with image.crop(window) as crop:
                        add(row, crop, [], f'{row["sample_id"]}-background', 'unannotated_background_crop', window)
                    negatives += 1
                    break
    for row in calibration:
        path = SOURCE / row['path']
        assert digest(path) == row['file_sha256']
        with Image.open(path) as source, source.convert('RGB') as image:
            add(row, image, row['ground_truth'], row['sample_id'], 'real_whole', split='calibration')
    train = [r for r in samples if r['split'] == 'train']
    assert all(r['source_split'] == r['split'] for r in samples)
    assert len([r for r in samples if r['split'] == 'calibration']) == 188
    save(data / 'manifest.json', {'source_manifest_sha256': digest(SOURCE / 'manifest.json'),
         'seed': SEED, 'classes': classes, 'samples': samples, 'test_used': False,
         'crop_policy': 'All intersecting annotations must be fully inside the crop; no partial unlabeled defects.'})
    save(data / 'data.yaml', {'path': str(data), 'train': 'images/train', 'val': 'images/calibration', 'names': classes, 'nc': len(classes)})
    summary = {'training_images': len(train), 'train_kinds': dict(Counter(r['kind'] for r in train)),
               'train_boxes': dict(Counter(g['label'] for r in train for g in r['ground_truth'])),
               'distinct_training_source_photos': len({r['source_id'] for r in train}),
               'calibration_images': 188, 'new_independent_photos': 0, 'test_used': False}
    save(OUT / 'data-summary.json', summary)
    # Set acceptance rules before fitting, including a separate frozen-test deployment gate.
    save(OUT / 'protocol.json', {'created_at': datetime.now(timezone.utc).isoformat(),
         'baseline': 'yolo11-gear-recall-v1', 'weights_sha256': digest(BASE / 'best.pt'),
         'manifest_sha256': digest(SOURCE / 'manifest.json'),
         'primary': 'Improve correctly classified and located dirt and hair separately; IoU>=0.5.',
         'selection': 'calibration only; maximize dirt+hair TP within false-box bounds, then overall F1',
         'calibration_gates': {'dirt_tp_min': 1, 'hair_tp_min': 3, 'overall_tp_min': 211,
             'overall_class_fp_max': 139, 'overall_spatial_fp_max': 125,
             'target_each_fp_rule': 'fp <= max(2, tp)', 'overall_f1_min': .5382653061224489},
         'test_deployment_gate': 'Each dirt and hair TP improves over baseline and each target FP<=max(2,TP); total class FP<=122, spatial FP<=106, total TP>=151 and class F1>=0.5109983079526227. Failure is not deployed.',
         'test_previously_seen': True, 'normal_gear_fpr_available': False,
         'inference_views': 'full + four .6 crops; also allow fixed 3x3 .4 crops for tiny targets; no ground truth at inference',
         'detail_label_variants': [[], ['dirt', 'hair'], ['hair'], ['dirt']],
         'confidence_grid': [.03, .05, .075, .1, .15, .2, .25, .3, .35, .4, .5, .6, .7, .8, 1.0]})
    print(json.dumps(summary, ensure_ascii=False), flush=True)


def train(head_only=False):
    weights = BASE / 'best.pt'
    assert read(OUT / 'protocol.json')['weights_sha256'] == digest(weights)
    run_name = 'head-only-training' if head_only else 'training'
    prefix = 'head-only-' if head_only else ''
    assert not (OUT / run_name).exists(), 'Preserve previous training run'
    for key in ('OMP_NUM_THREADS', 'MKL_NUM_THREADS', 'OPENBLAS_NUM_THREADS'):
        os.environ[key] = '2'
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false', YOLO_OFFLINE='true',
                      WANDB_MODE='disabled', YOLO_CONFIG_DIR=str(OUT / 'ultralytics-config'))
    import torch
    from ultralytics import YOLO
    from ultralytics.utils import SAFE_LOAD, SETTINGS, callbacks, torch_utils
    assert SAFE_LOAD is True
    callbacks.add_integration_callbacks = lambda instance: None
    SETTINGS.update({key: False for key in ('sync', 'clearml', 'comet', 'dvc', 'mlflow', 'raytune', 'tensorboard', 'wandb')})
    torch_utils.NUM_THREADS = 2
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    model = YOLO(str(weights), task='detect')
    params = dict(data=str(OUT / 'dataset/data.yaml'), epochs=8, patience=8, batch=2,
                  imgsz=640, freeze=10, nbs=16, device='cpu', workers=0, cache=False,
                  optimizer='AdamW', lr0=.0004, lrf=.15, warmup_epochs=1, warmup_bias_lr=.0004,
                  mosaic=0.0, close_mosaic=0, mixup=0.0, degrees=3., translate=.03, scale=.1,
                  hsv_h=0.0, hsv_s=0.0, hsv_v=.15, flipud=.5, fliplr=.5, cls=.8, cls_pw=.25,
                  plots=False, deterministic=True, seed=SEED, amp=False, resume=False,
                  project=str(OUT), name=run_name, exist_ok=False, val=True, save=True, save_period=1)
    selected_names, target_indices = [], []
    if head_only:
        target_indices = [key for key, label in model.names.items() if label in ('dirt', 'hair')]
        selected_names = [name for name, p in model.model.named_parameters()
                          if name.startswith('model.23.cv3.') and name.endswith(('.2.weight', '.2.bias'))
                          and p.shape[0] == len(model.names)]
        assert len(selected_names) == 6 and len(target_indices) == 2
        params.update(epochs=6, patience=6, freeze=23, lr0=.002, warmup_bias_lr=.002,
                      weight_decay=0.0, cls_pw=0.0)
        def freeze_outputs(trainer):
            trainer.freeze_layer_names = ['model.']  # Keep every BatchNorm running statistic fixed.
            for name, parameter in trainer.model.named_parameters():
                parameter.requires_grad_(name in selected_names)
                if name in selected_names:
                    mask = torch.zeros_like(parameter)
                    mask[target_indices] = 1
                    parameter.register_hook(lambda gradient, mask=mask: gradient * mask)
        model.add_callback('on_pretrain_routine_end', freeze_outputs)
    save(OUT / (prefix+'training-provenance.json'), {'parameters': params, 'weights_sha256': digest(weights),
         'updated_parameters': selected_names if head_only else 'all unfrozen layers after first 10',
         'updated_class_indices': target_indices if head_only else 'all classes',
         'dataset_manifest_sha256': digest(OUT / 'dataset/manifest.json'), 'test_used': False})
    started = monotonic()
    last_report = [0.0]
    def progress(trainer):
        now = monotonic()
        if now-last_report[0] < 25:
            return
        last_report[0] = now
        save(OUT / (prefix+'training-progress.json'), {'epoch': trainer.epoch+1, 'epochs': trainer.epochs,
             'elapsed_seconds': round(now-started, 1), 'metrics': trainer.metrics,
             'status': 'training', 'updated_at': datetime.now(timezone.utc).isoformat()})
    def epoch_done(trainer):
        save(OUT / (prefix+'epoch-progress.json'), {'completed_epoch': trainer.epoch+1,
             'elapsed_seconds': round(monotonic()-started, 1), 'metrics': trainer.metrics})
    model.add_callback('on_train_batch_end', progress)
    model.add_callback('on_fit_epoch_end', epoch_done)
    model.train(**params)
    if head_only:
        # Export into a clean original architecture; restore all frozen parameters exactly.
        candidate = YOLO(str(model.trainer.best), task='detect')
        restored = YOLO(str(weights), task='detect')
        reference = {key: value.clone() for key, value in restored.model.state_dict().items()}
        source_state, target_state = candidate.model.state_dict(), restored.model.state_dict()
        with torch.no_grad():
            for name in selected_names:
                target_state[name][target_indices] = source_state[name][target_indices]
        restored.ckpt['train_args'] = params
        restored.ckpt['epoch'] = params['epochs']-1
        exported = OUT / 'head-only-best.pt'
        restored.save(str(exported))
        checked = YOLO(str(exported), task='detect').model.state_dict()
        changed = []
        for name, original in reference.items():
            if name in selected_names:
                other = [i for i in range(len(restored.names)) if i not in target_indices]
                assert torch.equal(checked[name][other], original[other]), name
                if not torch.equal(checked[name][target_indices], original[target_indices]):
                    changed.append(name)
            else:
                assert torch.equal(checked[name], original), name
        assert changed, 'No target classifier parameters changed'
        save(OUT / 'head-only-preservation.json', {'only_dirt_hair_output_rows_changed': True,
             'changed_tensors': changed, 'exported_sha256': digest(exported)})
    save(OUT / (prefix+'training-result.json'), {'best': str(model.trainer.best),
         'sha256': digest(model.trainer.best), 'elapsed_seconds': round(monotonic()-started, 1)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('prepare', 'train'))
    parser.add_argument('--head-only', action='store_true')
    args = parser.parse_args()
    prepare() if args.command == 'prepare' else train(head_only=args.head_only)
