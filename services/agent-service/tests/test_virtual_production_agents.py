"""Trusted A2A/Graph/Skill paths, private authority, and formal inspection isolation."""
from copy import deepcopy
import json
import pytest

from virtual_production_test_support import production_backend, OWNER
from test_virtual_factory_client import isolated_factory, run, setup


def runtime():
    from app.runtime.container import AgentContainer
    from app.tools.registry import ToolRegistry
    return AgentContainer(tools=ToolRegistry())


def test_trusted_a2a_routes_to_existing_agents(production_backend, isolated_factory):
    from app.production_simulation.context import create_virtual_context
    from app.production_simulation.backend import VirtualProductionBackend
    from app.production_simulation.factory import VirtualFactoryClient
    system = runtime()
    backend = VirtualProductionBackend(production_backend.client)
    factory = VirtualFactoryClient(isolated_factory[0])
    arguments = {'command_id': 'agent-prepare', 'run': run(), 'setup': setup(), 'material': '钢', 'batch_id': 'A'}
    ctx = create_virtual_context(OWNER, 'prepare', arguments, backend, factory, 'SIM-TRACE-test')
    prepared = system.requests.execute_virtual_production('prepare', arguments, ctx)
    assert prepared['status'] == 'prepared'
    arguments = {'job_id': prepared['job_id'], 'digest': prepared['program_digest']}
    received = system.requests.execute_virtual_production('submit', arguments,
        create_virtual_context(OWNER, 'submit', arguments, backend, factory, 'SIM-TRACE-test'))
    assert received['status'] == 'received'
    system.requests.execute_virtual_production('start', arguments,
        create_virtual_context(OWNER, 'start', arguments, backend, factory, 'SIM-TRACE-test'))
    isolated_factory[1].tick(20)
    sync_args = {'job_id': prepared['job_id']}
    complete = system.requests.execute_virtual_production('sync', sync_args,
        create_virtual_context(OWNER, 'sync', sync_args, backend, factory, 'SIM-TRACE-test'))
    inspect_args = {'part_id': complete['part_id'], 'output_digest': complete['output']['output_digest']}
    result = system.requests.inspect_virtual_output(complete['part_id'], complete['output']['output_digest'],
        create_virtual_context(OWNER, 'inspect', inspect_args, backend, factory, 'SIM-TRACE-test'))
    assert result['rule'] == 'virtual_profile_dimensions_v1'
    assert result['status'] == 'pass'
    assert len(system.agents) == 9
    records = system.trace.list()
    assert {'cad', 'quality'} <= {r.get('agent') for r in records}
    assert {'prepare_virtual_production', 'inspect_virtual_output'} <= {r.get('tool_name') for r in records}
    serialized = json.dumps(records, ensure_ascii=False)
    for private in ['_virtual_context', 'VirtualExecutionContext', 'isolated-internal', 'RouteBackendClient', '_authority']:
        assert private not in serialized
    assert any(r.get('skill') == 'virtual_production_skill' for r in records)


def test_json_cannot_authorize_production_tool(production_backend, isolated_factory):
    from app.a2a.models import CADRequest
    system = runtime()
    payload = {'operation': 'virtual_production', 'production_action': 'start',
               'production_arguments': {'job_id': 'SIM-JOB-' + 'a' * 64, 'digest': 'b' * 64},
               '_virtual_context': {'actor': OWNER, 'action': 'start', '_authority': True}}
    with pytest.raises(Exception): system.agents['cad'].run(payload)
    with pytest.raises(Exception):
        system.agents['cad'].graph.invoke({'agent': system.agents['cad'], 'request': payload})
    with pytest.raises(Exception):
        CADRequest(request_id='R1', from_agent='router', to_agent='cad', operation='virtual_production',
                   virtual_context={'actor': OWNER, 'action': 'start'})
    with pytest.raises(Exception): system.registry.execute('start_virtual_production', payload['production_arguments'])
    assert not any(c['method'] == 'POST' for c in isolated_factory[2])
    assert production_backend.repository.list_records('sim_production_job') == []


def test_scope_rejects_changed_target_or_cross_action(production_backend, isolated_factory):
    from app.production_simulation.context import create_virtual_context, virtual_tool_scope
    from app.production_simulation.backend import VirtualProductionBackend
    from app.production_simulation.factory import VirtualFactoryClient
    system = runtime()
    arguments = {'job_id': 'SIM-JOB-' + 'a' * 64, 'digest': 'b' * 64}
    context = create_virtual_context(OWNER, 'submit', arguments, VirtualProductionBackend(production_backend.client),
                                     VirtualFactoryClient(isolated_factory[0]), 'SIM-TRACE-cross-action')
    with virtual_tool_scope(context):
        with pytest.raises(Exception): system.registry.execute('start_virtual_production', arguments)
        with pytest.raises(Exception): system.registry.execute('submit_virtual_production', {**arguments, 'job_id': 'SIM-JOB-' + 'c' * 64})
    assert not any(c['method'] == 'POST' for c in isolated_factory[2])


def test_default_fault_plan_and_model_tools_do_not_gain_production_authority():
    from app.runtime.capability import DEFAULT_PLAN_CAPABILITIES
    system = runtime()
    assert 'virtual_production' not in DEFAULT_PLAN_CAPABILITIES
    assert 'virtual_size_inspection' not in DEFAULT_PLAN_CAPABILITIES
    for name in ['prepare_virtual_production', 'submit_virtual_production', 'start_virtual_production', 'sync_virtual_production', 'inspect_virtual_output']:
        assert system.registry.definitions[name].exposed_to_model is False
        assert system.registry.definitions[name].local_only is True


def test_private_context_is_excluded_from_a2a_serialization(production_backend, isolated_factory):
    from app.a2a.models import CADRequest
    from app.production_simulation.context import create_virtual_context
    context = create_virtual_context(OWNER, 'sync', {'job_id': 'SIM-JOB-' + 'a' * 64}, production_backend, None, 'TRACE')
    request = CADRequest(request_id='R', from_agent='router', to_agent='cad', operation='virtual_production',
                         production_action='sync', production_arguments=context.arguments, virtual_context=context)
    assert 'virtual_context' not in request.model_dump(mode='json')
    assert 'virtual_context' not in request.to_protocol_dict()['payload']


def test_virtual_cad_failure_is_not_retried():
    from app.harness.runtime import AgentHarness, AgentExecutionError
    calls = []
    class Failure:
        name = 'cad'
        def run(self, task):
            calls.append(task)
            raise OSError('write result unknown')
    with pytest.raises(AgentExecutionError):
        AgentHarness(Failure(), max_retries=3).execute_agent({'operation': 'virtual_production'})
    assert len(calls) == 1


def test_formal_quality_still_rejects_simulated_part():
    system = runtime()
    result = system.agents['quality'].run({'part_id': 'SIM-PART-' + 'a' * 64,
        'part': {'part_id': 'SIM-PART-' + 'a' * 64, 'synthetic': True, 'simulation_only': True,
                 'source': 'factory-simulation'}})
    assert result.qualified is False
    assert result.status == 'review'
