"""维修 Agent 与草案工具共用的故障分类，不把正常指标或图纸名称当作故障。"""
from __future__ import annotations

import re
from typing import Any, Mapping


def _generic_fault(text: str) -> bool:
    return not text or text in {"设备异常", "设备故障", "整机故障", "异常", "故障", "待诊断"} or bool(
        re.fullmatch(r"(?:未知|未定义|未识别)(?:报警|故障).*|报警(?:码)?[\s:：#\-]*[A-Za-z0-9_-]+", text)
    )


def repair_profile(diagnosis: Mapping[str, Any]) -> dict[str, Any]:
    raw = diagnosis.get("raw")
    value = {**(raw if isinstance(raw, Mapping) else {}), **diagnosis}
    definition = value.get("alarm_definition")
    definition = definition if isinstance(definition, Mapping) else {}
    fault = str(value.get("fault") or value.get("summary") or value.get("diagnosis") or "").strip()
    # 明确主报警即使尚无专用模板，也不能被其他系统的背景/建议替换。
    primary = str(definition.get("name") or definition.get("description") or fault).strip()
    sources = [primary] if not _generic_fault(primary) else [
        definition.get("description"), fault, value.get("cause")
    ]
    profiles = [
        ("safety_interlock", "安全门与接料器互锁系统", 60,
         ("开门被禁止", "开门禁止", "安全门", "门锁", "互锁", "接料器未下降")),
        ("hydraulic", "液压系统停机核查", 30, ("液压", "Hydraulic pressure", "hydraulic pressure")),
        ("lubrication", "润滑系统", 60, ("润滑", "供油", "油路", "注油")),
        ("thermal", "主轴冷却系统", 60, ("温度", "过热", "过温", "冷却")),
        ("vibration", "主轴传动与轴承系统", 90, ("振动", "轴承")),
    ]
    by_token = {token: (kind, target, minutes) for kind, target, minutes, tokens in profiles for token in tokens}
    token_pattern = re.compile("|".join(re.escape(token) for token in by_token))
    normal_pattern = re.compile(r"(?<!不)(?<!非)正常|无异常|没有异常|未(?:见|发现)?异常|(?:无|未)(?:过热|超温|温升|振动异常)")
    negative_observation = re.compile(r"未(?:发现|见|检测到|观察到)|(?:没有|无).*(?:异常|故障|动作|中断)")
    status_pattern = re.compile(r"正常|异常|过高|偏高|过低|偏低|不足|未达|故障|中断|堵塞|泄漏|失效|超限|超标|超温|过温|过热")
    for source in sources:
        for clause in re.split(r"[。；;，,\n（）()]|并且|且|同时|但是|但|而", str(source or "")):
            matches = list(token_pattern.finditer(clause))
            groups = []
            for index, match in enumerate(matches):
                previous_status = index and status_pattern.search(clause[matches[index - 1].start():match.start()])
                if not groups or by_token[groups[-1].group()][0] != by_token[match.group()][0] or previous_status:
                    groups.append(match)
            for index, match in enumerate(groups):
                # 复合指标共用状态；已经有状态的指标单独判断，避免正常背景抹掉故障。
                start = match.start() if index else 0
                end = groups[index + 1].start() if index + 1 < len(groups) else len(clause)
                segment = clause[start:end]
                if index and match.start() and clause[match.start() - 1] in "无未":
                    segment = clause[match.start() - 1] + segment
                if index:
                    prefix = clause[groups[index - 1].end():match.start()]
                    if re.search(r"(?:未(?:发现|见|检测到|观察到)|没有|无)[^\s]{0,20}\s*$", prefix):
                        segment = prefix + segment
                if normal_pattern.search(segment) or negative_observation.search(segment):
                    continue
                kind, target, minutes = by_token[match.group()]
                return {"kind": kind, "target": target, "estimated_minutes": minutes}
    return {"kind": "general", "target": primary or fault or "异常设备部件", "estimated_minutes": 60}


def interlock_inspection_steps() -> list[str]:
    """仅核查互锁输入输出；具体部件维修必须另行准备工程证据。"""
    return [
        "保持安全互锁有效，不得短接或旁路互锁，不强制开门",
        "由维修人员读取程序、轴、主轴停止状态及接料器位置反馈，与本机配置的互锁条件比较",
        "核对 PLC 门锁、接料器到位及下降指令状态，记录不一致的输入输出，不执行运动指令",
        "在确认安全停机后观察接料器外观及可见障碍，不改动安全回路",
        "记录报警和互锁核查结果；涉及部件维修时，先补齐 CAD/BOM 及相应审批再另行处理",
        "处理后复核原报警及互锁状态，验收使用设备恢复数据，不自动启动机器",
    ]


def hydraulic_inspection_steps() -> list[str]:
    """报警卡片的停机核查范围；故障未确认前不指定任何换件或复机操作。"""
    return [
        "保持设备安全停机，遵守现场隔离要求；不得启动液压泵或执行运动指令",
        "读取原液压报警、压力反馈及报警发生前的压力趋势，与本机配置标准核对；停机后的压力下降不能单独作为新的故障依据",
        "在安全位置观察液压油位和外部可见渗漏，记录异常位置；不接触受压管路",
        "记录压力显示与反馈是否一致，保持现有设定；不得调节压力阀、拆装管路或更换部件",
        "记录核查结果并报告确认的故障点；需要具体部件维修时补齐相应工程依据和维修方案后处理",
        "仅在实际维修完成后申请恢复核验；由系统核对原报警和液压指标，核查完成本身不代表可以复机",
    ]


