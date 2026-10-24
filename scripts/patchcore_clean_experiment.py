"""Rebuild PatchCore after explicit brown-stain label review; never auto-deploy."""
from __future__ import annotations

import argparse
from collections import Counter
import gc
import json
from pathlib import Path
import shutil
import time

import patchcore_multiview_experiment as base
from patchcore_foreground import foreground_mask

ROOT = base.ROOT
OLD = ROOT / 'output/patchcore-multiview-v2'
AUDIT = ROOT / 'output/patchcore-label-audit-v1'


def initialize(out):
    if (out / 'protocol.json').exists():
        return check(out)
    rows = base.read(AUDIT / 'corrected-manifest.json')
    base.validate_manifest(rows)
    original = base.read(OLD / 'manifest.json')
    assert {r['sample_id'] for r in rows if r['split'] == 'test'} == {r['sample_id'] for r in original if r['split'] == 'test'}
    protocol = dict(created_at=base.now(), label_rule='Visible brown marks are defects per human instruction.',
        original_manifest_sha256=base.sha(OLD / 'manifest.json'),
        corrected_manifest_sha256=base.sha(AUDIT / 'corrected-manifest.json'),
        review_sha256=base.sha(AUDIT / 'review-decisions.json'),
        source_hashes={str(p.relative_to(ROOT)): base.sha(p) for p in [Path(__file__),
            ROOT / 'scripts/patchcore_foreground.py', Path(base.__file__),
            ROOT / 'services/agent-service/app/vision/algorithms.py',
            ROOT / 'services/agent-service/app/vision/preprocessing.py',
            ROOT / 'services/agent-service/app/vision/evaluation.py']},
        weights_sha256=base.sha(base.WEIGHTS), active_hashes=base.read(OLD / 'protocol.json')['active_hashes'],
        active_threshold=base.read(OLD / 'protocol.json')['active_threshold'],
        variants=[dict(size=s, roi=roi) for s in (224, 448) for roi in (False, True)],
        memory_per_view=1024, per_image_candidates=32,
        threshold_rule='Calibration only: smallest threshold with FPR <= 1%; image score is maximum view score.',
        selection_rule='Minimum calibration FNR, then FPR, then lower resolution, then no ROI.',
        gates=dict(max_fnr=.01, max_fpr=.01, no_regression_against_active=True),
        partition_counts={s:dict(Counter(r['label'] for r in rows if r['split']==s)) for s in ('train','calibration','test','quarantine')},
        feature_reuse='Frozen pretrained ResNet18 per-image features may be reused. Global memory selection is rebuilt using ONLY retained normal train indices.',
        test_caveat='Previously evaluated public photographs. Labels of two test images changed under an explicit human rule after visual review, never by model scores. Not a fresh blind production acceptance set.',
        scope='Real public MANTA five-view gear composites, grouped by original filename; batch identity unavailable.')
    out.mkdir(parents=True, exist_ok=True)
    base.write(out / 'protocol.json', protocol)
    base.write(out / 'manifest.json', rows)
    return protocol


def check(out):
    protocol = base.read(out / 'protocol.json')
    for path, digest in {**protocol['source_hashes'], **protocol['active_hashes']}.items():
        if base.sha(ROOT / path) != digest:
            raise ValueError('Frozen source or active model changed: ' + path)
    if base.sha(base.WEIGHTS) != protocol['weights_sha256'] or base.sha(AUDIT / 'corrected-manifest.json') != protocol['corrected_manifest_sha256']:
        raise ValueError('Backbone or label manifest changed')
    if base.read(out / 'manifest.json') != base.read(AUDIT / 'corrected-manifest.json'):
        raise ValueError('Experiment manifest changed')
    return protocol


