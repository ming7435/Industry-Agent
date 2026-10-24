"""Calibrate paired-dirt checkpoints with the previously improved hair rule frozen."""
import argparse
from datetime import datetime,timezone
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys
from time import monotonic

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import OUT,SOURCE,read,save,digest
from scripts.yolo_consensus_experiment import target_rows,OUT as CONSENSUS
from scripts.evaluate_yolo_fine_defects import select,score,raw_config


def validate_freeze(path,weights,selection,protocol):
    frozen=read(path)
    for key,file in [('weights',weights),('selection',selection),('protocol',protocol)]:
        assert frozen[key+'_sha256']==digest(file),f'{key} changed after test freezing'
    return frozen


def passes_gates(metrics,gates):
    cls,spatial=metrics['class_and_position'],metrics['spatial']
    return (cls['tp']>=gates['overall_tp_min'] and cls['fp']<=gates['overall_class_fp_max']
        and cls['f1']>=gates['overall_f1_min'] and spatial['fp']<=gates['overall_spatial_fp_max']
        and all(cls['by_class'].get(label,{}).get('tp',0)>=gates[label+'_tp_min']
                and cls['by_class'].get(label,{}).get('fp',0)<=gates['target_fp_max'][label] for label in ('dirt','hair')))


def extract(epoch,full=False,split='calibration'):
    assert split in ('calibration','test')
    weights=OUT/'training'/f'packed-epoch{epoch}.pt'
    folder=OUT/'evaluation'/f'epoch{epoch}';folder.mkdir(parents=True,exist_ok=True)
    protocol=read(OUT/'protocol.json');source=read(SOURCE/'manifest.json');classes=source['classes']
    assert digest(SOURCE/'manifest.json')==protocol['manifest_sha256']
    if split=='test':
        assert full
        validate_freeze(folder/'test-freeze.json',weights,folder/'selection.json',OUT/'protocol.json')
    path=folder/('test-views.json' if split=='test' else 'full-views.json' if full else 'triage-views.json')
    if path.exists():
        data=read(path);assert data['weights_sha256']==digest(weights)
        assert data['protocol_sha256']==digest(OUT/'protocol.json')
        assert all(r['split']==split for r in data['samples'])
        return data['samples'],folder
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(weights)
    from ultralytics import YOLO
    from ultralytics.models.yolo.detect.predict import DetectionPredictor
    from ultralytics.utils import nms,ops
    from app.vision.evaluation import load_rgb,pixel_sha256
    from app.vision.yolo_multiview import crop_windows
    class Capture(DetectionPredictor):
        def postprocess(self,preds,img,orig_imgs,**kwargs):
            self.raw=(preds[0] if isinstance(preds,(tuple,list)) else preds).detach().clone()
            self.shape=tuple(img.shape[2:])
            return super().postprocess(preds,img,orig_imgs,**kwargs)
    rows=[r for r in source['samples'] if r['split']==split]
    if not full:
        positives=[r for r in rows if any(g['label'] in ('dirt','hair') for g in r['ground_truth'])]
        controls=[r for r in rows if r not in positives];rows=positives+controls[::6]
    assert len(rows)==(118 if split=='test' else 188 if full else 43)
    previous=read(folder/'triage-views.json') if full and split=='calibration' else None
    if previous:assert previous['weights_sha256']==digest(weights)
    reuse={r['sample_id']:r for r in previous['samples']} if previous else {}
    model=YOLO(str(weights));results=[];started=monotonic();targets=[5,8]
    # The extraction grid is identical to the previous real calibration study.
    if not (folder/'evaluation-protocol.json').exists():
        save(folder/'evaluation-protocol.json',{'weights_sha256':digest(weights),
            'training_protocol_sha256':digest(OUT/'protocol.json'),
            'consensus_grid':read(CONSENSUS/'protocol.json')['consensus_grid'],
            'fixed_hair_consensus':protocol['fixed_hair_consensus'],
            'dirt_rival_veto':protocol.get('dirt_rival_veto',False),
            'decoding':'Separate dirt/hair hypotheses; ordinary classes argmax with dirt/hair excluded; class-aware NMS .45.',
            'test_used':False})
    for i,row in enumerate(rows):
        if row['sample_id'] in reuse:results.append(reuse[row['sample_id']]);continue
        image_path=SOURCE/row['path'];assert digest(image_path)==row['file_sha256'];views=[]
        with load_rgb(image_path) as image:
            assert pixel_sha256(image)==row['pixel_sha256']
            windows=[('full',(0,0,*image.size))]+[('tile',w) for w in crop_windows(image.size,.6)]+[('detail',w) for w in crop_windows(image.size,.4,3)]
            for kind,window in windows:
                with image.crop(window) as crop:
                    result=model.predict(crop,predictor=Capture,conf=.01,iou=.45,device='cpu',imgsz=640,max_det=300,save=False,verbose=False)
                    ordinary=model.predictor.raw.clone()
                    for ci in targets:ordinary[:,ci+4]=0
                    kept=nms.non_max_suppression(ordinary,.01,.45,multi_label=False,max_det=300)[0]
                    kept[:,:4]=ops.scale_boxes(model.predictor.shape,kept[:,:4],(crop.height,crop.width))
                    boxes=kept.cpu().tolist()
                    for ci in targets:
                        raw=model.predictor.raw.clone()
                        for other in range(len(classes)):
                            if ci!=other:raw[:,other+4]=0
                        selected=nms.non_max_suppression(raw,.01,.45,multi_label=True,max_det=300)[0]
                        selected[:,:4]=ops.scale_boxes(model.predictor.shape,selected[:,:4],(crop.height,crop.width))
                        boxes.extend(selected.cpu().tolist())
                views.append({'kind':kind,'window':list(window),'defects':[{'label':classes[int(b[5])],'confidence':b[4],'bbox':b[:4]}
                    for b in boxes if b[2]>b[0] and b[3]>b[1]]})
        results.append({**row,'views':views})
        if (i+1)%5==0 or i+1==len(rows):print({'epoch':epoch,'split':split,'full':full,'done':i+1,'total':len(rows),'seconds':round(monotonic()-started,1)},flush=True)
    save(path,{'weights_sha256':digest(weights),'protocol_sha256':digest(OUT/'protocol.json'),'samples':results,'test_used':split=='test'})
    return results,folder


