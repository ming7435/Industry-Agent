"""Rank native-crop checkpoints using calibration only; never authorize deployment."""
from copy import deepcopy
import argparse
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_native_hard_examples import OUT
from scripts.train_yolo_fine_defects import read,save,SOURCE
from scripts.evaluate_yolo_fine_defects import raw_config,merge_variant
from app.vision.yolo_evaluation import class_aware_localization


def main():
    global OUT
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--experiment-root',type=Path,default=OUT)
    args=parser.parse_args();OUT=args.experiment_root.resolve(strict=True)
    protocol=read(OUT/'protocol.json')
    classes=read(SOURCE/'manifest.json')['classes']
    candidates=[]
    for path in sorted((OUT/'evaluation').glob('*/calibration-triage-raw.json')):
        raw=read(path)
        for labels in ([],['hair'],['dirt'],['dirt','hair']):
            for aspect in (1.,1.5):
                config={**raw_config(classes),'detail_grid_size':3 if labels else 0,'detail_labels':labels,
                        'hair_min_aspect_ratio':aspect,'hair_suppress_contained':True}
                rows=merge_variant(raw['samples'],config)
                best={}
                for label in ('dirt','hair'):
                    subset=[{'ground_truth':[g for g in r['ground_truth'] if g['label']==label],
                             'predictions':[p for p in r['predictions'] if p['label']==label]} for r in rows]
                    options=[]
                    for threshold in protocol['confidence_grid']:
                        counts=class_aware_localization(subset,threshold,.5)
                        if counts['fp']<=protocol['calibration_gates']['target_fp_max'][label]:
                            options.append({'threshold':threshold,**{k:counts[k] for k in ('tp','fp','fn')}})
                    best[label]=max(options,key=lambda s:(s['tp'],-s['fp'],-s['threshold']))
                passes=all(best[label]['tp']>=protocol['calibration_gates'][label+'_tp_min'] for label in best)
                candidates.append({'name':path.parent.name,'weights_sha256':raw['weights_sha256'],
                    'detail_labels':labels,'hair_min_aspect_ratio':aspect,'targets':best,'triage_target_gate_passed':passes,
                    'deployment_allowed':False,'requires_full_188_image_calibration':True})
    candidates.sort(key=lambda c:(c['triage_target_gate_passed'],
         min(c['targets']['dirt']['tp']/3,c['targets']['hair']['tp']/4),
         sum(s['tp'] for s in c['targets'].values()),-sum(s['fp'] for s in c['targets'].values())),reverse=True)
    save(OUT/'calibration-triage-ranking.json',candidates)
    for candidate in candidates[:8]:
        print(candidate,flush=True)


if __name__=='__main__':
    main()
