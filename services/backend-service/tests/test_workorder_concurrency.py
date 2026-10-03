"""测试真实仓储更新，不把冲突检测逻辑 mock 掉。"""
import pytest
from app.workorder.repository import SQLiteRepository


def test_stale_writer_cannot_overwrite_accepted_or_completed_order(tmp_path):
    repository = SQLiteRepository(str(tmp_path / 'orders.db'))
    repository.create({'workorder_id': 'WO1', 'status': 'in_progress'})
    first = repository.get('WO1')
    stale = repository.get('WO1')
    first['accepted_by'] = 'U1'
    repository.update(first)
    stale['status'] = 'completed'
    with pytest.raises(ValueError, match='更新'):
        repository.update(stale)
    assert repository.get('WO1')['accepted_by'] == 'U1'
    assert repository.get('WO1')['status'] == 'in_progress'
