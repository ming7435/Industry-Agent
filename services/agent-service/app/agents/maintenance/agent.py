"""维修方案 Agent。"""

from __future__ import annotations

from typing import Any, Mapping
from uuid import uuid4

from app.validator import CADResult, DiagnosisView, KnowledgeResult, MaintenancePlan


class MaintenanceAgent:
    name = "maintenance"

    def run(self, task: Any) -> MaintenancePlan:
        payload = dict(task or {})
        diagnosis = self._normalize_diagnosis(payload.get("diagnosis") or payload)
        knowledge = payload.get("knowledge") or {}
        cad = payload.get("cad") or {}
        documents = knowledge.get("documents", []) if isinstance(knowledge, Mapping) else []
        components = cad.get("components", []) if isinstance(cad, Mapping) else []
        fault = diagnosis.fault
        if "温度" in fault or "过热" in fault:
            steps = ["执行设备断电和挂牌上锁", "检查冷却液液位、流量和冷却泵", "检查主轴负载与温度传感器接线", "空载运行并复测主轴温度"]
            tools = ["万用表", "红外测温仪", "流量计"]
            parts = ["冷却液", "PT100温度传感器"]
            estimated = "60分钟"
        elif "振动" in fault:
            steps = ["停止设备并确认刀具安全", "检查刀具、夹具和主轴轴承", "复测振动速度RMS", "低速试运行并确认趋势恢复"]
            tools = ["振动测量仪", "扭矩扳手"]
            parts = ["主轴轴承（按检查结果更换）"]
            estimated = "90分钟"
        else:
            steps = ["执行安全隔离", "根据报警定义检查相关部件", "复测异常指标并确认设备恢复"]
            tools = ["万用表", "基础维修工具"]
            parts = []
            estimated = "60分钟"
        return MaintenancePlan(
            plan_id="PLAN-" + uuid4().hex[:10].upper(),
            diagnosis=diagnosis,
            repair_steps=steps,
            tools=tools,
            parts=parts,
            safety=["执行LOTO断电挂牌", "佩戴护目镜和防护手套", "确认主轴完全停止后再接触"],
            estimated_time=estimated,
            source_documents=[item.get("document_id", "") for item in documents],
            cad_components=[item.get("component_id", "") for item in components],
        )

    @staticmethod
    def _normalize_diagnosis(value: Any) -> DiagnosisView:
        """将诊断 Agent 的字典结果归一化为维修计划输入模型。"""
        if isinstance(value, DiagnosisView):
            return value
        payload = dict(value or {})
        return DiagnosisView(
            device_id=str(payload.get("device_id", "unknown")),
            fault=str(payload.get("fault") or payload.get("summary") or payload.get("diagnosis") or "设备异常"),
            cause=str(payload.get("cause") or payload.get("diagnosis") or "需要进一步检查"),
            severity=str(payload.get("severity") or "未知"),
            confidence=payload.get("confidence"),
            evidence=list(payload.get("evidence") or []),
            recommendation=str(payload.get("recommendation") or "按照维修方案执行并复测"),
            raw=payload,
        )
