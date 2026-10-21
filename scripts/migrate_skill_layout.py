#!/usr/bin/env python3
"""把 app/skills/{agent}/*.md 迁移成目录包布局。

一次性迁移工具，幂等：已经存在 ``{skill}/SKILL.md`` 的技能会被跳过。

    python scripts/migrate_skill_layout.py --root services/agent-service/app/skills
    python scripts/migrate_skill_layout.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml

SKILL_DOCUMENT = "SKILL.md"
REFERENCE_DIRECTORY = "references"

# 章节标题（去掉括注后的前缀）→ 归属。SKILL.md 只保留模型每次都要看到的部分。
SKILL_SECTIONS = ("技能概述", "触发场景", "执行流程", "输出规范", "停止条件")

REFERENCES = {
    "reasoning": {
        "title": "业务判断规则与工具使用规范",
        "when": "需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。",
        "order": 1,
    },
    "evidence": {
        "title": "证据、异常与安全边界",
        "when": "需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。",
        "order": 2,
    },
    "contract": {
        "title": "输入契约与真实示例",
        "when": "需要构造请求、核对字段、验证返回结构或确认前置条件时读取。",
        "order": 3,
    },
    "source": {
        "title": "参考实现索引",
        "when": "需要定位真实代码实现、测试或数据模型时读取。",
        "order": 4,
    },
    "domain": {
        "title": "领域专用协议",
        "when": "需要本技能独有的领域规则或装配建造协议时读取。",
        "order": 5,
    },
}

SECTION_BUCKETS = {
    "业务判断规则": "reasoning",
    "工具使用规范": "reasoning",
    "证据与数据真实性": "evidence",
    "安全与权限边界": "evidence",
    "异常处理": "evidence",
    "输入与前置条件": "contract",
    "示例": "contract",
    "参考实现": "source",
}

REFERENCE_TOOL = "read_skill_reference"


def split_front_matter(text: str) -> tuple[dict, str]:
    text = text.lstrip("\ufeff")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("缺少 YAML Front Matter")
    closing = next(index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    payload = yaml.safe_load("\n".join(lines[1:closing])) or {}
    if not isinstance(payload, dict):
        raise ValueError("Front Matter 不是映射")
    return payload, "\n".join(lines[closing + 1:]).strip()


def split_sections(document: str) -> tuple[str, str, list[tuple[str, str]]]:
    """返回文档大标题、标题后的导语和 ``## `` 章节列表。"""

    title = ""
    sections: list[tuple[str, list[str]]] = []
    preface: list[str] = []
    for line in document.splitlines():
        if line.startswith("# ") and not title:
            title = line.lstrip("# ").strip()
            continue
        if line.startswith("## "):
            sections.append((line.lstrip("## ").strip(), []))
            continue
        if sections:
            sections[-1][1].append(line)
        else:
            preface.append(line)
    built: list[tuple[str, str]] = []
    for heading, body in sections:
        content = "\n".join(body).strip()
        built.append((heading, "## %s\n\n%s\n" % (heading, content)))
    return title, "\n".join(preface).strip(), built


def bucket_of(heading: str) -> str:
    prefix = re.sub(r"[（(].*$", "", heading).strip()
    if prefix in SKILL_SECTIONS:
        return "skill"
    return SECTION_BUCKETS.get(prefix, "domain")


def build_reference(name: str, sections: list[tuple[str, str]], extra_title: str = "") -> str:
    meta = REFERENCES[name]
    title = extra_title or meta["title"]
    front = yaml.safe_dump(
        {"name": name, "title": title, "when": meta["when"], "order": meta["order"]},
        allow_unicode=True, sort_keys=False,
    ).strip()
    body = "\n".join(piece for _, piece in sections).strip()
    return "---\n%s\n---\n\n%s\n" % (front, body)


