# 技能包目录布局

技能从「一个扁平 Markdown 文档」改为「目录包」，与 Claude/OpenCode 的 Agent Skill 包同构，
但保留本项目自己的运行元数据、契约校验和专家中心编辑流程。

## 目录结构

```
services/agent-service/app/skills/
└── {agent}/
    └── {skill_name}/
        ├── SKILL.md              # 唯一运行元数据 + 模型每次都需要的正文
        ├── references/           # 按需参考文档，不进入默认 prompt
        │   ├── reasoning.md      # 业务判断规则 + 工具使用规范
        │   ├── evidence.md       # 证据规则 + 异常处理 + 安全边界
        │   ├── contract.md       # 输入前置条件 + 真实输入输出示例
        │   ├── source.md         # 参考实现源码索引
        │   └── domain.md         # 领域专用协议（仅部分技能有）
        └── scripts/
            └── run.py            # 独立 CLI：自检 / 列参考 / 查看正文
```

旧的扁平 `app/skills/{agent}/*.md` 仍然兼容，两种布局可并存，便于逐个迁移。

## 加载与提示词策略

| 内容 | 是否进入 system prompt | 读取方式 |
| --- | --- | --- |
| `SKILL.md` 正文 | 是 | 注册表加载为 `SkillDefinition.document` |
| `references/*.md` | 否 | 模型调用 `read_skill_reference(skill, reference)` 按需读取 |

`SKILL.md` 只保留五类章节：

- 技能概述（Overview）
- 触发场景（When to Use）
- 执行流程（Workflow）
- 输出规范（Output Format）
- 停止条件（Stop Conditions）

以及一张「参考文档（按需读取）」索引表。业务判断规则、证据与安全边界、输入输出契约、
示例和源码索引全部拆到 `references/`。

`read_skill_reference` 的权限边界：

- `skill` 必须在当前执行上下文的 `skills` 或 `skill` 中，否则 `reference_outside_active_skill`。
- `reference` 必须存在于该技能的 `references/`，否则 `unknown_skill_reference`。
- 工具只读 Markdown，不接受路径参数，不能读写业务数据。
- 返回正文上限 12000 字符，超出时按行截断并标记 `truncated`。

## Front Matter 契约

`SKILL.md` 的 Front Matter 沿用原有字段，只新增 `read_skill_reference` 到 `tools`：

```yaml
name: alarm_diagnosis_skill
description: 当设备事件包含报警码，需要结合当前运行事实解释报警时使用。
version: '1.1'
goal: 结合报警定义与运行证据诊断带报警码的设备事件。
trigger: exists(alarm_code)
steps: [...]
tools:
  - get_alarm_definition
  - read_skill_reference
```

`references/*.md` 的 Front Matter 只描述自己：

```yaml
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
```

`name` 必须与文件名一致；`order` 决定索引表和读取顺序。

## 版本与依赖

- 技能 `revision` = `sha256(SKILL.md + 按文件名排序的 references/*.md)`。
- 参考文档变化会让版本号变化，专家中心会要求刷新后再发布或重测。
- 试运行和整线测试的依赖哈希覆盖 `SKILL.md`、`references/`，任一文件改动都会使旧回执失效。

## 命令行

```bash
# 包自检：章节、参考文档、JSON 示例、源码链接、scripts/run.py
python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --check

# 列出参考文档
python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --list

# 查看参考正文
python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --reference reasoning

# 每个技能包内也有同一入口
python services/agent-service/app/skills/diagnosis/alarm_diagnosis_skill/scripts/run.py --check
```

## 迁移与审计

```bash
# 一次性迁移（幂等，已存在 SKILL.md 的技能会跳过）
python scripts/migrate_skill_layout.py --dry-run
python scripts/migrate_skill_layout.py

# 只读审计：30 个技能、目录布局、工具权限、真实 Graph 和契约示例
python scripts/audit_skills.py
```

## 新增一个技能

1. 建目录 `app/skills/{agent}/{skill_name}/`。
2. 写 `SKILL.md`：Front Matter + 五类章节 + 参考文档索引，`tools` 里加 `read_skill_reference`。
3. 写 `references/reasoning.md`、`evidence.md`、`contract.md`、`source.md`，每份都带 Front Matter。
4. 复制任意技能的 `scripts/run.py`，把内嵌的 `agent/skill_name` 改成本技能。
5. 运行 `python scripts/skill_runner.py --skill {agent}/{skill_name} --check`，再跑
   `pytest -c pytest-agent.ini services/agent-service/tests/test_skill_standardization.py`。
