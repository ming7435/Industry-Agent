from hashlib import sha256
import json
from pathlib import Path
import re

from shared.freecad_documents import CadDocumentError, NativeReceipt

MAX_FILE_SIZE = 100*1024*1024


class ArtifactStore:
    def __init__(self, root: Path):
        self.root = Path(root).absolute()
        self.root.mkdir(parents=True,exist_ok=True)
        if self.root.is_symlink() or self.root.resolve() != self.root:
            raise CadDocumentError('artifact_path', '托管根不能为链接', 422)

    def job_directory(self, job_id):
        if not isinstance(job_id,str) or not re.fullmatch(r'JOB-[A-Za-z0-9_-]{1,128}',job_id):
            raise CadDocumentError('job_identity', '原生任务身份无效', 422)
        directory = self.root/job_id
        if directory.is_symlink() or directory.resolve().parent != self.root:
            raise CadDocumentError('artifact_path', '任务目录不属于托管根', 422)
        directory.mkdir(exist_ok=True)
        return directory

    def read_receipt(self, job_id):
        path=self.job_directory(job_id)/'receipt.json'
        if not path.exists(): return None
        if path.is_symlink() or not 0 < path.stat().st_size <= MAX_FILE_SIZE:
            raise CadDocumentError('receipt_invalid','原生收据文件无效')
        try:
            return NativeReceipt.model_validate_json(path.read_text(encoding='utf-8'))
        except (ValueError,OSError):
            raise CadDocumentError('receipt_invalid','原生收据内容不完整') from None

    def entry_path(self, entry):
        name = entry.get('name','')
        if not re.fullmatch(r'(?:model\.(?:FCStd|py|json|step|stl|glb|3mf)|drawing\.(?:svg|pdf)|unfold\.(?:svg|dxf)|motion\.json|OBJ-[A-Za-z0-9_-]+\.(?:stl|json))',name):
            raise CadDocumentError('artifact_name','文件不在允许的产物清单',422)
        directory=self.job_directory(entry.get('job_id'))
        path=directory/name
        if path.is_symlink() or path.resolve().parent != directory or not path.is_file():
            raise CadDocumentError('artifact_path','托管产物缺失或路径无效')
        size=path.stat().st_size
        if not 0<size<=MAX_FILE_SIZE or size!=entry.get('size') or sha256(path.read_bytes()).hexdigest()!=entry.get('sha256'):
            raise CadDocumentError('artifact_digest','托管产物摘要不一致')
        return path

    def validate_candidate(self, job, receipt):
        if receipt is None or receipt.job_id!=job.job_id or receipt.input_digest!=job.input_digest:
            raise CadDocumentError('receipt_identity','原生收据不属于本次命令')
        if receipt.state=='failed': return receipt
        if receipt.validation.get('valid') is not True:
            raise CadDocumentError('geometry_invalid','原生几何验证未通过')
        if receipt.snapshot is not None:
            expected=job.expected_revision + (0 if job.job_kind=='publish' else 1)
            if receipt.snapshot.document_id!=job.document_id or receipt.snapshot.revision!=expected:
                raise CadDocumentError('snapshot_identity','候选修订身份不一致')
            if receipt.snapshot.validation!=receipt.validation or receipt.snapshot.artifacts!=receipt.artifacts:
                raise CadDocumentError('snapshot_evidence','候选证据不一致')
            ids={o.object_id for o in receipt.snapshot.objects}
            if any(not re.fullmatch(r'OBJ-[A-Za-z0-9_-]+',i) for i in ids):
                raise CadDocumentError('object_identity','候选对象身份无效')
        names=set()
        for entry in receipt.artifacts:
            if entry.get('job_id')!=job.job_id or entry['name'] in names:
                raise CadDocumentError('artifact_identity','文件身份不一致或重复')
            names.add(entry['name'])
            self.entry_path(entry)
        if receipt.snapshot is not None and not {'model.py','model.json'}.issubset(names):
            raise CadDocumentError('artifact_missing','可编辑 CAD 源码和模型数据缺失')
        if job.job_kind=='publish' and (receipt.validation.get('step_roundtrip') is not True
                or receipt.validation.get('solid_count',0)<1 or not {'model.step','model.stl'}.issubset(names)):
            raise CadDocumentError('publication_invalid','发布文件未通过实体回读验证')
        return receipt
