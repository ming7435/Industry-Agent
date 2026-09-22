"""WorkOrder System 业务服务，不作为核心 Agent。

The exports are lazy so low-level repository/MCP modules can be imported while
the Tool Registry is still being assembled without creating a circular import.
"""

__all__ = ["WorkOrderService", "WorkOrderValidator"]


def __getattr__(name: str):
    if name == "WorkOrderService":
        from .service import WorkOrderService

        return WorkOrderService
    if name == "WorkOrderValidator":
        from .validator import WorkOrderValidator

        return WorkOrderValidator
    raise AttributeError(name)
