"""Require every synthetic stain to sit on the source gear's bright body mask."""
from pathlib import Path
import sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import OUT,DATA,SEED,SOURCE,FULL,read,save,digest
from scripts.yolo_dirt_augmentation import apply_stain


def main():
    import cv2
    from PIL import Image,ImageDraw
    from hashlib import sha256
    document=read(DATA/'manifest.json');rows=document['samples'];by_id={r['sample_id']:r for r in rows}
    assert not (OUT/'placement-audit.json').exists()
    save(OUT/'pre-placement-audit-manifest.json',document)
    index={r['sample_id']:r for r in read(FULL/'annotation-index.json')}
    backgrounds=[r for r in rows if r['kind']=='new_clean_gear_background' and r['source_id'].startswith('endface')]
    candidates=[]
    for row in backgrounds:
        source=FULL/index[row['source_id']]['image_path']
        assert digest(source)==index[row['source_id']]['image_sha256']
        with Image.open(source) as image:rgb=np.asarray(image.convert('RGB'))
        gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY);threshold,_=cv2.threshold(gray,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
        mask=((gray>max(65,threshold))&(rgb.max(2).astype(int)-rgb.min(2)<55)).astype(np.uint8)
        count,components,stats,_=cv2.connectedComponentsWithStats(mask,8)
        if count<2:continue
        largest=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
        body=cv2.erode((components==largest).astype(np.uint8),np.ones((7,7),np.uint8))
        l,t,r,b=row['window'];local=body[t:b,l:r]
        if local.sum()>5000:candidates.append((row,local))
    assert len(candidates)>150,len(candidates)
    rng=np.random.default_rng(SEED+1);audit=[];positive_rows=[r for r in rows if r['kind']=='synthetic_dirt_pair']
    for item in positive_rows:
        old=dict(item);clean=by_id[old['paired_clean_id']]
        with Image.open(old['path']) as marked,Image.open(clean['path']) as plain:
            delta=np.asarray(plain).astype(np.float32)-np.asarray(marked).astype(np.float32)
        x1,y1,x2,y2=old['ground_truth'][0]['bbox'];stamp=delta[y1:y2,x1:x2].max(2)
        sh,sw=stamp.shape
        for attempt in range(1000):
            background,mask=candidates[int(rng.integers(len(candidates)))]
            y=int(rng.integers(4,mask.shape[0]-sh-4));x=int(rng.integers(4,mask.shape[1]-sw-4))
            if not mask[y:y+sh,x:x+sw].all():continue
            with Image.open(background['path']) as plain:
                plain=plain.convert('RGB');region=np.asarray(plain)[y:y+sh,x:x+sw].mean(2)
                if region.std()>20:continue
                marked,box=apply_stain(plain,stamp,(x,y))
                before=np.asarray(plain);after=np.asarray(marked)
                changed=np.any(before!=after,axis=2)
                assert np.all(mask[changed]) and changed.any()
                outside=changed.copy();outside[box[1]:box[3],box[0]:box[2]]=False;assert not outside.any()
                path=Path(old['path']);marked.save(path)
                pixels=sha256(marked.tobytes()+str(marked.size).encode()).hexdigest();marked.close()
            item.update({k:background[k] for k in ('source_id','source_group','source_file_sha256','width','height')})
            item.update(paired_clean_id=background['sample_id'],ground_truth=[{'label':'dirt','bbox':box}],
                file_sha256=digest(path),pixel_sha256=pixels,placement_verified='largest bright achromatic gear component, eroded 7px')
            audit.append({'sample_id':item['sample_id'],'previous_sha256':old['file_sha256'],'sha256':item['file_sha256'],
                'source_id':item['source_id'],'all_changed_pixels_inside_gear_mask':True,'only_box_pixels_changed':True})
            break
        else:raise AssertionError(f'No verified gear location for {item["sample_id"]}')
    document['placement_policy']='Synthetic marks only on endface gear body; largest bright achromatic component eroded7px; all changed pixels verified in mask.'
    save(DATA/'manifest.json',document)
    save(OUT/'placement-audit.json',{'synthetic_pairs':len(audit),'eligible_backgrounds':len(candidates),
        'test_used':False,'calibration_used':False,'synthetic_on_toothface':0,
        'dataset_manifest_sha256':digest(DATA/'manifest.json'),'samples':audit,
        'limitation':'Classical foreground heuristic plus visual audit, not a manually annotated part mask.'})
    sheet=Image.new('RGB',(1200,960),'#edf1f5');draw=ImageDraw.Draw(sheet)
    selected=list(positive_rows);rng.shuffle(selected)
    for j,item in enumerate(selected[:20]):
        with Image.open(item['path']) as source:
            box=item['ground_truth'][0]['bbox'];cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2
            window=[int(cx-64),int(cy-64),int(cx+64),int(cy+64)]
            crop=source.crop(window).resize((224,224));paint=ImageDraw.Draw(crop)
            paint.rectangle([(v-window[k%2])*1.75 for k,v in enumerate(box)],outline='#d22e28',width=2)
            x,y=j%5*240,j//5*240;sheet.paste(crop,(x,y));draw.text((x+3,y+225),item['source_id'],fill='#152f42')
    sheet.save(OUT/'synthetic-audited.jpg',quality=93)
    print({'audited_pairs':len(audit),'eligible_backgrounds':len(candidates),'synthetic_on_toothface':0},flush=True)


if __name__=='__main__':main()
