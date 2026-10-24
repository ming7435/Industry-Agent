"""Train-only confuser crops and reduced synthetic weight after scale-matched diagnosis."""
from collections import Counter
from copy import deepcopy
from datetime import datetime,timezone
from pathlib import Path
import random
import sys

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import SOURCE,read,save,digest
from scripts.train_yolo_fine_defects import crop_truth
from app.vision.yolo_multiview import crop_windows

PARENT=ROOT/'output/gear-yolo-dirt-scale-v12'
OUT=ROOT/'output/gear-yolo-dirt-balanced-v13';DATA=OUT/'dataset';SEED=2026102303


def main():
    from PIL import Image,ImageDraw
    # A preparation that stopped before writing any images may be retried.
    assert not (DATA/'manifest.json').exists() and not (OUT/'features').exists()
    assert not list((DATA/'images').glob('*'))
    OUT.mkdir(exist_ok=True);(DATA/'images').mkdir(parents=True,exist_ok=True)
    protocol=read(PARENT/'protocol.json')
    protocol.update(experiment='dirt_balanced_confusers_v13',created_at=datetime.now(timezone.utc).isoformat(),seed=SEED,
        learning_rate=.00001,positive_teacher_preservation=2.,reuse_feature_experiment=str(PARENT),
        real_dirt_replay_kinds=['real_whole','real_dirt_inference_view'],real_dirt_replay_total=8,
        rationale='Scale-matched candidate still ranks annotated black spots above real dirt. Real dirt inputs were strongly outnumbered by synthetic ones. Add genuine train-only confusing defect views; cap synthetic views at300 and replay real positives.',
        training_policy='Only original training groups. Keep all779 real frames and600 texture/edge negatives; add up to400 annotated blackspot/hair views; use300 synthetic inputs with clean pairs; replay real dirt8 times.',
        training_objective='Top3 geometric positives + top128 negative BCE + .05 negative teacher preservation + 2.0 confident target preservation.',
        calibration_used_for_training=False,test_used_for_training=False,
        selection='Calibration-only fixed epoch2/4 candidates; no candidate test until fixed43 and full188 gates pass.')
    protocol.pop('synthetic_pairs',None)
    protocol.pop('real_dirt_crop_variants',None)
    protocol.update(synthetic_input_cap=300,parent_data_sha256=digest(PARENT/'dataset/manifest.json'))
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(PARENT/'baseline-deployment.json'))
    source=read(SOURCE/'manifest.json');assert digest(SOURCE/'manifest.json')==protocol['manifest_sha256']
    originals={r['sample_id']:r for r in source['samples'] if r['split']=='train'}
    held={r['group_id'] for r in source['samples'] if r['split']!='train'}
    old=read(PARENT/'dataset/manifest.json');previous={r['sample_id']:r for r in old['samples']}
    rng=random.Random(SEED);chosen={}
    for row in old['samples']:
        if row['kind'] in ('real_whole','real_texture_edge_background','real_dirt_inference_view'):
            chosen[row['sample_id']]=deepcopy(row)
    for kind in ('synthetic_whole','synthetic_inference_tile','synthetic_inference_detail'):
        pool=[r for r in old['samples'] if r['kind']==kind];rng.shuffle(pool)
        for row in pool[:100]:
            chosen[row['sample_id']]=deepcopy(row)
            clean=previous[row['paired_clean_id']];chosen[clean['sample_id']]=deepcopy(clean)
    rows=list(chosen.values());candidates=[]
    for row in originals.values():
        if not any(g['label'] in ('darkspot','hair') for g in row['ground_truth']):continue
        with Image.open(SOURCE/row['path']) as image:size=image.size
        for fraction,grid in ((.6,2),(.4,3)):
            for window in crop_windows(size,fraction,grid):
                truth=crop_truth(row['ground_truth'],window)
                if not truth or any(g['label']=='dirt' for g in truth):continue
                confusers=[g['label'] for g in truth if g['label'] in ('darkspot','hair')]
                if confusers:candidates.append((row,window,truth,'hair' if 'hair' in confusers else 'darkspot'))
    rng.shuffle(candidates)
    # Genuine fine strands get an explicit quota; remaining selections are black spots.
    candidates.sort(key=lambda r:r[3]!='hair');counts=Counter();labels=Counter();picked=[]
    for row,window,truth,label in candidates:
        if counts[row['sample_id']]>=2 or (label=='hair' and labels[label]>=120):continue
        if len(picked)>=400:break
        counts[row['sample_id']]+=1;labels[label]+=1;picked.append((row,window,truth,label))
    assert len(picked)==400,('Insufficient confuser crops',len(picked))
    for i,(source_row,window,truth,label) in enumerate(picked):
        assert digest(SOURCE/source_row['path'])==source_row['file_sha256']
        path=DATA/'images'/f'real_confuser_view-{i:04d}.png'
        with Image.open(SOURCE/source_row['path']) as image:
            crop=image.convert('RGB').crop(window);crop.save(path);width,height=crop.size;crop.close()
        rows.append({'sample_id':path.stem,'source_id':source_row['sample_id'],'source_group':source_row['group_id'],
            'source_split':'train','split':'train','kind':'real_confuser_inference_view','confuser_label':label,
            'path':str(path),'width':width,'height':height,'ground_truth':truth,'window':list(window),
            'file_sha256':digest(path),'existing':False})
    for row in rows:
        assert row['source_group'] not in held and row['source_id'] in originals
        assert row['split']==row['source_split']=='train'
        if row.get('donor'):assert row['donor']['source_group'] not in held
    assert len({r['sample_id'] for r in rows})==len(rows)
    document={'samples':rows,'classes':old['classes'],'source_manifest_sha256':digest(SOURCE/'manifest.json'),
        'test_used':False,'calibration_used':False,'new_independent_photos':0,'parent_dataset_sha256':digest(PARENT/'dataset/manifest.json')}
    save(DATA/'manifest.json',document)
    audit={'dataset_manifest_sha256':digest(DATA/'manifest.json'),'source_groups_disjoint':True,
        'synthetic_placement_audit_parent':str(PARENT/'data-audit.json'),'synthetic_placement_audit_sha256':digest(PARENT/'data-audit.json'),
        'confuser_views':400,'confuser_source_photos':len(counts),'confuser_labels':dict(labels),
        'original_annotations_preserved':True,'test_used':False,'calibration_used':False}
    save(OUT/'placement-audit.json',audit);save(OUT/'data-audit.json',audit)
    summary={'training_inputs':len(rows),'source_photos':len({r['source_id'] for r in rows}),'kinds':dict(Counter(r['kind'] for r in rows)),
        'new_independent_photos':0,'synthetic_images':sum(bool(r.get('synthetic')) for r in rows),
        'distinct_synthetic_stains':len({r['parent_stain_id'] for r in rows if r.get('synthetic')}),
        'confuser_source_photos':len(counts),'confuser_labels':dict(labels)}
    save(OUT/'data-summary.json',summary)
    for name,pool in [('synthetic-audited.jpg',[r for r in rows if r.get('synthetic')]),
                      ('confuser-audited.jpg',[r for r in rows if r['kind']=='real_confuser_inference_view'])]:
        sheet=Image.new('RGB',(1200,960),'#edf1f5');draw=ImageDraw.Draw(sheet)
        for i,row in enumerate(pool[::max(1,len(pool)//20)][:20]):
            target=row.get('synthetic_bbox') or next(g['bbox'] for g in row['ground_truth'] if g['label']==row['confuser_label'])
            cx=(target[0]+target[2])/2;cy=(target[1]+target[3])/2;window=[int(cx-50),int(cy-50),int(cx+50),int(cy+50)]
            with Image.open(row['path']) as image:
                tile=image.crop(window).resize((224,210));pen=ImageDraw.Draw(tile)
                pen.rectangle([(v-window[j%2])*(2.24 if j%2==0 else 2.1) for j,v in enumerate(target)],outline='red',width=2)
                x,y=i%5*240,i//5*240;sheet.paste(tile,(x,y));draw.text((x+3,y+218),row['source_id']+' '+row.get('confuser_label','dirt'),fill='black')
        sheet.save(OUT/name,quality=94)
    print(summary,flush=True)


if __name__=='__main__':main()
