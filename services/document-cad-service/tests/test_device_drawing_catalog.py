"""整机图纸使用真实仓库查询；SQL 适配器只负责隔离数据库方言。"""
import sqlite3

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repository import CADRepositoryError, get_repository, reset_repository
from test_runtime_connectivity import database  # 复用临时数据库，禁止访问正式 MySQL


DEVICES = [
    ('TRAK-TC820LTYSI-001', 'TC820si.html'),
    ('LNS-QL-SERVO-80-S2-001', 'QLS80S2.html'),
    ('RENISHAW-EQUATOR300-001', 'Equator300.html'),
]
ROBOT = 'ELITE-CS612-ROBOT-001'


@pytest.fixture
def drawings(tmp_path, monkeypatch):
    monkeypatch.setenv('LOCAL_DRAWINGS_ROOT', str(tmp_path))
    for _, filename in DEVICES:
        (tmp_path / filename).write_text('<html>隔离图纸，不执行脚本</html>', encoding='utf-8')
    return tmp_path


def read(device_id, **filters):
    return TestClient(app).post('/tools/call', json={'tool': 'query_drawing', 'arguments': {
        'device_id': device_id, 'reference_only': True, **filters}})


@pytest.mark.parametrize('device_id,filename', DEVICES)
def test_device_query_uses_index_not_component_match(database, drawings, device_id, filename):
    database.add()  # 整机目录不能被无关的部件工程记录覆盖
    result = read(device_id)
    assert result.status_code == 200
    data = result.json()
    assert data['catalog_backend'] == 'mysql-device-drawings'
    assert data['engineering_status'] == 'reference_only'
    assert [item['drawing_url'] for item in data['drawings']] == ['/drawings/' + filename]
    assert all(item['device_id'] == device_id for item in data['drawings'])
    with sqlite3.connect(database.path) as connection:
        assert connection.execute('SELECT COUNT(*) FROM cad_device_drawings').fetchone()[0] == 3
        assert connection.execute('SELECT COUNT(*) FROM cad_entities').fetchone()[0] == 1


def test_robot_missing_then_registered_uses_same_exact_query(database, drawings):
    assert read(ROBOT).json()['drawings'] == []
    (drawings / 'EliteCS612.html').write_text('<html>隔离机器人图纸</html>', encoding='utf-8')
    repo = get_repository()
    repo.register_device_drawing({'drawing_id': 'ROBOT-DRAWING', 'device_id': ROBOT,
        'device_model': 'CS612', 'drawing_name': 'CS612 机器人整机图', 'filename': 'EliteCS612.html',
        'version_id': 'V2', 'version_label': 'B', 'source_kind': 'original_edrawings'})
    reset_repository()
    data = read(ROBOT, version='B').json()
    assert data['drawings'][0]['device_id'] == ROBOT
    assert data['drawings'][0]['drawing_url'] == '/drawings/EliteCS612.html'
    assert read(ROBOT, version='A').json()['drawings'] == []
    assert read(ROBOT, device_model='TC820LTYsi').json()['drawings'] == []


@pytest.mark.parametrize('filters', [{}, {'device_id': 'UNKNOWN'}, {'device_id': "x' OR 1=1 --"},
    {'device_id': DEVICES[0][0], 'device_model': 'Equator300'},
    {'device_id': DEVICES[0][0], 'version': 'UNKNOWN'},
    {'device_id': DEVICES[0][0], 'component': 'TURRET-ASSY'},
    {'device_id': DEVICES[0][0], 'part_no': 'PN-X'},
    {'device_id': DEVICES[0][0], 'tenant_id': 'OTHER'}])
def test_catalog_never_ignores_scope(database, drawings, filters):
    data = read(**({'device_id': '', **filters})).json()
    assert data['drawings'] == []


def test_missing_file_and_database_outage_are_distinct(database, drawings):
    assert read(DEVICES[0][0]).json()['drawings']
    (drawings / DEVICES[0][1]).unlink()
    assert read(DEVICES[0][0]).json()['drawings'] == []
    reset_repository()
    database.unavailable = True
    assert read(DEVICES[1][0]).status_code == 503


def test_catalog_bootstrap_preserves_registered_metadata_and_no_writes_on_read(database, drawings):
    repo = get_repository()
    with sqlite3.connect(database.path) as connection:
        connection.execute("UPDATE cad_device_drawings SET drawing_name='工程人员修订名称' WHERE device_id=?", (DEVICES[0][0],))
    reset_repository()
    assert read(DEVICES[0][0]).json()['drawings'][0]['drawing_name'] == '工程人员修订名称'
    repo = get_repository()
    repo.connection.database.execute('PRAGMA query_only=ON')
    assert read(DEVICES[0][0]).status_code == 200


