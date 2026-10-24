"""Trace calibration-only PatchCore errors to their actual normal-bank patches."""
from __future__ import annotations

import json
from pathlib import Path
import time

import patchcore_fine_features as fine
from patchcore_foreground import foreground_mask

base = fine.base
OUT = base.ROOT / 'output/patchcore-root-cause-v5'
MODEL = base.ROOT / 'output/patchcore-feature-study-v4'


def point_index(point, size, config, grid):
    from app.vision.preprocessing import _patchcore_transform
    l, t, r, b = _patchcore_transform(size, config)['content_box']
    x, y = point
    return (min(grid[0]-1, max(0, int((t+y*(b-t)/size[1])*grid[0]/config['input_size']))),
            min(grid[1]-1, max(0, int((l+x*(r-l)/size[0])*grid[1]/config['input_size']))))


def image_point(index, size, config, grid):
    from app.vision.preprocessing import _patchcore_transform
    l, t, r, b = _patchcore_transform(size, config)['content_box']
    y, x = divmod(index, grid[1])
    return ((x+.5)*config['input_size']/grid[1]-l)*size[0]/(r-l), ((y+.5)*config['input_size']/grid[0]-t)*size[1]/(b-t)


def main():
    import cv2
    import numpy as np
    from PIL import Image, ImageDraw
    from app.vision.evaluation import load_rgb
    base.setup_runtime()
    fine.check(MODEL)
    OUT.mkdir(exist_ok=True)
    metadata = base.read(MODEL/'model.json')
    detector = fine.FineDetector(str(base.WEIGHTS), metadata['preprocessing'])
    rows = base.read(MODEL/'calibration_scores.json')
    normals = sorted([r for r in rows if r['label']=='normal'], key=lambda r:r['score'], reverse=True)[:8]
    defects = [r for r in rows if r['label']=='defect']
    train = [r for r in base.read(MODEL/'manifest.json') if r['split']=='train']
    cache = np.load(MODEL/'feature_candidates.npy', mmap_mode='r', allow_pickle=False)
    with np.load(MODEL/'memory.npz', allow_pickle=False) as z:
        banks = [z[f'view_{i}'].copy() for i in range(5)]
    origins = []
    for view, bank in enumerate(banks):
        keys = {v.tobytes():i for i,v in enumerate(bank)}
        found = {}
        for index, value in enumerate(cache[view].reshape(-1,192)):
            target = keys.get(value.tobytes())
            if target is not None and target not in found:
                found[target] = index//32
        if len(found)!=len(bank): raise ValueError('Missing memory provenance')
        origins.append(found)
    proposals = {r['sample_id']:r for r in base.read(fine.clean.AUDIT/'proposals.json')}
    evidence=[]; started=time.perf_counter()
    for row in normals+defects:
        with load_rgb(row['path']) as image:
            if row['scenario']=='brown_stain':
                mask = np.zeros((image.height,image.width),np.uint8)
                for region in proposals[row['sample_id']]['brown_regions']:
                    x1,y1,x2,y2=region['bbox']; mask[y1:y2,x1:x2]=1
            elif row['label']=='defect':
                path=base.ROOT/'.runtime/datasets/manta-gear/gear/ground_truth'/row['scenario']/(row['sample_id']+'.png')
                with Image.open(path) as im: mask=np.asarray(im.convert('L'))>0
                if mask.shape!=(image.height,image.width): raise ValueError('Mask dimensions mismatch')
            else: mask=np.ones((image.height,image.width),bool)
            heatmap=np.zeros(mask.shape,np.float32)
            tiles=[]
            for view,box in enumerate(base.view_boxes(image.size)):
                tile=image.crop(box);tiles.append(tile)
                heatmap[:,box[0]:box[2]]=detector.anomaly_map(tile,banks[view])
            y,x=np.unravel_index(np.where(mask,heatmap,-1).argmax(),heatmap.shape)
            view=int(min(4,x//tiles[0].width));tile=tiles[view]
            query_point=(x-view*tile.width,y)
            features,grid=detector._extract_features(tile)
            gy,gx=point_index(query_point,tile.size,detector.config,grid)
            feature=features[gy*grid[1]+gx]
            distances=np.linalg.norm(banks[view].astype(np.float64)-feature,axis=1)
            nearest=int(distances.argmin())
            source=train[origins[view][nearest]]
            with load_rgb(source['path']) as source_image:
                source_tile=source_image.crop(base.view_boxes(source_image.size)[view])
            source_features,source_grid=detector._extract_features(source_tile)
            source_index=int(np.linalg.norm(source_features-banks[view][nearest],axis=1).argmin())
            if not np.array_equal(source_features[source_index],banks[view][nearest]): raise ValueError('Memory provenance mismatch')
            sx,sy=image_point(source_index,source_tile.size,detector.config,source_grid)
            source_roi=foreground_mask(source_tile)
            source_fg=bool(source_roi[min(source_tile.height-1,max(0,round(sy))),min(source_tile.width-1,max(0,round(sx)))])
            query_fg=bool(foreground_mask(tile)[query_point[1],query_point[0]])
            entry=dict(sample_id=row['sample_id'],label=row['label'],scenario=row['scenario'],
                       whole_score=float(heatmap.max()),region_score=float(heatmap[y,x]),view=view,
                       query_point=[int(v) for v in query_point],query_foreground=query_fg,
                       nearest_distance=float(distances[nearest]),nearest_source=source['sample_id'],
                       source_point=[float(sx),float(sy)],source_foreground=source_fg,
                       source_group_split=source['split'],model_memory_sha256=metadata['memory_sha256'])
            canvas=Image.new('RGB',(1000,440),'white');draw=ImageDraw.Draw(canvas)
            draw.text((10,8),f'{row["sample_id"]} {row["scenario"]}: score={entry["whole_score"]:.4f}; region={entry["region_score"]:.4f}',fill='black')
            draw.text((510,8),f'nearest NORMAL: {source["sample_id"]}; foreground={source_fg}',fill='black')
            for offset,im,pt in [(0,tile,query_point),(500,source_tile,(sx,sy))]:
                marked=im.copy();mark=ImageDraw.Draw(marked)
                px,py=pt;mark.ellipse((px-9,py-9,px+9,py+9),outline='red',width=3)
                marked.thumbnail((310,360));canvas.paste(marked,(offset+8,38))
                crop=im.crop((int(px)-40,int(py)-40,int(px)+40,int(py)+40)).resize((160,160))
                canvas.paste(crop,(offset+330,95))
            dest=OUT/'neighbors';dest.mkdir(exist_ok=True)
            canvas.save(dest/(row['sample_id']+'.jpg'),quality=94)
            entry['evidence_image']=str(dest/(row['sample_id']+'.jpg'))
            evidence.append(entry)
            base.write(OUT/'nearest-neighbor-evidence.json',evidence)
            print(row['sample_id'],row['scenario'],entry['region_score'],'nearest',source['sample_id'],'foreground',source_fg,flush=True)
            for im in tiles: im.close()
            source_tile.close()
    print('completed',len(evidence),'seconds',round(time.perf_counter()-started,1),flush=True)


if __name__=='__main__':main()
