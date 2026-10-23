"""Train dirt/hair separation on audited native crops; preserve deployed geometry.

The deployed checkpoint is packed from two ordinary classifier branches. Train
its original narrow target branch, then pack it with the untouched other-class
branch. No calibration/test labels enter fitting and no custom runtime is used.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import random
import sys
from time import monotonic

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.train_yolo_geometric_refinement import runtime,geometric_targets,balanced_focal_loss
from scripts.export_yolo_refined_classifier import export

OUT=ROOT/'output/gear-yolo-fine-defects-v4'
DATA=ROOT/'output/gear-yolo-fine-defects-v3'
ACTIVE=ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2'
INITIAL=ROOT/'output/gear-yolo-fine-defects-v1/classifier-training/weights/epoch4.pt'
SEED=20261026


def training_schedule(samples, rows):
    """Replay target whole images at their inference scale, not just magnified crops."""
    result=[]
    for sample in samples:
        row=rows[sample['sample_id']]
        assert sample['source_split']=='train' and row['split']=='train' and row['source_split']=='train'
        repeats=6 if row['kind']=='real_whole' and any(g['label'] in ('dirt','hair') for g in row['ground_truth']) else 1
        result.extend([sample]*repeats)
    return result


def init():
    assert not (OUT/'protocol.json').exists()
    protocol=read(DATA/'protocol.json')
    protocol.update(created_at=datetime.now(timezone.utc).isoformat(), experiment='v4_target_separation',
                    rationale='Separate class discrimination from box-head drift; top-3 geometric positives, ignored overlapping fragments, explicit texture negatives.',
                    candidate_epochs=[2,4], maximum_epochs=4,
                    training_data_manifest_sha256=digest(DATA/'dataset/manifest.json'),
                    feature_manifest_sha256=digest(DATA/'feature-manifest.json'),
                    initialization_sha256=digest(INITIAL), baseline_weights_sha256=digest(ACTIVE/'best.pt'),
                    training_phases=[{'name':'target_classifier', 'epochs':4,'selection_epochs':[2,4]}],
                    stopping_policy='At most 4 epochs; compare epochs 2 and 4 on calibration only, freeze once before final regression.',
                    whole_target_repeats_per_epoch=6,
                    loss='Global class-balanced focal BCE, top3 IoU>=.5 geometric positives, IoU>=.2 ignored fragments, negative weight1.5',
                    calibration_used_for_training=False, test_used_for_training=False)
    save(OUT/'protocol.json',protocol)
    snapshot=read(DATA/'baseline-deployment.json')
    assert snapshot['weights_sha256']==digest(ACTIVE/'best.pt')
    save(OUT/'baseline-deployment.json',snapshot)


def cache():
    torch=runtime();torch.set_num_threads(6)
    from ultralytics import YOLO
    model=YOLO(str(INITIAL)).model.float().eval();head=model.model[-1]
    original=YOLO(str(ACTIVE/'best.pt')).model.float().state_dict()
    assert all(torch.equal(v,original[k]) for k,v in model.state_dict().items() if not k.startswith('model.23.cv3.'))
    del original
    document=read(DATA/'feature-manifest.json');assert document['initial_sha256']==digest(ACTIVE/'best.pt')
    assert document['dataset_sha256']==digest(DATA/'dataset/manifest.json')
    folder=OUT/'targets';folder.mkdir(exist_ok=False)
    indices=[i for i,label in model.names.items() if label in ('dirt','hair')]
    totals=[0,0];manifest=[];started=monotonic()
    for i,row in enumerate(document['samples']):
        assert row['source_split']=='train'
        p=DATA/'features'/row['path'];assert digest(p)==row['cache_sha256']
        entry=torch.load(p,weights_only=True)
        features=[f.unsqueeze(0).float() for f in entry['features']]
        with torch.no_grad():
            preds=head(features)
            boxes=preds[0][0,:4].T
            boxes=torch.cat((boxes[:,:2]-boxes[:,2:]/2,boxes[:,:2]+boxes[:,2:]/2),1)
        truth=[]
        for g in entry['truth']:
            label,x,y,w,h=g.tolist();truth.append((int(label),[(x-w/2)*640,(y-h/2)*640,(x+w/2)*640,(y+h/2)*640]))
        target,valid=geometric_targets(boxes,truth,indices,topk=3)
        path=folder/row['path'];torch.save({'targets':target.to(torch.uint8),'valid':valid},path)
        counts=target.sum(0).tolist();totals=[a+b for a,b in zip(totals,counts)]
        manifest.append({**row,'target_sha256':digest(path),'positive_anchors':counts})
        if (i+1)%100==0 or i+1==len(document['samples']):
            print({'cached':i+1,'total':len(document['samples']),'seconds':round(monotonic()-started,1)},flush=True)
    save(OUT/'target-manifest.json',{'samples':manifest,'positive_anchors':totals,
         'indices':indices,'initial_sha256':digest(INITIAL),'feature_manifest_sha256':digest(DATA/'feature-manifest.json'),
         'train_only':True,'geometric_assignment':{'topk':3,'positive_iou':.5,'ignore_iou':.2}})


def train(smoke=False):
    torch=runtime();torch.set_num_threads(6)
    from ultralytics import YOLO
    document=read(OUT/'target-manifest.json')
    assert document['initial_sha256']==digest(INITIAL)
    assert document['feature_manifest_sha256']==digest(DATA/'feature-manifest.json')
    rows={s['sample_id']:s for s in read(DATA/'dataset/manifest.json')['samples']}
    samples=training_schedule(document['samples'],rows);indices=document['indices']
    assert all(s['source_split']=='train' for s in samples)
    normalizers=[sum(s['positive_anchors'][j] for s in samples)/len(samples) for j in range(2)]
    if smoke:
        samples=([s for s in samples if sum(s['positive_anchors'])>0][:2]+
                 [s for s in samples if s['kind']=='mined_texture_edge_negative'][:2])
    samples=list(samples);epochs=1 if smoke else 4
    folder=OUT/('smoke' if smoke else 'training');folder.mkdir(exist_ok=False)
    yolo=YOLO(str(INITIAL));model=yolo.model.float().eval();branches=model.model[-1].cv3
    for p in model.parameters():p.requires_grad_(False)
    for p in branches.parameters():p.requires_grad_(True)
    torch.manual_seed(SEED);rng=random.Random(SEED)
    optimizer=torch.optim.AdamW(branches.parameters(),lr=.00015,weight_decay=.0001)
    provenance={'created_at':datetime.now(timezone.utc).isoformat(),'initial_sha256':digest(INITIAL),
                'data_manifest_sha256':digest(DATA/'dataset/manifest.json'),'target_manifest_sha256':digest(OUT/'target-manifest.json'),
                'script_sha256':digest(Path(__file__)),'protocol_sha256':digest(OUT/'protocol.json'),
                'epochs':epochs,'smoke':smoke,'trainable':'narrow target classification branch; all other tensors frozen',
                'learning_rate':.00015,'negative_weight':1.5,'batch':2,'normalizers':normalizers,'seed':SEED,
                'presentations_per_epoch':len(samples),'unique_images':len({s['sample_id'] for s in samples}),
                'source_photos':len({s['source_id'] for s in samples}),'kinds':dict(Counter(s['kind'] for s in samples)),
                'new_independent_photos':0,'test_used':False,'calibration_used_for_training':False}
    save(folder/'provenance.json',provenance)
    (folder/'training-script.py').write_bytes(Path(__file__).read_bytes())
    history=[];started=monotonic()
    for epoch in range(epochs):
        rng.shuffle(samples);losses=[];last=monotonic()
        for i in range(0,len(samples),2):
            chosen=samples[i:i+2]
            features=[];targets=[];valid=[]
            for s in chosen:
                p=OUT/'targets'/s['path']
                if epoch==0:assert digest(p)==s['target_sha256']
                f=torch.load(DATA/'features'/s['path'],weights_only=True)
                labels=torch.load(p,weights_only=True)
                features.append(f['features']);targets.append(labels['targets']);valid.append(labels['valid'])
            feats=[torch.stack([s[level] for s in features]).float() for level in range(3)]
            logits=torch.cat([branch(f)[:,indices].flatten(2) for branch,f in zip(branches,feats)],2).permute(0,2,1)
            loss=balanced_focal_loss(logits,torch.stack(targets).float(),torch.stack(valid),negative_weight=1.5,normalizers=normalizers)
            assert torch.isfinite(loss)
            optimizer.zero_grad(set_to_none=True);loss.backward()
            grad=torch.nn.utils.clip_grad_norm_(branches.parameters(),5);assert torch.isfinite(grad)
            optimizer.step();losses.append(float(loss.detach()))
            if monotonic()-last>25 or i+2>=len(samples):
                progress={'epoch':epoch+1,'epochs':epochs,'images_done':min(i+2,len(samples)),'images':len(samples),
                          'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1)}
                save(folder/'progress.json',progress);print(progress,flush=True);last=monotonic()
        for group in optimizer.param_groups:group['lr']=.00015*(1-.8*(epoch+1)/epochs)
        checkpoint=folder/f'epoch{epoch+1}.pt';yolo.save(str(checkpoint))
        item={'epoch':epoch+1,'loss':sum(losses)/len(losses),'sha256':digest(checkpoint),'seconds':round(monotonic()-started,1)}
        history.append(item);save(folder/'history.json',history)
        if smoke or epoch+1 in (2,4):
            export(checkpoint,folder/f'packed-epoch{epoch+1}.pt')
            torch.set_num_threads(6)
    print({'done':True,'smoke':smoke,'epochs':epochs},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('init','cache','smoke','train'))
    args=parser.parse_args()
    if args.command=='init':init()
    elif args.command=='cache':cache()
    else:train(args.command=='smoke')
