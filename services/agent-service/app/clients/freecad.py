"""Historical import names; all new execution uses the headless cadgen client."""
from .text_to_cad import TextToCadClient, TextToCadConnectionError

FreeCADClient = TextToCadClient
FreeCADConnectionError = TextToCadConnectionError
