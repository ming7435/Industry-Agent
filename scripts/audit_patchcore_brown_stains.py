"""Propose visible brown regions for visual label review; never auto-relabels."""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import patchcore_multiview_experiment as experiment


def brown_regions(image):
    import cv2
    import numpy as np
    regions = []
    for view, box in enumerate(experiment.view_boxes(image.size)):
        pixels = np.asarray(image.crop(box)).astype(np.int16)
        red, green, blue = pixels.transpose(2, 0, 1)
        # Broad review proposal only; labels require visual inspection. Fill
        # the major bright object contour to retain dark spots on its surface.
        bright = ((blue > 40) & (green > 35)).astype(np.uint8)
        bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        contours, _ = cv2.findContours(bright, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        body = np.zeros_like(bright)
        cv2.drawContours(body, [max(contours, key=cv2.contourArea)], -1, 1, -1)
        brown = ((red > 35) & (red - green > 12) & (red - blue > 15)
                 & (red > 1.2 * green) & (red > 1.3 * blue) & (body > 0)).astype(np.uint8)
        count, _, stats, _ = cv2.connectedComponentsWithStats(brown, connectivity=8)
        for x, y, width, height, area in stats[1:count]:
            if area < 8:
                continue
            regions.append(dict(view=view, bbox=[int(x + box[0]), int(y), int(x + width + box[0]), int(y + height)],
                                area=int(area), view_box=list(box)))
    return sorted(regions, key=lambda r: r['area'], reverse=True)


def main():
    from PIL import Image, ImageDraw
    import cv2
    cv2.setNumThreads(1)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'output/patchcore-label-audit-v1')
    args = parser.parse_args()
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    proposals_file = out / 'proposals.json'
    rows = experiment.read(ROOT / 'output/patchcore-multiview-v2/manifest.json')
    if proposals_file.exists():
        proposals = experiment.read(proposals_file)
    else:
        proposals = []
        for index, row in enumerate(rows, 1):
            if experiment.sha(row['path']) != row['file_sha256']:
                raise ValueError('Source image changed')
            with Image.open(row['path']) as image:
                regions = brown_regions(image.convert('RGB'))
            if regions:
                proposals.append({**row, 'brown_regions': regions, 'review_status': 'pending'})
            if index % 200 == 0:
                print(json.dumps(dict(scanned=index, total=len(rows), flagged=len(proposals))), flush=True)
        experiment.write(proposals_file, proposals)
    normals = [r for r in proposals if r['label'] == 'normal']
    sheets = []
    for page in range((len(normals) + 23) // 24):
        canvas = Image.new('RGB', (1280, 6 * 240), 'white')
        draw = ImageDraw.Draw(canvas)
        subset = normals[page * 24:(page + 1) * 24]
        for index, row in enumerate(subset):
            left, top = (index % 4) * 320, (index // 4) * 240
            region = row['brown_regions'][0]
            label = row['sample_id'].removeprefix('mechanics_gear_')
            draw.text((left + 5, top + 4), f'{label} | {row["split"]} | {len(row["brown_regions"])} regions', fill='black')
            with Image.open(row['path']) as image:
                image = image.convert('RGB')
                tile = image.crop(region['view_box'])
                x1, y1, x2, y2 = region['bbox']
                mark = ImageDraw.Draw(tile)
                mark.rectangle((x1-region['view_box'][0]-4,y1-4,x2-region['view_box'][0]+4,y2+4),outline='red',width=2)
                tile.thumbnail((155, 190))
                canvas.paste(tile, (left + 3, top + 28))
                cx, cy = (x1+x2)//2, (y1+y2)//2
                half = max(24, max(x2-x1,y2-y1)//2+12)
                crop = image.crop((max(region['view_box'][0],cx-half),max(0,cy-half),
                                   min(region['view_box'][2],cx+half),min(image.height,cy+half)))
                crop.thumbnail((155, 190))
                canvas.paste(crop, (left + 162, top + 28))
            draw.text((left + 5, top + 220), f'area={region["area"]} | original label: normal', fill='#555555')
        path = out / f'review-{page+1:02d}.jpg'
        canvas.save(path, quality=95)
        sheets.append(dict(path=str(path), sha256=experiment.sha(path), sample_ids=[r['sample_id'] for r in subset]))
    experiment.write(out / 'review-sheets.json', sheets)
    summary = dict(scanned=len(rows), proposals=len(proposals), normal_proposals=len(normals),
                   normal_proposals_by_split=dict(Counter(r['split'] for r in normals)),
                   sheets=len(sheets), labels_changed=0,
                   note='Color screening proposes review; no model scores or held-out performance are used.')
    experiment.write(out / 'summary.json', summary)
    print(json.dumps(summary), flush=True)


if __name__ == '__main__':
    main()
