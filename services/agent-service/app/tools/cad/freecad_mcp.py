"""Compatibility imports; all modeling uses text-to-cad."""
from . import text_to_cad as _implementation
from .text_to_cad import *

FreeCADModelError = _implementation.TextToCadModelError
freecad_tool_scope = _implementation.text_to_cad_tool_scope
freecad_mcp = _implementation.text_to_cad

def __getattr__(name):
    return getattr(_implementation, name)
