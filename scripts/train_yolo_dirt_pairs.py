"""Train only an isolated dirt feature branch on paired stains and backgrounds."""
import argparse
from copy import deepcopy
from pathlib import Path
import random
import sys
from time import monotonic

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import OUT,DATA,SEED,ACTIVE
from scripts.train_yolo_fine_defects import read,save,digest
from scripts.train_yolo_geometric_refinement import geometric_targets
from scripts.yolo_dirt_augmentation import pack_classifier

OLD=ROOT/'output/gear-yolo-fine-defects-v3'
INITIAL=ROOT/'output/gear-yolo-fine-defects-v1/classifier-training/weights/epoch4.pt'


def runtime():
    from scripts.evaluate_yolo import configure_inference_runtime
    return configure_inference_runtime(ACTIVE/'best.pt')


def initialize_narrow(torch):
    from ultralytics import YOLO
    baseline=YOLO(str(ACTIVE/'best.pt'));narrow=YOLO(str(INITIAL))
    baseline.model.float().eval();narrow.model.float().eval()
    for key,value in narrow.model.state_dict().items():
        if not key.startswith('model.23.cv3.'):
            assert torch.equal(value,baseline.model.state_dict()[key]),key
    def copy_bn(to,source,indices):
        for key in ('weight','bias','running_mean','running_var'):
            getattr(to,key).copy_(getattr(source,key)[indices])
        to.num_batches_tracked.copy_(source.num_batches_tracked)
    with torch.no_grad():
        for target,source in zip(narrow.model.model[-1].cv3,baseline.model.model[-1].cv3):
            width=target[2].in_channels;assert source[2].in_channels==width*2
            target[0][0].conv.weight.copy_(source[0][0].conv.weight[1::2]);copy_bn(target[0][0].bn,source[0][0].bn,slice(1,None,2))
            target[0][1].conv.weight.copy_(source[0][1].conv.weight[width:,1::2]);copy_bn(target[0][1].bn,source[0][1].bn,slice(width,None))
            target[1][0].conv.weight.copy_(source[1][0].conv.weight[width:]);copy_bn(target[1][0].bn,source[1][0].bn,slice(width,None))
            target[1][1].conv.weight.copy_(source[1][1].conv.weight[width:,width:]);copy_bn(target[1][1].bn,source[1][1].bn,slice(width,None))
            target[2].weight.copy_(source[2].weight[:,width:]);target[2].bias.copy_(source[2].bias)
        torch.manual_seed(SEED);x=torch.rand(1,3,320,320)
        a=baseline.model(x)[0];b=narrow.model(x)[0]
        torch.testing.assert_close(a[:,:4],b[:,:4],atol=1e-5,rtol=1e-6)
        torch.testing.assert_close(a[:,9],b[:,9],atol=1e-5,rtol=1e-5)
    return narrow


