from copy import deepcopy
import re
import time

from shared import simulated_part_design_quality as sim


def key(actor, value):
    if not isinstance(actor, str) or not actor.strip() or len(actor) > 128: raise ValueError('用户身份无效')
    return sim.digest([actor, value])


class SimulatedQualityService:
    def __init__(self, repository):
        self.repository = repository

    def _read(self, actor, pointer):
        if not pointer: return None
        stored = self.repository.get_record('simulated_quality_batch', pointer['batch_id'])
        if not stored or stored.get('actor_id') != actor: raise ValueError('模拟批次不存在或身份不一致')
        try:
            basis = sim.verify_basis(stored['basis'])
            expected_seed = sim.digest([actor, stored['request_id'], basis['digest'], sim.GENERATOR])
            if stored['seed'] != expected_seed or stored['rule'] != sim.RULE or stored['generator'] != sim.GENERATOR:
                raise ValueError('模拟版本或种子不一致')
            if stored['samples'] != sim.generate_samples(basis, expected_seed, stored['created_at']):
                raise ValueError('模拟观测无法重现')
            summary = sim.summarize(basis, stored['samples'])
            if any(stored.get(k) != v for k, v in summary.items()): raise ValueError('模拟结论校验失败')
            if any(stored.get(k) != v for k, v in {'simulation': True, 'synthetic': True, 'source': sim.SOURCE}.items()):
                raise ValueError('模拟来源标记损坏')
            if stored.get('integrity') != sim.digest({k: v for k, v in stored.items() if k != 'integrity'}): raise ValueError('批次数据损坏')
            return deepcopy(stored)
        except (ValueError, KeyError, TypeError):
            return {'batch_id': pointer['batch_id'], 'design_run_id': stored.get('design_run_id'),
                    'request_id': stored.get('request_id'), 'status': 'review', 'simulation': True, 'synthetic': True,
                    'rates': {'qualified': None, 'defect': None, 'coverage': None}, 'counts': {}, 'issues': [],
                    'message': '已保存模拟记录校验失败，请复核；不返回可信比例'}

    def request(self, actor, request_id):
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', request_id): raise ValueError('请求编号无效')
        return self._read(actor, self.repository.get_record('simulated_quality_request', key(actor, request_id)))

    def basis(self, actor, run_id):
        saved = self.repository.get_record('simulated_quality_basis', key(actor, run_id))
        if not saved: return None
        if saved.get('actor_id') != actor: raise ValueError('用户身份不一致')
        return sim.verify_basis(saved['basis'])

    def design(self, actor, run_id):
        saved = self.repository.get_record('simulated_quality_basis', key(actor, run_id))
        return {'basis': self.basis(actor, run_id), 'latest': self._read(actor, saved) if saved else None}

    def designs(self, actor):
        records = [r for r in self.repository.list_records('simulated_quality_basis') if r.get('actor_id') == actor]
        result = []
        for saved in records[-20:]:
            basis = sim.verify_basis(saved['basis'])
            result.append({'run_id': basis['run_id'], 'part_name': basis['part_name'], 'part_number': basis['part_number']})
        return result

    def detect(self, actor, request_id, run, snapshot):
        sim.require_enabled()
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', request_id): raise ValueError('请求编号无效')
        run_id = run.get('run_id')
        request_key, basis_key = key(actor, request_id), key(actor, run_id)
        with self.repository.simulated_quality_transaction(request_key, basis_key):
            existing = self.repository.get_record('simulated_quality_request', request_key)
            if existing:
                if existing['design_run_id'] != run_id: raise ValueError('同一请求不能更换设计版本')
                return self._read(actor, existing)
            basis = sim.build_basis(run)
            station = sim.validate_station(snapshot)
            saved = self.repository.get_record('simulated_quality_basis', basis_key)
            if saved and (saved.get('actor_id') != actor or sim.verify_basis(saved['basis'])['digest'] != basis['digest']):
                raise ValueError('已保存设计版本基准发生变化，不能覆盖')
            created_at = time.time()
            seed = sim.digest([actor, request_id, basis['digest'], sim.GENERATOR])
            samples = sim.generate_samples(basis, seed, created_at)
            summary = sim.summarize(basis, samples)
            result = {'batch_id': 'SIM-BATCH-' + request_key, 'actor_id': actor, 'request_id': request_id,
                      'design_run_id': run_id, 'basis': basis, 'seed': seed, 'created_at': created_at,
                      'rule': sim.RULE, 'generator': sim.GENERATOR, 'simulation': True, 'synthetic': True, 'source': sim.SOURCE,
                      'station': station, 'traceability': station['traceability'], 'samples': samples,
                      **summary, 'recommendations': sim.recommendations(summary['issues'])}
            result['integrity'] = sim.digest(result)
            self.repository.save_record('simulated_quality_basis', basis_key, {'actor_id': actor, 'basis': basis, 'batch_id': result['batch_id']})
            self.repository.save_record('simulated_quality_batch', result['batch_id'], result)
            self.repository.save_record('simulated_quality_request', request_key,
                                        {'actor_id': actor, 'design_run_id': run_id, 'request_id': request_id, 'batch_id': result['batch_id']})
            return result
