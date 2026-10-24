"""Calibration-only salvage check of previously trained target classifiers."""
from copy import deepcopy
import argparse
from datetime import datetime,timezone
from itertools import product
import json
import re
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest
from scripts.yolo_consensus_experiment import target_rows,OUT as PARENT
from app.vision.yolo_evaluation import class_aware_localization

OUT=ROOT/'output/gear-yolo-saved-consensus-v8'
CANDIDATES={
    'target-epoch2':ROOT/'output/gear-yolo-fine-defects-v4/evaluation/target-epoch2/calibration-raw.json',
    'target-epoch4':ROOT/'output/gear-yolo-fine-defects-v4/evaluation/target-epoch4/calibration-raw.json',
    'native-masked-epoch4':ROOT/'output/gear-yolo-fine-defects-v3/evaluation/masked-epoch4/calibration-raw.json'}


def read_target_subset(path,ids):
    """Stream one row at a time; discard unrelated false-box arrays immediately."""
    decoder=json.JSONDecoder();rows=[]
    with path.open(encoding='utf-8') as stream:
        buffer=''
        while True:
            buffer+=stream.read(65536)
            marker=re.search(r'"samples"\s*:\s*\[',buffer)
            if marker:break
            if len(buffer)>1048576:raise ValueError('Missing samples header')
        header=json.loads(buffer[:marker.start()]+'"samples":[]}')
        buffer=buffer[marker.end():]
        while True:
            buffer=buffer.lstrip(' \r\n\t,')
            if buffer.startswith(']'):break
            try:row,end=decoder.raw_decode(buffer)
            except json.JSONDecodeError:
                chunk=stream.read(1048576)
                if not chunk:raise
                buffer+=chunk;continue
            buffer=buffer[end:]
            if row['sample_id'] in ids:
                row.pop('predictions',None)
                for view in row['views']:
                    view['defects']=[p for p in view['defects'] if p['label']=='dirt']
                rows.append(row)
    return header,rows


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--five-only',action='store_true')
    args=parser.parse_args()
    result_path=OUT/('five-view-triage-results.json' if args.five_only else 'triage-results.json')
    OUT.mkdir(exist_ok=True)
    protocol=read(PARENT/'protocol.json');protocol.update(created_at=datetime.now(timezone.utc).isoformat(),
        experiment='saved_classifier_consensus_v8',candidate_calibration_reports={name:str(path) for name,path in CANDIDATES.items()},
        stopping_policy='Evaluate the three pre-existing checkpoints on the same43 calibration subset; no new test evaluation unless a combined standard YOLO candidate passes full188 calibration.')
    if not (OUT/'protocol.json').exists():save(OUT/'protocol.json',protocol)
    else:protocol=read(OUT/'protocol.json')
    assert not result_path.exists()
    if args.five_only:save(OUT/'five-view-extension.json',{'created_at':datetime.now(timezone.utc).isoformat(),
        'reason':'Previous post-NMS five-view calibration had fewer dirt false boxes than all14; evaluate the same fixed grid excluding detail views.',
        'test_used':False,'parameters_changed':False})
    ids={r['sample_id'] for r in read(PARENT/'calibration-triage-views.json')['samples']}
    grid=protocol['consensus_grid'];gates=protocol['calibration_gates'];results={}
    for name,path in CANDIDATES.items():
        raw,rows=read_target_subset(path,ids)
        if args.five_only:
            for row in rows:row['views']=[v for v in row['views'] if v['kind']!='detail']
        print({'loaded':name,'calibration_images':len(rows)},flush=True)
        assert len(rows)==43 and all(r['split']=='calibration' for r in rows)
        options=[]
        for votes,support,strong,fuse in product(grid['min_views'],grid['support_floor'],[1.,.7],grid['fuse']):
            params={'min_views':votes,'support_floor':support,'single_floor':strong,'fuse':fuse,'aspect':1.}
            subset=target_rows(rows,'dirt',params);valid=[]
            for threshold in protocol['confidence_grid']:
                if sum(p['confidence']>=threshold for r in subset for p in r['predictions'])>10+gates['target_fp_max']['dirt']:continue
                metrics=class_aware_localization(subset,threshold,.5)
                if metrics['fp']<=gates['target_fp_max']['dirt']:
                    valid.append({'threshold':threshold,**{k:metrics[k] for k in ('tp','fn','fp')}})
            best=max(valid,key=lambda x:(x['tp'],-x['fp'],x['threshold']))
            options.append({'parameters':params,'best':best})
        options.sort(key=lambda x:(x['best']['tp'],-x['best']['fp'],x['best']['threshold']),reverse=True)
        results[name]={'weights_sha256':raw['weights_sha256'],'calibration_raw_sha256':digest(path),
            'options':options,'passed':options[0]['best']['tp']>=gates['dirt_tp_min']}
        print({'name':name,'best':options[0],'passed':results[name]['passed']},flush=True)
    save(result_path,{'candidates':results,'test_used':False,'deployment_allowed':False,'five_only':args.five_only})


if __name__=='__main__':main()