def skill_document(payload: dict, title: str, preface: str,
                   sections: list[tuple[str, str]], references: list[tuple[str, str]]) -> str:
    front = dict(payload)
    tools = [str(item) for item in front.get("tools") or []]
    if REFERENCE_TOOL not in tools:
        tools.append(REFERENCE_TOOL)
    front["tools"] = tools
    front_text = yaml.safe_dump(front, allow_unicode=True, sort_keys=False).strip()

    index = "\n".join(
        "| `%s` | %s | %s |" % (name, REFERENCES[name]["title"], REFERENCES[name]["when"])
        for name, _ in references
    )
    body = (title or front.get("name") or "").strip()
    parts = ["---\n%s\n---\n" % front_text, "\n# %s\n" % body]
    if preface:
        parts.append("\n" + preface + "\n")
    parts.extend("\n" + piece for _, piece in sections)
    parts.append(
        "\n## 参考文档（按需读取）\n\n"
        "下列内容不进入默认上下文。需要时调用工具 `%s`："
        "`skill` 填 `%s`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。\n\n"
        "| reference | 内容 | 何时读取 |\n| --- | --- | --- |\n%s\n"
        % (REFERENCE_TOOL, front.get("name") or "", index)
    )
    return "".join(parts).rstrip() + "\n"


def runner_script(agent: str, name: str) -> str:
    return '''#!/usr/bin/env python3
"""本技能包的独立入口：自检、列出参考文档、查看参考正文。

    python scripts/run.py --check
    python scripts/run.py --list
    python scripts/run.py --reference reasoning
"""
from pathlib import Path
import sys

HERE = Path(__file__).resolve()
ROOT = next((parent for parent in HERE.parents if (parent / "scripts" / "skill_runner.py").is_file()), None)
if ROOT is None:
    raise SystemExit("未找到仓库根目录的 scripts/skill_runner.py")
sys.path.insert(0, str(ROOT / "scripts"))

import skill_runner

sys.argv = [sys.argv[0], "--skill", "%s/%s", *sys.argv[1:]]
raise SystemExit(skill_runner.main())
''' % (agent, name)


def migrate_file(path: Path, *, dry_run: bool) -> dict:
    payload, document = split_front_matter(path.read_text(encoding="utf-8"))
    name = str(payload.get("name") or path.stem).strip()
    agent = path.parent.name
    title, preface, sections = split_sections(document)

    grouped: dict[str, list[tuple[str, str]]] = {}
    kept: list[tuple[str, str]] = []
    for heading, piece in sections:
        target = bucket_of(heading)
        if target == "skill":
            kept.append((heading, piece))
        else:
            grouped.setdefault(target, []).append((heading, piece))

    ordered = [(key, grouped[key]) for key in ("reasoning", "evidence", "contract", "source", "domain") if grouped.get(key)]
    if not ordered:
        raise ValueError("%s 没有可拆分的参考章节" % path)

    package = path.parent / name
    plan = {
        "agent": agent,
        "name": name,
        "package": str(package),
        "skill": skill_document(payload, title, preface, kept, ordered),
        "references": {key: build_reference(key, pieces) for key, pieces in ordered},
        "runner": runner_script(agent, name),
    }
    if dry_run:
        return {**plan, "written": False}

    package.mkdir(parents=True, exist_ok=True)
    (package / SKILL_DOCUMENT).write_text(plan["skill"], encoding="utf-8")
    reference_directory = package / REFERENCE_DIRECTORY
    reference_directory.mkdir(exist_ok=True)
    for key, text in plan["references"].items():
        (reference_directory / ("%s.md" % key)).write_text(text, encoding="utf-8")
    script_directory = package / "scripts"
    script_directory.mkdir(exist_ok=True)
    (script_directory / "run.py").write_text(plan["runner"], encoding="utf-8")
    path.unlink()
    return {**plan, "written": True}


def main() -> int:
    parser = argparse.ArgumentParser(description="迁移技能为目录包布局")
    parser.add_argument("--root", default="services/agent-service/app/skills")
    parser.add_argument("--dry-run", action="store_true")
    arguments = parser.parse_args()
    root = Path(arguments.root).resolve()
    if not root.is_dir():
        print("技能目录不存在：%s" % root, file=sys.stderr)
        return 2

    report = []
    for agent_directory in sorted(root.iterdir()):
        if not agent_directory.is_dir() or agent_directory.name.startswith((".", "__")):
            continue
        for path in sorted(agent_directory.glob("*.md")):
            if (agent_directory / path.stem / SKILL_DOCUMENT).exists():
                continue
            report.append(migrate_file(path, dry_run=arguments.dry_run))

    print(json.dumps({"dry_run": arguments.dry_run, "migrated": len(report),
                      "items": [{key: item[key] for key in ("agent", "name", "package", "written")}
                                for item in report]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
