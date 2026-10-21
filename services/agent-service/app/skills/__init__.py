"""技能包：Agent 的可复用能力单元。

Skill 是 Agent 的可复用能力；一个 Agent 可以同时启用多个 Skill。技能文档采用目录包布局：

    app/skills/{agent}/{skill}/SKILL.md
    app/skills/{agent}/{skill}/references/*.md
    app/skills/{agent}/{skill}/scripts/run.py

``SKILL.md`` 只保留模型每次都需要的触发、流程、输出和停止条件；更细的业务规则、
证据边界、输入输出契约放在 ``references/``，由 ``read_skill_reference`` 按需读取。
旧的扁平 ``app/skills/{agent}/*.md`` 仍然兼容。
"""

from .registry import SkillDefinition, SkillReference, SkillRegistry, get_skill_registry

__all__ = ["SkillDefinition", "SkillReference", "SkillRegistry", "get_skill_registry"]