def cache():
    torch=runtime()
    import numpy as np
    from PIL import Image
    from ultralytics import YOLO
    from ultralytics.data.augment import LetterBox
    document=read(DATA/'manifest.json');old=read(OLD/'feature-manifest.json')
    previous={r['sample_id']:r for r in old['samples']}
    assert old['initial_sha256']==digest(ACTIVE/'best.pt')
    assert old['dataset_sha256']==digest(OLD/'dataset/manifest.json')
    model=YOLO(str(ACTIVE/'best.pt')).model.float().eval()
    protocol=read(OUT/'protocol.json');auto=protocol.get('letterbox_auto',False)
    reused_features={};reused_data={};reuse_root=None
    if protocol.get('reuse_feature_experiment'):
        reuse_root=Path(protocol['reuse_feature_experiment'])
        previous_cache=read(reuse_root/'feature-manifest.json')
        assert previous_cache['dataset_sha256']==digest(reuse_root/'dataset/manifest.json')
        assert previous_cache['weights_sha256']==digest(ACTIVE/'best.pt')
        assert read(reuse_root/'protocol.json').get('letterbox_auto',False)==auto
        reused_features={r['sample_id']:r for r in previous_cache['samples']}
        reused_data={r['sample_id']:r for r in read(reuse_root/'dataset/manifest.json')['samples']}
    if auto:
        torch.manual_seed(SEED);test=torch.rand(1,3,544,640)
        with torch.inference_mode():before=model(test)[0]
        model.fuse(verbose=False)
        with torch.inference_mode():after=model(test)[0]
        torch.testing.assert_close(before,after,atol=2e-4,rtol=1e-4)
    head=model.model[-1]
    assert not (OUT/'feature-manifest.json').exists(), 'Do not overwrite a completed cache'
    audit=read(OUT/'placement-audit.json');assert audit['dataset_manifest_sha256']==digest(DATA/'manifest.json')
    folder=OUT/'features';folder.mkdir(exist_ok=True)
    transform=LetterBox(new_shape=(640,640),auto=auto,scaleup=True,stride=32)
    rows=[];started=monotonic();ci=5
    for i,row in enumerate(document['samples']):
        assert row['split']==row['source_split']=='train'
        if row['sample_id'] in reused_features:
            original=reused_data[row['sample_id']]
            for key in ('source_id','source_group','source_split','path','file_sha256','ground_truth','kind'):
                assert row[key]==original[key],(row['sample_id'],key)
            entry=reused_features[row['sample_id']]
            path=reuse_root/'features'/entry['path'];assert digest(path)==entry['sha256']
            rows.append({**entry,'path':str(path.resolve())})
            if (i+1)%100==0:print({'reused':i+1,'total':len(document['samples'])},flush=True)
            continue
        if row['existing']:
            oldrow=previous[row['sample_id']];path=OLD/'features'/oldrow['path']
            assert digest(path)==oldrow['cache_sha256']
            entry=torch.load(path,weights_only=True);features=entry['features'];truth=entry['truth']
            teacher=entry['teacher_scores'][ci].float()
            with torch.inference_mode():raw=head([f[None].float() for f in features])[0][0,:4].T
        else:
            path=Path(row['path']);assert digest(path)==row['file_sha256']
            with Image.open(path) as image:rgb=np.asarray(image.convert('RGB'))
            h,w=rgb.shape[:2];ratio=min(640/h,640/w)
            dw,dh=640-round(w*ratio),640-round(h*ratio)
            if auto:dw,dh=dw%32,dh%32
            dx,dy=round(dw/2-.1),round(dh/2-.1)
            rgb=transform(image=rgb)
            tensor=torch.from_numpy(np.ascontiguousarray(rgb.transpose(2,0,1))).float()[None]/255
            with torch.inference_mode():raw,extra=model(tensor)
            raw=raw[0,:4].T;features=[f[0].half() for f in extra['feats']];teacher=extra['scores'][0,ci].float()
            labels=[]
            for g in row['ground_truth']:
                x1,y1,x2,y2=[v*ratio+(dx if j%2==0 else dy) for j,v in enumerate(g['bbox'])]
                labels.append([document['classes'].index(g['label']),(x1+x2)/1280,(y1+y2)/1280,(x2-x1)/640,(y2-y1)/640])
            truth=torch.tensor(labels).reshape(-1,5)
        boxes=torch.cat((raw[:,:2]-raw[:,2:]/2,raw[:,:2]+raw[:,2:]/2),1)
        truth_xyxy=[(int(g[0]),[(g[1]-g[3]/2)*640,(g[2]-g[4]/2)*640,(g[1]+g[3]/2)*640,(g[2]+g[4]/2)*640]) for g in truth.tolist()]
        target,valid=geometric_targets(boxes,truth_xyxy,[ci],topk=3)
        # Teacher targets provide background stability without freezing annotated positives.
        output=folder/f'{i:04}.pt'
        torch.save({'features':features,'targets':target[:,0].to(torch.uint8),'valid':valid[:,0],
                    'teacher':teacher.half()},output)
        rows.append({**{k:row[k] for k in ('sample_id','source_id','source_group','source_split','kind')},
            'path':output.name,'sha256':digest(output),'positive_anchors':int(target.sum()),
            'dirt_annotations':sum(g['label']=='dirt' for g in row['ground_truth']),
            'pair_id':row.get('paired_clean_id'),'feature_shapes':[list(f.shape) for f in features]})
        if (i+1)%100==0 or i+1==len(document['samples']):
            print({'cached':i+1,'total':len(document['samples']),'seconds':round(monotonic()-started,1)},flush=True)
    save(OUT/'feature-manifest.json',{'samples':rows,'weights_sha256':digest(ACTIVE/'best.pt'),
        'dataset_sha256':digest(DATA/'manifest.json'),'train_only':True,
        'unsupported_positive_inputs':[r['sample_id'] for r in rows if r['dirt_annotations'] and not r['positive_anchors']]})


