"""Read-only statistics of complete pipeline inspections, isolated by owner."""
from collections import Counter
from functools import lru_cache
import json
from pathlib import Path

LABELS = {'dirt': '污渍', 'stain': '污渍', 'brown_stain': '褐色污渍', 'hair': '细丝／异物',
          'filament': '细丝／异物', 'darkspot': '暗斑', 'white': '白斑', 'scratch': '划伤',
          'damage': '表面损伤', 'missing': '缺损', 'broken': '破损／断裂', 'crack': '裂纹',
          'flash': '飞边', 'void': '空洞', 'overflow': '溢料', 'perforation': '穿孔',
          'bulge': '凸起', 'burn': '烧伤', 'shortshot': '欠注／缺料', 'flow': '流痕',
          'reverse': '方向异常', 'unlocalized': '异常待定位／分类'}
MAX_RECORDS = 2000
MAX_RECORD_BYTES = 64 * 1024 * 1024


@lru_cache(maxsize=512)
def _compact(path, modified_ns, size):
    # Cache only compact facts. The file signature invalidates replaced records.
    if size > MAX_RECORD_BYTES:
        raise ValueError('inspection too large')
    record = json.loads(Path(path).read_text(encoding='utf8'))
    if record.get('algorithm') != 'patchcore_yolo_pipeline':
        return None
    if record.get('inspection_id') != Path(path).stem or record.get('pipeline_version') != 1:
        raise ValueError('invalid inspection identity')
    pc, yolo = record.get('patchcore') or {}, record.get('yolo')
    status, state = record.get('status'), record.get('yolo_state')
    if status not in {'clear', 'defect'} or pc.get('status') != status:
        raise ValueError('inconsistent pipeline verdict')
    if status == 'clear' and (state != 'skipped' or yolo is not None):
        raise ValueError('invalid clear pipeline')
    labels = []
    if status == 'defect':
        if state == 'completed' and isinstance(yolo, dict) and yolo.get('status') in {'clear', 'defect'}:
            defects = yolo.get('defects')
            if not isinstance(defects, list) or (yolo['status'] == 'defect') != bool(defects):
                raise ValueError('invalid localization')
            for defect in defects:
                label = defect.get('label')
                if not isinstance(label, str) or not label.strip():
                    raise ValueError('missing defect category')
                labels.append(label)
        elif state != 'failed' or yolo is not None:
            raise ValueError('incomplete pipeline')
    return {'status': status, 'labels': labels, 'part_id': record.get('part_id', ''),
            'image_source': record.get('image_source', 'upload'),
            'demo': (pc.get('model') or {}).get('demo') is True or ((yolo or {}).get('model') or {}).get('demo') is True}


def inspection_statistics(vision, owner, *, image_source='upload', part_id=''):
    if image_source not in {'upload', 'public_gear_reference'}:
        raise ValueError('unsupported statistics source')
    folder = vision._owner_root(owner) / 'inspections'
    paths = sorted(folder.glob('VI-*.json'), key=lambda p: p.stat().st_mtime_ns, reverse=True)
    total = qualified = unqualified = unlocalized = invalid = research = 0
    image_counts, occurrences = Counter(), Counter()
    for path in paths[:MAX_RECORDS]:
        try:
            stat = path.stat()
            value = _compact(str(path), stat.st_mtime_ns, stat.st_size)
        except (OSError, ValueError, TypeError, AttributeError):
            invalid += 1
            continue
        if not value or value['image_source'] != image_source or (part_id and value['part_id'] != part_id):
            continue
        # The deployed YOLO is marked research/demo. Excluding just those
        # localized anomalies would leave PC-clear records and inflate the rate.
        research += int(value['demo'])
        total += 1
        if value['status'] == 'clear':
            qualified += 1
        else:
            unqualified += 1
            labels = value['labels']
            if not labels:
                unlocalized += 1
                image_counts['unlocalized'] += 1
            else:
                occurrences.update(labels)
                image_counts.update(set(labels))
    return {'version': 1, 'unit': 'image_inspection', 'image_source': image_source, 'part_id': part_id,
            'counts': {'total': total, 'qualified': qualified, 'unqualified': unqualified, 'unlocalized': unlocalized},
            'qualified_rate': round(100 * qualified / total, 2) if total else None,
            'types': [{'key': key, 'label': LABELS.get(key, key), 'image_count': count, 'occurrences': occurrences[key],
                       'share': round(100 * count / unqualified, 2)} for key, count in sorted(image_counts.items(), key=lambda row: (-row[1], row[0]))],
            'invalid_records': invalid, 'research_model_count': research, 'truncated': len(paths) > MAX_RECORDS}
