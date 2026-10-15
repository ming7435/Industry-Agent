"""本地 RAGAS 评测入口；Skill 北极星仍由独立技能循环管理。"""

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
    parser = argparse.ArgumentParser(description="使用 RAGAS 评测检索和回答效果")
    parser.add_argument("--base-url", default="http://127.0.0.1:8020")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", type=Path, default=Path("evaluation-results"))
    parser.add_argument("--case", dest="case_ids", action="append", help="只运行指定题目 ID，可重复")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--no-llm", action="store_true", help="只评测检索与证据指标")
    parser.add_argument('--allow-model-calls', action='store_true', help='明确允许本次RAG生成和评测裁判调用，可能产生费用')
    parser.add_argument('--model-service-base-url', help='既有Model服务地址；默认读取共享配置，不读取供应商密钥')
    parser.add_argument('--max-model-calls', type=int, default=60, help='评测裁判聊天/向量HTTP调用总上限，不含RAG自身检索调用')
    parser.add_argument('--case-timeout', type=float, default=120, help='单题RAGAS指标时间预算，默认120秒')
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not 1 <= args.top_k <= 50:
        parser.error("--top-k 必须为1至50，与RAG接口一致")
    if not args.no_llm and not args.allow_model_calls:
        parser.error('完整评测需要 --allow-model-calls；只评测检索可使用 --no-llm')
    from config.settings import load_service_env
    load_service_env()
    try:
        report = run_evaluation(
            args.base_url,
            args.dataset,
            args.output_dir,
            limit=args.limit,
            no_llm=args.no_llm,
            case_ids=args.case_ids,
            top_k=args.top_k,
            allow_model_calls=args.allow_model_calls,
            model_service_base_url=args.model_service_base_url,
            max_model_calls=args.max_model_calls,
            case_timeout=args.case_timeout,
        )
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(
        f"RAGAS {report.framework_version}：{report.passed_cases}/{report.total_cases} 题取得有效指标，"
        f"模式={report.mode}，报告={args.output_dir / 'latest.json'}"
    )
    print('评测完成不代表答案合格；缺少标准答案或执行失败的指标均为null。')
    return 1 if report.failed_cases else 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