def dirt_loss(logits,targets,valid,teacher,positive_teacher_weight=0.):
    import torch
    import torch.nn.functional as F
    positive=targets.bool()&valid;negative=~targets.bool()&valid
    raw=F.binary_cross_entropy_with_logits(logits,targets,reduction='none')
    pos=(raw*positive).sum()
    # All selected hard negatives keep ordinary BCE gradients, including modest
    # scores; focal downweighting previously allowed weak background scores to grow.
    negatives=(raw*negative).topk(min(128,logits.shape[1]),dim=1).values.sum()
    preserve=(F.binary_cross_entropy_with_logits(logits,teacher.sigmoid(),reduction='none')
              -F.binary_cross_entropy_with_logits(teacher,teacher.sigmoid(),reduction='none'))
    confident_target=(positive|~valid)&(teacher.sigmoid()>=.1)
    target_preserve=(preserve*confident_target).sum()
    background_preserve=(preserve*negative).sum()
    return (pos+negatives+.05*background_preserve+positive_teacher_weight*target_preserve)/positive.sum().clamp(min=logits.shape[0]*2)


def export(narrow,output,torch):
    from ultralytics import YOLO
    base=YOLO(str(ACTIVE/'best.pt'));base.model.float().eval()
    original=deepcopy(base.model).eval();narrow.model.eval()
    for si,(a,b) in enumerate(zip(original.model[-1].cv3,narrow.model.model[-1].cv3)):
        base.model.model[-1].cv3[si]=pack_classifier(a,b,[5])
    torch.manual_seed(SEED);x=torch.rand(1,3,640,640)
    with torch.inference_mode():old=original(x)[0];new=base.model(x)[0];target=narrow.model(x)[0]
    keep=[i for i in range(20) if i!=9]
    torch.testing.assert_close(new[:,keep],old[:,keep],atol=1e-5,rtol=1e-5)
    torch.testing.assert_close(new[:,9],target[:,9],atol=1e-5,rtol=1e-5)
    base.save(str(output));reloaded=YOLO(str(output)).model.float().eval()
    with torch.inference_mode():again=reloaded(x)[0]
    # Check half-checkpoint serialization against the float output separately.
    torch.testing.assert_close(again[:,keep],old[:,keep],atol=1e-5,rtol=1e-5)
    assert torch.isfinite(again).all()
    save(output.with_suffix('.json'),{'weights_sha256':digest(output),'baseline_sha256':digest(ACTIVE/'best.pt'),
        'preserved_classes':[v for k,v in base.names.items() if k!=5],
        'shared_box_head_preserved':True,'forward_parity_verified':True,'reload_non_dirt_parity_verified':True,
        'standard_yolo_modules':True,'one_checkpoint':True})


