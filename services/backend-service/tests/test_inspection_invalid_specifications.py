"""非法规格和非法实测值不能通过人工录入路径得到合格。"""
import pytest
from app.quality.inspection import PartInspectionService


@pytest.mark.parametrize('rule,actual', [('not-a-rule','not-a-number'),({},205),({'min':'bad','max':220},205),
    ({'min':190,'max':220},'bad'),({'min':220,'max':190},205),({'min':True,'max':220},205)])
def test_malformed_hardness_rule_or_observation_is_not_pass(rule,actual):
    result=PartInspectionService().call('inspect_part_material',part={'material':{'grade':'TEST','hardness_hb':actual}},
        specifications={'material_grade':'TEST','hardness_hb':rule})
    assert result['passed'] is False
    assert result['sufficient_data'] is False
    assert result['status']=='not_tested'


@pytest.mark.parametrize('rule', ['bad',{'min':'bad','max':10},{'min':True,'max':10},{'min':11,'max':9}])
def test_malformed_declared_dimension_is_not_silently_ignored(rule):
    result=PartInspectionService().call('inspect_part_dimensions',part={'measurements':{'length_mm':10,'diameter_mm':5}},
        specifications={'length_mm':rule,'diameter_mm':{'min':4,'max':6}})
    assert result['passed'] is False and result['sufficient_data'] is False


def test_grade_must_be_nonempty_text_not_matching_booleans():
    result=PartInspectionService().call('inspect_part_material',part={'material':{'grade':True}},specifications={'material_grade':True})
    assert result['passed'] is False
