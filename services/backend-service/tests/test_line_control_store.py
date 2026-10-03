import pytest
from app.team.repository import TeamRepository
from app.line_control.repository import LineControlRepository


def test_fault_claim_survives_restart_and_parameter_change_rejected(tmp_path):
    store = TeamRepository(sqlite_path=str(tmp_path / 'line.db'))
    ledger = LineControlRepository(store)
    assert ledger.claim_fault_event('E1', 'M1', ['M1', 'M2'])['generation'] == 1
    ledger.claim_fault_event('E1', 'M1', ['M1', 'M2'])
    reopened = LineControlRepository(TeamRepository(sqlite_path=str(tmp_path / 'line.db')))
    assert reopened.status()['generation'] == 1
    with pytest.raises(ValueError):
        reopened.claim_fault_event('E1', 'M2', ['M1', 'M2'])
    assert reopened.claim_control('E1', 'M1', 'emergency_stop')['claimed'] is True
    assert reopened.claim_control('E1', 'M1', 'emergency_stop')['claimed'] is False


def test_restart_claim_exclusive_and_new_fault_invalidates_generation(tmp_path):
    ledger = LineControlRepository(TeamRepository(sqlite_path=str(tmp_path / 'line.db')))
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    ledger.set_stop_result(1, {'state': 'stopped'})
    assert ledger.begin_restart(1)['claimed']
    assert not ledger.begin_restart(1)['claimed']
    ledger.claim_fault_event('E2', 'M1', ['M1'])
    assert ledger.status()['generation'] == 2
    assert ledger.finish_restart(1, {'state': 'running'})['state'] != 'running'


def test_retry_requires_confirmed_rollback_and_gets_new_attempt(tmp_path):
    ledger = LineControlRepository(TeamRepository(sqlite_path=str(tmp_path / 'line.db')))
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    ledger.set_stop_result(1, {'state': 'stopped'})
    first = ledger.begin_restart(1)
    ledger.finish_restart(1, {'state': 'failed', 'reason': 'start failed', 'rollback': {'M1': {'state': 'verified'}}})
    second = ledger.begin_restart(1)
    assert second['claimed']
    assert second['restart_attempt'] > first['restart_attempt']
    ledger.finish_restart(1, {'state': 'rollback_failed', 'rollback': {'M1': {'state': 'uncertain'}}})
    assert not ledger.begin_restart(1)['claimed']


def test_old_generation_failed_rollback_invalidates_new_stopped_claim(tmp_path):
    ledger = LineControlRepository(TeamRepository(sqlite_path=str(tmp_path / 'line.db')))
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    ledger.set_stop_result(1, {'state': 'stopped'})
    ledger.begin_restart(1)
    ledger.claim_fault_event('E2', 'M1', ['M1'])
    ledger.set_stop_result(2, {'state': 'stopped'})
    result = ledger.finish_restart(1, {'state': 'rollback_failed', 'reason': 'late old start', 'rollback': {'M1': {'state': 'uncertain'}}})
    assert result['generation'] == 2
    assert result['state'] == 'rollback_failed'
    assert result['rollback']['M1']['state'] == 'uncertain'
    assert result['stale_results'][0]['generation'] == 1
