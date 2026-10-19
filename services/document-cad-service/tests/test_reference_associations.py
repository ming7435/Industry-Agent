"""Source-backed references remain queryable without becoming verified spare parts."""
import json

import pytest
from fastapi.testclient import TestClient

from app import main
from app.repository import MySQLCADRepository


def reference():
    return MySQLCADRepository._normalize({
        'entity_id': 'TRAK:TR443560', 'entity_type': 'native_cad_node',
        'drawing_id': 'TC820-REFERENCE', 'device_id': 'TRAK-TC820LTYSI-001',
        'raw_json': {'name': 'TR443560', 'quantity': 0, 'part_no': '',
                     'engineering_status': 'reference_only', 'evidence_scope': 'device_reference',
                     'metadata': {'native_node_id': '968', 'candidate_part_no': 'TR443560',
                                  'inventory_status': 'unverified', 'quantity_status': 'not_provided'}},
    })


def test_reference_normalization_keeps_unknown_quantity_and_source_identity():
    value = reference()
    assert value['quantity'] == 0
    assert value['metadata']['native_node_id'] == '968'
    assert value['metadata']['inventory_status'] == 'unverified'
    assert value['part_no'] == ''
    assert value['part_identity_status'] == 'unknown'


@pytest.mark.parametrize('tool,key', [('query_drawing', 'drawings'), ('query_bom', 'bom_items'),
                                     ('fetch_engineering_record', 'components')])
def test_reference_query_preserves_unverified_status(monkeypatch, tool, key):
    class Repository:
        backend = 'mysql-engineering-metadata'

        def search(self, *args, **kwargs):
            return [reference()]

    monkeypatch.setattr(main, 'get_repository', lambda: Repository())
    response = TestClient(main.app).post('/tools/call', json={
        'tool': tool, 'arguments': {'device_id': 'TRAK-TC820LTYSI-001'}})
    assert response.status_code == 200
    data = response.json()
    assert data['engineering_status'] == 'reference_only'
    assert data[key][0]['engineering_status'] == 'reference_only'
    if tool == 'query_bom':
        assert data[key][0]['metadata']['inventory_status'] == 'unverified'


def test_native_parent_relation_does_not_become_a_spare_part_number():
    repo = object.__new__(MySQLCADRepository)
    repo._query = lambda *args: [{
        'source_entity_id': 'TRAK:PARENT', 'target_entity_id': 'TRAK:CHILD',
        'relation_type': 'contains', 'evidence_text': '原始装配树',
        'metadata_json': json.dumps({'target_identity_kind': 'cad_component',
                                      'engineering_status': 'reference_only'}),
    }]
    relation = repo._relations_for_many(['TRAK:CHILD'])['TRAK:CHILD'][0]
    assert relation['part_no'] == ''
    assert relation['component_id'] == 'TRAK:CHILD'
    assert relation['source_entity_id'] == 'TRAK:PARENT'
    assert relation['target_entity_id'] == 'TRAK:CHILD'


def test_reference_catalog_summary_is_returned_with_device_drawing(monkeypatch):
    class Repository:
        backend = 'mysql-engineering-metadata'

        def search_device_drawings(self, **kwargs):
            return []

        def device_association_summary(self, **kwargs):
            return {'device_id': kwargs['device_id'], 'cad_nodes': 121,
                    'manual_bom_items': 31, 'parent_links': 120, 'verified_inventory_items': 0}

    monkeypatch.setattr(main, 'get_repository', lambda: Repository())
    result = main.query_drawing(device_id='TRAK-TC820LTYSI-001', reference_only=True)
    assert result['association_summary']['cad_nodes'] == 121
    assert result['association_summary']['verified_inventory_items'] == 0
