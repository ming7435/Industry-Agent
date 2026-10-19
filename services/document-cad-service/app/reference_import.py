"""Import reviewed source references into the existing engineering query tables."""
from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path

from shared.local_drawings import known_drawing_device


def _json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def _id(value):
    return sha256(value.encode('utf-8')).hexdigest()


def prepare_reference_import(manifest: dict, *, workspace: Path) -> dict:
    """Validate all source hashes and identities before allowing a database write."""
    device = manifest['summary']['device_id']
    if device != 'TRAK-TC820LTYSI-001':
        raise ValueError('此导入只接受已核对的 TC820 设备清单')
    native = manifest.get('native_cad_nodes') or []
    manual = manifest.get('manual_reference_items') or []
    ids = [str(row['node_id']) for row in native]
    if not native or len(set(ids)) != len(ids):
        raise ValueError('原始装配节点为空或重复')
    roots = [row for row in native if str(row['parent_node_id']) not in ids]
    if len(roots) != 1 or str(roots[0]['node_id']) != '2' or str(roots[0]['parent_node_id']) != '1':
        raise ValueError('原始装配树存在缺失的父节点')
    prefix = 'REF:' + device
    cad_id = lambda node: prefix + ':CAD:' + str(node)
    result = {'documents': [], 'drawings': [], 'versions': [], 'entities': [], 'relations': []}
    sources = {}
    children = {}
    for row in native:
        children.setdefault(str(row['parent_node_id']), []).append(row)
    for row, kind in [(row, 'native_cad_node') for row in native] + [(row, 'manual_bom_reference') for row in manual]:
        if row.get('device_id') != device or row.get('verified_part_no') or row.get('stock_quantity') is not None:
            raise ValueError('参考导入不得跨设备或自行声明正式料号和库存')
        path = Path(row['source_path']).resolve()
        if not path.is_relative_to(workspace.resolve()) or not path.is_file():
            raise ValueError('原始来源文件不存在或位于工作区之外')
        digest = sha256(path.read_bytes()).hexdigest()
        if digest != row['source_sha256']:
            raise ValueError('来源文件已改变，请重新核对清单')
        if kind == 'native_cad_node' and known_drawing_device(path.name) != device:
            raise ValueError('原始模型不属于本设备')
        if kind == 'manual_bom_reference' and (path.suffix.lower() != '.pdf' or row.get('pdf_page') not in (6, 7)):
            raise ValueError('手册参考项来源页尚未核对')
        source = path.as_posix()
        if source not in sources:
            document = _id('reference-source:' + source)
            drawing = _id('reference-drawing:' + device + ':' + source)
            version = _id('reference-version:' + drawing + ':' + digest)
            sources[source] = (document, drawing, version)
            result['documents'].append({'document_id': document, 'source_name': path.name,
                'source_path': str(path), 'source_format': path.suffix[1:], 'content_hash': digest,
                'file_size': path.stat().st_size, 'status': 'reference_catalog', 'chunk_count': 0,
                'vector_count': 0, 'metadata_json': _json({'source_kind': kind, 'engineering_status': 'reference_only'})})
            result['drawings'].append({'drawing_id': drawing, 'document_id': document,
                'drawing_name': 'TC820 原始装配树' if kind == 'native_cad_node' else 'TC820 手册参考 BOM',
                'current_version_id': version, 'version_id': version, 'version_label': digest[:12],
                'is_current': 1, 'source_format': path.suffix[1:], 'object_ref': source})
            result['versions'].append({'version_id': version, 'drawing_id': drawing, 'document_id': document,
                'version_label': digest[:12], 'source_format': path.suffix[1:],
                'entity_count': len(native) if kind == 'native_cad_node' else len(manual),
                'metadata_json': _json({'source_sha256': digest, 'engineering_status': 'reference_only'})})
        document, drawing, version = sources[source]
        node = str(row['node_id']) if kind == 'native_cad_node' else str(row['manual_record_id'])
        identity = cad_id(node) if kind == 'native_cad_node' else prefix + ':BOM:' + node
        quantity = row.get('installed_quantity') if kind == 'manual_bom_reference' else None
        if quantity is not None and (type(quantity) is not int or quantity < 0):
            raise ValueError('手册数量无效')
        metadata = {'device_drawing_id': 'DEVICE-REFERENCE-TC820SI', 'source_sha256': digest,
                    'inventory_status': 'unverified', 'stock_quantity': None,
                    'quantity_status': 'not_provided' if quantity is None else 'manual_installed_quantity',
                    'quantity_semantics': 'not_warehouse_stock'}
        raw = {'part_no': '', 'name': row['native_model_code'] if kind == 'native_cad_node'
               else (row.get('description') or row['name']), 'quantity': quantity or 0,
               'device_model': 'TC820LTYsi', 'evidence_scope': 'device_reference',
               'engineering_status': 'reference_only', 'source_kind': kind, 'source_path': source,
               'drawing_url': '/drawings/TC820si.html', 'model_url': '/drawings/TC820si.html',
               'metadata': metadata}
        if kind == 'native_cad_node':
            parent = str(row['parent_node_id'])
            metadata.update(native_node_id=node, native_model_code=row['native_model_code'],
                candidate_part_no=row.get('candidate_part_no'), display_label_verified=False,
                existing_display_label=row.get('existing_display_label', ''),
                parent_component_id=cad_id(parent) if parent in ids else '')
            raw['mesh_id'] = node
            raw['mesh_name'] = row['native_model_code']
            raw['bom_items'] = [{'component_id': cad_id(child['node_id']), 'part_no': '',
                'name': child['native_model_code'], 'quantity': 0, 'engineering_status': 'reference_only'}
                for child in children.get(node, [])]
            if parent in ids:
                result['relations'].append({'relation_id': prefix + ':REL:' + parent + ':' + node,
                    'version_id': version, 'drawing_id': drawing, 'document_id': document,
                    'source_entity_id': cad_id(parent), 'target_entity_id': identity,
                    'relation_type': 'contains', 'evidence_text': '原始 eDrawings 装配树父子关系',
                    'metadata_json': _json({'target_identity_kind': 'cad_component',
                        'engineering_status': 'reference_only', 'source_sha256': digest})})
        else:
            metadata.update(manual_record_id=node, pdf_page=row['pdf_page'],
                original_manual_reference=row.get('original_manual_reference', ''),
                cad_match_status='device_associated_component_mapping_unverified',
                installed_quantity_unit=row.get('installed_quantity_unit'))
        result['entities'].append({'entity_id': identity, 'version_id': version, 'drawing_id': drawing,
            'document_id': document, 'entity_type': kind, 'layer_name': 'SOURCE_REFERENCES',
            'block_name': raw['name'], 'device_id': device, 'text_content': raw['name'], 'raw_json': _json(raw)})
    if len({row['entity_id'] for row in result['entities']}) != len(result['entities']):
        raise ValueError('来源记录编号重复')
    return result