def triage(epoch):
    from app.vision.yolo_evaluation import class_aware_localization
    rows,folder=extract(epoch)
    protocol=read(OUT/'protocol.json');grid=read(folder/'evaluation-protocol.json')['consensus_grid'];gates=protocol['calibration_gates']
    options=[]
    for votes,support,strong,fuse in product(grid['min_views'],grid['support_floor'],[1.,.7],grid['fuse']):
        params={'min_views':votes,'support_floor':support,'single_floor':strong,'fuse':fuse,'aspect':1.}
        if protocol.get('dirt_rival_veto',False):params['rival_veto']=True
        predictions=target_rows(rows,'dirt',params);valid=[]
        for threshold in protocol['confidence_grid']:
            if sum(p['confidence']>=threshold for r in predictions for p in r['predictions'])>10:continue
            metrics=class_aware_localization(predictions,threshold,.5)
            if metrics['fp']<=gates['target_fp_max']['dirt']:
                valid.append({'threshold':threshold,**{k:metrics[k] for k in ('tp','fn','fp')}})
        if valid:
            best=max(valid,key=lambda r:(r['tp'],-r['fp'],r['threshold']))
            options.append({'parameters':params,'best':best,'signature':sha256(json.dumps(predictions,sort_keys=True).encode()).hexdigest()})
    options.sort(key=lambda r:(r['best']['tp'],-r['best']['fp'],r['best']['threshold']),reverse=True)
    unique={}
    for option in options:unique.setdefault(option['signature'],option)
    hair=protocol['fixed_hair_consensus']
    hair_counts=class_aware_localization(target_rows(rows,'hair',hair['parameters']),hair['threshold'],.5)
    hair_preserved=all(hair_counts[k]==hair[k] for k in ('tp','fn','fp'))
    passed=bool(options and options[0]['best']['tp']>=gates['dirt_tp_min'] and hair_counts['tp']>=gates['hair_tp_min'] and hair_counts['fp']<=gates['target_fp_max']['hair'] and hair_preserved)
    result={'epoch':epoch,'dirt':options[0] if options else None,'candidates':list(unique.values())[:3],
        'hair':{k:hair_counts[k] for k in ('tp','fn','fp')},'hair_parameters_frozen':True,'hair_matches_frozen_baseline':hair_preserved,
        'eligible_for_full_calibration':passed,'deployment_allowed':False,'test_used':False,'options':options}
    save(folder/'triage.json',result);print({k:v for k,v in result.items() if k not in ('options','candidates')},flush=True)


