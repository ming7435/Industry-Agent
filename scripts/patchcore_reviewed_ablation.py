"""Data-only PatchCore ablation after muted-stain review, with frozen splits."""
from __future__ import annotations
import argparse
from collections import Counter
from pathlib import Path
import time
import patchcore_fine_features as fine
from patchcore_foreground import foreground_mask

base = fine.base
ROOT = base.ROOT
AUDIT = ROOT/'output/patchcore-label-audit-v2'
OUT = ROOT/'output/patchcore-reviewed-ablation-v5'
SPECS = {
    'shallow224': dict(parent=ROOT/'output/patchcore-feature-study-v4',
        cache=ROOT/'output/patchcore-feature-study-v4/feature_candidates.npy',
        manifest=ROOT/'output/patchcore-feature-study-v4/manifest.json',size=224,dimension=192),
    'deep448': dict(parent=ROOT/'output/patchcore-clean-v3/448',
        cache=ROOT/'output/patchcore-clean-v3/448/feature_candidates.npy',
        manifest=ROOT/'output/patchcore-multiview-v2/manifest.json',size=448,dimension=384),
}


def declare():
    if (OUT/'protocol.json').exists(): return check()
    fine.check(SPECS['shallow224']['parent'])
    rows=base.read(AUDIT/'corrected-manifest.json');base.validate_manifest(rows)
    p=dict(created_at=base.now(),hypothesis='Muted brown stains in normal memory and calibration labels reduce separability. Rebuild unchanged feature families using reviewed normal train images only.',
        variants=list(SPECS),scoring_variants=['full','roi'],memory_per_view=1024,candidates_per_image=32,
        threshold_rule='Calibration only, minimum threshold with FPR <= 1%.',
        selection_rule='Minimum calibration FNR, then FPR, then shallow224, then full.',
        test_rule='Evaluate exactly one calibration-selected model on all 219 reused regression images. No test-based threshold or variant selection.',
        limitations=['Reused regression set is not a fresh blind acceptance set.',
                    'Uncertain evaluation labels are retained and sensitivity bounds reported.',
                    'Color proposals are not exhaustive certification of the remaining normal images.'],
        gates=dict(max_fnr=.01,max_fpr=.01,fresh_independent_acceptance_required=True),
        audit_sha256=base.sha(AUDIT/'review-decisions.json'),manifest_sha256=base.sha(AUDIT/'corrected-manifest.json'),
        source_hashes={str(p):base.sha(p) for p in [Path(__file__),Path(fine.__file__),Path(base.__file__),ROOT/'scripts/patchcore_foreground.py',ROOT/'services/agent-service/app/vision/algorithms.py',ROOT/'services/agent-service/app/vision/preprocessing.py']},
        feature_sources={name:{'cache_sha256':base.sha(s['cache']),'manifest_sha256':base.sha(s['manifest'])} for name,s in SPECS.items()},
        active_hashes=base.read(SPECS['shallow224']['parent']/'protocol.json')['active_hashes'],
        env_sha256=base.sha(ROOT/'.env'),weights_sha256=base.sha(base.WEIGHTS),
        partition_counts={split:dict(Counter(r['label'] for r in rows if r['split']==split)) for split in ('train','calibration','test','quarantine')})
    OUT.mkdir(exist_ok=True);base.write(OUT/'protocol.json',p);base.write(OUT/'manifest.json',rows)
    base.status(OUT,'declared_before_calibration');return p


def check():
    p=base.read(OUT/'protocol.json')
    for path,digest in {**p['source_hashes'],**p['active_hashes']}.items():
        if base.sha(ROOT/Path(path))!=digest: raise ValueError('Frozen source/active model changed: '+path)
    for path,key in [(AUDIT/'review-decisions.json','audit_sha256'),(AUDIT/'corrected-manifest.json','manifest_sha256'),(ROOT/'.env','env_sha256'),(base.WEIGHTS,'weights_sha256')]:
        if base.sha(path)!=p[key]: raise ValueError('Frozen input changed: '+str(path))
    assert base.read(OUT/'manifest.json')==base.read(AUDIT/'corrected-manifest.json')
    return p


