"""Run service test suites in isolated Python import paths."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    commands = [
        [sys.executable, "-m", "pytest", "-c", "pytest-agent.ini", "-q"],
        [sys.executable, "-m", "pytest", "-c", "pytest-rag.ini", "-q"],
        [sys.executable, "-m", "pytest", "-c", "pytest-cad.ini", "-q"],
        [sys.executable, "-m", "pytest", "tests/integration", "tests/e2e", "tests/performance", "-o", "addopts=", "-q"],
    ]
    for command in commands:
        completed = subprocess.run(command, cwd=ROOT)
        if completed.returncode:
            return completed.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
