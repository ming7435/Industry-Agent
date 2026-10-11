from scripts import start_all


def test_worker_is_launched_only_with_document_feature(monkeypatch):
    assert hasattr(start_all,'cad_document_worker_service'), 'document worker startup missing'
    assert start_all.cad_document_worker_service({'FREECAD_DOCUMENTS_ENABLED':'false'}) is None
    entry=start_all.cad_document_worker_service({'FREECAD_DOCUMENTS_ENABLED':'true'})
    assert entry[0]=='cad-document-worker'
    assert entry[1][-1].replace('\\','/').endswith('/scripts/freecad_document_worker.py')
