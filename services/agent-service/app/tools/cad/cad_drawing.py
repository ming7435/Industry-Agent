"""工程图的严格参数校验；几何投影由 text-to-cad 内核执行。"""
import math


def validate_drawing(value):
    """校验工程图选项；法向规范化不改变用户指定的剖切平面。"""
    if not isinstance(value, dict) or set(value) != {"projection", "scale", "section"}:
        raise ValueError("工程图需要完整 projection、scale、section，不能包含额外字段。")
    if not isinstance(value["projection"], str) or value["projection"] not in {"first_angle", "third_angle"}:
        raise ValueError("工程图投影仅支持 first_angle 或 third_angle。")

    def number(raw):
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            raise ValueError("工程图比例、原点和法向必须为有限数值。")
        try:
            result = float(raw)
        except (OverflowError, ValueError):
            raise ValueError("工程图参数超出有限数值范围。") from None
        if not math.isfinite(result):
            raise ValueError("工程图比例、原点和法向必须为有限数值。")
        return result

    scale = number(value["scale"])
    if scale <= 0:
        raise ValueError("工程图比例必须大于零。")
    section = value["section"]
    if section is not None:
        if not isinstance(section, dict) or set(section) != {"origin", "normal"}:
            raise ValueError("剖视图需要完整 origin 和 normal。")
        vectors = {}
        for name in ("origin", "normal"):
            raw = section[name]
            if not isinstance(raw, list) or len(raw) != 3:
                raise ValueError("剖切原点和法向必须为三维数值列表。")
            vectors[name] = [number(component) for component in raw]
        if any(abs(component) > 10000 for component in vectors["origin"]):
            raise ValueError("剖切原点超出单次建模 ±10000 mm 资源范围。")
        magnitude = max(abs(component) for component in vectors["normal"])
        if magnitude == 0:
            raise ValueError("剖切平面法向不能为零向量。")
        normalized = [component / magnitude for component in vectors["normal"]]
        length = math.hypot(*normalized)
        section = {"origin": vectors["origin"], "normal": [component / length for component in normalized]}
    return {"projection": value["projection"], "scale": scale, "section": section}


