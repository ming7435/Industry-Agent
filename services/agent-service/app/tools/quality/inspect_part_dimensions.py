"""执行零件尺寸检测。"""

from typing import Any, Dict


def inspect_part_dimensions(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.inspect_part_dimensions(**arguments)
