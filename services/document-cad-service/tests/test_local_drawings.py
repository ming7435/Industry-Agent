"""Device reference drawings supplement empty engineering searches without inventing parts."""
import pytest
from fastapi.testclient import TestClient

from app import main
from app.repository import CADRepositoryError


DEVICES = [
    ('TRAK-TC820LTYSI-001', 'TC820LTYsi', 'TC820si.html', 'DEVICE-REFERENCE-TC820SI', 'original_edrawings'),
    ('LNS-QL-SERVO-80-S2-001', 'QL Servo 80 S2', 'QLS80S2.html', 'DEVICE-REFERENCE-QLS80S2', 'reference_model'),
    ('RENISHAW-EQUATOR300-001', 'Equator300', 'Equator300.html', 'DEVICE-REFERENCE-EQUATOR300', 'reference_model'),
]


@pytest.fixture
def reference_root(tmp_path, monkeypatch):
    for _, _, filename, _, _ in DEVICES:
        (tmp_path / filename).write_text('<html>isolated source file; never execute</html>', encoding='utf-8')
    monkeypatch.setenv('LOCAL_DRAWINGS_ROOT', str(tmp_path))
    return tmp_path


class Repository:
    backend = 'mysql-engineering-metadata'
    def __init__(self, items=()):
        self.items = list(items)
    def search(self, query, filters=None):
        return self.items
    def count(self):
        return len(self.items)


@pytest.fixture
def client(reference_root, monkeypatch):
    monkeypatch.setattr(main, 'get_repository', lambda: Repository())
    return TestClient(main.app)


@pytest.mark.parametrize('device_id,model,filename,drawing_id,kind', DEVICES)
def test_existing_local_device_drawing_is_discoverable_but_not_engineering_parts(client, device_id, model, filename, drawing_id, kind):
    for operation in ('query_drawing', 'fetch_engineering_record'):
        response = client.post('/tools/call', json={'tool': operation, 'arguments': {'device_id': device_id, 'query': '设备图纸'}})
        assert response.status_code == 200
        data = response.json()
        assert len(data['drawings']) == 1
        drawing = data['drawings'][0]
        assert drawing['drawing_id'] == drawing_id
        assert drawing['device_id'] == device_id
        assert drawing['device_model'] == model
        assert drawing['drawing_url'] == drawing['model_url'] == '/drawings/' + filename
        assert drawing['source_kind'] == kind
        assert drawing['source_format'] == 'html'
        assert drawing['evidence_scope'] == 'device_reference'
        assert drawing['engineering_status'] == data['engineering_status'] == 'reference_only'
        assert drawing['source_path'].endswith(filename)
        assert data.get('components', []) == []
        assert data.get('bom_items', []) == []
        assert 'part_no' not in drawing


@pytest.mark.parametrize('arguments', [
    {}, {'device_id': 'UNKNOWN'}, {'device_id': 'ELITE-CS612-001'},
    {'device_id': DEVICES[0][0], 'device_model': DEVICES[1][1]},
    {'device_id': DEVICES[0][0], 'drawing_id': 'OTHER'},
    {'device_id': DEVICES[0][0], 'version': 'A'},
    {'device_id': DEVICES[0][0], 'tenant_id': 'OTHER'},
    {'device_id': DEVICES[0][0], 'project_id': 'OTHER'},
    {'device_model': '!!!'}, {'device_id': DEVICES[0][0], 'device_model': '!!!'},
    {'device_model': {}}, {'device_id': {}},
    {'device_model': ['TC820LTYsi']}, {'device_model': {'TC820LTYsi': ''}},
    *[{'device_id': DEVICES[0][0], key: {}} for key in ('tenant_id', 'project_id', 'version', 'drawing_id')],
])
def test_reference_lookup_never_ignores_device_or_structured_scope(client, arguments):
    data = client.post('/tools/call', json={'tool': 'query_drawing', 'arguments': arguments}).json()
    assert data['drawings'] == []


def test_model_lookup_and_exact_drawing_id_select_only_matching_source(client):
    data = client.post('/tools/call', json={'tool': 'query_drawing', 'arguments': {
        'device_model': 'TRAK TC820LTYsi', 'drawing_id': DEVICES[0][3]}}).json()
    assert [item['device_id'] for item in data['drawings']] == [DEVICES[0][0]]


def test_real_engineering_match_is_not_mixed_with_unrelated_device_reference(client, monkeypatch):
    item = {'component_id': 'REAL-PART', 'part_no': 'PN-REAL', 'name': '真实部件',
            'device_id': DEVICES[0][0], 'drawing_ref': 'DWG-REAL', 'position': '位置',
            'drawing_url': '/engineering/dwg-real.pdf', 'model_url': '/engineering/model-real.glb',
            'evidence_scope': 'component_engineering', 'engineering_status': 'validated'}
    monkeypatch.setattr(main, 'get_repository', lambda: Repository([item]))
    data = client.post('/tools/call', json={'tool': 'query_drawing', 'arguments': {'device_id': DEVICES[0][0]}}).json()
    assert [drawing['drawing_id'] for drawing in data['drawings']] == ['DWG-REAL']
    assert data['drawings'][0]['drawing_url'] == item['drawing_url']
    assert data['drawings'][0]['evidence_scope'] == 'component_engineering'


