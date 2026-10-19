from hashlib import sha256
from pathlib import Path
import re
import json
from types import SimpleNamespace

from shared.freecad_documents import CadDocumentError, CommandRecord, DocumentHead, DocumentSnapshot, canonical_digest
from .gateway import Gateway
from .native_program import validate_object_command


class CadDocumentApplication:
    def __init__(self, backend_factory=Gateway, artifacts=None, source_reader=None):
        self.gateway=backend_factory()
        self.backend=self.gateway.backend
        self.artifacts=artifacts
        self.source_reader=source_reader

    def create(self, actor_id, body):
        body=body.model_dump() if hasattr(body,'model_dump') else dict(body)
        source_id=body.get('source_run_id')
        source=None
        if source_id:
            if self.source_reader is None: raise CadDocumentError('source_unavailable','可信源版本暂不可读取',503)
            source=self.source_reader(source_id)
            if source.get('status')!='completed' or (source.get('validation') or {}).get('valid') is not True:
                raise CadDocumentError('source_invalid','来源版本没有通过实体校验',422)
            inherited=source.get('part_number','')
            body['part_number']=inherited if re.fullmatch(r'[0-9]{5}',inherited or '') else str(int(source_id[-8:],16)%100000).zfill(5)
        head=DocumentHead.model_validate(self.gateway.call('create_document',actor_id=actor_id,**body))
        if source and head.revision==0:
            self._import_source(actor_id,head,body['request_id'],source)
            head=self.head(actor_id,head.document_id)
        return head

    def _import_source(self,actor,head,request_id,source):
        from app.tools.cad.text_to_cad import artifact_path,validate_spec
        from .native_program import _source_state
        spec=validate_spec(source['spec']) if source.get('spec') else None
        previous=self.snapshot(actor,source['document_id'],source['revision']).model_dump(mode='json') if source.get('document_id') else {}
        entry=next((a for a in source.get('artifacts',[]) if a['name']=='model.json'),None)
        if entry:
            path=self.artifacts.entry_path(entry) if source.get('document_id') else artifact_path(source['run_id'],'model.json')
            if path.is_symlink() or not path.is_file() or not 0<path.stat().st_size<=100*1024*1024:
                raise CadDocumentError('source_invalid','来源模型数据缺失或过期',422)
            content=path.read_bytes()
        else:
            # Historical FCStd files stay immutable and downloadable. Rebuild only from trusted saved parameters.
            state=_source_state(SimpleNamespace(source={'snapshot':previous,'spec':spec}),None)
            if not state.get('base_spec') and not state['objects']:
                raise CadDocumentError('migration_required','历史设计缺少可重建规格，需要迁移后再编辑；原文件仍可下载',422)
            content=json.dumps(state,ensure_ascii=False,allow_nan=False,indent=2).encode('utf-8')
        source_job='JOB-source-'+canonical_digest([actor,head.document_id,request_id])
        target=self.artifacts.job_directory(source_job)/'model.json'
        if target.is_symlink():raise CadDocumentError('source_invalid','来源副本不能为链接',422)
        if not target.exists():target.write_bytes(content)
        if sha256(target.read_bytes()).digest()!=sha256(content).digest():
            raise CadDocumentError('source_conflict','已存在的副本来源不一致')
        entry=dict(job_id=source_job,name='model.json',size=len(content),sha256=sha256(content).hexdigest())
        payload={'native_artifact':entry,'spec':spec,'source_validation':source['validation']}
        self.gateway.call('claim_import',actor_id=actor,document_id=head.document_id,
                          command_id='CMD-import-'+canonical_digest(request_id)[:32],source=payload)

    def submit(self,actor_id,command):
        head=self.head(actor_id,command.document_id)
        # Repeated command requests must reach the durable idempotency check even after completion.
        try:
            existing=self.command(actor_id,command.document_id,command.command_id)
        except CadDocumentError as error:
            if error.status_code!=404: raise
        else:
            return CommandRecord.model_validate(self.gateway.call('claim_command',actor_id=actor_id,envelope=command.model_dump(mode='json')))
        if head.revision!=command.expected_revision: raise CadDocumentError('revision_conflict','建模修订已改变，请刷新')
        validate_object_command(command,self.snapshot(actor_id,command.document_id,head.revision))
        return CommandRecord.model_validate(self.gateway.call('claim_command',actor_id=actor_id,envelope=command.model_dump(mode='json')))

    def head(self,actor_id,document_id):
        return DocumentHead.model_validate(self.gateway.call('get_document',actor_id=actor_id,document_id=document_id))
    def snapshot(self,actor_id,document_id,revision):
        return DocumentSnapshot.model_validate(self.gateway.call('read_snapshot',actor_id=actor_id,document_id=document_id,revision=revision))
    def command(self,actor_id,document_id,command_id):
        return CommandRecord.model_validate(self.gateway.call('get_command',actor_id=actor_id,document_id=document_id,command_id=command_id))
    def documents(self,actor_id,cursor='',limit=50):
        return self.gateway.call('list_documents',actor_id=actor_id,cursor=cursor,limit=limit)
