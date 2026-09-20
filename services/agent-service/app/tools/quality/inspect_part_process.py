"""执行零件生产过程合规检测。"""

from typing import Any, Dict


def inspect_part_process(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.inspect_part_process(**arguments)
