"""Predeclared shallow-feature PatchCore study after reviewed-label calibration."""
from __future__ import annotations

import argparse
from collections import Counter
import gc
from pathlib import Path
import time

import patchcore_clean_experiment as clean
from patchcore_foreground import foreground_mask
from app.vision.algorithms import PatchCoreDetector, _feature_matrix

base = clean.base
ROOT = base.ROOT
PARENT = ROOT / 'output/patchcore-clean-v3'


class FineDetector(PatchCoreDetector):
    """Same frozen ResNet18, layer1/layer2 features, stride-4 output grid."""
    def _load_extractor(self):
        with self._lock:
            if self._extractor is not None:
                return self._extractor
            import torch
            from torchvision.models import resnet18
            from torchvision.models.feature_extraction import create_feature_extractor
            model = resnet18(weights=None)
            state = torch.load(str(self.weights), map_location='cpu', weights_only=True)
            if isinstance(state, dict) and 'state_dict' in state:
                state = state['state_dict']
            model.load_state_dict(state, strict=True)
            model.eval().requires_grad_(False)
            self._extractor = create_feature_extractor(model, return_nodes={'layer1':'layer1','layer2':'layer2'}).eval()
            self._torch = torch
            return self._extractor

    def _extract_features(self, image):
        import numpy as np
        from app.vision.preprocessing import prepare_patchcore_image
        extractor = self._load_extractor()
        torch = self._torch
        canvas, _ = prepare_patchcore_image(image,self.config)
        pixels = np.asarray(canvas,dtype=np.float32)/255.
        pixels = (pixels-np.array([.485,.456,.406],np.float32))/np.array([.229,.224,.225],np.float32)
        tensor = torch.from_numpy(pixels.transpose(2,0,1).copy()).unsqueeze(0)
        with self._lock,torch.inference_mode():
            values=extractor(tensor)
            fine=torch.nn.functional.avg_pool2d(values['layer1'],3,1,1)
            medium=torch.nn.functional.avg_pool2d(values['layer2'],3,1,1)
            medium=torch.nn.functional.interpolate(medium,size=fine.shape[-2:],mode='bilinear',align_corners=False)
            embedding=torch.cat([fine,medium],dim=1)
            grid=tuple(int(x) for x in embedding.shape[-2:])
            features=embedding.permute(0,2,3,1).reshape(-1,192).cpu().numpy()
        return _feature_matrix(features),grid


def declare(out):
    if (out/'protocol.json').exists():
        return check(out)
    clean.check(PARENT)
    protocol=dict(created_at=base.now(),hypothesis='Shallower stride-4 features retain small stains lost by the current layer2/layer3 aggregation.',
        feature_spec=dict(backbone='resnet18_layer1_layer2',dimension=192,input_size=224,pool=3,grid_stride=4),
        run_rule='Run only if best parent calibration FNR exceeds 1%; no held-out results used to decide.',
        variants=[dict(roi=False),dict(roi=True)],
        selection_rule='Minimum calibration FNR, then FPR; ties prefer existing layer2/layer3, lower input size, no ROI.',
        threshold_rule='Smallest threshold with calibration FPR <= 1%.',
        parent_protocol_sha256=base.sha(PARENT/'protocol.json'),
        review_sha256=base.sha(clean.AUDIT/'review-decisions.json'),
        manifest_sha256=base.sha(PARENT/'manifest.json'),
        source_sha256=base.sha(__file__),weights_sha256=base.sha(base.WEIGHTS),
        active_hashes=base.read(PARENT/'protocol.json')['active_hashes'],
        data_scope=base.read(PARENT/'protocol.json')['scope'],
        test_caveat=base.read(PARENT/'protocol.json')['test_caveat'])
    out.mkdir(parents=True,exist_ok=True)
    base.write(out/'protocol.json',protocol)
    base.write(out/'manifest.json',base.read(PARENT/'manifest.json'))
    base.status(out,'declared_before_parent_test')
    return protocol


