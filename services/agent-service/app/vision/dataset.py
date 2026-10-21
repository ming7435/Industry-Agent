"""Administrator-configured, read-only held-out gear examples."""
import base64
from hashlib import sha256
import json
import os
from pathlib import Path
import re
from app.vision.service import VisionServiceError

def _manifest():
    configured=os.getenv('QUALITY_VISION_DATASET_MANIFEST','').strip()
    if not configured:return None,None
    path=Path(configured).resolve()
    try:
        if path.stat().st_size>8*1024*1024:raise ValueError('manifest too large')
        value=json.loads(path.read_text(encoding='utf-8'))
        if value.get('kind')!='real_gear_dataset' or not isinstance(value.get('samples'),list):raise ValueError('not a gear dataset')
        return path,value
    except (OSError,ValueError,TypeError):
        raise VisionServiceError(503,'齿轮数据清单不可用，请检查部署配置') from None

def public_dataset():
    path,value=_manifest()
    if value is None:return None
    rows=[r for r in value['samples'] if r.get('split')=='test']
    # Keep the selector small; retain different categories and views first.
    selected=[];seen=set()
    for row in rows:
        key=(row.get('domain'),tuple(sorted({g['label'] for g in row.get('ground_truth',[])})))
        if key not in seen and len(selected)<24: selected.append(row);seen.add(key)
    return {'name':'塑料齿轮测试数据','scope':'public_gear_research_subset',
            'source_url':'',
            'normal_count':sum(r.get('label')=='normal' for r in rows),
            'samples':[{'sample_id':r['sample_id'],'filename':Path(r['path']).name,
                        'defect_labels':sorted({g['label'] for g in r.get('ground_truth',[])})} for r in selected]}

def dataset_sample(sample_id):
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',sample_id):raise VisionServiceError(404,'未找到齿轮测试图片')
    path,value=_manifest()
    allowed=public_dataset()
    if not allowed or sample_id not in {r['sample_id'] for r in allowed['samples']}:
        raise VisionServiceError(404,'未找到齿轮测试图片')
    row=next(r for r in value['samples'] if r['sample_id']==sample_id and r['split']=='test')
    image=(path.parent/row['path']).resolve()
    if not image.is_relative_to(path.parent):raise VisionServiceError(503,'齿轮测试图片路径无效')
    try:
        if image.stat().st_size>4*1024*1024:raise ValueError('image too large')
        data=image.read_bytes()
        if sha256(data).hexdigest()!=row['file_sha256']:raise ValueError('image changed')
    except (OSError,ValueError):raise VisionServiceError(503,'齿轮测试图片校验失败') from None
    return {'sample_id':sample_id,'filename':image.name,
            'image':'data:image/png;base64,'+base64.b64encode(data).decode('ascii'),
            'defect_labels':sorted({g['label'] for g in row['ground_truth']})}
