"""受限零件加工区的虚拟车削程序；不写文件、不执行代码、不控制机床。

X 为直径坐标，Z=0 为零件前端，切削向负 Z。每次外圆走刀沿已
加工表面返回前端后退刀，钻孔沿已去除孔退刀。仅验证理想几何加工区，
不包含刀尖/刀杆/卡盘碰撞、切断、取件、工业质量或真实 TRAK 方言验收。
10000 mm、4000 点、七天时长是计算资源限制，不是设备安全阈值。
"""

from __future__ import annotations

from collections.abc import Mapping
from copy import deepcopy
from math import ceil, hypot, isfinite, pi
from numbers import Real

from .schemas import ModelSpec


_DEVICE = "TRAK-TC820LTYSI-001"
_POSTPROCESSOR = "virtual-trak-turning-v1"
_PRECISION_MM = 1e-6
_RAPID_MM_PER_MIN = 1000.0
_MAX_POINTS = 4000
_MAX_SECONDS = 7 * 24 * 3600
_REQUIRED_SETUP = {
    "stock_diameter_mm", "stock_length_mm", "grip_length_mm", "clearance_mm",
    "pass_depth_mm", "spindle_rpm", "feed_mm_per_rev", "tolerance_mm", "tool_id",
    "device_id", "postprocessor",
}


def _number(value, name, *, maximum=10000.0, positive=True):
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} 必须为有限数值")
    value = float(value)
    if not isfinite(value) or abs(value) > maximum or (positive and value <= 0):
        raise ValueError(f"{name} 超出虚拟计算允许范围")
    return value


