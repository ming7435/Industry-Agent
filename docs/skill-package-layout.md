# 技能包目录布局

技能从「一个扁平 Markdown 文档」改为可复制的目录包。项目内继续保留运行元数据、
契约校验和专家中心编辑流程；复制单个目录后也能执行该技能的模型与工具调用流程。

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
        │   ├── domain.md         # 领域专用协议（仅部分技能有）
        │   └── standalone.md     # 独立执行和外部工具接入说明
        └── scripts/
            ├── run.py            # 可独立执行的模型与工具循环
            └── mcp_adapter.py    # 本技能已授权的远程 MCP 工具路由
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

- 技能 `revision` 覆盖 `SKILL.md`、`references/*.md`、`scripts/*.py`。
- 参考文档或业务脚本变化会让版本号变化，专家中心会要求刷新后再发布或重测。
- 试运行和整线测试的依赖哈希也覆盖这些文件，旧回执不能复用。

## 命令行

```bash
# 包自检：章节、参考文档、JSON 示例、源码链接、scripts/run.py
python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --check

# 列出参考文档
python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --list

# 查看参考正文
python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --reference reasoning

# 每个技能包内的入口还可执行业务流程。复制目录后在包根目录运行：
python scripts/run.py --check
python scripts/run.py --input task.json --output result.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py
```

`scripts/run.py` 只使用 Python 标准库，不导入项目 `app`。它读取本包技能说明，调用
OpenAI 兼容模型接口，并只允许技能声明的工具。`scripts/mcp_adapter.py` 为所有已授权外部
工具生成对应的 `/tools/call` 路由；MES、库存、QMS、CAD、PLC、知识和项目本地工具分别需要
兼容服务地址。当前没有兼容端点的工具可换用自己的 `--tool-script`。没有工具适配器时，
脚本会拒绝外部工具调用，不会伪造业务观察。适配器
从标准输入接收 `{"tool":"名称","arguments":{},"task":{}}`，从标准输出返回 JSON 对象。
写入类工具还需显式添加 `--allow-writes`。复制单个包不需要复制整个仓库，但执行真实业务
仍需模型服务和相应的工具服务或适配器。

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
4. 运行 `python scripts/build_portable_skills.py` 生成可复制的 `scripts/run.py` 与当前工具白名单的 `mcp_adapter.py`；补充未接入 MCP 工具的适配器。
5. 运行 `python scripts/skill_runner.py --skill {agent}/{skill_name} --check`，再跑
   `pytest -c pytest-agent.ini services/agent-service/tests/test_skill_standardization.py`。
