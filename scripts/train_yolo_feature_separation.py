"""Adapt YOLO neck features on training-only real crops and texture negatives."""
import argparse
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
import random
import sys
from time import monotonic
from types import SimpleNamespace

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.train_yolo_geometric_refinement import runtime
from scripts.train_yolo_native_hard_examples import batch,preservation_mask
from scripts.train_yolo_target_separation import training_schedule

OUT=ROOT/'output/gear-yolo-fine-defects-v5'
DATA=ROOT/'output/gear-yolo-fine-defects-v3'
ACTIVE=ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2'
SEED=20261027


def neck_forward(model,prefix):
    outputs={4:prefix[0],6:prefix[1],10:prefix[2]};x=prefix[2]
    for layer in model.model[11:23]:
        inputs=x if layer.f==-1 else [x if j==-1 else outputs[j] for j in layer.f]
        x=layer(inputs);outputs[layer.i]=x
    return [outputs[i] for i in (16,19,22)]


def prepare():
    OUT.mkdir(exist_ok=False)
    rows=read(DATA/'dataset/manifest.json')['samples'];train=[r for r in rows if r['split']=='train']
    targets=[r for r in train if r['kind']=='real_whole' and any(g['label'] in ('dirt','hair') for g in r['ground_truth'])]
    pool=[r for r in train if r['kind']=='real_whole' and r not in targets]
    rng=random.Random(SEED);replay={}
    classes=read(SOURCE/'manifest.json')['classes']
    for label in classes:
        candidates=[r for r in pool if any(g['label']==label for g in r['ground_truth'])]
        for r in rng.sample(candidates,min(8,len(candidates))):replay[r['sample_id']]=r
    rest=[r for r in pool if r['sample_id'] not in replay]
    for r in rng.sample(rest,160-len(replay)):replay[r['sample_id']]=r
    chosen=targets+list(replay.values())+[r for r in train if r['kind'] in ('native_target_crop','native_confusable_defect','mined_texture_edge_negative')]
    ids={r['sample_id'] for r in chosen};assert len(ids)==len(chosen)
    features=[r for r in read(DATA/'feature-manifest.json')['samples'] if r['sample_id'] in ids]
    assert len(features)==len(chosen) and all(r['source_split']=='train' for r in chosen)
    save(OUT/'subset.json',{'samples':chosen,'features':features,'source_dataset_sha256':digest(DATA/'dataset/manifest.json'),
                          'source_features_sha256':digest(DATA/'feature-manifest.json'),'train_only':True})
    protocol=read(ROOT/'output/gear-yolo-fine-defects-v4/protocol.json')
    protocol.update(created_at=datetime.now(timezone.utc).isoformat(),experiment='v5_feature_separation',
       rationale='The classifier-only calibration ablation increased false boxes. Adapt neck features using quality-aware detection loss, original-scale target replay, and texture negatives.',
       training_phases=[{'name':'neck_and_detection_head','epochs':4,'selection_epochs':[2,4]}],
       loss='Ultralytics task-aligned quality BCE + CIoU/DFL, target weight3, masked non-target teacher preservation0.25',
       training_subset_sha256=digest(OUT/'subset.json'),initialization_sha256=digest(ACTIVE/'best.pt'),
       stopping_policy='At most 4 epochs. Reject at fixed 43-image calibration triage if target bounds are impossible; full188 calibration only for survivors. Freeze before final real regression.',
       calibration_used_for_training=False,test_used_for_training=False)
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(ROOT/'output/gear-yolo-fine-defects-v4/baseline-deployment.json'))
    scheduled=training_schedule(features,{r['sample_id']:r for r in chosen})
    summary={'unique_training_images':len(chosen),'source_photos':len({r['source_id'] for r in chosen}),
       'presentations_per_epoch':len(scheduled),'whole_target_inputs':len(targets),'new_independent_photos':0,
       'kinds':dict(Counter(r['kind'] for r in chosen)),'train_only':True}
    save(OUT/'data-summary.json',summary);print(summary,flush=True)