def build(out, size):
    import numpy as np
    from app.vision.algorithms import PatchCoreDetector, greedy_coreset
    from app.vision.evaluation import load_rgb
    from app.vision.preprocessing import _patchcore_transform

    check(out)
    dest = out / str(size)
    dest.mkdir(exist_ok=True)
    if (dest / 'model.json').exists():
        return
    original = [r for r in base.read(OLD / 'manifest.json') if r['split']=='train']
    retained = {r['sample_id'] for r in base.read(out / 'manifest.json') if r['split']=='train'}
    keep = [i for i,r in enumerate(original) if r['sample_id'] in retained]
    config = dict(input_size=size, resize_mode='letterbox', contrast='none', blur_sigma=2.)
    source_cache = OLD / str(size) / 'feature_candidates.npy'
    source_completed = base.read(OLD / str(size) / 'feature_progress.json')['completed']
    source_hash = base.sha(source_cache)
    cache = source_cache if source_completed == len(original) else dest / 'feature_candidates.npy'
    if cache != source_cache and not cache.exists():
        shutil.copyfile(source_cache, cache)
        base.write(dest / 'cache-origin.json', dict(source=str(source_cache), sha256=source_hash,
            verified_prefix=source_completed, shape=[5,len(original),32,384]))
    checkpoint = dest / 'feature_progress.json'
    completed = base.read(checkpoint)['completed'] if checkpoint.exists() else source_completed
    if completed < len(original):
        features = np.load(cache, mmap_mode='r+', allow_pickle=False)
        detector = PatchCoreDetector(str(base.WEIGHTS), config)
        started = time.perf_counter()
        for index in range(completed,len(original)):
            row = original[index]
            if row['sample_id'] in retained:
                if base.sha(row['path']) != row['file_sha256']:
                    raise ValueError('Training image changed')
                with load_rgb(row['path']) as image:
                    for view, box in enumerate(base.view_boxes(image.size)):
                        with image.crop(box) as tile:
                            values, grid = detector._extract_features(tile)
                            left,top,right,bottom = _patchcore_transform(tile.size,config)['content_box']
                            xs=(np.arange(grid[1])+.5)*size/grid[1]
                            ys=(np.arange(grid[0])+.5)*size/grid[0]
                            valid=((ys>=top)&(ys<bottom))[:,None]&((xs>=left)&(xs<right))[None,:]
                            features[view,index] = greedy_coreset(values[valid.reshape(-1)],ratio=1.,max_size=32)
            if (index+1)%25==0 or index+1==len(original):
                features.flush()
                base.write(checkpoint,dict(completed=index+1,total=len(original)))
                base.status(out,'extracting_clean_normal_views',input_size=size,completed=index+1,total=len(original),
                            elapsed_seconds=round(time.perf_counter()-started,1))
        del features,detector
        gc.collect()
    features=np.load(cache,mmap_mode='r',allow_pickle=False)
    banks=[]
    for view in range(5):
        base.status(out,'rebuilding_clean_memory',input_size=size,view=view,normal_images=len(keep))
        bank=greedy_coreset(features[view,keep].reshape(-1,384),ratio=1.,max_size=1024)
        banks.append(bank)
    np.savez_compressed(dest/'memory.npz',**{f'view_{v}':b for v,b in enumerate(banks)})
    base.write(dest/'model.json',dict(preprocessing=config,memory_sha256=base.sha(dest/'memory.npz'),
        training_images=len(keep),training_group_ids=[original[i]['group_id'] for i in keep],
        excluded_train_group_ids=[r['group_id'] for r in original if r['sample_id'] not in retained],
        reused_feature_source=str(source_cache),reused_feature_sha256=source_hash,verified_prefix=source_completed,
        total_memory=5120))
    base.status(out,'clean_memory_ready',input_size=size,normal_images=len(keep))


