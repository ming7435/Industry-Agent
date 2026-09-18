"""多 Skill 管理能力。

Skill 是 Agent 的可组合能力单元。一个 Agent 可以同时激活多个 Skill，
图编排只消费激活后的工具白名单和步骤元数据，不把 Skill 逻辑硬编码到单一 YAML。
"""

from .registry import SkillDefinition, SkillRegistry, get_skill_registry

__all__ = ["SkillDefinition", "SkillRegistry", "get_skill_registry"]
