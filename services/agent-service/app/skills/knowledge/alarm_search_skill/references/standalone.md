---
name: standalone
title: 独立业务执行与工具适配
when: 需要复制技能包、运行脚本或连接真实业务工具时读取。
order: 5
---

# 独立业务执行

本目录可单独复制；`scripts/run.py` 仅依赖 Python 标准库，读取本包的 `SKILL.md` 和 `references/`，通过 OpenAI 兼容模型服务做业务判断。它不会借用仓库内的 `app` 模块。`references/source.md` 的源码链接只用于在原项目中定位实现；单独复制时不影响执行。

## 执行

在复制后的技能包根目录准备符合 `references/contract.md` 的任务 JSON：

```bash
python scripts/run.py --check
python scripts/run.py --input task.json --output result.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py
```

模型服务须提供 `POST /v1/chat/completions`。执行器最多进行 6 轮判断，对每次工具调用校验本技能的 `tools` 白名单，并在输出中记录工具参数与观察。若业务证据不足，结果应明确 `status=insufficient_data`；没有外部工具观察的成功回答会标为 `unverified`。

## 真实工具

本包内置的 `scripts/mcp_adapter.py` 对本技能所有外部工具都有路由映射：fetch_chunk、fetch_document、search_alarm_knowledge、search_knowledge。MES、库存、QMS、CAD 可使用同名 `SKILL_MCP_*_URL`；PLC、知识和项目本地工具分别使用 `SKILL_MCP_PLC_URL`、`SKILL_MCP_KNOWLEDGE_URL`、`SKILL_MCP_LOCAL_URL`。目标服务须实现 `/tools/call` 的 JSON 协议；需要时从环境读取 `BACKEND_INTERNAL_TOKEN` 或 `SKILL_MCP_TOKEN`。

若对应服务没有兼容接口，需要将 `--tool-script` 指向自定义 Python 适配器。适配器从标准输入读取 `{"tool":"名称","arguments":{},"task":{}}`，向标准输出写一个 JSON 对象；退出码非 0 表示失败。没有适配器时，执行器会拒绝外部工具调用，不会伪造现场数据或业务回执。写入类工具还需显式添加 `--allow-writes`，并使用有相应权限的服务配置；执行后会对真实业务服务产生副作用。
