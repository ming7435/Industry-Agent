"""Train dirt/hair classifier channels against frozen geometric YOLO proposals.

Only existing train photos/crops enter the feature cache. The shared backbone
and box head remain fixed; export uses ordinary YOLO modules and one checkpoint.
"""
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import os
from pathlib import Path
import random
import sys
from time import monotonic

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
from scripts.train_yolo_fine_defects import digest, read, save

OUT = ROOT / 'output/gear-yolo-fine-defects-v2'
DATA = ROOT / 'output/gear-yolo-fine-defects-v1/classifier-dataset'
INITIAL = ROOT / 'output/gear-yolo-fine-defects-v1/classifier-training/weights/epoch4.pt'
TARGETS = ('dirt', 'hair')
SEED = 20261024


def runtime():
    for key in ('OMP_NUM_THREADS', 'MKL_NUM_THREADS', 'OPENBLAS_NUM_THREADS'):
        os.environ[key] = '2'
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false', YOLO_OFFLINE='true')
    import torch
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    return torch


def geometric_targets(boxes, truth, target_indices, positive_iou=.5, ignore_iou=.2, topk=10):
    """Assign good geometric proposals independent of the current class score.

    Weakly overlapping target proposals are ignored, not taught as background.
    Fully separated proposals (including other annotated defect classes) are
    negatives. Every annotation is supplied; no validation labels are involved.
    """
    import torch
    targets = torch.zeros((len(boxes), len(target_indices)), dtype=torch.float32)
    valid = torch.ones_like(targets, dtype=torch.bool)
    areas = (boxes[:, 2:] - boxes[:, :2]).clamp(min=0).prod(1)
    for label, coords in truth:
        if label not in target_indices:
            continue
        index = target_indices.index(label)
        gt = torch.as_tensor(coords, dtype=boxes.dtype)
        intersection = (torch.minimum(boxes[:, 2:], gt[2:]) - torch.maximum(boxes[:, :2], gt[:2])).clamp(min=0).prod(1)
        overlap = intersection / (areas + (gt[2:]-gt[:2]).prod() - intersection).clamp(min=1e-9)
        valid[overlap >= ignore_iou, index] = False
        candidates = torch.where(overlap >= positive_iou)[0]
        if len(candidates):
            chosen = candidates[overlap[candidates].topk(min(topk, len(candidates))).indices]
            targets[chosen, index] = 1.
    valid |= targets.bool()
    return targets, valid


def balanced_focal_loss(logits, targets, valid, negative_weight=1., normalizers=None):
    import torch
    import torch.nn.functional as F
    positive = targets.bool() & valid
    negative = ~targets.bool() & valid
    probability = logits.sigmoid()
    raw = F.binary_cross_entropy_with_logits(logits, targets, reduction='none')
    # Equal class budgets; retain all negatives with focal weighting so easy
    # background does not swamp the few small positive regions.
    positives = (raw * (1-probability).square() * positive).sum((0,1))
    negatives = (raw * probability.square() * negative).sum((0,1))
    count = (positive.sum((0,1)).clamp(min=1) if normalizers is None else
             torch.as_tensor(normalizers,device=logits.device,dtype=logits.dtype)*logits.shape[0])
    return ((positives + negative_weight*negatives) / count).mean()


def cache():
    torch = runtime()
    import cv2
    import numpy as np
    from PIL import Image
    from ultralytics import YOLO
    from ultralytics.data.augment import LetterBox
    folder = OUT / 'features'
    folder.mkdir(exist_ok=False)
    document = read(DATA/'manifest.json')
    rows = [r for r in document['samples'] if r['split'] == 'train']
    assert all(r['source_split'] == 'train' for r in rows)
    classes = document['classes']
    indices = [classes.index(label) for label in TARGETS]
    model = YOLO(str(INITIAL), task='detect').model.float().eval()
    captured = []
    handle = model.model[-1].register_forward_pre_hook(lambda module, args: captured.extend([x.detach().clone() for x in args[0]]))
    transform = LetterBox(new_shape=(640,640), auto=False, scaleup=True)
    manifest, totals = [], [0,0]
    started = monotonic()
    for i,row in enumerate(rows):
        path = DATA/row['path']
        assert digest(path) == row['file_sha256']
        with Image.open(path) as source:
            rgb = np.asarray(source.convert('RGB'))
        height,width = rgb.shape[:2]
        ratio = min(640/height, 640/width)
        dx,dy = round((640-round(width*ratio))/2-.1),round((640-round(height*ratio))/2-.1)
        array = transform(image=rgb)
        tensor = torch.from_numpy(np.ascontiguousarray(array.transpose(2,0,1))).float().unsqueeze(0)/255
        with torch.no_grad():
            output = model(tensor)[0][0,:4].T
        boxes = torch.cat((output[:,:2]-output[:,2:]/2,output[:,:2]+output[:,2:]/2),1)
        truth = [(classes.index(g['label']), [v*ratio+(dx if j%2==0 else dy) for j,v in enumerate(g['bbox'])]) for g in row['ground_truth']]
        targets,valid = geometric_targets(boxes,truth,indices)
        assert len(captured)==3 and sum(x.shape[-1]*x.shape[-2] for x in captured)==len(targets)
        feature_path = folder/f'{i:04}.pt'
        torch.save({'features':[x[0].half() for x in captured], 'targets':targets.to(torch.uint8), 'valid':valid},feature_path)
        captured.clear()
        counts=targets.sum(0).tolist();totals=[a+b for a,b in zip(totals,counts)]
        manifest.append({'path':feature_path.name,'source_id':row['source_id'],'sample_id':row['sample_id'],
                         'source_split':'train','image_sha256':row['file_sha256'],'cache_sha256':digest(feature_path),
                         'positive_anchors':counts})
        if (i+1)%50==0 or i+1==len(rows):
            print({'cached':i+1,'total':len(rows),'seconds':round(monotonic()-started,1)},flush=True)
    handle.remove()
    save(OUT/'feature-manifest.json', {'initial_sha256':digest(INITIAL),'dataset_sha256':digest(DATA/'manifest.json'),
         'target_indices':indices,'samples':manifest,'positive_anchors':totals,'test_used':False,
         'geometry':{'positive_iou':.5,'ignore_iou':.2,'topk':10},'input_size':640})


