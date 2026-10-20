"""Download the author's public plastic gear dataset and verify original labels.

Retains the upstream ZIP; strips duplicated embedded imageData from the working
annotations. No labels are inferred from filenames or fabricated.
"""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import os
import time
import urllib.request
import zipfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/gear-dataset'
URL='https://www.kaggle.com/api/v1/datasets/download/yimingfang1994/plastic-gear-surface-defect-dataset?datasetVersionNumber=1'
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def main():
    OUT.mkdir(exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(URL,headers={'Range':'bytes=0-0'}),timeout=45) as response:
        signed=response.url
        total=int(response.headers['Content-Range'].split('/')[-1])
    target=OUT/'plastic-gear-surface-defect-v1.zip'
    if not target.exists():
        with target.open('wb') as stream:stream.truncate(total)
    if target.stat().st_size!=total:raise ValueError('archive size changed')
    chunk=32*1024*1024
    def download(index):
        start=index*chunk;end=min(total,start+chunk)-1
        marker=OUT/f'download-{index:03d}.done'
        if marker.exists():return index
        for attempt in range(3):
            try:
                request=urllib.request.Request(signed,headers={'Range':f'bytes={start}-{end}'})
                with urllib.request.urlopen(request,timeout=90) as response,target.open('r+b') as stream:
                    if response.status!=206 or not response.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/'):
                        raise ValueError('server ignored requested range')
                    stream.seek(start);written=0
                    while data:=response.read(1024*1024):
                        stream.write(data);written+=len(data)
                    if written!=end-start+1:raise ValueError('incomplete range')
                marker.write_text(str(written),encoding='ascii')
                return index
            except Exception:
                if attempt==2:raise
                time.sleep(2)
    count=(total+chunk-1)//chunk
    with concurrent.futures.ThreadPoolExecutor(6) as pool:
        for n,index in enumerate(pool.map(download,range(count)),1):
            save(OUT/'download-progress.json',{'completed_chunks':n,'total_chunks':count,'bytes':total})
            print(f'download {n}/{count}',flush=True)
    rows=[]
    with zipfile.ZipFile(target) as archive:
        infos=archive.infolist()
        if sum(i.file_size for i in infos)>5*1024**3:raise ValueError('uncompressed dataset exceeds bound')
        for entry in infos:
            path=(OUT/'raw'/entry.filename).resolve()
            if not path.is_relative_to((OUT/'raw').resolve()) or entry.is_dir():raise ValueError('unsafe archive path')
            data=archive.read(entry)  # includes CRC verification
            path.parent.mkdir(parents=True,exist_ok=True)
            if path.suffix.lower()=='.json':
                annotation=json.loads(data)
                annotation.pop('imageData',None)
                save(path,annotation)
                rows.append({'path':entry.filename,'imagePath':annotation.get('imagePath'),
                             'width':annotation.get('imageWidth'),'height':annotation.get('imageHeight'),
                             'labels':[s.get('label') for s in annotation.get('shapes',[])],
                             'shape_types':[s.get('shape_type') for s in annotation.get('shapes',[])]})
            else:path.write_bytes(data)
    save(OUT/'annotation-index.json',rows)
    from collections import Counter
    inventory={'source_url':URL,'archive_bytes':total,'archive_sha256':hashlib.file_digest(target.open('rb'),'sha256').hexdigest(),
               'images':sum(i.filename.lower().endswith('.png') for i in infos),
               'annotations':len(rows),'empty_annotations':sum(not r['labels'] for r in rows),
               'label_counts':dict(Counter(x for r in rows for x in r['labels'])),
               'shape_types':dict(Counter(x for r in rows for x in r['shape_types'])),
               'license_note':'Kaggle metadata/GitHub LICENSE say Apache2; author README restricts noncommercial academic use. Retain both; no commercial permission inferred.'}
    save(OUT/'inventory.json',inventory)
    print(json.dumps(inventory,ensure_ascii=True),flush=True)
if __name__=='__main__':main()
