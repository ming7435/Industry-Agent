from app.api import deps


def test_component_factory_passes_injected_settings_to_optional_constructor():
    class Component:
        def __init__(self, endpoint: str = "default"):
            self.endpoint = endpoint

    value = deps._instantiate(Component, {"endpoint": "http://model-service"}, "component")

    assert value.endpoint == "http://model-service"
