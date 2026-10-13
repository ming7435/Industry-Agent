from contextlib import contextmanager
import json
from threading import Lock

from app.harness.trace_store import MySQLTraceStore


def test_trace_index_only_projects_new_rows_and_respects_authoritative_deletions(monkeypatch):
    records={1:{'trace_record_id':'T1','trace_id':'TRACE-A','event':'agent_started','timestamp':'2026-10-13T01:00:00Z'},
             2:{'trace_record_id':'T2','trace_id':'TRACE-A','event':'agent_completed','timestamp':'2026-10-13T01:00:01Z'}}
    projections=[]
    class Cursor:
        def execute(self,sql,params=()):
            if sql.startswith('SELECT sequence_id FROM'):
                self.rows=[(key,) for key in sorted(records,reverse=True)[:params[-1]]]
            else:
                assert sql.startswith('SELECT sequence_id,')
                projections.append(list(params))
                self.rows=[(key,json.dumps(records[key])) for key in params if key in records]
        def fetchall(self):return self.rows
        def close(self):pass
    class Connection:
        def cursor(self):return Cursor()
    @contextmanager
    def session(*_args,**_kwargs):yield Connection()
    monkeypatch.setattr('app.harness.trace_store.mysql_session',session)
    store=MySQLTraceStore.__new__(MySQLTraceStore)
    store._config={};store._run_index_cache={};store._run_index_lock=Lock()
    first=store.list_run_index()
    assert [item['trace_record_id'] for item in first]==['T1','T2']
    first[0]['trace_id']='caller changed'
    projections.clear()
    assert store.list_run_index()[0]['trace_id']=='TRACE-A'
    assert projections==[], 'Polling projected all old JSON rows again'
    assert len(store.list_run_index(limit=1))==1
    store.list_run_index()
    assert projections==[], 'A small read evicted the complete warmed index'
    records[3]={'trace_record_id':'T3','trace_id':'TRACE-B','event':'agent_started','timestamp':'2026-10-13T01:00:02Z'}
    del records[1]
    assert [item['trace_record_id'] for item in store.list_run_index()]==['T2','T3']
    assert projections==[[3]]
    assert set(store._run_index_cache)=={2,3}
