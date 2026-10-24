"""Broader stain review proposals, never automatic quality labels."""
from __future__ import annotations

import sys
from pathlib import Path

import audit_patchcore_brown_stains as previous
from patchcore_foreground import foreground_mask

base=previous.experiment
OUT=base.ROOT/'output/patchcore-label-audit-v2'


def regions(image):
    import cv2
    import numpy as np
    found=[]
    for view,box in enumerate(base.view_boxes(image.size)):
        tile=image.crop(box)
        hsv=cv2.cvtColor(np.asarray(tile),cv2.COLOR_RGB2HSV)
        h,s,v=hsv.transpose(2,0,1)
        mask=(((h<=35)|(h>=165))&(s>=20)&(v>=25)&foreground_mask(tile)).astype(np.uint8)
        count,_,stats,_=cv2.connectedComponentsWithStats(mask,connectivity=8)
        for x,y,w,hh,area in stats[1:count]:
            if area>=6:
                found.append(dict(view=view,bbox=[int(x+box[0]),int(y),int(x+w+box[0]),int(y+hh)],area=int(area),view_box=list(box)))
        tile.close()
    return sorted(found,key=lambda r:r['area'],reverse=True)


def main():
    import cv2
    from PIL import Image
    cv2.setNumThreads(1)
    OUT.mkdir(exist_ok=True)
    rows=base.read(base.ROOT/'output/patchcore-multiview-v2/manifest.json')
    reviewed=base.read(base.ROOT/'output/patchcore-label-audit-v1/review-decisions.json')
    confirmed={r['sample_id'] for r in reviewed['decisions'] if r['decision']=='confirmed_brown_stain'}
    path=OUT/'all-proposals.json'
    if path.exists(): proposals=base.read(path)
    else:
        proposals=[]
        for index,row in enumerate(rows):
            if row['label']!='normal':continue
            if base.sha(row['path'])!=row['file_sha256']:raise ValueError('Image changed')
            with Image.open(row['path']) as im: candidates=regions(im.convert('RGB'))
            if candidates:proposals.append({**row,'brown_regions':candidates,'review_status':'pending'})
            if index%100==0:print('scanned',index,'proposals',len(proposals),flush=True)
        base.write(path,proposals)
    base.write(OUT/'proposals.json',[r for r in proposals if r['sample_id'] not in confirmed])
    base.write(OUT/'screening-rule.json',dict(source_sha256=base.sha(__file__),purpose='visual-review proposals, not predictions or labels',
        hsv_rule='Hue <=35 or >=165; saturation >=20; value >=25; component area >=6 inside broad object ROI',
        original_manifest_sha256=base.sha(base.ROOT/'output/patchcore-multiview-v2/manifest.json'),
        previous_confirmed_ids=sorted(confirmed),all_flagged=len(proposals),new_review_candidates=sum(r['sample_id'] not in confirmed for r in proposals)))
    sys.argv=[sys.argv[0],'--output',str(OUT)]
    previous.main()


if __name__=='__main__':main()
