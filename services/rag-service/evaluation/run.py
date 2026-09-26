"""Command-line entry point for the local RAG evaluation runner."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from evaluation.runner import run_evaluation
else:  # pragma: no cover - exercised by package import
    from .runner import run_evaluation


DEFAULT_DATASET = Path(__file__).with_name("dataset.jsonl")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="运行本地 RAG 检索与回答效果评测")
    parser.add_argument("--base-url", default="http://127.0.0.1:8020")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", type=Path, default=Path("evaluation-results"))
    parser.add_argument("--case", dest="case_ids", action="append", help="只运行指定题目 ID，可重复")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--no-llm", action="store_true", help="只评测检索与证据指标")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.top_k < 1:
        parser.error("--top-k 必须大于 0")
    try:
        report = run_evaluation(
            args.base_url,
            args.dataset,
            args.output_dir,
            limit=args.limit,
            no_llm=args.no_llm,
            case_ids=args.case_ids,
            top_k=args.top_k,
        )
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(
        f"评测完成：{report.passed_cases}/{report.total_cases} 题无运行错误，"
        f"模式={report.mode}，报告={args.output_dir / 'latest.json'}"
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