def build(name):
    import numpy as np
    from app.vision.algorithms import greedy_coreset
    p=check();spec=SPECS[name];dest=OUT/name;dest.mkdir(exist_ok=True)
    if (dest/'model.json').exists(): return
    assert base.sha(spec['cache'])==p['feature_sources'][name]['cache_sha256']
    assert base.sha(spec['manifest'])==p['feature_sources'][name]['manifest_sha256']
    original=[r for r in base.read(spec['manifest']) if r['split']=='train']
    retained={r['sample_id']:r for r in base.read(OUT/'manifest.json') if r['split']=='train'}
    keep=[i for i,r in enumerate(original) if r['sample_id'] in retained]
    assert len(keep)==len(retained) and len(keep)>0
    # Deep cache has deliberately uncomputed entries for earlier quarantined
    # sources: none may enter this rebuild, even if cache shapes match.
    valid_old={r['sample_id'] for r in base.read(ROOT/'output/patchcore-clean-v3/manifest.json') if r['split']=='train'}
    assert set(retained)<=valid_old
    for i in keep:
        assert original[i]['file_sha256']==retained[original[i]['sample_id']]['file_sha256']
        assert base.sha(original[i]['path'])==original[i]['file_sha256']
    cache=np.load(spec['cache'],mmap_mode='r',allow_pickle=False)
    assert cache.shape==(5,len(original),32,spec['dimension'])
    banks=[]
    for view in range(5):
        base.status(OUT,'rebuilding_reviewed_memory',variant=name,view=view,normal_images=len(keep))
        values=cache[view,keep].reshape(-1,spec['dimension'])
        assert np.isfinite(values).all() and (np.linalg.norm(values,axis=1)>0).all()
        banks.append(greedy_coreset(values,ratio=1.,max_size=1024))
    np.savez_compressed(dest/'memory.npz',**{f'view_{i}':b for i,b in enumerate(banks)})
    base.write(dest/'model.json',dict(variant=name,dimension=spec['dimension'],
        preprocessing=dict(input_size=spec['size'],resize_mode='letterbox',contrast='none',blur_sigma=2.),
        training_images=len(keep),training_group_ids=[original[i]['group_id'] for i in keep],
        cache_sha256=p['feature_sources'][name]['cache_sha256'],memory_sha256=base.sha(dest/'memory.npz')))


def score(name,split):
    import numpy as np
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.evaluation import load_rgb
    check();dest=OUT/name;meta=base.read(dest/'model.json')
    assert base.sha(dest/'memory.npz')==meta['memory_sha256']
    detector=(fine.FineDetector if name=='shallow224' else PatchCoreDetector)(str(base.WEIGHTS),meta['preprocessing'])
    with np.load(dest/'memory.npz',allow_pickle=False) as saved: banks=[saved[f'view_{i}'].copy() for i in range(5)]
    rows=[r for r in base.read(OUT/'manifest.json') if r['split']==split]
    path=dest/(split+'_scores.json');scores=base.read(path) if path.exists() else []
    assert len(scores)<=len(rows) and all(a['sample_id']==b['sample_id'] for a,b in zip(scores,rows))
    for row in rows[len(scores):]:
        assert base.sha(row['path'])==row['file_sha256']
        started=time.perf_counter();raw=[];roi=[]
        with load_rgb(row['path']) as image:
            for view,box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile:
                    heatmap=detector.anomaly_map(tile,banks[view]);mask=foreground_mask(tile)
                    raw.append(float(heatmap.max()));roi.append(float(heatmap[mask].max()))
        scores.append({**row,'score':max(raw),'roi_score':max(roi),'view_scores':raw,'seconds':time.perf_counter()-started})
        base.write(path,scores)
        if len(scores)%20==0 or len(scores)==len(rows): base.status(OUT,'scoring_'+split,variant=name,completed=len(scores),total=len(rows))
    return scores


