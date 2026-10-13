"""List metadata is separate from the authoritative resumable checkpoint."""
SUMMARY_NAMESPACE = 'runtime_recovery_summary'


def recovery_projection(record):
    state = record.get('state') or {}
    result = {key: record.get(key) for key in (
        'recovery_id', 'kind', 'task_id', 'trace_id', 'status', 'created_at',
        'updated_at', 'instance_id', 'epoch', 'attempts', 'error')}
    result['_recovery_projection_version'] = 1
    result['has_checkpoint'] = record.get('kind') == 'production' or bool((state.get('runtime_plan') or {}).get('actions'))
    result['state'] = {key: state.get(key) for key in ('recovery_actor_id', 'actor_id', 'device_id', 'current_step', 'active_agent', 'stop_reason')}
    result['state']['event'] = {'device_id': (state.get('event') or {}).get('device_id')}
    action = state.get('next_action') or {}
    result['state']['next_action'] = {key: action.get(key) for key in ('target', 'required_capability', 'step', 'side_effect')}
    execution = state.get('runtime_execution') or {}
    result['state']['runtime_execution'] = {key: execution.get(key) for key in ('side_effect_status', 'execution_status')}
    result['state']['runtime_result'] = {'stop_reason': (state.get('runtime_result') or {}).get('stop_reason')}
    result['state']['completed_steps'] = [
        {key: item.get(key) for key in ('agent', 'step', 'action_id') if item.get(key)}
        for item in state.get('completed_steps') or [] if isinstance(item, dict)]
    return result
