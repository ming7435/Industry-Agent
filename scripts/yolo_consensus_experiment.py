"""Research-only multiview consensus, isolated from the active inference path."""
import argparse
from copy import deepcopy
from datetime import datetime,timezone
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys
from time import monotonic

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.probe_yolo_class_competition import OUT as CACHE,ACTIVE
from app.vision.yolo_multiview import overlap

OUT=ROOT/'output/gear-yolo-view-consensus-v7'


def consensus_groups(views,size,label,support_floor):
    import numpy as np
    candidates=[];width,height=size
    for view in views:
        left,top,right,bottom=view['window']
        for item in view['defects']:
            if item['label']!=label or item['confidence']<support_floor:continue
            x1,y1,x2,y2=item['bbox']
            if view['kind']!='full' and ((left>0 and x1<=2) or (top>0 and y1<=2)
                or (right<width and x2>=right-left-2) or (bottom<height and y2>=bottom-top-2)):continue
            rival=max((p['confidence'] for p in view['defects'] if p['label']!=label and overlap(item['bbox'],p['bbox'])>=.5),default=0.)
            candidates.append({**item,'bbox':[x1+left,y1+top,x2+left,y2+top],'view':tuple(view['window']),
                               'rival_confidence':rival})
    candidates.sort(key=lambda b:-b['confidence']);groups=[]
    if not candidates:return groups
    boxes=np.asarray([p['bbox'] for p in candidates],dtype=np.float64)
    areas=np.prod(boxes[:,2:]-boxes[:,:2],axis=1)
    assert np.all(areas>0),'Degenerate mapped proposal'
    remaining=np.arange(len(candidates))
    while len(remaining):
        anchor=remaining[0];seed=candidates[anchor]
        intersection=np.maximum(0,np.minimum(boxes[remaining,2:],boxes[anchor,2:])-np.maximum(boxes[remaining,:2],boxes[anchor,:2])).prod(axis=1)
        ious=intersection/(areas[remaining]+areas[anchor]-intersection)
        matched=ious>=.5
        assert matched[0]
        members=[candidates[i] for i in remaining[matched]]
        remaining=remaining[~matched]
        distinct={}
        for item in members:distinct.setdefault(item['view'],item)
        groups.append((seed,distinct))
    return groups


def render_groups(groups,label,min_views,single_floor,fuse,rival_veto=False):
    import numpy as np
    retained=[]
    for seed,distinct in groups:
        if rival_veto and seed.get('rival_confidence',0.)>=seed['confidence']:continue
        voted=len(distinct)>=min_views
        if not voted and not (single_floor<1 and seed['confidence']>=single_floor):continue
        coords=seed['bbox']
        if fuse and voted:
            total=sum(p['confidence'] for p in distinct.values())
            coords=[sum(p['bbox'][i]*p['confidence'] for p in distinct.values())/total for i in range(4)]
        item={'label':label,'confidence':seed['confidence'],'bbox':coords}
        retained.append(item)
    if not retained:return []
    boxes=np.asarray([p['bbox'] for p in retained],dtype=np.float64)
    areas=(boxes[:,2:]-boxes[:,:2]).prod(axis=1);remaining=np.arange(len(retained));chosen=[]
    while len(remaining):
        anchor=remaining[0];chosen.append(retained[anchor]);remaining=remaining[1:]
        intersection=np.maximum(0,np.minimum(boxes[remaining,2:],boxes[anchor,2:])-np.maximum(boxes[remaining,:2],boxes[anchor,:2])).prod(axis=1)
        ious=intersection/(areas[remaining]+areas[anchor]-intersection)
        remaining=remaining[ious<=.45]
    return chosen


def consensus_boxes(views,size,label,min_views,support_floor,single_floor,fuse):
    return render_groups(consensus_groups(views,size,label,support_floor),label,min_views,single_floor,fuse)


def prepare():
    OUT.mkdir(exist_ok=False)
    previous=ROOT/'output/gear-yolo-fine-defects-v5'
    protocol=read(previous/'protocol.json')
    for key in ('training_phases','candidate_epochs','maximum_epochs','training_subset_sha256',
                'training_data_manifest_sha256','feature_manifest_sha256','whole_target_repeats_per_epoch','loss'):
        protocol.pop(key,None)
    protocol.update(experiment='view_consensus_v7',created_at=datetime.now(timezone.utc).isoformat(),
        rationale='Retain target class hypotheses before winner-only filtering, and test distinct-view agreement to reject isolated false detections.',
        initial_weights_sha256=digest(ACTIVE/'best.pt'),training_used=False,
        consensus_grid={'min_views':[1,2,3,4],'support_floor':[.01,.05,.1],'single_floor':'disabled or original class threshold',
                        'fuse':[False,True],'support_iou':.5,'hair_aspect':[1.,1.5]},
        stopping_policy='Triage on fixed43 calibration photos. Carry at most three distinct prediction configurations per target to full188 calibration, choose one frozen configuration, then run test once. No test-informed threshold tuning.')
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(previous/'baseline-deployment.json'))


