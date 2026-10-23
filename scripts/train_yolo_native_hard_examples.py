"""Fine-tune a standard YOLO detection head on cached, training-only native crops.

Use the installed Ultralytics task-aligned soft targets, BCE, box/DFL losses.
The frozen backbone cache accelerates CPU training; the exported checkpoint
still performs ordinary image inference and needs no cache at runtime.
"""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import random
import sys
from time import monotonic
from types import SimpleNamespace

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_native_hard_examples import OUT, DATA, ACTIVE, SEED
from scripts.train_yolo_fine_defects import read, save, digest
from scripts.train_yolo_geometric_refinement import runtime


def cache():
    torch=runtime()
    import numpy as np
    from PIL import Image
    from ultralytics import YOLO
    from ultralytics.data.augment import LetterBox
    folder=OUT/'features';folder.mkdir(exist_ok=False)
    document=read(DATA/'manifest.json');classes=document['classes']
    audit=read(OUT/'data-audit.json')
    assert audit['dataset_manifest_sha256']==digest(DATA/'manifest.json')
    assert audit['all_crop_and_transformed_boxes_valid'] and not audit['group_leakage']
    initial_hash=digest(ACTIVE/'best.pt')
    assert initial_hash==read(OUT/'baseline-deployment.json')['weights_sha256']
    rows=[s for s in document['samples'] if s['split']=='train']
    assert all(s['source_split']=='train' for s in rows)
    model=YOLO(str(ACTIVE/'best.pt'),task='detect').model.float().eval()
    assert [model.names[i] for i in range(len(model.names))]==classes
    transform=LetterBox(new_shape=(640,640),auto=False,scaleup=True)
    manifest=[];started=monotonic()
    for i,row in enumerate(rows):
        path=DATA/row['path'];assert digest(path)==row['file_sha256']
        with Image.open(path) as source:
            rgb=np.asarray(source.convert('RGB'))
        h,w=rgb.shape[:2];ratio=min(640/w,640/h)
        dx,dy=round((640-round(w*ratio))/2-.1),round((640-round(h*ratio))/2-.1)
        rgb=transform(image=rgb)
        tensor=torch.from_numpy(np.ascontiguousarray(rgb.transpose(2,0,1))).float().unsqueeze(0)/255
        with torch.no_grad():
            _,pred=model(tensor)
        truth=[]
        for g in row['ground_truth']:
            x1,y1,x2,y2=[v*ratio+(dx if j%2==0 else dy) for j,v in enumerate(g['bbox'])]
            truth.append([classes.index(g['label']),(x1+x2)/1280,(y1+y2)/1280,(x2-x1)/640,(y2-y1)/640])
        path=folder/f'{i:04}.pt'
        torch.save({'features':[f[0].half() for f in pred['feats']],
                    'teacher_scores':pred['scores'][0].half(),
                    'truth':torch.tensor(truth,dtype=torch.float32).reshape(-1,5)},path)
        manifest.append({'path':path.name,'sample_id':row['sample_id'],'source_id':row['source_id'],
                         'source_split':'train','kind':row['kind'],'cache_sha256':digest(path)})
        if (i+1)%50==0 or i+1==len(rows):
            print({'cached':i+1,'total':len(rows),'seconds':round(monotonic()-started,1)},flush=True)
    assert digest(ACTIVE/'best.pt')==initial_hash
    save(OUT/'feature-manifest.json',{'initial_sha256':initial_hash,
         'dataset_sha256':digest(DATA/'manifest.json'),'samples':manifest,'input_size':640,
         'test_used':False,'calibration_used':False})


def batch(entries, torch):
    features=[torch.stack([s['features'][level] for s in entries]).float() for level in range(3)]
    truth=torch.cat([s['truth'] for s in entries])
    indices=torch.cat([torch.full((len(s['truth']),),i,dtype=torch.float32) for i,s in enumerate(entries)])
    labels={'batch_idx':indices,'cls':truth[:,:1],'bboxes':truth[:,1:]}
    teacher=torch.stack([s['teacher_scores'] for s in entries]).float()
    return features,labels,teacher


