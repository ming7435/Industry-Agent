"""Short SQL transactions. CAD and HTTP never execute while a database lock is held."""
from contextlib import contextmanager
from pathlib import Path
import base64
import json
import os
import re
import sqlite3
import time
from uuid import uuid4

from shared.persistence import mysql_session, mysql_configuration, StorageUnavailable
from shared.freecad_documents import (CadDocumentError, CommandRecord, DocumentHead, DocumentSnapshot,
                                     NativeJob, NativeReceipt, canonical_digest, command_digest, parse_command, single_line)


def encoded(value):
    return json.dumps(value.model_dump(mode='json') if hasattr(value, 'model_dump') else value,
                      ensure_ascii=False, sort_keys=True, allow_nan=False, separators=(',', ':'))


class Database:
    def __init__(self, cursor, mysql):
        self.cursor, self.mysql = cursor, mysql

    def execute(self, sql, values=()):
        self.cursor.execute(sql.replace('?', '%s') if self.mysql else sql, tuple(values))
        return self

    def one(self):
        row = self.cursor.fetchone()
        return dict(row) if row is not None else None

    def all(self):
        return [dict(r) for r in self.cursor.fetchall()]


class CadDocumentRepository:
    def __init__(self, mysql_config=None, sqlite_path: Path | None = None):
        self.sqlite_path = Path(sqlite_path) if sqlite_path is not None else None
        if self.sqlite_path is not None and os.getenv('APP_ENV') != 'testing':
            raise CadDocumentError('storage_configuration', '在线CAD文档必须使用MySQL', 503)
        self.mysql_config = dict(mysql_config or mysql_configuration()) if self.sqlite_path is None else None
        with self.transaction(initialize=True) as db:
            text = 'LONGTEXT' if db.mysql else 'TEXT'
            suffix = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin' if db.mysql else ''
            auto = 'BIGINT PRIMARY KEY AUTO_INCREMENT' if db.mysql else 'INTEGER PRIMARY KEY AUTOINCREMENT'
            definitions = [
                f'cad_documents (document_id VARCHAR(140) PRIMARY KEY, owner_id VARCHAR(140) NOT NULL, request_key CHAR(64) UNIQUE NOT NULL, input_digest CHAR(64) NOT NULL, payload {text} NOT NULL)',
                f'cad_revisions (document_id VARCHAR(140) NOT NULL, revision INT NOT NULL, payload {text} NOT NULL, PRIMARY KEY(document_id,revision))',
                f'cad_commands (command_key CHAR(64) PRIMARY KEY, job_id VARCHAR(140) UNIQUE NOT NULL, owner_id VARCHAR(140) NOT NULL, command_id VARCHAR(140) NOT NULL, document_id VARCHAR(140), state VARCHAR(24) NOT NULL, input_digest CHAR(64) NOT NULL, payload {text} NOT NULL, created_at DOUBLE NOT NULL)',
                f'cad_published_versions (sequence {auto}, run_id VARCHAR(140) UNIQUE NOT NULL, document_id VARCHAR(140) NOT NULL, revision INT NOT NULL, owner_id VARCHAR(140) NOT NULL, payload {text} NOT NULL, UNIQUE(document_id,revision))',
                'cad_executor_state (singleton INT PRIMARY KEY, job_id VARCHAR(140), worker_id VARCHAR(140), state VARCHAR(24) NOT NULL, heartbeat DOUBLE NOT NULL)',
            ]
            for definition in definitions:
                db.execute('CREATE TABLE IF NOT EXISTS '+definition+suffix)
            prefix = 'INSERT IGNORE' if db.mysql else 'INSERT OR IGNORE'
            db.execute(prefix+" INTO cad_executor_state VALUES (1,NULL,NULL,'idle',0)")

    @contextmanager
    def transaction(self, initialize=False):
        try:
            if self.sqlite_path is not None:
                connection = sqlite3.connect(str(self.sqlite_path), timeout=15)
                connection.row_factory = sqlite3.Row
                try:
                    connection.execute('BEGIN IMMEDIATE')
                    db = Database(connection.cursor(), False)
                    yield db
                    connection.commit()
                except BaseException:
                    connection.rollback()
                    raise
                finally:
                    connection.close()
            else:
                with mysql_session(self.mysql_config) as connection:
                    cursor = connection.cursor(dictionary=True)
                    try:
                        db = Database(cursor, True)
                        if not initialize:
                            db.execute('SELECT singleton FROM cad_executor_state WHERE singleton=1 FOR UPDATE').one()
                        yield db
                    finally:
                        cursor.close()
        except (StorageUnavailable, sqlite3.Error):
            raise CadDocumentError('storage_unavailable', 'CAD持久存储不可用，请检查数据库连接', 503) from None

    @staticmethod
    def actor(actor_id):
        if not isinstance(actor_id, str) or not re.fullmatch(r'USER-[A-Za-z0-9_-]{1,128}', actor_id):
            raise CadDocumentError('actor_invalid', '个人账号身份无效', 401)
        return actor_id

    @staticmethod
    def _head(db, actor_id, document_id):
        row = db.execute('SELECT * FROM cad_documents WHERE document_id=?', [document_id]).one()
        if row is None:
            raise CadDocumentError('not_found', 'CAD文档不存在', 404)
        if row['owner_id'] != actor_id:
            raise CadDocumentError('forbidden', '无权访问此CAD文档', 403)
        return DocumentHead.model_validate_json(row['payload'])

    @staticmethod
    def _write_head(db, head):
        db.execute('UPDATE cad_documents SET payload=? WHERE document_id=?', [encoded(head), head.document_id])

    def create_document(self, actor_id, request_id, part_name, part_number, source_run_id=None):
        self.actor(actor_id)
        part_name = single_line(part_name)
        if not isinstance(request_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', request_id):
            raise CadDocumentError('request_invalid', '创建请求身份无效', 422)
        if not isinstance(part_number, str) or (part_number and not re.fullmatch(r'[0-9]{5}', part_number)):
            raise CadDocumentError('number_invalid', '零件编号必须为五位数字或留空', 422)
        key, digest = canonical_digest([actor_id, request_id]), canonical_digest([part_name, part_number, source_run_id])
        with self.transaction() as db:
            row = db.execute('SELECT * FROM cad_documents WHERE request_key=?', [key]).one()
            if row:
                if row['input_digest'] != digest:
                    raise CadDocumentError('idempotency_conflict', '同一创建请求不能更换参数')
                return DocumentHead.model_validate_json(row['payload'])
            doc_id = 'DOC-'+str(uuid4())
            number = part_number or str(int(canonical_digest(doc_id)[:8], 16)%100000).zfill(5)
            now = time.time()
            head = DocumentHead(document_id=doc_id, owner_user_id=actor_id, part_name=part_name,
                                part_number=number, revision=0, created_at=now, updated_at=now)
            snapshot = DocumentSnapshot(document_id=doc_id, revision=0, objects=[], product_root_ids=[],
                                        source_spec=None, validation={'valid':True,'solid_count':0}, artifacts=[])
            db.execute('INSERT INTO cad_documents VALUES (?,?,?,?,?)', [doc_id,actor_id,key,digest,encoded(head)])
            db.execute('INSERT INTO cad_revisions VALUES (?,?,?)', [doc_id,0,encoded(snapshot)])
            return head

    def get_document(self, actor_id, document_id):
        self.actor(actor_id)
        with self.transaction() as db:
            return self._head(db, actor_id, document_id)

    def read_snapshot(self, actor_id, document_id, revision):
        self.actor(actor_id)
        with self.transaction() as db:
            head = self._head(db, actor_id, document_id)
            row = db.execute('SELECT payload FROM cad_revisions WHERE document_id=? AND revision=?', [document_id,revision]).one()
            if row is None:
                raise CadDocumentError('revision_not_found', 'CAD修订不存在', 404)
            snapshot = DocumentSnapshot.model_validate_json(row['payload'])
            publication = db.execute('SELECT payload FROM cad_published_versions WHERE document_id=? AND revision=?', [document_id,revision]).one()
            if publication:
                snapshot.published_version = json.loads(publication['payload'])['version']
            return snapshot

    def claim_command(self, actor_id, envelope):
        self.actor(actor_id)
        envelope = parse_command(envelope) if isinstance(envelope, dict) else envelope
        digest = command_digest(actor_id, envelope)
        key = canonical_digest([actor_id,envelope.command_id])
        with self.transaction() as db:
            head = self._head(db, actor_id, envelope.document_id)
            old = db.execute('SELECT payload,input_digest FROM cad_commands WHERE command_key=?', [key]).one()
            if old:
                if old['input_digest'] != digest:
                    raise CadDocumentError('idempotency_conflict', '相同命令身份不能更改参数')
                return CommandRecord.model_validate(json.loads(old['payload'])['record'])
            if head.revision != envelope.expected_revision:
                raise CadDocumentError('revision_conflict', '文档已更新，请读取最新修订再提交')
            if head.active_command_id:
                raise CadDocumentError('document_busy', '文档存在未终结命令，请先查回结果')
            record = CommandRecord(envelope=envelope, input_digest=digest, owner_user_id=actor_id,
                                   state='accepted', job_id='JOB-'+str(uuid4()))
            payload = {'record':record.model_dump(mode='json'), 'kind':'edit', 'source':{}}
            db.execute('INSERT INTO cad_commands VALUES (?,?,?,?,?,?,?,?,?)',
                       [key,record.job_id,actor_id,envelope.command_id,envelope.document_id,'accepted',digest,encoded(payload),time.time()])
            head.active_command_id, head.updated_at = envelope.command_id, time.time()
            self._write_head(db, head)
            return record

    def get_command(self, actor_id, document_id, command_id):
        self.actor(actor_id)
        with self.transaction() as db:
            self._head(db, actor_id, document_id)
            row = db.execute('SELECT payload,document_id FROM cad_commands WHERE command_key=?', [canonical_digest([actor_id,command_id])]).one()
            if not row:
                raise CadDocumentError('command_not_found', 'CAD命令不存在', 404)
            record = CommandRecord.model_validate(json.loads(row['payload'])['record'])
            if row['document_id'] != document_id:
                raise CadDocumentError('forbidden', '命令不属于此文档', 403)
            return record

    def claim_import(self, actor_id, document_id, command_id, source):
        self.actor(actor_id)
        key=canonical_digest([actor_id,command_id]); digest=canonical_digest([document_id,source])
        with self.transaction() as db:
            head=self._head(db,actor_id,document_id)
            old=db.execute('SELECT payload,input_digest FROM cad_commands WHERE command_key=?',[key]).one()
            if old:
                if old['input_digest']!=digest: raise CadDocumentError('idempotency_conflict','副本请求内容不一致')
                return CommandRecord.model_validate(json.loads(old['payload'])['record'])
            if head.revision!=0 or head.active_command_id: raise CadDocumentError('import_conflict','只能向空文档创建可信副本')
            record=CommandRecord(envelope=None,input_digest=digest,owner_user_id=actor_id,state='accepted',job_id='JOB-'+str(uuid4()))
            value={'record':record.model_dump(mode='json'),'kind':'import','source':source}
            db.execute('INSERT INTO cad_commands VALUES (?,?,?,?,?,?,?,?,?)',[key,record.job_id,actor_id,command_id,document_id,'accepted',digest,encoded(value),time.time()])
            head.active_command_id=command_id; self._write_head(db,head)
            return record

    @staticmethod
    def _cursor(actor_id, cursor, collection):
        if not cursor:
            return None
        try:
            value = json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
            if value['owner'] != canonical_digest(actor_id) or value['collection'] != collection:
                raise CadDocumentError('cursor_forbidden', '目录游标不属于当前账号', 403)
            return value['after']
        except (ValueError, KeyError, TypeError, UnicodeError) as error:
            if isinstance(error, CadDocumentError):
                raise
            raise CadDocumentError('cursor_invalid', '目录游标无效', 422) from None

    def _directory(self, actor_id, cursor, limit, published):
        self.actor(actor_id)
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise CadDocumentError('limit_invalid', '每页数量必须为1至100', 422)
        collection = 'designs' if published else 'documents'
        after = self._cursor(actor_id, cursor, collection)
        table, key = ('cad_published_versions','sequence') if published else ('cad_documents','document_id')
        with self.transaction() as db:
            where, args = 'owner_id=?', [actor_id]
            if after is not None:
                where += f' AND {key}>?'
                args.append(after)
            rows = db.execute(f'SELECT * FROM {table} WHERE {where} ORDER BY {key} LIMIT ?', [*args,limit+1]).all()
            selected = rows[:limit]
            next_cursor = ''
            if len(rows) > limit:
                body = dict(owner=canonical_digest(actor_id), collection=collection, after=selected[-1][key])
                next_cursor = base64.urlsafe_b64encode(encoded(body).encode()).decode()
            version = db.execute('SELECT MAX(sequence) AS version FROM cad_published_versions WHERE owner_id=?', [actor_id]).one()['version'] or 0
            return dict(items=[json.loads(r['payload']) for r in selected], next_cursor=next_cursor, directory_version=version)

    def list_documents(self, actor_id, cursor='', limit=50):
        return self._directory(actor_id,cursor,limit,False)

    def list_designs(self, actor_id, cursor='', limit=50):
        return self._directory(actor_id,cursor,limit,True)

    def find_published(self, actor_id, run_id):
        self.actor(actor_id)
        with self.transaction() as db:
            row = db.execute('SELECT * FROM cad_published_versions WHERE run_id=?', [run_id]).one()
            if row is None:
                return None
            if row['owner_id'] != actor_id:
                raise CadDocumentError('forbidden', '无权访问此已发布模型', 403)
            return json.loads(row['payload'])

    def published_exists(self,run_id):
        with self.transaction() as db:
            return db.execute('SELECT run_id FROM cad_published_versions WHERE run_id=?',[run_id]).one() is not None

    def claim_publication(self,actor_id,document_id,command_id,expected_revision):
        self.actor(actor_id)
        if not re.fullmatch(r'CMD-[A-Za-z0-9_-]{1,128}',command_id): raise CadDocumentError('command_invalid','发布请求身份无效',422)
        digest=canonical_digest([actor_id,document_id,expected_revision,'publish'])
        key=canonical_digest([actor_id,command_id])
        with self.transaction() as db:
            head=self._head(db,actor_id,document_id)
            existing=db.execute('SELECT * FROM cad_commands WHERE command_key=?',[key]).one()
            if existing:
                if existing['input_digest']!=digest: raise CadDocumentError('idempotency_conflict','发布请求不能更换版本')
                return CommandRecord.model_validate(json.loads(existing['payload'])['record'])
            published=db.execute('SELECT payload FROM cad_published_versions WHERE document_id=? AND revision=?',[document_id,expected_revision]).one()
            record=CommandRecord(envelope=None,input_digest=digest,owner_user_id=actor_id,state='accepted',job_id='JOB-'+str(uuid4()))
            if published:
                value=json.loads(published['payload']);record.state='completed';record.result={k:value[k] for k in ('run_id','version','revision','document_id')}
            else:
                if type(expected_revision) is not int or head.revision!=expected_revision: raise CadDocumentError('revision_conflict','发布修订已经改变')
                if head.active_command_id: raise CadDocumentError('document_busy','文档存在未终结命令')
                snapshot=json.loads(db.execute('SELECT payload FROM cad_revisions WHERE document_id=? AND revision=?',[document_id,expected_revision]).one()['payload'])
                if not snapshot['product_root_ids']: raise CadDocumentError('empty_document','没有有效产品，不能发布',422)
                head.active_command_id=command_id; self._write_head(db,head)
            payload={'record':record.model_dump(mode='json'),'kind':'publish','source':{}}
            db.execute('INSERT INTO cad_commands VALUES (?,?,?,?,?,?,?,?,?)',[key,record.job_id,actor_id,command_id,document_id,record.state,digest,encoded(payload),time.time()])
            return record

    def commit_publication(self,worker_id,receipt,standard):
        from shared.freecad_documents import verify_document_standard
        receipt=NativeReceipt.model_validate(receipt) if isinstance(receipt,dict) else receipt
        standard=verify_document_standard(standard.model_dump(mode='json') if hasattr(standard,'model_dump') else standard)
        with self.transaction() as db:
            row=db.execute('SELECT * FROM cad_commands WHERE job_id=?',[receipt.job_id]).one()
            if not row: raise CadDocumentError('job_not_found','发布命令不存在',404)
            value=json.loads(row['payload']);record=CommandRecord.model_validate(value['record'])
            if record.input_digest!=receipt.input_digest or value['kind']!='publish': raise CadDocumentError('receipt_identity','发布收据身份无效')
            if record.state=='completed': return record.model_dump(mode='json')
            engine=db.execute('SELECT * FROM cad_executor_state WHERE singleton=1').one()
            if engine['job_id']!=receipt.job_id: raise CadDocumentError('executor_conflict','发布不属于活动任务')
            head=self._head(db,record.owner_user_id,row['document_id'])
            snapshot=receipt.snapshot
            expected_id='FC-'+canonical_digest([record.owner_user_id,head.document_id,head.revision])
            if (receipt.state!='completed' or receipt.validation.get('valid') is not True or receipt.validation.get('step_roundtrip') is not True
                or snapshot is None or snapshot.document_id!=head.document_id or snapshot.revision!=head.revision
                or standard.document_id!=head.document_id or standard.revision!=head.revision or standard.run_id!=expected_id):
                raise CadDocumentError('publication_invalid','发布几何、标准或修订不一致')
            version=(head.published_version or 0)+1
            artifacts=[{**a,'format':a['name'].rsplit('.',1)[-1].lower(),
                        'url':f'/api/cad/freecad/runs/{expected_id}/artifacts/{a["name"]}'} for a in receipt.artifacts
                       if a['name'] in {'model.FCStd','model.step','model.stl','drawing.svg','drawing.pdf','unfold.svg','unfold.dxf','motion.json'}]
            publication=dict(run_id=expected_id,status='completed',document_id=head.document_id,revision=head.revision,version=version,
                             part_name=head.part_name,part_number=head.part_number,spec=snapshot.source_spec,validation=receipt.validation,
                             standard_parameters=standard.model_dump(mode='json'),artifacts=artifacts,published_at=time.time())
            db.execute('INSERT INTO cad_published_versions(run_id,document_id,revision,owner_id,payload) VALUES (?,?,?,?,?)',
                       [expected_id,head.document_id,head.revision,record.owner_user_id,encoded(publication)])
            head.published_version,head.published_revision=version,head.revision
            self._write_head(db,head)
            record.state='completed';record.result={k:publication[k] for k in ('run_id','version','revision','document_id')}
            return self._finish(db,row,value,record).model_dump(mode='json')

    def enqueue_system_job(self, kind, request_key, payload):
        if kind not in {'legacy_generate','discover'}:
            raise CadDocumentError('job_kind','不允许的系统作业',422)
        key=canonical_digest(['system',kind,request_key])
        digest=canonical_digest([kind,payload])
        with self.transaction() as db:
            row=db.execute('SELECT payload,input_digest FROM cad_commands WHERE command_key=?',[key]).one()
            if row:
                if row['input_digest']!=digest:
                    raise CadDocumentError('idempotency_conflict','同一系统任务不能更改参数')
                value=json.loads(row['payload'])
                record=CommandRecord.model_validate(value['record'])
            else:
                record=CommandRecord(envelope=None,input_digest=digest,owner_user_id='SYSTEM',
                                     state='accepted',job_id='JOB-'+str(uuid4()))
                value={'record':record.model_dump(mode='json'),'kind':kind,'source':payload}
                db.execute('INSERT INTO cad_commands VALUES (?,?,?,?,?,?,?,?,?)',
                           [key,record.job_id,'SYSTEM',request_key,None,'accepted',digest,encoded(value),time.time()])
            return NativeJob(job_id=record.job_id,input_digest=digest,job_kind=kind,owner_user_id='SYSTEM',
                             document_id=None,expected_revision=None,envelope=None,source=payload)

    def job(self, job_id):
        with self.transaction() as db:
            row=db.execute('SELECT payload FROM cad_commands WHERE job_id=?',[job_id]).one()
            if not row: raise CadDocumentError('job_not_found','CAD作业不存在',404)
            return CommandRecord.model_validate(json.loads(row['payload'])['record'])

    def engine_state(self):
        with self.transaction() as db:
            return db.execute('SELECT * FROM cad_executor_state WHERE singleton=1').one()

    def take_job(self, worker_id):
        if not isinstance(worker_id,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}',worker_id):
            raise CadDocumentError('worker_identity','执行者身份无效',422)
        with self.transaction() as db:
            engine=db.execute('SELECT * FROM cad_executor_state WHERE singleton=1').one()
            # A stale heartbeat is NOT proof that the GUI stopped running.
            if engine['job_id'] is not None: return None
            row=db.execute("SELECT * FROM cad_commands WHERE state='accepted' ORDER BY created_at,job_id LIMIT 1").one()
            if row is None: return None
            value=json.loads(row['payload'])
            record=CommandRecord.model_validate(value['record'])
            source=dict(value.get('source') or {})
            expected=None
            if row['document_id']:
                head=self._head(db,row['owner_id'],row['document_id'])
                expected=head.revision
                saved=db.execute('SELECT payload FROM cad_revisions WHERE document_id=? AND revision=?',[head.document_id,expected]).one()
                source['snapshot']=json.loads(saved['payload'])
            record.state='running'
            value['record']=record.model_dump(mode='json')
            db.execute('UPDATE cad_commands SET state=?,payload=? WHERE job_id=?',['running',encoded(value),record.job_id])
            db.execute('UPDATE cad_executor_state SET job_id=?,worker_id=?,state=?,heartbeat=? WHERE singleton=1',
                       [record.job_id,worker_id,'running',time.time()])
            return NativeJob(job_id=record.job_id,input_digest=record.input_digest,job_kind=value['kind'],
                             owner_user_id=record.owner_user_id,document_id=row['document_id'],
                             expected_revision=expected,envelope=record.envelope,source=source)

    def _finish(self, db, row, value, record, unknown=False):
        value['record']=record.model_dump(mode='json')
        db.execute('UPDATE cad_commands SET state=?,payload=? WHERE job_id=?',[record.state,encoded(value),record.job_id])
        if row['document_id'] and not unknown:
            head=self._head(db,record.owner_user_id,row['document_id'])
            head.active_command_id=None
            head.updated_at=time.time()
            self._write_head(db,head)
        if unknown:
            db.execute("UPDATE cad_executor_state SET state='outcome_unknown' WHERE singleton=1")
        else:
            db.execute("UPDATE cad_executor_state SET job_id=NULL,worker_id=NULL,state='idle',heartbeat=? WHERE singleton=1",[time.time()])
        return record

    def complete_job(self, worker_id, receipt):
        receipt=NativeReceipt.model_validate(receipt) if isinstance(receipt,dict) else receipt
        with self.transaction() as db:
            row=db.execute('SELECT * FROM cad_commands WHERE job_id=?',[receipt.job_id]).one()
            if not row: raise CadDocumentError('job_not_found','CAD作业不存在',404)
            value=json.loads(row['payload']); record=CommandRecord.model_validate(value['record'])
            if receipt.input_digest!=record.input_digest:
                raise CadDocumentError('receipt_identity','收据不属于原始命令')
            if record.state in {'completed','failed'}: return record
            engine=db.execute('SELECT * FROM cad_executor_state WHERE singleton=1').one()
            if engine['job_id']!=receipt.job_id:
                raise CadDocumentError('executor_conflict','收据与活动执行不一致')
            if receipt.state=='failed':
                record.state,record.error_code,record.result='failed',receipt.error_code,receipt.result
                return self._finish(db,row,value,record)
            if receipt.validation.get('valid') is not True:
                raise CadDocumentError('receipt_validation','收据验证未通过')
            if row['document_id']:
                head=self._head(db,record.owner_user_id,row['document_id'])
                snapshot=receipt.snapshot
                if snapshot is None or snapshot.document_id!=head.document_id or snapshot.revision!=head.revision+1:
                    raise CadDocumentError('revision_conflict','候选与当前修订不一致')
                db.execute('INSERT INTO cad_revisions VALUES (?,?,?)',[head.document_id,snapshot.revision,encoded(snapshot)])
                head.revision=snapshot.revision
                self._write_head(db,head)
                record.result=dict(document_id=head.document_id,revision=head.revision)
            else:
                record.result=receipt.result
            record.state='completed'
            return self._finish(db,row,value,record)

    def fail_job(self, worker_id, job_id, error_code, outcome_unknown=False):
        with self.transaction() as db:
            row=db.execute('SELECT * FROM cad_commands WHERE job_id=?',[job_id]).one()
            if row is None: raise CadDocumentError('job_not_found','CAD作业不存在',404)
            value=json.loads(row['payload']); record=CommandRecord.model_validate(value['record'])
            if record.state in {'completed','failed'}: return record
            engine=db.execute('SELECT * FROM cad_executor_state WHERE singleton=1').one()
            if engine['job_id']!=job_id or engine['worker_id']!=worker_id:
                raise CadDocumentError('executor_conflict','执行者与活动命令不一致')
            record.state='outcome_unknown' if outcome_unknown else 'failed'
            record.error_code=error_code
            return self._finish(db,row,value,record,unknown=outcome_unknown)