def _tool(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 99:
        raise ValueError(f"{name} 必须为 1 到 99 的整数刀具号")
    return value


def _close(actual, expected, *, absolute=_PRECISION_MM):
    return abs(actual - expected) <= absolute + abs(expected) * 1e-8


def _profile(design):
    if design.get("status") != "confirmed":
        raise ValueError("加工程序要求已确认的设计版本")
    for name in ("design_id", "digest"):
        if not isinstance(design.get(name), str) or not design[name].strip():
            raise ValueError("设计身份和摘要不能为空")
    if not isinstance(design.get("resolved_spec"), Mapping):
        raise ValueError("当前加工器要求已确认的参数化实体，不能推测导入文件特征")
    spec = ModelSpec.model_validate(design["resolved_spec"])
    operations = spec.model_dump(mode="json")["operations"]
    factor = {"mm": 1.0, "cm": 10.0, "inch": 25.4}[spec.units]
    if len(operations) not in (1, 2):
        raise ValueError("仅支持单圆柱和同长同心通孔，其他特征不能省略")
    outer = operations[0]
    if outer["type"] != "cylinder" or outer["axis"] != "z" or outer["mode"] != "add":
        raise ValueError("仅支持 Z 轴圆柱车削")
    if outer["position"][:2] != [0, 0]:
        raise ValueError("当前加工器不能加工偏心或偏移轴线")
    diameter = _number(outer["diameter"] * factor, "零件外径")
    length = _number(outer["length"] * factor, "零件长度")
    z_origin = _number(outer["position"][2] * factor, "实体 Z 位置", positive=False)
    inner_diameter = 0.0
    if len(operations) == 2:
        hole = operations[1]
        if (hole["type"] != "cylinder" or hole["axis"] != "z" or hole["mode"] != "cut"
                or hole["position"] != outer["position"] or hole["length"] != outer["length"]):
            raise ValueError("第二个特征必须为同轴、同起点、同长度的圆柱通孔")
        inner_diameter = _number(hole["diameter"] * factor, "通孔直径")
        if inner_diameter >= diameter:
            raise ValueError("通孔必须小于外径并保留实体")
    geometry = design.get("geometry")
    if (not isinstance(geometry, Mapping) or geometry.get("valid") is not True
            or geometry.get("solid_count") != 1 or geometry.get("step_roundtrip_valid") is not True
            or geometry.get("units") != "mm"):
        raise ValueError("必须提供通过实体及 STEP 往返校验的单一毫米实体")
    bounds, center = geometry.get("bounds_mm"), geometry.get("center_mm")
    if not isinstance(bounds, (list, tuple)) or len(bounds) != 3:
        raise ValueError("实体边界尺寸缺失")
    if not isinstance(center, (list, tuple)) or len(center) != 3:
        raise ValueError("实体中心缺失")
    for actual, expected in zip(bounds, (diameter, diameter, length)):
        if not _close(_number(actual, "实体边界"), expected):
            raise ValueError("实体边界与已确认圆柱特征不一致")
    for actual, expected in zip(center, (0.0, 0.0, z_origin + length / 2)):
        if not _close(_number(actual, "实体中心", positive=False), expected):
            raise ValueError("实体中心与已确认同轴特征不一致")
    expected_volume = _number(geometry.get("volume_mm3"), "实体体积", maximum=1e12)
    analytic_volume = pi * (diameter ** 2 - inner_diameter ** 2) * length / 4
    if not _close(expected_volume, analytic_volume):
        raise ValueError("实际 CAD 实体体积与已确认特征不一致")
    exact_profile = {"outer_diameter_mm": diameter, "inner_diameter_mm": inner_diameter,
                     "length_mm": length}
    profile = {name: round(value, 6) for name, value in exact_profile.items()}
    if (profile["outer_diameter_mm"] <= 0 or profile["length_mm"] <= 0
            or (inner_diameter and profile["inner_diameter_mm"] <= 0)
            or profile["inner_diameter_mm"] >= profile["outer_diameter_mm"]):
        raise ValueError("确认特征不能在虚拟 NC 坐标精度下消失或合并")
    return profile, expected_volume, exact_profile


def _setup(setup, profile):
    missing = _REQUIRED_SETUP - setup.keys()
    unexpected = setup.keys() - _REQUIRED_SETUP - {"drill_tool_id", "drill_diameter_mm"}
    if missing or unexpected:
        raise ValueError("工艺参数必须完整且不含未支持字段")
    if setup["device_id"] != _DEVICE or setup["postprocessor"] != _POSTPROCESSOR:
        raise ValueError("仅支持指定虚拟设备和固定虚拟后处理器")
    numeric = {name: _number(setup[name], name) for name in (
        "stock_diameter_mm", "stock_length_mm", "grip_length_mm", "clearance_mm", "pass_depth_mm")}
    for name, maximum in (("spindle_rpm", 100000.0), ("feed_mm_per_rev", 1000.0), ("tolerance_mm", 1000.0)):
        numeric[name] = _number(setup[name], name, maximum=maximum)
    # F/S 被直接传给固定六位小数 NC，不能以四舍五入改变进给或转速。
    for name in ("spindle_rpm", "feed_mm_per_rev"):
        if round(numeric[name], 6) <= 0 or abs(round(numeric[name], 6) - numeric[name]) > 1e-12:
            raise ValueError("转速及每转进给超出虚拟 NC 六位小数精度")
    numeric["tool_id"] = _tool(setup["tool_id"], "外圆刀具")
    if numeric["stock_diameter_mm"] < profile["outer_diameter_mm"]:
        raise ValueError("毛坯直径小于零件外径")
    if numeric["stock_length_mm"] < profile["length_mm"] + numeric["grip_length_mm"]:
        raise ValueError("毛坯长度必须覆盖零件长度和独立夹持长度")
    if profile["inner_diameter_mm"]:
        numeric["drill_tool_id"] = _tool(setup.get("drill_tool_id"), "通孔钻具")
        if numeric["drill_tool_id"] == numeric["tool_id"]:
            raise ValueError("通孔钻具必须与外圆刀具分别指定")
        numeric["drill_diameter_mm"] = _number(setup.get("drill_diameter_mm"), "明确钻头直径")
        if not _close(numeric["drill_diameter_mm"], profile["inner_diameter_mm"]):
            raise ValueError("钻头直径必须匹配已确认通孔，不能以用户公差替代")
    elif setup.get("drill_tool_id") is not None or setup.get("drill_diameter_mm") is not None:
        raise ValueError("实心圆柱不能加入未确认的钻孔工艺")
    if round(numeric["clearance_mm"], 6) <= 0:
        raise ValueError("退刀距离超出虚拟坐标精度")
    return numeric


def _point(motion, operation, x, z, tool):
    x, z = round(x, 6), round(z, 6)
    if not isfinite(x) or not isfinite(z) or abs(x) > 10000 or abs(z) > 10000:
        raise ValueError("刀路坐标超出虚拟计算范围")
    return {"motion": motion, "operation": operation, "x_mm": x, "z_mm": z, "tool_id": tool}


def _toolpath(profile, setup):
    outer, length, inner = (profile[name] for name in ("outer_diameter_mm", "length_mm", "inner_diameter_mm"))
    stock, clearance, depth = (setup[name] for name in ("stock_diameter_mm", "clearance_mm", "pass_depth_mm"))
    maximum_passes = (_MAX_POINTS - 1 - (5 if inner else 0)) // 6
    radial_stock = (stock - outer) / 2
    if radial_stock / depth > maximum_passes:
        raise ValueError("径向切深产生过多走刀，超出 4000 点计算限制")
    passes = max(1, ceil(radial_stock / depth))
    safe_x = stock + 2 * clearance
    points = [_point("rapid", "turn", safe_x, clearance, setup["tool_id"])]
    for index in range(1, passes + 1):
        x = max(outer, stock - 2 * depth * index)
        for motion, z, diameter in (("rapid", clearance, x), ("rapid", 0, x),
                                   ("cut", -length, x), ("cut", 0, x),
                                   ("rapid", clearance, x), ("rapid", clearance, safe_x)):
            points.append(_point(motion, "turn", diameter, z, setup["tool_id"]))
    if inner:
        for motion, z, diameter in (("rapid", clearance, 0), ("rapid", 0, 0),
                                   ("cut", -length, 0), ("rapid", clearance, 0),
                                   ("rapid", clearance, safe_x)):
            points.append(_point(motion, "drill", diameter, z, setup["drill_tool_id"]))
    return points


def _simulate(points, profile, setup, expected_volume):
    """从实际切削段推导终态尺寸，不直接把设计尺寸写成仿真结果。"""
    outer = setup["stock_diameter_mm"]
    inner, machined_length, drilled_length, duration = 0.0, 0.0, 0.0, 0.0
    previous = points[0]
    max_depth = 0.0
    for point in points[1:]:
        dx, dz = point["x_mm"] - previous["x_mm"], point["z_mm"] - previous["z_mm"]
        distance = hypot(dx / 2, dz)
        speed = setup["spindle_rpm"] * setup["feed_mm_per_rev"] if point["motion"] == "cut" else _RAPID_MM_PER_MIN
        duration += distance / speed * 60
        if point["motion"] == "rapid":
            if dx and min(point["z_mm"], previous["z_mm"]) <= 0:
                raise ValueError("径向快移必须位于零件前方退刀平面")
            if point["z_mm"] < 0 or previous["z_mm"] < 0:
                if not (point["operation"] == "drill" and inner > 0 and dx == 0 and dz > 0
                        and point["x_mm"] == 0):
                    raise ValueError("快移不能穿过尚未切除的毛坯")
        elif point["operation"] == "turn":
            if dx or point["tool_id"] != setup["tool_id"]:
                raise ValueError("外圆切削必须用明确刀具沿 Z 轴进行")
            if dz < 0:
                if previous["z_mm"] != 0:
                    raise ValueError("外圆切削必须从前端开始")
                depth = (outer - point["x_mm"]) / 2
                if depth < -_PRECISION_MM or depth > setup["pass_depth_mm"] + _PRECISION_MM:
                    raise ValueError("实际刀路径向切深超出工艺参数")
                outer = point["x_mm"]
                machined_length = -point["z_mm"]
                max_depth = max(max_depth, depth)
            elif previous["z_mm"] != -machined_length or point["z_mm"] != 0:
                raise ValueError("外圆退刀必须沿已加工表面返回前端")
        elif point["operation"] == "drill":
            if (dx or point["x_mm"] != 0 or previous["z_mm"] != 0 or dz >= 0
                    or point["tool_id"] != setup["drill_tool_id"]):
                raise ValueError("通孔必须沿中心轴从前端切削")
            inner = setup["drill_diameter_mm"]
            drilled_length = -point["z_mm"]
        else:
            raise ValueError("刀路包含未支持的切削操作")
        if point["z_mm"] < -(setup["stock_length_mm"] - setup["grip_length_mm"]) - _PRECISION_MM:
            raise ValueError("刀路进入毛坯夹持区")
        previous = point
    if not (0 < duration <= _MAX_SECONDS and isfinite(duration)):
        raise ValueError("仿真耗时超出七天计算限制")
    simulated_volume = pi * (outer ** 2 - inner ** 2) * machined_length / 4
    geometry_matches = _close(simulated_volume, expected_volume)
    dimensions_match = (_close(outer, profile["outer_diameter_mm"])
                        and _close(inner, profile["inner_diameter_mm"])
                        and _close(machined_length, profile["length_mm"])
                        and (not inner or _close(drilled_length, machined_length)))
    if not geometry_matches or not dimensions_match:
        raise ValueError("实际刀路终态与真实 CAD 实体尺寸或体积不一致")
    # 用户公差只应用于虚拟尺寸，不能放宽上述实体一致性校验。
    tolerance_matches = (abs(outer - profile["outer_diameter_mm"]) <= setup["tolerance_mm"]
                         and abs(inner - profile["inner_diameter_mm"]) <= setup["tolerance_mm"]
                         and abs(machined_length - profile["length_mm"]) <= setup["tolerance_mm"])
    if not tolerance_matches:
        raise ValueError("虚拟最终尺寸超过输入公差")
    return {"passed": True, "duration_seconds": round(duration, 6),
            "expected_volume_mm3": expected_volume, "simulated_volume_mm3": simulated_volume,
            "scope": "machining-zone", "rapid_mm_per_min": _RAPID_MM_PER_MIN,
            "coordinate_precision_mm": _PRECISION_MM, "max_radial_pass_depth_mm": max_depth,
            "checks": {"geometry_volume_matches": geometry_matches, "geometry_bounds_match": dimensions_match,
                       "finite_coordinates": True, "bounded_point_count": len(points) <= _MAX_POINTS,
                       "pass_depth_within_setup": True, "grip_outside_cutting_zone": True,
                       "retract_in_removed_material_or_front_clearance": True,
                       "virtual_dimensions_within_input_tolerance": tolerance_matches}}


def _decimal(value):
    text = f"{value:.6f}".rstrip("0").rstrip(".")
    return "0" if text in {"", "-0"} else text


def _nc(points, setup):
    lines = ["(VIRTUAL ONLY - NOT FOR REAL MACHINE)", "G21", "G90", "G95"]
    active_tool = None
    for point in points:
        if point["tool_id"] != active_tool:
            active_tool = point["tool_id"]
            lines.extend((f"T{active_tool:02d}", "M3 S" + _decimal(setup["spindle_rpm"])))
        line = f"G{1 if point['motion'] == 'cut' else 0} X{_decimal(point['x_mm'])} Z{_decimal(point['z_mm'])}"
        if point["motion"] == "cut":
            line += " F" + _decimal(setup["feed_mm_per_rev"])
        lines.append(line)
    lines.extend(("M5", "M30"))
    return "\n".join(lines) + "\n"


def build_turning_program(design: Mapping, setup: Mapping) -> dict:
    """生成确定性、仅供模拟器使用的加工包；不负责持久化或人工放行。"""
    if not isinstance(design, Mapping) or not isinstance(setup, Mapping):
        raise ValueError("设计与工艺参数必须为数据对象")
    profile, expected_volume, exact_profile = _profile(design)
    numeric_setup = _setup(setup, exact_profile)
    if any(abs(profile[name] - exact_profile[name]) > numeric_setup["tolerance_mm"] for name in profile):
        raise ValueError("NC 坐标舍入超过已确认尺寸的输入公差")
    points = _toolpath(profile, numeric_setup)
    simulation = _simulate(points, profile, numeric_setup, expected_volume)
    return {"schema_version": "virtual-turning-v1", "simulation_only": True,
            "postprocessor": _POSTPROCESSOR, "device_id": _DEVICE,
            "design_id": design["design_id"], "design_digest": design["digest"],
            "material": design.get("material", ""), "setup": deepcopy(dict(setup)),
            "profile": profile, "toolpath": points, "simulation": simulation,
            "nc_program": _nc(points, numeric_setup)}