def preservation_mask(features, labels, target_indices, torch):
    """Allow correction of teacher errors at annotated target locations.

    A one-stride halo includes nearby anchors whose boxes overlap the defect.
    Other classes, unannotated regions and negative images retain preservation.
    """
    from ultralytics.utils.tal import make_anchors
    anchors,strides=make_anchors(features,torch.tensor([8,16,32]),.5)
    anchors=anchors*strides
    allowed=torch.ones((features[0].shape[0],1,len(anchors)),dtype=torch.float32)
    for index,cls,box in zip(labels['batch_idx'],labels['cls'].flatten(),labels['bboxes']):
        if int(cls) not in target_indices:
            continue
        x,y,w,h=box*640
        halo=strides[:,0]
        inside=((anchors[:,0]>=x-w/2-halo)&(anchors[:,0]<=x+w/2+halo)&
                (anchors[:,1]>=y-h/2-halo)&(anchors[:,1]<=y+h/2+halo))
        allowed[int(index),0,inside]=0
    return allowed


def train(epochs, smoke=False, threads=6, initial=None, run_name=None, exclude_targets=False):
    torch=runtime()
    torch.set_num_threads(threads)
    from ultralytics import YOLO
    from ultralytics.utils.loss import v8DetectionLoss
    document=read(OUT/'feature-manifest.json')
    assert document['initial_sha256']==digest(ACTIVE/'best.pt')
    assert document['dataset_sha256']==digest(DATA/'manifest.json')
    samples=list(document['samples']);assert all(s['source_split']=='train' for s in samples)
    initial=Path(initial) if initial else ACTIVE/'best.pt'
    yolo=YOLO(str(initial),task='detect');model=yolo.model.float().eval();head=model.model[-1]
    if initial.resolve()!=(ACTIVE/'best.pt').resolve():
        original=YOLO(str(ACTIVE/'best.pt'),task='detect').model.float().state_dict()
        assert all(torch.equal(value,original[name]) for name,value in model.state_dict().items()
                   if not name.startswith(('model.23.cv2.','model.23.cv3.'))), 'Feature cache requires identical frozen backbone'
        del original
    original_args=model.args
    model.args=SimpleNamespace(box=7.5,cls=.5,dfl=1.5)
    criterion=v8DetectionLoss(model)
    # Positive and negative terms receive the same target-class weight.
    weights=torch.ones(head.nc);targets=[i for i,n in model.names.items() if n in ('dirt','hair')]
    weights[targets]=2.;criterion.class_weights=weights.view(1,1,-1)
    keep=[i for i in model.names if i not in targets]
    for name,p in model.named_parameters():
        p.requires_grad_(name.startswith(('model.23.cv2.','model.23.cv3.')))
    optimizer=torch.optim.AdamW([{'params':head.cv2.parameters(),'lr':.00003,'base_lr':.00003},
                                {'params':head.cv3.parameters(),'lr':.00015,'base_lr':.00015}],weight_decay=.0001)
    torch.manual_seed(SEED);rng=random.Random(SEED)
    if smoke:
        negatives=[s for s in samples if s['kind']=='mined_texture_edge_negative'][:2]
        positives=[s for s in samples if s['kind']=='native_target_crop'][:2]
        samples=negatives+positives;epochs=1
    folder=OUT/(run_name or ('smoke' if smoke else 'training'));folder.mkdir(exist_ok=False)
    provenance={'created_at':datetime.now(timezone.utc).isoformat(),'epochs':epochs,
        'initial_sha256':digest(initial),'initial_weights':str(initial),'teacher_sha256':digest(ACTIVE/'best.pt'),
        'feature_manifest_sha256':digest(OUT/'feature-manifest.json'),
        'dataset_sha256':digest(DATA/'manifest.json'),'script_sha256':digest(Path(__file__)),
        'trainable':'YOLO box and classification head; frozen backbone/neck and BN running statistics',
        'loss':'Ultralytics task-aligned quality BCE + CIoU/DFL + 0.25 weighted non-target logit preservation',
        'lr_box':.00003,'lr_class':.00015,'batch':2,'seed':SEED,'target_class_weight':2,'cpu_threads':threads,
        'calibration_used_for_training':False,'test_used_for_training':False,'smoke':smoke,
        'exclude_target_regions_from_preservation':exclude_targets}
    save(folder/'provenance.json',provenance)
    started=monotonic();history=[]
    for epoch in range(epochs):
        rng.shuffle(samples);losses=[];last=monotonic()
        for i in range(0,len(samples),2):
            entries=[]
            for s in samples[i:i+2]:
                path=OUT/'features'/s['path']
                if epoch==0:
                    assert digest(path)==s['cache_sha256']
                entries.append(torch.load(path,weights_only=True))
            features,labels,teacher=batch(entries,torch)
            predictions=head.forward_head(features,box_head=head.cv2,cls_head=head.cv3)
            detection,items=criterion(predictions,labels)
            student=predictions['scores'][:,keep];teacher=teacher[:,keep]
            weight=teacher.sigmoid()+.0003
            if exclude_targets:
                weight=weight*preservation_mask(features,labels,targets,torch)
            preserve=(weight*(student-teacher).square()).sum()/weight.sum().clamp(min=1)
            loss=detection.sum()/len(entries)+.25*preserve
            assert torch.isfinite(loss)
            optimizer.zero_grad(set_to_none=True);loss.backward()
            grad=torch.nn.utils.clip_grad_norm_(head.parameters(),5.)
            assert torch.isfinite(grad)
            optimizer.step();losses.append(float(loss.detach()))
            if monotonic()-last>=25 or i+2>=len(samples):
                progress={'epoch':epoch+1,'epochs':epochs,'images_done':min(i+2,len(samples)),
                    'images':len(samples),'loss':sum(losses)/len(losses),'preservation':float(preserve.detach()),
                    'seconds':round(monotonic()-started,1)}
                save(folder/'progress.json',progress);print(progress,flush=True);last=monotonic()
        for group in optimizer.param_groups:
            group['lr']=group['base_lr']*(1-.8*(epoch+1)/epochs)
        checkpoint=folder/f'epoch{epoch+1}.pt'
        model.args=original_args;yolo.save(str(checkpoint));model.args=criterion.hyp
        entry={'epoch':epoch+1,'loss':sum(losses)/len(losses),'seconds':round(monotonic()-started,1),
               'weights':str(checkpoint),'sha256':digest(checkpoint)}
        history.append(entry);save(folder/'history.json',history)
    if smoke:
        reloaded=YOLO(str(checkpoint),task='detect').model.float().eval()
        before=YOLO(str(ACTIVE/'best.pt'),task='detect').model.float().eval().state_dict()
        assert all(torch.equal(value,before[name]) for name,value in reloaded.state_dict().items()
                   if not name.startswith(('model.23.cv2.','model.23.cv3.')))
        print({'smoke_passed':True,'background_loss_finite':True,'positive_loss_finite':True,
               'reload_ok':True,'backbone_and_neck_unchanged':True},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('cache','smoke','train'))
    parser.add_argument('--epochs',type=int,default=8)
    parser.add_argument('--threads',type=int,choices=(1,2,4,6),default=6)
    parser.add_argument('--initial',type=Path)
    parser.add_argument('--run-name')
    parser.add_argument('--exclude-target-preservation',action='store_true')
    args=parser.parse_args()
    if args.run_name:
        assert args.run_name.replace('-','').isalnum()
    cache() if args.command=='cache' else train(args.epochs,args.command=='smoke',args.threads,
         args.initial,args.run_name,args.exclude_target_preservation)
