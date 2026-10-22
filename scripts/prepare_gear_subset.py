"""Fetch a deterministic real-gear subset using ZIP HTTP ranges and original LabelMe labels."""
from pathlib import Path
import argparse, base64, concurrent.futures, hashlib, io, json, random, re, struct, time, urllib.request, zlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/gear-dataset'
URL='https://www.kaggle.com/api/v1/datasets/download/yimingfang1994/plastic-gear-surface-defect-dataset?datasetVersionNumber=1'
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def main(full=False):
    out=ROOT/'output/gear-full-dataset' if full else OUT
    rows=json.loads((OUT/'archive-index.json').read_text(encoding='utf-8'))
    members={r['name']:r for r in rows}
    rows=[r for r in rows if r['name'].endswith('.json')]
    if full:
        chosen=sorted(rows,key=lambda r:r['name'])
        if len(chosen)!=1165:raise ValueError('expected all 1165 source annotations')
        out.mkdir(parents=True,exist_ok=True)
        save(out/'source-selection.json',{'selected':chosen,'policy':'all 1165 original annotations; no label-based filtering'})
    else:
        rng=random.Random(20261025)
        chosen=[]
        for view,count in [('endface',160),('toothface',80)]:
            population=sorted([r for r in rows if Path(r['name']).stem.startswith(view)],key=lambda r:r['name'])
            chosen+=rng.sample(population,count)
        save(out/'subset-selection.json',{'seed':20261025,'selected':chosen,'policy':'160 endface and 80 toothface randomly selected before reading labels; not the full1165-image dataset'})
    with urllib.request.urlopen(urllib.request.Request(URL,headers={'Range':'bytes=0-0'}),timeout=45) as response:
        signed=response.url
    raw=out/'raw';(raw/'images').mkdir(parents=True,exist_ok=True);(raw/'json').mkdir(exist_ok=True)
    def fetch(row):
        name=Path(row['name']).name;image_name=Path(name).with_suffix('.png').name
        annotation_path=raw/'json'/name;image_path=raw/'images'/image_name
        if not annotation_path.exists() or not image_path.exists():
            start=row['offset'];end=start+30+len(row['name'].encode('utf-8'))+4096+row['compressed']-1
            for attempt in range(4):
                try:
                    req=urllib.request.Request(signed,headers={'Range':f'bytes={start}-{end}'})
                    with urllib.request.urlopen(req,timeout=60) as response:data=response.read()
                    if data[:4]!=b'PK\x03\x04':raise ValueError('ZIP local header missing')
                    fields=struct.unpack('<4s5H3I2H',data[:30]);method=fields[3];crc=fields[6]
                    offset=30+fields[-2]+fields[-1]
                    if method!=8:raise ValueError('expected raw deflate ZIP member')
                    payload=zlib.decompress(data[offset:offset+row['compressed']],-15)
                    if len(payload)!=row['size'] or zlib.crc32(payload)!=crc:raise ValueError('ZIP member CRC/length mismatch')
                    annotation=json.loads(payload)
                    embedded=annotation.pop('imageData',None)
                    if embedded:
                        pixels=base64.b64decode(embedded,validate=True)
                    else:
                        original=members['images/'+image_name]
                        pos=original['offset'];last=pos+30+len(original['name'].encode('utf-8'))+4096+original['compressed']-1
                        with urllib.request.urlopen(urllib.request.Request(signed,headers={'Range':f'bytes={pos}-{last}'}),timeout=90) as response:
                            packed=response.read()
                        header=struct.unpack('<4s5H3I2H',packed[:30]);data_offset=30+header[-2]+header[-1]
                        pixels=zlib.decompress(packed[data_offset:data_offset+original['compressed']],-15)
                        if len(pixels)!=original['size'] or zlib.crc32(pixels)!=header[6]:raise ValueError('original image CRC/length mismatch')
                    if not pixels.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('embedded image is not PNG')
                    from PIL import Image
                    with Image.open(io.BytesIO(pixels)) as image:
                        if image.size!=(annotation['imageWidth'],annotation['imageHeight']):raise ValueError('annotation image dimensions differ')
                        image.verify()
                    image_path.write_bytes(pixels);save(annotation_path,annotation)
                    break
                except Exception:
                    if attempt==3:raise
                    time.sleep(2)
        annotation=json.loads(annotation_path.read_text(encoding='utf-8'))
        return {'sample_id':Path(name).stem,'image_path':str(image_path.relative_to(out)),
                'annotation_path':str(annotation_path.relative_to(out)),
                'labels':[s['label'] for s in annotation['shapes']],
                'shape_types':[s.get('shape_type') for s in annotation['shapes']],
                'width':annotation['imageWidth'],'height':annotation['imageHeight'],
                'image_sha256':hashlib.sha256(image_path.read_bytes()).hexdigest()}
    completed=[]
    with concurrent.futures.ThreadPoolExecutor(12) as pool:
        futures=[pool.submit(fetch,row) for row in chosen]
        for future in concurrent.futures.as_completed(futures):
            completed.append(future.result())
            save(out/'download-progress.json' if full else out/'subset-progress.json',{'images_ready':len(completed),'total':len(chosen)})
            print(f'gear images {len(completed)}/{len(chosen)}',flush=True)
    completed.sort(key=lambda r:r['sample_id'])
    save(out/'annotation-index.json',completed)
    from collections import Counter
    save(out/'inventory.json',{'images':len(completed),'annotations':len(completed),
         'empty_annotations':sum(not r['labels'] for r in completed),'source_total_images':1165,
         'label_counts':dict(Counter(x for row in completed for x in row['labels'])),
         'shape_types':dict(Counter(x for row in completed for x in row['shape_types'])),
         'scope':'all source images' if full else 'deterministic240-image research subset; all labels from upstream original annotations'})
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--full',action='store_true',help='Download all 1165 annotated images into a separate directory')
    main(full=parser.parse_args().full)
