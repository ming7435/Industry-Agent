"""执行零件功能检测。"""

from typing import Any, Dict


def inspect_part_function(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.inspect_part_function(**arguments)
