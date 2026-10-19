"""Trusted text-to-cad document editing and immutable publication."""


def documents_enabled():
    import os
    return os.getenv('CAD_DOCUMENTS_ENABLED', os.getenv('FREECAD_DOCUMENTS_ENABLED', '')).lower() == 'true'
