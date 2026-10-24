"""Restore original-frame stain sizes and train on actual rectangular inference views."""
from collections import Counter
from datetime import datetime,timezone
from hashlib import sha256
from pathlib import Path
import sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import OUT as PARENT,SOURCE,read,save,digest,ACTIVE
from scripts.yolo_dirt_augmentation import apply_stain
from scripts.train_yolo_fine_defects import crop_truth
from app.vision.yolo_multiview import crop_windows

OUT=ROOT/'output/gear-yolo-dirt-scale-v12';DATA=OUT/'dataset';SEED=2026102302


def main():
    import cv2
    from PIL import Image,ImageDraw
    OUT.mkdir(exist_ok=False);(DATA/'images').mkdir(parents=True)
    protocol=read(PARENT/'protocol.json');protocol.update(experiment='dirt_scale_matched_v12',created_at=datetime.now(timezone.utc).isoformat(),
        seed=SEED,training_policy='Original training frames plus train-only synthetic stains sized from real training annotations; actual .6/.4 inference windows; unchanged clean counterparts and texture/edge negatives.',
        rationale='v11 synthetic dirt short-side median30px versus real whole-frame training10.84px. Match original scale and preserve confident original dirt responses.',
        letterbox_auto=True,positive_teacher_preservation=.5,learning_rate=.00002,
        training_objective='Top3 geometric positives + top128 ordinary negative BCE + .05 background teacher preservation + .5 confident target teacher preservation.',
        parent_data_sha256=digest(PARENT/'dataset/manifest.json'),stopping_policy='Two fixed checkpoints at epochs2 and4. Fixed43 calibration first; full188 only after target gates. Freeze before test118; failed candidates never deployed.')
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(PARENT/'baseline-deployment.json'))
    originals={r['sample_id']:r for r in read(SOURCE/'manifest.json')['samples'] if r['split']=='train'}
    old=read(PARENT/'dataset/manifest.json');by_id={r['sample_id']:r for r in old['samples']}
    short_sides=[min(g['bbox'][2]-g['bbox'][0],g['bbox'][3]-g['bbox'][1]) for r in originals.values() for g in r['ground_truth'] if g['label']=='dirt']
    assert len(short_sides)==28
    rng=np.random.default_rng(SEED);rows=[];seen={};masks={};images={}

    def add(image,truth,source,kind,**extra):
        pixels=sha256(image.tobytes()+str(image.size).encode()).hexdigest()
        if pixels in seen:return seen[pixels]
        sid=f'{kind}-{len(rows):05d}';path=DATA/'images'/(sid+'.png');image.save(path)
        for g in truth:
            x1,y1,x2,y2=g['bbox'];assert 0<=x1<x2<=image.width and 0<=y1<y2<=image.height
        item={'sample_id':sid,'source_id':source['sample_id'],'source_group':source['group_id'],'split':'train','source_split':'train',
            'kind':kind,'path':str(path),'width':image.width,'height':image.height,'ground_truth':truth,
            'file_sha256':digest(path),'pixel_sha256':pixels,'existing':False,**extra}
        rows.append(item);seen[pixels]=item;return item

    whole={}
    for source in originals.values():
        with Image.open(SOURCE/source['path']) as image:
            whole[source['sample_id']]=add(image.convert('RGB'),source['ground_truth'],source,'real_whole')
    for row in old['samples']:
        if row['kind']!='new_clean_gear_background':continue
        source=originals[row['source_id']]
        with Image.open(row['path']) as image:add(image.convert('RGB'),[],source,'real_texture_edge_background',window=row['window'])
    placements=[]
    for i,previous in enumerate(r for r in old['samples'] if r['kind']=='synthetic_dirt_pair'):
        source=originals[previous['source_id']];sid=source['sample_id'];clean=by_id[previous['paired_clean_id']]
        if sid not in images:
            with Image.open(SOURCE/source['path']) as image:images[sid]=image.convert('RGB')
            rgb=np.asarray(images[sid]);gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
            threshold,_=cv2.threshold(gray,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
            mask=((gray>max(65,threshold))&(rgb.max(2).astype(int)-rgb.min(2)<55)).astype(np.uint8)
            n,components,stats,_=cv2.connectedComponentsWithStats(mask,8)
            largest=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]);mask=cv2.erode((components==largest).astype(np.uint8),np.ones((5,5),np.uint8))
            for gt in source['ground_truth']:
                x1,y1,x2,y2=gt['bbox'];mask[max(0,int(y1)-6):min(mask.shape[0],int(np.ceil(y2))+6),max(0,int(x1)-6):min(mask.shape[1],int(np.ceil(x2))+6)]=0
            masks[sid]=mask
        image=images[sid];mask=masks[sid]
        with Image.open(previous['path']) as marked,Image.open(clean['path']) as plain:
            delta=(np.asarray(plain).astype(np.float32)-np.asarray(marked).astype(np.float32)).max(2)
        x1,y1,x2,y2=previous['ground_truth'][0]['bbox'];stamp=delta[y1:y2,x1:x2]
        desired=float(np.clip(rng.choice(short_sides),3,32));ratio=desired/min(stamp.shape)
        if max(stamp.shape)*ratio>72:ratio=72/max(stamp.shape)
        stamp=cv2.resize(stamp,(max(3,round(stamp.shape[1]*ratio)),max(3,round(stamp.shape[0]*ratio))),interpolation=cv2.INTER_AREA if ratio<1 else cv2.INTER_LINEAR)
        stamp*=rng.uniform(.8,1.2);sh,sw=stamp.shape
        for attempt in range(3000):
            x=int(rng.integers(5,image.width-sw-5));y=int(rng.integers(5,image.height-sh-5))
            if not mask[y:y+sh,x:x+sw].all():continue
            try:synthetic,box=apply_stain(image,stamp,(x,y))
            except ValueError:continue
            break
        else:raise AssertionError(sid)
        truth=source['ground_truth']+[{'label':'dirt','bbox':box}]
        derived=add(synthetic,truth,source,'synthetic_whole',synthetic=True,donor=previous.get('donor'),
            paired_clean_id=whole[sid]['sample_id'],synthetic_bbox=box,parent_stain_id=previous['sample_id'])
        changed=np.any(np.asarray(image)!=np.asarray(synthetic),axis=2);assert np.all(mask[changed])
        placements.append({'sample_id':derived['sample_id'],'source_id':sid,'bbox':box,'changed_pixels_inside_gear':True})
        for kind,fraction,grid in [('tile',.6,2),('detail',.4,3)]:
            candidates=[]
            for window in crop_windows(image.size,fraction,grid):
                l,t,r,b=window
                if not (l+3<box[0]<box[2]<r-3 and t+3<box[1]<box[3]<b-3):continue
                labels=crop_truth(truth,window);clean_labels=crop_truth(source['ground_truth'],window)
                if labels is not None and clean_labels is not None:candidates.append((window,labels,clean_labels))
            if not candidates:continue
            window,labels,clean_labels=candidates[int(rng.integers(len(candidates)))]
            with image.crop(window) as crop:clean_item=add(crop,clean_labels,source,'clean_inference_'+kind,window=list(window))
            with synthetic.crop(window) as crop:
                add(crop,labels,source,'synthetic_inference_'+kind,synthetic=True,window=list(window),
                    donor=previous.get('donor'),paired_clean_id=clean_item['sample_id'],
                    synthetic_bbox=[v-window[k%2] for k,v in enumerate(box)],parent_stain_id=previous['sample_id'])
        synthetic.close()
        if (i+1)%100==0:print({'stains':i+1,'inputs':len(rows)},flush=True)
    # Replay genuine dirt through the same rectangular inference windows.
    for source in originals.values():
        if not any(g['label']=='dirt' for g in source['ground_truth']):continue
        with Image.open(SOURCE/source['path']) as image:
            for fraction,grid in ((.6,2),(.4,3)):
                for window in crop_windows(image.size,fraction,grid):
                    labels=crop_truth(source['ground_truth'],window)
                    if labels and any(g['label']=='dirt' for g in labels):
                        with image.crop(window) as crop:add(crop.convert('RGB'),labels,source,'real_dirt_inference_view',window=list(window))
    held={r['group_id'] for r in read(SOURCE/'manifest.json')['samples'] if r['split']!='train'}
    by_id={r['sample_id']:r for r in rows}
    for row in rows:
        assert row['source_group'] not in held
        if row.get('donor'):assert row['donor']['source_group'] not in held
        if row.get('synthetic'):
            plain=by_id[row['paired_clean_id']]
            assert plain['source_id']==row['source_id'] and not plain.get('synthetic')
    document={'samples':rows,'classes':old['classes'],'source_manifest_sha256':digest(SOURCE/'manifest.json'),
        'test_used':False,'calibration_used':False,'new_independent_photos':0,'letterbox_auto':True,
        'annotation_policy':'Original source labels retained; synthetic changed-pixel support recorded; inference crops reject partial existing annotations.'}
    save(DATA/'manifest.json',document)
    sizes=[min(p['bbox'][2]-p['bbox'][0],p['bbox'][3]-p['bbox'][1]) for p in placements]
    audit={'samples':placements,'dataset_manifest_sha256':digest(DATA/'manifest.json'),
        'source_groups_disjoint':True,'synthetic_whole':len(placements),'all_changed_pixels_inside_gear':True,
        'real_train_short_side_percentiles':np.percentile(short_sides,[10,50,90]).tolist(),
        'synthetic_whole_short_side_percentiles':np.percentile(sizes,[10,50,90]).tolist(),
        'test_used':False,'calibration_used':False,'source_manifest_sha256':digest(SOURCE/'manifest.json')}
    save(OUT/'placement-audit.json',audit);save(OUT/'data-audit.json',audit)
    summary={'training_inputs':len(rows),'source_photos':len({r['source_id'] for r in rows}),'kinds':dict(Counter(r['kind'] for r in rows)),
        'new_independent_photos':0,'synthetic_images':sum(bool(r.get('synthetic')) for r in rows),'distinct_synthetic_stains':600,
        'synthetic_whole_short_side_median':float(np.median(sizes)),'real_whole_short_side_median':float(np.median(short_sides))}
    save(OUT/'data-summary.json',summary)
    sheet=Image.new('RGB',(1200,960),'#edf1f5');draw=ImageDraw.Draw(sheet)
    for i,item in enumerate(placements[::30][:20]):
        row=by_id[item['sample_id']]
        with Image.open(row['path']) as image:
            box=item['bbox'];cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2;window=[int(cx-50),int(cy-50),int(cx+50),int(cy+50)]
            tile=image.crop(window).resize((224,210));paint=ImageDraw.Draw(tile)
            paint.rectangle([(v-window[j%2])*(2.24 if j%2==0 else 2.1) for j,v in enumerate(box)],outline='red',width=2)
            x,y=i%5*240,i//5*240;sheet.paste(tile,(x,y));draw.text((x+3,y+218),row['source_id'],fill='black')
    sheet.save(OUT/'synthetic-audited.jpg',quality=94)
    print(summary,flush=True)


if __name__=='__main__':main()
