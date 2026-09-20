"""A2A 核心 Agent 注册表和合法协作矩阵。"""

CORE_A2A_AGENT_TARGETS = frozenset({"router", "diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory"})

# 与设计文档第 18.3 节保持一致。Report 只作为被调用目标，不主动发起调用。
ALLOWED_A2A_ROUTES = {
    "router": frozenset({"diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory"}),
    "diagnosis": frozenset({"knowledge", "cad", "memory", "maintenance"}),
    "maintenance": frozenset({"knowledge", "cad", "memory", "workorder"}),
    "workorder": frozenset({"quality", "maintenance"}),
    "quality": frozenset({"knowledge", "maintenance", "workorder", "memory"}),
    "report": frozenset({"memory"}),
    "memory": frozenset(),
}


def is_allowed_a2a_route(source_agent: str, target_agent: str) -> bool:
    return target_agent in ALLOWED_A2A_ROUTES.get(source_agent, frozenset())
