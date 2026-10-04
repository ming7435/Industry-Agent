"""CAD 计算边界：独立进程、有限时间与专用依赖环境。"""

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[5]


class CADKernelError(RuntimeError):
    """几何内核不可用、超时或校验失败。"""


class CADKernel:
    def __init__(self, python_path=None, timeout=120):
        isolated = PROJECT_ROOT / ".runtime" / "cad-modeling-venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        self.python_path = str(python_path or (isolated if isolated.is_file() else sys.executable))
        self.timeout = timeout
        self.worker = Path(__file__).with_name("modeling_worker.py")
        self._health = None

    def _run(self, payload=None, health=False):
        command = [self.python_path, str(self.worker)] + (["--health"] if health else [])
        # CAD 子进程不继承 API 密钥、供应商配置或数据库凭据。
        environment = {key: value for key, value in os.environ.items() if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA"}}
        environment.update({"PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})
        try:
            result = subprocess.run(command, input=None if health else json.dumps(payload, ensure_ascii=False),
                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=self.timeout, env=environment,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            value = json.loads(result.stdout.strip())
        except subprocess.TimeoutExpired as error:
            raise CADKernelError("CAD 计算超时，工作进程已停止；请简化模型后创建新版本") from error
        except (OSError, ValueError) as error:
            raise CADKernelError("CAD 引擎不可用，请安装 CAD 专用依赖环境") from error
        if result.returncode or value.get("error"):
            raise CADKernelError(value.get("error", "CAD 实体校验失败"))
        return value

    def health(self):
        if self._health is None:
            try:
                self._health = self._run(health=True)
            except CADKernelError as error:
                self._health = {"ready": False, "message": str(error)}
        return dict(self._health)

    def build(self, spec, output_dir, **arguments):
        return self._run({"spec": spec, "output_dir": str(output_dir), **arguments})
