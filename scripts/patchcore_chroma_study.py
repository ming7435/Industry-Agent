"""Offline color-residual support for reviewed PatchCore; never deploys."""
from __future__ import annotations
import argparse
from pathlib import Path
import time
import patchcore_multiview_experiment as base
from patchcore_foreground import foreground_mask

OUT=base.ROOT/'output/patchcore-chroma-study-v6'
PARENT=base.ROOT/'output/patchcore-reviewed-ablation-v5'


def features(tile):
    import cv2
    import numpy as np
    pixels=cv2.blur(np.asarray(tile,dtype=np.float32),(3,3))
    total=pixels.sum(axis=2)+1.
    chroma=np.stack(((pixels[:,:,0]-pixels[:,:,1])/total,(pixels[:,:,2]-pixels[:,:,1])/total),axis=2)
    intensity=pixels.mean(axis=2)
    bins=np.minimum(7,(intensity/32).astype(np.int32))
    valid=foreground_mask(tile)&(pixels.max(axis=2)>=30)
    if not valid.any(): raise ValueError('No supported illuminated foreground')
    return chroma,bins,valid


def declare():
    if (OUT/'protocol.json').exists():return check()
    manifest=base.read(PARENT/'manifest.json');base.validate_manifest(manifest)
    OUT.mkdir(exist_ok=True)
    p=dict(created_at=base.now(),hypothesis='Color-invariant CNN neighbours can match a brown stain to a clean edge. Add a separate normal-color residual measurement, conditioned on view and brightness, while retaining PatchCore geometry scores.',
        feature_spec=dict(channels=['(R-G)/(R+G+B+1)','(B-G)/(R+G+B+1)'],native_resolution=True,pool=3,intensity_bins=8,
            sample_pixels_per_train_view=256,normal_fit='Median and scaled MAD per view/brightness; robust covariance after 4-MAD trimming; scale floor 0.002.'),
        training='Only retained normal train sources. No defect pixels, masks, calibration images or test images in normal color fit.',
        calibration='Lock each branch threshold at <=0.5% normal FPR, giving combined empirical calibration FPR <=1%. Choose PatchCore family/ROI by calibration FNR, then stain misses, FPR, shallow, full.',
        test_rule='Run reused regression only if calibration FNR improves over data-only selected model, stain misses do not increase, and combined FPR <=1%. No test-driven selection.',
        caveat='Color support is a separate experimental branch, not an already integrated production PatchCore feature. Public white-gear camera domain only; uncertain labels and reused test preclude deployment.',
        source_hashes={str(p):base.sha(p) for p in [Path(__file__),Path(base.__file__),base.ROOT/'scripts/patchcore_foreground.py']},
        parent_protocol_sha256=base.sha(PARENT/'protocol.json'),manifest_sha256=base.sha(PARENT/'manifest.json'),
        active_hashes=base.read(PARENT/'protocol.json')['active_hashes'])
    base.write(OUT/'protocol.json',p);base.write(OUT/'manifest.json',manifest);return p


def check():
    p=base.read(OUT/'protocol.json')
    for path,digest in {**p['source_hashes'],**p['active_hashes']}.items():
        assert base.sha(base.ROOT/Path(path))==digest,path
    assert base.sha(PARENT/'protocol.json')==p['parent_protocol_sha256']
    assert base.sha(PARENT/'manifest.json')==p['manifest_sha256']
    assert base.read(OUT/'manifest.json')==base.read(PARENT/'manifest.json')
    return p


def fit():
    import numpy as np
    from PIL import Image
    declare()
    if (OUT/'color-model.json').exists():return
    rows=[r for r in base.read(OUT/'manifest.json') if r['split']=='train']
    samples=[[[] for _ in range(8)] for _ in range(5)]
    for i,row in enumerate(rows):
        assert row['label']=='normal' and base.sha(row['path'])==row['file_sha256']
        with Image.open(row['path']) as image:
            image=image.convert('RGB')
            for view,box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile:chroma,bins,valid=features(tile)
                ids=np.flatnonzero(valid)
                ids=ids[np.linspace(0,len(ids)-1,min(256,len(ids)),dtype=np.int32)]
                values=chroma.reshape(-1,2)[ids];levels=bins.ravel()[ids]
                for level in range(8):
                    selected=values[levels==level]
                    if len(selected): samples[view][level].append(selected)
        if (i+1)%200==0 or i+1==len(rows):base.status(OUT,'fitting_normal_color',completed=i+1,total=len(rows))
    models=[]
    for view in range(5):
        pooled=np.concatenate([a for parts in samples[view] for a in parts],axis=0)
        current=[]
        for level in range(8):
            values=np.concatenate(samples[view][level],axis=0) if samples[view][level] else np.empty((0,2))
            fallback=len(values)<32
            if fallback:values=pooled
            center=np.median(values,axis=0);scale=np.maximum(1.4826*np.median(np.abs(values-center),axis=0),.002)
            keep=np.max(np.abs((values-center)/scale),axis=1)<=4
            trimmed=values[keep]
            covariance=np.cov(trimmed.T) if len(trimmed)>3 else np.diag(scale**2)
            covariance+=np.eye(2)*.002**2
            current.append(dict(center=center.tolist(),inverse_covariance=np.linalg.inv(covariance).tolist(),
                sampled_pixels=len(values),used_for_covariance=int(keep.sum()),fallback_to_view=fallback))
        models.append(current)
    base.write(OUT/'color-model.json',dict(created_at=base.now(),training_images=len(rows),
        training_group_ids=[r['group_id'] for r in rows],models=models,protocol_sha256=base.sha(OUT/'protocol.json')))


