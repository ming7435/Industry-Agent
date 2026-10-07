"""已确认设计的不可变加工包、人工确认下发及只读对账。"""

from hashlib import sha256
import json
import os
import re
from threading import RLock
from uuid import uuid4

from .manufacturing_client import FactoryProductionClient, FactoryProductionError
from .modeling_service import CADDesignConflict, canonical_digest, utc_now
from .turning_program import build_turning_program


class ManufacturingOwner:
    """加工目录的单执行器锁，随加工服务创建与关闭，不单独拆分模块。"""

    def __init__(self, root):
        path = root / ".manufacturing-owner.lock"
        self.handle = path.open("a+b")
        if path.stat().st_size == 0:
            self.handle.write(b"0")
            self.handle.flush()
        self.handle.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self.handle.close()
            raise CADDesignConflict("该目录已有加工服务持有执行权，请使用单实例加工服务") from None

    def close(self):
        if self.handle.closed:
            return
        if os.name == "nt":
            import msvcrt
            self.handle.seek(0)
            msvcrt.locking(self.handle.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(self.handle.fileno(), fcntl.LOCK_UN)
        self.handle.close()


class CADManufacturingService:
    def __init__(self, modeling, factory_base_url, factory=None):
        self.modeling = modeling
        self.factory = factory or FactoryProductionClient(factory_base_url)
        self.lock = RLock()
        self.owner = ManufacturingOwner(modeling.root)
        # 重启只标记待对账；绝不自动重新提交或启动已有任务。
        for path in modeling.root.glob("CAD-*/manufacturing/CAM-*/record.json"):
            try:
                record = json.loads(path.read_text(encoding="utf-8"))
                if record.get("status") == "submitting":
                    record.update(status="uncertain", message="服务重启，等待只读查询工厂任务对账")
                    self._save(record)
            except (OSError, ValueError, KeyError):
                continue

    def close(self):
        with self.lock:
            self.owner.close()

    def _require_owner(self):
        if self.owner.handle.closed:
            raise CADDesignConflict("加工服务已经关闭，不能生成或下发新的程序")

    def _folder(self, design_id, program_id):
        if not re.fullmatch(r"CAM-[A-F0-9]{20}", program_id):
            raise KeyError("加工包不存在")
        parent = (self.modeling._folder(design_id) / "manufacturing").resolve()
        if parent.parent != self.modeling._folder(design_id):
            raise KeyError("加工包路径无效")
        folder = (parent / program_id).resolve()
        if folder.parent != parent:
            raise KeyError("加工包路径无效")
        return folder

    def _load(self, design_id, program_id):
        try:
            value = json.loads((self._folder(design_id, program_id) / "record.json").read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise KeyError("加工包不存在") from error
        if value.get("design_id") != design_id or value.get("program_id") != program_id:
            raise CADDesignConflict("加工包归属不一致")
        return value

    def _save(self, record):
        folder = self._folder(record["design_id"], record["program_id"])
        folder.mkdir(parents=True, exist_ok=True)
        temporary = folder / (uuid4().hex + ".tmp")
        temporary.write_text(json.dumps(record, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
        temporary.replace(folder / "record.json")

    @staticmethod
    def _view(record):
        return {key: value for key, value in record.items() if key not in {"prepare_identity", "dispatch_commands"}}

    def get(self, design_id, program_id):
        with self.lock:
            return self._view(self._load(design_id, program_id))

    def list(self, design_id):
        self.modeling.get(design_id)
        with self.lock:
            values = []
            for path in sorted((self.modeling._folder(design_id) / "manufacturing").glob("CAM-*/record.json"), key=lambda p: p.stat().st_mtime, reverse=True):
                values.append(self._view(self._load(design_id, path.parent.name)))
            return values

    def _design(self, design_id, digest):
        design = self.modeling.get(design_id)
        if design.get("status") != "confirmed" or design.get("digest") != digest:
            raise CADDesignConflict("请先确认摘要一致的当前设计版本，再准备加工程序")
        if not design.get("material", "").strip() or not design.get("technical_requirements", "").strip():
            raise CADDesignConflict("加工准备缺少材料或技术要求，请建立完整新版本并确认")
        if design.get("geometry", {}).get("valid") is not True or design.get("geometry", {}).get("step_roundtrip_valid") is not True:
            raise CADDesignConflict("设计实体尚未通过校验")
        self.modeling.artifact(design_id, "step")
        return design

    def prepare(self, design_id, body, actor):
        self._require_owner()
        design = self._design(design_id, body.design_digest)
        payload = body.model_dump(mode="json")
        command_id = payload.pop("command_id")
        identity = canonical_digest({"actor": actor, "design_id": design_id, "payload": payload})
        with self.lock:
            self._require_owner()
            for previous in self.list(design_id):
                record = self._load(design_id, previous["program_id"])
                if record["prepare_command_id"] == command_id:
                    if record["prepare_identity"] != identity:
                        raise CADDesignConflict("该加工命令身份已用于不同参数或人员，请使用新命令")
                    self._verify(record)
                    return self._view(record)
        # 几何/刀路计算不占用全局锁；落盘前再次检查命令并发。
        program = build_turning_program(design, {key: value for key, value in payload.items() if key != "design_digest"})
        with self.lock:
            self._require_owner()
            for previous in self.list(design_id):
                record = self._load(design_id, previous["program_id"])
                if record["prepare_command_id"] == command_id:
                    if record["prepare_identity"] != identity:
                        raise CADDesignConflict("该加工命令身份已用于不同参数")
                    return self._view(record)
            record = {"design_id": design_id, "program_id": "CAM-" + uuid4().hex[:20].upper(),
                "program": program, "digest": canonical_digest(program), "prepare_command_id": command_id,
                "prepare_identity": identity, "prepared_by": actor, "created_at": utc_now(), "updated_at": utc_now(),
                "status": "prepared", "message": "虚拟刀路、NC 及加工区域体积校验完成，等待独立生产确认",
                "dispatch_commands": {}, "events": [], "files": {}}
            folder = self._folder(design_id, record["program_id"])
            folder.mkdir(parents=True, exist_ok=True)
            for kind, filename, content, mime in (("nc", "virtual-program.nc", program["nc_program"], "text/plain; charset=utf-8"),
                ("toolpath", "toolpath.json", json.dumps(program["toolpath"], ensure_ascii=False, indent=2), "application/json"),
                ("package", "package.json", json.dumps(program, ensure_ascii=False, indent=2, allow_nan=False), "application/json")):
                path = folder / filename
                path.write_text(content, encoding="utf-8")
                record["files"][kind] = {"filename": filename, "media_type": mime, "sha256": sha256(path.read_bytes()).hexdigest(), "size": path.stat().st_size}
            self._add_event(record, "cad_cam_prepare", payload, {"digest": record["digest"], "profile": program["profile"], "simulation": program["simulation"]})
            self._save(record)
        self.modeling._event(design_id, "cad_cam_prepare", payload, {"program_id": record["program_id"], "digest": record["digest"], "simulation": program["simulation"]})
        return self._view(record)

    def _verify(self, record):
        self._design(record["design_id"], record["program"]["design_digest"])
        if canonical_digest(record["program"]) != record["digest"]:
            raise CADDesignConflict("加工包摘要不一致，禁止下载或下发")
        folder = self._folder(record["design_id"], record["program_id"])
        for item in record["files"].values():
            path = (folder / item["filename"]).resolve()
            if path.parent != folder or not path.is_file() or sha256(path.read_bytes()).hexdigest() != item["sha256"]:
                raise CADDesignConflict("加工成果文件缺失或已改变，请重新准备加工包")

    def file(self, design_id, program_id, kind):
        with self.lock:
            record = self._load(design_id, program_id)
            self._verify(record)
            if kind not in record["files"]:
                raise KeyError("加工文件不存在")
            metadata = record["files"][kind]
            return self._folder(design_id, program_id) / metadata["filename"], metadata

    @staticmethod
    def _add_event(record, tool, inputs, output):
        record["events"].append({"timestamp": utc_now(), "agent": "cad", "tool": tool, "input": inputs, "output": output})

    def capabilities(self):
        try:
            value = self.factory.capabilities()
            connected = value.get("ready") is True and value.get("simulation_only") is True and "virtual-trak-turning-v1" in value.get("postprocessors", [])
            return {"production_connected": connected, "production_mode": "virtual-only", "production_capabilities": value if connected else {}, "production_message": "虚拟工厂加工接口已连接" if connected else "工厂没有可验证的虚拟车削能力"}
        except FactoryProductionError:
            return {"production_connected": False, "production_mode": "virtual-only", "production_capabilities": {}, "production_message": "虚拟工厂加工接口不可用；建模和加工包下载仍可使用"}

    @staticmethod
    def _checked_job(record, job):
        if job.get("simulation_only") is not True or job.get("program_digest") != record["digest"] or not job.get("job_id"):
            raise FactoryProductionError("工厂任务与加工包不匹配，不能确认生产结果", uncertain=True)
        if job.get("status") not in {"received", "running", "paused", "completed", "interrupted"}:
            raise FactoryProductionError("工厂任务状态不可验证", uncertain=True)
        return job

    def dispatch(self, design_id, program_id, body, actor):
        identity = canonical_digest({"actor": actor, "design_id": design_id, "program_id": program_id, "body": body.model_dump(mode="json")})
        with self.lock:
            self._require_owner()
            record = self._load(design_id, program_id)
            self._verify(record)
            if body.digest != record["digest"]:
                raise CADDesignConflict("生产确认摘要与加工包不一致")
            if body.command_id in record["dispatch_commands"]:
                if record["dispatch_commands"][body.command_id] != identity:
                    raise CADDesignConflict("生产命令身份已用于不同参数或人员")
                return self._view(record)
            if record["status"] not in {"prepared", "received", "paused", "interrupted", "rejected"}:
                raise CADDesignConflict("该加工任务已提交或结果不确定，请先查询生产状态，不重复写入")
            if record["status"] == "rejected" and record.get("job"):
                raise CADDesignConflict("工厂任务需查询确认当前状态后才能重新确认")
            record["dispatch_commands"][body.command_id] = identity
            record.update(status="submitting", submitted_by=actor, factory_command_id=f"{program_id}:{body.command_id}", updated_at=utc_now(), message="正在提交虚拟加工任务；未收到确认时只读对账")
            self._save(record)
        # 网络调用不持有状态锁，且每个写入只尝试一次。
        try:
            if not self.capabilities()["production_connected"]:
                raise FactoryProductionError("虚拟工厂加工能力未就绪，未发送加工程序")
            job = record.get("job")
            if not job:
                job = self._checked_job(record, self.factory.submit(record["factory_command_id"], record["program"]))
                with self.lock:
                    current = self._load(design_id, program_id)
                    current["job"] = job
                    self._save(current)
            job = self._checked_job(record, self.factory.start(job["job_id"], record["digest"], actor))
            state, message = job["status"], "已收到虚拟工厂任务状态；不代表真实机床加工或质检合格"
        except FactoryProductionError as error:
            state = "uncertain" if error.uncertain else "rejected"
            message = str(error)
            job = None
        with self.lock:
            record = self._load(design_id, program_id)
            if job:
                record["job"] = job
            record.update(status=state, message=message, updated_at=utc_now())
            self._add_event(record, "cad_production_dispatch", {"command_id": body.command_id, "digest": body.digest, "operator": actor, "simulation_only": True}, {"status": state, "message": message, "job_id": record.get("job", {}).get("job_id")})
            self._save(record)
        self.modeling._event(design_id, "cad_production_dispatch", {"program_id": program_id, "digest": body.digest, "operator": actor}, {"status": state, "message": message, "job_id": record.get("job", {}).get("job_id")})
        return self._view(record)

    def production(self, design_id, program_id):
        with self.lock:
            record = self._load(design_id, program_id)
            if record["status"] in {"prepared", "submitting"} or not record.get("factory_command_id"):
                return self._view(record)
            revision = record["updated_at"]
        try:
            job = self.factory.get(record["job"]["job_id"]) if record.get("job") else self.factory.by_command(record["factory_command_id"])
            if job.get("found") is False:
                return self._view(record)
            job = self._checked_job(record, job)
        except FactoryProductionError:
            # 读失败不伪造设备恢复，也不触发再次写入。
            value = self._view(record)
            value["state_query_error"] = "未获得最新工厂状态，显示上次确认结果"
            return value
        with self.lock:
            latest = self._load(design_id, program_id)
            if latest["updated_at"] != revision:
                return self._view(latest)
            latest.update(job=job, status=job["status"], updated_at=utc_now(), message="状态来自虚拟工厂；任务暂停后需人工再次确认，不自动启动")
            self._save(latest)
            return self._view(latest)
