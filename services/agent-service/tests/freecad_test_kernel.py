"""Compatibility fixture executing actual cadgen; no simulated FreeCAD geometry."""
from app.clients.text_to_cad import TextToCadClient

class ScriptMCP(TextToCadClient):
    def __init__(self, triangulated_bounds=False):
        super().__init__()
        self.geometry_executions = 0
        self.calls = []
    def call_tool(self, name, arguments, **kwargs):
        self.calls.append((name, arguments))
        result = super().call_tool(name, arguments, **kwargs)
        if not result.get('isError'):
            self.geometry_executions += 1
        return result
