"""工单工具和业务服务。"""

from .assign_workorder import assign_workorder
from .close_workorder import close_workorder
from .create_workorder import create_workorder
from .get_workorder import get_workorder
from .get_workorder_template import get_workorder_template
from .list_workorders import list_workorders
from .mark_repair_completed import mark_repair_completed
from .query_workorder import query_workorder
from .reopen_workorder import reopen_workorder
from .submit_repair_feedback import submit_repair_feedback
from .submit_workorder_draft import submit_workorder_draft
from .update_workorder import update_workorder
from .validator import WorkOrderValidator
from .verify_repair import verify_repair


def __getattr__(name: str):
    if name == "WorkOrderService":
        from .service import WorkOrderService

        return WorkOrderService
    raise AttributeError(name)

__all__ = [
    "WorkOrderService",
    "WorkOrderValidator",
    "assign_workorder",
    "close_workorder",
    "create_workorder",
    "get_workorder",
    "get_workorder_template",
    "list_workorders",
    "mark_repair_completed",
    "query_workorder",
    "reopen_workorder",
    "submit_repair_feedback",
    "submit_workorder_draft",
    "update_workorder",
    "verify_repair",
]
