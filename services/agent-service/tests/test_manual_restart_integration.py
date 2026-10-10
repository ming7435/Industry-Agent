"""Public action and durable Backend ledger, isolated from the running factory."""
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api import team_auth
from app.api.server import create_app
from app.monitor.line_control import LineController
from app.runtime.operations import RuntimeOperations
from shared.technician_confirmation import trusted_technician_confirmation
from test_simple_manual_repair import IsolatedBackend, FixtureFactory, create_wrong_order, order


class DirectFactory(FixtureFactory):
    def control_device(self, device_id, action, reason='', *, manual_confirmed=False):
        if action == 'start':
            assert manual_confirmed is True
        response = super().control_device(device_id, action, reason)
        return {**response, 'action': action, 'device': {'device_id': device_id, 'status': self.states[device_id]}}


def test_public_confirmation_starts_four_devices_and_survives_page_reload_without_metric_checks(tmp_path, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    backend = IsolatedBackend(tmp_path)
    try:
        factory = DirectFactory(backend)
        factory.states.update(M3='running', M4='running')
        controller = LineController(factory, backend)
        monkeypatch.setattr(team_auth, 'BackendServiceClient', lambda: backend)
        monkeypatch.setattr('app.api.server.BackendServiceClient', lambda: backend)
        order_id = create_wrong_order(backend)
        other_id = create_wrong_order(backend, 'M2', 'OLD-OTHER', 'other')
        controller.handle_fault('OLD-ORPHAN', 'M1', 'old unlinked alarm')
        controller.handle_fault('E1', 'M1', 'current fault')
        factory.samples.clear()
        snapshot = factory.snapshot
        factory.snapshot = lambda _: (_ for _ in ()).throw(AssertionError('No recovery metric checks allowed'))
        operations = RuntimeOperations(None, None, factory_client=factory, repair_controller=controller)
        runtime = SimpleNamespace(container=SimpleNamespace(operations=operations))
        with TestClient(create_app(runtime)) as client:
            client.cookies.set('maintenance_session', 'owner')
            url = '/api/workorders/' + order_id + '/action'
            payload = {'action': 'mark_repair_completed', 'repair_feedback': {'feedback': '完成'}}
            result = client.post(url, json=payload)
            assert result.status_code == 200, result.text
            saved = result.json()['workorder']
            assert saved['status'] == 'completed' and trusted_technician_confirmation(saved)
            assert saved['repair_verification']['phase'] == 'manual_confirmation'
            assert 'passed' not in saved['repair_verification']
            assert result.json()['machine_control']['state'] == 'running'
            assert factory.samples == []
            assert all(state == 'running' for state in factory.states.values())
            assert order(backend, other_id)['status'] == 'in_progress'
            assert all(f['resolved'] for f in backend.status()['faults'])

            # Refreshing or resubmitting does not re-send starts or lose success.
            starts = [item for item in factory.controls if item[1] == 'start']
            assert len(starts) == 4
            items = client.get('/api/workorders').json()['items']
            visible = next(item for item in items if item['workorder_id'] == order_id)
            assert visible['machine_control']['restart_method'] == 'manual_confirmation'
            assert visible['machine_control']['state'] == 'running'
            assert client.post(url, json=payload).json()['machine_control']['already_running']
            assert [item for item in factory.controls if item[1] == 'start'] == starts
            report = backend.call('list_reports')['items'][0]
            assert order_id in report['workorder_ids']
            assert report['stop_reason'] == 'restart_confirmed'
            assert '人工确认' in report['summary'] and '核验通过' not in report['summary']
            assert 'quality' not in report['sections']
            assert not any('质检' in finding for finding in report['validation_findings'])

            factory.snapshot = snapshot
            controller.handle_fault('NEW-FAULT', 'M1', 'fault after manual restart')
            assert all(state == 'stopped' for state in factory.states.values())
            assert backend.status()['state'] == 'stopped'
            visible = next(item for item in client.get('/api/workorders').json()['items'] if item['workorder_id'] == order_id)
            assert (visible.get('machine_control') or {}).get('state') != 'running'
            assert len(backend.call('list_reports')['items']) == 1
    finally:
        backend.shutdown()
