import importlib
from concurrent.futures import ThreadPoolExecutor

import pytest

from shared.freecad_documents import CadDocumentError, parse_command


def repository(path):
    assert importlib.util.find_spec('app.cad_documents'), 'persistent CAD repository missing'
    return importlib.import_module('app.cad_documents.repository').CadDocumentRepository(sqlite_path=path)


def claim(doc, label='零件'):
    return parse_command(dict(command_id='CMD-one', document_id=doc.document_id, expected_revision=0,
                             command_type='set_label', parameters=dict(object_id='OBJ-a', label=label)))


def test_reopen_preserves_revision(tmp_path):
    path = tmp_path/'cad.sqlite'
    repo = repository(path)
    doc = repo.create_document('USER-a', 'request-1', '安装底板', '04898')
    assert doc.part_number == '04898'
    assert repository(path).get_document('USER-a', doc.document_id).revision == 0
    assert repo.create_document('USER-a', 'request-1', '安装底板', '04898').document_id == doc.document_id
    assert repo.read_snapshot('USER-a', doc.document_id, 0).objects == []
    with pytest.raises(CadDocumentError):
        repo.create_document('USER-a', 'request-1', '别的零件', '04898')


def test_claim_is_atomic(tmp_path):
    repo = repository(tmp_path/'cad.sqlite')
    doc = repo.create_document('USER-a', 'request-1', '底板', '')
    with ThreadPoolExecutor(2) as pool:
        results = list(pool.map(lambda _: repo.claim_command('USER-a', claim(doc)), [0, 1]))
    assert results[0].job_id == results[1].job_id
    with pytest.raises(CadDocumentError) as error:
        repo.claim_command('USER-a', claim(doc, 'changed'))
    assert error.value.status_code == 409


def test_foreign_actor_or_cursor_cannot_read(tmp_path):
    repo = repository(tmp_path/'cad.sqlite')
    doc = repo.create_document('USER-a', 'request-1', '底板', '')
    repo.create_document('USER-a', 'request-2', '底板2', '')
    record = repo.claim_command('USER-a', claim(doc))
    for operation in [lambda: repo.get_document('USER-b', doc.document_id),
                      lambda: repo.get_command('USER-b', doc.document_id, 'CMD-one'),
                      lambda: repo.list_documents('USER-b', repo.list_documents('USER-a', limit=1)['next_cursor'])]:
        with pytest.raises(CadDocumentError) as error:
            operation()
        assert error.value.status_code == 403
    assert len(repo.list_documents('USER-a')['items']) == 2
    assert repo.list_designs('USER-a')['directory_version'] == 0


def test_bad_identity_and_sqlite_production_guard(tmp_path, monkeypatch):
    repo = repository(tmp_path/'cad.sqlite')
    for actor in ['', 'USER-a\n', 'a'*200]:
        with pytest.raises(CadDocumentError):
            repo.create_document(actor, 'r', '底板', '')
    monkeypatch.setenv('APP_ENV', 'production')
    with pytest.raises(CadDocumentError):
        repository(tmp_path/'other.sqlite')
