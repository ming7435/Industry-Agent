"""Resume a checksum-verified public CSEM gear archive; no model fitting."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
from pathlib import Path
import time
import requests
import patchcore_multiview_experiment as base

ROOT = base.ROOT / '.runtime/datasets/csem-misd'
URL = 'https://zenodo.org/api/records/7410513/files/gear.tar.gz/content'
SIZE = 6793027000
MD5 = '9a896591ff69fc0d64ee93458e6ad924'
CHUNK = 32 * 1024 * 1024


def fetch(index):
    start = index * CHUNK; end = min(SIZE, start + CHUNK)-1
    target = ROOT/'chunks'/f'{index:04d}.part'
    if target.exists() and target.stat().st_size == end-start+1: return target
    for attempt in range(4):
        try:
            with requests.get(URL, headers={'Range':f'bytes={start}-{end}'}, stream=True, timeout=(20,60)) as response:
                response.raise_for_status()
                if response.status_code != 206 or response.headers.get('Content-Range') != f'bytes {start}-{end}/{SIZE}':
                    raise ValueError('Server did not honor exact range')
                temporary=target.with_suffix('.tmp')
                with temporary.open('wb') as f:
                    for block in response.iter_content(1024*1024): f.write(block)
                if temporary.stat().st_size != end-start+1: raise ValueError('Truncated range')
                temporary.replace(target)
                return target
        except (requests.RequestException,ValueError):
            if attempt==3: raise
            time.sleep(min(30,2**attempt))


def main():
    (ROOT/'chunks').mkdir(parents=True,exist_ok=True)
    metadata=requests.get('https://zenodo.org/api/records/7410513',timeout=30)
    metadata.raise_for_status(); record=metadata.json()
    source=next(f for f in record['files'] if f['key']=='gear.tar.gz')
    assert source['size']==SIZE and source['checksum']=='md5:'+MD5
    base.write(ROOT/'source.json',dict(retrieved_at=base.now(),source_page='https://zenodo.org/records/7410513',
        file=source,license=record['metadata'].get('license'),scope='Real metal gears; external domain, not white-plastic production acceptance.',
        grouping='108 illuminations per physical part; count physical parts, never images, as independent units.'))
    archive=ROOT/'gear.tar.gz'
    if archive.exists() and archive.stat().st_size==SIZE:
        with archive.open('rb') as f: digest=hashlib.file_digest(f,'md5').hexdigest()
        if digest==MD5: print('Archive already verified',flush=True);return
        raise ValueError('Existing archive checksum mismatch')
    count=(SIZE+CHUNK-1)//CHUNK; started=time.monotonic()
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures=[pool.submit(fetch,i) for i in range(count)]
        for completed,future in enumerate(as_completed(futures),1):
            future.result()
            if completed%5==0 or completed==count:
                state=dict(completed=completed,total=count,elapsed_seconds=round(time.monotonic()-started,1))
                base.write(ROOT/'download-progress.json',state);print(state,flush=True)
    digest=hashlib.md5(); temporary=archive.with_suffix('.tmp')
    with temporary.open('wb') as output:
        for index in range(count):
            with (ROOT/'chunks'/f'{index:04d}.part').open('rb') as f:
                for block in iter(lambda:f.read(1024*1024),b''): output.write(block);digest.update(block)
    if digest.hexdigest()!=MD5: raise ValueError('Archive checksum mismatch')
    temporary.replace(archive)
    base.write(ROOT/'download-verified.json',dict(size=SIZE,md5=MD5,sha256=base.sha(archive),completed_at=base.now()))
    print('Archive verified',flush=True)


if __name__=='__main__': main()
