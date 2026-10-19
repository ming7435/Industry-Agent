"""单折弯钣金的严格参数及固定 text-to-cad/SheetMetal 内核。"""
import math


def validate_sheet_metal(value):
    """尺寸为 mm，折弯角为 deg，K 因子固定采用 ANSI 定义。

    base_length、flange_length 是各自的直段长度，不包含圆弧段。
    """
    fields = {'width', 'base_length', 'flange_length', 'thickness',
              'bend_radius', 'bend_angle', 'k_factor'}
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError('单折弯钣金必须明确宽、底边直段、翼边直段、厚度、内弯半径、折弯角及 ANSI K 因子。')
    result = {}
    for key in fields:
        number = value[key]
        if isinstance(number, bool) or not isinstance(number, (int, float)):
            raise ValueError('钣金尺寸、角度与 K 因子必须是有限数值。')
        if abs(number) > 10000 or not math.isfinite(number):
            raise ValueError('钣金参数必须有限，单次尺寸资源上限为 10000 mm。')
        result[key] = float(number)
    if any(result[key] < 0.01 for key in fields - {'bend_angle', 'k_factor'}):
        raise ValueError('当前钣金内核的最小尺寸为 0.01 mm。')
    if not 0 < result['bend_angle'] < 180 or not 0 <= result['k_factor'] <= 1:
        raise ValueError('折弯角必须大于 0 且小于 180 度，ANSI K 因子必须为 0 至 1。')
    if result['thickness'] >= min(result[key] for key in ('width', 'base_length', 'flange_length')):
        raise ValueError('板厚必须小于板宽、底边直段和翼边直段。')
    if result['base_length'] + result['flange_length'] + math.pi * (
            result['bend_radius'] + result['thickness']) > 10000:
        raise ValueError('展开长度超出当前单次建模资源范围。')
    return result


