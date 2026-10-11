from scripts import start_all


def test_worker_is_launched_only_with_document_feature(monkeypatch):
    assert hasattr(start_all,'cad_document_worker_service'), 'document worker startup missing'
    assert start_all.cad_document_worker_service({'FREECAD_DOCUMENTS_ENABLED':'false'}) is None
    entry=start_all.cad_document_worker_service({'FREECAD_DOCUMENTS_ENABLED':'true'})
    assert entry[0]=='cad-document-worker'
    assert entry[1][-1].replace('\\','/').endswith('/scripts/freecad_document_worker.py')


def test_successful_duplicate_worker_does_not_tear_down_app_services():
    class Process:
        def __init__(self,code):self.code=code
        def poll(self):return self.code
    assert start_all.unexpected_service_exit([('cad-document-worker',Process(0)),('backend-service',Process(None))]) is None
    assert start_all.unexpected_service_exit([('cad-document-worker',Process(1))])==('cad-document-worker',1)
    assert start_all.unexpected_service_exit([('backend-service',Process(0))])==('backend-service',0)
