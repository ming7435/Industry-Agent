"""Run the isolated dirt readout on real calibration photos before promotion."""
import argparse
from itertools import product
from pathlib import Path
import sys
from time import monotonic

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.train_yolo_dirt_readout import OUT
from scripts.yolo_consensus_experiment import OUT as CONSENSUS,target_rows


def extract():
    weights=OUT/'weights/best.pt'
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(weights)
    from ultralytics import YOLO
    from ultralytics.models.yolo.detect.predict import DetectionPredictor
    from ultralytics.utils import nms,ops
    from app.vision.evaluation import load_rgb,pixel_sha256
    from app.vision.yolo_multiview import crop_windows
    class Capture(DetectionPredictor):
        def postprocess(self,preds,img,orig_imgs,**kwargs):
            self.last_raw=(preds[0] if isinstance(preds,(tuple,list)) else preds).detach().clone()
            self.last_shape=tuple(img.shape[2:])
            return super().postprocess(preds,img,orig_imgs,**kwargs)
    assert not (OUT/'calibration-triage-views.json').exists()
    protocol=read(OUT/'protocol.json');weight_hash=digest(weights)
    assert weight_hash==read(OUT/'training-results.json')['weights_sha256']
    evaluation={'training_protocol_sha256':digest(OUT/'protocol.json'),
        'weights_sha256':weight_hash,'consensus_grid':read(CONSENSUS/'protocol.json')['consensus_grid'],
        'confidence_grid':protocol['confidence_grid'],'calibration_gates':protocol['calibration_gates'],
        'target_extraction':'Independent per-target NMS at .01; retain default non-target class outputs.',
        'test_used':False}
    save(OUT/'evaluation-protocol.json',evaluation)
    source=read(SOURCE/'manifest.json');classes=source['classes'];targets=[classes.index(l) for l in ('dirt','hair')]
    rows=[r for r in source['samples'] if r['split']=='calibration']
    positives=[r for r in rows if any(g['label'] in ('dirt','hair') for g in r['ground_truth'])]
    controls=[r for r in rows if r not in positives];rows=positives+controls[::6];assert len(rows)==43
    model=YOLO(str(weights));results=[];started=monotonic()
    for index,row in enumerate(rows):
        path=SOURCE/row['path'];assert digest(path)==row['file_sha256'];views=[]
        with load_rgb(path) as image:
            assert pixel_sha256(image)==row['pixel_sha256']
            windows=[('full',(0,0,*image.size))]+[('tile',w) for w in crop_windows(image.size,.6)]+[('detail',w) for w in crop_windows(image.size,.4,3)]
            for kind,window in windows:
                with image.crop(window) as crop:
                    result=model.predict(crop,predictor=Capture,conf=.01,iou=.45,device='cpu',imgsz=640,max_det=300,save=False,verbose=False)
                    combined=[b for b in result[0].boxes.data.cpu().tolist() if int(b[5]) not in targets]
                    for ci in targets:
                        raw=model.predictor.last_raw.clone()
                        for other in range(len(classes)):
                            if other!=ci:raw[:,other+4]=0
                        boxes=nms.non_max_suppression(raw,.01,.45,multi_label=True,max_det=300)[0]
                        boxes[:,:4]=ops.scale_boxes(model.predictor.last_shape,boxes[:,:4],(crop.height,crop.width))
                        combined.extend(boxes.cpu().tolist())
                    defects=[{'label':classes[int(b[5])],'confidence':b[4],'bbox':b[:4]} for b in combined if b[2]>b[0] and b[3]>b[1]]
                    views.append({'kind':kind,'window':list(window),'defects':defects})
        results.append({**row,'views':views})
        if (index+1)%5==0 or index+1==len(rows):
            print({'images':index+1,'total':len(rows),'seconds':round(monotonic()-started,1)},flush=True)
    assert digest(weights)==weight_hash
    save(OUT/'calibration-triage-views.json',{'samples':results,'weights_sha256':weight_hash,
        'evaluation_protocol_sha256':digest(OUT/'evaluation-protocol.json'),'test_used':False})


def triage():
    from app.vision.yolo_evaluation import class_aware_localization
    protocol=read(OUT/'evaluation-protocol.json');raw=read(OUT/'calibration-triage-views.json')
    assert raw['evaluation_protocol_sha256']==digest(OUT/'evaluation-protocol.json')
    rows=raw['samples'];grid=protocol['consensus_grid'];gates=protocol['calibration_gates'];results={}
    for label in ('dirt','hair'):
        options=[];gt=sum(g['label']==label for r in rows for g in r['ground_truth'])
        for votes,support,strong,fuse,aspect in product(grid['min_views'],grid['support_floor'],[1.,.7 if label=='dirt' else .25],grid['fuse'],grid['hair_aspect'] if label=='hair' else [1.]):
            params={'min_views':votes,'support_floor':support,'single_floor':strong,'fuse':fuse,'aspect':aspect}
            subset=target_rows(rows,label,params);valid=[]
            for threshold in protocol['confidence_grid']:
                if sum(p['confidence']>=threshold for r in subset for p in r['predictions'])>gt+gates['target_fp_max'][label]:continue
                metrics=class_aware_localization(subset,threshold,.5)
                if metrics['fp']<=gates['target_fp_max'][label]:
                    valid.append({'threshold':threshold,**{k:metrics[k] for k in ('tp','fn','fp')}})
            if valid:options.append({'parameters':params,'best':max(valid,key=lambda x:(x['tp'],-x['fp'],x['threshold']))})
        options.sort(key=lambda x:(x['best']['tp'],-x['best']['fp'],x['best']['threshold']),reverse=True)
        results[label]={'best':options[0] if options else None,'passed':bool(options and options[0]['best']['tp']>=gates[label+'_tp_min']),'options':options}
        print({'label':label,**{k:results[label][k] for k in ('best','passed')}},flush=True)
    save(OUT/'triage-results.json',{'targets':results,'test_used':False,'deployment_allowed':False,
        'eligible_for_full_calibration':all(r['passed'] for r in results.values()),'weights_sha256':raw['weights_sha256']})


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=('extract','triage'))
    parser.add_argument('--experiment-root',type=Path,default=OUT)
    args=parser.parse_args();OUT=args.experiment_root.resolve(strict=True);globals()[args.command]()
