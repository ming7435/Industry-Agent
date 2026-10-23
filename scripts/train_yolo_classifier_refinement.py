"""Refine one YOLO classifier with training-only hard crops and teacher preservation."""
import argparse
from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
import os
from pathlib import Path
import random
import sys
from time import monotonic

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
from scripts.train_yolo_fine_defects import BASE, OUT, SOURCE, SEED, crop_truth, digest, read, save

DATA = OUT / 'classifier-dataset'


def prepare():
    from hashlib import sha256
    import numpy as np
    from PIL import Image
    DATA.mkdir(exist_ok=False)
    previous = OUT / 'dataset'
    document = read(previous / 'manifest.json')
    classes, samples = document['classes'], deepcopy(document['samples'])
    for split in ('train', 'calibration'):
        for kind in ('images', 'labels'):
            (DATA / kind / split).mkdir(parents=True)
    for sample in samples:
        for path in (Path(sample['path']), Path('labels') / sample['split'] / (sample['sample_id'] + '.txt')):
            os.link(previous / path, DATA / path)
    rows = [r for r in read(SOURCE / 'manifest.json')['samples'] if r['split'] == 'train']
    rng = random.Random(SEED + 1)
    seen = {r['pixel_sha256'] for r in samples}

    def add(row, image, truth, window, kind):
        pixels = sha256(f'{image.size}:'.encode() + image.tobytes()).hexdigest()
        if pixels in seen:
            return False
        seen.add(pixels)
        identity = f'{row["sample_id"]}-contrast-{len(samples)}'
        path = DATA / 'images/train' / (identity + '.png')
        image.save(path)
        w, h = image.size
        labels = []
        for item in truth:
            x1, y1, x2, y2 = item['bbox']
            assert 0 <= x1 < x2 <= w and 0 <= y1 < y2 <= h
            labels.append(f'{classes.index(item["label"])} {(x1+x2)/2/w:.10f} {(y1+y2)/2/h:.10f} {(x2-x1)/w:.10f} {(y2-y1)/h:.10f}')
        (DATA / 'labels/train' / (identity + '.txt')).write_text('\n'.join(labels), encoding='utf-8')
        samples.append({'sample_id': identity, 'source_id': row['sample_id'], 'source_split': 'train',
                        'split': 'train', 'kind': kind, 'window': window, 'source_file_sha256': row['file_sha256'],
                        'file_sha256': digest(path), 'pixel_sha256': pixels, 'ground_truth': truth,
                        'path': path.relative_to(DATA).as_posix(), 'width': w, 'height': h})
        return True

    for label, count in [('darkspot', 128), ('perforation', 32), ('overflow', 32), ('void', 16)]:
        candidates = [(r, g) for r in rows for g in r['ground_truth'] if g['label'] == label]
        rng.shuffle(candidates)
        added = 0
        for row, item in candidates:
            if added >= count:
                break
            with Image.open(SOURCE / row['path']) as source, source.convert('RGB') as image:
                for attempt in range(20):
                    side = rng.choice([192, 256, 320])
                    x1, y1, x2, y2 = item['bbox']
                    l = int(max(0, min(image.width-side, (x1+x2-side)/2 + rng.uniform(-.15,.15)*side)))
                    t = int(max(0, min(image.height-side, (y1+y2-side)/2 + rng.uniform(-.15,.15)*side)))
                    window = [l,t,l+side,t+side]
                    truth = crop_truth(row['ground_truth'], window)
                    if truth and any(g['label'] == label for g in truth):
                        with image.crop(window) as crop:
                            added += add(row,crop,truth,window,'real_confusable_crop')
                        break
    shuffled = list(rows)
    rng.shuffle(shuffled)
    added = 0
    for row in shuffled:
        if added >= 64:
            break
        with Image.open(SOURCE / row['path']) as source, source.convert('RGB') as image:
            best = None
            for attempt in range(20):
                side = rng.choice([192,256])
                l, t = rng.randrange(image.width-side+1), rng.randrange(image.height-side+1)
                window = [l,t,l+side,t+side]
                if crop_truth(row['ground_truth'],window) != []:
                    continue
                with image.crop(window) as crop:
                    pixels = np.asarray(crop.convert('L'), dtype=np.float32)
                    gradient = float(np.abs(np.diff(pixels,axis=0)).mean() + np.abs(np.diff(pixels,axis=1)).mean())
                if best is None or gradient > best[0]:
                    best = (gradient,window)
            if best and best[0] >= 3:
                with image.crop(best[1]) as crop:
                    added += add(row,crop,[],best[1],'textured_unannotated_background_crop')
    document['samples'] = samples
    document['test_used'] = False
    save(DATA / 'manifest.json', document)
    save(DATA / 'data.yaml', {'path': str(DATA), 'train': 'images/train', 'val': 'images/calibration', 'names':classes,'nc':len(classes)})
    train = [r for r in samples if r['split'] == 'train']
    summary = {'training_inputs':len(train), 'kinds':dict(Counter(r['kind'] for r in train)),
               'boxes':dict(Counter(g['label'] for r in train for g in r['ground_truth'])),
               'source_photos':len({r['source_id'] for r in train}), 'new_independent_photos':0,'test_used':False}
    save(OUT / 'classifier-data-summary.json', summary)
    print(summary, flush=True)


