"""核验最终文字中明确的同单位数值比较，不推测隐含单位或物理根因。"""
from decimal import Decimal
import re

_NUMBER = r'[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?'
# 先完整读取单位，包括不支持的单位；不能把 m/s 截成 m、把分钟丢掉。
_UNIT = r'(?:(?!is\b)[A-Za-zµμ°℃%]+(?:/[A-Za-zµμ0-9²³^]+)*|摄氏度|千帕|兆帕|毫秒|分钟|秒)'
_KNOWN_UNITS = {'mm/s', 'm/s', 'kPa', 'MPa', 'mPa', 'Pa', 'psi', 'bar', 'rpm',
                '°C', '℃', '摄氏度', '千帕', '兆帕', '%', 'A', 'V', 'ms', 's',
                '毫秒', '分钟', '秒'}
_CLAIM = re.compile(
    rf'(?<![\d.,A-Za-z])(?P<left>{_NUMBER})\s*(?P<left_unit>{_UNIT})?\s*'
    r'(?:已经|明显|仍然|已|仍|is\s+)?'
    r'(?P<operator>不低于|不小于|不少于|不高于|不大于|不超过|低于|小于|不足|跌破|高于|大于|超过|等于|below|above|less than|greater than|<=|>=|<|>)\s*'
    r'(?:(?:正常|设定|参考|允许)(?:范围)?)?(?:下限|上限|阈值)?\s*'
    rf'(?P<right>{_NUMBER})(?![\d,]|\.\d)\s*(?P<right_unit>{_UNIT})?', re.I)
_NEGATED = re.compile(r'不能认为|不应认为|不应说|不能说|并非|并不是|不是|误写为|错误地写为')
_DISAVOWED = re.compile(r'^[”"\']?\s*的?(?:说法|判断|结论|表述)?\s*(?:是)?(?:错误|不正确|不成立)')
_ARITHMETIC_PREFIX = re.compile(r'[0-9A-Za-z℃%)）][ \t]*[+\-*/×÷=][ \t]*$')


def numeric_claim_errors(text):
    text = str(text or '').translate(str.maketrans({'−': '-', '﹣': '-', '－': '-'}))
    errors = []
    for match in _CLAIM.finditer(text):
        prefix = re.split(r'[。！？；\n，,]', text[:match.start()])[-1]
        if _NEGATED.search(prefix) or _DISAVOWED.match(text[match.end():]):
            continue
        # 算式的局部操作数不能当成完整断言；这里不承担表达式求值。
        if _ARITHMETIC_PREFIX.search(text[:match.start()]):
            continue
        if text[match.end():].lstrip().startswith(('+', '-', '*', '/', '×', '÷', '=')):
            continue
        left_unit, right_unit = match['left_unit'], match['right_unit']
        if left_unit != right_unit or (left_unit and left_unit not in _KNOWN_UNITS):
            continue  # 不猜测单位换算或省略的单位；mPa 与 MPa 也不能混同。
        left = Decimal(match['left'].replace(',', ''))
        right = Decimal(match['right'].replace(',', ''))
        operator = match['operator'].lower()
        if operator in {'低于','小于','不足','跌破','below','less than','<'}:
            valid = left < right
        elif operator in {'高于','大于','超过','above','greater than','>'}:
            valid = left > right
        elif operator in {'不低于','不小于','不少于','>='}:
            valid = left >= right
        elif operator in {'不高于','不大于','不超过','<='}:
            valid = left <= right
        else:
            valid = left == right
        if not valid:
            errors.append('数值比较与计算不符：'+match.group(0).strip()[:160])
    return list(dict.fromkeys(errors))
