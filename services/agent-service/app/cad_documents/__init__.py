"""Trusted FreeCAD document editing and immutable publication."""


def documents_enabled():
    import os
    return os.getenv('FREECAD_DOCUMENTS_ENABLED', '').lower() == 'true'