def preservation_loss(pairs, keep):
    """Weighted logit preservation: suppress changes on existing foreground and background."""
    import torch
    numerator, denominator = 0, 0
    for student, teacher in pairs:
        s, t = student[:,keep], teacher[:,keep]
        weight = t.sigmoid() + .001
        numerator = numerator + (weight * (s-t).square()).sum()
        denominator = denominator + weight.sum()
    return numerator / torch.clamp(denominator, min=1)


def train():
    for key in ('OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS'):
        os.environ[key] = '2'
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1',YOLO_AUTOINSTALL='false',YOLO_OFFLINE='true',
                      WANDB_MODE='disabled',YOLO_CONFIG_DIR=str(OUT / 'ultralytics-config'))
    import torch
    from ultralytics import YOLO
    from ultralytics.utils import SAFE_LOAD, SETTINGS, callbacks, torch_utils
    assert SAFE_LOAD
    callbacks.add_integration_callbacks = lambda instance: None
    SETTINGS.update({k:False for k in ('sync','clearml','comet','dvc','mlflow','raytune','tensorboard','wandb')})
    torch_utils.NUM_THREADS = 2
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    assert not (OUT / 'classifier-training').exists()
    teacher = YOLO(str(BASE / 'best.pt'),task='detect')
    teacher_branches = deepcopy(teacher.model.model[-1].cv3).eval()
    for p in teacher_branches.parameters():
        p.requires_grad_(False)
    del teacher
    model = YOLO(str(OUT / 'head-only-best.pt'), task='detect')
    keep = [i for i,label in model.names.items() if label not in ('dirt','hair')]
    params = dict(data=str(DATA / 'data.yaml'),epochs=5,patience=5,batch=2,imgsz=640,freeze=23,nbs=16,
                  device='cpu',workers=0,cache=False,optimizer='AdamW',lr0=.0005,lrf=.2,
                  warmup_epochs=.5,warmup_bias_lr=.0005,weight_decay=0.0,
                  mosaic=0.,close_mosaic=0,mixup=0.,degrees=3.,translate=.03,scale=.1,
                  hsv_h=0.,hsv_s=0.,hsv_v=.15,flipud=.5,fliplr=.5,cls=.8,cls_pw=0.,
                  plots=False,deterministic=True,seed=SEED,amp=False,resume=False,
                  project=str(OUT),name='classifier-training',exist_ok=False,val=True,save=True,save_period=1)
    latest = {}
    def configure(trainer):
        # Backbone, neck, bbox regression, and their BN statistics stay fixed.
        trainer.freeze_layer_names = [f'model.{i}.' for i in range(23)] + ['model.23.cv2.']
        for name,p in trainer.model.named_parameters():
            p.requires_grad_(name.startswith('model.23.cv3.'))
        pairs = {}
        for index, branch in enumerate(trainer.model.model[-1].cv3):
            def capture(module, inputs, output, index=index):
                if module.training and torch.is_grad_enabled():
                    with torch.no_grad():
                        original = teacher_branches[index](inputs[0].detach())
                    pairs[index] = (output,original)
            branch.register_forward_hook(capture)
        original_criterion = trainer.model.init_criterion()
        class PreservedCriterion:
            def __call__(self,predictions,batch):
                losses,items = original_criterion(predictions,batch)
                assert len(pairs) == 3
                preserve = preservation_loss(list(pairs.values()),keep)
                pairs.clear()
                losses = losses.clone()
                losses[1] = losses[1] + 2.0 * preserve * batch['img'].shape[0]
                latest['preservation_loss'] = float(preserve.detach())
                return losses,items
        trainer.model.criterion = PreservedCriterion()
    model.add_callback('on_pretrain_routine_end', configure)
    started = monotonic()
    last = [0.]
    def progress(trainer):
        if monotonic()-last[0] < 25:
            return
        last[0] = monotonic()
        save(OUT / 'classifier-training-progress.json',{'epoch':trainer.epoch+1,'epochs':trainer.epochs,
             'elapsed_seconds':round(monotonic()-started,1),**latest,'updated_at':datetime.now(timezone.utc).isoformat()})
    def epoch_done(trainer):
        save(OUT / 'classifier-epoch-progress.json',{'epoch':trainer.epoch+1,'metrics':trainer.metrics,
             'elapsed_seconds':round(monotonic()-started,1),**latest})
    model.add_callback('on_train_batch_end',progress)
    model.add_callback('on_fit_epoch_end',epoch_done)
    save(OUT / 'classifier-provenance.json',{'parameters':params,'teacher_sha256':digest(BASE / 'best.pt'),
         'initial_sha256':digest(OUT / 'head-only-best.pt'),'dataset_sha256':digest(DATA / 'manifest.json'),
         'trainable':'model.23.cv3.*','preservation_weight':2.,'preserved_classes':keep,'test_used':False})
    model.train(**params)
    save(OUT / 'classifier-training-result.json',{'best':str(model.trainer.best),'sha256':digest(model.trainer.best),
         'elapsed_seconds':round(monotonic()-started,1)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('prepare','train'))
    args = parser.parse_args()
    prepare() if args.command == 'prepare' else train()
