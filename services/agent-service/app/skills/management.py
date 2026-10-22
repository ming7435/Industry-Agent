"""专家中心受控文档更新：不改变工具权限或业务流程。"""

from __future__ import annotations

from contextlib import contextmanager, nullcontext
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import re
from tempfile import NamedTemporaryFile
from threading import RLock
from time import monotonic, sleep
from uuid import uuid4

import yaml

from app.skills.registry import (
    REFERENCE_DIRECTORY_NAME,
    SKILL_DOCUMENT_NAME,
    SKILLS_ROOT,
    SkillRegistry,
    _load_markdown_skill,
    _load_references,
    _parse_markdown_skill,
)


AGENTS = {
    "diagnosis": ("智能诊断", True, "诊断循环：根据证据决定补查工具，再校验结论。"),
    "knowledge": ("知识检索", True, "检索循环：补查资料、评估证据并优化查询。"),
    "cad": ("CAD 建模与定位", True, "工程查询循环；生产建模由专用节点调用技能工具。"),
    "router": ("任务路由", False, "由 Runtime 编排调用。"),
    "maintenance": ("维修方案", False, "由 Runtime 编排调用。"),
    "workorder": ("工单执行", False, "由 Runtime 编排调用。"),
    "quality": ("零件质检", False, "由 Runtime 编排调用。"),
    "report": ("报告生成", False, "由 Runtime 编排调用。"),
    "memory": ("经验记忆", False, "由 Runtime 编排调用。"),
}


class SkillEditError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


def _skill_revision(path: Path, content: bytes | None = None) -> str:
    """版本号覆盖 SKILL.md、references 和可执行业务脚本。"""

    digest = sha256()
    digest.update(content if content is not None else path.read_bytes())
    references = path.parent / REFERENCE_DIRECTORY_NAME
    if path.name == SKILL_DOCUMENT_NAME and references.is_dir():
        for item in sorted(references.glob("*.md")):
            digest.update(b"\0")
            digest.update(item.read_bytes())
    if path.name == SKILL_DOCUMENT_NAME:
        for item in sorted((path.parent / "scripts").glob("*.py")):
            digest.update(b"\0")
            digest.update(item.name.encode("utf-8"))
            digest.update(b"\0")
            digest.update(item.read_bytes())
    return digest.hexdigest()