def full(epoch):
    from app.vision.yolo_multiview import merge_views
    folder=OUT/'evaluation'/f'epoch{epoch}';pre=read(folder/'triage.json')
    assert not (folder/'selection.json').exists() and not (folder/'test-freeze.json').exists(),'Preserve frozen calibration selection'
    assert pre['eligible_for_full_calibration'],'Failed target triage'
    rows,folder=extract(epoch,True);protocol=read(OUT/'protocol.json');classes=read(SOURCE/'manifest.json')['classes']
    hair=protocol['fixed_hair_consensus']
    hair_rows=target_rows(rows,'hair',hair['parameters'])
    hair_map={r['sample_id']:[p for p in r['predictions'] if p['confidence']>=hair['threshold']] for r in hair_rows}
    ordinary={}
    for row in rows:
        views=[{**v,'defects':[p for p in v['defects'] if p['label'] not in ('dirt','hair')]} for v in row['views']]
        ordinary[row['sample_id']]=merge_views(views,views[0]['window'][2:],.01,.45,raw_config(classes))
    choices=[]
    for candidate in pre['candidates']:
        dirt=target_rows(rows,'dirt',candidate['parameters'])
        merged=[{'sample_id':r['sample_id'],'ground_truth':r['ground_truth'],
            'predictions':ordinary[r['sample_id']]+hair_map[r['sample_id']]+dirt[i]['predictions']} for i,r in enumerate(rows)]
        decision=select(merged,classes,protocol)
        # Frozen hair strategy includes its confidence floor; reject any change.
        if decision['eligible'] and decision['thresholds']['hair']!=hair['threshold']:
            thresholds={**decision['thresholds'],'hair':hair['threshold']}
            from scripts.evaluate_yolo_fine_defects import filter_rows
            metrics=score(filter_rows(merged,thresholds));decision.update(thresholds=thresholds,metrics=metrics)
            cls,spatial=metrics['class_and_position'],metrics['spatial'];g=protocol['calibration_gates']
            decision['eligible']=(cls['tp']>=g['overall_tp_min'] and cls['fp']<=g['overall_class_fp_max']
                and cls['f1']>=g['overall_f1_min'] and spatial['fp']<=g['overall_spatial_fp_max']
                and all(cls['by_class'][label]['tp']>=g[label+'_tp_min'] and cls['by_class'][label]['fp']<=g['target_fp_max'][label] for label in ('dirt','hair')))
            decision['target_tp']=sum(cls['by_class'][label]['tp'] for label in ('dirt','hair'))
        decision['dirt_consensus']=candidate['parameters'];decision['hair_consensus']=hair
        choices.append(decision)
    valid=[c for c in choices if c['eligible']]
    result=max(valid,key=lambda c:(c['target_tp'],c['metrics']['class_and_position']['f1'])) if valid else {'eligible':False,'variants':choices}
    result.update(epoch=epoch,weights=str(OUT/'training'/f'packed-epoch{epoch}.pt'),
        weights_sha256=digest(OUT/'training'/f'packed-epoch{epoch}.pt'),protocol_sha256=digest(OUT/'protocol.json'),
        selection_split='calibration',test_used_for_thresholds=False)
    save(folder/'selection.json',result);print({k:v for k,v in result.items() if k not in ('options','variants')},flush=True)