def color_map(tile,model):
    import numpy as np
    chroma,bins,valid=features(tile);heatmap=np.zeros(valid.shape,np.float32)
    for level,params in enumerate(model):
        mask=(bins==level)&valid
        if not mask.any():continue
        difference=chroma[mask]-np.asarray(params['center'])
        distance=np.einsum('ni,ij,nj->n',difference,np.asarray(params['inverse_covariance']),difference)
        heatmap[mask]=np.sqrt(np.maximum(0,distance))
    return heatmap


def score(split):
    from PIL import Image
    check();model=base.read(OUT/'color-model.json')
    assert model['protocol_sha256']==base.sha(OUT/'protocol.json')
    rows=[r for r in base.read(OUT/'manifest.json') if r['split']==split]
    path=OUT/(split+'_scores.json');scores=base.read(path) if path.exists() else []
    assert len(scores)<=len(rows) and all(a['sample_id']==b['sample_id'] for a,b in zip(scores,rows))
    for row in rows[len(scores):]:
        assert base.sha(row['path'])==row['file_sha256']
        started=time.perf_counter();views=[]
        with Image.open(row['path']) as image:
            image=image.convert('RGB')
            for view,box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile: views.append(float(color_map(tile,model['models'][view]).max()))
        scores.append({**row,'score':max(views),'view_scores':views,'seconds':time.perf_counter()-started})
        base.write(path,scores)
        if len(scores)%50==0 or len(scores)==len(rows):base.status(OUT,'color_'+split,completed=len(scores),total=len(rows))
    return scores


def join(pc,color,pc_threshold,color_threshold,roi):
    lookup={r['sample_id']:r for r in color}
    assert {r['sample_id'] for r in pc}==set(lookup)
    combined=[]
    for row in pc:
        other=lookup[row['sample_id']]
        assert (row['file_sha256'],row['label'])==(other['file_sha256'],other['label'])
        pc_score=row['roi_score'] if roi else row['score']
        combined.append({**row,'score':max(pc_score/pc_threshold,other['score']/color_threshold),
            'patchcore_score':pc_score,'color_score':other['score']})
    return combined


def finish():
    check();color=score('calibration')
    color_choice=base.select_threshold([r['score'] for r in color if r['label']=='normal'],[r['score'] for r in color if r['label']=='defect'],.005)
    choices=[]
    for name in ('shallow224','deep448'):
        pc=base.read(PARENT/name/'calibration_scores.json')
        assert len(pc)==len(color),'Parent calibration incomplete'
        for roi in (False,True):
            key='roi_score' if roi else 'score'
            c=base.select_threshold([r[key] for r in pc if r['label']=='normal'],[r[key] for r in pc if r['label']=='defect'],.005)
            combined=join(pc,color,c['threshold'],color_choice['threshold'],roi)
            metrics=base.evaluate(combined,1.)
            stain_misses=sum(r['label']=='defect' and 'stain' in r['scenario'] and r['score']<1. for r in combined)
            choices.append(dict(variant=name,roi=roi,pc_threshold=c['threshold'],color_threshold=color_choice['threshold'],metrics=metrics,stain_misses=stain_misses))
    winner=min(choices,key=lambda c:(c['metrics']['overall']['fnr'],c['stain_misses'],c['metrics']['overall']['fpr'],c['variant']!='shallow224',c['roi']))
    parent=base.read(PARENT/'selection_locked.json')
    pc_parent=base.read(PARENT/parent['variant']/'calibration_scores.json')
    parent_stain_fn=sum(r['label']=='defect' and 'stain' in r['scenario'] and r['roi_score' if parent['roi'] else 'score']<parent['threshold'] for r in pc_parent)
    eligible=(winner['metrics']['overall']['fnr']<parent['metrics']['fnr'] and winner['stain_misses']<=parent_stain_fn and winner['metrics']['overall']['fpr']<=.01)
    lock=dict(**winner,locked_at=base.now(),color_model_sha256=base.sha(OUT/'color-model.json'),
        pc_memory_sha256=base.sha(PARENT/winner['variant']/'memory.npz'),eligible_for_regression=eligible)
    base.write(OUT/'calibration.json',dict(choices=choices,color_only=color_choice,parent=parent,parent_stain_misses=parent_stain_fn,selected=lock))
    base.status(OUT,'color_calibration_result',selected=lock)
    base.write(OUT/'selection_locked.json',lock)
    if not eligible:
        base.write(OUT/'comparison.json',dict(deployed=False,eligible_for_regression=False,reason='No qualifying calibration improvement; no additional test run.'))
        return
    # Selection is sealed before accessing regression scores. The parent
    # scoring function permits the alternate feature family if calibration
    # selected it; no family is chosen using the regression outcome.
    import patchcore_reviewed_ablation as reviewed
    base.setup_runtime()
    pc=reviewed.score(winner['variant'],'test');color_test=score('test')
    combined=join(pc,color_test,winner['pc_threshold'],winner['color_threshold'],winner['roi'])
    base.write(OUT/'test_combined_scores.json',combined)
    candidate=base.evaluate(combined,1.);baseline=base.read(PARENT/'comparison.json')['baseline']
    result=dict(completed_at=base.now(),selected=lock,candidate=candidate,baseline=baseline,
        empirical_gate=base.replacement_gate(candidate['overall'],baseline['overall']),
        deployment_gate=dict(allowed=False,fresh_independent_test=False,unresolved_labels=True),deployed=False)
    check();base.write(OUT/'comparison.json',result);base.status(OUT,'completed',candidate=candidate['overall'])


if __name__=='__main__':
    import cv2
    cv2.setNumThreads(1)
    parser=argparse.ArgumentParser();parser.add_argument('--stage',choices=['fit','finish'],default='fit');args=parser.parse_args()
    if args.stage=='fit':fit();score('calibration')
    else:finish()
