"""在隔离的 Python 导入路径中运行各服务测试套件。"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_commands(commands: list[list[str]]) -> list[subprocess.CompletedProcess]:
    """运行全部服务套件并保留每个进程结果，不能因首个失败而短路。"""

    results = []
    for command in commands:
        results.append(subprocess.run(command, cwd=ROOT))
    return results


def main() -> int:
    commands = [
        [sys.executable, "-m", "pytest", "-c", "pytest-model.ini", "-q"],
        [sys.executable, "-m", "pytest", "-c", "pytest-backend.ini", "-q"],
        [sys.executable, "-m", "pytest", "-c", "pytest-agent.ini", "-q"],
        [sys.executable, "-m", "pytest", "-c", "pytest-rag.ini", "-q"],
        [sys.executable, "-m", "pytest", "-c", "pytest-cad.ini", "-q"],
        [sys.executable, "-m", "pytest", "tests/integration", "tests/e2e", "tests/performance", "-o", "addopts=", "-q"],
    ]
    results = run_commands(commands)
    failed = [result.returncode for result in results if result.returncode]
    return failed[0] if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
