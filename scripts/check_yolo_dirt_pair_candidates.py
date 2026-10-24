"""Evaluate verified checkpoints as this training job produces them."""
from pathlib import Path
import subprocess
import sys
from time import monotonic,sleep

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from scripts.prepare_yolo_dirt_pairs import OUT,read,save,digest


def main():
    started=monotonic();results=[]
    for epoch in (2,4):
        marker=OUT/'training'/f'packed-epoch{epoch}.json'
        while not marker.exists():
            if monotonic()-started>3600:raise TimeoutError('Training checkpoint not ready within one hour')
            sleep(5)
        check=read(marker);weights=marker.with_suffix('.pt')
        assert check['weights_sha256']==digest(weights) and check['reload_non_dirt_parity_verified']
        command=[sys.executable,str(ROOT/'scripts/evaluate_yolo_dirt_pairs.py'),'--experiment-root',str(OUT)]
        subprocess.run(command+['triage','--epoch',str(epoch)],cwd=ROOT,check=True)
        folder=OUT/'evaluation'/f'epoch{epoch}';triage=read(folder/'triage.json')
        if triage['eligible_for_full_calibration']:
            subprocess.run(command+['full','--epoch',str(epoch)],cwd=ROOT,check=True)
            selection=read(folder/'selection.json')
        else:selection={'eligible':False,'reason':'Failed fixed real-image calibration triage'}
        results.append({'epoch':epoch,'triage':{k:v for k,v in triage.items() if k not in ('options','candidates')},
                        'full_calibration_run':triage['eligible_for_full_calibration'],'eligible':selection['eligible'],
                        'selection_path':str(folder/'selection.json') if triage['eligible_for_full_calibration'] else None})
        save(OUT/'candidate-progress.json',{'candidates':results,'test_used':False,'candidate_deployed':False})
    eligible=[r for r in results if r['eligible']]
    save(OUT/'calibration-status.json',{'candidates':results,'eligible_for_frozen_test':bool(eligible),
        'test_run':False,'candidate_deployed':False})
    print({'calibration_finished':True,'eligible_for_frozen_test':bool(eligible)},flush=True)


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--experiment-root',type=Path,default=OUT)
    args=parser.parse_args();OUT=args.experiment_root.resolve(strict=True);main()
