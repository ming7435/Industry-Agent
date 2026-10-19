"""Old imports resolve exclusively to the tested headless client."""
from app.clients.freecad import FreeCADClient, FreeCADConnectionError
from app.clients.text_to_cad import TextToCadClient, TextToCadConnectionError

def test_legacy_client_imports_are_headless_aliases():
    assert FreeCADClient is TextToCadClient
    assert FreeCADConnectionError is TextToCadConnectionError
    assert FreeCADClient.provider == 'text-to-cad'
