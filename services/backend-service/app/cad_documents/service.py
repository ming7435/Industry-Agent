"""Explicit internal operations; never resolves arbitrary methods or executes code."""
from shared.freecad_documents import CadDocumentError


class CadDocumentService:
    OPERATIONS = {'create_document','get_document','read_snapshot','claim_command','get_command',
                  'list_documents','list_designs','find_published','enqueue_system_job','job','engine_state',
                  'take_job','complete_job','fail_job','claim_import','claim_publication','commit_publication','published_exists','native_job'}

    def __init__(self, repository):
        self.repository = repository

    def call(self, operation, payload):
        if operation not in self.OPERATIONS:
            raise CadDocumentError('operation_unknown', '未注册CAD内部操作', 404)
        try:
            value = getattr(self.repository, operation)(**payload)
        except TypeError:
            raise CadDocumentError('payload_invalid', 'CAD请求字段无效', 422) from None
        if hasattr(value, 'model_dump'):
            value = value.model_dump(mode='json')
        return {'result': value}
