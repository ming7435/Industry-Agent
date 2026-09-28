"""工单系统业务服务，不作为核心 Agent。

导出项采用延迟加载，供底层仓储和 MCP 模块在工具注册表尚未组装完成时导入，
避免产生循环导入。
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
