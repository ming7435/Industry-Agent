"""Saved manual repair facts become reusable knowledge, including after failures."""
from test_manual_experience_summary import context, complete


class Indexer:
    def __init__(self):
        self.calls = []
        self.ready = False

    def upsert(self, record, collection=''):
        self.calls.append((record, collection))
        return {'success': True, 'metadata_saved': True, 'pipeline_ready': self.ready,
                'backends': {'whoosh': {'success': True, 'written': 1},
                             'milvus': {'success': self.ready, 'written': int(self.ready)}}}


def test_pending_index_is_durable_and_worker_retries_without_equipment_commands(context):
    from app.memory.sync import KnowledgeSyncWorker
    ctx = context
    summary = complete(ctx)['memory_result']['experience']
    assert summary['knowledge_sync']['status'] == 'pending'
    indexer = Indexer()
    ctx.requests.agent.experience_module.writer.rag = indexer
    worker = KnowledgeSyncWorker(ctx.operations, ctx.backend)
    controls = list(ctx.factory.controls)
    worker.sync()
    failed = ctx.backend.call('search_experience')['items'][0]
    assert failed['knowledge_sync']['status'] == 'retry'
    assert failed['knowledge_sync']['attempts'] == 1
    assert failed['rag_saved'] is False and failed['memory_saved'] is True
    assert failed['knowledge_sync']['searchable'] is True
    assert failed['knowledge_sync']['dense_indexed'] is False
    # An ordinary poll during backoff must not retry the expensive remote call.
    worker.sync()
    assert len(indexer.calls) == 1
    indexer.ready = True
    worker.sync(force=True)
    saved = ctx.backend.call('search_experience')['items'][0]
    assert saved['rag_saved'] and saved['knowledge_sync']['status'] == 'indexed'
    assert saved['knowledge_sync']['attempts'] == 2
    assert saved['automatic_verification'] is False and saved['validation_status'] == 'manual_confirmed'
    document, collection = indexer.calls[-1]
    assert collection == 'maint_fault_events'
    assert document['metadata']['corpus'] == 'cases'
    assert document['metadata']['source_workorder'] == ctx.order_id
    assert document['metadata']['validation_status'] == 'manual_confirmed'
    assert len(ctx.backend.call('search_experience')['items']) == 1
    # Fresh worker instances resume persisted receipts instead of depending on a cache.
    KnowledgeSyncWorker(ctx.operations, ctx.backend).sync(force=True)
    assert len(indexer.calls) == 2 and ctx.factory.controls == controls
    matches = ctx.requests.agent.run({'action': 'search', 'device_id': 'M1', 'query': '刀塔旋转超时'})
    assert matches.success and matches.items[0]['experience_id'] == summary['experience_id']
    assert ctx.backend.call('search_experience', {'source_workorder': 'other'})['items'] == []
    assert ctx.backend.call('search_experience', {'alarm_code': '99999'})['items'] == []
    report = ctx.backend.call('list_reports')['items'][0]
    report = report.get('report') or report
    experience = report['sections']['experience']['records'][0]
    assert experience['knowledge_sync']['status'] == 'indexed'
    assert experience['content'] == saved['content']


def test_background_reconciles_missing_summary_after_storage_recovers(context):
    from app.memory.sync import KnowledgeSyncWorker
    ctx = context
    access = ctx.requests.access_memory
    ctx.requests.access_memory = lambda *a, **k: (_ for _ in ()).throw(OSError('storage offline'))
    assert complete(ctx)['machine_control']['state'] == 'running'
    assert ctx.backend.call('search_experience')['items'] == []
    ctx.requests.access_memory = access
    indexer = Indexer()
    indexer.ready = True
    ctx.requests.agent.experience_module.writer.rag = indexer
    controls = list(ctx.factory.controls)
    KnowledgeSyncWorker(ctx.operations, ctx.backend).sync(force=True)
    assert ctx.backend.call('search_experience')['items'][0]['rag_saved'] is True
    assert ctx.factory.controls == controls
