import json
import tracemalloc
from datetime import datetime

import pytest

from app.runtime import recovery


def test_checkpoint_snapshot_matches_json_contract_and_freezes_mutable_values():
    source = {'items': [{1: 'value', None: ('tuple', datetime(2026, 10, 13))}], 'flag': True}
    expected = json.loads(json.dumps(source, ensure_ascii=False, default=str))
    actual = recovery.snapshot_state(source)
    source['items'][0][1] = 'changed'
    assert actual == expected
    recursive = []; recursive.append(recursive)
    with pytest.raises(ValueError, match='Circular'):
        recovery.snapshot_state({'cycle': recursive})


def test_large_evidence_snapshot_does_not_allocate_a_second_text_buffer():
    evidence = '工程证据' * 500000
    source = {'knowledge': {'text': evidence}, 'completed_steps': [{'result': evidence}],
              'next_action': {'payload': {'evidence': evidence}}}
    tracemalloc.start()
    try:
        result = recovery.snapshot_state(source)
        _, peak = tracemalloc.get_traced_memory()
    finally:
        tracemalloc.stop()
    assert result == source
    assert peak < 1024 * 1024, f'Immutable evidence was copied into temporary JSON buffers: {peak}'
