# Diagnosis Agent

Diagnosis Agent 只负责一次异常事件的诊断编排，不直接绑定具体大模型实现。

- `agent.py`: 对外入口，保留 `DiagnosisAgent.run()`，装配状态、Graph、工具和最终结果。
- `schemas.py`: 单次运行状态与最终诊断结果契约。
- `prompt.py`: 初始诊断提示词。
- `tool_policy.py`: Skill 选择、工具白名单、参数补齐和 Tool Guard。
- `evidence.py`: Tool Observation、Evidence 和报警定义命中判断。
- `validator.py`: 模型候选诊断结果校验。
- `parsing.py`: LLM 响应、JSON、时间、置信度和中文枚举清理。

LLM 客户端由共享 `app.llm` 层提供，或由调用方注入；Diagnosis Agent 不直接依赖 DeepSeek 等具体供应商。
