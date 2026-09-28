"""规范 Runtime 能力注册表的兼容导出入口。"""

from __future__ import annotations

from .capability import (
    CAPABILITY_DEFINITIONS,
    DEFAULT_PLAN_CAPABILITIES,
    Capability,
    CapabilityDefinition,
    CapabilityRegistry,
    build_capability_registry,
)

__all__ = [
    "CAPABILITY_DEFINITIONS",
    "DEFAULT_PLAN_CAPABILITIES",
    "Capability",
    "CapabilityDefinition",
    "CapabilityRegistry",
    "build_capability_registry",
]
