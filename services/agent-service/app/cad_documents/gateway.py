"""Authenticated internal transport; operations remain explicitly whitelisted."""
from contextvars import ContextVar
import time

from app.clients.backend import BackendServiceClient, BackendServiceError
from shared.freecad_documents import CadDocumentError, CommandRecord, NativeJob

worker_execution = ContextVar('cad_document_worker_execution',default=False)


class Gateway:
    OPERATIONS={'create_document','get_document','read_snapshot','claim_command','get_command','list_documents',
                'list_designs','find_published','enqueue_system_job','job','engine_state','take_job','complete_job','fail_job',
                'claim_import','claim_publication','commit_publication','published_exists'}

    def __init__(self, backend=None): self.backend=backend or BackendServiceClient()

    def call(self, operation, **body):
        if operation not in self.OPERATIONS:
            raise CadDocumentError('operation_unknown','不允许的CAD操作',404)
        try:
            return self.backend.request('/internal/cad/documents/'+operation,body)['result']
        except BackendServiceError as error:
            status=error.status_code or 503
            messages={403:'无权访问该CAD文档',404:'CAD文档或命令不存在',409:'文档已更新或存在未终结命令，请刷新查回',422:'CAD请求参数无效',401:'CAD身份已失效'}
            raise CadDocumentError('backend_rejected',messages.get(status,'CAD持久存储暂不可用'),status) from None

    def enqueue_legacy(self, run_id, spec):
        return NativeJob.model_validate(self.call('enqueue_system_job',kind='legacy_generate',request_key=run_id,payload={'run_id':run_id,'spec':spec}))

    def job(self, job_id): return CommandRecord.model_validate(self.call('job',job_id=job_id))
    def take_job(self, worker_id):
        value=self.call('take_job',worker_id=worker_id)
        return NativeJob.model_validate(value) if value else None
    def engine_state(self): return self.call('engine_state')
    def complete_job(self,worker_id,receipt):
        return self.call('complete_job',worker_id=worker_id,receipt=receipt.model_dump(mode='json'))
    def fail_job(self,worker_id,job_id,error_code,outcome_unknown=False):
        return self.call('fail_job',worker_id=worker_id,job_id=job_id,error_code=error_code,outcome_unknown=outcome_unknown)

    def wait_legacy(self, job, timeout=120):
        deadline=time.monotonic()+timeout
        while time.monotonic()<deadline:
            record=self.job(job.job_id)
            if record.state=='completed': return record.result
            if record.state=='failed': raise CadDocumentError(record.error_code or 'native_failed','FreeCAD未通过原生验证')
            if record.state=='outcome_unknown': break
            time.sleep(0.25)
        from app.clients.freecad import FreeCADConnectionError
        raise FreeCADConnectionError('outcome_unknown','FreeCAD命令结果尚未确认；请查回原任务，不会自动重放',504)