def test(epoch):
    from app.vision.yolo_multiview import merge_views
    from scripts.evaluate_yolo_fine_defects import filter_rows
    folder=OUT/'evaluation'/f'epoch{epoch}';selection=read(folder/'selection.json')
    protocol=read(OUT/'protocol.json');weights=OUT/'training'/f'packed-epoch{epoch}.pt'
    assert selection['eligible'] and selection['weights_sha256']==digest(weights)
    assert selection['protocol_sha256']==digest(OUT/'protocol.json')
    assert passes_gates(selection['metrics'],protocol['calibration_gates'])
    assert selection['hair_consensus']==protocol['fixed_hair_consensus']
    freeze_path=folder/'test-freeze.json'
    if not freeze_path.exists():
        save(freeze_path,{'created_at':datetime.now(timezone.utc).isoformat(),'weights_sha256':digest(weights),
            'selection_sha256':digest(folder/'selection.json'),'protocol_sha256':digest(OUT/'protocol.json'),
            'manifest_sha256':digest(SOURCE/'manifest.json'),'evaluation_script_sha256':digest(Path(__file__)),
            'consensus_script_sha256':digest(ROOT/'scripts/yolo_consensus_experiment.py'),
            'weights':str(weights),'thresholds':selection['thresholds'],'dirt_consensus':selection['dirt_consensus'],
            'hair_consensus':selection['hair_consensus'],'test_used_to_select_thresholds':False})
    frozen=validate_freeze(freeze_path,weights,folder/'selection.json',OUT/'protocol.json')
    assert frozen['evaluation_script_sha256']==digest(Path(__file__))
    assert frozen['consensus_script_sha256']==digest(ROOT/'scripts/yolo_consensus_experiment.py')
    result_path=folder/'test-comparison.json'
    assert not result_path.exists(),'Preserve completed frozen test result'
    rows,_=extract(epoch,full=True,split='test')
    classes=read(SOURCE/'manifest.json')['classes'];dirt=target_rows(rows,'dirt',selection['dirt_consensus'])
    hair=target_rows(rows,'hair',selection['hair_consensus']['parameters']);merged=[]
    for index,row in enumerate(rows):
        views=[{**v,'defects':[p for p in v['defects'] if p['label'] not in ('dirt','hair')]} for v in row['views']]
        boxes=merge_views(views,views[0]['window'][2:],.01,.45,raw_config(classes))
        boxes+=dirt[index]['predictions']+[p for p in hair[index]['predictions'] if p['confidence']>=selection['hair_consensus']['threshold']]
        merged.append({k:row[k] for k in ('sample_id','path','split','ground_truth')}|{'predictions':boxes})
    filtered=filter_rows(merged,selection['thresholds']);metrics=score(filtered)
    passed=passes_gates(metrics,protocol['test_gates'])
    validate_freeze(freeze_path,weights,folder/'selection.json',OUT/'protocol.json')
    assert frozen['consensus_script_sha256']==digest(ROOT/'scripts/yolo_consensus_experiment.py')
    result={'images':len(rows),'metrics':metrics,'regression_gate_passed':passed,'deployment_allowed':False,
        'reason':'Actual API parity still required' if passed else 'Frozen real-image regression gates failed',
        'weights_sha256':digest(weights),'selection_sha256':digest(folder/'selection.json'),
        'freeze_sha256':digest(freeze_path),'test_previously_seen':True,'normal_gear_fpr_available':False,'samples':filtered}
    save(result_path,result);print({k:v for k,v in result.items() if k!='samples'},flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=('triage','full','test'));p.add_argument('--epoch',type=int,choices=(2,4),required=True)
    p.add_argument('--experiment-root',type=Path,default=OUT)
    args=p.parse_args();OUT=args.experiment_root.resolve(strict=True);globals()[args.command](args.epoch)