def hydraulic_inspection_template() -> dict[str, Any]:
    safety = ["保持安全停机并遵守现场 LOTO 隔离要求", "佩戴现场要求的防护用品",
              "禁止带压拆装、试漏或调阀；不得旁路互锁", "恢复运行须经过独立的实时报警和液压指标核验"]
    return {
        "repair_target": "液压系统停机核查", "repair_steps": hydraulic_inspection_steps(),
        "pre_checks": ["核对设备身份和原液压报警，确认整线处于安全停机状态",
                       "确认本机报警检查资料可用，从安全位置进行外观和状态核对"],
        "post_checks": ["记录油位、可见渗漏、报警与压力反馈的实际核查结果",
                        "故障未解决或液压恢复数据不完整时保持停机并补充维修依据"],
        "tools": ["本机压力显示和监控趋势", "现场记录工具"],
        "required_tools": ["本机压力显示和监控趋势", "现场记录工具"],
        "safety": safety, "safety_requirements": list(safety),
        "parts": [], "required_parts": [], "cad_required": False, "cad_components": [],
    }


def hydraulic_inspection_plan_matches(plan: Mapping[str, Any]) -> bool:
    # 精确限定全套步骤，禁令中的“拆装/更换”不代表授权执行这些动作。
    return all(plan.get(key) == value for key, value in hydraulic_inspection_template().items())


def hydraulic_checking_evidence(knowledge: Mapping[str, Any]) -> bool:
    """要求实际来源正文中的液压检查依据，目录标题或无关旧经验不够。"""
    if knowledge.get("synthetic") is True:
        return False
    for item in list(knowledge.get("documents") or []) + list(knowledge.get("evidence") or []):
        if not isinstance(item, Mapping):
            continue
        metadata = item.get("metadata") if isinstance(item.get("metadata"), Mapping) else {}
        if item.get("synthetic") is True or metadata.get("synthetic") is True:
            continue
        source = item.get("document_id") or item.get("id") or item.get("chunk_id") or item.get("source") or metadata.get("source_name")
        content = " ".join(str(item.get(key) or "") for key in ("content", "text", "excerpt", "snippet")).lower()
        # 同一来源正文须涵盖本模板三类核查；跨报警目录中碰巧有“液压”和
        # “油位”不能支撑失压核查，更不能让无关润滑条目代替液压依据。
        coverage = (("油位", "油液位", "oil level"), ("泄漏", "渗漏", "leak"),
                    ("压力", "pressure"))
        if source and ("液压" in content or "hydraulic" in content) and all(
            any(token in content for token in group) for group in coverage):
            return True
    return False


def plan_profile_findings(plan: Mapping[str, Any], diagnosis: Mapping[str, Any] | None = None) -> list[str]:
    """只读发现已保存的固定核查模板与主故障错配，不改变历史方案。"""
    value = diagnosis if isinstance(diagnosis, Mapping) else plan.get("diagnosis")
    if not isinstance(value, Mapping):
        return []
    raw = value.get("raw")
    merged = {**(raw if isinstance(raw, Mapping) else {}), **value}
    definition = merged.get("alarm_definition")
    definition = definition if isinstance(definition, Mapping) else {}
    primary = str(definition.get("name") or definition.get("description") or merged.get("fault")
                  or merged.get("summary") or merged.get("diagnosis") or "").strip()
    if _generic_fault(primary):
        return []
    target = plan.get("repair_target")
    target = target.get("part_name") if isinstance(target, Mapping) else target
    target_part = plan.get("target_part")
    target_part = target_part.get("part_name") if isinstance(target_part, Mapping) else ""
    hydraulic_target = "液压系统停机核查"
    if plan.get("repair_steps") == hydraulic_inspection_steps() or target == hydraulic_target or target_part == hydraulic_target:
        if repair_profile(value)["kind"] != "hydraulic":
            return ["维修方案模板与主故障不匹配：主故障为%s，当前方案却使用液压停机核查模板；请重新生成并校验维修方案" % primary]
        if not hydraulic_inspection_plan_matches(plan):
            return ["液压停机核查范围已改变，请重新生成并校验维修方案"]
        return []
    interlock_target = "安全门与接料器互锁系统"
    fixed_steps = plan.get("repair_steps") == interlock_inspection_steps()
    if not fixed_steps and target != interlock_target and target_part != interlock_target:
        return []
    if repair_profile(value)["kind"] == "safety_interlock":
        return []
    return ["维修方案模板与主故障不匹配：主故障为%s，当前方案却使用安全门/接料器互锁核查模板；请重新生成并校验维修方案" % primary]


def part_matches_profile(profile: Mapping[str, Any], item: Mapping[str, Any]) -> bool:
    text = " ".join(str(item.get(key) or "") for key in ("part_id", "part_no", "component_id", "name")).upper()
    terms = {
        "safety_interlock": ("DOOR", "INTERLOCK", "CATCHER", "安全门", "门锁", "互锁", "接料器"),
        "hydraulic": ("HYDRAULIC", "液压"),
        "lubrication": ("LUB", "润滑", "供油", "注油", "油路"),
        "thermal": ("TEMP", "温度", "PT100", "COOLANT", "COOLING", "冷却", "散热"),
        "vibration": ("BEARING", "轴承", "VIB", "振动"),
    }.get(profile.get("kind"))
    return terms is None or any(token in text for token in terms)
