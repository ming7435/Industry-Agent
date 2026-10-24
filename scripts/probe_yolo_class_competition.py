"""Cache exact pre-NMS calibration outputs and inspect class competition.

No test image is read. No deployed model or original annotation is changed.
"""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import sys
from time import monotonic

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.evaluate_yolo_fine_defects import raw_config

OUT=ROOT/'output/gear-yolo-class-competition-v6'
ACTIVE=ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2'


def prepare():
    OUT.mkdir(exist_ok=False)
    prior=ROOT/'output/gear-yolo-fine-defects-v5'
    protocol=read(prior/'protocol.json')
    protocol.update(experiment='class_competition_v6',created_at=datetime.now(timezone.utc).isoformat(),
        rationale='Inspect winner-only decoding of separately refined classifier channels before further training.',
        class_logit_offsets={'dirt':[0,.5,1,1.5,2,3,4],'hair':[0,.5,1,1.5,2]},
        initial_weights_sha256=digest(ACTIVE/'best.pt'),calibration_used_for_training=False,
        test_used_for_training=False,stopping_policy='Calibration-only class competition diagnostic; maximum 35 fixed offset pairs. Only an eligible full calibration candidate may enter a frozen deployment test.')
    # This is a calibration experiment; inherited training settings are inapplicable.
    for key in ('training_phases','candidate_epochs','maximum_epochs','training_subset_sha256',
                'training_data_manifest_sha256','feature_manifest_sha256','whole_target_repeats_per_epoch','loss'):
        protocol.pop(key,None)
    save(OUT/'protocol.json',protocol)
    baseline=read(prior/'baseline-deployment.json')
    assert digest(ACTIVE/'best.pt')==baseline['weights_sha256']
    assert digest(ACTIVE/'model.json')==baseline['metadata_sha256']
    save(OUT/'baseline-deployment.json',baseline)


def cache(full=False):
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics import YOLO
    from ultralytics.models.yolo.detect.predict import DetectionPredictor
    from app.vision.evaluation import load_rgb,pixel_sha256
    from app.vision.yolo_multiview import crop_windows
    class Capture(DetectionPredictor):
        def postprocess(self,preds,img,orig_imgs,**kwargs):
            raw=preds[0] if isinstance(preds,(tuple,list)) else preds
            self.last_raw=raw.detach().cpu().clone()
            self.last_shape=tuple(img.shape[2:])
            return super().postprocess(preds,img,orig_imgs,**kwargs)
    source=read(SOURCE/'manifest.json');classes=source['classes']
    rows=[r for r in source['samples'] if r['split']=='calibration']
    targets=[r for r in rows if any(g['label'] in ('dirt','hair') for g in r['ground_truth'])]
    controls=[r for r in rows if r not in targets]
    if not full:rows=targets+controls[::6]
    assert len(rows)==(188 if full else 43)
    folder=OUT/'raw';folder.mkdir(exist_ok=full)
    previous=read(OUT/'raw-manifest.json') if full else None
    if previous:assert previous['weights_sha256']==digest(ACTIVE/'best.pt') and previous['protocol_sha256']==digest(OUT/'protocol.json')
    existing={r['sample_id']:r for r in previous['samples']} if previous else {}
    model=YOLO(str(ACTIVE/'best.pt'));config=raw_config(classes)
    protocol=read(OUT/'protocol.json');bounds=protocol['class_logit_offsets']
    manifest=[];started=monotonic()
    for index,row in enumerate(rows):
        if row['sample_id'] in existing:
            old=existing[row['sample_id']]
            assert old['file_sha256']==row['file_sha256'] and digest(OUT/old['cache_path'])==old['cache_sha256']
            manifest.append(old);continue
        path=SOURCE/row['path'];assert digest(path)==row['file_sha256']
        views=[]
        with load_rgb(path) as image:
            assert pixel_sha256(image)==row['pixel_sha256']
            windows=[('full',(0,0,*image.size))]+[('tile',w) for w in crop_windows(image.size,.6)]+[('detail',w) for w in crop_windows(image.size,.4,3)]
            for kind,window in windows:
                with image.crop(window) as crop:
                    results=model.predict(crop,predictor=Capture,conf=.01,iou=.45,device='cpu',imgsz=640,max_det=300,save=False,verbose=False)
                    raw=model.predictor.last_raw;maximum=raw[:,4:].clone()
                    for label,offsets in bounds.items():
                        ci=classes.index(label)
                        maximum[:,ci]=torch.sigmoid(torch.logit(maximum[:,ci].clamp(1e-10,1-1e-7))+max(offsets))
                    keep=maximum.amax(1)[0]>.01
                    sparse=raw[:,:,keep].clone()
                    view={'kind':kind,'window':list(window),'shape':model.predictor.last_shape,
                        'original_shape':(crop.height,crop.width),'raw':sparse,
                        'reference_boxes':results[0].boxes.data.cpu().clone(),
                        'discarded_cannot_reach_extraction_floor':True}
                    views.append(view)
        file=folder/(row['sample_id']+'.pt');torch.save(views,file)
        manifest.append({**row,'cache_path':file.relative_to(OUT).as_posix(),'cache_sha256':digest(file)})
        if (index+1)%5==0 or index+1==len(rows):
            print({'cached':index+1,'total':len(rows),'seconds':round(monotonic()-started,1)},flush=True)
    save(OUT/('raw-manifest-full.json' if full else 'raw-manifest.json'),{'weights_sha256':digest(ACTIVE/'best.pt'),'source_manifest_sha256':digest(SOURCE/'manifest.json'),
        'protocol_sha256':digest(OUT/'protocol.json'),'extraction_confidence':.01,'nms_iou':.45,'float_dtype':'float32',
        'split':'calibration','test_used':False,'samples':manifest})


