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
                                     canonical_digest, command_digest, parse_command, single_line)


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

    def create_document(self, actor_id, request_id, part_name, part_number):
        self.actor(actor_id)
        part_name = single_line(part_name)
        if not isinstance(request_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', request_id):
            raise CadDocumentError('request_invalid', '创建请求身份无效', 422)
        if not isinstance(part_number, str) or (part_number and not re.fullmatch(r'[0-9]{5}', part_number)):
            raise CadDocumentError('number_invalid', '零件编号必须为五位数字或留空', 422)
        key, digest = canonical_digest([actor_id, request_id]), canonical_digest([part_name, part_number])
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
            row = db.execute('SELECT payload FROM cad_commands WHERE command_key=?', [canonical_digest([actor_id,command_id])]).one()
            if not row:
                raise CadDocumentError('command_not_found', 'CAD命令不存在', 404)
            record = CommandRecord.model_validate(json.loads(row['payload'])['record'])
            if record.envelope is not None and record.envelope.document_id != document_id:
                raise CadDocumentError('forbidden', '命令不属于此文档', 403)
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
