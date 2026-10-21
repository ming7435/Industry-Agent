#!/usr/bin/env python3
"""本技能包的独立入口：自检、列出参考文档、查看参考正文。

    python scripts/run.py --check
    python scripts/run.py --list
    python scripts/run.py --reference reasoning
"""
from pathlib import Path
import sys

HERE = Path(__file__).resolve()
ROOT = next((parent for parent in HERE.parents if (parent / "scripts" / "skill_runner.py").is_file()), None)
if ROOT is None:
    raise SystemExit("未找到仓库根目录的 scripts/skill_runner.py")
sys.path.insert(0, str(ROOT / "scripts"))

import skill_runner

sys.argv = [sys.argv[0], "--skill", "memory/experience_retrieval", *sys.argv[1:]]
raise SystemExit(skill_runner.main())
