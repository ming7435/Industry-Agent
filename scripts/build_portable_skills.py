#!/usr/bin/env python3
"""Regenerate self-contained Skill execution and MCP adapter entry points."""

from pathlib import Path
import json
import sys

import yaml


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/portable_skill_template.py"
ADAPTER = ROOT / "scripts/portable_tool_adapter_template.py"
SKILLS = ROOT / "services/agent-service/app/skills"


def main() -> int:
    source = SOURCE.read_bytes()
    adapter = ADAPTER.read_text(encoding="utf-8")
    sys.path.insert(0, str(ROOT / "services/agent-service"))
    sys.path.insert(0, str(ROOT))
    from app.tools.registry import ToolRegistry

    definitions = ToolRegistry().definitions
    targets = sorted(SKILLS.glob("*/*/SKILL.md"))
    for document in targets:
        text = document.read_text(encoding="utf-8")
        front = text.split("---", 2)[1]
        metadata = yaml.safe_load(front) or {}
        runner = document.parent / "scripts/run.py"
        runner.parent.mkdir(exist_ok=True)
        runner.write_bytes(source)
        routes = {}
        for name in metadata.get("tools") or []:
            definition = definitions.get(name)
            if definition is not None and name != "read_skill_reference":
                routes[name] = (definition.server, definition.operation)
        (runner.parent / "mcp_adapter.py").write_text(
            adapter.replace("__ROUTES__", json.dumps(routes, ensure_ascii=False, sort_keys=True)),
            encoding="utf-8",
        )
        standalone = document.parent / "references/standalone.md"
        remote = "、".join(sorted(routes)) or "无；需要自定义适配器"
        standalone.write_text(
            "---\nname: standalone\ntitle: 独立业务执行与工具适配\n"
            "when: 需要复制技能包、运行脚本或连接真实业务工具时读取。\norder: 5\n---\n\n"
            "# 独立业务执行\n\n"
            "本目录可单独复制；`scripts/run.py` 仅依赖 Python 标准库，读取本包的 "
            "`SKILL.md` 和 `references/`，通过 OpenAI 兼容模型服务做业务判断。"
            "它不会借用仓库内的 `app` 模块。`references/source.md` 的源码链接只用于"
            "在原项目中定位实现；单独复制时不影响执行。\n\n"
            "## 执行\n\n"
            "在复制后的技能包根目录准备符合 `references/contract.md` 的任务 JSON：\n\n"
            "```bash\n"
            "python scripts/run.py --check\n"
            "python scripts/run.py --input task.json --output result.json "
            "--model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py\n"
            "```\n\n"
            "模型服务须提供 `POST /v1/chat/completions`。执行器最多进行 6 轮判断，"
            "对每次工具调用校验本技能的 `tools` 白名单，并在输出中记录工具参数与观察。"
            "若业务证据不足，结果应明确 `status=insufficient_data`；没有外部工具观察的成功回答"
            "会标为 `unverified`。\n\n"
            "## 真实工具\n\n"
            "本包内置的 `scripts/mcp_adapter.py` 对本技能所有外部工具都有路由映射："
            + remote + "。MES、库存、QMS、CAD 可使用同名 `SKILL_MCP_*_URL`；"
            "PLC、知识和项目本地工具分别使用 `SKILL_MCP_PLC_URL`、"
            "`SKILL_MCP_KNOWLEDGE_URL`、`SKILL_MCP_LOCAL_URL`。"
            "目标服务须实现 `/tools/call` 的 JSON 协议；需要时从环境读取 "
            "`BACKEND_INTERNAL_TOKEN` 或 `SKILL_MCP_TOKEN`。\n\n"
            "若对应服务没有兼容接口，需要将 `--tool-script` 指向自定义 Python 适配器。"
            '适配器从标准输入读取 `{"tool":"名称","arguments":{},"task":{}}`，'
            "向标准输出写一个 JSON 对象；退出码非 0 表示失败。"
            "没有适配器时，执行器会拒绝外部工具调用，不会伪造现场数据或业务回执。"
            "写入类工具还需显式添加 `--allow-writes`，并使用有相应权限的服务配置；"
            "执行后会对真实业务服务产生副作用。\n",
            encoding="utf-8",
        )
        if "## 独立运行" not in text:
            text = text.rstrip() + ("\n\n## 独立运行\n\n"
                "复制本目录后，可运行 `python scripts/run.py --check`，或使用 "
                "`python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 "
                "--tool-script scripts/mcp_adapter.py` 执行业务任务。"
                "输入字段见 `references/contract.md`；真实工具连接与限制见 "
                "`references/standalone.md`。\n")
            document.write_text(text, encoding="utf-8")
    print(f"updated {len(targets)} portable Skill entry points")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
