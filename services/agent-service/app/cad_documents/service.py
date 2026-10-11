from hashlib import sha256
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET

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
        from app.tools.cad.freecad_mcp import artifact_path,validate_spec
        spec=validate_spec(source['spec']) if source.get('spec') else None
        if source.get('document_id'):
            previous=self.snapshot(actor,source['document_id'],source['revision'])
            entry=next(a for a in source['artifacts'] if a['name']=='model.FCStd')
            path=self.artifacts.entry_path(entry)
            names=[o.name for o in previous.objects if o.object_id in previous.product_root_ids]
        else:
            path=artifact_path(source['run_id'],'model.FCStd')
            if not path.is_file() or path.is_symlink() or not 0<path.stat().st_size<=100*1024*1024:
                raise CadDocumentError('source_invalid','来源原生文件缺失或过期',422)
            names=(source.get('validation') or {}).get('product_names') or self._legacy_product_names(path,spec)
        if not names: raise CadDocumentError('source_roots','来源产品对象身份不完整，请重新生成该设计',422)
        # Copy only a trusted server-resolved file; never accepts a path from the browser.
        source_job='JOB-source-'+canonical_digest([actor,head.document_id,request_id])
        target=self.artifacts.job_directory(source_job)/'model.FCStd'
        content=path.read_bytes()
        if not target.exists(): target.write_bytes(content)
        if sha256(target.read_bytes()).hexdigest()!=sha256(content).hexdigest():
            raise CadDocumentError('source_conflict','已存在的副本来源不一致')
        entry={'job_id':source_job,'name':'model.FCStd','size':len(content),'sha256':sha256(content).hexdigest()}
        auxiliary=[]
        from app.tools.cad.freecad_mcp import _validate_extra_file
        for original in source.get('artifacts',[]):
            filename=original['name']
            if filename not in {'drawing.svg','drawing.pdf','unfold.svg','unfold.dxf','motion.json'}:continue
            auxiliary_path=self.artifacts.entry_path(original) if source.get('document_id') else artifact_path(source['run_id'],filename)
            if auxiliary_path.is_symlink() or not 0<auxiliary_path.stat().st_size<=100*1024*1024:
                raise CadDocumentError('source_invalid','来源附属文件缺失或过期',422)
            _validate_extra_file(auxiliary_path)
            content=auxiliary_path.read_bytes();target=self.artifacts.job_directory(source_job)/filename
            if not target.exists():target.write_bytes(content)
            if sha256(target.read_bytes()).digest()!=sha256(content).digest():raise CadDocumentError('source_conflict','附属文件来源不一致')
            auxiliary.append(dict(job_id=source_job,name=filename,size=len(content),sha256=sha256(content).hexdigest()))
        payload={'native_artifact':entry,'spec':spec,'product_names':names,'source_validation':source['validation'],'source_artifacts':auxiliary}
        self.gateway.call('claim_import',actor_id=actor,document_id=head.document_id,
                          command_id='CMD-import-'+canonical_digest(request_id)[:32],source=payload)

    @staticmethod
    def _legacy_product_names(path,spec):
        if not spec: return []
        with zipfile.ZipFile(path) as archive:
            info=archive.getinfo('Document.xml')
            if info.file_size>10*1024*1024: raise CadDocumentError('source_invalid','来源对象索引过大',422)
            root=ET.fromstring(archive.read(info))
        objects={o.get('name'):o for o in root.findall('./ObjectData/Object')}
        if 'assembly' in spec: names=[n for n in objects if n.startswith('SolvedComponent')]
        elif 'sheet_metal' in spec: names=['SheetMetalBend']
        elif 'bim' in spec:
            labels={p['name'] for p in [*spec['bim']['walls'],*spec['bim']['slabs']]}
            names=[n for n,o in objects.items() if (o.find("./Properties/Property[@name='Label']/String") is not None
                    and o.find("./Properties/Property[@name='Label']/String").get('value') in labels)]
        elif 'parts' in spec: names=['Component'+str(i+1) for i in range(len(spec['parts']))]
        else: names=['Model']
        return names if all(n in objects for n in names) else []

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
