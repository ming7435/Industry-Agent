import pytest

from app.mysql import writer


def entity(index):
    return {'entity_id': f'E-{index}', 'entity_type': 'INSERT', 'device_id': 'M1',
            'block_name': 'part', 'layer_name': '0'}


def test_combined_relation_budget_is_checked_before_pair_expansion(monkeypatch):
    def forbidden(*args):
        raise AssertionError('Pair expansion ran before the relation budget check')
    monkeypatch.setattr(writer, '_device_relation_rows', forbidden)
    with pytest.raises(ValueError, match='relation'):
        writer._cad_relation_rows(None, [entity(i) for i in range(300)], 'V', 'D', 'DOC')


@pytest.mark.parametrize('helper', ['_device_relation_rows', '_block_relation_rows'])
def test_each_pair_builder_rejects_oversized_groups(helper):
    with pytest.raises(ValueError, match='relation'):
        getattr(writer, helper)([entity(i) for i in range(320)], 'V', 'D', 'DOC')


def test_normal_drawing_keeps_device_block_and_layer_relations():
    rows = writer._cad_relation_rows(None, [entity(1), entity(2)], 'V', 'D', 'DOC')
    assert sorted(row[6] for row in rows) == ['belongs_to_layer', 'belongs_to_layer',
                                            'same_block_definition', 'same_device_id']
