import json

import pytest

from evaluation.models import EvaluationCase, load_dataset


def write_jsonl(tmp_path, rows):
    tmp_path.mkdir(parents=True, exist_ok=True)
    path = tmp_path / "dataset.jsonl"
    path.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n", encoding="utf-8")
    return path


def test_load_dataset_builds_case_and_isolates_defaults(tmp_path):
    path = write_jsonl(
        tmp_path,
        [
            {
                "id": "case-1",
                "question": "主轴温度过高怎么检查？",
                "expected_evidence_ids": ["EXP-1"],
                "expected_sources": ["sop"],
                "relevant_terms": ["冷却", "复测"],
                "should_answer": True,
            },
            {"id": "case-2", "question": "没有报警时如何保养？"},
        ],
    )

    cases = load_dataset(path)

    assert cases[0] == EvaluationCase(
        id="case-1",
        question="主轴温度过高怎么检查？",
        filters={},
        expected_evidence_ids=["EXP-1"],
        expected_sources=["sop"],
        relevant_terms=["冷却", "复测"],
        should_answer=True,
    )
    assert cases[1].filters == {}
    assert cases[1].expected_sources == []
    cases[0].filters["device_id"] = "D-1"
    assert cases[1].filters == {}


def test_load_dataset_rejects_invalid_rows_with_line_number(tmp_path):
    invalid_files = {
        "blank_id": [{"id": "", "question": "问题"}],
        "blank_question": [{"id": "case-1", "question": "  "}],
        "non_object": ["not an object"],
        "duplicate": [{"id": "case-1", "question": "一"}, {"id": "case-1", "question": "二"}],
    }

    for name, rows in invalid_files.items():
        with pytest.raises(ValueError, match=r"第\s*\d+\s*行"):
            load_dataset(write_jsonl(tmp_path / name, rows))

    malformed = tmp_path / "malformed.jsonl"
    malformed.write_text('{"id":"case-1","question":"问题"}\n{not-json}\n', encoding="utf-8")
    with pytest.raises(ValueError, match=r"第\s*2\s*行"):
        load_dataset(malformed)


def test_checked_in_dataset_has_reviewable_case_types():
    dataset_path = "services/rag-service/evaluation/dataset.jsonl"
    cases = load_dataset(dataset_path)

    assert len(cases) >= 7
    assert len({case.id for case in cases}) == len(cases)
    assert any(case.should_answer is False for case in cases)
    assert {case.id.split("-")[0] for case in cases} >= {
        "alarm_explanation",
        "no_alarm_maintenance",
        "spindle_cooling",
        "sop_manual",
        "historical_case",
        "device_scope",
        "no_evidence",
    }
