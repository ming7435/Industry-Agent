"""Re-evaluate identical single-file weights with same-view class competition."""
from datetime import datetime,timezone
from pathlib import Path
import shutil
import sys

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import read,save,digest

PARENT=ROOT/'output/gear-yolo-dirt-preserve-v14'
OUT=ROOT/'output/gear-yolo-dirt-competition-v15'


def main():
    OUT.mkdir(exist_ok=False);(OUT/'training').mkdir();folder=OUT/'evaluation/epoch4';folder.mkdir(parents=True)
    protocol=read(PARENT/'protocol.json');protocol.update(experiment='dirt_same_view_competition_v15',
        created_at=datetime.now(timezone.utc).isoformat(),dirt_rival_veto=True,
        rationale='Full calibration identified two dirt predictions overlapping stronger blackspot predictions in the same seed view. Independent target decoding must retain this class competition: veto a dirt group when its seed overlaps a stronger/equal other class at IoU>=.5 in that same view. Hair policy unchanged.',
        calibration_feedback_used_for_implementation=True,test_used_for_this_revision=False,
        parent_experiment=str(PARENT),additional_training_epochs=0)
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(PARENT/'baseline-deployment.json'))
    for name in ('packed-epoch4.pt','packed-epoch4.json'):
        shutil.copy2(PARENT/'training'/name,OUT/'training'/name)
    weights=OUT/'training/packed-epoch4.pt'
    assert digest(weights)==read(OUT/'training/packed-epoch4.json')['weights_sha256']
    for name in ('triage-views.json','full-views.json'):
        source=PARENT/'evaluation/epoch4'/name;raw=read(source)
        assert raw['weights_sha256']==digest(weights)
        assert raw['protocol_sha256']==digest(PARENT/'protocol.json')
        assert all(r['split']=='calibration' for r in raw['samples'])
        raw.update(protocol_sha256=digest(OUT/'protocol.json'),reused_extraction_source=str(source),
            reused_extraction_sha256=digest(source),reuse_reason='Identical checkpoint, image manifest and inference grid; only postprocessing changes.')
        save(folder/name,raw)
    evaluation=read(PARENT/'evaluation/epoch4/evaluation-protocol.json')
    evaluation.update(training_protocol_sha256=digest(OUT/'protocol.json'),dirt_rival_veto=True)
    save(folder/'evaluation-protocol.json',evaluation)
    print({'prepared':str(OUT),'weights_identical':True,'calibration_forward_cache_reused':True,'test_used':False},flush=True)


if __name__=='__main__':main()