class SkillManager:
    def __init__(self, registry: SkillRegistry, available_tools, trace=None, backup_root: Path | None = None):
        self.registry = registry
        self.available_tools = set(available_tools)
        self.trace = trace
        default = (SKILLS_ROOT.parents[3] / ".runtime" / "skill-revisions"
                   if registry.root.resolve() == SKILLS_ROOT.resolve() else registry.root.parent / "skill-revisions")
        self.backup_root = backup_root or default
        self._lock = RLock()

    @contextmanager
    def _transaction(self):
        """本机多线程、多服务进程共同锁；进程退出由操作系统释放。"""
        with self._lock:
            self.backup_root.mkdir(parents=True, exist_ok=True)
            with (self.backup_root / ".edit.lock").open("a+b") as handle:
                if handle.seek(0, os.SEEK_END) == 0:
                    handle.write(b"\0")
                    handle.flush()
                deadline = monotonic() + 2
                while True:
                    try:
                        handle.seek(0)
                        if os.name == "nt":
                            import msvcrt
                            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                        else:
                            import fcntl
                            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                        break
                    except OSError:
                        if monotonic() >= deadline:
                            raise SkillEditError(409, "另一位专家正在更新，请稍后刷新重试") from None
                        sleep(0.02)
                try:
                    yield
                finally:
                    handle.seek(0)
                    if os.name == "nt":
                        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
                    else:
                        fcntl.flock(handle.fileno(), fcntl.LOCK_UN)

    def _find(self, agent: str, name: str):
        if agent not in AGENTS or not re.fullmatch(r"[a-zA-Z0-9_-]{1,100}", name):
            raise SkillEditError(404, "未找到对应技能")
        skill = next((s for s in self.registry.list(agent) if s.name == name), None)
        if skill is None:
            raise SkillEditError(404, "未找到对应技能")
        path = Path(skill.path)
        if not path.resolve().is_relative_to(self.registry.root.resolve() / agent) or path.is_symlink():
            raise SkillEditError(422, "技能路径不属于当前 Agent")
        return skill, path

    @staticmethod
    def _summary(skill):
        label, loop, explanation = AGENTS[skill.agent]
        title = next((line.lstrip("# ").strip() for line in skill.document.splitlines() if line.startswith("# ")), skill.goal or skill.name)
        from app.skills.optimization import capability
        return {"agent": skill.agent, "agent_label": label, "name": skill.name, "title": title,
                "optimization": capability(skill.agent, skill.name),
                "version": skill.version, "goal": skill.goal, "internal_loop": loop, "loop_description": explanation,
                "last_modified_at": datetime.fromtimestamp(Path(skill.path).stat().st_mtime, timezone.utc).isoformat()}

    def catalog(self, loop_only=True):
        return {"items": [self._summary(skill) for agent, (_, loop, _) in AGENTS.items()
                          if not loop_only or loop for skill in self.registry.list(agent)]}

    def _detail(self, agent, name):
        skill, path = self._find(agent, name)
        source = path.read_bytes()
        payload, document = _parse_markdown_skill(source.decode("utf-8"), path)
        # 从同一文件版本构造正文和摘要，不把旧注册表内容配上新文件的修订号。
        from app.skills.registry import SkillDefinition
        references, layout = _load_references(path)
        current = SkillDefinition.from_payload(agent, payload, path, document, references, layout)
        return {**self._summary(current), "document": document, "revision": _skill_revision(path, source),
                "content_fingerprint": current.observation()['skill_fingerprint'],
                "update_quota": self._update_quota(agent, name),
                "tools": list(current.tools), "steps": [step.id for step in current.normalized_steps()],
                "stop_conditions": list(current.stop_conditions),
                "references": [{"name": item.name, "title": item.title, "when": item.when}
                               for item in current.references]}

    def _update_quota(self, agent, name, now=None):
        from app.skills.update_quota import read_update_quota
        return read_update_quota(self.backup_root, agent, name, now or datetime.now(timezone.utc))

    def detail(self, agent, name):
        with self._transaction():
            return self._detail(agent, name)

    def update(self, agent, name, values, actor, *, require_trial=False, publication_fence=None):
        with self._transaction():
            skill, path = self._find(agent, name)
            original = path.read_bytes()
            old_revision = _skill_revision(path, original)
            if old_revision != values["expected_revision"]:
                raise SkillEditError(409, "技能已被其它修改更新，请先刷新，再核对并保存你的草稿")
            payload, _ = _parse_markdown_skill(original.decode("utf-8"), path)
            if set(skill.tools) - self.available_tools:
                raise SkillEditError(503, "该技能引用的工具尚未注册，不能发布更新")
            if require_trial:
                self.trials.validate_publish(agent, name, values, actor)
            # 仅这两个元数据字段可编辑；正文即使含 YAML，也不会成为运行权限。
            payload = dict(payload)
            payload.update(goal=values["goal"].strip(), version=values["version"].strip())
            if require_trial:
                from app.skills.optimization import verification_mode
                if verification_mode(agent, name) == 'review_flow':
                    # 由已验证的发布边界启用；正文与客户端不能提供此状态。
                    payload['review_enabled'] = True
            document = values["document"].strip()
            content = ("---\n" + yaml.safe_dump(payload, allow_unicode=True, sort_keys=False)
                       + "---\n\n" + document + "\n").encode("utf-8")
            revision = _skill_revision(path, content)
            from app.skills.north_star import publication_snapshot
            from app.skills.update_quota import is_update
            moment = datetime.now(timezone.utc)
            preview = publication_snapshot({'edit_id': '', 'agent': agent, 'skill': name,
                'timestamp': moment.isoformat(), 'old_revision': old_revision, 'new_revision': revision},
                original, content, path=path)
            if is_update(preview):
                quota = self._update_quota(agent, name, moment)
                if not quota['complete']:
                    raise SkillEditError(409, quota['message'])
                if quota['remaining'] == 0:
                    raise SkillEditError(409, '该技能已达到每周最多 3 次正式更新的上限，请在下周一北京时间 00:00 后再发布')
            edit_id = uuid4().hex
            directory = self.backup_root / agent / name
            directory.mkdir(parents=True, exist_ok=True)
            backup = directory / (edit_id + ".md")
            # 先落盘原文和恢复信息，再发布；备份失败绝不更新源码。
            with backup.open("xb") as handle:
                handle.write(original)
                handle.flush()
                os.fsync(handle.fileno())
            audit = {"event": "skill_updated", "agent": agent, "skill": name, "edit_id": edit_id,
                     "actor_id": actor["user_id"], "old_revision": old_revision, "new_revision": revision,
                     "old_version": skill.version, "new_version": payload["version"], "reason": values["reason"].strip(),
                     "timestamp": moment.isoformat(), "state": "prepared"}
            if require_trial:
                audit.update(test_id=values["test_id"], human_confirmed=True)
            audit['north_star'] = {**preview, 'edit_id': edit_id}
            audit_path = directory / (edit_id + ".json")
            audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
            temporary = None
            try:
                with NamedTemporaryFile(dir=path.parent, suffix=".tmp", delete=False) as handle:
                    temporary = Path(handle.name)
                    handle.write(content)
                    handle.flush()
                    os.fsync(handle.fileno())
                _load_markdown_skill(temporary)
                os.chmod(temporary, path.stat().st_mode)
                if path.read_bytes() != original:
                    raise SkillEditError(409, "技能文件刚被修改，请刷新后重试")
                # 自动发布的内部行锁栅栏必须贴近真正的文件写入；普通人工发布不变。
                # 此回调不接受客户端参数，且不把远程请求放入文件/数据库事务。
                with publication_fence(audit) if publication_fence else nullcontext():
                    os.replace(temporary, path)
            except Exception:
                # 只有文件仍为原文时才确认未发布；落盘结果不确定时保留 prepared 待对账。
                try:
                    if path.read_bytes() == original:
                        audit['state'] = 'aborted'
                        audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
                except OSError:
                    pass
                raise
            finally:
                if temporary is not None:
                    temporary.unlink(missing_ok=True)
            self.registry.invalidate(agent)
            warning = ""
            audit["state"] = "applied"
            try:
                audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
            except OSError:
                warning = "更新已保存；审计状态写入失败，旧版备份仍可恢复"
            if self.trace is not None:
                self.trace.record(type="expert", name="技能更新", **audit)
                if self.trace.storage_error:
                    warning = "更新已保存到文档；数据库审计暂不可用，本地修订记录已保留"
            return {**self._detail(agent, name), "edit_id": edit_id, "warning": warning}

    def publish(self, agent, name, values, actor, *, publication_fence=None):
        return self.update(agent, name, values, actor, require_trial=True, publication_fence=publication_fence)
