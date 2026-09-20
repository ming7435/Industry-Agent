"""执行零件外观检测。"""

from typing import Any, Dict


def inspect_part_appearance(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.inspect_part_appearance(**arguments)
