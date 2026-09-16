"""DeepSeek OpenAI Compatible API 客户端。

LLM 是平台级共享能力，不属于某一个 Agent。Agent 通过依赖注入使用它。
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _load_project_env() -> None:
    """读取项目根目录 .env，不覆盖已经存在的环境变量。"""

    project_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
    )
    env_path = os.path.join(project_root, ".env")
    if not os.path.isfile(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as stream:
        for raw_line in stream:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class DeepSeekClient:
    """DeepSeek Chat Completion 客户端。"""

    def __init__(self, api_key: Optional[str] = None) -> None:
        _load_project_env()
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY", "").strip()
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.timeout = float(os.getenv("DEEPSEEK_TIMEOUT_SECONDS", "30"))

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def chat(self, messages, tools=None, tool_choice=None) -> Dict[str, Any]:
        if not self.available:
            raise RuntimeError("未配置 DEEPSEEK_API_KEY")

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
        }
        if tools:
            payload["tools"] = tools
        if tool_choice is not None:
            payload["tool_choice"] = tool_choice

        request = Request(
            self.base_url + "/chat/completions",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": "Bearer " + self.api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

        try:
            with urlopen(request, timeout=self.timeout) as response:
                body = response.read().decode("utf-8")
        except (HTTPError, URLError, TimeoutError) as error:
            raise RuntimeError("DeepSeek 请求失败：%s" % error) from error

        try:
            result = json.loads(body)
        except json.JSONDecodeError as error:
            raise RuntimeError("DeepSeek 返回内容不是有效 JSON") from error

        if not isinstance(result, dict):
            raise RuntimeError("DeepSeek 返回格式错误")
        return result