def decoded(view,classes,offsets=None):
    import torch
    from ultralytics.utils import nms,ops
    raw=view['raw'].clone()
    # Ultralytics treats a last dimension of six as an end-to-end output.
    # Sparse anchor caches can accidentally have that size; a zero anchor is inert.
    if raw.shape[-1]==6:raw=torch.cat((raw,torch.zeros_like(raw[:,:,:1])),dim=-1)
    for label,bias in (offsets or {}).items():
        ci=4+classes.index(label)
        if bias:raw[:,ci]=torch.sigmoid(torch.logit(raw[:,ci].clamp(1e-10,1-1e-7))+bias)
    boxes=nms.non_max_suppression(raw,conf_thres=.01,iou_thres=.45,max_det=300)[0]
    boxes[:,:4]=ops.scale_boxes(view['shape'],boxes[:,:4],view['original_shape'])
    return boxes


def analyse():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics.utils import ops
    from torchvision.ops import box_iou
    document=read(OUT/'raw-manifest.json');classes=read(SOURCE/'manifest.json')['classes']
    traces=[];parity_views=0
    for row in document['samples']:
        assert row['split']=='calibration'
        path=OUT/row['cache_path'];assert digest(path)==row['cache_sha256']
        views=torch.load(path,weights_only=True)
        pools=[]
        for view in views:
            boxes=decoded(view,classes)
            torch.testing.assert_close(boxes,view['reference_boxes'],atol=1e-4,rtol=1e-5)
            parity_views+=1
            raw=view['raw'][0];xyxy=ops.xywh2xyxy(raw[:4].T)
            xyxy=ops.scale_boxes(view['shape'],xyxy,view['original_shape'])
            xyxy[:,[0,2]]+=view['window'][0];xyxy[:,[1,3]]+=view['window'][1]
            pools.append((xyxy,raw[4:].T))
        for gt in row['ground_truth']:
            if gt['label'] not in ('dirt','hair'):continue
            ci=classes.index(gt['label']);matching=[]
            for boxes,scores in pools:
                mask=box_iou(boxes,torch.tensor([gt['bbox']])).flatten()>=.5
                matching.extend(scores[mask].tolist())
            choices=sorted(matching,key=lambda s:-s[ci])
            best=choices[0] if choices else [0]*len(classes)
            winner=max(range(len(classes)),key=lambda i:best[i])
            traces.append({'sample_id':row['sample_id'],'ground_truth':gt,'matching_proposals':len(choices),
                'max_true_class_score':best[ci],'winning_class_at_best_target_anchor':classes[winner],
                'winning_score':best[winner],'all_scores_at_best_target_anchor':dict(zip(classes,best))})
    save(OUT/'proposal-diagnosis.json',{'replayed_views_match_original':parity_views,'test_used':False,'traces':traces})
    print({'replayed_views_match_original':parity_views,'traces':[{k:r[k] for k in ('sample_id','ground_truth','max_true_class_score','winning_class_at_best_target_anchor','winning_score')} for r in traces]},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=('prepare','cache','cache-full','analyse'))
    args=parser.parse_args()
    if args.command=='cache-full':cache(True)
    else:globals()[args.command]()
