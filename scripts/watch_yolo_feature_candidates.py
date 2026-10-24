"""Evaluate predetermined checkpoints as they become available in this run."""
from pathlib import Path
import subprocess
import sys
from time import monotonic,sleep

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.train_yolo_fine_defects import read,save,digest
from scripts.train_yolo_feature_separation import OUT


def main():
    started=monotonic();decisions=[]
    for epoch in (2,4):
        print({'waiting_for_complete_epoch':epoch},flush=True)
        while True:
            path=OUT/'training/history.json'
            try:history=read(path) if path.exists() else []
            except ValueError:history=[]
            record=next((r for r in history if r['epoch']==epoch),None)
            if record:break
            if monotonic()-started>7200:raise TimeoutError('Training checkpoint did not arrive within two hours')
            sleep(2)
        weights=OUT/f'training/epoch{epoch}.pt';assert digest(weights)==record['sha256']
        name=f'features-epoch{epoch}'
        command=[sys.executable,str(ROOT/'scripts/evaluate_yolo_fine_defects.py'),
                 '--experiment-root',str(OUT),'--weights',str(weights),'--name',name,'--split','calibration']
        subprocess.run(command+['--triage'],cwd=ROOT,check=True)
        subprocess.run([sys.executable,str(ROOT/'scripts/rank_yolo_native_candidates.py'),'--experiment-root',str(OUT)],cwd=ROOT,check=True)
        ranked=[r for r in read(OUT/'calibration-triage-ranking.json') if r['name']==name]
        survivor=any(r['triage_target_gate_passed'] for r in ranked)
        decision={'epoch':epoch,'name':name,'weights_sha256':record['sha256'],
                  'triage_passed':survivor,'deployment_allowed':False}
        if survivor:
            subprocess.run(command,cwd=ROOT,check=True)
            selection=read(OUT/'evaluation'/name/'selection.json')
            decision['full_calibration_passed']=selection['eligible']
        decisions.append(decision);save(OUT/'calibration-progress.json',decisions)
        print(decision,flush=True)
        if decision.get('full_calibration_passed'):
            print({'calibration_candidate_ready':name,'test_required':True},flush=True)
    print({'calibration_finished':True,'decisions':decisions},flush=True)


if __name__=='__main__':main()
