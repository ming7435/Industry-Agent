"""获取零件质量规格和检验标准。"""

from typing import Any, Dict


def get_part_specification(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.get_part_specification(**arguments)
