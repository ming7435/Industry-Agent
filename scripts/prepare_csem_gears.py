"""Verify/extract labelled CSEM gear parts and preserve physical-part groups."""
from collections import Counter
import hashlib
import io
from pathlib import PurePosixPath
import re
import tarfile
import numpy as np
from PIL import Image
import patchcore_multiview_experiment as base

ROOT=base.ROOT/'.runtime/datasets/csem-misd'
MD5='9a896591ff69fc0d64ee93458e6ad924'


def main():
    verified=base.read(ROOT/'download-verified.json')
    assert verified['md5']==MD5
    archive=ROOT/'gear.tar.gz'
    assert base.sha(archive)==verified['sha256'],'Archive changed since download verification'
    dest=(ROOT/'annotated').resolve();dest.mkdir(exist_ok=True)
    records=[];members=0
    with tarfile.open(archive,'r|gz') as stream:
        for member in stream:
            members+=1
            path=PurePosixPath(member.name)
            if path.is_absolute() or any(p in ('..','') or ':' in p or '\\' in p for p in path.parts):
                raise ValueError('Unsafe archive name')
            if member.issym() or member.islnk(): raise ValueError('Archive links forbidden')
            if not member.isfile():continue
            if len(path.parts)!=4 or path.parts[0]!='Gear' or path.parts[1] not in ('Train','Test'):continue
            if member.size>16*1024*1024:raise ValueError('Unexpected oversized image')
            if path.suffix.lower()!='.png':raise ValueError('Unexpected labelled sample member')
            target=dest.joinpath(*path.parts).resolve()
            if dest not in target.parents:raise ValueError('Extraction escaped destination')
            content=stream.extractfile(member).read()
            if len(content)!=member.size:raise ValueError('Truncated archive entry')
            digest=hashlib.sha256(content).hexdigest()
            with Image.open(io.BytesIO(content)) as image:
                image.load();assert image.size==(512,512)
                pixels=np.asarray(image.convert('L'))
                pixel_hash=hashlib.sha256(pixels.tobytes()).hexdigest()
                nonzero=int(np.count_nonzero(pixels))
            if target.exists():
                assert base.sha(target)==digest,'Existing extracted source differs'
            else:
                target.parent.mkdir(parents=True,exist_ok=True)
                temporary=target.with_suffix('.tmp');temporary.write_bytes(content);temporary.replace(target)
            kind='defect_mask' if path.name.endswith('_mask.png') else 'foreground_mask' if path.name.endswith('_segmentation.png') else 'illumination'
            records.append(dict(path=str(target),member=str(path),group_id=path.parts[2],official_split=path.parts[1],
                kind=kind,sha256=digest,pixel_sha256=pixel_hash,nonzero_pixels=nonzero,bytes=member.size))
            if len(records)%1000==0:print('extracted',len(records),'members_seen',members,flush=True)
    groups={}
    for row in records:
        gid=row['group_id'];group=groups.setdefault(gid,dict(group_id=gid,official_split=row['official_split'],files=[]))
        assert group['official_split']==row['official_split'],'Physical-part group overlaps official splits'
        group['files'].append(row)
    for group in groups.values():
        masks=[r for r in group['files'] if r['kind']=='defect_mask']
        foreground=[r for r in group['files'] if r['kind']=='foreground_mask']
        images=[r for r in group['files'] if r['kind']=='illumination']
        assert len(images)==108 and len(foreground)==1,'Incomplete physical part'
        # Missing annotations must never silently become normal labels.
        assert len(masks)==1,'Missing or ambiguous defect mask; requires source review'
        group['label']='defect' if masks[0]['nonzero_pixels'] else 'normal'
        group['independent_units']=1
    summary=dict(prepared_at=base.now(),source_sha256=verified['sha256'],physical_parts=len(groups),
        images=sum(r['kind']=='illumination' for r in records),files=len(records),
        by_official_split={s:dict(Counter(g['label'] for g in groups.values() if g['official_split']==s)) for s in ('Train','Test')},
        annotation_rule='Author loader: *_mask.png is defect mask; *_segmentation.png is foreground. Nonzero defect mask => defective part.',
        loader_source='https://github.com/DawyD/illumination-preserving-rotations/blob/main/data/dataloader.py',
        caveat='New real metal-gear domain; not acceptance data for the white-plastic gear model. 108 illuminations are correlated views of one physical part.',
        model_evaluation_started=False)
    assert len(groups)==70 and Counter(g['label'] for g in groups.values())=={'normal':35,'defect':35}
    assert sum(g['official_split']=='Train' for g in groups.values())==32
    base.write(ROOT/'manifest.json',list(groups.values()));base.write(ROOT/'preparation-summary.json',summary)
    print(summary,flush=True)


if __name__=='__main__':main()