def train(smoke=False):
    torch=runtime();torch.set_num_threads(4)
    torch.manual_seed(SEED);rng=random.Random(SEED)
    document=read(OUT/'feature-manifest.json');assert document['dataset_sha256']==digest(DATA/'manifest.json')
    assert document['weights_sha256']==digest(ACTIVE/'best.pt')
    narrow=initialize_narrow(torch);model=narrow.model.float().eval();branches=model.model[-1].cv3
    for p in model.parameters():p.requires_grad_(False)
    for p in branches.parameters():p.requires_grad_(True)
    rows=list(document['samples'])
    # Unlocalizable positive marks cannot supervise a frozen box head. Skip those
    # positive inputs; their unchanged clean counterparts remain useful negatives.
    excluded={r['sample_id'] for r in rows if r['dirt_annotations'] and not r['positive_anchors']}
    rows=[r for r in rows if r['sample_id'] not in excluded]
    protocol=read(OUT/'protocol.json')
    if smoke:rows=[next(r for r in rows if r['kind'].startswith('synthetic') and r['positive_anchors']),
                   next(r for r in rows if 'background' in r['kind'] and not r['dirt_annotations']),
                   next(r for r in rows if r['kind']=='real_whole' and r['positive_anchors'])]
    else:
        # Give genuine original-scale dirt frames regular replay without letting
        # cropped variants dominate the same source.
        replay_kinds=protocol.get('real_dirt_replay_kinds',['real_whole'])
        rows+=(protocol.get('real_dirt_replay_total',4)-1)*[r for r in rows if r['kind'] in replay_kinds and r['dirt_annotations']]
    folder=OUT/('smoke' if smoke else 'training');folder.mkdir(exist_ok=False)
    protocol=read(OUT/'protocol.json');learning_rate=protocol.get('learning_rate',.00005)
    target_teacher_weight=protocol.get('positive_teacher_preservation',0.)
    epochs=1 if smoke else 4;optimizer=torch.optim.AdamW(branches.parameters(),lr=learning_rate,weight_decay=.0001)
    save(folder/'provenance.json',{'feature_manifest_sha256':digest(OUT/'feature-manifest.json'),
        'dataset_sha256':digest(DATA/'manifest.json'),'protocol_sha256':digest(OUT/'protocol.json'),
        'script_sha256':digest(Path(__file__)),'epochs':epochs,'learning_rate':learning_rate,'batch':2,'seed':SEED,
        'positive_teacher_preservation':target_teacher_weight,
        'real_dirt_replay_total':protocol.get('real_dirt_replay_total',4),
        'real_dirt_replay_kinds':protocol.get('real_dirt_replay_kinds',['real_whole']),
        'excluded_unsupported_positive_inputs':sorted(excluded),'presentations':len(rows),
        'unique_inputs':len({r['sample_id'] for r in rows}),'calibration_used':False,'test_used':False,
        'trainable':'Only isolated dirt classifier feature layers; batchnorm statistics frozen; deployed hair branch preserved by export'})
    (folder/'training-script.py').write_bytes(Path(__file__).read_bytes())
    started=monotonic();history=[]
    for epoch in range(epochs):
        rng.shuffle(rows);losses=[];last=monotonic();buckets={}
        for row in rows:
            key=tuple(tuple(shape) for shape in row.get('feature_shapes',[]))
            buckets.setdefault(key,[]).append(row)
        batches=[group[i:i+2] for group in buckets.values() for i in range(0,len(group),2)];rng.shuffle(batches);done=0
        for batch_rows in batches:
            items=[torch.load(OUT/'features'/r['path'],weights_only=True) for r in batch_rows]
            features=[torch.stack([r['features'][si] for r in items]).float() for si in range(3)]
            logits=torch.cat([b(f)[:,5].flatten(1) for b,f in zip(branches,features)],dim=1)
            target=torch.stack([r['targets'] for r in items]).float();valid=torch.stack([r['valid'] for r in items])
            teacher=torch.stack([r['teacher'] for r in items]).float()
            loss=dirt_loss(logits,target,valid,teacher,positive_teacher_weight=target_teacher_weight);assert torch.isfinite(loss)
            optimizer.zero_grad(set_to_none=True);loss.backward()
            grad=torch.nn.utils.clip_grad_norm_(branches.parameters(),3.);assert torch.isfinite(grad)
            optimizer.step();losses.append(float(loss.detach()))
            done+=len(items)
            if monotonic()-last>25 or done>=len(rows):
                progress={'epoch':epoch+1,'epochs':epochs,'done':done,'inputs':len(rows),
                    'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1)}
                save(folder/'progress.json',progress);print(progress,flush=True);last=monotonic()
        for group in optimizer.param_groups:group['lr']=learning_rate*(1-.75*(epoch+1)/epochs)
        path=folder/f'epoch{epoch+1}.pt';narrow.save(str(path))
        history.append({'epoch':epoch+1,'loss':sum(losses)/len(losses),'weights_sha256':digest(path)})
        save(folder/'history.json',history)
        if smoke or epoch+1 in (2,4):export(narrow,folder/f'packed-epoch{epoch+1}.pt',torch)
    assert digest(ACTIVE/'best.pt')==document['weights_sha256']
    print({'finished':True,'epochs':epochs,'smoke':smoke},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=('cache','smoke','train'))
    parser.add_argument('--experiment-root',type=Path,default=OUT)
    args=parser.parse_args()
    OUT=args.experiment_root.resolve(strict=True);DATA=OUT/'dataset';SEED=read(OUT/'protocol.json')['seed']
    if args.command=='cache':cache()
    else:train(args.command=='smoke')