def check(out):
    clean.check(PARENT)
    p=base.read(out/'protocol.json')
    if p['source_sha256']!=base.sha(__file__) or p['parent_protocol_sha256']!=base.sha(PARENT/'protocol.json') or p['manifest_sha256']!=base.sha(PARENT/'manifest.json'):
        raise ValueError('Frozen study changed')
    if base.read(out/'manifest.json')!=base.read(PARENT/'manifest.json'):
        raise ValueError('Frozen manifest changed')
    return p


def build(out):
    import numpy as np
    from app.vision.algorithms import greedy_coreset
    from app.vision.evaluation import load_rgb
    from app.vision.preprocessing import _patchcore_transform
    check(out)
    if (out/'model.json').exists(): return
    rows=[r for r in base.read(out/'manifest.json') if r['split']=='train']
    config=dict(input_size=224,resize_mode='letterbox',contrast='none',blur_sigma=2.)
    detector=FineDetector(str(base.WEIGHTS),config)
    path=out/'feature_candidates.npy'
    progress=out/'feature_progress.json'
    completed=base.read(progress)['completed'] if progress.exists() else 0
    features=np.lib.format.open_memmap(path,mode='r+' if path.exists() else 'w+',dtype=np.float32,shape=(5,len(rows),32,192))
    started=time.perf_counter()
    for index in range(completed,len(rows)):
        row=rows[index]
        if base.sha(row['path'])!=row['file_sha256']: raise ValueError('Source changed')
        with load_rgb(row['path']) as image:
            for view,box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile:
                    values,grid=detector._extract_features(tile)
                    left,top,right,bottom=_patchcore_transform(tile.size,config)['content_box']
                    xs=(np.arange(grid[1])+.5)*224/grid[1]
                    ys=(np.arange(grid[0])+.5)*224/grid[0]
                    valid=((ys>=top)&(ys<bottom))[:,None]&((xs>=left)&(xs<right))[None,:]
                    features[view,index]=greedy_coreset(values[valid.reshape(-1)],ratio=1.,max_size=32)
        if (index+1)%25==0 or index+1==len(rows):
            features.flush()
            base.write(progress,dict(completed=index+1,total=len(rows)))
            base.status(out,'extracting_shallow_features',completed=index+1,total=len(rows),elapsed_seconds=round(time.perf_counter()-started,1))
    del features,detector
    gc.collect()
    features=np.load(path,mmap_mode='r',allow_pickle=False)
    banks=[]
    for view in range(5):
        base.status(out,'selecting_shallow_memory',view=view)
        banks.append(greedy_coreset(features[view].reshape(-1,192),ratio=1.,max_size=1024))
    np.savez_compressed(out/'memory.npz',**{f'view_{i}':v for i,v in enumerate(banks)})
    base.write(out/'model.json',dict(backbone='resnet18_layer1_layer2',dimension=192,preprocessing=config,
        training_images=len(rows),training_group_ids=[r['group_id'] for r in rows],total_memory=5120,memory_sha256=base.sha(out/'memory.npz')))


