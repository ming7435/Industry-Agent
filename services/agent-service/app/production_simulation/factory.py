"""Bounded loopback-only transport for the existing virtual-turning factory."""
from http.client import HTTPException
import ipaddress
import json
import math
import os
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler, ProxyHandler

from shared.virtual_turning import DEVICE_ID, POSTPROCESSOR, SCHEMA, SCOPE, validate_virtual_program


class VirtualFactoryError(RuntimeError):
    def __init__(self, code, message='', status=503, outcome_unknown=False, execution_started=False):
        super().__init__(message or code)
        self.code, self.status = code, status
        self.outcome_unknown, self.execution_started = outcome_unknown, execution_started


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class VirtualFactoryClient:
    MAX_RESPONSE = 4 * 1024 * 1024

    def __init__(self, base_url: str, timeout: float = 5):
        try:
            parts = urlsplit(base_url)
            host, port = parts.hostname, parts.port
            loopback = host == 'localhost' or ipaddress.ip_address(host).is_loopback
            valid = (parts.scheme == 'http' and loopback and not parts.username and not parts.password
                     and parts.path in ('', '/') and not parts.query and not parts.fragment and (port is None or 1 <= port <= 65535))
        except (ValueError, TypeError):
            valid = False
        if not valid:
            raise VirtualFactoryError('invalid_factory_endpoint', '模拟工厂地址必须为 HTTP 回环地址', 422)
        if isinstance(timeout, bool) or not isinstance(timeout, (int, float)) or not math.isfinite(timeout) or not 0 < timeout <= 30:
            raise VirtualFactoryError('invalid_factory_timeout', status=422)
        # Pin localhost without inheriting proxy settings or a mutable hostname resolution.
        host = '127.0.0.1' if host == 'localhost' else host
        self.base_url = 'http://' + (f'[{host}]' if ':' in host else host) + (f':{port}' if port is not None else '')
        self.timeout = timeout

    def _request(self, path, body=None):
        write = body is not None
        raw = json.dumps(body, ensure_ascii=False, allow_nan=False).encode() if write else None
        request = Request(self.base_url + '/api/production' + path, data=raw, method='POST' if write else 'GET',
                          headers={'Accept': 'application/json', 'Content-Type': 'application/json',
                                   'X-Factory-Production': 'virtual-v1'})
        try:
            with build_opener(ProxyHandler({}), _NoRedirect()).open(request, timeout=self.timeout) as response:
                data = response.read(self.MAX_RESPONSE + 1)
        except HTTPError as error:
            code = 'factory_http_' + str(error.code)
            try:
                failure = json.loads(error.read(4096))
                message = str(failure.get('error') or code)[:300] if isinstance(failure, dict) else code
            except (ValueError, UnicodeError): message = code
            finally: error.close()
            raise VirtualFactoryError(code, message, error.code, write and (error.code >= 500 or error.code == 408)) from None
        except (URLError, TimeoutError, OSError, HTTPException):
            raise VirtualFactoryError('factory_unavailable', '模拟工厂连接中断，请核对原任务', outcome_unknown=write) from None
        if len(data) > self.MAX_RESPONSE:
            raise VirtualFactoryError('factory_response_too_large', outcome_unknown=write)
        try:
            value = json.loads(data)
        except (ValueError, UnicodeError, RecursionError):
            raise VirtualFactoryError('invalid_factory_json', outcome_unknown=write) from None
        if not isinstance(value, dict):
            raise VirtualFactoryError('invalid_factory_response', outcome_unknown=write)
        return value

    @staticmethod
    def _segment(value, kind):
        pattern = r'vprod-[a-f0-9]{32}' if kind == 'job' else r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}'
        if not isinstance(value, str) or not re.fullmatch(pattern, value):
            raise VirtualFactoryError('invalid_' + kind + '_id', status=422)
        return quote(value, safe='')

    def capabilities(self):
        value = self._request('/capabilities')
        profiles, processors = value.get('profiles'), value.get('postprocessors')
        valid = (isinstance(profiles, list) and all(isinstance(p, str) for p in profiles)
                 and isinstance(processors, list) and all(isinstance(p, str) for p in processors)
                 and value.get('schema_version') == SCHEMA and value.get('simulation_only') is True and value.get('ready') is True
                 and value.get('device_id') == DEVICE_ID and value.get('postprocessor') == POSTPROCESSOR
                 and POSTPROCESSOR in processors and value.get('scope') == SCOPE
                 and {'cylinder', 'coaxial-through-hole'} <= set(profiles)
                 and value.get('rapid_mm_per_min') == 1000)
        if not valid:
            raise VirtualFactoryError('factory_capability_mismatch', '模拟工厂未就绪或加工契约不匹配', 409)
        return value

    def _write_gate(self):
        if os.getenv('FACTORY_CONTROL_MODE', '').lower() != 'virtual':
            raise VirtualFactoryError('virtual_mode_required', '未启用虚拟工厂模式', 409)
        self.capabilities()

    @staticmethod
    def _job(value, write=False):
        valid = (value.get('simulation_only') is True and value.get('status') in {'received', 'running', 'paused', 'interrupted', 'completed'}
                 and isinstance(value.get('events'), list) and isinstance(value.get('program'), dict)
                 and re.fullmatch(r'vprod-[a-f0-9]{32}', str(value.get('job_id', '')))
                 and re.fullmatch(r'[a-f0-9]{64}', str(value.get('program_digest', '')))
                 and isinstance(value.get('command_id'), str) and type(value.get('executed_points')) is int
                 and type(value.get('progress')) in (int, float) and math.isfinite(value['progress']) and 0 <= value['progress'] <= 1)
        if not valid:
            raise VirtualFactoryError('invalid_factory_job', outcome_unknown=write)
        return value

    def submit(self, command_id, program):
        self._segment(command_id, 'command')
        validate_virtual_program(program)
        self._write_gate()
        return self._job(self._request('/jobs', {'command_id': command_id, 'program': program}), True)

    def by_command(self, command_id):
        return self._job(self._request('/jobs/by-command/' + self._segment(command_id, 'command')))

    def get(self, job_id):
        return self._job(self._request('/jobs/' + self._segment(job_id, 'job')))

    def start(self, job_id, digest, operator):
        segment = self._segment(job_id, 'job')
        if not isinstance(digest, str) or not re.fullmatch(r'[a-f0-9]{64}', digest):
            raise VirtualFactoryError('invalid_program_digest', status=422)
        if not isinstance(operator, str) or not 0 < len(operator.strip()) <= 200:
            raise VirtualFactoryError('operator_confirmation_required', status=422)
        self._write_gate()
        return self._job(self._request('/jobs/' + segment + '/start',
                                      {'digest': digest, 'operator': operator.strip(), 'simulation_only': True}), True)