def score(out,size,split):
    import numpy as np
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.evaluation import load_rgb
    check(out)
    dest=out/str(size)
    metadata=base.read(dest/'model.json')
    if base.sha(dest/'memory.npz') != metadata['memory_sha256']:
        raise ValueError('Candidate memory changed')
    detector=PatchCoreDetector(str(base.WEIGHTS),metadata['preprocessing'])
    with np.load(dest/'memory.npz',allow_pickle=False) as saved:
        banks=[saved[f'view_{i}'].copy() for i in range(5)]
    samples=[r for r in base.read(out/'manifest.json') if r['split']==split]
    path=dest/f'{split}_scores.json'
    scores=base.read(path) if path.exists() else []
    if len(scores)>len(samples) or any(s['sample_id']!=r['sample_id'] for s,r in zip(scores,samples)):
        raise ValueError('Score prefix mismatch')
    for row in samples[len(scores):]:
        if base.sha(row['path'])!=row['file_sha256']:
            raise ValueError('Evaluation image changed')
        started=time.perf_counter()
        raw,roi=[],[]
        with load_rgb(row['path']) as image:
            for view,box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile:
                    heatmap=detector.anomaly_map(tile,banks[view])
                    region=foreground_mask(tile)
                    raw.append(float(heatmap.max()))
                    roi.append(float(heatmap[region].max()))
        scores.append({**row,'score':max(raw),'roi_score':max(roi),'view_scores':raw,'roi_view_scores':roi,
                       'seconds':time.perf_counter()-started})
        base.write(path,scores)
        if len(scores)%10==0 or len(scores)==len(samples):
            base.status(out,'scoring_clean_'+split,input_size=size,completed=len(scores),total=len(samples))
    if split=='calibration':
        choices=[]
        for use_roi in (False,True):
            key='roi_score' if use_roi else 'score'
            selected=base.select_threshold([r[key] for r in scores if r['label']=='normal'],
                                           [r[key] for r in scores if r['label']=='defect'],max_fpr=.01)
            selected.update(size=size,roi=use_roi,rule='Minimum threshold with calibration FPR <= 1%')
            choices.append(selected)
        base.write(dest/'calibration.json',choices)
        base.status(out,'clean_calibration_result',input_size=size,choices=choices)
    return scores


def final_test(out):
    protocol=check(out)
    lock=out/'selection_locked.json'
    if lock.exists():
        selected=base.read(lock)
    else:
        choices=[c for size in (224,448) for c in base.read(out/str(size)/'calibration.json')]
        winner=min(choices,key=lambda c:(c['metrics']['fnr'],c['metrics']['fpr'],c['size'],c['roi']))
        selected={**winner,'locked_at':base.now(),'protocol_sha256':base.sha(out/'protocol.json'),
                  'memory_sha256':base.sha(out/str(winner['size'])/'memory.npz')}
        base.write(lock,selected)
    if base.sha(out/'protocol.json')!=selected['protocol_sha256'] or base.sha(out/str(selected['size'])/'memory.npz')!=selected['memory_sha256']:
        raise ValueError('Frozen candidate changed')
    rows=score(out,selected['size'],'test')
    candidate_rows=[{**r,'score':r['roi_score'] if selected['roi'] else r['score']} for r in rows]
    candidate=base.evaluate(candidate_rows,selected['threshold'])
    # Rerun the actual current detector on the same source images; only its
    # labels change for the explicitly reviewed business-rule comparison.
    old_scores=base.score(OLD,0,'test')
    revised={r['sample_id']:r for r in rows}
    baseline_rows=[{**r,'label':revised[r['sample_id']]['label'],'scenario':revised[r['sample_id']]['scenario']}
                   for r in old_scores]
    baseline=base.evaluate(baseline_rows,protocol['active_threshold'])
    original_baseline=base.evaluate(old_scores,protocol['active_threshold'])
    original_labels={r['sample_id']:r for r in base.read(OLD/'manifest.json')}
    original_candidate=base.evaluate([{**r,'label':original_labels[r['sample_id']]['label'],
                                      'scenario':original_labels[r['sample_id']]['scenario']} for r in candidate_rows],selected['threshold'])
    result=dict(finished_at=base.now(),selected=selected,baseline=baseline,candidate=candidate,
                original_labels=dict(baseline=original_baseline,candidate=original_candidate),
                gate=base.replacement_gate(candidate['overall'],baseline['overall']),protocol=protocol,
                deployed=False,active_models_unchanged=True)
    check(out)
    base.write(out/'comparison.json',result)
    base.status(out,'completed',baseline=baseline['overall'],candidate=candidate['overall'],gate=result['gate'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'output/patchcore-clean-v3')
    parser.add_argument('--stage',choices=('all','build','calibrate','test'),default='all')
    parser.add_argument('--size',type=int,choices=(224,448),default=224)
    args=parser.parse_args()
    base.setup_runtime()
    out=args.output.resolve()
    initialize(out)
    if args.stage=='all':
        for size in (224,448):
            build(out,size)
            score(out,size,'calibration')
        final_test(out)
    elif args.stage=='build': build(out,args.size)
    elif args.stage=='calibrate': score(out,args.size,'calibration')
    elif args.stage=='test': final_test(out)


if __name__=='__main__':
    main()
