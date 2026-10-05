"""仅访问本机虚拟工厂的固定生产接口；写入不重试、不跟随重定向。"""

import ipaddress
import json
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener


class FactoryProductionError(RuntimeError):
    def __init__(self, message, uncertain=False):
        super().__init__(message)
        self.uncertain = uncertain


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class FactoryProductionClient:
    def __init__(self, base_url, timeout=10):
        parsed = urlsplit(str(base_url))
        try:
            local = parsed.hostname == "localhost" or ipaddress.ip_address(parsed.hostname or "").is_loopback
            port = parsed.port
        except ValueError:
            local, port = False, None
        if not local or parsed.scheme != "http" or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in {"", "/"} or not port:
            raise ValueError("加工下发仅支持本机 HTTP 虚拟工厂，不支持真实 PLC 或外部地址")
        self.base_url = str(base_url).rstrip("/")
        self.timeout = max(0.1, min(float(timeout), 30))
        self.opener = build_opener(ProxyHandler({}), NoRedirect())

    def _request(self, path, body=None, timeout=None):
        writing = body is not None
        headers = {"Accept": "application/json"}
        if writing:
            headers.update({"Content-Type": "application/json", "X-Factory-Production": "virtual-v1"})
        request = Request(self.base_url + path, data=json.dumps(body, ensure_ascii=False, allow_nan=False).encode("utf-8") if writing else None, headers=headers)
        try:
            with self.opener.open(request, timeout=timeout or self.timeout) as response:
                raw = response.read(2 * 1024 * 1024 + 1)
                if len(raw) > 2 * 1024 * 1024:
                    raise ValueError("响应超出资源限制")
                value = json.loads(raw)
                if not isinstance(value, dict):
                    raise ValueError("响应结构无效")
                return value
        except HTTPError as error:
            # 拒绝响应只报告状态，不能把适配器返回的任意内容/凭据带给前端。
            raise FactoryProductionError(f"虚拟工厂拒绝请求（HTTP {error.code}）", uncertain=writing and error.code >= 500) from None
        except (URLError, OSError, ValueError) as error:
            raise FactoryProductionError("虚拟工厂未返回可验证结果，请读取任务状态对账", uncertain=writing) from None

    def capabilities(self):
        return self._request("/api/production/capabilities", timeout=1)

    def submit(self, command_id, program):
        return self._request("/api/production/jobs", {"command_id": command_id, "program": program})

    def by_command(self, command_id):
        return self._request("/api/production/jobs/by-command/" + quote(command_id, safe=""))

    def get(self, job_id):
        self._check_job(job_id)
        return self._request("/api/production/jobs/" + job_id)

    def start(self, job_id, digest, operator):
        self._check_job(job_id)
        return self._request("/api/production/jobs/" + job_id + "/start", {"digest": digest, "operator": operator, "simulation_only": True})

    @staticmethod
    def _check_job(job_id):
        if not isinstance(job_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", job_id):
            raise FactoryProductionError("虚拟工厂返回无效任务编号")
