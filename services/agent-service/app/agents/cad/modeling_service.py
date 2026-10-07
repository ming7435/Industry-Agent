"""CAD Agent 的版本化建模任务，不使用或迁移业务数据库。"""

from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
from threading import BoundedSemaphore, RLock
from uuid import uuid4

from .modeling_analysis import MissingDesignInformation, UnconfirmedDesignParameters, analyze_design
from .modeling_engine import CADKernel, CADKernelError, PROJECT_ROOT, export_drawing_pdf
from .schemas import DesignRequest, ImportRequest


class CADDesignConflict(ValueError):
    pass


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def canonical_digest(value):
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


class CADModelingService:
    def __init__(self, root=None, kernel=None, model=None, trace=None, workers=2, capacity=8, agent=None):
        self.root = Path(root or PROJECT_ROOT / ".runtime" / "cad-designs").resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.kernel = kernel or CADKernel()
        self.model = model
        self.trace = trace
        from .agent import CADAgent
        from app.tools.registry import ToolRegistry
        self.agent = agent or CADAgent(tools=ToolRegistry(trace=trace))
        if trace is not None:
            self.agent.runtime_trace = trace
            self.agent.tools.trace = trace
        self.lock = RLock()
        self.slots = BoundedSemaphore(capacity)
        self.pool = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="cad-modeling")
        self.closed = False
        self.idempotency = {}
        # 重启后旧作业不盲目重写；明确标记中断，保留输入与已完成版本。
        for path in self.root.glob("CAD-*/record.json"):
            try:
                value = json.loads(path.read_text(encoding="utf-8"))
                if value.get("status") in {"queued", "analyzing", "modeling", "validating"}:
                    value.update(status="interrupted", message="服务已重启，请基于保存的需求创建新版本")
                    self._save(value)
                if value.get("idempotency_key"):
                    self.idempotency[value["idempotency_key"]] = (value["input_digest"], value["design_id"])
            except (OSError, ValueError, KeyError):
                continue

    def _folder(self, design_id):
        if not re.fullmatch(r"CAD-[A-F0-9]{20}", design_id):
            raise KeyError("建模任务不存在")
        folder = (self.root / design_id).resolve()
        if folder.parent != self.root:
            raise KeyError("建模任务不存在")
        return folder

    def _load(self, design_id):
        try:
            return json.loads((self._folder(design_id) / "record.json").read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise KeyError("建模任务不存在") from error

    def _save(self, value):
        folder = self._folder(value["design_id"])
        folder.mkdir(parents=True, exist_ok=True)
        temporary = folder / ("record-" + uuid4().hex + ".tmp")
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
        temporary.replace(folder / "record.json")

    def _change(self, design_id, **changes):
        with self.lock:
            value = self._load(design_id)
            value.update(changes, updated_at=utc_now())
            self._save(value)
            return value

    def _event(self, design_id, tool, inputs, output=None, error=""):
        context = self.agent.tools.current_trace_context()
        event = {"timestamp": utc_now(), "agent": "cad", "tool": tool, "input": inputs,
            "output": output or {}, "error": error, "status": "failed" if error else "completed",
            "node": context.get("node", ""), "skill": context.get("skill", ""), "step": context.get("step", "")}
        with self.lock:
            value = self._load(design_id)
            value["events"].append(event)
            self._save(value)
        if self.trace:
            self.trace.record(type="tool", name=tool, tool_name=tool, agent="cad", task_id=design_id,
                trace_id=design_id, context=context, input=inputs, output=output or {}, error=error, event="tool_completed" if not error else "tool_failed")

    def submit(self, request, idempotency_key="", parent_id=""):
        raw = request.model_dump(mode="json")
        encoded = raw.pop("content_base64", None)
        data = None
        if encoded is not None:
            try:
                data = base64.b64decode(encoded, validate=True)
            except ValueError as error:
                raise ValueError("上传文件不是合法的 Base64 数据") from error
            if not data or len(data) > 8 * 1024 * 1024:
                raise OverflowError("图纸文件必须非空且不超过 8 MB")
            raw["source_sha256"] = sha256(data).hexdigest()
            raw["source_size"] = len(data)
        identity = canonical_digest({"request": raw, "parent_id": parent_id})
        with self.lock:
            if idempotency_key and idempotency_key in self.idempotency:
                old, identifier = self.idempotency[idempotency_key]
                if old != identity:
                    raise CADDesignConflict("同一请求身份已用于不同参数，请使用新的命令身份")
                return self.get(identifier)
            if self.closed or not self.slots.acquire(blocking=False):
                raise CADDesignConflict("CAD 建模队列已满或正在关闭，请稍后重试")
            identifier = "CAD-" + uuid4().hex[:20].upper()
            value = {"design_id": identifier, "task_id": identifier, "trace_id": identifier,
                "name": request.name, "material": request.material, "technical_requirements": request.technical_requirements,
                "request": raw, "input_digest": identity, "idempotency_key": idempotency_key,
                "parent_id": parent_id, "status": "queued", "created_at": utc_now(), "updated_at": utc_now(),
                "events": [], "artifacts": [], "missing_information": [], "geometry": {},
                "production_status": "not_connected", "message": "已排队，等待 CAD Agent 建模"}
            try:
                self._save(value)
                if data is not None:
                    suffix = Path(request.filename).suffix.lower()
                    (self._folder(identifier) / ("source" + suffix)).write_bytes(data)
                if idempotency_key:
                    self.idempotency[idempotency_key] = (identity, identifier)
                self.pool.submit(self._execute, identifier, request)
            except Exception:
                self.slots.release()
                raise
        return self.get(identifier)

    def _read_drawing(self, path):
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            import fitz
            with fitz.open(path) as document:
                if len(document) > 50:
                    raise MissingDesignInformation(["图纸超过 50 页，请仅上传相关零件页面"])
                text = "\n".join(page.get_text() for page in document)[:18000]
                if text.strip():
                    return text, None
                if len(document) != 1:
                    raise MissingDesignInformation(["扫描图纸缺少可读取尺寸，请上传清晰单页图纸或填写结构化参数"])
                data = document[0].get_pixmap(matrix=fitz.Matrix(1, 1)).tobytes("png")
            return "", "data:image/png;base64," + base64.b64encode(data).decode()
        if suffix in {".png", ".jpg", ".jpeg"}:
            from PIL import Image
            with Image.open(path) as image:
                if image.width * image.height > 20000000:
                    raise ValueError("图纸图片像素超过资源限制")
                image.verify()
            mime = "image/png" if suffix == ".png" else "image/jpeg"
            return "", "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode()
        return "", None

    def _execute(self, identifier, request):
        """有界队列只负责进入 Agent 图，不直接绕过 Skill 调用内核。"""
        try:
            result = self.agent.run_modeling(identifier, self, request)
            self._change(identifier, execution=result["execution"])
        except Exception:
            self._event(identifier, "cad_modeling", {}, error="CAD 节点或技能执行失败，未返回未经验证的文件")
            self._change(identifier, status="failed", message="CAD 节点或技能执行失败，请查看执行日志", artifacts=[])
        finally:
            self.slots.release()

    def _build_model(self, identifier, request):
        """由注册的建模 Tool 执行原实体流水线，保留原有业务校验。"""
        try:
            self._change(identifier, status="analyzing", message="正在解析零件需求")
            self._event(identifier, "cad_input", self.get(identifier)["request"])
            source = None
            drawing_text, image_data = "", None
            if isinstance(request, ImportRequest):
                source = self._folder(identifier) / ("source" + Path(request.filename).suffix.lower())
                suffix = source.suffix.lower()
                if suffix in {".step", ".stp"}:
                    if b"ISO-10303-21" not in source.read_bytes()[:256]:
                        raise ValueError("上传内容不是有效的 STEP 交换文件")
                elif suffix == ".dxf":
                    if request.dxf_depth is None or request.dxf_units is None:
                        raise MissingDesignInformation(["DXF 仅包含二维轮廓，请指定拉伸深度和图纸单位"])
                else:
                    drawing_text, image_data = self._read_drawing(source)
                    source = None
            if source and not request.spec:
                spec = None
                analysis = {"source": "uploaded_geometry", "model_called": False}
            else:
                spec, analysis = analyze_design(request, self.model, drawing_text, image_data)
            resolved = spec.model_dump(mode="json") if spec else None
            self._change(identifier, resolved_spec=resolved, analysis=analysis, status="modeling", message="正在生成真实 CAD 实体")
            self._event(identifier, "cad_analyze", {"prompt": request.prompt, "drawing_text": drawing_text, "image_supplied": bool(image_data)}, {"spec": resolved, **analysis})
            output = self._folder(identifier) / "artifacts"
            generated = self.kernel.build(resolved, output, name=request.name, import_path=str(source) if source else None,
                dxf_depth=getattr(request, "dxf_depth", None), dxf_units=getattr(request, "dxf_units", None))
            self._event(identifier, "cad_kernel", {"spec": resolved, "import_format": source.suffix if source else ""}, generated)
            self._change(identifier, status="validating", geometry=generated["geometry"], message="正在校验与导出工程文件")
            digest = canonical_digest({"input": self.get(identifier)["input_digest"], "step_sha256": sha256((output / "model.step").read_bytes()).hexdigest()})
            self._change(identifier, digest=digest)
            export_drawing_pdf(output, self.get(identifier))
            files = (("step", "model.step", "STEP 三维实体", "application/step"),
                ("stl", "model.stl", "STL 实体预览", "model/stl"),
                ("svg", "front.svg", "主视图 SVG", "image/svg+xml"),
                ("top", "top.svg", "俯视图 SVG", "image/svg+xml"),
                ("side", "side.svg", "侧视图 SVG", "image/svg+xml"),
                ("dxf", "section.dxf", "实体中截面 DXF", "application/dxf"),
                ("json", "model_spec.json", "参数化设计 JSON", "application/json"),
                ("pdf", "drawing.pdf", "中文工程视图 PDF", "application/pdf"))
            artifacts = []
            for kind, filename, label, mime in files:
                path = output / filename
                artifacts.append({"artifact_id": kind, "format": kind, "filename": filename, "label": label,
                    "media_type": mime, "size": path.stat().st_size, "sha256": sha256(path.read_bytes()).hexdigest(),
                    "url": f"/api/cad/designs/{identifier}/artifacts/{kind}"})
            self._event(identifier, "cad_export", {"digest": digest}, {"artifacts": artifacts})
            self._change(identifier, status="ready", artifacts=artifacts, message="实体与 STEP 回读校验通过，可以查看、下载并确认设计版本",
                manufacturing_missing=[key for key, value in (("材料", request.material), ("公差/表面及后处理要求", request.technical_requirements)) if not value])
        except UnconfirmedDesignParameters as error:
            suggested = error.spec.model_dump(mode="json")
            self._event(identifier, "cad_analyze", {"prompt": request.prompt, "image_supplied": bool(image_data), "drawing_text": drawing_text},
                {"suggested_spec": suggested, "requires_parameter_confirmation": True, **error.metadata})
            self._change(identifier, status="needs_input", suggested_spec=suggested, analysis=error.metadata,
                missing_information=error.items, message="提取参数待人工核对；尚未建模或开放下载")
        except MissingDesignInformation as error:
            self._event(identifier, "cad_analyze", {"prompt": request.prompt}, {"missing_information": error.items})
            self._change(identifier, status="needs_input", missing_information=error.items, message="建模信息不足，请补充尺寸或几何约束")
        except (CADKernelError, ValueError, OSError) as error:
            message = str(error) if isinstance(error, CADKernelError) else "上传图纸或几何参数未通过校验，请检查文件与零件约束"
            self._event(identifier, "cad_modeling", {}, error=message)
            self._change(identifier, status="failed", message=message, artifacts=[])
        except Exception:
            self._event(identifier, "cad_modeling", {}, error="CAD 任务处理失败，未返回未经验证的文件")
            self._change(identifier, status="failed", message="CAD 任务处理失败，请查看执行明细并调整需求", artifacts=[])

    def get(self, design_id):
        with self.lock:
            value = self._load(design_id)
            value.pop("idempotency_key", None)
            return value

    def list(self):
        with self.lock:
            values = []
            for path in sorted(self.root.glob("CAD-*/record.json"), key=lambda item: item.stat().st_mtime, reverse=True)[:100]:
                try:
                    value = self.get(path.parent.name)
                    values.append({key: value.get(key) for key in ("design_id", "name", "status", "message", "created_at", "parent_id")})
                except KeyError:
                    continue
            return values

    def revise(self, design_id, request, key=""):
        parent = self.get(design_id)
        prior = parent["request"]
        raw = request.model_dump(mode="json")
        replace = raw.pop("replace_source_geometry", False)
        if not raw["prompt"]:
            raw["prompt"] = prior.get("prompt", "")
        elif prior.get("prompt") and raw["prompt"] != prior["prompt"]:
            raw["prompt"] = prior["prompt"] + "\n补充/修改要求：" + raw["prompt"]
        for field in ("name", "material", "technical_requirements"):
            if field not in request.model_fields_set:
                raw[field] = parent.get(field) or raw[field]
        if prior.get("filename") and not replace:
            suffix = Path(prior["filename"]).suffix.lower()
            if suffix in {".step", ".stp", ".dxf"} and request.spec:
                raise CADDesignConflict("使用新参数替换原 CAD 几何时，请明确选择替换原图几何")
            if suffix in {".step", ".stp", ".dxf"} and raw["prompt"] != prior.get("prompt", ""):
                raise CADDesignConflict("仅新增文字不能修改原 CAD 实体；请提供完整参数并明确替换原图几何，DXF 深度修改请使用专用字段")
            source = self._folder(design_id) / ("source" + suffix)
            data = source.read_bytes()
            if sha256(data).hexdigest() != prior.get("source_sha256"):
                raise CADDesignConflict("原图摘要不一致，不能在此图纸上建立新版本")
            raw.update(filename=prior["filename"], content_base64=base64.b64encode(data).decode())
            for field in ("dxf_depth", "dxf_units"):
                if raw.get(field) is None:
                    raw[field] = prior.get(field)
            revised = ImportRequest.model_validate(raw)
        else:
            raw.pop("dxf_depth", None); raw.pop("dxf_units", None)
            revised = DesignRequest.model_validate(raw)
        return self.submit(revised, key, parent_id=design_id)

    def confirm(self, design_id, digest, actor):
        with self.lock:
            value = self._load(design_id)
            if value["status"] not in {"ready", "confirmed"} or value.get("digest") != digest:
                raise CADDesignConflict("只能确认已完成且摘要一致的设计版本")
            for artifact in value["artifacts"]:
                self.artifact(design_id, artifact["artifact_id"])
            return self._change(design_id, status="confirmed", confirmed_by=actor, confirmed_at=utc_now(), message="此设计版本已确认；当前未进行机器下发")

    def artifact(self, design_id, artifact_id):
        value = self.get(design_id)
        record = next((item for item in value["artifacts"] if item["artifact_id"] == artifact_id), None)
        if value["status"] not in {"ready", "confirmed"} or not record:
            raise KeyError("模型文件尚未生成或不存在")
        folder = (self._folder(design_id) / "artifacts").resolve()
        path = (folder / record["filename"]).resolve()
        if path.parent != folder or not path.is_file():
            raise KeyError("模型文件不存在")
        if sha256(path.read_bytes()).hexdigest() != record["sha256"]:
            raise CADDesignConflict("模型文件摘要不一致，不能下载或确认此文件")
        return path, record

    def close(self):
        with self.lock:
            if self.closed:
                return
            self.closed = True
        self.pool.shutdown(wait=True, cancel_futures=False)
