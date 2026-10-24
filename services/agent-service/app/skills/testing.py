"""草稿样例试运行。只读样例适配器不持有生产工具、会话或设备控制。"""
from concurrent.futures import ThreadPoolExecutor
from copy import copy
from dataclasses import replace
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
import re
from threading import BoundedSemaphore, Lock
from time import monotonic, time
from uuid import uuid4

from app.skills.management import SkillEditError
from app.skills.registry import SkillRegistry


def fingerprint(values):
    content = {key: str(values[key]).strip() for key in ('expected_revision', 'version', 'goal', 'document', 'reason')}
    return sha256(json.dumps(content, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def _observe_isolated_agent(trace, trial, operation):
    """Track a real isolated agent operation, without recording the sample or output text."""
    if trace is None:
        return operation()
    identity = 'EXPERT-TRIAL-' + trial['test_id']
    attempt = {'type': 'agent', 'agent': trial['agent'], 'task_id': identity,
               'trace_id': identity, 'agent_run_id': identity, 'test_id': trial['test_id'],
               'run_type': 'expert_trial', 'context': {'run_type': 'expert_trial'}}
    try:
        trace.record(event='agent_started', **attempt)
        try:
            result = operation()
        except BaseException:
            trace.record(event='agent_error', error='隔离测试中的专家执行异常', **attempt)
            raise
        output = result[0] if isinstance(result, tuple) else result
        output = output if isinstance(output, dict) else {}
        status = output.get('status')
        allowed = {'completed', 'ready', 'needs_input', 'insufficient_evidence',
                   'insufficient_data', 'insufficient_engineering_data', 'fallback', 'blocked', 'failed', 'error'}
        summary = {'status': status if isinstance(status, str) and status in allowed else 'blocked'}
        for key in ('error', 'validation_errors', 'validation_findings', 'failed_checks'):
            if output.get(key):
                summary[key] = True
        for key in ('success', 'workorder_ready'):
            if type(output.get(key)) is bool:
                summary[key] = output[key]
        if isinstance(output.get('validation'), dict):
            summary['validation'] = {key: value for key, value in output['validation'].items()
                                     if key in ('valid', 'pass', 'passed') and type(value) is bool}
        trace.record(event='agent_completed', output=summary, **attempt)
        return result
    finally:
        release = getattr(trace, 'release_agent_attempt', None)
        if callable(release):
            release(attempt)


class DraftRegistry(SkillRegistry):
    is_expert_trial = True

    def __init__(self, root, definitions):
        super().__init__(root)
        self.definitions = definitions

    def list(self, agent):
        # 冻结测试开始时的技能，不改写全局注册表，不读取试运行期间的线上新版。
        return list(self.definitions.get(agent, []))


class TrialFailure(Exception):
    """可展示的固定文案；不把提供方异常直接传入浏览器。"""


class SampleTools:
    names = ('get_alarm_definition', 'get_device_history', 'get_device_logs', 'get_device_status', 'search_knowledge')

    def __init__(self, sample):
        self.sample = sample
        self.calls = []
        self.denied = False

    def tool_schemas(self, allowed_tools=None):
        return [{'type': 'function', 'function': {
            'name': name, 'description': '只读取当前人工提供的测试样例，不查询生产数据',
            'parameters': {'type': 'object', 'properties': {
                'alarm_code': {'type': 'string'}, 'device_id': {'type': 'string'},
                'query': {'type': 'string'}, 'metric_keys': {'type': 'array', 'items': {'type': 'string'}}}}}}
            for name in self.names if name in (allowed_tools or self.names)]

    def execute(self, name, arguments, context=None):
        self.calls.append(name)
        if name not in self.names:
            self.denied = True
            raise PermissionError('样例测试禁止业务写入')
        if arguments.get('device_id') not in (None, '', 'EXPERT-SAMPLE') or (
            name == 'get_alarm_definition' and str(arguments.get('alarm_code') or '') != self.sample['alarm_code']
        ):
            return {'success': False, 'found': False, 'error': '当前样例没有此设备或报警'}
        base = {'source': 'expert_test_sample', 'success': True, 'found': True}
        if name == 'get_alarm_definition':
            definition = self.sample.get('alarm_definition', '')
            return {**base, 'found': bool(definition), 'alarm_code': self.sample['alarm_code'],
                    'name': definition or '未提供报警定义', 'description': definition}
        if name == 'get_device_logs':
            return {**base, 'logs': [{'message': self.sample['scenario']}]}
        if name == 'get_device_status':
            return {**base, 'status': '测试样例', 'mode': '测试', 'description': self.sample['scenario']}
        if name == 'get_device_history':
            values = self.sample.get('history_values') or []
            metric = self.sample.get('history_metric') or ''
            if metric and len(values) >= 2:
                return {**base, 'sample_count': len(values), 'trend': {metric: {
                    'direction': 'rising' if values[-1] > values[0] else 'falling' if values[-1] < values[0] else 'stable',
                    'latest': values[-1], 'min': min(values), 'max': max(values), 'values': values}}}
        # 不制造历史数值或知识命中。需要这些数据时专家应在样例中补充。
        return {**base, 'found': False, 'sample_count': 0, 'documents': [], 'trend': {},
                'message': '当前样例未提供此类资料，请依据已知描述谨慎判断'}


class TrialClient:
    def __init__(self, client, purpose='diagnosis'):
        self.client = copy(client)
        self.purpose = purpose
        self.timeout = min(float(getattr(client, 'timeout', 45)), 45)
        self.deadline = monotonic() + 180
        self.calls = 0
        self.last_candidate = None
        self.available = getattr(client, 'available', True)

    def chat(self, messages, **kwargs):
        self.calls += 1
        remaining = self.deadline - monotonic()
        if self.calls > 6 or remaining <= 0:
            raise TimeoutError('样例测试已达到时间或调用次数限制')
        if hasattr(self.client, 'timeout'):
            self.client.timeout = min(float(self.client.timeout), self.timeout, 45, remaining)
        messages = [{'role': 'system', 'content':
                     ('这是隔离技能任务验证。仅使用提供的问题与资料，不能操作生产或设备，不能把人工预期当作事实。'
                      if self.purpose != 'diagnosis' else
                     '当前为专家技能的隔离故障样例试运行。工具只读取人工样例，不能查询真实设备或操作业务。'
                     '最终 JSON 的 confidence 必须是 0 到 1 之间的数值，例如 0.5，不使用“高/中/低”文字。'
                     '资料不足时保留不确定性和较低置信度，不能为了完成测试编造证据。')}, *messages]
        response = self.client.chat(messages, **kwargs)
        from app.agents.diagnosis.parsing import assistant_message, parse_final_json
        message = assistant_message(response)
        if not message.get('tool_calls'):
            self.last_candidate = parse_final_json(str(message.get('content') or ''))
        return response


class SkillTrials:
    def __init__(self, manager, client_factory=None):
        from app.llm import get_default_llm_client
        self.manager = manager
        self.client_factory = client_factory or get_default_llm_client
        self.pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix='expert-sample')
        self.slots = BoundedSemaphore(2)
        self.active = set()
        self.failed_writes = set()
        self.failures = {}
        self.lock = Lock()
        self.instance = uuid4().hex
        self._sandbox_executor = None

    def _path(self, test_id):
        if not re.fullmatch(r'[a-f0-9]{32}', str(test_id)):
            raise SkillEditError(404, '未找到测试记录')
        return self.manager.backup_root / 'tests' / (test_id + '.json')

    def _write(self, record):
        path = self._path(record['test_id'])
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix('.' + uuid4().hex + '.tmp')
        try:
            with temporary.open('x', encoding='utf-8') as handle:
                json.dump(record, handle, ensure_ascii=False, indent=2)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)

    def _read(self, test_id, actor):
        path = self._path(test_id)
        if not path.is_file():
            raise SkillEditError(404, '未找到测试记录')
        record = json.loads(path.read_text(encoding='utf-8'))
        if record['actor_id'] != actor['user_id']:
            raise SkillEditError(403, '只能读取和发布本人完成的测试')
        return record

    @staticmethod
    def _public(record):
        return {key: record.get(key) for key in ('test_id', 'status', 'mode', 'scope', 'created_at', 'assessment',
                                                'sample', 'result', 'message')}

    def get(self, test_id, actor):
        # Windows 上打开文件读取时不能原子替换；与结果写入使用同一文件锁。
        with self.manager._transaction():
            record = self._read(test_id, actor)
        if test_id in self.failed_writes:
            record.update(status='failed', result=None, message='测试结果未能保存，请重新测试')
        if record['status'] == 'running' and record['instance'] != self.instance:
            record.update(status='failed', message='服务已重启，请重新测试当前草稿')
        return self._public(record)

    def _dependencies(self, agent):
        root = self.manager.registry.root
        return {str(path.relative_to(root)): sha256(path.read_bytes()).hexdigest()
                for path in self.manager.registry.source_files(agent)}

    def start_task(self, agent, name, values, actor):
        from app.skills.task_testing import validate_task
        from app.skills.optimization import verification_mode
        if actor.get('role') != 'technician' or not actor.get('user_id'):
            raise SkillEditError(403, '请由维修人员审核并验证任务样例')
        sample = validate_task(agent, name, values.get('task'))
        return self.start(agent, name, {**values, 'sample': sample, 'task_mode': verification_mode(agent, name)}, actor)

    def start(self, agent, name, values, actor):
        with self.lock:
            if actor['user_id'] in self.active or not self.slots.acquire(blocking=False):
                raise SkillEditError(409, '样例测试正在运行，请等待结果后重试')
            self.active.add(actor['user_id'])
        try:
            with self.manager._transaction():
                current = self.manager._detail(agent, name)
                if current['revision'] != values['expected_revision']:
                    raise SkillEditError(409, '线上技能已变化，请刷新并核对草稿后重新测试')
                if set(current['tools']) - self.manager.available_tools:
                    raise SkillEditError(503, '技能引用的工具尚未注册，不能测试发布')
                definitions = []
                dependencies = self._dependencies(agent)
                for skill in self.manager.registry.list(agent):
                    definition = skill
                    if definition.name == name:
                        definition = replace(definition, document=values['document'].strip(),
                                             goal=values['goal'].strip(), version=values['version'].strip(),
                                             metadata={**definition.metadata, 'goal': values['goal'].strip(),
                                                       'version': values['version'].strip()})
                        if values.get('task_mode') == 'review_flow':
                            definition = replace(definition, metadata={**definition.metadata, 'review_enabled': True})
                    definitions.append(definition)
                if self._dependencies(agent) != dependencies:
                    raise SkillEditError(409, '线上技能正在变化，请刷新后重新测试')
                registry = DraftRegistry(self.manager.registry.root, {agent: definitions})
                mode = values.get('task_mode') or ('diagnosis' if agent == 'diagnosis' else 'instruction_preview')
                record = {'test_id': uuid4().hex, 'actor_id': actor['user_id'], 'agent': agent, 'name': name,
                          'fingerprint': fingerprint(values), 'dependencies': dependencies, 'baseline_revision': current['revision'],
                          'status': 'running', 'mode': mode, 'instance': self.instance, 'created_epoch': time(),
                          'created_at': datetime.now(timezone.utc).isoformat(), 'sample': values['sample'],
                          'scope': ('只读技能核查验证：使用样例输入输出；不执行工单、质检、报告保存、生产或设备控制。' if mode == 'review_flow' else
                                    '隔离任务验证：执行检索图或规格解析，不操作机器、不生成实体、不写业务数据。' if mode in {'knowledge_flow', 'cad_spec_flow'} else
                                    '使用现有诊断流程和草稿技能，只读取提供的样例数据。' if mode == 'diagnosis' else
                                    '故障样例说明试读：核对修改后的说明；不运行该智能体的业务工具或固定流程。'),
                          'result': None, 'message': '样例试运行中，请等待结果'}
                self._write(record)
            self.pool.submit(self._execute, record, registry)
            return self._public(record)
        except Exception:
            with self.lock:
                self.active.discard(actor['user_id'])
                self.slots.release()
            raise

    def _sandbox(self):
        """按需构造沙箱执行器；默认关闭时不加载 SDK。"""
        if self._sandbox_executor is None:
            from app.clients.skill_sandbox import SkillSandbox

            self._sandbox_executor = SkillSandbox.from_env()
        return self._sandbox_executor

    def _execute_sandboxed(self, record, registry, sandbox):
        """在一次性沙箱里执行草稿试运行，并复用原有回执与依赖校验。"""
        definitions = registry.list(record['agent'])
        payload = {
            'agent': record['agent'],
            'name': record['name'],
            'mode': record['mode'],
            'test_id': record['test_id'],
            'definitions': [
                {'metadata': dict(item.metadata), 'document': item.document}
                for item in definitions
            ],
            # 人工预期只留在宿主回执里，不进入沙箱进程。
            'sample': {key: value for key, value in record['sample'].items()
                       if key != 'expected'},
        }
        response = {}

        def operation():
            response.update(sandbox.run(payload))
            return response.get('result') or {}

        output = (operation() if record['mode'] in {'instruction_preview', 'review_flow'}
                  else _observe_isolated_agent(self.manager.trace, record, operation))
        if not response.get('ok'):
            raise TrialFailure(str(response.get('message') or '沙箱试运行未通过'))
        if not isinstance(output, dict):
            raise TrialFailure('沙箱未返回有效结果，请检查镜像和模型服务。')

        if record['mode'] in {'knowledge_flow', 'cad_spec_flow', 'review_flow'}:
            from app.skills.optimization import assessment_keys

            required = set(assessment_keys(record['mode'])) - {'baseline_unchanged', 'dependencies_unchanged'}
            criteria = response.get('criteria')
            if not isinstance(criteria, dict) or set(criteria) != required or any(type(value) is not bool for value in criteria.values()):
                raise TrialFailure('沙箱未返回有效验收结果，请重新测试。')
            with self.manager._transaction():
                criteria.update(
                    baseline_unchanged=self.manager._detail(record['agent'], record['name'])['revision'] == record['baseline_revision'],
                    dependencies_unchanged=self._dependencies(record['agent']) == record['dependencies'],
                )
                accepted = all(criteria.values())
                record.update(status='completed' if accepted else 'failed', result=output,
                              message='任务验证通过，等待人工核对并发布。' if accepted else '任务验证未通过或候选未实际参与决策，旧版保留。',
                              assessment={'schema': 1, 'assessment_id': record['test_id'], 'agent': record['agent'], 'name': record['name'],
                                          'trial_fingerprint': record['fingerprint'], 'completed_at': datetime.now(timezone.utc).isoformat(),
                                          'accepted': accepted, 'criteria': criteria, 'basis': record['mode'] + '_receipt'})
                self._write(record)
            return

        keys = (('summary', 'diagnosis', 'recommendation', 'confidence')
                if record['mode'] == 'diagnosis' else
                ('summary', 'diagnosis', 'recommendation'))
        result = {key: output.get(key) for key in keys}
        if not all(isinstance(result.get(key), str) and result[key].strip()
                   for key in ('summary', 'diagnosis', 'recommendation')):
            raise TrialFailure('模型未返回完整的诊断内容，请核对样例后重新测试。')

        with self.manager._transaction():
            if self._dependencies(record['agent']) != record['dependencies']:
                raise TrialFailure('试运行期间线上技能已更新，请刷新并核对草稿后重新测试。')
            record.update(status='completed', result=result,
                          message='试运行已完成，请对照预期结果人工核对后发布')
            self._write(record)

    def _execute(self, record, registry):
        record = dict(record)
        try:
            sandbox = self._sandbox()
            if sandbox.supports(record['mode']):
                try:
                    self._execute_sandboxed(record, registry, sandbox)
                    return
                except Exception as error:
                    # 默认失败关闭；只有显式允许回退时才继续走原有进程内路径。
                    if not sandbox.fallback or record['mode'] == 'machine_flow':
                        from app.clients.skill_sandbox import SkillSandboxError
                        if isinstance(error, SkillSandboxError):
                            raise TrialFailure(str(error)) from error
                        raise
                    trace = getattr(self.manager, 'trace', None)
                    if trace is not None:
                        try:
                            trace.record(type='skill_trial', event='sandbox_fallback',
                                         agent=record['agent'], skill=record['name'],
                                         test_id=record['test_id'])
                        except Exception:
                            pass
            from app.agents.diagnosis.agent import DiagnosisAgent
            from app.agents.diagnosis.parsing import assistant_message, parse_final_json
            sample = record['sample']
            client = TrialClient(self.client_factory(), record['mode'])
            if not client.available:
                raise TrialFailure('尚未配置模型服务，无法试运行，请联系管理员。')
            if record['mode'] in {'knowledge_flow', 'cad_spec_flow', 'review_flow'}:
                from app.skills.task_testing import execute_task
                operation = lambda: execute_task(record, registry, client)
                # Review-only samples inspect supplied inputs/outputs and never run the Agent.
                output, criteria = (operation() if record['mode'] == 'review_flow' else
                    _observe_isolated_agent(self.manager.trace, record, operation))
                with self.manager._transaction():
                    criteria.update(baseline_unchanged=self.manager._detail(record['agent'], record['name'])['revision'] == record['baseline_revision'],
                                    dependencies_unchanged=self._dependencies(record['agent']) == record['dependencies'])
                    accepted = all(criteria.values())
                    record.update(status='completed' if accepted else 'failed', result=output,
                        message='任务验证通过，等待人工核对并发布。' if accepted else '任务验证未通过或候选未实际参与决策，旧版保留。',
                        assessment={'schema': 1, 'assessment_id': record['test_id'], 'agent': record['agent'], 'name': record['name'],
                            'trial_fingerprint': record['fingerprint'], 'completed_at': datetime.now(timezone.utc).isoformat(),
                            'accepted': accepted, 'criteria': criteria, 'basis': record['mode'] + '_receipt'})
                    self._write(record)
                return
            if record['mode'] == 'diagnosis':
                tools = SampleTools(sample)
                event = {'event_id': 'SAMPLE-' + record['test_id'], 'device_id': 'EXPERT-SAMPLE',
                         'alarm_code': sample['alarm_code'] or None, 'severity': sample['severity'],
                         'summary': sample['scenario'], 'description': sample['scenario'],
                         'realtime_snapshot': {'现场记录': sample['scenario']},
                         'abnormal_metrics': sample['abnormal_metrics'], 'occurrence_count': sample['occurrence_count']}
                agent = DiagnosisAgent(client=client, tools=tools, skill_registry=registry)
                result = _observe_isolated_agent(self.manager.trace, record, lambda: agent.run(event).to_dict())
                if record['name'] not in result.get('active_skills', []):
                    raise TrialFailure('此样例未触发当前技能，请调整报警编号、异常指标或严重程度后重新测试。')
                if (result.get('status') != 'completed' or result.get('stop_reason') != 'validator_pass'
                        or result.get('error') or not client.last_candidate
                        or tools.denied or any(call.get('guard') == 'deny' for call in result.get('tool_calls', []))):
                    self.failures[record['test_id']] = {'stop_reason': result.get('stop_reason'),
                                                       'tool_names': [call.get('name') for call in result.get('tool_calls', [])]}
                    raise TrialFailure('试运行未完成诊断：请检查模型服务，补充样例资料并核对草稿后重试。')
                output = {key: result.get(key) for key in ('summary', 'diagnosis', 'recommendation', 'confidence')}
            else:
                skill = registry.get(record['agent'], record['name'])
                messages = [{'role': 'system', 'content': '这是专家说明的隔离试读，不调用工具，不执行设备或业务操作。'
                            '根据草稿说明和故障样例返回 JSON，字段 summary、diagnosis、recommendation。'
                            '没有证据时明确说明不确定性。预期结果是人工对照依据，不能把它当成现场事实。'},
                            {'role': 'system', 'content': skill.document},
                            {'role': 'user', 'content': json.dumps({k: v for k, v in sample.items() if k != 'expected'}, ensure_ascii=False)}]
                output = parse_final_json(str(assistant_message(client.chat(messages)).get('content') or ''))
                output = {key: output.get(key) for key in ('summary', 'diagnosis', 'recommendation')}
            if not all(isinstance(output.get(key), str) and output[key].strip() for key in ('summary', 'diagnosis', 'recommendation')):
                raise TrialFailure('模型未返回完整的诊断内容，请核对样例后重新测试。')
            with self.manager._transaction():
                if self._dependencies(record['agent']) != record['dependencies']:
                    raise TrialFailure('试运行期间线上技能已更新，请刷新并核对草稿后重新测试。')
                record.update(status='completed', result=output, message='试运行已完成，请对照预期结果人工核对后发布')
                self._write(record)
        except Exception as error:
            # 模型异常中的地址、密钥和内部堆栈不进入浏览器或可发布测试凭据。
            record.update(status='failed', result=None,
                          message=str(error) if isinstance(error, TrialFailure) else '试运行失败，请检查模型服务后重试。')
            try:
                with self.manager._transaction():
                    self._write(record)
            except (OSError, SkillEditError):
                self.failed_writes.add(record['test_id'])
                # 未能保存 completed 状态绝不能用于发布。
        finally:
            with self.lock:
                self.active.discard(record['actor_id'])
                self.slots.release()

    def validate_publish(self, agent, name, values, actor):
        # 调用方已持有跨进程发布锁，核对和原子替换在同一事务内。
        if values.get('human_confirmed') is not True or not values.get('test_id'):
            raise SkillEditError(409, '请先完成故障样例测试，并人工核对结果后发布')
        record = self._read(values['test_id'], actor)
        if (record['status'] != 'completed' or record['agent'] != agent or record['name'] != name
                or record['fingerprint'] != fingerprint(values) or time() - record['created_epoch'] > 86400
                or self._dependencies(agent) != record['dependencies']):
            raise SkillEditError(409, '测试未通过、已过期或草稿/线上版本已变化，请重新测试后发布')
