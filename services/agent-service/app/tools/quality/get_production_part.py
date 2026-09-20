"""获取已生产零件及其生产追溯信息。"""

from typing import Any, Dict


def get_production_part(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.get_production_part(**arguments)
