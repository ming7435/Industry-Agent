"""Private in-process authority, bound inside each Graph execution thread."""
from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy
from dataclasses import dataclass, field

from shared.virtual_turning import digest, require

_AUTHORITY = object()
_CONTEXT = ContextVar('virtual_production_authority', default=None)


@dataclass(frozen=True, repr=False)
class VirtualExecutionContext:
    actor: dict
    action: str
    arguments: dict
    backend: object
    factory: object
    trace_id: str
    _authority: object = field(repr=False)
    _seal: str = field(repr=False)

    def __repr__(self): return '<private execution context>'


def create_virtual_context(actor, action, arguments, backend, factory, trace_id):
    require(isinstance(actor, dict) and actor.get('user_id') and actor.get('role') in {'technician', 'supervisor'},
            'invalid_actor', status=401)
    require(action in {'prepare', 'submit', 'start', 'sync', 'inspect'}, 'invalid_production_action', status=422)
    actor, arguments = deepcopy(actor), deepcopy(arguments)
    return VirtualExecutionContext(actor, action, arguments, backend, factory, trace_id, _AUTHORITY, digest([actor, action, arguments]))


def validate_virtual_context(context, action=None, arguments=None):
    require(type(context) is VirtualExecutionContext and context._authority is _AUTHORITY,
            'production_authority_required', '生产动作需要服务端授权', 403)
    require(context._seal == digest([context.actor, context.action, context.arguments]), 'production_context_changed', status=403)
    require(action is None or action == context.action, 'production_action_conflict', status=403)
    require(arguments is None or arguments == context.arguments, 'production_target_conflict', status=403)
    return context


@contextmanager
def virtual_tool_scope(context):
    validate_virtual_context(context)
    token = _CONTEXT.set(context)
    try: yield
    finally: _CONTEXT.reset(token)


def current_virtual_context(action, arguments):
    return validate_virtual_context(_CONTEXT.get(), action, arguments)
