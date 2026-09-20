"""执行零件材质检测。"""

from typing import Any, Dict


def inspect_part_material(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.inspect_part_material(**arguments)
