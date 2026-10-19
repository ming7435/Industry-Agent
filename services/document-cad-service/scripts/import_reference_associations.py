"""Register reviewed CAD/manual references; dry-run by default."""
import argparse
import json
import os
from pathlib import Path
import sys


def main():
    root = Path(__file__).resolve().parents[3]
    sys.path[:0] = [str(root / 'services/document-cad-service'), str(root)]
    from dotenv import dotenv_values
    from app.reference_import import prepare_reference_import, apply_reference_import
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--backup', type=Path)
    args = parser.parse_args()
    prepared = prepare_reference_import(json.loads(args.manifest.read_text(encoding='utf-8')), workspace=root)
    if not args.apply:
        print(json.dumps({'dry_run': True, 'records': {key: len(value) for key, value in prepared.items()}}, ensure_ascii=False))
        return
    if args.backup is None:
        parser.error('--apply requires --backup')
    cfg = {**dotenv_values(root / '.env'), **dotenv_values(root / 'services/document-cad-service/.env'), **os.environ}
    import pymysql
    connection = pymysql.connect(host=cfg.get('CAD_MYSQL_HOST') or cfg.get('MYSQL_HOST', '127.0.0.1'),
        port=int(cfg.get('CAD_MYSQL_PORT') or cfg.get('MYSQL_PORT', 3306)),
        user=cfg.get('CAD_MYSQL_USER') or cfg.get('MYSQL_USER', 'root'),
        password=cfg.get('CAD_MYSQL_PASSWORD') or cfg.get('MYSQL_PASSWORD', ''),
        database=cfg.get('CAD_MYSQL_DATABASE') or cfg.get('MYSQL_DATABASE', 'industry_agent'),
        charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor, autocommit=False)
    try:
        result = apply_reference_import(connection, prepared, backup_path=args.backup)
    finally:
        connection.close()
    print(json.dumps({'applied': True, 'records': result}, ensure_ascii=False))


if __name__ == '__main__':
    main()