def apply_reference_import(connection, prepared: dict, *, backup_path: Path) -> dict:
    """Atomically insert links, preserving existing documents and refusing overwrites."""
    data = deepcopy(prepared)
    tables = [('drawings', 'cad_drawings', 'drawing_id'), ('versions', 'cad_drawing_versions', 'version_id'),
              ('entities', 'cad_entities', 'entity_id'), ('relations', 'cad_entity_relations', 'relation_id')]
    connection.begin()
    counts = {}
    try:
        with connection.cursor() as cursor:
            existing_documents, documents_to_add, remap = [], [], {}
            for row in data['documents']:
                cursor.execute('SELECT * FROM rag_documents WHERE source_path=%s AND content_hash=%s',
                               (row['source_path'], row['content_hash']))
                existing = cursor.fetchone()
                if existing:
                    existing_documents.append(existing)
                    remap[row['document_id']] = existing['document_id']
                else:
                    documents_to_add.append(row)
            data['documents'] = documents_to_add
            for group, _, _ in tables:
                for row in data[group]:
                    row['document_id'] = remap.get(row['document_id'], row['document_id'])
            backup = {'existing_documents': existing_documents}
            existing_rows = {}
            for group, table, pk in tables:
                rows = data[group]
                if not rows:
                    existing_rows[group] = {}
                    backup[table] = []
                    continue
                cursor.execute('SELECT * FROM ' + table + ' WHERE ' + pk + ' IN ('
                               + ','.join(['%s'] * len(rows)) + ') FOR UPDATE', tuple(row[pk] for row in rows))
                found = list(cursor.fetchall())
                backup[table] = found
                existing_rows[group] = {row[pk]: row for row in found}
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            with backup_path.open('x', encoding='utf-8') as stream:
                json.dump(backup, stream, ensure_ascii=False, indent=2, default=str)
            for group, table, pk in [('documents', 'rag_documents', 'document_id')] + tables:
                added = 0
                for row in data[group]:
                    existing = existing_rows.get(group, {}).get(row[pk])
                    if existing:
                        def comparable(key, value):
                            return json.loads(value) if key.endswith('_json') and isinstance(value, str) else value
                        if any(comparable(key, existing.get(key)) != comparable(key, value) for key, value in row.items()):
                            raise ValueError('已有来源记录不同，已保留原记录并停止导入')
                        continue
                    columns = list(row)
                    cursor.execute('INSERT INTO ' + table + ' (' + ','.join(columns) + ') VALUES ('
                                   + ','.join(['%s'] * len(columns)) + ')', tuple(row[key] for key in columns))
                    added += 1
                counts[group] = {'inserted': added, 'total': len(data[group])}
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    return counts