def decode(full=False):
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics.utils import nms,ops
    manifest=CACHE/('raw-manifest-full.json' if full else 'raw-manifest.json')
    document=read(manifest);classes=read(SOURCE/'manifest.json')['classes']
    targets=[classes.index(label) for label in ('dirt','hair')];rows=[]
    for row in document['samples']:
        assert row['split']=='calibration'
        path=CACHE/row['cache_path'];assert digest(path)==row['cache_sha256']
        views=[]
        for v in torch.load(path,weights_only=True):
            raw=v['raw'].clone()
            if raw.shape[-1]==6:raw=torch.cat((raw,torch.zeros_like(raw[:,:,:1])),dim=-1)
            for ci in range(len(classes)):
                if ci not in targets:raw[:,ci+4]=0
            boxes=nms.non_max_suppression(raw,.01,.45,multi_label=True,max_det=300)[0]
            boxes[:,:4]=ops.scale_boxes(v['shape'],boxes[:,:4],v['original_shape'])
            combined=[b for b in v['reference_boxes'].tolist() if int(b[5]) not in targets]+boxes.tolist()
            defects=[{'label':classes[int(b[5])],'confidence':b[4],'bbox':b[:4]} for b in combined if b[2]>b[0] and b[3]>b[1]]
            views.append({'kind':v['kind'],'window':v['window'],'defects':defects})
        rows.append({**row,'views':views})
    save(OUT/('calibration-full-views.json' if full else 'calibration-triage-views.json'),{'weights_sha256':document['weights_sha256'],
        'source_cache_manifest_sha256':digest(manifest),'samples':rows,'test_used':False})


def full_hair():
    from app.vision.yolo_evaluation import class_aware_localization
    rows=read(OUT/'calibration-full-views.json')['samples']
    assert len(rows)==188 and all(r['split']=='calibration' for r in rows)
    candidates=read(OUT/'triage-results.json')['targets']['hair']['candidates']
    results=[]
    for candidate in candidates:
        metrics=class_aware_localization(target_rows(rows,'hair',candidate['parameters']),candidate['best']['threshold'],.5)
        results.append({'parameters':candidate['parameters'],'threshold':candidate['best']['threshold'],
                        **{k:metrics[k] for k in ('tp','fn','fp')}})
    save(OUT/'hair-full-calibration.json',{'samples':188,'test_used':False,'candidates':results,'deployment_allowed':False})
    print(results,flush=True)


def target_rows(rows,label,params):
    result=[]
    for row in rows:
        size=row['views'][0]['window'][2:]
        cache=row.setdefault('_consensus_groups',{})
        key=(label,params['support_floor'])
        if key not in cache:cache[key]=consensus_groups(row['views'],size,label,params['support_floor'])
        predictions=render_groups(cache[key],label,params['min_views'],params['single_floor'],params['fuse'],params.get('rival_veto',False))
        aspect=params.get('aspect',1.)
        if label=='hair' and aspect>1:
            predictions=[p for p in predictions if max((p['bbox'][2]-p['bbox'][0])/(p['bbox'][3]-p['bbox'][1]),
                (p['bbox'][3]-p['bbox'][1])/(p['bbox'][2]-p['bbox'][0]))>=aspect]
        result.append({'sample_id':row['sample_id'],'ground_truth':[g for g in row['ground_truth'] if g['label']==label],
                       'predictions':predictions})
    return result


def triage():
    from app.vision.yolo_evaluation import class_aware_localization
    rows=read(OUT/'calibration-triage-views.json')['samples'];protocol=read(OUT/'protocol.json')
    grid=protocol['consensus_grid'];gates=protocol['calibration_gates'];thresholds=protocol['confidence_grid']
    floors=read(ACTIVE/'model.json')['inference']['class_confidences'];results={};started=monotonic()
    for label in ('dirt','hair'):
        options=[]
        for votes,support,strong,fuse,aspect in product(grid['min_views'],grid['support_floor'],[1.,floors[label]],grid['fuse'],grid['hair_aspect'] if label=='hair' else [1.]):
            params={'min_views':votes,'support_floor':support,'single_floor':strong,'fuse':fuse,'aspect':aspect}
            subset=target_rows(rows,label,params)
            signature=sha256(json.dumps(subset,sort_keys=True).encode()).hexdigest()
            valid=[]
            for threshold in thresholds:
                if sum(p['confidence']>=threshold for r in subset for p in r['predictions'])>10+gates['target_fp_max'][label]:continue
                metrics=class_aware_localization(subset,threshold,.5)
                if metrics['fp']<=gates['target_fp_max'][label]:
                    valid.append({'threshold':threshold,**{k:metrics[k] for k in ('tp','fn','fp')}})
            best=max(valid,key=lambda x:(x['tp'],-x['fp'],x['threshold']))
            options.append({'parameters':params,'best':best,'prediction_signature':signature})
        options.sort(key=lambda x:(x['best']['tp'],-x['best']['fp'],x['best']['threshold']),reverse=True)
        unique={}
        for option in options:unique.setdefault(option['prediction_signature'],option)
        results[label]={'best':options[0],'candidates':list(unique.values())[:3],
            'passed':options[0]['best']['tp']>=gates[label+'_tp_min'],'options':options}
        print({'label':label,'best':results[label]['best'],'passed':results[label]['passed'],
               'seconds':round(monotonic()-started,1)},flush=True)
    save(OUT/'triage-results.json',{'test_used':False,'targets':results,
        'eligible_for_full_calibration':all(v['passed'] for v in results.values()),'deployment_allowed':False})


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=('prepare','decode','decode-full','full-hair','triage'))
    args=parser.parse_args()
    if args.command=='decode-full':decode(True)
    elif args.command=='full-hair':full_hair()
    else:globals()[args.command]()
