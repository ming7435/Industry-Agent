import json
from hashlib import sha256

import pytest


def manifest(tmp_path):
    model = tmp_path / 'TC820si.html'
    model.write_text('isolated source model', encoding='utf-8')
    bom = tmp_path / 'bom.pdf'
    bom.write_bytes(b'isolated source document')
    device = 'TRAK-TC820LTYSI-001'
    base = {'device_id': device, 'verified_part_no': None, 'stock_quantity': None}
    def node(identity, parent):
        return {**base, 'node_id': identity, 'parent_node_id': parent,
                'native_model_code': 'ROOT' if identity == '2' else 'TR443560',
                'candidate_part_no': None if identity == '2' else 'TR443560',
                'source_path': str(model), 'source_sha256': sha256(model.read_bytes()).hexdigest()}
    return {'summary': {'device_id': device}, 'native_cad_nodes': [node('2', '1'), node('968', '2')],
            'manual_reference_items': [{**base, 'manual_record_id': 'manual-1', 'name': 'Pump',
                'description': '手册泵参考项', 'installed_quantity': None, 'pdf_page': 6,
                'source_path': str(bom), 'source_sha256': sha256(bom.read_bytes()).hexdigest()}]}


def test_prepared_links_keep_native_identity_without_inventing_stock(tmp_path):
    from app.reference_import import prepare_reference_import
    value = prepare_reference_import(manifest(tmp_path), workspace=tmp_path)
    assert len(value['entities']) == 3
    assert len(value['relations']) == 1
    assert len(value['drawings']) == 2
    for row in value['entities']:
        raw = json.loads(row['raw_json'])
        assert raw['part_no'] == ''
        assert raw['engineering_status'] == 'reference_only'
        assert raw['quantity'] == 0
        assert raw['metadata']['inventory_status'] == 'unverified'
    relation = value['relations'][0]
    assert relation['source_entity_id'].endswith(':CAD:2')
    assert relation['target_entity_id'].endswith(':CAD:968')


@pytest.mark.parametrize('problem', ['changed_source', 'cross_device', 'fake_stock', 'missing_parent', 'duplicate_node'])
def test_bad_source_manifest_is_rejected_before_database_access(tmp_path, problem):
    from app.reference_import import prepare_reference_import
    value = manifest(tmp_path)
    node = value['native_cad_nodes'][1]
    if problem == 'changed_source':
        node['source_sha256'] = '0' * 64
    elif problem == 'cross_device':
        node['device_id'] = 'OTHER'
    elif problem == 'fake_stock':
        node['stock_quantity'] = 4
    elif problem == 'missing_parent':
        node['parent_node_id'] = '404'
    else:
        value['native_cad_nodes'].append(dict(node))
    with pytest.raises(ValueError):
        prepare_reference_import(value, workspace=tmp_path)


def test_preparation_is_repeatable_for_idempotent_import(tmp_path):
    from app.reference_import import prepare_reference_import
    value = manifest(tmp_path)
    assert prepare_reference_import(value, workspace=tmp_path) == prepare_reference_import(value, workspace=tmp_path)


class SQLConnection:
    """Use a real transaction; translate only MySQL parameter/lock syntax."""
    def __init__(self, prepared):
        import sqlite3
        self.database = sqlite3.connect(':memory:', isolation_level=None)
        self.database.row_factory = sqlite3.Row
        for group, table in [('documents', 'rag_documents'), ('drawings', 'cad_drawings'),
                             ('versions', 'cad_drawing_versions'), ('entities', 'cad_entities'),
                             ('relations', 'cad_entity_relations')]:
            keys = prepared[group][0]
            columns = [key + (' INTEGER' if type(value) is int else ' TEXT')
                       + (' PRIMARY KEY' if index == 0 else '')
                       for index, (key, value) in enumerate(keys.items())]
            self.database.execute('CREATE TABLE ' + table + ' (' + ','.join(columns) + ')')

    def begin(self): self.database.execute('BEGIN')
    def commit(self): self.database.commit()
    def rollback(self): self.database.rollback()
    def cursor(self): return self
    def __enter__(self): return self
    def __exit__(self, *_): pass
    def execute(self, sql, params=()):
        self.result = self.database.execute(sql.replace('%s', '?').replace(' FOR UPDATE', ''), params)
    def fetchall(self): return [dict(row) for row in self.result.fetchall()]
    def fetchone(self):
        row = self.result.fetchone()
        return dict(row) if row is not None else None


def test_import_is_persistent_and_idempotent(tmp_path):
    from app.reference_import import prepare_reference_import, apply_reference_import
    prepared = prepare_reference_import(manifest(tmp_path), workspace=tmp_path)
    connection = SQLConnection(prepared)
    first = apply_reference_import(connection, prepared, backup_path=tmp_path / 'first.json')
    second = apply_reference_import(connection, prepared, backup_path=tmp_path / 'second.json')
    assert first['entities']['inserted'] == 3
    assert all(count['inserted'] == 0 for count in second.values())
    assert connection.database.execute('SELECT COUNT(*) FROM cad_entities').fetchone()[0] == 3
    assert connection.database.execute('SELECT COUNT(*) FROM cad_entity_relations').fetchone()[0] == 1


def test_conflicting_existing_reference_rolls_back_without_overwrite(tmp_path):
    from app.reference_import import prepare_reference_import, apply_reference_import
    prepared = prepare_reference_import(manifest(tmp_path), workspace=tmp_path)
    connection = SQLConnection(prepared)
    apply_reference_import(connection, prepared, backup_path=tmp_path / 'before.json')
    connection.database.execute("UPDATE cad_entities SET raw_json='{}' WHERE entity_id=?", (prepared['entities'][0]['entity_id'],))
    with pytest.raises(ValueError, match='已有来源记录不同'):
        apply_reference_import(connection, prepared, backup_path=tmp_path / 'conflict.json')
    assert connection.database.execute('SELECT raw_json FROM cad_entities WHERE entity_id=?',
                                       (prepared['entities'][0]['entity_id'],)).fetchone()[0] == '{}'