def train(epochs=12, global_balance=False):
    torch = runtime()
    from ultralytics import YOLO
    torch.manual_seed(SEED)
    document = read(OUT/'feature-manifest.json')
    assert document['initial_sha256']==digest(INITIAL)
    assert document['dataset_sha256']==digest(DATA/'manifest.json')
    assert all(s['source_split']=='train' for s in document['samples'])
    prefix='balanced-' if global_balance else ''
    folder=OUT/(prefix+'geometric-training')
    folder.mkdir(exist_ok=False)
    yolo=YOLO(str(INITIAL),task='detect')
    yolo.model.float().eval()
    for parameter in yolo.model.parameters():
        parameter.requires_grad_(False)
    branches=yolo.model.model[-1].cv3
    # Frozen BN statistics avoid crop-dominated shifts in the deployed model.
    for p in branches.parameters():
        p.requires_grad_(True)
    optimizer=torch.optim.AdamW(branches.parameters(),lr=.0003,weight_decay=.0001)
    indices=document['target_indices']
    rng=random.Random(SEED)
    samples=list(document['samples'])
    normalizers=[p/len(samples) for p in document['positive_anchors']] if global_balance else None
    save(OUT/(prefix+'training-provenance.json'),{'created_at':datetime.now(timezone.utc).isoformat(),
         'initial_sha256':digest(INITIAL),'feature_manifest_sha256':digest(OUT/'feature-manifest.json'),
         'trainable':'model.23.cv3 parameters; BatchNorm statistics frozen',
         'epochs':epochs,'learning_rate':.0003,'loss':'geometric positive/ignore assignment + balanced focal BCE',
         'test_used':False,'calibration_used_for_training':False,'seed':SEED,
         'positive_anchor_normalizers_per_image':normalizers,'script_sha256':digest(Path(__file__))})
    started=monotonic();history=[]
    for epoch in range(epochs):
        rng.shuffle(samples);losses=[]
        for i in range(0,len(samples),2):
            entries=[torch.load(OUT/'features'/s['path'],weights_only=True) for s in samples[i:i+2]]
            feats=[torch.stack([s['features'][level] for s in entries]).float() for level in range(3)]
            targets=torch.stack([s['targets'] for s in entries]).float()
            valid=torch.stack([s['valid'] for s in entries])
            outputs=[branch(x)[:,indices].flatten(2) for branch,x in zip(branches,feats)]
            logits=torch.cat(outputs,2).permute(0,2,1)
            loss=balanced_focal_loss(logits,targets,valid,normalizers=normalizers)
            optimizer.zero_grad(set_to_none=True);loss.backward()
            torch.nn.utils.clip_grad_norm_(branches.parameters(),5.)
            optimizer.step();losses.append(float(loss.detach()))
            if i%100==0:
                save(OUT/(prefix+'training-progress.json'),{'epoch':epoch+1,'epochs':epochs,'images_done':i+len(entries),
                     'images':len(samples),'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1)})
        for group in optimizer.param_groups:
            group['lr']=.0003*(1-.8*(epoch+1)/epochs)
        checkpoint=folder/f'epoch{epoch+1}.pt'
        yolo.save(str(checkpoint))
        entry={'epoch':epoch+1,'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1),
               'weights':str(checkpoint),'sha256':digest(checkpoint)}
        history.append(entry);save(OUT/(prefix+'training-history.json'),history);print(entry,flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('cache','train'))
    parser.add_argument('--epochs',type=int,default=12)
    parser.add_argument('--global-balance',action='store_true')
    args=parser.parse_args()
    cache() if args.command=='cache' else train(args.epochs,args.global_balance)
