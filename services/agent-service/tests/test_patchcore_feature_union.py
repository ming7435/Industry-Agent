import sys
from pathlib import Path

import pytest

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'scripts'))
from evaluate_patchcore_feature_union import combine


def row(sample,score):
    return dict(sample_id=sample,file_sha256=sample,label='defect',scenario='stain',split='calibration',score=score,roi_score=score*.5)


def test_union_matches_by_identity_and_requires_either_branch_to_cross_its_frozen_threshold():
    result=combine([row('a',2),row('b',1)],[row('b',3),row('a',1)],dict(roi=False,threshold=2),dict(roi=False,threshold=2))
    assert [r['sample_id'] for r in result]==['a','b']
    assert [r['score'] for r in result]==[1.,1.5]


def test_union_rejects_missing_or_differently_labeled_photographs():
    with pytest.raises(ValueError):
        combine([row('a',1)],[],dict(roi=False,threshold=2),dict(roi=False,threshold=2))
    changed=row('a',1);changed['label']='normal'
    with pytest.raises(ValueError):
        combine([row('a',1)],[changed],dict(roi=False,threshold=2),dict(roi=False,threshold=2))