def cache():
    torch=runtime();torch.set_num_threads(6)
    import numpy as np
    from PIL import Image
    from ultralytics import YOLO
    from ultralytics.data.augment import LetterBox
    document=read(OUT/'subset.json');assert document['source_dataset_sha256']==digest(DATA/'dataset/manifest.json')
    folder=OUT/'backbone-features';folder.mkdir(exist_ok=False)
    model=YOLO(str(ACTIVE/'best.pt')).model.float().eval()
    transform=LetterBox(new_shape=(640,640),auto=False,scaleup=True)
    rows={r['sample_id']:r for r in document['samples']};manifest=[];started=monotonic()
    for i,item in enumerate(document['features']):
        row=rows[item['sample_id']];path=DATA/'dataset'/row['path'];assert digest(path)==row['file_sha256']
        with Image.open(path) as image:rgb=np.asarray(image.convert('RGB'))
        tensor=torch.from_numpy(np.ascontiguousarray(transform(image=rgb).transpose(2,0,1))).float().unsqueeze(0)/255
        prefix=[]
        with torch.no_grad():
            x=tensor
            for layer in model.model[:11]:
                assert layer.f==-1
                x=layer(x)
                if layer.i in (4,6,10):prefix.append(x[0].half())
        path=folder/item['path'];torch.save(prefix,path)
        manifest.append({**item,'prefix_sha256':digest(path)})
        if (i+1)%50==0 or i+1==len(document['features']):
            print({'cached':i+1,'total':len(document['features']),'seconds':round(monotonic()-started,1)},flush=True)
    save(OUT/'feature-manifest.json',{'samples':manifest,'initial_sha256':digest(ACTIVE/'best.pt'),
         'subset_sha256':digest(OUT/'subset.json'),'prefix_dtype':'float16','prefix_layers':[4,6,10],'train_only':True})


