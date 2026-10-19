"""Real subprocess boundary used by CAD document tests; no fake geometry kernel."""
from app.clients.text_to_cad import TextToCadClient


class DocumentRuntime(TextToCadClient):
    def __init__(self):
        super().__init__(timeout=240)
