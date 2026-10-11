"""One durable execution claim and terminal receipt reconciliation, never replay unknown writes."""
import json
import os

from shared.freecad_documents import NativeReceipt
from .native_program import render_document_program


class CadDocumentWorker:
    def __init__(self,backend,native_client,artifacts,worker_id):
        self.backend,self.native_client,self.artifacts,self.worker_id=backend,native_client,artifacts,worker_id

    def reconcile(self, job_id):
        receipt=self.artifacts.read_receipt(job_id)
        if receipt is None: return {'state':'blocked','job_id':job_id,'reason':'等待原生终结收据；不重放'}
        # Artifact validation is needed even after process restart, before registering a receipt.
        for entry in receipt.artifacts: self.artifacts.entry_path(entry)
        return self.backend.complete_job(self.worker_id,receipt)

    def tick(self):
        engine=self.backend.engine_state()
        if engine.get('job_id'):
            return self.reconcile(engine['job_id'])
        job=self.backend.take_job(self.worker_id)
        if job is None: return {'state':'idle'}
        directory=self.artifacts.job_directory(job.job_id)
        dispatched=False
        try:
            existing=self.artifacts.read_receipt(job.job_id)
            if existing: return self.backend.complete_job(self.worker_id,self.artifacts.validate_candidate(job,existing))
            if (directory/'.execution-claimed').exists():
                return self.backend.fail_job(self.worker_id,job.job_id,'receipt_pending',outcome_unknown=True)
            status=self.native_client.status()
            if status.get('connected') is not True:
                return self.backend.fail_job(self.worker_id,job.job_id,status.get('error_code','native_offline'))
            if job.job_kind=='legacy_generate':
                dispatched=True
                return self._legacy(job,directory)
            source=job.source.get('snapshot') or {}
            source_path=None
            native_file=next((a for a in source.get('artifacts',[]) if a['name']=='model.FCStd'),None)
            if native_file: source_path=self.artifacts.entry_path(native_file)
            if job.job_kind=='import': source_path=self.artifacts.entry_path(job.source['native_artifact'])
            code=render_document_program(job,directory,source_path)
            dispatched=True
            self.native_client.call_tool('execute_code',{'code':code,'include_screenshot':False,'timeout':90.0},timeout=100)
            receipt=self.artifacts.read_receipt(job.job_id)
            if receipt is None:
                return self.backend.fail_job(self.worker_id,job.job_id,'receipt_pending',outcome_unknown=True)
            return self.backend.complete_job(self.worker_id,self.artifacts.validate_candidate(job,receipt))
        except Exception:
            # CAD may have finished while the HTTP/DB result was lost. Only the original receipt resolves it.
            receipt=self.artifacts.read_receipt(job.job_id)
            if receipt is not None:
                try: return self.backend.complete_job(self.worker_id,self.artifacts.validate_candidate(job,receipt))
                except Exception: return {'state':'blocked','job_id':job.job_id,'reason':'收据待核验或存储待恢复'}
            return self.backend.fail_job(self.worker_id,job.job_id,'transport_or_validation_failed',outcome_unknown=dispatched)

    def _legacy(self,job,directory):
        from app.tools.cad.freecad_mcp import freecad_mcp,freecad_tool_scope
        from .gateway import worker_execution
        token=worker_execution.set(True)
        try:
            with freecad_tool_scope(self.native_client,job.source['run_id']):
                result=freecad_mcp(job.source['spec'])
        finally:
            worker_execution.reset(token)
        result={k:v for k,v in result.items() if k!='calls'}
        receipt=NativeReceipt(job_id=job.job_id,input_digest=job.input_digest,state='completed',snapshot=None,
                              artifacts=[],validation=result['validation'],result=result)
        temporary=directory/'receipt.tmp'
        temporary.write_text(receipt.model_dump_json(),encoding='utf-8')
        os.replace(temporary,directory/'receipt.json')
        return self.backend.complete_job(self.worker_id,receipt)