def relabel(scores,manifest):
    lookup={r['sample_id']:r for r in manifest}
    assert all(r['file_sha256']==lookup[r['sample_id']]['file_sha256'] for r in scores)
    return [{**r,**lookup[r['sample_id']],'score':r['score']} for r in scores]


def sensitivity(rows,threshold):
    uncertain=[r for r in rows if r.get('review_v2')=='uncertain_edge_or_dark_region']
    alternate=[{**r,'label':'defect','scenario':'uncertain_as_defect'} if r in uncertain else r for r in rows]
    return dict(uncertain_n=len(uncertain),retained_original_labels=base.evaluate(rows,threshold),
        all_uncertain_as_defect=base.evaluate(alternate,threshold),
        note='Endpoints are a label sensitivity analysis, not verified ground truth.')


def run():
    p=declare();rows=base.read(OUT/'manifest.json');choices=[];controls={}
    for name,spec in SPECS.items():
        build(name);scores=score(name,'calibration')
        old=relabel(base.read(spec['parent']/'calibration_scores.json'),rows)
        old_threshold=base.read(spec['parent']/'calibration.json')[0]['threshold']
        c=base.select_threshold([r['score'] for r in old if r['label']=='normal'],[r['score'] for r in old if r['label']=='defect'],.01)
        controls[name]=dict(previous_memory_previous_threshold=base.evaluate(old,old_threshold),
            previous_memory_reviewed_calibration=c,
            rebuilt_memory_previous_threshold=base.evaluate(scores,old_threshold))
        for roi in (False,True):
            key='roi_score' if roi else 'score'
            c=base.select_threshold([r[key] for r in scores if r['label']=='normal'],[r[key] for r in scores if r['label']=='defect'],.01)
            choices.append({**c,'variant':name,'roi':roi})
        base.write(OUT/'calibration-results.json',dict(choices=choices,controls=controls))
        base.status(OUT,'calibration_result',variant=name,choices=choices[-2:])
    locked=OUT/'selection_locked.json'
    if not locked.exists():
        winner=min(choices,key=lambda c:(c['metrics']['fnr'],c['metrics']['fpr'],c['variant']!='shallow224',c['roi']))
        base.write(locked,{**winner,'locked_at':base.now(),'protocol_sha256':base.sha(OUT/'protocol.json'),
            'memory_sha256':base.sha(OUT/winner['variant']/'memory.npz')})
    selected=base.read(locked)
    assert selected['protocol_sha256']==base.sha(OUT/'protocol.json')
    assert selected['memory_sha256']==base.sha(OUT/selected['variant']/'memory.npz')
    raw=score(selected['variant'],'test')
    scores=[{**r,'score':r['roi_score'] if selected['roi'] else r['score']} for r in raw]
    active_raw=base.read(ROOT/'output/patchcore-multiview-v2/baseline/test_scores.json')
    active=relabel(active_raw,rows)
    active_threshold=base.read(ROOT/'output/patchcore-multiview-v2/protocol.json')['active_threshold']
    candidate=base.evaluate(scores,selected['threshold']);baseline=base.evaluate(active,active_threshold)
    original=base.read(ROOT/'output/patchcore-multiview-v2/manifest.json')
    result=dict(completed_at=base.now(),selected=selected,baseline=baseline,candidate=candidate,
        original_labels=dict(baseline=base.evaluate(active_raw,active_threshold),candidate=base.evaluate(relabel(scores,original),selected['threshold'])),
        sensitivity=sensitivity(scores,selected['threshold']),
        empirical_gate=base.replacement_gate(candidate['overall'],baseline['overall']),
        deployment_gate=dict(allowed=False,fresh_independent_test=False,unresolved_labels=True),
        deployed=False,active_models_unchanged=True)
    check();base.write(OUT/'comparison.json',result)
    base.status(OUT,'completed',candidate=candidate['overall'],gate=result['empirical_gate'])


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--declare-only',action='store_true');args=parser.parse_args()
    base.setup_runtime()
    declare() if args.declare_only else run()
