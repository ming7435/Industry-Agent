#!/usr/bin/env python3
"""技能包只读命令行：自检、列出参考文档、查看参考正文。

只依赖标准库和 PyYAML，不导入 app，也不需要数据库或外部服务，便于在 CI 和本机直接运行。

    python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --check
    python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --list
    python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --reference reasoning
    python scripts/skill_runner.py --skill diagnosis/alarm_diagnosis_skill --show
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
CORE_HEADINGS = ("技能概述", "触发场景", "执行流程", "输出规范", "停止条件")
REQUIRED_REFERENCES = ("contract", "evidence", "reasoning", "source")
ROOT = Path(__file__).resolve().parents[1]
SKILLS_ROOT = ROOT / "services" / "agent-service" / "app" / "skills"


class PackageError(Exception):
    pass


def split_front_matter(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8").lstrip("\ufeff")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise PackageError("%s 缺少 YAML Front Matter" % path)
    try:
        closing = next(index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration:
        raise PackageError("%s 的 YAML Front Matter 未闭合" % path) from None
    payload = yaml.safe_load("\n".join(lines[1:closing])) or {}
    if not isinstance(payload, dict):
        raise PackageError("%s 的 YAML Front Matter 不是映射" % path)
    return payload, "\n".join(lines[closing + 1:]).strip()


def package_path(skill: str) -> Path:
    agent, _, name = str(skill).strip().partition("/")
    if not agent or not name:
        raise PackageError("技能标识必须是 agent/name，例如 diagnosis/alarm_diagnosis_skill")
    path = SKILLS_ROOT / agent / name
    if not (path / SKILL_DOCUMENT).is_file():
        raise PackageError("技能包不存在：%s" % path.relative_to(ROOT))
    return path


def load_references(package: Path) -> list[dict]:
    directory = package / REFERENCE_DIRECTORY
    if not directory.is_dir():
        return []
    items = []
    for path in sorted(directory.glob("*.md")):
        payload, body = split_front_matter(path)
        items.append({
            "name": str(payload.get("name") or path.stem),
            "title": str(payload.get("title") or ""),
            "when": str(payload.get("when") or ""),
            "order": int(payload.get("order") or 100),
            "path": path,
            "document": body,
        })
    return sorted(items, key=lambda item: (item["order"], item["name"]))


def check(package: Path) -> dict:
    payload, document = split_front_matter(package / SKILL_DOCUMENT)
    findings: list[str] = []
    if not str(payload.get("name") or "").strip():
        findings.append("缺少 name")
    if not str(payload.get("description") or "").strip():
        findings.append("缺少 description")
    for heading in CORE_HEADINGS:
        if not any(line.startswith("## " + heading) for line in document.splitlines()):
            findings.append("SKILL.md 缺少章节：%s" % heading)
    if "## 参考文档" not in document and "## 参考文档（按需读取）" not in document:
        findings.append("SKILL.md 缺少参考文档索引")

    references = load_references(package)
    names = {item["name"] for item in references}
    for name in REQUIRED_REFERENCES:
        if name not in names:
            findings.append("缺少参考文档：%s" % name)
    for item in references:
        if not item["title"] or not item["when"]:
            findings.append("参考文档 %s 缺少 title 或 when" % item["name"])

    contract = next((item for item in references if item["name"] == "contract"), None)
    if contract is not None:
        section = contract["document"].split("## 示例", 1)[-1].split("## 参考实现", 1)[0]
        if len(re.findall(r"```json\s*\n(.*?)\n```", section, re.S)) != 2:
            findings.append("contract 参考文档缺少一组成对 JSON 示例")

    for item in [{"path": package / SKILL_DOCUMENT, "document": document}, *references]:
        for link in re.findall(r"\]\((L:/[^)]*)\)", item["document"]):
            if not Path(link).is_file():
                findings.append("参考实现不存在：%s" % link)

    runner = package / "scripts" / "run.py"
    if not runner.is_file():
        findings.append("缺少 scripts/run.py")

    return {"schema": "skill-package-check-v1", "skill": str(package.relative_to(SKILLS_ROOT)).replace("\\", "/"),
            "layout": "directory", "references": [item["name"] for item in references],
            "document_characters": len(document), "errors": findings}


def main() -> int:
    parser = argparse.ArgumentParser(description="技能包只读命令行")
    parser.add_argument("--skill", required=True, help="agent/name，例如 diagnosis/alarm_diagnosis_skill")
    parser.add_argument("--check", action="store_true", help="校验包结构与参考文档")
    parser.add_argument("--list", action="store_true", help="列出参考文档")
    parser.add_argument("--reference", help="输出指定参考文档正文")
    parser.add_argument("--show", action="store_true", help="输出 SKILL.md 正文")
    parser.add_argument("--json", action="store_true", help="以 JSON 输出")
    arguments = parser.parse_args()

    try:
        package = package_path(arguments.skill)
        if arguments.check:
            result = check(package)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 1 if result["errors"] else 0
        if arguments.reference:
            item = next((ref for ref in load_references(package) if ref["name"] == arguments.reference), None)
            if item is None:
                raise PackageError("参考文档不存在：%s" % arguments.reference)
            print(item["document"])
            return 0
        if arguments.show:
            print(split_front_matter(package / SKILL_DOCUMENT)[1])
            return 0
        references = load_references(package)
        payload, document = split_front_matter(package / SKILL_DOCUMENT)
        summary = {"skill": arguments.skill, "name": payload.get("name"), "version": str(payload.get("version") or ""),
                   "goal": payload.get("goal"), "layout": "directory",
                   "steps": payload.get("steps") or [], "tools": payload.get("tools") or [],
                   "references": [{"name": item["name"], "title": item["title"], "when": item["when"]}
                                  for item in references],
                   "document_characters": len(document)}
        if arguments.list:
            for item in references:
                print("%-10s %s" % (item["name"], item["title"]))
            return 0
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0
    except PackageError as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
