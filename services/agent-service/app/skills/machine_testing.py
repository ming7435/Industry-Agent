"""专家草稿的模拟机器闭环测试：使用正常监控入口和真实业务记录。"""
from contextlib import contextmanager
from dataclasses import replace
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from threading import RLock
from time import time
from uuid import uuid4

from app.skills.management import AGENTS, SkillEditError
from app.skills.registry import SkillDefinition, _parse_markdown_skill, skill_registry_scope
from app.skills.testing import DraftRegistry, SkillTrials, fingerprint

ACTIVE = {'awaiting_fault', 'running', 'awaiting_repair', 'awaiting_report'}


class MachineDraftRegistry(DraftRegistry):
    def __init__(self, root, definitions):
        super().__init__(root, definitions)
        self.used = set()
        self.lock = RLock()

    def record_execution(self, agent, result):
        from app.common.serialization import _serialize_agent_result
        output = _serialize_agent_result(result)
        names = output.get('active_skills') or (output.get('output') or {}).get('active_skills') or []
        with self.lock:
            self.used.update((agent, name) for name in names)


class MachineTrials(SkillTrials):
    def __init__(self, manager, runtime, factory=None, backend=None):
        super().__init__(manager)
        self.runtime = runtime
        self.factory = factory
        self.backend = backend
        self.registries = {}
        # Sample previews are retained as a read-only API. They cannot publish.
        self.require_machine_publish = True

    def _clients(self):
        if os.getenv('FACTORY_CONTROL_MODE', '').lower() != 'virtual':
            raise SkillEditError(409, '全流程测试只支持监控中心的模拟机器')
        if self.factory is None:
            from app.monitor.factory_api import FactoryApiClient
            self.factory = FactoryApiClient(os.getenv('FACTORY_API_BASE_URL', 'http://127.0.0.1:4529'))
        if self.backend is None:
            from app.clients.backend import BackendServiceClient
            self.backend = BackendServiceClient()
        return self.factory, self.backend

    def catalog_machines(self, actor):
        factory, _ = self._clients()
        responsible = actor.get('responsible_device_ids') or [actor.get('primary_device_id')]
        items = []
        for device in factory.devices():
            did = device['device_id']
            if did not in responsible:
                continue
            scenarios = factory.scenarios(did).get('scenarios') or []
            items.append({'device_id': did, 'name': device.get('name') or did, 'status': device.get('status'),
                          'scenarios': [{k: s.get(k) for k in ('scenario_id', 'name', 'alarm_code', 'summary')}
                                        for s in scenarios if s.get('alarm_code') and s.get('default_device_id') == did]})
        return {'items': items, 'scope': '使用现有模拟机器；测试会暂停整线，并保存工单及报告。'}

    def _dependencies(self, agent=None):
        if agent is not None:
            return super()._dependencies(agent)
        return {str(path.relative_to(self.manager.registry.root)): sha256(path.read_bytes()).hexdigest()
                for folder in AGENTS for path in sorted((self.manager.registry.root / folder).glob('*.md'))}

    def _active(self):
        pointer = self.manager.backup_root / 'machine-test.json'
        if not pointer.exists():
            return None
        try:
            identity = json.loads(pointer.read_text(encoding='utf-8'))
            path = self._path(identity['test_id'])
            return json.loads(path.read_text(encoding='utf-8')) if path.exists() else None
        except (OSError, ValueError, KeyError, SkillEditError):
            # 损坏的测试指针不能使正常监控事件停止执行。
            return None

    def _save_changes(self, test_id, **changes):
        with self.manager._transaction():
            path = self._path(test_id)
            record = json.loads(path.read_text(encoding='utf-8'))
            record.update(changes)
            registry = self.registries.get(test_id)
            if registry:
                with registry.lock:
                    record['used_skills'] = sorted([list(item) for item in registry.used])
            self._write(record)
            return record

    @staticmethod
    def _public(record):
        public = SkillTrials._public(record)
        public.update({key: record.get(key) for key in ('machine', 'event_id', 'workorders', 'report_id', 'progress')})
        return public

    def start_machine(self, agent, name, values, actor):
        factory, backend = self._clients()
        if actor.get('role') != 'technician':
            raise SkillEditError(403, '请使用负责设备的维修人员账号测试')
        machines = self.catalog_machines(actor)['items']
        machine = next((d for d in machines if d['device_id'] == values['machine']['device_id']), None)
        scenario = next((s for s in (machine or {}).get('scenarios', [])
                         if s['scenario_id'] == values['machine']['scenario_id']), None)
        if not machine or not scenario:
            raise SkillEditError(409, '请选择本人负责的模拟设备及其现有故障场景')
        devices = factory.devices()
        if not devices or any(d.get('status') != 'running' for d in devices):
            raise SkillEditError(409, '请先处理当前停机任务，使整线恢复运行后再测试')
        if backend.list_open_faults() or any(factory.scenarios(d['device_id']).get('active_scenarios') for d in devices):
            raise SkillEditError(409, '当前仍有故障或模拟场景，请处理完后再开始测试')
        with self.manager._transaction():
            active = self._active()
            if active and active['status'] in ACTIVE and active['instance'] == self.instance:
                raise SkillEditError(409, '整线已有全流程测试，请先完成当前测试')
            if active and active['status'] in ACTIVE:
                active.update(status='failed', message='服务已重启，原测试不能用于发布；机器和业务记录保留。')
                self._write(active)
            current = self.manager._detail(agent, name)
            if current['revision'] != values['expected_revision']:
                raise SkillEditError(409, '线上技能已变化，请刷新后重新测试')
            if set(current['tools']) - self.manager.available_tools:
                raise SkillEditError(503, '技能工具尚未注册，不能测试')
            dependencies = self._dependencies()
            definitions = {}
            for folder in AGENTS:
                definitions[folder] = []
                for path in sorted((self.manager.registry.root / folder).glob('*.md')):
                    payload, document = _parse_markdown_skill(path.read_text(encoding='utf-8'), path)
                    skill = SkillDefinition.from_payload(folder, payload, path, document)
                    if folder == agent and skill.name == name:
                        skill = replace(skill, document=values['document'].strip(), goal=values['goal'].strip(),
                                        version=values['version'].strip())
                    definitions[folder].append(skill)
            if dependencies != self._dependencies():
                raise SkillEditError(409, '线上技能正在变化，请重新测试')
            record = {'test_id': uuid4().hex, 'actor_id': actor['user_id'], 'agent': agent, 'name': name,
                      'fingerprint': fingerprint(values), 'dependencies': dependencies, 'instance': self.instance,
                      'created_epoch': time(), 'created_at': datetime.now(timezone.utc).isoformat(),
                      'status': 'awaiting_fault', 'mode': 'machine_flow', 'scope': '监控中心现有模拟机器全流程测试',
                      'machine': {**values['machine'], 'alarm_code': scenario['alarm_code'], 'name': machine['name']},
                      'device_ids': [d['device_id'] for d in devices], 'event_id': '', 'workorders': [],
                      'report_id': '', 'used_skills': [], 'result': None, 'progress': [
                          {'label': label, 'completed': False} for label in ('智能诊断', '维修方案', '工单派发', '维修确认', '整线复机', '汇总报告')],
                      'sample': {'expected': values['machine']['expected']}, 'message': '等待监控中心发现本次模拟故障'}
            self.registries[record['test_id']] = MachineDraftRegistry(self.manager.registry.root, definitions)
            self._write(record)
            (self.manager.backup_root / 'machine-test.json').write_text(json.dumps({'test_id': record['test_id']}), encoding='utf-8')
        try:
            response = factory.start_scenario(scenario['scenario_id'], machine['device_id'])
            if response.get('ok') is not True:
                raise ValueError('scenario not accepted')
        except Exception:
            self._save_changes(record['test_id'], status='failed', message='故障触发结果未确认，请检查机器状态；不会自动重发。')
            raise SkillEditError(503, '故障触发结果未确认，请检查监控中心后再操作') from None
        return self.get(record['test_id'], actor)

    def handle_event(self, event, producer):
        with self.manager._transaction():
            record = self._active()
            if not record or record['status'] not in ACTIVE or record['instance'] != self.instance:
                record = None
            elif record['event_id']:
                if record['event_id'] != event.get('event_id') or record['machine']['device_id'] != event.get('device_id'):
                    record = None
            else:
                try:
                    occurred = datetime.fromisoformat(str(event.get('timestamp') or event.get('first_seen')).replace('Z', '+00:00')).timestamp()
                except (ValueError, TypeError):
                    occurred = 0
                if (record['machine']['device_id'] != event.get('device_id')
                        or str(record['machine']['alarm_code']) != str(event.get('alarm_code'))
                        or occurred < record['created_epoch']):
                    record = None
                else:
                    record.update(event_id=event['event_id'], status='running', message='正在诊断并生成维修任务')
                    self._write(record)
        if not record:
            return producer()
        try:
            with skill_registry_scope(self.registries[record['test_id']]):
                output = producer()
            diagnosis = output.get('diagnosis') or {}
            orders = [output['workorder']] if (output.get('workorder') or {}).get('workorder_id') else []
            self._save_changes(record['test_id'], status='awaiting_repair' if orders else 'failed',
                result={k: diagnosis.get(k) for k in ('summary', 'diagnosis', 'recommendation')},
                workorders=[{k: order.get(k) for k in ('workorder_id', 'status', 'assignee')} for order in orders],
                progress=[{'label': '智能诊断', 'completed': bool(diagnosis)},
                          {'label': '维修方案', 'completed': bool(output.get('maintenance_plan'))},
                          {'label': '工单派发', 'completed': bool(orders)}],
                message='已生成测试工单，请维修人员填写处理说明并确认完成' if orders else '本次流程未生成工单，请核对诊断及维修方案；不能发布')
            return output
        except Exception:
            self._save_changes(record['test_id'], status='failed', message='故障流程未完成，请查看监控及工单；测试记录不能用于发布')
            raise

    def _record_for_order(self, order_id):
        with self.manager._transaction():
            record = self._active()
        if (record and record.get('instance') == self.instance and record['test_id'] in self.registries
                and order_id in [o['workorder_id'] for o in record['workorders']]):
            return record
        return None

    @contextmanager
    def order_scope(self, order_id, *, completing=False, actor_id=''):
        record = self._record_for_order(order_id)
        if not record:
            yield
            return
        factory, backend = self._clients()
        if completing:
            order = backend.call('get_workorder', {'workorder_id': order_id}).get('workorder') or {}
            if not actor_id or order.get('assignee') != actor_id:
                raise PermissionError('只能由本工单的维修人员确认完成')
            scenarios = [s for d in factory.devices() for s in factory.scenarios(d['device_id']).get('active_scenarios', [])]
            if any(s.get('scenario_id') != record['machine']['scenario_id'] or s.get('device_id') != record['machine']['device_id'] for s in scenarios):
                raise SkillEditError(409, '整线出现其它模拟故障，请先处理；本次测试不会清除其它场景')
            # 工厂当前只提供全局停止场景。确认场景全部属于本次试验后才能解除。
            if scenarios and factory.stop_scenarios().get('ok') is not True:
                raise SkillEditError(503, '本次模拟故障尚未解除，请检查监控中心')
        try:
            with skill_registry_scope(self.registries[record['test_id']]):
                yield
        finally:
            self._save_changes(record['test_id'])

    def get(self, test_id, actor):
        with self.manager._transaction():
            record = self._read(test_id, actor)
        if record.get('mode') != 'machine_flow':
            return super().get(test_id, actor)
        if record['status'] in ACTIVE and record['instance'] != self.instance:
            record = self._save_changes(test_id, status='failed', message='服务已重启，请完成原工单后重新测试；原测试不能用于发布')
        if record['status'] == 'awaiting_fault' and time() - record['created_epoch'] > 120:
            record = self._save_changes(test_id, status='failed', message='监控中心尚未收到本次故障，请检查监控服务；不会自动重新触发')
        if record['status'] in {'awaiting_repair', 'awaiting_report'}:
            try:
                factory, backend = self._clients()
                orders = [backend.call('get_workorder', {'workorder_id': o['workorder_id']}).get('workorder') or {} for o in record['workorders']]
                if any(not o.get('workorder_id') for o in orders):
                    return self._public(self._save_changes(test_id, status='failed', message='本次测试工单已删除，无法完成试验；请先处理当前机器状态'))
                finished = all(o.get('status') in {'completed', 'closed'} for o in orders)
                ids = [o.get('workorder_id') for o in orders]
                cycle = next((c for c in backend.status().get('completed_cycles', []) if set(ids).issubset(c.get('workorder_ids', []))), None) if finished else None
                reports = backend.call('list_reports', {'workorder_id': ids[0]}).get('items', []) if cycle else []
                report = next((r for r in reports if r.get('persisted') is True and r.get('cycle_id') == cycle.get('cycle_id')), None) if cycle else None
                devices = {d['device_id']: d for d in factory.devices()}
                running = bool(cycle) and all(devices.get(did, {}).get('status') == 'running' for did in record['device_ids'])
                used = [record['agent'], record['name']] in record.get('used_skills', [])
                progress = list(record['progress'][:3]) + [{'label': '维修确认', 'completed': finished},
                    {'label': '整线复机', 'completed': bool(running)}, {'label': '汇总报告', 'completed': bool(report)}]
                status = 'completed' if finished and running and report and used else 'awaiting_report' if cycle else 'awaiting_repair'
                message = '全流程已完成，请核对实际结果后发布' if status == 'completed' else '等待维修确认及整线复机' if not cycle else '机器已复机，等待汇总报告保存'
                if finished and running and report and not used:
                    status, message = 'failed', '机器流程已完成，但本次故障未调用所选技能，请选择能触发该技能的场景重新测试'
                record = self._save_changes(test_id, status=status, message=message, progress=progress,
                    workorders=[{k: o.get(k) for k in ('workorder_id', 'status', 'assignee')} for o in orders],
                    report_id=report.get('report_id', '') if report else '')
            except SkillEditError:
                raise
            except Exception:
                record['message'] = '业务状态暂不可读取，测试仍在等待；请稍后再查看'
        return self._public(record)

    def validate_publish(self, agent, name, values, actor):
        record = self._read(values.get('test_id', ''), actor) if values.get('test_id') else {}
        if self.require_machine_publish and record.get('mode') != 'machine_flow':
            raise SkillEditError(409, '请先完成模拟机器全流程测试，并人工核对结果后发布')
        if record.get('mode') == 'machine_flow':
            if (values.get('human_confirmed') is not True or record.get('status') != 'completed'
                    or record['agent'] != agent or record['name'] != name
                    or record['fingerprint'] != fingerprint(values) or time() - record['created_epoch'] > 86400
                    or self._dependencies() != record['dependencies']):
                raise SkillEditError(409, '全流程未完成、已过期或草稿及线上版本变化，请重新测试')
            return
        super().validate_publish(agent, name, values, actor)