@pytest.mark.parametrize('filename', ['../TC820si.html', '/drawings/TC820si.html', 'https://evil.test/a.html', 'x.html?y=1', 'missing.html'])
def test_registration_rejects_invalid_or_missing_file(database, drawings, filename):
    with pytest.raises(CADRepositoryError):
        get_repository().register_device_drawing({'drawing_id':'BAD', 'device_id':ROBOT,
            'device_model':'CS612', 'drawing_name':'图纸', 'filename':filename})


def test_existing_version_cannot_be_reassigned_to_robot(database, drawings):
    with pytest.raises(CADRepositoryError):
        get_repository().register_device_drawing({'drawing_id':'DEVICE-REFERENCE-TC820SI',
            'device_id':ROBOT, 'drawing_name':'不能覆盖', 'filename':'TC820si.html'})
    assert read(ROBOT).json()['drawings'] == []
    assert read(DEVICES[0][0]).json()['drawings'][0]['device_id'] == DEVICES[0][0]


def test_reference_mode_cannot_accept_string_boolean(database, drawings):
    response = TestClient(app).post('/tools/call', json={'tool':'query_drawing', 'arguments':{
        'device_id':DEVICES[0][0], 'reference_only':'false'}})
    assert response.status_code == 400


def test_registration_entry_defaults_to_dry_run(database, drawings, capsys):
    import register_device_drawing
    result = register_device_drawing.main(['--device-id',DEVICES[0][0], '--drawing-id','DEVICE-REFERENCE-TC820SI',
        '--name','图纸名称', '--filename','TC820si.html'])
    assert result == 0
    assert '尚未写入数据库' in capsys.readouterr().out
    assert database.connections == []


def test_registration_entry_apply_adds_only_real_file(database, drawings):
    import register_device_drawing
    (drawings / 'EliteCS612.html').write_text('<html>隔离图纸</html>', encoding='utf-8')
    result = register_device_drawing.main(['--device-id',ROBOT, '--drawing-id','ROBOT',
        '--name','机器人整机图', '--filename','EliteCS612.html', '--apply'])
    assert result == 0
    assert read(ROBOT).json()['drawings'][0]['drawing_url'] == '/drawings/EliteCS612.html'


@pytest.mark.parametrize('filename', ['TC820si.html', 'tc820si.html', 'TC820SI.html'])
def test_known_lathe_file_cannot_be_registered_or_served_as_robot(database, drawings, filename):
    (drawings / filename).write_text('<html>同一已知设备文件的大小写变体</html>', encoding='utf-8')
    repo = get_repository()
    with pytest.raises(CADRepositoryError):
        repo.register_device_drawing({'drawing_id':'WRONG-ROBOT', 'device_id':ROBOT,
            'drawing_name':'错配图纸', 'filename':filename})
    with sqlite3.connect(database.path) as connection:
        connection.execute('INSERT INTO cad_device_drawings (drawing_id,device_id,drawing_name,filename) VALUES (?,?,?,?)',
            ('INVALID-ROBOT',ROBOT,'历史错配图纸',filename))
    assert read(ROBOT).status_code == 503


@pytest.mark.parametrize('filters', [{'device_id':ROBOT.lower()}, {'device_model':'cs612'},
    {'drawing_id':'robot-drawing'}, {'version':'v2'}, {'version':'b'}])
def test_catalog_postfilters_exact_identifiers_with_case_insensitive_database(database, drawings, filters):
    (drawings / 'EliteCS612.html').write_text('<html>隔离真实文件边界</html>', encoding='utf-8')
    get_repository().register_device_drawing({'drawing_id':'ROBOT-DRAWING', 'device_id':ROBOT,
        'device_model':'CS612', 'drawing_name':'机器人图纸', 'filename':'EliteCS612.html',
        'version_id':'V2', 'version_label':'B'})
    assert read(ROBOT, device_model='CS612', drawing_id='ROBOT-DRAWING', version='B').json()['drawings']
    assert read(**{'device_id':ROBOT, **filters}).json()['drawings'] == []


@pytest.mark.parametrize('changes', [{'device_id':ROBOT}, {'name':''}, {'drawing_id':'X'*129}])
def test_registration_dry_run_checks_metadata_without_database_connection(database, drawings, changes):
    import register_device_drawing
    values = {'device_id':DEVICES[0][0], 'drawing_id':'DEVICE-REFERENCE-TC820SI',
        'name':'设备图纸', 'filename':'TC820si.html', **changes}
    arguments = [arg for key, value in values.items() for arg in ('--'+key.replace('_','-'), value)]
    with pytest.raises(SystemExit) as stopped:
        register_device_drawing.main(arguments)
    assert stopped.value.code == 2
    assert database.connections == []
