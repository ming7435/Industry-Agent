"""登记已取得的真实整机 HTML 图纸；默认仅核查，不连接数据库。"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

def main(argv=None):
    parser = argparse.ArgumentParser(description='登记工单设备的真实整机图纸，保留已有版本')
    parser.add_argument('--device-id', required=True)
    parser.add_argument('--device-model', default='')
    parser.add_argument('--drawing-id', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--filename', required=True, help='图纸目录内的 HTML 文件名，不是绝对路径或网址')
    parser.add_argument('--version', default='')
    parser.add_argument('--version-label', default='')
    parser.add_argument('--source-kind', default='device_reference')
    parser.add_argument('--historical', action='store_true')
    parser.add_argument('--apply', action='store_true', help='确认新增目录元数据；默认只核查')
    args = parser.parse_args(argv)
    from dotenv import load_dotenv
    load_dotenv(ROOT / '.env', override=False)
    record = {'device_id':args.device_id, 'device_model':args.device_model, 'drawing_id':args.drawing_id,
        'drawing_name':args.name, 'filename':args.filename, 'version_id':args.version,
        'version_label':args.version_label, 'source_kind':args.source_kind, 'current':not args.historical}
    from app.repository import CADRepositoryError, get_repository, reset_repository, validate_device_drawing_registration
    try:
        record = validate_device_drawing_registration(record)
    except CADRepositoryError as error:
        parser.error(str(error))
    if not args.apply:
        print(json.dumps({'status':'核查通过，尚未写入数据库', 'drawing':record}, ensure_ascii=False))
        return 0
    try:
        repository = get_repository()
        if not hasattr(repository, 'register_device_drawing'):
            raise CADRepositoryError('必须使用 MySQL 图纸目录')
        repository.register_device_drawing(record)
        print(json.dumps({'status':'已登记，未覆盖已有版本', 'drawing':record}, ensure_ascii=False))
        return 0
    except CADRepositoryError as error:
        print(str(error), file=sys.stderr)
        return 1
    finally:
        reset_repository()


if __name__ == '__main__':
    raise SystemExit(main())