def train(smoke=False):
    torch=runtime();torch.set_num_threads(6)
    from ultralytics import YOLO
    from ultralytics.utils.loss import v8DetectionLoss
    document=read(OUT/'feature-manifest.json');subset=read(OUT/'subset.json')
    assert document['initial_sha256']==digest(ACTIVE/'best.pt') and document['subset_sha256']==digest(OUT/'subset.json')
    rows={r['sample_id']:r for r in subset['samples']}
    samples=training_schedule(document['samples'],rows)
    if smoke:
        samples=([s for s in samples if s['kind']=='native_target_crop'][:2]+
                 [s for s in samples if s['kind']=='mined_texture_edge_negative'][:2])
    epochs=1 if smoke else 4;folder=OUT/('smoke' if smoke else 'training');folder.mkdir(exist_ok=False)
    yolo=YOLO(str(ACTIVE/'best.pt'));model=yolo.model.float().eval();head=model.model[-1]
    original_args=model.args;model.args=SimpleNamespace(box=7.5,cls=.5,dfl=1.5)
    criterion=v8DetectionLoss(model);targets=[i for i,n in model.names.items() if n in ('dirt','hair')]
    weights=torch.ones(head.nc);weights[targets]=3.;criterion.class_weights=weights.view(1,1,-1)
    keep=[i for i in model.names if i not in targets]
    for name,p in model.named_parameters():
        index=int(name.split('.')[1]);p.requires_grad_(11<=index<=22 or name.startswith(('model.23.cv2.','model.23.cv3.')))
    groups=[{'params':model.model[11:23].parameters(),'lr':.000015,'initial_lr':.000015},
            {'params':head.cv2.parameters(),'lr':.000015,'initial_lr':.000015},
            {'params':head.cv3.parameters(),'lr':.0001,'initial_lr':.0001}]
    optimizer=torch.optim.AdamW(groups,weight_decay=.0001)
    torch.manual_seed(SEED);rng=random.Random(SEED)
    if smoke:
        with torch.no_grad():
            inputs=torch.rand(1,3,640,640);prefix=[];x=inputs
            for layer in model.model[:11]:
                x=layer(x)
                if layer.i in (4,6,10):prefix.append(x)
            expected=model(inputs)[1]['feats'];actual=neck_forward(model,prefix)
            for a,b in zip(expected,actual):torch.testing.assert_close(a,b,atol=1e-5,rtol=1e-5)
        del inputs,prefix,x,expected,actual
    save(folder/'provenance.json',{'created_at':datetime.now(timezone.utc).isoformat(),'epochs':epochs,'smoke':smoke,
       'initial_sha256':digest(ACTIVE/'best.pt'),'feature_manifest_sha256':digest(OUT/'feature-manifest.json'),
       'protocol_sha256':digest(OUT/'protocol.json'),'script_sha256':digest(Path(__file__)),
       'trainable':'neck layers13-22, classification and box head; backbone0-10 and BN statistics frozen',
       'loss':'task-aligned quality BCE + CIoU/DFL, target weight3, masked non-target logit preservation0.25',
       'lr_neck':.000015,'lr_box':.000015,'lr_class':.0001,'batch':2,'seed':SEED,
       'presentations_per_epoch':len(samples),'calibration_used_for_training':False,'test_used':False})
    (folder/'training-script.py').write_bytes(Path(__file__).read_bytes())
    history=[];started=monotonic()
    for epoch in range(epochs):
        rng.shuffle(samples);losses=[];last=monotonic()
        for i in range(0,len(samples),2):
            chosen=samples[i:i+2];prefixes=[];entries=[]
            for s in chosen:
                p=OUT/'backbone-features'/s['path'];q=DATA/'features'/s['path']
                if epoch==0:assert digest(p)==s['prefix_sha256'] and digest(q)==s['cache_sha256']
                prefixes.append(torch.load(p,weights_only=True));entries.append(torch.load(q,weights_only=True))
            prefix=[torch.stack([r[level] for r in prefixes]).float() for level in range(3)]
            old,labels,teacher=batch(entries,torch);del old,entries,prefixes
            features=neck_forward(model,prefix)
            preds=head.forward_head(features,box_head=head.cv2,cls_head=head.cv3)
            detection,_=criterion(preds,labels)
            student=preds['scores'][:,keep];teacher=teacher[:,keep]
            weight=(teacher.sigmoid()+.0003)*preservation_mask(features,labels,targets,torch)
            preserve=(weight*(student-teacher).square()).sum()/weight.sum().clamp(min=1)
            loss=detection.sum()/len(chosen)+.25*preserve;assert torch.isfinite(loss)
            optimizer.zero_grad(set_to_none=True);loss.backward()
            norm=torch.nn.utils.clip_grad_norm_(model.parameters(),5);assert torch.isfinite(norm)
            optimizer.step();losses.append(float(loss.detach()))
            if monotonic()-last>25 or i+2>=len(samples):
                progress={'epoch':epoch+1,'epochs':epochs,'done':min(i+2,len(samples)),'total':len(samples),
                          'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1)}
                save(folder/'progress.json',progress);print(progress,flush=True);last=monotonic()
        for g in optimizer.param_groups:g['lr']=g['initial_lr']*(1-.8*(epoch+1)/epochs)
        path=folder/f'epoch{epoch+1}.pt';model.args=original_args;yolo.save(str(path));model.args=criterion.hyp
        history.append({'epoch':epoch+1,'sha256':digest(path),'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1)})
        save(folder/'history.json',history)
    if smoke:
        reloaded=YOLO(str(path)).model.float().eval();baseline=YOLO(str(ACTIVE/'best.pt')).model.float().state_dict()
        assert all(torch.equal(v,baseline[k]) for k,v in reloaded.state_dict().items() if int(k.split('.')[1])<=10)
        with torch.no_grad():assert torch.isfinite(reloaded(torch.rand(1,3,320,320))[0]).all()
        print({'smoke_passed':True,'prefix_neck_parity':True,'frozen_backbone_unchanged':True,'reload_ok':True},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('prepare','cache','smoke','train'))
    args=parser.parse_args()
    if args.command=='prepare':prepare()
    elif args.command=='cache':cache()
    else:train(args.command=='smoke')