def test_backend_error_is_not_hidden_by_existing_local_files(client, monkeypatch):
    class FailedRepository(Repository):
        def search(self, *args, **kwargs):
            raise CADRepositoryError('isolated backend unavailable')
    monkeypatch.setattr(main, 'get_repository', lambda: FailedRepository())
    response = client.post('/tools/call', json={'tool': 'query_drawing', 'arguments': {'device_id': DEVICES[0][0]}})
    assert response.status_code == 503


@pytest.mark.parametrize('operation,key', [('query_part', 'parts'), ('query_bom', 'bom_items'), ('query_relation', 'relations')])
def test_device_reference_never_invents_part_bom_or_relation(client, operation, key):
    data = client.post('/tools/call', json={'tool': operation, 'arguments': {'device_id': DEVICES[0][0]}}).json()
    assert data[key] == []


def test_health_counts_reference_sources_separately_without_faking_records(client):
    health = client.get('/health').json()
    assert health['records'] == 0
    assert health['reference_drawings'] == 3


def test_missing_source_does_not_create_references(client, reference_root):
    path = reference_root / DEVICES[0][2]
    path.unlink()
    assert client.post('/tools/call', json={'tool': 'query_drawing', 'arguments': {'device_id': DEVICES[0][0]}}).json()['drawings'] == []


def test_symlink_outside_configured_directory_is_excluded(reference_root):
    from shared.local_drawings import device_reference_drawings
    path = reference_root / DEVICES[0][2]
    path.unlink()
    outside = reference_root.parent / 'outside-reference.html'
    outside.write_text('<html>outside allowed root</html>', encoding='utf-8')
    try:
        path.symlink_to(outside)
    except OSError:
        pytest.skip('Host does not permit isolated filesystem symlinks')
    assert device_reference_drawings(device_id=DEVICES[0][0]) == []


def test_resolved_source_outside_directory_is_excluded_even_without_symlink_permission(reference_root, monkeypatch):
    from shared.local_drawings import device_reference_drawings
    from pathlib import Path
    path = reference_root / DEVICES[0][2]
    outside = reference_root.parent / 'resolved-outside.html'
    outside.write_text('<html>outside allowed root</html>', encoding='utf-8')
    resolve = Path.resolve
    monkeypatch.setattr(Path, 'resolve', lambda self, *args, **kwargs:
                        outside if self == path else resolve(self, *args, **kwargs))
    assert device_reference_drawings(device_id=DEVICES[0][0]) == []


def test_invalid_explicit_root_does_not_fall_back_to_workspace_sources(reference_root, monkeypatch):
    from shared.local_drawings import device_reference_drawings
    monkeypatch.setenv('LOCAL_DRAWINGS_ROOT', str(reference_root / 'missing'))
    assert device_reference_drawings(device_id=DEVICES[0][0]) == []


def test_built_directory_is_same_source_fallback_only_when_default_files_are_unavailable(tmp_path, monkeypatch):
    from shared import local_drawings
    monkeypatch.delenv('LOCAL_DRAWINGS_ROOT', raising=False)
    monkeypatch.setattr(local_drawings, '_ROOT', tmp_path)
    built = tmp_path / 'frontend/monitor/drawings'
    built.mkdir(parents=True)
    (built / DEVICES[0][2]).write_text('<html>same source build artifact</html>', encoding='utf-8')
    records = local_drawings.device_reference_drawings(device_id=DEVICES[0][0])
    assert len(records) == 1
    assert records[0]['source_path'] == 'frontend/monitor/drawings/' + DEVICES[0][2]
    assert local_drawings.device_reference_drawings(device_id=DEVICES[1][0]) == []


def test_reference_requests_do_not_read_or_execute_large_html(reference_root, monkeypatch):
    from shared.local_drawings import device_reference_drawings
    from pathlib import Path
    def forbid_content_read(*args, **kwargs):
        raise AssertionError('Drawing catalog requests may inspect stat, never parse the HTML body')
    monkeypatch.setattr(Path, 'read_text', forbid_content_read)
    monkeypatch.setattr(Path, 'read_bytes', forbid_content_read)
    assert len(device_reference_drawings(device_id=DEVICES[0][0])) == 1


def test_mysql_normalization_preserves_actual_viewer_links_and_provenance():
    from app.repository import MySQLCADRepository
    raw = {'part_no': 'PN-REAL', 'drawing_url': '/engineering/drawing.pdf', 'model_url': '/engineering/model.glb',
           'mesh_id': 'REAL-MESH', 'evidence_scope': 'component_engineering', 'engineering_status': 'validated',
           'source_kind': 'original_dxf', 'source_path': 'engineering/drawing.dxf'}
    item = MySQLCADRepository._normalize({'entity_id': 'REAL', 'drawing_id': 'DWG-REAL',
                                         'device_id': DEVICES[0][0], 'raw_json': raw})
    for key in ('drawing_url', 'model_url', 'mesh_id', 'evidence_scope', 'engineering_status', 'source_kind', 'source_path'):
        assert item[key] == raw[key]