def score(out,split):
    import numpy as np
    from app.vision.evaluation import load_rgb
    check(out)
    metadata=base.read(out/'model.json')
    if base.sha(out/'memory.npz')!=metadata['memory_sha256']: raise ValueError('Memory changed')
    detector=FineDetector(str(base.WEIGHTS),metadata['preprocessing'])
    with np.load(out/'memory.npz',allow_pickle=False) as saved:
        banks=[saved[f'view_{i}'].copy() for i in range(5)]
    samples=[r for r in base.read(out/'manifest.json') if r['split']==split]
    path=out/f'{split}_scores.json'
    scores=base.read(path) if path.exists() else []
    if len(scores)>len(samples) or any(s['sample_id']!=r['sample_id'] for s,r in zip(scores,samples)):
        raise ValueError('Score prefix mismatch')
    for row in samples[len(scores):]:
        if base.sha(row['path'])!=row['file_sha256']: raise ValueError('Image changed')
        start=time.perf_counter();raw=[];roi=[]
        with load_rgb(row['path']) as image:
            for view,box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile:
                    heatmap=detector.anomaly_map(tile,banks[view])
                    raw.append(float(heatmap.max()));roi.append(float(heatmap[foreground_mask(tile)].max()))
        scores.append({**row,'score':max(raw),'roi_score':max(roi),'view_scores':raw,'roi_view_scores':roi,'seconds':time.perf_counter()-start})
        base.write(path,scores)
        if len(scores)%10==0 or len(scores)==len(samples):
            base.status(out,'scoring_shallow_'+split,completed=len(scores),total=len(samples))
    if split=='calibration':
        choices=[]
        for roi in (False,True):
            key='roi_score' if roi else 'score'
            c=base.select_threshold([r[key] for r in scores if r['label']=='normal'],[r[key] for r in scores if r['label']=='defect'],max_fpr=.01)
            c.update(family='shallow',size=224,roi=roi,rule='Minimum threshold with calibration FPR <= 1%')
            choices.append(c)
        base.write(out/'calibration.json',choices)
        base.status(out,'shallow_calibration_result',choices=choices)
    return scores


def finish(out):
    check(out)
    choices=[{**c,'family':'existing'} for size in (224,448) for c in base.read(PARENT/str(size)/'calibration.json')]
    if min(c['metrics']['fnr'] for c in choices)>.01:
        build(out);score(out,'calibration')
        choices+=base.read(out/'calibration.json')
    locked_path=out/'selection_locked.json'
    if locked_path.exists(): selected=base.read(locked_path)
    else:
        winner=min(choices,key=lambda c:(c['metrics']['fnr'],c['metrics']['fpr'],c['family']!='existing',c['size'],c['roi']))
        source=out if winner['family']=='shallow' else PARENT/str(winner['size'])
        selected={**winner,'locked_at':base.now(),'memory_sha256':base.sha(source/'memory.npz'),
                  'protocol_sha256':base.sha(out/'protocol.json'),'candidate_directory':str(source)}
        base.write(locked_path,selected)
    if selected['memory_sha256']!=base.sha(Path(selected['candidate_directory'])/'memory.npz') or selected['protocol_sha256']!=base.sha(out/'protocol.json'):
        raise ValueError('Frozen selection changed')
    raw=score(out,'test') if selected['family']=='shallow' else clean.score(PARENT,selected['size'],'test')
    rows=[{**r,'score':r['roi_score'] if selected['roi'] else r['score']} for r in raw]
    candidate=base.evaluate(rows,selected['threshold'])
    parent=base.read(PARENT/'comparison.json')
    old_labels={r['sample_id']:r for r in base.read(clean.OLD/'manifest.json')}
    original=base.evaluate([{**r,'label':old_labels[r['sample_id']]['label'],'scenario':old_labels[r['sample_id']]['scenario']} for r in rows],selected['threshold'])
    result=dict(finished_at=base.now(),selected=selected,calibration_choices=choices,candidate=candidate,
        baseline=parent['baseline'],original_labels=dict(baseline=parent['original_labels']['baseline'],candidate=original),
        baseline_reference_sha256=base.sha(PARENT/'comparison.json'),gate=base.replacement_gate(candidate['overall'],parent['baseline']['overall']),
        protocol=base.read(out/'protocol.json'),deployed=False,active_models_unchanged=True)
    check(out);base.write(out/'comparison.json',result)
    base.status(out,'completed',candidate=candidate['overall'],gate=result['gate'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'output/patchcore-feature-study-v4')
    parser.add_argument('--stage',choices=('declare','run'),default='run')
    args=parser.parse_args()
    if args.stage=='declare': declare(args.output.resolve());return
    base.setup_runtime();declare(args.output.resolve());finish(args.output.resolve())


if __name__=='__main__':main()
