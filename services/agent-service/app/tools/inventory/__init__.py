"""Inventory MCP 兼容工具。"""

from .query_inventory import query_inventory
from .query_part_availability import query_part_availability
from .query_spare_part import query_spare_part
from .query_stock import query_stock

__all__ = ["query_inventory", "query_part_availability", "query_spare_part", "query_stock"]
